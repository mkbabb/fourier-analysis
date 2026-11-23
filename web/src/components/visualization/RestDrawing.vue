<script setup lang="ts">
/**
 * The visualizer's stage at rest (FORTY-SIXTH B, owner, 23 Nov: "this should be
 * a procedural animation of different curves, shapes, and be interactive").
 *
 * One canvas draws a family of closed curves in circles (`@/lib/hero/shapes`),
 * opening on the sun the stage always drew. Every shape is a spectrum over the
 * same band, so one becomes the next in its coefficients (`morphSpectra`): the
 * old detail goes into one circle the size of both shapes, the new detail grows
 * out of it, while the number of terms falls to one pair and rises to the new
 * shape's own, fractional so no circle pops. The line is the current spectrum's
 * last turn, inked from the pen back, so the stage is never blank and never
 * holds a ghost of the old shape. The chain is in frequency order, so a morph
 * never reorders it.
 *
 * The hand: hovering near the line rings the point a press would take; a drag
 * pulls the curve (the point under the hand follows it 1:1, a smooth bump held
 * to sixteen terms) and it springs back carrying the release's speed; a click
 * or tap deals the next shape at once; the wheel or a pinch sets the number of
 * terms ("n = 12" at the drawing's corner while it changes); two fingers turn
 * it. The keyboard does all of it: ← → shapes, ↑ ↓ one term, Space pauses
 * (WCAG 2.2.2: it moves beside other content for more than five seconds).
 *
 * Reduced motion: the still drawing, the whole line and the chain at rest, and
 * nothing moves on its own; a tap or an arrow changes the shape by a 150 ms
 * fade, the pull follows the hand and returns by a 150 ms ease, terms change
 * directly. The loop runs only while the stage is on screen and the page
 * visible (`frameLoop`); the release spring is keyframes' `SpringProgress` and
 * the hand's speed glass's `usePointerVelocityField`, both stepped by this
 * loop. It stands above the invitation (beside it on a short landscape stage),
 * never under its words.
 */
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { alignStart, chainAt, circleBetween, frameLoop, morphSpectra, partialSum, weight, type FrameLoop, type Spectrum } from "@mkbabb/fourier";
import { SpringProgress } from "@mkbabb/keyframes.js";
import { usePointerVelocityField } from "@mkbabb/glass-ui";
import { useGlobalDark } from "@mkbabb/glass-ui/dark";
import { BAND, OWN_TERMS_CAP, createDeck, freq, visitSeed, type HeroShape } from "@/lib/hero/shapes";

const TAU = 2 * Math.PI;
/** Values in a spectrum over the band. */
const LEN = 2 * (2 * BAND + 1);
/** Samples of the whole curve per frame (one inverse FFT). */
const M = 512;
/** The pen goes once round in this long; a shape stays this many turns. */
const TURN_MS = 7000;
const DWELL_TURNS = 1.25;
const MORPH_MS = 1800;
/** Reduced motion: a shape changes by this fade, a pull returns by this ease. */
const FADE_MS = 150;
/** The circles drawn, and the vectors the arms run through before the pen. */
const CIRCLES = 28;
const ARMS = 40;
/** The drawing's radius as a share of the stage's shorter side. */
const REACH = 0.43;
/** A press within this far of the line takes hold of it; a click moves less than this. */
const NEAR_PX = 48;
const CLICK_PX = 6;
const CLICK_MS = 350;
/** The pull: a smooth bump this wide (a share of the turn), held to these terms. */
const PULL_WIDTH = 0.06;
const PULL_BAND = 16;
/** The number-of-terms readout stays this long after the last change. */
const READOUT_MS = 1200;
/** Ink: circles, arms, and the line from its far end to the pen. */
const CIRCLE_INK = 0.1;
const ARM_INK = 0.3;
const LINE_FAR = 0.24;
const LINE_NEAR = 0.94;
const LINE_SEGMENTS = 26;

const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
const { isDark } = useGlobalDark();

const host = useTemplateRef<HTMLDivElement>("host");
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");

