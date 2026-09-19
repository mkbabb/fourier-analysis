<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Button } from "@mkbabb/glass-ui/button";
import { Dialog, DialogContent, DialogTitle } from "@mkbabb/glass-ui/dialog";
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
    "open-visualizer": [imageSlug: string];
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
    <Dialog v-model:open="open">
        <!-- GCM-44: initial focus landed on the LIKE button — FocusScope takes
             the first tabbable in DOM order and everything before it is
             div/img/span, while reka renders the ✕ last at both pins. So the
             modal opened with the keyboard parked on a mutating control whose
             count was frozen (GCM-3) and whose mutation therefore looked
             fictional (GCM-2). Focus goes to the title, which is what the dialog
             is about. One edit, two rows: it is also GCM-4's seat.
             GCM-31: `rounded-dialog` and `rounded-xl` BOTH ship in `cn`'s closed
             rounded enum, so the winner was decided by emission order rather than
             by either author. The consumer token is dropped and the producer's own
             alias is left to win by being the only one present. ⊘ The producer
             leg — teach `cn` its own aliases so the pair can never both survive —
             is a GLASS-RELAY ask on the standing BH inbox, never a frontend hack;
             collected for `.z`. -->
        <DialogContent
            surface="opaque"
            class="modal-card max-w-[28rem] w-full max-h-[90vh] overflow-y-auto p-0 border-2 border-foreground/15"
            @open-auto-focus.prevent
        >
            <DialogTitle class="sr-only" tabindex="-1">
                {{ entry.image_slug }}
            </DialogTitle>
            <!-- GCM-48 ⊕ GCM-30 ⊕ GCM-28 — one deletion, three rows.
                 `<div class="relative overflow-hidden rounded-xl">` was residue of
                 the retired Teleport: DialogContent is already the positioned,
                 clipping, rounded box. Its own `rounded-xl` nested an EQUAL 12 px
                 radius inside its parent's (GCM-30), which is the concentric
                 arithmetic that cannot be right at any value — and once the wrapper
                 is gone that arithmetic stops existing rather than being corrected.
                 GCM-28's stat-row delta dies inside the same dedup. Three tickets
                 would have reported three causes for one change. -->
                    <!-- Image frame -->
                    <div class="relative aspect-[16/10] border-b border-foreground/8 bg-muted overflow-hidden">
                        <img
                            :src="overlayUrl(entry.image_slug)"
                            :alt="entry.image_slug"
                            class="w-full h-full object-contain"
                        />
                        <!-- Tier badge -->
                        <div
                            v-if="entry.tier !== 'normal'"
                            class="modal-tier-badge absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold capitalize backdrop-blur-sm bg-background/70"
                            :data-tier="entry.tier"
                        >
                            <!-- GCM-49: Crown and Bookmark serve as tier READ-OUT
                                 here and as tier COMMAND below, with nothing
                                 distinguishing the two — the same glyph both
                                 reports the state and changes it. SP-7's
                                 glyph-semantics-collision vocabulary applies: the
                                 read-out glyph is decorative beside the tier word
                                 it duplicates, and the commands say what they DO.
                                 -->
                            <Crown v-if="entry.tier === 'featured'" :size="16" aria-hidden="true" />
                            <Bookmark v-else :size="16" aria-hidden="true" />
                            <span>{{ entry.tier }}</span>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 px-3.5 pt-2.5 pb-3.5">
                        <!-- Slug + stats row -->
                        <div class="flex items-center gap-1.5">
                            <span class="text-sm text-muted-foreground font-mono flex-1 min-w-0 truncate">{{ entry.image_slug }}</span>
                            <time class="text-sm text-muted-foreground shrink-0" :datetime="created.datetime" :title="created.absolute">{{ created.text }}</time>
                        </div>

                        <!-- Stats row -->
                        <div class="flex items-center gap-4 py-1">
                            <span class="inline-flex items-center gap-[0.3rem] text-sm text-muted-foreground">
                                <Eye :size="16" aria-hidden="true" />
                                <span class="font-mono">{{ entry.views }}</span>
                                <span class="text-muted-foreground">views</span>
                            </span>
                            <!-- GCM-36 (SP-7's 2.5.3 cohort, with FR-AUL-26 and
                                 GAB-24): the control RENAMED ITSELF on activation
                                 — the count is inside the accessible name and
                                 `aria-pressed` flips in the same beat, so the
                                 button a speech-input user just read aloud is not
                                 the button that is there a moment later. The name
                                 is now fixed ("Like"), the toggle state rides
                                 `aria-pressed` where it belongs, and the count —
                                 still visible, still the point — is announced as
                                 a DESCRIPTION, which may change without changing
                                 what the control is called.
                                 ⊘ This row is reachable only once GCM-3 unfreezes
                                 the count, and it lands with that fix; it is never
                                 certified against a frozen one.
                                 GCM-45: `.like-btn { height: auto; padding: 0 }`
                                 stripped the chassis's whole target box to ~17–20
                                 px — under SC 2.5.8's 24 px with no exception
                                 available, and unreachable by the coarse floor
                                 because the element is `data-size="sm"`, not
                                 `"icon"`. The same defect D-03 filed against the
                                 library's ✕, at a control this component authored
                                 itself. The padding is restored in the scoped
                                 block; the row keeps its stat-counter look. -->
                            <Button
                                emphasis="quiet"
                                size="sm"
                                class="like-btn"
                                :class="{ liked: isLiked }"
                                :aria-pressed="isLiked"
                                aria-label="Like"
                                :aria-describedby="`modal-like-count-${entry.slug}`"
                                @click="emit('like', entry.slug)"
                            >
                                <Heart
                                    :size="16"
                                    :fill="isLiked ? 'currentColor' : 'none'"
                                    aria-hidden="true"
                                />
                                <span :id="`modal-like-count-${entry.slug}`" class="font-mono">
                                    {{ entry.likes }}
                                </span>
                                <span class="text-muted-foreground" aria-hidden="true">likes</span>
                            </Button>
                        </div>

                        <!-- GCM-12: the plate rendered UNCONDITIONALLY — a
                             titled box wrapping an empty flex row whenever
                             `basisLabels` is empty, which `active_bases` (an
                             unconstrained `string[]` with a server default of
                             `[]`) makes ordinary, and which the `:46` null-guard
                             in this file already admits is reachable. A titled
                             empty box asserts that a decomposition exists and
                             failed to render. An empty state is not an error
                             state: the surface now says which of the two it
                             means. ⊘ Narrowing `active_bases` to a closed domain
                             is F.W5's contract row, cited not booked. -->
                        <div class="bg-muted/30 rounded-lg px-3 py-2">
                            <div class="pb-1">
                                <span class="cm-serif text-sm font-semibold tracking-tight">Decomposition</span>
                            </div>
                            <p v-if="!basisLabels.length" class="text-sm text-muted-foreground">
                                No basis functions recorded for this visualization.
                            </p>
                            <div v-else class="flex flex-wrap gap-1">
                                <Badge
                                    v-for="b in basisLabels"
                                    :key="b.label"
                                    variant="outline"
                                    size="sm"
                                    class="basis-tint inline-flex items-center gap-[0.2rem] rounded-full font-medium whitespace-nowrap"
                                    :style="{ '--pill-c': b.color }"
                                >
                                    <span class="cm-serif font-semibold text-[1.1em]">{{ b.icon }}</span>
                                    {{ b.label }}
                                </Badge>
                            </div>
                        </div>

                        <!-- Parameters -->
                        <div class="bg-muted/30 rounded-lg px-3 py-2">
                            <div class="pb-1">
                                <span class="cm-serif text-sm font-semibold tracking-tight">Parameters</span>
                            </div>
                            <div class="flex items-center justify-between py-1">
                                <span class="text-sm text-muted-foreground">Harmonics</span>
                                <span class="text-base font-semibold font-mono" :style="{ color: VIZ_COLORS.fourier }">
                                    N={{ entry.n_harmonics }}
                                </span>
                            </div>
                        </div>

                        <!-- Admin tier controls -->
                        <div v-if="adminMode" class="flex gap-2">
                            <Button
                                emphasis="secondary"
                                size="sm"
                                class="tier-btn"
                                :class="{ active: entry.tier === 'featured' }"
                                :aria-pressed="entry.tier === 'featured'"
                                :aria-label="
                                    entry.tier === 'featured'
                                        ? 'Featured — select to remove from featured'
                                        : 'Featured — select to mark as featured'
                                "
                                @click="emit('set-tier', entry.slug, entry.tier === 'featured' ? 'normal' : 'featured')"
                            >
                                <Crown :size="14" aria-hidden="true" /> Featured
                            </Button>
                            <Button
                                emphasis="secondary"
                                size="sm"
                                class="tier-btn"
                                :class="{ active: entry.tier === 'saved' }"
                                :aria-pressed="entry.tier === 'saved'"
                                :aria-label="
                                    entry.tier === 'saved'
                                        ? 'Saved — select to remove from saved'
                                        : 'Saved — select to mark as saved'
                                "
                                @click="emit('set-tier', entry.slug, entry.tier === 'saved' ? 'normal' : 'saved')"
                            >
                                <Bookmark :size="14" aria-hidden="true" /> Saved
                            </Button>
                        </div>

                        <!-- CTA -->
                        <Button
                            emphasis="secondary"
                            size="lg"
                            class="callout-btn mt-2.5 gap-1.5 text-base font-semibold"
                            @click="emit('open-visualizer', entry.image_slug)"
                        >
                            <!-- GCM-35: `&Fscr;` is ornament, and it sat INSIDE
                                 the CTA's accessible name with no `aria-hidden`
                                 while its lucide neighbour auto-hides — so the
                                 one command this modal exists to offer announced
                                 itself as a script capital F followed by its
                                 name. Same vocabulary as PAW-21 and PV ★MF-4:
                                 three sites, three rows, one cure. -->
                            <span class="fourier-f" aria-hidden="true">&Fscr;</span>
                            <span>Open Visualizer</span>
                            <ArrowRight class="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
