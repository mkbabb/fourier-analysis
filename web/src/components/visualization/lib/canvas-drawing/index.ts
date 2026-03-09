export type { CanvasSurface, ViewTransform } from "./types";
export { spectrumColor, getPathBounds } from "./transforms";
export { drawGrid } from "./grid";
export { drawGhostPath } from "./ghost-path";
export { TrailManager } from "./trail";
export {
    BASE_EPICYCLE_SCALE,
    HOVER_EPICYCLE_SCALE,
    computeStableEpicycleBbox,
    computeEpicycleFit,
    isMouseInEpicycleBounds,
    epicycleAlphaFromScale,
    drawEpicycleCircles,
    drawConnectingLine,
    drawTipDot,
} from "./epicycles";
export type { EpicycleFit, EpicycleBbox } from "./epicycles";
export { drawBasisLabels, drawEpicycleLabel } from "./labels";
export type { LabelDrawResult } from "./labels";
export { drawPlaceholder } from "./placeholder";
