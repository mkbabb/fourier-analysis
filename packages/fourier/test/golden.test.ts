/**
 * F-L1-1: the package's transform and evaluation equal the Python engine's
 * (`scripts/gen_fourier_fixtures.py`: `EpicycleChain.from_signal`,
 * `evaluate`, `positions_at`) within 1e-9, relative to the curve's scale.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chainAt, evaluateAt, partialSum, spectrumOf, toComponents, fromComponents } from "../src/index";

interface Fixture {
    name: string;
    points: number[];
    harmonics: number;
    c: number[];
    level: number;
    m: number;
    partialSum: number[];
    at: { t: number; value: [number, number]; chain: number[] }[];
}

const dir = new URL("./fixtures/", import.meta.url);
const fixtures: Fixture[] = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(new URL(f, dir), "utf8")) as Fixture);

const maxAbs = (xs: ArrayLike<number>) => {
    let m = 0;
    for (let i = 0; i < xs.length; i++) m = Math.max(m, Math.abs(xs[i]!));
    return m;
};

function close(got: ArrayLike<number>, want: ArrayLike<number>, scale: number) {
    expect(got.length).toBe(want.length);
    let worst = 0;
    for (let i = 0; i < want.length; i++) worst = Math.max(worst, Math.abs(got[i]! - want[i]!));
    expect(worst / scale).toBeLessThanOrEqual(1e-9);
}

describe("golden fixtures from the Python engine", () => {
    it("covers the six shapes", () => {
        expect(fixtures.map((f) => f.name).sort()).toEqual(["circle", "ellipse", "letter", "noisy-loop", "square", "star"]);
    });

    for (const f of fixtures) {
        describe(f.name, () => {
            const scale = maxAbs(f.points);
            const s = spectrumOf(Float64Array.from(f.points), f.harmonics);

            it("spectrumOf = from_signal", () => close(s.c, f.c, scale));

            it("partialSum at N = evaluate of the band |k| <= N", () => close(partialSum(s, f.level, f.m), f.partialSum, scale));

            it("evaluateAt and chainAt = evaluate and positions_at", () => {
                const ref = { c: Float64Array.from(f.c) };
                for (const a of f.at) {
                    close(evaluateAt(ref, a.t), a.value, scale);
                    close(chainAt(ref, a.t), a.chain, scale);
                }
            });

            it("survives the API's component wire shape", () => {
                const back = fromComponents(toComponents({ c: Float64Array.from(f.c) }));
                for (const a of f.at) close(chainAt(back, a.t), a.chain, scale);
            });
        });
    }
});