/* GCM-46 — documented as "Card shadow", this rule silently replaced the glass
   MATERIAL. `surface="opaque"` puts the plate on `.glass-floating`, whose
   `box-shadow` is a THREE-leg stack carrying `--glass-material-rim` alongside the
   under-shadow; a single-value unlayered override does not add a shadow to that
   stack, it discards the whole stack — rim included. The modal was the one
   surface in the route drawing without the material every other floating surface
   draws with.
   ⊘ This rule is also the concrete falsifier of D-S5's superlative (K-15): four
   of this block's five rules document each override against the primitive they
   override, and this one — the only one that STRIPS producer material — was
   prefaced by two words. Recorded, not re-derived.
   The under-shadow is restored as a composed leg so the producer's rim survives
   it; SP-6's mechanism (an unlayered override beats the layered material) is
   cited here and the edit stays local. */
.modal-card {
    box-shadow:
        var(--glass-material-rim, 0 0 0 0 transparent),
        var(--shadow-modal);
}

/* A.W2.e — basis-tint colour projection over `<Badge variant="outline">`,
   identical to the GalleryCard recipe; the badge is decorative read-only
   here (no click handler), so `<Badge>` is the precise primitive. */
.basis-tint {
    background: color-mix(in srgb, var(--pill-c) 12%, transparent);
    border-color: color-mix(in srgb, var(--pill-c) 30%, transparent);
    color: var(--pill-c);
}

