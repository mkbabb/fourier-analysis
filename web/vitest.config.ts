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
 */
export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    test: {
        environment: "node",
        include: ["e2e/unit/**/*.vitest.ts", "scripts/**/*.vitest.ts"],
        reporters: ["default"],
    },
});
