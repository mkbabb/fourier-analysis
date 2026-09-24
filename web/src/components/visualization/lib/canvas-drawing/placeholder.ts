import type { CanvasSurface } from "./types";

/**
 * The stage canvas with nothing to draw yet.
 *
 * X.F.W14U.vstage — UIA-F-73 ⊕ F-237. It painted two things that were not
 * its to say. With no image, a 40 px grid under the page's own grid (two grids
 * at two pitches). While an image computed, a dashed 280×100 box with an upload
 * arrow and a faint "Computing..." at a fixed grey, which read as "drop here"
 * while nothing was uploading. The stage's DOM owns both states now: the drop
 * target with no image, and a `role="status"` busy mark while computing
 * (`VisualizationView.vue`). The canvas paints the plot grid only once there is
 * an image for it to belong to.
 */
export function drawPlaceholder(surface: CanvasSurface, hasImage: boolean): void {
    const { ctx, width, height } = surface;
    ctx.clearRect(0, 0, width, height);
    if (!hasImage) return;

    ctx.strokeStyle = "rgba(150, 150, 150, 0.07)";
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = step; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = step; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}
