<script setup lang="ts">
import { ref } from "vue";
import { X, Download } from "lucide-vue-next";

const props = defineProps<{
    hasEpicycles: boolean;
}>();

const emit = defineEmits<{
    (e: "export", options: Record<string, boolean>): void;
    (e: "close"): void;
}>();

const withEpicycles = ref(true);
const withTrail = ref(true);
const withGrid = ref(true);
const withLabels = ref(true);

function doExport() {
    emit("export", {
        withEpicycles: props.hasEpicycles && withEpicycles.value,
        withTrail: withTrail.value,
        withGrid: withGrid.value,
        withLabels: withLabels.value,
    });
}
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div class="modal-backdrop" @click.self="emit('close')">
                <div class="modal-card" @click.stop>
                    <div class="modal-header">
                        <h3 class="cm-serif text-lg font-semibold">Export Frame</h3>
                        <button class="glass-btn w-8 h-8" @click="emit('close')">
                            <X class="h-4 w-4" />
                        </button>
                    </div>

                    <div class="option-list">
                        <label v-if="hasEpicycles" class="option-row">
                            <span class="option-label">Epicycles</span>
                            <button
                                class="toggle"
                                :class="{ 'is-on': withEpicycles }"
                                @click="withEpicycles = !withEpicycles"
                            >
                                <span class="toggle-thumb" />
                            </button>
                        </label>
                        <label class="option-row">
                            <span class="option-label">Trace path</span>
                            <button
                                class="toggle"
                                :class="{ 'is-on': withTrail }"
                                @click="withTrail = !withTrail"
                            >
                                <span class="toggle-thumb" />
                            </button>
                        </label>
                        <label class="option-row">
                            <span class="option-label">Grid lines</span>
                            <button
                                class="toggle"
                                :class="{ 'is-on': withGrid }"
                                @click="withGrid = !withGrid"
                            >
                                <span class="toggle-thumb" />
                            </button>
                        </label>
                        <label class="option-row">
                            <span class="option-label">Labels</span>
                            <button
                                class="toggle"
                                :class="{ 'is-on': withLabels }"
                                @click="withLabels = !withLabels"
                            >
                                <span class="toggle-thumb" />
                            </button>
                        </label>
                    </div>

                    <div class="modal-footer">
                        <button class="btn-ghost" @click="emit('close')">Cancel</button>
                        <button class="btn-solid" @click="doExport">
                            <Download class="h-3.5 w-3.5" />
                            Save PNG
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
@reference "tailwindcss";
.modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: flex;
    align-items: center;
    justify-content: center;
    background: hsl(var(--background) / 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.modal-card {
    background: hsl(var(--card));
    border: 2px solid hsl(var(--foreground) / 0.15);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-modal);
    padding: 1.25rem;
    min-width: 300px;
    max-width: 90vw;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
}

/* Transitions — unified with GalleryCardModal */
.modal-enter-active {
    transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-enter-from { opacity: 0; transform: scale(0.92); }
.modal-leave-to { opacity: 0; transform: scale(0.95); }

.option-list {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.option-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.25rem;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background 0.15s;
}

.option-row:hover {
    background: hsl(var(--muted) / 0.5);
}

.option-label {
    @apply text-base;
    font-weight: 500;
}

/* Toggle switch */
.toggle {
    position: relative;
    width: 2.5rem;
    height: 1.375rem;
    border-radius: 9999px;
    border: 2px solid hsl(var(--foreground) / 0.15);
    background: hsl(var(--muted));
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    flex-shrink: 0;
}

.toggle.is-on {
    background: hsl(var(--primary));
    border-color: hsl(var(--primary));
}

.toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 50%;
    background: hsl(var(--background));
    box-shadow: var(--shadow-soft);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.toggle.is-on .toggle-thumb {
    transform: translateX(1.125rem);
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.25rem;
}

</style>
