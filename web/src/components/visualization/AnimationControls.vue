<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAnimationStore } from "@/stores/animation";
import { useSessionStore } from "@/stores/session";
import {
    Download,
    Eye,
    EyeOff,
    EllipsisVertical,
} from "lucide-vue-next";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";

const props = withDefaults(
    defineProps<{
        activeBases?: string[];
        showGhost?: boolean;
    }>(),
    { activeBases: () => ["fourier-epicycles"], showGhost: true },
);

const emit = defineEmits<{
    (e: "exportFrame"): void;
    (e: "toggleGhost"): void;
}>();

const anim = useAnimationStore();
const store = useSessionStore();

const isEpicycleOnly = computed(() =>
    props.activeBases.includes("fourier-epicycles") && props.activeBases.length === 1,
);

const currentLevel = computed(() => {
    const basesData = store.basesData;
    const epicycleData = store.epicycleData;
    if (basesData && basesData.levels.length > 0) {
        const levels = basesData.levels;
        const pos = anim.t * (levels.length - 1);
        return levels[Math.round(pos)];
    } else if (epicycleData) {
        return Math.max(1, Math.ceil(anim.t * epicycleData.components.length));
    }
    return 1;
});

const caretLabel = computed(() => {
    if (isEpicycleOnly.value) {
        return `t = ${anim.t.toFixed(2)}`;
    }
    return `N = ${currentLevel.value}`;
});

const speedStr = computed({
    get: () => String(anim.speed),
    set: (v: string) => {
        anim.speed = parseFloat(v);
    },
});

function onScrub(e: Event) {
    const input = e.target as HTMLInputElement;
    anim.seek(parseFloat(input.value));
}

/* Slider color: green for epicycles, red otherwise */
const isEpicycleMode = computed(() =>
    props.activeBases.includes("fourier-epicycles"),
);
const sliderColor = computed(() =>
    isEpicycleMode.value ? "#22c55e" : "#ff3412",
);
const sliderColorDark = computed(() =>
    isEpicycleMode.value ? "#16a34a" : "#b91c1c",
);

/* Three-dot menu */
const menuOpen = ref(false);
const menuAnchor = ref<HTMLElement>();

function handleClickOutside(e: MouseEvent) {
    if (
        menuOpen.value &&
        menuAnchor.value &&
        !menuAnchor.value.contains(e.target as Node)
    ) {
        menuOpen.value = false;
    }
}

onMounted(() => document.addEventListener("pointerdown", handleClickOutside));
onUnmounted(() =>
    document.removeEventListener("pointerdown", handleClickOutside),
);
</script>

