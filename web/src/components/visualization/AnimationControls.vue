<script setup lang="ts">
import { computed, h } from "vue";
import { useAnimationStore } from "@/stores/animation";
import { useWorkspaceStore } from "@/stores/workspace";
import {
    Download, EllipsisVertical, } from "@lucide/vue";
import { Tooltip } from "@/components/ui/tooltip";
import { GlassDock, DockTrigger, DockControl } from "@mkbabb/glass-ui/dock";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@mkbabb/glass-ui/menu";
import { Metric } from "@mkbabb/glass-ui/metric";
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

/**
 * X.F.W4 · SP-4 / `fr-AnimationControls M-12` — the two 60Hz readouts,
 * ISOLATED.
 *
 * Both dock layers are always mounted (the producer toggles `inert` rather than
 * unmounting), and the template read `anim.t` directly in two places — the
 * collapsed progress fill and the timeline caret label. That put the clock in
 * THIS component's render effect, so the entire two-branch vnode tree — every
 * Tooltip, the dropdown, the speed select, both hand-inlined play glyphs — was
 * re-rendered sixty times a second, beside two Canvas2D surfaces already
 * drawing at the same rate.
 *
 * Each readout now renders in a scope of its own. The parent's render effect
 * reads neither `anim.t` nor `caretLabel`, so it re-renders when the dock's
 * STRUCTURE changes and not when the clock ticks; the tick re-renders exactly
 * the two nodes that display it. Nothing about what is displayed changes.
 *
 * ⊘ They are components and not `v-memo`/`shallowRef` tricks because the cure
 * has to be a render BOUNDARY: memoisation still runs the parent's render and
 * only skips patching, which is the cost this row is about. Magnitude at a real
 * profile → SS-13.
 */
//
// X.F.W14.u — UIA-F-7: the fill is a render-function child, and such a child
// carries no `data-v` scope, so the SFC's scoped `.mini-fill` rule never
// matched it: 0 px tall and transparent, the dock's only position readout
// permanently empty. The rule reaches it through `:deep()` from the scoped
// root (which does carry the scope). The producer's `Progress` was tried and
// measured out: its fill carries a `transform` transition, which a 60 fps clock
// restarts every frame — a perpetual running CSSTransition that lags the
// readout and never lets the page settle. The root is a real `progressbar`.
const MiniProgressReadout = () =>
    h(
        "div",
        {
            class: "mini-progress",
            role: "progressbar",
            "aria-label": "Animation position",
            "aria-valuemin": 0,
            "aria-valuemax": 1,
            "aria-valuenow": Math.round(anim.t * 100) / 100,
            "aria-valuetext": `${Math.round(anim.t * 100)}%`,
        },
        [h("div", { class: "mini-fill", style: { width: `${anim.t * 100}%` } })],
    );

/**
 * X.F.W3 `.a` — the timeline is a parameterised composition now, so this host
 * supplies the binding the fork used to take by reaching into the store itself
 * (`fr-AnimationControls C-4 / M-1 / M-14`: no `modelValue`, no emits, a hard
 * `useAnimationStore()` bind — which is exactly why a second site could not
 * reuse it and forked instead).
 *
 * The render-boundary this functional component exists for is unchanged and is
 * the reason the bindings live HERE and not in the template: `anim.t` and
 * `caretLabel` are read inside this render scope, so the clock re-renders the
 * two nodes that display it and not the dock's whole two-branch vnode tree.
 *
 * `step` is this host's axis decision, the counterpart of the convergence
 * host's: `t` is continuous here and nothing quantises it, so one arrow key
 * moves 1% — the granularity the integer axis used to give, now expressed on
 * the `[0..1]` axis the producer's own contract states.
 */
const TimelineReadout = () =>
    h(GlassTimeline, {
        modelValue: anim.t,
        accessibleName: "Timeline",
        label: caretLabel.value,
        step: 0.01,
        valueText: () => caretLabel.value,
        "onUpdate:modelValue": (next: number) => anim.seek(next),
        onScrubStart: () => anim.startScrub(),
        onScrubEnd: () => anim.endScrub(),
    });
</script>

