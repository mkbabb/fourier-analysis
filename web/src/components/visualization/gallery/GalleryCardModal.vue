<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Button } from "@mkbabb/glass-ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@mkbabb/glass-ui/dialog";
import { Separator } from "@mkbabb/glass-ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@mkbabb/glass-ui/toggle-group";
import type { GalleryTier, Visualization } from "@/lib/types";
import { overlayUrl } from "@/lib/api";
import { useTimeAgo } from "@/lib/time";
import { basisChips } from "../lib/basis-display";
import { VIZ_COLORS } from "@/lib/colors";
import {
    ArrowRight,
    Eye,
    Heart,
    Crown,
    Bookmark,
} from "@lucide/vue";

const props = defineProps<{
    entry: Visualization;
    adminMode?: boolean;
    isLiked?: boolean;
}>();

/**
 * X.F.W3 `.e` / `fr-GalleryCardModal GCM-47` ⊕ `GCM-39` — the union is
 * imported rather than re-spelled, and the payload label matches what is
 * actually emitted (`entry.slug`).
 */
const emit = defineEmits<{
    close: [];
    like: [slug: string];
    /** UIA-F-96: the visualization's slug — the saved entity opens at `/v/`. */
    "open-visualizer": [slug: string];
    "set-tier": [slug: string, tier: GalleryTier];
}>();

// D.W4.c — re-pointed onto the glass-ui `<Dialog>` primitive (already in
// use at GalleryView.vue:381 for batch + AdminFlaggedPanel.vue:264 for
// flagged confirms). `<Dialog>` brings role="dialog" + focus-trap +
// Escape-close + return-focus for free — the previous hand-rolled Teleport
// + Transition + Escape listener retires.
const open = computed({
    get: () => true,
    set: (v: boolean) => { if (!v) emit("close"); },
});

/**
 * X.F.W3 `.e` / `fr-BasisSelector M-10` — the byte-identical twin of this
 * computed lived in the sibling file, and a third spelling on the canvas. All
 * three now call one builder: the key->family bridge and the mode-label ladder
 * are `lib/basis.ts`'s, and the chip assembly is the display table's.
 */
const basisLabels = computed(() => basisChips(props.entry.active_bases));

/** UIA-F-99: the human title is the dialog's title; the slug is its fallback. */
const name = computed(() => props.entry.title?.trim() || props.entry.slug);

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

/**
 * X.F.W14.u — UIA-F-45: GCM-44's intent was "focus goes to the title", but the
 * handler was a bare `.prevent`: it stopped reka's first-tabbable focus and put
 * focus nowhere, so it stayed on the background card and Tab walked the page
 * behind the dialog. The handler now does what the note says: prevent the
 * default target, then focus the (programmatically focusable) title inside
 * the content, which puts focus inside the trap.
 */
function focusTitle(e: Event) {
    e.preventDefault();
    (e.target as HTMLElement | null)?.querySelector<HTMLElement>("[data-initial-focus]")?.focus();
}
</script>

