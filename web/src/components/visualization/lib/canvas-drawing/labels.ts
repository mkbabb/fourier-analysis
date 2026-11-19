import type { CanvasSurface } from "@/components/shared/canvas/useCanvasSetup";
import { basisDisplay } from "../basis-display";
import type { LabelHitRegion } from "../../composables/useCanvasHover";
import { basisModeLabel, normalizeBasisKey } from "@/lib/basis";

export interface LabelDrawResult {
    hitRegions: LabelHitRegion[];
}

/**
 * The stage's inks, read from its cascade when the stage is sized or the theme
 * changes (LAST-TEN F-04: they were three `getComputedStyle` reads per frame,
 * each a forced style recalculation while the docks animate). An empty value
 * keeps the canvas's fallback.
 */
export interface StageInks {
    /** `--foreground`: the original outline. */
    foreground: string;
    /** `--muted-foreground`: the legend's caption. */
    muted: string;
    /** `--font-text`: the legend's title face. */
    textFace: string;
}

/**
 * X-DS DS-F4R-C5: the count under a legend is a CAPTION, not a second
 * heading: regular weight, a step under the 16 px title, in the theme's
 * `--muted-foreground` (it was a literal grey, the one canvas ink off the
 * tokens, and bold at the title's size).
 */
const CAPTION_FONT = "400 13px 'Fira Code', monospace";
function setCaptionInk(ctx: CanvasRenderingContext2D, inks: StageInks): void {
    // The grey stays only as the fallback a canvas keeps if the token's
    // computed colour does not parse.
    ctx.fillStyle = "rgba(150, 150, 150, 0.7)";
    if (inks.muted) ctx.fillStyle = inks.muted;
}

/**
 * X-DS DS-F3C-C2: a legend's TITLE is the basis name, so it is set in the
 * text face its chooser chip resolves to (`--font-text`); mono stays on the
 * count caption only.
 */
const TEXT_FACE_FALLBACK = "'Computer Modern Serif', Georgia, serif";
function titleFont(inks: StageInks): string {
    return `bold 16px ${inks.textFace || TEXT_FACE_FALLBACK}`;
}

/**
 * Draw basis name labels in the top-left corner; a hovered label is its own
 * hue at full strength against dimmed siblings (X-DS pass 1 · F1-05).
 */
export function drawBasisLabels(
    surface: CanvasSurface,
    activeBases: string[],
    levelText: string,
    hoveredBasis: string | null,
    top = 16,
    /** X-DS pass 8 · DS-F10-C2: the stage's `--stage-inset-inline`, the edge
     *  the epicycle inset shares. */
    left = 16,
    inks: StageInks = { foreground: "", muted: "", textFace: "" },
    /** The legend's fade, 0..1 (it rides the layer it names). */
    alpha = 1,
): LabelDrawResult {
    // X.F.W4 · G-F4-VUE-TSC-CLEAN — `width`/`height` were destructured and
    // never read here or in `drawEpicycleLabel`: both routines anchor to the
    // TOP-LEFT (`xBase = 16`, `yOff` from 16), so neither ever needed the
    // surface extent. They were four of the tree's `noUnusedLocals` violations,
    // and they are deleted rather than voided — a destructure that exists to be
    // ignored is a claim about the drawing model that is not true.
    const { ctx } = surface;
    const hitRegions: LabelHitRegion[] = [];

    const xBase = left;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    // X.F.W14V.u4 — UIA-F-239: the legend's first row starts at `top`, the
    // stage's `--legend-inset-top` (below the expanded dock where the dock
    // spans the stage, at the default 16 px elsewhere).
    let yOff = top;

    for (const basisKey of activeBases) {
        // X.F.W3 `.e` / `fr-BasisSelector M-10` — the canvas spelling of the
        // key->family bridge and of the mode-label ladder, both retired onto
        // `lib/basis.ts`. The bridge was authored 7× tree-wide and the ladder 4×.
        const basisName = normalizeBasisKey(basisKey);
        const cfg = basisDisplay[basisName];
        if (!cfg) continue;
        const modeLabel = basisModeLabel(basisKey, cfg.label);

        const isHovered = hoveredBasis === basisKey;

        ctx.fillStyle = cfg.color;
        ctx.globalAlpha = (isHovered ? 1 : hoveredBasis ? 0.45 : 0.9) * alpha;

        // Draw icon — fourier ℱ is slightly larger
        const isFourier = basisName === "fourier";
        const iconSize = isFourier ? 30 : 22;
        const iconYAdj = isFourier ? 8 : 2;
        ctx.font = `bold ${iconSize}px 'Computer Modern Serif', Georgia, serif`;
        const iconW = ctx.measureText(cfg.icon).width;
        ctx.fillText(cfg.icon, xBase, yOff - iconYAdj);

        // Draw mode label, in the text face (DS-F3C-C2)
        ctx.font = titleFont(inks);
        ctx.fillText(` ${modeLabel}`, xBase + iconW, yOff);

        ctx.globalAlpha = 1;

        // Store hit region — uniform row height for all bases
        const labelW = ctx.measureText(` ${modeLabel}`).width;
        const totalW = iconW + labelW;
        const rowH = 26;
        hitRegions.push({ key: basisKey, x: xBase, y: yOff - iconYAdj, w: totalW + 8, h: rowH });
        yOff += 26;
    }

    // N count: the legend's caption line, under the title rows (DS-F4R-C5).
    ctx.globalAlpha = alpha;
    setCaptionInk(ctx, inks);
    ctx.font = CAPTION_FONT;
    ctx.textBaseline = "top";
    ctx.fillText(levelText, xBase, yOff - 4);
    ctx.globalAlpha = 1;

    return { hitRegions };
}
