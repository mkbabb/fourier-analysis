<script setup lang="ts">
import {
    PaperSection,
    PaperSectionBlocks,
    PAPER_CONTEXT,
    type PaperContext,
    type FlatPaperSection,
} from "@mkbabb/latex-paper/vue";
import { computed, inject, type ComponentPublicInstance } from "vue";
import { ArrowRight } from "@lucide/vue";
import { Button } from "@mkbabb/glass-ui/button";
import {
    DARK_INVERT_EXEMPT,
    resolveFigure,
    type ResolvedFigure,
} from "@/lib/figureDimensions";

const props = defineProps<{
    visibleItems: FlatPaperSection[];
    topSpacerPx: number;
    bottomSpacerPx: number;
    registerRoot: (el: HTMLElement | null) => void;
    measureSection: (id: string, el: HTMLElement | null) => void;
}>();

const baseUrl = import.meta.env.BASE_URL;

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

/**
 * `PAW-18`: `resolveFigure()` was invoked SEVEN times per figure per render —
 * two regex replaces, a `Set.has`, three concatenations and a fresh object each
 * time, with no CSE in the compiler — multiplied by the remount-per-patch the
 * window produces. The resolution is memoised per filename; the data behind it
 * is a build-time constant, so a cached answer cannot go stale.
 *
 * ⊘ The record routes this as a rider on `PAW-3`'s extraction, which is F.W3's.
 * A memo is not that extraction and does not pre-empt it: when the figure child
 * is extracted, this map moves into it unchanged.
 */
const figureCache = new Map<string, ResolvedFigure>();

function figure(filename: string): ResolvedFigure {
    let hit = figureCache.get(filename);
    if (!hit) {
        hit = resolveFigure(filename, `${baseUrl}assets/`);
        figureCache.set(filename, hit);
    }
    return hit;
}

