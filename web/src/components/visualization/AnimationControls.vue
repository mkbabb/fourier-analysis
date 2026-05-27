<script setup lang="ts">
import { computed } from "vue";
import { useAnimationStore } from "@/stores/animation";
import { useWorkspaceStore } from "@/stores/workspace";
import {
    Download, EllipsisVertical, } from "lucide-vue-next";
import { Tooltip } from "@/components/ui/tooltip";
import { GlassDock, DockDropdownTrigger } from "@mkbabb/glass-ui/dock";
import { DropdownMenu, DropdownMenuContent } from "@mkbabb/glass-ui/dropdown-menu";
import { Button } from "@mkbabb/glass-ui";
import { MetricBadge } from "@mkbabb/glass-ui/metric-badge";
import GlassTimeline from "./GlassTimeline.vue";
import EasingPicker from "./EasingPicker.vue";
import SpeedSelect from "./SpeedSelect.vue";

const props = withDefaults(
    defineProps<{
        activeBases?: string[];
        /**
         * Max expanded dock width.  Replaces the cross-component
         * `--animation-dock-max-width` CSS-var contract (formerly fed by
         * FullscreenViewer's scoped `.fs-controls`) with a typed prop.
         */
        maxWidth?: string;
    }>(),
    { activeBases: () => ["fourier-epicycles"], maxWidth: "960px" },
);

const emit = defineEmits<{
    (e: "exportFrame"): void;
}>();

const anim = useAnimationStore();
const store = useWorkspaceStore();

const isEpicycleOnly = computed(() =>
    props.activeBases.includes("fourier-epicycles") && props.activeBases.length === 1,
);

const currentLevel = computed(() => {
    const basesData = store.basesData;
    const epicycleData = store.epicycleData;
    if (basesData && basesData.levels.length > 0) {
        const levels = basesData.levels;
        const pos = anim.easedT * (levels.length - 1);
        return levels[Math.round(pos)];
    } else if (epicycleData) {
        return Math.max(1, Math.ceil(anim.easedT * epicycleData.components.length));
    }
    return 1;
});

const caretLabel = computed(() =>
    isEpicycleOnly.value ? `t = ${anim.t.toFixed(2)}` : `N = ${currentLevel.value}`,
);
</script>

<template>
    <GlassDock
        class="animation-dock"
        :collapse-delay="2000"
        :start-collapsed="true"
        :style="{ '--animation-dock-max-width': maxWidth }"
    >
        <!-- ═══ COLLAPSED SUMMARY ═══ -->
        <template #collapsed>
            <Tooltip :text="anim.playing ? 'Pause' : 'Play'">
                <button class="play-btn play-btn--mini" :class="{ 'is-playing': anim.playing }" :aria-label="anim.playing ? 'Pause animation' : 'Play animation'" @click.stop="anim.toggle">
                    <Transition name="icon-swap" mode="out-in">
                        <svg v-if="anim.playing" class="play-icon" viewBox="0 0 320 512" fill="currentColor"><path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"/></svg>
                        <svg v-else class="play-icon" viewBox="0 0 384 512" fill="currentColor"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>
                    </Transition>
                </button>
            </Tooltip>
            <div class="mini-progress"><div class="mini-fill" :style="{ width: (anim.t * 100) + '%' }" /></div>
            <MetricBadge :amount="anim.speed" unit="×" size="sm" class="summary-speed" />
        </template>

        <!-- ═══ EXPANDED FULL CONTROLS ═══ -->
        <div class="flex items-center gap-2 w-full">
            <!-- Play/Pause -->
            <Tooltip :text="anim.playing ? 'Pause animation' : 'Play animation'">
                <button class="play-btn" :class="{ 'is-playing': anim.playing }" :aria-label="anim.playing ? 'Pause animation' : 'Play animation'" @click="anim.toggle">
                    <Transition name="icon-swap" mode="out-in">
                        <svg v-if="anim.playing" class="play-icon" viewBox="0 0 320 512" fill="currentColor"><path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"/></svg>
                        <svg v-else class="play-icon" viewBox="0 0 384 512" fill="currentColor"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>
                    </Transition>
                </button>
            </Tooltip>

            <!-- Timeline -->
            <GlassTimeline :label="caretLabel" />

            <!-- Speed -->
            <Tooltip text="Playback speed">
                <div class="hidden sm:block">
                    <SpeedSelect :model-value="anim.speed" @update:model-value="anim.speed = $event" />
                </div>
            </Tooltip>

            <!-- Three-dot menu — glass-ui DropdownMenu (role="menu", focus
                 management, Esc + click-outside dismissal all from the
                 primitive; replaces the hand-rolled popup + onClickOutside). -->
            <DropdownMenu>
                <Tooltip text="More options">
                    <DockDropdownTrigger aria-label="More options">
                        <EllipsisVertical class="h-4 w-4" />
                    </DockDropdownTrigger>
                </Tooltip>
                <DropdownMenuContent class="menu-popup" :side-offset="8" align="end">
                    <div class="flex sm:hidden items-center gap-2 px-3 py-1.5 border-b border-border/50 mb-0.5 pb-2">
                        <span class="text-muted-foreground text-xs">Speed</span>
                        <SpeedSelect :model-value="anim.speed" @update:model-value="anim.speed = $event" compact />
                    </div>
                    <EasingPicker />
                    <Tooltip text="Export frame as PNG">
                        <Button variant="ghost" size="sm" class="menu-item" @click="emit('exportFrame')">
                            <Download class="h-4 w-4" />
                            <span class="text-sm font-medium">Export</span>
                        </Button>
                    </Tooltip>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </GlassDock>
