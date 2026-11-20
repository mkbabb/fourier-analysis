import { expect, test, type Page } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";

/**
 * FORTY-SECOND B (owner, 19 Nov: "Fourier has strange items that appear in the
 * top dock based on context--if you want to go this route, we should better
 * contextually display controls in the top bar depending on page") and
 * FORTY-FIRST E (the dock across a route change).
 *
 * The top dock has three zones: Home and the sections lead, the page's seats
 * stand in the centre, the account, About and the theme close it. A page's
 * seats are there from its first frame (disabled while they wait on data); the
 * old group leaves before the new arrives; the sections menu holds the five
 * places and nothing else; the dock is the same live dock across a route
 * change; on a touch screen it folds once a section has been chosen; one glyph
 * size in the dock.
 */

const EXPANDED = /(^|\s)expanded(\s|$)/;
const COLLAPSED = /(^|\s)collapsed(\s|$)/;

/** Hold every equation job open, so the page waits on its series. */
async function holdCompute(page: Page): Promise<void> {
    await page.route("**/api/equations/**", () => {});
    await page.route("**/api/equations", () => {});
}

test.describe("FORTY-SECOND B — the page's seats", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("cold /equation with its series held: both page seats are in the open dock, disabled", async ({ page }) => {
        await holdCompute(page);
        await page.goto("/equation");
        const dock = await openAppDock(page);
        const tools = dock.locator("[data-page-tools]");
        await expect(tools).toHaveAttribute("aria-label", "Equation tools");
        await expect(tools.getByRole("button", { name: "Copy LaTeX" })).toBeDisabled();
        await expect(tools.getByRole("button", { name: "About this approximation" })).toBeDisabled();
    });

    test("/equation to /paper with the dock held open: the old seats leave before the new page lands, by a tween", async ({ page }) => {
        await page.goto("/equation");
        await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: 30_000 });
        const dock = await openAppDock(page);
        await expect(dock.locator("[data-page-tools]")).toBeVisible();
        await page.evaluate(() => {
            const samples: { t: number; groups: { label: string; opacity: number }[] }[] = [];
            const t0 = performance.now();
            const tick = () => {
                const groups = [...document.querySelectorAll<HTMLElement>(".app-dock [data-page-tools]")].map((g) => ({
                    label: g.getAttribute("aria-label") ?? "",
                    opacity: Number(getComputedStyle(g).opacity),
                }));
                samples.push({ t: performance.now() - t0, groups });
                if (performance.now() - t0 < 1500) requestAnimationFrame(tick);
            };
            (window as unknown as { __seats: typeof samples }).__seats = samples;
            requestAnimationFrame(tick);
        });
        // Hold the dock open (a menu's hold), then take the sections menu to the paper.
        await dock.getByRole("button", { name: /^Navigate/ }).click();
        await page.getByRole("menu").getByRole("menuitem", { name: "Paper" }).click();
        await page.waitForURL(/\/paper/);
        await page.waitForTimeout(1700);
        const samples = await page.evaluate(() => (window as unknown as { __seats: { t: number; groups: { label: string; opacity: number }[] }[] }).__seats);
        const leaving = samples.flatMap((s) => s.groups.filter((g) => g.label === "Equation tools").map((g) => g.opacity));
        const distinct = new Set(leaving.map((o) => o.toFixed(2)));
        expect(distinct.size, `the leaving seats' opacities: ${[...distinct].join(", ")}`).toBeGreaterThanOrEqual(3);
        // Never an old and a new centre group both shown on one frame.
        for (const s of samples) {
            const shown = s.groups.filter((g) => g.opacity >= 0.2);
            expect(shown.length, `two centre groups at ${s.t.toFixed(0)} ms`).toBeLessThanOrEqual(1);
        }
        // The paper has no seats of its own: the centre is empty once it lands.
        await expect(page.locator(".app-dock [data-page-tools]")).toHaveCount(0);
    });

    test("the header is its own view-transition group: no route change dims or doubles the dock", async ({ page }) => {
        await page.goto("/gallery");
        const header = page.locator(".app-header");
        await expect(header).toBeVisible({ timeout: 30_000 });
        expect(await header.evaluate((h) => getComputedStyle(h).viewTransitionName)).toBe("app-header");
        await page.evaluate(() => {
            const seen: string[] = [];
            const t0 = performance.now();
            const tick = () => {
                for (const a of document.getAnimations()) {
                    const pseudo = (a.effect as KeyframeEffect | null)?.pseudoElement ?? "";
                    if (pseudo.includes("app-header")) seen.push(pseudo);
                }
                if (performance.now() - t0 < 1200) requestAnimationFrame(tick);
            };
            (window as unknown as { __hdr: string[] }).__hdr = seen;
            requestAnimationFrame(tick);
        });
        const dock = await openAppDock(page);
        await dock.getByRole("button", { name: /^Navigate/ }).click();
        await page.getByRole("menu").getByRole("menuitem", { name: "Morph" }).click();
        await page.waitForURL(/\/morph/);
        await page.waitForTimeout(1300);
        expect(await page.evaluate(() => (window as unknown as { __hdr: string[] }).__hdr)).toEqual([]);
    });

    test("one glyph size in the open dock", async ({ page }) => {
        await page.goto("/equation");
        await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: 30_000 });
        const dock = await openAppDock(page);
        await page.waitForTimeout(400);
        const sizes = await dock.evaluate((d) =>
            [...d.querySelectorAll<SVGElement>("button > svg, .dock-trigger > svg, button svg.lucide")]
                .filter((s) => !s.closest("[inert]") && !s.classList.contains("nav-trigger-chevron") && s.getBoundingClientRect().width > 0)
                .map((s) => Math.round(s.getBoundingClientRect().width)),
        );
        expect(sizes.length).toBeGreaterThan(4);
        expect(new Set(sizes).size, `glyph boxes: ${sizes.join(", ")}`).toBe(1);
    });
});

