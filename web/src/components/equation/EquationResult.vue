<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { FadingScroll } from "@mkbabb/glass-ui/fading-scroll";
import { useClipboard } from "@mkbabb/glass-ui";
import { Check, Copy } from "@lucide/vue";
import { renderLatex, plainLatex } from "@/lib/equation/render";

/**
 * F.W4 / FR-EQR-18 — the `v-html` subtree below is a FOUR-FILE, TWO-LANGUAGE
 * contract that this component owns the DOM of and never named:
 * `latex_rendering.py` mints `\htmlClass{eq-coeff eq-…}` (`:175/:176/:216/:248`)
 * · `EquationView.vue`'s `.eq-card :deep(.eq-coeff)` block styles it ·
 * `useCoeffHover.ts` hit-tests it. `\htmlClass` is therefore LOAD-BEARING, and
 * withdrawing KaTeX's `trust` deletes the hover feature silently — see the trust
 * HANDLER in `lib/equation/render.ts` (fr-EquationView I-3).
 */
const props = defineProps<{
    latex: string;
    /** The small-plate type (/visualize's floating equation panel). */
    dense?: boolean;
}>();

/* P.W5 Lane B.2 — migrated from bare `navigator.clipboard.writeText` + manual
   `copied` ref + setTimeout to glass-ui's `useClipboard` composable. F.W1 /
   FR-EQR-1: at glass-ui ≥7 the composable returns `status` (a four-state
   `ClipboardStatus`), never a `copied` boolean — the old flag went permanently
   false and silently, so the icon swap below reads the state by name. */
const { status, copy } = useClipboard({ resetMs: 2000 });

const renderedHtml = computed(() => renderLatex(props.latex));

/**
 * `FR-EQR-5` — the copy outcome was a colour-and-glyph swap with no text
 * equivalent, and the composable's own four-state `status` carries a `failure`
 * arm the callsite discarded (it fired `copy()` with no await, no then, no
 * `onCopyError`). At the adopted pin the exec-command fallback is gone, so a
 * failure is MORE likely than it was and was still reported to no one. This is
 * the announcement; `status` is read by name, never through a boolean.
 */
const copyAnnouncement = computed(() => {
    if (status.value === "success") return "LaTeX copied to the clipboard";
    if (status.value === "failure") return "Could not copy — the clipboard refused the write";
    return "";
});

/**
 * `FR-EQR-4` — the clipboard gets the PORTABLE form. `eqMode` defaults to
 * `"sigma"` and the sigma renders are the ones carrying `\htmlClass`, so the raw
 * copy emitted LaTeX that fails with `Undefined control sequence` in every
 * consumer but this one, in the app's own default mode.
 *
 * `FR-EQR-25` / `FR-EQR-13` — the click path is guarded where the render path
 * short-circuits (`:disabled="!latex"`), so `copy("")` can no longer flash a
 * green Check for a copy of nothing, and the affordance stops being live over a
 * stale equation during a recompute.
 */
async function copyLatex() {
    await copy(plainLatex(props.latex));
}
</script>

