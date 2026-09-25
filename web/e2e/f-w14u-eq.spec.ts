// SERVED MODEL: claude-opus-5-5
import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * X.F.W14U.eq — the equation explorer (spec `F-W14U.md` Units :8-18; register
 * `audit/UI-AUDIT-fourier.md` section equation-explorer). One case per cured
 * row; every case frames the served page under `FW14U_PHASE` (before | after)
 * in `e2e/screenshots/f-w14u/eq/`.
 *
 * q35   UIA-F-35 (consumer) — the expanded series keeps whole harmonics
 *       (a4 = -0.0625 at 8, never the split -0.031); the control and the
 *       Coefficients layer count harmonics (DC as one), not exponential terms.
 * q112  UIA-F-112 (consumer) — an invalid f(x) marks the Expression field
 *       (aria-invalid, the server's detail under it) and offers no Retry.
 * q113  UIA-F-113 — at 390 the failure is visible on the Controls pane.
 * q114  UIA-F-114 ⊕ F-207 — the column is three glass ConfiguratorLayers (one
 *       idiom); the local CollapsibleSection is gone, and no ancestor clips a
 *       button's shadow into a hard rectangle.
 * q201  UIA-F-201 — the equation, the legend and the timeline speak one
 *       variable and one harmonic count.
 * q202  UIA-F-202 — status is out of flow: a recompute and a transient failure
 *       move nothing; the busy mark is glass Progress; a stale result is marked.
 * q203  UIA-F-203 — the two floating surfaces share the glass popover radius.
 * q204  UIA-F-204 — Notation and Presets are one-of-N ToggleGroups.
 * q205  UIA-F-205 — the plot holds its data: no curve under the plot box, and
 *       the legend sits beside the curves, not on them.
 * q206  UIA-F-206 — no consumer text below the caption rung; at 390 the
 *       Parseval button stays in the Harmonics row.
 * q253  UIA-F-253 — glass Badge for the tier, lucide glyphs on Play, a
 *       translucent 390 tab strip, a sweep-front mark while paused mid-sweep.
 *
 * Data: none written. The API computes each request (a fresh context has no
 * cached result); the waits are sized for a loaded host.
 */

const PHASE = process.env.FW14U_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14u/eq";
const LOAD = 90_000;

async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png` });
}

/** Open /equation and wait for the first rendered series. */
async function openEquation(page: Page, canvas = false): Promise<Locator> {
    await page.goto("/equation");
    if (canvas && page.viewportSize()!.width < 1024) await page.getByRole("tab", { name: "Canvas" }).click();
    const card = page.locator(".eq-card");
    if (canvas || page.viewportSize()!.width >= 1024) {
        await expect(card.locator(".katex").first()).toBeVisible({ timeout: LOAD });
    }
    return card;
}

/** The TeX source of the rendered series (KaTeX's MathML annotation). */
async function seriesTex(card: Locator): Promise<string> {
    return (await card.locator(".katex-mathml annotation").first().textContent()) ?? "";
}

/** The Expression field, by its label. */
function expressionField(page: Page): Locator {
    return page.getByRole("textbox", { name: "Expression" });
}

test.setTimeout(240_000);

test.describe("q35 · UIA-F-35 (consumer) — whole harmonics, counted as harmonics", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("a4 reads -0.0625 at 8 shown; the control and the list count harmonics", async ({ page }) => {
        const card = await openEquation(page);
        const harmonics = page.getByRole("spinbutton", { name: "Harmonics", exact: true });
        const n = Number(await harmonics.inputValue());
        // The display control names the unit it moves, and reaches every harmonic plus DC.
        const shown = page.getByRole("spinbutton", { name: /displayed harmonics/i });
        await expect(shown).toBeVisible();
        await expect(shown).toHaveAttribute("aria-valuemax", String(n + 1));
        await shown.fill("8");
        await shown.press("Enter");
        await card.getByRole("button", { name: /Expanded|a \+ b/ }).first().click();
        await expect.poll(() => seriesTex(card), { timeout: LOAD }).toMatch(/0\.06(25|2|3)\b/);
        expect(await seriesTex(card)).not.toMatch(/0\.031\b/);
        // The list names its count in the same unit: 41 exponential terms = 21 harmonics.
        const layer = page.locator(".configurator-layer").filter({ hasText: "Coefficients" });
        await expect(layer).toContainText(/21 harmonics/);
        await expect(layer).not.toContainText(/41 terms/);
        await frame(page, "q35-expanded-8");
    });
});

test.describe("q112 · UIA-F-112 (consumer) — an invalid f(x) marks its field", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("aria-invalid + the server's detail under the field; no Retry on a 4xx", async ({ page }) => {
        await openEquation(page);
        const f = expressionField(page);
        await f.fill("sin((x");
        await f.press("Enter");
        await expect(f).toHaveAttribute("aria-invalid", "true", { timeout: LOAD });
        await expect(f).toHaveAttribute("aria-describedby", /\S/);
        const ids = ((await f.getAttribute("aria-describedby")) ?? "").split(/\s+/).filter(Boolean);
        expect(ids.length).toBeGreaterThan(0);
        const said = await Promise.all(ids.map((id) => page.locator(`[id="${id}"]`).textContent()));
        expect(said.join(" ")).toMatch(/Cannot parse/);
        await expect(page.getByRole("button", { name: /^(Retry|Try again)$/ })).toHaveCount(0);
        await frame(page, "q112-invalid");
        await f.fill("x*(pi - x)");
        await expect(f).not.toHaveAttribute("aria-invalid", "true");
    });
});

test.describe("q113 · UIA-F-113 — at 390 the failure shows where the user types", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("the Controls pane carries the field's error, inside the viewport", async ({ page }) => {
        await openEquation(page);
        const f = expressionField(page);
        await f.fill("foo(x)");
        await f.press("Enter");
        await expect(f).toHaveAttribute("aria-invalid", "true", { timeout: LOAD });
        await expect(f).toHaveAttribute("aria-describedby", /\S/);
        const id = ((await f.getAttribute("aria-describedby")) ?? "").split(/\s+/).filter(Boolean).pop()!;
        const err = page.locator(`[id="${id}"]`);
        await expect(err).toBeVisible();
        await expect(err).toContainText(/Unknown function|foo/);
        const b = (await err.boundingBox())!;
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(390);
        await frame(page, "q113-controls-invalid");
    });
});

test.describe("q114 · UIA-F-114 ⊕ F-207 — one disclosure idiom; no clipped shadow", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("three glass ConfiguratorLayers, no local CollapsibleSection, no clipping ancestor", async ({ page }) => {
        await openEquation(page);
        // X.F.W14V.eq2: the column is the Configurator aside's body; the scroll
        // port is glass's (`scroll-mode="auto"`), above it.
        const col = page.locator(".eq-panel-left-wrap");
        await expect(col.locator(".configurator-layer")).toHaveCount(3);
        await expect(col.locator(".collapsible-section")).toHaveCount(0);
        const sizes = await col.locator(".configurator-section-label").evaluateAll((els) =>
            els.map((e) => getComputedStyle(e).fontSize));
        expect(sizes.length).toBe(3);
        expect(new Set(sizes).size).toBe(1);
        // F-207: every body button's shadow extent (its box grown by each
        // shadow's offset, blur and spread) lies inside every CONSUMER clipping
        // ancestor between it and the column (the column's own scroll port
        // excluded). The glass layer's collapse region (the direct child of
        // `.configurator-layer-region`) is the producer's clip, relayed, not
        // measured here.
        const clippers = await col.evaluate((root) => {
            const out: string[] = [];
            for (const b of root.querySelectorAll<HTMLElement>(".configurator-layer-body button")) {
                const r = b.getBoundingClientRect();
                if (!r.width) continue;
                let [t, rt, bt, l] = [0, 0, 0, 0];
                const shadow = getComputedStyle(b).boxShadow;
                if (shadow && shadow !== "none") {
                    for (const s of shadow.replace(/(rgba?|oklch|oklab|color)\([^)]*\)/g, "").split(",")) {
                        if (/inset/.test(s)) continue;
                        const [x = 0, y = 0, blur = 0, spread = 0] = s.trim().split(/\s+/).map(parseFloat).filter((n) => !Number.isNaN(n));
                        const e = blur + spread;
                        t = Math.max(t, e - y); bt = Math.max(bt, e + y); l = Math.max(l, e - x); rt = Math.max(rt, e + x);
                    }
                }
                const ext = { top: r.top - t, right: r.right + rt, bottom: r.bottom + bt, left: r.left - l };
                for (let a = b.parentElement; a && a !== root; a = a.parentElement) {
                    const cs = getComputedStyle(a);
                    if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
                    if (a.parentElement?.classList.contains("configurator-layer-region")) continue;
                    const m = parseFloat(cs.getPropertyValue("overflow-clip-margin") || "0") || 0;
                    const ar = a.getBoundingClientRect();
                    if (ext.top < ar.top - m - 0.5 || ext.bottom > ar.bottom + m + 0.5
                        || ext.left < ar.left - m - 0.5 || ext.right > ar.right + m + 0.5) {
                        out.push(`${b.textContent?.trim().slice(0, 12)} ⊄ ${`${a.className}`.slice(0, 40)}`);
                    }
                }
            }
            return [...new Set(out)];
        });
        expect(clippers).toEqual([]);
        await frame(page, "q114-column");
    });
});

test.describe("q201 · UIA-F-201 — one variable, one harmonic count", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("the legend speaks the equation's variable; legend, timeline and field agree on N", async ({ page }) => {
        const card = await openEquation(page);
        const v = (await seriesTex(card)).match(/f\s*\(\s*([a-z])\s*\)/)?.[1];
        expect(v).toBeTruthy();
        const legend = page.getByRole("region", { name: "Curve legend" });
        await expect(legend).toContainText(`f(${v})`);
        await expect(legend).not.toContainText(v === "x" ? "f(t)" : "f(x)");
        const n = Number(await page.getByRole("spinbutton", { name: "Harmonics", exact: true }).inputValue());
        const entries = await legend.locator(".legend-entry").count();
        expect(entries - 2).toBe(n);
        const count = (await page.locator(".timeline-count").textContent()) ?? "";
        expect(count).toMatch(new RegExp(`/${n}$`));
        await frame(page, "q201-legend");
    });
});

test.describe("q202 · UIA-F-202 — status out of flow; a stale result is marked", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("a recompute and a transient failure move nothing; the busy mark is glass Progress", async ({ page }) => {
        const card = await openEquation(page);
        const plot = page.locator(".convergence-container");
        const top0 = (await plot.boundingBox())!.y;
        const eqTop0 = (await card.boundingBox())!.y;
        await page.route("**/api/equations/compute", async (r) => {
            await new Promise((res) => setTimeout(res, 3000));
            await r.continue();
        });
        await page.locator('[aria-label="Notation"]').getByText("Exp").click();
        // The busy status (the timeline's harmonic count is a status too, always on screen).
        const status = page.locator(".eq-panel-right [role=status]").filter({ has: page.getByRole("progressbar") }).first();
        await expect(status).toBeVisible({ timeout: 10_000 });
        expect(Math.abs((await plot.boundingBox())!.y - top0)).toBeLessThan(1);
        expect(Math.abs((await card.boundingBox())!.y - eqTop0)).toBeLessThan(1);
        await frame(page, "q202-recompute");
        await expect(status).toBeHidden({ timeout: LOAD });
        // The new notation's series has its own height: re-read the settled layout.
        await page.waitForTimeout(500);
        const top1 = (await plot.boundingBox())!.y;
        const eqTop1 = (await card.boundingBox())!.y;
        await page.unroute("**/api/equations/compute");
        await page.route("**/api/equations/compute", (r) => r.fulfill({
            status: 503,
            contentType: "application/problem+json",
            body: JSON.stringify({ type: "about:blank", title: "Service Unavailable", status: 503, detail: "The compute service is unavailable" }),
        }));
        await page.getByRole("button", { name: "Compute" }).click();
        const alert = page.locator(".eq-panel-right [role=alert]").first();
        await expect(alert).toBeVisible({ timeout: 20_000 });
        await expect(alert.getByRole("button", { name: "Retry" })).toBeVisible();
        await expect(card).toHaveAttribute("data-stale", "true");
        expect(Math.abs((await plot.boundingBox())!.y - top1)).toBeLessThan(1);
        expect(Math.abs((await card.boundingBox())!.y - eqTop1)).toBeLessThan(1);
        await page.waitForTimeout(400); // the plate's fade settles before the frame
        await frame(page, "q202-transient-error");
    });
});

/** The glass popover surface's corner (`.popover-content` → `--radius-panel`), resolved. */
async function canonRadius(page: Page): Promise<string> {
    return page.evaluate(() => {
        const d = document.createElement("div");
        d.style.borderRadius = "var(--radius-panel)";
        document.body.append(d);
        const v = getComputedStyle(d).borderTopLeftRadius;
        d.remove();
        return v;
    });
}

test.describe("q203 · UIA-F-203 — one floating-surface canon", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("the coefficient popover and the plot tooltip wear the glass popover radius", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        const card = await openEquation(page);
        const canon = await canonRadius(page);
        await card.locator(".eq-coeff").first().hover();
        const pop = page.locator(".coeff-popover");
        await expect(pop).toBeVisible();
        expect(await pop.evaluate((e) => getComputedStyle(e).borderTopLeftRadius)).toBe(canon);
        await frame(page, "q203-coeff-popover");
        // Walk the pointer down the plot's centre until a curve answers.
        const box = (await page.locator(".convergence-container canvas").boundingBox())!;
        const tip = page.locator(".curve-tooltip");
        for (let y = box.y + 4; y < box.y + box.height - 4; y += 3) {
            await page.mouse.move(box.x + box.width * 0.37, y);
            if (await tip.isVisible()) break;
        }
        await expect(tip).toBeVisible();
        expect(await tip.evaluate((e) => getComputedStyle(e).borderTopLeftRadius)).toBe(canon);
        await frame(page, "q203-plot-tooltip");
    });
});

test.describe("q204 · UIA-F-204 — single-choice sets are ToggleGroups", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("Notation and Presets are radiogroups of radios; the current one is checked", async ({ page }) => {
        await openEquation(page);
        const notation = page.getByRole("radiogroup", { name: "Notation" });
        await expect(notation.getByRole("radio")).toHaveCount(3);
        await expect(notation.getByRole("radio", { name: /Trig/ })).toHaveAttribute("aria-checked", "true");
        const presets = page.getByRole("radiogroup", { name: "Presets" });
        await expect(presets.getByRole("radio", { name: "x(π−x)" })).toHaveAttribute("aria-checked", "true");
        await frame(page, "q204-choosers");
    });
});

test.describe("q205 · UIA-F-205 — the plot holds its own data", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("no curve below the plot box; the legend beside the curves", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await openEquation(page);
        const canvas = page.locator(".convergence-container canvas");
        await page.waitForTimeout(1500);
        // PAD.bottom is 18 css px: below the plot box only grey axis ink may paint.
        const coloured = await canvas.evaluate((c: HTMLCanvasElement) => {
            const dpr = c.width / c.getBoundingClientRect().width;
            const rows = Math.floor(16 * dpr);
            const img = c.getContext("2d")!.getImageData(0, c.height - rows, c.width, rows).data;
            let n = 0;
            for (let i = 0; i < img.length; i += 4) {
                if (img[i + 3] > 40 && Math.max(img[i], img[i + 1], img[i + 2]) - Math.min(img[i], img[i + 1], img[i + 2]) > 60) n++;
            }
            return n;
        });
        expect(coloured).toBe(0);
        const legend = (await page.getByRole("region", { name: "Curve legend" }).boundingBox())!;
        const plot = (await canvas.boundingBox())!;
        const overlap = legend.x < plot.x + plot.width - 12 && plot.x + 12 < legend.x + legend.width
            && legend.y < plot.y + plot.height - 18 && plot.y + 14 < legend.y + legend.height;
        expect(overlap).toBe(false);
        await frame(page, "q205-plot");
    });
});

for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test.describe(`q206 · UIA-F-206 — named type rungs; the Harmonics row keeps its controls (${vp.width})`, () => {
        test.use({ viewport: vp, hasTouch: vp.width < 1024 });

        test("no consumer text under the caption rung; the Parseval button sits in its row", async ({ page }) => {
            await openEquation(page, vp.width >= 1024);
            if (vp.width < 1024) await page.waitForTimeout(1500);
            // Glass's own layer chrome (its label and sub rungs, O-59 UIA-F-134) is the producer's.
            // Every consumer text sits on one of glass's named rungs, and none
            // below the caption rung. Read at the fine pointer (the register's
            // desktop frame): on a coarse pointer glass scales its own controls.
            const small = vp.width < 1024 ? [] : await page.evaluate(() => {
                const root = getComputedStyle(document.documentElement);
                const rung = (name: string) => {
                    if (!root.getPropertyValue(name).trim()) return NaN;
                    const d = document.createElement("span");
                    d.style.fontSize = `var(${name})`;
                    document.body.append(d);
                    const v = parseFloat(getComputedStyle(d).fontSize);
                    d.remove();
                    return v;
                };
                const caption = rung("--type-caption");
                const rungs = ["--type-caption", "--type-small", "--type-body", "--type-subheading", "--type-heading", "--type-title", "--type-prose"]
                    .map(rung).filter((v) => !Number.isNaN(v));
                return [...document.querySelectorAll(".eq-grid *")]
                    .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
                    .filter((e) => e.getClientRects().length && !e.closest(".katex, .configurator-layer-trigger, .sr-only, .labeled-field-copy"))
                    .filter((e) => {
                        const px = parseFloat(getComputedStyle(e).fontSize);
                        return px < caption - 0.01 || !rungs.some((v) => Math.abs(v - px) < 0.05);
                    })
                    .map((e) => `${e.textContent!.trim().slice(0, 16)}@${getComputedStyle(e).fontSize}`);
            });
            expect(small).toEqual([]);
            if (vp.width < 1024) {
                const auto = (await page.getByRole("button", { name: /Auto-select harmonics/ }).boundingBox())!;
                const field = (await page.getByRole("spinbutton", { name: "Harmonics", exact: true }).boundingBox())!;
                expect(auto.x + auto.width).toBeLessThanOrEqual(vp.width);
                const hit = auto.x < field.x + field.width && field.x < auto.x + auto.width
                    && auto.y < field.y + field.height && field.y < auto.y + auto.height;
                expect(hit).toBe(false);
            }
            await frame(page, "q206-controls");
        });
    });
}

test.describe("q253 · UIA-F-253 — the equation's micro-issues", () => {
    test("glass Badge for the tier; lucide glyphs on Play (1440)", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        const card = await openEquation(page);
        const play = page.getByRole("button", { name: /convergence sweep/ });
        await expect(play.locator("svg.lucide")).toHaveCount(1);
        await expect(play.locator('path[d^="M48 64C"], path[d^="M73 39c"]')).toHaveCount(0);
        await card.getByRole("button", { name: "About this approximation" }).hover();
        const badge = page.locator('[data-slot="badge"]').filter({ hasText: /Exact|Conjectured|Approximate/ });
        await expect(badge.first()).toBeVisible({ timeout: 10_000 });
        await frame(page, "q253-tier-badge");
    });

    test("the 390 tab strip is not an opaque band", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/equation");
        const strip = page.getByRole("tablist").first().locator("xpath=ancestor::div[contains(@class,'lg:hidden')][1]");
        await expect(strip).toBeVisible();
        const alpha = await strip.evaluate((e) => {
            const m = getComputedStyle(e).backgroundColor.match(/rgba?\(([^)]+)\)/);
            const parts = m ? m[1].split(/[ ,/]+/).filter(Boolean) : [];
            return parts.length === 4 ? Number(parts[3]) : 1;
        });
        expect(alpha).toBeLessThan(1);
        await frame(page, "q253-tab-strip");
    });
});
