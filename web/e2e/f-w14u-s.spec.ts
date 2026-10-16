import { expect, test, type Page } from "@playwright/test";
import { SAMPLE_IMAGE } from "./fixtures/sample";

/**
 * X.F.W14U.s — gate G-s, OA-59 (owner, 2026-09-24, frame
 * `fourier/evidence/W14/owner-2026-09-24-side-pane.png`): "the side controls
 * pane in fourier should be seperated, not totally attached, like it is now."
 *
 * Spec `F-W14U.md` §0cq `.s` + (b) §0cr: the controls pane is a detached glass
 * card — an inset gutter from the viewport edge AND from the stage, all four
 * corners at `--radius-card`, its own shadow — at 1440 and 1024; at 390 the
 * mobile sheet keeps its own form (a plain column), and it too stays inside the
 * viewport. The card is glass's own (`Card`, `data-slot`/`.card`), never a copy.
 *
 * Every figure is read from the served page: the radius token is resolved on
 * this page's own `:root`, never a copied pixel value.
 */
const PHASE = process.env.FW14U_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14u/s";

async function loadImage(page: Page): Promise<void> {
    await page.goto("/visualize");
    await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
    await page.waitForURL(/\/w\//, { timeout: 20_000 });
    // X.F.W14V.u4 — UIA-F-74: below lg a finished upload brings the canvas to
    // the front; this setup reads the Controls sheet, so it selects that tab.
    if (page.viewportSize()!.width < 1024) {
        await expect(page.locator(".canvas-stage")).not.toHaveClass(/panel-inactive/, { timeout: 60_000 });
        await page.getByRole("tab", { name: "Controls" }).click();
    }
    await expect(page.locator(".viz-panel-left-wrap")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: /Replace image/ })).toBeVisible({ timeout: 30_000 });
    await settled(page);
}

/** Every time-based animation on the pane and the Configurator grid has ended. */
async function settled(page: Page): Promise<void> {
    await page.waitForFunction(() =>
        [".viz-panel-left-wrap", '.viz-configurator > [data-slot="configurator"]'].every((s) => {
            const el = document.querySelector(s);
            return (
                !!el &&
                el
                    .getAnimations()
                    .every(
                        (a) =>
                            a.playState !== "running" ||
                            !(a.timeline instanceof DocumentTimeline) ||
                            a.effect?.getTiming().iterations === Infinity,
                    )
            );
        }),
    );
}

type Read = {
    vw: number;
    pane: { l: number; r: number; t: number; b: number };
    stage: { l: number; r: number; t: number; b: number };
    shell: { l: number; r: number };
    radii: number[];
    shadow: string;
    card: boolean;
    radiusCard: number;
    /** X.F.W14V.s2 — glass's aside, the detached card since glass 10.1.0 (O-75). */
    aside: { l: number; r: number; t: number; b: number };
    asideRadii: number[];
    asideShadow: string;
    detached: boolean;
};

async function read(page: Page): Promise<Read> {
    return page.evaluate(() => {
        const rect = (s: string) => {
            const q = document.querySelector(s)!.getBoundingClientRect();
            return { l: q.left, r: q.right, t: q.top, b: q.bottom };
        };
        const pane = document.querySelector(".viz-panel-left-wrap")!;
        const cs = getComputedStyle(pane);
        const probe = document.createElement("div");
        probe.style.borderTopLeftRadius = "var(--radius-card)";
        document.body.appendChild(probe);
        const radiusCard = parseFloat(getComputedStyle(probe).borderTopLeftRadius);
        probe.remove();
        return {
            vw: document.documentElement.clientWidth,
            pane: rect(".viz-panel-left-wrap"),
            stage: rect(".configurator-stage"),
            shell: rect(".viz-configurator"),
            radii: [
                cs.borderTopLeftRadius,
                cs.borderTopRightRadius,
                cs.borderBottomRightRadius,
                cs.borderBottomLeftRadius,
            ].map((v) => parseFloat(v)),
            shadow: cs.boxShadow,
            card: pane.classList.contains("card"),
            radiusCard,
            aside: rect(".configurator-aside"),
            asideRadii: (() => {
                const a = getComputedStyle(document.querySelector(".configurator-aside")!);
                return [a.borderTopLeftRadius, a.borderTopRightRadius, a.borderBottomRightRadius, a.borderBottomLeftRadius].map((v) => parseFloat(v));
            })(),
            asideShadow: getComputedStyle(document.querySelector(".configurator-aside")!).boxShadow,
            detached: document.querySelector('.viz-configurator [data-slot="configurator"]')?.getAttribute("data-layout") === "detached",
        };
    });
}

for (const scheme of ["light", "dark"] as const) {
    for (const vp of [
        { width: 1440, height: 900 },
        { width: 1024, height: 900 },
    ]) {
        test.describe(`G-s — OA-59 the controls pane is a detached glass card (${vp.width} ${scheme})`, () => {
            test.use({ viewport: vp, colorScheme: scheme });
            test.setTimeout(90_000);

            test("inset gutter from the viewport edge and the stage · --radius-card corners · own shadow", async ({ page }) => {
                await loadImage(page);
                await page.screenshot({ path: `${FRAMES}/${PHASE}-${vp.width}-${scheme}.png` });
                const m = await read(page);

                // Glass's own card, not a local copy. X.F.W14V.s2 (§0dd, adjacent
                // rule): INVERTED — the consumer Card wrap is gone, and the card is
                // glass's own detached aside (O-75, `layout="detached"`); the
                // geometry below is RE-POINTED from the wrap to that aside.
                expect(m.card, "no consumer Card wrap").toBe(false);
                expect(m.detached, "the Configurator is detached").toBe(true);
                // Gutter from the viewport edge, and inside the Configurator's edge.
                expect(m.aside.l).toBeGreaterThan(0);
                expect(m.vw - m.aside.r).toBeGreaterThanOrEqual(m.vw - m.shell.r);
                // Gutter from the stage: beside it (two columns) or below it (one).
                const beside = m.aside.l >= m.stage.r - 0.5;
                const gap = beside ? m.aside.l - m.stage.r : m.aside.t - m.stage.b;
                expect(gap).toBeGreaterThan(0);
                // All four corners at the producer's card radius.
                expect(m.radiusCard).toBeGreaterThan(0);
                for (const r of m.asideRadii) expect(Math.abs(r - m.radiusCard)).toBeLessThanOrEqual(0.5);
                // Its own shadow.
                expect(m.asideShadow).not.toBe("none");
            });
        });
    }

    test.describe(`G-s — OA-59 the 390 mobile sheet keeps its own form, inside the viewport (${scheme})`, () => {
        test.use({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
        test.setTimeout(90_000);

        test("the sheet is a plain column within the shell and the viewport", async ({ page }) => {
            await loadImage(page);
            await page.screenshot({ path: `${FRAMES}/${PHASE}-390-${scheme}.png` });
            const m = await read(page);

            // Its own form: the sheet, not the desktop card.
            expect(m.card).toBe(false);
            expect(m.shadow).toBe("none");
            // Never past the viewport or the shell edge.
            expect(m.pane.l).toBeGreaterThan(0);
            expect(m.vw - m.pane.r).toBeGreaterThan(0);
            expect(m.pane.r).toBeLessThanOrEqual(m.shell.r);
        });
    });
}
