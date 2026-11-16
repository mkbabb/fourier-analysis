// SERVED MODEL: claude-opus-5-5
import { test, expect, type Page } from "@playwright/test";

import { openAppDock } from "./fixtures/app-dock";
import { clickCanvasDockExport } from "./fixtures/canvas-dock";
import { ADMIN_TOKEN, ENTRY, stubAdminApi, stubGallery } from "./fixtures/gallery";
import { expectEasedLeave, filmLeave } from "./fixtures/leave-film";
import { seededViz } from "./fixtures/seed";
import { selectTab } from "./fixtures/workspace";

/**
 * Popups leave on their own exit, never in one frame.
 *
 * Every overlay here used to be removed, or emptied, by the code that closed
 * it: a `v-if` on the datum it showed, cleared in the same tick as the close;
 * the datum itself cleared in the close handler; or a navigation run before
 * the close. Each is now driven by an open state and lets go of its datum (or
 * navigates) when its leave has finished. Each test films the leave per frame
 * from the closing input (`fixtures/leave-film.ts`): it must still be there
 * and visible through the first 100 ms, and it must stay until its fade has
 * run down. Write paths are stubbed at the network boundary.
 */

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

async function openPaper(page: Page): Promise<void> {
    await page.goto("/paper");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 60_000 });
}

test.describe("the paper's phone search", () => {
    test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

    async function openPhoneSearch(page: Page, query?: string): Promise<void> {
        await openPaper(page);
        await page.getByRole("button", { name: "Search paper" }).tap();
        const field = page.getByRole("combobox", { name: "Search the paper" });
        await expect(field).toBeVisible();
        if (query) {
            await field.fill(query);
            await expect(page.locator(".paper-search-results [role=option]").first()).toBeVisible({ timeout: 15_000 });
        }
    }

    test("Close search: the results fade with their rows, then the bar swaps back", async ({ page }) => {
        await openPhoneSearch(page, "parseval");
        const film = await filmLeave(
            page,
            ".paper-search-results",
            () => page.getByRole("button", { name: "Close search" }).tap(),
            { probe: { selector: "[role=option]" } },
        );
        expectEasedLeave(film, "phone results, Close search", { held: true });
        await expect(page.getByRole("button", { name: "Search paper" })).toBeVisible();
    });

    test("Escape: the results fade with their rows", async ({ page }) => {
        await openPhoneSearch(page, "parseval");
        const film = await filmLeave(page, ".paper-search-results", () => page.keyboard.press("Escape"), {
            probe: { selector: "[role=option]" },
        });
        expectEasedLeave(film, "phone results, Escape", { held: true });
    });

    test("the search field cross-fades back to the chapter title", async ({ page }) => {
        await openPhoneSearch(page);
        const film = await filmLeave(page, ".floating-toc-bar--search", () =>
            page.getByRole("button", { name: "Close search" }).tap(),
        );
        expectEasedLeave(film, "phone search bar");
    });
});

