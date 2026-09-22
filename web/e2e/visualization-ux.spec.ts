import { test, expect, type Page } from "@playwright/test";
import { checkA11y } from "./a11y";
import * as path from "node:path";

/**
 * B.W2 — visualization-route UX coherence spec (Invariant 18 + 19 binding).
 *
 * This is the axe-core keystone-state spec folded forward from W4.d
 * (W2 scope items 16 + 17). It binds Invariant 18 (modal a11y + dock idiom)
 * with measurement at four keystone states, and captures the Invariant 19
 * auto-recompute regression-guard as a red-baseline assertion that un-skips
 * once W3's `saveContourPoints` auto-recompute seam lands.
 *
 * @axe-core/playwright exposes the builder API (`AxeBuilder`), not the
 * `injectAxe` / `checkA11y` helpers (those belong to the separate
 * `axe-playwright` package). The local `checkA11y` wrapper below preserves the
 * wave's intent — inject axe + assert zero serious/critical violations — atop
 * the package that the W2 hard gate (H-W2-1) actually installs.
 */

const TEST_IMAGE = path.resolve(
    import.meta.dirname,
    "../../assets/animals/golden-retriever.webp",
);

/**
 * X.F.W3 `.d` — `LC-1`. The helper was authored TWICE, here and in
 * `visualization-crud.spec.ts`, and both copies carried the same narrowing. It
 * has ONE home now (`e2e/a11y.ts`), for the same reason `resolveStack` does.
 */

