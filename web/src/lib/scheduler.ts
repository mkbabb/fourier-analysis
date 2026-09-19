/**
 * J.W3 — the `scheduler.yield()` floor (the highest remaining INP lever, I's ι
 * tail; inv-29 progressive-enhancement-floor + inv-30 platform-over-library).
 *
 * `yieldToMain()` cedes the main thread mid-task so the browser can paint +
 * process input between work batches, then resumes — the platform's INP remedy
 * for an unbounded synchronous loop. Feature-detected with a ≤3-rung floor and
 * NO library: the platform `scheduler.yield()` (Baseline-newly) → `scheduler.
 * postTask()` (its predecessor) → `setTimeout(0)` (the universal floor). Where
 * none is privileged the behaviour degrades to a macrotask hop — never a
 * rip-out.
 *
 * NOT applied to the EPICYCLE render loop: that one is rAF-paced, off-screen-
 * gated (I.γ, `stores/animation.ts`) and — since X.F.W4 — reduced-motion gated,
 * and yielding mid-frame would tear a draw. The genuine unbounded consumer is
 * the gallery infinite-scroll accumulation (`stores/gallery.ts`) —
 * `processInChunks` yields between card batches so a long scroll never
 * monopolises the main thread. The MEASURED INP delta + any deeper long-task
 * instrumentation is W6 (the instrumented gate).
 *
 * ⊘ `FMD-22`'s second half (X·F F.W4 `.f`; the finding is unit `.a`'s, the file
 * is this unit's): this paragraph used to say "the epicycle/morph RENDER loop"
 * and claim BOTH were off-screen-gated by `stores/animation.ts`. The MORPH loop
 * is not: it is driven by keyframes.js `KeyframesAnimation` instances inside
 * `composables/useFourierMorph.ts`, owns no `requestAnimationFrame` of its own,
 * registers no `IntersectionObserver`, and has never passed through this
 * store's `setCanvasVisible` reference count. A comment that names a safety
 * property a loop does not have is worse than no comment, because the next
 * reader stops looking. The morph clock's own gate is `morphTo`'s
 * reduced-motion short-circuit, landed at `.a`; off-screen gating it is not
 * booked by any row and is not claimed here.
 */

interface SchedulerLike {
    yield?: () => Promise<void>;
    postTask?: (callback: () => void, options?: { priority?: string }) => Promise<unknown>;
}

const scheduler = (globalThis as unknown as { scheduler?: SchedulerLike }).scheduler;

/** Cede the main thread, resolving on the next scheduler turn (feature-detected). */
export function yieldToMain(): Promise<void> {
    if (typeof scheduler?.yield === "function") return scheduler.yield();
    if (typeof scheduler?.postTask === "function") {
        return scheduler.postTask(() => {}, { priority: "user-visible" }).then(() => undefined);
    }
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Apply `onItem` to each item, yielding to the main thread every `chunkSize`
 * items so a large batch never blocks paint/input. Small batches (≤ chunkSize)
 * run synchronously in one microtask — zero behaviour change at the common size.
 */
export async function processInChunks<T>(
    items: readonly T[],
    onItem: (item: T, index: number) => void,
    options: { chunkSize?: number } = {},
): Promise<void> {
    const chunkSize = options.chunkSize ?? 32;
    for (let i = 0; i < items.length; i++) {
        onItem(items[i], i);
        if ((i + 1) % chunkSize === 0 && i + 1 < items.length) {
            await yieldToMain();
        }
    }
}
