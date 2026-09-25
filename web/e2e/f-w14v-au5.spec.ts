// SERVED MODEL: claude-opus-5-5
import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * X.F.W14V.au5 — the paper family of the AUDIT-2 fourier register
 * (`docs/tranches/X/audit/AUDIT-2-fourier.md`): one falsifier per row limb,
 * read from the served page (BASE_URL=http://localhost:3100, API :8000).
 *
 *   A2-FO-L1-1   ONE table-of-contents tree. The desktop drawer and the phone
 *                bar render the same rows by one rule: the same anatomy at
 *                each depth (rung, disclosure rung, alignment, corner, type,
 *                numeral, indent) and the same reach (an expanded chapter
 *                shows every level below it, in either host).
 *   A2-FO-L1-19  ONE scroll restoration on /paper. The shell's per-entry
 *                `<main>` restore stands aside on a route that owns its
 *                scroll (the paper restores by section id); generic routes
 *                keep the shell's restore.
 *
 * The rows are located by role and structure, never by the class names the
 * cure renames: a row is a button inside a list item of the host, its depth
 * is the number of lists between it and the host.
 */

const DESKTOP = { width: 1440, height: 900 } as const;
const PHONE = { width: 390, height: 844 } as const;

type Sig = Record<string, string | number>;
interface HostRead {
    /** Per depth: the first row's anatomy. */
    anatomy: Record<number, Sig>;
    /** Row count per depth. */
    counts: Record<number, number>;
}

async function openPaper(page: Page): Promise<void> {
    await page.goto("/paper");
    await expect(page.locator(".paper-article h1")).toBeVisible({ timeout: 60_000 });
    await expect
        .poll(() => page.locator(".paper-scroll").evaluate((el) => el.scrollHeight), { timeout: 15_000 })
        .toBeGreaterThan(5000);
}

/** Expand every disclosure in the host until none is left closed. */
async function expandAll(page: Page, host: string): Promise<void> {
    for (let pass = 0; pass < 6; pass++) {
        const closed = page.locator(`${host} button[aria-label^="Subsections of"][aria-expanded="false"]`);
        const n = await closed.count();
        if (n === 0) return;
        for (let i = n - 1; i >= 0; i--) await closed.nth(i).click();
        await page.waitForTimeout(250);
    }
}

async function readHost(page: Page, host: string): Promise<HostRead> {
    return page.evaluate((sel) => {
        const root = document.querySelector(sel)!;
        const rows = [...root.querySelectorAll("li button")].filter(
            (b) => !(b.getAttribute("aria-label") ?? "").startsWith("Subsections of"),
        ) as HTMLElement[];
        const depthOf = (el: Element) => {
            let d = -1;
            for (let n: Element | null = el; n && n !== root; n = n.parentElement) if (n.tagName === "OL") d++;
            return d;
        };
        const anatomy: Record<number, Record<string, string | number>> = {};
        const counts: Record<number, number> = {};
        const rowBox = (el: Element) => el.getBoundingClientRect().left;
        for (const row of rows) {
            const d = depthOf(row);
            counts[d] = (counts[d] ?? 0) + 1;
            if (anatomy[d]) continue;
            const cs = getComputedStyle(row);
            const num = row.querySelector(".fira-code") as HTMLElement | null;
            const li = row.closest("li")!;
            const disc = rows.length
                ? [...root.querySelectorAll('button[aria-label^="Subsections of"]')].find((b) => depthOf(b) === d)
                : undefined;
            const parentRow = li.parentElement?.closest("li")?.querySelector("button");
            anatomy[d] = {
                rung: row.getAttribute("data-size") ?? "",
                disclosureRung: disc?.getAttribute("data-size") ?? "none",
                justify: cs.justifyContent,
                textAlign: cs.textAlign,
                radius: cs.borderTopLeftRadius,
                fontSize: cs.fontSize,
                numeralSize: num ? getComputedStyle(num).fontSize : "none",
                indent: parentRow ? Math.round(rowBox(row) - rowBox(parentRow)) : 0,
            };
        }
        return { anatomy, counts };
    }, host);
}

async function readRail(browser: Browser): Promise<HostRead> {
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await openPaper(page);
    const host = 'nav[aria-label="Table of contents"]';
    await expect(page.locator(`${host} li button`).first()).toBeVisible();
    await expandAll(page, host);
    const read = await readHost(page, host);
    await ctx.close();
    return read;
}

async function readBar(browser: Browser): Promise<HostRead> {
    const ctx = await browser.newContext({ viewport: PHONE, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await openPaper(page);
    await page.locator(".paper-scroll").evaluate((el) => el.scrollTo({ top: 2500 }));
    await page.locator(".floating-toc-title-btn").click();
    const host = '[data-slot="popover-content"][aria-label="Table of contents"]';
    await expect(page.locator(`${host} li button`).first()).toBeVisible();
    await expandAll(page, host);
    const read = await readHost(page, host);
    await ctx.close();
    return read;
}

test.describe("A2-FO-L1-1 — one ToC tree", () => {
    test("the drawer and the phone bar render one row anatomy per depth, and one reach", async ({ browser }) => {
        const rail = await readRail(browser);
        const bar = await readBar(browser);
        const msg = JSON.stringify({ rail, bar });
        // One reach: an expanded chapter shows every level below it, in both
        // hosts, so fully expanded the two trees carry the same rows.
        expect(rail.counts, msg).toEqual(bar.counts);
        expect(Object.keys(rail.counts).length, msg).toBeGreaterThanOrEqual(3);
        // One anatomy per depth. The disclosure's rung is compared (its box is
        // the producer's touch floor on a coarse pointer, not the consumer's).
        for (const d of Object.keys(rail.anatomy)) {
            expect(rail.anatomy[Number(d)], `depth ${d}: ${msg}`).toEqual(bar.anatomy[Number(d)]);
        }
    });
});

test.describe("A2-FO-L1-19 — one scroll restoration on /paper", () => {
    // /morph is the generic route that outgrows <main> (1330 of 820 px at
    // 1440×900, measured), so the generic limb has an offset to restore.
    test.use({ viewport: DESKTOP });

    test("the shell writes no <main> offset on /paper; a generic route keeps its restore", async ({ page }) => {
        // Record every scrollTop write the shell makes on <main>, with the
        // route it was made on.
        await page.addInitScript(() => {
            const desc = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop")!;
            const log: { path: string; value: number }[] = [];
            (window as unknown as { __mainWrites: typeof log }).__mainWrites = log;
            Object.defineProperty(Element.prototype, "scrollTop", {
                configurable: true,
                get() {
                    return desc.get!.call(this);
                },
                set(v: number) {
                    if ((this as Element).tagName === "MAIN") log.push({ path: location.pathname, value: v });
                    desc.set!.call(this, v);
                },
            });
        });
        const push = (path: string) =>
            page.evaluate((p) => {
                const app = (document.querySelector("#app") as unknown as {
                    __vue_app__: { config: { globalProperties: { $router: { push(p: string): Promise<unknown> } } } };
                }).__vue_app__;
                void app.config.globalProperties.$router.push(p);
            }, path);
        const writes = () =>
            page.evaluate(() => (window as unknown as { __mainWrites: { path: string; value: number }[] }).__mainWrites);

        await page.goto("/morph");
        await page.waitForLoadState("networkidle");
        await expect(page.locator("main")).toBeVisible();
        await page.waitForTimeout(1500);
        const main = page.locator("main");
        const set = await main.evaluate((el) => {
            const max = el.scrollHeight - el.clientHeight;
            el.scrollTop = Math.min(400, max);
            return el.scrollTop;
        });
        expect(set, "/morph must scroll <main> for the generic limb").toBeGreaterThan(0);
        await push("/paper");
        await expect(page.locator(".paper-article h1")).toBeVisible({ timeout: 60_000 });
        await page.waitForTimeout(500);
        await page.evaluate(() => history.back());
        await expect.poll(() => page.evaluate(() => location.pathname)).toBe("/morph");
        await page.waitForTimeout(800);
        // The generic route keeps the shell's restore.
        expect(await main.evaluate((el) => el.scrollTop), JSON.stringify(await writes())).toBe(set);
        await page.evaluate(() => history.forward());
        await expect.poll(() => page.evaluate(() => location.pathname)).toBe("/paper");
        await page.waitForTimeout(800);
        const onPaper = (await writes()).filter((w) => w.path === "/paper");
        expect(onPaper, JSON.stringify(await writes())).toEqual([]);
    });
});
