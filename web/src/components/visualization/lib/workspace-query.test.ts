/**
 * The workspace's view in its URL: each key's default, and old links keeping
 * their meaning.
 */
import { describe, expect, it } from "vitest";

import { formatWorkspaceQuery, parseWorkspaceQuery } from "./workspace-query";

describe("the layers' defaults", () => {
    it("a clean link shows the picture and hides the dashed outline", () => {
        const v = parseWorkspaceQuery({});
        expect(v.bg).toBe(true);
        expect(v.trace).toBe(false);
    });

    it("bg=0 hides the picture; trace=1 shows the outline", () => {
        expect(parseWorkspaceQuery({ bg: "0" }).bg).toBe(false);
        expect(parseWorkspaceQuery({ trace: "1" }).trace).toBe(true);
    });

    it("old links keep their meaning: bg=1 is the picture shown, trace=0 the outline hidden", () => {
        expect(parseWorkspaceQuery({ bg: "1" }).bg).toBe(true);
        expect(parseWorkspaceQuery({ trace: "0" }).trace).toBe(false);
    });

    it("the defaults are written as nothing", () => {
        expect(formatWorkspaceQuery({ bg: true, trace: false })).toEqual({ bg: undefined, trace: undefined });
        expect(formatWorkspaceQuery({ bg: false, trace: true })).toEqual({ bg: "0", trace: "1" });
    });
});

describe("the line and the circles", () => {
    it("are shown by default and hidden at 0", () => {
        const clean = parseWorkspaceQuery({});
        expect(clean.line).toBe(true);
        expect(clean.circles).toBe(true);
        expect(parseWorkspaceQuery({ line: "0", circles: "0" })).toMatchObject({ line: false, circles: false });
        expect(formatWorkspaceQuery({ line: false, circles: false })).toEqual({ line: "0", circles: "0" });
        expect(formatWorkspaceQuery({ line: true, circles: true })).toEqual({ line: undefined, circles: undefined });
    });
});

describe("the active bases", () => {
    it("read and write in the link's words, in the chooser's order", () => {
        expect(parseWorkspaceQuery({ basis: "legendre,series" }).basis).toEqual(["fourier-series", "legendre"]);
        expect(formatWorkspaceQuery({ basis: ["legendre", "fourier-epicycles"] })).toEqual({ basis: "epicycles,legendre" });
    });

    it("none is the empty set; absent is the piece's own", () => {
        expect(parseWorkspaceQuery({ basis: "none" }).basis).toEqual([]);
        expect(formatWorkspaceQuery({ basis: [] })).toEqual({ basis: "none" });
        expect(parseWorkspaceQuery({}).basis).toBeNull();
        expect(formatWorkspaceQuery({ basis: null })).toEqual({ basis: undefined });
    });

    it("junk and two Fourier modes at once read as the piece's own", () => {
        expect(parseWorkspaceQuery({ basis: "wavelets" }).basis).toBeNull();
        expect(parseWorkspaceQuery({ basis: "epicycles,series" }).basis).toBeNull();
    });
});

describe("the view", () => {
    it("the zoom is written off the fit only, at two decimals", () => {
        expect(parseWorkspaceQuery({ z: "2.5" }).z).toBe(2.5);
        expect(parseWorkspaceQuery({ z: "1" }).z).toBeNull();
        expect(parseWorkspaceQuery({ z: "9" }).z).toBeNull();
        expect(formatWorkspaceQuery({ z: 3.14159 })).toEqual({ z: "3.14" });
        expect(formatWorkspaceQuery({ z: 1.001 })).toEqual({ z: undefined });
        expect(formatWorkspaceQuery({ z: null })).toEqual({ z: undefined });
    });

    it("the centre round-trips at three decimals", () => {
        expect(parseWorkspaceQuery({ c: "0.125,-0.25" }).c).toEqual([0.125, -0.25]);
        expect(formatWorkspaceQuery({ c: [0.12345, -0.0004] })).toEqual({ c: "0.123,0" });
        expect(parseWorkspaceQuery({ c: "x,1" }).c).toBeNull();
        expect(parseWorkspaceQuery({ c: "5,0" }).c).toBeNull();
    });
});
