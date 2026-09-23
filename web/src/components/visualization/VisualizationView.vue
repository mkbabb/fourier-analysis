<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { watchDebounced, useMediaQuery } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAnimationStore } from "@/stores/animation";
import { useImageUpload } from "./composables/useImageUpload";
import { useViewState } from "./composables/useViewState";
import { useWorkspaceLoader } from "./composables/useWorkspaceLoader";
import { Upload } from "@lucide/vue";
import { useGalleryStore } from "@/stores/gallery";
import { useToast } from "@/composables/useToast";
import ImageUpload from "./ImageUpload.vue";
import NotFoundCard from "@/components/shared/NotFoundCard.vue";
import ContourSettings from "./ContourSettings.vue";
import BasisCanvas from "./BasisCanvas.vue";
import BasisSelector from "./BasisSelector.vue";
import AnimationControls from "./AnimationControls.vue";
import ContourEditorCanvas from "./ContourEditorCanvas.vue";
import EditorControlsDock from "./EditorControlsDock.vue";
import ContourPreview from "./ContourPreview.vue";
import CanvasControlsDock from "./CanvasControlsDock.vue";
import CoefficientsPanel from "./CoefficientsPanel.vue";
import ExportModal from "./ExportModal.vue";
import FullscreenViewer from "./FullscreenViewer.vue";
import EquationPanel from "./EquationPanel.vue";
import { SegmentedTabs } from "@mkbabb/glass-ui/tabs";
import { Configurator } from "@mkbabb/glass-ui/configurator";
import { Button } from "@mkbabb/glass-ui/button";

const router = useRouter();
const route = useRoute();
/** `/v/:visualizationSlug` (a saved entity) vs `/w/:imageSlug?` (a working session). */
const isSavedRoute = computed(() => route.name === "visualization");
const store = useWorkspaceStore();
const anim = useAnimationStore();
const gallery = useGalleryStore();
const { toast } = useToast();

// ── View state (editing, ghost, overlay — persisted to localStorage) ──
const { isEditing, showGhost, showImageOverlay, showEquation } = useViewState();

// ── Image drag-and-drop ──
const { isDragging: globalDragging, handleDrop: globalDrop, handleDragOver: globalDragOver, handleDragEnter: globalDragEnter, handleDragLeave: globalDragLeave } =
    useImageUpload(async (file: File) => { await store.uploadImage(file); });

// ── Active bases ──
const activeBases = ref<string[]>(
    store.animationSettings?.active_bases ?? ["fourier-epicycles"],
);

// ── Workspace loading, contour settings, auto-play ──
const { nHarmonics, nPoints } = useWorkspaceLoader(activeBases);

// ── Persist animation settings to workspace on change ──
watchDebounced(
    () => [activeBases.value, anim.easing, anim.speed] as const,
    () => {
        if (!store.imageSlug) return;
        store.animationSettings = {
            ...store.animationSettings,
            active_bases: [...activeBases.value],
            easing: anim.easing,
            speed: anim.speed,
        };
    },
    { debounce: 500, deep: true },
);

// ── Canvas + modals ──
const canvasComponent = ref<InstanceType<typeof BasisCanvas>>();
const mobileView = ref<"controls" | "canvas">("controls");
const isDesktop = useMediaQuery("(min-width: 1024px)");
const showExport = ref(false);
const showFullscreen = ref(false);

// ── Editor state ──
// B.W2 — `CanvasControlsDock` now emits `update:expanded` (sibling W2-C
// converts its out-of-band `defineExpose(dockExpanded)` to a typed emit); the
// parent owns the `dockExpanded` ref and listens via `v-model:expanded`.
const dockExpanded = ref(false);
const editorState = ref({ canUndo: false, canRedo: false, canDelete: false, pointCount: 0 });
const editorRef = ref<InstanceType<typeof ContourEditorCanvas> | null>(null);
const editorSaved = ref(false);
const magnetRadius = computed({
    get: () => editorRef.value?.magnetRadius ?? 0,
    set: (v: number) => { if (editorRef.value) editorRef.value.magnetRadius = v; },
});

