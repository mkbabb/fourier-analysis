<script setup lang="ts">
import { ref, watch } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useImageUpload } from "./composables/useImageUpload";
import { thumbnailUrl } from "@/lib/api";
import { ConfiguratorLayer } from "@mkbabb/glass-ui/configurator";
import { Progress } from "@mkbabb/glass-ui/progress";
import { Button } from "@mkbabb/glass-ui/button";
import { Upload, ImageOff } from "@lucide/vue";

const store = useWorkspaceStore();
const fileInput = ref<HTMLInputElement>();
const imgError = ref(false);

const { isDragging, preview, clearPreview, handleDrop, handleDragOver, handleDragEnter, handleDragLeave, handleFileSelect } =
    useImageUpload(async (file: File) => {
        imgError.value = false;
        await store.uploadImage(file);
    });

// Reset component-local preview when the workspace image changes, including
// uploads initiated from the global dropzone or canvas click target.
watch(() => store.imageSlug, () => {
    imgError.value = false;
    clearPreview();
});

const hasPreview = () => !!store.imageMeta || preview.value;

/*
 * X.F.W14V.u4 — UIA-F-71 ⊕ F-238: whether the upload in flight REPLACES an
 * image (read at its start: the first upload sets `imageMeta` midway, and its
 * flight runs on through the draft save and the first compute).
 */
const replacing = ref(false);
watch(() => store.uploading, (now) => {
    if (now) replacing.value = !!store.imageMeta;
});

function openFilePicker() {
    fileInput.value?.click();
}

function onImgError() {
    imgError.value = true;
}
</script>

