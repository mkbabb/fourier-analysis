import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * X.F.W14V `.u2` — the equation rows re-homed by F-W14U.md addendum (h)
 * (`.vedit` E-1, `.eq` E-2 and E-4).
 *
 * e85  UIA-F-85 ⊕ F-241 (glyph and ink limbs) — the notation hues are the ONE
 *      palette's tokens (theme-aware), with fourier's hues kept (§0da): Trig
 *      red, Exp blue, Polar violet; every glyph is KaTeX, no Unicode
 *      superscript at an odd baseline.
 * e201 UIA-F-201 (server limb) — the Σ upper bound is the displayed N, the
 *      same N the Harmonics field, the legend and the timeline show, under
 *      Auto and with Auto off.
 * e253 UIA-F-253 (server limbs) — coefficient hover works in the expanded
 *      form too; the default x(π−x), a polynomial, is "Exact", never
 *      "Conjectured".
 *
 * F-203's primitive limb (one glass Popover/Tooltip on a virtual anchor) is
 * honest-RED O-82 POPOVER-ANCHOR: glass exports no virtual anchor, and no
 * hand-rolled positioning is built. No case here.
 *
 * Served from :3100 (BASE_URL) against the API on :8000. `FW14V_PHASE` names
 * the frames (before/after).
 */

const PHASE = process.env.FW14V_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14v/u2";
const LOAD = 90_000;

async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png` });
}

async function openEquation(page: Page): Promise<Locator> {
    await page.goto("/equation");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const card = page.locator(".eq-card");
    await expect(card.locator(".katex").first()).toBeVisible({ timeout: LOAD });
    return card;
}

async function seriesTex(card: Locator): Promise<string> {
    return (await card.locator(".katex-mathml annotation").first().textContent()) ?? "";
}

function sigmaBound(tex: string): number {
    const m = tex.match(/\\sum_\{n=-?\d*\}\^\{(\d+)\}/);
    return m ? Number(m[1]) : NaN;
}

/** The hue (HSL degrees) of a CSS colour, read back as sRGB pixels from a canvas. */
async function hueOf(item: Locator, css: string): Promise<number> {
    return item.evaluate((el, value) => {
        const probe = document.createElement("span");
        probe.style.color = value;
        el.appendChild(probe);
        const used = getComputedStyle(probe).color;
        probe.remove();
        const c = document.createElement("canvas");
        c.width = c.height = 1;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = used;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data).map((v) => v / 255);
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        if (d === 0) return NaN;
        let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h *= 60;
        return h < 0 ? h + 360 : h;
    }, css);
}

function hueDistance(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

test.setTimeout(240_000);

test.describe("e85 · UIA-F-85 ⊕ F-241 — notation hues on the palette tokens; KaTeX glyphs", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    for (const scheme of ["light", "dark"] as const) {
        test(`token inks with fourier's hues kept; KaTeX glyphs (${scheme})`, async ({ page }) => {
            await page.emulateMedia({ colorScheme: scheme });
            await openEquation(page);
            const group = page.getByRole("radiogroup", { name: "Notation" });
            // The authored hues this row keeps (§0da): Trig red, Exp blue, Polar violet.
            const kept: Record<string, number> = { Trig: 6, Exp: 224, Polar: 286 };
            for (const [name, hue] of Object.entries(kept)) {
                const item = group.getByRole("radio", { name: new RegExp(name) });
                const ink = await item.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--pill-color").trim());
                expect(ink, `${name} ink is a palette token`).toMatch(/^var\(--(viz|section-color)-[a-z0-9-]+\)$/);
                expect(hueDistance(await hueOf(item, ink), hue), `${name} keeps its hue`).toBeLessThan(30);
                const glyph = item.locator(".notation-glyph");
                await expect(glyph.locator(".katex"), `${name} glyph is KaTeX`).toHaveCount(1);
                expect(await glyph.textContent()).not.toMatch(/[⁰-₟]/);
            }
            await frame(page, `e85-notation-${scheme}`);
        });
    }
});

test.describe("e201 · UIA-F-201 (server limb) — Σ is bounded at the displayed N", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("under Auto and with Auto off, Σ's bound = the Harmonics field = the legend", async ({ page }) => {
        const card = await openEquation(page);
        const field = page.getByRole("spinbutton", { name: "Harmonics", exact: true });
        const legend = page.getByRole("region", { name: "Curve legend" });
        const agree = async () => {
            const n = Number(await field.inputValue());
            await expect.poll(async () => sigmaBound(await seriesTex(card)), { timeout: LOAD }).toBe(n);
            expect((await legend.locator(".legend-entry").count()) - 2).toBe(n);
            return n;
        };
        const auto = await agree();
        expect(auto).toBeLessThan(20);
        await frame(page, "e201-auto");
        await page.getByRole("button", { name: "Auto-select harmonics by Parseval energy" }).click();
        const manual = await agree();
        expect(manual).toBe(20);
        await frame(page, "e201-manual");
    });
});

test.describe("e253 · UIA-F-253 (server limbs) — expanded hover; an honest tier", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("a coefficient hover in the expanded form opens the coefficient popover", async ({ page }) => {
        const card = await openEquation(page);
        await card.getByRole("button", { name: "Expanded terms" }).click();
        const hook = card.locator(".eq-coeff").first();
        await expect(hook).toBeVisible({ timeout: LOAD });
        await hook.hover();
        await expect(card.locator(".coeff-popover")).toBeVisible();
        await frame(page, "e253-expanded-hover");
    });

    test("the default x(π−x) is Exact, not Conjectured", async ({ page }) => {
        await openEquation(page);
        await page.getByRole("button", { name: "About this approximation" }).hover();
        const info = page.getByRole("dialog", { name: "About this approximation" })
            .or(page.locator(".info-hovercard"));
        await expect(info.first()).toBeVisible();
        await expect(info.first()).toContainText("Exact");
        await expect(info.first()).not.toContainText("Conjectured");
        await frame(page, "e253-tier");
    });
});
