import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * X.F.W13.a — gate G-a: the radius register and the two owner-named controls
 * (owner frames 1, 2 and 5, 2026-09-23; COHESION §0bc rows OA-13 / OA-14 / OA-17).
 *
 * Every named surface is asserted ON the producer's radius scale — its computed
 * `border-radius` equals the resolved value of the glass token that owns it,
 * read live from this page's own `:root` (never a copied pixel figure) — and
 * every icon-only control is a true circle: `width == height` and a radius of
 * at least half its side. The two controls then ACT: the CONTENTS disclosure
 * collapses and restores the ToC list, and the history control navigates back.
 */

/** Resolve a glass radius token to px on the served page's own `:root`. */
async function tokenPx(page: Page, token: string): Promise<number> {
    return page.evaluate((t) => {
        const probe = document.createElement("div");
        probe.style.borderTopLeftRadius = `var(${t})`;
        document.body.appendChild(probe);
        const px = parseFloat(getComputedStyle(probe).borderTopLeftRadius);
        probe.remove();
        return px;
    }, token);
}

async function box(loc: Locator) {
    return loc.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return {
            w: r.width,
            h: r.height,
            radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
        };
    });
}

async function expectCircle(loc: Locator): Promise<void> {
    const b = await box(loc);
    expect(b.w).toBeGreaterThan(0);
    expect(Math.abs(b.w - b.h)).toBeLessThanOrEqual(0.5);
    expect(b.radius).toBeGreaterThanOrEqual(b.w / 2 - 0.5);
}

async function openPaper(page: Page): Promise<void> {
    await page.goto("/paper");
    await page.waitForLoadState("networkidle", { timeout: 60_000 });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
        timeout: 60_000,
    });
}

test.describe("G-a — F.W13 radius register (frames 1, 2, 5)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("frame 1: the CONTENTS disclosure is a circle and collapses the list", async ({ page }) => {
        await openPaper(page);
        const nav = page.getByRole("navigation", { name: "Table of contents" });
        const toggle = nav.getByRole("button", { name: "Contents", exact: true });
        await expect(toggle).toBeVisible();
        await expectCircle(toggle);

        // The panel it sits on is the producer's panel radius.
        const panel = await box(nav);
        expect(panel.radius).toBe(await tokenPx(page, "--radius-panel"));

        // Every section disclosure beside it is the same icon-only circle.
        const disclosures = nav.getByRole("button", { name: /^Subsections of / });
        expect(await disclosures.count()).toBeGreaterThan(0);
        await expectCircle(disclosures.first());

        const list = nav.locator("ol").first();
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        await expect(list).toBeVisible();
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await expect(nav.locator("[data-toc-id]")).toHaveCount(0);
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        await expect(nav.locator("[data-toc-id]").first()).toBeVisible();
    });

    test("frame 2: the history control is a circle and navigates back", async ({ page }) => {
        await openPaper(page);
        const nav = page.getByRole("navigation", { name: "Table of contents" });
        const scroller = page.locator(".paper-scroll");
        const top = await scroller.evaluate((s) => s.scrollTop);

        await nav.locator("[data-toc-id]").nth(5).click();
        const back = page.getByRole("button", { name: "Back", exact: true });
        await expect(back).toBeVisible();
        await expect
            .poll(() => scroller.evaluate((s) => s.scrollTop))
            .toBeGreaterThan(top + 1000);
        await expectCircle(back);

        const away = await scroller.evaluate((s) => s.scrollTop);
        await back.click();
        await expect
            .poll(() => scroller.evaluate((s) => s.scrollTop))
            .toBeLessThan(away - 1000);
        await expect(back).toBeHidden();
    });

    test("frame 5: every visualizer panel is on the card radius", async ({ page }) => {
        const computed = page.waitForResponse(
            (r) => r.url().includes("/api/equations/compute") && r.request().method() === "POST",
            { timeout: 60_000 },
        );
        await page.goto("/equation");
        await computed;
        const card = await tokenPx(page, "--radius-card");
        expect(card).toBeGreaterThan(0);

        const controls = page.getByLabel("Equation controls");
        // X.F.W14U Repair 1 (Check 1 C1-2, §0bt): `.eq` UIA-F-114 (`fcc5617`)
        // made Function, Controls and Coefficients ONE stack of glass
        // ConfiguratorLayers (adjacent, no gap). The stack is now the panel:
        // its outer corners (the first layer's top, the last layer's bottom)
        // are on the card radius, and the fused seams between layers are
        // glass's canon, square by design. Same equality, read on the panel's
        // own corners.
        const layers = controls.locator(".configurator-layer");
        await expect(layers).toHaveCount(3, { timeout: 30_000 });
        await expect(layers.first(), "Function layer").toContainText("Function", { timeout: 30_000 });
        await expect(layers.nth(1), "Controls layer").toContainText("Controls", { timeout: 30_000 });
        await expect(layers.last(), "Coefficients layer").toContainText("Coefficients", { timeout: 30_000 });
        const stackTop = await layers.first().evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
        const stackBottom = await layers.last().evaluate((el) => parseFloat(getComputedStyle(el).borderBottomLeftRadius));
        expect(stackTop, "controls stack top border-radius").toBe(card);
        expect(stackBottom, "controls stack bottom border-radius").toBe(card);
        const panels: Record<string, Locator> = {
            "equation card": page.locator(".eq-card"),
            "plot card": page.locator(".eq-panel-right .cartoon-card").filter({
                has: page.locator("canvas, svg"),
            }).last(),
        };
        for (const [name, loc] of Object.entries(panels)) {
            await expect(loc, name).toBeVisible({ timeout: 30_000 });
            const b = await box(loc);
            expect(b.radius, `${name} border-radius`).toBe(card);
        }

    });
});
