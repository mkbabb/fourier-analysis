<script setup lang="ts">
// X.F.W3 repair 1 / `FR-TT-20` — THE ONE IMPORT IDENTITY. This was the tree's
// second identity for the tooltip shim: a deep SFC import, `@/components/ui/
// tooltip/Tooltip.vue`, beside eight callers going through the barrel. Two
// identities means the choke point the re-parameterisation is authored against
// is not a choke point — a barrel-level change reaches eight files and silently
// skips this one. The gate's own words are "normalize the TWO import identities
// BEFORE the migration"; the barrel beside `Tooltip.vue` is the identity.
import { Tooltip } from "@/components/ui/tooltip";
import PaperSearch from "./PaperSearch.vue";
import type { PaperSectionData } from "@/lib/paperContent";
import type { PaperSearchState } from "./search/usePaperSearch";
import { injectPaperToc, sectionColorVar } from "./paperToc";
import { Button } from "@mkbabb/glass-ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@mkbabb/glass-ui/collapsible";
import { ChevronRight, ChevronUp } from "@lucide/vue";

import { onBeforeUnmount, ref, watch } from "vue";

defineProps<{
    renderTitle: (title: string) => string;
    search: PaperSearchState;
}>();

// ── The ONE ToC model, injected (COHESION §0o ESC-2 / §3 D9) ───────────────
// This host used to build its own `useSidebarState` — the second of three
// parallel derivations of the same tree — and expose its nav element through
// an untyped `defineExpose` for a composable in a third package to reach into.
// Both are retired: `PaperView` owns the model, provides it on a typed key,
// and reads this element through `registerNavEl`.
const toc = injectPaperToc();
const {
    sections,
    activeRootId,
    isActive,
    isInActiveChain,
    isExpanded,
    toggleSection,
    navigateTo,
    getPreview,
} = toc;

/** X.F.W13.a — the CONTENTS disclosure's state; the list opens on arrival. */
const contentsOpen = ref(true);

const sidebarNav = ref<HTMLElement | null>(null);
watch(sidebarNav, (el) => toc.registerNavEl(el), { immediate: true });
onBeforeUnmount(() => toc.registerNavEl(null));

// X·F F.W4 `.e` — `fr-PaperSidebar D-M11`: `v-if="section.subsections"` is
// truthy for `[]`, so an empty array would mint a disclosure control with
// nothing behind it. The contract hole is closed at the predicate; no node in
// this paper carries `subsections: []` today, which is exactly why it went
// unnoticed.
function hasChildren(section: PaperSectionData): boolean {
    return (section.subsections?.length ?? 0) > 0;
}

/**
 * X·F F.W4 `.e` — `L-1`, as the measurement corrected it.
 *
 * The defect was a TOGGLE on the navigation control: clicking the chapter you
 * were reading collapsed it, and scroll-follow then died against an unmounted
 * row. Splitting the two controls cures that — but a navigate that leaves the
 * target's subsections closed hides where you just arrived, and `C-M4`'s e2e
 * guard (`paper-performance.spec.ts`, which clicks a row to reveal a deep
 * entry) measured it: the appendix entry never mounted.
 *
 * So the row EXPANDS and never collapses. It is monotone, which is the whole
 * content of L-1's complaint — the two-way control is the disclosure trigger
 * beside it, where `aria-expanded` says so.
 */
function navigateAndReveal(id: string) {
    if (!isExpanded(id)) toggleSection(id);
    navigateTo(id);
}

/**
 * X·F F.W4 `.e` — the disclosure control's accessible name.
 *
 * `renderTitle` returns KaTeX HTML, which cannot be an `aria-label`; the ToC
 * titles carry `$…$` math. This strips the math and any markup to a plain
 * string so the trigger is NAMED rather than described (SP-7: a description is
 * never a name), and `aria-expanded` — supplied by `CollapsibleTrigger` — is
 * what conveys the state.
 */
