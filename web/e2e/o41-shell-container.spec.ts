import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * FORTY-FIRST A (owner, 19 Nov: "fourier is too square on mobile, too, the
 * main container is"). On a phone the stage card stood 16 px from the sides
 * and 4 px off the screen's foot at a 16 px corner: a screen drawn inside the
 * screen, its bottom corners meeting the device's own curve. The stage routes
 * now keep a 12 px gutter at the sides and the foot, and the page cards take
 * glass's room radius (24 px), the same on /equation, /paper and /morph.
 *
 * Phone cell: 390x844, touch (`@coarse`, the mobile-chromium project).
 */

const GUTTER = 12;
const RADIUS = "24px";

async function radiusOf(el: Locator): Promise<string> {
    return el.evaluate((node) => getComputedStyle(node).borderTopLeftRadius);
}

async function phone(page: Page): Promise<void> {
    await page.setViewportSize({ width: 390, height: 844 });
}

test.describe("FORTY-FIRST A — the phone container @coarse", () => {
    test("/equation: the stage card keeps the gutter at the sides and the foot, at the room radius", async ({ page }) => {
        await phone(page);
        await page.goto("/equation");
        const stage = page.locator('.workspace-host [data-slot="configurator"] > .configurator-stage');
        await expect(stage).toBeVisible({ timeout: 30_000 });
        const box = (await stage.boundingBox())!;
        expect(box.x, "left gutter").toBeCloseTo(GUTTER, 0);
        expect(box.x + box.width, "right gutter").toBeCloseTo(390 - GUTTER, 0);
        expect(box.y + box.height, "the foot clears the gutter").toBeCloseTo(844 - GUTTER, 0);
        expect(await radiusOf(stage), "the stage card's corner").toBe(RADIUS);
        // The configurator takes no block margin of its own on a phone.
        const shell = page.locator(".workspace-host > .configurator-shell");
        expect(await shell.evaluate((n) => getComputedStyle(n).marginBlockEnd)).toBe("0px");
    });

    test("/paper: the reading card takes the same radius", async ({ page }) => {
        await phone(page);
        await page.goto("/paper");
        const article = page.locator("article.paper-article");
        await expect(article).toBeVisible({ timeout: 30_000 });
        expect(await radiusOf(article)).toBe(RADIUS);
    });

    test("/morph: the stage and the phase cards take the same radius", async ({ page }) => {
        await phone(page);
        await page.goto("/morph");
        const card = page.locator(".config-card").first();
        await expect(card).toBeVisible({ timeout: 30_000 });
        expect(await radiusOf(card)).toBe(RADIUS);
        expect(await radiusOf(page.locator(".morph-card").first())).toBe(RADIUS);
    });
});

test.describe("FORTY-FIRST A — the desk is unchanged", () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test("/equation at 1440: the stage card keeps the page gutter and the card radius", async ({ page }) => {
        await page.goto("/equation");
        const stage = page.locator('.workspace-host [data-slot="configurator"] > .configurator-stage');
        await expect(stage).toBeVisible({ timeout: 30_000 });
        const box = (await stage.boundingBox())!;
        expect(box.x).toBeCloseTo(16, 0);
        expect(await radiusOf(stage)).toBe("16px");
    });
});
