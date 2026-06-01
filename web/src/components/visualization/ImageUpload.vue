<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useImageUpload } from "./composables/useImageUpload";
import { thumbnailUrl } from "@/lib/api";
import { ImagePlus, Upload, ImageOff } from "lucide-vue-next";

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
    <div
        class="cartoon-card px-3 py-2 relative"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
    >
        <h3 class="cm-serif mb-3 text-sm font-semibold tracking-tight flex items-center gap-2">
            <ImagePlus class="h-4 w-4 text-muted-foreground" />
            Image
            <span class="ml-0.5 text-xs font-normal text-muted-foreground">— source input</span>
        </h3>

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

        <!-- Rainbow computing bar — below the card content -->
        <Transition name="rainbow-fade">
            <div v-if="store.computing" class="rainbow-track">
                <div class="rainbow-bar" />
            </div>
        </Transition>

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
/* Rainbow bar — absolutely positioned at bottom of card, no layout shift */
.rainbow-track {
    position: absolute;
    bottom: 0;
    left: 0.5rem;
    right: 0.5rem;
    height: 6px;
    border-radius: 9999px;
    overflow: hidden;
    background: var(--muted);
}

.rainbow-bar {
    height: 100%;
    width: 100%;
    border-radius: 9999px;
    background: linear-gradient(
        90deg,
        #f87171 0%,
        #fbbf24 17%,
        #34d399 33%,
        #60a5fa 50%,
        #c084fc 67%,
        #f472b6 83%,
        #f87171 100%
    );
    background-size: 200% 100%;
    animation: rainbow-slide 1.4s linear infinite;
}

@keyframes rainbow-slide {
    0% { background-position: 0% 0; }
    100% { background-position: 200% 0; }
}

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
.source-strip:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
}
.source-strip.is-dragging {
    background: color-mix(in srgb, var(--primary) 6%, transparent);
    border-color: var(--primary);
}
</style>
