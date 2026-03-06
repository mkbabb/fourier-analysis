<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useLineBoil } from "@mkbabb/pencil-boil";

const svgRef = ref<SVGSVGElement | null>(null);

const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Title boil config — cycles through baseFrequency offsets at ~6.7fps */
const boilOffsets = [0, 0.002, -0.001, 0.003, -0.002, 0.001, -0.003, 0.001];
const baseFreq = 0.015;

/* Wobble-celestial config — for dark mode toggle boil effect (~6fps) */
const wobbleOffsets = [0, 0.003, -0.002, 0.004, -0.003, 0.002, -0.004, 0.001];
const wobbleBaseFreq = 0.02;

/* Use pencil-boil's useLineBoil for frame cycling instead of manual setInterval */
const { currentFrame: boilFrame } = useLineBoil(boilOffsets.length, 150);
const { currentFrame: wobbleFrame } = useLineBoil(wobbleOffsets.length, 160);

function applyBoilFrame(frame: number) {
    if (reducedMotion || !svgRef.value) return;
    const turbEl = svgRef.value.querySelector(
        "#title-boil feTurbulence",
    ) as SVGFETurbulenceElement | null;
    if (!turbEl) return;

    const offset = boilOffsets[frame % boilOffsets.length];
    const freq = Math.round((baseFreq + offset) * 10000) / 10000;
    turbEl.setAttribute("baseFrequency", String(freq));
}

function applyWobbleFrame(frame: number) {
    if (reducedMotion || !svgRef.value) return;
    const turbEl = svgRef.value.querySelector(
        "#wobble-celestial feTurbulence",
    ) as SVGFETurbulenceElement | null;
    if (!turbEl) return;

    const offset = wobbleOffsets[frame % wobbleOffsets.length];
    const freq = Math.round((wobbleBaseFreq + offset) * 10000) / 10000;
    turbEl.setAttribute("baseFrequency", String(freq));
}

watch(boilFrame, applyBoilFrame);
watch(wobbleFrame, applyWobbleFrame);

onMounted(() => {
    requestAnimationFrame(() => {
        applyBoilFrame(boilFrame.value);
        applyWobbleFrame(wobbleFrame.value);
    });
});
</script>

<template>
    <svg
        ref="svgRef"
        width="0"
        height="0"
        style="position: absolute; pointer-events: none"
        aria-hidden="true"
    >
        <defs>
            <!-- Title boil: animated wobble displacement for main heading. -->
            <filter
                id="title-boil"
                filterUnits="objectBoundingBox"
                x="-5%"
                y="-5%"
                width="110%"
                height="110%"
                color-interpolation-filters="sRGB"
            >
                <feTurbulence
                    type="turbulence"
                    baseFrequency="0.015"
                    numOctaves="2"
                    result="turbulence"
                    stitchTiles="noStitch"
                />
                <feDisplacementMap
                    in="SourceGraphic"
                    in2="turbulence"
                    scale="3"
                    xChannelSelector="R"
                    yChannelSelector="G"
                />
            </filter>

            <!-- Wobble-celestial: boil effect for dark mode toggle (sun/moon).
                 useLineBoil oscillates baseFrequency at ~6fps for hand-drawn wobble. -->
            <filter
                id="wobble-celestial"
                filterUnits="objectBoundingBox"
                x="-10%"
                y="-10%"
                width="120%"
                height="120%"
                color-interpolation-filters="sRGB"
            >
                <feTurbulence
                    type="turbulence"
                    baseFrequency="0.02"
                    numOctaves="3"
                    result="turbulence"
                    stitchTiles="noStitch"
                />
                <feDisplacementMap
                    in="SourceGraphic"
                    in2="turbulence"
                    scale="4"
                    xChannelSelector="R"
                    yChannelSelector="G"
                />
            </filter>

            <!-- Paper grain: static fractal noise overlay -->
            <filter
                id="paper-grain"
                x="0"
                y="0"
                width="100%"
                height="100%"
                color-interpolation-filters="sRGB"
            >
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.65"
                    numOctaves="4"
                    stitchTiles="stitch"
                    result="grain"
                />
                <feColorMatrix
                    type="saturate"
                    values="0"
                    result="desaturated"
                />
                <feBlend
                    in="SourceGraphic"
                    in2="desaturated"
                    mode="multiply"
                />
            </filter>

            <!-- Gentle static grain for canvas/visualization area -->
            <filter
                id="canvas-grain"
                x="0"
                y="0"
                width="100%"
                height="100%"
                color-interpolation-filters="sRGB"
            >
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.8"
                    numOctaves="3"
                    stitchTiles="stitch"
                    result="grain"
                />
                <feColorMatrix
                    type="saturate"
                    values="0"
                    result="desaturated"
                />
                <feBlend
                    in="SourceGraphic"
                    in2="desaturated"
                    mode="multiply"
                    result="grained"
                />
            </filter>
        </defs>
    </svg>
</template>
