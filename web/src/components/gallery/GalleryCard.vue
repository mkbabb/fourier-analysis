<script setup lang="ts">
import { computed, ref } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Card } from "@mkbabb/glass-ui/card";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Checkbox } from "@mkbabb/glass-ui";
import type { GalleryTier, Visualization } from "@/lib/types";
import { thumbnailUrl } from "@/lib/api";
import { useTimeAgo } from "@/lib/time";
import { basisChips } from "@/components/visualization/lib/basis-display";
import TierMark from "./TierMark.vue";
import TierControl from "./TierControl.vue";
// FR-GFC-22 / G-F4-DEAD-DEP: `VIZ_COLORS` and `PathPreview` were imported and
// never referenced — zero occurrences of either identifier anywhere else in this
// file (`grep -c` = 1 each, the import line itself), so the card was pulling a
// colour table and a whole SFC into its chunk to use neither. `noUnusedLocals`
// had been reporting both as TS6133 the entire time.
import {
    Eye,
    Heart,
    Trash2,
} from "@lucide/vue";

const props = defineProps<{
    entry: Visualization;
    adminMode?: boolean;
    likedHashes?: Set<string>;
    selected?: boolean;
}>();

/**
 * X.F.W3 `.e` / `fr-GalleryCardModal GCM-47` ⊕ `GCM-39`.
 *
 * The closed `GalleryTier` union stops being re-declared inline, and the
 * payload label is corrected AT SOURCE: every one of these events is emitted
 * with `entry.slug`, and has been since the slug migration — calling it `hash`
 * made the reader look for a hash that no call site passes.
 */
const emit = defineEmits<{
    click: [];
    like: [slug: string];
    "set-tier": [slug: string, tier: GalleryTier];
    delete: [slug: string];
    "toggle-select": [slug: string, checked: boolean];
}>();

const isLiked = computed(() => props.likedHashes?.has(props.entry.slug) ?? false);

/** UIA-F-99: the human title names the card; the slug is its fallback. */
const name = computed(() => props.entry.title?.trim() || props.entry.slug);

/** UIA-F-186: the tier is the rim hue, through glass's per-instance accent. */
const tierStyle = computed(() =>
    props.entry.tier === "featured" || props.entry.tier === "saved"
        ? { "--glass-accent": `var(--tier-${props.entry.tier})` }
        : undefined,
);

/** UIA-F-189's thumbnail fallback, shared with the Drafts cards. */
const thumbBroken = ref(false);

/**
 * X.F.W3 `.e` / `fr-BasisSelector M-10` — the byte-identical twin of this
 * computed lived in the sibling file, and a third spelling on the canvas. All
 * three now call one builder: the key->family bridge and the mode-label ladder
 * are `lib/basis.ts`'s, and the chip assembly is the display table's.
 */
const basisLabels = computed(() => basisChips(props.entry.active_bases));

/**
 * X.F.W3 `.e` / `fr-AdminUserList FR-AUL-17` ⊕ `fr-GalleryCardModal GCM-34` —
 * the local copy retires onto `lib/time.ts`.
 *
 * The copy this replaces had the sub-minute floor and nothing else: no cap
 * (`GCM-34`'s "truncates at days forever"), no negative guard, no NaN guard,
 * no `<time>`, and it sampled `Date.now()` DURING RENDER — so on a gallery
 * page left open the ages froze at whatever they read when the card last
 * patched. `useTimeAgo` binds the app's ONE shared clock.
 */
const created = useTimeAgo(() => props.entry.created_at);
</script>

