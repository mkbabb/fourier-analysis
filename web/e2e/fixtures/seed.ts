// SERVED MODEL: claude-opus-5-5
import { expect } from "@playwright/test";

/**
 * X.F.W14.s (addendum (f), COHESION §0cm) — the records the suite owns.
 *
 * The suite used to assume its data: `f-w14-uia` reused whatever the first
 * public visualization on the served API happened to be, or minted one in its
 * own `beforeAll` and never removed it. The suite now seeds what it assumes
 * once per run, in `e2e/global-seed.ts`, through the public `/api` with a
 * session (never the database directly), under the namespace below, and tears
 * down what it made. The handle reaches every worker through `SEED_ENV`.
 *
 * The admin-banner checkpoint (vc item 8) needs no seeded record: every number
 * it paints comes from `stubAdminApi` (`fixtures/gallery.ts`), measured at
 * this seat — the banner's expected and actual frames carry the same stubbed
 * figures.
 */

/** The namespace every seeded record carries (title and tag), so a run can
 * tell its own records from a developer's data on a shared dev database. */
export const SEED_NAMESPACE = "e2e-seed:f-w14";

/** The environment variable the global setup exports the seed handle through. */
export const SEED_ENV = "FOURIER_E2E_SEED";

export interface SeededViz {
    slug: string;
    image_slug: string;
}

/** The saved, public visualization the global setup minted for this run. */
export function seededViz(): SeededViz {
    const raw = process.env[SEED_ENV];
    expect(raw, `the e2e global setup exported ${SEED_ENV} (playwright.config.ts globalSetup)`).toBeTruthy();
    return JSON.parse(raw!) as SeededViz;
}
