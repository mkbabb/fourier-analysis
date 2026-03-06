<script setup lang="ts">
import { ref } from "vue";
import { useSessionStore } from "@/stores/session";
import { useImageUpload } from "@/composables/useImageUpload";
import { imageUrl } from "@/lib/api";
import { ImagePlus, Upload, Replace } from "lucide-vue-next";

const store = useSessionStore();
const fileInput = ref<HTMLInputElement>();

const { isDragging, preview, handleDrop, handleDragOver, handleDragLeave, handleFileSelect } =
    useImageUpload(async (file: File) => {
        await store.uploadImage(file);
    });
const hasPreview = () => store.hasImage || preview.value;

function openFilePicker() {
    fileInput.value?.click();
}
</script>

<template>
    <div
        class="rounded-xl border border-border bg-card p-4 card-hover"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
    >
        <h3 class="cm-serif mb-3 text-sm font-semibold tracking-tight flex items-center gap-2">
            <ImagePlus class="h-4 w-4 text-muted-foreground" />
            Image
        </h3>

        <!-- Preview with overlay replace button + drag-over dashed outline -->
        <div
            v-if="hasPreview()"
            class="group relative mb-0 overflow-hidden rounded-lg animate-scale-in transition-all duration-200"
            :class="{
                'ring-2 ring-dashed ring-primary ring-offset-2 ring-offset-card': isDragging,
            }"
        >
            <img
                :src="preview || (store.slug ? imageUrl(store.slug) : '')"
                alt="Uploaded image"
                class="w-full object-contain transition-all duration-300"
                style="max-height: 200px"
            />
            <div
                class="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 cursor-pointer"
                :class="{
                    'bg-primary/10': isDragging,
                    'group-hover:bg-black/30': !isDragging,
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
                <div
                    v-else
                    class="flex items-center gap-1.5 rounded-md bg-background/90 px-3 py-1.5 text-xs font-medium opacity-0 transition-all duration-200 group-hover:opacity-100 shadow-sm backdrop-blur-sm"
                >
                    <Replace class="h-3 w-3" />
                    Replace
                </div>
            </div>
        </div>

        <!-- Drop zone: only shown when no image is loaded -->
        <div
            v-else
            class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all duration-200"
            :class="{
                'border-primary bg-primary/5 scale-[1.01]': isDragging,
                'border-border hover:border-muted-foreground hover:bg-muted/30': !isDragging,
            }"
            @click="openFilePicker"
        >
            <Upload
                class="mb-2.5 h-8 w-8 transition-all duration-200"
                :class="{
                    'text-primary': isDragging,
                    'text-muted-foreground': !isDragging,
                }"
            />
            <p class="text-sm font-medium text-muted-foreground">
                Drop an image or click to upload
            </p>
            <p class="mt-1 text-xs text-muted-foreground/60">
                PNG, JPG, SVG up to 10MB
            </p>
        </div>

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
.ring-dashed {
    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
    outline: 2px dashed hsl(var(--primary));
    outline-offset: 3px;
}
</style>
