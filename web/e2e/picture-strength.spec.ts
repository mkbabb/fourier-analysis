import { expect, test, type Page } from "@playwright/test";
import { seededViz } from "./fixtures/seed";
import { slider } from "./fixtures/slider";

/**
 * FORTY-SIXTH D (owner, 23 Nov: "we should be able to tune the background
 * layer's transparency"). The picture under a drawing had one strength, a
 * 22 % wash with no control and no key. It is the first row of the stage
 * dock's More now: 5 to 100 %, written to the URL as `wash` once the hand lets
 * go (a replace: Back never walks through a drag), carried by a reload, and a
 * drag on a hidden picture shows it. In dark the wash keys by contrast with
 * the stage's ground, so 22 % reads there as it does on the cream stage (it
 * stood a fifth as far off the dark ground as off the cream one).
 */

/** The stage canvas's summed ink (alpha), a measure of what is drawn on it. */
async function ink(page: Page): Promise<number> {
    return page.evaluate(() => {
        const c = document.querySelector<HTMLCanvasElement>(".canvas-stage > .canvas-container canvas");
        const ctx = c?.getContext("2d");
        if (!c || !ctx || !c.width || !c.height) return 0;
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let sum = 0;
        for (let i = 3; i < d.length; i += 4) sum += d[i]!;
        return sum / 255;
    });
}

/** A paused drawing with its line and no circles, so only the picture can change. */
async function openStill(page: Page, query: string): Promise<void> {
    const { image_slug } = seededViz();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/w/${image_slug}?t=0.5&circles=0${query}`);
    await expect(page.locator(".animation-dock").getByRole("button", { name: /Play animation|Pause animation/ })).toBeEnabled({ timeout: 60_000 });
    // The drawing has landed when the timeline holds the link's moment.
    await expect(slider(page, "Timeline")).toHaveAttribute("aria-valuenow", "0.5", { timeout: 60_000 });
    await page.waitForTimeout(1200);
}

async function openMore(page: Page) {
    await page.locator(".animation-dock").getByRole("button", { name: "More", exact: true }).click();
    const row = slider(page, "Picture strength");
    await expect(row).toBeAttached();
    // The menu grows in; a press measured mid-growth lands outside it.
    await page.getByRole("menu").evaluate((m) => Promise.all(m.getAnimations({ subtree: true }).map((a) => a.finished)));
    return row;
}

test("the strength row tunes the wash, writes wash once, and a reload keeps it", async ({ page }) => {
    await openStill(page, "");
    const at22 = await ink(page);
    const entries = await page.evaluate(() => history.length);

    const row = await openMore(page);
    await expect(row).toHaveAttribute("aria-valuenow", "22");
    await expect(row).toHaveAttribute("aria-valuetext", "22 percent");
    await row.focus();
    for (let i = 0; i < 23; i++) await row.press("ArrowRight");
    await expect(row).toHaveAttribute("aria-valuenow", "45");
    await expect(page).toHaveURL(/[?&]wash=45(&|$)/);
    expect(await page.evaluate(() => history.length), "tuning writes no history entry").toBe(entries);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    const at45 = await ink(page);
    expect(at45, `the picture's share rose (22 %: ${at22.toFixed(0)}, 45 %: ${at45.toFixed(0)})`).toBeGreaterThan(at22 * 1.3);

    // Page Up and Page Down step ten; Home and End reach the bounds.
    const again = await openMore(page);
    await again.focus();
    await again.press("PageUp");
    await expect(again).toHaveAttribute("aria-valuenow", "55");
    await again.press("Home");
    await expect(again).toHaveAttribute("aria-valuenow", "5");
    await again.press("End");
    await expect(again).toHaveAttribute("aria-valuenow", "100");
    await again.press("PageDown");
    await expect(again).toHaveAttribute("aria-valuenow", "90");
    await expect(page).toHaveURL(/[?&]wash=90(&|$)/);
    await page.keyboard.press("Escape");

    await page.reload();
    await expect(page.locator(".animation-dock").getByRole("button", { name: /Play animation|Pause animation/ })).toBeEnabled({ timeout: 60_000 });
    await expect(page).toHaveURL(/[?&]wash=90(&|$)/);
    const reopened = await openMore(page);
    await expect(reopened).toHaveAttribute("aria-valuenow", "90");
});

test("a drag on a hidden picture shows it, written once as the hand lets go", async ({ page }) => {
    await openStill(page, "&bg=0");
    const hidden = await ink(page);
    const entries = await page.evaluate(() => history.length);
    const row = await openMore(page);
    const track = page.locator("[data-strength] .strength-slider");
    const box = (await track.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.18, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.4, y, { steps: 6 });
    await page.mouse.move(box.x + box.width * 0.6, y, { steps: 6 });
    await page.mouse.up();
    const value = Number(await row.getAttribute("aria-valuenow"));
    expect(value, "the drag moved the strength").toBeGreaterThan(40);
    await expect(page).toHaveURL(new RegExp(`[?&]wash=${value}(&|$)`));
    expect(new URL(page.url()).searchParams.get("bg"), "the picture is shown").toBeNull();
    expect(await page.evaluate(() => history.length), "no history entry for a tuning").toBe(entries);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    expect(await ink(page), "the picture is on the stage").toBeGreaterThan(hidden * 1.3);
});