test.describe("FORTY-SECOND B — the dock on a phone @coarse", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("@coarse the sections menu holds the five places and no group label", async ({ page }) => {
        await page.goto("/gallery");
        const dock = await openAppDock(page);
        await dock.getByRole("button", { name: /^Navigate/ }).click();
        const menu = page.getByRole("menu");
        await expect(menu).toBeVisible();
        await expect(menu.getByRole("menuitem")).toHaveCount(5);
        await expect(menu.locator('[role="group"], [data-slot="dropdown-menu-label"]')).toHaveCount(0);
    });

    test("@coarse where the pane seat stands, About is the menu's last group and the run keeps the gutter", async ({ page }) => {
        // S4's fallback: with the Controls seat the "i" would take the open run
        // past the gutter (367 of 358 px), so it returns to the Sections menu.
        await page.goto("/equation");
        const dock = await openAppDock(page);
        await expect(dock.locator(".pane-seat")).toBeVisible();
        await expect(dock.getByRole("button", { name: "About Fourier analysis" })).toHaveCount(0);
        const box = (await dock.boundingBox())!;
        expect(box.width, "the open run").toBeLessThanOrEqual(358);
        await dock.getByRole("button", { name: /^Navigate/ }).click();
        const menu = page.getByRole("menu");
        await expect(menu).toBeVisible();
        // The group takes its label's name, "About".
        const about = menu.getByRole("group", { name: "About" });
        await expect(about.getByRole("menuitem", { name: "View the project on GitHub" })).toBeVisible();
        await expect(menu.getByRole("menuitem")).toHaveCount(6);
        await expect(menu.locator('[role="group"]')).toHaveCount(1);
    });

    test("@coarse the dock folds once a section has been chosen", async ({ page }) => {
        await page.goto("/gallery");
        const dock = await openAppDock(page);
        await dock.getByRole("button", { name: /^Navigate/ }).click();
        await page.getByRole("menu").getByRole("menuitem", { name: "Paper" }).click();
        await page.waitForURL(/\/paper/);
        await expect(dock).toHaveClass(COLLAPSED, { timeout: 600 + 400 });
        await expect(dock).not.toHaveClass(EXPANDED);
    });

    test("@coarse the folded circle wears the reading progress as its own border", async ({ page }) => {
        await page.goto("/paper");
        const dock = page.locator(".app-dock");
        await expect(dock).toHaveClass(COLLAPSED, { timeout: 30_000 });
        await expect(page.locator("article.paper-article")).toBeVisible({ timeout: 30_000 });
        await page.evaluate(() => {
            const el = document.scrollingElement!;
            el.scrollTop = (el.scrollHeight - el.clientHeight) * 0.3;
        });
        await page.waitForTimeout(600);
        const rim = dock.locator(".dock-progress");
        await expect(rim).toHaveCount(1);
        // The border edge draws along the host's own outline: the rim covers the
        // circle's whole box (no inset track, no clipped hairline).
        const [d, r] = await Promise.all([dock.boundingBox(), rim.boundingBox()]);
        expect(r!.width).toBeCloseTo(d!.width, 0);
        expect(r!.height).toBeCloseTo(d!.height, 0);
    });
});
