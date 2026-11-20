import { expect, type Locator, type Page } from "@playwright/test";

/**
 * The contour editor mounts only the handles near the pointer (about a dozen,
 * never one per sample), so a spec finds a point on the curve from the drawn
 * line itself: `getPointAtLength` on `path.spline-path`, mapped to the
 * viewport through the path's own screen transform.
 */

/** The editing surface that is shown (the stage's, or the takeover's). */
export function editorSvg(page: Page, root = ".canvas-stage > .editor-shell:not(.is-hidden)"): Locator {
    return page.locator(`${root} svg.editor-svg`);
}

/** Wait until the editor shows its line. */
export async function editorReady(page: Page, root?: string): Promise<Locator> {
    const svg = editorSvg(page, root);
    await expect(svg).toBeVisible();
    await expect(svg.locator("path.spline-path")).toBeVisible();
    return svg;
}

/** The viewport point at fraction `u` (0..1) of the way round the drawn line. */
export async function linePoint(page: Page, u: number, root?: string): Promise<{ x: number; y: number }> {
    return editorSvg(page, root)
        .locator("path.spline-path")
        .evaluate((el, f) => {
            const path = el as SVGPathElement;
            const at = path.getPointAtLength(((f % 1) + 1) % 1 * path.getTotalLength());
            const m = path.getScreenCTM()!;
            return { x: at.x * m.a + at.y * m.c + m.e, y: at.x * m.b + at.y * m.d + m.f };
        }, u);
}

/** The curve's point count, read off the drawn line (one cubic per point once it rests). */
export async function linePointCount(page: Page, root?: string): Promise<number> {
    const d = (await editorSvg(page, root).locator("path.spline-path").getAttribute("d")) ?? "";
    return (d.match(/C/g) ?? []).length;
}

/** Press at `at` and drag by (dx, dy) with the mouse: a real edit when `at` is on the line. */
export async function dragFrom(page: Page, at: { x: number; y: number }, dx = 12, dy = 9): Promise<void> {
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
    await page.mouse.move(at.x + dx, at.y + dy, { steps: 4 });
    await page.mouse.up();
}
