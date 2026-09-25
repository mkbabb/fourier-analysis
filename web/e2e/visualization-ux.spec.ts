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
    // X.F.W12 `.a` (COHESION §0as, F.W11 Check 2 MINOR) — THE READINESS IS THE
    // APP'S OWN, NOT THE NETWORK'S. The wait used to be the network-quiet load
    // state, a property of the whole browser under load, not of this page: under a
    // full 9-worker run it timed out and its serial file then skipped every
    // later test, the `:290` keystone among them. The workspace's own mount
    // condition is the compute pair it awaits — `ContourSettings.runCompute`
    // extracts the contour, then POSTs `compute/epicycles` and `compute/bases`
    // together and renders from both — so the helper arms a listener for BOTH
    // responses before the upload (a response that lands before the wait is
    // armed cannot be missed) and requires each to answer 200.
    const computes = Promise.all(
        (["epicycles", "bases"] as const).map((kind) =>
            page.waitForResponse(
                (r) =>
                    r.request().method() === "POST" &&
                    new URL(r.url()).pathname.endsWith(`/compute/${kind}`),
                { timeout: 60_000 },
            ),
        ),
    );
    const fileInput = page.getByTestId("image-file-input");
    await fileInput.setInputFiles(TEST_IMAGE);
    await page.waitForURL(/\/w\//, { timeout: 15_000 });
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    for (const response of await computes) expect(response.status()).toBe(200);
    // Then the mounted landmark the keystones depend on — NOT a blind fixed
    // timeout. The dock starts collapsed by default (AnimationControls'
    // GlassDock sets `:start-collapsed="true"`), and GlassDock hides the
    // EXPANDED layer (`.dock-layer--full`, `visibility:hidden`) until the dock
    // expands — so the "More options" trigger that lives there is not visible
    // in the default state Keystone-1 asserts against. We therefore settle on
    // the dock's Play/Pause control (the glass `DockControl` in the dock's
    // never-inert `#persistent` region — X.F.W13.b retired the hand-rolled
    // `.play-btn--mini`), which is visible in the default collapsed dock. Using
    // the default-state element keeps the helper from corrupting Keystone-1's
    // default-state a11y check (expanding the dock here would change every
    // keystone's measured DOM).
    await expect(
        page.getByRole("button", { name: /(Play|Pause) animation/ }).first(),
    ).toBeVisible({
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

// X.F.W12 `.a2` (COHESION §0au (b), 2026-09-22) — NOT SERIAL. The block was made
// serial at `ca58321` with no stated reason, and under a full nine-worker run
// one load-slow keystone then skipped every later test, the save-contour
// keystone among them. Each test here owns its bootstrap (`openWorkspace` or
// its own `page.goto`) and each was run ALONE from a fresh page, twice, and
// passed (receipts: value.js `docs/tranches/X/execution/C/F-W12.md`, F.W12.a2),
// so no test depends on a predecessor's state and the config's `fullyParallel`
// default applies.
test.describe("B.W2 — visualization UX coherence (a11y keystones)", () => {
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

        // X.F.W14V.u1 (UIA-F-182, §0bt): Export is the canvas dock's own control
        // (it left the AnimationControls "More options" menu); expand the canvas
        // dock and trigger it to raise the Dialog.
        const canvasDock = page.locator(".controls-dock-anchor .glass-dock");
        await canvasDock.hover();
        // The dock swallows a press that lands mid-expansion (glass's morph guard).
        await expect(canvasDock).toHaveClass(/\bexpanded\b/);
        await expect(canvasDock).not.toHaveAttribute("data-morphing");
        await page.locator('.controls-dock-anchor [aria-label="Export frame"]').click();

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
    // and `SliderControl.vue` renders its subtitle (`[data-row-sub]`) only
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
        // X.F.W12 `.a` (COHESION §0as) — the route's own readiness, not the
        // network's: a fresh context has no cached result, so `/equation` POSTs
        // its first `/api/equations/compute` on mount and renders the Controls
        // card from the answer (the same signal `visual-checkpoint` settles on).
        // The listener is armed before the navigation so the response cannot
        // land unobserved.
        const compute = page.waitForResponse(
            (r) =>
                r.request().method() === "POST" &&
                /\/api\/equations\/compute$/.test(new URL(r.url()).pathname),
            { timeout: 60_000 },
        );
        await page.goto("/equation");
        expect((await compute).status()).toBe(200);

        // Settle on the mount condition this keystone exists for — the rendered
        // `SliderControl` subtitle — not a blind timeout. The "Controls"
        // CollapsibleSection is `:default-open="true"`, and the desktop grid
        // renders the left panel unconditionally (the mobile tab bar is
        // `lg:hidden`), so the subtitle is in the default desktop DOM.
        await expect(page.locator("[data-row-sub]").first()).toBeVisible({
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
        // X.F.W12 `.a` (COHESION §0as) — no network-quiet wait: the route's own
        // mounted landmark below is the readiness signal (`expect` polls it).
        // The compiled article's own H1 — present only once latex-paper has
        // mounted the document body, which is the whole surface being graded.
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
            timeout: 60_000,
        });
        await checkA11y(page, "/paper");
    });

    test("keystone: /morph is a11y-clean", async ({ page }) => {
        await page.goto("/morph");
        // X.F.W12 `.a` (COHESION §0as) — no network-quiet wait: the route's own
        // mounted landmark below is the readiness signal (`expect` polls it).
        // `HarmonicLevelGrid`'s three phase sections are the route's control
        // mass (`HLG-37`'s contrast rungs, `HLG-20`'s rails); grading before
        // they mount would miss every row this route owns.
        await expect(page.getByRole("heading", { name: "Morph", exact: true })).toBeVisible({
            timeout: 60_000,
        });
        await expect(page.getByRole("spinbutton", { name: "Low", exact: true }).first()).toBeVisible({
            timeout: 60_000,
        });
        await checkA11y(page, "/morph");
    });

    test("keystone: /demo/shape-extractor is a11y-clean", async ({ page }) => {
        await page.goto("/demo/shape-extractor");
        // X.F.W12 `.a` (COHESION §0as) — no network-quiet wait: the route's own
        // mounted landmark below is the readiness signal (`expect` polls it).
        // The Sun/Moon figure headings — the two shapes `FSE-*` books, and the
        // same surface whose 375px horizontal amputation the occlusion gate now
        // measures (`visual-baseline.spec.ts`, `FSE-M-4`).
        await expect(page.getByRole("heading", { name: "Moon", exact: true })).toBeVisible({
            timeout: 60_000,
        });
        await checkA11y(page, "/demo/shape-extractor");
    });

    // ── Invariant 19 — auto-recompute regression guard ──
    // X.F.W10S.b (2026-09-22) — UN-FIXME'D ON A FULL-STACK RUN, the product
    // defect this cell booked cured at its root in `workspace.ts`:
    // `saveContourPoints` NULLED `epicycleData`/`basesData` and launched no
    // recompute. Measured before the cure, the nulling did worse than blank the
    // canvas: the next ContourSettings compute trigger saw no data and
    // RE-EXTRACTED the contour from the image (`POST …/extract-contour` ~220 ms
    // after the save), so a saved edit could be replaced by a fresh extraction.
    // The save now recomputes the saved contour, once, keeping the previous
    // frame until the results land.
    //
    // The harness is re-driven through the product. The booked body reached for
    // a `window.__store` / `window.__computeCount` seam that was never built (and
    // called `saveContourPoints()` with no points), so un-fixme'd as written it
    // could only fail on the missing seam or pass without saving anything. It
    // now enters the editor, saves, and returns, by keyboard — the activation
    // path every control owes — and every assertion is kept: the canvas keeps a
    // live render, the controls are unperturbed, and ONE compute pass runs,
    // counted from the network and pinned to the SAVED contour's hash.
    test("save_contour_then_recompute: the saved contour is recomputed in one pass, the canvas keeps its render", async ({
        page,
    }) => {
        await openWorkspace(page);

        const canvas = page.locator("canvas").first();

        // Snapshot the control values before the save so we can assert they
        // are not perturbed by the auto-recompute.
        // X.F.W12 `.a` — the BasisSelector readouts are glass-ui `NumberField`
        // spinbuttons now (an `input` carrying `role="spinbutton"`, not
        // `type="number"`), so the snapshot names that role too; without it the
        // two fields this guard exists to pin would silently drop out of it.
        const controls = page.locator(
            'input[type="number"], input[role="spinbutton"], input[type="range"]',
        );
        const readControls = () =>
            controls
                .evaluateAll((els) => (els as HTMLInputElement[]).map((el) => el.value));
        const controlsBefore = await readControls();

        // Every compute or extraction request issued from here on belongs to
        // the save.
        const computeCalls: string[] = [];
        page.on("request", (req) => {
            const path = new URL(req.url()).pathname;
            if (req.method() === "POST" && /\/(compute\/(epicycles|bases)|extract-contour)$/.test(path))
                computeCalls.push(path);
        });

        // Drive the save through the product, not a store hook: open the
        // contour editor from the canvas dock (keyboard activation — the path
        // every control owes), then press the editor's Save.
        const canvasDock = page.locator(".controls-dock-anchor .glass-dock");
        await canvasDock.hover();
        const editToggle = canvasDock.locator('[aria-label="Edit contour"]');
        await expect(editToggle).toBeVisible({ timeout: 10_000 });
        await editToggle.press("Enter");
        const save = page.getByRole("button", { name: "Save contour" });
        await expect(save).toBeVisible({ timeout: 10_000 });

        const saved = page.waitForResponse(
            (res) => new URL(res.url()).pathname === "/api/contours" && res.request().method() === "POST",
        );
        const recomputed = Promise.all(
            (["epicycles", "bases"] as const).map((kind) =>
                page.waitForResponse((res) =>
                    new URL(res.url()).pathname.endsWith(`/compute/${kind}`),
                ),
            ),
        );
        await save.press("Enter");
        const savedRes = await saved;
        expect(savedRes.ok(), "the contour save itself must succeed").toBe(true);
        const { contour_hash: savedHash } = (await savedRes.json()) as { contour_hash: string };
        const results = await recomputed;
        for (const res of results) expect(res.ok(), `${res.url()} must succeed`).toBe(true);

        // Back to the render, which must be the live chain, not the placeholder.
        await canvasDock.hover();
        await expect(editToggle).toBeVisible({ timeout: 10_000 });
        await editToggle.press("Enter");
        await expect(save).toBeHidden({ timeout: 10_000 });
        await expect(canvas).toBeVisible();
        const box = await canvas.boundingBox();
        expect(box!.width).toBeGreaterThan(0);

        // Controls were not perturbed by the auto-recompute. (The left panel
        // remounts on leaving the editor; its controls are awaited, then read.)
        await expect(controls).toHaveCount(controlsBefore.length, { timeout: 10_000 });
        expect(await readControls()).toEqual(controlsBefore);

        // A single compute pass — not a recompute storm — and it is the SAVED
        // contour that is computed: no re-extraction from the image replaces it.
        expect(computeCalls.sort()).toEqual([
            `/api/contours/${savedHash}/compute/bases`,
            `/api/contours/${savedHash}/compute/epicycles`,
        ]);
    });
});
