import { expect, test, type Locator, type Page } from "@playwright/test";
import * as path from "node:path";

/**
 * X.F.W13.b — gate G-b: every control of the image mode ACTS (owner frame 3,
 * 2026-09-23; COHESION §0bc row OA-15 — "many of these items either don't work
 * or are not glass-ui idiomatic, rounded").
 *
 * Each control is driven the way a person drives it and its effect is read
 * back from the page — never a store hook. The census half rides beside it:
 * every command in the image mode's sidebar and its docks carries a producer
 * `data-slot` (glass Button / NumberField / Select / Collapsible / Configurator)
 * or is the glass dock's own control, and every icon-only command is a circle.
 */

const TEST_IMAGE = path.resolve(import.meta.dirname, "../../assets/animals/golden-retriever.webp");

/** Resolve a click's file-chooser, or fail with the control that did not open one. */
async function opensPicker(page: Page, act: () => Promise<void>): Promise<void> {
    const [chooser] = await Promise.all([page.waitForEvent("filechooser", { timeout: 5_000 }), act()]);
    expect(chooser.isMultiple()).toBe(false);
}

async function expectCircle(loc: Locator): Promise<void> {
    const b = await loc.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height, radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) };
    });
    expect(b.w).toBeGreaterThan(0);
    expect(Math.abs(b.w - b.h)).toBeLessThanOrEqual(0.5);
    expect(b.radius).toBeGreaterThanOrEqual(b.w / 2 - 0.5);
}

/** A layer's disclosure: the trigger owns `aria-expanded`; open it if closed. */
async function openLayer(side: Locator, name: RegExp): Promise<Locator> {
    const trigger = side.getByRole("button", { name });
    if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    return trigger;
}

/** Hand-rolled census: every interactive node in the image mode that is not a producer primitive. */
async function handRolled(page: Page): Promise<string[]> {
    return page.evaluate(() => {
        const scopes = [...document.querySelectorAll(".viz-panel-left-wrap, .canvas-stage")];
        const out: string[] = [];
        for (const s of scopes)
            for (const el of s.querySelectorAll<HTMLElement>(
                "button, input:not([type=file]), select, textarea, [role=button], [role=combobox], [role=spinbutton]",
            )) {
                const producer =
                    el.closest("[data-slot]") !== null ||
                    el.matches(".dock-icon-button, .dock-layer--summary, .dock-trigger");
                if (!producer) out.push(`${el.tagName.toLowerCase()}.${el.className}`);
            }
        return out;
    });
}

/**
 * The image mode at rest (F.W13.c, OA-16): no sidebar, the main area's drop
 * target is the one affordance. The sidebar arrives with the image, so the
 * returned locator is asserted only after `uploadImage`.
 */
async function openImageMode(page: Page): Promise<Locator> {
    await page.goto("/visualize");
    await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
    return page.locator(".viz-panel-left-wrap");
}

async function uploadImage(page: Page): Promise<void> {
    await page.getByTestId("image-file-input").setInputFiles(TEST_IMAGE);
    await page.waitForURL(/\/w\//, { timeout: 20_000 });
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 60_000 });
}

