import { describe, expect, it } from "vitest";
import type { LocationQuery } from "vue-router";
import { changes, flagOff, flagOn, intIn, oneOf, text, unit, withParams } from "./urlState";
import {
    EQUATION_DEFAULTS,
    formatDomain,
    formatEquationQuery,
    hasEquationState,
    parseDomain,
    parseEquationQuery,
    type EquationView,
} from "./equation/query";
import {
    formatWorkspaceQuery,
    parseWorkspaceQuery,
    type WorkspaceView,
} from "@/components/visualization/lib/workspace-query";
import { formatGalleryQuery, linkableTab, parseGalleryQuery, type GalleryView } from "@/components/gallery/gallery-query";
import { formatMorphConfig, formatMorphView, parseMorphQuery } from "@/components/morph/morph-query";
import { DEFAULT_MORPH_CONFIG, type MorphConfig } from "@/composables/useFourierMorph";

/** The query a formatted view navigates to (undefined keys omitted). */
function asQuery(raws: Record<string, string | undefined>): LocationQuery {
    return withParams({}, raws) as LocationQuery;
}

describe("codecs", () => {
    it("omit their default and read junk as it", () => {
        expect(flagOn.format(false)).toBeUndefined();
        expect(flagOn.format(true)).toBe("1");
        expect(flagOn.parse("yes")).toBe(false);
        expect(flagOff.format(true)).toBeUndefined();
        expect(flagOff.format(false)).toBe("0");
        expect(flagOff.parse(undefined)).toBe(true);
        expect(flagOff.parse("0")).toBe(false);
        const nt = oneOf(["trig", "polar"], "trig");
        expect(nt.parse("bogus")).toBe("trig");
        expect(nt.format("trig")).toBeUndefined();
        // An empty value that is itself a member (a "none" filter) reads as "", never undefined.
        const basis = oneOf(["", "chebyshev"], "");
        expect(basis.parse(undefined)).toBe("");
        expect(basis.parse("chebyshev")).toBe("chebyshev");
        expect(text.format("")).toBeUndefined();
    });

    it("bound numbers", () => {
        const n = intIn(1, 500);
        expect(n.parse("40")).toBe(40);
        expect(n.parse("0")).toBeNull();
        expect(n.parse("501")).toBeNull();
        expect(n.parse("4.5")).toBeNull();
        expect(unit.parse("0.42")).toBe(0.42);
        expect(unit.parse("1.2")).toBeNull();
        expect(unit.parse("-0.1")).toBeNull();
        expect(unit.format(0.123456)).toBe("0.123");
        expect(unit.format(null)).toBeUndefined();
    });

    it("keep the parameters they do not own", () => {
        const q = { admin: "x", q: "rose" } as LocationQuery;
        expect(withParams(q, { q: undefined, sort: "likes" })).toEqual({ admin: "x", sort: "likes" });
        expect(changes(q, { q: "rose" })).toBe(false);
        expect(changes(q, { q: undefined })).toBe(true);
        expect(changes(q, { tier: undefined })).toBe(false);
    });
});

describe("workspace query", () => {
    const view: WorkspaceView = {
        bg: true,
        trace: false,
        eq: true,
        edit: false,
        fs: true,
        n: 37,
        t: 0.418,
        speed: 2,
        ease: "ease-in-out-cubic",
    };

    it("round-trips a full view", () => {
        expect(parseWorkspaceQuery(asQuery(formatWorkspaceQuery(view)))).toEqual(view);
    });

    it("writes nothing for the default view, so the path is the clean link", () => {
        const clean = parseWorkspaceQuery({});
        expect(clean).toEqual({ bg: false, trace: true, eq: false, edit: false, fs: false, n: null, t: null, speed: null, ease: null });
        expect(Object.values(formatWorkspaceQuery(clean)).filter((v) => v !== undefined)).toEqual([]);
    });

    it("uses short keys", () => {
        expect(asQuery(formatWorkspaceQuery({ bg: true, trace: false, t: 0.5 }))).toEqual({ bg: "1", trace: "0", t: "0.5" });
    });

    it("reads an off-catalogue rate or easing as the piece's own", () => {
        const v = parseWorkspaceQuery({ speed: "3", ease: "wobble", n: "9999" });
        expect(v.speed).toBeNull();
        expect(v.ease).toBeNull();
        expect(v.n).toBeNull();
    });
});

