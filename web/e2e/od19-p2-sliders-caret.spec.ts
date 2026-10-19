import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * X·OD19 P2-fourier-sliders-caret — owner rows OD19-F7 and OD19-F8 (2026-10-19).
 *
 * F7 "Sliders have a double border: use glass-ui sliders with the integrated
 * thumb." BEFORE: the /equation Harmonics row painted a 24 px glass track-well,
 * a local 6 px gradient rule inside it, and a 12x24 thumb with a 2 px border.
 * The row is glass `Slider variant="scrubber"`: the fill's leading edge is the
 * handle, tinted by the row hue on glass's `--slider-range-bg`.
 *
 * F8 "The time popover in the dock is clipped." BEFORE: the hovered caret sat
 * at bottom:calc(100% + 6px) inside `.dock-run` (a scroll port since glass
 * 10.x), so only a sliver showed. The caret is glass's portaled Tooltip,
 * anchored to the slider thumb.
 */
const CELLS = [
    { scheme: "light", width: 1440, height: 900 },
    { scheme: "dark", width: 1440, height: 900 },
    { scheme: "light", width: 390, height: 844 },
    { scheme: "dark", width: 390, height: 844 },
] as const;

async function readRow(page: Page) {
    const row = page.locator("[data-control-row]").first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.scrollIntoViewIfNeeded();
    return row.evaluate((r) => {
        const root = r.querySelector<HTMLElement>(".glass-slider")!;
        const track = r.querySelector<HTMLElement>(".slider-track")!;
        const range = r.querySelector<HTMLElement>(".slider-range")!;
        const thumb = r.querySelector<HTMLElement>(".slider-thumb")!;
        const tb = thumb.getBoundingClientRect();
        const rb = range.getBoundingClientRect();
        // The painted outlines: every visible element of the slider that strokes a
        // border, or casts a shadow without being glass's own well or its fill.
        // BEFORE: the well's inset edge plus the spectrum thumb's 2 px border and
        // cast (the double outline). AFTER: the well's edge alone frames the row.
        const thumbPaints = Number(getComputedStyle(thumb).opacity) > 0 && tb.width > 0;
        const edges = [...root.querySelectorAll<HTMLElement>("*"), root].filter((e) => {
            const cs = getComputedStyle(e);
            if (e.getClientRects().length === 0 || Number(cs.opacity) === 0) return false;
            if (parseFloat(cs.borderTopWidth) > 0) return true;
            return cs.boxShadow !== "none" && e !== track && e !== range;
        });
        return {
            variant: root.dataset.variant,
            rootBg: getComputedStyle(root).backgroundImage,
            trackBg: getComputedStyle(track).backgroundImage,
            thumbBorder: parseFloat(getComputedStyle(thumb).borderTopWidth),
            rangeTint: getComputedStyle(range).getPropertyValue("--liquid-fill-tint").trim(),
            // The integrated handle: the fill's leading edge sits at the thumb's centre.
            handleGap: Math.abs(rb.right - (tb.left + tb.width / 2)),
            thumbPaints,
            edges: edges.map((e) => String(e.className).split(" ")[0]),
        };
    });
}

for (const c of CELLS) {
    test.describe(`OD19 P2 — ${c.scheme} ${c.width}`, () => {
        test.use({ viewport: { width: c.width, height: c.height }, colorScheme: c.scheme });

        test("OD19-F7 · the control row is glass's integrated-thumb scrubber, one edge", async ({ page }) => {
            await page.goto("/equation");
            const m = await readRow(page);
            expect(m.variant, "glass Slider variant=scrubber").toBe("scrubber");
            expect(m.trackBg, "no local background-image on the track").toBe("none");
            expect(m.rootBg, "no local background-image on the control").toBe("none");
            expect(m.thumbBorder, "no 2 px thumb border").toBe(0);
            expect(m.rangeTint, "the row hue rides glass's --slider-range-bg").not.toBe("");
            expect(m.handleGap, "the fill's leading edge is the handle").toBeLessThanOrEqual(1.5);
            expect(m.thumbPaints, "the handle is the fill's edge, not a painted thumb").toBe(false);
            expect(m.edges, "one edge: the well's own, no second outline").toEqual([]);
        });

        test("OD19-F8 · the hovered timeline caret is whole and on top", async ({ page }) => {
            await page.goto(`/v/${seededViz().slug}`);
            if (c.width < 1024) await page.getByRole("tab", { name: "Canvas" }).click();
            const dock = page.locator(".animation-dock");
            await expect(dock).toBeVisible({ timeout: 30_000 });
            const db = (await dock.boundingBox())!;
            await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2);
            await page.waitForTimeout(900);
            const rail = page.locator(".animation-dock .timeline-row");
            const rb = (await rail.boundingBox())!;
            await page.mouse.move(rb.x + rb.width * 0.4, rb.y + rb.height / 2);
            const caret = page.locator(".caret-value");
            await expect(caret).toBeVisible({ timeout: 5_000 });
            await page.waitForTimeout(400);
            const m = await caret.evaluate((el) => {
                const b = el.getBoundingClientRect();
                const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
                const clippers: string[] = [];
                for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
                    const cs = getComputedStyle(e);
                    const r = e.getBoundingClientRect();
                    const clips = cs.overflow !== "visible" || cs.clipPath !== "none" || cs.contain.includes("paint");
                    const cuts = r.left > b.left + 0.5 || r.right < b.right - 0.5 || r.top > b.top + 0.5 || r.bottom < b.bottom - 0.5;
                    if (clips && cuts) clippers.push(String(e.className).slice(0, 60));
                }
                const thumb = document.querySelector<HTMLElement>(".animation-dock .timeline-slider [role=slider]")!;
                const tb = thumb.getBoundingClientRect();
                return {
                    hitIsCaret: !!hit && (el === hit || el.contains(hit) || hit.contains(el)),
                    inDock: !!el.closest(".animation-dock"),
                    clippers,
                    above: b.bottom <= tb.top,
                    dx: Math.abs(b.left + b.width / 2 - (tb.left + tb.width / 2)),
                };
            });
            expect(m.inDock, "the caret leaves the dock's scroll port").toBe(false);
            expect(m.hitIsCaret, "elementFromPoint at the caret centre is the caret").toBe(true);
            expect(m.clippers, "no ancestor clips the caret").toEqual([]);
            expect(m.above, "the caret sits above the thumb").toBe(true);
            expect(m.dx, "the caret is centred on the thumb").toBeLessThanOrEqual(2);
        });
    });
}
