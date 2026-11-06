// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";

/**
 * value.js COHESION §0hz.paper — the /paper figures flashed on scroll.
 *
 * Two mechanisms, one symptom (a figure on screen painted blank for a few
 * frames, then popped in):
 *   1. Every scroll step that moved the virtual window re-rendered every
 *      mounted section (its `PaperSection` slot read the `v-for` variable, so
 *      Vue compiled it DYNAMIC), and latex-paper's inline-arrow `#figure`
 *      outlet remounted each figure's `<img>` on every such render. Measured on
 *      prod: ~200 on-screen `<img>` replacements per scroll pass.
 *   2. A section scrolled back into the window mounts a fresh `<img>`; with
 *      `loading="lazy"` and `decoding="async"` it is allowed to paint blank
 *      until the lazy observer fires and the async decode lands.
 *
 * The falsifier samples every animation frame during a wheel scroll down and
 * back up: (a) an `<img>` for a figure that was on screen in the previous
 * frame is a different element now (an on-screen remount); (b) an on-screen
 * figure is not paint-ready (not complete, no natural size, or an async decode
 * not yet resolved). Both must be zero on the way back up, over figures the
 * first descent already loaded.
 */

const SAMPLER = () => {
    const S = { pass: 0, inViewRemounts: [0, 0, 0], notReady: [0, 0, 0], seen: new Set<string>() };
    (window as unknown as { __flash: typeof S }).__flash = S;
    const decoded = new WeakSet<HTMLImageElement>();
    const tracked = new WeakSet<HTMLImageElement>();
    const sel = "img.paper-figure, img.paper-portrait";
    const key = (img: HTMLImageElement) => (img.getAttribute("src") ?? "").split("/").pop() ?? "";
    const track = (img: HTMLImageElement) => {
        if (tracked.has(img)) return;
        tracked.add(img);
        const done = () =>
            img.decode().then(
                () => decoded.add(img),
                () => {},
            );
        if (img.complete) void done();
        else img.addEventListener("load", () => void done(), { once: true });
    };
    let prev = new Map<string, HTMLImageElement>();
    const tick = () => {
        const now = new Map<string, HTMLImageElement>();
        for (const img of document.querySelectorAll<HTMLImageElement>(sel)) {
            track(img);
            const r = img.getBoundingClientRect();
            if (r.height <= 0 || r.bottom <= 0 || r.top >= innerHeight) continue;
            const k = key(img);
            S.seen.add(k);
            const was = prev.get(k);
            if (was && was !== img) S.inViewRemounts[S.pass]++;
            now.set(k, img);
            const ready =
                img.complete && img.naturalWidth > 0 && (img.decoding === "sync" || decoded.has(img));
            if (!ready) S.notReady[S.pass]++;
        }
        prev = now;
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

type Flash = { inViewRemounts: number[]; notReady: number[]; seen: number };

async function readFlash(page: Page): Promise<Flash> {
    return page.evaluate(() => {
        const S = (window as unknown as { __flash: { inViewRemounts: number[]; notReady: number[]; seen: Set<string> } })
            .__flash;
        return { inViewRemounts: [...S.inViewRemounts], notReady: [...S.notReady], seen: S.seen.size };
    });
}

/** Wheel the paper in 160px steps until `done` or the scroller stops moving. */
async function wheel(page: Page, dir: 1 | -1, done: () => Promise<boolean>): Promise<void> {
    const top = () => page.locator(".paper-scroll").evaluate((el) => el.scrollTop);
    let last = await top();
    for (let i = 0; i < 1500; i++) {
        await page.mouse.wheel(0, dir * 160);
        await page.waitForTimeout(24);
        if (i % 10 !== 9) continue;
        const now = await top();
        if ((await done()) || now === last) break;
        last = now;
    }
    await page.waitForTimeout(400);
}

for (const vp of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
] as const) {
    test.describe(`paper figures @${vp.width}`, () => {
        test.use({ viewport: vp });

        test(`no figure flashes on a re-scroll ${vp.width}`, async ({ page }) => {
            test.setTimeout(180_000);
            await page.addInitScript(SAMPLER);
            await page.goto("/paper");
            const scroller = page.locator(".paper-scroll");
            await expect(page.locator(".paper-window-section").first()).toBeVisible({ timeout: 60_000 });
            const box = await scroller.boundingBox();
            if (!box) throw new Error("no .paper-scroll box");
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

            // Descend until eight figures have been on screen (they load on the
            // way down), then come back to the top over them.
            await page.evaluate(() => ((window as unknown as { __flash: { pass: number } }).__flash.pass = 1));
            await wheel(page, 1, async () => (await readFlash(page)).seen >= 8);
            await page.evaluate(() => ((window as unknown as { __flash: { pass: number } }).__flash.pass = 2));
            await wheel(page, -1, async () => (await scroller.evaluate((el) => el.scrollTop)) <= 0);

            const f = await readFlash(page);
            expect(f.seen, "the descent reached eight figures").toBeGreaterThanOrEqual(8);
            expect(f.inViewRemounts, "FIGURE-FLASH on-screen <img> remounts [rest, descent, ascent]").toEqual([0, 0, 0]);
            expect(f.notReady[2], "FIGURE-FLASH not-paint-ready figure frames on the ascent").toBe(0);
        });
    });
}
