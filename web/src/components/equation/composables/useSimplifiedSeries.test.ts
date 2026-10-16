// SERVED MODEL: claude-opus-5-5
/**
 * X.F.W14V.au3 — A2-FO-L1-5: the simplify flow (notation, budget, fetch,
 * energy, abort) is written once, in `useSimplifiedSeries`, and both the
 * /equation route and /visualize's equation panel read it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, ref } from "vue";

import type { NotationMode } from "@/lib/equation/types";
import type { BasisComponent } from "@/lib/types";

const simplify = vi.fn();
vi.mock("@/lib/equation/api", () => ({
    simplifyCoefficients: (...args: unknown[]) => simplify(...args),
    isAbortError: (e: unknown) => e instanceof DOMException && e.name === "AbortError",
    abortInflight: vi.fn(),
}));

import { useSimplifiedSeries as use } from "./useSimplifiedSeries";

/** The composable lives in a component's scope; so does each test's. */
const useSimplifiedSeries = (...args: Parameters<typeof use>) => effectScope().run(() => use(...args))!;

const COMPONENTS: BasisComponent[] = [
    { index: 0, coefficient: [1, 0], amplitude: 1, phase: 0 },
    { index: 1, coefficient: [0.5, 0], amplitude: 0.5, phase: 0 },
];

function response(latex: string, energy: number) {
    return { latex, latex_sigma: `\\sum ${latex}`, energy_captured: energy, term_count: 2 };
}

describe("useSimplifiedSeries (A2-FO-L1-5)", () => {
    beforeEach(() => simplify.mockReset());

    it("sends the components with the current notation, budget and Auto, and holds the answer", async () => {
        simplify.mockResolvedValue(response("a", 0.9));
        const notation = ref<NotationMode>("exponential");
        const budget = ref(7);
        const s = useSimplifiedSeries(() => COMPONENTS, { notation, budget, autoHarmonics: () => true });
        const resp = await s.simplify();
        expect(simplify).toHaveBeenCalledWith(COMPONENTS, 7, "exponential", true);
        expect(resp?.latex).toBe("a");
        expect(s.latex.value).toBe("a");
        expect(s.latexSigma.value).toBe("\\sum a");
        expect(s.energy.value).toBe(0.9);
        expect(s.loading.value).toBe(false);
        expect(s.error.value).toBeNull();
    });

    it("does nothing without components", async () => {
        const s = useSimplifiedSeries(() => [], { notation: () => "trig", budget: () => 6 });
        expect(await s.simplify()).toBeNull();
        expect(simplify).not.toHaveBeenCalled();
    });

    it("drops a superseded answer: only the latest request writes", async () => {
        let first!: (v: unknown) => void;
        simplify.mockImplementationOnce(() => new Promise((r) => (first = r)));
        simplify.mockResolvedValueOnce(response("late", 0.5));
        const s = useSimplifiedSeries(() => COMPONENTS, { notation: () => "trig", budget: () => 6 });
        const a = s.simplify();
        const b = s.simplify();
        expect(await b).not.toBeNull();
        first(response("stale", 0.1));
        expect(await a, "the superseded call answers nothing").toBeNull();
        expect(s.latex.value).toBe("late");
        expect(s.energy.value).toBe(0.5);
    });

    it("names a failure, and an abort is not a failure", async () => {
        simplify.mockRejectedValueOnce(new Error("boom"));
        const s = useSimplifiedSeries(() => COMPONENTS, { notation: () => "trig", budget: () => 6 });
        expect(await s.simplify()).toBeNull();
        expect(s.error.value).toBe("boom");
        expect(s.loading.value).toBe(false);

        simplify.mockRejectedValueOnce(new DOMException("aborted", "AbortError"));
        expect(await s.simplify()).toBeNull();
        expect(s.error.value, "an abort clears, never reports").toBeNull();

        simplify.mockResolvedValueOnce(response("ok", 1));
        await s.simplify();
        expect(s.error.value).toBeNull();
    });

    it("starts from the given initial state", () => {
        const s = useSimplifiedSeries(() => COMPONENTS, {
            notation: () => "trig",
            budget: () => 6,
            initial: { latex: "x", latexSigma: "y", energy: 0.3 },
        });
        expect([s.latex.value, s.latexSigma.value, s.energy.value]).toEqual(["x", "y", 0.3]);
    });
});
