import { describe, expect, it } from "vitest";
import { plainLatex } from "./render";

/**
 * X.F.W14V `.u2` — UIA-F-253: the expanded renderers hook whole terms, so a
 * hook's body can nest braces; the copy affordance must still emit portable
 * LaTeX (FR-EQR-4).
 */
describe("plainLatex", () => {
    it("strips a Σ hook (a brace-free body)", () => {
        expect(plainLatex(String.raw`\sum_{n=1}^{8} \htmlClass{eq-coeff eq-an}{a_n} \cos(nt)`))
            .toBe(String.raw`\sum_{n=1}^{8} a_n \cos(nt)`);
    });

    it("strips an expanded hook whose body nests braces two deep", () => {
        const tex = String.raw`f(t) \approx \frac{3.3}{2} -\htmlClass{eq-coeff eq-an}{\frac{\pi}{2}\cos(2t)} +\htmlClass{eq-coeff eq-An}{0.5e^{i(2t+0.5)}}`;
        expect(plainLatex(tex)).toBe(String.raw`f(t) \approx \frac{3.3}{2} -\frac{\pi}{2}\cos(2t) +0.5e^{i(2t+0.5)}`);
    });
});
