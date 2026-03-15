<script setup lang="ts">
import { TooltipRoot, TooltipTrigger, TooltipContent, TooltipPortal } from 'reka-ui'

defineProps<{
    text?: string
    side?: 'top' | 'right' | 'bottom' | 'left'
}>()
</script>

<template>
    <TooltipRoot>
        <TooltipTrigger as-child>
            <slot />
        </TooltipTrigger>
        <TooltipPortal>
            <TooltipContent
                class="tooltip-content"
                :side="side ?? 'top'"
                :side-offset="6"
                :collision-padding="8"
            >
                <slot name="content">{{ text }}</slot>
            </TooltipContent>
        </TooltipPortal>
    </TooltipRoot>
</template>

<style>
@reference "tailwindcss";
/* Global (not scoped) so it applies inside the portal */
.tooltip-content {
    z-index: 100;
    max-width: 280px;
    padding: 0.375rem 0.625rem;
    @apply text-sm;
    font-weight: 500;
    line-height: 1.4;
    color: hsl(var(--popover-foreground));
    background: hsl(var(--popover));
    border: 1.5px solid hsl(var(--border));
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    animation: tooltip-in 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    user-select: none;
}

.dark .tooltip-content {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

@keyframes tooltip-in {
    from {
        opacity: 0;
        transform: scale(0.96);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
