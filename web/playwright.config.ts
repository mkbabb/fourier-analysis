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

/**
 * X.F.W14.s (addendum (f), COHESION §0cm + §0be) — THE GPU INSTRUMENT RUNS HEADED.
 *
 * `f-w14-dpr.spec.ts` (G-p, OA-44) reads canvas backing stores against the
 * device box the engine reports. Headless Chromium under `deviceScaleFactor` 2
 * reports a 1x `devicePixelContentBoxSize` and paints a 1x bitmap stretched 2x
 * (measured at F.W14 Repair 1, D-2), so a headless reading measures the
 * emulator, not the app. §0be's instrument rule is headed real-GPU Chromium;
 * the suite declares it here as configuration: the spec's tests carry the
 * `@gpu` tag, the `chromium-headed` project runs exactly those, and every
 * headless project excludes them. They are never skipped. Tag-scoped like the
 * `@coarse` cell below, and not by a project `testMatch`: G-F9-1
 * (`e2e/unit/unit-floor-population.vitest.ts`) reads Playwright's population
 * as `testDir` plus the default `testMatch`, and reddens if one is set.
 */
const GPU_INSTRUMENT = /@gpu/;

export default defineConfig({
    testDir: "./e2e",
    // X.F.W14.s — the suite seeds the records it assumes through the public
    // `/api` and tears them down (the returned function); see e2e/global-seed.ts.
    globalSetup: "./e2e/global-seed.ts",
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
    /**
     * X.F.W14U Repair 1 (Check 1 C1-3, LW-3) — THE SUITE OWNS ITS PRODUCTION
     * INSTRUMENT. `e2e/f-w14u-misc.spec.ts`'s blocked-storage cases read the
     * production bundle (the dev server's pinia devtools hook reads storage
     * unguarded), served by `vite preview` on :4190; `preview` inherits
     * `server.proxy`, so `/api` reaches the same backend. Declared here, the
     * preview is built and started by Playwright itself instead of by a manual
     * pre-step; a preview already listening on :4190 is reused. The prod cell
     * reads a deployed origin and starts nothing.
     */
    webServer: IS_PROD_CELL
        ? undefined
        : {
              command:
                  "npx vite build --outDir dist/e2e-preview --emptyOutDir && npx vite preview --outDir dist/e2e-preview --port 4190 --strictPort",
              url: "http://localhost:4190/",
              reuseExistingServer: true,
              timeout: 300_000,
              stdout: "ignore",
              stderr: "pipe",
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
            grepInvert: excluded(/@coarse/, GPU_INSTRUMENT),
        },
        {
            name: "chromium-headed",
            use: { ...devices["Desktop Chrome"], headless: false },
            grep: GPU_INSTRUMENT,
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
            grepInvert: excluded(GPU_INSTRUMENT),
        },
    ],
});
