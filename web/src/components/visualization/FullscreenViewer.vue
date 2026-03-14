<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { Minimize2 } from "lucide-vue-next";
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
const show = ref(false);

watch(() => props.visible, (v) => {
    if (v) {
        show.value = true;
    } else {
        show.value = false;
    }
}, { immediate: true });

function onAfterLeave() {
    // Nothing needed — the teleport stays in DOM but invisible
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && props.visible) emit("close");
}

onMounted(() => document.addEventListener("keydown", onKeydown));
onUnmounted(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
    <Teleport to="body">
        <Transition name="fs" @after-leave="onAfterLeave">
            <div v-if="show" class="fs-backdrop" @click.self="emit('close')">
                <div class="fs-container">
                    <!-- Close button -->
                    <button class="fs-close" @click="emit('close')">
                        <Minimize2 class="h-5 w-5" />
                    </button>

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
                            @toggle-ghost="emit('toggleGhost')"
                            @toggle-image-overlay="emit('toggleImageOverlay')"
                            @export-frame="canvasComponent?.exportFrame()"
                        />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.fs-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: hsl(var(--background));
}

.fs-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.fs-container :deep(.canvas-container),
.fs-container :deep(.editor-shell) {
    flex: 1;
    border: none;
    border-radius: 0;
    box-shadow: none;
    min-height: 0;
}

.fs-container :deep(.canvas-container:hover) {
    border-color: transparent;
    box-shadow: none;
}

.fs-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 210;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    border: 1.5px solid hsl(var(--foreground) / 0.12);
    background: hsl(var(--background) / 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: hsl(var(--foreground));
    cursor: pointer;
    transition: all 0.15s ease;
}

.fs-close:hover {
    background: hsl(var(--background) / 0.9);
    border-color: hsl(var(--foreground) / 0.25);
    transform: scale(1.05);
}

.fs-close:active {
    transform: scale(0.95);
}

.fs-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 210;
    padding: 0 1rem 0.75rem;
    display: flex;
    justify-content: center;
}

@media (min-width: 640px) {
    .fs-controls {
        padding: 0 2rem 1rem;
    }
}

/* Make controls a bit wider in fullscreen */
.fs-controls :deep(.glass-dock) {
    max-width: 60rem;
}

/* ── Fullscreen enter/leave transitions ── */
.fs-enter-active {
    transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.fs-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.fs-enter-from {
    opacity: 0;
    transform: scale(0.95);
}
.fs-leave-to {
    opacity: 0;
    transform: scale(0.95);
}
</style>
