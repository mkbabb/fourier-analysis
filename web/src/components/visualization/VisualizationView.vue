<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { watchDebounced, useMediaQuery, useEventListener } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAnimationStore } from "@/stores/animation";
import { useImageUpload } from "./composables/useImageUpload";
import { useViewState } from "./composables/useViewState";
import { useWorkspaceLoader } from "./composables/useWorkspaceLoader";
import { Upload } from "@lucide/vue";
import { useGalleryStore } from "@/stores/gallery";
import { useToast } from "@/composables/useToast";
import { useAuthStore } from "@/stores/auth";
import ImageUpload from "./ImageUpload.vue";
import NotFoundCard from "@/components/shared/NotFoundCard.vue";
import ContourSettings from "./ContourSettings.vue";
import BasisCanvas from "./BasisCanvas.vue";
import BasisSelector from "./BasisSelector.vue";
import AnimationControls from "./AnimationControls.vue";
import ContourEditorCanvas from "./ContourEditorCanvas.vue";
import EditorControlsDock from "./EditorControlsDock.vue";
import CanvasControlsDock from "./CanvasControlsDock.vue";
import CoefficientsPanel from "./CoefficientsPanel.vue";
import ExportModal from "./ExportModal.vue";
import FullscreenViewer from "./FullscreenViewer.vue";
import EquationPanel from "./EquationPanel.vue";
import { SegmentedTabs } from "@mkbabb/glass-ui/tabs";
import { Configurator } from "@mkbabb/glass-ui/configurator";
import { Button } from "@mkbabb/glass-ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@mkbabb/glass-ui/dialog";
import { Card } from "@mkbabb/glass-ui/card";
import { Progress } from "@mkbabb/glass-ui/progress";

const router = useRouter();
const route = useRoute();
/** `/v/:visualizationSlug` (a saved entity) vs `/w/:imageSlug?` (a working session). */
const isSavedRoute = computed(() => route.name === "visualization");
const store = useWorkspaceStore();
const anim = useAnimationStore();
const gallery = useGalleryStore();
const auth = useAuthStore();
const { toast } = useToast();

// ── View state (editing, ghost, overlay — persisted to localStorage) ──
const { isEditing, showGhost, showImageOverlay, showEquation } = useViewState();

// ── Image drag-and-drop ──
const { isDragging: globalDragging, rejection: dropRejection, handleDrop: globalDrop, handleDragOver: globalDragOver, handleDragEnter: globalDragEnter, handleDragLeave: globalDragLeave, handleFileSelect: globalFileSelect } =
    useImageUpload((file: File) => store.uploadImage(file));

/*
 * X.F.W14U.vstage — UIA-F-166: a file dropped outside this view (the header
 * band) fell through to the browser, which navigated away to the file. While
 * the studio is mounted the window takes every file drag it does not route,
 * so a stray drop is a no-op instead of a lost session.
 */
useEventListener(window, "dragover", (e: DragEvent) => e.preventDefault());
useEventListener(window, "drop", (e: DragEvent) => e.preventDefault());

/** The drop target's one message line: a rejected file, else a failed upload
 *  (UIA-F-166 ⊕ F-167 — shown where the file was dropped, never as a failed
 *  workspace load). */
const dropMessage = computed(() =>
    dropRejection.value ?? (store.uploadError ? `The upload failed: ${store.uploadError}` : null),
);

/* UIA-F-237: "Drop or click" is wrong on touch; the primary action says what it
   does on each pointer, and while uploading it says that (UIA-F-133). */
const isCoarsePointer = useMediaQuery("(pointer: coarse)");
const primaryUploadLabel = computed(() => {
    if (store.uploading) return "Uploading…";
    return isCoarsePointer.value ? "Tap to choose an image" : "Choose an image";
});

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

/*
 * X.F.W14U.vedit — UIA-F-180: leaving edit mode had no exit or dirty
 * affordance — unsaved edits stayed behind in the hidden editor. The editor's
 * history is the dirty flag (a step to undo is an unsaved edit: a save
 * re-seeds the history from the saved contour), and leaving with one asks:
 * save, discard, or keep editing. Leaving always clears the selection
 * (UIA-F-15's rider), so no hidden point stays picked.
 */