/* Tier badge colors */
.modal-tier-badge[data-tier="featured"] { color: var(--tier-featured); }
.modal-tier-badge[data-tier="saved"] { color: var(--tier-saved); }

/* GCM-45 — the chassis's target box, restored.
   `height: auto; padding: 0` left a ~17–20 px control: under SC 2.5.8's 24 px
   minimum with no exception available (it is not inline text, not user-agent
   controlled, and there is no equivalent elsewhere), and out of the coarse
   floor's reach because the floor keys `[data-size="icon"]` and this is
   `data-size="sm"`. The stat-counter LOOK was the intent — flat, quiet, no
   capsule — and none of that required deleting the box. The min-height is the
   2.5.8 floor stated as itself; the padding is what makes the pointer target
   match the ink. `background: transparent` keeps the flat look explicitly rather
   than by side effect of a zero box.
   ⊘ Fold-adjacent to FR-AUL-19 and NOT folded into it: those controls keep the
   coarse floor, and this one cannot reach it. */
.like-btn {
    min-height: 1.5rem;
    padding: 0.25rem 0.375rem;
    margin-inline-start: -0.375rem;
    background: transparent;
    gap: 0.3rem;
    font-size: 0.875rem;
    color: var(--muted-foreground);
}
.like-btn:hover,
.like-btn.liked {
    color: var(--like);
    background: transparent;
}

/* `<Button variant="outline" size="sm">` chassis; `.tier-btn` softens the
   border weight and projects the `active` state as a foreground-tint plate. */
.tier-btn {
    border-width: 1.5px;
    border-color: color-mix(in srgb, var(--foreground) 12%, transparent);
    color: var(--muted-foreground);
}
.tier-btn:hover { border-color: color-mix(in srgb, var(--foreground) 25%, transparent); }
.tier-btn[aria-pressed="true"] {
    background: color-mix(in srgb, var(--foreground) 6%, transparent);
    color: var(--foreground);
}

/* `<Button variant="outline" size="lg">` chassis; `.callout-btn` thickens
   the border and adds the cartoon-card foreground/3 plate. */
.callout-btn {
    border-width: 2px;
    border-color: color-mix(in srgb, var(--foreground) 12%, transparent);
    background: color-mix(in srgb, var(--foreground) 3%, transparent);
}
.callout-btn:hover {
    background: color-mix(in srgb, var(--foreground) 7%, transparent);
    border-color: color-mix(in srgb, var(--foreground) 20%, transparent);
}

/* D.W4.c — modal transitions ride on the glass-ui `<Dialog>` primitive
   (CONSTELLATION recipe — DialogContent ships its own data-state animation).
   The bespoke .modal-enter/leave classes retired with the Teleport+Transition. */
</style>