const deck = createDeck(visitSeed());
/** The shape on the stage, or arriving on it. */
const shape = ref<HeroShape>(deck.current);
/** What the canvas draws now, for its readers: a shape's key, or "morph". */
const drawing = ref<string>(deck.current.key);
const paused = ref(false);
const readoutN = ref(0);
const readoutShown = ref(false);
const circlesDrawn = ref(0);
const label = computed(() => `A drawing in circles: ${shape.value.label}`);

// ── state (plain, not reactive: the loop reads and writes it every frame) ──

/** The spectrum at this moment (unweighted), and the drawn one (weighted, pulled, turned). */
const live = new Float64Array(LEN);
const drawn = new Float64Array(LEN);
const drawnS: Spectrum = { c: drawn };
const pts = new Float64Array(2 * M);
const scratch = { re: new Float64Array(M), im: new Float64Array(M) };
const joints = new Float64Array(2 * (LEN / 2 + 1));
live.set(deck.current.spectrum.c);

interface Morph {
    from: Spectrum;
    circle: Spectrum;
    to: Spectrum;
    fromN: number;
    toN: number;
    ms: number;
}
let morph: Morph | null = null;
/** The visitor's own number of terms (null: the shape's own). */
let visitorN: number | null = null;
let level = deck.current.n;
/** The pen's place (turns), the turns this shape has stood, and how much of the line is written. */
let pen = 0;
let dwell = 0;
let written = 0;

interface Pull {
    theta: number;
    /** The displacement at full strength (shape units), and its strength now. */
    dx: number;
    dy: number;
    amp: number;
    held: boolean;
    pointer: number;
    /** Reduced motion's return: ms into the ease (−1 while held). */
    easeMs: number;
}
let pull: Pull | null = null;
const pullSpring = new SpringProgress({ response: 0.55, dampingFraction: 0.86 });
/** Two fingers' turn of the whole drawing (radians), and its return. */
let twist = 0;
let twistHeld = false;
const twistSpring = new SpringProgress({ response: 0.55, dampingFraction: 0.86 });
const field = usePointerVelocityField();

let hover: { x: number; y: number; near: number } | null = null;
let readoutUntil = 0;
/** Reduced motion's fade between two still shapes: the old line and chain, and how far in. */
let fade: { pts: Float64Array; joints: Float64Array; vectors: number; ms: number } | null = null;

// ── the stage's size and inks ──

let W = 0;
let H = 0;
let dpr = 1;
const R = () => Math.min(W, H) * REACH;
const sx = (x: number) => W / 2 + x * R();
const sy = (y: number) => H / 2 - y * R();

type Rgb = [number, number, number];
let amber: Rgb = [176, 122, 45];
let ink: Rgb = [28, 25, 23];
let inkFrom: { amber: Rgb; ink: Rgb; ms: number } | null = null;
let probe: CanvasRenderingContext2D | null = null;
/** A CSS colour as the canvas paints it. */
function rgbOf(css: string, fallback: Rgb): Rgb {
    probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!probe || !css) return fallback;
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = "#000";
    probe.fillStyle = css;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    return [r!, g!, b!];
}
function readInks(): { amber: Rgb; ink: Rgb } {
    const cs = getComputedStyle(host.value!);
    return { amber: rgbOf(cs.getPropertyValue("--viz-amber").trim(), amber), ink: rgbOf(cs.getPropertyValue("--foreground").trim(), ink) };
}
const mix = (a: Rgb, b: Rgb, s: number): Rgb => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
const css = (c: Rgb, alpha: number) => `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${alpha})`;

function size(): void {
    const el = canvas.value;
    if (!el) return;
    const box = el.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = box.width;
    H = box.height;
    host.value?.style.setProperty("--hero-reach", `${R()}px`);
    el.width = Math.max(1, Math.round(W * dpr));
    el.height = Math.max(1, Math.round(H * dpr));
}

// ── composing the drawn spectrum ──

const cubicOut = (x: number) => 1 - (1 - x) ** 3;
const smooth = (x: number) => x * x * (3 - 2 * x);

