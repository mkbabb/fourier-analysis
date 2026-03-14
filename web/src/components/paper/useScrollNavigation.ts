import { reactive, nextTick } from "vue";
import type { Ref } from "vue";

export interface ScrollNavigationOptions {
    scrollContainer: Ref<HTMLElement | null>;
    contentStartOffsetPx: Ref<number>;
    activeId: Ref<string | null>;
    ensureTargetWindow: (id: string) => void;
    getOffsetFor: (id: string) => number | null;
    recalculate: () => void;
}

export function useScrollNavigation(opts: ScrollNavigationOptions) {
    const MAX_STACK = 20;
    const MIN_OVERLAY_MS = 40;
    const MAX_CORRECTIONS = 10;
    const STABLE_TARGET = 2;
    const STABILITY_PX = 6;

    const navStack = reactive<string[]>([]);
    let isBackNavigation = false;

    function getScrollOffset(): number {
        const bar = document.querySelector(".floating-toc-bar") as HTMLElement | null;
        return bar ? bar.offsetHeight + 8 : 16;
    }

    /**
     * Compute the absolute scroll target for a section. Prefers real DOM position
     * when the element is mounted, falls back to layout estimate.
     */
    function computeAbsoluteTop(
        scroller: HTMLElement,
        id: string,
    ): number | null {
        const layoutOffset = opts.getOffsetFor(id);
        if (layoutOffset == null) return null;

        const el = document.getElementById(id);
        const rawTop = el
            ? el.getBoundingClientRect().top -
              scroller.getBoundingClientRect().top +
              scroller.scrollTop
            : opts.contentStartOffsetPx.value + layoutOffset;

        return Math.max(0, rawTop - getScrollOffset());
    }

    /**
     * Fast layout-only estimate — no DOM query, works even when target
     * section isn't mounted. Used to decide teleport vs smooth and to
     * provide the initial teleport scroll position.
     */
    function estimateAbsoluteTop(id: string): number | null {
        const layoutOffset = opts.getOffsetFor(id);
        if (layoutOffset == null) return null;
        return Math.max(
            0,
            opts.contentStartOffsetPx.value + layoutOffset - getScrollOffset(),
        );
    }

    function teleportThreshold(scroller: HTMLElement): number {
        return Math.max(scroller.clientHeight * 1.5, 1200);
    }

    // ── Teleport overlay ─────────────────────────────────────

    function withOverlay(
        scroller: HTMLElement,
        run: (finish: () => void) => void,
    ) {
        const overlay = scroller.querySelector(
            ".teleport-overlay",
        ) as HTMLElement | null;
        if (!overlay) {
            run(() => opts.recalculate());
            return;
        }

        let finished = false;
        const shownAt = performance.now();

        const finish = () => {
            if (finished) return;
            finished = true;
            const hide = () => {
                opts.recalculate();
                requestAnimationFrame(() => {
                    overlay.style.opacity = "0";
                    overlay.style.pointerEvents = "none";
                });
            };
            const remaining = Math.max(
                0,
                MIN_OVERLAY_MS - (performance.now() - shownAt),
            );
            if (remaining === 0) hide();
            else setTimeout(hide, remaining);
        };

        overlay.style.pointerEvents = "auto";
        overlay.style.opacity = "1";

        // One frame for the browser to paint the overlay, then run
        requestAnimationFrame(() => run(finish));
    }

    // ── Teleport (far jump) ──────────────────────────────────

    /**
     * Immediately scrolls to `initialTop` behind the overlay, then mounts
     * the target section and runs a correction loop until stable.
     */
    function teleportTo(
        scroller: HTMLElement,
        id: string,
        initialTop: number,
    ) {
        withOverlay(scroller, (finish) => {
            // 1. Scroll to the layout estimate immediately (behind overlay)
            scroller.scrollTo({ top: initialTop, behavior: "instant" as ScrollBehavior });

            // 2. Now mount the target section — Vue will process this during
            //    the microtask queue, so the DOM updates before our next rAF.
            opts.ensureTargetWindow(id);

            // 3. Correction loop: refine position as sections mount & get measured
            let lastTop = initialTop;
            let stableFrames = 0;
            let frames = 0;

            const correct = () => {
                opts.recalculate();
                const top = computeAbsoluteTop(scroller, id);
                if (top == null) {
                    // Section not in layout yet — unlikely but retry
                    if (frames++ < 20) requestAnimationFrame(correct);
                    else finish();
                    return;
                }

                scroller.scrollTo({ top, behavior: "instant" as ScrollBehavior });

                if (Math.abs(top - lastTop) < STABILITY_PX) {
                    stableFrames++;
                } else {
                    stableFrames = 0;
                }
                lastTop = top;

                if (
                    stableFrames >= STABLE_TARGET ||
                    frames++ >= MAX_CORRECTIONS
                ) {
                    finish();
                    return;
                }
                requestAnimationFrame(correct);
            };

            // Wait one frame for Vue's DOM patch from ensureTargetWindow
            requestAnimationFrame(correct);
        });
    }

    // ── Main navigation entry point ──────────────────────────

    function performScroll(id: string) {
        const scroller = opts.scrollContainer.value;
        if (!scroller) return;

        // Compute estimated position from layout (pure math, < 1ms)
        const estimated = estimateAbsoluteTop(id);
        if (estimated == null) {
            // Unknown section — mount and hope
            opts.ensureTargetWindow(id);
            return;
        }

        const distance = Math.abs(estimated - scroller.scrollTop);

        if (distance < teleportThreshold(scroller)) {
            // Short jump: mount target, wait for DOM, smooth scroll
            opts.ensureTargetWindow(id);
            nextTick(() => {
                requestAnimationFrame(() => {
                    const s = opts.scrollContainer.value;
                    if (!s) return;
                    const top = computeAbsoluteTop(s, id) ?? estimated;
                    s.scrollTo({ top, behavior: "smooth" });
                });
            });
        } else {
            // Far jump: teleport immediately with layout estimate.
            // The overlay shows and scrolls BEFORE mounting heavy sections,
            // eliminating the perceived freeze.
            teleportTo(scroller, id, estimated);
        }
    }

    function navigateTo(id: string) {
        if (
            !isBackNavigation &&
            opts.activeId.value &&
            opts.activeId.value !== id
        ) {
            navStack.push(opts.activeId.value);
            if (navStack.length > MAX_STACK) navStack.shift();
        }
        performScroll(id);
    }

    function navigateBack() {
        if (navStack.length === 0) return;
        isBackNavigation = true;
        const prev = navStack.pop()!;
        performScroll(prev);
        setTimeout(() => {
            isBackNavigation = false;
        }, 500);
    }

    function scrollToTop() {
        const scroller = opts.scrollContainer.value;
        if (!scroller) return;

        if (scroller.scrollTop > teleportThreshold(scroller)) {
            const overlay = scroller.querySelector(
                ".teleport-overlay",
            ) as HTMLElement | null;
            if (!overlay) {
                scroller.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
                return;
            }
            withOverlay(scroller, (finish) => {
                scroller.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
                finish();
            });
            return;
        }
        scroller.scrollTo({ top: 0, behavior: "smooth" });
    }

    return { navigateTo, navigateBack, scrollToTop, navStack };
}