<template>
    <!-- X.F.W14U.gallery — UIA-F-98: the card is glass Card (`--radius-card`,
         Card's own elevation grammar), not a hand-rolled div with a 12 px
         corner, a 2 px rim and a hard offset stamp. The open action is ONE
         native button (the title and the thumbnail), stretched over the card
         so the whole card still opens it; the like, admin and select controls
         sit above the stretch. `role="button"` on the div is gone.
         UIA-F-186: tier, focus and selection are three channels — the tier is
         the rim hue through glass's `--glass-accent`, focus is the producer's
         ring on the open button (and Card's own `:has(:focus-visible)` rung),
         selection is the checked box and the selected fill.
         UIA-F-99 ⊕ UIA-F-187: the title leads and names the card; the slug and
         the age are a muted meta row. -->
    <!-- X-DS DS-F-C1: a resting card is glass's opaque plate (warm --card,
         no backdrop blur), as the paper article is. -->
    <Card
        as="article"
        size="md"
        surface="opaque"
        class="gallery-card deferred-section"
        :data-tier="entry.tier"
        :data-batch-selected="selected || undefined"
        :style="tierStyle"
    >
        <!-- X.F.W14U.admin — UIA-F-191: glass Checkbox at its own size (the
             `h-4 w-4` literal is gone), seated in a label whose inset makes the
             whole plate its hit target (≥ 24 px, WCAG 2.5.8).
             X-DS pass 10 · DS-F12-C1: seated inside the thumbnail's corner
             (`.overlay-plate`), not 6 px off the card's. -->
        <label v-if="adminMode" class="card-raised overlay-plate overlay-plate--start">
            <Checkbox
                :model-value="selected ?? false"
                :aria-label="`Select ${name}`"
                @update:model-value="(v) => emit('toggle-select', entry.slug, v === true)"
            />
        </label>

        <button type="button" class="card-open" :aria-label="`Open ${name}`" @click="emit('click')">
            <span class="card-media">
                <img
                    v-if="!thumbBroken"
                    :src="thumbnailUrl(entry.image_slug)"
                    alt=""
                    loading="lazy"
                    @error="thumbBroken = true"
                />
                <span v-else class="font-serif-math text-2xl text-muted-foreground" aria-hidden="true">&Fscr;</span>
            </span>
            <span class="card-title font-serif-math">{{ name }}</span>
        </button>

        <div class="card-meta">
            <span v-if="entry.title" class="card-slug truncate min-w-0">{{ entry.slug }}</span>
            <time class="whitespace-nowrap shrink-0" :datetime="created.datetime" :title="created.absolute">{{ created.text }}</time>
        </div>

        <div v-if="basisLabels.length" class="flex flex-wrap gap-1">
            <Badge
                v-for="b in basisLabels"
                :key="b.label"
                variant="outline"
                size="sm"
                class="basis-tint inline-flex items-center gap-[0.2rem] font-medium whitespace-nowrap"
                :style="{ '--pill-c': b.color }"
            >
                <span class="font-serif-math font-semibold text-[1.1em]" aria-hidden="true">{{ b.icon }}</span>
                <span class="basis-label">{{ b.label }}</span>
            </Badge>
        </div>

        <div class="card-stats">
            <span class="inline-flex items-center gap-1">
                <Eye class="size-3.5" aria-hidden="true" />
                <span class="tabular-nums">{{ entry.views }}</span>
                <span class="sr-only">views</span>
            </span>
            <Button
                emphasis="quiet"
                size="sm"
                class="like-btn card-raised"
                :aria-pressed="isLiked"
                aria-label="Like"
                @click="emit('like', entry.slug)"
            >
                <!-- X-DS pass 2 · DS-F2-C17: the heart is pinned to the stat glyph
                     size (a `size-*` class, which glass Button's coarse svg rule
                     leaves alone); only the hit area keeps the coarse floor. -->
                <Heart class="size-3.5" :fill="isLiked ? 'currentColor' : 'none'" aria-hidden="true" />
                <span class="tabular-nums">{{ entry.likes }}</span>
            </Button>
            <!-- X.F.W14V.au4 — A2-FO-L1-10: the one tier readout. -->
            <TierMark :tier="entry.tier" class="ml-auto" />
        </div>

        <!-- X-DS pass 10 · DS-F12-C1 ⊕ C2: the action row sits on the select
             control's plate, inside the thumbnail's opposite corner, so the tier
             group and the quiet Delete share one anchored backing. -->
        <div v-if="adminMode" class="card-raised overlay-plate overlay-plate--end">
            <!-- X.F.W14V.au4 — A2-FO-L1-10: the one tier setter (the two
                 independent Crown/Bookmark toggles were a second spelling of
                 the modal's three-state group). -->
            <TierControl compact :tier="entry.tier" @set="(t) => emit('set-tier', entry.slug, t)" />
            <!-- X-DS pass 9 · DS-F11-C3: the danger is carried by the tone's hue,
                 not a lit capsule; the confirm dialog stays the loud surface. -->
            <Button
                emphasis="quiet"
                tone="destructive"
                size="sm" icon-only
                title="Delete"
                @click="emit('delete', entry.slug)"
            >
                <!-- X-DS pass 11 · DS-F13-C2: the glyph on TierControl's 14 px
                     (a `size-*` class, which glass Button's svg rule leaves alone;
                     the `:size` prop was overridden to 16). -->
                <Trash2 class="size-3.5" aria-hidden="true" />
            </Button>
        </div>
    </Card>
</template>

<style scoped>
@reference "tailwindcss";

/* X.F.W14U.gallery — UIA-F-98 ⊕ UIA-F-247: the card's content is laid out in
   glass Card's own measures (`--card-pad`, `--card-gap`; X-DS pass 2 ·
   DS-F2-C16: at `size="md"`, the 1rem pad of the ORIGIN cards, not sm's 8 px); the
   corner, rim and cast are Card's. The bespoke lift-and-scale hover, the
   cartoon offset stamp and the tier border/glow rules are deleted. Hover lifts
   the cast one rung — glass's own `--card-cast-rung`, to the floating rung its
   `:has(:focus-visible)` arm uses — never a transform. */
.gallery-card {
    /* X.F.W14V.au4 — A2-FO-L3-4: the card reads its own width (the compact
       arm below). */
    container: gallery-card / inline-size;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--card-gap);
    padding: var(--card-pad);
    /* J.W4 — content-visibility via glass-ui's `.deferred-section` utility;
       the never-painted estimate of one card. */
    --deferred-section-size: 17rem;
}

/* X-DS pass 1 · F1-13 — hover is a tone step, never a cast promotion: a
   resting card does not rise to the floating shadow rung.
   X-DS fourier pass 5 · DS-F5-C4: the step is taken in the card's own hue
   (lightness only, toward the page's far end in each arm). A --foreground
   veil over the cream lowered its chroma too and greyed it to oatmeal.
   X-DS fourier pass 6 · DS-F6-C1: the arm is the token `--card-hover-step`
   (style.css: −0.02 light, +0.02 dark), read by this one rule. The former
   `:global(.dark) .gallery-card:hover` compiled to a bare `.dark {…}` that
   repainted <html> and left the dark card stepping darker. */
@media (hover: hover) {
    .gallery-card:hover {
        background-color: oklch(from var(--card) calc(l + var(--card-hover-step)) c h);
    }
}

/* UIA-F-186: the tier rim is glass's accent at full strength (the element's
   `--glass-accent` is the tier token); selection is the selected fill. */
.gallery-card[data-tier="featured"],
.gallery-card[data-tier="saved"] {
    --glass-accent-strength: 100%;
}

/* UIA-F-104 (X.F.W14U.admin): selection is its own layer — an outline ring
   outside the rim, so it composes with the tier's rim hue instead of racing it
   (a selected Saved card read exactly as an unselected one); the fill stays. */
/* The hook is `data-batch-selected`: glass Card consumes `data-selected` (its
   own `selected` option state) and drops it from the element, so the fill the
   `.gallery` seat wrote never applied. */
.gallery-card[data-batch-selected] {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    background-image: linear-gradient(
        oklch(from var(--foreground) l c h / var(--fill-selected)),
        oklch(from var(--foreground) l c h / var(--fill-selected))
    );
}

/* The one open action, stretched over the card (the ::after); the controls
   that sit above it are `.card-raised`. */
.card-open {
    display: flex;
    flex-direction: column;
    gap: var(--card-gap);
    text-align: start;
    border-radius: var(--radius-media);
    cursor: pointer;
}
.card-open::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: var(--radius-card);
}
.card-open:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: 2px;
}
.card-raised {
    z-index: 1;
}