/** The gain per term of a pull's bump, so the point under the hand moves exactly with it. */
const pullGain = (() => {
    const g = new Float64Array(PULL_BAND + 1);
    let peak = 0;
    for (let k = -PULL_BAND; k <= PULL_BAND; k++) peak += Math.exp(-((Math.PI * PULL_WIDTH * k) ** 2));
    for (let k = 0; k <= PULL_BAND; k++) g[k] = Math.exp(-((Math.PI * PULL_WIDTH * k) ** 2)) / peak;
    return g;
})();

/** The live spectrum at `level` terms, the pull added, the twist applied: into `drawn`. */
function compose(withPull = true): void {
    const ct = Math.cos(twist);
    const st = Math.sin(twist);
    const p = withPull && pull && Math.abs(pull.amp) > 1e-5 ? pull : null;
    for (let j = 0; 2 * j + 1 < LEN; j++) {
        const k = freq(j);
        const w = k === 0 ? 1 : weight(k, level);
        let re = live[2 * j]! * w;
        let im = live[2 * j + 1]! * w;
        if (p && Math.abs(k) <= PULL_BAND) {
            // d · gain_k · e^{−2πikθ0}: a bump at θ0 whose peak is exactly d.
            const g = pullGain[Math.abs(k)]! * p.amp;
            const a = -TAU * k * p.theta;
            const ca = Math.cos(a);
            const sa = Math.sin(a);
            re += g * (p.dx * ca - p.dy * sa);
            im += g * (p.dx * sa + p.dy * ca);
        }
        drawn[2 * j] = re * ct - im * st;
        drawn[2 * j + 1] = re * st + im * ct;
    }
}

/** The drawn curve at θ, directly (the pen, and a press's nearest point). */
function pointAt(theta: number, band: number): [number, number] {
    let x = 0;
    let y = 0;
    const top = Math.min(BAND, band);
    for (let j = 0; j <= 2 * top; j++) {
        const a = TAU * freq(j) * theta;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        x += drawn[2 * j]! * ca - drawn[2 * j + 1]! * sa;
        y += drawn[2 * j]! * sa + drawn[2 * j + 1]! * ca;
    }
    return [x, y];
}
const bandNow = () => Math.max(Math.ceil(level), pull ? PULL_BAND : 0);

// ── drawing ──

