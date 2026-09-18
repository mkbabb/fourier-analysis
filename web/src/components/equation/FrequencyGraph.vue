<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { BasisComponent } from "@/lib/types";

/**
 * `FR-CP-R-7` / `DECISIONS-F.W4.md` **D2**, executed as ruled — this seat
 * re-decides nothing.
 *
 * (a) RULED DELETE. The selection contract — `toggle-harmonic` /
 *     `hover-harmonic`, `activeIndices`, the `@click` handler and the
 *     `cursor-pointer` that advertised it — had ZERO consumers repo-wide. Wiring
 *     it would have been new feature scope in a defect-mass wave, the house law
 *     forbids shipping an affordance with no consumer, and the wire arm dragged a
 *     mandatory `onUnmounted` teardown behind it. It is gone, and with it the
 *     dead `onUnmounted` import that was the spec's own reminder that the open
 *     half of a paired contract had been authored without its close
 *     (`FR-FG-22`, which stays INFO precisely BECAUSE this arm ruled delete).
 *
 * (b) DEFERRED-WITH-DEFAULT: the shipped LINEAR arm stays, no control is wired,
 *     and NOTHING on the log side is deleted — the annotated transform, the axis
 *     label's log branch and the tooltip's log row all survive untouched. The
 *     D-axis minority (that LOG is the correct default, the 0.008 floor being the
 *     linear arm's own admission) is preserved and routed to SS-3/SS-4.
 *
 * ⊘ The touch constraint binds under BOTH arms and is NOT deferred: the hit-test
 *     lives in POINTER handlers now. `onClick` used to read state that only
 *     `mousemove` ever wrote, so the whole inspection path was silently dead on
 *     the touch arm this route supports.
 */
const props = withDefaults(defineProps<{
    components: BasisComponent[];
    maxBars?: number;
    logScale?: boolean;
}>(), {
    maxBars: 60,
    logScale: false,
});

const canvasRef = ref<HTMLCanvasElement>();
const scrollRef = ref<HTMLDivElement>();
const hoveredBar = ref<number | null>(null);
const tooltipPos = ref({ x: 0, y: 0 });

const BAR_W = 14;
const BAR_GAP = 3;
const HEIGHT = 120;

const displayComponents = computed(() => props.components.slice(0, props.maxBars));

const canvasWidth = computed(() => {
    const n = displayComponents.value.length;
    return Math.max(n * (BAR_W + BAR_GAP) + BAR_GAP + 8, 100);
});

const maxAmplitude = computed(() => {
    if (!displayComponents.value.length) return 1;
    const max = displayComponents.value[0].amplitude;
    return props.logScale ? Math.log10(max + 1) : max;
});

function spectrumColor(i: number, total: number): string {
    const hue = (1 - i / Math.max(total - 1, 1)) * 300;
    return `hsl(${hue}, 85%, 55%)`;
}

function barFraction(amplitude: number): number {
    const val = props.logScale ? Math.log10(amplitude + 1) : amplitude;
    return Math.max(val / maxAmplitude.value, 0.008);
}

function draw() {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvasWidth.value;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(HEIGHT * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${HEIGHT}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, HEIGHT);

    const comps = displayComponents.value;
    const n = comps.length;
    if (n === 0) return;

    const pad = { top: 6, bottom: 18 };
    const plotH = HEIGHT - pad.top - pad.bottom;
    const startX = BAR_GAP + 4;

    for (let i = 0; i < n; i++) {
        const comp = comps[i];
        const isHovered = hoveredBar.value === i;

        const x = startX + i * (BAR_W + BAR_GAP);
        const frac = barFraction(comp.amplitude);
        const barH = frac * plotH;
        const y = pad.top + plotH - barH;
        const color = spectrumColor(i, n);

        ctx.globalAlpha = isHovered ? 1.0 : 0.85;

        if (isHovered) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
        }

        ctx.fillStyle = color;
        const r = Math.min(BAR_W / 2, 3);
        ctx.beginPath();
        ctx.moveTo(x, y + barH);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.lineTo(x + BAR_W - r, y);
        ctx.quadraticCurveTo(x + BAR_W, y, x + BAR_W, y + r);
        ctx.lineTo(x + BAR_W, y + barH);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Index label
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("color") || "#888";
        ctx.font = "9px 'Fira Code', monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(comp.index), x + BAR_W / 2, HEIGHT - 4);
    }
    ctx.globalAlpha = 1;
}

