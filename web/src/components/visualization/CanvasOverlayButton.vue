<script setup lang="ts">
/**
 * A.W3.b — canvas-overlay icon-button wrapper.
 *
 * Forwards every attr/listener to `<Button variant="glass" size="icon">` and
 * surfaces the `active` flag as both `aria-pressed` and the legacy
 * `.is-active` class, matching the glass-ui canon for toggle buttons.
 */
import { Button } from "@mkbabb/glass-ui/button";

defineProps<{
    active?: boolean;
}>();
</script>

<template>
    <Button
        variant="glass"
        size="icon"
        :aria-pressed="active"
        :class="{ 'is-active': active }"
    >
        <slot />
    </Button>
</template>
