import { expect, test, type Page } from "@playwright/test";
import * as path from "node:path";

/**
 * X.F.W13.c — gate G-c: the image mode's empty state (owner frame 4,
 * 2026-09-23; COHESION §0bc row OA-16 — "this 'drop click to upload' text is
 * duplicative — we should just display the main area with no right sidebar when
 * nothing is there, and then smoothly animate in the right sidebar when
 * something is dragged over and dropped").
 *
 * Read on the page: at rest there is NO sidebar and ONE upload affordance (the
 * main area's drop target); a dragenter makes the drop target signal; after a
 * file pick the sidebar is present and its enter RAN (the CSS transitions the
 * page started are recorded frame by frame from before the pick); in a
 * reduced-motion context the same arrival runs no transition at all.
 */

const TEST_IMAGE = path.resolve(import.meta.dirname, "../../assets/animals/golden-retriever.webp");

/** The transitions the sidebar's arrival can run: the aside band + the content. */
type Seen = { prop: string; target: string };

async function openEmpty(page: Page): Promise<void> {
    await page.goto("/visualize");
    await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
}

async function recordTransitions(page: Page): Promise<void> {
    await page.evaluate(() => {
        const w = window as unknown as { __seen: Seen[] };
        w.__seen = [];
        const tick = () => {
            for (const a of document.getAnimations()) {
                if (!(a instanceof CSSTransition)) continue;
                const el = (a.effect as KeyframeEffect | null)?.target as Element | null;
                if (!el) continue;
                const target = el.matches(".viz-configurator > [data-slot=\"configurator\"]")
                    ? "configurator"
                    : el.matches(".viz-panel-left-wrap")
                      ? "sidebar"
                      : "";
                if (target) w.__seen.push({ prop: a.transitionProperty, target });
            }
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}

async function seen(page: Page): Promise<string[]> {
    const all = await page.evaluate(() => (window as unknown as { __seen: Seen[] }).__seen);
    return [...new Set(all.map((s) => `${s.target}:${s.prop}`))].sort();
}

async function pickImage(page: Page): Promise<void> {
    await page.getByTestId("image-file-input").setInputFiles(TEST_IMAGE);
    await page.waitForURL(/\/w\//, { timeout: 20_000 });
    await expect(page.locator(".viz-panel-left-wrap")).toBeVisible({ timeout: 20_000 });
}

test.describe("G-c — F.W13 image mode: one drop affordance, the sidebar arrives with content (frame 4)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("at rest: no sidebar, the main area full width, ONE upload affordance that signals on dragenter", async ({ page }) => {
        await openEmpty(page);

        // No sidebar: the host's sidebar content is absent and the producer's
        // aside takes no box; the stage fills the Configurator.
        await expect(page.locator(".viz-panel-left-wrap")).toHaveCount(0);
        await expect(page.locator(".configurator-aside")).toBeHidden();
        const widths = await page.evaluate(() => ({
            stage: document.querySelector(".canvas-stage")!.getBoundingClientRect().width,
            frame: document.querySelector(".viz-configurator")!.getBoundingClientRect().width,
        }));
        expect(widths.frame - widths.stage).toBeLessThanOrEqual(4);

        // ONE upload affordance: the main area's glass Button + the format line;
        // the retired sidebar card's text is nowhere on the page.
        const uploads = page.getByRole("button", { name: /upload/i });
        await expect(uploads).toHaveCount(1);
        const target = page.locator(".drop-target").getByRole("button", { name: "Drop or click to upload" });
        await expect(target).toHaveAttribute("data-slot", "button");
        await expect(page.locator(".drop-target")).toContainText("PNG/JPG/SVG ≤ 10 MB");
        await expect(page.getByText(/Drop or click to upload —/)).toHaveCount(0);
        await expect(page.getByTestId("image-file-input")).toHaveCount(1);
        const [chooser] = await Promise.all([page.waitForEvent("filechooser"), target.click()]);
        expect(chooser.isMultiple()).toBe(false);

        // dragenter → the drop target signals; dragleave → it rests.
        const dt = await page.evaluateHandle(() => new DataTransfer());
        await page.locator(".drop-target").dispatchEvent("dragenter", { dataTransfer: dt });
        await expect(page.locator(".drop-target")).toHaveAttribute("data-dragging", "true");
        await page.locator(".drop-target").dispatchEvent("dragleave", { dataTransfer: dt });
        await expect(page.locator(".drop-target")).not.toHaveAttribute("data-dragging");
    });

    test("after a file pick the sidebar is present and its enter ran (band + content)", async ({ page }) => {
        await openEmpty(page);
        await recordTransitions(page);
        await pickImage(page);

        await expect(page.locator(".configurator-aside")).toBeVisible();
        await expect(page.locator(".drop-target")).toHaveCount(0);
        const band = await page.locator(".configurator-aside").evaluate((el) => el.getBoundingClientRect().width);
        expect(band).toBeGreaterThanOrEqual(300);

        const ran = await seen(page);
        expect(ran).toContain("configurator:grid-template-columns");
        expect(ran).toContain("sidebar:transform");
        expect(ran).toContain("sidebar:opacity");
    });
});

test.describe("G-c — PRM context: the sidebar arrives without motion", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("reduced motion: no sidebar at rest, then present after a pick with no transition run", async ({ page }) => {
        // `test.use({ reducedMotion })` did not reach the page at this pin (measured:
        // `matchMedia("(prefers-reduced-motion: reduce)").matches === false`), so the
        // PRM context is emulated on the page itself — the idiom the suite's
        // visual-checkpoint spec already uses — and asserted before it is relied on.
        await page.emulateMedia({ reducedMotion: "reduce" });
        await openEmpty(page);
        expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
        await expect(page.locator(".viz-panel-left-wrap")).toHaveCount(0);
        await recordTransitions(page);
        await pickImage(page);

        await expect(page.locator(".configurator-aside")).toBeVisible();
        expect(await seen(page)).toEqual([]);
    });
});
