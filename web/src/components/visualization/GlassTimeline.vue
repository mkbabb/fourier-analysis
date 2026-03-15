<script setup lang="ts">
import { ref } from "vue";
import { useAnimationStore } from "@/stores/animation";

defineProps<{
    label: string;
}>();

const anim = useAnimationStore();

/* ── Glass timeline slider ────────────────────────────── */
const trackRef = ref<HTMLElement>();
const scrubbing = ref(false);

function tFromPointer(e: PointerEvent): number {
    const rect = trackRef.value!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
}

function onTrackDown(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    scrubbing.value = true;
    anim.startScrub();
    anim.seek(tFromPointer(e));
}

function onTrackMove(e: PointerEvent) {
    if (!scrubbing.value) return;
    anim.seek(tFromPointer(e));
}

function onTrackUp() {
    scrubbing.value = false;
    anim.endScrub();
}

function onTrackKeydown(e: KeyboardEvent) {
    const step = e.shiftKey ? 0.1 : 0.01;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        anim.seek(Math.min(1, anim.t + step));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        anim.seek(Math.max(0, anim.t - step));
    }
}
</script>

<template>
    <div class="timeline-row">
        <div class="timeline-caret" :style="{ left: (anim.t * 100) + '%' }">
            <span class="caret-value fira-code">{{ label }}</span>
        </div>
        <div
            ref="trackRef"
            class="glass-track"
            role="slider"
            tabindex="0"
            :aria-valuenow="anim.t"
            aria-valuemin="0"
            aria-valuemax="1"
            aria-label="Timeline"
            @pointerdown="onTrackDown"
            @pointermove="onTrackMove"
            @pointerup="onTrackUp"
            @pointercancel="onTrackUp"
            @keydown="onTrackKeydown"
        >
            <div class="glass-fill" :style="{ width: (anim.t * 100) + '%' }" />
            <div class="glass-thumb" :style="{ left: (anim.t * 100) + '%' }" />
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";
.timeline-row {
    flex: 1 1 0;
    min-width: 0;
    padding: 0 0.25rem;
    position: relative;
    display: flex;
    align-items: center;
}

.timeline-caret {
    position: absolute;
    bottom: calc(100% + 6px);
    transform: translateX(-50%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: var(--z-popover);
    user-select: none;
    -webkit-user-select: none;
}

.timeline-row:hover .timeline-caret,
.timeline-row:has(.glass-track:active) .timeline-caret {
    opacity: 1;
}

.caret-value {
    display: block;
    padding: 0.125rem 0.375rem;
    @apply text-base;
    font-weight: 500;
    color: hsl(var(--popover-foreground));
    background: hsl(var(--popover));
    border: 1px solid hsl(var(--border));
    border-radius: 0.25rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
}

.glass-track {
    position: relative;
    width: 100%;
    height: 24px;
    border-radius: 12px;
    background: hsl(var(--foreground) / 0.05);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    cursor: pointer;
    touch-action: none;
    overflow: hidden;
    transition: background 0.2s;
    outline: none;
}

.glass-track:hover,
.glass-track:focus-visible {
    background: hsl(var(--foreground) / 0.08);
}

.glass-track:focus-visible {
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.4);
}

.glass-fill {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    background: hsl(var(--foreground) / 0.07);
    border-radius: 12px;
    pointer-events: none;
}

.glass-thumb {
    position: absolute;
    top: 50%;
    transform: translate(calc(-50% - 3px), -50%);
    width: 6px;
    height: 16px;
    border-radius: 2px;
    background: hsl(var(--foreground) / 0.25);
    opacity: 0;
    pointer-events: none;
    transition: all 0.15s ease;
}

.glass-track:hover .glass-thumb {
    opacity: 1;
    width: 8px;
    height: 18px;
    background: hsl(var(--foreground) / 0.4);
}
</style>
