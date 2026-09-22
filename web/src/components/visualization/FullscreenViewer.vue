<script setup lang="ts">
/**
 * X.F.W3 `.d` — `fr-FullscreenViewer FV-2` (⊕ `FV-1`, `FV-3`, `FV-5`, `FV-6`,
 * `FV-7`, `FV-10`, `FV-17`), a BLOCKER cured by ADOPTING THE DIALOG CHASSIS —
 * the one that already ships in-tree ONE DIRECTORY OVER (`ExportModal.vue`
 * imports `@mkbabb/glass-ui/dialog`).
 *
 * WHAT THIS FILE WAS: full dialog BEHAVIOUR with zero dialog SEMANTICS. A
 * `<Teleport to="body">` backdrop, a hand-rolled Tab wrap, a document-level
 * Escape listener, a hand-rolled focus restore — and no `role="dialog"`, no
 * `aria-modal`, no inert background. An assistive technology was handed a
 * viewport-filling surface it was never told was modal, over a document it was
 * never told had stopped.
 *
 * The three sharpest limbs, each dying at the chassis rather than at a patch:
 *
 *   `FV-2`/`FV-17` — THE TRAP'S OWN PREDICATE WAS BLIND. `focusableEls()`
 *   filtered on `el.offsetParent !== null`, which sees `display:none` and sees
 *   nothing else: an element inside a `visibility:hidden` subtree, or inside an
 *   `inert` one, has a non-null `offsetParent` and was counted as a trap stop.
 *   So Tab could land on a control the user could neither see nor operate.
 *   reka's trap is built on the platform's own inertness, not on a layout read.
 *
 *   `FV-1`/`FV-6` — THE Z-TIER WAS A LOCAL INVENTION. `--z-fullscreen` (150)
 *   sat above every glass floating primitive (≤130), so a tooltip, a popover or
 *   a select opened from inside this surface painted BEHIND it. The chassis
 *   sits on the design system's own `z-modal` rung, which the floating tiers
 *   are ordered against by construction. `R-6`'s z-tier caveat rides this
 *   adoption rather than being re-litigated here.
 *
 *   `FV-7` — the `@click.self` on the backdrop was STRUCTURALLY DEAD: the
 *   container is `width:100%;height:100%`, so the backdrop had no exposed
 *   surface for `.self` to ever match. It is not ported; outside-dismissal is
 *   the chassis's, and on a viewport-filling surface the honest answer is that
 *   there IS no outside — which is why `dismiss="deliberate"` is chosen: Escape
 *   closes, and the visible Minimize control closes, and nothing else pretends
 *   to.
 *
 * `FV-3`/`FV-5`/`FV-10` dissolve in the same adoption (the portal, the scroll
 * lock and the focus restore are all the chassis's now). The ~60 lines of trap,
 * listener and restore below are DELETED, not wrapped.
 *
 * ⊘ `FB-1` — the second `<ContourEditorCanvas>` mounted here with no `ref` and
 * no listeners, so fullscreen contour edits are silently discarded — is NOT
 * cured here. It rides `fr-ContourEditorCanvas D`/`B-5`'s banked BLOCKER with
 * its own F.W1 sequencing rider, and `ContourEditorCanvas.vue` is in no bounds
 * row of this unit. Named, not half-landed.
 */
import { ref } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Dialog, DialogContent, DialogTitle } from "@mkbabb/glass-ui/dialog";
import { Minimize2 } from "@lucide/vue";
import type { ContourAsset } from "@/lib/types";
import BasisCanvas from "./BasisCanvas.vue";
import ContourEditorCanvas from "./ContourEditorCanvas.vue";
import AnimationControls from "./AnimationControls.vue";

const props = defineProps<{
    visible: boolean;
    activeBases: string[];
    showGhost: boolean;
    showImageOverlay?: boolean;
    isEditing?: boolean;
    contour?: ContourAsset;
    imageSlug?: string | null;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "toggleGhost"): void;
    (e: "toggleImageOverlay"): void;
}>();

const canvasComponent = ref<InstanceType<typeof BasisCanvas>>();

