<script setup lang="ts">
import { computed, h, useTemplateRef } from "vue";
import { useAnimationStore } from "@/stores/animation";
import { useWorkspaceStore } from "@/stores/workspace";
import { Pause, Play } from "@lucide/vue";
import { Tooltip } from "@/components/ui/tooltip";
import { GlassDock, DockTrigger, DockControl } from "@mkbabb/glass-ui/dock";
import { DropdownMenu, DropdownMenuContent } from "@mkbabb/glass-ui/menu";
import { EasingCurve } from "@mkbabb/glass-ui/easing";
import { getEasingSVGPath } from "@/lib/easings";
import FourierTimeline from "@/components/shared/FourierTimeline.vue";
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

const anim = useAnimationStore();
const store = useWorkspaceStore();

/**
 * X-OD19 · F4 — an open dock menu holds its dock open. Glass's collapse timer
 * reads only the dock's keep-open count (`useDockState` `scheduleCollapse`), so a
 * menu that never takes a token was left open over a collapsed, `inert` face.
 * Each menu's `update:open` edge takes and gives back exactly one count.
 */
const dock = useTemplateRef<InstanceType<typeof GlassDock>>("dock");
function holdDockWhileOpen(open: boolean) {
    if (open) dock.value?.keepOpen();
    else dock.value?.release();
}

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
    h(FourierTimeline, {
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
            <!-- X.F.W13.b — the dock's own control (owner frame 3, OA-15). The
                 hand-rolled `.play-btn` was a 40x32 / 48x40 stadium beside the dock's
                 40x40 circles; `DockControl` is the circle, and its `active` is the
                 same toggle channel (`aria-pressed` + `data-active`).
                 X.F.W14V.u4 — UIA-F-146: this note sat INSIDE the Tooltip, so in dev
                 the trigger's first child was a comment node and the tooltip had no
                 element to focus; it sits outside now, and the trigger is the
                 DockControl. -->
            <Tooltip :text="anim.playing ? 'Pause animation' : 'Play animation'">
                <DockControl
                    class="play-control"
                    :active="anim.playing"
                    :aria-label="anim.playing ? 'Pause animation' : 'Play animation'"
                    @click.stop="anim.toggle"
                >
                    <!-- X-DS pass 2 · DS-F2-C10: the app's one play/pause glyph
                         set, lucide filled at size-4, as /equation's sweep
                         control (two separately authored sets read apart). -->
                    <Transition name="icon-swap" mode="out-in">
                        <Pause v-if="anim.playing" class="size-4" fill="currentColor" aria-hidden="true" />
                        <Play v-else class="size-4" fill="currentColor" aria-hidden="true" />
                    </Transition>
                </DockControl>
            </Tooltip>
        </template>

        <!-- ═══ COLLAPSED SUMMARY — ONE readout; NO interactive content ═══
             X-OD19 · F1: glass's summary is a single-glyph square (40 px). It held
             the 48 px progress AND a speed Metric, so "1×" sat on the plate edge and
             its unit floated outside the pill. The summary is the position readout
             alone, sized to the square; speed reads on its own dock trigger. -->
        <template #collapsed>
            <MiniProgressReadout />
        </template>

        <!-- ═══ EXPANDED FULL CONTROLS ═══
             X-OD19 · F1: the face carries a DEFINITE inline size (`.transport-face`),
             so glass measures a real expanded endpoint at every posture and morphs
             to it; the posture-keyed width override on the dock is gone. -->
        <div class="transport-face flex items-center gap-2">
            <!-- Timeline -->
            <TimelineReadout />

            <!-- X-OD19 · F3: Speed and Easing are dock-level controls, each its own
                 seat and its own menu (they were two radio groups inside one ⋯
                 menu). The trigger's aria-label names the control; the face shows
                 its value — the rate as mono numerals, the easing as its curve. -->
            <DropdownMenu :modal="false" @update:open="holdDockWhileOpen">
                <DockTrigger for="dropdown" class="speed-trigger" aria-label="Playback speed">
                    {{ anim.speed }}&times;
                </DockTrigger>
                <DropdownMenuContent class="menu-popup" :side-offset="8" align="end">
                    <div class="menu-sections">
                        <SpeedSelect />
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu :modal="false" @update:open="holdDockWhileOpen">
                <DockTrigger for="dropdown" aria-label="Easing">
                    <EasingCurve
                        :strokes="[{ d: getEasingSVGPath(anim.easing) }]"
                        class="easing-glyph"
                        aria-hidden="true"
                    />
                </DockTrigger>
                <DropdownMenuContent class="menu-popup" :side-offset="8" align="end">
                    <div class="menu-sections">
                        <EasingPicker />
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </GlassDock>
</template>

<style scoped>
@reference "tailwindcss";

/* ── The full face's definite inline size ── */
/* X-OD19 · F1: the posture-keyed `.animation-dock:where(.expanded){width}` is
   DELETED. It overrode glass's reserved `inline-size: var(--dock-expanded-px)`,
   and the fluid face under it (`w-full`) gave glass no endpoint to measure (the
   expanded endpoint read 164 → 102 → 1806 px; the scale floored at 0.06). The
   face now has a size of its own, from `maxWidth` and the overlay it sits in,
   identical at both postures, so glass's measured endpoint is the real one. */
.transport-face {
    /* The dock's chrome around the face, in glass's own tokens: the plate's two
       inline paddings, the persistent Play seat (one layer square) and the gap
       between the persistent region and the layers. `100cqi` is the controls
       overlay (VisualizationView `.controls-overlay`, an inline-size container). */
    --transport-chrome: calc(
        2 * var(--dock-padding-inline, 0.5rem) + var(--dock-layer-height, 2.5rem) + var(--dock-layer-gap, 0.375rem)
    );
    inline-size: calc(min(var(--animation-dock-max-width, 960px), 100cqi) - var(--transport-chrome));
}

/* ── Play control ── */
/* X-DS pass 1 · F1-01 — the seven-stop rainbow the control wore while playing,
   and its infinite drift, are DELETED: a decorative gradient on a control and
   idle motion on chrome. The playing state is `DockControl`'s own flat
   selected fill (`[data-active]`), and the play/pause glyph carries it. */

/* ── Collapsed summary ── */
.mini-progress { width: 2rem; height: 4px; border-radius: var(--radius-pill); background: color-mix(in srgb, var(--foreground) 8%, transparent); overflow: hidden; flex-shrink: 0; }
.mini-progress :deep(.mini-fill) { height: 100%; border-radius: var(--radius-pill); background: color-mix(in srgb, var(--foreground) 25%, transparent); }
/* X.F.W4 · SP-4 / `fr-AnimationControls M-8` — the `transition: width 0.1s
   linear` is DELETED, not shortened. `width` here is rewritten every rAF tick,
   so a 100ms transition was retargeted every ~16ms and never once completed:
   the collapsed dock's only position readout was structurally ~100ms behind the
   clock it claimed to report, and the browser ran a live interpolation for the
   entire playback to achieve that. One line removed fixes correctness AND cost,
   and removes an ungated-motion surface from D-8's inventory. */
/* ── Speed + easing seats ── */
/* The rate reads as numerals in the mono family (the menu's rates do the same). */
.speed-trigger { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.easing-glyph { inline-size: var(--dock-icon-glyph, 1.25rem); }

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
       sections do (below). */
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
</style>
