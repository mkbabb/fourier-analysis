import * as fs from "node:fs";
import * as path from "node:path";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { showViewIfTabbed } from "./fixtures/workspace";

/**
 * FORTY-SIXTH H (FORTY-NINTH: "the background image is far too zoomed in"; his
 * frame, dark, 239 of 401 circles, playing: only a blur of fur behind the
 * outline). The stage fitted the outline's own box, so a picture larger than
 * its outline was magnified past the stage and cropped. The picture is now
 * shown whole and registered to the outline: the same scale and place as the
 * contour it was traced from.
 *
 * Measured on photographs whose subject is off-centre and not square (the
 * giraffe: 1024x576 at the extraction's size, its outline 48 % of the width,
 * left of centre; the cat: 768x1024, upright, its outline against the left
 * edge and short of the right), traced at the web's defaults (200 harmonics:
 * 401 circles), at a desk and on a phone, light and dark:
 *  · playing from t = 0.6 (about 240 of the 401 circles, as in his frame) with
 *    only the picture shown, its painted box lies inside the stage with room
 *    on every side, at the picture's own aspect: whole, never cropped;
 *  · with the line drawn over it in full (`t=1`), the line's box stands in that
 *    box where the contour's `image_bounds` say it was traced;
 *  · playing on from t = 0.6 with the line drawn, the line written so far
 *    stays inside that box.
 */

const PICTURES = [
    { name: "giraffe", file: "giraffe.webp", mimeType: "image/webp" },
    { name: "cat", file: "chef-2.jpeg", mimeType: "image/jpeg" },
] as const;
/** The web's contour defaults (`lib/defaults.ts`), so the page's own job is answered from the extraction cache. */
const DEFAULTS = {
    strategy: "auto", resize: 1024, blur_sigma: 0.5, n_harmonics: 200, n_points: 1024, n_classes: 3,
    min_contour_length: 40, min_contour_area: 0.001, max_contours: 24, smooth_contours: 0.03,
    ml_threshold: 0.5, ml_detail_threshold: 0.3,
};

interface Traced {
    slug: string;
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    outline: { minX: number; maxX: number; minY: number; maxY: number };
}

async function traced(api: APIRequestContext, picture: (typeof PICTURES)[number]): Promise<Traced> {
    const session = await api.post("/api/sessions");
    const { token } = (await session.json()) as { token: string };
    const headers = { "X-Session-Token": token };
    const image = await api.post("/api/images", {
        headers,
        multipart: {
            file: {
                name: picture.file,
                mimeType: picture.mimeType,
                buffer: fs.readFileSync(path.resolve(import.meta.dirname, "../../assets/animals", picture.file)),
            },
        },
    });
    expect(image.ok(), await image.text()).toBe(true);
    const { image_slug } = (await image.json()) as { image_slug: string };
    const res = await api.post(`/api/images/${image_slug}/extract-contour`, {
        headers,
        data: { contour_settings: DEFAULTS },
        timeout: 150_000,
    });
    expect(res.ok(), await res.text()).toBe(true);
    const c = (await res.json()) as { image_bounds: Traced["bounds"]; points: { x: number[]; y: number[] } };
    return {
        slug: image_slug,
        bounds: c.image_bounds,
        outline: {
            minX: Math.min(...c.points.x), maxX: Math.max(...c.points.x),
            minY: Math.min(...c.points.y), maxY: Math.max(...c.points.y),
        },
    };
}

interface Box { left: number; top: number; right: number; bottom: number; w: number; h: number }

/**
 * The stage canvas's painted box in CSS px: every pixel past `alpha`, or only
 * those in the line's hue (`coral`: red well over green and blue).
 */
async function paintedBox(page: Page, alpha: number, coral = false): Promise<Box & { cw: number; ch: number }> {
    return page.evaluate(
        ({ alpha, coral }) => {
            const c = document.querySelector<HTMLCanvasElement>(".canvas-stage > .canvas-container canvas")!;
            const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
            let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
            for (let y = 0; y < c.height; y++) {
                for (let x = 0; x < c.width; x++) {
                    const i = (y * c.width + x) * 4;
                    if (d[i + 3]! <= alpha) continue;
                    if (coral && !(d[i]! > d[i + 1]! + 60 && d[i]! > d[i + 2]! + 60)) continue;
                    if (x < left) left = x;
                    if (x > right) right = x;
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                }
            }
            const k = c.width / c.getBoundingClientRect().width;
            return {
                left: left / k, top: top / k, right: (right + 1) / k, bottom: (bottom + 1) / k,
                w: (right + 1 - left) / k, h: (bottom + 1 - top) / k,
                cw: c.width / k, ch: c.height / k,
            };
        },
        { alpha, coral },
    );
}