function strokeArc(ctx: CanvasRenderingContext2D, from: number, to: number, alpha: number, color: Rgb): void {
    // The curve's samples between parameters `from` and `to` (turns, from < to).
    ctx.strokeStyle = css(color, alpha);
    ctx.beginPath();
    const j0 = Math.ceil(from * M);
    const j1 = Math.floor(to * M);
    const at = (j: number) => {
        const i = ((j % M) + M) % M;
        return [sx(pts[2 * i]!), sy(pts[2 * i + 1]!)] as const;
    };
    const first = at(j0);
    ctx.moveTo(first[0], first[1]);
    for (let j = j0 + 1; j <= j1; j++) {
        const p = at(j);
        ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
}

/** A chain's circles and arms at `alpha`; returns its circles (one per vector past the centre). */
function drawChain(ctx: CanvasRenderingContext2D, j: Float64Array, vectors: number, alpha: number, color: Rgb): number {
    const circles = Math.max(0, Math.min(vectors, CIRCLES + 1) - 1);
    ctx.lineWidth = 1;
    ctx.strokeStyle = css(color, CIRCLE_INK * alpha);
    for (let v = 1; v <= circles; v++) {
        const cx = sx(j[2 * v]!);
        const cy = sy(j[2 * v + 1]!);
        const r = Math.hypot(sx(j[2 * v + 2]!) - cx, sy(j[2 * v + 3]!) - cy);
        // A circle under a pixel across paints nothing.
        if (r < 0.8) continue;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.stroke();
    }
    ctx.strokeStyle = css(color, ARM_INK * alpha);
    ctx.beginPath();
    ctx.moveTo(sx(j[2]!), sy(j[3]!));
    const arms = Math.min(vectors, ARMS);
    for (let v = 2; v <= arms; v++) ctx.lineTo(sx(j[2 * v]!), sy(j[2 * v + 1]!));
    ctx.lineTo(sx(j[2 * vectors]!), sy(j[2 * vectors + 1]!));
    ctx.stroke();
    return circles;
}

function draw(): void {
    const el = canvas.value;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || !W || !H) return;
    const inks = inkFrom ? { a: mix(inkFrom.amber, amber, smooth(Math.min(1, inkFrom.ms / 300))), i: mix(inkFrom.ink, ink, smooth(Math.min(1, inkFrom.ms / 300))) } : { a: amber, i: ink };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    compose();
    partialSum(drawnS, BAND, M, scratch, pts);
    const still = reduce.value;
    const theta = still ? 0 : pen % 1;
    const band = bandNow();
    const vectors = Math.min(2 * band + 1, LEN / 2);
    chainAt(drawnS, theta, vectors, { order: "frequency", out: joints });
    const penX = joints[2 * vectors]!;
    const penY = joints[2 * vectors + 1]!;

    // The line.
    ctx.lineWidth = 1.75;
    const whole = fade ? smooth(Math.min(1, fade.ms / FADE_MS)) : 1;
    if (still) {
        if (fade) {
            // The old shape out as the new one comes in.
            const old = fade.pts;
            ctx.strokeStyle = css(inks.a, 0.8 * (1 - whole));
            ctx.beginPath();
            for (let j = 0; j <= M; j++) {
                const i = j % M;
                if (j) ctx.lineTo(sx(old[2 * i]!), sy(old[2 * i + 1]!));
                else ctx.moveTo(sx(old[0]!), sy(old[1]!));
            }
            ctx.stroke();
        }
        strokeArc(ctx, 0, 1, 0.8 * whole, inks.a);
    } else {
        // The last turn from the pen back, its ink rising toward the pen;
        // on the first turn it writes itself in.
        const span = Math.min(0.995, written);
        for (let g = 0; g < LINE_SEGMENTS; g++) {
            const a0 = theta - span * (1 - g / LINE_SEGMENTS);
            const a1 = theta - span * (1 - (g + 1) / LINE_SEGMENTS);
            const s = (g + 1) / LINE_SEGMENTS;
            strokeArc(ctx, a0, a1 + 0.5 / M, LINE_FAR + (LINE_NEAR - LINE_FAR) * s * s, inks.a);
        }
        // The last sample to the pen itself.
        const last = Math.floor(theta * M);
        ctx.strokeStyle = css(inks.a, LINE_NEAR);
        ctx.beginPath();
        const i = ((last % M) + M) % M;
        ctx.moveTo(sx(pts[2 * i]!), sy(pts[2 * i + 1]!));
        ctx.lineTo(sx(penX), sy(penY));
        ctx.stroke();
    }

    // The chain: its circles, its arms, the pen (the old one fading out under reduced motion).
    if (fade) drawChain(ctx, fade.joints, fade.vectors, 1 - whole, inks.i);
    const circles = drawChain(ctx, joints, vectors, whole, inks.i);
    if (circles !== circlesDrawn.value) circlesDrawn.value = circles;
    if (!still) {
        ctx.fillStyle = css(inks.a, 1);
        ctx.beginPath();
        ctx.arc(sx(penX), sy(penY), 2.6, 0, TAU);
        ctx.fill();
    }

    // Intent: the ring where a press would take hold; the held point.
    if (pull && Math.abs(pull.amp) > 0.02) {
        const [px, py] = pointAt(pull.theta, band);
        ctx.fillStyle = css(inks.a, 1);
        ctx.beginPath();
        ctx.arc(sx(px), sy(py), 5, 0, TAU);
        ctx.fill();
    } else if (hover && hover.near > 0) {
        ctx.strokeStyle = css(inks.a, 0.9 * hover.near);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(hover.x, hover.y, 6, 0, TAU);
        ctx.stroke();
    }

    const now = morph ? "morph" : shape.value.key;
    if (drawing.value !== now) drawing.value = now;
}

// ── the clock ──

