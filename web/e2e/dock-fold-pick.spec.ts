import { expect, test, type Page } from "@playwright/test";

/**
 * FORTY-SIXTH A (the owner: "the last few frames of the collapse animation
 * shift and are buggy"). On a phone the dock folds once a section is picked
 * from its menu. While glass folds it, the seal is drawn on the run's box and
 * centred on the plate when the fold ends, so a run that changed width
 * mid-fold left the seal off its plate and then jumped it home in one frame.
 * The pick pushed the route and then folded, so the new section's name and
 * page seats changed the run under the folding seal, and a name the open run
 * had measured as fitting was taken on as the fold began: the seal's mark
 * stood 33.6 px off its plate's centre at 390 (Paper -> Visualize), up to
 * 66 px at 844x390 (Visualize -> Paper), cut at the plate's edge or gone, for
 * 200 to 450 ms. Filmed per animation frame: from the pick until the fold has
 * landed and the run has taken the new route, the mark (wherever it shows)
 * stays within a few px of where it comes to rest, is home once the plate has
 * closed, and never jumps.
 */

interface Frame {
    t: number;
    collapsed: boolean;
    plateWidth: number;
    mark: number;
    markInk: number;
}

/** Films the plate's width and the seal mark's centre and strength on every frame, for `ms`. */
async function film(page: Page, ms: number): Promise<void> {
    await page.evaluate((ms) => {
        const dock = document.querySelector<HTMLElement>(".app-dock")!;
        const frames: Frame[] = [];
        const w = window as unknown as { __fold: Frame[]; __folded: boolean };
        w.__fold = frames;
        w.__folded = false;
        const t0 = performance.now();
        const centre = (el: Element | null) => {
            const b = el?.getBoundingClientRect();
            return b ? b.x + b.width / 2 : Number.NaN;
        };
        const ink = (el: Element | null) => {
            let o = 1;
            for (let e = el; e; e = e.parentElement) o *= Number.parseFloat(getComputedStyle(e).opacity);
            return el ? o : 0;
        };
        const tick = () => {
            const mark = dock.querySelector(".dock-layer--summary svg");
            frames.push({
                t: performance.now() - t0,
                collapsed: dock.classList.contains("collapsed"),
                plateWidth: dock.querySelector(".dock-plate")?.getBoundingClientRect().width ?? Number.NaN,
                mark: centre(mark),
                markInk: ink(mark),
            });
            if (performance.now() - t0 < ms) requestAnimationFrame(tick);
            else w.__folded = true;
        };
        requestAnimationFrame(tick);
    }, ms);
}

async function filmed(page: Page): Promise<Frame[]> {
    await page.waitForFunction(() => (window as unknown as { __folded: boolean }).__folded, null, { timeout: 15_000 });
    return page.evaluate(() => (window as unknown as { __fold: Frame[] }).__fold);
}

async function openDock(page: Page, path: string): Promise<void> {
    await page.goto(path);
    const dock = page.locator(".app-dock");
    await expect(dock).toHaveClass(/(^|\s)collapsed(\s|$)/, { timeout: 30_000 });
    await expect(dock).not.toHaveAttribute("data-morphing", /.*/, { timeout: 5_000 });
    await page.waitForTimeout(600);
    await dock.getByRole("button", { name: "Expand dock" }).tap();
    await expect(dock).toHaveClass(/(^|\s)expanded(\s|$)/);
    await expect(dock).not.toHaveAttribute("data-morphing", /.*/, { timeout: 5_000 });
    await page.waitForTimeout(400);
}

const PICKS = [
    { from: "/paper", to: "Visualize", url: /\/visualize/, icon: "eye" },
    { from: "/visualize", to: "Paper", url: /\/paper/, icon: "file-text" },
    { from: "/paper", to: "Gallery", url: /\/gallery/, icon: "layout-grid" },
    { from: "/gallery", to: "Equation", url: /\/equation/, icon: "sigma" },
] as const;

for (const vp of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
]) {
    test.describe(`a section picked on a phone ${vp.width}x${vp.height}`, () => {
        test.use({ viewport: vp });
        test("@coarse the dock folds with its seal on its plate, never jumping", async ({ page }) => {
            test.setTimeout(120_000);
            for (const pick of PICKS) {
                await test.step(`${pick.from} -> ${pick.to}`, async () => {
                    await openDock(page, pick.from);
                    await page.locator(".app-dock .nav-trigger").tap();
                    const item = page.getByRole("menuitem", { name: pick.to });
                    await expect(item).toBeVisible();
                    await page.waitForTimeout(300);
                    await film(page, 2000);
                    await item.tap();
                    await expect(page).toHaveURL(pick.url);
                    const frames = await filmed(page);
                    await expect(page.locator(".app-dock")).toHaveClass(/(^|\s)collapsed(\s|$)/);

                    // Where the mark rests once the fold has landed (beside a
                    // persistent seat, such as the phone's Controls on /equation,
                    // that is not the plate's centre).
                    const shown = frames.filter((f) => f.collapsed && f.markInk > 0.3);
                    expect(shown.length, "the seal's mark was filmed through the fold").toBeGreaterThan(5);
                    const rest = shown.at(-1)!;
                    const folded = rest.plateWidth;
                    for (const f of shown) {
                        // glass's seal arrives within a few px of its rest and eases home;
                        // the fault stood it 34 to 66 px away.
                        expect(
                            Math.abs(f.mark - rest.mark),
                            `the mark stands ${(f.mark - rest.mark).toFixed(1)} px off its rest at ${f.t.toFixed(0)} ms`,
                        ).toBeLessThanOrEqual(6);
                        // Once the plate has closed, the mark is home: nothing is left to re-centre.
                        if (Math.abs(f.plateWidth - folded) <= 1) {
                            expect(
                                Math.abs(f.mark - rest.mark),
                                `the plate has closed and the mark is ${(f.mark - rest.mark).toFixed(1)} px off its rest at ${f.t.toFixed(0)} ms`,
                            ).toBeLessThanOrEqual(1);
                        }
                    }
                    // And it never jumps: glass's own approach is at most 4 px from
                    // the mark's first frame, so no frame moves it further (the
                    // fault's re-centring was a 5 to 66 px step).
                    for (let i = 1; i < shown.length; i++) {
                        expect(
                            Math.abs(shown[i].mark - shown[i - 1].mark),
                            `the mark stepped ${shown[i - 1].mark.toFixed(1)} -> ${shown[i].mark.toFixed(1)} px at ${shown[i].t.toFixed(0)} ms`,
                        ).toBeLessThanOrEqual(4);
                    }
                    // The run took the new route once the fold had landed: opened again, it shows the section's glyph.
                    await page.locator(".app-dock").getByRole("button", { name: "Expand dock" }).tap();
                    await expect(page.locator(`.app-dock .nav-trigger .lucide-${pick.icon}`)).toBeVisible();
                    await expect(page.locator(".app-dock .nav-trigger svg[class*=lucide-]:not(.nav-trigger-chevron)")).toHaveCount(1);
                });
            }
        });
    });
}
