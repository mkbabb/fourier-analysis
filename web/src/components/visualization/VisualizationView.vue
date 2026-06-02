<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { watchDebounced, useMediaQuery } from "@vueuse/core";
import { useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAnimationStore } from "@/stores/animation";
import { useImageUpload } from "./composables/useImageUpload";
import { useViewState } from "./composables/useViewState";
import { useWorkspaceLoader } from "./composables/useWorkspaceLoader";
import { Upload } from "lucide-vue-next";
import { Tooltip } from "@/components/ui/tooltip";
import { useGalleryStore } from "@/stores/gallery";
import { useToast } from "@/composables/useToast";
import ImageUpload from "./ImageUpload.vue";
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
import { UnderlineTabs } from "@mkbabb/glass-ui/tabs";
import { Configurator } from "@mkbabb/glass-ui/configurator";
import { Button } from "@mkbabb/glass-ui/button";

const router = useRouter();
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
async function handlePublish() {
    if (!store.imageSlug || !store.contour) return;
    publishing.value = true;
    try {
        const snapshot = await store.createSnapshot();
        if (!snapshot) { toast("Could not create snapshot", "error"); return; }
        await gallery.publish(snapshot.slug, store.imageSlug);
    } catch (e: any) {
        toast(e.message ?? "Publish failed", "error");
    } finally {
        publishing.value = false;
    }
}

// ── Derived state ──
const hasData = computed(() => store.epicycleData || store.basesData || store.computing);
const hasEpicycles = computed(() => activeBases.value.includes("fourier-epicycles"));
const hasImage = computed(() => !!store.imageMeta);

