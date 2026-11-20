import { expect, test, type CDPSession, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";
import { showViewIfTabbed } from "./fixtures/workspace";
import { dragFrom, editorReady, editorSvg, linePoint, linePointCount } from "./fixtures/editor";

/**
 * The curve editor, refined: a finger on the line drags the point its whole
 * travel (the browser never takes the gesture back), two fingers zoom the
 * drawing and never the page, a point is added on the line, a double-tap adds
 * one point, and Undo travels to the earlier line instead of cutting to it.
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

/** The shortest distance from `p` to the drawn line, in CSS pixels. */
async function distanceToLine(page: Page, p: { x: number; y: number }): Promise<number> {
    return editorSvg(page)
        .locator("path.spline-path")
        .evaluate((el, q) => {
            const path = el as SVGPathElement;
            const m = path.getScreenCTM()!;
            const len = path.getTotalLength();
            let best = Infinity;
            for (let i = 0; i < 2000; i++) {
                const a = path.getPointAtLength((i / 2000) * len);
                best = Math.min(best, Math.hypot(a.x * m.a + a.y * m.c + m.e - q.x, a.x * m.b + a.y * m.d + m.f - q.y));
            }
            return best;
        }, p);
}

/** The line's outward normal at fraction `u`, in the viewport (unit length). */
async function normalAt(page: Page, u: number): Promise<{ x: number; y: number }> {
    const a = await linePoint(page, u - 0.002);
    const b = await linePoint(page, u + 0.002);
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: -(b.y - a.y) / l, y: (b.x - a.x) / l };
}

async function touch(cdp: CDPSession, type: "touchStart" | "touchMove" | "touchEnd", pts: { x: number; y: number }[]): Promise<void> {
    await cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map((p, id) => ({ x: p.x, y: p.y, id })) });
}

/** Count the surface's pointercancel events from now on. */
async function watchCancels(page: Page): Promise<() => Promise<number>> {
    await editorSvg(page).evaluate((svg) => {
        const w = window as unknown as { __cancels: number };
        w.__cancels = 0;
        svg.addEventListener("pointercancel", () => w.__cancels++);
    });
    return () => page.evaluate(() => (window as unknown as { __cancels: number }).__cancels);
}

test.describe("o41 stage — the curve editor (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: "dark" });
    test.setTimeout(120_000);

    test("a point added beside the line lands on the line", async ({ page }) => {
        await openEditor(page);
        const u = 0.37;
        const on = await linePoint(page, u);
        const n = await normalAt(page, u);
        const off = { x: on.x + 10 * n.x, y: on.y + 10 * n.y };
        const before = await linePointCount(page);
        const gapBefore = await distanceToLine(page, off);
        await page.mouse.dblclick(off.x, off.y);
        await expect.poll(() => linePointCount(page)).toBe(before + 1);
        await page.waitForTimeout(400);
        // A raw press point would pull the line out to the press (a 10 px kink).
        expect(await distanceToLine(page, off), "the line did not move out to the press").toBeGreaterThan(gapBefore - 2);
    });

    test("Undo travels to the earlier line over several frames", async ({ page }) => {
        await openEditor(page);
        await dragFrom(page, await linePoint(page, 0.2), 30, 24);
        const undo = page.locator(".controls-overlay").last().getByRole("button", { name: "Undo", exact: true });
        await expect(undo).toBeEnabled();
        await page.waitForTimeout(400);
        await editorSvg(page).evaluate((svg) => {
            const path = svg.querySelector("path.spline-path")!;
            const seen: string[] = [];
            let last = path.getAttribute("d");
            const t0 = performance.now();
            const tick = () => {
                const d = path.getAttribute("d");
                if (d !== last) seen.push(d!);
                last = d;
                if (performance.now() - t0 < 900) requestAnimationFrame(tick);
            };
            (window as unknown as { __lines: string[] }).__lines = seen;
            requestAnimationFrame(tick);
        });
        await undo.click();
        await page.waitForTimeout(1000);
        const lines = await page.evaluate(() => (window as unknown as { __lines: string[] }).__lines);
        expect(lines.length, "distinct lines drawn after Undo").toBeGreaterThanOrEqual(4);
        expect(lines.at(-1), "it ends on the line's own spline").toMatch(/C/);
    });
});

