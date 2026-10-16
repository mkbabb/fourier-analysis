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
 * X.F.W14V.u1 — UIA-F-14 (BROKEN) ⊕ F-93 ⊕ F-182 ⊕ F-244: THIS FILE NO LONGER
 * MOUNTS A STAGE. It mounted a second BasisCanvas and a second
 * ContourEditorCanvas with no ref and no listeners (FB-1: fullscreen edits were
 * discarded, no editor dock, no canvas dock, a free-floating Exit Button, and
 * Export bypassing the dialog). The takeover is now only the chassis and an
 * empty host: `VisualizationView` teleports its ONE live stage (BasisCanvas,
 * the editor with its ref and listeners, both docks, the equation panel) into
 * the host while the takeover is open, and back when it closes. Nothing is
 * remounted, so the canvas, the editor's history and every listener are the
 * same objects inline and in fullscreen. The way out is the hosted canvas
 * dock's own Fullscreen control, turned to Exit.
 */
import type { VNode } from "vue";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@mkbabb/glass-ui/dialog";

const props = defineProps<{
    visible: boolean;
    isEditing?: boolean;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    /** The stage host while the takeover is mounted; `null` once it is gone. */
    (e: "update:host", host: HTMLElement | null): void;
}>();

/*
 * The host is handed up from its `beforeMount` vnode hook, which runs inside
 * the patch that mounts the takeover. The parent's teleport then moves the
 * stage in as a queued render job that sorts before the chassis's modal
 * `hideOthers` watcher (a later component). Handed up any later (a template
 * ref is only set after the job queue has run), `hideOthers` walks the stage
 * while it is still in the page (it keeps every `[aria-live]` region's
 * ancestors and hides their siblings), and those marks ride into the takeover:
 * the editor dock read as aria-hidden inside it.
 */
function onHostBeforeMount(vnode: VNode) {
    emit("update:host", vnode.el as HTMLElement);
}

function onHostBeforeUnmount() {
    emit("update:host", null);
}

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
            <!-- X.F.W14U.vdock — UIA-F-244: the takeover says what it holds and
                 how to leave it (Reka's missing-Description warning, and an
                 assistive technology's only account of the surface). -->
            <DialogDescription class="sr-only">
                Press Escape, or Exit fullscreen on the canvas dock, to return to the page.
            </DialogDescription>

            <!-- The ONE live stage is teleported here while the takeover is open. -->
            <div class="fs-stage-host" @vue:before-mount="onHostBeforeMount" @vue:before-unmount="onHostBeforeUnmount" />
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
/* X.F.W14V.u1 — the host the live stage is teleported into fills the takeover;
   the stage's own root (`.viz-panel-right`, `height: 100%`, `position:
   relative`) places its canvas and docks inside it exactly as it does inline.
   The deleted `.fs-close` / `.fs-controls` placement rules went with the
   free-floating Exit Button and the second AnimationControls they placed. */
.fs-stage-host {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}
</style>