function onEditorStateChange(state: typeof editorState.value) {
    editorState.value = state;
    editorSaved.value = false;
}

async function onEditorSave() {
    if (!editorRef.value) return;
    await store.saveContourPoints(editorRef.value.getPoints());
    editorSaved.value = true;
}

function handleExportFrame() { showExport.value = true; }
function doExport(options: Record<string, boolean>) {
    canvasComponent.value?.exportFrame(options);
    showExport.value = false;
}

// ── Publish to gallery ──
const publishing = ref(false);

/**
 * X.F.W3 `.e` / `fr-VisualizationView MAJ-7` — ONE ERROR CHANNEL PER ACTION,
 * and the diagnostic this component already holds is the one it shows.
 *
 * THE FALSE NOUN. `store.createSnapshot` is an ALIAS the store keeps for this
 * one unmigrated call site; its own comment says so, and says that it creates a
 * DRAFT VISUALIZATION rather than a snapshot row. The failure message
 * ("Could not create snapshot") therefore named an entity the system stopped
 * having. The call site adopts the real verb, `saveVisualization`, which is
 * exported beside the alias — so the noun is corrected at THIS end, without
 * reaching into a store this unit does not own. The alias is left with no
 * caller and is named as residue for the store's owner.
 *
 * THE DUPLICATE CHANNEL. Two toasts served one failed save. `gallery.publish`
 * catches and toasts every failure of its own and never rethrows, and
 * `saveVisualization` catches everything and returns `null` — so the `catch`
 * arm here could only ever fire a SECOND message about a failure something
 * else had already reported, and at the settled bytes it is unreachable
 * besides. It is deleted; `finally` keeps the busy flag, which is the only work
 * it was actually doing.
 *
 * THE DISCARDED DIAGNOSTIC. `saveVisualization` writes `problemMessage(e, …)`
 * into `store.error` — the real reason, from the real response — and this
 * function threw it away to volunteer a constant. It is read here, with the
 * constant demoted to the fallback it always should have been.
 */
async function handlePublish() {
    if (!store.imageSlug || !store.contour) return;
    publishing.value = true;
    try {
        const saved = await store.saveVisualization();
        if (!saved) {
            toast(store.error ?? "Could not save the visualization", "error");
            return;
        }
        await gallery.publish(saved.slug, store.imageSlug);
    } finally {
        publishing.value = false;
    }
}

// ── Derived state ──
const hasData = computed(() => store.epicycleData || store.basesData || store.computing);
const hasEpicycles = computed(() => activeBases.value.includes("fourier-epicycles"));
const hasImage = computed(() => !!store.imageMeta);

// ── Mobile canvas click-to-upload ──
/**
 * X.F.W13.c — owner frame 4 (2026-09-23, OA-16): "we should just display the
 * main area with no right sidebar when nothing is there, and then smoothly
 * animate in the right sidebar when something is dragged over and dropped."
 *
 * The sidebar exists only with an image. `sidebarPresent` holds the
 * Configurator's aside column open for as long as the sidebar's content is in
 * the DOM — it opens the moment an image lands (the column's width and the
 * content's translate enter together, on the glass `--spring-panel` pair) and
 * closes only after the content's leave has run, so the leave is seen instead
 * of being cut off by the column collapsing under it.
 */
const hasSidebar = computed(() => hasImage.value);
const sidebarPresent = ref(hasSidebar.value);
watch(hasSidebar, (present) => {
    if (present) sidebarPresent.value = true;
});

// The ONE upload affordance with no image: the main area's drop target (a
// glass Button + the format line). The canvas itself is no longer a
// pointer-only click target.
const canvasFileInput = ref<HTMLInputElement>();
function openCanvasFilePicker() {
    canvasFileInput.value?.click();
}
async function onCanvasFileSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) await store.uploadImage(file);
    if (canvasFileInput.value) canvasFileInput.value.value = "";
}
</script>

