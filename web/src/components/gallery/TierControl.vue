<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from "@mkbabb/glass-ui/toggle-group";
import { Bookmark, Circle, Crown } from "@lucide/vue";
import type { GalleryTier } from "@/lib/types";

/**
 * X.F.W14V.au4 — A2-FO-L1-10: the tier setter, written once — glass
 * ToggleGroup, `type="single"`, the three values of one enum. The card drew two
 * independent toggles (Crown, Bookmark) and the modal a ToggleGroup; both now
 * mount this. `compact` is the icon-only arm (the card's), each item named.
 * The group never emits a deselect: a single group's second press on the
 * active item would clear it, and a tier is never empty.
 */
const props = withDefaults(
    defineProps<{ tier?: GalleryTier | null; compact?: boolean; disabled?: boolean }>(),
    { tier: "normal", compact: false, disabled: false },
);

const emit = defineEmits<{ set: [tier: GalleryTier] }>();

const OPTIONS = [
    { value: "normal", label: "Normal", icon: Circle },
    { value: "featured", label: "Featured", icon: Crown },
    { value: "saved", label: "Saved", icon: Bookmark },
] as const;

function onChange(next: unknown) {
    if (typeof next !== "string" || next === (props.tier ?? "normal")) return;
    emit("set", next as GalleryTier);
}
</script>

<template>
    <ToggleGroup
        data-slot="tier-control"
        type="single"
        size="sm"
        aria-label="Tier"
        :disabled="disabled"
        :model-value="tier ?? 'normal'"
        @update:model-value="onChange"
    >
        <ToggleGroupItem
            v-for="o in OPTIONS"
            :key="o.value"
            :value="o.value"
            :aria-label="compact ? o.label : undefined"
            :title="compact ? o.label : undefined"
            :data-tier="o.value"
        >
            <component :is="o.icon" :size="14" aria-hidden="true" />
            <span v-if="!compact">{{ o.label }}</span>
        </ToggleGroupItem>
    </ToggleGroup>
</template>

<style scoped>
[data-tier="featured"][data-state="on"] { color: var(--tier-featured); }
[data-tier="saved"][data-state="on"] { color: var(--tier-saved); }
</style>
