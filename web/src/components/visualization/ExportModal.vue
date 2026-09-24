<script setup lang="ts">
import { reactive, watch } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { LabeledSwitch } from "@mkbabb/glass-ui/labeled-field";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@mkbabb/glass-ui/dialog";
import { Download } from "@lucide/vue";
import { safeGetItem, safeSetItem } from "@/composables/useSafeStorage";

const props = defineProps<{
    hasEpicycles: boolean;
}>();

const emit = defineEmits<{
    (e: "export", options: Record<string, boolean>): void;
    (e: "close"): void;
}>();

/**
 * X.F.W14U.vdock — UIA-F-243: the choices are the viewer's, remembered across
 * opens (this dialog mounts per open, so its refs reset every time), through
 * `useSafeStorage`'s try/catch; a missing or unreadable record is the defaults.
 * Every exported layer has a switch — the reference contour included — and an
 * opaque ground is one of them.
 */
const STORAGE_KEY = "fourier:export-options";
const DEFAULTS = {
    withEpicycles: true,
    withTrail: true,
    withReference: true,
    withGrid: true,
    withLabels: true,
    withBackground: false,
};
type ExportOptions = typeof DEFAULTS;

function restore(): ExportOptions {
    const raw = safeGetItem(localStorage, STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    let saved: unknown;
    try {
        saved = JSON.parse(raw);
    } catch {
        return { ...DEFAULTS };
    }
    const out = { ...DEFAULTS };
    if (saved && typeof saved === "object") {
        for (const key of Object.keys(DEFAULTS) as (keyof ExportOptions)[]) {
            const v = (saved as Record<string, unknown>)[key];
            if (typeof v === "boolean") out[key] = v;
        }
    }
    return out;
}

const options = reactive(restore());
watch(options, (next) => safeSetItem(localStorage, STORAGE_KEY, JSON.stringify(next)));

// The Dialog is rendered open; reka-ui's DialogRoot drives the focus-trap,
// Esc-to-close, and `aria-modal`. `@update:open` fires `false` on Esc /
// backdrop / close-button — bridge it to the consumer's `close` event.
function onOpenChange(open: boolean) {
    if (!open) emit("close");
}

function doExport() {
    emit("export", { ...options, withEpicycles: props.hasEpicycles && options.withEpicycles });
}
</script>

<template>
    <Dialog :open="true" @update:open="onOpenChange">
        <!-- DialogContent supplies role="dialog" + aria-modal="true" + focus-trap
             + Esc + autofocus via reka-ui's DialogPortal/DialogContent. -->
        <DialogContent>
            <!-- X.F.W14U.vdock — UIA-F-181 ⊕ F-229 ⊕ F-243: the title keeps glass's
                 own title rung (the consumer `text-lg` re-sized it off the
                 header's line box the close control centres on), and the dialog
                 is described (Reka warned twice per open without one). -->
            <DialogHeader>
                <DialogTitle class="font-serif-math">Export Frame</DialogTitle>
                <DialogDescription>Save the current frame as a PNG, with the layers you choose.</DialogDescription>
            </DialogHeader>

            <!-- UIA-F-181: glass LabeledSwitch rows (label, control and hit area
                 are the producer's), replacing the hand-rolled label + Switch rows
                 and their 6px hover slab. -->
            <div class="option-list">
                <LabeledSwitch v-if="hasEpicycles" v-model="options.withEpicycles" label="Epicycles" layout="horizontal" />
                <LabeledSwitch v-model="options.withTrail" label="Trace path" layout="horizontal" />
                <LabeledSwitch v-model="options.withReference" label="Reference contour" layout="horizontal" />
                <LabeledSwitch v-model="options.withGrid" label="Grid lines" layout="horizontal" />
                <LabeledSwitch v-model="options.withLabels" label="Labels" layout="horizontal" />
                <LabeledSwitch v-model="options.withBackground" label="Opaque background" layout="horizontal" />
            </div>

            <DialogFooter>
                <Button emphasis="secondary" @click="emit('close')">Cancel</Button>
                <Button emphasis="primary" @click="doExport">
                    <Download />
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

/* X.F.W14U.vdock — UIA-F-181: the hand-rolled `.option-row` / `.option-label`
   rules (padding, hover slab, literal type size) retire with the rows; the
   LabeledSwitch rows carry the producer's own. */
</style>
