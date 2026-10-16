// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";

/**
 * X.F.W14V `.pd` — the playback dock's floating readout (F-W14V.md addendum
 * (f); COHESION §0dx). The owner, on a dark frame of `/visualize`'s collapsed
 * animation dock: "this dock is still wrong and has floating elements" — the
 * speed readout "1" and its "×" sit on the canvas, off the pill.
 *
 * FALSIFIER (the bar): every painted element of the dock lies inside the one
 * glass surface (`.dock-plate`) at both postures, at 1440 / 1024 / 390, light
 * and dark. Skipped: the inactive layer (visibility hidden, inert), and the
 * timeline caret, which is its own `glass-floating` surface shown only while
 * the timeline is hovered, focused or scrubbed.
 *
 * ROOT (measured at glass 10.1.0): glass pins the collapsed summary layer to a
 * square — `.glass-dock .dock-layer--summary { min-width; block-size: 40px;
 * aspect-ratio: 1 }` (`dock/styles/morph.css`). Its inline size resolves to
 * 40px from the block size, and the explicit `min-width` switches off the
 * content-based minimum, so a summary wider than one glyph overflows the square;
 * the root, and with it the plate, is sized from the 40px layer. The consumer
 * half measured clean: with only that producer rule content-sized, every cell
 * is contained and no consumer byte changes. So the collapsed cells are
 * honest-RED DOCK-SUMMARY-SQUARE (O-84, folding into O-65
 * DOCK-COLLAPSED-FORM) until glass ships the cure; no consumer override.
 *
 * `FW14V_PD_GLASS_CURE=1` injects the proposed producer rule (the summary
 * content-sized) into the page, to show the falsifier turns GREEN under the
 * glass cure and under nothing else. It is a proof harness, never product.
 *
 * Served from :3100 (BASE_URL) against the API on :8000; data = the e2e
 * global seed. `FW14V_PHASE` names the frames (before/after).
 */

const PHASE = process.env.FW14V_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14v/pd";
const GLASS_CURE = process.env.FW14V_PD_GLASS_CURE === "1";

async function openDock(page: Page, mobile: boolean): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    if (mobile) await page.getByRole("tab", { name: "Canvas" }).click();
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 60_000 });
    if (GLASS_CURE)
        await page.addStyleTag({
            content: ".glass-dock .dock-layer--summary { aspect-ratio: auto; inline-size: max-content; }",
        });
}

async function settle(page: Page): Promise<void> {
    await expect
        .poll(() => page.locator(".animation-dock").evaluate((d) => !d.hasAttribute("data-morphing")), { timeout: 10_000 })
        .toBe(true);
    await page.waitForTimeout(300);
}

/** Every painted element of the dock that falls outside its glass surface. */
function outside(page: Page) {
    return page.locator(".animation-dock").evaluate((dock) => {
        const s = dock.querySelector(".dock-plate")!.getBoundingClientRect();
        const out: string[] = [];
        for (const el of dock.querySelectorAll("*")) {
            if (el.closest(".dock-plate, .timeline-caret, [inert], .dock-layer:not(.is-active)")) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === "hidden" || cs.display === "contents") continue;
            const r = el.getBoundingClientRect();
            if (!r.width && !r.height) continue;
            if (r.left < s.left - 0.5 || r.right > s.right + 0.5 || r.top < s.top - 0.5 || r.bottom > s.bottom + 0.5) {
                const cls = String((el.className as unknown as SVGAnimatedString).baseVal ?? el.className);
                out.push(`${el.tagName.toLowerCase()}.${cls.split(" ").pop()} [${[r.left, r.right].map(Math.round)}] vs plate [${[s.left, s.right].map(Math.round)}]`);
            }
        }
        return out;
    });
}

async function shoot(page: Page, name: string): Promise<void> {
    const box = (await page.locator(".animation-dock").boundingBox())!;
    const vw = page.viewportSize()!.width;
    const x = Math.max(0, box.x - 40);
    await page.screenshot({
        path: `${FRAMES}/${PHASE}-${name}.png`,
        clip: { x, y: box.y - 24, width: Math.min(vw - x, box.width + 160), height: box.height + 48 },
    });
}

const CASES = [
    { width: 1440, height: 900 },
    { width: 1024, height: 900 },
    { width: 390, height: 844 },
];

for (const c of CASES) {
    for (const scheme of ["light", "dark"] as const) {
        const mobile = c.width < 500;
        test.describe(`F.W14V.pd — the playback dock is one glass surface (${c.width} ${scheme})`, () => {
            test.use({
                viewport: { width: c.width, height: c.height },
                colorScheme: scheme,
                ...(mobile ? { isMobile: true, hasTouch: true } : {}),
            });
            test.setTimeout(120_000);

            test("collapsed: every element inside the plate", async ({ page }) => {
                await openDock(page, mobile);
                if (!mobile) await page.mouse.move(2, 2);
                await expect(page.locator(".animation-dock")).toHaveClass(/\bcollapsed\b/, { timeout: 15_000 });
                await settle(page);
                await shoot(page, `collapsed-${c.width}-${scheme}`);
                expect(await outside(page), "collapsed: elements outside the glass surface (DOCK-SUMMARY-SQUARE while any)").toEqual([]);
            });

            test("expanded: every element inside the plate", async ({ page }) => {
                await openDock(page, mobile);
                const dock = page.locator(".animation-dock");
                if (mobile) {
                    await expect(dock).toHaveClass(/\bcollapsed\b/, { timeout: 15_000 });
                    await dock.getByRole("button", { name: "Expand dock" }).tap();
                } else {
                    await page.getByRole("button", { name: /(Play|Pause) animation/ }).first().hover();
                }
                await expect(dock).toHaveClass(/\bexpanded\b/, { timeout: 10_000 });
                await settle(page);
                // The pointer leaves the timeline, so its caret (its own surface) is at rest.
                if (!mobile) await page.getByRole("button", { name: /(Play|Pause) animation/ }).first().hover();
                await shoot(page, `expanded-${c.width}-${scheme}`);
                expect(await outside(page), "expanded: elements outside the glass surface").toEqual([]);
            });
        });
    }
}
