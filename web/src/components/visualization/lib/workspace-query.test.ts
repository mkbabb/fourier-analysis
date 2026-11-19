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