.card-media {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: var(--radius-media);
    background: var(--muted);
}
.card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.card-title {
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.3;
    color: var(--foreground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-meta,
.card-stats {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--muted-foreground);
}
.card-meta {
    justify-content: space-between;
}
.card-stats {
    gap: 0.75rem;
}


/* X.F.W14U.admin — UIA-F-191: the admin overlay buttons are glass's `sm`
   icon-only rung as published (square, the producer's press and coarse-pointer
   floor); the `h-7 w-7 rounded-full` literals and the local scale hover, which
   fought the size rung into 28×40 capsules, are deleted. */

/* UIA-F-191: the admin overlays' plate — a legibility backing over the
   thumbnail (and, on the label, the checkbox's hit target in one).
   X-DS pass 10 · DS-F12-C1 ⊕ C2: one plate for both overlays (was the select
   control's alone, leaving Delete a bare glyph on the photo), seated inside
   the media's corners: the media starts at `--card-pad`, so the overlays sit
   one `--space-atom` in from it on both axes (were `top-1.5` literals off the
   card's box, hanging half over the thumbnail's edge).
   X-DS pass 11 · DS-F13-C2: the plate's gap is one `--space-atom`, the same
   step glass ToggleGroup puts between the tier discs (8 px, 4 px at 390), so
   Delete reads as the row's fourth member (was half an atom). */
.overlay-plate {
    position: absolute;
    top: calc(var(--card-pad) + var(--space-atom));
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-atom);
    min-width: 1.5rem;
    min-height: 1.5rem;
    padding: 0.25rem;
    border-radius: var(--radius-md);
    background: color-mix(in oklab, var(--background) 70%, transparent);
}
/* The checkbox brings glass's own 44 px hit square, so its plate takes no
   extra pad: the two plates then share one height (the disc row's 36 + pad). */
