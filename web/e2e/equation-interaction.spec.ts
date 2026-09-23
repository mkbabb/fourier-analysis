// SERVED MODEL: claude-opus-5[1m]
import { test, expect, type Page, type Request } from "@playwright/test";

/**
 * X·F F.W9 `.b` — the **S2 seat** (`G-F9-6`): ONE `/equation` interaction spec,
 * `compute → notation → budget → reload`.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * AXE-SEAT ECONOMY (§4a-7): AUTHORED ONCE, CITED SIX TIMES
 * ════════════════════════════════════════════════════════════════════════════
 * `FR-EQR-6` · `FR-EQR-31` · `FR-EMT-11` · `FunctionInput C-13` · `C·D-28` ·
 * `EquationView D·D-B2` all name the SAME fact: `/equation` carried exactly one
 * e2e reference — an assertion-free screenshot slug — and since F.W0/F.W4 one
 * axe keystone. Neither drives the route. `fr-EquationView` banks what this one
 * spec would have caught: *"would have caught B-1, B-2, C-29, D-07 and D-14
 * mechanically"*, of *"one interaction spec (compute → notation → budget →
 * reload)"*. This is that spec, and it is not cloned anywhere.
 *
 * ⊘ THE AXE PASS IS NOT REPEATED HERE. `visualization-ux.spec.ts`'s
 * *"keystone: /equation is a11y-clean"* is the route's ONE axe artifact
 * (`G-F9-5`); a second would be the rival oracle `KF.W4` forbids. This seat is
 * the BEHAVIOURAL half and cites that keystone rather than re-running it.
 *
 * ⊘ F.W9 OWNS GATES AND NO CURE. `FR-EQR-6`'s tabindex/`aria-label` and
 * `D·D-B2`'s two labels are F.W3/W4's cures, cited as admissibility
 * preconditions and repaired nowhere in this file.
 *
 * ── WHY THE REQUESTS ARE OBSERVED AND NOT STUBBED ──
 * `B-1`/`M-CK` and `B-2`/`M-BR` are defects in what the client SENDS: the
 * compute key once carried four fields while the POST carried seven (so a
 * notation or budget change silently reused a stale result), and `budget` is
 * bounded `ge=2, le=50` server-side, which a persisted out-of-range value used
 * to violate on the next session's cold compute. A stub would assert the
 * client against a fiction. The real endpoint is called and the payloads are
 * READ off the wire, so the assertions are about the shipped request and the
 * shipped response together.
 */

const COMPUTE_URL = /\/api\/equations\/compute$/;

interface ComputePayload {
    expression?: string;
    notation?: string;
    budget?: number;
    n_harmonics?: number;
}

/** Collect every compute POST body, in order, for assertions after the fact. */
function recordComputes(page: Page): ComputePayload[] {
    const seen: ComputePayload[] = [];
    page.on("request", (req: Request) => {
        if (req.method() !== "POST" || !COMPUTE_URL.test(new URL(req.url()).pathname)) return;
        try {
            seen.push(JSON.parse(req.postData() ?? "{}") as ComputePayload);
        } catch {
            // A compute POST whose body does not parse is itself a finding, so
            // it is recorded as an empty payload rather than dropped — the
            // assertions below then fail on the missing fields.
            seen.push({});
        }
    });
    return seen;
}

/** The route's own mount condition — never a blind timeout. */
async function openEquation(page: Page): Promise<void> {
    await page.goto("/equation");
    await expect(page.locator("[data-row-sub]").first()).toBeVisible({ timeout: 60_000 });
}

/** The rendered series, which is the surface every leg below reads. */
function renderedSeries(page: Page) {
    return page.getByRole("region", { name: "Rendered Fourier series" });
}

