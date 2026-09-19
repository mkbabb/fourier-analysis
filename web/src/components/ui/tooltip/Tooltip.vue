<script setup lang="ts">
/**
 * The compact Tooltip shim, RE-PARAMETERISED — `X.F.W3 .e`, `fr-Tooltip
 * FR-TT-15` ⊕ `FR-TT-24`, against the contract published in `./index.ts`.
 * Read that file first: it is where the five knobs are decided and why, and
 * this file is only that decision implemented.
 *
 *   <Tooltip text="Hello" side="top">
 *       <button>Trigger</button>      <!-- exactly one FOCUSABLE element -->
 *   </Tooltip>
 *
 * A `#content` slot carries rich bodies.
 *
 * ── THE WRAPPER LAW, HONOURED (g10 / `fr-SliderControl R-6`) ──────────────
 * This shim's root is a FRAGMENT and stays one: `renderSlot` mints it
 * unconditionally, so `FR-TT-7`'s "make the shim single-root" arm is killed at
 * the mechanism, not declined. A fragment root, however, DROPS every
 * fallthrough attribute with a dev warn — `class` on `<Tooltip>` was strictly
 * worse than absent, because it looked bound and painted nothing.
 *
 * The law's operational form is therefore taken literally: **`inheritAttrs:
 * false` WITH a pre-placed `v-bind="$attrs"` on the intended host.** The host
 * is the CONTENT. It is the only element this shim owns — the trigger is the
 * consumer's own child through `as-child`, and attrs placed there would
 * silently contend with the attributes that child already carries.
 *
 * ⊘ The ANTI-RULE this law is paired with is about a DIFFERENT wrapper and is
 * not inherited here: `SliderControl` must NEVER be blanket-`inheritAttrs:
 * false`'d, because its `class` fallthrough is WANTED. The discriminator is
 * whether the wrapper has an intended host to pre-place the bind on. This one
 * does; a wrapper that does not, does not wrap.
 */
import { computed, onMounted, useTemplateRef } from "vue";
import {
    Tooltip as GlassTooltip,
    TooltipTrigger,
    TooltipContent,
} from "@mkbabb/glass-ui/tooltip";
import type { TooltipContentProps } from "@mkbabb/glass-ui/tooltip";

/**
 * The placement vocabulary, taken FROM the producer's published content props
 * rather than from a deep type path. `FloatingSide`/`FloatingAlign` are
 * exported only from `_shared/overlay`, which is an internal directory; the
 * same two unions are reachable through the surface this shim already imports,
 * so the shim depends on the seam it consumes and on nothing behind it.
 */
type TooltipSide = NonNullable<TooltipContentProps["side"]>;
type TooltipAlign = NonNullable<TooltipContentProps["align"]>;

defineOptions({ inheritAttrs: false });

const props = withDefaults(
    defineProps<{
        /** Plain-text body. Ignored when the `#content` slot is used. */
        text?: string;
        /**
         * Edge the content is placed on. The shim's default is `top` and it is
         * a DECLARED parameter, not a literal: 26 of the tree's 35 banked call
         * sites accept it, so it is the density default rather than an
         * accident (FR-TT-13).
         */
        side?: TooltipSide;
        /**
         * Cross-axis alignment. Forwarded only when the consumer passes it —
         * `undefined` resolves to the producer's own default, which is S-1's
         * conditional-forwarding law expressed in the type rather than in an
         * `if`.
         */
        align?: TooltipAlign;
        /**
         * Anchor gap in px. ONE declared default for the whole app; three
         * uncoordinated gaps (4/6/8) lived in a single dock before it. A site
         * that genuinely needs another gap DECLARES it here instead of
         * hand-rolling an anchor.
         *
         * ⊘ The producer ships no floating-offset token, so a number is
         * unavoidable at some consumer. That ask rides the SS-6 relay; no cell
         * in this wave re-tunes a producer constant (S-5).
         */
        sideOffset?: number;
        /**
         * THE MEASURE (FR-TT-3). `max-width` appears nowhere in the tooltip
         * chain at either pin and both discard
         * `--reka-tooltip-content-available-width`, so an unbounded body paints
         * a one-line ribbon across the viewport. Default `16rem` — the figure
         * the sibling `hover-popover` sheet bounds ITSELF with, in a sheet
         * whose docblock cites the tooltip register. Any CSS length.
         */
        measure?: string;
    }>(),
    { side: "top", sideOffset: 6, measure: "16rem" },
);

const triggerRef = useTemplateRef<{ $el?: unknown }>("trigger");

const contentStyle = computed(() => ({ "--app-tooltip-measure": props.measure }));

/**
 * THE CONTRACT GUARD (FR-TT-12), dev-only.
 *
 * `as-child` accepts a non-focusable child, a `display: none` child or a bare
 * SVG in silence: no warning, no tooltip, no keyboard path, and nothing in the
 * type system to catch it. The half that actually breaks keyboard access is
 * decidable from the mounted DOM, so it is MEASURED here; the "exactly one
 * element" half is not decidable without re-invoking the slot outside the
 * render function (which itself emits a dev warn), so it is stated in
 * `./index.ts` and in this file's usage block instead of half-guarded.
 *
 * This is a guard, never a fallback: it changes no behaviour and hides no
 * defect — it makes an invisible failure audible in development.
 */
if (import.meta.env.DEV) {
    onMounted(() => {
        const el = triggerRef.value?.$el;
        if (!(el instanceof HTMLElement)) {
            console.warn(
                "[Tooltip] the as-child target is not an HTML element; it cannot take focus, so this tooltip has no keyboard path.",
                el,
            );
            return;
        }
        if (el.tabIndex < 0) {
            console.warn(
                "[Tooltip] the as-child target is not focusable (tabIndex < 0), so this tooltip has no keyboard path. Give it a real control element or an explicit tabindex.",
                el,
            );
        }
    });
}
</script>

<template>
    <GlassTooltip>
        <TooltipTrigger ref="trigger" as-child>
            <slot />
        </TooltipTrigger>
        <!--
            The PRE-PLACED host for `$attrs`. Everything the consumer writes on
            `<Tooltip>` — `class` above all — lands here, on the surface it was
            always meant for, instead of being dropped by the fragment root.
        -->
        <TooltipContent
            v-bind="$attrs"
            class="app-tooltip-content"
            :side="side"
            :align="align"
            :side-offset="sideOffset"
            :collision-padding="8"
            :style="contentStyle"
        >
            <slot name="content">{{ text }}</slot>
        </TooltipContent>
    </GlassTooltip>
</template>

<style>
/*
   THE MEASURE'S FLOOR, and the reason it is unlayered-by-name rather than
   unlayered-by-accident.

   The content is PORTALED out of this component's subtree, so a scoped rule
   cannot reach it — that mechanism is correct and unchanged. What must not
   happen is the unlayered-scoped-beats-layered inversion this wave gates on
   (g16): an unlayered rule here would outrank glass-ui's own `@layer
   components` tooltip recipe wholesale. It is therefore declared inside
   `@layer glass-overrides`, the layer `index.html` orders LAST, so this bound
   wins by ORDER — a deliberate consumer override — and nothing else of the
   producer's recipe is disturbed.

   The default lives in the rule rather than only in the prop, so the measure
   is bounded even on a path where the inline custom property does not land.
*/
@layer glass-overrides {
    .app-tooltip-content {
        max-width: var(--app-tooltip-measure, 16rem);
    }
}
</style>
