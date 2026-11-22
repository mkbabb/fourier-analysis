<script setup lang="ts">
/**
 * The stage's one dock: the transport, the layers, the canvas's tools and the
 * door to the editor (owner, 19 Nov: "the visualize area should take up more
 * of the screen and not have two docks of controls"). Every seat is there
 * from the first frame, disabled until there is a drawing to act on.
 *
 * Three forms of one dock, chosen by the host from the stage's own box:
 *  · `row` (a desk, the rail): one row at the stage's foot, folding as glass
 *    folds it. Outside the fold, Play and the four layers (`#persistent`), the
 *    position readout (`#collapsed`) and Edit (`#persistent-end`). Open, the
 *    scrub, the rate, the easing and More (Just the picture, Reset view,
 *    Fullscreen, Export frame), so the scrub keeps most of the row.
 *  · `plate` (a phone held upright): one plate of two rows at the stage's
 *    foot, never folded. The scrub alone, then seven seats in groups by gap:
 *    Play | Picture, Outline, More | the rate, the easing | Edit. More holds
 *    the rest in three groups: the drawn layers; what the stage shows; what
 *    leaves the page.
 *  · `strip` (a short landscape stage, a phone held sideways): the plate's
 *    scrub and seats in a card standing on the stage's trailing edge. There
 *    the drawing is bound by the stage's height, so the box beside the card
 *    costs it nothing (STUDY 2.10: "landscape is designed, not inherited").
 *
 * In the fullscreen takeover the way out is a seat in every form (one press;
 * Back and Escape leave it too): on a desk beside Edit, on a phone in Edit's
 * place, Edit becoming a row of More there.
 *
 * The page's own acts (Publish, the series panel, Copy link) are the app
 * dock's on a desk. On a phone they are rows of More; in the takeover, which
 * covers the app dock, a desk shows them as seats here. The host renders them
 * through the `page-tools` slot (`WorkspaceTools`).
 */
import { computed, h, useTemplateRef } from "vue";
import { createReusableTemplate } from "@vueuse/core";
import {
    CircleDashed,
    Download,
    Ellipsis,
    Focus,
    ImageIcon,
    Maximize2,
    Minimize2,
    Orbit,
    Pause,
    Pencil,
    Play,
    ScanSearch,
    Spline,
} from "@lucide/vue";
import { useAnimationStore } from "@/stores/animation";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { Tooltip } from "@/components/ui/tooltip";
import { GlassDock, DockControl } from "@mkbabb/glass-ui/dock";
import { DockTrigger } from "@mkbabb/glass-ui/dock-trigger";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@mkbabb/glass-ui/menu";
import { EasingCurve } from "@mkbabb/glass-ui/easing";
import { getEasingSVGPath } from "@/lib/easings";
import FourierTimeline from "@/components/shared/FourierTimeline.vue";
import EasingPicker from "./EasingPicker.vue";
import SpeedSelect from "./SpeedSelect.vue";
import type { Layers } from "./lib/layers";
import type { PageToolsForm } from "@/composables/usePageTools";
import type { PageAct } from "./WorkspaceTools.vue";


const props = withDefaults(
    defineProps<{
        activeBases?: string[];
        /** The open desk dock's widest (the fullscreen takeover's is wider). */
        maxWidth?: string;
        /** The dock's form (see above): a folding row, a phone's plate, or a landscape stage's strip. */
        form?: "row" | "plate" | "strip";
        layers: Layers;
        justThePicture: boolean;
        hasContour: boolean;
        /** The stage is in the fullscreen takeover. */
        isFullscreen: boolean;
        /** The drawing is zoomed or panned off its fit (Reset view is live). */
        viewMoved: boolean;
    }>(),
    { activeBases: () => ["fourier-epicycles"], maxWidth: "960px", form: "row" },
);

const emit = defineEmits<{
    toggleLayer: [layer: keyof Layers];
    justThePicture: [];
    resetView: [];
    exportFrame: [];
    /** The control sets the state it shows (idempotent under a replayed click). */
    "update:isFullscreen": [value: boolean];
    toggleEdit: [];
}>();

