import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * X·OD19 P3-fourier-shell-motion-loading — owner rows OD19-F5, OD19-F6 and
 * OD19-ALL (2026-10-19).
 *
 * F5 "Square border visible in the controls panel; route-to-route navigation
 * should animate smoothly and subtly." BEFORE: the flush layer stack's first
 * `.configurator-layer` had r=4px inside a 16px aside card (the stack zeroed
 * its inset while the shell still published `--radius-inset: 1.25rem`), and a
 * route push swapped `<main>` in one frame with no transition.
 *
 * F6 "Dark-mode toggle slightly bigger." BEFORE: the 24px glyph box drew the
 * sun's ink at ~20px and the moon's at ~17px (a padded 200x200 viewBox).
 *
 * ALL "Loading times improved on every page; route transitions smooth." BEFORE:
 * text loaders ("Loading the visualization…", "Computing…"), and a cold
 * /equation compute (1.7–2.5 s TTFB) that nothing prefetched on nav intent.
 */
const CELLS = [
    { scheme: "light", width: 1440, height: 900 },
    { scheme: "dark", width: 1440, height: 900 },
    { scheme: "light", width: 390, height: 844 },
    { scheme: "dark", width: 390, height: 844 },
] as const;

const LOADER_TEXT = /Loading the|Computing…/;

/** One View Transition the page opened, as the browser reports it. */
type VTRecord = {
    types: string[];
    /** `ready` resolved (true) or rejected: the transition was skipped (false). */
    ready: boolean | null;
    finished: boolean;
    /** The `::view-transition-new(root)` animations at `ready`. */
    newRoot: { name: string; duration: number; from: string | null }[];
};

/**
 * Record every View Transition the page opens (an init script). The route
 * window's crossfade runs on the compositor; `requestAnimationFrame` runs on the
 * main thread, which the incoming route's mount can hold for the whole fade. On
 * CI's software-rendered runner the rAF sampler sees 0–4 frames of a fade the
 * compositor plays in full (39348303989: vtFrames 1, minOpacity 0). The
 * falsifier therefore reads the transition itself: glass opened it typed
 * `route`, it was not skipped, `::view-transition-new(root)` fades in from
 * opacity 0 over at least six 60 Hz frames, and it finished. The sampled frame
 * count stays in the record as evidence; a single sampled frame is a lawful
 * reading of a fade that ran, and is never inflated.
 */
function recordViewTransitions() {
    const w = window as unknown as { __od19VTs: VTRecord[] };
    w.__od19VTs = [];
    const start = Document.prototype.startViewTransition;
    if (typeof start !== "function") return;
    Document.prototype.startViewTransition = function (this: Document, arg?: unknown) {
        const vt = start.call(this, arg as never) as ViewTransition;
        const rec: VTRecord = {
            types: [...(((arg as { types?: Iterable<string> } | undefined)?.types) ?? [])],
            ready: null,
            finished: false,
            newRoot: [],
        };
        w.__od19VTs.push(rec);
        vt.ready.then(
            () => {
                rec.ready = true;
                rec.newRoot = document
                    .getAnimations()
                    .filter((a) => (a.effect as KeyframeEffect | null)?.pseudoElement === "::view-transition-new(root)")
                    .map((a) => {
                        const effect = a.effect as KeyframeEffect;
                        const first = effect.getKeyframes()[0] as { opacity?: string } | undefined;
                        return {
                            name: (a as CSSAnimation).animationName ?? "",
                            duration: Number(effect.getComputedTiming().duration),
                            from: first?.opacity ?? null,
                        };
                    });
            },
            () => {
                rec.ready = false;
            },
        );
        vt.finished.then(
            () => (rec.finished = true),
            () => (rec.finished = true),
        );
        return vt;
    };
}

/** Six frames at 60 Hz: the shortest fade a reader sees as motion. */
const SIX_FRAMES_MS = (6 * 1000) / 60;

