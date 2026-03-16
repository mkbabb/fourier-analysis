<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { BasisComponent } from "@/lib/types";

const props = withDefaults(defineProps<{
    components: BasisComponent[];
    activeIndices?: Set<number>;
    maxBars?: number;
    logScale?: boolean;
}>(), {
    maxBars: 60,
    logScale: false,
});

const emit = defineEmits<{
    "toggle-harmonic": [index: number];
    "hover-harmonic": [index: number | null];
}>();

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
        const isActive = !props.activeIndices || props.activeIndices.has(comp.index);
        const isHovered = hoveredBar.value === i;

        const x = startX + i * (BAR_W + BAR_GAP);
        const frac = barFraction(comp.amplitude);
        const barH = frac * plotH;
        const y = pad.top + plotH - barH;
        const color = spectrumColor(i, n);

        ctx.globalAlpha = isActive ? (isHovered ? 1.0 : 0.85) : 0.25;

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
        ctx.globalAlpha = isActive ? 0.5 : 0.2;
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

function onMouseMove(e: MouseEvent) {
    const idx = hitTest(e.clientX);
    if (idx !== hoveredBar.value) {
        hoveredBar.value = idx;
        emit("hover-harmonic", idx !== null ? displayComponents.value[idx].index : null);
        const rect = scrollRef.value!.getBoundingClientRect();
        tooltipPos.value = { x: e.clientX - rect.left + scrollRef.value!.scrollLeft, y: e.clientY - rect.top };
        draw();
    }
}

function onMouseLeave() {
    if (hoveredBar.value !== null) {
        hoveredBar.value = null;
        emit("hover-harmonic", null);
        draw();
    }
}

function onClick() {
    if (hoveredBar.value !== null) {
        emit("toggle-harmonic", displayComponents.value[hoveredBar.value].index);
    }
}

watch(() => [props.components, props.logScale, props.maxBars, props.activeIndices], () => draw(), { deep: true });

onMounted(() => draw());
</script>

<template>
    <div
        ref="scrollRef"
        class="overflow-x-auto overflow-y-hidden scrollbar-thin"
        :style="{ height: `${HEIGHT}px` }"
    >
        <canvas
            ref="canvasRef"
            class="block cursor-pointer text-muted-foreground"
            @mousemove="onMouseMove"
            @mouseleave="onMouseLeave"
            @click="onClick"
        />
        <!-- Tooltip -->
        <div
            v-if="hoveredBar !== null && displayComponents[hoveredBar]"
            class="absolute z-20 px-2 py-1.5 rounded-lg text-xs whitespace-nowrap
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
            <div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10px]">
                <span class="text-muted-foreground">Amplitude</span>
                <span class="fira-code">{{ displayComponents[hoveredBar].amplitude.toFixed(4) }}</span>
                <span class="text-muted-foreground">Phase</span>
                <span class="fira-code">{{ (displayComponents[hoveredBar].phase * 180 / Math.PI).toFixed(1) }}°</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.scrollbar-thin {
    scrollbar-width: thin;
    position: relative;
}
.scrollbar-thin::-webkit-scrollbar {
    height: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
    background: hsl(var(--border));
    border-radius: 2px;
}
</style>
