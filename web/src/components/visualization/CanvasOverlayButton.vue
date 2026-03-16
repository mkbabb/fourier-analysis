<script setup lang="ts">
defineProps<{
    position: 'edit' | 'expand' | 'equation';
    active?: boolean;
}>();
</script>

<template>
    <button
        class="glass-btn overlay-pos"
        :class="[
            position === 'edit' ? 'right-[3.25rem]' : position === 'equation' ? 'right-[5.5rem]' : 'right-2',
            { 'is-active': active },
        ]"
    >
        <slot />
    </button>
</template>

<style scoped>
.overlay-pos {
    position: absolute;
    top: 0.5rem;
    z-index: 20;
}
</style>