/** Push a route through the app's router and trace each frame for `ms`. */
async function pushAndTrace(page: Page, to: string, ms = 900) {
    const trace = page.evaluate(
        ([ms, loaderSrc]) =>
            new Promise<{ frames: number; vtFrames: number; minOpacity: number; loaderFrames: number; dockMoves: number }>((res) => {
                const loader = new RegExp(loaderSrc);
                const t0 = performance.now();
                let frames = 0, vtFrames = 0, loaderFrames = 0, dockMoves = 0, minOpacity = 1;
                let dock0: string | null = null;
                const f = () => {
                    frames++;
                    // The route window's opacity is the VT's new-root image (the DOM
                    // element itself stays at 1 while the snapshot crossfades).
                    const a = document
                        .getAnimations()
                        .find((x) => (x.effect as KeyframeEffect | null)?.pseudoElement === "::view-transition-new(root)" && x.playState === "running");
                    let op = 1;
                    if (a) {
                        const cs = parseFloat(getComputedStyle(document.documentElement, "::view-transition-new(root)").opacity);
                        const p = a.effect!.getComputedTiming().progress ?? 1;
                        op = Number.isFinite(cs) && cs < 1 ? cs : p;
                    }
                    if (op < 1) vtFrames++;
                    minOpacity = Math.min(minOpacity, op);
                    if (loader.test(document.querySelector("main")?.innerText ?? "")) loaderFrames++;
                    // Neighbour geometry: the dock row above `<main>` never shifts
                    // while the route swaps (its block position and height; its
                    // width follows the section label it names, by design).
                    const d = document.querySelector(".app-dock")?.getBoundingClientRect();
                    const key = d ? `${Math.round(d.y)},${Math.round(d.height)}` : "none";
                    if (dock0 === null) dock0 = key;
                    else if (key !== dock0) dockMoves++;
                    if (performance.now() - t0 < ms) requestAnimationFrame(f);
                    else res({ frames, vtFrames, minOpacity, loaderFrames, dockMoves });
                };
                requestAnimationFrame(f);
            }),
        [ms, LOADER_TEXT.source] as const,
    );
    const before = await page.evaluate(() => (window as unknown as { __od19VTs?: VTRecord[] }).__od19VTs?.length ?? 0);
    await page.evaluate((to) => {
        const app = (document.querySelector("#app") as unknown as { __vue_app__: { config: { globalProperties: { $router: { push(p: string): Promise<unknown> } } } } }).__vue_app__;
        void app.config.globalProperties.$router.push(to);
    }, to);
    const sampled = await trace;
    // The push's transitions, once each has settled (finished, or skipped).
    const vts = await page
        .waitForFunction(
            (before) => {
                const all = (window as unknown as { __od19VTs?: VTRecord[] }).__od19VTs ?? [];
                const mine = all.slice(before);
                return mine.every((r) => r.finished || r.ready === false) ? mine : null;
            },
            before,
            { timeout: 10_000 },
        )
        .then((h) => h.jsonValue() as Promise<VTRecord[]>);
    return { ...sampled, vts };
}

for (const cell of CELLS) {
    test.describe(`OD19 P3 ${cell.scheme} ${cell.width}`, () => {
        test.use({ viewport: { width: cell.width, height: cell.height }, colorScheme: cell.scheme });

        test("F5 · the flush layer stack's first layer is concentric with the aside (r ≥ 14px)", async ({ page }) => {
            const viz = seededViz();
            for (const [route, stack] of [
                [`/v/${viz.slug}`, ".viz-panel-left"],
                ["/equation", ".eq-panel-left-wrap"],
            ] as const) {
                await page.goto(route);
                if (cell.width < 1024) {
                    const tab = page.getByText("Controls", { exact: true });
                    if (await tab.count()) await tab.first().click();
                }
                const layer = page.locator(`${stack} .configurator-layer`).first();
                await expect(layer).toBeVisible({ timeout: 30_000 });
                const r = await layer.evaluate((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius));
                expect(r, `${route} first layer border-top-left-radius`).toBeGreaterThanOrEqual(14);
            }
        });

        test("F5 · ALL — every route push crossfades (≥ 6 frames), the dock holds still, no text loader", async ({ page }) => {
            test.setTimeout(120_000);
            const viz = seededViz();
            await page.addInitScript(recordViewTransitions);
            await page.goto("/gallery");
            await expect(page.locator(".app-dock")).toBeVisible({ timeout: 30_000 });
            await page.waitForTimeout(800);
            for (const to of ["/paper", `/v/${viz.slug}`, "/gallery", "/equation", "/morph"]) {
                const t = await pushAndTrace(page, to);
                // One route transition per push (UIA-F-246), not skipped, finished.
                const route = t.vts.filter((v) => v.types.includes("route"));
                expect(route.length, `${to}: one route view transition ${JSON.stringify(t)}`).toBe(1);
                expect(route[0].ready, `${to}: the transition was not skipped ${JSON.stringify(t)}`).toBe(true);
                expect(route[0].finished, `${to}: the transition finished ${JSON.stringify(t)}`).toBe(true);
                // The route window crossfades: its new image fades in from 0 over
                // ≥ 6 frames of the compositor's clock (see recordViewTransitions).
                const fade = route[0].newRoot.filter((a) => a.from !== null && Number(a.from) === 0);
                expect(fade.length, `${to}: the new route window fades in from opacity 0 ${JSON.stringify(t)}`).toBeGreaterThan(0);
                expect(Math.max(...fade.map((a) => a.duration)), `${to}: the crossfade spans ≥ 6 frames ${JSON.stringify(t)}`).toBeGreaterThanOrEqual(SIX_FRAMES_MS);
                expect(t.dockMoves, `${to}: dock frames that moved ${JSON.stringify(t)}`).toBe(0);
                expect(t.loaderFrames, `${to}: text-loader frames ${JSON.stringify(t)}`).toBe(0);
                await page.waitForTimeout(500);
            }
        });

        test("F6 · the toggle's ink fills its 24px glyph box (≥ 22px)", async ({ page }) => {
            await page.goto("/gallery");
            const svg = page.locator(".app-dock .sun-moon-toggle svg");
            await expect(svg).toBeVisible({ timeout: 30_000 });
            await page.waitForTimeout(400);
            const ink = await svg.evaluate((s) => {
                const p = s.querySelector("path")!;
                const b = p.getBoundingClientRect();
                const box = s.getBoundingClientRect();
                const scale = box.width / (s as SVGSVGElement).viewBox.baseVal.width;
                const stroke = parseFloat(p.getAttribute("stroke-width") ?? "0") * scale;
                return { w: b.width + stroke, h: b.height + stroke, box: box.width, dark: document.documentElement.classList.contains("dark") };
            });
            expect(ink.dark, "the theme under test").toBe(cell.scheme === "dark");
            expect(ink.box, "the glyph box").toBe(24);
            expect(Math.max(ink.w, ink.h), `ink ${JSON.stringify(ink)}`).toBeGreaterThanOrEqual(22);
        });
    });
}

