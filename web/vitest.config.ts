import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * X·F F.W4 `.g` — THE UNIT FLOOR (charter item §2.L `VITEST-FLOOR`; gate
 * `G-F4-VITEST`), built on the arm `DECISIONS-F.W4.md` **D6** ruled:
 * *"stand a vitest runner up in `web/`"*. The Vite-build-plugin arm (PAW-50's
 * alternative) is **not** built, not half-built and not kept as a fallback.
 *
 * WHY A SEPARATE CONFIG AND NOT `vite.config.ts`
 * ----------------------------------------------
 * `vite.config.ts` mounts `latexPaperPlugin`, which compiles
 * `../paper/fourier_paper.tex` at config load. None of the floor's subjects is
 * a paper subject, so loading it would make every unit run pay a LaTeX compile.
 * Vitest prefers `vitest.config.ts` when both exist; the `@` alias is restated
 * here (it is the only thing from `vite.config.ts` the subjects need).
 *
 * WHY `environment: "node"` AND NO DOM
 * ------------------------------------
 * D6 prices this exactly: all four named subjects are **pure functions**, so
 * neither `jsdom` nor `happy-dom` is bought. A DOM environment arrives with the
 * first subject that needs one, priced then.
 *
 * WHY `*.vitest.ts` UNDER `e2e/unit/`
 * -----------------------------------
 * `web/e2e/` and `web/scripts/` are `.g`'s only writable source directories
 * (`web/src/**` belongs to the surface units). Playwright's `testDir` is
 * `./e2e` with the default `testMatch`
 * `**\/*.@(spec|test).?(c|m)[jt]s?(x)` — the segment before the extension must
 * be exactly `spec` or `test`, so `*.vitest.ts` is invisible to it.
 * `*.unit.ts` is deliberately NOT reused: F.W0's `G-9` seat
 * (`e2e/unit/figure-dimensions.unit.ts`) is a `node:test` file with its own CI
 * step, and sweeping it into this runner's glob would redden a closed wave's
 * landed gate on an import it never asked for. The two runners coexist,
 * disclosed; consolidating them belongs to whoever lands the FLOOR
 * (F.W9 `G-F9-1`), not to the seat that lands this one.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * X·F F.W9 `.b` — THE FLOOR (`G-F9-1`), landed on top of that seat.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The seat asks "does a runner exist?"; the FLOOR asks "does the whole unit
 * population run, and by what threshold do we know it?". The two are held
 * apart by law (`F-W9.md` §2.4 RUNNER-SEAT DISJOINTNESS, R-5: *"F.W0's G-9
 * owns the SEAT … F.W9's G-F9-1 owns the FLOOR … neither gate may be
 * discharged by the other's evidence"*), and this block is only the second
 * half.
 *
 * THE POPULATION, DECLARED RATHER THAN IMPLIED
 * --------------------------------------------
 * Three globs, and they are the whole claim:
 *
 *   1. `e2e/unit/ ** /*.vitest.ts`  — the seat's own home.
 *   2. `scripts/ ** /*.vitest.ts`   — the deriver/contrast tool assertions.
 *   3. `src/ ** /*.test.ts`         — ADDED HERE. X.F.W3 `.e` authored
 *      `src/lib/basis.test.ts`, `src/lib/time.test.ts` and
 *      `src/lib/equation/notation.test.ts` as vitest files (they
 *      `import … from "vitest"`) and they matched NO runner's glob in this
 *      repo: not this one, not the `node:test` seat, not Playwright's
 *      `testDir: "./e2e"`. Measured before this line existed — naming all
 *      three on the command line still returned *"No test files found,
 *      exiting with code 1"*. Three files of real assertions ran nowhere, in
 *      no job, and nothing said so. That silence is the defect `G-F9-1` is
 *      the instrument for, and closing the glob is the cure.
 *
 * `*.test.ts` under `src/` cannot collide with Playwright: its `testDir` is
 * `./e2e`, and `src/` is not under it.
 *
 * THE THRESHOLDS, EXPRESSED AS ASSERTIONS AND NOT AS PROSE
 * -------------------------------------------------------
 *   · `passWithNoTests` stays OFF (the default): an empty run is a RED run, so
 *     a glob that silently stops matching cannot read as success.
 *   · The step is BLOCKING in `ci.yml` — no `continue-on-error`.
 *   · The population itself is asserted, by
 *     `e2e/unit/unit-floor-population.vitest.ts`: it walks the tree for every
 *     unit-shaped test file and fails when one is claimed by no runner. A
 *     prose population goes stale the first time a seat adds a file; an
 *     asserted one reddens instead. That file is the FLOOR's own falsifier.
 *
 * ⊘ THE TWO RUNNERS STILL COEXIST, AND THE DECISION IS RECORDED RATHER THAN
 * TAKEN SILENTLY. `figure-dimensions.unit.ts` is F.W0's landed `G-9` evidence
 * under `node --test`. Sweeping it in here would discharge a closed wave's
 * gate with this wave's runner, which R-5 forbids in as many words; deleting
 * its CI step would redden a closed wave. So it is left exactly where F.W0 put
 * it, and the population assertion above KNOWS about it — it is claimed by the
 * `node:test` seat, not orphaned. Consolidation, if it is ever wanted, is a
 * decision for a wave that owns both gates; no seat of F.W9 owns F.W0's.
 */
export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    test: {
        environment: "node",
        include: [
            "e2e/unit/**/*.vitest.ts",
            "scripts/**/*.vitest.ts",
            // X·F F.W9 `.b` (`G-F9-1`, the FLOOR): X.F.W3 `.e`'s three
            // `src/lib` vitest files ran in NO runner until this line.
            "src/**/*.test.ts",
        ],
        reporters: ["default"],
    },
});
