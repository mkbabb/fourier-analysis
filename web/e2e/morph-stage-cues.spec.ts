import { expect, test, type Page } from "@playwright/test";

/**
 * The design critique's first-severity /morph rows:
 *  M1 — no visible page heading (the dock already names the page; the h1
 *       stays for assistive technology);
 *  M2 — the stage says it can be pressed before it is: at rest the shape
 *       breathes, and a hovering pointer draws it a step nearer;
 *  M3 — Reset, enabled, reads as enabled (Export's emphasis, not the quiet
 *       ink that dims by design).
 */
test.use({ viewport: { width: 1440, height: 900 } });

async function openMorph(page: Page) {
    await page.goto("/morph");
    const stage = page.getByRole("button", { name: "Morph between the sun and moon shapes" });
    await expect(stage).toBeVisible({ timeout: 60_000 });
    return stage;
}

test("M1: the page heading is for assistive technology only", async ({ page }) => {
    await openMorph(page);
    const h1 = page.getByRole("heading", { level: 1, name: "Fourier Morph" });
    await expect(h1).toHaveCount(1);
    const box = (await h1.boundingBox())!;
    expect(box.width * box.height, "the heading paints no visible box").toBeLessThanOrEqual(1);
});

test("M3: an enabled Reset wears Export's ink", async ({ page }) => {
    await openMorph(page);
    const ink = (name: string) =>
        page.getByRole("button", { name, exact: true }).evaluate((b) => getComputedStyle(b).color);
    await expect(page.getByRole("button", { name: "Reset", exact: true })).toBeEnabled();
    expect(await ink("Reset")).toBe(await ink("Export"));
});

test("M2: at rest the shape breathes; a hover draws it nearer; pressing still morphs", async ({ page }) => {
    // The breath is read by its keyframes' name, which a scoped style suffixes with the component's hash.
    const stage = await openMorph(page);
    const breath = () =>
        stage.evaluate((b) =>
            b.querySelector("svg")!
                .getAnimations()
                .filter((a) => /^morph-breath(-|$)/.test((a as CSSAnimation).animationName) && a.playState === "running").length,
        );
    expect(await breath(), "the breath runs at rest").toBe(1);

    const scale = () => stage.evaluate((b) => getComputedStyle(b.querySelector("svg")!).scale);
    expect(await scale()).toBe("none");
    await stage.hover();
    await page.waitForTimeout(500);
    expect(await scale(), "hover intent").toBe("1.03");

    await stage.click();
    await expect(stage).toHaveAttribute("aria-busy", "true");
    expect(
        await stage.evaluate((b) =>
            b.querySelector("svg")!
                .getAnimations()
                .filter((a) => /^morph-breath(-|$)/.test((a as CSSAnimation).animationName))
                .map((a) => a.playState),
        ),
        "mid-morph the breath holds where it stands",
    ).toEqual(["paused"]);
});

test("M2 under reduced motion: the shape is still", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const stage = await openMorph(page);
    expect(
        await stage.evaluate((b) =>
            b.querySelector("svg")!.getAnimations().filter((a) => /^morph-breath(-|$)/.test((a as CSSAnimation).animationName)).length,
        ),
    ).toBe(0);
});
