import { onUnmounted } from "vue";

/**
 * X.F.W4 · SP-4 — `prefers-reduced-motion`, read LIVE at every call.
 *
 * ⊘ FR-AH-6 (*"one predicate, one home"*) — further copies live at
 * `useWorkspaceLoader.ts`, `composables/useFourierMorph.ts` and
 * `router/index.ts`. WHICH home survives is F.W5's rider; the predicate lives
 * with the clock it gates and every site carries this note, so the collapse is
 * one move whenever the ruling lands. It is a function, never a captured
 * boolean: the preference can change mid-session, and a value read once at
 * module scope is a gate that silently stops being one.
 */
function prefersReducedMotion(): boolean {
    return (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
    );
}

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

    /**
     * X.F.W4 · SP-4 (G-F4-PRM-CLOCK) — two of the app's five ungated JS clocks
     * were in this file: the hover-scale easing loop and the shimmer loop.
     *
     * ⊘ M-D1's TERMINAL-FRAME LAW governs both arms. Gating the loop by
     * returning early would leave `currentScale` mid-ease — the epicycle
     * cluster stuck at whatever fraction of the hover scale the last tick
     * happened to land on — which is the "freeze at t = 0" failure in its
     * general form. The reduced arm therefore SNAPS to the terminal value and
     * redraws once: the hover state is fully expressed, it simply is not
     * animated into.
     */
    function updateHoverScale() {
        if (prefersReducedMotion()) {
            currentScale = targetScale;
            hoverAnimFrame = null;
            onRedraw();
            return;
        }
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

    /**
     * The shimmer is pure decoration — a per-frame repaint of a label that is
     * already fully legible without it — so its reduced arm is the honest one:
     * draw the hovered state once, and do not start a clock. There is no
     * terminal frame to seed here because the terminal frame IS the static
     * hovered label.
     */
    function startShimmer() {
        if (shimmerRafId) return;
        if (prefersReducedMotion()) {
            onRedraw();
            return;
        }
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

    // ── Touch / click toggle for mobile ──

    let pinnedBasis: string | null = null;

    function onClick(e: MouseEvent | TouchEvent) {
        const el = getContainerEl();
        const rect = el?.getBoundingClientRect();
        if (!rect) return;

        let cx: number, cy: number;
        if ("touches" in e) {
            const t = e.changedTouches[0];
            cx = t.clientX - rect.left;
            cy = t.clientY - rect.top;
        } else {
            cx = e.clientX - rect.left;
            cy = e.clientY - rect.top;
        }

        // Check if tap/click hit a label region
        let tapped: string | null = null;
        for (const region of labelHitRegions) {
            if (cx >= region.x && cx <= region.x + region.w &&
                cy >= region.y && cy <= region.y + region.h) {
                tapped = region.key;
                break;
            }
        }

        if (tapped) {
            // Toggle: if already pinned to this basis, unpin; otherwise pin
            if (pinnedBasis === tapped) {
                pinnedBasis = null;
                hoveredBasis = null;
                stopShimmer();
                onRedraw();
            } else {
                pinnedBasis = tapped;
                hoveredBasis = tapped;
                startShimmer();
            }
        } else {
            // Tap outside labels: clear pin
            if (pinnedBasis) {
                pinnedBasis = null;
                hoveredBasis = null;
                stopShimmer();
                onRedraw();
            }
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
        onClick,
        cleanup,
    };
}
