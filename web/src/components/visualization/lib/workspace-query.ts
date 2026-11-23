/**
 * The workspace's view in its URL (`/w/<image>` and `/v/<visualization>`; the
 * path names the picture). Short stable keys, each omitted at its default, so
 * the plain path is the clean link:
 *
 *   bg=0      the picture under the drawing is hidden (default shown)
 *   trace=1   the original outline is shown (default hidden)
 *   line=0    the drawn line is hidden (default shown)
 *   circles=0 the circles (the chain, its inset and its legend) are hidden (default shown)
 *   eq=1      the series panel is open
 *   edit=1    the contour editor is open
 *   fs=1      the fullscreen takeover is open
 *   n=<1..500>    the harmonic budget, when it differs from the piece's own
 *   t=<0..1>      the moment the reader paused on (absent: the drawing plays)
 *   speed=<rate>  the playback rate, when it differs from the piece's own
 *   ease=<name>   the easing, when it differs from the piece's own
 *   basis=<keys>  the active bases (`epicycles`, `series`, `chebyshev`,
 *                 `legendre`, comma-joined; `none`), when they differ from the piece's own
 *   wash=<5..100> the picture's strength under a drawing, in percent (default 22)
 *   z=<1..8>      the zoom, off the fitted drawing
 *   c=<x>,<y>     the point at the stage's centre, off the drawing's centre in
 *                 units of the drawing's size (y up), off the fitted drawing
 *
 * The toggles and the bases are pushes (Back undoes them); `n`, `t`, `speed`,
 * `ease`, `wash`, `z` and `c` are replaces (a drag or a menu tune never fills
 * the history; the view is written once, as a gesture ends).
 */
import type { LocationQuery } from "vue-router";
import { flagOff, flagOn, intIn, rawOf, unit, type Codec } from "@/lib/urlState";
import { ANIMATION_SPEEDS, type AnimationSpeed } from "@/lib/defaults";
import { isAnimationEasingName, type AnimationEasingName } from "@/lib/easings";
import type { BasisKey } from "@/lib/basis";

/** A rate the transport offers; anything else is the piece's own (null). */
const speedCodec: Codec<AnimationSpeed | null> = {
    parse: (raw) => {
        const v = raw === undefined ? NaN : Number(raw);
        return (ANIMATION_SPEEDS as readonly number[]).includes(v) ? (v as AnimationSpeed) : null;
    },
    format: (v) => (v === null ? undefined : String(v)),
};

/** An easing the transport offers; anything else is the piece's own (null). */
const easeCodec: Codec<AnimationEasingName | null> = {
    parse: (raw) => (isAnimationEasingName(raw) ? raw : null),
    format: (v) => v ?? undefined,
};

/** The bases in the link's words, in the one order the chooser shows them. */
const BASIS_WORDS: readonly (readonly [string, BasisKey])[] = [
    ["epicycles", "fourier-epicycles"],
    ["series", "fourier-series"],
    ["chebyshev", "chebyshev"],
    ["legendre", "legendre"],
];

/** The active bases; junk, or two Fourier modes at once, is the piece's own (null). */
const basisCodec: Codec<BasisKey[] | null> = {
    parse: (raw) => {
        if (raw === undefined || raw === "") return null;
        if (raw === "none") return [];
        const words = raw.split(",");
        const keys = BASIS_WORDS.filter(([w]) => words.includes(w)).map(([, k]) => k);
        const known = words.every((w) => BASIS_WORDS.some(([b]) => b === w));
        const fourier = keys.filter((k) => k.startsWith("fourier")).length;
        return known && keys.length === new Set(words).size && fourier <= 1 ? keys : null;
    },
    format: (v) => {
        if (v === null) return undefined;
        if (!v.length) return "none";
        return BASIS_WORDS.filter(([, k]) => v.includes(k)).map(([w]) => w).join(",");
    },
};

const round = (v: number, places: number): number => Math.round(v * 10 ** places) / 10 ** places;

/** The zoom off the fit, at two decimals; the fit (1) and junk read as null. */
const zoomCodec: Codec<number | null> = {
    parse: (raw) => {
        if (raw === undefined || !/^\d*\.?\d+$/.test(raw)) return null;
        const v = Number(raw);
        return v > 1 && v <= 8 ? round(v, 2) : null;
    },
    format: (v) => (v === null || round(v, 2) <= 1 ? undefined : String(round(Math.min(8, v), 2))),
};

/** The view's centre off the drawing's, at three decimals; junk reads as null. */
const centreCodec: Codec<[number, number] | null> = {
    parse: (raw) => {
        const m = raw === undefined ? null : /^(-?\d*\.?\d+),(-?\d*\.?\d+)$/.exec(raw);
        if (!m) return null;
        const x = Number(m[1]), y = Number(m[2]);
        return Math.abs(x) <= 2 && Math.abs(y) <= 2 ? [round(x, 3), round(y, 3)] : null;
    },
    format: (v) => (v === null ? undefined : `${round(v[0], 3)},${round(v[1], 3)}`),
};

/** The picture's strength under a drawing, in percent: today's wash (22) is the default. */
export const WASH_DEFAULT = 22;
export const WASH_MIN = 5;
export const WASH_MAX = 100;

/** The wash in percent; the default and junk read as null (the default). */
const washCodec: Codec<number | null> = {
    parse: (raw) => {
        if (raw === undefined || !/^\d+$/.test(raw)) return null;
        const v = Number(raw);
        return v >= WASH_MIN && v <= WASH_MAX && v !== WASH_DEFAULT ? v : null;
    },
    format: (v) => {
        if (v === null) return undefined;
        const r = Math.round(Math.min(WASH_MAX, Math.max(WASH_MIN, v)));
        return r === WASH_DEFAULT ? undefined : String(r);
    },
};

export const WORKSPACE_QUERY = {
    // The picture shows and the dashed outline does not, by default; a link
    // written before the flip (`bg=1`, `trace=0`) still reads as it was.
    bg: flagOff,
    trace: flagOn,
    line: flagOff,
    circles: flagOff,
    eq: flagOn,
    edit: flagOn,
    fs: flagOn,
    n: intIn(1, 500),
    t: unit,
    speed: speedCodec,
    ease: easeCodec,
    basis: basisCodec,
    wash: washCodec,
    z: zoomCodec,
    c: centreCodec,
} as const;

export type WorkspaceKey = keyof typeof WORKSPACE_QUERY;

export type WorkspaceView = {
    [K in WorkspaceKey]: ReturnType<(typeof WORKSPACE_QUERY)[K]["parse"]>;
};

export function parseWorkspaceQuery(query: LocationQuery): WorkspaceView {
    const out = {} as Record<WorkspaceKey, unknown>;
    for (const key of Object.keys(WORKSPACE_QUERY) as WorkspaceKey[]) {
        out[key] = WORKSPACE_QUERY[key].parse(rawOf(query, key));
    }
    return out as WorkspaceView;
}

export function formatWorkspaceQuery(view: Partial<WorkspaceView>): Record<string, string | undefined> {
    const out: Record<string, string | undefined> = {};
    for (const key of Object.keys(view) as WorkspaceKey[]) {
        out[key] = (WORKSPACE_QUERY[key] as Codec<unknown>).format(view[key]);
    }
    return out;
}

/** The view keys a new picture keeps (how this reader looks at drawings, not where one stood). */
export const CARRIED_VIEW_KEYS = ["bg", "wash", "trace", "line", "circles"] as const;