describe("equation query", () => {
    it("writes pi multiples as pi and reads them back", () => {
        for (const [v, raw] of [
            [Math.PI, "pi"],
            [-Math.PI, "-pi"],
            [2 * Math.PI, "2pi"],
            [Math.PI / 2, "pi/2"],
            [(-3 * Math.PI) / 4, "-3pi/4"],
            [1.5, "1.5"],
        ] as const) {
            expect(formatDomain(v)).toBe(raw);
            expect(parseDomain(raw)).toBeCloseTo(v, 12);
        }
        expect(parseDomain("pie")).toBeNull();
        expect(parseDomain("1e400")).toBeNull();
    });

    it("round-trips a full view", () => {
        const view: EquationView = {
            f: "sin(x)^3 + abs(x)",
            a: -Math.PI,
            b: Math.PI,
            n: 33,
            auto: false,
            nt: "polar",
            m: "expanded",
            s: 0.25,
            orig: false,
            harm: true,
        };
        const back = parseEquationQuery(asQuery(formatEquationQuery(view)));
        expect(back).toEqual({ ...back, ...view, a: back.a, b: back.b });
        expect(back.a).toBeCloseTo(-Math.PI, 12);
        expect(back.b).toBeCloseTo(Math.PI, 12);
    });

    it("omits every default and reads the clean link as the defaults", () => {
        const clean = parseEquationQuery({});
        expect(clean.f).toBe(EQUATION_DEFAULTS.expression);
        expect(clean.b).toBe(Math.PI);
        expect(clean.n).toBe(20);
        expect(clean.s).toBeNull();
        expect(Object.values(formatEquationQuery(clean)).filter((v) => v !== undefined)).toEqual([]);
        expect(hasEquationState({})).toBe(false);
        expect(hasEquationState({ s: "0.5" })).toBe(true);
    });
});

describe("gallery query", () => {
    it("round-trips a full view", () => {
        const view: GalleryView = { q: "rose", sort: "likes", tier: "featured", basis: "chebyshev", tab: "drafts", open: "zen-lilac-snail" };
        expect(parseGalleryQuery(asQuery(formatGalleryQuery(view)))).toEqual(view);
    });

    it("never names an admin tab", () => {
        expect(linkableTab("audit")).toBe("gallery");
        expect(parseGalleryQuery({ tab: "tokens" }).tab).toBe("gallery");
    });

    it("rejects a slug that is not one", () => {
        expect(parseGalleryQuery({ open: "../etc" }).open).toBeNull();
    });
});

describe("morph query", () => {
    it("is empty at the defaults (the clean /morph link)", () => {
        const v = parseMorphQuery({});
        expect(v).toEqual({ shape: "sun", n: null, config: DEFAULT_MORPH_CONFIG });
        expect(asQuery({ ...formatMorphView(v.shape, v.n), ...formatMorphConfig(v.config) })).toEqual({});
    });

    it("round-trips the picture, a previewed level and the tuning", () => {
        const config: MorphConfig = {
            settleOutMs: 300,
            morphMs: 120,
            settleInMs: 450,
            lowLevel: 3,
            highLevel: 35,
            settleOutEasing: "ease-out",
            morphEasing: "ease-in-out-sine",
            settleInEasing: "linear",
        };
        const query = asQuery({ ...formatMorphView("moon", 8), ...formatMorphConfig(config) });
        expect(query).toEqual({ shape: "moon", n: "8", lo: "3", hi: "35", out: "300", mid: "120", in: "450", eout: "ease-out", emid: "ease-in-out-sine" });
        expect(parseMorphQuery(query)).toEqual({ shape: "moon", n: 8, config });
    });

    it("reads junk, an out-of-range value and a reversed range as the default", () => {
        const v = parseMorphQuery({ shape: "comet", n: "99", out: "5", emid: "wobble", lo: "40", hi: "12" });
        expect(v.shape).toBe("sun");
        expect(v.n).toBeNull();
        expect(v.config.settleOutMs).toBe(DEFAULT_MORPH_CONFIG.settleOutMs);
        expect(v.config.morphEasing).toBe(DEFAULT_MORPH_CONFIG.morphEasing);
        expect([v.config.lowLevel, v.config.highLevel]).toEqual([DEFAULT_MORPH_CONFIG.lowLevel, DEFAULT_MORPH_CONFIG.highLevel]);
    });
});