/** Open the drawing at `query` and wait for it to land and settle (its intro, the layers' fades). */
async function open(page: Page, slug: string, query: string): Promise<void> {
    await page.goto(`/w/${slug}${query}`);
    await showViewIfTabbed(page, "Canvas");
    await expect(page.getByRole("button", { name: /Play animation|Pause animation/ }).first()).toBeEnabled({ timeout: 150_000 });
    await page.waitForTimeout(1500);
}

/** Open the drawing paused at t = 0.6 and play on from there: most of its 401 circles turning. */
async function playFromMost(page: Page, slug: string, query: string, touch: boolean): Promise<void> {
    await open(page, slug, `?t=0.6${query}`);
    const play = page.locator(".animation-dock").getByRole("button", { name: "Play animation" });
    if (touch) await play.tap();
    else await play.click();
    await expect(page.locator(".animation-dock").getByRole("button", { name: "Pause animation" })).toBeVisible();
    await page.waitForTimeout(1500);
    const t = Number(await page.getByRole("slider", { name: "Timeline" }).getAttribute("aria-valuenow"));
    expect(t, "playing on past t = 0.6, at most of the circles").toBeGreaterThan(0.6);
}

const CELLS = [
    { name: "1440 dark", viewport: { width: 1440, height: 900 }, colorScheme: "dark" as const, phone: false },
    { name: "1440 light", viewport: { width: 1440, height: 900 }, colorScheme: "light" as const, phone: false },
    { name: "390 dark", viewport: { width: 390, height: 844 }, colorScheme: "dark" as const, phone: true },
    { name: "390 light", viewport: { width: 390, height: 844 }, colorScheme: "light" as const, phone: true },
];

for (const source of PICTURES) {
    let picture: Traced;

    test.describe(`H: the picture whole and registered to its outline (the ${source.name})`, () => {
        test.setTimeout(300_000);
        test.beforeAll(async ({ request }) => {
            picture = await traced(request, source);
        });

        for (const cell of CELLS) {
            test.describe(cell.name, () => {
                test.use({
                    viewport: cell.viewport,
                    colorScheme: cell.colorScheme,
                    deviceScaleFactor: 2,
                    ...(cell.phone ? { isMobile: true, hasTouch: true } : {}),
                });

                test(`${cell.name}: the picture is whole, and the outline lies on it where it was traced`, async ({ page }) => {
                    const ib = picture.bounds;
                    const iw = ib.maxX - ib.minX;
                    const ih = ib.maxY - ib.minY;

                    // The picture alone (no drawn layer), playing at most of its circles:
                    // drawn whole, unfeathered.
                    await playFromMost(page, picture.slug, "&line=0&circles=0", cell.phone);
                    const p = await paintedBox(page, 40);
                    expect(p.left, "room at the picture's left").toBeGreaterThanOrEqual(4);
                    expect(p.top, "room above the picture").toBeGreaterThanOrEqual(4);
                    expect(p.cw - p.right, "room at the picture's right").toBeGreaterThanOrEqual(4);
                    expect(p.ch - p.bottom, "room under the picture").toBeGreaterThanOrEqual(4);
                    expect(p.w / p.h, "the picture at its own aspect").toBeCloseTo(iw / ih, 1);

                    // The line in full over the faintest wash: its box where the contour says.
                    await open(page, picture.slug, "?t=1&circles=0&wash=5");
                    const o = await paintedBox(page, 100, true);
                    const o0 = picture.outline;
                    const want = {
                        left: p.left + ((o0.minX - ib.minX) / iw) * p.w,
                        right: p.left + ((o0.maxX - ib.minX) / iw) * p.w,
                        top: p.top + ((ib.maxY - o0.maxY) / ih) * p.h,
                        bottom: p.top + ((ib.maxY - o0.minY) / ih) * p.h,
                    };
                    const tol = 0.03 * p.w + 3;
                    for (const side of ["left", "right", "top", "bottom"] as const) {
                        expect(Math.abs(o[side] - want[side]), `the outline's ${side} on the picture (${o[side].toFixed(1)} vs ${want[side].toFixed(1)})`).toBeLessThanOrEqual(tol);
                    }

                    // Playing on from t = 0.6 (the circles' layer hidden, so only the line
                    // wears the hue): the line written so far stays on the picture, in the
                    // box the picture had alone.
                    await playFromMost(page, picture.slug, "&circles=0", cell.phone);
                    const line = await paintedBox(page, 160, true);
                    expect(line.w, "the line is written across most of the subject").toBeGreaterThan(0.3 * (o0.maxX - o0.minX) / iw * p.w);
                    expect(line.left).toBeGreaterThanOrEqual(p.left - 3);
                    expect(line.right).toBeLessThanOrEqual(p.right + 3);
                    expect(line.top).toBeGreaterThanOrEqual(p.top - 3);
                    expect(line.bottom).toBeLessThanOrEqual(p.bottom + 3);

                });
            });
        }
    });
}
