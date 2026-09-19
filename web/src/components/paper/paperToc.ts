/**
 * X·F F.W4 `.e` — THE ONE ToC MODEL, and the typed seam it travels on.
 *
 * Ruled at `docs/tranches/X/COHESION.md` §0o `ESC-2` (2026-09-18) for
 * `fr-PaperSidebar L-4` (+`M6`): *"ONE owner. The ToC model is a single
 * `useSidebarFollow` instance owned by the paper view (the highest common
 * ancestor of sidebar and body), provided through a typed `InjectionKey`; the
 * second instance and the untyped `defineExpose` seam are retired."*
 *
 * What the record measured before the ruling: three parallel derivations of one
 * 98-node tree across two producers — latex-paper's `useTreeIndex` over a
 * `paperTree.ts` adapter in the view, and glass-ui's `useSidebarState` once in
 * the desktop sidebar and again in the mobile bar — with nothing choosing a
 * winner, and the arbitration point an untyped `defineExpose({ sidebarNav })`
 * feeding a third package's rAF clock.
 *
 * What ships now: `PaperView` builds ONE `useSidebarState` (the winner: it
 * already returns the tree index, the active/in-chain predicates and the
 * expansion state the losing index was only half of) and provides it here with
 * the one element registration `useSidebarFollow` needs. Both hosts inject.
 * The key is typed, so a host that asks for the model without a provider is a
 * compile-time question and not a runtime `undefined`.
 */
import { inject, type InjectionKey } from "vue";
import type { GenericSidebarState } from "@mkbabb/glass-ui/sidebar";
import type { PaperSectionData } from "@/lib/paperContent";

export type PaperTocState = GenericSidebarState<PaperSectionData>;

export interface PaperTocModel extends PaperTocState {
    /**
     * The scrollable ToC element, registered by whichever host mounts it.
     *
     * This replaces the untyped `defineExpose({ sidebarNav })` seam (`M6`): the
     * view owns `useSidebarFollow` and reads the element through the model it
     * already provides, instead of reaching into a child instance for an
     * `any`-shaped property.
     */
    registerNavEl: (el: HTMLElement | null) => void;
    /** A one-line preview for a section, memoised for the render path (`M5`). */
    getPreview: (section: PaperSectionData) => string;
}

export const PAPER_TOC_KEY: InjectionKey<PaperTocModel> = Symbol("paper-toc");

/**
 * Inject the one model. A host mounted outside `PaperView` is a programming
 * error, and it says so here rather than failing later as an `undefined` read
 * inside a template.
 */
export function injectPaperToc(): PaperTocModel {
    const toc = inject(PAPER_TOC_KEY);
    if (!toc) {
        throw new Error(
            "paper ToC: no model provided — a ToC host must be mounted inside PaperView",
        );
    }
    return toc;
}
