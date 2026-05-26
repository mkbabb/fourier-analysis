<script setup lang="ts">
/**
 * Compact Tooltip shim — wraps the glass-ui decomposed tooltip primitives
 * (Tooltip + TooltipTrigger + TooltipContent) behind the same single-component
 * API that every consumer in this project already uses:
 *
 *   <Tooltip text="Hello" side="top">
 *       <button>Trigger</button>
 *   </Tooltip>
 *
 * Also supports a #content slot for rich tooltip bodies.
 */
import {
    Tooltip as GlassTooltip,
    TooltipTrigger,
    TooltipContent,
} from "@mkbabb/glass-ui";

defineProps<{
    text?: string;
    side?: "top" | "right" | "bottom" | "left";
}>();
</script>

<template>
    <GlassTooltip>
        <TooltipTrigger as-child>
            <slot />
        </TooltipTrigger>
        <TooltipContent
            :side="side ?? 'top'"
            :side-offset="6"
            :collision-padding="8"
        >
            <slot name="content">{{ text }}</slot>
        </TooltipContent>
    </GlassTooltip>
</template>
