/**
 * Tracks which paper section is currently visible via IntersectionObserver.
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import type { Ref } from "vue";
import type { PaperSectionData } from "@/lib/paperContent";
import type { TocEntry } from "./useTableOfContents";

export function useScrollTracking(
    sections: PaperSectionData[],
    tocIndex: Map<string, TocEntry>,
    visibleCount: Ref<number>,
) {
    const activeId = ref<string | null>(sections[0]?.id ?? null);
    const sectionVisibility = new Map<string, boolean>();
    let observer: IntersectionObserver | null = null;
    const observedIds = new Set<string>();

    const activeTopId = computed(() => {
        if (!activeId.value) return null;
        return tocIndex.get(activeId.value)?.parentId ?? null;
    });

    /** Walk the tree bottom-up: the deepest visible section wins. */
    function findDeepestVisible(list: PaperSectionData[]): string | null {
        for (const s of list) {
            if (s.subsections) {
                const deep = findDeepestVisible(s.subsections);
                if (deep) return deep;
            }
            if (sectionVisibility.get(s.id)) return s.id;
        }
        return null;
    }

    function updateActive() {
        const found = findDeepestVisible(sections);
        if (found) activeId.value = found;
    }

    function observeTree(list: PaperSectionData[]) {
        for (const s of list) {
            if (!observedIds.has(s.id)) {
                const el = document.getElementById(s.id);
                if (el) {
                    observer!.observe(el);
                    observedIds.add(s.id);
                }
            }
            if (s.subsections) observeTree(s.subsections);
        }
    }

    onMounted(() => {
        observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    sectionVisibility.set(
                        (entry.target as HTMLElement).id,
                        entry.isIntersecting,
                    );
                }
                updateActive();
            },
            { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
        );
        nextTick(() => observeTree(sections));
    });

    onUnmounted(() => {
        observer?.disconnect();
    });

    // Re-observe when new sections mount from progressive loading
    watch(visibleCount, () => {
        if (!observer) return;
        nextTick(() => observeTree(sections));
    });

    // ── Auto-scroll sidebar to keep active item visible ────────
    const sidebarNav = ref<HTMLElement | null>(null);

    watch(activeId, (id) => {
        if (!id || !sidebarNav.value) return;
        nextTick(() => {
            const el = sidebarNav.value?.querySelector(
                `[data-toc-id="${id}"]`,
            ) as HTMLElement | null;
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        });
    });

    return { activeId, activeTopId, sidebarNav };
}
