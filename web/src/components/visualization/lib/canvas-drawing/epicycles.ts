import type { BasisComponent } from "@/lib/types";
import type { CanvasSurface, ViewTransform } from "./types";
import { spectrumColor } from "./transforms";
import { fourierPositionsAt } from "@/lib/bases";
import { VIZ_COLORS, hexToRgba } from "@/lib/colors";

export const BASE_EPICYCLE_SCALE = 0.38;
export const HOVER_EPICYCLE_SCALE = 0.55;

export interface EpicycleFit {
    fitScale: number;
    bboxCX: number;
    bboxCY: number;
    targetCX: number;
    targetCY: number;
    scaledW: number;
    scaledH: number;
}

export interface EpicycleBbox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/**
 * Compute a stable (time-invariant) bounding box for the epicycle chain
 * by sampling positions across the full animation cycle and taking the union
 * of all circle extents. This gives a tight but stable bound.
 */
export function computeStableEpicycleBbox(
    components: BasisComponent[],
    nVis: number,
    toScreen: (x: number, y: number) => [number, number],
    scale: number,
): EpicycleBbox {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const nSamples = 64;
    for (let s = 0; s <= nSamples; s++) {
        const t = s / nSamples;
        const positions = fourierPositionsAt(components, t, nVis);
        for (let i = 0; i < nVis; i++) {
            const [ccx, ccy] = toScreen(positions[i][0], positions[i][1]);
            const r = components[i].amplitude * scale;
            minX = Math.min(minX, ccx - r);
            minY = Math.min(minY, ccy - r);
            maxX = Math.max(maxX, ccx + r);
            maxY = Math.max(maxY, ccy + r);
        }
    }
    return { minX, minY, maxX, maxY };
}

/**
 * Compute a transform that fits a raw-coordinate bounding box into
 * the bottom-left corner of the canvas. Uses baseFitCenter for positioning
 * if provided (cached between calls), then applies currentEpicycleScale
 * as a multiplier so hover grows from center.
 */
export function computeEpicycleFit(
    bbox: EpicycleBbox,
    surface: CanvasSurface,
    currentScale: number,
    baseFitCenter: { cx: number; cy: number; baseFitScale: number } | null,
): { fit: EpicycleFit; baseFitCenter: { cx: number; cy: number; baseFitScale: number } } | null {
    const { width, height } = surface;
    const bboxW = bbox.maxX - bbox.minX;
    const bboxH = bbox.maxY - bbox.minY;
    if (bboxW <= 0 || bboxH <= 0) return null;

    const pad = 12;

    // Compute the base fit (at BASE_EPICYCLE_SCALE) — this determines the fixed center
    if (!baseFitCenter) {
        const baseRegionW = width * BASE_EPICYCLE_SCALE;
        const baseRegionH = height * BASE_EPICYCLE_SCALE;
        const bfs = Math.min(baseRegionW / bboxW, baseRegionH / bboxH);
        const baseScaledW = bboxW * bfs;
        const baseScaledH = bboxH * bfs;
        baseFitCenter = {
            cx: pad + baseScaledW / 2,
            cy: height - pad - baseScaledH / 2,
            baseFitScale: bfs,
        };
    }

    // Apply hover multiplier: scale around the cached center
    const hoverMul = currentScale / BASE_EPICYCLE_SCALE;
    const fitScale = baseFitCenter.baseFitScale * hoverMul;
    const scaledW = bboxW * fitScale;
    const scaledH = bboxH * fitScale;

    return {
        fit: {
            fitScale,
            bboxCX: (bbox.minX + bbox.maxX) / 2,
            bboxCY: (bbox.minY + bbox.maxY) / 2,
            targetCX: baseFitCenter.cx,
            targetCY: baseFitCenter.cy,
            scaledW,
            scaledH,
        },
        baseFitCenter,
    };
}

/** Check if mouse is within the actual rendered epicycle bounding box. */
export function isMouseInEpicycleBounds(
    mouseX: number,
    mouseY: number,
    bounds: { x: number; y: number; w: number; h: number },
): boolean {
    if (mouseX < 0 || mouseY < 0) return false;
    const pad = 16;
    return mouseX >= bounds.x - pad &&
           mouseX <= bounds.x + bounds.w + pad &&
           mouseY >= bounds.y - pad &&
           mouseY <= bounds.y + bounds.h + pad;
}

