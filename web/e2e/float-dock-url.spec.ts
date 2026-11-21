import { expect, test, type Page } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";
import { openCanvasDock, pressStageTool } from "./fixtures/canvas-dock";
import { seededViz } from "./fixtures/seed";
import { showView } from "./fixtures/workspace";

/**
 * Owner, 2026-11-15: "Each page should have a tool set in the main dock, but
 * pages like the quaran reader and fourier should have an additional floating
 * bar ... which is a collapsible glass-ui dock." · "Each page should have state
 * defined in the URL, like with fourier for the currently selected picture,
 * background showing, etc."
 *
 * t1 — each page's own tools are in the app dock; the canvas's are on the
 *      stage's one dock at its foot (FORTY-FIRST H): one row that folds on a
 *      desk, one plate of two rows on a phone. Each tool has one home.
 * u1 — a deep link per page reopens that view cold; a change writes the URL;
 *      Back and Forward walk the discrete changes.
 *
 * float-dock-2 (owner, 16 Nov):
 * m1 — /morph's state is in its URL: the picture, a previewed level, the
 *      morph's range, durations and easings; Back plays the morph back.
 * f1 — in the fullscreen takeover the page's own tools (Publish, Equation)
 *      stand on the stage dock outside its fold, at every width.
 * p1 — at 390 the app dock is four seats within the plate (~44 px either
 *      side); the sections menu absorbs the page's tools; no seat under 44 px.
 */

const LOAD = 60_000;

async function openWorkspace(page: Page, query = ""): Promise<void> {
    await page.goto(`/v/${seededViz().slug}${query}`);
    if (page.viewportSize()!.width < 640) await showView(page, "Canvas");
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: LOAD });
}

test.describe("t1 — one tool model (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("workspace: Publish, Series and Copy link in the app dock; the canvas's tools on the stage's one dock, once each", async ({ page }) => {
        await openWorkspace(page);
        await expect(page.locator(".canvas-stage .glass-dock")).toHaveCount(1);
        const dock = page.locator(".controls-overlay .glass-dock");
        await expect(dock).toHaveClass(/\bcollapsed\b/);
        await openCanvasDock(page);
        for (const name of ["Picture", "Outline", "Line", "Circles", "More", "Edit contour"])
            await expect(page.getByRole("button", { name, exact: true }), name).toHaveCount(1);
        // The open face keeps the scrub most of the row: the rest is one More
        // (STUDY 2.10, line 3; PR 33 review, should-fix 1).
        await dock.getByRole("button", { name: "More", exact: true }).click();
        const more = page.getByRole("menu");
        for (const name of ["Reset view", "Fullscreen", "Export frame"])
            await expect(more.getByRole("menuitem", { name, exact: true }), name).toHaveCount(1);
        await expect(more.getByRole("menuitemcheckbox", { name: "Just the picture", exact: true })).toHaveCount(1);
        await page.keyboard.press("Escape");
        await expect(more).toBeHidden();
        const app = await openAppDock(page);
        for (const name of ["Publish to Gallery", "Series", "Copy link"])
            await expect(app.getByRole("button", { name, exact: true }), name).toHaveCount(1);
        await expect(dock.locator("[aria-label='Publish to Gallery'], [aria-label='Series'], [aria-label='Copy link']")).toHaveCount(0);
        // While editing the editor's dock takes the transport's place (FORTY-FIRST
        // H): one dock on the stage, so one copy of the view layers, the editor's.
        await page.getByRole("button", { name: "Edit contour" }).click();
        await expect(page.getByRole("button", { name: "Save contour" }).first()).toBeVisible();
        await expect(page.locator(".canvas-stage .glass-dock")).toHaveCount(1);
        await expect(page.locator(".controls-overlay [aria-label='Picture']")).toHaveCount(1);
    });

    test("workspace: a menu opened from the stage dock holds it open; a press outside folds it", async ({ page }) => {
        await openWorkspace(page);
        const dock = await openCanvasDock(page);
        await dock.getByRole("button", { name: "Easing" }).click();
        await expect(page.getByRole("menu")).toBeVisible();
        await page.waitForTimeout(1500);
        await expect(dock).toHaveClass(/\bexpanded\b/);
        await page.keyboard.press("Escape");
        await page.mouse.click(5, 300);
        await expect(dock).toHaveClass(/\bcollapsed\b/, { timeout: 10_000 });
    });

    test("equation: Copy LaTeX and About in the app dock; plot tools in the folded stage dock", async ({ page }) => {
        await page.goto("/equation");
        await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
        const stage = page.locator(".eq-card .stage-dock .glass-dock");
        await expect(stage).toHaveClass(/\bcollapsed\b/);
        await stage.getByRole("button", { name: "Plot tools" }).click();
        await expect(stage).toHaveClass(/\bexpanded\b/);
        for (const name of ["Plot layers", "Export plot"]) await expect(stage.getByRole("button", { name })).toBeVisible();
        const app = await openAppDock(page);
        for (const name of ["Copy LaTeX", "About this approximation"])
            await expect(app.getByRole("button", { name }), name).toHaveCount(1);
        await expect(page.locator(".eq-card [aria-label='Copy LaTeX']")).toHaveCount(0);
    });
});

