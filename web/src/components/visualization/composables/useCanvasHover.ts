import { onUnmounted } from "vue";

export interface LabelHitRegion {
    key: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Manages mouse tracking, epicycle hover scale animation (RAF),
 * shimmer RAF loop, label hit-region detection, and cursor management.
 */
export function useCanvasHover(options: {
    baseScale: number;
    hoverScale: number;
    isInEpicycleRegion: () => boolean;
    getContainerEl: () => HTMLElement | undefined;
    onRedraw: () => void;
}) {
    const { baseScale, hoverScale, isInEpicycleRegion, getContainerEl, onRedraw } = options;

    let mouseX = -1;
    let mouseY = -1;
    let currentScale = baseScale;
    let targetScale = baseScale;
    let hoverAnimFrame: number | null = null;

    let hoveredBasis: string | null = null;
    let labelHitRegions: LabelHitRegion[] = [];
    let shimmerRafId: number | null = null;

    function getMousePos(): [number, number] {
        return [mouseX, mouseY];
    }

    function getScale(): number {
        return currentScale;
    }

    function getHoveredBasis(): string | null {
        return hoveredBasis;
    }

    function setLabelHitRegions(regions: LabelHitRegion[]) {
        labelHitRegions = regions;
    }

    // ── Scale animation ──

    function updateHoverScale() {
        const diff = targetScale - currentScale;
        if (Math.abs(diff) < 0.002) {
            currentScale = targetScale;
            hoverAnimFrame = null;
            onRedraw();
            return;
        }
        currentScale += diff * 0.12;
        onRedraw();
        hoverAnimFrame = requestAnimationFrame(updateHoverScale);
    }

    // ── Shimmer loop ──

    function startShimmer() {
        if (shimmerRafId) return;
        function shimmerTick() {
            if (!hoveredBasis) { shimmerRafId = null; return; }
            onRedraw();
            shimmerRafId = requestAnimationFrame(shimmerTick);
        }
        shimmerRafId = requestAnimationFrame(shimmerTick);
    }

    function stopShimmer() {
        if (shimmerRafId) {
            cancelAnimationFrame(shimmerRafId);
            shimmerRafId = null;
        }
    }

    // ── Mouse handlers ──

    function onMouseMove(e: MouseEvent) {
        const el = getContainerEl();
        const rect = el?.getBoundingClientRect();
        if (!rect) return;
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;

        // Epicycle scale hover
        const inRegion = isInEpicycleRegion();
        const newTarget = inRegion ? hoverScale : baseScale;
        if (newTarget !== targetScale) {
            targetScale = newTarget;
            if (!hoverAnimFrame) hoverAnimFrame = requestAnimationFrame(updateHoverScale);
        }

        // Label hover
        let newHovered: string | null = null;
        for (const region of labelHitRegions) {
            if (mouseX >= region.x && mouseX <= region.x + region.w &&
                mouseY >= region.y && mouseY <= region.y + region.h) {
                newHovered = region.key;
                break;
            }
        }
        if (newHovered !== hoveredBasis) {
            hoveredBasis = newHovered;
            if (el) el.style.cursor = hoveredBasis ? "pointer" : "";
            if (hoveredBasis) startShimmer();
            else { stopShimmer(); onRedraw(); }
        }
    }

    function onMouseLeave() {
        mouseX = -1;
        mouseY = -1;
        if (targetScale !== baseScale) {
            targetScale = baseScale;
            if (!hoverAnimFrame) hoverAnimFrame = requestAnimationFrame(updateHoverScale);
        }
        if (hoveredBasis) {
            hoveredBasis = null;
            const el = getContainerEl();
            if (el) el.style.cursor = "";
            onRedraw();
        }
    }

    function cleanup() {
        if (hoverAnimFrame) cancelAnimationFrame(hoverAnimFrame);
        stopShimmer();
    }

    onUnmounted(cleanup);

    return {
        getMousePos,
        getScale,
        getHoveredBasis,
        setLabelHitRegions,
        onMouseMove,
        onMouseLeave,
        cleanup,
    };
}
