<script setup lang="ts">
import {
    PaperSection,
    PaperSectionBlocks,
    type FlatPaperSection,
} from "@mkbabb/latex-paper/vue";
import type { ComponentPublicInstance } from "vue";
import { ArrowRight } from "lucide-vue-next";
import { FIGURE_DIMENSIONS, hasModernVariants } from "@/lib/figureDimensions";

const props = defineProps<{
    visibleItems: FlatPaperSection[];
    topSpacerPx: number;
    bottomSpacerPx: number;
    registerRoot: (el: HTMLElement | null) => void;
    measureSection: (id: string, el: HTMLElement | null) => void;
}>();

const baseUrl = import.meta.env.BASE_URL;

function toHTMLElement(
    value: Element | ComponentPublicInstance | null,
): HTMLElement | null {
    return value instanceof HTMLElement ? value : null;
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

// I.θ — resolve a figure's served URLs, intrinsic dimensions, and modern-format
// availability. The figure source is a `.pdf` name; figures are rasterized to
// `.png` and transcoded 1:1 to `.avif`/`.webp` siblings (see figureDimensions).
// `<picture>` does NOT fall back on a 404 — only on an unsupported format — so
// the AVIF/WebP `<source>`s are emitted ONLY for figures we know carry variants
// (`hasModernVariants`); every other figure renders as a bare `<img>` PNG.
function resolveFigure(filename: string) {
    const pngName = filename.replace(/\.pdf$/, ".png");
    const png = `${baseUrl}assets/${pngName}`;
    const dims = FIGURE_DIMENSIONS[pngName];
    if (hasModernVariants(pngName)) {
        const stem = pngName.replace(/\.png$/, "");
        return {
            png,
            avif: `${baseUrl}assets/${stem}.avif`,
            webp: `${baseUrl}assets/${stem}.webp`,
            width: dims?.[0],
            height: dims?.[1],
        };
    }
    return { png, avif: null, webp: null, width: dims?.[0], height: dims?.[1] };
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
            <PaperSection
                :id="item.id"
                :number="item.section.number"
                :title="item.section.title"
                :depth="item.depth"
                :section-index="item.rootIndex"
            >
                <PaperSectionBlocks :section="item.section">
                    <template #figure="{ figure }">
                        <picture>
                            <source
                                v-if="resolveFigure(figure.filename).avif"
                                :srcset="resolveFigure(figure.filename).avif!"
                                type="image/avif"
                            />
                            <source
                                v-if="resolveFigure(figure.filename).webp"
                                :srcset="resolveFigure(figure.filename).webp!"
                                type="image/webp"
                            />
                            <img
                                :src="resolveFigure(figure.filename).png"
                                :alt="figure.caption"
                                :width="resolveFigure(figure.filename).width"
                                :height="resolveFigure(figure.filename).height"
                                class="max-w-full rounded-lg shadow-sm"
                                :class="figure.filename.includes('portrait') ? 'paper-portrait' : 'paper-figure'"
                                style="max-height: 400px"
                                loading="lazy"
                                decoding="async"
                            />
                        </picture>
                    </template>
                    <template #callout="{ callout }">
                        <div class="interactive-callout">
                            <p class="cm-serif text-sm text-muted-foreground mb-3">{{ callout.text }}</p>
                            <router-link
                                :to="callout.link"
                                class="callout-btn"
                            >
                                <span class="fourier-f">ℱ</span>
                                <span>Open Visualizer</span>
                                <ArrowRight class="h-4 w-4" />
                            </router-link>
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
.paper-window-root {
    min-width: 0;
}

.paper-window-section {
    min-width: 0;

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
    width: 100%;
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

.callout-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.5rem;
    @apply text-base;
    font-weight: 600;
    color: var(--primary-foreground);
    background: var(--primary);
    border-radius: 9999px;
    text-decoration: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--primary) 25%, transparent);
}

.callout-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 35%, transparent);
}

.callout-btn .fourier-f {
    font-size: 1.1em;
    opacity: 0.85;
}
</style>