test.describe("the paper's desktop search", () => {
    test.use({ viewport: DESKTOP });

    async function typeQuery(page: Page): Promise<void> {
        await openPaper(page);
        const field = page.getByRole("combobox", { name: "Search the paper" }).first();
        await field.fill("parseval");
        await expect(page.locator(".paper-search-results [role=option]").first()).toBeVisible({ timeout: 15_000 });
    }

    test("Escape: the panel keeps its rows while it fades", async ({ page }) => {
        await typeQuery(page);
        const film = await filmLeave(page, ".paper-search-results", () => page.keyboard.press("Escape"), {
            probe: { selector: "[role=option]" },
        });
        expectEasedLeave(film, "desktop results, Escape", { held: true });
    });

    test("picking a result: the panel leaves first, then the paper moves", async ({ page }) => {
        await typeQuery(page);
        const field = page.getByRole("combobox", { name: "Search the paper" }).first();
        const film = await filmLeave(
            page,
            ".paper-search-results",
            () => page.locator(".paper-search-results [role=option]").first().click(),
            { probe: { selector: "[role=option]" } },
        );
        expectEasedLeave(film, "desktop results, pick", { held: true });
        // The scroll mount no longer lands inside the fade.
        expect(film.longestFrame, "a stalled frame inside the leave").toBeLessThan(100);
        await expect(field).toHaveValue("");
    });

    test("the ⌘K palette keeps its rows through the leave of a pick", async ({ page }) => {
        await openPaper(page);
        await page.keyboard.press("ControlOrMeta+k");
        const palette = page.locator("[data-slot=dialog-content].search-palette");
        await expect(palette).toBeVisible();
        await page.keyboard.type("parseval");
        await expect(palette.getByRole("option").first()).toBeVisible({ timeout: 15_000 });
        const film = await filmLeave(
            page,
            "[data-slot=dialog-content].search-palette",
            () => page.keyboard.press("Enter"),
            { probe: { selector: "[role=option]" } },
        );
        expectEasedLeave(film, "palette, pick", { held: true });
    });
});

test.describe("the gallery card", () => {
    test.use({ viewport: DESKTOP });

    async function openCard(page: Page): Promise<void> {
        await stubGallery(page, [ENTRY]);
        await page.goto("/gallery");
        await page.getByRole("button", { name: `Open ${ENTRY.title}` }).first().click();
        await expect(page.getByRole("dialog")).toBeVisible();
    }

    test("Escape: the card leaves with its entry", async ({ page }) => {
        await openCard(page);
        const film = await filmLeave(page, "[role=dialog]", () => page.keyboard.press("Escape"), {
            probe: { text: ENTRY.title },
        });
        expectEasedLeave(film, "gallery card, Escape", { held: true });
    });

    test("Open Visualizer: the card leaves, then the route changes", async ({ page }) => {
        await openCard(page);
        const film = await filmLeave(
            page,
            "[role=dialog]",
            () => page.getByRole("dialog").getByRole("button", { name: /Open Visualizer/ }).click(),
            { probe: { text: ENTRY.title } },
        );
        expectEasedLeave(film, "gallery card, Open Visualizer", { held: true });
        await expect(page).toHaveURL(new RegExp(`/v/${ENTRY.slug}$`));
    });
});

test.describe("the admin dialogs", () => {
    test.use({ viewport: DESKTOP });

    test("the delete confirm keeps naming its entry while it leaves", async ({ page }) => {
        await stubAdminApi(page, [ENTRY]);
        await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);
        await page.getByRole("button", { name: "Delete" }).first().click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toContainText(ENTRY.slug);
        const film = await filmLeave(page, "[role=dialog]", () => dialog.getByRole("button", { name: "Cancel" }).click(), {
            probe: { text: ENTRY.slug },
        });
        expectEasedLeave(film, "delete confirm, Cancel", { held: true });
    });

    test("the new-token dialog keeps its token while it leaves", async ({ page }) => {
        const TOKEN = "ftk_e2e_leave_film_token";
        await stubAdminApi(page, []);
        await page.route("**/api/admin/tokens**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(
                    route.request().method() === "POST" ? { id: "tok-1", token: TOKEN } : { tokens: [] },
                ),
            }),
        );
        await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);
        await selectTab(page, "Tokens");
        await page.getByRole("textbox", { name: "Token name" }).fill("leave film");
        await page.getByRole("button", { name: "Create token" }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toContainText(TOKEN);
        const film = await filmLeave(page, "[role=dialog]", () => dialog.getByRole("button", { name: "Done" }).click(), {
            probe: { text: TOKEN },
        });
        expectEasedLeave(film, "token dialog, Done", { held: true });
    });
});

