import { describe, expect, it } from "vitest";
import { formatNumber } from "./format";

describe("formatNumber", () => {
    it("rounds to two significant figures and drops trailing zeros", () => {
        expect(formatNumber(3.28986)).toBe("3.3");
        expect(formatNumber(0.012345)).toBe("0.012");
        expect(formatNumber(2.0)).toBe("2");
        expect(formatNumber(103.19)).toBe("100");
        expect(formatNumber(0)).toBe("0");
    });
    it("writes a true minus", () => {
        expect(formatNumber(-0.6667)).toBe("−0.67");
        expect(formatNumber(-1e-9)).toBe("−0.000000001");
    });
    it("takes a wider precision where the reading needs it", () => {
        expect(formatNumber(99.972, 3)).toBe("100");
        expect(formatNumber(98.765, 3)).toBe("98.8");
    });
});