function advance(to: HeroShape): void {
    // From wherever the drawing stands, toward the next (a tap mid-morph turns it).
    shape.value = to;
    visitorN = null;
    dwell = 0;
    if (reduce.value) {
        fade = { pts: pts.slice(), joints: joints.slice(), vectors: Math.min(2 * bandNow() + 1, LEN / 2), ms: 0 };
        morph = null;
        live.set(to.spectrum.c);
        level = to.n;
        kick();
        return;
    }
    const from: Spectrum = { c: live.slice() };
    const aligned = alignStart(from, to.spectrum);
    morph = { from, circle: circleBetween(from, aligned), to: aligned, fromN: level, toN: to.n, ms: 0 };
    kick();
}
const next = () => advance(deck.next());
const prev = () => advance(deck.prev());

function stepMorph(dt: number): void {
    if (!morph) return;
    morph.ms += dt;
    const s = Math.min(1, morph.ms / MORPH_MS);
    if (s <= 0.5) {
        const e = smooth(s / 0.5);
        morphSpectra(morph.from, morph.circle, e, live);
        level = morph.fromN + (1 - morph.fromN) * e;
    } else {
        const e = smooth((s - 0.5) / 0.5);
        morphSpectra(morph.circle, morph.to, e, live);
        level = 1 + (morph.toN - 1) * e;
    }
    if (s >= 1) {
        live.set(morph.to.c);
        level = morph.toN;
        morph = null;
    }
}

function stepPull(dt: number): void {
    if (!pull || pull.held) return;
    if (reduce.value) {
        pull.easeMs += dt;
        pull.amp = 1 - cubicOut(Math.min(1, pull.easeMs / FADE_MS));
        if (pull.easeMs >= FADE_MS) pull = null;
        return;
    }
    pull.amp = pullSpring.tickDt(dt);
    if (pullSpring.settled) pull = null;
}

function stepTwist(dt: number): void {
    if (twistHeld || twist === 0) return;
    if (reduce.value) {
        twist = 0;
        return;
    }
    twist = twistSpring.tickDt(dt);
    if (twistSpring.settled) twist = 0;
}

/** Whether anything still moves (the loop stops when nothing does). */
function moving(): boolean {
    if (fade || inkFrom || morph || pull || twist !== 0 || readoutShown.value) return true;
    return !reduce.value && !paused.value;
}

function tick(dt: number, now: number): boolean {
    field.tick(dt);
    if (!reduce.value && !paused.value) {
        pen += dt / TURN_MS;
        written += dt / TURN_MS;
        if (!morph && !pull) {
            dwell += dt / TURN_MS;
            if (dwell >= DWELL_TURNS) next();
        }
    }
    stepMorph(dt);
    stepPull(dt);
    stepTwist(dt);
    if (fade) {
        fade.ms += dt;
        if (fade.ms >= FADE_MS) fade = null;
    }
    if (inkFrom) {
        inkFrom.ms += dt;
        if (inkFrom.ms >= 300) inkFrom = null;
    }
    if (readoutShown.value && now > readoutUntil) readoutShown.value = false;
    draw();
    return moving();
}

let loop: FrameLoop | null = null;
/** Run the loop (it stops itself when nothing moves), or draw once. */
function kick(): void {
    if (loop) loop.start();
    else draw();
}

// ── the hand ──

/** Pointer position in the canvas's CSS pixels. */
function local(e: PointerEvent | WheelEvent): [number, number] {
    const box = canvas.value!.getBoundingClientRect();
    return [e.clientX - box.left, e.clientY - box.top];
}

/** The nearest point of the line to (x, y) in CSS pixels: its parameter and distance. */
function nearest(x: number, y: number): { theta: number; dist: number; px: number; py: number } {
    compose(false);
    partialSum(drawnS, BAND, M, scratch, pts);
    let best = 0;
    let bd = Infinity;
    for (let j = 0; j < M; j++) {
        const d = (sx(pts[2 * j]!) - x) ** 2 + (sy(pts[2 * j + 1]!) - y) ** 2;
        if (d < bd) {
            bd = d;
            best = j;
        }
    }
    // Refine between the neighbouring samples (golden section).
    const band = Math.ceil(level);
    const dist = (t: number) => {
        const [px, py] = pointAt(t, band);
        return (sx(px) - x) ** 2 + (sy(py) - y) ** 2;
    };
    let lo = (best - 1) / M;
    let hi = (best + 1) / M;
    const g = (Math.sqrt(5) - 1) / 2;
    for (let it = 0; it < 20; it++) {
        const m1 = hi - g * (hi - lo);
        const m2 = lo + g * (hi - lo);
        if (dist(m1) <= dist(m2)) hi = m2;
        else lo = m1;
    }
    const theta = (((lo + hi) / 2) % 1 + 1) % 1;
    const [px, py] = pointAt(theta, band);
    return { theta, dist: Math.sqrt(dist(theta)), px: sx(px), py: sy(py) };
}