test.describe("t1 — the stage dock on a phone @coarse", () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test("@coarse the stage dock is one plate at the stage's foot, inside the stage, never folded", async ({ page }) => {
        await openWorkspace(page);
        const dock = await openCanvasDock(page);
        await expect(dock).toHaveClass(/animation-dock--card/);
        const g = await page.evaluate(() => {
            const d = document.querySelector(".controls-overlay .glass-dock")!.getBoundingClientRect();
            const s = document.querySelector(".canvas-stage")!.getBoundingClientRect();
            return { d: d.toJSON(), s: s.toJSON() };
        });
        expect(g.d.width, "a plate wider than tall").toBeGreaterThan(g.d.height);
        expect(g.d.left).toBeGreaterThanOrEqual(g.s.left - 0.5);
        expect(g.d.right).toBeLessThanOrEqual(g.s.right + 0.5);
        expect(g.s.bottom - g.d.bottom, "at the stage's foot").toBeLessThan(40);
        expect(g.d.top, "in the stage's lower half").toBeGreaterThan(g.s.top + g.s.height / 2);
    });
});

test.describe("p1 — the app dock on a phone @coarse", () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    async function seatsWithin(page: Page) {
        const dock = await openAppDock(page);
        const g = await dock.evaluate((d) => {
            const r = d.getBoundingClientRect();
            const seats = [...d.querySelectorAll("button, a[href]")]
                .filter((b) => b.getBoundingClientRect().width > 0 && !b.closest("[inert]"))
                .map((b) => ({ name: b.getAttribute("aria-label") ?? "", w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height }));
            return { left: r.left, right: r.right, vw: innerWidth, seats };
        });
        // O41 S4: the open dock keeps the page gutter (358 of 390 at most).
        expect(g.left, "room on the left").toBeGreaterThanOrEqual(16);
        expect(g.vw - g.right, "room on the right").toBeGreaterThanOrEqual(16);
        // Home first; About is the "i" beside the theme seat. Where the pane
        // seat stands it closes the run and About is the Sections menu's last
        // group instead (S4's fallback: the "i" would pass the gutter).
        const pane = g.seats.some((x) => x.name === "Controls");
        expect(g.seats.map((x) => x.name.replace(/ — .*/, ""))).toEqual(
            pane
                ? ["Home", "Navigate", "Log in", "Dark mode", "Controls"]
                : ["Home", "Navigate", "Log in", "About Fourier analysis", "Dark mode"],
        );
        for (const x of g.seats) {
            expect(x.w, `${x.name} width`).toBeGreaterThanOrEqual(44);
            expect(x.h, `${x.name} height`).toBeGreaterThanOrEqual(44);
        }
        return { dock, pane };
    }

    /** The Sections menu: the five places, then About's one row where the pane seat stands. */
    async function placesOnly(page: Page, pane: boolean) {
        const menu = page.getByRole("menu");
        await expect(menu.getByRole("menuitem", { name: "Paper" })).toBeVisible();
        await expect(menu.getByRole("menuitem")).toHaveCount(pane ? 6 : 5);
        await expect(menu.locator("[data-about]")).toHaveCount(pane ? 1 : 0);
        await expect(menu.locator("[data-page-tools]")).toHaveCount(0);
    }

    test("@coarse workspace: the seats within the plate; the sections menu holds only the five places", async ({ page }) => {
        await openWorkspace(page);
        const { dock, pane } = await seatsWithin(page);
        await dock.getByRole("button", { name: /^Navigate/ }).click();
        await placesOnly(page, pane);
    });

    test("@coarse equation: the seats within the plate; Copy LaTeX and the approximation's facts are seats of the plot's dock", async ({ page }) => {
        await page.goto("/equation");
        await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
        const { dock, pane } = await seatsWithin(page);
        expect(pane, "/equation's pane seat stands").toBe(true);
        await dock.getByRole("button", { name: /^Navigate/ }).click();
        await placesOnly(page, pane);
        await page.keyboard.press("Escape");
        const stage = page.locator(".eq-card");
        await stage.getByRole("button", { name: "Plot tools" }).click();
        await expect(stage.getByRole("button", { name: "Copy LaTeX" })).toBeVisible();
        await expect(stage.getByRole("button", { name: "About this approximation" })).toBeVisible();
    });

    test("@coarse a page with no tools of its own: the same four seats", async ({ page }) => {
        await page.goto("/gallery");
        expect((await seatsWithin(page)).pane).toBe(false);
    });

    // Home's own page, cold ("/" opens it) and by name: Home is not a current
    // seat there, so every seat stays within the plate (PR 33 review, blocker 1).
    for (const path of ["/", "/paper"]) {
        test(`@coarse Home's own page (${path}): the same seats, all within the plate`, async ({ page }) => {
            await page.goto(path);
            await expect(page).toHaveURL(/\/paper(?:[?#]|$)/);
            await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: LOAD });
            expect((await seatsWithin(page)).pane).toBe(false);
        });
    }
});