<template>
    <div class="eq-result-root">
        <!-- X.F.W14.u — UIA-F-33 / UIA-F-34: the card's controls are ONE header
             row above the equation, never absolute layers over it. The host's
             leading control (the Σ|a+b toggle) and its actions (Info) join the
             Copy button here as flex siblings on one gap; the `right: 3.25rem`
             literal that overlapped Info and Copy at 390, and the 2rem top
             padding the equation kept to dodge them, are gone. -->
        <div class="eq-result-header">
            <slot name="leading" />
            <div class="eq-result-actions">
                <slot name="actions" />
                <Button
                    emphasis="primary"
                    size="md" icon-only
                    aria-label="Copy LaTeX"
                    title="Copy LaTeX"
                    :disabled="!latex"
                    @click="copyLatex"
                >
                    <Transition name="icon-swap" mode="out-in">
                        <Check v-if="status === 'success'" class="h-4.5 w-4.5 copy-ok" />
                        <Copy v-else class="h-4.5 w-4.5" />
                    </Transition>
                </Button>
            </div>
        </div>
        <!-- `FR-EQR-6` — a scroll container with no tabindex, no role and no
             accessible name, over a KaTeX span tree that contains no focusable
             descendant: the equation was unreachable by keyboard. -->
        <!-- X.F.W14V.au3 — A2-FO-L1-5: this is the one series renderer; the
             /visualize panel mounts it too. The region is glass's FadingScroll
             (tabindex 0, a named region, and the edge fades that say more terms
             continue — the panel's UIA-F-83 cue, which the merge keeps). -->
        <FadingScroll
            axis="x"
            aria-label="Rendered Fourier series"
            class="eq-scroll-region"
            :data-dense="dense || undefined"
        >
            <div v-html="renderedHtml" />
        </FadingScroll>
        <!-- `FR-EQR-5` — the copy outcome was colour-and-glyph only, and the
             composable's own reported failure was swallowed a second time. -->
        <p class="sr-only" role="status">{{ copyAnnouncement }}</p>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

.eq-result-root {
    display: flex;
    flex-direction: column;
}

.eq-result-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.5rem 0;
}

.eq-result-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-inline-start: auto;
}

/* Scrollable equation region — horizontal scroll, no vertical clip.

   `FR-EQR-8` — `text-align: center` was NOT the operative centring: the vendor
   sheet centres `.katex-display` and its `> .katex` child directly, so deleting
   the declaration alone is a no-op (K-7 killed that cure). A centred,
   `white-space: nowrap` display box inside `overflow-x: auto` puts the
   inline-START overhang outside the scrollable overflow region — `scrollLeft`
   floors at 0 — so the leading terms of an over-wide equation were unreachable
   with zero cue. A flex container with `justify-content: safe center` centres
   while it fits and degrades to `start` the moment it does not, and KaTeX's own
   centring goes inert on a shrink-to-fit flex item. The scroll itself is
   glass FadingScroll's (`.fading-scroll--x`, X.F.W14V.au3); the rendered
   series is its one flex item. */
.eq-scroll-region {
    width: 100%;
    display: flex;
    justify-content: safe center;
    align-items: flex-start;
    padding: 0.5rem 1rem 1rem;
    min-height: 4.5rem;
    scrollbar-width: thin;
}

.eq-scroll-region[data-dense] {
    padding: 0;
    min-height: 0;
}

/* Override global katex-display to prevent clipping fractions.

   `FR-EQR-22` — the `!important` was unearned: this scoped `(0,3,0)` selector
   already beats `style.css`'s `(0,1,0)` unaided and the vendor sheet sets no
   overflow at all, so the flag was defending against nothing. The `.katex`
   rule's `overflow: visible` restated the initial value. Both are gone; the
   block otherwise keeps its superlative. */
.eq-scroll-region :deep(.katex-display) {
    margin: 0;
    padding: 0.5rem 0;
    overflow: visible;
}

.eq-scroll-region :deep(.katex) {
    font-size: 1.4em;
}

@media (min-width: 768px) {
    .eq-scroll-region :deep(.katex) {
        font-size: 1.8em;
    }
}

.eq-scroll-region[data-dense] :deep(.katex) {
    font-size: 0.9em;
}

.eq-scroll-region[data-dense] :deep(.katex-display) {
    padding: 0.25rem 0;
}

/* `FR-EQR-7` — `text-green-500` measured 2.101:1 on the light `--card`, under the
   1.4.11 3:1 floor, and the design system's own light-arm `--success` fails at
   2.175:1, so adopting it would have been a token-shaped restatement of the same
   defect. The app's meaning-bearing ramp clears the floor in BOTH arms
   (4.272 light / 7.193 dark, this seat's arithmetic). ⊘ The `--success` light
   rung itself is a producer row and rides the GLASS-RELAY letter. */
.copy-ok {
    color: var(--section-color-4);
}

.icon-swap-enter-active,
.icon-swap-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}
.icon-swap-enter-from { opacity: 0; transform: scale(0.8); }
.icon-swap-leave-to { opacity: 0; transform: scale(0.8); }
</style>
