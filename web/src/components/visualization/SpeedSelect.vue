<script setup lang="ts">
/**
 * X.F.W14U.vdock — UIA-F-9 (BROKEN) ⊕ F-82 ⊕ F-175: the playback speed is ONE
 * control, the menu's own idiom, wherever it is shown.
 *
 * WHAT THIS FILE WAS: a glass `Select` rendered twice — a bare, hand-stripped
 * trigger in the expanded dock from `sm` up, and an `.input-pill` trigger inside
 * the ⋮ menu below `sm`. At 390 the pill (154px) ran 24px past the 204px menu,
 * the opened listbox piled a second frosted layer over the menu and scrolled its
 * group sideways ("Easinε"), and speed wore a different control at each
 * breakpoint. A menu is never the parent of another floating list.
 *
 * NOW: the speed catalogue (`ANIMATION_SPEEDS`, the domain `lib/defaults.ts`
 * owns) is a labelled `DropdownMenuRadioGroup` — the sibling of `EasingPicker`,
 * one section idiom for every setting the menu holds. Choosing a rate keeps the
 * menu open (`select` is prevented), so rate and easing can be tried in turn.
 * The store's own setter still coerces every write into the catalogue.
 *
 * ⊘ The ONE shared animation pane (UIA-F-81: speed and easing leave the menu for
 * a pane beside the stage, one catalogue and one picker with /morph) is the
 * register's final form; its mount is outside this unit's bounds and is
 * escalated (F.W14U.vdock receipt). This section is the register's interim for
 * F-9 and moves with the picker when the pane lands.
 */
import { useId } from "vue";
import {
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
} from "@mkbabb/glass-ui/menu";
import { ANIMATION_SPEEDS, isAnimationSpeed } from "@/lib/defaults";
import { useAnimationStore } from "@/stores/animation";

const anim = useAnimationStore();
const speedLabelId = useId();

function selectSpeed(value: unknown) {
    if (isAnimationSpeed(value)) anim.speed = value;
}
</script>

<template>
    <DropdownMenuLabel :id="speedLabelId">Speed</DropdownMenuLabel>
    <DropdownMenuRadioGroup
        :model-value="anim.speed"
        :aria-labelledby="speedLabelId"
        @update:model-value="selectSpeed"
    >
        <DropdownMenuRadioItem
            v-for="rate in ANIMATION_SPEEDS"
            :key="rate"
            :value="rate"
            :text-value="`${rate}×`"
            class="speed-item"
            @select="(e: Event) => e.preventDefault()"
        >
            {{ rate }}&times;
        </DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
    <DropdownMenuSeparator />
</template>

<style scoped>
/* The rates read as numerals in the mono family, as the collapsed reading does. */
.speed-item {
    font-family: var(--font-mono);
}
</style>
