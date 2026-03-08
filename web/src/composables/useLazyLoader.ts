/**
 * Progressive section loading: mounts sections in batches as the user scrolls.
 */

import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";

export function useLazyLoader(totalCount: number) {
    const visibleCount = ref(2);
    const loadSentinel = ref<HTMLElement | null>(null);
    let loadObserver: IntersectionObserver | null = null;

    onMounted(() => {
        loadObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && visibleCount.value < totalCount) {
                        visibleCount.value = Math.min(visibleCount.value + 2, totalCount);
                    }
                }
            },
            { rootMargin: "0px 0px 600px 0px" },
        );
        nextTick(() => {
            if (loadSentinel.value) loadObserver!.observe(loadSentinel.value);
        });
    });

    onUnmounted(() => {
        loadObserver?.disconnect();
    });

    // Re-observe the sentinel when it moves (after new sections mount)
    watch(visibleCount, () => {
        if (!loadObserver) return;
        loadObserver.disconnect();
        nextTick(() => {
            if (loadSentinel.value) loadObserver!.observe(loadSentinel.value);
        });
    });

    return { visibleCount, loadSentinel };
}
