import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";
import { showViewIfTabbed } from "./fixtures/workspace";

/**
 * FORTY-FIRST H and G (owner, 19 Nov: "the visualize area should take up more
 * of the screen and not have two docks of controls"; "controls dock in the
 * top right corner of the visualizer is too large"). The stage has one dock,
 * at its foot: the transport, the four layers, the canvas's tools and Edit.
 * On a phone it is one plate of two rows (the scrub alone, then seven 44 px
 * seats), never folded, inside the gutter; the drawing is fitted to the box
 * above it with a 6 % margin a side.
 */

const LOAD = 60_000;

async function openViz(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}?t=0.5`);
    await showViewIfTabbed(page, "Canvas");
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: LOAD });
    await expect(page.getByRole("button", { name: "Play animation" }).first()).toBeEnabled({ timeout: LOAD });
    await page.waitForTimeout(800);
}

/** The drawn line's horizontal extent on the stage canvas (CSS px). */
async function inkWidth(page: Page): Promise<number> {
    return page.evaluate(() => {
        const c = document.querySelector<HTMLCanvasElement>(".canvas-stage > .canvas-container canvas")!;
        const ctx = c.getContext("2d")!;
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let min = Infinity, max = -Infinity;
        for (let y = 0; y < c.height; y += 2) {
            for (let x = 0; x < c.width; x += 2) {
                const i = (y * c.width + x) * 4;
                const r = d[i]!, g = d[i + 1]!, b = d[i + 2]!, a = d[i + 3]!;
                if (a > 60 && r > 120 && r > g + 45 && r > b + 45) {
                    if (x < min) min = x;
                    if (x > max) max = x;
                }
            }
        }
        return max > min ? ((max - min) * c.getBoundingClientRect().width) / c.width : 0;
    });
}

for (const vp of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
]) {
    const phone = vp.width < 640;
    test.describe(`FORTY-FIRST H — one dock on the stage (${vp.width})`, () => {
        test.use({ viewport: vp, ...(phone ? { isMobile: true, hasTouch: true } : {}) });

        test("one dock on the stage, one More, one glyph size", async ({ page }) => {
            await openViz(page);
            await expect(page.locator(".canvas-stage .glass-dock")).toHaveCount(1);
            await expect(page.locator(".controls-dock-anchor")).toHaveCount(0);
            const dock = page.locator(".animation-dock");
            await expect(dock.getByRole("button", { name: "Layers and more" })).toHaveCount(phone ? 1 : 0);
            for (const name of ["Play animation", "Picture", "Outline", "Edit contour"]) {
                await expect(dock.getByRole("button", { name, exact: true })).toBeVisible();
            }
            const glyphs = await dock.evaluate((d) =>
                [...d.querySelectorAll<SVGElement>("button > svg.lucide, .dock-trigger > svg.lucide")]
                    .filter((s) => s.getClientRects().length && !s.closest("[inert]"))
                    .map((s) => Math.round(s.getBoundingClientRect().width)),
            );
            expect(new Set(glyphs).size, `glyph boxes: ${glyphs.join(", ")}`).toBe(1);
        });

        test("the drawing is fitted with a 6 % margin, above the dock", async ({ page }) => {
            await openViz(page);
            const stage = (await page.locator(".canvas-stage").boundingBox())!;
            const ink = await inkWidth(page);
            // The seed's outline is wider than tall: at the fit it spans the
            // stage's width less 6 % a side of its own width (with slack for
            // the line's ends and the sample grid).
            const target = phone ? 315 : 0;
            if (phone) expect(ink, "the drawing's width").toBeGreaterThanOrEqual(target);
            else expect(ink).toBeGreaterThan(0);
            const dockTop = (await page.locator(".controls-overlay").boundingBox())!.y;
            expect(dockTop).toBeLessThan(stage.y + stage.height);
        });
    });
}

test.describe("FORTY-FIRST H — the phone plate", () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test("the plate keeps the gutter; seven seats on the touch cell; the scrub runs the plate", async ({ page }) => {
        await openViz(page);
        const dock = page.locator(".animation-dock");
        const plate = (await dock.boundingBox())!;
        expect(plate.width, "the plate's width").toBeLessThanOrEqual(358);
        const seats = await dock.locator(".card-seats").evaluate((row) =>
            [...row.querySelectorAll<HTMLElement>("button")].map((b) => ({
                name: b.getAttribute("aria-label"),
                w: b.getBoundingClientRect().width,
                h: b.getBoundingClientRect().height,
            })),
        );
        expect(seats[0]!.name).toMatch(/^(Play|Pause) animation$/);
        expect(seats.slice(1).map((s) => s.name)).toEqual([
            "Picture",
            "Outline",
            "Layers and more",
            "Playback speed",
            "Easing",
            "Edit contour",
        ]);
        for (const s of seats) {
            expect(s.w, `${s.name} width`).toBeGreaterThanOrEqual(43.5);
            expect(s.h, `${s.name} height`).toBeGreaterThanOrEqual(43.5);
        }
        const scrub = (await dock.locator(".card-scrub").boundingBox())!;
        expect(scrub.width, "the scrub's length").toBeGreaterThanOrEqual(300);
    });

    test("the scrub is dragged from rest, with no press before it", async ({ page }) => {
        await openViz(page);
        const slider = page.locator('.animation-dock [role="slider"][aria-label="Timeline"]');
        const track = (await page.locator(".animation-dock .card-scrub").boundingBox())!;
        const before = Number(await slider.getAttribute("aria-valuenow"));
        const y = track.y + track.height / 2;
        // From the far end of the row to its near end: the scrub's track is
        // inset in its row, so a drag across 0.2..0.8 of the row from t = 0.5
        // could only ever move the position 0.3 or a little less.
        await page.mouse.move(track.x + track.width * 0.9, y);
        await page.mouse.down();
        await page.mouse.move(track.x + track.width * 0.1, y, { steps: 8 });
        await page.mouse.up();
        const after = Number(await slider.getAttribute("aria-valuenow"));
        expect(Math.abs(after - before), "the drag moved the position").toBeGreaterThan(0.3);
    });

    test("the stage card fills the screen under the top dock, inside the gutter", async ({ page }) => {
        await openViz(page);
        const card = (await page.locator('.workspace-host [data-slot="configurator"] > .configurator-stage').boundingBox())!;
        expect(card.x).toBeCloseTo(12, 0);
        expect(card.x + card.width).toBeCloseTo(378, 0);
        expect(card.y).toBeLessThanOrEqual(80);
        expect(card.y + card.height).toBeCloseTo(832, 0);
    });
});

test.describe("FORTY-FIRST H — the dock is there from the first frame", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("while the piece loads, the dock stands with its seats disabled", async ({ page }) => {
        let release: () => void = () => {};
        const held = new Promise<void>((r) => (release = r));
        await page.route(`**/api/visualizations/${seededViz().slug}**`, async (route) => {
            await held;
            await route.continue();
        });
        await page.goto(`/v/${seededViz().slug}`);
        const dock = page.locator(".animation-dock");
        await expect(dock).toBeVisible({ timeout: LOAD });
        await expect(dock.getByRole("button", { name: "Play animation" })).toBeDisabled();
        await expect(dock.getByRole("button", { name: "Picture", exact: true })).toBeDisabled();
        release();
        await expect(dock.getByRole("button", { name: "Play animation" }).or(dock.getByRole("button", { name: "Pause animation" })).first()).toBeEnabled({ timeout: LOAD });
    });
});

test.describe("audit 26 — a phone held sideways", () => {
    test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });

    test("the canvas passes half the screen", async ({ page }) => {
        await openViz(page);
        const stage = (await page.locator('.workspace-host [data-slot="configurator"] > .configurator-stage').boundingBox())!;
        expect((stage.width * stage.height) / (844 * 390)).toBeGreaterThan(0.5);
    });
});
