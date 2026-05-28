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

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",
    // When PLAYWRIGHT_PROD=1, skip destructive specs at collection time so the
    // matrix's prod cell never mutates the live DB. See web/e2e/README.md.
    grepInvert: process.env.PLAYWRIGHT_PROD === "1" ? /@mutating/ : undefined,
    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
