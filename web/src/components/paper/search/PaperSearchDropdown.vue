<script setup lang="ts">
/**
 * X·F F.W3 `.c` — `FR-PS-CLIP` ⊕ `FR-PS-BDT` ⊕ `FR-PS-Z`, cured as ONE thing,
 * because they are one thing: an overlay authored as a descendant of the box it
 * has to escape.
 *
 * `FR-PS-CLIP` (the SIDEBAR arm): the panel was `position: absolute` inside
 * `.paper-search`, which is `.sidebar-nav`'s FIRST child. `.sidebar-nav`
 * declares `overflow-y: auto` and no `overflow-x`, so `overflow-x` computes to
 * `auto` (measured live: `getComputedStyle(nav).overflowX === "auto"`) and the
 * nav is a scroll container on BOTH axes — it clips every descendant whose
 * containing block is inside it, `absolute` ones included. The panel could not
 * leave it, and `max-height: 50vh` was never honoured because the nav's own
 * `max-height: calc(--paper-scroll-viewport-height − insets)` is the real cap.
 *
 * `FR-PS-BDT` (the FLOATING arm): the click-away shim was
 * `position: fixed; inset: 0`, and `.floating-toc-bar` carries the producer's
 * `glass-resting` recipe, whose `backdrop-filter` (measured live:
 * `blur(16px) saturate(1.5)`) makes the bar the containing block for a FIXED
 * descendant. The shim therefore resolved against the BAR's padding box, i.e.
 * it covered the INPUT: a tap meant for the field fired `close()` and wiped the
 * query. The banked `D-6`/`L-1¶3` cure is a REVIVAL of that element and is
 * refused by name; dismissal is re-derived OUTSIDE the containing block, as a
 * document-level pointer test that has no geometry at all.
 *
 * `FR-PS-Z`: the panel was filed at `--z-bar` and the shim at the SAME token as
 * the plate it had to sit behind, while on the floating consumer both were
 * clamped inside `.floating-toc`'s stacking context (`position: sticky` +
 * `z-index: var(--z-controls)`), so no value either could carry reached past
 * the chrome above it. The rung is assigned HERE, inside the re-parenting that
 * dissolves the clamp — `--z-popover`, the token that exists for exactly this
 * surface — and never as a nudge on a clamped element.
 *
 * The cure is a portal: the panel renders into `<body>`, where no ancestor
 * filters, contains or clips, and is positioned from the field's own viewport
 * rect. A component's elements carry its scope id wherever they are portalled,
 * so the rules below still reach them (`PSM-1`'s mechanism, used deliberately
 * this time).
 */
import { computed, nextTick, onScopeDispose, ref, watch } from "vue";
import type { PaperSearchState } from "./usePaperSearch";
import PaperSearchResultRow from "./PaperSearchResultRow.vue";

const props = defineProps<{
    search: PaperSearchState;
    variant: "sidebar" | "floating";
    /** The field this panel hangs from — `PaperSearch`'s own root element. */
    anchor: HTMLElement | null;
}>();

const resultsRef = ref<HTMLElement | null>(null);

const isOpen = computed(
    () =>
        props.search.isOpen.value &&
        !props.search.isExpanded.value &&
        props.search.results.value.length > 0,
);

// ── The anchored geometry ────────────────────────────────────
// Physical coordinates, because the measurement is physical: the rect comes
// from `getBoundingClientRect()` and is already resolved in the writing mode
// the document actually has.
const GAP_PX = 4;
const VIEWPORT_MARGIN_PX = 8;
/** UIA-F-59: the results panel's content floor (the register's 22-26rem band). */
const PANEL_MIN_REM = 24;

const panelStyle = ref<Record<string, string>>({});

function measure() {
    const el = props.anchor;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // The floating arm sat flush under the field (`top: 100%`); the sidebar arm
    // sat 4px below it. Both are preserved — this cure moves the panel out of a
    // clip, it does not re-design the surface.
    const top = props.variant === "floating" ? r.bottom : r.bottom + GAP_PX;
    // `50vh`/`60vh` are now REACHABLE, so they are also now a real cap and have
    // to be clamped against the space that actually exists below the field.
    const preferred = props.variant === "floating" ? 0.6 : 0.5;
    const room = Math.max(0, window.innerHeight - top - VIEWPORT_MARGIN_PX);
    // A panel that tracks its field must also DISAPPEAR with it. `.sidebar-nav`
    // is itself a scroll port and `useSidebarFollow` scrolls it to keep the
    // active entry in view, so the field — the nav's first child — can be
    // carried out of that port entirely (measured: `nav.scrollTop = 217` after
    // a deep navigation puts the field at `top: -133px`). While the panel was
    // an `absolute` descendant the nav's own clip hid it; portalled, nothing
    // does, and it would hang detached over the page. This is that clip, kept.
    const onScreen =
        r.bottom > 0 &&
        r.top < window.innerHeight &&
        r.right > 0 &&
        r.left < window.innerWidth;
    // UIA-F-59: the panel was clamped to the 196px rail field, so every title
    // cut after ~10 characters. It is sized to its content: at least the
    // field, at least PANEL_MIN_REM, free to run past the rail, never past the
    // viewport's right margin.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const reach = window.innerWidth - r.left - VIEWPORT_MARGIN_PX;
    panelStyle.value = {
        top: `${top}px`,
        left: `${r.left}px`,
        width: `${Math.max(r.width, Math.min(PANEL_MIN_REM * rem, reach))}px`,
        maxHeight: `${Math.min(window.innerHeight * preferred, room)}px`,
        visibility: onScreen ? "visible" : "hidden",
        pointerEvents: onScreen ? "auto" : "none",
    };
}

