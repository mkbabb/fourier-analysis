import { computed, ref, shallowRef } from "vue";

/**
 * Canon F6 (restraint, C-35): the page's one scroller and its reading
 * progress, as the dock reads them. "Docks shrink on scroll … page progress
 * is a hairline border of the dock, edge to edge" (owner, 2026-11-06).
 *
 * The shell's `<main>` is the scroller (`App.vue`), unless a route owns its
 * scroll (`meta.ownsScroll`, /paper): that route puts its own port here while
 * it is mounted, with the progress it reads. `AppDock` collapses on the
 * scroller and draws the progress as its own border. One app, one dock, so
 * this is module state.
 */
const shellScroller = shallowRef<HTMLElement | null>(null);
const routeScroller = shallowRef<HTMLElement | null>(null);
const scroller = computed(() => routeScroller.value ?? shellScroller.value);
/** The route's reading progress (0..1), or null where a page has none. */
const progress = ref<number | null>(null);
/** The progress hue, as `ScrollProgressRim` stops. */
const progressStops = shallowRef<readonly string[] | undefined>(undefined);

export function usePageScroll() {
    return { shellScroller, routeScroller, scroller, progress, progressStops };
}