defineSlots<{
    "page-tools"(props: { form: PageToolsForm; acts: readonly PageAct[]; tooltipSide: "top" }): unknown;
}>();

const anim = useAnimationStore();
const store = useWorkspaceStore();
const auth = useAuthStore();

/**
 * A row of the phone's More whose act asked for a sign-in (a signed-out
 * Publish) has opened the "i" card with its field focused: the closing menu
 * leaves the focus there rather than handing it back to its trigger, which
 * would take it out of the card.
 */
function keepFocusForSignIn(e: Event) {
    if (auth.signInRequested) e.preventDefault();
}

/** There is a drawing to act on: until then every seat is present and disabled. */
const ready = computed(() => !!store.epicycleData || !!store.basesData);

/**
 * X-OD19 · F4 — an open dock menu holds its dock open: glass's collapse timer
 * reads only the dock's keep-open count, so each menu's `update:open` edge
 * takes and gives back exactly one count.
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
 * X.F.W4 · SP-4 / `fr-AnimationControls M-12` — the two 60Hz readouts render
 * in scopes of their own, so the clock re-renders the two nodes that display
 * it and not the dock's whole tree. The fill's `:deep()` rule reaches the
 * render-function child (X.F.W14.u — UIA-F-7); the root is a real
 * `progressbar`.
 */
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

/** The scrub (X.F.W3 `.a`): `t` is continuous, one arrow key moves 1 %. */
const TimelineReadout = () =>
    h(FourierTimeline, {
        modelValue: anim.t,
        accessibleName: "Timeline",
        label: caretLabel.value,
        step: 0.01,
        disabled: !ready.value,
        valueText: () => caretLabel.value,
        "onUpdate:modelValue": (next: number) => anim.seek(next),
        onScrubStart: () => anim.startScrub(),
        onScrubEnd: () => anim.endScrub(),
    });

const LAYER_SEATS = [
    { key: "picture", label: "Picture", icon: ImageIcon },
    { key: "outline", label: "Outline", icon: CircleDashed },
    { key: "line", label: "Line", icon: Spline },
    { key: "circles", label: "Circles", icon: Orbit },
] as const;

/** A row toggles its layer and keeps the menu open. */
function keepOpen(e: Event) {
    e.preventDefault();
}

/* Each seat once, placed by each form. */
const [DefinePlay, ReusePlay] = createReusableTemplate();
const [DefineLayer, ReuseLayer] = createReusableTemplate<{ seat: (typeof LAYER_SEATS)[number]; groupStart?: boolean }>();
const [DefineSpeed, ReuseSpeed] = createReusableTemplate();
const [DefineEasing, ReuseEasing] = createReusableTemplate();
const [DefineEdit, ReuseEdit] = createReusableTemplate();
const [DefineExit, ReuseExit] = createReusableTemplate();
</script>