test.describe("G-b — F.W13 image-mode controls act (frame 3)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("at rest the drop target opens the picker by key; with an image the Image layer discloses", async ({ page }) => {
        const side = await openImageMode(page);

        // At rest the one affordance is the main area's drop target. G-c
        // (f-w13-image-empty.spec.ts) owns the rest state: its shape, the
        // sidebar's absence and the pointer pick. G-b keeps only what G-c
        // does not drive: the affordance is the producer Button and it acts by key.
        const target = page.locator(".drop-target").getByRole("button", { name: /Choose an image/ });
        await expect(target).toHaveAttribute("data-slot", "button");
        await opensPicker(page, () => target.press("Enter"));

        await uploadImage(page);

        const layer = side.getByRole("button", { name: /^Image/ });
        await expect(layer).toBeVisible();
        const before = await layer.getAttribute("aria-expanded");
        await layer.click();
        await expect(layer).not.toHaveAttribute("aria-expanded", before ?? "");
        await layer.click();
        await expect(layer).toHaveAttribute("aria-expanded", before ?? "");

        expect(await handRolled(page)).toEqual([]);
    });

    test("with an image: every sidebar control acts and every icon-only command is a circle", async ({ page }) => {
        const side = await openImageMode(page);
        await uploadImage(page);

        // Image — the replace command is a keyboard-reachable glass Button.
        const replace = side.getByRole("button", { name: "Replace image" });
        await expect(replace).toHaveAttribute("data-slot", "button");
        await opensPicker(page, () => replace.click());
        await opensPicker(page, () => replace.press("Enter"));

        // Decomposition — basis toggle, the two number fields + sliders, reset.
        await openLayer(side, /^Decomposition/);
        const chebyshev = side.getByRole("button", { name: /Chebyshev/ });
        const pressed = await chebyshev.getAttribute("aria-pressed");
        await chebyshev.click();
        await expect(chebyshev).not.toHaveAttribute("aria-pressed", pressed ?? "");
        await chebyshev.click();
        await expect(chebyshev).toHaveAttribute("aria-pressed", pressed ?? "");

        const harmonics = side.getByRole("spinbutton", { name: "Harmonics" });
        const harmonicsSlider = side.getByRole("slider", { name: "Harmonics" });
        await harmonics.fill("40");
        await harmonics.press("Enter");
        await expect(harmonicsSlider).toHaveAttribute("aria-valuenow", "40");
        await harmonicsSlider.focus();
        await page.keyboard.press("ArrowRight");
        await expect(harmonics).toHaveValue("41");

        const points = side.getByRole("spinbutton", { name: "Sample Points" });
        const pointsSlider = side.getByRole("slider", { name: "Sample Points" });
        await pointsSlider.focus();
        await page.keyboard.press("Home");
        await expect(points).toHaveValue(String(await pointsSlider.getAttribute("aria-valuemin")));

        const resetD = side.getByRole("button", { name: "Reset to defaults" }).first();
        await expectCircle(resetD);
        await resetD.click();
        await expect(harmonics).toHaveValue("200");
        await expect(points).toHaveValue("1024");
        await expect(resetD).toBeDisabled();

        // Contour — strategy select, the labelled number fields + their sliders,
        // the Advanced disclosure (Max Contours' "All" reading), reset.
        await openLayer(side, /^Contour/);
        const strategy = side.getByRole("combobox", { name: "Contour extraction strategy" });
        await expect(strategy).toHaveAttribute("data-slot", "select-trigger");
        await expect(strategy).toContainText("Auto");

        const ml = side.getByRole("spinbutton", { name: "ML Threshold" });
        const mlSlider = side.getByRole("slider", { name: "ML Threshold" });
        await expect(ml).toHaveValue("0.50");
        await ml.fill("0.3");
        await ml.press("Enter");
        await expect(mlSlider).toHaveAttribute("aria-valuenow", "0.3");
        await expect(ml).toHaveValue("0.30");

        const blur = side.getByRole("spinbutton", { name: "Blur Sigma" });
        const blurSlider = side.getByRole("slider", { name: "Blur Sigma" });
        await blurSlider.focus();
        await page.keyboard.press("ArrowRight");
        await expect(blur).toHaveValue("0.6");

        const resetC = side.getByRole("button", { name: "Reset to defaults" }).nth(1);
        await expectCircle(resetC);
        await resetC.click();
        await expect(ml).toHaveValue("0.50");
        await expect(blur).toHaveValue("0.5");
        await expect(resetC).toBeDisabled();

        await strategy.click();
        await page.getByRole("option", { name: /Otsu/ }).click();
        await expect(strategy).toContainText("Otsu");
        await expect(ml).toHaveCount(0);

        const advanced = side.getByRole("button", { name: "Advanced" });
        await advanced.click();
        await expect(advanced).toHaveAttribute("aria-expanded", "true");
        const maxContours = side.getByRole("spinbutton", { name: "Max Contours" });
        await expect(maxContours).toHaveValue("24");
        await side.getByRole("slider", { name: "Max Contours" }).focus();
        await page.keyboard.press("Home");
        await expect(maxContours).toHaveValue("");
        await expect(maxContours).toHaveAttribute("placeholder", "All");
        await maxContours.fill("12");
        await maxContours.press("Enter");
        await expect(side.getByRole("slider", { name: "Max Contours" })).toHaveAttribute("aria-valuenow", "12");
        await advanced.click();
        await expect(advanced).toHaveAttribute("aria-expanded", "false");

        // Coefficients — the layer discloses.
        const coeffs = side.getByRole("button", { name: /^Coefficients/ });
        const before = await coeffs.getAttribute("aria-expanded");
        await coeffs.click();
        await expect(coeffs).not.toHaveAttribute("aria-expanded", before ?? "");

        expect(await handRolled(page)).toEqual([]);
    });

    test("with an image: the play control is the dock's circle and toggles playback", async ({ page }) => {
        await openImageMode(page);
        await uploadImage(page);

        const play = page.getByRole("button", { name: /(Play|Pause) animation/ });
        await expect(play).toHaveClass(/dock-icon-button/);
        await expectCircle(play);

        // Playback autostarts once the decomposition lands; toggle from there.
        await expect(play).toHaveAttribute("aria-pressed", "true", { timeout: 60_000 });
        await play.press("Enter");
        await expect(play).toHaveAttribute("aria-pressed", "false");
        await expect(play).toHaveAccessibleName("Play animation");
        await expectCircle(play);
        await play.press("Enter");
        await expect(play).toHaveAttribute("aria-pressed", "true");
        await expect(play).toHaveAccessibleName("Pause animation");

        expect(await handRolled(page)).toEqual([]);
    });
});
