import { defineConfig, devices } from "@playwright/test";

/**
 * D.W6 — cross-env Playwright matrix.
 *
 * The same suite runs against three environments, selected via `BASE_URL`
 * (alias `PLAYWRIGHT_BASE_URL` for backward compatibility):
 *
 *   - local  → http://localhost:3000           (Vite dev → /api proxy to :8000)
 *   - host   → http://localhost:8100           (SSH tunnel to prod host's :8100;
 *                                               read-only / non-mutating probes only)
 *   - prod   → https://fourier.babb.dev        (W9 residual: currently GH-Pages 404,
 *                                               so the prod cell is RED-with-cause)
 *
 * Destructive specs (`@mutating`-tagged or in `visualization-crud.spec.ts`) guard
 * against prod via `PLAYWRIGHT_PROD=1` skipping — the prod cell exercises the
 * non-mutating subset only.
 *
 * COMPUTE_RATE_LIMIT harness: the backend reads `COMPUTE_RATE_LIMIT` from the
 * environment (api/config.py — pydantic-settings env-prefix-empty), so the e2e
 * launcher (scripts/e2e.sh or CI workflow) sets `COMPUTE_RATE_LIMIT=1000`
 * before starting uvicorn. The prod `api/config.py:23 compute_rate_limit: 5`
 * default is byte-identical pre/post-W6 — the override is env-only.
 */

const BASE_URL =
    process.env.BASE_URL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "http://localhost:3000";

const IS_PROD_CELL = process.env.PLAYWRIGHT_PROD === "1";

/**
 * X·F F.W9 `.b` — `G-F9-13`.
 *
 * The `@mutating` exclusion used to sit at the top level. Playwright's
 * project-level `grep`/`grepInvert` SUPERSEDE the top-level ones rather than
 * compose with them, so the moment a project needed its own tag filter (the
 * coarse cell below), a top-level `grepInvert` would have been silently
 * dropped for every project that declared one — and the prod cell would have
 * started mutating the live DB. It is therefore expressed per project, once,
 * here, so the two filters are visibly composed instead of accidentally
 * overwritten.
 */
function excluded(...tags: RegExp[]): RegExp | undefined {
    const parts = [...tags, ...(IS_PROD_CELL ? [/@mutating/] : [])].map((r) => r.source);
    return parts.length ? new RegExp(parts.join("|")) : undefined;
}

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",
    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
            // `@coarse` tests assert coarse-pointer truths (`--ui-scale: 1.5`,
            // the 44px touch floor). Under `Desktop Chrome` the pointer is
            // fine, so running them here would report a correct fine-pointer
            // tree as broken. When PLAYWRIGHT_PROD=1 the destructive specs are
            // excluded here too — see `excluded()` above.
            grepInvert: excluded(/@coarse/),
        },
        /**
         * X·F F.W9 `.b` — `G-F9-13`, THE COARSE-POINTER CELL.
         *
         * Until this entry the matrix declared exactly ONE project, `Desktop
         * Chrome`, which emulates `pointer: fine` and `any-pointer: fine`. Every
         * coarse-pointer rule in the tree was therefore unreachable in CI **by
         * construction** — not untested by oversight, but unreachable: no
         * `@media (pointer: coarse)` block could ever match, so
         * `FR-USB-1`/`-3`, glass-ui's `[data-size]` touch floor, PaperSidebar's
         * `--ui-scale`/`--control-floor` pair, `FV-11`'s 44-vs-60px
         * discordance and `fr-ImageUpload L:L-i2`'s drag path had no witness
         * that could exist. `FR-USB-16` books exactly that.
         *
         * `devices["Pixel 7"]` is Chromium with `isMobile: true` and
         * `hasTouch: true`, which is what flips the pointer media features.
         *
         * ⊘ MATRIX-BEFORE-COARSE (`F-W9.md` §4a-8): this project lands BEFORE
         * any coarse-pointer assertion, because an assertion written first
         * would have been green-by-unreachability.
         *
         * ⊘ THIS IS NOT A SAFARI CELL AND DISCHARGES NO SAFARI ROW. It is
         * Chromium under mobile emulation. The `X-W11 G8` browser-matrix edge
         * is untouched by it, and any reading of this project as Safari
         * coverage is false on its face — stated here so the claim cannot be
         * made downstream from the project's name.
         *
         * WHY IT IS TAG-SCOPED AND NOT A SECOND FULL SWEEP. The suite's other
         * specs assert desktop layout (grid columns, hover affordances, the
         * `lg:` breakpoint); re-running them at 412px would report layout
         * differences as failures and teach the next seat to ignore this
         * project. It runs the specs that OPT IN with `@coarse`, so every test
         * it runs is one written to be true on a touch device.
         */
        {
            name: "mobile-chromium",
            use: { ...devices["Pixel 7"] },
            grep: /@coarse/,
            grepInvert: excluded(),
        },
    ],
});