/** The curve's own points in viewport px, in order: the end of each of the
 *  line's cubics (the line is one Catmull-Rom cubic per point, so each ends on
 *  a point, and a drag keeps the count and the order). */
async function curvePoints(page: Page): Promise<{ x: number; y: number }[]> {
    return editorSvg(page)
        .locator("path.spline-path")
        .evaluate((el) => {
            const path = el as SVGPathElement;
            const m = path.getScreenCTM()!;
            const num = "(-?[\\d.]+(?:e[-+]?\\d+)?)";
            const re = new RegExp(`C${num},${num} ${num},${num} ${num},${num}`, "gi");
            const out: { x: number; y: number }[] = [];
            for (const c of (path.getAttribute("d") ?? "").matchAll(re)) {
                const x = Number(c[5]);
                const y = Number(c[6]);
                out.push({ x: x * m.a + y * m.c + m.e, y: x * m.b + y * m.d + m.f });
            }
            return out;
        });
}

test.describe("o41 stage — the Magnet and the handles (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: "dark" });
    test.setTimeout(120_000);

    test("a drag bends the line over the Magnet's reach: the bend is 96 px wide at half its height", async ({ page }) => {
        await openEditor(page);
        const before = await curvePoints(page);
        const u = 0.37;
        const at = await linePoint(page, u);
        const n = await normalAt(page, u);
        // Read mid-drag, with the press held: the bend the Magnet makes, before
        // the release commits the curve.
        await page.mouse.move(at.x, at.y);
        await page.mouse.down();
        await page.mouse.move(at.x + 24 * n.x, at.y + 24 * n.y, { steps: 6 });
        await page.waitForTimeout(300);
        const after = await curvePoints(page);
        await page.mouse.up();
        const N = before.length;
        expect(after.length, "a drag keeps the curve's points").toBe(N);
        // How far each point moved, and the old curve's arc length to each.
        const moved = before.map((p, i) => Math.hypot(after[i]!.x - p.x, after[i]!.y - p.y));
        const peak = moved.indexOf(Math.max(...moved));
        const half = moved[peak]! / 2;
        const at_ = (i: number) => ((i % N) + N) % N;
        const step = (i: number) => Math.hypot(before[at_(i + 1)]!.x - before[at_(i)]!.x, before[at_(i + 1)]!.y - before[at_(i)]!.y);
        // Walk out each side to where the bend falls under half its height,
        // reading the crossing between the two points that straddle it.
        const side = (dir: 1 | -1) => {
            let along = 0;
            for (let k = 0; k < N / 2; k++) {
                const i = at_(peak + dir * k);
                const j = at_(peak + dir * (k + 1));
                const seg = dir === 1 ? step(i) : step(j);
                if (moved[j]! < half) return along + (seg * (moved[i]! - half)) / (moved[i]! - moved[j]!);
                along += seg;
            }
            return along;
        };
        const width = side(1) + side(-1);
        const read = `peak ${moved[peak]!.toFixed(1)} px, width ${width.toFixed(1)} px`;
        // The point under the press moves the pointer's whole travel.
        expect(moved[peak]!, `the drag moved the line (${read})`).toBeGreaterThan(22);
        // The Magnet's default reach is 96 px along the line each side with a
        // raised-cosine falloff, so its width at half height is 96 px.
        expect(Math.abs(width - 96), `the bend's width at half height (${read})`).toBeLessThanOrEqual(9.6);
    });

    test("under reduced motion a handle fades in 120 ms", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await openEditor(page);
        const at = await linePoint(page, 0.3);
        await page.mouse.move(at.x + 3, at.y + 3, { steps: 3 });
        const handle = editorSvg(page).locator("circle.control-point").first();
        await expect(handle).toBeAttached();
        const t = await handle.evaluate((c) => {
            const s = getComputedStyle(c);
            const props = s.transitionProperty.split(",").map((x) => x.trim());
            const durs = s.transitionDuration.split(",").map((x) => x.trim());
            return durs[props.indexOf("opacity")] ?? "";
        });
        // Producer-held (e2e/producer-held.json, O-308): glass's reduced-motion
        // guard zeroes every transition, this fade included, until it carves
        // opacity out.
        expect(t, "REDUCED-MOTION-CUT: the handle's opacity transition").toBe("0.12s");
    });
});