<template>
    <!-- The panel root stays the drop target; the `relative` seat the
         hand-rolled absolutely-positioned bar needed retires with it. -->
    <div
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
    >
        <!-- X.F.W3 `.d` — `fr-ImageUpload` roster 10's INTERLOCK, honoured
             literally: "adoption must CARRY the `<h3>` (ConfiguratorLayer
             supplies no heading) or the route drops to ZERO headings."
             ConfiguratorLayer's header is a `<button>` holding a `<span
             class="configurator-section-label">` — verified in the producer's
             own compiled template at the installed 8.0.0 pin — so adopting it
             bare would delete the reachable `/w` tree's only heading (roster
             14). The heading is carried here, beside the layer it names, and
             visually hidden because the layer's trigger already paints the same
             word: the outline survives, nothing is said twice on screen.

             Roster 18 dies in the same motion: the decorative "— source input"
             span used to sit INSIDE the `<h3>` and pollute its accessible name.
             It is now the layer's `sub` prop — the exact label/sub pair the
             producer exposes — and the heading carries the NAME alone. -->
        <h3 class="sr-only">Image</h3>
        <ConfiguratorLayer label="Image" sub="source input">

            <!-- X.F.W14U.vstage — UIA-F-169 ⊕ F-239: the image took the aside's top
                 third (a 200 px letterboxed preview above a full-width Replace
                 button), and its rounded corner fell on letterbox space, not on
                 the image. It is a compact row now: the thumbnail at the image's
                 own aspect (its box IS the image, so the media radius rounds the
                 picture) beside its Replace command. The drag-over signal is the
                 row's ring; the "Drop to replace" plate is the stage's
                 (VisualizationView, F-166). -->
            <div v-if="hasPreview()" class="image-row" :data-dragging="isDragging || undefined">
                <div v-if="imgError" class="image-missing text-muted-foreground">
                    <ImageOff aria-hidden="true" />
                    <p class="text-caption">Image unavailable</p>
                </div>
                <img
                    v-else
                    :src="preview || (store.imageSlug ? thumbnailUrl(store.imageSlug) : '')"
                    alt="Uploaded image"
                    class="image-thumb"
                    @error="onImgError"
                />
                <Button emphasis="secondary" size="sm" @click="openFilePicker">
                    <Upload />
                    Replace image
                </Button>
            </div>

            <!-- X.F.W13.c — the source strip ("Drop or click to upload — PNG/JPG/SVG
                 ≤ 10 MB") RETIRED (owner frame 4: "duplicative"). This layer renders
                 only once an image exists (the sidebar arrives with it); with no
                 image the main area's drop target is the one upload affordance. -->

            <!-- X.F.W3 `.d` — `fr-ImageUpload` roster 4 (⊕ roster 24). 47 lines of
                 hand-rolled indeterminate progress with ZERO a11y channel (`grep -c
                 aria-` over this file returned 0: no role, no status, no sr-only)
                 retire onto `./progress`, exported at the installed pin.

                 Roster 24 closes with it, and the routing is why: under
                 `prefers-reduced-motion` the hand-rolled bar FROZE at its 100 %
                 frame while the `<Transition>` still faded it in — opacity is
                 allow-listed by the blanket clamp — so a motionless, nameless
                 decorative gradient was the PRM+AT user's entire busy signal. The
                 correct channel is NON-MOTION, not a new PRM carve: reka's
                 `role="progressbar"` with an indeterminate value and a real name
                 says "busy" without moving anything.

                 ▲ CENSUS DRIFT, MEASURED AT THE PIN AND RECORDED, NOT INHERITED:
                 roster 4 names "variant `gradient`, `indeterminate`" — the 4.0.0
                 spelling. At the adopted 8.0.0 bytes `ProgressVariant` is
                 `"default" | "liquid"` and indeterminate is `:model-value="null"`
                 ("`null` is INDETERMINATE — reka's own door, and the only one",
                 the producer's own docblock). The cure is unchanged; its spelling
                 is the pin's. -->
            <Transition name="rainbow-fade">
                <!-- X.F.W14.r — the sidebar now enters on drop (F.W13 `.c` r1),
                     so the upload in flight is this layer's busy state too. -->
                <!-- X.F.W14U.vstage — UIA-F-71 ⊕ F-238: computing is the stage's
                     one busy mark (VisualizationView); this bar carried it too, and
                     its unmount at the end of a compute jumped the Decomposition
                     layer up ~33 px. The layer's bar is the upload's only. -->
                <!-- X.F.W14V.u4 — UIA-F-71 ⊕ F-238: a REPLACE upload's mark (the
                     image is already here). The first upload's one mark is the
                     stage's drop-target button (glass's dot ring); a second bar
                     here doubled it, and its unmount at the end of the first
                     compute jumped the layers below. -->
                <Progress
                    v-if="store.uploading && replacing"
                    :model-value="null"
                    variant="liquid"
                    size="sm"
                    class="mt-2"
                    aria-label="Uploading the image"
                />
            </Transition>

        </ConfiguratorLayer>

        <!-- The file input stays OUTSIDE the layer body on purpose: a collapsed
             ConfiguratorLayer marks its region `inert`, and an inert input is
             not a reliable target for the programmatic `.click()` that opens the
             picker. The control that summons it lives inside; the input itself
             is always live. -->
        <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
        />
    </div>
</template>

<style scoped>
/* X.F.W3 `.d` — the 47 hand-rolled lines roster 4 books are DELETED, not
   rewritten: the track, the seven-stop literal-hex gradient bar (zero tokens,
   zero `dark:`) and the `rainbow-slide` keyframes it animated. `./progress`
   ships the rail, the indeterminate motion, the reduced-motion arm and the
   `role="progressbar"` channel none of this had. The fade transition below
   SURVIVES — it is the mount treatment, not the progress, and deleting it
   would be an unasked-for change to how the bar arrives. */
.rainbow-fade-enter-active {
    transition: opacity 0.3s ease-out;
}
.rainbow-fade-leave-active {
    transition: opacity 0.4s ease-in;
}
.rainbow-fade-enter-from,
.rainbow-fade-leave-to {
    opacity: 0;
}

/* The compact image row (F-169). The thumbnail's box is the image: bounded on
   both axes with `auto` sizes, so it keeps the image's aspect and the media
   radius rounds the picture itself (F-239). */
.image-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-radius: var(--radius-media);
}
.image-row[data-dragging] {
    box-shadow: 0 0 0 2px var(--focus-ring-color);
}
.image-thumb {
    display: block;
    width: auto;
    height: auto;
    max-width: 7.5rem;
    max-height: 5rem;
    border-radius: var(--radius-media);
}
.image-missing {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
</style>
