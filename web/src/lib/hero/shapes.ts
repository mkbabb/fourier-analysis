/**
 * The visualizer's resting stage draws a family of closed curves in circles
 * (FORTY-SIXTH B: "this should be a procedural animation of different curves,
 * shapes, and be interactive"). Every shape is a spectrum over one band, c_k for
 * |k| ≤ `BAND`, centred, counter-clockwise and of unit reach at its own number
 * of terms, so a morph between two is a morph of their circles.
 *
 * The shapes: roses, Lissajous figures, superformula shapes, hypotrochoids, a
 * heart and stars, generated here; and the site's own drawings (the theme
 * seat's sun and moon, the five section outlines), precomputed as spectra by
 * `scripts/precompute_hero.py`. The deck opens on the sun (the stage's drawing
 * until now), then deals a shuffle seeded per visit: never the same family
 * twice running, a site drawing every third card, each card's parameters drawn
 * from its family's set, so it never repeats exactly.
 */
import { partialSum, resampleArcLength, spectrumOf, type Spectrum } from "@mkbabb/fourier";
import SITE from "@/assets/hero-spectra.json";

/** The band every shape lives in. */
export const BAND = 160;
/** A shape's own number of terms holds this share of its band's energy... */
const ENERGY = 0.9995;
/** ...and never more than this many. */
export const OWN_TERMS_CAP = 48;

export type Family = "site" | "rose" | "lissajous" | "superformula" | "hypotrochoid" | "heart" | "star";

export interface HeroShape {
    /** Unique per card: the family and its parameters. */
    key: string;
    family: Family;
    /** What is drawn, in words (the drawing's accessible name). */
    label: string;
    spectrum: Spectrum;
    /** Its own number of terms: the fewest holding `ENERGY` of the band. */
    n: number;
}

const TAU = 2 * Math.PI;
const WORDS: Record<number, string> = { 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 12: "twelve" };

/** The frequency stored at pair slot `j` (0, +1, −1, +2, −2, ...). */
const freq = (j: number): number => (j === 0 ? 0 : j % 2 ? (j + 1) / 2 : -j / 2);

/**
 * Centre `c`, turn it counter-clockwise, find its own number of terms and
 * scale it to unit reach there. In place; returns the number of terms.
 */
export function normalise(c: Float64Array): number {
    c[0] = 0;
    c[1] = 0;
    const pairs = c.length >> 1;
    const top = (pairs - 1) >> 1;
    const e = (j: number) => c[2 * j]! ** 2 + c[2 * j + 1]! ** 2;
    let area = 0;
    for (let k = 1; k <= top; k++) area += k * (e(2 * k - 1) - e(2 * k));
    if (area < 0) {
        // z(−θ): the same curve the other way round.
        for (let k = 1; k <= top; k++) {
            for (const d of [0, 1]) {
                const a = 2 * (2 * k - 1) + d;
                const b = 2 * (2 * k) + d;
                const t = c[a]!;
                c[a] = c[b]!;
                c[b] = t;
            }
        }
    }
    let total = 0;
    for (let j = 1; j < pairs; j++) total += e(j);
    let acc = 0;
    let n = 1;
    for (let k = 1; k <= top; k++) {
        acc += e(2 * k - 1) + e(2 * k);
        n = k;
        if (acc >= total * ENERGY) break;
    }
    n = Math.min(OWN_TERMS_CAP, Math.max(1, n));
    const pts = partialSum({ c }, n, 512);
    let reach = 0;
    for (let j = 0; j < pts.length; j += 2) reach = Math.max(reach, Math.hypot(pts[j]!, pts[j + 1]!));
    if (reach > 0) for (let i = 0; i < c.length; i++) c[i]! /= reach;
    return n;
}

/** A closed curve, `fn(u)` for u in [0, 1), as its spectrum over the band. */
function traced(fn: (u: number) => [number, number], m = 2048): Float64Array {
    const pts = new Float64Array(2 * m);
    for (let j = 0; j < m; j++) [pts[2 * j], pts[2 * j + 1]] = fn(j / m);
    return spectrumOf(resampleArcLength(pts, 1024), BAND).c;
}

/** A polygon's vertices `[x0, y0, ...]` as its spectrum over the band. */
function polygon(vertices: number[]): Float64Array {
    return spectrumOf(resampleArcLength(Float64Array.from(vertices), 1024), BAND).c;
}

function shape(key: string, family: Family, label: string, c: Float64Array): HeroShape {
    const n = normalise(c);
    return { key, family, label, spectrum: { c }, n };
}

// ── the generated families, each with the parameter sets it draws from ──

interface Card {
    key: string;
    family: Family;
    build: () => HeroShape;
}

function rose(k: number): Card {
    // r = cos kθ closes over half a turn when k is odd (k petals), a whole turn when even (2k).
    const petals = k % 2 ? k : 2 * k;
    const span = k % 2 ? Math.PI : TAU;
    const key = `rose-${k}`;
    return {
        key,
        family: "rose",
        build: () =>
            shape(key, "rose", `a rose with ${WORDS[petals] ?? petals} petals`, traced((u) => {
                const th = span * u;
                const r = Math.cos(k * th);
                return [r * Math.cos(th), r * Math.sin(th)];
            })),
    };
}

function lissajous(a: number, b: number, delta: number): Card {
    const key = `lissajous-${a}-${b}-${delta === Math.PI / 2 ? "q" : "e"}`;
    return {
        key,
        family: "lissajous",
        build: () => shape(key, "lissajous", `a Lissajous figure, ${a} to ${b}`, traced((u) => [Math.sin(a * TAU * u + delta), Math.sin(b * TAU * u)])),
    };
}

