import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAnimationStore } from "../../src/stores/animation";

/**
 * X·F F.W3 `.a` — `g5`'s HARD acceptance, and `g4`'s store half.
 *
 * `g5` is a hard requirement on the cure in terms: *"an arrow/Home/End press
 * moves `t` and survives the next frame."* The mechanism it is about is not in
 * the control at all — it is in this store. Reka routes every keyboard seek
 * through `updateValues({ commit: true })` with no pointer event, so no scrub
 * session opens and the clock keeps running; and while the rAF's anchor lived
 * inside `startLoop`'s closure, the very next tick re-derived `t` from that
 * anchor and erased the keystroke ~16ms after it landed.
 *
 * "Survives the next frame" is therefore a statement about a FRAME BOUNDARY,
 * and a frame boundary is exactly what a browser will not hold still for. This
 * file drives the clock by hand — one deterministic frame at a time, at a `now`
 * this file chooses — so the assertion is about the mechanism rather than about
 * whether a machine happened to be fast enough. `e2e/timeline-scrub.spec.ts` is
 * the other half: it asserts that the keystroke reaches `seek()` at all, over
 * the shipped composition in a real browser.
 *
 * ⊘ No DOM is bought for this. `vitest.config.ts` runs `environment: "node"`
 * deliberately, and the store is DOM-free by construction (`typeof window` is
 * guarded at both of its two window touch-points), so the only thing that needs
 * standing in is the frame clock itself.
 */

/** A hand-driven `requestAnimationFrame`, with a clock this file advances. */
class FrameClock {
    private handlers = new Map<number, FrameRequestCallback>();
    private nextId = 1;
    now = 1_000;

    request = (cb: FrameRequestCallback): number => {
        const id = this.nextId++;
        this.handlers.set(id, cb);
        return id;
    };

    cancel = (id: number): void => {
        this.handlers.delete(id);
    };

    /** How many frames are armed — the honest reading of "is the clock running". */
    get armed(): number {
        return this.handlers.size;
    }

    /** Advance `deltaMs` and run every frame that was armed when we entered. */
    tick(deltaMs = 16): void {
        this.now += deltaMs;
        const due = [...this.handlers.values()];
        this.handlers.clear();
        for (const cb of due) cb(this.now);
    }

    tickTimes(count: number, deltaMs = 16): void {
        for (let i = 0; i < count; i++) this.tick(deltaMs);
    }
}

const g = globalThis as unknown as {
    requestAnimationFrame?: typeof requestAnimationFrame;
    cancelAnimationFrame?: typeof cancelAnimationFrame;
};

let clock: FrameClock;
let saved: { raf?: typeof requestAnimationFrame; caf?: typeof cancelAnimationFrame };

beforeEach(() => {
    clock = new FrameClock();
    saved = { raf: g.requestAnimationFrame, caf: g.cancelAnimationFrame };
    g.requestAnimationFrame = clock.request as typeof requestAnimationFrame;
    g.cancelAnimationFrame = clock.cancel as typeof cancelAnimationFrame;
    setActivePinia(createPinia());
});

afterEach(() => {
    g.requestAnimationFrame = saved.raf;
    g.cancelAnimationFrame = saved.caf;
});

/** A store with its visibility gate open and the clock actually running. */
function runningStore() {
    const anim = useAnimationStore();
    anim.setCanvasVisible(true);
    anim.play();
    // The first tick is the one that sets the anchor; from here `t` advances.
    clock.tick();
    return anim;
}

