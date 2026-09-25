<script setup lang="ts">
import { Button } from "@mkbabb/glass-ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@mkbabb/glass-ui/dialog";

/**
 * X.F.W14V.au4 — A2-FO-L1-9: the one destructive-confirm dialog, over glass
 * Dialog (glass deliberately mints no Confirm symbol, `DialogContent.vue:21-28`).
 * Its state is `useDestructiveConfirm`'s; the host supplies the words.
 *
 * - While the act is in flight the dialog is `locked` (no close, Escape and the
 *   outside press rebuffed) and Cancel is disabled; otherwise it is a
 *   `deliberate` confirm (UIA-F-251, carried from the flagged queue).
 * - `tone` is the confirm's register: `destructive` for a delete or a prune,
 *   `neutral` for a reversible batch (suspend, reinstate, feature).
 * - The description is the default slot, so each host names its target (the
 *   FR-AUL-1 / FR-AUL-28 rule: a confirm names what it acts on).
 */
withDefaults(
    defineProps<{
        open: boolean;
        busy?: boolean;
        title: string;
        confirmLabel: string;
        tone?: "destructive" | "neutral";
    }>(),
    { busy: false, tone: "destructive" },
);

const emit = defineEmits<{
    "update:open": [open: boolean];
    confirm: [];
}>();
</script>

<template>
    <Dialog :open="open" @update:open="emit('update:open', $event)">
        <DialogContent surface="opaque" class="max-w-sm" :dismiss="busy ? 'locked' : 'deliberate'">
            <DialogHeader>
                <DialogTitle>{{ title }}</DialogTitle>
                <DialogDescription>
                    <slot />
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button emphasis="quiet" :disabled="busy" @click="emit('update:open', false)">Cancel</Button>
                <Button emphasis="primary" :tone="tone" :loading="busy" :disabled="busy" @click="emit('confirm')">
                    {{ confirmLabel }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