for (const vp of [
    { tag: "1440", viewport: { width: 1440, height: 900 } },
    { tag: "390 @coarse", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
] as const) {
    test.describe(`f1 — the page's tools in fullscreen (${vp.tag})`, () => {
        test.use({ viewport: vp.viewport, ...("isMobile" in vp ? { isMobile: true, hasTouch: true } : {}) });

        test(`${vp.tag.includes("@coarse") ? "@coarse " : ""}the page's acts are the takeover's stage dock's: seats on a desk, More's rows on a phone`, async ({ page }) => {
            await openWorkspace(page);
            await pressStageTool(page, "Fullscreen");
            const takeover = page.getByRole("dialog");
            await expect(takeover).toBeVisible();
            const stage = takeover.locator(".controls-overlay .glass-dock");
            if (page.viewportSize()!.width < 640) {
                // A phone: the page's acts are rows of the plate's More.
                await stage.getByRole("button", { name: "Layers and more" }).click();
                const menu = page.getByRole("menu");
                for (const name of ["Publish to Gallery", "Copy link"]) await expect(menu.getByRole("menuitem", { name })).toBeVisible();
                await menu.getByRole("menuitemcheckbox", { name: "Series" }).click();
            } else {
                // A desk: seats outside the fold, the size of the editor's door beside them.
                const area = (await takeover.boundingBox())!;
                await expect(async () => {
                    if (/\bexpanded\b/.test((await stage.getAttribute("class")) ?? "")) await page.mouse.click(area.x + 24, area.y + area.height / 2);
                    await expect(stage).toHaveClass(/\bcollapsed\b/, { timeout: 2_000 });
                }).toPass({ timeout: 15_000 });
                await expect(stage).not.toHaveAttribute("data-morphing", { timeout: 5_000 });
                await page.waitForTimeout(400);
                const edit = (await stage.getByRole("button", { name: "Edit contour" }).boundingBox())!;
                for (const name of ["Publish to Gallery", "Series", "Copy link"]) {
                    const box = (await stage.getByRole("button", { name, exact: true }).boundingBox())!;
                    expect(Math.abs(box.width - edit.width), `${name}: the seat's width`).toBeLessThan(1);
                    expect(Math.abs(box.height - edit.height), `${name}: the seat's height`).toBeLessThan(1);
                }
                await stage.getByRole("button", { name: "Series", exact: true }).click();
            }
            await expect(takeover.locator(".eq-panel")).toBeVisible({ timeout: LOAD });
            await expect(page).toHaveURL(/[?&]eq=1/);
            await expect(page).toHaveURL(/[?&]fs=1/);
        });
    });
}

test.describe("u1 — URL state (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("workspace: a deep link reopens the layers, the series panel, the rate and the paused moment", async ({ page }) => {
        await openWorkspace(page, "?bg=0&trace=1&eq=1&speed=2&t=0.42");
        await expect(page.locator(".eq-panel")).toBeVisible({ timeout: LOAD });
        await expect(page.getByRole("button", { name: "Play animation" }).first(), "paused at the link's moment").toBeVisible();
        await expect(page.locator(".animation-dock [aria-label='Playback speed']")).toContainText("2");
        // The folded transport's readout (glass progressbar) holds the link's moment.
        const value = await page.locator(".mini-progress").first().getAttribute("aria-valuenow");
        expect(Math.abs(Number(value) - 0.42)).toBeLessThan(0.011);
        const dock = page.locator(".animation-dock");
        await expect(dock.getByRole("button", { name: "Picture", exact: true })).toHaveAttribute("aria-pressed", "false");
        await expect(dock.getByRole("button", { name: "Outline", exact: true })).toHaveAttribute("aria-pressed", "true");
    });

    test("workspace: a layer toggle pushes, Back undoes it, Forward redoes it; pausing writes t by replace", async ({ page }) => {
        await openWorkspace(page);
        const before = page.url();
        const dock = page.locator(".animation-dock");
        await dock.getByRole("button", { name: "Picture", exact: true }).click();
        await expect(page).toHaveURL(/[?&]bg=0/);
        await dock.getByRole("button", { name: "Outline", exact: true }).click();
        await expect(page).toHaveURL(/[?&]trace=1/);
        await page.goBack();
        await page.goBack();
        await expect(page).toHaveURL(before);
        await page.goForward();
        await expect(page).toHaveURL(/[?&]bg=0/);
        const len = await page.evaluate(() => history.length);
        await page.getByRole("button", { name: "Pause animation" }).first().click();
        await expect(page).toHaveURL(/[?&]t=0?\.\d+/);
        expect(await page.evaluate(() => history.length), "the moment is a replace").toBe(len);
        await page.getByRole("button", { name: "Play animation" }).first().click();
        await expect(page).not.toHaveURL(/[?&]t=/);
    });

    test("equation: a deep link reopens the function, the count, the form, the layers and the sweep", async ({ page }) => {
        await page.goto("/equation?f=abs(x)&a=-pi&b=pi&n=7&m=expanded&s=0.3&harm=0");
        await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
        await expect(page.getByRole("textbox", { name: "Expression" }).first()).toHaveValue("abs(x)");
        await expect(page.getByRole("button", { name: "Play the convergence sweep" }).first(), "the sweep is held").toBeVisible();
        await expect(page.locator(".legend-entry.is-layer-off").first()).toBeVisible();
        const sweep = await page.getByRole("slider", { name: "Convergence sweep position" }).getAttribute("aria-valuenow");
        expect(Math.abs(Number(sweep) - 0.3)).toBeLessThan(0.02);
        await expect(page).toHaveURL(/m=expanded/);
    });

    test("equation: a typed change replaces, a menu change pushes; Back restores the form", async ({ page }) => {
        await page.goto("/equation?n=9");
        await expect(page.locator(".eq-card .katex").first()).toBeVisible({ timeout: LOAD });
        const stage = page.locator(".eq-card .stage-dock .glass-dock");
        await stage.getByRole("button", { name: "Plot tools" }).click();
        await stage.getByRole("button", { name: "Plot layers" }).click();
        await page.getByRole("menuitemcheckbox", { name: "Harmonics" }).click();
        await expect(page).toHaveURL(/[?&]harm=0/);
        await page.keyboard.press("Escape");
        await page.goBack();
        await expect(page).not.toHaveURL(/harm=0/);
        await expect(page.locator(".legend-entry.is-layer-off")).toHaveCount(0);
    });

    test("gallery: a deep link reopens the search, the order and the tab; a filter pushes", async ({ page }) => {
        await page.goto("/gallery?q=zzz-no-such-title&sort=likes");
        await expect(page.getByRole("searchbox", { name: "Search gallery" }).or(page.getByRole("textbox", { name: "Search gallery" })).first()).toHaveValue("zzz-no-such-title", { timeout: LOAD });
        await page.goto("/gallery?tab=drafts");
        await expect(page.getByRole("tab", { name: "Drafts" })).toHaveAttribute("aria-selected", "true", { timeout: LOAD });
        await page.getByRole("tab", { name: "Gallery" }).click();
        await expect(page).not.toHaveURL(/tab=drafts/);
        await page.goBack();
        await expect(page.getByRole("tab", { name: "Drafts" })).toHaveAttribute("aria-selected", "true");
    });

    test("paper: a deep link opens its section, and reading writes the section by replace", async ({ page }) => {
        await page.goto("/paper");
        const scroller = page.locator(".paper-scroll");
        await expect.poll(() => scroller.evaluate((el) => el.scrollHeight), { timeout: LOAD }).toBeGreaterThan(5000);
        const len = await page.evaluate(() => history.length);
        await scroller.evaluate((el) => el.scrollTo({ top: el.scrollHeight * 0.4 }));
        await expect(page).toHaveURL(/[?&]s=[\w-]+/, { timeout: 10_000 });
        expect(await page.evaluate(() => history.length), "reading is a replace").toBe(len);
        const url = page.url();
        const id = new URL(url).searchParams.get("s")!;
        const fresh = await page.context().newPage();
        try {
            await fresh.goto(url);
            await expect
                .poll(() => fresh.evaluate((s) => document.getElementById(s)?.getBoundingClientRect().top ?? null, id), { timeout: LOAD })
                .not.toBeNull();
            const top = await fresh.evaluate((s) => document.getElementById(s)!.getBoundingClientRect().top, id);
            expect(Math.abs(top), `section #${id} is in view`).toBeLessThan(900);
        } finally {
            await fresh.close();
        }
    });

    test("morph: a deep link reopens the picture, the previewed level and the tuning", async ({ page }) => {
        await page.goto("/morph?shape=moon&n=8&lo=3&hi=35&out=300&emid=ease-out");
        const card = page.locator(".morph-card");
        await expect(card).toBeVisible({ timeout: LOAD });
        await expect(card.locator(".shape-value")).toHaveText("Moon");
        // The readout row reads "phase idle · n 8 · shape Moon · total 500 ms".
        await expect(card.locator(".demo-info")).toContainText(/n\s*8(?!\d)/);
        await expect(page.getByRole("slider", { name: "Low harmonic level" })).toHaveAttribute("aria-valuenow", "3");
        await expect(page.getByRole("slider", { name: "High harmonic level" })).toHaveAttribute("aria-valuenow", "35");
        await expect(page.getByRole("slider", { name: "Settle Out duration (ms)" })).toHaveAttribute("aria-valuenow", "300");
        await expect(page.getByRole("group", { name: "Morph", exact: true }).getByRole("combobox")).toContainText("Ease Out");
        await expect(card.locator(".demo-info"), "settle out 300 + blend 50 + settle in 150").toContainText(/500\s*ms/);
    });

    test("morph: the picture pushes and Back plays the morph back; a tuning replaces", async ({ page }) => {
        await page.goto("/morph");
        const card = page.locator(".morph-card");
        await expect(card.locator(".shape-value")).toHaveText("Sun", { timeout: LOAD });
        const morphButton = page.getByRole("button", { name: "Morph between the sun and moon shapes" });
        await morphButton.click();
        await expect(page).toHaveURL(/[?&]shape=moon/);
        await expect(card.locator(".shape-value")).toHaveText("Moon");
        await expect(morphButton).not.toHaveAttribute("aria-busy", "true");
        // A tile previews a level: a push.
        await page.locator(".levels-card .grid-cell").first().click();
        await expect(page).toHaveURL(/[?&]n=1\b/);
        await page.goBack();
        await expect(page).not.toHaveURL(/[?&]n=/);
        await expect(page).toHaveURL(/[?&]shape=moon/);
        // Back across the picture plays the morph (busy while it runs), then lands on the sun.
        await page.goBack();
        await expect(page).not.toHaveURL(/shape=/);
        await expect(card.locator(".shape-value")).toHaveText("Sun");
        await expect(morphButton).not.toHaveAttribute("aria-busy", "true");
        await page.goForward();
        await expect(card.locator(".shape-value")).toHaveText("Moon");
        // A tuning is a replace.
        const len = await page.evaluate(() => history.length);
        const low = page.getByRole("slider", { name: "Low harmonic level" });
        await low.focus();
        await page.keyboard.press("ArrowUp");
        await expect(page).toHaveURL(/[?&]lo=6/);
        expect(await page.evaluate(() => history.length), "a tuning is a replace").toBe(len);
        // Cold, the link reopens the same view.
        const url = page.url();
        const fresh = await page.context().newPage();
        try {
            await fresh.goto(url);
            await expect(fresh.locator(".morph-card .shape-value")).toHaveText("Moon", { timeout: LOAD });
            await expect(fresh.getByRole("slider", { name: "Low harmonic level" })).toHaveAttribute("aria-valuenow", "6");
        } finally {
            await fresh.close();
        }
    });
});
