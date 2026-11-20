import { expect, test, type Locator, type Page } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";
import { openCanvasDock } from "./fixtures/canvas-dock";
import { seededViz } from "./fixtures/seed";
import { showViewIfTabbed } from "./fixtures/workspace";
import { SAMPLE_STAGE, type StageInk } from "./fixtures/stage-ink";

/**
 * The visualizer's layers (Picture, Outline, Line, Circles), each switched on
 * its own, each fading in and out; Picture and Outline one press from rest;
 * "Just the picture"; and the view in the link (the layers, the bases, the
 * zoom), with Copy link copying it.
 */

const LOAD = 60_000;

/** Open the seeded piece paused at t = 0.5, so the stage changes only when a layer does. */
async function openPaused(page: Page, query = ""): Promise<void> {
    await page.goto(`/v/${seededViz().slug}?t=0.5${query}`);
    await showViewIfTabbed(page, "Canvas");
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: LOAD });
    await expect(page.getByRole("button", { name: "Play animation" }).first()).toBeAttached({ timeout: LOAD });
    // The picture is fetched and keyed after the drawing lands.
    await page.waitForTimeout(1500);
}

/** A seat of the stage's one dock, in view at rest. */
function stageSeat(page: Page, name: string): Locator {
    return page.locator(".animation-dock").getByRole("button", { name, exact: true });
}

/** Open the stage dock's More (a phone) and return its menu. */
async function openMore(page: Page): Promise<Locator> {
    await page.locator(".animation-dock").getByRole("button", { name: "Layers and more" }).click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    return menu;
}

/** Press "Just the picture" where it lives: a row of More on a phone, a seat
 *  of the dock's open face on a desk (two choices are not a menu). */
async function pressJustThePicture(page: Page): Promise<void> {
    if (page.viewportSize()!.width < 640) {
        const menu = await openMore(page);
        await menu.getByRole("menuitemcheckbox", { name: "Just the picture" }).click();
        await page.keyboard.press("Escape");
        return;
    }
    const dock = await openCanvasDock(page);
    await dock.getByRole("button", { name: "Just the picture", exact: true }).click();
}

/** Toggle the picture where it lives: one press on its seat. */
async function togglePicture(page: Page): Promise<void> {
    await stageSeat(page, "Picture").click();
}

/** Film the stage's paint on every frame across `act`; the frames whose paint changed. */
async function changingFrames(page: Page, act: () => Promise<void>, ms = 800): Promise<number> {
    await page.evaluate(
        ({ ms, src }) => {
            const sample = new Function(`return (${src})()`) as () => StageInk | null;
            const w = window as unknown as { __film: number[] };
            w.__film = [];
            const t0 = performance.now();
            const loop = () => {
                w.__film.push(sample()?.alpha ?? 0);
                if (performance.now() - t0 < ms) requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        },
        { ms, src: SAMPLE_STAGE.toString() },
    );
    await act();
    await page.waitForTimeout(ms + 200);
    const film = await page.evaluate(() => (window as unknown as { __film: number[] }).__film);
    const deltas = film.slice(1).map((a, i) => Math.abs(a - film[i]!));
    const total = deltas.reduce((s, d) => s + d, 0);
    // A frame counts when it carries at least 2 % of the whole change.
    return deltas.filter((d) => d > 0.02 * total).length;
}

/** The stage's paint, read whole. */
async function stage(page: Page): Promise<StageInk> {
    await page.waitForTimeout(500);
    return (await page.evaluate(SAMPLE_STAGE))!;
}

/**
 * Painted pixels on the stage's grid lines: the canvas's own column at its
 * y-axis (the axis is drawn wherever it crosses the stage) with the picture
 * and every drawn layer off, so only the grid can paint there.
 */
async function gridInk(page: Page): Promise<number> {
    return page.evaluate(() => {
        const c = document.querySelector<HTMLCanvasElement>(".canvas-stage > .canvas-container canvas")!;
        const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i]! > 0) n++;
        return n;
    });
}

const WIDTHS = [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
];

