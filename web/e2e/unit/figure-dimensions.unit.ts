/**
 * X·F F.W0 (G-9) — THE UNIT-RUNNER SEAT. One asserting spec, and nothing more.
 *
 * WHAT THIS FILE IS
 * -----------------
 * `PP-NOTEST (= L-13) ≡ R-20 ≡ fr-App C-13 ≡ fr-PaperSidebar M7` books the fact
 * that `web/` has no unit runner at all: probe-C1b-class defects — *valid-and-
 * wrong output*, the `PP-LEN` shape — are catchable by nothing else in this
 * repo. Playwright cannot substitute: `R-20` proves it (the only e2e touching
 * `SliderControl` asserts `canvas.toBeVisible()` and its `input[type="range"]`
 * fallback can never match, and `fill()` dispatches ONE input event, so even an
 * assertive e2e spec cannot reproduce `R-2`).
 *
 * F.W0 owns the **SEAT** — a runner that runs, asserts, is type-checked and is
 * wired into CI. **F.W9's `G-F9-1` owns the FLOOR** (the spec population and its
 * thresholds). Declared identically at both ends per R-5: *the seat is a
 * precondition of the floor, never a down payment on it*, and neither gate may
 * be discharged by the other's evidence. **This file is explicitly NOT
 * coverage**, and no later wave may cite it as any.
 *
 * WHY `node:test` AND NOT VITEST
 * ------------------------------
 * F.W0 §2b reserves `web/package.json` + `package-lock.json` **entirely to unit
 * a**, whose only F.W0 act over them is the land-or-abandon ruling. A vitest
 * devDependency is a manifest byte, so it is not this wave's to write. Node's
 * built-in runner is the one runner that is already *installed* (it ships with
 * the Node the CI workflow already provisions), already *typed* (`@types/node`
 * is in the lock), and therefore already inside the `vue-tsc` scope G-8 widened.
 * Zero manifest bytes, zero new config files, nothing suppressed.
 * **Routed**: when F.W9 lands the floor it lands the manifest transaction with
 * it and may re-home these assertions on vitest + a component harness; the seat
 * proved the ground, it does not pick the floor's runner.
 *
 * WHY IT LIVES UNDER `e2e/`
 * -------------------------
 * The F.W0.c writable set is `web/tsconfig.json` · the two workflows ·
 * `web/e2e/` · the substrate ledger. `web/e2e/` is the only writable source
 * directory, so the seat lives here and is kept out of Playwright's collection
 * by its `.unit.ts` suffix (Playwright's default `testMatch` is
 * `**\/*.@(spec|test).?(c|m)[jt]s?(x)` — verified by `playwright test --list`,
 * which collects 8 spec files and none of this one).
 *
 * THE SUBJECT
 * -----------
 * `src/lib/figureDimensions.ts`: a leaf module with no imports, and a
 * `Record<string, readonly [number, number]>` — the exact loose-`Record` shape
 * `fr-BasisSelector i-3` (= `LC-missed-7`) names, where an index read
 * type-checks as non-optional because `noUncheckedIndexedAccess` is unset. That
 * flag is DEFERRED by this wave as a rider on `M-10` (§6a lock 7: never landed
 * alone), so the invariant it cannot express is asserted here instead.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
    FIGURE_DIMENSIONS,
    hasModernVariants,
} from "../../src/lib/figureDimensions.ts";

test("figure dimensions are well formed and hasModernVariants answers the map", () => {
    const keys = Object.keys(FIGURE_DIMENSIONS);
    assert.ok(keys.length > 0, "FIGURE_DIMENSIONS is empty");

    for (const key of keys) {
        assert.match(key, /\.png$/, `key is not a .png filename: ${key}`);

        const box = FIGURE_DIMENSIONS[key];
        assert.ok(box, `no box for ${key}`);

        const [width, height] = box;
        assert.ok(
            Number.isInteger(width) && width > 0,
            `width is not a positive integer for ${key}: ${width}`,
        );
        assert.ok(
            Number.isInteger(height) && height > 0,
            `height is not a positive integer for ${key}: ${height}`,
        );
    }

    // Both directions: a listed figure has the transcoded siblings, an
    // unlisted one does not. The negative arm is the half a `toBeVisible()`
    // e2e assertion cannot express (R-20).
    const [first] = keys;
    assert.ok(first);
    assert.equal(hasModernVariants(first), true);
    assert.equal(hasModernVariants("f99_not_a_figure.png"), false);
});
