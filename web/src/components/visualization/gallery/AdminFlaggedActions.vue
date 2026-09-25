<script setup lang="ts">
import { Button } from "@mkbabb/glass-ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@mkbabb/glass-ui/menu";
import { Bookmark, CheckCircle2, EllipsisVertical, Trash2 } from "@lucide/vue";
import type { FlaggedVisualization } from "@/lib/types";

/**
 * X.F.W14V.au4 — A2-FO-L1-27: a flagged row's actions (UIA-F-110): Dismiss, the
 * common act, visible; Keep (gated on a Saved row, UIA-F-197) and Delete apart
 * in the destructive ink, in the row's menu. It is the queue table's last
 * column rather than DataTable's `row-actions` seat, which glass fixes at one
 * icon wide (2.5rem): a visible verb beside a menu overran it.
 */
defineProps<{ row: FlaggedVisualization; busy: boolean }>();

const emit = defineEmits<{ dismiss: [slug: string]; keep: [slug: string]; delete: [slug: string] }>();
</script>

<template>
    <div class="flex flex-none items-center gap-1" data-admin-actions>
        <Button
            emphasis="secondary"
            size="xs"
            class="shrink-0 gap-1"
            :disabled="busy"
            :aria-label="`Dismiss flags on ${row.slug}`"
            @click="emit('dismiss', row.slug)"
        >
            <CheckCircle2 class="size-3.5" aria-hidden="true" />
            Dismiss
        </Button>
        <DropdownMenu :modal="false">
            <DropdownMenuTrigger as-child>
                <Button
                    emphasis="quiet"
                    size="xs"
                    icon-only
                    :disabled="busy"
                    :aria-label="`More actions for ${row.slug}`"
                >
                    <EllipsisVertical class="size-3.5" aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" :side-offset="6">
                <DropdownMenuItem :disabled="row.tier === 'saved'" @select="emit('keep', row.slug)">
                    <Bookmark class="size-3.5" aria-hidden="true" />
                    Keep
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="text-destructive" @select="emit('delete', row.slug)">
                    <Trash2 class="size-3.5" aria-hidden="true" />
                    Delete entry…
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>
