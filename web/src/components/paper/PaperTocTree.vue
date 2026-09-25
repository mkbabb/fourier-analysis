<script setup lang="ts">
/**
 * X.F.W14V.au5 — A2-FO-L1-1: THE ONE TABLE-OF-CONTENTS TREE.
 *
 * The desktop drawer (`PaperTocDrawer`) and the phone bar (`PaperTocBar`) each
 * hand-rolled the same three-level list with their own row markup, row styles
 * and reach rule (the drawer showed a section's subsections only on the active
 * chain; the bar showed every level). This recursive component is the one
 * rendering both hosts mount, over the one injected model (`paperToc.ts`):
 *
 *   - one row: glass `Button` at its `sm` rung, the numeral, the title;
 *   - one disclosure: a chapter's `CollapsibleTrigger` at the `xs` rung (the
 *     touch floor is the producer's), driven by the model's expansion state;
 *   - one reach: an expanded chapter shows every level below it;
 *   - one active treatment: `aria-current` in the chapter's hue
 *     (`--toc-accent`, set on the chapter's `<li>`); a chapter is current while
 *     the reader is anywhere on its chain (`isInActiveChain`).
 *
 * A2-FO-L1-2 (consumer half): glass ships the ToC behaviour but no ToC view at
 * 10.1.0; this file is the one seam its TocTree replaces at the landing
 * (ADOPT-AT-LANDING).
 */
import type { PaperSectionData } from "@/lib/paperContent";
import { injectPaperToc, sectionColorVar } from "./paperToc";
import { Button } from "@mkbabb/glass-ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@mkbabb/glass-ui/collapsible";
import { ChevronRight } from "@lucide/vue";

defineOptions({ name: "PaperTocTree" });

const props = withDefaults(
    defineProps<{
        nodes: readonly PaperSectionData[];
        renderTitle: (title: string) => string;
        depth?: number;
    }>(),
    { depth: 0 },
);

const emit = defineEmits<{
    /** A row was chosen; the model has already navigated. */
    navigate: [id: string];
}>();

const { isActive, isInActiveChain, isExpanded, toggleSection, navigateTo } = injectPaperToc();

function hasChildren(node: PaperSectionData): boolean {
    return (node.subsections?.length ?? 0) > 0;
}

/**
 * The disclosure's accessible name: `renderTitle` returns KaTeX HTML, which
 * cannot be an `aria-label`, so the math and markup are stripped (SP-7).
 */
function plainTitle(node: PaperSectionData): string {
    return node.title
        .replace(/\$[^$]*\$/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function isCurrent(id: string): boolean {
    return props.depth === 0 ? isInActiveChain(id) : isActive(id);
}

/**
 * A chapter row reveals its subtree and navigates (monotone: it never
 * collapses; the two-way control is the disclosure, where `aria-expanded`
 * says so — `fr-PaperSidebar L-1`).
 */
function choose(node: PaperSectionData) {
    if (props.depth === 0 && hasChildren(node) && !isExpanded(node.id)) toggleSection(node.id);
    navigateTo(node.id);
    emit("navigate", node.id);
}
</script>

<template>
    <ol class="toc-list" :data-depth="depth">
        <li
            v-for="(node, i) in nodes"
            :key="node.id"
            :style="depth === 0 ? { '--toc-accent': sectionColorVar(i) } : undefined"
        >
            <!-- One row markup at every depth. Below the chapters the list is
                 always open (one reach); only a chapter has a disclosure. -->
            <Collapsible
                :open="depth === 0 ? isExpanded(node.id) : true"
                @update:open="toggleSection(node.id)"
            >
                <div class="toc-row">
                    <Button
                        emphasis="quiet"
                        size="sm"
                        type="button"
                        class="toc-link font-serif-math"
                        :data-depth="depth"
                        :data-toc-id="node.id"
                        :aria-current="isCurrent(node.id) ? 'location' : undefined"
                        @click="choose(node)"
                    >
                        <span v-if="node.number" class="toc-number fira-code">{{ node.number }}.</span>
                        <span v-html="renderTitle(node.title)" />
                    </Button>
                    <CollapsibleTrigger v-if="depth === 0 && hasChildren(node)" as-child>
                        <Button
                            emphasis="quiet"
                            size="xs"
                            icon-only
                            type="button"
                            class="toc-disclosure"
                            :aria-label="`Subsections of ${plainTitle(node)}`"
                        >
                            <ChevronRight class="toc-disclosure-icon" />
                        </Button>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent v-if="hasChildren(node)">
                    <PaperTocTree
                        :nodes="node.subsections!"
                        :render-title="renderTitle"
                        :depth="depth + 1"
                        @navigate="(id) => emit('navigate', id)"
                    />
                </CollapsibleContent>
            </Collapsible>
        </li>
    </ol>
</template>

<style scoped>
@reference "tailwindcss";
/* X.F.W14V.au5 — A2-FO-L1-1: ONE row style, the drawer's (the F.W14.r row
   canon and UIA-F-156/F-147 rulings), in both hosts. The rows are glass
   Button at its own `sm` rung; what stays local is the start alignment glass's
   list-row arm will own (O-59), the row canon corner (`--radius-lg`, G-r2) and
   the rank typography that is the ToC's hierarchy. */
.toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.0625rem;
}
.toc-list[data-depth="1"] {
    padding-inline-start: 0.625rem;
    margin: 0.0625rem 0 0.125rem;
}
.toc-list[data-depth="2"] {
    padding-inline-start: 0.5rem;
    margin: 0.03125rem 0 0.0625rem;
}
/* `fr-PaperSidebar L-5(a)`/`L-1`: navigate + disclosure, side by side. */
.toc-row {
    display: flex;
    align-items: center;
    gap: 0.125rem;
}
.toc-row > :first-child {
    flex: 1;
    min-width: 0;
}
.toc-link {
    inline-size: 100%;
    justify-content: flex-start;
    text-align: start;
    white-space: normal;
    @apply text-base;
    line-height: 1.35;
    border-radius: var(--radius-lg);
}
.toc-link[data-depth="1"] {
    font-size: 0.78rem;
}
.toc-link[data-depth="2"] {
    font-size: 0.72rem;
}
/* UIA-F-156: ONE active treatment at every rank, in the chapter's hue. */
.toc-link[aria-current] {
    color: var(--toc-accent);
    font-weight: 600;
    background: color-mix(in srgb, var(--muted) 40%, transparent);
}
/* UIA-F-163: a tap latches no look-alike; hover paint only where it hovers. */
@media (hover: hover) {
    .toc-link:not([aria-current]):hover {
        color: var(--foreground);
    }
}
.toc-number {
    font-size: 0.72rem;
    margin-right: 0.22rem;
    opacity: 0.5;
}
.toc-link[aria-current] .toc-number {
    opacity: 0.8;
}
.toc-disclosure {
    flex-shrink: 0;
}
.toc-disclosure-icon {
    width: 0.875rem;
    height: 0.875rem;
    transition: transform var(--duration-fast) var(--ease-standard);
}
.toc-disclosure[data-state="open"] .toc-disclosure-icon {
    transform: rotate(90deg);
}
</style>
