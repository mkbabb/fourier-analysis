<script setup lang="ts">
import {
    PaperSection,
    PaperSectionBlocks,
    PAPER_CONTEXT,
    type PaperContext,
    type FlatPaperSection,
} from "@mkbabb/latex-paper/vue";
import { computed, inject } from "vue";
import { ArrowRight } from "@lucide/vue";
import { Button } from "@mkbabb/glass-ui/button";
import {
    DARK_INVERT_EXEMPT,
    resolveFigure,
    type ResolvedFigure,
} from "@/lib/figureDimensions";

/**
 * One section of the paper's virtual window, as its own component.
 *
 * §0hz.paper — the figures flashed on scroll. Rendered inline in the window's
 * `v-for`, `<PaperSection>`'s default slot read the loop variable `item`, so
 * Vue compiled it as a DYNAMIC slot: every render of the window (each time the
 * scroll moved its range or a spacer) force-updated every mounted
 * `PaperSection`, and with it every `PaperSectionBlocks`, whose `#figure`
 * outlet is an inline-arrow component (`:is="() => slot(...)"`, a new
 * component type per render). Each such update unmounted and recreated every
 * on-screen figure's `<picture>`/`<img>` — measured on prod: ~2,000 `<img>`
 * re-creations over one scroll pass and back, ~200 of them while the figure
 * was on screen, each a fresh element that paints blank until it decodes.
 *
 * Here the slots read this component's own prop, so they compile STABLE, and
 * the window's re-renders pass the same `item` object (the window slices one
 * item list), so a mounted section is not re-rendered by scrolling at all.
 * (The arrow outlet itself is latex-paper's to retire — LATEX-PAPER relay.)
 */
defineProps<{
    item: FlatPaperSection;
}>();

const baseUrl = import.meta.env.BASE_URL;

/**
 * `PAW-18`: `resolveFigure()` was invoked SEVEN times per figure per render —
 * two regex replaces, a `Set.has`, three concatenations and a fresh object each
 * time, with no CSE in the compiler — multiplied by the remount-per-patch the
 * window used to produce. The resolution is memoised per filename; the data behind it
 * is a build-time constant, so a cached answer cannot go stale.
 *
 * The map moved here unchanged when the section was extracted (§0hz.paper).
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
                        class="max-w-full rounded-lg"
                        :class="
                            DARK_INVERT_EXEMPT.has(fig.filename)
                                ? 'paper-portrait'
                                : 'paper-figure'
                        "
                        decoding="sync"
                    />
                    <!-- §0hz.paper: the virtual window IS this figure's lazy
                         loader — the `<img>` exists only while its section is
                         within the window's overscan, and a section scrolled
                         back into the window mounts a fresh one. `loading="lazy"`
                         deferred that mounted image's fetch to the next
                         intersection pass and `decoding="async"` let the frame
                         paint without its pixels, so a re-entered figure showed
                         as a blank box for a few frames (measured on prod: 3–5
                         blank figure frames per cell over one ascent). Eager and
                         sync, a re-entered figure paints with its pixels in the
                         frame it mounts. -->
                </picture>
            </template>
            <template #callout="{ callout }">
                <div class="interactive-callout">
                    <p
                        class="font-serif-math text-small text-muted-foreground mb-3"
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
                         the `inherit` corner rule-wide) was NOT taken
                         here (it is TAKEN at X.F.W11.a, style.css), and `K-5`’s LOCK is why: that deletion must
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
                        size="md"
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
</template>

<style scoped>
@reference "tailwindcss";
.interactive-callout {
    margin: 1.5rem 0;
    padding: 1.25rem 1.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-panel);
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

/* X-DS fourier pass 6 (critic P6) · DS-F6P-C3: the line-art figure's own
   opaque ground sat as a white (light) or #000 (dark) slab inside the card.
   It blends into --card instead (`--paper-figure-blend`, style.css). */
.paper-figure {
    mix-blend-mode: var(--paper-figure-blend);
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