function superformula(m: number, n1: number, n2: number, n3: number): Card {
    const key = `superformula-${m}-${n1}`;
    return {
        key,
        family: "superformula",
        build: () =>
            shape(key, "superformula", `a superformula shape with ${WORDS[m] ?? m} lobes`, traced((u) => {
                const p = TAU * u;
                const r = (Math.abs(Math.cos((m * p) / 4)) ** n2 + Math.abs(Math.sin((m * p) / 4)) ** n3) ** (-1 / n1);
                return [r * Math.cos(p), r * Math.sin(p)];
            })),
    };
}

function hypotrochoid(R: number, r: number, d: number): Card {
    const key = `hypotrochoid-${R}-${r}`;
    return {
        key,
        family: "hypotrochoid",
        build: () =>
            shape(key, "hypotrochoid", `a spirograph curve, ${R} to ${r}`, traced((u) => {
                const t = TAU * u * r;
                return [(R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t), (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)];
            })),
    };
}

const heart: Card = {
    key: "heart",
    family: "heart",
    build: () =>
        shape("heart", "heart", "a heart", traced((u) => {
            const t = TAU * u;
            return [16 * Math.sin(t) ** 3, 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)];
        })),
};

function star(points: number, inner: number): Card {
    const key = `star-${points}`;
    return {
        key,
        family: "star",
        build: () => {
            const v: number[] = [];
            for (let i = 0; i < 2 * points; i++) {
                const a = Math.PI / 2 + (i * Math.PI) / points;
                const r = i % 2 ? inner : 1;
                v.push(r * Math.cos(a), r * Math.sin(a));
            }
            return shape(key, "star", `a ${WORDS[points]}-pointed star`, polygon(v));
        },
    };
}

/**
 * Each family's set. A Lissajous figure a : b with phase δ is left out where it
 * runs back along itself (an open arc twice over: 1 : 2, 3 : 2 and 5 : 2 at
 * π/4, 4 : 3 at π/2).
 */
const FAMILIES: Record<Exclude<Family, "site">, Card[]> = {
    rose: [3, 4, 5, 6, 7].map(rose),
    lissajous: [
        lissajous(3, 2, Math.PI / 2),
        lissajous(5, 4, Math.PI / 2),
        lissajous(5, 4, Math.PI / 4),
        lissajous(4, 3, Math.PI / 4),
        lissajous(5, 2, Math.PI / 2),
        lissajous(1, 2, Math.PI / 2),
    ],
    superformula: [superformula(5, 0.6, 1.4, 1.4), superformula(7, 1.2, 4, 4), superformula(4, 12, 15, 15), superformula(3, 4.5, 10, 10)],
    hypotrochoid: [hypotrochoid(5, 3, 1.4), hypotrochoid(3, 1, 1.6), hypotrochoid(4, 1, 1.5)],
    heart: [heart],
    star: [star(5, 0.42), star(6, 0.55)],
};

// ── the site's own drawings ──

const SITE_SPECTRA = SITE as Record<string, { label: string; c: number[] }>;

function site(name: string): Card {
    const key = `site-${name}`;
    return {
        key,
        family: "site",
        build: () => {
            const src = SITE_SPECTRA[name]!;
            const c = new Float64Array(2 * (2 * BAND + 1));
            c.set(src.c.slice(0, c.length));
            return shape(key, "site", src.label, c);
        },
    };
}

/** The deck's site drawings after the sun. */
const SITE_CARDS = ["moon", "gallery", "visualize", "paper", "equation", "morph", "sun"].map(site);

/** A small seeded generator (mulberry32), so a visit's order is its own. */
function seeded(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export interface Deck {
    /** The shape on the stage. */
    readonly current: HeroShape;
    /** Deal (or step forward to) the next shape and make it current. */
    next(): HeroShape;
    /** Step back to the shape before (a fresh one before the first). */
    prev(): HeroShape;
}

/** The deck for one visit: the sun first, then the seeded shuffle. */
export function createDeck(seed: number): Deck {
    const rand = seeded(seed);
    const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;
    const siteOrder = [...SITE_CARDS].sort(() => rand() - 0.5);
    let siteAt = 0;
    let dealt = 1;
    const history: HeroShape[] = [site("sun").build()];
    let at = 0;

    function deal(beside: HeroShape | undefined): HeroShape {
        const card =
            dealt % 3 === 0
                ? siteOrder[siteAt++ % siteOrder.length]!
                : pick(FAMILIES[pick((Object.keys(FAMILIES) as (keyof typeof FAMILIES)[]).filter((f) => f !== beside?.family))]);
        dealt++;
        const built = card.build();
        // A card the same as its neighbour (a site drawing come round) deals again.
        return built.key === beside?.key ? deal(beside) : built;
    }

    return {
        get current() {
            return history[at]!;
        },
        next() {
            if (at === history.length - 1) history.push(deal(history[at]));
            at++;
            return history[at]!;
        },
        prev() {
            if (at === 0) history.unshift(deal(history[0]));
            else at--;
            return history[at]!;
        },
    };
}

/** One visit's seed. */
export function visitSeed(): number {
    const a = new Uint32Array(1);
    globalThis.crypto?.getRandomValues?.(a);
    return a[0]! || Date.now() >>> 0;
}

export { freq };
