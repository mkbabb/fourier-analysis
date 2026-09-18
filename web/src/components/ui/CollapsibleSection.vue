<script setup lang="ts">
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@mkbabb/glass-ui'
import { ref, watch } from 'vue'
import { ChevronRight } from '@lucide/vue'

const props = withDefaults(defineProps<{
    title: string;
    subtitle?: string;
    defaultOpen?: boolean;
}>(), {
    defaultOpen: true,
})

const open = ref(props.defaultOpen)
const rootEl = ref<InstanceType<typeof Collapsible> | null>(null)

watch(open, (isOpen) => {
    if (isOpen) {
        // Scroll into view after the open animation completes
        setTimeout(() => {
            const el = rootEl.value?.$el ?? rootEl.value;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const scrollParent = el.closest('.overflow-y-auto, .overflow-auto') ?? el.parentElement;
            if (scrollParent && rect.bottom > scrollParent.getBoundingClientRect().bottom) {
                el.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }, 250)
    }
})
</script>

<template>
  <Collapsible ref="rootEl" v-model:open="open" class="collapsible-section">
    <div class="flex w-full items-center">
      <CollapsibleTrigger class="collapsible-trigger group flex flex-1 items-center gap-2 py-1.5 cursor-pointer select-none">
        <ChevronRight class="h-4 w-4 text-muted-foreground transition-transform duration-200" :class="{ 'rotate-90': open }" />
        <span>
          <span class="cm-serif text-sm font-semibold tracking-tight">{{ title }}</span>
          <span v-if="subtitle" class="ml-1.5 text-xs font-normal text-muted-foreground">— {{ subtitle }}</span>
        </span>
      </CollapsibleTrigger>
      <slot name="actions" />
    </div>
    <CollapsibleContent class="collapsible-content">
      <div class="pb-1">
        <slot />
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>

<style scoped>
.collapsible-content {
    overflow: hidden;
}
/* F.W1 / B-1 / G10 — the two `[data-state]` `animation` shorthands and their
   `prefers-reduced-motion` arm are DELETED, not rewritten. A.W3.d adopted the
   canonical `collapsible-open` / `collapsible-close` keyframes from glass-ui's
   own sheet; glass-ui ≥7 ships neither, so an unlayered scoped shorthand naming
   a keyframe that does not exist leaves reka's `usePresence` waiting forever on
   an `animationend` that can never fire — every disclosure surface stops
   closing. The producer carries its own presence motion at the adopted pin.
   `overflow: hidden` above STAYS: it names no keyframe, and it is the clipping
   the collapsible height transition needs. */
</style>
