import { expect, test, type Page, type Route } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";
import { pressStageTool } from "./fixtures/canvas-dock";
import { ENTRY } from "./fixtures/gallery";
import { seededViz } from "./fixtures/seed";

/**
 * On a phone, Log in lives in the "i" card (STUDY 2.1, the width's answer; PR 33
 * review, should-fix 2). The app dock's three zones hold on every route: Home
 * and the sections lead, the page's pane seat stands where the page has one,
 * and About ("i") with the theme seat close the run. On /w and /equation the
 * "i" used to leave for a group of the Sections menu (with the 12.2 px tagline
 * and the GitHub row) because an account seat beside it took the run past the
 * gutter. The account is the card's last part now: the sign-in form when
 * signed out, the slug with Copy and Log out when signed in. Every way in to
 * the sign-in still works: from the card, and from an act that asks for it
 * (a signed-out Publish), which opens the card with the field focused and
 * resumes once signed in.
 */

const PHONE = { width: 390, height: 844 };
const SLUG = "quiet-amber-lattice-fox";
/** The "i" on a phone: About, and the account (sign-in has no other control there). */
const ABOUT = "About Fourier analysis and your account";

/** The open dock's seats in order, by accessible name, and the run's room. */
async function run(page: Page) {
    const dock = await openAppDock(page);
    return dock.evaluate((d) => {
        const r = d.getBoundingClientRect();
        const seats = [...d.querySelectorAll<HTMLElement>("button, a[href]")]
            .filter((b) => b.getBoundingClientRect().width > 0 && !b.closest("[inert]"))
            .map((b) => {
                const s = b.getBoundingClientRect();
                return { name: (b.getAttribute("aria-label") ?? "").replace(/ — .*/, ""), left: s.left, right: s.right };
            });
        return { left: r.left, right: r.right, vw: innerWidth, seats };
    });
}

async function sessionRoutes(page: Page): Promise<{ logins: number; logouts: number }> {
    const tally = { logins: 0, logouts: 0 };
    await page.route("**/api/sessions/login", (r: Route) => {
        tally.logins++;
        return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user_slug: SLUG, token: "e2e-token" }) });
    });
    await page.route("**/api/sessions", (r: Route) => {
        if (r.request().method() === "DELETE") {
            tally.logouts++;
            return r.fulfill({ status: 204, body: "" });
        }
        return r.fallback();
    });
    return tally;
}

test.describe("the phone's run: About stays beside the theme seat on every route", () => {
    test.use({ viewport: PHONE });

    for (const route of ["/paper", "/gallery", "/morph", "/equation", "saved"] as const) {
        test(`${route}: Home, Navigate, About, Dark mode (and the pane seat), within the gutter`, async ({ page }) => {
            if (route === "saved") await page.goto(`/v/${seededViz().slug}`);
            else await page.goto(route);
            if (route === "/equation") await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: 60_000 });
            if (route === "saved") await expect(page.locator(".app-dock .pane-seat")).toBeVisible({ timeout: 60_000 });
            const g = await run(page);
            const names = g.seats.map((s) => s.name);
            const pane = names.includes("Controls");
            // The "i" holds the account on a phone, and its name says so.
            expect(names).toEqual(
                pane ? ["Home", "Navigate", ABOUT, "Dark mode", "Controls"] : ["Home", "Navigate", ABOUT, "Dark mode"],
            );
            if (route === "/equation" || route === "saved") expect(pane, "the pane seat stands here").toBe(true);
            expect(g.left, "room on the left").toBeGreaterThanOrEqual(16);
            expect(g.vw - g.right, "room on the right").toBeGreaterThanOrEqual(16);
            // The Sections menu holds the five places and nothing else.
            await page.locator(".app-dock").getByRole("button", { name: /^Navigate/ }).click();
            const menu = page.getByRole("menu");
            await expect(menu.getByRole("menuitem", { name: "Paper" })).toBeVisible();
            await expect(menu.getByRole("menuitem")).toHaveCount(5);
            await expect(menu.locator("[data-about], [role='group']")).toHaveCount(0);
        });
    }
});