test.describe("OD19 P3 · loading states are glass Skeletons in the stage's shape", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("/v cold load: the stage is a busy Skeleton, no text", async ({ page }) => {
        const viz = seededViz();
        await page.route(`**/api/visualizations/${viz.slug}`, async (route) => {
            await new Promise((r) => setTimeout(r, 2000));
            await route.fallback();
        });
        await page.goto(`/v/${viz.slug}`);
        const stage = page.locator(".configurator-stage [aria-busy=true]");
        await expect(stage).toBeVisible({ timeout: 20_000 });
        await expect(stage.locator(".skeleton")).toBeVisible();
        // OD19-V6/glass 10.1.1: the skeleton shimmers (glass's own sheen, O-102b(3)).
        expect(await stage.locator(".skeleton:not([data-shimmer])").count()).toBe(0);
        await expect(page.locator("main")).not.toContainText(LOADER_TEXT);
    });

    test("/equation cold compute: the stage is a busy Skeleton, no text", async ({ page }) => {
        await page.route("**/api/equations/compute", async (route) => {
            await new Promise((r) => setTimeout(r, 2000));
            await route.fallback();
        });
        await page.goto("/equation");
        const stage = page.locator(".eq-panel-right[aria-busy=true]");
        await expect(stage).toBeVisible({ timeout: 20_000 });
        await expect(stage.locator(".skeleton").first()).toBeVisible();
        // OD19-V6/glass 10.1.1: every bar of the compute skeleton shimmers.
        const bars = stage.locator(".skeleton");
        expect(await bars.count()).toBeGreaterThan(0);
        expect(await stage.locator(".skeleton:not([data-shimmer])").count()).toBe(0);
        await expect(page.locator("main")).not.toContainText(LOADER_TEXT);
    });

    test("reduced motion: a route push swaps with no transition", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.addInitScript(recordViewTransitions);
        await page.goto("/gallery");
        await expect(page.locator(".app-dock")).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(500);
        const t = await pushAndTrace(page, "/paper", 600);
        expect(t.vtFrames, JSON.stringify(t)).toBe(0);
        expect(t.vts, `glass opens no view transition under reduced motion ${JSON.stringify(t)}`).toHaveLength(0);
        await expect(page).toHaveURL(/\/paper$/);
    });
});

test.describe("OD19 P3 · ALL — /equation is ready < 1 s after nav intent", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("hover the Equation section, then open it: the series paints within 1000 ms", async ({ page }) => {
        test.setTimeout(90_000);
        await page.goto("/paper");
        const trigger = page.locator(".app-dock").getByRole("button", { name: /^Navigate/ });
        await expect(trigger).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(800);
        await trigger.click();
        const item = page.getByRole("menuitem", { name: "Equation" });
        await expect(item).toBeVisible();
        await item.hover();
        // The intent dwell: the time a reader's pointer rests before the click.
        await page.waitForTimeout(3000);
        const t0 = Date.now();
        await item.click();
        await expect(page.locator(".eq-card")).toBeVisible({ timeout: 20_000 });
        const ready = Date.now() - t0;
        expect(ready, `input → series painted (ms)`).toBeLessThan(1000);
    });
});