<template>
    <div class="anim-controls">
        <!-- Play/Pause — icon-only pill -->
        <Tooltip :text="anim.playing ? 'Pause animation' : 'Play animation'">
            <button
                class="play-btn"
                :class="{ 'is-playing': anim.playing }"
                @click="anim.toggle"
            >
                <Transition name="icon-swap" mode="out-in">
                    <svg v-if="anim.playing" class="play-icon" viewBox="0 0 320 512" fill="currentColor"><path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"/></svg>
                    <svg v-else class="play-icon" viewBox="0 0 384 512" fill="currentColor"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>
                </Transition>
            </button>
        </Tooltip>

        <!-- Timeline slider — fills remaining space -->
        <div class="timeline-row">
            <div class="timeline-caret" :style="{ left: (anim.t * 100) + '%' }">
                <span class="caret-value fira-code">{{ caretLabel }}</span>
            </div>
            <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                :value="anim.t"
                class="timeline-slider w-full"
                :style="{
                    '--slider-color': sliderColor,
                    '--slider-color-dark': sliderColorDark,
                }"
                @input="onScrub"
                @pointerdown="anim.startScrub"
                @pointerup="anim.endScrub"
                @pointercancel="anim.endScrub"
            />
        </div>

        <!-- Speed dropdown — visible on desktop only -->
        <Tooltip text="Playback speed">
            <div class="speed-desktop">
                <Select v-model="speedStr">
                    <SelectTrigger class="speed-trigger">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0.25">0.25&times;</SelectItem>
                        <SelectItem value="0.5">0.5&times;</SelectItem>
                        <SelectItem value="1">1&times;</SelectItem>
                        <SelectItem value="2">2&times;</SelectItem>
                        <SelectItem value="4">4&times;</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </Tooltip>

        <!-- Three-dot menu -->
        <div ref="menuAnchor" class="menu-anchor">
            <Tooltip text="More options">
                <button
                    class="menu-btn"
                    @click="menuOpen = !menuOpen"
                >
                    <EllipsisVertical class="h-4 w-4" />
                </button>
            </Tooltip>
            <Transition name="popup">
                <div v-if="menuOpen" class="menu-popup">
                    <!-- Speed — mobile only (inside menu) -->
                    <div class="speed-mobile">
                        <span class="menu-label text-muted-foreground">Speed</span>
                        <Select v-model="speedStr">
                            <SelectTrigger class="speed-trigger-compact">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0.25">0.25&times;</SelectItem>
                                <SelectItem value="0.5">0.5&times;</SelectItem>
                                <SelectItem value="1">1&times;</SelectItem>
                                <SelectItem value="2">2&times;</SelectItem>
                                <SelectItem value="4">4&times;</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Tooltip :text="props.showGhost ? 'Hide original contour' : 'Show original contour'">
                        <button
                            @click="emit('toggleGhost')"
                            class="menu-item"
                        >
                            <component :is="props.showGhost ? Eye : EyeOff" class="h-4 w-4" />
                            <span class="menu-label">Outline</span>
                        </button>
                    </Tooltip>
                    <Tooltip text="Export frame as PNG">
                        <button
                            @click="emit('exportFrame')"
                            class="menu-item"
                        >
                            <Download class="h-4 w-4" />
                            <span class="menu-label">Export</span>
                        </button>
                    </Tooltip>
                </div>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
/* Single-row flex layout */
.anim-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    backdrop-filter: blur(12px);
    background: hsl(var(--background) / 0.65);
    border-top: 1px solid hsl(var(--foreground) / 0.08);
    min-width: 0;
}

/* Play/Pause — wide rounded-rect pill (keyframes.js style) */
.play-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.25rem;
    border-radius: 0.625rem;
    cursor: pointer;
    overflow: hidden;
    border: none;
    background: transparent;
    color: #fff;
    flex-shrink: 0;
    transition: transform 0.2s, box-shadow 0.2s;
}

/* Vivid rainbow background */
.play-btn::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 0.625rem;
    background: linear-gradient(
        90deg,
        hsl(0 85% 60%),
        hsl(30 90% 55%),
        hsl(55 85% 52%),
        hsl(120 65% 48%),
        hsl(200 75% 52%),
        hsl(270 65% 55%),
        hsl(330 80% 58%),
        hsl(0 85% 60%)
    );
    background-size: 200% 100%;
    z-index: -1;
    transition: filter 0.3s ease;
}
/* Animated shift when playing */
.play-btn.is-playing::before {
    animation: rainbow-shift 3s linear infinite;
}

.play-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 2px 16px rgba(255, 100, 100, 0.25),
        0 2px 16px rgba(100, 100, 255, 0.2);
}
.play-btn:active {
    transform: scale(0.93);
}

.play-icon {
    width: 13px;
    height: 13px;
}

@keyframes rainbow-shift {
    0% {
        background-position: 0% 50%;
    }
    100% {
        background-position: 200% 50%;
    }
}

/* Timeline slider — fills remaining space */
.timeline-row {
    flex: 1;
    min-width: 0;
    padding: 0 0.25rem;
    position: relative;
}