/**
 * The chassis owns open/closed; this component stays a controlled consumer, as
 * `ExportModal` already is. `@update:open` fires `false` on Escape and on the
 * close control, so one bridge covers every dismissal path — where the old file
 * had a document `keydown` listener, a `@click.self`, and a Button, each
 * calling `emit("close")` by hand.
 */
function onOpenChange(open: boolean) {
    if (!open) emit("close");
}
</script>

<template>
    <Dialog :open="props.visible" @update:open="onOpenChange">
        <DialogContent
            class="fs-dialog"
            surface="opaque"
            dismiss="deliberate"
            :scroll="false"
        >
            <!-- Every modal surface owes a name. The old one had none at all;
                 this one says what it is and keeps the chrome the viewport
                 treatment wants. -->
            <DialogTitle class="sr-only">
                {{ isEditing ? "Contour editor, fullscreen" : "Visualization, fullscreen" }}
            </DialogTitle>

            <Button
                emphasis="primary"
                size="md"
                icon-only
                class="fs-close"
                aria-label="Exit fullscreen"
                @click="emit('close')"
            >
                <Minimize2 class="h-5 w-5" />
            </Button>

            <!-- Canvas fills the viewport -->
            <ContourEditorCanvas
                v-if="isEditing && contour"
                :contour="contour"
                :image-slug="imageSlug ?? null"
                :show-image-overlay="showImageOverlay"
            />
            <BasisCanvas
                v-else
                ref="canvasComponent"
                :active-bases="activeBases"
                :show-ghost="showGhost"
                :show-image-overlay="showImageOverlay"
            />

            <!-- Timeline overlaid at the bottom -->
            <div v-if="!isEditing" class="fs-controls">
                <AnimationControls
                    :active-bases="activeBases"
                    :show-ghost="showGhost"
                    :show-image-overlay="showImageOverlay"
                    max-width="60rem"
                    @toggle-ghost="emit('toggleGhost')"
                    @toggle-image-overlay="emit('toggleImageOverlay')"
                    @export-frame="canvasComponent?.exportFrame()"
                />
            </div>
        </DialogContent>
    </Dialog>
</template>

<style>
/* X.F.W10S.b — `G-F9-11` / `C2-M1`: THESE RULES ARE UNSCOPED BECAUSE THEIR
   ROOT IS TELEPORTED. `DialogContent` renders through the chassis's portal, so
   its element is not this component's single root and never receives this
   file's scope attribute: while these rules sat in `<style scoped>` they
   compiled to `.fs-dialog[data-v-…]`, matched NOTHING, and the "fullscreen"
   viewer opened as the chassis's default 512px centred card — whose bottom
   timeline strip (`.fs-controls`) then lay over the Exit control and took its
   clicks. `translate: none` joins `transform: none` because the chassis centres
   with the `translate` LONGHAND, which `transform` cannot reach.
   Both blocks stay UNLAYERED, and that is measured, not habit: the chassis
   seats its card in `components/dialog/styles.css` as UNLAYERED `:where(
   [data-slot="dialog-content"])` rules (`inline-size: min(…, 32rem)`,
   `translate: -50% -50%`), which no `@layer glass-overrides` rule can outrank —
   placed there first, the geometry took `inset`/`max-*` and lost `inline-size`
   and `translate` (512px, still off-centre). An unlayered class beats a
   zero-specificity `:where()` and re-authors nothing else of the producer's
   register; the chrome strip likewise meets this app's own unlayered scoped
   canvas roots. */

/* PLACEMENT IS THIS FILE'S BUSINESS, CHROME IS NOT — `FV-13`'s ruling, applied
   to the chassis. The dialog's default seat is a centred floating card; this
   surface IS the viewport, so the geometry is overridden here and NOTHING about
   the producer's glass register, motion, veil or z-rung is re-authored. The
   deleted `--z-fullscreen` backdrop is exactly the local invention `FV-1`
   books. X.F.W11.a (OA-1): the squared corner is abrogated with the same
   reading — corner shape is the producer's chrome, so the dialog keeps the
   `--radius-3xl` its `[data-slot="dialog-content"]` rule ships. */
