import { onMounted, onUnmounted, readonly, ref, type Ref } from "vue";
import {
    IDENTITY_VIEW,
    approach,
    clampView,
    isAtRest,
    isIdentity,
    overshoot,
    resistance,
    zoomAbout,
    type StageView,
} from "../lib/stage-view";

/**
 * LAST-TEN F-01: the stage owns its gestures.
 *
 * `touch-action: none` on the stage (BasisCanvas's style) keeps the browser
 * from zooming or scrolling the page under it; this composable gives the
 * gestures their meaning on the drawing instead:
 *  - one pointer drags the view 1:1 and releases with momentum;
 *  - two pointers pinch-zoom about their midpoint (and pan with it);
 *  - the wheel (and a trackpad pinch, which arrives as ctrl+wheel) zooms
 *    about the cursor, eased toward its target rather than stepped;
 *  - past a limit the view rubber-bands and settles back on release;
 *  - a double-click or double-tap returns to the fitted drawing.
 * Every settle starts from where the view is, so a new touch interrupts it.
 * Under reduced motion there is no momentum, and a settle or reset is a short
 * fade of the canvas (Web Animations, so it is not zeroed by the global
 * reduced-motion transition reset), never travel.
 */
export function useStageGestures(opts: {
    el: Ref<HTMLElement | undefined>;
    /** The element faded under reduced motion (the canvas). */
    fadeEl: () => HTMLElement | undefined;
    size: () => { w: number; h: number };
    onChange: () => void;
    /** A gesture (a drag, a pinch, the wheel, a double-tap) has come to rest. */
    onSettle?: () => void;
    /** A one-pointer press the host takes for itself (the contour editor's
     *  point drag): it starts its own gesture and answers true. The view does
     *  not pan under it. */
    claim?: (e: PointerEvent) => boolean;
    /** A second pointer landed during a claimed press: two fingers are always
     *  the view's, so the host gives its gesture up. */
    unclaim?: () => void;
    /** A double-click or double-tap the host takes (true) in place of the
     *  return to the fit. */
    onDouble?: (e: MouseEvent | PointerEvent) => boolean;
}) {
    let view: StageView = { ...IDENTITY_VIEW };
    /** The view is off the fitted drawing (zoomed or panned): the stage dock's Reset view shows. */
    const offFit = ref(false);
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch: { mid: { x: number; y: number }; dist: number } | null = null;
    let moved = false;
    let downAt: { x: number; y: number; t: number } | null = null;
    let lastTap: { x: number; y: number; t: number } | null = null;
    let samples: { t: number; x: number; y: number }[] = [];
    let velocity = { x: 0, y: 0 };
    let target: StageView | null = null;
    let raf = 0;
    let lastFrame = 0;
    let suppressClick = false;
    /** The one pointer down belongs to the host (`claim`). */
    let hostOwns = false;

    const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

    function local(e: PointerEvent | WheelEvent | MouseEvent) {
        const r = opts.el.value!.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function set(v: StageView) {
        view = v;
        offFit.value = !isIdentity(v);
        const zoomed = v.k > 1.001;
        const el = opts.el.value;
        if (el && (el.dataset.zoomed !== undefined) !== zoomed) {
            if (zoomed) el.dataset.zoomed = "";
            else delete el.dataset.zoomed;
        }
        opts.onChange();
    }

    /** Move by (dx, dy), each axis resisted by how far past its limit it is. */
    function panBy(v: StageView, dx: number, dy: number): StageView {
        const { w, h } = opts.size();
        const o = overshoot(v, w, h);
        return { k: v.k, x: v.x + dx * resistance(o.x, w * 0.25), y: v.y + dy * resistance(o.y, h * 0.25) };
    }

    function stopLoop() {
        cancelAnimationFrame(raf);
        raf = 0;
        target = null;
        velocity = { x: 0, y: 0 };
    }

    function startLoop() {
        if (raf) return;
        lastFrame = performance.now();
        raf = requestAnimationFrame(step);
    }

    function step(now: number) {
        const dt = Math.min(48, now - lastFrame);
        lastFrame = now;
        const { w, h } = opts.size();
        let v = view;
        if (target) {
            v = approach(v, target, dt, 70);
            if (Math.abs(v.k - target.k) < 1e-4 && Math.abs(v.x - target.x) < 0.05 && Math.abs(v.y - target.y) < 0.05) {
                v = target;
                target = null;
            }
        } else {
            // Momentum, decaying like a flick on a scroll view (tau 325 ms)...
            v = { k: v.k, x: v.x + velocity.x * dt, y: v.y + velocity.y * dt };
            const decay = Math.exp(-dt / 325);
            velocity = { x: velocity.x * decay, y: velocity.y * decay };
            // ...and, past a limit, a stiff pull back to it that soaks the flick up.
            if (!isAtRest(v, w, h)) {
                v = approach(v, clampView(v, w, h), dt, 90);
                velocity = { x: velocity.x * 0.6, y: velocity.y * 0.6 };
            }
        }
        const done = !target && Math.hypot(velocity.x, velocity.y) < 0.01 && isAtRest(v, w, h, 0.05);
        set(done ? clampView(v, w, h) : v);
        raf = done ? 0 : requestAnimationFrame(step);
        if (done) opts.onSettle?.();
    }

    /** Fade the canvas out, apply `v`, fade it back: the reduced-motion settle. */
    function fadeTo(v: StageView) {
        const el = opts.fadeEl();
        if (!el?.animate) { set(v); return; }
        const out = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: "ease-out", fill: "forwards" });
        out.onfinish = () => {
            set(v);
            el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
            out.cancel();
            opts.onSettle?.();
        };
    }

    /** Release: momentum (if any) and the settle back inside the limits. */
    function release() {
        const { w, h } = opts.size();
        if (reduced()) {
            if (!isAtRest(view, w, h)) fadeTo(clampView(view, w, h));
            else opts.onSettle?.();
            return;
        }
        const now = performance.now();
        const recent = samples.filter((s) => now - s.t < 100);
        velocity = { x: 0, y: 0 };
        if (!pinch && recent.length >= 2) {
            const a = recent[0], b = recent[recent.length - 1];
            const span = Math.max(16, b.t - a.t);
            velocity = { x: (b.x - a.x) / span, y: (b.y - a.y) / span };
        }
        samples = [];
        startLoop();
    }

    /** Back to the fitted drawing. */
    function reset(animate = true) {
        stopLoop();
        if (isIdentity(view)) return;
        if (!animate) { set({ ...IDENTITY_VIEW }); return; }
        if (reduced()) { fadeTo({ ...IDENTITY_VIEW }); return; }
        target = { ...IDENTITY_VIEW };
        startLoop();
    }

    function onPointerDown(e: PointerEvent) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        stopLoop();
        const p = local(e);
        if (pointers.size === 0 && opts.claim?.(e)) {
            // The host's press: tracked here only so a second finger can turn
            // the pair into a pinch.
            hostOwns = true;
            pointers.set(e.pointerId, p);
            return;
        }
        if (hostOwns) {
            hostOwns = false;
            opts.unclaim?.();
        }
        pointers.set(e.pointerId, p);
        opts.el.value?.setPointerCapture?.(e.pointerId);
        if (pointers.size === 1) {
            moved = false;
            downAt = { ...p, t: performance.now() };
            samples = [{ t: performance.now(), x: view.x, y: view.y }];
        }
        if (pointers.size === 2) beginPinch();
    }

    function beginPinch() {
        const [a, b] = [...pointers.values()];
        pinch = { mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) };
        moved = true;
    }

    function onPointerMove(e: PointerEvent) {
        const prev = pointers.get(e.pointerId);
        if (!prev) return;
        const p = local(e);
        pointers.set(e.pointerId, p);
        if (hostOwns) return;
        if (pointers.size >= 2 && pinch) {
            const [a, b] = [...pointers.values()];
            const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            const dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
            const { w, h } = opts.size();
            const ok = overshoot(view, w, h).k;
            const factor = Math.exp(Math.log(dist / pinch.dist) * resistance(ok, Math.log(1.6)));
            let v = zoomAbout(view, factor, mid.x, mid.y);
            v = panBy(v, mid.x - pinch.mid.x, mid.y - pinch.mid.y);
            pinch = { mid, dist };
            set(v);
            return;
        }
        if (pointers.size !== 1) return;
        if (!moved && downAt && Math.hypot(p.x - downAt.x, p.y - downAt.y) < 4) return;
        moved = true;
        set(panBy(view, p.x - prev.x, p.y - prev.y));
        const now = performance.now();
        samples.push({ t: now, x: view.x, y: view.y });
        if (samples.length > 12) samples.shift();
    }

    function onPointerUp(e: PointerEvent) {
        if (!pointers.delete(e.pointerId)) return;
        if (hostOwns) {
            hostOwns = false;
            return;
        }
        if (pointers.size === 1) {
            // A pinch that leaves one finger down continues as a drag from here.
            pinch = null;
            samples = [{ t: performance.now(), x: view.x, y: view.y }];
            return;
        }
        if (pointers.size > 0) return;
        const wasPinch = pinch !== null;
        pinch = null;
        if (moved) {
            suppressClick = true;
            if (wasPinch) samples = [];
            release();
            return;
        }
        // A tap: two within 300 ms and 24 px of each other return to the fit.
        if (e.pointerType !== "mouse" && downAt) {
            const now = performance.now();
            if (lastTap && now - lastTap.t < 300 && Math.hypot(downAt.x - lastTap.x, downAt.y - lastTap.y) < 24) {
                lastTap = null;
                if (!opts.onDouble?.(e)) reset();
            } else {
                lastTap = { x: downAt.x, y: downAt.y, t: now };
            }
        }
    }

    function onWheel(e: WheelEvent) {
        e.preventDefault();
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
        // A trackpad pinch arrives as ctrl+wheel with small deltas.
        const factor = Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.01 : 0.0015));
        const p = local(e);
        const { w, h } = opts.size();
        const next = clampView(zoomAbout(target ?? view, factor, p.x, p.y), w, h);
        if (reduced()) { stopLoop(); set(next); opts.onSettle?.(); return; }
        velocity = { x: 0, y: 0 };
        target = next;
        startLoop();
    }

    /** A drag or pinch is not a click: the stage's click handler (the legend
     *  pin) does not see the click that ends one. */
    function onClickCapture(e: MouseEvent) {
        if (!suppressClick) return;
        suppressClick = false;
        e.stopImmediatePropagation();
    }

    function onDblClick(e: MouseEvent) {
        e.preventDefault();
        if (!opts.onDouble?.(e)) reset();
    }

    /** WebKit's own pinch events: the stage is the pinch's owner. */
    function onGesture(e: Event) {
        e.preventDefault();
    }

    onMounted(() => {
        const el = opts.el.value;
        if (!el) return;
        el.addEventListener("pointerdown", onPointerDown);
        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerup", onPointerUp);
        el.addEventListener("pointercancel", onPointerUp);
        el.addEventListener("wheel", onWheel, { passive: false });
        el.addEventListener("click", onClickCapture, { capture: true });
        el.addEventListener("dblclick", onDblClick);
        el.addEventListener("gesturestart", onGesture);
        el.addEventListener("gesturechange", onGesture);
    });

    onUnmounted(() => {
        cancelAnimationFrame(raf);
        const el = opts.el.value;
        if (!el) return;
        el.removeEventListener("pointerdown", onPointerDown);
        el.removeEventListener("pointermove", onPointerMove);
        el.removeEventListener("pointerup", onPointerUp);
        el.removeEventListener("pointercancel", onPointerUp);
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("click", onClickCapture, { capture: true });
        el.removeEventListener("dblclick", onDblClick);
        el.removeEventListener("gesturestart", onGesture);
        el.removeEventListener("gesturechange", onGesture);
    });

    /** Put the view at `v` (a link's view, read back), held inside its limits; no settle is reported. */
    function setView(v: StageView) {
        stopLoop();
        const { w, h } = opts.size();
        set(clampView(v, w, h));
    }

    return { getView: () => view, setView, reset, moved: readonly(offFit) };
}