test.describe("S2 — /equation: compute → notation → budget → reload (G-F9-6)", () => {
    test("the four-step interaction drives the route and its requests", async ({ page }) => {
        const computes = recordComputes(page);

        // ── 1. COMPUTE ──────────────────────────────────────────────────────
        await openEquation(page);

        const compute = page.getByRole("button", { name: "Compute" });
        await expect(compute).toBeVisible({ timeout: 30_000 });
        // `D·D-m6`: Compute with an empty expression used to be a dead button.
        // It is `:disabled` on an empty expression now, so an enabled button is
        // a precondition of this step rather than an assumption of it.
        await expect(compute).toBeEnabled();

        const computeResponse = page.waitForResponse(
            (r) => COMPUTE_URL.test(new URL(r.url()).pathname) && r.request().method() === "POST",
            { timeout: 60_000 },
        );
        await compute.click();
        const first = await computeResponse;
        expect(
            first.status(),
            "the default expression must compute — a 422 here is `B-2`'s cold-start shape",
        ).toBe(200);

        const series = renderedSeries(page);
        await expect(series).toBeVisible({ timeout: 60_000 });
        await expect(series.locator(".katex").first()).toBeVisible({ timeout: 30_000 });
        const trigLatex = (await series.innerText()).trim();
        expect(trigLatex.length, "the series region rendered nothing").toBeGreaterThan(0);

        // `B-1` / `M-CK`, mechanically: the POST must carry the two knobs the
        // server reads to build the response. A payload missing either is the
        // exact shape that let a stale result survive a knob change.
        expect(computes.length).toBeGreaterThan(0);
        const firstPayload = computes[computes.length - 1]!;
        expect(firstPayload).toMatchObject({ notation: "trig" });
        expect(typeof firstPayload.budget).toBe("number");

        // ── 2. NOTATION ─────────────────────────────────────────────────────
        // `FR-EMT-11` / `C·D-28`. The pills are a `role="group"` named
        // "Notation" whose members carry `aria-pressed` — the state contract.
        const notation = page.getByRole("group", { name: "Notation" });
        await expect(notation).toBeVisible();
        const exp = notation.getByRole("button", { name: /Exp/ });
        await expect(exp).toHaveAttribute("aria-pressed", "false");
        await exp.click();
        await expect(exp).toHaveAttribute("aria-pressed", "true", { timeout: 10_000 });

        // The rendered series must actually change: notation is server-read
        // (`render_latex_sigma(terms, notation)`), so a pill that flips its own
        // state without re-rendering is `D-07`'s shape exactly.
        await expect
            .poll(async () => (await series.innerText()).trim(), {
                message: "the notation pill flipped but the rendered series did not change",
                timeout: 30_000,
            })
            .not.toBe(trigLatex);
        const expLatex = (await series.innerText()).trim();

        // ── 3. BUDGET ───────────────────────────────────────────────────────
        // `FR-EQR-31` / `D-14`. "Display terms" is the budget knob, and the
        // knob is THREE labelled nodes, not one: `SliderControl` names its
        // inline numeric input through the wrapping `<label>`, and passes the
        // same `label` down as `aria-label` on both the producer's slider host
        // and reka-ui's `role="slider"` thumb. A bare `getByLabel` therefore
        // resolves to 3 elements and dies of strict mode before it asserts
        // anything — X.F.W9 repair 1, PART 1 of the cure for `Check 1`'s `HIGH-1`.
        // The leg drives the NUMERIC input (it reads and fills a value), so it
        // is addressed by that role; the two slider nodes carry no value to
        // fill and are a different control surface.
        const budget = page.getByRole("spinbutton", { name: /display terms/i });
        await expect(budget).toBeVisible();
        const budgetBefore = await budget.inputValue();

        // THE BUDGET GOVERNS THE EXPANDED RENDER, NOT THE SIGMA ONE — X.F.W9
        // repair 1, PART 2 of `HIGH-1`'s cure, found by executing the
        // leg the locator defect had made unreachable. `eqMode` starts at
        // `"sigma"` and `activeLatex` then prefers `latex_sigma`, which the
        // server builds with `render_latex_sigma(terms, notation)` — a function
        // that takes NO budget. Only `latex` (`simplify_series(terms, budget,
        // notation)`) is budget-determined, and the control says so on its own
        // face (`subtitle="shown in expanded (a+b) view"`). Asserting the sigma
        // render changes under a budget edit therefore asserted something the
        // product does not claim and could never do; the mode is switched to
        // the surface the knob actually drives, which is also `B-1`'s shape —
        // a knob change that silently reuses a stale result.
        const modeToggle = page.getByRole("group", { name: "Equation display mode" });
        const expandedMode = modeToggle.getByRole("button", { name: /Expanded terms/i });
        await expandedMode.click();
        await expect(expandedMode).toHaveAttribute("aria-pressed", "true", { timeout: 10_000 });
        await expect(series.locator(".katex").first()).toBeVisible({ timeout: 30_000 });
        const expandedBefore = (await series.innerText()).trim();
        expect(
            expandedBefore.length,
            "the expanded (a+b) render is empty — the budget leg has no surface to read",
        ).toBeGreaterThan(0);
        // `FR-EMT-11`: the toggle must change the SURFACE, not just its own
        // `aria-pressed`. If the two modes render identically the budget leg
        // below would be reading the sigma string under another name.
        expect(
            expandedBefore,
            "the display-mode toggle flipped but the rendered surface did not change",
        ).not.toBe(expLatex);

        const narrowed = String(Math.max(2, Number(budgetBefore) - 4));
        expect(
            narrowed,
            "the budget did not actually move — the leg would assert nothing",
        ).not.toBe(budgetBefore);
        await budget.fill(narrowed);
        await budget.blur();

        await expect
            .poll(async () => (await series.innerText()).trim(), {
                message: "the display budget changed but the rendered series did not",
                timeout: 30_000,
            })
            .not.toBe(expandedBefore);

        // A poll is satisfied by any sample that differs, and a recompute's
        // transient empty frame differs. The SETTLED render is therefore read
        // back and asserted non-empty, so a blank mid-flight state cannot green
        // this leg on its way past.
        const expandedAfter = (await series.innerText()).trim();
        expect(
            expandedAfter.length,
            "the budget edit left the expanded render empty — a transient, not a re-render",
        ).toBeGreaterThan(0);

        // ── 4. RELOAD ───────────────────────────────────────────────────────
        // `B-2` / `M-BR`, the leg nothing else in the suite can reach: the
        // knobs are cached, so a reload replays them into the FIRST compute of
        // the next session. That is where an unclamped budget produced a cold
        // 422, and it is invisible to any test that never reloads.
        const reloadCount = computes.length;
        await page.reload();
        await expect(page.locator("[data-row-sub]").first()).toBeVisible({ timeout: 60_000 });

        await expect(
            page.getByRole("group", { name: "Notation" }).getByRole("button", { name: /Exp/ }),
            "the notation knob did not survive the reload",
        ).toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });
        await expect(
            page.getByRole("spinbutton", { name: /display terms/i }),
            "the display budget did not survive the reload",
        ).toHaveValue(narrowed, { timeout: 30_000 });

        // THE COLD COMPUTE IS DRIVEN, NOT AWAITED — X.F.W9 repair 1, PART 3 of
        // `HIGH-1`'s cure, and again a thing only execution could show.
        // The restored inputs re-derive the SAME `computeKey`, so the mount's
        // `if (!result.value || computeKey(…) !== lastComputeKey)` memo-hits and
        // the cold session posts NOTHING: measured over this leg's own run,
        // `slice(reloadCount)` was empty and the bounds loop below asserted
        // zero times — precisely the vacuity `G-F9-7` exists to abolish. The
        // Compute button is `@compute="doCompute(true)"`, the one force path,
        // so one click IS "the first compute of the next session" carrying the
        // knobs the reload replayed. The roster is asserted non-empty first, so
        // a future memo that swallowed this POST would redden the leg instead
        // of emptying it.
        const coldResponse = page.waitForResponse(
            (r) => COMPUTE_URL.test(new URL(r.url()).pathname) && r.request().method() === "POST",
            { timeout: 60_000 },
        );
        await page.getByRole("button", { name: "Compute" }).click();
        const cold = await coldResponse;
        expect(
            cold.status(),
            "the restored knobs 422'd on the cold compute — `B-2`'s shape exactly",
        ).toBe(200);

        const coldPayloads = computes.slice(reloadCount);
        expect(
            coldPayloads.length,
            "no compute was posted after the reload — the bounds witness below would assert nothing",
        ).toBeGreaterThan(0);
        expect(
            coldPayloads[coldPayloads.length - 1]!.budget,
            "the cold compute did not carry the budget the reload restored",
        ).toBe(Number(narrowed));

        // Whatever the cold session posts, it must be inside the server's own
        // bounds — the clamp is the cure `B-2` books and this is its witness.
        for (const payload of coldPayloads) {
            expect(payload.budget, `a cold compute posted an out-of-range budget`).toBeGreaterThanOrEqual(2);
            expect(payload.budget).toBeLessThanOrEqual(50);
        }
    });
});
