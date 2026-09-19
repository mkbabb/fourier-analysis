<script setup lang="ts">
import Tooltip from "@/components/ui/tooltip/Tooltip.vue";
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
    scrollToTop,
    getPreview,
} = toc;

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
            <div class="sidebar-header">
                <p class="sidebar-label cm-serif">Contents</p>
                <!-- `D-B3(a)(b)(c)`: a 20×20 box under SC 2.5.8's 24px floor,
                     a glyph and a border that never reached 3:1 in any state,
                     and an accessible name that was a native `title` — the one
                     control in this file denied the project Tooltip.
                     ⊘ `PS-M2` RELAY-BEFORE-RENAME: the CLASS NAME is unchanged.
                     latex-paper's shipped `useSidebarFollow` hard-codes
                     `.sidebar-top-btn` in its pointer exemption, so a rename
                     here silently converts scroll-to-top clicks into sticky
                     manual-override suspensions. The relay carries the
                     data-attribute hook; this cure restyles and never renames.
                     (Measured this seat: glass-ui's own `useSidebarFollow` twin
                     hard-codes the same private class — the relay is owed to
                     BOTH producers.) -->
                <Tooltip text="Scroll to top" side="right">
                    <Button
                        emphasis="quiet"
                        size="md" icon-only
                        class="sidebar-top-btn"
                        aria-label="Scroll to top"
                        @click="scrollToTop"
                    >
                        <ChevronUp class="sidebar-top-icon" />
                    </Button>
                </Tooltip>
            </div>
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
                                    class="sidebar-link cm-serif"
                                    :class="{ 'is-active': activeRootId === section.id }"
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
                                            class="sidebar-link sidebar-sublink cm-serif"
                                            :class="{ 'is-active-sub': isActive(sub.id) || isInActiveChain(sub.id) }"
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
                                                class="sidebar-link sidebar-subsublink cm-serif"
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
    border-radius: 0.75rem;
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

.sidebar-top-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    /* `D-B3(a)`: 20×20 is under SC 2.5.8's 24px minimum. */
    min-width: 1.5rem;
    min-height: 1.5rem;
    border-radius: 0.25rem;
    /* `D-B3(b)`: border 1.27:1 and glyph 1.87:1 — neither reached the 3:1
       non-text floor in any state.

       ⊘ The glyph alone was not enough, and the harness caught the shortfall
       this seat's own first pass had claimed away. `--border` is the token for
       a DIVIDER, whose job is to be quiet; SC 1.4.11 governs the BOUNDARY of a
       control, which is the thing a reader must find. Re-derived at the bytes
       through `G-F4-CONTRAST-FLOOR`'s own method: `--border` over `--card`
       reads 1.865:1 light / 2.001:1 dark — still under 3:1 after the 8.0.0
       uplift — while `--muted-foreground` reads 5.021:1 / 5.440:1. The hover
       rule below ALREADY used `--muted-foreground` for this border, so the
       resting state was the weaker of the two: the affordance was hardest to
       see exactly when nobody was pointing at it. Resting takes that ink and
       hover moves up to `--foreground` (15.992:1 / 12.435:1 over the hover
       plate), so the floor is met at rest and the state change stays legible. */
    border: 1px solid var(--muted-foreground);
    background: none;
    color: var(--muted-foreground);
    cursor: pointer;
    /* A.W3.d — named properties + canonical token, no `transition: all`. */
    transition: color 0.15s var(--ease-standard), border-color 0.15s var(--ease-standard), background-color 0.15s var(--ease-standard);
}

.sidebar-top-btn:hover {
    color: var(--foreground);
    border-color: var(--foreground);
    background: color-mix(in srgb, var(--muted) 50%, transparent);
}

/* `D-B3(d)` is KILLED as filed — `size-3` is a no-op against the button
   chunk's `[&_svg:not([class*=size-])]` guard — so the glyph is sized by a
   `size-*` utility, the one escape the producer documents (`D/M-11`). */
.sidebar-top-icon {
    width: 0.75rem;
    height: 0.75rem;
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

.sidebar-disclosure {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--muted-foreground);
    cursor: pointer;
    border-radius: calc(var(--radius) - 2px);
}

.sidebar-disclosure:hover {
    color: var(--foreground);
    background: color-mix(in srgb, var(--muted) 50%, transparent);
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
.sidebar-link.is-active {
    font-weight: 600;
}

.sidebar-link.is-active:hover {
    background: color-mix(in srgb, var(--muted) 70%, transparent);
}

.sidebar-number {
    font-size: 0.72rem;
    margin-right: 0.22rem;
    opacity: 0.5;
}

.sidebar-link.is-active .sidebar-number {
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