/**
 * Dismissal, derived rather than painted. `capture: true` because the panel and
 * the field are in different subtrees and a row's own `@click` must still run:
 * the test is containment, and both containers are excluded before anything is
 * closed.
 */
function onPointerDownOutside(e: PointerEvent) {
    const t = e.target as Node | null;
    if (!t) return;
    if (props.anchor?.contains(t)) return;
    if (resultsRef.value?.contains(t)) return;
    props.search.close();
}

// `scroll` does not bubble, but it DOES capture at the window — which is the
// point: the field moves when `.sidebar-nav` scrolls, when `.paper-scroll`
// scrolls, and when the page scrolls, and one capturing listener sees all three.
function arm() {
    document.addEventListener("pointerdown", onPointerDownOutside, true);
    window.addEventListener("scroll", measure, { capture: true, passive: true });
    window.addEventListener("resize", measure, { passive: true });
}

function disarm() {
    document.removeEventListener("pointerdown", onPointerDownOutside, true);
    window.removeEventListener("scroll", measure, true);
    window.removeEventListener("resize", measure);
}

watch(isOpen, (open) => {
    if (!open) {
        disarm();
        return;
    }
    measure();
    // The field's own box can change in the same tick that opens the panel
    // (the clear control mounts with the first character), so the rect is read
    // again after the patch.
    nextTick(measure);
    arm();
});

onScopeDispose(disarm);

// Scroll selected result into view (only when not expanded / modal)
watch(
    () => props.search.selectedIndex.value,
    () => {
        if (props.search.isExpanded.value) return;
        nextTick(() => {
            const el = resultsRef.value?.querySelector(".is-selected");
            el?.scrollIntoView({ block: "nearest" });
        });
    },
);

defineExpose({ resultsRef });
</script>

<template>
    <Teleport to="body">
        <Transition name="search-dropdown">
            <div
                v-if="isOpen"
                :id="search.listboxId"
                ref="resultsRef"
                class="paper-search-results glass-floating glass-overlay-plate"
                data-reveal="menu"
                :style="panelStyle"
                role="listbox"
                aria-label="Search results"
            >
                <PaperSearchResultRow
                    v-for="(r, i) in search.results.value"
                    :key="r.key"
                    :id="search.optionId(i)"
                    :result="r"
                    :query="search.debouncedQuery.value"
                    :selected="i === search.selectedIndex.value"
                    @select="search.selectResult(r)"
                    @hover="search.selectedIndex.value = i"
                />
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
@reference "tailwindcss";
/* X·F F.W4 `.e` — `PSM-1`: this component's ENTIRE subtree was orphaned, and
   not by the single-root rule — it had TWO template roots (the Transition and
   the backdrop), so it was a real fragment with no root to inherit the parent's
   scope id at all. Its rules live here now.

   X·F F.W3 `.c` — the backdrop root is GONE (`FR-PS-BDT`), so this component
   has one root; and the panel is portalled, so its box is fixed to the viewport
   and its position/size are bound inline from the field's measured rect. Only
   the declarations that are NOT geometry stay here. */
.paper-search-results {
    position: fixed;
    /* `FR-PS-Z`: `--z-popover` is the token minted for this surface. The old
       `--z-bar` (30) was both the wrong rung and, on the floating consumer,
       unreachable — clamped inside `.floating-toc`'s stacking context. The
       portal dissolves the clamp; this names the altitude. */
    z-index: var(--z-popover);
    overflow-y: auto;
    overscroll-behavior: contain;
    /* UIA-F-59: the hand 1.5px border, the 8px corner, the shadow and the
       padding retire onto the producer's menu plate (`.glass-overlay-plate
       [data-reveal=menu]`: `--radius-card`, `--overlay-pad`), which
       `glass-floating` paints. */
}

/* ── Inline dropdown transition ──────────────────────────── */
/* A.W3.d — bezier→`--ease-out-expo`. */
.search-dropdown-enter-active,
.search-dropdown-leave-active {
    transition:
        opacity 0.15s var(--ease-standard),
        transform 0.15s var(--ease-out-expo);
}

.search-dropdown-enter-from,
.search-dropdown-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
