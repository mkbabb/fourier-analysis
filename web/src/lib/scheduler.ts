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
 * NOT applied to the epicycle/morph RENDER loop: that is already rAF-paced AND
 * off-screen-gated (I.γ, `stores/animation.ts`), and yielding mid-frame would
 * tear a draw. The genuine unbounded consumer is the gallery infinite-scroll
 * accumulation (`stores/gallery.ts`) — `processInChunks` yields between card
 * batches so a long scroll never monopolises the main thread. The MEASURED INP
 * delta + any deeper long-task instrumentation is W6 (the instrumented gate).
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