<template>
    <DefinePlay>
        <Tooltip :text="anim.playing ? 'Pause animation' : 'Play animation'" side="top">
            <DockControl
                class="play-control"
                :active="anim.playing"
                :disabled="!ready"
                :aria-label="anim.playing ? 'Pause animation' : 'Play animation'"
                @click.stop="anim.toggle"
            >
                <!-- X-DS pass 2 · DS-F2-C10: the app's one play/pause glyph set,
                     lucide filled, on the dock's one glyph size. -->
                <Transition name="icon-swap" mode="out-in">
                    <Pause v-if="anim.playing" fill="currentColor" aria-hidden="true" />
                    <Play v-else fill="currentColor" aria-hidden="true" />
                </Transition>
            </DockControl>
        </Tooltip>
    </DefinePlay>

    <DefineLayer v-slot="{ seat, groupStart }">
        <Tooltip :text="seat.label" side="top">
            <DockControl
                :class="{ 'seat-group-start': groupStart }"
                :aria-label="seat.label"
                :active="layers[seat.key]"
                :disabled="!ready"
                @click="emit('toggleLayer', seat.key)"
            >
                <component :is="seat.icon" />
            </DockControl>
        </Tooltip>
    </DefineLayer>

    <!-- X-OD19 · F3: Speed and Easing are each their own seat and menu; the
         trigger names the control, its face shows the value. -->
    <DefineSpeed>
        <DropdownMenu :modal="false" @update:open="holdDockWhileOpen">
            <DockTrigger for="dropdown" class="speed-trigger" aria-label="Playback speed" :disabled="!ready">
                {{ anim.speed }}&times;
            </DockTrigger>
            <DropdownMenuContent class="menu-popup" :side-offset="8" align="end">
                <div class="menu-sections">
                    <SpeedSelect />
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    </DefineSpeed>

    <DefineEasing>
        <DropdownMenu :modal="false" @update:open="holdDockWhileOpen">
            <DockTrigger for="dropdown" aria-label="Easing" :disabled="!ready">
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
    </DefineEasing>

    <!-- X.F.W11 R-close-1 (kept): Edit contour is the editor's door, never folded. -->
    <DefineEdit>
        <Tooltip text="Edit contour" side="top">
            <DockControl aria-label="Edit contour" :active="false" :disabled="!hasContour" @click="emit('toggleEdit')">
                <Pencil />
            </DockControl>
        </Tooltip>
    </DefineEdit>

    <!-- The takeover's way out, a seat in every form while it is up. -->
    <DefineExit>
        <Tooltip text="Exit fullscreen" side="top">
            <DockControl aria-label="Exit fullscreen" @click="emit('update:isFullscreen', false)">
                <Minimize2 />
            </DockControl>
        </Tooltip>
    </DefineExit>

    <!-- ═══ PHONE: one plate, never folded (two rows upright; a card on the trailing edge sideways) ═══ -->
    <GlassDock
        v-if="form !== 'row'"
        ref="dock"
        class="animation-dock animation-dock--card"
        :class="{ 'animation-dock--strip': form === 'strip' }"
        shape="card"
        :collapse="false"
        fit-content
        aria-label="Stage controls"
    >
        <div class="card-face">
            <div class="card-scrub">
                <TimelineReadout />
            </div>
            <div class="card-seats">
                <div class="seat-group">
                    <ReusePlay />
                </div>
                <div class="seat-group">
                    <ReuseLayer :seat="LAYER_SEATS[0]" />
                    <ReuseLayer :seat="LAYER_SEATS[1]" />
                    <DropdownMenu :modal="false" @update:open="holdDockWhileOpen">
                        <DockTrigger for="dropdown" aria-label="Layers and more" :disabled="!ready">
                            <Ellipsis class="stage-glyph" aria-hidden="true" />
                        </DockTrigger>
                        <DropdownMenuContent class="menu-popup" side="top" :side-offset="8" align="end" @close-auto-focus="keepFocusForSignIn">
                            <div class="menu-sections">
                                <DropdownMenuCheckboxItem :model-value="layers.line" @select="keepOpen" @update:model-value="emit('toggleLayer', 'line')">
                                    <Spline aria-hidden="true" />
                                    <span>Line</span>
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem :model-value="layers.circles" @select="keepOpen" @update:model-value="emit('toggleLayer', 'circles')">
                                    <Orbit aria-hidden="true" />
                                    <span>Circles</span>
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem :model-value="justThePicture" @select="keepOpen" @update:model-value="emit('justThePicture')">
                                    <Focus aria-hidden="true" />
                                    <span>Just the picture</span>
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                <slot name="page-tools" form="items" :acts="['series']" tooltip-side="top" />
                                <DropdownMenuItem :disabled="!viewMoved" @select="emit('resetView')">
                                    <ScanSearch aria-hidden="true" />
                                    <span>Reset view</span>
                                </DropdownMenuItem>
                                <!-- In the takeover its way out is a seat, and Edit is this row. -->
                                <DropdownMenuItem v-if="isFullscreen" :disabled="!hasContour" @select="emit('toggleEdit')">
                                    <Pencil aria-hidden="true" />
                                    <span>Edit contour</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem v-else @select="emit('update:isFullscreen', true)">
                                    <Maximize2 aria-hidden="true" />
                                    <span>Fullscreen</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <slot name="page-tools" form="items" :acts="['link']" tooltip-side="top" />
                                <DropdownMenuItem @select="emit('exportFrame')">
                                    <Download aria-hidden="true" />
                                    <span>Export frame</span>
                                </DropdownMenuItem>
                                <slot name="page-tools" form="items" :acts="['publish']" tooltip-side="top" />
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div class="seat-group">
                    <ReuseSpeed />
                    <ReuseEasing />
                </div>
                <div class="seat-group">
                    <ReuseExit v-if="isFullscreen" />
                    <ReuseEdit v-else />
                </div>
            </div>
        </div>
    </GlassDock>

    <!-- ═══ DESK AND RAIL: one row, folding ═══ -->
    <GlassDock
        v-else
        ref="dock"
        class="animation-dock"
        :style="{ '--animation-dock-max-width': maxWidth }"
        aria-label="Stage controls"
    >
        <!-- X.F.W10S.b — the summary is glass's own disclosure, so nothing
             interactive sits in `#collapsed`; the seats that outlive the fold
             stand in `#persistent` and `#persistent-end`, the never-inert
             regions at both poles. -->
        <template #persistent>
            <ReusePlay />
            <ReuseLayer v-for="(seat, i) in LAYER_SEATS" :key="seat.key" :seat="seat" :group-start="i === 0" />
        </template>

        <!-- The position readout, alone in glass's summary square (X-OD19 · F1). -->
        <template #collapsed>
            <MiniProgressReadout />
        </template>

        <!-- X-OD19 · F1: the face has a definite inline size, so glass measures a
             real expanded endpoint and morphs to it. The scrub takes what the
             rate, the easing and More leave of it. -->
        <div class="transport-face flex items-center" :data-page-tools="isFullscreen || undefined">
            <TimelineReadout />
            <ReuseSpeed />
            <ReuseEasing />
            <DropdownMenu :modal="false" @update:open="holdDockWhileOpen">
                <DockTrigger for="dropdown" aria-label="More" :disabled="!ready">
                    <Ellipsis class="stage-glyph" aria-hidden="true" />
                </DockTrigger>
                <DropdownMenuContent class="menu-popup" side="top" :side-offset="8" align="end">
                    <div class="menu-sections">
                        <DropdownMenuCheckboxItem :model-value="justThePicture" @select="keepOpen" @update:model-value="emit('justThePicture')">
                            <Focus aria-hidden="true" />
                            <span>Just the picture</span>
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuItem :disabled="!viewMoved" @select="emit('resetView')">
                            <ScanSearch aria-hidden="true" />
                            <span>Reset view</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem v-if="!isFullscreen" @select="emit('update:isFullscreen', true)">
                            <Maximize2 aria-hidden="true" />
                            <span>Fullscreen</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @select="emit('exportFrame')">
                            <Download aria-hidden="true" />
                            <span>Export frame</span>
                        </DropdownMenuItem>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <template #persistent-end>
            <!-- The takeover covers the app dock: the page's acts stand here, and its way out. -->
            <template v-if="isFullscreen">
                <slot name="page-tools" form="seats" :acts="['publish', 'series', 'link']" tooltip-side="top" />
                <ReuseExit />
            </template>
            <ReuseEdit />
        </template>
    </GlassDock>