for (const vp of WIDTHS) {
    const phone = vp.width < 640;
    test.describe(`o41 stage — layers (${vp.width})`, () => {
        test.use({ viewport: vp, colorScheme: "dark", ...(phone ? { isMobile: true, hasTouch: true } : {}) });
        test.setTimeout(120_000);

        test("toggling the picture changes the stage over several frames, out and in", async ({ page }) => {
            await openPaused(page);
            const out = await changingFrames(page, () => togglePicture(page));
            await expect(page).toHaveURL(/[?&]bg=0/);
            expect(out, "the picture leaves over five frames or more").toBeGreaterThanOrEqual(5);
            const back = await changingFrames(page, () => togglePicture(page));
            await expect(page).not.toHaveURL(/[?&]bg=/);
            expect(back, "the picture arrives over five frames or more").toBeGreaterThanOrEqual(5);
        });

        test("from rest, one press toggles the picture and one the outline, each pushing its key", async ({ page }) => {
            await openPaused(page);
            for (const [name, key] of [
                ["Picture", /[?&]bg=0/],
                ["Outline", /[?&]trace=1/],
            ] as const) {
                const seat = stageSeat(page, name);
                await expect(seat, `${name} is in view at rest`).toBeVisible();
                const before = await stage(page);
                const len = await page.evaluate(() => history.length);
                await seat.click();
                await expect(page).toHaveURL(key);
                expect(await page.evaluate(() => history.length), `${name} pushes`).toBe(len + 1);
                expect((await stage(page)).alpha, `${name} changes the stage`).not.toBe(before.alpha);
                await expect(seat).toHaveAttribute("aria-pressed", name === "Picture" ? "false" : "true");
            }
        });

        test("Just the picture hides the drawn layers and the grid, shows the picture whole; pressed again they return", async ({ page }) => {
            await openPaused(page);
            const washed = await stage(page);
            await pressJustThePicture(page);
            await expect(page).toHaveURL(/[?&]line=0/);
            await expect(page).toHaveURL(/[?&]circles=0/);
            // The picture is whole: much more paint than its wash under the drawing.
            const whole = await stage(page);
            expect(whole.alpha, "the picture at full strength").toBeGreaterThan(2 * washed.alpha);
            // With the picture off too, nothing paints: the grid left with the drawn layers.
            await togglePicture(page);
            await expect(page).toHaveURL(/[?&]bg=0/);
            await page.waitForTimeout(600);
            expect(await gridInk(page), "no grid pixel").toBe(0);
            await togglePicture(page);
            await pressJustThePicture(page);
            await expect(page).not.toHaveURL(/[?&](line|circles)=/);
        });
    });
}

test.describe("o41 stage — the view in the link (1440)", () => {
    test.use({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
    test.setTimeout(120_000);

    test("a wheel zoom is written as it settles and survives a reload", async ({ page }) => {
        await openPaused(page);
        const box = (await page.locator(".canvas-stage > .canvas-container").boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -500);
        await expect(page).toHaveURL(/[?&]z=\d/, { timeout: 5_000 });
        await expect(page).toHaveURL(/[?&]c=-?\d/);
        const z = new URL(page.url()).searchParams.get("z");
        await page.reload();
        await expect(page.locator(".animation-dock")).toBeVisible({ timeout: LOAD });
        await expect(page.locator(".canvas-stage [data-zoomed]")).toBeAttached({ timeout: LOAD });
        expect(new URL(page.url()).searchParams.get("z")).toBe(z);
    });

    test("a basis change pushes basis= and Back undoes it", async ({ page }) => {
        await openPaused(page);
        const before = page.url();
        await page.getByRole("group", { name: "Polynomial bases" }).getByRole("button", { name: /Chebyshev/ }).click();
        await expect(page).toHaveURL(/[?&]basis=epicycles%2Cchebyshev|[?&]basis=epicycles,chebyshev/);
        await page.goBack();
        await expect(page).toHaveURL(before);
        await expect(page.getByRole("group", { name: "Polynomial bases" }).getByRole("button", { name: /Chebyshev/ })).toHaveAttribute("aria-pressed", "false");
    });

    test("Copy link writes the address as it stands", async ({ page, context }) => {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        await openPaused(page, "&bg=0");
        const dock = await openAppDock(page);
        await dock.getByRole("button", { name: "Copy link" }).click();
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
    });
});

test.describe("o41 stage — Copy link on a phone @coarse", () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: "dark" });
    test.setTimeout(120_000);

    test("@coarse Copy link is a row of the stage dock's More", async ({ page, context }) => {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        await openPaused(page, "&trace=1");
        const menu = await openMore(page);
        await menu.getByRole("menuitem", { name: "Copy link" }).click();
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
    });
});
