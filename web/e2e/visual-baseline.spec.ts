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
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url)); // web/e2e (ESM-safe; web is type:module)
const MODE = (process.env.VISUAL_MODE ?? "before").toLowerCase();
// `VISUAL_OUT` redirects the capture sink without touching the gate (X·F F.W4
// `.g`). The J-tranche `before/`+`after/` trees are CHECKED-IN prior evidence,
// and E-3 holds prior evidence immutable — yet running this harness to read the
// occlusion gate overwrote 21 tracked PNGs as a side effect, so the gate could
// not be measured without destroying the record it is measured against. The
// default is byte-identical to the previous behaviour; a seat that wants the
// gate and not the captures points `VISUAL_OUT` at a scratch directory.
const OUT =
    process.env.VISUAL_OUT ??
    path.resolve(
        HERE,
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

            // ── THE OCCLUSION GATE (X·F F.W4, `G-F4-OCCLUSION`) ──
            //
            // WHAT IT USED TO MEASURE, AND WHY THAT WAS 21/21 UNMEASURED.
            // It read `documentElement.scrollWidth - clientWidth`. `App.vue`'s
            // shell is `h-dvh … overflow-hidden` (`:24`) with the scrollport on
            // `<main>` (`:26`, `overflow-y-auto`), so the document element
            // CANNOT overflow on any route: the value is 0 by construction
            // (CSS Overflow 3 §3.1). `fr-FourierShapeExtractor M-4` books the
            // consequence at the bytes — `DELTA.md:9-11` records
            // *"occlusion gate: 21/21 GREEN (zero horizontal overflow on every
            // page × viewport)"* for the very run whose 375px capture shows the
            // Moon amputated (the box spans 272..472 in a 375px port, losing
            // 97px). **21/21 GREEN was 21/21 UNMEASURED.**
            //
            // ARM 1 — RE-POINTED AT `<main>`, per `FSE-M-4`'s cure. This is the
            // element that actually consumes the overflow, so this is the first
            // reading in this repo's history that can fail.
            //
            // ARM 2 — THE VERTICAL-CLIP ASSERTION (`HLG-20`). HLG-20's charge is
            // that the gate is horizontal-only while `fullPage: true` yields
            // exactly-viewport-sized captures (the app scrolls in an inner
            // port), so vertical amputation is invisible to BOTH the gate and
            // the evidence. The vertical analogue of the horizontal defect is
            // the SHELL: it clips (`overflow-hidden`) and it cannot scroll, so
            // anything taller than it is unreachable by any means — the exact
            // flexbox `min-h-0` regression class. `<main>` itself is excluded on
            // purpose: it scrolls, so content past its fold is reachable and is
            // not a clip.
            const geometry = await page.evaluate(() => {
                const main = document.querySelector("main");
                const shell = main?.parentElement ?? null;
                return {
                    mainOverflowX: main ? main.scrollWidth - main.clientWidth : null,
                    shellClipY: shell ? shell.scrollHeight - shell.clientHeight : null,
                    shellOverflowY: shell ? getComputedStyle(shell).overflowY : null,
                };
            });

            // A missing `<main>` is a gate failure, not a pass: it is how this
            // gate would silently return to measuring nothing.
            expect(
                geometry.mainOverflowX,
                `no <main> scrollport found on ${pg.slug} @ ${vp.name} — the occlusion gate has nothing to measure`,
            ).not.toBeNull();

            expect(
                geometry.mainOverflowX,
                `horizontal overflow inside <main> on ${pg.slug} @ ${vp.name} (occlusion gate, FSE-M-4)`,
            ).toBeLessThanOrEqual(2);

            expect(
                geometry.shellClipY,
                `vertical clip on ${pg.slug} @ ${vp.name}: the shell is ${geometry.shellOverflowY} and ` +
                    `${geometry.shellClipY}px of content sits past its box with no scroll mechanism (occlusion gate, HLG-20)`,
            ).toBeLessThanOrEqual(2);
        });
    }
}
