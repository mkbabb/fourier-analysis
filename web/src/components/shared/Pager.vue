<script setup lang="ts" generic="S extends string">
import { Button } from "@mkbabb/glass-ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@mkbabb/glass-ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "@lucide/vue";

/**
 * X.F.W14V.au4 — A2-FO-L1-27: the offset pager, written once. The users list
 * and the audit log each carried the same composition (X.F.W14U.admin,
 * UIA-F-250 ⊕ UIA-F-194 ⊕ UIA-F-252): first · previous · "Page n of m" · next ·
 * last, the rows-per-page size, and the total, in one voice.
 *
 * Glass has no Pagination primitive (UIA-F-145, the standing ask); this is the
 * one consumer seat until it ships, then it retires onto it (ADOPT-AT-LANDING).
 * AA-22 stands: the buttons are the producer's `sm` icon rung, no `h-*`
 * literal, so the coarse-pointer floor holds.
 */
defineProps<{
    /** The navigation landmark's name ("User list pagination"). */
    label: string;
    page: number;
    pageCount: number;
    hasPrev: boolean;
    hasNext: boolean;
    /** The rows-per-page choices, as the Select's string values. */
    sizes: readonly S[];
    /** The pluralised total ("3 users"). */
    totalLabel: string;
}>();

const pageSize = defineModel<S>("pageSize", { required: true });

const emit = defineEmits<{
    go: [page: number];
    prev: [];
    next: [];
}>();
</script>

<template>
    <nav
        class="admin-pager flex flex-wrap items-center justify-center gap-1 text-caption text-muted-foreground"
        :aria-label="label"
    >
        <Button emphasis="quiet" size="sm" icon-only :disabled="!hasPrev" aria-label="First page" @click="emit('go', 1)">
            <ChevronsLeft class="size-4" aria-hidden="true" />
        </Button>
        <Button emphasis="quiet" size="sm" icon-only :disabled="!hasPrev" aria-label="Previous page" @click="emit('prev')">
            <ChevronLeft class="size-4" aria-hidden="true" />
        </Button>
        <span class="px-1 tabular-nums">Page {{ page }} of {{ pageCount }}</span>
        <Button emphasis="quiet" size="sm" icon-only :disabled="!hasNext" aria-label="Next page" @click="emit('next')">
            <ChevronRight class="size-4" aria-hidden="true" />
        </Button>
        <Button emphasis="quiet" size="sm" icon-only :disabled="!hasNext" aria-label="Last page" @click="emit('go', pageCount)">
            <ChevronsRight class="size-4" aria-hidden="true" />
        </Button>
        <Select v-model="pageSize">
            <SelectTrigger class="ml-2 w-auto shrink-0" aria-label="Rows per page">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem v-for="n in sizes" :key="n" :value="n">{{ n }} per page</SelectItem>
            </SelectContent>
        </Select>
        <span class="ml-2 tabular-nums">{{ totalLabel }}</span>
    </nav>
</template>