const leaveAsk = ref(false);

function leaveEditor() {
    editorRef.value?.clearSelection();
    isEditing.value = false;
}

function toggleEdit() {
    if (!isEditing.value) {
        isEditing.value = true;
        return;
    }
    if (editorState.value.canUndo) {
        leaveAsk.value = true;
        return;
    }
    leaveEditor();
}

async function saveAndLeave() {
    leaveAsk.value = false;
    await onEditorSave();
    leaveEditor();
}

function discardAndLeave() {
    leaveAsk.value = false;
    editorRef.value?.discardEdits();
    leaveEditor();
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
//
// X.F.W14.u — UIA-F-18: a second activation while the first was in flight
// started a second POST, which aborted the first (the api's per-key inflight
// abort); the aborted save returned `null` and fell through to the fallback
// "Could not save" toast beside the second save's "Published!". One action is
// one outcome: a publish in flight suppresses activation (DESIGN.md: loading
// suppresses activation), and an aborted save is not a failure — only a real
// diagnosis (`store.error`, cleared at the save's start) is reported.
//
// X.F.W14U.vstage — UIA-F-95 ⊕ F-245: logged out, Publish made the round trip
// the api refuses, and the one refusal arrived as two error toasts (this
// function's, and the loader's `store.error` channel, which reports every
// workspace diagnosis while an image is open). The gate is before the round
// trip — a session is a precondition, said once with the way to meet it — and a
// failed save is reported by the loader's channel alone.
async function handlePublish() {
    if (publishing.value || !store.imageSlug || !store.contour) return;
    if (!auth.isLoggedIn) {
        toast("Log in to publish to the gallery.", "info");
        return;
    }
    publishing.value = true;
    try {
        const saved = await store.saveVisualization();
        if (!saved) return;
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
/*
 * X.F.W14.r — F.W13 `.c` residual (r1): the spec's words are "on drop (or
 * file pick) the sidebar enters", and it entered only when the upload
 * response LANDED (`imageMeta`). The upload in flight is the drop's own
 * state, so the sidebar enters with it — its Image layer carrying the
 * upload's busy signal — and the landed image fills it. An upload that fails
 * clears the flight with no image, which is the leave path (r2).
 */
const hasSidebar = computed(() => hasImage.value || store.uploading);
const sidebarPresent = ref(hasSidebar.value);
watch(hasSidebar, (present) => {
    if (present) sidebarPresent.value = true;
});

/*
 * X.F.W14U.vstage — the band's `onConfiguratorUnmounted` re-read retired: a
 * failed upload no longer swaps the Configurator for the not-found card (the
 * card and the busy mark render inside the stage, UIA-F-70 ⊕ F-167), so the
 * sidebar's `@after-leave` always runs and closes the band itself.
 */
/** The stage's two whole-route states (UIA-F-70): a cold load, and a load that
 *  failed with nothing on screen. Both keep the Configurator chassis. */
const stageLoading = computed(() => store.loading && !store.imageSlug);
const stageError = computed(() => !!store.error && !store.imageSlug);
/** UIA-F-73 ⊕ F-71: the first compute has nothing to draw yet; the stage says
 *  so in the DOM (one busy mark), not with a painted box. */
const firstCompute = computed(() => store.computing && !store.epicycleData && !store.basesData);

// The ONE upload affordance with no image: the main area's drop target (a
// glass Button + the format line). The canvas itself is no longer a
// pointer-only click target.
const canvasFileInput = ref<HTMLInputElement>();
function openCanvasFilePicker() {
    canvasFileInput.value?.click();
}
/* A picked file takes the drop's path (the same image check and rejection
   message, UIA-F-166); the input is cleared so the same file can be picked
   again. */
function onCanvasFileSelect(e: Event) {
    globalFileSelect(e);
    if (canvasFileInput.value) canvasFileInput.value.value = "";
}
</script>

<template>
    <div class="flex flex-col flex-1 min-h-0"
        @drop="globalDrop" @dragover="globalDragOver"
        @dragenter="globalDragEnter" @dragleave="globalDragLeave"
    >
        <!-- Main workspace. X.F.W14U.vstage — UIA-F-70: the cold load and the
             load error used to REPLACE this chassis (a bare ring, or a card
             floating on the page, then the frame popping in). They render inside
             the Configurator's stage now, as /gallery and /equation do; the
             page-covering drag overlay retired for the stage's own signal
             (UIA-F-166 ⊕ F-237). -->
        <div class="flex flex-col flex-1 min-h-0">
            <!-- Mobile tab bar -->
            <div v-if="hasSidebar" class="flex px-3 py-1 lg:hidden">
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
                    <!-- UIA-F-70 ⊕ F-71 ⊕ F-238: the cold load's one busy mark (glass's
                         indeterminate Progress; the retired transparent-topped ring is
                         gone), announced as a status. -->
                    <div v-if="stageLoading" class="stage-state" role="status">
                        <Progress :model-value="null" variant="liquid" size="sm" class="stage-busy-bar"
                            :aria-label="isSavedRoute ? 'Loading the visualization' : 'Loading the workspace'" />
                        <p class="text-caption text-muted-foreground">{{ isSavedRoute ? "Loading the visualization…" : "Loading the workspace…" }}</p>
                    </div>
                    <!-- Error (no workspace). X.F.W14.u — UIA-F-4: route-aware copy
                         naming the slug that failed; UIA-F-49: the button's own label
                         carries the meaning. Inside the stage (UIA-F-70). -->
                    <div v-else-if="stageError" class="stage-state">
                        <NotFoundCard
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
                    </div>
                    <div v-else class="viz-panel-right canvas-stage" :data-dragging="globalDragging || undefined"
                        :class="{ 'panel-inactive': hasSidebar && mobileView !== 'canvas' && !isDesktop }">
                        <div class="canvas-container" :class="{ 'is-hidden': isEditing && store.contour }">
                            <BasisCanvas ref="canvasComponent" :active-bases="activeBases"
                                :show-ghost="showGhost" :show-image-overlay="showImageOverlay" />
                        </div>
                        <!-- X.F.W13.c — the ONE upload affordance (owner frame 4). The
                             sidebar's "Drop or click to upload — PNG/JPG/SVG ≤ 10 MB" card
                             retired; click-to-browse (a glass Button) and the format/size
                             line (the producer's caption type) live here, and the drop
                             target signals while a file is dragged over the page. -->
                        <!-- X.F.W14U.vstage — UIA-F-69 ⊕ F-165 ⊕ F-237: the empty stage had no
                             hierarchy (one secondary 240×44 button in a blank stage, no
                             heading, nothing saying what the tool does). It is composed on
                             glass's type roles: the route's one h1, a lede, the primary
                             action (primary emphasis, copy per pointer), the format line, a
                             secondary path to the gallery; a rejected file or a failed
                             upload is said here, where it was dropped (UIA-F-166 ⊕ F-167). -->
                        <div v-if="!hasImage && !hasData" class="drop-target" :data-dragging="globalDragging || undefined">
                            <h1 class="drop-target-title font-serif-math text-display-2 font-bold tracking-tight">Draw any outline in circles</h1>
                            <p class="drop-target-lede text-body text-muted-foreground">
                                Upload an image: its outline is traced and redrawn by a Fourier series, a chain of rotating circles.
                            </p>
                            <Button emphasis="primary" size="lg" class="drop-target-button" :loading="store.uploading" @click="openCanvasFilePicker">
                                <Upload v-if="!store.uploading" />
                                {{ primaryUploadLabel }}
                            </Button>
                            <p class="text-caption text-muted-foreground">PNG/JPG/SVG ≤ 10 MB</p>
                            <p v-if="dropMessage" role="alert" class="drop-target-message text-caption">{{ dropMessage }}</p>
                            <Button emphasis="quiet" size="sm" @click="router.push('/gallery')">Browse the gallery</Button>
                            <input ref="canvasFileInput" data-testid="image-file-input" type="file" accept="image/*" class="hidden" @change="onCanvasFileSelect" />
                        </div>
                        <!-- UIA-F-73 ⊕ F-71: the first compute's one busy mark, in the DOM
                             (the canvas no longer paints a dashed "drop here" box). -->
                        <div v-if="firstCompute" class="stage-state stage-state--over" role="status">
                            <Progress :model-value="null" variant="liquid" size="sm" class="stage-busy-bar"
                                aria-label="Computing the Fourier decomposition" />
                            <p class="text-caption text-muted-foreground">Computing the Fourier decomposition…</p>
                        </div>
                        <!-- UIA-F-15: out of edit mode the editor is opacity-hidden but
                             mounted; `inert` keeps it out of the tab order and the
                             pointer, so a hidden surface can never hold focus. -->
                        <div v-if="store.contour" class="editor-shell" :class="{ 'is-hidden': !isEditing }" :inert="!isEditing">
                            <ContourEditorCanvas ref="editorRef" :contour="store.contour"
                                :image-slug="store.imageSlug" :show-image-overlay="showImageOverlay"
                                :show-ghost="showGhost"
                                @state-change="onEditorStateChange" />
                        </div>

                        <!-- Top controls dock -->
                        <div v-if="hasData || (isEditing && store.contour)" class="controls-dock-anchor">
                            <CanvasControlsDock
                                v-model:expanded="dockExpanded"
                                :is-editing="isEditing"
                                :show-image-overlay="showImageOverlay"
                                :show-ghost="showGhost"
                                :show-equation="showEquation"
                                :has-data="!!hasData"
                                :has-contour="!!store.contour"
                                :publishing="publishing"
                                @toggle-edit="toggleEdit"
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
                <!-- X.F.W14U.s (OA-59, COHESION §0cq/§0cr) — the controls pane is a
                     detached card: from lg up it IS glass's own `Card` (its
                     `--radius-card` corners, its own `shadow` cast), placed by this
                     layout with an inset gutter from the stage and the viewport edge.
                     Below lg the mobile sheet keeps its own form (a plain column). -->
                <component :is="isDesktop ? Card : 'div'" v-if="hasSidebar" v-bind="isDesktop ? { shadow: true } : {}"
                    class="viz-panel-left-wrap" :class="{ 'panel-inactive': mobileView !== 'controls' && !isDesktop }">
                    <Transition name="panel-swap" mode="out-in">
                        <div v-if="isEditing" key="editor-panel" class="viz-panel-left">
                            <!-- X.F.W14U.vstage — UIA-F-169: the Preview layer repeated the
                                 stage (the editor it previews is on screen beside it) at
                                 160 px of the aside's height; it is not mounted. -->
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
                </component>
                </Transition>
            </Configurator>
        </div>

        <Dialog :open="leaveAsk" @update:open="leaveAsk = $event">
            <DialogContent surface="opaque" class="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Leave with unsaved edits?</DialogTitle>
                    <DialogDescription>
                        The contour has edits that are not saved. Save them, discard them, or keep editing.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button emphasis="quiet" @click="leaveAsk = false">Keep editing</Button>
                    <Button emphasis="secondary" @click="discardAndLeave">Discard</Button>
                    <Button emphasis="primary" @click="saveAndLeave">Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

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
    /* X.F.W14U.vstage — UIA-F-237: at 390 the chassis sat 4 px from the
       viewport edge; below lg it keeps the app's 16 px page gutter (the
       gallery's `px-4`). */
    margin: 0.25rem 1rem;
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
   inherited by the grid: it tracks the prior 360/400/440px left-panel widths.
   X.F.W14U.s — each bound carries the detached card's two inline gutters, so
   the card's content keeps the band it had before it was inset. */
@media (min-width: 1024px) {
    :deep(.viz-configurator) {
        margin: 0.5rem;
        margin-bottom: 0.75rem;
        --configurator-aside-min: calc(320px + 2 * var(--space-body));
        --configurator-aside-max: calc(360px + 2 * var(--space-body));
    }
}
@media (min-width: 1280px) {
    :deep(.viz-configurator) { --configurator-aside-min: calc(360px + 2 * var(--space-body)); --configurator-aside-max: calc(400px + 2 * var(--space-body)); }
}
@media (min-width: 1536px) {
    :deep(.viz-configurator) { --configurator-aside-min: calc(400px + 2 * var(--space-body)); --configurator-aside-max: calc(440px + 2 * var(--space-body)); }
}
/* On mobile the Configurator stacks (grid-cols-1); the `panel-inactive`
   toggle inside each slot drives the tab switch. */
@media (max-width: 1023px) {
    /* X.F.W14U.s — the column may not outgrow the shell: as the shell grid's one
       `auto` track item its automatic minimum was its content's min-content
       (a 393 px sheet in a 380 px shell at 390, clipped 8 px past the viewport
       edge). `min-width: 0` lets the track fit the shell; the sheet's form is
       unchanged. */
    :deep(.viz-configurator > [data-slot="configurator"]) { display: flex; flex-direction: column; min-width: 0; }

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
    /* X.F.W14U.vstage — with the Controls tab up the stage's one child is
       `display: none`, and the growing empty cell took the column's leftover
       height as a blank band above the sheet (exposed once the Image layer
       became a compact row, UIA-F-169). The inactive stage takes no height. */
    :deep(.viz-configurator .configurator-stage:has(> .panel-inactive)) {
        flex: 0 0 0%;
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
/* X.F.W14U.s (OA-59) — from lg up the wrap is glass's `Card` (template), and
   this is its placement only: an inset gutter on every side, so the card never
   touches the stage (the aside's divider) or the Configurator's edge, and its
   own corners and cast show (`width: auto` so the stretched column item takes
   the gutter inside its band, not past it). The card is never restyled here. */
@media (min-width: 1024px) { .viz-panel-left-wrap { width: auto; max-width: none; margin: var(--space-body); } }

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

/* ── Controls dock positioning ──
   X.F.W14.u — UIA-F-5: the dock is right-anchored at every width. Below lg the
   expanded dock was re-seated at `left: 50%; right: auto`, and an absolute box
   with those insets shrinks-to-fit into HALF its container: at 390 the 254 px
   layer sat in a 121 px box, the persistent Edit control overlapped Σ Equation
   (a tap on Σ entered edit mode), and Fullscreen lay outside the plate. Anchored
   by `right` alone, the shrink-to-fit width is the whole stage, so the dock is
   its content's width (dock README: fit-content), and it clears the legend. */
.controls-dock-anchor {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: var(--z-controls);
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
    padding-inline: 1.5rem;
    text-align: center;
    pointer-events: none;
    z-index: var(--z-controls);
}
/* X.F.W14U.vstage — the empty state's hierarchy (UIA-F-69): the title, then the
   lede one step down, then the action; the gallery path sits apart below. */
.drop-target-title {
    margin: 0;
    max-inline-size: 18ch;
    text-wrap: balance;
}
.drop-target-lede {
    margin: 0 0 0.75rem;
    max-inline-size: 52ch;
    text-wrap: pretty;
}
.drop-target-message {
    color: var(--destructive);
    max-inline-size: 42ch;
}
.drop-target > * {
    pointer-events: auto;
}
/* The dragenter signal: the glass focus-ring register on the target, so a
   dragged file reads which surface will take it. */
.drop-target[data-dragging] .drop-target-button {
    box-shadow: 0 0 0 2px var(--focus-ring-color);
}
/* UIA-F-166 — the whole stage signals a file dragged over it (was the button
   only); inset, so the Configurator's rounded stage cell draws it on its own
   rim. With an image, a drop here replaces it. */
.canvas-stage[data-dragging]::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 2px var(--focus-ring-color);
    pointer-events: none;
    z-index: var(--z-controls);
}

/* ── X.F.W14U.vstage — the stage's whole-route states (UIA-F-70 ⊕ F-73) ──
   The cold load, the load error and the first compute render inside the
   stage cell, centred, so the chassis never leaves. */
.stage-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    height: 100%;
    padding: 1.5rem 1rem;
}
.stage-state--over {
    position: absolute;
    inset: 0;
    height: auto;
    z-index: var(--z-controls);
    pointer-events: none;
}
.stage-busy-bar {
    inline-size: min(12rem, 60%);
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