function plainTitle(section: PaperSectionData): string {
    return section.title
        .replace(/\$[^$]*\$/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
</script>

<template>
    <aside class="paper-sidebar">
        <nav ref="sidebarNav" class="sidebar-nav scrollbar-thin" aria-label="Table of contents">
            <PaperSearch :search="search" variant="sidebar" />
            <!-- X.F.W13.a — OA-13 (owner frame 1: "not rounded enough and not
                 glass-ui idiomatic, and it doesn't even work"). The control
                 beside CONTENTS wore a disclosure glyph in a disclosure's seat
                 but was a scroll-to-top of the PAPER: at the paper's top — where
                 the ToC is read — it is a no-op, and it never touched the list
                 it sat on. It is now what it looks like: the CONTENTS
                 disclosure, the producer's `Collapsible` owning `aria-expanded`
                 and the open/close motion, and a glass `Button icon-only` whose
                 own geometry (a circle: `--button-size` square, radius half of
                 it) is no longer overwritten here. The mobile ToC keeps its
                 scroll-to-top (`MobileFloatingToc`). -->
            <Collapsible v-model:open="contentsOpen">
                <div class="sidebar-header">
                    <p class="sidebar-label font-serif-math">Contents</p>
                    <Tooltip :text="contentsOpen ? 'Collapse contents' : 'Expand contents'" side="right">
                        <CollapsibleTrigger as-child>
                            <Button
                                emphasis="quiet"
                                size="md" icon-only
                                class="sidebar-contents-toggle"
                                aria-label="Contents"
                            >
                                <ChevronUp class="sidebar-contents-icon" />
                            </Button>
                        </CollapsibleTrigger>
                    </Tooltip>
                </div>
                <CollapsibleContent>
                    <ol class="sidebar-list">
                        <li v-for="(section, si) in sections" :key="section.id">
                            <!-- X·F F.W4 `.e` — `fr-PaperSidebar L-5(a)` + `L-1`: NAVIGATE
                                 AND TOGGLE ARE TWO CONTROLS. The row navigates and does
                                 nothing else (clicking the chapter you are reading no
                                 longer collapses it); the disclosure is a real
                                 `CollapsibleTrigger as-child`, which is what puts
                                 `aria-expanded`/`aria-controls` on the control that owns
                                 them. `@update:open` is now reached by exactly ONE path —
                                 the trigger — so the double-toggle L-5(a) predicted for
                                 "the day a trigger lands" cannot form. -->
                            <Collapsible
                                :open="isExpanded(section.id)"
                                @update:open="toggleSection(section.id)"
                            >
                                <div class="sidebar-row">
                                    <Tooltip :text="getPreview(section)" side="right">
                                        <Button
                                            emphasis="quiet"
                                            :data-toc-id="section.id"
                                            @click="navigateAndReveal(section.id)"
                                            class="sidebar-link font-serif-math"
                                            :aria-current="activeRootId === section.id ? 'location' : undefined"
                                            :style="activeRootId === section.id ? { color: sectionColorVar(si) } : {}"
                                        >
                                            <span v-if="section.number" class="sidebar-number fira-code">{{ section.number }}.</span>
                                            <span v-html="renderTitle(section.title)" />
                                        </Button>
                                    </Tooltip>
                                    <CollapsibleTrigger v-if="hasChildren(section)" as-child>
                                        <Button
                                            emphasis="quiet"
                                            size="md" icon-only
                                            class="sidebar-disclosure"
                                            :aria-label="`Subsections of ${plainTitle(section)}`"
                                        >
                                            <ChevronRight class="sidebar-disclosure-icon" />
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                                <!-- Subsections — glass-ui Collapsible drives the
                                     expand/collapse animation via `data-state`. -->
                                <CollapsibleContent v-if="hasChildren(section)">
                                    <ol class="sidebar-sublist">
                                        <li v-for="sub in section.subsections" :key="sub.id">
                                            <Tooltip :text="getPreview(sub)" side="right">
                                                <Button
                                                    emphasis="quiet"
                                                    :data-toc-id="sub.id"
                                                    @click="navigateTo(sub.id)"
                                                    class="sidebar-link sidebar-sublink font-serif-math"
                                                    :aria-current="isActive(sub.id) ? 'location' : undefined"
                                                        :style="isActive(sub.id)
                                                            ? { color: sectionColorVar(si), fontWeight: '600', background: 'color-mix(in srgb, var(--muted) 40%, transparent)' }
                                                            : {}"
                                                >
                                                    <span v-if="sub.number" class="sidebar-number fira-code">{{ sub.number }}.</span>
                                                    <span v-html="renderTitle(sub.title)" />
                                                </Button>
                                            </Tooltip>
                                            <!-- Sub-subsections -->
                                            <ol v-if="sub.subsections && isInActiveChain(sub.id)" class="sidebar-subsublist">
                                                <li v-for="subsub in sub.subsections" :key="subsub.id">
                                                    <Button
                                                        emphasis="quiet"
                                                        :data-toc-id="subsub.id"
                                                        @click="navigateTo(subsub.id)"
                                                        class="sidebar-link sidebar-subsublink font-serif-math"
                                                        :aria-current="isActive(subsub.id) ? 'location' : undefined"
                                                        :style="isActive(subsub.id)
                                                            ? { color: sectionColorVar(si), fontWeight: '600', background: 'color-mix(in srgb, var(--muted) 40%, transparent)' }
                                                            : {}"
                                                    >
                                                        <span v-if="subsub.number" class="sidebar-number fira-code">{{ subsub.number }}.</span>
                                                        <span v-html="renderTitle(subsub.title)" />
                                                    </Button>
                                                </li>
                                            </ol>
                                        </li>
                                    </ol>
                                </CollapsibleContent>
                            </Collapsible>
                        </li>
                    </ol>
                </CollapsibleContent>
            </Collapsible>
        </nav>
    </aside>
</template>

<style scoped>
@reference "tailwindcss";
.paper-sidebar {
    --sidebar-top-inset: 1rem;
    --sidebar-bottom-inset: 1.5rem;
    display: none;
}

@media (min-width: 1024px) {
    .paper-sidebar {
        display: block;
        position: sticky;
        top: var(--sidebar-top-inset);
        align-self: start;
        min-height: 0;
        max-height: calc(
            var(--paper-scroll-viewport-height, 100dvh) - var(--sidebar-top-inset) - var(--sidebar-bottom-inset)
        );
    }
}

.sidebar-nav {
    max-height: calc(
        var(--paper-scroll-viewport-height, 100dvh) - var(--sidebar-top-inset) - var(--sidebar-bottom-inset)
    );
    overflow-y: auto;
    overscroll-behavior-y: contain;
    overscroll-behavior-x: contain;
    scrollbar-gutter: stable;
    scroll-padding-bottom: var(--sidebar-bottom-inset);
    touch-action: pan-y;
    padding: 0.625rem 0.625rem var(--sidebar-bottom-inset);
    border-radius: var(--radius-panel);
    border: 2px solid color-mix(in srgb, var(--foreground) 15%, transparent);
    background: var(--card);
    box-shadow: 3px 3px 0px 0px color-mix(in srgb, var(--foreground) 8%, transparent);
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.625rem;
    margin-bottom: 0.5rem;
}

.sidebar-label {
    @apply text-sm;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    /* `D-B2`: the 60% dilution measured 2.39:1 light / 3.00:1 dark against a
       4.5:1 floor — triple-derived in the record, and axe never visits this
       route to catch it. Full strength is 5.021:1 light / 5.440:1 dark over
       `--card` (this seat's re-derivation, method cross-checked against
       `G-F4-CONTRAST-FLOOR`'s own readings of the diluted pairs). */
    color: var(--muted-foreground);
    margin: 0;
}

/* X.F.W13.a — OA-13: the retired `.sidebar-top-btn` block overwrote the
   producer Button's geometry and ink at the instance (`border-radius:
   var(--radius-sm)` → a 40×40 square with 4px corners, measured on the served
   page; a hand-set border and hover plate). The glass `Button icon-only`
   owns all of it — a `--button-size` square with `calc(var(--button-size) / 2)`
   corners, the quiet emphasis's ink and hover fill — so nothing is restated.
   The glyph is sized by a `size-*`-free class the producer's
   `svg:not([class*=size-])` guard leaves to us, and turns with the state. */
.sidebar-contents-icon {
    width: 0.875rem;
    height: 0.875rem;
    transition: transform var(--duration-fast) var(--ease-standard);
}

/* Keyed on `aria-expanded`, not `data-state`: the Tooltip's own trigger
   stamps `data-state` (its open/closed) on this same node and wins it. */
.sidebar-contents-toggle[aria-expanded="false"] .sidebar-contents-icon {
    transform: rotate(180deg);
}

.sidebar-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.0625rem;
}

/* X·F F.W4 `.e` — `L-5(a)`/`L-1`: the row is navigate + disclosure, two
   controls side by side. The title takes the free space; the trigger keeps its
   own hit box so a disclosure click can never be a navigation click. */
.sidebar-row {
    display: flex;
    align-items: center;
    gap: 0.125rem;
}

.sidebar-row > :first-child {
    flex: 1;
    min-width: 0;
}

/* X.F.W13.a — the disclosure is a glass `Button icon-only` (a circle by the
   producer's own geometry); the instance-level radius / border / hover plate
   that squared it (8px corners on a 40×40 box, measured) are retired. */
.sidebar-disclosure {
    flex-shrink: 0;
}

.sidebar-disclosure-icon {
    width: 0.875rem;
    height: 0.875rem;
    transition: transform 0.15s var(--ease-standard);
}

.sidebar-disclosure[data-state="open"] .sidebar-disclosure-icon {
    transform: rotate(90deg);
}

.sidebar-link {
    display: block;
    width: 100%;
    text-align: left;
    /* `D-M10` = `C-M1(a)`: the Button base ships `whitespace-nowrap`, which
       nothing here reset — so ToC titles could not wrap in a 220px rail and
       minted a horizontal scroll axis instead. The authored `line-height:
       1.35` below is the tell that these rows were meant to wrap. */
    white-space: normal;
    background: none;
    border: none;
    cursor: pointer;
    @apply text-base;
    font-weight: 500;
    line-height: 1.35;
    padding: 0.28rem 0.625rem;
    border-radius: calc(var(--radius) - 2px);
    color: var(--muted-foreground);
    /* `PV ★MF-6`: `font-weight` was in the transitioned set — a reflow per
       frame plus synthesized-weight snapping against the remapped serif, and
       only for full-motion users. Deleted, not re-tuned.
       `D-M6`: the durations are the canonical registers now, and a colour
       cross-fade gets the standard curve rather than the expo one the
       producer's own doctrine reserves for movement. */
    transition:
        color var(--duration-fast) var(--ease-standard),
        background-color var(--duration-fast) var(--ease-standard);
}

.sidebar-link:hover {
    color: var(--foreground);
    background: color-mix(in srgb, var(--muted) 70%, transparent);
}

/* `D-M3`: the hover plate measured 1.022:1 light / 1.08 dark — a response the
   eye cannot see — and the ACTIVE row, the likeliest pointer target, had none
   at all because `background: none` won by source order over the hover rule.
   The plate is a real one now and the active row keeps it. */
/* X.F.W3 repair 1 — the published active-state vocabulary, applied
   (`FR-COB-3` ⊕ `fr-App MG-η`). Two spellings died here, not one. `.is-active`
   on the section row was the state itself on a control that announced nothing;
   `.is-active-sub` on the subsection row was the vocabulary's DEAD spelling —
   no `.is-active-sub` rule exists in this file or anywhere in the tree (⟨cmd⟩
   `grep -rn 'is-active-sub' src` → that one binding), so it painted nothing
   while teaching the next reader a channel that does nothing. Both are now
   `aria-current`, the channel the vocabulary gives a nav item marking the
   current location; `location` and not `page`, because these rows address
   SECTIONS INSIDE one document rather than sibling routes, and the hook
   `[aria-current]` is value-agnostic by construction. The sub-subsection row
   gains the same attribute: it could already be the current location and was
   the one rank that announced it by neither class nor attribute. The
   conditional `:style` beside each stays — a per-section colour the cascade
   cannot express without a variable, not a state spelling. Note the ROW
   SEMANTICS the attribute fixes: the old sub binding was `isActive(sub.id) ||
   isInActiveChain(sub.id)`, which would have marked an ANCESTOR of the current
   section as current; `aria-current` is bound to `isActive` alone. */
.sidebar-link[aria-current] {
    font-weight: 600;
}

.sidebar-link[aria-current]:hover {
    background: color-mix(in srgb, var(--muted) 70%, transparent);
}

.sidebar-number {
    font-size: 0.72rem;
    margin-right: 0.22rem;
    opacity: 0.5;
}

.sidebar-link[aria-current] .sidebar-number {
    opacity: 0.8;
}

/* W3.5.c — Collapsible animation driven by glass-ui `CollapsibleContent`
   (reka-ui's `--reka-collapsible-content-height` CSS var).
   X·F F.W4 `.e` — `fr-PaperSidebar D-B1` re-measured at the ADOPTED pin: the
   recipe `.disclosure-content{animation-name:disclosure-open|close;
   animation-duration:var(--spring-present-duration); overflow:hidden}` is
   emitted by `dist/glass-ui.css`, which `dist/styles/index.css` imports at its
   tail — so the comment above is TRUE at 8.0.0 and was false only at the 4.0.0
   pin the record was taken against (root cause `M1`). `C-m8`: the local
   `.sidebar-sublist-wrapper{overflow:hidden}` restated that producer invariant
   verbatim and is deleted rather than doubled. */
.sidebar-sublist {
    list-style: none;
    padding: 0 0 0 0.625rem;
    margin: 0.0625rem 0 0.125rem;
}

.sidebar-sublink {
    font-size: 0.78rem;
    padding: 0.2rem 0.45rem;
}

.sidebar-subsublist {
    list-style: none;
    padding: 0 0 0 0.5rem;
    margin: 0.03125rem 0 0.0625rem;
}

.sidebar-subsublink {
    font-size: 0.72rem;
    padding: 0.15rem 0.32rem;
}
</style>
