import { expect, test, type Page } from "@playwright/test";
import { expectHardwareGpu } from "./fixtures/gpu";
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
 *
 * How many frames carry the travel is the renderer's as much as the app's. In
 * the headless shell (SwiftShader) each of the travel's frames costs 25 to
 * 50 ms to paint while the idle page runs at 8 ms (PR 35 review, three runs:
 * 10 or 11 path frames, 5 or 6 in the band); on the Mac's GPU the same frames
 * cost 8 to 10 ms (29 or 30 path frames, 21 in the band). That count is read
 * on the GPU instrument (`@gpu`, the `chrome-gpu` project); the curve's shape
 * is read everywhere.
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

/**
 * Film the drawn line from the next press on: each change of its path, with
 * the time after the press of the frame it was drawn for. The change is read
 * where it happens (a mutation of the path), on the frame's own clock, the one
 * the travel reads: a reader on its own frame callback sees a frame's line only
 * if it happens to run after the travel's, so on a slow host it read each line
 * a frame late (at ~75 ms frames the old curve read 0.14 at 40 ms).
 */
async function filmLine(page: Page): Promise<void> {
    await editorSvg(page).evaluate((svg) => {
        const path = svg.querySelector("path.spline-path")!;
        const w = window as unknown as { __film: { at: number; d: string }[]; __pressAt: number };
        w.__film = [{ at: -1, d: path.getAttribute("d")! }];
        w.__pressAt = NaN;
        document.addEventListener("click", () => (w.__pressAt = performance.now()), { capture: true, once: true });
        const seen = new MutationObserver(() => {
            if (Number.isNaN(w.__pressAt)) return;
            const frame = Number(document.timeline.currentTime ?? performance.now());
            w.__film.push({ at: frame - w.__pressAt, d: path.getAttribute("d")! });
        });
        seen.observe(path, { attributes: true, attributeFilter: ["d"] });
        setTimeout(() => seen.disconnect(), 5000);
    });
}

/**
 * Each filmed frame's progress toward the landed line (0 at the press, 1 landed).
 *
 * A frame's line is sampled at 400 points, and each point is read against the
 * landed line's SEGMENTS (the line sampled at 4000 points, closed), not its
 * sample points: against 400 points the reading's floor was half their
 * spacing, which held a line that had all but landed at 0.64 of its way until
 * the landing frame, so "moving" counted landed frames and "landed by 300 ms"
 * passed only on the final path string. Against segments the floor is the
 * chord's sagitta, far under a pixel.
 */
async function progress(page: Page): Promise<{ at: number; p: number }[]> {
    return editorSvg(page).evaluate((svg) => {
        const w = window as unknown as { __film: { at: number; d: string }[] };
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
        svg.appendChild(probe);
        const sample = (d: string, n: number) => {
            probe.setAttribute("d", d);
            const len = probe.getTotalLength();
            return Array.from({ length: n }, (_, i) => probe.getPointAtLength((i / n) * len));
        };
        /** Squared distance from p to the segment ab. */
        const toSegment = (p: DOMPoint, a: DOMPoint, b: DOMPoint) => {
            const vx = b.x - a.x;
            const vy = b.y - a.y;
            const l2 = vx * vx + vy * vy;
            const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / l2)) : 0;
            return (p.x - a.x - t * vx) ** 2 + (p.y - a.y - t * vy) ** 2;
        };
        /** The largest distance from a point of `a` to the closed line through `b`. */
        const gap = (a: DOMPoint[], b: DOMPoint[]) => {
            let worst = 0;
            for (const p of a) {
                let best = Infinity;
                for (let i = 0; i < b.length; i++) best = Math.min(best, toSegment(p, b[i]!, b[(i + 1) % b.length]!));
                worst = Math.max(worst, best);
            }
            return Math.sqrt(worst);
        };
        const film = w.__film;
        const end = sample(film.at(-1)!.d, 4000);
        const start = gap(sample(film[0]!.d, 400), end);
        const out = film.slice(1).map((f) => ({ at: Math.round(f.at), p: 1 - gap(sample(f.d, 400), end) / start }));
        probe.remove();
        return out;
    });
}

/** Drag the line, then Undo, filming the line from the press. */
async function filmUndo(page: Page): Promise<{ at: number; p: number }[]> {
    await openEditor(page);
    await dragFrom(page, await linePoint(page, 0.2), 40, 32);
    const undo = page.locator(".controls-overlay").last().getByRole("button", { name: "Undo", exact: true });
    await expect(undo).toBeEnabled();
    await page.waitForTimeout(500);
    await filmLine(page);
    await undo.click();
    await page.waitForTimeout(1200);
    const film = await progress(page);
    test.info().annotations.push({ type: "undo-film", description: JSON.stringify(film.filter((f) => f.at > 0).slice(0, 40)) });
    return film;
}

/**
 * The line's progress at a moment, read between the two frames around it (the
 * press itself is 0). The film holds the path's changes, so after its last
 * change the line stands as that frame drew it.
 */
function progressAt(film: { at: number; p: number }[], ms: number): number {
    const frames = [{ at: 0, p: 0 }, ...film.filter((f) => f.at > 0)];
    const after = frames.findIndex((f) => f.at >= ms);
    if (after < 0) return frames.at(-1)!.p;
    const b = frames[after]!;
    const a = frames[Math.max(0, after - 1)]!;
    return b.at === a.at ? b.p : a.p + ((b.p - a.p) * (ms - a.at)) / (b.at - a.at);
}

for (const scheme of ["dark", "light"] as const) {
    test.describe(`Undo travels (1440, ${scheme})`, () => {
        test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: scheme });
        test.setTimeout(120_000);

        test("answers within 100 ms, carries no jump in its first frames, lands within 300 ms", async ({ page }) => {
            const film = await filmUndo(page);
            // The first frames after the press: a start, never half the way. A
            // dropped frame under load must not make "by 40 ms" the ~73 ms frame,
            // so each moment is read between the frames around it.
            expect(progressAt(film, 40), `the line's share of its way by 40 ms ${JSON.stringify(film.slice(0, 6))}`).toBeLessThanOrEqual(0.25);
            // The press is answered within 100 ms.
            expect(progressAt(film, 100), "the line has visibly moved by 100 ms").toBeGreaterThanOrEqual(0.08);
            // It lands within 300 ms.
            expect(progressAt(film, 300), "landed by 300 ms").toBeGreaterThanOrEqual(0.98);
        });
    });

    // The frame count, on the Mac's GPU (the header: in software each of the
    // travel's frames costs three to six idle frames to paint).
    test.describe(`Undo travels on the GPU (1440, ${scheme})`, { tag: "@gpu" }, () => {
        test.beforeAll(async ({ browser }) => {
            await expectHardwareGpu(browser);
        });
        test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: scheme });
        test.setTimeout(120_000);

        test("several frames carry it, and it lands within 300 ms", async ({ page }) => {
            const film = await filmUndo(page);
            const moving = film.filter((f) => f.p > 0.02 && f.p < 0.98);
            expect(moving.length, `frames between the press and the landing ${JSON.stringify(film.slice(0, 40))}`).toBeGreaterThanOrEqual(8);
            expect(progressAt(film, 40), "the line's share of its way by 40 ms").toBeLessThanOrEqual(0.25);
            expect(progressAt(film, 100), "the line has visibly moved by 100 ms").toBeGreaterThanOrEqual(0.08);
            expect(progressAt(film, 300), "landed by 300 ms").toBeGreaterThanOrEqual(0.98);
        });
    });
}