</template>

<style scoped>
@reference "tailwindcss";

/* ── Dock width: stretch to fill container when expanded ── */
.animation-dock:where(.expanded) {
    width: min(var(--animation-dock-max-width, 960px), calc(100dvw - 1rem));
}

/* ── Play button ── */
.play-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 2.5rem;
    border-radius: 9999px;
    cursor: pointer;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
    backdrop-filter: blur(12px) saturate(1.4);
    -webkit-backdrop-filter: blur(12px) saturate(1.4);
    color: #fff;
    flex-shrink: 0;
    transition: transform 0.2s, box-shadow 0.3s, border-color 0.3s;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08);
}
.play-btn::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: linear-gradient(135deg, hsl(0 75% 62% / 0.55), hsl(35 85% 58% / 0.5), hsl(55 80% 55% / 0.45), hsl(140 50% 50% / 0.45), hsl(210 65% 58% / 0.5), hsl(275 55% 58% / 0.5), hsl(330 65% 58% / 0.55));
    background-size: 300% 300%;
    z-index: -1;
    transition: opacity 0.3s ease;
}
.play-btn::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 50%);
    pointer-events: none;
}
.play-btn.is-playing::before { animation: rainbow-drift 2.5s var(--ease-standard) infinite; }

@media (prefers-reduced-motion: reduce) {
    .play-btn.is-playing::before { animation: none; }
}
.play-btn:hover { transform: scale(1.08); border-color: rgba(255, 255, 255, 0.4); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 4px 20px rgba(200, 100, 255, 0.2), 0 2px 12px rgba(100, 180, 255, 0.15); }
.play-btn:active { transform: scale(0.93); }
.play-btn:focus-visible { outline: 2px solid rgba(255, 255, 255, 0.6); outline-offset: 2px; }
.play-btn--mini { width: 2.5rem; height: 2rem; }
.play-btn--mini .play-icon { width: 14px; height: 14px; }
.play-icon { width: 17px; height: 17px; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15)); }
@keyframes rainbow-drift { 0% { background-position: 0% 0%; } 50% { background-position: 100% 100%; } 100% { background-position: 0% 0%; } }

/* ── Collapsed summary ── */
.mini-progress { width: 3rem; height: 4px; border-radius: 2px; background: color-mix(in srgb, var(--foreground) 8%, transparent); overflow: hidden; flex-shrink: 0; }
.mini-fill { height: 100%; border-radius: 2px; background: color-mix(in srgb, var(--foreground) 25%, transparent); transition: width 0.1s linear; }
.summary-speed { @apply text-base; color: color-mix(in srgb, var(--foreground) 35%, transparent); }

/* ── Transitions ── */
/* A.W3.d — named properties + canonical token, no `transition: all`. */
.icon-swap-enter-active, .icon-swap-leave-active { transition: opacity 0.15s var(--ease-standard), transform 0.15s var(--ease-standard); }
.icon-swap-enter-from, .icon-swap-leave-to { opacity: 0; transform: scale(0.7); }
</style>

<!-- Global style for the portaled glass-ui DropdownMenuContent.  The primitive
     ships its own chrome (background, border, radius, shadow, animations); we
     only override the column layout + the menu-item chassis. -->
<style>
@reference "tailwindcss";

.menu-popup {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 9rem;
}

/* `<Button variant="ghost" size="sm">` ships the focus-ring + hover + press;
   the `.menu-item` hook widens the chassis to the full menu width and pins
   the gap + left-aligned text + nowrap layout the menu pattern requires. */
.menu-popup .menu-item {
    width: 100%;
    justify-content: flex-start;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    white-space: nowrap;
}
</style>