</template>

<style scoped>
@reference "tailwindcss";

/* One glyph size and one cell height in this dock: every trigger takes the
   control cell's height through glass's documented hook. A trigger's width is
   glass's to bring to the cell (STUDY G4, booked for glass 11.1.2); until
   then a glyph trigger is 40 px wide beside 44 px seats on touch. */
.animation-dock {
    --dock-trigger-min-height: var(--dock-control-size);
    /* Groups are told apart by a gap, never a rule. */
    --stage-group-gap: 0.5rem;
}
/* The site's own trigger glyphs on the dock's glyph size (DockControl seats take it from glass). */
.stage-glyph {
    inline-size: var(--dock-icon-glyph);
    block-size: var(--dock-icon-glyph);
}

/* A seat that opens a group stands a group's gap from the one before it. */
.seat-group-start {
    margin-inline-start: var(--stage-group-gap);
}

/* ── Desk: the open face's definite inline size ──
   The dock's chrome around the face, in glass's tokens: the plate's two inline
   paddings; the seats outside the fold (Play and the four layers before it,
   Edit after it) with their gaps and the group gap; the layers' two edges.
   `100cqi` is the controls overlay (VisualizationView `.controls-overlay`, an
   inline-size container). In the takeover three page seats and the way out
   join Edit. */