test.describe("the log-in card", () => {
    test.use({ viewport: DESKTOP });

    test("a successful log-in lets the card leave before the account seat arrives", async ({ page }) => {
        const SLUG = "amber-fox-swift-dawn";
        await page.route("**/api/sessions/login", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ token: "e2e-leave-film-session", user_slug: SLUG }),
            }),
        );
        await page.route("**/api/sessions/me", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ user_slug: SLUG, created_at: "2026-09-01T10:00:00Z" }),
            }),
        );
        await openPaper(page);
        const dock = await openAppDock(page);
        await dock.getByRole("button", { name: "Log in" }).click();
        const card = page.locator(".login-popover");
        await expect(card).toBeVisible();
        await card.getByRole("textbox").fill(SLUG);
        const film = await filmLeave(page, ".login-popover", () =>
            card.getByRole("button", { name: "Submit slug and log in" }).click(),
        );
        expectEasedLeave(film, "log-in card, success");
        await expect(page.getByRole("button", { name: `Account: ${SLUG}` })).toBeVisible();
    });

    // LAST-TEN (owner, 15 Nov): Log out left on a cut. The item is in the
    // account menu, and the seat swapped to Log in on the session's end,
    // unmounting the menu mid-exit. The menu now leaves on glass's exit,
    // still naming the account it was opened with, and only then does the
    // seat turn to Log in.
    for (const vp of [DESKTOP, PHONE]) {
        test(`Log out: the account menu leaves on its own exit, then the seat turns (${vp.width})`, async ({ page }) => {
            await page.setViewportSize(vp);
            const SLUG = "amber-fox-swift-dawn";
            await page.addInitScript((slug) => {
                localStorage.setItem("fourier-user-slug", slug);
                localStorage.setItem("fourier-user-token", "e2e-leave-film-session");
            }, SLUG);
            await page.route("**/api/sessions", (route) =>
                route.request().method() === "DELETE"
                    ? route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
                    : route.fallback(),
            );
            await openPaper(page);
            const dock = await openAppDock(page);
            await dock.getByRole("button", { name: `Account: ${SLUG}` }).click();
            const menu = page.getByRole("menu");
            await expect(menu).toContainText(SLUG);
            const film = await filmLeave(page, "[role=menu]", () => menu.getByRole("menuitem", { name: "Log out" }).click(), {
                probe: { text: SLUG },
            });
            // Glass's menu exit is a recede (it rolls up into its trigger under
            // a clip, the fade in its last tenth), so the read is presence and
            // duration, not an opacity ramp: shown through the first 100 ms,
            // naming the account, and removed no sooner than glass's shortest
            // exit (120 ms). The cut it cures removed the menu within a frame
            // or two of the press.
            const label = `account menu, Log out (${vp.width})`;
            const early = film.frames.filter((f) => f.t >= 0 && f.t <= 100);
            expect(early.length, `${label}: frames across the first 100 ms`).toBeGreaterThan(2);
            for (const f of early) expect(f.present && f.op > 0, `${label}: gone at +${f.t.toFixed(0)} ms`).toBe(true);
            for (const f of film.frames.filter((x) => x.present)) expect(f.held, `${label}: emptied at +${f.t.toFixed(0)} ms`).toBe(true);
            expect(film.goneAt, `${label}: removed before its exit ran`).toBeGreaterThanOrEqual(110);
            await expect(dock.getByRole("button", { name: "Log in" })).toBeVisible();
        });
    }
});

test.describe("the export dialog", () => {
    test.use({ viewport: DESKTOP });

    test("Escape: the dialog leaves on its own exit", async ({ page }) => {
        const viz = seededViz();
        await page.goto(`/v/${viz.slug}`);
        await clickCanvasDockExport(page);
        const dialog = page.getByRole("dialog");
        await expect(dialog).toContainText("Export Frame");
        const film = await filmLeave(page, "[role=dialog]", () => page.keyboard.press("Escape"), {
            probe: { text: "Export Frame" },
        });
        expectEasedLeave(film, "export dialog, Escape", { held: true });
    });
});