/**
 * How far the picture at the default wash stands off the stage, in lightness
 * levels: the 90th percentile of the change it makes to the pixels it changes
 * at all (its features, not its average), the stage read with the picture and
 * without it, the line kept in both.
 */
async function standing(page: Page): Promise<number> {
    await openStill(page, "&bg=0");
    const stage = page.locator(".canvas-stage");
    const shot = async () => stage.screenshot({ animations: "disabled" });
    const bare = await shot();
    await page.locator(".animation-dock").getByRole("button", { name: "Picture", exact: true }).click();
    await page.waitForTimeout(900);
    const washed = await shot();
    return page.evaluate(
        async ([a, b]) => {
            const load = async (b64: string) => {
                const img = new Image();
                img.src = `data:image/png;base64,${b64}`;
                await img.decode();
                const c = document.createElement("canvas");
                c.width = img.width;
                c.height = img.height;
                const ctx = c.getContext("2d")!;
                ctx.drawImage(img, 0, 0);
                return ctx.getImageData(0, 0, c.width, c.height).data;
            };
            const [p, q] = await Promise.all([load(a), load(b)]);
            const lum = (d: Uint8ClampedArray, i: number) => 0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!;
            const changed: number[] = [];
            for (let i = 0; i < p.length; i += 4) {
                const dl = Math.abs(lum(p, i) - lum(q, i));
                if (dl > 0.5) changed.push(dl);
            }
            changed.sort((x, y) => x - y);
            return changed[Math.floor(changed.length * 0.9)] ?? 0;
        },
        [bare.toString("base64"), washed.toString("base64")] as const,
    );
}

test("in dark the default wash reads against the stage's ground as it does in light", async ({ page }) => {
    // The drawing hidden by its own switches is a whole picture, not a wash:
    // keep the line, and read the stage with the picture and without it.
    await page.emulateMedia({ colorScheme: "light" });
    const light = await standing(page);
    await page.emulateMedia({ colorScheme: "dark" });
    const dark = await standing(page);
    expect(light, "in light the picture stands off the cream stage").toBeGreaterThan(20);
    expect(dark, `in dark the 22 % wash stands ${dark.toFixed(1)} levels off the ground, against ${light.toFixed(1)} in light`).toBeGreaterThanOrEqual(0.5 * light);
});

/*
 * The row is the site's one slider form (CONVERGE amendment 1, STUDY 8 check
 * 7): glass's scrubber with no thumb of its own, the fill's rounded end the
 * handle, the fill the accent. It was glass's default `lg` slider: a 28 px
 * disc, black on light and white on dark, on a fill that read grey in dark.
 */
for (const scheme of ["light", "dark"] as const) {
    test(`the strength row's fill is the accent and its end the handle (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await openStill(page, "");
        const thumb = await openMore(page);
        const paint = await thumb.evaluate((el) => {
            const root = el.closest(".glass-slider")!;
            const range = root.querySelector<HTMLElement>(".slider-range")!;
            const track = root.querySelector<HTMLElement>(".slider-track")!;
            // Every colour as straight RGBA through one canvas, whatever its notation.
            const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
            const rgba = (css: string) => {
                ctx.clearRect(0, 0, 1, 1);
                ctx.fillStyle = css;
                ctx.fillRect(0, 0, 1, 1);
                return [...ctx.getImageData(0, 0, 1, 1).data];
            };
            const accent = document.createElement("span");
            accent.style.color = "var(--viz-amber)";
            root.appendChild(accent);
            const amber = rgba(getComputedStyle(accent).color);
            accent.remove();
            return {
                amber,
                fill: rgba(getComputedStyle(range).backgroundColor),
                thumb: rgba(getComputedStyle(el).backgroundColor),
                thumbBlock: el.getBoundingClientRect().height,
                trackBlock: track.getBoundingClientRect().height,
            };
        });
        const near = (a: number[], b: number[]) => Math.max(...[0, 1, 2].map((k) => Math.abs(a[k]! - b[k]!)));
        expect(near(paint.fill, paint.amber), `the fill (${paint.fill}) is the site's amber (${paint.amber})`).toBeLessThanOrEqual(4);
        expect(paint.fill[3], "and stands at glass's strength").toBeGreaterThan(200);
        expect(near(paint.thumb, paint.fill), `the thumb (${paint.thumb}) wears the fill's colour, so the fill's end is the handle`).toBeLessThanOrEqual(4);
        expect(paint.thumbBlock, "no thumb stands taller than the bar").toBeLessThanOrEqual(paint.trackBlock + 0.5);
    });
}
