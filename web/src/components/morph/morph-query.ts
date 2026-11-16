/**
 * The morph's view in its URL (`/morph`). Short stable keys, each omitted at
 * its default, so `/morph` stays the clean link:
 *
 *   shape=moon          the picture showing, of the two (default the sun);
 *                       the morph runs from it to the other
 *   n=<level>           a harmonic level previewed on the stage (a tile);
 *                       absent, the stage shows the High level
 *   lo=<n> hi=<n>       the morph's range: it settles out to Low, blends
 *                       there, and settles back in to High
 *   out=<ms> mid=<ms> in=<ms>
 *                       the three phases' durations (settle out, the blend,
 *                       settle in)
 *   eout= emid= ein=    the three phases' easings
 *
 * The picture and a previewed level are pushes (Back returns to the other
 * picture, playing the morph to it); the range, the durations and the easings
 * are tunings, written by replace as they move. Playing is not a state a link
 * holds: a morph runs 350 ms by default and lands on a picture, which is.
 */
import type { LocationQuery } from "vue-router";
import { DEFAULT_MORPH_CONFIG, type MorphConfig } from "@/composables/useFourierMorph";
import { EASING_PRESET_NAMES } from "@/lib/easings";
import { intIn, oneOf, rawOf, type Codec } from "@/lib/urlState";

export type MorphShapeName = "sun" | "moon";

/** A duration on the phase sliders' own range (MorphPhaseConfig: 50..800 ms). */
const duration = intIn(50, 800);
/** A level on the shipped shapes' range (1..50, both assets' top level). */
const level = intIn(1, 50);
const easing = (fallback: string): Codec<string> => oneOf(EASING_PRESET_NAMES, fallback);

export const MORPH_QUERY = {
    shape: oneOf<MorphShapeName>(["sun", "moon"], "sun"),
    n: level,
    lo: level,
    hi: level,
    out: duration,
    mid: duration,
    in: duration,
    eout: easing(DEFAULT_MORPH_CONFIG.settleOutEasing),
    emid: easing(DEFAULT_MORPH_CONFIG.morphEasing),
    ein: easing(DEFAULT_MORPH_CONFIG.settleInEasing),
} as const;

export interface MorphView {
    shape: MorphShapeName;
    /** A previewed level, or null (the stage shows High). */
    n: number | null;
    /** The config the link names, every field at its default when absent. */
    config: MorphConfig;
}

const D = DEFAULT_MORPH_CONFIG;

/** A default-valued field formats as nothing, so a tuning back at its default leaves the link. */
const atDefault = (v: number, d: number) => (v === d ? null : v);

export function parseMorphQuery(query: LocationQuery): MorphView {
    const read = <K extends keyof typeof MORPH_QUERY>(key: K) =>
        (MORPH_QUERY[key] as Codec<unknown>).parse(rawOf(query, key)) as ReturnType<(typeof MORPH_QUERY)[K]["parse"]>;
    let lo = read("lo") ?? D.lowLevel;
    let hi = read("hi") ?? D.highLevel;
    // A range must run low to high; one that does not reads as the default.
    if (lo >= hi) [lo, hi] = [D.lowLevel, D.highLevel];
    return {
        shape: read("shape"),
        n: read("n"),
        config: {
            settleOutMs: read("out") ?? D.settleOutMs,
            morphMs: read("mid") ?? D.morphMs,
            settleInMs: read("in") ?? D.settleInMs,
            lowLevel: lo,
            highLevel: hi,
            settleOutEasing: read("eout"),
            morphEasing: read("emid"),
            settleInEasing: read("ein"),
        },
    };
}

/** The tunings' raw parameters (each omitted at its default). */
export function formatMorphConfig(c: MorphConfig): Record<string, string | undefined> {
    const Q = MORPH_QUERY;
    return {
        lo: Q.lo.format(atDefault(c.lowLevel, D.lowLevel)),
        hi: Q.hi.format(atDefault(c.highLevel, D.highLevel)),
        out: Q.out.format(atDefault(c.settleOutMs, D.settleOutMs)),
        mid: Q.mid.format(atDefault(c.morphMs, D.morphMs)),
        in: Q.in.format(atDefault(c.settleInMs, D.settleInMs)),
        eout: Q.eout.format(c.settleOutEasing),
        emid: Q.emid.format(c.morphEasing),
        ein: Q.ein.format(c.settleInEasing),
    };
}

/** The picture's and the previewed level's raw parameters. */
export function formatMorphView(shape: MorphShapeName, n: number | null): Record<string, string | undefined> {
    return { shape: MORPH_QUERY.shape.format(shape), n: MORPH_QUERY.n.format(n) };
}
