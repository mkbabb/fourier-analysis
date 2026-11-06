<script setup lang="ts">
import type { FlatPaperSection } from "@mkbabb/latex-paper/vue";
import type { ComponentPublicInstance } from "vue";
import PaperWindowSection from "./PaperWindowSection.vue";

const props = defineProps<{
    visibleItems: FlatPaperSection[];
    topSpacerPx: number;
    bottomSpacerPx: number;
    registerRoot: (el: HTMLElement | null) => void;
    measureSection: (id: string, el: HTMLElement | null) => void;
}>();

/**
 * X·F F.W4 `.e` — `PAW-26` (`L-10`, rescoped by `K-12`).
 *
 * Two different facts used to arrive as the same `null`: "this ref is a
 * component instance, not an element" (unreachable at runtime — every callsite
 * binds a real element) and "this section has unmounted". The caller cannot
 * tell them apart, and `disconnectSection` deletes from the element map while
 * leaving a stale measured height behind, so the second one is the one that
 * matters and it was silent.
 *
 * ⊘ `K-12` is load-bearing and the TYPE IS NOT DEAD CODE: the inline arrow is
 * contextually typed from Vue's ref signature, so narrowing fails under
 * `strictFunctionTypes` without `ComponentPublicInstance` in the union. This
 * import is an explicit exception to the no-unused sweep and to the SCRUB's
 * zero-consumer proofs — it is consumed by the type checker, not by a call.
 */
function toHTMLElement(
    value: Element | ComponentPublicInstance | null,
): HTMLElement | null {
    if (value instanceof HTMLElement) return value;
    if (import.meta.env.DEV && value != null) {
        console.warn(
            "paper window: a section ref resolved to something that is not an HTMLElement " +
                "— measurement will be skipped for it (this is NOT the unmount path)",
        );
    }
    return null;
}

function bindRoot(value: Element | ComponentPublicInstance | null) {
    props.registerRoot(toHTMLElement(value));
}

function bindSection(
    id: string,
    value: Element | ComponentPublicInstance | null,
) {
    props.measureSection(id, toHTMLElement(value));
}
</script>

<template>
    <div :ref="bindRoot" class="paper-window-root">
        <div
            v-if="topSpacerPx > 0"
            class="paper-window-spacer"
            :style="{ height: `${topSpacerPx}px` }"
        />

        <div
            v-for="item in visibleItems"
            :key="item.id"
            :ref="(el) => bindSection(item.id, el)"
            class="paper-window-section deferred-section"
        >
            <!-- §0hz.paper: the section is its own component so its slots
                 compile STABLE and scrolling never re-renders it (see
                 PaperWindowSection.vue). -->
            <PaperWindowSection :item="item" />
        </div>

        <div
            v-if="bottomSpacerPx > 0"
            class="paper-window-spacer"
            :style="{ height: `${bottomSpacerPx}px` }"
        />
        <div class="paper-window-footer-spacer" />
    </div>
</template>

<style scoped>
@reference "tailwindcss";
/* `PAW-57`: three dead defensive declarations lived here — `min-width: 0` on
   two plain in-flow block wrappers (it differs from `auto` only for flex/grid
   ITEMS) and `width: 100%` on a margin-less, border-less block (identical to
   `auto`). Deleted with zero behaviour change; the LIVE guards elsewhere in
   this file are untouched. */
.paper-window-section {

    /* I.γ — defer layout/paint (incl. KaTeX typesetting + figure decode) for the
       warm-but-off-screen sections the JS window keeps mounted (overscanAfterPx
       720, warm-ahead 3). The `content-visibility: auto` + measurement-safe
       `contain-intrinsic-size: auto …` come from glass-ui's canonical
       `.deferred-section` utility (styles/utilities.css; the glass-ui rule even
       names fourier γ as a consumer) — applied as a class on each section above,
       so the substrate owns the recipe and this host only RETUNES it.

       The CRITICAL piece is the `auto` prefix on `contain-intrinsic-size`: it
       makes the browser REMEMBER each section's real rendered size after first
       paint and report THAT (not the estimate) for `offsetHeight` when the
       section is later skipped. That neutralises the one hazard here —
       `useVirtualSectionWindow` measures every section via `offsetHeight` to
       build its spacer math + scroll-offset corrections, and a plain (non-`auto`)
       estimate would feed it the wrong number and corrupt scroll positioning.
       Sections are measured on a post-mount rAF (latex-paper `measureSection`),
       i.e. AFTER first paint, so the remembered size is always the real one.

       `--deferred-section-size` retunes the never-painted estimate from the
       utility's 30rem default to this paper's 1200px (a long typeset section);
       the estimate only applies to a section that has never painted (never the
       measured case). Where `content-visibility` is absent the section renders
       as before (the floor) and the JS window is unchanged. */
    --deferred-section-size: 1200px;
    /* X-DS fourier pass 6 (critic P6) · DS-F6P-C3: `content-visibility: auto`
       implies paint containment, which isolates each section as its own blend
       group over a transparent backdrop, so the figure's blend found no card
       to fall back to (measured: `screen` computed, slab still #000). The
       section takes the card's own tone, which it already sits on (the article
       is the opaque `--card` plate), so the blend reads --card and nothing else
       changes. */
    background-color: var(--card);
}

.paper-window-spacer {
    pointer-events: none;
}

.paper-window-footer-spacer {
    height: clamp(3.5rem, 8vh, 5rem);
}
</style>
