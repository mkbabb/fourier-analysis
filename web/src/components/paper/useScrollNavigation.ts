import { reactive, nextTick, onScopeDispose, type Ref } from "vue";

export interface ScrollNavigationOptions {
    scrollContainer: Ref<HTMLElement | null>;
    contentStartOffsetPx: Ref<number>;
    activeId: Ref<string | null>;
    ensureTargetWindow: (id: string) => void;
    getOffsetFor: (id: string) => number | null;
    recalculate: () => void;
}

/**
 * X·F F.W4 `.e` — `PAW-47` under **LAW-4**: ONE clearance authority.
 *
 * The theme authors three `scroll-margin-top` rules (5rem/6rem) that NOTHING
 * consults — no `scrollIntoView` on paper targets, no router `scrollBehavior` —
 * while the app substitutes `rawTop − getScrollOffset()`, whose answer on a
 * desktop landing is **8px** (`C-02`: the global `.floating-toc-bar` query
 * matches an element that is `display:none`-adjacent and boxless, so
 * `offsetHeight` is 0 and the branch returns 0 + 8 rather than the authored
 * 16). Two authorities, neither consuming the other, and every ToC or
 * cross-reference destination landing inside the 32px top edge-fade scrim.
 *
 * There is one authority now and this is it. Its VALUE is a dependent of the
 * `PAW-44` decision (`D4`), which `DECISIONS-F.W4.md` rules
 * DEFERRED-WITH-DEFAULT — *"carry the stack as INERT-BY-MEASUREMENT … author
 * PAW-47's clearance constant ONCE, against the inert geometry"*. Against the
 * inert geometry the only thing to clear is the scrim: `.paper-root::before` is
 * `height: 2rem` (32px). The constant clears it with a small margin, and the
 * mobile bar's measured height is added when that bar is actually painted.
 *
 * ⊘ If `PAW-44` is ever decided RESTORE, this constant is the single place the
 * sticky stack's height has to be accounted for — which is what LAW-4 is for.
 */
const SCRIM_CLEARANCE_PX = 40;

export function useScrollNavigation(opts: ScrollNavigationOptions) {
    const MAX_STACK = 20;
    const MIN_OVERLAY_MS = 200;
    const MAX_CORRECTIONS = 10;
    const STABLE_TARGET = 2;
    const STABILITY_PX = 6;

    const navStack = reactive<string[]>([]);
    let isBackNavigation = false;

    // ── `SP-4` / `PV D/M-1` ⊕ `D/m-16` ⊕ `PS D-M10` — the motion signal ──────
    // Both `scrollTo({behavior:"smooth"})` sites were PRM-ungated, one
    // conditional from correct and fifteen lines from this file's own `instant`
    // idiom; the census credited a "smooth-scroll opt-out" that never existed
    // (that `matchMedia` gates the progress-bar listener alone). And PRM was
    // sampled once at arm time everywhere it WAS read — a preference the user
    // changes mid-session is a signal, not a boot-time constant, so this reads
    // the live `matches` and keeps the listener for anything that caches it.
    const prmQuery =
        typeof window !== "undefined" && typeof window.matchMedia === "function"
            ? window.matchMedia("(prefers-reduced-motion: reduce)")
            : null;

    /** The reduced arm gets the same DESTINATION, arrived at without travel. */
    function scrollBehavior(): ScrollBehavior {
        return prmQuery?.matches ? "instant" : "smooth";
    }

    function getScrollOffset(): number {
        const bar = document.querySelector(".floating-toc-bar") as HTMLElement | null;
        // A boxless (unpainted) bar measures 0 — the `C-02` reading. Only a bar
        // that actually occupies space adds its height to the clearance.
        const barHeight = bar?.offsetHeight ?? 0;
        return SCRIM_CLEARANCE_PX + barHeight;
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

    // ── `L/D2` — every clock this composable starts, it can stop ────────────
    // It owned rAF chains and two timers, exposed no dispose and had no
    // teardown at all; the correct pattern ships in the same package. The
    // handles live here and `onScopeDispose` reaps them, so the composable is
    // self-disposing and its consumer needs no ceremony.
    let correctionRaf = 0;
    let overlayTimer: ReturnType<typeof setTimeout> | undefined;
    let backFlagTimer: ReturnType<typeof setTimeout> | undefined;
    /** `L/D3`: cancels the run currently holding the overlay, if any. */
    let supersedeOverlayRun: (() => void) | null = null;

    function dispose() {
        if (correctionRaf) cancelAnimationFrame(correctionRaf);
        correctionRaf = 0;
        clearTimeout(overlayTimer);
        clearTimeout(backFlagTimer);
        supersedeOverlayRun = null;
    }

    onScopeDispose(dispose);

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

        // `L/D3`: `finished` was per-invocation with no in-flight guard, against
        // SIX user-reachable entry points into `navigateTo` — two jumps in
        // flight ran two correction loops against one scroller, and the first
        // one's `finish` could hide the overlay out from under the second.
        //
        // Serialised by SUPERSESSION, not by refusal: a later jump is the
        // user's latest intent, so it cancels the loop and the hide-timer the
        // earlier one left running and takes the overlay over. Dropping it
        // would trade a visual race for a dead control — the same bargain the
        // rest of this record refuses.
        supersedeOverlayRun?.();

        let finished = false;
        const shownAt = performance.now();
        supersedeOverlayRun = () => {
            finished = true;
            if (correctionRaf) cancelAnimationFrame(correctionRaf);
            correctionRaf = 0;
            clearTimeout(overlayTimer);
        };

        const finish = () => {
            if (finished) return;
            finished = true;
            const hide = () => {
                opts.recalculate();
                requestAnimationFrame(() => {
                    overlay.style.opacity = "0";
                    overlay.style.pointerEvents = "none";
                    supersedeOverlayRun = null;
                });
            };
            const remaining = Math.max(
                0,
                MIN_OVERLAY_MS - (performance.now() - shownAt),
            );
            if (remaining === 0) hide();
            else overlayTimer = setTimeout(hide, remaining);
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
                correctionRaf = 0;
                opts.recalculate();
                const top = computeAbsoluteTop(scroller, id);
                if (top == null) {
                    // Section not in layout yet — unlikely but retry
                    if (frames++ < 20) correctionRaf = requestAnimationFrame(correct);
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
                correctionRaf = requestAnimationFrame(correct);
            };

            // Wait one frame for Vue's DOM patch from ensureTargetWindow
            correctionRaf = requestAnimationFrame(correct);
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
                    s.scrollTo({ top, behavior: scrollBehavior() });
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
        // `L/D9`: a 500ms window is a clock, not a completion signal — a jump
        // that settles later drops the push, one that settles sooner pushes
        // nothing. Kept as the bounded fallback it is, but owned by `dispose`
        // so it cannot outlive the view. The signal-shaped repair rides
        // `★NAV-1`, which is F.W3's.
        clearTimeout(backFlagTimer);
        backFlagTimer = setTimeout(() => {
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
        scroller.scrollTo({ top: 0, behavior: scrollBehavior() });
    }

    return { navigateTo, navigateBack, scrollToTop, performScroll, navStack, dispose };
}
