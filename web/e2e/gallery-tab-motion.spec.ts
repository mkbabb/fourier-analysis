import { expect, test, type Page } from "@playwright/test";

/**
 * The design critique's G1: choosing Drafts cut the 943 px search field out in
 * one frame, and the tab bodies swapped the same way. The field now leaves by
 * a short fade in its held row, and the old body leaves before the new one
 * fades in. Sampled on every frame across the change.
 */
test.describe("1440", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("Drafts: the search field fades out and the body cross-fades, never a cut", async ({ page }) => {
        await page.goto("/gallery");
        const search = page.locator(".search-bar-root");
        await expect(search).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(500);

        await page.evaluate(() => {
            const samples: { search: number | null; body: number | null }[] = [];
            const t0 = performance.now();
            const op = (el: Element | null) => (el ? parseFloat(getComputedStyle(el).opacity) : null);
            const tick = () => {
                samples.push({ search: op(document.querySelector(".search-bar-root")), body: op(document.querySelector(".gallery-body")) });
                if (performance.now() - t0 < 900) requestAnimationFrame(tick);
            };
            (window as unknown as { __tab: typeof samples }).__tab = samples;
            requestAnimationFrame(tick);
        });
        await page.getByRole("tab", { name: "Drafts" }).click();
        await page.waitForTimeout(1000);
        const samples = await page.evaluate(() => (window as unknown as { __tab: { search: number | null; body: number | null }[] }).__tab);

        const between = (v: number | null) => v !== null && v > 0.05 && v < 0.95;
        expect(samples.filter((s) => between(s.search)).length, "frames with the field part-way out").toBeGreaterThan(1);
        expect(samples.at(-1)!.search, "the field is gone once Drafts shows").toBeNull();
        expect(samples.filter((s) => between(s.body)).length, "frames with a body part-way").toBeGreaterThan(1);
        expect(samples.at(-1)!.body).toBe(1);

        // And back: the field returns the same way.
        await page.getByRole("tab", { name: "Gallery" }).click();
        await expect(search).toBeVisible();
        await expect.poll(() => search.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    });
});

/**
 * Below sm the search stands on its own row over the body, so its arrival or
 * removal moves the body by its height. No body may move while it shows: each
 * `.gallery-body` keeps one top through every frame it paints, both ways.
 */
test.describe("390", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    async function watchBodies(page: Page) {
        await page.evaluate(() => {
            const ids = new WeakMap<Element, number>();
            let next = 0;
            const samples: { id: number; op: number; top: number }[] = [];
            const t0 = performance.now();
            const tick = () => {
                for (const el of document.querySelectorAll(".gallery-body")) {
                    if (!ids.has(el)) ids.set(el, next++);
                    samples.push({ id: ids.get(el)!, op: parseFloat(getComputedStyle(el).opacity), top: el.getBoundingClientRect().top });
                }
                if (performance.now() - t0 < 900) requestAnimationFrame(tick);
            };
            (window as unknown as { __bodies: typeof samples }).__bodies = samples;
            requestAnimationFrame(tick);
        });
    }
    async function travel(page: Page) {
        const samples = await page.evaluate(() => (window as unknown as { __bodies: { id: number; op: number; top: number }[] }).__bodies);
        const by = new Map<number, number[]>();
        for (const s of samples) if (s.op > 0.05) by.set(s.id, [...(by.get(s.id) ?? []), s.top]);
        return [...by.values()].map((tops) => Math.max(...tops) - Math.min(...tops));
    }

    test("a tab change never moves a body that shows", async ({ page }) => {
        await page.goto("/gallery");
        const search = page.locator(".search-bar-root");
        await expect(search).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(500);

        await watchBodies(page);
        await page.getByRole("tab", { name: "Drafts" }).click();
        await page.waitForTimeout(1000);
        const out = await travel(page);
        expect(out.length, "the old body and the new one were both sampled").toBeGreaterThanOrEqual(2);
        for (const d of out) expect(d, "a body moved while it showed (to Drafts)").toBeLessThanOrEqual(1);
        await expect(search).toHaveCount(0);

        await watchBodies(page);
        await page.getByRole("tab", { name: "Gallery" }).click();
        await page.waitForTimeout(1000);
        const back = await travel(page);
        expect(back.length).toBeGreaterThanOrEqual(2);
        for (const d of back) expect(d, "a body moved while it showed (to Gallery)").toBeLessThanOrEqual(1);
        await expect.poll(() => search.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    });
});
