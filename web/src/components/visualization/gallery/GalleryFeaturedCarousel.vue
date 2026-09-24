<script setup lang="ts">
/**
 * X.F.W3 `.d` — `fr-GalleryFeaturedCarousel FR-GFC-7` (⊕ `FR-GFC-5`,
 * `FR-GFC-6`). Four anonymous `<div>`s and a styled `<span>`: no landmark, no
 * heading, no carousel semantics, no previous/next — a horizontally scrolling
 * strip that a keyboard user could not traverse and a screen reader was never
 * told was a strip at all. `./carousel` ships `aria-roledescription`,
 * ArrowLeft/ArrowRight traversal and a pager at BOTH pins.
 *
 * ▲ THE BANKED COST IS REFUTED AT THE ADOPTED PIN, MEASURED HERE RATHER THAN
 * INHERITED. The row prices "the Embla peer trio is hoisted but
 * `embla-carousel-vue` is undeclared in `web/package.json` — a one-line F.W0
 * cost". At 8.0.0 the producer's Carousel is built on its OWN `deck` core:
 * walking every import edge out of `dist/carousel.js` reaches exactly `vue`,
 * `reka-ui`, `@lucide/vue` and `@mkbabb/keyframes.js` — no `embla` string
 * appears anywhere in the chunk, and `node_modules/embla-carousel*` does not
 * exist. There is no peer to declare, so the F.W0 cost is ZERO and this
 * adoption needed no `package.json` row (which is outside this unit's bounds
 * and would have been a §6 triumvirate event had it been needed).
 *
 * `FR-GFC-5` — the hand-rolled `mask-image` edge fade was a VERBATIM static
 * instance of the producer's own retired `R8-08` "Shy" defect, at HALF the
 * tokenized ramp: a fixed 0.5rem feather painted whether or not the strip had
 * anything to feather. `FR-GFC-6`'s computed `overflow-y: auto` (the inevitable
 * companion of a bare `overflow-x: auto`, which clipped the featured card's own
 * glow) dies with the same rule set. Both ride the re-derivation rather than
 * being re-tuned: the producer's viewport owns the travel surface.
 *
 * The `pattern` stays `"group"`, the honest register — this strip owns no
 * tabpanels, and `"tabs"` would be the same class of false announcement
 * `FR-AUL-33` convicted on the batch toolbar.
 */
import type { GalleryTier, Visualization } from "@/lib/types";
import GalleryCard from "./GalleryCard.vue";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPager,
} from "@mkbabb/glass-ui/carousel";
import { Crown } from "@lucide/vue";

defineProps<{
    entries: Visualization[];
    adminMode?: boolean;
    likedHashes?: Set<string>;
    selectedHashes?: Set<string>;
}>();

const emit = defineEmits<{
    "card-click": [entry: Visualization];
    like: [hash: string];
    // X.F.W3 repair 1 (g15, leg 3) — the inline union retires onto
    // `GalleryTier`, its one canonical home. A closed union re-declared at the
    // consumer is a union that stops being closed the first time one copy is
    // widened, which is exactly what had already happened twice elsewhere.
    "set-tier": [hash: string, tier: GalleryTier];
    delete: [hash: string];
    "toggle-select": [hash: string, checked: boolean];
}>();
</script>

<template>
    <section v-if="entries.length > 0" class="featured-section" aria-labelledby="featured-heading">
        <!-- X.F.W14.u — UIA-F-1: `CarouselPager` injects `useCarousel()`, which
             throws by contract outside a `<Carousel>`. The header row sat
             before the root, so any featured entry crashed the Gallery tab
             ('useCarousel must be used within a <Carousel />'). The root now
             holds the header, so the pager reads the deck it pages. -->
        <Carousel aria-labelledby="featured-heading" projection="none">
            <div class="featured-header">
                <Crown :size="16" class="text-tier-featured" aria-hidden="true" />
                <!-- The strip's name was a styled `<span>`; it is the region's
                     heading now, and the carousel is labelled by it. -->
                <h2 id="featured-heading" class="font-serif-math text-sm font-semibold tracking-tight">
                    Featured
                </h2>
                <CarouselPager class="ml-auto" />
            </div>
            <CarouselContent class="featured-scroll">
                <CarouselItem
                    v-for="(entry, i) in entries"
                    :key="entry.slug"
                    :index="i"
                    :label="entry.title ?? entry.slug"
                    class="featured-card-wrapper"
                >
                    <!-- FR-GFC-2 ⊕ FR-GFC-23: the card declares `selected` and
                         emits `toggle-select`, the grid host binds both, and THIS
                         host — the other live mount of the same card — bound
                         neither. In admin mode the featured row therefore rendered
                         its checkboxes permanently unchecked and dropped every click
                         on the floor: a selection made there could not join the batch,
                         and a card selected in the grid then appeared UNSELECTED in
                         the carousel above it. Asserted from the props table, not
                         assumed: `selected` is optional with no default, so the
                         unbound prop is `undefined` and the card's `?? false` is what
                         produced the null-target square. -->
                    <GalleryCard
                        :entry="entry"
                        :admin-mode="adminMode"
                        :liked-hashes="likedHashes"
                        :selected="selectedHashes?.has(entry.slug) ?? false"
                        @click="emit('card-click', entry)"
                        @like="emit('like', $event)"
                        @set-tier="(h, t) => emit('set-tier', h, t)"
                        @delete="emit('delete', $event)"
                        @toggle-select="(hash, checked) => emit('toggle-select', hash, checked)"
                    />
                </CarouselItem>
            </CarouselContent>
        </Carousel>
    </section>
</template>

<style scoped>
.featured-section {
    padding: 0 1rem;
}

.featured-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-bottom: 0.5rem;
    padding-left: 0.25rem;
}

/* `FR-GFC-5` / `FR-GFC-6` — DELETED with the hand-rolled strip: the fixed
   0.5rem `mask-image` feather (the producer's retired "Shy" recipe at half the
   tokenized ramp, painted whether or not anything needed feathering), the
   `overflow-x: auto` whose computed `overflow-y: auto` clipped the featured
   card's own glow, and the two `::-webkit-scrollbar` rules. The producer's
   viewport owns travel, snap and scrollbar treatment. What stays is the gap and
   the member width, which are this gallery's measurements. */
.featured-scroll {
    gap: 1rem;
    padding-bottom: 0.5rem;
}

/* X.F.W14U.gallery (UIA-F-247, usage of space): the member measure is the
   item's flex BASIS. glass's `.carousel-item` is `flex: 0 0 100%` (one member
   per page), which made `width: 16rem` dead — a single featured card spanned
   the whole column at a 4:3 aspect. */
.featured-card-wrapper {
    flex: 0 0 16rem;
}
</style>
