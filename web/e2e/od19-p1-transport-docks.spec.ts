/**
 * X-OD19 · P1 — the transport dock and the dock menus (owner rows OD19-F1, F3, F4).
 *
 * F1  The collapsed summary is ONE readout that fits glass's summary square, so
 *     every collapsed kid lies inside the plate; the full face has a definite
 *     inline size, so the expand is a measured morph (>=5 frames of monotone
 *     growth, no single-frame Play snap) and the collapse never undershoots.
 * F3  Speed and Easing are dock-level seats, each opening its own menu.
 * F4  An open dock menu holds its dock open: with the pointer away, the dock never
 *     reaches `.collapsed` while the menu is open, and it collapses once it closes.
 *
 * Any residual first-flip snap of the small fit-content docks is glass G-F2a
 * (O-102), not asserted here.
 */
import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

const CELLS = [
    { width: 1440, height: 900, scheme: "light" },
    { width: 1440, height: 900, scheme: "dark" },
    { width: 390, height: 844, scheme: "light" },
    { width: 390, height: 844, scheme: "dark" },
] as const;

async function openViz(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    if (page.viewportSize()!.width < 640) await page.getByRole("tab", { name: "Canvas" }).click();
    const dock = page.locator(".animation-dock");
    await expect(dock).toBeVisible({ timeout: 30_000 });
    await page.mouse.move(2, page.viewportSize()!.height / 2);
    await expect(dock).toHaveClass(/\bcollapsed\b/, { timeout: 15_000 });
    await expect.poll(() => dock.evaluate((d) => d.hasAttribute("data-morphing")), { timeout: 10_000 }).toBe(false);
}

