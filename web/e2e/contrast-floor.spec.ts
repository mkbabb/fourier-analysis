import { test, expect } from "@playwright/test";
import {
    CONTRAST_PAIRS,
    PAIRS_AWAITING_THEIR_OWNER,
    type ContrastPair,
} from "./contrast-pairs";
import { FLOOR, fmtRatio, gradeAgainstFloor } from "../scripts/contrast";
import { ARMS, openArm, resolveStack, type Arm } from "./resolve-stack";

/**
 * X·F F.W4 `.g` — `G-F4-CONTRAST-FLOOR`.
 *
 * THE BORN-RED WITNESS: *"No executable harness anywhere"*, reproduced at the
 * bytes by seat 0 (`grep -rln 'contrast\|relativeLuminance' e2e/` → ∅). Every
 * one of the wave's named ratios was a number in a markdown table that nothing
 * in the repo could reproduce, in either arm.
 *
 * ⊘ WHY THIS EXISTS BESIDE THE AXE KEYSTONES, MEASURED AND NOT ASSUMED.
 * `G-F4-A11Y-ROUTE`'s `/paper` keystone landed GREEN this same seat — zero
 * serious/critical, including zero `color-contrast` — while `PS D-B2` books
 * 2.39:1 and `PS D-M4 extended` books four sub-4.5 ramp stops on that very
 * route. axe grades what it can attribute to a text node over a solid
 * ancestor background; ramp inks behind `color-mix` plates, canvas strokes and
 * control BOUNDARIES (1.4.11) fall outside that. **A green axe run is not a
 * contrast reading**, and this harness is the reading.
 *
 * HOW A RATIO IS RE-DERIVED RATHER THAN COPIED
 * --------------------------------------------
 * Each pair is a stack of CSS colour expressions. The page paints them in order
 * onto a 1×1 canvas — the browser's own compositor resolving `var()`,
 * `light-dark()`, `color-mix()`, `oklch()` and alpha exactly as it does on
 * screen — and reads back the sRGB bytes after the plate and again after the
 * ink. The arithmetic (`scripts/contrast.ts`) is pure and separately asserted by
 * the unit floor. The registry's `banked` figures are NEVER asserted against:
 * the live reading is the fact, and a divergence is reported as drift.
 *
 * BOTH ARMS, ALWAYS. §4 says *"in BOTH arms"*, and the registry is full of rows
 * whose dark arm passes while light fails (`GAB-1`, `AA-3`, `FR-EQR-7`) and at
 * least one — `HLG-37` — that fails in both. A harness that graded one arm
 * would certify the theme that is not the shipped default.
 */

/**
 * X.F.W3 `.d` — COHESION §0x note (iv), executed: `e2e/resolve-stack.ts` is the
 * ONE `resolveStack`/`openArm` home, and this spec imports it.
 *
 * The module’s own header booked this duplication rather than resolving it
 * (“`contrast-floor.spec.ts` still holds its own private copy … re-pointing
 * that spec at this module is a change to another unit’s authored gate. The
 * duplication is booked for the wave’s adjudicator, not resolved here”). The
 * ruling releases the gate to this unit, and the two copies HAD ALREADY
 * DIVERGED on the thing that decides whether a reading is trustworthy:
 *
 * ⟨measured at this seat, before the change⟩ `grep -c SENTINEL resolve-stack.ts`
 * → **3**; `grep -c SENTINEL contrast-floor.spec.ts` → **0**.
 *
 * The module seeds a KNOWN sentinel colour before assigning each expression, so
 * an expression the engine REJECTS leaves the sentinel standing and throws. The
 * private copy cleared to `""` first, which leaves the INHERITED colour — a
 * rejected expression there reads back as something plausible and grades a
 * ratio nobody authored. Consolidating is not tidying; the spec GAINS the
 * rejection detector it was missing. Recorded, never masked.
 */
function describeDrift(pair: ContrastPair, arm: Arm, ratio: number): string {
    const banked = pair.banked[arm];
    if (banked === undefined) return "";
    // A scalar is a point figure (±0.05); an array is a BAND the registry
    // states as a range, so containment — not proximity to an endpoint — is
    // what "reproduced" means for it.
    const tol = 0.05;
    const near = Array.isArray(banked)
        ? ratio >= Math.min(...banked) - tol && ratio <= Math.max(...banked) + tol
        : Math.abs(banked - ratio) <= tol;
    const shown = Array.isArray(banked) ? banked.join("–") : String(banked);
    return near
        ? ` (banked ${shown}, reproduced)`
        : ` (banked ${shown} — DRIFT, the live reading governs)`;
}

test.describe("X·F F.W4 — contrast floor (G-F4-CONTRAST-FLOOR)", () => {
    for (const arm of ARMS) {
        test(`every named pair meets its floor — ${arm} arm`, async ({ page }) => {
            await openArm(page, arm);

            const failures: string[] = [];
            const readings: string[] = [];

            for (const pair of CONTRAST_PAIRS) {
                let verdict;
                try {
                    const { plate, ink } = await resolveStack(page, pair.stack);
                    verdict = gradeAgainstFloor(ink, plate, pair.kind);
                } catch (e) {
                    failures.push(
                        `  ✗ ${pair.id} [${arm}] — ${(e as Error).message} · owner ${pair.owner}`,
                    );
                    continue;
                }

                const line =
                    `${pair.id} [${arm}] ${fmtRatio(verdict.ratio)}:1 ` +
                    `(${pair.kind}, floor ${verdict.floor}:1)` +
                    describeDrift(pair, arm, verdict.ratio);
                readings.push(line);

                if (!verdict.passes) {
                    failures.push(`  ✗ ${line} — ${pair.what} · owner ${pair.owner}`);
                }
            }

            // The full table is attached whether the arm passes or fails: a gate
            // that only speaks when it fails leaves the passing rows unproven.
            await test.info().attach(`contrast-${arm}.txt`, {
                body: readings.join("\n"),
                contentType: "text/plain",
            });

            expect(
                failures,
                `contrast floor violations in the ${arm} arm ` +
                    `(text ≥ ${FLOOR.text}:1 · non-text ≥ ${FLOOR["non-text"]}:1), ` +
                    `${failures.length} of ${CONTRAST_PAIRS.length} pairs:\n` +
                    failures.join("\n"),
            ).toEqual([]);
        });
    }

    test("every named pair has a re-derivable expression", () => {
        // §4 names pairs whose ink is painted rather than declared. They are
        // enumerated, owned and RED — never skipped. This assertion closes by
        // being emptied, one row at a time, as each owning unit lands its cure
        // together with its pair's expression stack.
        expect(
            PAIRS_AWAITING_THEIR_OWNER,
            "pairs named at F-W4.md §4 that no expression stack re-derives yet " +
                "— each is owned, none is dropped:\n" +
                PAIRS_AWAITING_THEIR_OWNER.map(
                    (p) => `  ✗ ${p.id} — ${p.what} (banked ${p.banked}) · owner ${p.owner}`,
                ).join("\n"),
        ).toEqual([]);
    });
});