/** Get epicycle alpha from current scale for hover effect. */
export function epicycleAlphaFromScale(currentScale: number): number {
    const hoverT = (currentScale - BASE_EPICYCLE_SCALE) / (HOVER_EPICYCLE_SCALE - BASE_EPICYCLE_SCALE);
    return 0.65 + 0.35 * Math.max(0, Math.min(1, hoverT));
}

/**
 * Draw epicycle circles, arms, center dots, and endpoint dots.
 * Uses bbox-fitting transform when fit is provided (desktop).
 */
export function drawEpicycleCircles(
    surface: CanvasSurface,
    view: ViewTransform,
    visPositions: [number, number][],
    components: BasisComponent[],
    nVis: number,
    fit: EpicycleFit | null,
    epicycleAlpha: number,
    lineWidths: { circle: number; arm: number },
    colorOverride?: string | null,
): void {
    const { ctx } = surface;
    const { toScreen, scale } = view;

    ctx.save();
    if (fit) {
        ctx.translate(fit.targetCX, fit.targetCY);
        ctx.scale(fit.fitScale, fit.fitScale);
        ctx.translate(-fit.bboxCX, -fit.bboxCY);
    }

    for (let i = 0; i < nVis; i++) {
        const [ccx, ccy] = toScreen(visPositions[i][0], visPositions[i][1]);
        const [tx, ty] = toScreen(visPositions[i + 1][0], visPositions[i + 1][1]);
        const r = components[i].amplitude * scale;
        const color = colorOverride ?? spectrumColor(i, nVis);

        // Circle
        ctx.beginPath();
        ctx.arc(ccx, ccy, r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.5 * epicycleAlpha;
        ctx.lineWidth = lineWidths.circle;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Arm
        ctx.beginPath();
        ctx.moveTo(ccx, ccy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.75 * epicycleAlpha;
        ctx.lineWidth = lineWidths.arm;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Center dot
        ctx.beginPath();
        ctx.arc(ccx, ccy, Math.max(r * 0.1, 5.5), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.75 * epicycleAlpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Endpoint dot
        ctx.beginPath();
        ctx.arc(tx, ty, Math.max(r * 0.08, 4.5), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6 * epicycleAlpha;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    ctx.restore();
}

/** Draw the dashed connecting line from the epicycle tip to the trace position. */
export function drawConnectingLine(
    surface: CanvasSurface,
    view: ViewTransform,
    visPositions: [number, number][],
    tipX: number,
    tipY: number,
    fit: EpicycleFit,
    epicycleAlpha: number,
): void {
    const { ctx } = surface;
    const { toScreen } = view;

    const visTip = visPositions[visPositions.length - 1];
    const [rawX, rawY] = toScreen(visTip[0], visTip[1]);

    const tipSx = fit.targetCX + (rawX - fit.bboxCX) * fit.fitScale;
    const tipSy = fit.targetCY + (rawY - fit.bboxCY) * fit.fitScale;
    const [traceSx, traceSy] = toScreen(tipX, tipY);

    ctx.beginPath();
    ctx.moveTo(tipSx, tipSy);
    ctx.lineTo(traceSx, traceSy);
    ctx.strokeStyle = hexToRgba(VIZ_COLORS.fourier, 0.25);
    ctx.globalAlpha = epicycleAlpha;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
}

/** Draw the tip dot and glow at the trace position. */
export function drawTipDot(
    surface: CanvasSurface,
    view: ViewTransform,
    tipX: number,
    tipY: number,
): void {
    const { ctx } = surface;
    const { toScreen } = view;
    const [sx, sy] = toScreen(tipX, tipY);

    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fillStyle = VIZ_COLORS.fourier;
    ctx.fill();

    // Glow
    ctx.beginPath();
    ctx.arc(sx, sy, 15, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(VIZ_COLORS.fourier, 0.15);
    ctx.fill();
}