test.describe("o41 stage — the curve editor under a finger (390, 4x CPU) @coarse", () => {
    test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: "dark" });
    test.setTimeout(150_000);

    test("@coarse one finger on the line drags the point its whole travel", async ({ page }) => {
        await openEditor(page);
        const cdp = await page.context().newCDPSession(page);
        const cancels = await watchCancels(page);
        const u = 0.3;
        const from = await linePoint(page, u);
        const n = await normalAt(page, u);
        // The finger goes 40 px off the line, to whichever side of it is open
        // (a drawing's outline can fold back within 40 px on one side).
        const sides = [1, -1].map((k) => ({ x: from.x + 40 * k * n.x, y: from.y + 40 * k * n.y }));
        const gaps = await Promise.all(sides.map((p) => distanceToLine(page, p)));
        const to = gaps[0]! >= gaps[1]! ? sides[0]! : sides[1]!;
        const gapBefore = Math.max(...gaps);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        try {
            await touch(cdp, "touchStart", [from]);
            for (let i = 1; i <= 15; i++) {
                await touch(cdp, "touchMove", [{ x: from.x + ((to.x - from.x) * i) / 15, y: from.y + ((to.y - from.y) * i) / 15 }]);
            }
            await touch(cdp, "touchEnd", []);
        } finally {
            await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        }
        await page.waitForTimeout(500);
        expect(await cancels(), "the browser never took the drag back").toBe(0);
        expect(gapBefore, "the target was off the line before").toBeGreaterThan(20);
        // The line now passes where the finger let go: the point went the
        // finger's whole 40 px (a cancelled drag followed 16 of 60).
        expect(await distanceToLine(page, to), "the line follows the finger to its end").toBeLessThan(4);
        const undo = page.locator(".controls-overlay").last().getByRole("button", { name: "Undo", exact: true });
        await expect(undo, "the drag was an edit").toBeEnabled();
    });

    test("@coarse two fingers zoom the drawing, never the page", async ({ page }) => {
        await openEditor(page);
        const cdp = await page.context().newCDPSession(page);
        const box = (await editorSvg(page).boundingBox())!;
        const c = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        await touch(cdp, "touchStart", [{ x: c.x - 30, y: c.y }, { x: c.x + 30, y: c.y }]);
        for (let i = 1; i <= 10; i++) {
            await touch(cdp, "touchMove", [{ x: c.x - 30 - 8 * i, y: c.y }, { x: c.x + 30 + 8 * i, y: c.y }]);
        }
        await touch(cdp, "touchEnd", []);
        await page.waitForTimeout(600);
        expect(await page.evaluate(() => window.visualViewport?.scale ?? 1), "the page did not zoom").toBe(1);
        const reset = async () => {
            await page.locator(".controls-overlay").last().getByRole("button", { name: "More editor tools" }).click();
            const row = page.getByRole("menuitem", { name: "Reset view" });
            const enabled = await row.isEnabled();
            await page.keyboard.press("Escape");
            return enabled;
        };
        expect(await reset(), "the drawing zoomed (Reset view is live)").toBe(true);
    });

    test("@coarse a double-tap on the line adds one point", async ({ page }) => {
        await openEditor(page);
        const cdp = await page.context().newCDPSession(page);
        const at = await linePoint(page, 0.55);
        const before = await linePointCount(page);
        for (let i = 0; i < 2; i++) {
            await touch(cdp, "touchStart", [at]);
            await touch(cdp, "touchEnd", []);
            await page.waitForTimeout(90);
        }
        await page.waitForTimeout(600);
        expect(await linePointCount(page), "one point, not two").toBe(before + 1);
    });
});