<template>
    <GlassDock
        ref="dock"
        class="animation-dock"
        :style="{ '--animation-dock-max-width': maxWidth }"
    >
        <!--
          X.F.W10S.b — `G-F9-8` (keystones 1 · 2 · crud:664, `nested-interactive`,
          serious). glass-ui 8.0.0 makes the auto-posture collapsed summary the
          dock's own disclosure (`role="button"`, `aria-label="Expand dock"`),
          and a `role="button"` host may not contain interactive content — so
          the mini Play/Pause this file put in `#collapsed` became a control
          nested inside a control. `EditorControlsDock.vue` met the same producer
          cure with the same move: the one action that must outlive the
          auto-collapse leaves the summary for `#persistent`, the never-inert
          region rendered OUTSIDE `.dock-layers` at both poles, and the expanded
          row's duplicate goes with it (one action, one control). The control
          keeps its two sizes by reading the posture: mini beside the collapsed
          readout, full beside the timeline.
        -->
        <template #persistent>
            <Tooltip :text="anim.playing ? 'Pause animation' : 'Play animation'">
                <!-- X.F.W13.b — the dock's own control (owner frame 3, OA-15). The
                     hand-rolled `.play-btn` was a 40x32 / 48x40 stadium beside the dock's
                     40x40 circles; `DockControl` is the circle, and its `active` is the
                     same toggle channel (`aria-pressed` + `data-active`). -->
                <DockControl
                    class="play-control"
                    :active="anim.playing"
                    :aria-label="anim.playing ? 'Pause animation' : 'Play animation'"
                    @click.stop="anim.toggle"
                >
                    <Transition name="icon-swap" mode="out-in">
                        <svg v-if="anim.playing" viewBox="0 0 320 512" fill="currentColor"><path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"/></svg>
                        <svg v-else viewBox="0 0 384 512" fill="currentColor"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>
                    </Transition>
                </DockControl>
            </Tooltip>
        </template>

        <!-- ═══ COLLAPSED SUMMARY — readouts only; NO interactive content ═══ -->
        <template #collapsed>
            <MiniProgressReadout />
            <Metric :value="anim.speed" unit="×" size="sm" />
        </template>

        <!-- ═══ EXPANDED FULL CONTROLS ═══ -->
        <div class="flex items-center gap-2 w-full">
            <!-- Timeline -->
            <TimelineReadout />

            <!-- Three-dot menu — glass-ui DropdownMenu (role="menu", focus
                 management, Esc + click-outside dismissal all from the
                 primitive; replaces the hand-rolled popup + onClickOutside). -->
            <DropdownMenu :modal="false">
                <DockTrigger for="dropdown" aria-label="More options">
                    <Tooltip text="More options">
                        <EllipsisVertical class="h-4 w-4" />
                    </Tooltip>
                </DockTrigger>
                <!-- X.F.W14U.vdock — UIA-F-9 (BROKEN) ⊕ F-82 ⊕ F-175. Every setting
                     is a labelled menu section in the menu's own idiom (speed and
                     easing as radio groups; the speed Select that sat in the dock
                     from `sm` up and inside this menu below it is gone — one
                     control per setting, and no listbox ever opens over the
                     menu). The sections scroll inside the plate when the space
                     above the dock is short, and Export is pinned below them, so
                     the menu's one command never scrolls out of view (the 390
                     frame: sh464/ch382 put it below the fold). -->
                <DropdownMenuContent class="menu-popup" :side-offset="8" align="end">
                    <div class="menu-sections">
                        <SpeedSelect />
                        <EasingPicker />
                    </div>
                    <DropdownMenuItem class="menu-item" @select="emit('exportFrame')">
                        <Download class="h-4 w-4" />
                        <span class="text-sm font-medium">Export</span>
                    </DropdownMenuItem>
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

/* ── Play control ── */
/* X.F.W13.b — the hand-rolled `.play-btn` (its own glass recipe in literal
   rgba, a 48x40 / 40x32 stadium, hover lift, press, focus outline) retires onto
   `DockControl`, which owns the circle, the glass face, press and focus. The
   rainbow the control wore while playing is KEPT, moved onto the producer's
   own knob for a selected dock control (`--dock-control-active-bg`, read by
   `[data-active]`), and its drift keeps its reduced-motion arm. */
.play-control[data-active] {
    --dock-control-active-bg: linear-gradient(135deg, hsl(0 75% 62% / 0.55), hsl(35 85% 58% / 0.5), hsl(55 80% 55% / 0.45), hsl(140 50% 50% / 0.45), hsl(210 65% 58% / 0.5), hsl(275 55% 58% / 0.5), hsl(330 65% 58% / 0.55));
    background-size: 300% 300%;
    animation: rainbow-drift 2.5s var(--ease-standard) infinite;
}
@media (prefers-reduced-motion: reduce) {
    .play-control[data-active] { animation: none; }
}
@keyframes rainbow-drift { 0% { background-position: 0% 0%; } 50% { background-position: 100% 100%; } 100% { background-position: 0% 0%; } }

/* ── Collapsed summary ── */
.mini-progress { width: 3rem; height: 4px; border-radius: var(--radius-pill); background: color-mix(in srgb, var(--foreground) 8%, transparent); overflow: hidden; flex-shrink: 0; }
.mini-progress :deep(.mini-fill) { height: 100%; border-radius: var(--radius-pill); background: color-mix(in srgb, var(--foreground) 25%, transparent); }
/* X.F.W4 · SP-4 / `fr-AnimationControls M-8` — the `transition: width 0.1s
   linear` is DELETED, not shortened. `width` here is rewritten every rAF tick,
   so a 100ms transition was retargeted every ~16ms and never once completed:
   the collapsed dock's only position readout was structurally ~100ms behind the
   clock it claimed to report, and the browser ran a live interpolation for the
   entire playback to achieve that. One line removed fixes correctness AND cost,
   and removes an ungated-motion surface from D-8's inventory. */
/* X.F.W14U.d — OA-57, the consumer half. The speed reading is glass's Metric as
   glass paints it. The retired `.summary-speed` inked the value at 35% while the
   unit kept glass's muted ink, so "1" read dimmer than its own "×" and the unit
   read as a loose glyph beside the plate (the owner's frame). Its `text-base`
   never reached the value (`size="sm"` sets it); it only re-based the reading's
   em gap off the dock's own size. The plate that does not wrap the summary is glass's (DOCK-COLLAPSED-FORM, O-65). */

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
    /* X.F.W14U.vdock — UIA-F-9: the plate never outgrows the space reka
       measures on the side it opens, and it never scrolls itself — its
       sections do (below), so Export stays pinned in view. */
    max-block-size: var(--reka-dropdown-menu-content-available-height);
    overflow: hidden;
}

.menu-popup .menu-sections {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-block-size: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
}

/* `<Button variant="ghost" size="sm">` ships the focus-ring + hover + press;
   the `.menu-item` hook widens the chassis to the full menu width and pins
   the gap + left-aligned text + nowrap layout the menu pattern requires. */
.menu-popup .menu-item {
    width: 100%;
    justify-content: flex-start;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    white-space: nowrap;
}
</style>
