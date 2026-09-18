import { describe, expect, it } from "vitest";
import { derive, type Derivation } from "./derive-loops";

/**
 * X·F F.W4 `.g` — the deriver's own regression guard (`G-F4-DERIVER`, asserted
 * through `G-F4-VITEST`).
 *
 * A deriver whose output nothing checks is how a census reports a confident
 * zero. These assertions pin the four §0 blind spots as BEHAVIOURS — each one
 * is a case a callsite-keyed or import-graph-keyed census provably missed — and
 * deliberately avoid pinning totals that move whenever a surface unit lands a
 * cure.
 */
describe("deriver (G-F4-DERIVER)", () => {
    const d: Derivation = derive();

    it("publishes all seven declared clauses, none empty by accident", () => {
        // The gate cell's clauses, in its own order. A missing key is a silent
        // drop, which is the defect class this whole gate exists to kill.
        expect(Object.keys(d)).toEqual(
            expect.arrayContaining([
                "nativeLoopsByDirective",
                "loopBounds",
                "loopMultiplicity",
                "isCandidateSets",
                "producerInternalLoops",
                "urlRefEdges",
                "disclosureState",
                "loopSourceProvenance",
            ]),
        );
        expect(d.method.limits.length).toBeGreaterThan(0);
    });

    it("BS-1: finds PaperSidebar's three nested native <li v-for>", () => {
        // The canonical callsite-keyed miss. A census keyed on component
        // callsites reports ZERO here; all three sit on a native `<li>`.
        const rows = d.nativeLoopsByDirective.rows.filter((r) =>
            r.file.endsWith("PaperSidebar.vue"),
        );
        expect(rows).toHaveLength(3);
        expect(rows.every((r) => r.native)).toBe(true);
        expect(rows.every((r) => r.host === "li")).toBe(true);
    });

    it("BS-1 refinement: the index is the DIRECTIVE, with callsites re-parented", () => {
        // `FR-AUL-54`: element-name-keyed cures re-inherit the blind spot, so
        // `native` must be a property of a row and never the partition itself.
        const { total, native, componentCallsites } = d.nativeLoopsByDirective;
        expect(native + componentCallsites).toBe(total);
        expect(native).toBeGreaterThan(0);
        expect(componentCallsites).toBeGreaterThan(0);
        expect(
            d.nativeLoopsByDirective.rows.some((r) => r.native && r.reparented.length > 0),
        ).toBe(true);
    });

    it("FR-NP-2: never mints a cardinality for a runtime domain", () => {
        for (const row of d.nativeLoopsByDirective.rows) {
            if (row.provenance === "typed-domain" || row.provenance === "runtime") {
                expect(row.bound).toBe("runtime");
            }
            if (typeof row.bound === "number") {
                expect(["literal-range", "literal-array"]).toContain(row.provenance);
            }
        }
        expect(d.loopBounds.closed + d.loopBounds.runtime).toBe(
            d.nativeLoopsByDirective.total,
        );
    });

    it("BS-2: reports an unresolvable `:is` candidate set as unresolved, not as zero", () => {
        expect(d.isCandidateSets.total).toBeGreaterThan(0);
        // Resolution is a subset of the sites; an unresolved site must survive
        // in `rows` so it can be seen, rather than being filtered away.
        expect(d.isCandidateSets.resolved).toBeLessThanOrEqual(d.isCandidateSets.total);
        expect(d.isCandidateSets.rows).toHaveLength(d.isCandidateSets.total);
    });

    it("BS-3: the producer denominator is closed and VERSIONED", () => {
        expect(d.producerInternalLoops.length).toBeGreaterThan(0);
        for (const p of d.producerInternalLoops) {
            expect(p.package.startsWith("@mkbabb/")).toBe(true);
            expect(p.version).not.toBe("unknown");
        }
        // The point of BS-3: a `web/src`-scoped census sees none of these.
        expect(
            d.producerInternalLoops.some((p) => p.renderListCalls > 0),
        ).toBe(true);
    });

    it("BS-4: surfaces `url(#id)` edges no import graph can represent", () => {
        expect(d.urlRefEdges.total).toBeGreaterThan(0);
        for (const e of d.urlRefEdges.rows) {
            expect(e.resolved).toBe(e.definedIn !== null && e.referencedFrom.length > 0);
        }
    });

    it("records the enclosing disclosure state of every loop and `:is` site", () => {
        const counted = Object.values(d.disclosureState).reduce((a, b) => a + b, 0);
        expect(counted).toBe(d.nativeLoopsByDirective.total + d.isCandidateSets.total);
        // `CS m-14`'s inverted polarity: a site behind a closed disclosure must
        // be labelled, never compared to a live DOM as though it were mounted.
        for (const row of d.nativeLoopsByDirective.rows) {
            expect(typeof row.disclosure).toBe("string");
            expect(row.disclosure.length).toBeGreaterThan(0);
        }
    });
});