<template>
    <div class="flex flex-col flex-1 min-h-0"
        @drop="globalDrop" @dragover="globalDragOver"
        @dragenter="globalDragEnter" @dragleave="globalDragLeave"
    >
        <!-- Global drag overlay — with an image in place (a drop REPLACES it).
             With no image the main area's drop target is the one signal. -->
        <Transition name="fade">
            <div v-if="globalDragging && hasImage" class="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-background/80 backdrop-blur-sm"
                @drop="globalDrop" @dragover.prevent>
                <div class="flex flex-col items-center gap-3 text-muted-foreground">
                    <Upload class="h-12 w-12" />
                    <p class="text-lg font-medium">Drop image anywhere</p>
                </div>
            </div>
        </Transition>

        <!-- Loading -->
        <div v-if="store.loading && !store.imageSlug" class="flex flex-col items-center justify-center flex-1 gap-3">
            <div class="h-8 w-8 animate-spin rounded-full border-[2.5px] border-border border-t-primary" />
            <p class="text-sm text-muted-foreground fira-code">Loading workspace...</p>
        </div>

        <!-- Error (no workspace). X.F.W14.u — UIA-F-4: on `/v/` the error
             branch was never reached (the loader never loaded the entity), and
             its copy spoke only of a workspace. It is the shared not-found card
             now, its copy route-aware and naming the slug that failed.
             UIA-F-49: the side=top tooltip on the button covered the only
             diagnostic line; the button's own label carries the meaning. -->
        <NotFoundCard
            v-else-if="store.error && !store.imageSlug"
            :title="isSavedRoute ? 'Could not open this visualization' : 'Could not load this workspace'"
            :description="isSavedRoute
                ? `No saved visualization loaded from “${route.params.visualizationSlug}”.`
                : `No image loaded from “${route.params.imageSlug}”.`"
            :detail="store.error"
        >
            <template #actions>
                <Button emphasis="primary" @click="store.reset(); router.push('/visualize')">
                    Upload a new image
                </Button>
                <Button emphasis="secondary" @click="store.reset(); router.push('/gallery')">
                    Browse the gallery
                </Button>
            </template>
        </NotFoundCard>

        <!-- Main workspace -->
        <div v-else class="flex flex-col flex-1 min-h-0">
            <!-- Mobile tab bar -->
            <div v-if="hasSidebar" class="flex px-3 py-1 bg-background lg:hidden">
                <SegmentedTabs variant="underline"
                    :options="[{ label: 'Controls', value: 'controls' }, { label: 'Canvas', value: 'canvas' }]"
                    v-model="mobileView" />
            </div>

            <!-- B.W2.a — the visualization-route left-panel stack adopts the
                 glass-ui `Configurator` chassis: `BasisCanvas` + its overlaid
                 docks lift into the `#stage` slot; the control panels (each now
                 a `ConfiguratorLayer`) stack in the controls aside (default
                 slot). The bespoke `cartoon-card` panel backgrounds retire for
                 the substrate's layered chassis.

                 X.F.W3 repair 1 (g14 leg 3) — THE SCOPE OF THAT RETIREMENT,
                 STATED, because the sentence above read as a tree-wide claim
                 and one `cartoon-card` still paints in this very file. It is
                 `:191`, the no-workspace ERROR card, and it is not a panel: the
                 retirement is of the CONTROL-PANEL stack's backgrounds, which
                 the `ConfiguratorLayer`s below now carry, and the error card
                 stands outside the `Configurator` in the `v-else-if` branch
                 above it. It keeps the shim deliberately — it is a lone
                 bordered card on an empty route, with no layered chassis around
                 it to belong to. The census that governs the shim is re-measured
                 at `style.css`'s own declaration. -->
            <!-- X.F.W14.g — OA-43 ("why is the controls items, these sidebars and
                 elements, so gray and grayed out?"). The producer's shell is a
                 `glass-floating` plate: its light veil is `oklch(0.28 0.035 70 / 0.18)`
                 smoke over the paper, measured rgb(215 212 207). The stage covers it
                 with its own `--card` card, but the controls aside had nothing over it,
                 so the controls sat on the smoke beside a cream stage, and the
                 muted ink read 4.44:1. No opacity, filter or inert was on any
                 ancestor. The studio is an opaque instrument on paper, so it takes
                 glass's named OPAQUE escape (`.glass-opaque` = `--glass-level: 0` →
                 solid `--card` + `blur(0)`, docs/canon/glass-system.md). Its veil
                 then resolves to the same `--card` the stage and every other fourier
                 pane paint. -->
            <Configurator scroll-mode="auto" class="viz-configurator glass-opaque" :data-sidebar="sidebarPresent ? undefined : 'none'">
                <!-- ── Stage: canvas + overlaid controls ── -->
                <template #stage>
                    <div class="viz-panel-right canvas-stage" :class="{ 'panel-inactive': hasSidebar && mobileView !== 'canvas' && !isDesktop }">
                        <div class="canvas-container" :class="{ 'is-hidden': isEditing && store.contour }">
                            <BasisCanvas ref="canvasComponent" :active-bases="activeBases"
                                :show-ghost="showGhost" :show-image-overlay="showImageOverlay" />
                        </div>
                        <!-- X.F.W13.c — the ONE upload affordance (owner frame 4). The
                             sidebar's "Drop or click to upload — PNG/JPG/SVG ≤ 10 MB" card
                             retired; click-to-browse (a glass Button) and the format/size
                             line (the producer's caption type) live here, and the drop
                             target signals while a file is dragged over the page. -->
                        <div v-if="!hasImage && !hasData" class="drop-target" :data-dragging="globalDragging || undefined">
                            <Button emphasis="secondary" size="lg" class="drop-target-button" :loading="store.uploading" @click="openCanvasFilePicker">
                                <Upload />
                                Drop or click to upload
                            </Button>
                            <p class="text-caption text-muted-foreground">PNG/JPG/SVG ≤ 10 MB</p>
                            <input ref="canvasFileInput" data-testid="image-file-input" type="file" accept="image/*" class="hidden" @change="onCanvasFileSelect" />
                        </div>
                        <!-- UIA-F-15: out of edit mode the editor is opacity-hidden but
                             mounted; `inert` keeps it out of the tab order and the
                             pointer, so a hidden surface can never hold focus. -->
                        <div v-if="store.contour" class="editor-shell" :class="{ 'is-hidden': !isEditing }" :inert="!isEditing">
                            <ContourEditorCanvas ref="editorRef" :contour="store.contour"
                                :image-slug="store.imageSlug" :show-image-overlay="showImageOverlay"
                                @state-change="onEditorStateChange" />
                        </div>

                        <!-- Top controls dock -->
                        <div v-if="hasData || (isEditing && store.contour)" class="controls-dock-anchor" :class="{ 'dock-centered': dockExpanded }">
                            <CanvasControlsDock
                                v-model:expanded="dockExpanded"
                                :is-editing="isEditing"
                                :show-image-overlay="showImageOverlay"
                                :show-ghost="showGhost"
                                :show-equation="showEquation"
                                :has-data="!!hasData"
                                :has-contour="!!store.contour"
                                :publishing="publishing"
                                @toggle-edit="isEditing = !isEditing"
                                @toggle-fullscreen="showFullscreen = true"
                                @toggle-equation="showEquation = !showEquation"
                                @toggle-image-overlay="showImageOverlay = !showImageOverlay"
                                @toggle-ghost="showGhost = !showGhost"
                                @publish="handlePublish"
                            />
                        </div>

                        <!-- Equation overlay panel -->
                        <Transition name="fade">
                            <EquationPanel v-if="showEquation && store.epicycleData && !isEditing" @close="showEquation = false" />
                        </Transition>

                        <!-- Bottom dock -->
                        <div v-if="hasData && !isEditing" class="controls-overlay">
                            <AnimationControls :active-bases="activeBases" @export-frame="handleExportFrame" />
                        </div>
                        <div v-if="isEditing && store.contour" class="controls-overlay">
                            <EditorControlsDock :can-undo="editorState.canUndo" :can-redo="editorState.canRedo"
                                :can-delete="editorState.canDelete" :point-count="editorState.pointCount"
                                :show-image-overlay="showImageOverlay" :show-ghost="showGhost"
                                :magnet-radius="magnetRadius" :is-saved="editorSaved"
                                @undo="editorRef?.undo()" @redo="editorRef?.redo()" @smooth="editorRef?.applySmooth()"
                                @simplify="editorRef?.applySimplify()" @delete="editorRef?.deleteSelected()"
                                @toggle-overlay="showImageOverlay = !showImageOverlay" @toggle-ghost="showGhost = !showGhost"
                                @update:magnet-radius="magnetRadius = $event"
                                @reset="editorRef?.resetToExtraction()" @save="onEditorSave" />
                        </div>
                    </div>
                </template>

                <!-- ── Controls aside: the left-panel layer stack ── -->
                <!-- X.F.W13.c — the sidebar renders only with an image, and arrives
                     with it (`viz-sidebar`, glass `--spring-panel`, PRM-honoured). -->
                <Transition name="viz-sidebar" @after-leave="sidebarPresent = false">
                <div v-if="hasSidebar" class="viz-panel-left-wrap" :class="{ 'panel-inactive': mobileView !== 'controls' && !isDesktop }">
                    <Transition name="panel-swap" mode="out-in">
                        <div v-if="isEditing" key="editor-panel" class="viz-panel-left">
                            <!-- Preview above tools -->
                            <ContourPreview :points="editorRef?.points" />
                            <!-- Editor tools live in the floating EditorControlsDock (B.W2.4);
                                 the static EditorToolsPanel was retired. -->
                            <!-- X.F.W3 `.e` / `fr-VisualizationView MAJ-5` FOLD -> `fr-ContourSettings
                                 M-16`, the HOST half of section-5a split (4). `.d` declared the
                                 panel's contract INBOUND-ONLY at `be623d9` after
                                 measuring that every use of the pair inside it is a
                                 READ; these two mounts advertised a writeback the
                                 panel structurally could not perform, and the
                                 reader could not tell from either end which child
                                 owned the two scalars. Nothing regresses: the
                                 writeback never worked. -->
                            <ContourSettings v-if="hasImage" :n-harmonics="nHarmonics" :n-points="nPoints" />
                        </div>
                        <div v-else key="viz-panel" class="viz-panel-left">
                            <ImageUpload />
                            <Transition name="slide-down">
                                <!-- MAJ-5's second limb: the SAME TAG spelled one
                                     two-way binding two ways — `v-model:` for the
                                     scalars and a hand-written prop+listener pair
                                     for the bases. `BasisSelector` declares
                                     `update:activeBases` like the other two, so
                                     the third binding is written like the other
                                     two. -->
                                <BasisSelector v-if="hasData"
                                    v-model:active-bases="activeBases"
                                    v-model:n-harmonics="nHarmonics" v-model:n-points="nPoints" />
                            </Transition>
                            <Transition name="slide-down">
                                <ContourSettings v-if="hasImage" :n-harmonics="nHarmonics" :n-points="nPoints" />
                            </Transition>
                            <Transition name="slide-down">
                                <CoefficientsPanel v-if="store.epicycleData || store.computing" />
                            </Transition>
                        </div>
                    </Transition>
                </div>
                </Transition>
            </Configurator>
        </div>

        <ExportModal v-if="showExport" :has-epicycles="hasEpicycles" @export="doExport" @close="showExport = false" />
        <FullscreenViewer :visible="showFullscreen" :active-bases="activeBases" :show-ghost="showGhost"
            :show-image-overlay="showImageOverlay" :is-editing="isEditing" :contour="store.contour ?? undefined"
            :image-slug="store.imageSlug" @close="showFullscreen = false"
            @toggle-ghost="showGhost = !showGhost" @toggle-image-overlay="showImageOverlay = !showImageOverlay" />
    </div>
</template>

<style scoped>
/* ── Configurator chassis (B.W2.a) ──
   The glass-ui `Configurator` supplies the stage|aside grid; the host only
   makes it flex-fill the workspace column and tunes the aside (controls)
   width band to match the prior left-panel widths. The substrate's intrinsic
   arrangement is stage-first (canvas) + controls-aside; the prior bespoke
   grid was controls-left + canvas-right.

   glass-ui 10.0.0 wraps the grid (`[data-slot="configurator"]`) in an outer
   `.configurator-shell`, and the component's `class` prop lands on that shell
   (the height envelope); the grid is its child. The consumer class therefore
   names the shell, and every rule below reaches it — and the grid inside — with
   `:deep()`, because the shell is not this component's scoped root (that is the
   producer's `display: contents` expand host, which carries `data-sidebar`). */
:deep(.viz-configurator) {
    flex: 1;
    min-height: 0;
    margin: 0.25rem;
}

/* I.ε — the View-Transitions morph anchor. The canvas stage is the persistent
   visual element across the `/w/`↔`/v/` route swap (both routes render this
   same component); naming it lets the browser geometry-morph it as a tracked
   group instead of the default whole-root cross-fade. Gated to a View-
   Transitions engine and bracketed by `prefers-reduced-motion` — the glass-ui
   `view-transition.css` cascade additionally zeroes `::view-transition-*`
   animation under PRM, so an unsupporting/PRM engine renders the unchanged
   remount (the inv-29 floor). The name is page-unique (one stage per route). */
@media (prefers-reduced-motion: no-preference) {
    @supports (view-transition-name: --x) {
        .canvas-stage {
            view-transition-name: viz-canvas-stage;
        }
    }
}
/* The aside band rides the producer's `--configurator-aside-{min,max}` pair
   (read by the grid's two-column container rule), set on the shell and
   inherited by the grid: it tracks the prior 360/400/440px left-panel widths. */
@media (min-width: 1024px) {
    :deep(.viz-configurator) {
        margin: 0.5rem;
        margin-bottom: 0.75rem;
        --configurator-aside-min: 320px;
        --configurator-aside-max: 360px;
    }
}
@media (min-width: 1280px) {
    :deep(.viz-configurator) { --configurator-aside-min: 360px; --configurator-aside-max: 400px; }
}
@media (min-width: 1536px) {
    :deep(.viz-configurator) { --configurator-aside-min: 400px; --configurator-aside-max: 440px; }
}
/* On mobile the Configurator stacks (grid-cols-1); the `panel-inactive`
   toggle inside each slot drives the tab switch. */
@media (max-width: 1023px) {
    :deep(.viz-configurator > [data-slot="configurator"]) { display: flex; flex-direction: column; }

    /* When the Configurator drops its desktop grid for the mobile flex column,
       glass-ui's `.configurator-stage` cell becomes a `flex: 0 1 auto` item
       and — since the canvas-container inside is `position: absolute` — it has
       no intrinsic height, collapsing the stage to 0px (the `<canvas>` renders
       at ~4px and the bottom AnimationControls dock floats up under the sticky
       header). On the desktop grid the cell drew its height from the grid
       track; in the flex column it must grow explicitly. Make the active stage
       cell flex-fill the column so the canvas + bottom dock lay out correctly. */
    :deep(.viz-configurator .configurator-stage) {
        flex: 1 1 0%;
        min-height: 0;
    }
}

/* ── Left panel (controls aside body) ── */
.viz-panel-left-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    max-width: 480px;
    margin: 0 auto;
    width: 100%;
    min-height: 0;
    flex: 1;
}
@media (min-width: 1024px) { .viz-panel-left-wrap { max-width: none; margin: 0; } }