const pointers = new Map<number, { x: number; y: number }>();
let press: { x: number; y: number; at: number; moved: boolean; id: number } | null = null;
let pinch: { dist: number; angle: number; n: number; twist: number } | null = null;

function pinchFrame(): { dist: number; angle: number } | null {
    if (pointers.size < 2) return null;
    const [a, b] = [...pointers.values()];
    return { dist: Math.hypot(b!.x - a!.x, b!.y - a!.y), angle: Math.atan2(b!.y - a!.y, b!.x - a!.x) };
}

function onPointerDown(e: PointerEvent): void {
    const [x, y] = local(e);
    pointers.set(e.pointerId, { x, y });
    canvas.value?.setPointerCapture(e.pointerId);
    field.setActive(true);
    if (pointers.size === 2) {
        // Two fingers: no pull, no tap; a pinch sets the terms, a turn turns it.
        releasePull();
        press = null;
        const f = pinchFrame()!;
        pinch = { ...f, n: visitorN ?? level, twist };
        twistHeld = true;
        return;
    }
    if (pointers.size > 2) return;
    press = { x, y, at: performance.now(), moved: false, id: e.pointerId };
    const hit = nearest(x, y);
    if (hit.dist < NEAR_PX) {
        pull = { theta: hit.theta, dx: 0, dy: 0, amp: 1, held: true, pointer: e.pointerId, easeMs: -1 };
        pullSpring.reset(1, 0);
        hover = null;
    }
    kick();
}

function onPointerMove(e: PointerEvent): void {
    const [x, y] = local(e);
    if (W && H) field.setPointer(x / W, y / H);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x, y });
    if (pinch) {
        const f = pinchFrame();
        if (!f) return;
        setTerms((pinch.n * f.dist) / Math.max(1, pinch.dist));
        twist = pinch.twist - (f.angle - pinch.angle);
        kick();
        return;
    }
    if (press && press.id === e.pointerId) {
        if (Math.hypot(x - press.x, y - press.y) > CLICK_PX) press.moved = true;
        if (pull?.held) {
            pull.dx = (x - press.x) / R();
            pull.dy = -(y - press.y) / R();
            kick();
        }
        return;
    }
    if (e.pointerType === "touch") return;
    const hit = nearest(x, y);
    hover = { x: hit.px, y: hit.py, near: Math.max(0, 1 - hit.dist / NEAR_PX) };
    canvas.value!.style.cursor = hover.near > 0 ? "grab" : "pointer";
    kick();
}

function releasePull(): void {
    if (!pull?.held) return;
    pull.held = false;
    if (reduce.value) {
        pull.easeMs = 0;
        return;
    }
    // The release's speed along the pull carries into the spring.
    const v = field.velocity.value;
    const vx = (v.x * W) / R();
    const vy = (-v.y * H) / R();
    const d2 = pull.dx ** 2 + pull.dy ** 2;
    pullSpring.reset(1, d2 > 1e-9 ? (vx * pull.dx + vy * pull.dy) / d2 : 0);
    pullSpring.target = 0;
}

function onPointerUp(e: PointerEvent): void {
    pointers.delete(e.pointerId);
    if (pinch) {
        if (pointers.size < 2) {
            pinch = null;
            twistHeld = false;
            twistSpring.reset(twist, 0);
            twistSpring.target = 0;
            kick();
        }
        return;
    }
    if (!pointers.size) field.setActive(false);
    if (!press || press.id !== e.pointerId) return;
    const tap = !press.moved && performance.now() - press.at < CLICK_MS && e.type === "pointerup";
    press = null;
    if (pull?.held) releasePull();
    if (tap) next();
    kick();
}

function onPointerLeave(): void {
    if (hover) {
        hover = null;
        kick();
    }
}

