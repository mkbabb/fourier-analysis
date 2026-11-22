import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";
import { showViewIfTabbed } from "./fixtures/workspace";
import { dragFrom, editorReady, editorSvg, linePoint } from "./fixtures/editor";

/**
 * Undo in the curve editor read as a one-frame swap (PR 33 frames: 47 % of the
 * change in the film's first frame after the press, at 1440). The line did
 * travel, on a cubic-out: half of its way was gone in the first 40 ms, so the
 * eye saw a jump and then a settle. A scene change (Undo, Redo, Smooth,
 * Simplify, Reset) now travels on the house's standard ease, the way a thing
 * moves across the screen: it answers the press within 100 ms, carries no
 * large share of its way in any one early frame, and lands within 300 ms.
 *
 * The line's progress is read off the drawn path: how far the line still is
 * from where it lands (the largest gap from any point of it to the landed
 * line), against how far it started.
 */

const LOAD = 60_000;

async function openEditor(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    await showViewIfTabbed(page, "Canvas");
    await expect(page.locator(".controls-overlay")).toBeVisible({ timeout: LOAD });
    await expect(page.getByRole("button", { name: "Edit contour" }).first()).toBeEnabled({ timeout: LOAD });
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: "Edit contour" }).first().click();
    await editorReady(page);
    await page.waitForTimeout(500);
}

/** Film the drawn line from the next press on: each frame's time after the press and its path. */
async function filmLine(page: Page): Promise<void> {
    await editorSvg(page).evaluate((svg) => {
        const path = svg.querySelector("path.spline-path")!;
        const w = window as unknown as { __film: { at: number; d: string }[]; __pressAt: number };
        w.__film = [{ at: -1, d: path.getAttribute("d")! }];
        w.__pressAt = NaN;
        document.addEventListener("click", () => (w.__pressAt = performance.now()), { capture: true, once: true });
        const t0 = performance.now();
        const tick = (now: number) => {
            if (!Number.isNaN(w.__pressAt)) w.__film.push({ at: now - w.__pressAt, d: path.getAttribute("d")! });
            if (now - t0 < 4000 && (Number.isNaN(w.__pressAt) || now - w.__pressAt < 900)) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}

/** Each filmed frame's progress toward the landed line (0 at the press, 1 landed). */
async function progress(page: Page): Promise<{ at: number; p: number }[]> {
    return editorSvg(page).evaluate((svg) => {
        const w = window as unknown as { __film: { at: number; d: string }[] };
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
        svg.appendChild(probe);
        const sample = (d: string) => {
            probe.setAttribute("d", d);
            const len = probe.getTotalLength();
            return Array.from({ length: 400 }, (_, i) => probe.getPointAtLength((i / 400) * len));
        };
        /** The largest distance from a point of `a` to the line `b`. */
        const gap = (a: DOMPoint[], b: DOMPoint[]) => {
            let worst = 0;
            for (const p of a) {
                let best = Infinity;
                for (const q of b) best = Math.min(best, (p.x - q.x) ** 2 + (p.y - q.y) ** 2);
                worst = Math.max(worst, best);
            }
            return Math.sqrt(worst);
        };
        const film = w.__film;
        const end = sample(film.at(-1)!.d);
        const start = gap(sample(film[0]!.d), end);
        const out = film.slice(1).map((f) => ({ at: Math.round(f.at), p: 1 - gap(sample(f.d), end) / start }));
        probe.remove();
        return out;
    });
}

for (const scheme of ["dark", "light"] as const) {
    test.describe(`Undo travels (1440, ${scheme})`, () => {
        test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: scheme });
        test.setTimeout(120_000);

        test("answers within 100 ms, carries no jump in its first frames, lands within 300 ms", async ({ page }) => {
            await openEditor(page);
            await dragFrom(page, await linePoint(page, 0.2), 40, 32);
            const undo = page.locator(".controls-overlay").last().getByRole("button", { name: "Undo", exact: true });
            await expect(undo).toBeEnabled();
            await page.waitForTimeout(500);
            await filmLine(page);
            await undo.click();
            await page.waitForTimeout(1200);
            const film = await progress(page);
            const at = (ms: number) => film.find((f) => f.at >= ms)!;
            // The first frames after the press: a start, never half the way.
            expect(at(40).p, `the line's share of its way by 40 ms ${JSON.stringify(film.slice(0, 6))}`).toBeLessThanOrEqual(0.25);
            // The press is answered within 100 ms.
            expect(at(100).p, "the line has visibly moved by 100 ms").toBeGreaterThanOrEqual(0.08);
            // Several frames carry it, and it lands within 300 ms.
            const moving = film.filter((f) => f.p > 0.02 && f.p < 0.98);
            expect(moving.length, "frames between the press and the landing").toBeGreaterThanOrEqual(8);
            expect(at(300).p, "landed by 300 ms").toBeGreaterThanOrEqual(0.98);
        });
    });
}