/* F.W1 / FR-CP-13 ⊕ FR-CP-24 — THE GAP DECISION, made once for both rows.
   At the adopted pin the producer FUSES adjacent inspector sections
   (`configurator/styles.css`: a section with a following sibling squares its
   bottom corners and drops its bottom border; a section preceded by one squares
   its top corners and collapses `margin-block-start` to 0) so that one
   inspector reads as ONE contiguous grouped list. That join assumes the stack
   spaces its children with MARGINS — which is exactly what a flex `gap` is not,
   and a `gap` the producer cannot cancel is what turns the fused group into
   flat-ended rectangles floating 12px apart, with FR-CP-24's `border-b`
   hairlines terminating in the same air.
   The decision is to KEEP THE FUSING (glass-ui-first: the producer ruled the
   grouped-list read) and to move this stack's spacing off `gap` and onto the
   children the fusing does NOT claim. The layers touch, the shared hairline is
   the one between them, and the non-layer cards above keep their 12px. */
.viz-panel-left {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0.5rem;
    min-height: 0;
    flex: 1;
}
.viz-panel-left > :not(.configurator-layer):not(:last-child) {
    margin-block-end: 0.75rem;
}

/* ── Right panel (the Configurator #stage cell body) ── */
.viz-panel-right {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    flex: 1;
    /* glass-ui's `.configurator-stage` grid cell is `position: relative` (not a
       flex container), so `flex: 1` here is inert — the stage would collapse to
       zero height and the absolutely-positioned `.canvas-container` (inset: 0)
       would render a 0px canvas. Fill the stage cell explicitly. (B.W4 fix.) */
    height: 100%;
    position: relative;
}