function hitTest(clientX: number): number | null {
    const canvas = canvasRef.value;
    const scroll = scrollRef.value;
    if (!canvas || !scroll) return null;

    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const startX = BAR_GAP + 4;
    const n = displayComponents.value.length;
    for (let i = 0; i < n; i++) {
        const x = startX + i * (BAR_W + BAR_GAP);
        if (mx >= x && mx <= x + BAR_W) return i;
    }
    return null;
}

/** The hit-test lives here, on the pointer, so touch reaches it at all. */
function onPointerMove(e: PointerEvent) {
    const idx = hitTest(e.clientX);
    if (idx === hoveredBar.value) return;
    hoveredBar.value = idx;
    const scroll = scrollRef.value;
    if (scroll) {
        const rect = scroll.getBoundingClientRect();
        tooltipPos.value = { x: e.clientX - rect.left + scroll.scrollLeft, y: e.clientY - rect.top };
    }
    draw();
}

function onPointerLeave() {
    if (hoveredBar.value === null) return;
    hoveredBar.value = null;
    draw();
}

watch(() => [props.components, props.logScale, props.maxBars], () => draw(), { deep: true });

onMounted(() => draw());
</script>

<template>
    <div class="freq-graph-host">
        <!-- Axis annotation (W5.d) — the transform applied to bar heights is named
             explicitly so the viewer is not left to infer a silent log mapping. The
             `+1` shift is the canonical convention for log-magnitude bar charts
             (permits zero amplitudes without diverging). -->
        <div class="freq-graph-axis-label" :title="logScale ? 'Log-magnitude axis: each bar height is log₁₀(|c_n| + 1). The +1 shift admits zero amplitudes.' : 'Linear-magnitude axis: each bar height is the raw |c_n|.'">
            <span v-if="logScale">log<sub>10</sub>(|c<sub>n</sub>| + 1)</span>
            <span v-else>|c<sub>n</sub>|</span>
        </div>
        <div
            ref="scrollRef"
            class="overflow-x-auto overflow-y-hidden scrollbar-thin"
            :style="{ height: `${HEIGHT}px` }"
        >
            <canvas
                ref="canvasRef"
                class="block text-muted-foreground"
                @pointermove="onPointerMove"
                @pointerdown="onPointerMove"
                @pointerleave="onPointerLeave"
                @pointercancel="onPointerLeave"
            />
            <!-- Tooltip -->
            <div
                v-if="hoveredBar !== null && displayComponents[hoveredBar]"
                class="absolute z-[var(--z-controls)] px-2 py-1.5 rounded-lg text-xs whitespace-nowrap
                       pointer-events-none -translate-x-1/2
                       bg-popover text-popover-foreground border-[1.5px] border-border
                       shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                :style="{ left: `${tooltipPos.x}px`, top: `${Math.max(tooltipPos.y - 56, 4)}px` }"
            >
                <div class="flex items-center gap-1.5 mb-0.5">
                    <span
                        class="inline-block w-2 h-2 rounded-full"
                        :style="{ backgroundColor: spectrumColor(hoveredBar, displayComponents.length) }"
                    />
                    <span class="font-semibold">n = {{ displayComponents[hoveredBar].index }}</span>
                </div>
                <div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-mono-micro uppercase font-medium">
                    <span class="text-muted-foreground">Amplitude</span>
                    <span class="fira-code">{{ displayComponents[hoveredBar].amplitude.toFixed(4) }}</span>
                    <template v-if="logScale">
                        <span class="text-muted-foreground">log₁₀(·+1)</span>
                        <span class="fira-code">{{ Math.log10(displayComponents[hoveredBar].amplitude + 1).toFixed(4) }}</span>
                    </template>
                    <span class="text-muted-foreground">Phase</span>
                    <span class="fira-code">{{ (displayComponents[hoveredBar].phase * 180 / Math.PI).toFixed(1) }}°</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.freq-graph-host {
    position: relative;
}
.freq-graph-axis-label {
    /* W5.d — the transform annotation. Computer Modern Serif matches the paper's
       typographic register (the equation surface elsewhere uses EB Garamond as
       the cross-walk substitute on the web; Fira Code carries the numerics). */
    font-family: "EB Garamond", "Computer Modern Serif", serif;
    font-style: italic;
    font-size: 11px;
    color: var(--muted-foreground);
    opacity: 0.75;
    padding: 0 4px 2px;
    user-select: none;
    cursor: help;
}
.freq-graph-axis-label sub {
    font-size: 0.7em;
    vertical-align: sub;
}
.scrollbar-thin {
    scrollbar-width: thin;
    position: relative;
}
.scrollbar-thin::-webkit-scrollbar {
    height: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 2px;
}
</style>
