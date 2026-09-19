<script setup lang="ts">
/**
 * X.F.W3 `.d` — `fr-CollapsibleSection i-4`, THE COLLAPSIBLE-VS-ACCORDION
 * DECISION. The row is INFO-over-MAJOR: its product is a ruling, and the ruling
 * is RECORDED HERE, at the wrapper it governs, rather than executed as a silent
 * re-chassis of three consumers.
 *
 * THE MEASUREMENT THE DECISION RESTS ON, re-taken at the adopted 8.0.0 pin:
 * `AccordionTrigger.vue` emits `<RekaAccordionHeader as="h3">`, a hover arm and
 * a 44px floor; this wrapper emits ZERO heading semantics, no hover at either
 * pin, a ~32px trigger, and does not forward `unmountOnHide`. Two disclosure
 * grammars, one of which is the producer’s titled-section answer.
 *
 * THE RULING, and it is ONE decision in the KISS reading (`M-1` + `M-5` + `m-9`
 * collapse into it): FOR A TITLED SECTION THE ANSWER IS THE PRODUCER’S
 * DISCLOSURE, NOT THIS WRAPPER — and in this tree that is `ConfiguratorLayer`,
 * which is what the visualization stack already mounts and what this wave moved
 * `ContourPreview` and `EqCoefficientsPanel` onto. `K-6` is why the wrapper is
 * never the destination: it is banked-defective across exactly the axes an
 * adoption would buy (`B-1`’s hang at the uplift target, `M-2`’s
 * `unmountOnHide` teardown, `M-3`’s ungated `scrollIntoView`, `M-6`’s absent
 * controlled open). New consumers are never routed through it — the standing
 * law this wave applied at `GalleryDraftsSection`.
 *
 * WHAT IS EXECUTED HERE AND WHAT IS NOT. `m-15`’s one-token cure IS executed
 * below, because it is a cure and not a chassis choice. The remaining consumer
 * migration is NOT executed by this unit: `FunctionInput.vue` is the sole
 * survivor and its re-chassis is a design change to the equation route’s left
 * column, which belongs with that column’s owner, not smuggled into a
 * shadow-retirement wave. Named as a residual with its holder.
 *
 * ⊘ `m-7` (ContourSettings’ fork is unavoidable given this surface — the cure
 * is a `#title` slot + `variant`, not discipline), `m-16` (`overflow: hidden`
 * is permanent and clips the producer’s outward focus ring) and `M-5`’s
 * producer question (“is the bare Collapsible trigger MEANT to ship
 * affordance-free? cite the Accordion asymmetry”) ride out as relay notes.
 * `B-1`’s LC MAJOR stands as the uplift-conditional qualifier on the BLOCKER.
 */
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@mkbabb/glass-ui/collapsible'
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

/**
 * `m-15`— THE ONE-TOKEN CURE, executed: `block: 'nearest'` deletes the probe,
 * the predicate, BOTH forced reflows and the dead arm, and `M-4` dies with it.
 *
 * What was here: a 250ms `setTimeout` that read `getBoundingClientRect()` on the
 * section AND on a hand-resolved scroll parent — two synchronous layout flushes
 * — to decide whether to call `scrollIntoView({ block: 'end' })`. The browser
 * already answers that question: `block: 'nearest'` scrolls only when the
 * element is not already in view, and does nothing when it is. The predicate was
 * a reimplementation of the behaviour it was guarding.
 *
 * `M-4` was the timer’s own defect — an uncleared 250ms handle against an
 * element the disclosure can detach — and it dies because the timer dies. What
 * remains is a single `requestAnimationFrame`, which lands after the open frame
 * without inventing a duration, and whose only act is a scroll request the UA
 * may decline.
 *
 * `M-3`’s reduced-motion arm is honoured on the producer’s own register rather
 * than by a second in-tree copy of the JS idiom: `scroll-behavior: smooth` in a
 * `behavior: 'auto'` call defers to the user’s preference through the platform.
 */
watch(open, (isOpen) => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
        const el = (rootEl.value?.$el ?? rootEl.value) as HTMLElement | null;
        el?.scrollIntoView({ block: 'nearest' });
    });
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
