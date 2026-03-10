import type { CanvasSurface } from "./types";
import { basisDisplay } from "../basis-display";
import type { LabelHitRegion } from "../../composables/useCanvasHover";
import { VIZ_COLORS, hexToRgba } from "@/lib/colors";

export interface LabelDrawResult {
    hitRegions: LabelHitRegion[];
}

/**
 * Draw basis name labels in the top-right corner with optional shimmer on hover.
 */
export function drawBasisLabels(
    surface: CanvasSurface,
    activeBases: string[],
    levelText: string,
    hoveredBasis: string | null,
): LabelDrawResult {
    const { ctx, width, height } = surface;
    const hitRegions: LabelHitRegion[] = [];

    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    let yOff = 16;

    for (const basisKey of activeBases) {
        const basisName = basisKey.startsWith("fourier") ? "fourier" : basisKey;
        const cfg = basisDisplay[basisName];
        if (!cfg) continue;
        const modeLabel = basisKey === "fourier-epicycles" ? "Epicycles"
            : basisKey === "fourier-series" ? "Series"
            : cfg.label;

        const isHovered = hoveredBasis === basisKey;
        const labelShimmer = isHovered ? 0.85 + 0.15 * Math.sin(performance.now() / 200) : 0;

        ctx.fillStyle = isHovered ? VIZ_COLORS.golden : cfg.color;
        ctx.globalAlpha = isHovered ? labelShimmer : 0.9;
        if (isHovered) {
            ctx.shadowColor = hexToRgba(VIZ_COLORS.golden, labelShimmer * 0.35);
            ctx.shadowBlur = 5;
        }

        // Draw mode label
        ctx.font = "bold 16px 'Fira Code', monospace";
        const labelW = ctx.measureText(` ${modeLabel}`).width;
        ctx.fillText(` ${modeLabel}`, width - 48, yOff);

        // Draw icon — fourier ℱ is slightly larger
        const isFourier = basisName === "fourier";
        const iconSize = isFourier ? 30 : 22;
        const iconYAdj = isFourier ? 8 : 2;
        ctx.font = `bold ${iconSize}px 'Computer Modern Serif', Georgia, serif`;
        const iconW = ctx.measureText(cfg.icon).width;
        ctx.fillText(cfg.icon, width - 48 - labelW, yOff - iconYAdj);

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // Store hit region — uniform row height for all bases
        const totalW = iconW + labelW;
        const rowH = 26;
        hitRegions.push({ key: basisKey, x: width - 48 - totalW, y: yOff - iconYAdj, w: totalW + 8, h: rowH });
        yOff += 26;
    }

    // N count as another legend row — same 24px row spacing as non-fourier items
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(150, 150, 150, 0.7)";
    ctx.font = "bold 16px 'Fira Code', monospace";
    ctx.textBaseline = "top";
    ctx.fillText(levelText, width - 48, yOff - 4);

    return { hitRegions };
}

/**
 * Draw a simple epicycle-only label (single basis, no hit regions needed).
 */
export function drawEpicycleLabel(
    surface: CanvasSurface,
    tValue: number,
): void {
    const { ctx, width, height } = surface;

    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillStyle = VIZ_COLORS.fourier;
    ctx.globalAlpha = 0.9;
    ctx.font = "bold 16px 'Fira Code', monospace";
    const epicLabel = " Epicycles";
    const eLabelW = ctx.measureText(epicLabel).width;
    ctx.fillText(epicLabel, width - 48, 16);
    ctx.font = "bold 44px 'Computer Modern Serif', Georgia, serif";
    ctx.fillText("\u2131", width - 48 - eLabelW, 2);

    // t value tight below the label
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(150, 150, 150, 0.7)";
    ctx.font = "bold 16px 'Fira Code', monospace";
    ctx.textBaseline = "top";
    ctx.fillText(`t = ${tValue.toFixed(2)}`, width - 48, 40);
}
