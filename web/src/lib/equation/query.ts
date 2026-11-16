/**
 * The equation explorer's view in its URL (`/equation`). Short stable keys,
 * each omitted at its default, so `/equation` stays the clean link:
 *
 *   f=<expression>   the function (default `x*(pi - x)`)
 *   a=, b=           the domain's ends (default 0 and pi; multiples of pi are
 *                    written as such: `pi`, `2pi`, `-pi/2`)
 *   n=<1..100>       the harmonic count (default 20)
 *   auto=0           the automatic harmonic budget is off
 *   nt=<notation>    `exponential` or `polar` (default `trig`)
 *   m=expanded       the series written out term by term (default Σ)
 *   s=<0..1>         the sweep, paused at this point (absent: it plays)
 *   orig=0, harm=0   the plot's original curve or its harmonics hidden
 *
 * Typing, the domain, the count and the sweep are replaces; the toggles and
 * menus (auto, notation, mode, the plot's layers) are pushes.
 */
import type { LocationQuery } from "vue-router";
import type { EquationDisplayMode, NotationMode } from "./types";
import { flagOff, intIn, oneOf, rawOf, unit, type Codec } from "@/lib/urlState";

export const EQUATION_DEFAULTS = {
    expression: "x*(pi - x)",
    domainStart: 0,
    domainEnd: Math.PI,
    nHarmonics: 20,
    notation: "trig" as NotationMode,
} as const;

const PI_DENOMINATORS = [1, 2, 3, 4, 6] as const;

/** A number, with multiples of pi written as pi (`pi`, `-2pi`, `pi/2`, `3pi/4`). */
export function formatDomain(v: number): string {
    if (v === 0) return "0";
    for (const d of PI_DENOMINATORS) {
        const k = (v * d) / Math.PI;
        const r = Math.round(k);
        if (r !== 0 && Math.abs(k - r) < 1e-9 && Math.abs(r) <= 24) {
            const sign = r < 0 ? "-" : "";
            const m = Math.abs(r);
            return `${sign}${m === 1 ? "" : m}pi${d === 1 ? "" : `/${d}`}`;
        }
    }
    return String(Number(v.toPrecision(8)));
}

/** The inverse of `formatDomain`; junk reads as null. */
export function parseDomain(raw: string | undefined): number | null {
    if (raw === undefined || raw === "") return null;
    const m = /^(-?)(\d*\.?\d*)pi(?:\/(\d+))?$/.exec(raw);
    if (m) {
        const k = m[2] === "" ? 1 : Number(m[2]);
        const d = m[3] ? Number(m[3]) : 1;
        if (!Number.isFinite(k) || !d) return null;
        return ((m[1] ? -1 : 1) * k * Math.PI) / d;
    }
    if (!/^-?\d*\.?\d+(e-?\d+)?$/i.test(raw)) return null;
    const v = Number(raw);
    return Number.isFinite(v) ? v : null;
}

function domainCodec(fallback: number): Codec<number> {
    return {
        parse: (raw) => parseDomain(raw) ?? fallback,
        format: (v) => (Math.abs(v - fallback) < 1e-12 ? undefined : formatDomain(v)),
    };
}

const harmonicsCodec: Codec<number> = {
    parse: (raw) => intIn(1, 100).parse(raw) ?? EQUATION_DEFAULTS.nHarmonics,
    format: (v) => (v === EQUATION_DEFAULTS.nHarmonics ? undefined : String(Math.round(v))),
};

const expressionCodec: Codec<string> = {
    parse: (raw) => (raw === undefined || raw.trim() === "" ? EQUATION_DEFAULTS.expression : raw),
    format: (v) => (v.trim() === EQUATION_DEFAULTS.expression ? undefined : v),
};

export const EQUATION_QUERY = {
    f: expressionCodec,
    a: domainCodec(EQUATION_DEFAULTS.domainStart),
    b: domainCodec(EQUATION_DEFAULTS.domainEnd),
    n: harmonicsCodec,
    auto: flagOff,
    nt: oneOf<NotationMode>(["trig", "exponential", "polar"], "trig"),
    m: oneOf<EquationDisplayMode>(["sigma", "expanded"], "sigma"),
    s: unit,
    orig: flagOff,
    harm: flagOff,
} as const;

export type EquationKey = keyof typeof EQUATION_QUERY;

export type EquationView = {
    [K in EquationKey]: ReturnType<(typeof EQUATION_QUERY)[K]["parse"]>;
};

/** Whether the URL names any of the explorer's state (else the page restores the reader's last). */
export function hasEquationState(query: LocationQuery): boolean {
    return (Object.keys(EQUATION_QUERY) as EquationKey[]).some((k) => rawOf(query, k) !== undefined);
}

export function parseEquationQuery(query: LocationQuery): EquationView {
    const out = {} as Record<EquationKey, unknown>;
    for (const key of Object.keys(EQUATION_QUERY) as EquationKey[]) {
        out[key] = EQUATION_QUERY[key].parse(rawOf(query, key));
    }
    return out as EquationView;
}

export function formatEquationQuery(view: Partial<EquationView>): Record<string, string | undefined> {
    const out: Record<string, string | undefined> = {};
    for (const key of Object.keys(view) as EquationKey[]) {
        out[key] = (EQUATION_QUERY[key] as Codec<unknown>).format(view[key]);
    }
    return out;
}