.overlay-plate--start {
    inset-inline-start: calc(var(--card-pad) + var(--space-atom));
    padding: 0;
    cursor: pointer;
}
.overlay-plate--end {
    inset-inline-end: calc(var(--card-pad) + var(--space-atom));
}

/* A.W2.e — basis-tint colour projection over `<Badge variant="outline">`.
   Outline ships transparent-bg + border-input; we re-tint border + text + a
   12 %-tinted plate from the per-instance `--pill-c`. */
.basis-tint {
    background: color-mix(in srgb, var(--pill-c) 12%, transparent);
    border-color: color-mix(in srgb, var(--pill-c) 30%, transparent);
    color: var(--pill-c);
}

/* `<Button variant="ghost" size="sm">` ships the focus-ring + hover; the
   `.like-btn` hook narrows the chassis (h-auto, p-0, gap-1) so the stat
   counter row reads as a stat counter, not a chunky pill. */
.like-btn {
    position: relative;
    min-height: 1.5rem;
    padding: 0.25rem 0.375rem;
    margin-inline-start: -0.375rem;
    gap: 0.25rem;
    font-size: 0.8125rem;
    /* X-DS pass 11 · DS-F13-C1: the row's metric, not glass Button's tight
       1.1, so the like count sits on the same line as the view count. */
    line-height: inherit;
    color: var(--muted-foreground);
}
/* X.F.W3 `.e` — the published active-state vocabulary, applied (`FR-COB-3`).
   The like control already SET `aria-pressed` and then painted from a parallel
   `.liked` class: two channels for one state, either changeable without the
   other, and only one of them visible to the producer's `forced-colors` and
   `prefers-contrast` arms — which key on ARIA exclusively. The class binding is
   deleted and the rules key on the attribute. */
.like-btn:hover,
.like-btn[aria-pressed="true"] {
    color: var(--like);
    background: transparent;
}

.like-btn[aria-pressed="true"] :deep(svg) {
    /* A.W3.d — bezier→`--ease-apple-spring`. `like-bounce` is a fourier-local
       keyframe (no glass-ui shadow); CONSTELLATION carry candidate (P-tranche). */
    animation: like-bounce 0.3s var(--ease-apple-spring);
}

@keyframes like-bounce {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
    .like-btn[aria-pressed="true"] :deep(svg) {
        animation: none;
    }
}

/* X.F.W14V.au4 — A2-FO-L3-4: the compact card (the phone's two-column grid,
   about 171 px wide; X-DS pass 1 · F1-08: keyed below 12rem of content box):
   the title and one meta line (the age; the slug steps back, the title names
   the card). X-DS DS-F-C10: the basis chips keep their word ("Epicycles"); a
   bare glyph in a ringed chip read as a stamp. The admin grid never takes this
   arm (GalleryInfiniteGrid.vue). */
@container gallery-card (width < 12rem) {
    .card-slug {
        display: none;
    }
    .card-meta {
        justify-content: flex-start;
    }
}
</style>
