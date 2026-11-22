/**
 * X-OD19 · P1 — the transport dock and the dock menus (owner rows OD19-F1, F3, F4).
 *
 * F1  The collapsed summary is ONE readout that fits glass's summary square, so
 *     every collapsed kid lies inside the plate; the full face has a definite
 *     inline size, so the expand is a measured morph (>=5 frames of monotone
 *     growth, no single-frame Play snap) and the collapse never undershoots.
 * F3  Speed and Easing are dock-level seats, each opening its own menu.
 * F4  An open dock menu holds its dock open: with the pointer away, the dock never
 *     reaches `.collapsed` while the menu is open, and it collapses once it closes.
 *
 * Any residual first-flip snap of the small fit-content docks is glass G-F2a
 * (O-102), not asserted here.
 *
 * O41 FORTY-FIRST H: on a phone the transport is the stage's plate of two rows,
 * which never folds. Since the desk's scrub took back its run (its own row,
 * as on the phone) the desk's dock is the same plate: there is no fold at any
 * width, so F1 and F4 read as the plate standing open with every seat inside
 * it, the pointer away and a menu open or closed; F3 holds as before.
 */
import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";
import { showView } from "./fixtures/workspace";

const CELLS = [
    { width: 1440, height: 900, scheme: "light" },
    { width: 1440, height: 900, scheme: "dark" },
    { width: 390, height: 844, scheme: "light" },
    { width: 390, height: 844, scheme: "dark" },
] as const;

async function openViz(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    const phone = page.viewportSize()!.width < 640;
    if (phone) await showView(page, "Canvas");
    const dock = page.locator(".animation-dock");
    await expect(dock).toBeVisible({ timeout: 30_000 });
    // The plate never folds: it stands open from the start.
    await expect(dock).toHaveClass(/\bexpanded\b/);
}

for (const c of CELLS) {
    test.describe(`X-OD19 P1 — transport dock (${c.scheme} ${c.width})`, () => {
        test.use({ viewport: { width: c.width, height: c.height }, colorScheme: c.scheme });
        test.setTimeout(90_000);

        test("F1 — the plate never folds: no summary, every seat inside it, with the pointer away", async ({ page }) => {
            await openViz(page);
            const dock = page.locator(".animation-dock");
            await page.mouse.move(2, c.height / 2);
            const collapsedSeen = await dock.evaluate(
                (d, ms) =>
                    new Promise<boolean>((res) => {
                        let seen = d.classList.contains("collapsed");
                        const t0 = performance.now();
                        const f = () => {
                            seen ||= d.classList.contains("collapsed");
                            if (performance.now() - t0 < ms) requestAnimationFrame(f);
                            else res(seen);
                        };
                        requestAnimationFrame(f);
                    }),
                6500,
            );
            expect(collapsedSeen, "the plate reached .collapsed").toBe(false);
            await expect(dock.locator(".dock-layer--summary.is-active")).toHaveCount(0);
            const out = await dock.evaluate((d) => {
                const p = d.getBoundingClientRect();
                return [...d.querySelectorAll("button, [role=slider]")]
                    .map((e) => ({ e, r: e.getBoundingClientRect() }))
                    .filter(({ e, r }) => r.width > 0 && r.height > 0 && !e.closest("[inert]"))
                    .filter(({ r }) => r.left < p.left - 0.5 || r.right > p.right + 0.5 || r.top < p.top - 0.5 || r.bottom > p.bottom + 0.5)
                    .map(({ e, r }) => `${e.getAttribute("aria-label")} ${Math.round(r.left)}..${Math.round(r.right)} plate ${Math.round(p.left)}..${Math.round(p.right)}`);
            });
            expect(out, "seats outside the plate").toEqual([]);
        });

        test("F3 — Speed and Easing are dock seats, each with its own menu", async ({ page }) => {
            await openViz(page);
            const dock = page.locator(".animation-dock");
            await expect(dock.locator("[aria-label='More options']")).toHaveCount(0);
            const speed = dock.getByRole("button", { name: "Playback speed" });
            await expect(speed).toHaveText(/^\s*[\d.]+\s*×\s*$/);
            await speed.click();
            let menu = page.getByRole("menu");
            await expect(menu).toBeVisible();
            await expect(menu.getByRole("group", { name: "Speed" })).toHaveCount(1);
            await expect(menu.getByRole("group", { name: "Easing" })).toHaveCount(0);
            // O41 audit 47: no heading over the rows; the name is the group's.
            await expect(menu.locator('[data-slot="menu-label"]')).toHaveCount(0);
            await menu.getByRole("menuitemradio", { name: /^2\s*×$/ }).click();
            await expect(speed).toHaveText(/^\s*2\s*×\s*$/);
            await page.keyboard.press("Escape");
            await expect(menu).toBeHidden();
            await dock.getByRole("button", { name: "Easing" }).click();
            menu = page.getByRole("menu");
            await expect(menu).toBeVisible();
            await expect(menu.getByRole("group", { name: "Easing" })).toHaveCount(1);
            await expect(menu.getByRole("group", { name: "Speed" })).toHaveCount(0);
            await expect(menu.locator('[data-slot="menu-label"]')).toHaveCount(0);
            await expect(menu.getByRole("separator")).toHaveCount(0);
        });

        test("F4 — the plate stands open with a menu open and after it closes", async ({ page }) => {
            await openViz(page);
            const dock = page.locator(".animation-dock");
            await dock.getByRole("button", { name: "Playback speed" }).click();
            await expect(page.getByRole("menu")).toBeVisible();
            await page.mouse.move(2, 2);
            await page.mouse.move(4, c.height - 4);
            // Watch the dock's class for 4.8 s with the pointer away and the menu open.
            const collapsedSeen = await page.evaluate(
                (ms) =>
                    new Promise<boolean>((res) => {
                        const d = document.querySelector(".animation-dock")!;
                        let seen = d.classList.contains("collapsed");
                        const t0 = performance.now();
                        const f = () => {
                            seen ||= d.classList.contains("collapsed");
                            if (performance.now() - t0 < ms) requestAnimationFrame(f);
                            else res(seen);
                        };
                        requestAnimationFrame(f);
                    }),
                4800,
            );
            expect(collapsedSeen, "the dock reached .collapsed under an open menu").toBe(false);
            await expect(page.getByRole("menu")).toBeVisible();
            await page.keyboard.press("Escape");
            await expect(page.getByRole("menu")).toBeHidden();
            // With the pointer away and the focus out of the dock, it still stands open.
            await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
            await page.waitForTimeout(3000);
            await expect(dock).toHaveClass(/\bexpanded\b/);
            await expect(dock).not.toHaveClass(/\bcollapsed\b/);
        });
    });
}
