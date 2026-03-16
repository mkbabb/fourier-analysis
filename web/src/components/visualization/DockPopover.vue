<script setup lang="ts">
/**
 * Compact popover that expands from a dock button.
 * Stays open while mouse is inside. Click to toggle.
 * Integrates with parent GlassDock via inject("dockKeepOpen"/"dockRelease"/"dockExpanded").
 */
import { ref, watch, inject, nextTick, onUnmounted } from "vue";
import type { Ref } from "vue";

const props = withDefaults(
    defineProps<{
        direction?: "up" | "down";
        collapseDelay?: number;
    }>(),
    { direction: "up", collapseDelay: 1200 },
);

const expanded = ref(false);
let collapseTimer: ReturnType<typeof setTimeout> | null = null;
let removeClickAway: (() => void) | null = null;

// Injected from parent GlassDock (via useDockState)
const dockKeepOpen = inject<(() => void) | undefined>("dockKeepOpen", undefined);
const dockRelease = inject<(() => void) | undefined>("dockRelease", undefined);
const dockExpanded = inject<Ref<boolean> | undefined>("dockExpanded", undefined);

function clearTimer() {
    if (collapseTimer) {
        clearTimeout(collapseTimer);
        collapseTimer = null;
    }
}

function close() {
    clearTimer();
    expanded.value = false;
}

function onEnter() {
    // Don't open popover if parent dock is collapsed
    if (dockExpanded && !dockExpanded.value) return;
    clearTimer();
    expanded.value = true;
}

function scheduleCollapse(delay: number) {
    clearTimer();
    collapseTimer = setTimeout(() => {
        expanded.value = false;
    }, delay);
}

function toggle() {
    expanded.value ? scheduleCollapse(0) : onEnter();
}

const popoverRoot = ref<HTMLElement | null>(null);

watch(expanded, (isOpen) => {
    if (isOpen) {
        // Hold parent dock open while popover is expanded
        dockKeepOpen?.();

        // Defer click-away attachment so the opening click doesn't trigger close
        nextTick(() => {
            const handler = (e: PointerEvent) => {
                const root = popoverRoot.value;
                if (!root || root.contains(e.target as Node)) return;
                close();
            };
            document.addEventListener("pointerdown", handler, true);
            removeClickAway = () => {
                document.removeEventListener("pointerdown", handler, true);
                removeClickAway = null;
            };
        });
    } else {
        // Release parent dock hold
        dockRelease?.();
        removeClickAway?.();
    }
});

// When parent dock collapses, force-close this popover
if (dockExpanded) {
    watch(dockExpanded, (dockOpen) => {
        if (!dockOpen && expanded.value) {
            close();
        }
    });
}

onUnmounted(() => {
    clearTimer();
    removeClickAway?.();
    // Release hold if still active
    if (expanded.value) {
        dockRelease?.();
    }
});

defineExpose({ expanded, expand: onEnter, collapse: close });
</script>

<template>
    <div
        ref="popoverRoot"
        class="dock-popover"
        :class="{ expanded, ['dir-' + direction]: true }"
        @mouseenter="onEnter"
        @mouseleave="scheduleCollapse(collapseDelay)"
    >
        <button class="popover-trigger dock-icon-btn" @click.stop="toggle">
            <slot name="trigger" />
        </button>
        <Transition name="pop">
            <div v-if="expanded" class="popover-panel"
                @click.stop @mousedown.stop @pointerdown.stop>
                <slot />
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.dock-popover {
    position: relative;
    display: flex;
    align-items: center;
    flex-shrink: 0;
}
.popover-trigger {
    z-index: 2;
    position: relative;
}

.popover-panel {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.125rem;
    padding: 0.25rem;
    z-index: var(--z-popover);
    pointer-events: auto;

    background: hsl(var(--card) / 0.95);
    backdrop-filter: blur(16px) saturate(1.3);
    -webkit-backdrop-filter: blur(16px) saturate(1.3);
    border: 1px solid hsl(var(--border) / 0.6);
    border-radius: 1rem;
    box-shadow:
        0 4px 20px hsl(var(--foreground) / 0.12),
        0 0 0 0.5px hsl(var(--foreground) / 0.05);
}

.dir-up .popover-panel {
    bottom: calc(100% + 0.375rem);
    left: 50%;
    transform: translateX(-50%);
}
.dir-down .popover-panel {
    top: calc(100% + 0.375rem);
    left: 50%;
    transform: translateX(-50%);
}

/* ── Spring transitions ── */
.pop-enter-active {
    transition: opacity 0.15s ease, transform 0.3s cubic-bezier(0.22, 1.6, 0.36, 1);
}
.pop-leave-active {
    transition: opacity 0.1s ease, transform 0.12s ease;
}
.dir-up .pop-enter-from {
    opacity: 0;
    transform: translateX(-50%) scale(0.5) translateY(8px);
}
.dir-up .pop-leave-to {
    opacity: 0;
    transform: translateX(-50%) scale(0.9) translateY(3px);
}
.dir-down .pop-enter-from {
    opacity: 0;
    transform: translateX(-50%) scale(0.5) translateY(-8px);
}
.dir-down .pop-leave-to {
    opacity: 0;
    transform: translateX(-50%) scale(0.9) translateY(-3px);
}
</style>
