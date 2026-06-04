/**
 * J — π visual-runtime lane: the every-page paired before/after capture harness.
 *
 * Pursuant to the screenshots edict (precept tranche/SPEC.md §"The π visual-runtime
 * lane" → "Before/after capture — every page, paired, scripted"; precepts 8ccf9f4).
 * A SINGLE checked-in harness that re-runs identically at tranche open + close:
 *
 *   VISUAL_MODE=before npx playwright test visual-baseline.spec.ts   # W0/W1 open
 *   VISUAL_MODE=after  npx playwright test visual-baseline.spec.ts   # W8 close
 *
 * Sweeps EVERY page (not a sample) × 3 viewports (mobile/laptop/desktop), writes
 * full-page captures under docs/tranches/J/audit/screenshots/{before,after}/, and
 * runs the occlusion gate (zero horizontal overflow per page×viewport). The paired
 * before/after + the per-page DELTA.md make the recurring "a fix on page X silently
 * broke page Y" class visible at close, not in the next tranche's reconciliation.
 */
import { test, expect } from "@playwright/test";
import * as path from "node:path";

const MODE = (process.env.VISUAL_MODE ?? "before").toLowerCase();
const OUT = path.resolve(
    __dirname,
    `../../docs/tranches/J/audit/screenshots/${MODE === "after" ? "after" : "before"}`,
);

// EVERY route (router/index.ts). Param routes that need seeded data are captured
// at their empty/landing state (the empty DB is itself the J-open baseline truth).
const PAGES = [
    { slug: "home", path: "/" },
    { slug: "paper", path: "/paper" },
    { slug: "gallery", path: "/gallery" },
    { slug: "equation", path: "/equation" },
    { slug: "morph", path: "/morph" },
    { slug: "shape-extractor", path: "/demo/shape-extractor" },
    { slug: "workspace", path: "/w" }, // the configurator — the DEC-2 controls-LEFT surface
];

const VIEWPORTS = [
    { name: "375x667", width: 375, height: 667 }, // mobile
    { name: "1280x800", width: 1280, height: 800 }, // laptop
    { name: "1440x900", width: 1440, height: 900 }, // desktop
];

for (const vp of VIEWPORTS) {
    for (const pg of PAGES) {
        test(`π capture [${MODE}] ${pg.slug} @ ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await page.goto(pg.path, { waitUntil: "networkidle", timeout: 30_000 }).catch(() => {});
            // Settle late hydration / fonts / first paint; freeze animations for a stable frame.
            await page.waitForTimeout(1200);
            await page.emulateMedia({ reducedMotion: "reduce" }).catch(() => {});

            await page.screenshot({
                path: path.join(OUT, `${pg.slug}-${vp.name}.png`),
                fullPage: true,
                animations: "disabled",
            });

            // Occlusion gate: zero element overflowing the viewport horizontally.
            const overflow = await page.evaluate(
                () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
            );
            expect(
                overflow,
                `horizontal overflow on ${pg.slug} @ ${vp.name} (occlusion gate)`,
            ).toBeLessThanOrEqual(2);
        });
    }
}