/** Upload the keystone image and wait for the workspace canvas to render. */
async function openWorkspace(page: Page): Promise<void> {
    await page.goto("/visualize");
    const fileInput = page.getByTestId("image-file-input");
    await fileInput.setInputFiles(TEST_IMAGE);
    await page.waitForURL(/\/w\//, { timeout: 15_000 });
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    // Settle deterministically on the actual mount condition the keystones
    // depend on — NOT a blind fixed timeout (flaky: too short on slow CI, so
    // axe runs against a half-mounted DOM; wasteful on fast). The auto-compute
    // round-trip resolving (networkidle) plus the AnimationControls dock's
    // collapsed-summary play control rendering is the precise "dock + panels are
    // fully mounted" signal.
    //
    // The dock starts collapsed by default (AnimationControls' GlassDock sets
    // `:start-collapsed="true"`), and GlassDock hides the EXPANDED layer
    // (`.dock-layer--full`, `visibility:hidden`) until the dock expands — so the
    // "More options" trigger that lives there is not visible in the default
    // state Keystone-1 asserts against. We therefore settle on the
    // collapsed-summary mini play button (`.play-btn--mini`), which is the
    // active/visible layer's control in the default collapsed dock. Using the
    // default-state element keeps the helper from corrupting Keystone-1's
    // default-state a11y check (expanding the dock here would change every
    // keystone's measured DOM).
    await page.waitForLoadState("networkidle", { timeout: 60_000 });
    await expect(page.locator(".animation-dock .play-btn--mini").first()).toBeVisible({
        timeout: 60_000,
    });
}

/**
 * Open the AnimationControls "More options" dropdown.
 *
 * The trigger (`[aria-label="More options"]`) lives in the dock's EXPANDED
 * layer (`.dock-layer--full`), which GlassDock keeps `visibility:hidden` while
 * the dock is in its default COLLAPSED state. Hovering the `.animation-dock`
 * container drives the dock's hover state-machine to `expanded`, swapping the
 * full layer to `layer-active` (`visibility:visible`); only then is the
 * trigger clickable. We settle on the `expanded` class (the FLIP-crossfade
 * completion signal) rather than a blind timeout before clicking.
 */
async function openMoreOptions(page: Page): Promise<void> {
    const dock = page.locator(".animation-dock").first();
    await dock.hover();
    await expect(dock).toHaveClass(/expanded/, { timeout: 5_000 });

    const moreOptions = page.locator('[aria-label="More options"]').first();
    await expect(moreOptions).toBeVisible({ timeout: 5_000 });
    await moreOptions.click();
}

test.describe.serial("B.W2 — visualization UX coherence (a11y keystones)", () => {
    // ── Keystone 1 — workspace default ──
    // X.F.W10S.b (2026-09-22) — UN-FIXME'D ON A FULL-STACK RUN. The booked
    // `aria-hidden-focus` (glass-ui `ConfiguratorLayer` omitting `inert`) is
    // gone at the adopted 8.0.0 pin, as `LC-2` / `K-13` predicted: the run
    // reports no such node. What the run DID report was app-owned —
    // `nested-interactive` (serious) on the animation dock's collapsed summary,
    // which glass-ui 8.0.0 makes the disclosure (`role="button"`) while this app
    // kept its mini Play/Pause inside it. Cured in `AnimationControls.vue`
    // (the control moves to `#persistent`); the prior rationale is deleted
    // with the fixme, per `LC-2`'s own cure.
    test("keystone: workspace default has no serious/critical a11y violations", async ({
        page,
    }) => {
        await openWorkspace(page);
        await checkA11y(page, "workspace default");
    });

    // ── Keystone 2 — ContourSettings Configurator open ──
    // X.F.W10S.b (2026-09-22) — UN-FIXME'D ON A FULL-STACK RUN. The booked
    // collapsed-sibling `aria-hidden-focus` no longer reproduces at 8.0.0; the
    // one serious node the run found was keystone 1's `nested-interactive`
    // (the dock summary), cured in `AnimationControls.vue`. The Strategy
    // `SelectTrigger` `button-name` fix in `ContourSettings.vue` stands.
    test("keystone: ContourSettings Configurator-open is a11y-clean", async ({ page }) => {
        await openWorkspace(page);

        // Expand the Contour configurator section.
        await page
            .locator("button, [role='button']")
            .filter({ hasText: "Contour" })
            .first()
            .click();
        await expect(page.locator("text=Blur Sigma").first()).toBeVisible({
            timeout: 5_000,
        });

        await checkA11y(page, "ContourSettings Configurator-open");
    });

    // ── Keystone 3 — ExportModal Dialog open ──
    test("keystone: ExportModal Dialog-open is a11y-clean", async ({ page }) => {
        await openWorkspace(page);

        // The export affordance lives behind the AnimationControls "More
        // options" dropdown; expand the dock, open the menu, then trigger
        // Export to raise the Dialog.
        await openMoreOptions(page);
        await page.getByText("Export", { exact: false }).first().click();

        // The glass-ui Dialog should expose role="dialog".
        const dialog = page.locator('[role="dialog"]').first();
        await expect(dialog).toBeVisible({ timeout: 5_000 });

        // `LC-1`: SCOPED. Unscoped, this keystone evaluated the whole document
        // — including the collapsed `ConfiguratorLayer`s the adjacent
        // workspace-default keystone is `fixme`’d FOR — and passed only because
        // opening this dialog converts `aria-hidden-focus` from a violation into
        // an `incomplete`. Two adjacent tests asserting contradictory things
        // about the same DOM, reconciled by a suppression neither could see.
        // Scoped to the dialog, this keystone grades the surface it names.
        await checkA11y(page, "ExportModal Dialog-open", {
            include: '[role="dialog"]',
        });
    });

    // ── Keystone 4 — AnimationControls dropdown open ──
    // X.F.W10S.b (2026-09-22) — UN-FIXME'D ON A FULL-STACK RUN. The only
    // residual this cell named — the vendored collapsed-layer
    // `aria-hidden-focus` — does not reproduce at the adopted 8.0.0 pin, and
    // the open-menu surface was already clean (the app-owned fixes listed at
    // its authoring — the popper anchor, `:modal="false"`, the SpeedSelect
    // name, the `menuitem`/`menuitemradio`/`group` roles — all stand).
    test("keystone: AnimationControls dropdown-open is a11y-clean", async ({ page }) => {
        await openWorkspace(page);

        await openMoreOptions(page);

        // The glass-ui DropdownMenuContent should expose role="menu".
        const menu = page.locator('[role="menu"]').first();
        await expect(menu).toBeVisible({ timeout: 5_000 });

        await checkA11y(page, "AnimationControls dropdown-open");
    });

    // ── Keystone 5 — the Equation Explorer route ──
    // X·F F.W0 (G-9), row 19 = the `R-3` axe-keystone rider (fr-SliderControl,
    // = D-4) ⊕ `D-i1` (fr-ContourSettings). Keystones 1–4 never leave the
    // visualization route, so the axe gate has never reached the equation
    // route — and that is the ONLY route where `SliderControl`'s `subtitle`
    // slot renders. Gap verified by both readers at adjudication; re-verified
    // at the settled tree by this seat, 2026-09-17:
    //   `grep -rn 'subtitle' src/components/equation/FunctionInput.vue`
    //   → `:182` "terms in the Fourier sum" · `:215` "shown in expanded (a+b) view"
    // and `SliderControl.vue:69` renders `<span class="slider-subtitle">` only
    // when that prop is passed. Nothing on `/visualize` passes it.
    //
    // ROUTE-SPELLING DRIFT, RECORDED NOT SILENTLY ADOPTED: the banked row (and
    // F-W0.md §4 G-9) spells the route `/equations`. The live router declares
    // `path: "/equation"` (`src/router/index.ts:92`, name `equation`) and there
    // is no `/equations` record — a D-19-class anchor drift. The INTENT is
    // taken at the true bytes: this keystone addresses `/equation`. The
    // divergence is minuted in `docs/tranches/F/SUBSTRATE-LEDGER.md` §3.
    //
    // AUTHORED, NOT RUN (F-W0.md §3 row 19; F.W0 lands ONLY the keystone-route
    // extension + the corrected justification prose). Its first execution is
    // CI's. Un-`fixme`-ing `fr-BasisSelector` B-3 at `:133` is a four-test
    // operation routed to F.W3/W4 and is NOT performed here — this keystone is
    // armed, not skipped, because a `fixme` on a brand-new gate is the very
    // defect row 19 books.
    test("keystone: /equation is a11y-clean", async ({ page }) => {
        await page.goto("/equation");

        // Settle on the mount condition this keystone exists for — the rendered
        // `SliderControl` subtitle — not a blind timeout. The "Controls"
        // CollapsibleSection is `:default-open="true"`, and the desktop grid
        // renders the left panel unconditionally (the mobile tab bar is
        // `lg:hidden`), so the subtitle is in the default desktop DOM.
        await page.waitForLoadState("networkidle", { timeout: 60_000 });
        await expect(page.locator(".slider-subtitle").first()).toBeVisible({
            timeout: 60_000,
        });

        await checkA11y(page, "/equation");
    });

    // ── Keystones 6–8 — `/paper`, `/morph`, `/demo/shape-extractor` ──
    //
    // X·F F.W4 `.g`, `G-F4-A11Y-ROUTE`: *"`checkA11y(page, "equation")` +
    // `/paper` + `/morph` + `/demo/shape-extractor` join the axe keystone set;
    // zero serious/critical"*. Before this block, axe reached `/visualize`,
    // `/v/{slug}` and (since F.W0) `/equation` — three of the seven routes the
    // router declares. Half the app had never been graded: `/paper` is the
    // largest DOM in the repo (`PS D-B2` books its 2.39/3.00 contrast pairs
    // unverified for exactly this reason), and the two morph surfaces carry
    // `HLG-*`/`FSE-*` rows whose witnesses do not exist.
    //
    // ⊘ THE GATE'S OWN PREDICTION IS FALSIFIED AT THE BYTES, RECORDED RATHER
    // THAN SMOOTHED. The gate cell predicts *"the moment `/equation` joins,
    // fr-CL M-R2 + FR-EQR-6/R2-r3 fire TWO `scrollable-region-focusable` BEFORE
    // any hover finding — that is the RED"*. `/equation` had already joined
    // (F.W0), and the measured RED, double-run at this seat 2026-09-18, is ONE
    // `[critical] button-name` on `.is-auto-active` (`FunctionInput.vue:192` —
    // the `icon-only` Auto/Parseval `Button` with no accessible name). ZERO
    // `scrollable-region-focusable` of either kind. The prediction is struck by
    // measurement; the cure belongs to `.b`, and the dated addendum-beside is
    // `<vjs>/docs/tranches/X/fourier/F-W4-ADDENDA-g-2026-09-18.md`.
    //
    // Each keystone settles on its own rendered content — never a blind
    // timeout — so a route that fails to boot fails loudly instead of grading
    // an empty `<main>`.

    test("keystone: /paper is a11y-clean", async ({ page }) => {
        await page.goto("/paper");
        await page.waitForLoadState("networkidle", { timeout: 60_000 });
        // The compiled article's own H1 — present only once latex-paper has
        // mounted the document body, which is the whole surface being graded.
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
            timeout: 60_000,
        });
        await checkA11y(page, "/paper");
    });

    test("keystone: /morph is a11y-clean", async ({ page }) => {
        await page.goto("/morph");
        await page.waitForLoadState("networkidle", { timeout: 60_000 });
        // `HarmonicLevelGrid`'s three phase sections are the route's control
        // mass (`HLG-37`'s contrast rungs, `HLG-20`'s rails); grading before
        // they mount would miss every row this route owns.
        await expect(page.getByRole("heading", { name: "Morph", exact: true })).toBeVisible({
            timeout: 60_000,
        });
        await checkA11y(page, "/morph");
    });

    test("keystone: /demo/shape-extractor is a11y-clean", async ({ page }) => {
        await page.goto("/demo/shape-extractor");
        await page.waitForLoadState("networkidle", { timeout: 60_000 });
        // The Sun/Moon figure headings — the two shapes `FSE-*` books, and the
        // same surface whose 375px horizontal amputation the occlusion gate now
        // measures (`visual-baseline.spec.ts`, `FSE-M-4`).
        await expect(page.getByRole("heading", { name: "Moon", exact: true })).toBeVisible({
            timeout: 60_000,
        });
        await checkA11y(page, "/demo/shape-extractor");
    });

    // ── Invariant 19 — auto-recompute regression guard ──
    // RED BASELINE: `saveContourPoints` (workspace.ts) nulls epicycleData /
    // basesData and launches no recompute; the ContourSettings watcher does not
    // key on `store.contour`, so post-save the canvas stays blank. This
    // assertion asserts the OPPOSITE (canvas re-renders within one rAF with no
    // control perturbation + a single compute pass) and therefore FAILS today.
    // Un-skip at W3 when the auto-recompute seam (the ComputeBasesRequest model
    // + the `store.contour`-keyed auto-compute watcher) lands.
    test.fixme(
        "save_contour_then_recompute: canvas re-renders within one rAF after saveContourPoints",
        async ({ page }) => {
            await openWorkspace(page);

            const canvas = page.locator("canvas").first();

            // Snapshot the control values before the save so we can assert they
            // are not perturbed by the auto-recompute.
            const controlsBefore = await page
                .locator('input[type="number"], input[type="range"]')
                .evaluateAll((els) =>
                    (els as (HTMLInputElement)[]).map((el) => el.value),
                );

            // Drive a contour edit + save through the store hook (W3 exposes
            // `window.__store`; until then this is part of the red baseline).
            await page.evaluate(() => {
                const store = (window as unknown as { __store?: { saveContourPoints?: () => void } }).__store;
                store?.saveContourPoints?.();
            });

            // One rAF (~16ms) plus a small slack: the canvas must NOT fall back
            // to the placeholder; it must re-render the recomputed chain.
            await page.waitForTimeout(64);

            // Canvas is still the live render, not the placeholder.
            await expect(canvas).toBeVisible();
            const box = await canvas.boundingBox();
            expect(box!.width).toBeGreaterThan(0);

            // Controls were not perturbed by the auto-recompute.
            const controlsAfter = await page
                .locator('input[type="number"], input[type="range"]')
                .evaluateAll((els) =>
                    (els as (HTMLInputElement)[]).map((el) => el.value),
                );
            expect(controlsAfter).toEqual(controlsBefore);

            // A single compute pass — not a recompute storm.
            const computeCount = await page.evaluate(
                () =>
                    (window as unknown as { __computeCount?: number }).__computeCount ?? 0,
            );
            expect(computeCount).toBe(1);
        },
    );
});