.fs-dialog {
    inset: 0;
    width: 100vw;
    max-width: none;
    height: 100dvh;
    max-height: none;
    transform: none;
    translate: none;
    border: none;
    padding: 0;
    display: flex;
    flex-direction: column;
}

/* X.F.W4 · `fr-FullscreenViewer FV-14` (R-2) — `flex: 1` and `min-height: 0`
   are DELETED, not kept "for safety": both children declare the pair on their
   own roots in their own scoped blocks (`BasisCanvas.vue`'s
   `.canvas-container`, `ContourEditorCanvas.vue`'s `.editor-shell`), so this
   was a no-op duplication that two corpus superlatives certified as craft. The
   CHROME STRIP below is the real design judgement and it stays — a card frame
   is meaningless when the surface IS the viewport; the children keep their
   own token corners inside the rounded dialog (X.F.W11.a). */
.fs-dialog .canvas-container,
.fs-dialog .editor-shell {
    border: none;
    box-shadow: none;
}

.fs-dialog .canvas-container:hover {
    border-color: transparent;
    box-shadow: none;
}
</style>

<style scoped>
/**
 * X.F.W4 · `fr-FullscreenViewer` FV-8 ⊕ FV-12 ⊕ FV-13 ⊕ FV-22, one block,
 * because they are four readings of a single decision: this control
 * re-implemented, in unlayered scoped CSS, the chrome the `<Button>` it is
 * already wearing ships.
 *
 * FV-8 — the hover/press rules re-authored the glass chrome with ad-hoc
 * `color-mix()` literals over `--glass-bg/border-resting`, and unlayered scoped
 * CSS beats the layered utilities, so the producer's register lost. ⊘ The press
 * is the sharp half and the mechanism was corrected in adjudication: the local
 * rule set `transform`, while glass-ui's press seat is the `scale` LONGHAND, so
 * the two did not override — they COMPOUNDED, multiplying into a press deeper
 * than either author specified. Deleting the local rules is the whole cure;
 * they are a `feedback_glass_ui_first_class` violation besides.
 *
 * FV-12 — the same `transform` survived the producer's reduced-motion blanket
 * twice over: `base.css`'s `.tap-squish:active { scale: 1 }` reset targets the
 * longhand and cannot reach a `transform`, and the PRM blanket strips
 * `transform` from the TRANSITIONED set — which un-animates the jump without
 * removing it, so under `reduce` the scale applied INSTANTLY. Motion reduction
 * inverted into sharpening. It dies with the rules that declared it.
 *
 * FV-22 — `calc(var(--z-fullscreen) + 10)` minted an unnamed rung numerically
 * equal to `--z-toast`, inside the backdrop's OWN stacking context, where any
 * positive value orders identically. It bought nothing and collided nominally
 * with a named tier; `1` says what is actually meant.
 *
 * FV-13 — the 2.5rem box is left to the `<Button size="md" icon-only>` it is
 * declared on, so the control sits on the system's control ladder (and its
 * coarse-pointer floor) instead of beside it at a hand-set 40px. What remains
 * here is placement and the stacking rung: position is this file's business,
 * chrome is not.
 */
.fs-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 1;
}

.fs-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    /* FV-22, the second site: same unnamed rung, same own stacking context. */
    z-index: 1;
    padding: 0 1rem 0.75rem;
    display: flex;
    justify-content: center;
}

@media (min-width: 640px) {
    .fs-controls {
        padding: 0 2rem 1rem;
    }
}

/* Wider controls in fullscreen are now driven by the AnimationControls
   `max-width` prop (see template), replacing the former
   `--animation-dock-max-width` CSS-var contract. */

/* X.F.W3 `.d` — the hand-rolled `fs-*` enter/leave transition is DELETED with
   the backdrop it animated. `DialogContent` carries the producer's own modal
   motion, including its reduced-motion arm; a second, unlayered scale/opacity
   pair over the top is the `FV-12` class of defect, not a preservation. */
</style>
