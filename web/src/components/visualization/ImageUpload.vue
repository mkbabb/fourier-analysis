<script setup lang="ts">
import { ref, watch } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useImageUpload } from "./composables/useImageUpload";
import { thumbnailUrl } from "@/lib/api";
import { ConfiguratorLayer } from "@mkbabb/glass-ui/configurator";
import { Progress } from "@mkbabb/glass-ui/progress";
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

            <!-- Preview with overlay replace button + drag-over dashed outline -->
            <div
                v-if="hasPreview()"
                class="group relative mb-0 overflow-hidden rounded-lg animate-scale-in transition-all duration-200"
                :class="{
                    'ring-2 ring-dashed ring-primary ring-offset-2 ring-offset-card': isDragging,
                }"
            >
                <!-- Broken image fallback -->
                <div v-if="imgError" class="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                    <ImageOff class="h-10 w-10 opacity-40" />
                    <p class="text-xs fira-code">Image unavailable</p>
                </div>
                <img
                    v-else
                    :src="preview || (store.imageSlug ? thumbnailUrl(store.imageSlug) : '')"
                    alt="Uploaded image"
                    class="w-full max-h-[200px] object-contain transition-all duration-300"
                    @error="onImgError"
                />
                <div
                    class="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 cursor-pointer"
                    :class="{
                        'bg-primary/10': isDragging,
                    }"
                    @click="openFilePicker"
                >
                    <div
                        v-if="isDragging"
                        class="flex items-center gap-1.5 rounded-md bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm fira-code"
                    >
                        <Upload class="h-3 w-3" />
                        Drop to replace
                    </div>
                </div>
            </div>

            <!-- D.W4.b — Slim source-strip (replaces the redundant full-card
                 empty-state dropzone). The canvas-center placeholder is the
                 hero affordance; this strip is a secondary cue + click target.
                 Once an image lands, the thumbnail/replace card above (with
                 `hasPreview()` true) becomes the only "full" panel form. -->
            <button
                v-else
                type="button"
                class="source-strip group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150"
                :class="{
                    'is-dragging': isDragging,
                }"
                @click="openFilePicker"
            >
                <Upload
                    class="h-4 w-4 shrink-0 transition-colors duration-150"
                    :class="{
                        'text-primary': isDragging,
                        'text-muted-foreground': !isDragging,
                    }"
                />
                <span class="flex-1 text-sm font-medium text-muted-foreground">
                    Drop or click to upload — PNG/JPG/SVG ≤ 10 MB
                </span>
            </button>

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
                <Progress
                    v-if="store.computing"
                    :model-value="null"
                    variant="liquid"
                    size="sm"
                    class="mt-2"
                    aria-label="Computing the Fourier decomposition"
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
            data-testid="image-file-input"
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

.ring-dashed {
    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
    outline: 2px dashed var(--primary);
    outline-offset: 3px;
}

/* D.W4.b — slim source-strip. Replaces the redundant full dashed-border
   empty-state dropzone with a one-line click target that yields hero
   primacy to the canvas placeholder. The dashed-border affordance is
   reserved for the canvas hero; the panel's secondary cue is flat. */
.source-strip {
    background: color-mix(in srgb, var(--muted) 40%, transparent);
    border: 1px solid var(--border);
    cursor: pointer;
}
.source-strip:hover {
    background: color-mix(in srgb, var(--muted) 60%, transparent);
    border-color: color-mix(in srgb, var(--foreground) 25%, transparent);
}
/* X.F.W4 · `FM-2`'s ring rider, the site `.a` named and handed to this unit.
   `--ring` is declared in NO tree at the adopted pin — not by glass-ui 8.0.0,
   not by this app — and an `outline` whose colour is an undeclared `var()` is
   invalid at computed-value time and DROPPED. This rule, whose only purpose is
   to paint a focus ring, has been painting none. `--focus-ring-color` and
   `--focus-ring-width` are the producer's own registers, the same pair its
   `.focus-ring:focus-visible` recipe uses, so the hand-rolled ring and the
   library's now agree. */
.source-strip:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: 2px;
}
.source-strip.is-dragging {
    background: color-mix(in srgb, var(--primary) 6%, transparent);
    border-color: var(--primary);
}
</style>
