<script setup lang="ts">
import { ref, computed } from "vue";
import type { WorkspaceDraft } from "@/lib/types";
import { thumbnailUrl } from "@/lib/api";
import { normalizeBasisKey } from "@/lib/basis";
import { useRelativeTime } from "@/lib/time";
import { basisDisplay } from "../lib/basis-display";
import { ChevronDown, Upload } from "@lucide/vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Metric } from "@mkbabb/glass-ui/metric";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@mkbabb/glass-ui/collapsible";

const props = defineProps<{
    drafts: WorkspaceDraft[];
    publishing: boolean;
}>();

const emit = defineEmits<{
    publish: [draft: WorkspaceDraft];
    open: [imageSlug: string];
}>();

/**
 * X.F.W3 `.d` — `fr-GalleryDraftsSection M-2`: "THE CURE IS THE PRIMITIVE,
 * NEVER THE WRAPPER."
 *
 * The state is spelled OPEN rather than COLLAPSED because that is the
 * primitive's own axis (`v-model:open`), and a disclosure whose local boolean
 * runs opposite to its chassis is how the two drift apart again.
 */
const open = ref(true);

const sortedDrafts = computed(() =>
    props.drafts
        .slice()
        .sort((a, b) => (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? "")),
);

/**
 * X.F.W3 repair 1 (g15, legs 1 and 2) — the two domains this file re-authored
 * retire onto the units the wave created for them.
 *
 * The local relative-time helper was one of FIVE divergent copies in two
 * dialects, and `lib/time.ts` is now their one home. This copy's
 * dialect disagreed with the admin one about the sub-minute floor, so the same
 * three-second-old row read "just now" here and "0m ago" in the panel beside
 * it — and like every copy it sampled `Date.now()` DURING RENDER, so the string
 * froze at whatever it said when the component last patched, on a surface whose
 * whole content is "how long ago". `useRelativeTime` is the LIST form of the
 * one clock: a `v-for` cannot call a composable per row, so the shared ticking
 * clock is taken once here and applied per row. It also brings the cap, the
 * negative guard and the NaN guard this copy had none of.
 */
const relativeTimeOf = useRelativeTime();

function getBasisLabel(item: WorkspaceDraft): string {
    const bases = item.animationSettings?.active_bases ?? [];
    if (bases.length === 0) return "";
    return bases
        .map((b) => basisDisplay[normalizeBasisKey(b)]?.label ?? b)
        .join(", ");
}
</script>

<template>
    <!-- X.F.W3 `.d` — `fr-GalleryDraftsSection M-2`, and the cure is stated as
         the row states it: THE CURE IS THE PRIMITIVE, NEVER THE WRAPPER.

         What was here: a hand-rolled disclosure — a `<Button>` toggling a local
         boolean over a bare `v-if`, with a header span BYTE-IDENTICAL to
         `ui/CollapsibleSection.vue:39` — while `./collapsible` is exported at
         the pin and ships the whole contract this hand-roll skipped:
         `aria-expanded`, `aria-controls`, the `data-state` the chevron can key
         on, and a body that is addressable by the attribute it announces.

         THE ROUTE IS THE PRIMITIVE AND NOT THE LOCAL WRAPPER, and `K-6` is why:
         `ui/CollapsibleSection.vue` is banked-defective across exactly the axes
         adopting it would buy — the `B-1` hang at the uplift target, `M-2`'s
         `unmountOnHide` teardown, `M-3`'s ungated `scrollIntoView`, `M-6`'s
         absent controlled open. A new consumer is never routed through it.

         `v-if` becomes `CollapsibleContent`: the rows still leave the DOM when
         closed (reka's `Presence` unmounts), so nothing about this list's cost
         changes — what changes is that the trigger and the body are now WIRED
         to each other instead of merely adjacent. -->
    <!-- X.F.W14.u — UIA-F-48 (consumer half): the gutter is the wrapper's
         padding. `mx-4` on the Collapsible, whose producer disclosure sets
         `inline-size: 100%`, pushed the card 16 px past the column (right
         border, chevron and count clipped). The producer's `inline-size: 100%`
         on a block is the glass half, routed under O-59. -->
    <div v-if="sortedDrafts.length > 0" class="px-4">
        <Collapsible
            v-model:open="open"
            class="rounded-lg border-[1.5px] border-foreground/8 overflow-hidden"
        >
            <CollapsibleTrigger as-child>
                <Button
                    emphasis="quiet"
                    class="drafts-header w-full justify-start gap-1.5 py-2 px-3 bg-muted/30 text-foreground"
                >
                    <span class="font-serif-math text-sm font-semibold tracking-tight">My Drafts</span>
                    <Metric :value="sortedDrafts.length" size="sm" />
                    <ChevronDown
                        :size="16"
                        class="ml-auto text-muted-foreground transition-transform duration-200 ease-in-out"
                        :class="{ '-rotate-90': !open }"
                    />
                </Button>
            </CollapsibleTrigger>

            <CollapsibleContent class="flex flex-col">
                <div
                    v-for="draft in sortedDrafts"
                    :key="draft.imageSlug"
                    class="draft-item flex items-center gap-2.5 py-2 px-3 border-t border-foreground/5 transition-colors duration-150 hover:bg-foreground/[0.02]"
                >
                    <div
                        class="w-12 h-12 rounded-md overflow-hidden shrink-0 cursor-pointer bg-muted"
                        @click="emit('open', draft.imageSlug)"
                    >
                        <img
                            :src="thumbnailUrl(draft.imageSlug)"
                            :alt="draft.imageSlug"
                            class="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                    <div class="flex-1 min-w-0 cursor-pointer flex flex-col gap-0.5" @click="emit('open', draft.imageSlug)">
                        <span class="text-sm text-foreground truncate fira-code">{{ draft.imageSlug }}</span>
                        <span class="text-sm text-muted-foreground">
                            {{ getBasisLabel(draft) }}
                            <span v-if="getBasisLabel(draft)"> &middot; </span>
                            <time
                                :datetime="relativeTimeOf(draft.lastOpenedAt).datetime"
                                :title="relativeTimeOf(draft.lastOpenedAt).absolute"
                            >{{ relativeTimeOf(draft.lastOpenedAt).text }}</time>
                        </span>
                    </div>
                    <Button
                        emphasis="secondary"
                        size="sm"
                        class="gap-1 text-muted-foreground shrink-0"
                        :disabled="publishing"
                        @click="emit('publish', draft)"
                    >
                        <Upload :size="14" />
                        Publish
                    </Button>
                </div>
            </CollapsibleContent>
        </Collapsible>
    </div>
</template>
