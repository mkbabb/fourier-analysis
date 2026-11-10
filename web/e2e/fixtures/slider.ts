import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Canon F2 (restraint, C-15/C-18): a number has one control, its slider, and a
 * readout beside the label. Specs read and set a value through the slider's
 * own keyboard contract (Home, then arrow steps), the way a person without a
 * pointer does.
 */
export function slider(scope: Page | Locator, name: string | RegExp): Locator {
    return scope.getByRole("slider", { name, exact: typeof name === "string" });
}

export async function sliderValue(control: Locator): Promise<number> {
    return Number(await control.getAttribute("aria-valuenow"));
}

const EPS = 1e-9;

export async function setSlider(control: Locator, value: number): Promise<void> {
    await control.focus();
    let now = await sliderValue(control);
    const up = value > now;
    for (let guard = 0; guard < 1000 && (up ? now < value - EPS : now > value + EPS); guard++) {
        await control.press(up ? "ArrowRight" : "ArrowLeft");
        now = await sliderValue(control);
    }
    expect(Math.abs(now - value), `slider at ${now}, asked for ${value}`).toBeLessThan(EPS + 1e-6);
}

/** The value as the row writes it beside its label. */
export function readout(scope: Page | Locator, name: string | RegExp): Locator {
    // `has` is read inside each row, so the inner locator is rooted at the page.
    const page = "page" in scope ? scope.page() : scope;
    return scope.locator("[data-control-row]", { has: slider(page, name) }).locator("[data-row-readout]");
}
