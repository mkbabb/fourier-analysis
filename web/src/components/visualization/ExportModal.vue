<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Switch } from "@mkbabb/glass-ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@mkbabb/glass-ui/dialog";
import { Download } from "@lucide/vue";

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

// The Dialog is rendered open; reka-ui's DialogRoot drives the focus-trap,
// Esc-to-close, and `aria-modal`. `@update:open` fires `false` on Esc /
// backdrop / close-button — bridge it to the consumer's `close` event.
function onOpenChange(open: boolean) {
    if (!open) emit("close");
}

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
    <Dialog :open="true" @update:open="onOpenChange">
        <!-- DialogContent supplies role="dialog" + aria-modal="true" + focus-trap
             + Esc + autofocus via reka-ui's DialogPortal/DialogContent. -->
        <DialogContent>
            <DialogHeader>
                <DialogTitle class="font-serif-math text-lg font-semibold">Export Frame</DialogTitle>
            </DialogHeader>

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

            <DialogFooter>
                <Button emphasis="secondary" @click="emit('close')">Cancel</Button>
                <Button emphasis="primary" @click="doExport">
                    <Download class="h-3.5 w-3.5" />
                    Save PNG
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
@reference "tailwindcss";
/* F.W1 / fr-ExportModal M-γ — the `min-width: 300px` floor is DELETED, and the
   deletion is a sequenced prerequisite of the uplift rather than a tidy-up. At
   the adopted pin `[data-slot="dialog-content"]` sizes itself
   `min(100% - 2 * var(--space-section), 32rem)` from inside a `:where()`, i.e.
   at specificity (0,0,0): a consumer floor no longer merely duplicates the
   plate's width, it OUTRANKS the gutter clamp and pushes the plate past the
   viewport edge on the narrow widths the clamp exists to protect. The rule's
   only declaration went with it, so the class did too. */

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
    border-radius: var(--radius-md);
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
</style>
