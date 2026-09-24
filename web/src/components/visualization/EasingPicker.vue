<script setup lang="ts">
import { useId } from "vue";
import { EasingCurve } from "@mkbabb/glass-ui/easing";
import {
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
} from "@mkbabb/glass-ui/menu";
import {
    ANIMATION_EASINGS,
    ANIMATION_EASING_NAMES,
    getEasingSVGPath,
    isAnimationEasingName,
} from "@/lib/easings";
import { useAnimationStore } from "@/stores/animation";

/**
 * X.F.W3 `.b` — THE EASING DISPOSITION, ROUTE 1 (COHESION §0x S-6a).
 *
 * `fr-EasingPicker D/D-1 + C/M-6` (BLOCKER) — six easing chips were bare glass
 * `<Button>`s wearing `role="menuitemradio"` + `aria-checked` BY HAND inside a
 * `role="menu"` popover. The ARIA was authored correctly and the CHASSIS was
 * absent, which is the whole defect: all four of Reka's reach mechanisms key on
 * `[data-reka-collection-item]`, an attribute only a collection item mints, so
 * arrows, Home/End and typeahead walked past six controls that *told* a screen
 * reader they were a radio set. The Tab swallow and `handleMountAutoFocus` did
 * the rest. The cure is the chassis the primitive already ships —
 * `DropdownMenuRadioGroup` / `RadioItem` / `Label` — never a hand-rolled one.
 *
 * CHASSIS LOCK (Toggle.js:68, and S-6a by name): `ToggleChip` under
 * `role="menuitemradio"` double-exposes state (`aria-pressed` AND
 * `aria-checked` for one fact), so it is sound as STYLING and never as chassis.
 * The ToggleChip route is REFUSED; nothing here re-styles a menu row into a chip.
 *
 * The three booked complications, each discharged rather than carried:
 *   · the indicator dot — the producer's `RadioItem` renders its own
 *     `ItemIndicator`, so the selected state is drawn by the chassis and this
 *     file mints no `.is-active` spelling at all;
 *   · the arrow map — Reka's menu navigation is ONE-DIMENSIONAL, and the old
 *     3-column grid made ArrowDown mean "one to the right". The list is a single
 *     COLUMN now, so the keyboard order and the visual order are the same order
 *     (the spec's own first option, and the one that needs no 2-D handling);
 *   · `./dropdown-menu` → `./menu` — the subpath moved at glass-ui 8.0.0 and the
 *     import below is the 8.0.0 spelling.
 *
 * `TOKEN` / `CCOLOR` / `CARRY-1.4.3` / `INVERT` die WITH the scoped block that
 * carried them. The in-tree `--easing-accent: hsl(248 88% 71%)` had NO scheme
 * arm and painted a 9px label at 3.40:1 light / 3.67:1 washed — under the 1.4.3
 * floor in both schemes, with an accent ceiling of 3.60:1 that no retune could
 * lift. Both arms now come from the producer's own landing chain:
 * `<EasingCurve>` sets `--easing-curve-accent: var(--motion-accent,
 * var(--viz-legendre))` on its wrapper and strokes `currentColor`, and
 * `--viz-legendre` is defined with BOTH arms at the adopted pin. The chip label
 * is menu-row text in the popover's own foreground; the selection is the
 * indicator dot. Nothing in this file paints under a floor, because nothing in
 * this file paints.
 *
 * `BARREL` — the pure catalogue and the pure path builder are imported from
 * `@/lib/easings`, which owns them, not through the animation store's compat
 * re-export. The store is imported for the STATE it owns and for nothing else.
 */
const anim = useAnimationStore();

const easingLabelId = useId();

/**
 * `AC-L-11 + M-10`'s posture, applied at the menu seam: the radio group's model
 * is a producer `SelectionValue` (an open scalar), and the store's `easing` is a
 * closed six-key union. The catalogue's own guard narrows it, so an off-catalogue
 * value is unrepresentable downstream instead of merely unlikely — the same cure
 * `coerceAnimationEasingName` takes at the persistence seam.
 */
function selectEasing(value: unknown) {
    if (isAnimationEasingName(value)) {
        anim.easing = value;
    }
}
</script>

<template>
    <DropdownMenuLabel :id="easingLabelId">Easing</DropdownMenuLabel>
    <DropdownMenuRadioGroup
        :model-value="anim.easing"
        :aria-labelledby="easingLabelId"
        @update:model-value="selectEasing"
    >
        <DropdownMenuRadioItem
            v-for="name in ANIMATION_EASING_NAMES"
            :key="name"
            :value="name"
            :text-value="ANIMATION_EASINGS[name].label"
            class="gap-2"
            @select="(e: Event) => e.preventDefault()"
        >
            <!-- X.F.W14U.vdock — UIA-F-240: choosing an easing keeps the menu
                 open (the speed section beside it does the same), so a curve can
                 be compared against the next without reopening the menu. -->
            <!-- `text-value` is stated rather than inferred: Reka's typeahead
                 reads an item's text content, and the plot contributes the "0"
                 and "1" axis captions the producer draws in HTML. Left to
                 inference, typing "s" for Sine would be matching against "01".

                 The plot is DECORATIVE — the row already carries the same name
                 as visible text and as `text-value`, so an announced
                 `role="img"` beside it would say it a second time. -->
            <EasingCurve
                :strokes="[{ d: getEasingSVGPath(name) }]"
                class="w-6 shrink-0"
                aria-hidden="true"
            />
            <span>{{ ANIMATION_EASINGS[name].label }}</span>
        </DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
    <DropdownMenuSeparator />
</template>