.transport-face {
    --stage-seat: var(--dock-control-size, var(--dock-layer-height, 2.5rem));
    --stage-gap: var(--dock-layer-gap, 0.375rem);
    --stage-end-seats: 1;
    --transport-chrome: calc(
        2 * var(--dock-padding-inline, 0.5rem)
        + (5 + var(--stage-end-seats)) * var(--stage-seat)
        + (4 + var(--stage-end-seats) - 1) * var(--stage-gap)
        + var(--stage-group-gap)
        + 2 * (var(--stage-gap) + var(--dock-ring-reserve, 0px))
    );
    gap: var(--stage-gap);
    inline-size: calc(min(var(--animation-dock-max-width, 960px), 100cqi) - var(--transport-chrome));
}
.transport-face[data-page-tools] {
    --stage-end-seats: 5;
}

/* ── Phone: one plate ──
   Upright, the scrub runs the plate's width; under it seven seats in four
   groups. The plate pads 6 px, so seven 44 px seats and their gaps stay
   inside 358 px. */
.animation-dock--card {
    --dock-padding-inline: 0.375rem;
    --dock-padding-block: 0.375rem;
}
.card-face {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.125rem;
}
.card-scrub {
    display: flex;
}
.card-seats {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--stage-group-gap);
}
.seat-group {
    display: flex;
    align-items: center;
    gap: 0.125rem;
}
/* Sideways, the same plate is a card on the stage's trailing edge, four
   seats wide: the scrub on top (182 px), then Play | Picture, Outline, More,
   then the rate and the easing | Edit, each row's groups at its two ends. */
.animation-dock--strip .card-face {
    inline-size: calc(4 * var(--dock-control-size) + 2 * 0.125rem + var(--stage-group-gap));
}
.animation-dock--strip .card-seats {
    flex-wrap: wrap;
    row-gap: 0.125rem;
}

/* ── Collapsed summary ── */
.mini-progress { width: 2rem; height: 4px; border-radius: var(--radius-pill); background: color-mix(in srgb, var(--foreground) 8%, transparent); overflow: hidden; flex-shrink: 0; }
.mini-progress :deep(.mini-fill) { height: 100%; border-radius: var(--radius-pill); background: color-mix(in srgb, var(--foreground) 25%, transparent); }
/* X.F.W4 · SP-4 / `fr-AnimationControls M-8` — no transition on the fill's
   width: it is rewritten every frame, so a transition could never complete. */

/* ── Speed + easing seats ── */
/* The rate reads as numerals in the mono family (the menu's rates do the same). */
.speed-trigger { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.easing-glyph { inline-size: var(--dock-icon-glyph, 1.25rem); }

/* ── Transitions ── */
.icon-swap-enter-active, .icon-swap-leave-active { transition: opacity 0.15s var(--ease-standard), transform 0.15s var(--ease-standard); }
.icon-swap-enter-from, .icon-swap-leave-to { opacity: 0; transform: scale(0.7); }
</style>

<!-- Global style for the portaled glass-ui DropdownMenuContent: the column
     layout and the scrolling sections only; the plate is glass's. -->
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
