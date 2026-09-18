<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
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
}>();

/* P.W5 Lane B.2 — migrated from bare `navigator.clipboard.writeText` + manual
   `copied` ref + setTimeout to glass-ui's `useClipboard` composable. F.W1 /
   FR-EQR-1: at glass-ui ≥7 the composable returns `status` (a four-state
   `ClipboardStatus`), never a `copied` boolean — the old flag went permanently
   false and silently, so the icon swap below reads the state by name. */
const { status, copy } = useClipboard({ resetMs: 2000 });

const renderedHtml = computed(() => renderLatex(props.latex));

/**
 * FR-EQR-4 — the clipboard gets the PORTABLE form. `eqMode` defaults to
 * `"sigma"` and the sigma renders are the ones carrying `\htmlClass`, so the raw
 * copy emitted LaTeX that fails with `Undefined control sequence` in every
 * consumer but this one, in the app's own default mode.
 */
function copyLatex() {
    copy(plainLatex(props.latex));
}
</script>

<template>
    <div class="eq-result-root">
        <div class="eq-scroll-region" v-html="renderedHtml" />
        <Button
            emphasis="primary"
            size="md" icon-only
            class="copy-pos"
            title="Copy LaTeX"
            @click="copyLatex"
        >
            <Transition name="icon-swap" mode="out-in">
                <Check v-if="status === 'success'" class="h-4.5 w-4.5 copy-ok" />
                <Copy v-else class="h-4.5 w-4.5" />
            </Transition>
        </Button>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

.eq-result-root {
    position: relative;
}

/* Scrollable equation region — horizontal scroll, no vertical clip */
.eq-scroll-region {
    width: 100%;
    text-align: center;
    padding: 2rem 1rem 1rem;
    min-height: 4.5rem;
    overflow-x: auto;
    scrollbar-width: thin;
}

/* Override global katex-display to prevent clipping fractions */
.eq-scroll-region :deep(.katex-display) {
    margin: 0;
    padding: 0.5rem 0;
    overflow: visible !important;
}

.eq-scroll-region :deep(.katex) {
    font-size: 1.4em;
    overflow: visible;
}

@media (min-width: 768px) {
    .eq-scroll-region :deep(.katex) {
        font-size: 1.8em;
    }
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

.copy-pos {
    position: absolute;
    z-index: var(--z-controls);
    top: 0.5rem;
    right: 0.5rem;
}

.icon-swap-enter-active,
.icon-swap-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}
.icon-swap-enter-from { opacity: 0; transform: scale(0.8); }
.icon-swap-leave-to { opacity: 0; transform: scale(0.8); }
</style>