/* ── Canvas crossfade ── */
/* Both canvases are always absolutely positioned so switching between them
   is a pure opacity crossfade with no layout shift. */
.canvas-stage > .canvas-container,
.canvas-stage > .editor-shell {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
    opacity: 1;
    z-index: 1;
    pointer-events: auto;
    transition: opacity var(--duration-mid, 0.24s) ease;
}
.canvas-stage > .canvas-container.is-hidden,
.canvas-stage > .editor-shell.is-hidden {
    opacity: 0;
    z-index: 0;
    pointer-events: none;
}

/* ── Controls overlay ── */
.controls-overlay {
    position: absolute;
    bottom: 0.75rem;
    left: 0.375rem;
    right: 0.375rem;
    z-index: var(--z-controls);
    display: flex;
    justify-content: center;
    pointer-events: none;
}
.controls-overlay > * { pointer-events: auto; }

/* X.F.W4 · SP-6 / `fr-VisualizationView L-17 · D-16 · MIN-3` — the dead-CSS
   census, all five declarations, deleted with their zero-consumer proofs:

     • `overflow: visible` on `.controls-overlay` (just above) restated the
       initial value, so it was inert — and worse than inert, because its
       evident intent is structurally defeated by TWO ancestors
       (`.viz-panel-right { overflow: hidden }`, and the producer stage cell's
       own `overflow-hidden`). It was simultaneously a no-op AND a false
       "escape permitted" signal to the next reader, which is the expensive
       half.
     • the three `.expand-pop-*` rules styled a Vue <Transition> that appeared
       nowhere in this file: at the bytes this seat measured, every occurrence
       of the name was one of the three rules themselves, and no template node
       carried it. Their `transform` leg additionally consumed
       `--ease-apple-spring`, which is declared in NO tree — ⟨cmd⟩ `grep -roh --
       '--ease-apple-spring' node_modules/@mkbabb/glass-ui/dist | wc -l` → 0,
       re-run at this pin.
     • `.viz-grid`, in the narrow-viewport band, was the same shape: a class no
       element in this file carried. */

