<script setup lang="ts">
import { ref } from "vue";
import { Button, Switch } from "@mkbabb/glass-ui";
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
                        <Button variant="glass" size="icon" class="h-8 w-8" @click="emit('close')">
                            <X class="h-4 w-4" />
                        </Button>
                    </div>

                    <div class="option-list">
                        <label v-if="hasEpicycles" class="option-row">
                            <span class="option-label">Epicycles</span>
                            <Switch v-model="withEpicycles" />
                        </label>
                        <label class="option-row">
                            <span class="option-label">Trace path</span>
                            <Switch v-model="withTrail" />
                        </label>
                        <label class="option-row">
                            <span class="option-label">Grid lines</span>
                            <Switch v-model="withGrid" />
                        </label>
                        <label class="option-row">
                            <span class="option-label">Labels</span>
                            <Switch v-model="withLabels" />
                        </label>
                    </div>

                    <div class="modal-footer">
                        <Button variant="outline" size="default" @click="emit('close')">Cancel</Button>
                        <Button variant="default" size="default" @click="doExport">
                            <Download class="h-3.5 w-3.5" />
                            Save PNG
                        </Button>
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
    background: color-mix(in srgb, var(--background) 70%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.modal-card {
    background: var(--card);
    border: 2px solid color-mix(in srgb, var(--foreground) 15%, transparent);
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

/* Transitions — unified with GalleryCardModal (A.W3.d — bezier→`--ease-apple-spring`) */
.modal-enter-active {
    transition: opacity 0.25s var(--ease-standard), transform 0.3s var(--ease-apple-spring);
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
    background: color-mix(in srgb, var(--muted) 50%, transparent);
}

.option-label {
    @apply text-base;
    font-weight: 500;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.25rem;
}

</style>