async function expandTransport(page: Page): Promise<void> {
    const dock = page.locator(".animation-dock");
    const b = (await dock.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await expect(dock).toHaveClass(/\bexpanded\b/, { timeout: 5_000 });
    await expect.poll(() => dock.evaluate((d) => d.hasAttribute("data-morphing")), { timeout: 10_000 }).toBe(false);
}

for (const c of CELLS) {
    test.describe(`X-OD19 P1 — transport dock (${c.scheme} ${c.width})`, () => {
        test.use({ viewport: { width: c.width, height: c.height }, colorScheme: c.scheme });
        test.setTimeout(90_000);

        test("F1 — every collapsed-summary kid lies inside the plate", async ({ page }) => {
            await openViz(page);
            const out = await page.locator(".animation-dock").evaluate((d) => {
                const p = d.getBoundingClientRect();
                return [...d.querySelectorAll(".dock-layer--summary *, .dock-persistent > *")]
                    .map((e) => ({ e, r: e.getBoundingClientRect() }))
                    .filter(({ r }) => r.width > 0 && r.height > 0)
                    .filter(({ r }) => r.left < p.left - 0.5 || r.right > p.right + 0.5 || r.top < p.top - 0.5 || r.bottom > p.bottom + 0.5)
                    .map(({ e, r }) => `${e.className?.toString().slice(0, 24)} ${Math.round(r.left)}..${Math.round(r.right)} plate ${Math.round(p.left)}..${Math.round(p.right)}`);
            });
            expect(out, "collapsed kids outside the plate").toEqual([]);
            // One readout: the summary holds the position bar and nothing else.
            await expect(page.locator(".animation-dock .dock-layer--summary .metric")).toHaveCount(0);
        });

        test("F1 — the expand is a measured morph: >=5 monotone frames, no Play snap; the collapse never undershoots", async ({
            page,
        }) => {
            await openViz(page);
            type Row = { t: number; w: number; play: number; morphing: boolean };
            const sample = (ms: number) =>
                page.evaluate(
                    (ms) =>
                        new Promise<Row[]>((res) => {
                            const rows: Row[] = [];
                            const t0 = performance.now();
                            const f = () => {
                                const d = document.querySelector(".animation-dock")!;
                                const p = d.querySelector(".dock-persistent")!.getBoundingClientRect();
                                rows.push({ t: performance.now(), w: d.getBoundingClientRect().width, play: p.left, morphing: d.hasAttribute("data-morphing") });
                                if (performance.now() - t0 < ms) requestAnimationFrame(f);
                                else res(rows);
                            };
                            requestAnimationFrame(f);
                        }),
                    ms,
                );
            const read = (rows: Row[]) => {
                let growing = 0;
                let reversals = 0;
                let maxPlayJump = 0;
                let growFrom = NaN;
                let growTo = NaN;
                for (let i = 1; i < rows.length; i++) {
                    const dw = rows[i].w - rows[i - 1].w;
                    if (dw > 0.5) {
                        growing++;
                        if (Number.isNaN(growFrom)) growFrom = rows[i - 1].t;
                        growTo = rows[i].t;
                    }
                    if (dw < -0.5) reversals++;
                    maxPlayJump = Math.max(maxPlayJump, Math.abs(rows[i].play - rows[i - 1].play));
                }
                const playTravel = Math.abs(rows.at(-1)!.play - rows[0].play);
                // The growth's span on the page clock: from the last frame before
                // the width moved to the last frame it grew.
                const growSpanMs = Number.isNaN(growFrom) ? 0 : Math.round(growTo - growFrom);
                return { n: rows.length, w0: rows[0].w, wEnd: rows.at(-1)!.w, growing, growSpanMs, reversals, maxPlayJump, playTravel };
            };
            const dock = page.locator(".animation-dock");
            const b = (await dock.boundingBox())!;
            const centre = () => page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
            // The FIRST flip publishes glass's unmeasured endpoint (G-F2a, O-102):
            // read and banked, not asserted.
            const firstP = sample(1400);
            await centre();
            const first = read(await firstP);
            test.info().annotations.push({ type: "first-flip (G-F2a)", description: JSON.stringify(first) });
            await page.mouse.move(2, c.height / 2);
            await expect(dock).toHaveClass(/\bcollapsed\b/, { timeout: 15_000 });
            await expect.poll(() => dock.evaluate((d) => d.hasAttribute("data-morphing")), { timeout: 10_000 }).toBe(false);
            // Every later expand runs to the face's real, definite endpoint.
            const expP = sample(1400);
            await centre();
            const exp = read(await expP);
            test.info().annotations.push({ type: "expand-trace", description: JSON.stringify(exp) });
            expect(exp.wEnd, "the dock expanded").toBeGreaterThan(exp.w0 + 100);
            // ">=5 frames" is five frames of the 60 Hz clock. glass's morph is a
            // spring stepped on rAF, so a host whose main thread paints slower
            // (CI 39577437998: 4 and 3 sampled growth frames at 1440) shows the
            // same morph in fewer, longer frames. Lawful arms (ESC-FREL-v3-1,
            // COHESION §0gj.2: a slow host's few frames are a reading, never
            // inflated): five sampled growth frames, or growth spanning five
            // 60 Hz frame periods; either way the no-snap bound below holds.
            expect(
                exp.growing >= 5 || exp.growSpanMs >= (5 * 1000) / 60,
                `frames of width growth (>= 5, or >= 5 frame periods of the 60 Hz clock) ${JSON.stringify(exp)}`,
            ).toBe(true);
            expect(exp.reversals, "the width never reverses on expand").toBe(0);
            // Before: Play's whole travel (459 -> 31 px) landed in ONE frame. A 428 px
            // travel at a headless rAF cadence cannot step <=12 px per frame, so the
            // snap is read as "no single frame carries half the travel".
            expect(exp.maxPlayJump, "largest single-frame Play shift (px)").toBeLessThan(exp.playTravel / 2);
            // Collapse: monotone, never under the settled collapsed width (before: 57 px, then a snap to 102).
            await page.mouse.move(2, c.height / 2);
            const colRows = await sample(6500);
            const settled = colRows.at(-1)!.w;
            const under = Math.min(...colRows.map((r) => r.w));
            let grows = 0;
            for (let i = 1; i < colRows.length; i++) if (colRows[i].w - colRows[i - 1].w > 0.5) grows++;
            test.info().annotations.push({ type: "collapse-trace", description: JSON.stringify({ n: colRows.length, settled, under, grows }) });
            await expect(dock).toHaveClass(/\bcollapsed\b/);
            expect(under, "the collapse never undershoots the settled pill").toBeGreaterThanOrEqual(settled - 1);
            expect(grows, "the width never grows back on collapse").toBe(0);
        });

        test("F3 — Speed and Easing are dock seats, each with its own menu", async ({ page }) => {
            await openViz(page);
            await expandTransport(page);
            const dock = page.locator(".animation-dock");
            await expect(dock.locator("[aria-label='More options']")).toHaveCount(0);
            const speed = dock.getByRole("button", { name: "Playback speed" });
            await expect(speed).toHaveText(/^\s*[\d.]+\s*×\s*$/);
            await speed.click();
            let menu = page.getByRole("menu");
            await expect(menu).toBeVisible();
            await expect(menu.getByRole("group", { name: "Speed" })).toHaveCount(1);
            await expect(menu.getByRole("group", { name: "Easing" })).toHaveCount(0);
            await menu.getByRole("menuitemradio", { name: /^2\s*×$/ }).click();
            await expect(speed).toHaveText(/^\s*2\s*×\s*$/);
            await page.keyboard.press("Escape");
            await expect(menu).toBeHidden();
            await expandTransport(page);
            await dock.getByRole("button", { name: "Easing" }).click();
            menu = page.getByRole("menu");
            await expect(menu).toBeVisible();
            await expect(menu.getByRole("group", { name: "Easing" })).toHaveCount(1);
            await expect(menu.getByRole("group", { name: "Speed" })).toHaveCount(0);
            await expect(menu.getByRole("separator")).toHaveCount(0);
        });

        test("F4 — an open menu holds the dock open; closing it lets the dock collapse", async ({ page }) => {
            await openViz(page);
            await expandTransport(page);
            const dock = page.locator(".animation-dock");
            await dock.getByRole("button", { name: "Playback speed" }).click();
            await expect(page.getByRole("menu")).toBeVisible();
            await page.mouse.move(2, 2);
            await page.mouse.move(4, c.height - 4);
            // Watch the dock's class for 4.8 s with the pointer away and the menu open.
            const collapsedSeen = await page.evaluate(
                (ms) =>
                    new Promise<boolean>((res) => {
                        const d = document.querySelector(".animation-dock")!;
                        let seen = d.classList.contains("collapsed");
                        const t0 = performance.now();
                        const f = () => {
                            seen ||= d.classList.contains("collapsed");
                            if (performance.now() - t0 < ms) requestAnimationFrame(f);
                            else res(seen);
                        };
                        requestAnimationFrame(f);
                    }),
                4800,
            );
            expect(collapsedSeen, "the dock reached .collapsed under an open menu").toBe(false);
            await expect(page.getByRole("menu")).toBeVisible();
            await page.keyboard.press("Escape");
            await expect(page.getByRole("menu")).toBeHidden();
            // The token is given back: with the pointer away and focus out of the dock
            // (Escape returns focus to the trigger, which holds the dock by itself),
            // the idle timer collapses it again.
            await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
            await expect(dock).toHaveClass(/\bcollapsed\b/, { timeout: 10_000 });
        });
    });
}