.panel-swap-enter-active, .panel-swap-leave-active { transition: opacity 0.2s var(--ease-standard), transform 0.2s var(--ease-standard); }
.panel-swap-enter-from { opacity: 0; transform: translateY(4px); }
.panel-swap-leave-to { opacity: 0; transform: translateY(-4px); }

.slide-down-enter-active { transition: opacity 0.3s var(--ease-standard), transform 0.3s var(--ease-standard); }
.slide-down-leave-active { transition: opacity 0.2s var(--ease-in), transform 0.2s var(--ease-in); }
.slide-down-enter-from { opacity: 0; transform: translateY(-8px); }
.slide-down-leave-to { opacity: 0; transform: translateY(-4px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s var(--ease-standard); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Mobile panel toggle ── */
@media (max-width: 1023px) {
    .panel-inactive {
        display: none;
    }
}

/* ── Controls dock positioning ── */
.controls-dock-anchor {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: var(--z-controls);
    /* A.W3.d — bezier→`--ease-out-expo`. */
    transition: left 0.3s var(--ease-out-expo),
                right 0.3s var(--ease-out-expo),
                transform 0.3s var(--ease-out-expo);
}

.controls-dock-anchor.dock-centered {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
}

@media (min-width: 1024px) {
    .controls-dock-anchor,
    .controls-dock-anchor.dock-centered {
        left: auto;
        right: 0.5rem;
        transform: none;
    }
}

/* ── X.F.W13.c — the main area's drop target (the one upload affordance) ── */
.drop-target {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    pointer-events: none;
    z-index: var(--z-controls);
}
.drop-target > * {
    pointer-events: auto;
}
/* The dragenter signal: the glass focus-ring register on the target, so a
   dragged file reads which surface will take it. */
.drop-target[data-dragging] .drop-target-button {
    box-shadow: 0 0 0 2px var(--focus-ring-color);
}

/* ── X.F.W13.c — the sidebar arrives with content ──
   The producer's aside is always in the Configurator's DOM (8.0.0; also at glass
   src 10.0.1), so the host owns its column: with no image the aside takes no box
   and its band closes to zero, and the stage fills the full width. When an image
   lands the band opens on the glass panel spring while the content translates in
   on the same pair; it leaves on the panel exit clock. Motion only from the glass
   motion tokens; under reduced motion none of it moves. */
:deep(.viz-configurator > [data-slot="configurator"]) {
    transition: grid-template-columns var(--spring-panel-duration) var(--spring-panel);
}
[data-sidebar="none"] > :deep(.viz-configurator) {
    --configurator-aside-min: 0px;
    --configurator-aside-max: 0px;
}
[data-sidebar="none"] > :deep(.viz-configurator > [data-slot="configurator"] > .configurator-aside) {
    display: none;
}
.viz-sidebar-enter-active {
    transition: opacity var(--spring-panel-duration) var(--ease-out),
                transform var(--spring-panel-duration) var(--spring-panel);
}
.viz-sidebar-leave-active {
    transition: opacity var(--spring-panel-exit-duration) var(--ease-in),
                transform var(--spring-panel-exit-duration) var(--ease-in);
}
.viz-sidebar-enter-from,
.viz-sidebar-leave-to {
    opacity: 0;
    transform: translateX(var(--enter-overlay-slide, 0.5rem));
}
@media (prefers-reduced-motion: reduce) {
    :deep(.viz-configurator > [data-slot="configurator"]),
    .viz-sidebar-enter-active,
    .viz-sidebar-leave-active {
        transition: none;
    }
    .viz-sidebar-enter-from,
    .viz-sidebar-leave-to {
        opacity: 1;
        transform: none;
    }
}

/* ── Mobile ── */
@media (max-width: 900px) {
    .controls-overlay { left: 0.5rem; right: 0.5rem; bottom: 0.75rem; }
}
</style>