test.describe("the phone's sign-in, in the About card", () => {
    test.use({ viewport: PHONE });

    test("signed out: the card holds About and the form; Log in closes it signed in", async ({ page }) => {
        const tally = await sessionRoutes(page);
        await page.goto("/equation");
        await openAppDock(page);
        const about = page.locator(".app-dock").getByRole("button", { name: ABOUT, exact: true });
        await expect(about).toHaveAttribute("title", "About and your account");
        await about.click();
        const card = page.locator(".about-card");
        await expect(card).toContainText(/orthogonal decomposition/i);
        const field = card.getByRole("textbox", { name: /Your slug/ });
        await expect(field).toBeVisible();
        // Opened to read About, the card does not take the keyboard.
        await expect(field).not.toBeFocused();
        await expect(card.getByRole("button", { name: "Generate a new slug" })).toBeVisible();
        // Every part of the card is in view and takes a press at its centre.
        for (const name of ["Your slug", "Generate a new slug", "Submit slug and log in"]) {
            const el = card.getByRole("button", { name }).or(card.getByRole("textbox", { name })).first();
            const ok = await el.evaluate((b) => {
                const r = b.getBoundingClientRect();
                const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && !!hit && (hit === b || b.contains(hit) || hit.contains(b));
            });
            expect(ok, `${name} in view and hittable`).toBe(true);
        }
        // Escape closes it and returns focus to the "i".
        await page.keyboard.press("Escape");
        await expect(card).toBeHidden();
        await expect(about).toBeFocused();
        await about.click();
        await field.fill(SLUG);
        await card.getByRole("button", { name: "Submit slug and log in" }).click();
        await expect(card, "a finished sign-in closes the card").toBeHidden();
        await expect(page.getByText("Logged in", { exact: true }).first()).toBeVisible();
        expect(tally.logins).toBe(1);
        expect(await page.evaluate(() => localStorage.getItem("fourier-user-slug"))).toBe(SLUG);
        // Signed in: the card holds the slug, Copy and Log out.
        await openAppDock(page);
        await about.click();
        await expect(card.getByText(SLUG)).toBeVisible();
        await expect(card.getByRole("button", { name: "Copy your slug" })).toBeVisible();
        await card.getByRole("button", { name: "Log out" }).click();
        await expect(card).toBeHidden();
        await expect(page.getByText("Logged out", { exact: true }).first()).toBeVisible();
        expect(await page.evaluate(() => localStorage.getItem("fourier-user-slug"))).toBeNull();
    });

    test("a slug of the wrong shape says so under the field, inside the screen", async ({ page }) => {
        await page.goto("/w");
        await openAppDock(page);
        await page.locator(".app-dock").getByRole("button", { name: "About Fourier analysis" }).click();
        const card = page.locator(".about-card");
        await card.getByRole("textbox", { name: /Your slug/ }).fill("Not A Slug");
        await card.getByRole("button", { name: "Submit slug and log in" }).click();
        const err = card.getByRole("alert").filter({ hasText: /slug/i });
        await expect(err).toBeVisible();
        const e = await err.evaluate((p) => ({ sw: p.scrollWidth, cw: p.clientWidth, r: p.getBoundingClientRect().right }));
        expect(e.sw).toBeLessThanOrEqual(e.cw);
        expect(e.r).toBeLessThanOrEqual(PHONE.width);
        await expect(card, "a refusal keeps the card open").toBeVisible();
    });

    test("a signed-out Publish opens the card with the field focused, and resumes once signed in", async ({ page }) => {
        const saved = { ...ENTRY, slug: "quiet-amber-harbor-finch", visibility: "draft", title: null };
        let posts = 0;
        let patches = 0;
        await page.route("**/api/visualizations", async (route: Route) => {
            if (route.request().method() !== "POST") return route.fallback();
            posts++;
            await route.fulfill({ status: 201, contentType: "application/json", headers: { ETag: '"p1"' }, body: JSON.stringify(saved) });
        });
        await page.route(`**/api/visualizations/${saved.slug}`, (route) => {
            if (route.request().method() === "PATCH") patches++;
            return route.fulfill({ status: 200, contentType: "application/json", headers: { ETag: '"p2"' }, body: JSON.stringify({ ...saved, visibility: "public" }) });
        });
        await page.goto(`/v/${seededViz().slug}`);
        await expect(page.locator(".controls-overlay .animation-dock").getByRole("button", { name: "Edit contour" })).toBeEnabled({ timeout: 60_000 });
        await pressStageTool(page, "Publish to Gallery");
        const card = page.locator(".about-card");
        await expect(card, "Publish opens the card").toBeVisible({ timeout: 10_000 });
        const field = card.getByRole("textbox", { name: /Your slug/ });
        await expect(field).toBeFocused();
        expect(posts, "nothing is sent before sign-in").toBe(0);
        await card.getByRole("button", { name: "Generate a new slug" }).click();
        await expect(page.getByText("Published to the gallery").first(), "the publish resumes after sign-in").toBeVisible({ timeout: 15_000 });
        await expect(card).toBeHidden();
        expect(posts).toBe(1);
        expect(patches).toBe(1);
    });

    test("a signed-out Publish stands down when the card is dismissed", async ({ page }) => {
        let posts = 0;
        await page.route("**/api/visualizations", (route: Route) => {
            if (route.request().method() === "POST") posts++;
            return route.fallback();
        });
        await page.goto(`/v/${seededViz().slug}`);
        await expect(page.locator(".controls-overlay .animation-dock").getByRole("button", { name: "Edit contour" })).toBeEnabled({ timeout: 60_000 });
        await pressStageTool(page, "Publish to Gallery");
        const card = page.locator(".about-card");
        await expect(card).toBeVisible({ timeout: 10_000 });
        await page.keyboard.press("Escape");
        await expect(card).toBeHidden();
        await page.waitForTimeout(800);
        expect(posts).toBe(0);
        // A later "i" opens to read About, not to sign in.
        await openAppDock(page);
        await page.locator(".app-dock").getByRole("button", { name: "About Fourier analysis" }).click();
        await expect(card.getByRole("textbox", { name: /Your slug/ })).not.toBeFocused();
    });
});