.timeline-caret {
    position: absolute;
    bottom: calc(100% + 2px);
    transform: translateX(-50%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 10;
}

/* Show caret on hover or when scrubbing */
.timeline-row:hover .timeline-caret,
.timeline-row:has(input:active) .timeline-caret {
    opacity: 1;
}

.caret-value {
    display: block;
    padding: 0.125rem 0.375rem;
    font-size: 0.6875rem;
    font-weight: 500;
    color: hsl(var(--popover-foreground));
    background: hsl(var(--popover));
    border: 1px solid hsl(var(--border));
    border-radius: 0.25rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
}

.timeline-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 10px;
    border-radius: 5px;
    touch-action: none;
    background: linear-gradient(
        to right,
        var(--slider-color) v-bind('(anim.t * 100) + "%"'),
        hsl(var(--foreground) / 0.12) v-bind('(anim.t * 100) + "%"')
    );
    outline: none;
    cursor: pointer;
}

:where(.dark) .timeline-slider {
    background: linear-gradient(
        to right,
        var(--slider-color-dark) v-bind('(anim.t * 100) + "%"'),
        hsl(var(--foreground) / 0.1) v-bind('(anim.t * 100) + "%"')
    );
}

.timeline-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--slider-color);
    cursor: pointer;
    border: 2px solid hsl(var(--background));
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
    transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275),
        box-shadow 0.15s ease;
}

:where(.dark) .timeline-slider::-webkit-slider-thumb {
    background: var(--slider-color-dark);
}

.timeline-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--slider-color) 40%, transparent);
}

.timeline-slider::-webkit-slider-thumb:active {
    transform: scale(0.95);
}

.timeline-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--slider-color);
    cursor: pointer;
    border: 2px solid hsl(var(--background));
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

.timeline-slider::-moz-range-progress {
    background: var(--slider-color);
    border-radius: 5px;
    height: 10px;
}

:where(.dark) .timeline-slider::-moz-range-progress {
    background: var(--slider-color-dark);
}

.timeline-slider::-moz-range-track {
    background: hsl(var(--secondary));
    border-radius: 5px;
    height: 10px;
}

/* Speed dropdown — desktop only */
.speed-desktop {
    display: none;
}
@media (min-width: 640px) {
    .speed-desktop {
        display: block;
    }
}

/* Speed dropdown — mobile only (inside menu) */
.speed-mobile {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    border-bottom: 1px solid hsl(var(--border) / 0.5);
    margin-bottom: 0.125rem;
    padding-bottom: 0.5rem;
}
@media (min-width: 640px) {
    .speed-mobile {
        display: none;
    }
}

.speed-trigger {
    height: 2.5rem;
    width: 4.5rem;
    flex-shrink: 0;
    font-family: "Fira Code", monospace;
    font-size: 0.8125rem;
    border: 2px solid hsl(var(--foreground) / 0.15);
    border-radius: 0.5rem;
}

.speed-trigger-compact {
    height: 2rem;
    width: 4rem;
    flex-shrink: 0;
    font-family: "Fira Code", monospace;
    font-size: 0.75rem;
    border: 1.5px solid hsl(var(--foreground) / 0.15);
    border-radius: 0.375rem;
}

/* Three-dot menu */
.menu-anchor {
    position: relative;
}

.menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    border: 2px solid hsl(var(--foreground) / 0.15);
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
}
.menu-btn:hover {
    background: hsl(var(--muted));
    transform: scale(1.05);
}
.menu-btn:active {
    transform: scale(0.95);
}

.menu-popup {
    position: absolute;
    bottom: calc(100% + 0.5rem);
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.375rem;
    background: hsl(var(--card));
    border: 2px solid hsl(var(--foreground) / 0.15);
    border-radius: 0.75rem;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
    z-index: 20;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: none;
    background: none;
    color: hsl(var(--foreground));
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
    font-size: 0.8125rem;
    font-weight: 500;
}
.menu-item:hover {
    background: hsl(var(--muted));
}

/* Popup transition */
.popup-enter-active,
.popup-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}
.popup-enter-from,
.popup-leave-to {
    opacity: 0;
    transform: translateY(4px) scale(0.95);
}

/* Icon swap transition */
.icon-swap-enter-active,
.icon-swap-leave-active {
    transition: all 0.15s ease;
}
.icon-swap-enter-from {
    opacity: 0;
    transform: scale(0.7);
}
.icon-swap-leave-to {
    opacity: 0;
    transform: scale(0.7);
}
</style>
