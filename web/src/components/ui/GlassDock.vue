<script setup lang="ts">
import { ref, onUnmounted } from "vue";

const props = withDefaults(
    defineProps<{
        /** Time in ms before the dock collapses after losing hover/focus */
        collapseDelay?: number;
        /** Start collapsed? */
        startCollapsed?: boolean;
        /** When true, expanded dock fits its content instead of stretching to max-width */
        fitContent?: boolean;
    }>(),
    {
        collapseDelay: 1800,
        startCollapsed: true,
        fitContent: false,
    },
);

const expanded = ref(!props.startCollapsed);
let collapseTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
    if (collapseTimer) {
        clearTimeout(collapseTimer);
        collapseTimer = null;
    }
}

function scheduleCollapse() {
    clearTimer();
    collapseTimer = setTimeout(() => {
        expanded.value = false;
    }, props.collapseDelay);
}

function onEnter() {
    clearTimer();
    expanded.value = true;
}

function onLeave() {
    scheduleCollapse();
}

function onClickSummary() {
    clearTimer();
    expanded.value = true;
    scheduleCollapse();
}

defineExpose({ expanded, expand: onEnter, collapse: () => { expanded.value = false; } });
onUnmounted(clearTimer);
</script>

<template>
    <div
        class="glass-dock"
        :class="{ expanded, collapsed: !expanded, 'fit-content': fitContent }"
        @mouseenter="onEnter"
        @mouseleave="onLeave"
        @focusin="onEnter"
        @focusout="onLeave"
    >
        <!-- Full-width expanded content -->
        <div v-show="expanded" class="dock-layer dock-layer--full">
            <slot />
        </div>
        <!-- Compact-width collapsed summary -->
        <div v-show="!expanded" class="dock-layer dock-layer--summary" @click="onClickSummary">
            <slot name="collapsed" />
        </div>
    </div>
</template>

<style scoped>
.glass-dock {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 0.875rem;
    border-radius: 9999px;
    background: hsl(var(--card) / 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid hsl(var(--border) / 0.5);
    box-shadow: 0 4px 16px hsl(var(--foreground) / 0.08);
    overflow: visible;
    white-space: nowrap;
    transition:
        width 0.4s cubic-bezier(0.22, 1.6, 0.36, 1),
        max-width 0.4s cubic-bezier(0.22, 1.6, 0.36, 1),
        padding 0.25s cubic-bezier(0.22, 1.6, 0.36, 1),
        box-shadow 0.2s ease,
        transform 0.25s cubic-bezier(0.22, 1.6, 0.36, 1);
}

/* fit-content: skip width/max-width animation since auto→auto can't be animated */
.glass-dock.fit-content {
    transition:
        padding 0.25s cubic-bezier(0.22, 1.6, 0.36, 1),
        box-shadow 0.2s ease,
        transform 0.25s cubic-bezier(0.22, 1.6, 0.36, 1);
    will-change: transform;
}

/* ── Expanded: stretch to fill (default) ── */
.glass-dock.expanded {
    width: min(960px, calc(100vw - 1rem));
    max-width: min(960px, calc(100vw - 1rem));
}

/* ── Expanded fit-content: shrink-wrap around content ── */
.glass-dock.expanded.fit-content {
    width: auto;
    max-width: calc(100vw - 1rem);
}

/* ── Collapsed: prominent pill that's always visible ── */
.glass-dock.collapsed {
    width: auto;
    min-width: 3rem;
    max-width: 260px;
    cursor: pointer;
    padding: 0.5rem 1rem;
    background: hsl(var(--card) / 0.92);
    border-color: hsl(var(--border) / 0.7);
    box-shadow:
        0 2px 8px hsl(var(--foreground) / 0.12),
        0 0 0 1px hsl(var(--foreground) / 0.06);
}

.glass-dock.collapsed:hover {
    background: hsl(var(--card) / 0.96);
    border-color: hsl(var(--border));
    box-shadow:
        0 4px 20px hsl(var(--foreground) / 0.18),
        0 0 0 1px hsl(var(--foreground) / 0.1);
    transform: scale(1.03);
}

.dock-layer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 2.5rem;
}

.dock-layer--full {
    width: 100%;
    overflow: visible;
}

.dock-layer--summary {
    gap: 0.5rem;
}
</style>
