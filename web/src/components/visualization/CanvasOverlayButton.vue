<script setup lang="ts">
defineProps<{
    position: 'edit' | 'expand';
    active?: boolean;
}>();
</script>

<template>
    <button
        class="overlay-btn"
        :class="[
            position === 'edit' ? 'right-[3.25rem]' : 'right-2',
            { 'is-active': active },
        ]"
    >
        <slot />
    </button>
</template>

<style scoped>
.overlay-btn {
    position: absolute;
    top: 0.5rem;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    border: 1.5px solid hsl(var(--foreground) / 0.1);
    background: hsl(var(--background) / 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: hsl(var(--muted-foreground));
    cursor: pointer;
    transition:
        background 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease,
        transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.overlay-btn:hover {
    background: hsl(var(--background) / 0.85);
    border-color: hsl(var(--foreground) / 0.2);
    color: hsl(var(--foreground));
    transform: scale(1.08);
}

.overlay-btn:active {
    transform: scale(0.95);
}

.overlay-btn.is-active {
    background: hsl(var(--foreground) / 0.1);
    border-color: hsl(var(--foreground) / 0.25);
    color: hsl(var(--foreground));
    transform: scale(1.1);
}
</style>
