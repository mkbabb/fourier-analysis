<script setup lang="ts">
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@mkbabb/glass-ui'
import { ref, watch } from 'vue'
import { ChevronRight } from 'lucide-vue-next'

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
/* A.W3.d — `collapsible-open` / `collapsible-close` are canonical glass-ui
   animations (see `@mkbabb/glass-ui/styles/animations.css`); the consumer-side
   shadow rules have been excised. Substrate keyframes resolve via global cascade. */
.collapsible-content[data-state="open"] {
    animation: collapsible-open 0.2s var(--ease-out);
}
.collapsible-content[data-state="closed"] {
    animation: collapsible-close 0.2s var(--ease-out);
}
@media (prefers-reduced-motion: reduce) {
    .collapsible-content[data-state="open"],
    .collapsible-content[data-state="closed"] {
        animation: none;
    }
}
</style>
