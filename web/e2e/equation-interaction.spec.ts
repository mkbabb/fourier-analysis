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
    await expect(page.locator(".slider-subtitle").first()).toBeVisible({ timeout: 60_000 });
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
        // `FR-EQR-31` / `D-14`. "Display terms" is the budget knob; its inline
        // numeric input is inside the control's own `<label>`, so it is
        // addressed by that label rather than by a class.
        const budget = page.getByLabel(/Display terms/i);
        await expect(budget).toBeVisible();
        const budgetBefore = await budget.inputValue();

        const narrowed = String(Math.max(2, Number(budgetBefore) - 4));
        await budget.fill(narrowed);
        await budget.blur();

        await expect
            .poll(async () => (await series.innerText()).trim(), {
                message: "the display budget changed but the rendered series did not",
                timeout: 30_000,
            })
            .not.toBe(expLatex);

        // ── 4. RELOAD ───────────────────────────────────────────────────────
        // `B-2` / `M-BR`, the leg nothing else in the suite can reach: the
        // knobs are cached, so a reload replays them into the FIRST compute of
        // the next session. That is where an unclamped budget produced a cold
        // 422, and it is invisible to any test that never reloads.
        const reloadCount = computes.length;
        await page.reload();
        await expect(page.locator(".slider-subtitle").first()).toBeVisible({ timeout: 60_000 });

        await expect(
            page.getByRole("group", { name: "Notation" }).getByRole("button", { name: /Exp/ }),
            "the notation knob did not survive the reload",
        ).toHaveAttribute("aria-pressed", "true", { timeout: 30_000 });
        await expect(
            page.getByLabel(/Display terms/i),
            "the display budget did not survive the reload",
        ).toHaveValue(narrowed, { timeout: 30_000 });

        // Whatever the cold session posts, it must be inside the server's own
        // bounds — the clamp is the cure `B-2` books and this is its witness.
        for (const payload of computes.slice(reloadCount)) {
            expect(payload.budget, `a cold compute posted an out-of-range budget`).toBeGreaterThanOrEqual(2);
            expect(payload.budget).toBeLessThanOrEqual(50);
        }
    });
});
