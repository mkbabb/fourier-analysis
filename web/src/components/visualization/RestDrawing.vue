<script setup lang="ts">
/**
 * The visualizer's stage at rest (the design critique's V1: "an outline
 * being drawn in circles is the page's own idle state"). The sun, the
 * header toggle's own shape, is drawn by a chain of its largest circles with
 * the site's engine (`@mkbabb/fourier`): the line writes itself in over one
 * turn, holds, fades and begins again. The invitation sits on it. Only while
 * the stage is on screen and the page visible (`frameLoop`); under reduced
 * motion it is the still drawing.
 */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { chainAt, frameLoop, partialSum, resampleArcLength, spectrumOf, svgPathOf, type FrameLoop } from "@mkbabb/fourier";
import { sunShape } from "@/lib/sun-moon-shapes";

/** The harmonics the line is built from; the chain carries all of them, and
 *  the circles drawn are its largest (the rest are smaller than the line). */
const HARMONICS = 64;
const CIRCLES = 28;
/** One turn writes the line; it holds, then fades before the next turn. */
const DRAW_MS = 9000;
const HOLD_MS = 1600;
const FADE_MS = 700;

const src = sunShape.data.original;
const flat = new Float64Array(src.x.length * 2);
src.x.forEach((x, i) => {
    flat[2 * i] = x;
    flat[2 * i + 1] = src.y[i]!;
});
const spectrum = spectrumOf(resampleArcLength(flat, 512), HARMONICS);
const outline = partialSum(spectrum, HARMONICS, 512);
const outlinePath = svgPathOf(outline);

const viewBox = (() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < outline.length; i += 2) {
        minX = Math.min(minX, outline[i]!);
        maxX = Math.max(maxX, outline[i]!);
        minY = Math.min(minY, outline[i + 1]!);
        maxY = Math.max(maxY, outline[i + 1]!);
    }
    const pad = Math.max(maxX - minX, maxY - minY) * 0.18;
    return `${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`;
})();

const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
/** How much of the line is written, 0 → 1. */
const written = ref(1);
const lineOpacity = ref(1);
const joints = shallowRef<Float64Array>(chainAt(spectrum, 0));

/** The line written so far: the outline up to the chain's tip, then the tip. */
const trail = computed(() => {
    const t = written.value;
    if (t >= 1) return outlinePath;
    const n = outline.length / 2;
    const k = Math.floor(t * n);
    const j = joints.value;
    const parts = [`M${outline[0]},${outline[1]}`];
    for (let i = 1; i <= k && i < n; i++) parts.push(`L${outline[2 * i]},${outline[2 * i + 1]}`);
    parts.push(`L${j[j.length - 2]},${j[j.length - 1]}`);
    return parts.join("");
});

const circles = computed(() => {
    const j = joints.value;
    const out: { cx: number; cy: number; r: number }[] = [];
    // The first vector is the shape's centre (the DC term, which never turns).
    for (let i = 1; i < Math.min(j.length / 2 - 1, CIRCLES + 1); i++) {
        const cx = j[2 * i]!, cy = j[2 * i + 1]!;
        out.push({ cx, cy, r: Math.hypot(j[2 * i + 2]! - cx, j[2 * i + 3]! - cy) });
    }
    return out;
});
const arms = computed(() => {
    const j = joints.value;
    const pts: string[] = [];
    for (let i = 1; i < j.length / 2; i++) pts.push(`${j[2 * i]},${j[2 * i + 1]}`);
    return pts.join(" ");
});

const host = useTemplateRef<SVGSVGElement>("host");
let loop: FrameLoop | null = null;
let clock = 0;

function still() {
    written.value = 1;
    lineOpacity.value = 1;
    joints.value = chainAt(spectrum, 0);
}

function tick(dt: number): boolean {
    clock = (clock + dt) % (DRAW_MS + HOLD_MS + FADE_MS);
    const t = Math.min(1, clock / DRAW_MS);
    written.value = t;
    lineOpacity.value = clock <= DRAW_MS + HOLD_MS ? 1 : 1 - (clock - DRAW_MS - HOLD_MS) / FADE_MS;
    joints.value = chainAt(spectrum, t % 1);
    return true;
}

function sync() {
    if (reduce.value) {
        loop?.stop();
        still();
    } else {
        loop?.start();
    }
}

onMounted(() => {
    if (!host.value) return;
    loop = frameLoop(host.value, tick);
    clock = 0;
    written.value = 0;
    sync();
});
watch(reduce, sync);
onBeforeUnmount(() => loop?.dispose());
</script>

<template>
    <svg ref="host" class="rest-drawing" :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g class="rest-chain">
            <circle v-for="(c, i) in circles" :key="i" :cx="c.cx" :cy="c.cy" :r="c.r" />
            <polyline :points="arms" />
        </g>
        <path class="rest-line" :d="trail" :style="{ opacity: lineOpacity }" />
    </svg>
</template>

<style scoped>
.rest-drawing {
    position: absolute;
    inset: var(--space-family);
    inline-size: calc(100% - 2 * var(--space-family));
    block-size: calc(100% - 2 * var(--space-family));
    pointer-events: none;
    user-select: none;
}
.rest-chain circle {
    fill: none;
    stroke: var(--foreground);
    stroke-opacity: 0.1;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
}
.rest-chain polyline {
    fill: none;
    stroke: var(--foreground);
    stroke-opacity: 0.28;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
}
.rest-line {
    fill: none;
    stroke: var(--viz-amber);
    stroke-opacity: 0.7;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
}
</style>