function setTerms(n: number): void {
    const cap = Math.min(BAND, Math.max(OWN_TERMS_CAP, 2 * shape.value.n));
    visitorN = Math.min(cap, Math.max(1, n));
    if (!morph) level = visitorN;
    readoutN.value = Math.round(visitorN);
    readoutShown.value = true;
    readoutUntil = performance.now() + READOUT_MS;
    kick();
}

function onWheel(e: WheelEvent): void {
    e.preventDefault();
    setTerms((visitorN ?? level) * Math.exp(-e.deltaY * 0.002));
}

function onKey(e: KeyboardEvent): void {
    if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowUp" || e.key === "+") setTerms(Math.round(visitorN ?? level) + 1);
    else if (e.key === "ArrowDown" || e.key === "-") setTerms(Math.round(visitorN ?? level) - 1);
    else if (e.key === " ") {
        paused.value = !paused.value;
        kick();
    } else return;
    e.preventDefault();
}

// ── lifecycle ──

let resize: ResizeObserver | null = null;
onMounted(() => {
    if (!canvas.value) return;
    ({ amber, ink } = readInks());
    size();
    resize = new ResizeObserver(() => {
        size();
        draw();
    });
    resize.observe(canvas.value);
    loop = frameLoop(canvas.value, tick);
    if (reduce.value) {
        written = 1;
        draw();
    } else loop.start();
});

// A theme flip: the inks go to the new theme's over the page's own fade.
watch(isDark, () => {
    if (!host.value) return;
    requestAnimationFrame(() => {
        const was = { amber, ink };
        ({ amber, ink } = readInks());
        inkFrom = { ...was, ms: 0 };
        kick();
    });
});

watch(reduce, (still) => {
    morph = null;
    fade = null;
    live.set(shape.value.spectrum.c);
    level = shape.value.n;
    if (still) written = 1;
    kick();
});

onBeforeUnmount(() => {
    loop?.dispose();
    resize?.disconnect();
    pullSpring.dispose();
    twistSpring.dispose();
});
</script>

<template>
    <div ref="host" class="rest-drawing">
        <canvas
            ref="canvas"
            class="rest-canvas"
            tabindex="0"
            role="img"
            :aria-label="label"
            aria-roledescription="drawing"
            aria-describedby="rest-drawing-keys"
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Space"
            :data-shape="shape.key"
            :data-drawing="drawing"
            :data-circles="circlesDrawn"
            :data-paused="paused || undefined"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @pointerleave="onPointerLeave"
            @wheel="onWheel"
            @keydown="onKey"
        />
        <span id="rest-drawing-keys" class="sr-only">Left and right arrows change the shape, up and down the number of circles; Space pauses.</span>
        <span class="rest-terms font-serif-math" :class="{ shown: readoutShown }" aria-live="polite">n = {{ readoutN }}</span>
    </div>
</template>

<style scoped>
/* Its host sets its size and stacks it with the invitation (PR 33 review: the
   line ran through the title and the button); the drawing meets that box. */
.rest-drawing {
    position: relative;
    min-block-size: 0;
    min-inline-size: 0;
}
.rest-canvas {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    /* The empty stage does not scroll, so a swipe on it moves the drawing. */
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    border-radius: var(--radius-card, 0.75rem);
}
.rest-canvas:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: calc(-1 * var(--focus-ring-width));
}
/* "n = 12" at the drawing's lower right while the terms change (the drawing's
   reach, `--hero-reach`, is set with the canvas's size). */
.rest-terms {
    position: absolute;
    inset-inline-start: calc(50% + 0.72 * var(--hero-reach, 8rem));
    inset-block-start: calc(50% + 0.72 * var(--hero-reach, 8rem));
    white-space: nowrap;
    font-size: 15px;
    font-style: italic;
    color: var(--muted-foreground);
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--duration-slow) var(--ease-standard);
}
.rest-terms.shown {
    opacity: 1;
    transition-duration: var(--duration-fast);
}
@media (prefers-reduced-motion: reduce) {
    .rest-terms,
    .rest-terms.shown {
        transition-duration: 120ms;
    }
}
</style>