// `PAW-23`: `{{ callout.text }}` was the ONE authored string on this surface
// that bypassed the paper's own renderer — every other string rides
// `renderTitle`/`v-html`. It is latent only because both configured callouts
// happen to be math-free, and the type is untyped against TeX, so the first
// callout with a `$…$` in it ships raw source to the reader.
const paper = inject<PaperContext>(PAPER_CONTEXT);
const renderCalloutText = computed(
    () => paper?.renderTitle ?? ((text: string) => text),
);
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
            <PaperSection
                :id="item.id"
                :number="item.section.number"
                :title="item.section.title"
                :depth="item.depth"
                :section-index="item.rootIndex"
            >
                <PaperSectionBlocks :section="item.section">
                    <template #figure="{ figure: fig }">
                        <picture>
                            <source
                                v-if="figure(fig.filename).avif"
                                :srcset="figure(fig.filename).avif!"
                                type="image/avif"
                            />
                            <source
                                v-if="figure(fig.filename).webp"
                                :srcset="figure(fig.filename).webp!"
                                type="image/webp"
                            />
                            <!-- `PAW-7`: `alt` bound the UN-RENDERED caption —
                                 `$…$` source that the visible `<figcaption>`
                                 puts through KaTeX — and duplicated that
                                 caption verbatim for anyone who heard both. A
                                 figure whose description is already adjacent
                                 and rendered takes an empty alt.
                                 `PAW-6`: the dark-inversion discriminator is a
                                 named exemption set in `figureDimensions.ts`,
                                 not a `filename.includes("portrait")` guess
                                 that was wrong in both directions on the only
                                 two figures it decided. ⊘ `K-17` is carried
                                 there: the real repair is asset-side and rides
                                 the LATEX-PAPER relay. -->
                            <img
                                :src="figure(fig.filename).png"
                                alt=""
                                :width="figure(fig.filename).width"
                                :height="figure(fig.filename).height"
                                class="max-w-full rounded-lg shadow-sm"
                                :class="
                                    DARK_INVERT_EXEMPT.has(fig.filename)
                                        ? 'paper-portrait'
                                        : 'paper-figure'
                                "
                                loading="lazy"
                                decoding="async"
                            />
                        </picture>
                    </template>
                    <template #callout="{ callout }">
                        <div class="interactive-callout">
                            <p
                                class="cm-serif text-sm text-muted-foreground mb-3"
                                v-html="renderCalloutText(callout.text)"
                            />
                            <!-- X.F.W3 `.d` — `fr-PaperArticleWindow PAW-8`
                                 (⊕ `PAW-20`, `PAW-41`). `.callout-btn` was a
                                 DIVERGENT TWIN: the identical call to action as
                                 the six glass Buttons on this route, wearing a
                                 contradictory chassis — a bare `<router-link>`
                                 hand-drawn in twenty lines of scoped CSS, under
                                 one shared UNLAYERED global focus rule that was
                                 its only indicator.

                                 The cure is the `R3-7a` precedent shape: the
                                 glass `Button` `as-child`, a THIN SKIN. The link
                                 keeps being a link — `as-child` merges the
                                 command’s chrome into the `<router-link>` rather
                                 than wrapping it, so the href, the router’s
                                 active handling and middle-click all survive, and
                                 the control joins the ladder its six siblings are
                                 already on.

                                 `PAW-20` dies inside the adoption (no second
                                 chassis is left to diverge) and `PAW-41`’s
                                 off-token radius rides it — the pill is the
                                 primitive’s own now.

                                 ⊘ `PAW-22` → banked `GCM-23` (drop
                                 `border-radius: inherit` rule-wide) is NOT taken
                                 here, and `K-5`’s LOCK is why: that deletion must
                                 be SITE-SCOPED, and this bare router-link had no
                                 other indicator to fall back on. It carries the
                                 producer’s `focus-ring` now, which is what makes
                                 the site-scoped deletion safe LATER; the
                                 rule-wide sweep is still not this unit’s act.
                                 ⊘ `PAW-53`: the adopted chassis needs a real
                                 border under forced-colors, or the glass-ui rung
                                 extended to it — NOT discharged by this adoption
                                 (SC-10), and carried out as a relay note.

                                 `PAW-21`: U+2131 announced as “script capital F
                                 ourier” INSIDE the control’s accessible name. The
                                 ArrowRight beside it is genuinely exempt (lucide
                                 auto-hides it), which made this the sole
                                 pollutant. -->
                            <Button
                                as-child
                                emphasis="primary"
                                size="lg"
                                class="callout-btn"
                            >
                                <router-link :to="callout.link">
                                    <span class="fourier-f" aria-hidden="true">ℱ</span>
                                    <span>Open Visualizer</span>
                                    <ArrowRight class="h-4 w-4" />
                                </router-link>
                            </Button>
                        </div>
                    </template>
                </PaperSectionBlocks>
            </PaperSection>
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
}

.paper-window-spacer {
    pointer-events: none;
}

.paper-window-footer-spacer {
    height: clamp(3.5rem, 8vh, 5rem);
}

.interactive-callout {
    margin: 1.5rem 0;
    padding: 1.25rem 1.5rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: color-mix(in srgb, var(--muted) 25%, transparent);
    text-align: center;
}

/* `PAW-9`: the cap was an INLINE `style="max-height: 400px"` — compiled as a
   static style prop, so it outranked every author sheet short of `!important`
   and no media query could reach it — starving tall figures inside the measure
   (f01 rendered 280×400 with 56% of its box unused). ⊘ `K-7`'s correction is
   carried: the 48rem column is never realised, so the true measure is the
   corrected figure and not the axis's "≥640px". Cascade-reachable now, and
   relative to the viewport the figure actually sits in. */
.paper-figure,
.paper-portrait {
    max-block-size: min(60svh, 34rem);
    block-size: auto;
}

/* X.F.W3 `.d` / `PAW-8` — the hand-drawn chassis is DELETED, not re-tuned. The
   inline-flex box, the gap, the pad, the weight, the primary fill and ink, the
   9999px pill, the `text-decoration: none`, the hover lift and both shadow
   steps all belong to `<Button emphasis="primary" size="lg">`, and `PAW-19`’s
   tokenised easing retires with the transition it was correcting — the
   primitive carries its own, including the reduced-motion arm this hand-roll
   never had. What is left is the GLYPH, which is this callout’s alone. */
.callout-btn .fourier-f {
    font-size: 1.1em;
    opacity: 0.85;
}
</style>
