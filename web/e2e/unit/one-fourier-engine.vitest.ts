/**
 * F-L1-3: the web app evaluates Fourier series with @mkbabb/fourier only.
 * Its own client-side engine (`src/lib/evaluators.ts`, `pointsToSvgPath`) is
 * gone, and the component wire type is the package's.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = (p: string) => fileURLToPath(new URL(`../../src/${p}`, import.meta.url));

describe("one Fourier engine", () => {
    it("has no app-local evaluator", () => {
        expect(existsSync(src("lib/evaluators.ts"))).toBe(false);
        expect(readFileSync(src("lib/svg-fourier.ts"), "utf8")).not.toMatch(/export function pointsToSvgPath/);
    });

    it("takes BasisComponent from the package", () => {
        expect(readFileSync(src("lib/types.ts"), "utf8")).toMatch(
            /export type \{ BasisComponent \} from "@mkbabb\/fourier";/,
        );
    });

    it("resolves the package to its built dist", async () => {
        const m = await import("@mkbabb/fourier");
        expect(typeof m.chainAt).toBe("function");
        expect(typeof m.svgPathOf).toBe("function");
    });
});