<template>
    <Dialog v-model:open="open">
        <!-- X.F.W14U.gallery — UIA-F-99 ⊕ UIA-F-188 ⊕ UIA-F-247: the modal is
             glass's Dialog as published — its plate un-bordered and un-shadowed
             by the consumer (the `border-2` rim and the `.modal-card` cast are
             deleted), a VISIBLE DialogHeader whose DialogTitle is the human title
             in the serif display step and whose DialogDescription carries the
             slug and the age. The Decomposition and Parameters "plates" become
             headed sections; the admin tier is one 3-state ToggleGroup; the
             CTA is the primary action. GCM-44 stands: focus opens on the title. -->
        <DialogContent
            surface="opaque"
            scroll
            class="max-w-[28rem] w-full"
            @open-auto-focus="focusTitle"
        >
            <DialogHeader>
                <DialogTitle class="font-serif-math text-xl" tabindex="-1" data-initial-focus>
                    {{ name }}
                </DialogTitle>
                <DialogDescription class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span v-if="entry.title">{{ entry.slug }}</span>
                    <span v-if="entry.title" aria-hidden="true">·</span>
                    <time :datetime="created.datetime" :title="created.absolute">{{ created.text }}</time>
                    <Badge v-if="entry.tier !== 'normal'" variant="outline" size="sm" class="modal-tier" :data-tier="entry.tier">
                        <Crown v-if="entry.tier === 'featured'" :size="12" aria-hidden="true" />
                        <Bookmark v-else :size="12" aria-hidden="true" />
                        <span class="capitalize">{{ entry.tier }}</span>
                    </Badge>
                </DialogDescription>
            </DialogHeader>

            <div class="modal-media">
                <img :src="overlayUrl(entry.image_slug)" alt="" />
            </div>

            <!-- Stats. GCM-36: the like control's name is fixed ("Like"), the
                 state rides `aria-pressed`, the count is its description. -->
            <div class="flex items-center gap-4">
                <span class="inline-flex items-center gap-[0.3rem] text-sm text-muted-foreground">
                    <Eye :size="16" aria-hidden="true" />
                    <span class="tabular-nums">{{ entry.views }}</span>
                    <span>views</span>
                </span>
                <Button
                    emphasis="quiet"
                    size="sm"
                    class="like-btn"
                    :aria-pressed="isLiked"
                    aria-label="Like"
                    :aria-describedby="`modal-like-count-${entry.slug}`"
                    @click="emit('like', entry.slug)"
                >
                    <Heart :size="16" :fill="isLiked ? 'currentColor' : 'none'" aria-hidden="true" />
                    <span :id="`modal-like-count-${entry.slug}`" class="tabular-nums">{{ entry.likes }}</span>
                    <span class="text-muted-foreground" aria-hidden="true">likes</span>
                </Button>
            </div>

            <Separator decorative />

            <section class="modal-section" aria-labelledby="modal-decomposition">
                <h3 id="modal-decomposition" class="modal-section-title font-serif-math">Decomposition</h3>
                <p v-if="!basisLabels.length" class="text-sm text-muted-foreground">
                    No basis functions recorded for this visualization.
                </p>
                <div v-else class="flex flex-wrap gap-1">
                    <Badge
                        v-for="b in basisLabels"
                        :key="b.label"
                        variant="outline"
                        size="sm"
                        class="basis-tint inline-flex items-center gap-[0.2rem] font-medium whitespace-nowrap"
                        :style="{ '--pill-c': b.color }"
                    >
                        <span class="font-serif-math font-semibold text-[1.1em]" aria-hidden="true">{{ b.icon }}</span>
                        {{ b.label }}
                    </Badge>
                </div>
            </section>

            <section class="modal-section" aria-labelledby="modal-parameters">
                <h3 id="modal-parameters" class="modal-section-title font-serif-math">Parameters</h3>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-muted-foreground">Harmonics</span>
                    <span class="text-base font-semibold tabular-nums" :style="{ color: VIZ_COLORS.fourier }">
                        N={{ entry.n_harmonics }}
                    </span>
                </div>
            </section>

            <section v-if="adminMode" class="modal-section">
                <ToggleGroup
                    type="single"
                    size="sm"
                    aria-label="Tier"
                    :model-value="entry.tier ?? 'normal'"
                    @update:model-value="(t) => typeof t === 'string' && t !== (entry.tier ?? 'normal') && emit('set-tier', entry.slug, t as GalleryTier)"
                >
                    <ToggleGroupItem value="normal">Normal</ToggleGroupItem>
                    <ToggleGroupItem value="featured">
                        <Crown :size="14" aria-hidden="true" /> Featured
                    </ToggleGroupItem>
                    <ToggleGroupItem value="saved">
                        <Bookmark :size="14" aria-hidden="true" /> Saved
                    </ToggleGroupItem>
                </ToggleGroup>
            </section>

            <DialogFooter>
                <!-- UIA-F-96: opens the saved visualization (`/v/<slug>`), its
                     own settings, not the image's working draft. GCM-35: the
                     script F is ornament. -->
                <Button emphasis="primary" size="lg" class="gap-1.5" @click="emit('open-visualizer', entry.slug)">
                    <span class="font-serif-math" aria-hidden="true">&Fscr;</span>
                    <span>Open Visualizer</span>
                    <ArrowRight class="h-4 w-4" aria-hidden="true" />
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
/* UIA-F-247: the media sits on `--radius-media` inside the Dialog's padding,
   at its own aspect (the contour overlay is contained, never cropped). */
.modal-media {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    border-radius: var(--radius-media);
    background: var(--muted);
}
.modal-media img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.modal-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.modal-section-title {
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--foreground);
}

.modal-tier[data-tier="featured"] { color: var(--tier-featured); }
.modal-tier[data-tier="saved"] { color: var(--tier-saved); }

/* A.W2.e — basis-tint colour projection over `<Badge variant="outline">`,
   the GalleryCard recipe. */
.basis-tint {
    background: color-mix(in srgb, var(--pill-c) 12%, transparent);
    border-color: color-mix(in srgb, var(--pill-c) 30%, transparent);
    color: var(--pill-c);
}

/* GCM-45 — the flat stat-counter look; the state paints from `aria-pressed`
   (FR-COB-3). X.F.W14V.au1 — A2-FO-L2-17: the local `min-height: 1.5rem`
   literal is deleted. Unlayered, it beat glass Button's coarse-pointer floor
   (`[data-control-target]` → `--touch-target`), so on touch the Like measured
   82.5×34. The target is glass's again: 24 px on a fine pointer, 44 on touch. */
.like-btn {
    padding: 0.25rem 0.375rem;
    margin-inline-start: -0.375rem;
    background: transparent;
    gap: 0.3rem;
    font-size: 0.875rem;
    color: var(--muted-foreground);
}
.like-btn:hover,
.like-btn[aria-pressed="true"] {
    color: var(--like);
    background: transparent;
}
</style>