describe("X·F F.W3 g5 — a seek survives the next frame (fr-AnimationControls L-3)", () => {
    it("keeps a keyboard-shaped seek — one that never opens a scrub session", () => {
        const anim = runningStore();
        clock.tickTimes(20);

        const before = anim.t;
        expect(before, "the clock must actually be moving for this to mean anything").toBeGreaterThan(0);

        // Exactly what reka does for ←/→/Home/End/Page: the model changes, and
        // nothing else. No pointerdown, no `startScrub`, no pause.
        anim.seek(0.75);
        expect(anim.scrubbing, "a keyboard seek opens no session — that is the premise").toBe(false);

        clock.tick();

        // One frame at 16ms of a 20s cycle is 0.0008 of the axis, so anything
        // near 0.75 is the seek surviving and anything near `before` is the
        // anchor overwriting it.
        expect(anim.t).toBeGreaterThan(0.74);
        expect(anim.t).toBeLessThan(0.76);
        expect(Math.abs(anim.t - before), "t must not have snapped back to the old trajectory").toBeGreaterThan(0.5);
    });

    it("keeps a seek to either end — Home and End are the same mechanism", () => {
        const anim = runningStore();
        clock.tickTimes(30);

        anim.seek(1); // End
        clock.tick();
        expect(anim.t).toBeGreaterThan(0.99);

        anim.seek(0); // Home
        clock.tick();
        expect(anim.t).toBeLessThan(0.01);
    });

    it("advances from the seeked position rather than resuming from it and jumping", () => {
        const anim = runningStore();
        anim.seek(0.5);
        clock.tick();
        const first = anim.t;
        clock.tickTimes(10);
        const later = anim.t;

        expect(later).toBeGreaterThan(first);
        // 11 frames × 16ms of a 20 000ms cycle ≈ 0.0088 of the axis.
        expect(later - first).toBeLessThan(0.05);
    });
});

describe("X·F F.W3 g4 — the session pair cannot leave the clock frozen", () => {
    it("closes a NULL-DELTA session: scrubbing false, clock re-armed", () => {
        const anim = runningStore();
        clock.tickTimes(5);

        // Press and release with no movement at all — the gesture reka's
        // `hasChanged`-gated `valueCommit` never reports, which is precisely the
        // gesture that used to freeze the transport.
        anim.startScrub();
        expect(anim.scrubbing).toBe(true);
        expect(clock.armed, "the clock parks for the length of the drag").toBe(0);

        anim.endScrub();

        expect(anim.scrubbing).toBe(false);
        expect(anim.playing, "the transport's intent is untouched by a scrub").toBe(true);
        expect(clock.armed, "and the clock is running again").toBe(1);

        const before = anim.t;
        clock.tickTimes(5);
        expect(anim.t).toBeGreaterThan(before);
    });

    it("closes a CANCELLED session the same way — pointercancel is not a special case", () => {
        const anim = runningStore();
        anim.startScrub();
        anim.seek(0.4);
        // `pointercancel` reaches the store through the same close as
        // `pointerup`; the composition guarantees one of them always arrives.
        anim.endScrub();

        expect(anim.scrubbing).toBe(false);
        expect(clock.armed).toBe(1);
        clock.tick();
        expect(anim.t).toBeGreaterThan(0.39);
        expect(anim.t).toBeLessThan(0.41);
    });

    it("leaves a paused transport paused — a closed session is not a play command", () => {
        const anim = useAnimationStore();
        anim.setCanvasVisible(true);

        anim.startScrub();
        anim.seek(0.3);
        anim.endScrub();

        expect(anim.scrubbing).toBe(false);
        expect(anim.playing).toBe(false);
        expect(clock.armed, "nothing was playing, so nothing resumes").toBe(0);
        expect(anim.t).toBeCloseTo(0.3, 10);
    });

    it("reset() clears a stranded scrub flag (fr-AnimationControls L-1b)", () => {
        const anim = runningStore();
        anim.startScrub();
        expect(anim.scrubbing).toBe(true);

        // `reset()` had exactly nothing to say about `scrubbing`, so a reset
        // taken mid-drag stranded the flag true — which forces the trail's
        // full-rebuild branch every frame AND holds `startLoop`'s guard shut.
        anim.reset();

        expect(anim.scrubbing).toBe(false);
        expect(anim.playing).toBe(false);
        expect(anim.t).toBe(0);

        // And the store is genuinely usable again, which is the point.
        anim.play();
        clock.tick();
        clock.tickTimes(5);
        expect(anim.t).toBeGreaterThan(0);
    });
});