// ── Mobile canvas click-to-upload ──
const canvasFileInput = ref<HTMLInputElement>();
function onCanvasClick() {
    if (!hasImage.value && !hasData.value) {
        canvasFileInput.value?.click();
    }
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
        <!-- Global drag overlay -->
        <Transition name="fade">
            <div v-if="globalDragging" class="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-background/80 backdrop-blur-sm"
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

        <!-- Error (no workspace) -->
        <div v-else-if="store.error && !store.imageSlug" class="flex items-center justify-center flex-1">
            <div class="mx-auto max-w-md cartoon-card p-6 text-center space-y-3">
                <p class="text-sm font-medium text-foreground">Could not load workspace</p>
                <p class="text-xs text-muted-foreground fira-code break-all">{{ store.error }}</p>
                <Tooltip text="Go back to upload a new image">
                    <Button
                        variant="outline"
                        class="mt-2 border-2 border-foreground/15"
                        @click="store.reset(); router.push('/visualize')"
                    >
                        Start fresh
                    </Button>
                </Tooltip>
            </div>
        </div>

        <!-- Main workspace -->
        <div v-else class="flex flex-col flex-1 min-h-0">
            <!-- Mobile tab bar -->
            <div class="flex px-3 py-1 bg-background lg:hidden">
                <UnderlineTabs
                    :options="[{ label: 'Controls', value: 'controls' }, { label: 'Canvas', value: 'canvas' }]"
                    :model-value="mobileView"
                    @update:model-value="mobileView = $event as 'controls' | 'canvas'" />
            </div>

            <!-- B.W2.a — the visualization-route left-panel stack adopts the
                 glass-ui `Configurator` chassis: `BasisCanvas` + its overlaid
                 docks lift into the `#stage` slot; the control panels (each now
                 a `ConfiguratorLayer`) stack in the controls aside (default
                 slot). The bespoke `cartoon-card` panel backgrounds retire for
                 the substrate's layered chassis. -->
            <Configurator scroll-mode="auto" class="viz-configurator">
                <!-- ── Stage: canvas + overlaid controls ── -->
                <template #stage>
                    <div class="viz-panel-right canvas-stage" :class="{ 'panel-inactive': mobileView !== 'canvas' && !isDesktop }">
                        <div class="canvas-container" :class="{ 'is-hidden': isEditing && store.contour, 'canvas-clickable': !hasImage && !hasData }" @click="onCanvasClick">
                            <BasisCanvas ref="canvasComponent" :active-bases="activeBases"
                                :show-ghost="showGhost" :show-image-overlay="showImageOverlay" />
                            <input ref="canvasFileInput" type="file" accept="image/*" class="hidden" @change="onCanvasFileSelect" />
                        </div>
                        <div v-if="store.contour" class="editor-shell" :class="{ 'is-hidden': !isEditing }">
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
                <div class="viz-panel-left-wrap" :class="{ 'panel-inactive': mobileView !== 'controls' && !isDesktop }">
                    <Transition name="panel-swap" mode="out-in">
                        <div v-if="isEditing" key="editor-panel" class="viz-panel-left">
                            <!-- Preview above tools -->
                            <ContourPreview :points="editorRef?.points" />
                            <!-- Editor tools live in the floating EditorControlsDock (B.W2.4);
                                 the static EditorToolsPanel was retired. -->
                            <ContourSettings v-if="hasImage" v-model:n-harmonics="nHarmonics" v-model:n-points="nPoints" />
                        </div>
                        <div v-else key="viz-panel" class="viz-panel-left">
                            <ImageUpload />
                            <Transition name="slide-down">
                                <BasisSelector v-if="hasData" :active-bases="activeBases"
                                    v-model:n-harmonics="nHarmonics" v-model:n-points="nPoints"
                                    @update:active-bases="activeBases = $event" />
                            </Transition>
                            <Transition name="slide-down">
                                <ContourSettings v-if="hasImage" v-model:n-harmonics="nHarmonics" v-model:n-points="nPoints" />
                            </Transition>
                            <Transition name="slide-down">
                                <CoefficientsPanel v-if="store.epicycleData || store.computing" />
                            </Transition>
                        </div>
                    </Transition>
                </div>
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
   grid was controls-left + canvas-right. */
.viz-configurator {
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
@media (min-width: 1024px) {
    .viz-configurator {
        margin: 0.5rem;
        margin-bottom: 0.75rem;
        /* aside band tracks the prior 360/400/440px left-panel widths. */
        grid-template-columns: minmax(0, 1fr) minmax(320px, 360px);
    }
}
@media (min-width: 1280px) {
    .viz-configurator { grid-template-columns: minmax(0, 1fr) minmax(360px, 400px); }
}
@media (min-width: 1536px) {
    .viz-configurator { grid-template-columns: minmax(0, 1fr) minmax(400px, 440px); }
}
/* On mobile the Configurator stacks (grid-cols-1); the `panel-inactive`
   toggle inside each slot drives the tab switch. */
@media (max-width: 1023px) {
    .viz-configurator { display: flex; flex-direction: column; }

    /* When the Configurator drops its desktop grid for the mobile flex column,
       glass-ui's `.configurator-stage` cell becomes a `flex: 0 1 auto` item
       and — since the canvas-container inside is `position: absolute` — it has
       no intrinsic height, collapsing the stage to 0px (the `<canvas>` renders
       at ~4px and the bottom AnimationControls dock floats up under the sticky
       header). On the desktop grid the cell drew its height from the grid
       track; in the flex column it must grow explicitly. Make the active stage
       cell flex-fill the column so the canvas + bottom dock lay out correctly. */
    .viz-configurator :deep(.configurator-stage) {
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

.viz-panel-left {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    padding: 0.5rem;
    min-height: 0;
    flex: 1;
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
    overflow: visible;
}
.controls-overlay > * { pointer-events: auto; }

/* ── Transitions (A.W3.d — bezier→tokens; transition:all→named properties) ── */
.expand-pop-enter-active { transition: opacity 0.3s var(--ease-standard), transform 0.35s var(--ease-apple-spring); }
.expand-pop-leave-active { transition: opacity 0.2s var(--ease-standard), transform 0.2s var(--ease-standard); }
.expand-pop-enter-from, .expand-pop-leave-to { opacity: 0; transform: scale(0.3); }

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

/* ── Clickable canvas placeholder ── */
.canvas-clickable {
    cursor: pointer;
}

/* ── Mobile ── */
@media (max-width: 900px) {
    .viz-grid { display: flex; flex-direction: column; gap: 0.5rem; min-height: 0; }
    .controls-overlay { left: 0.5rem; right: 0.5rem; bottom: 0.75rem; }
}
</style>
