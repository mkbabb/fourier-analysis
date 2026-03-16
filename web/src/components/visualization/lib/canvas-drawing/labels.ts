import type { CanvasSurface } from "./types";
import { basisDisplay } from "../basis-display";
import type { LabelHitRegion } from "../../composables/useCanvasHover";
import { VIZ_COLORS } from "@/lib/colors";
import { goldenShimmerAlpha, applyGoldenShimmer, clearShimmer } from "@/lib/golden-shimmer";

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

    const xBase = 16;
    ctx.textAlign = "left";
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
        const labelShimmer = isHovered ? goldenShimmerAlpha() : 0;

        ctx.fillStyle = isHovered ? VIZ_COLORS.golden : cfg.color;
        ctx.globalAlpha = isHovered ? labelShimmer : 0.9;
        if (isHovered) {
            // Use fill-based shimmer (not stroke), so apply shadow manually
            applyGoldenShimmer(ctx, { hovered: true, baseWidth: 0, hoverWidth: 0, hoverBlur: 5 });
        }

        // Draw icon — fourier ℱ is slightly larger
        const isFourier = basisName === "fourier";
        const iconSize = isFourier ? 30 : 22;
        const iconYAdj = isFourier ? 8 : 2;
        ctx.font = `bold ${iconSize}px 'Computer Modern Serif', Georgia, serif`;
        const iconW = ctx.measureText(cfg.icon).width;
        ctx.fillText(cfg.icon, xBase, yOff - iconYAdj);

        // Draw mode label
        ctx.font = "bold 16px 'Fira Code', monospace";
        ctx.fillText(` ${modeLabel}`, xBase + iconW, yOff);

        clearShimmer(ctx);

        // Store hit region — uniform row height for all bases
        const labelW = ctx.measureText(` ${modeLabel}`).width;
        const totalW = iconW + labelW;
        const rowH = 26;
        hitRegions.push({ key: basisKey, x: xBase, y: yOff - iconYAdj, w: totalW + 8, h: rowH });
        yOff += 26;
    }

    // N count as another legend row
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(150, 150, 150, 0.7)";
    ctx.font = "bold 16px 'Fira Code', monospace";
    ctx.textBaseline = "top";
    ctx.fillText(levelText, xBase, yOff - 4);

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

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = VIZ_COLORS.fourier;
    ctx.globalAlpha = 0.9;
    ctx.font = "bold 44px 'Computer Modern Serif', Georgia, serif";
    const iconW = ctx.measureText("\u2131").width;
    ctx.fillText("\u2131", 16, 2);
    ctx.font = "bold 16px 'Fira Code', monospace";
    ctx.fillText(" Epicycles", 16 + iconW, 16);

    // t value tight below the label
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(150, 150, 150, 0.7)";
    ctx.font = "bold 16px 'Fira Code', monospace";
    ctx.textBaseline = "top";
    ctx.fillText(`t = ${tValue.toFixed(2)}`, 16, 40);
}
