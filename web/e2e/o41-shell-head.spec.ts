import { expect, test, type APIResponse, type Page } from "@playwright/test";
import { openAppDock } from "./fixtures/app-dock";

/**
 * FORTY-FIRST B (19 Nov): the mark is redrawn as an actual epicycle or series
 * figure, in the manner of the other apps' marks, with the head the mark needs
 * (the touch icon, the share card, the theme colour). One drawing, from `scripts/precompute_mark.py`, on every
 * surface: the tab (SVG, 16 and 32 px PNG, ICO), the home-screen icon (180 px),
 * the share card (1200 x 630) and the app dock's folded seal (inline, in the
 * page's tokens). The seal is no longer the letter U+2131 set by whatever font
 * the device has.
 */

const TILE_LITERALS = new Set(["#fdf5ec", "#d73523", "#1c1917", "#352a22", "#eb7366", "#e9e6e2"]);

/** A PNG's pixel size, from its IHDR chunk. */
function pngSize(buf: Buffer): { w: number; h: number } {
    expect(buf.subarray(1, 4).toString("latin1"), "a PNG signature").toBe("PNG");
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/** An ICO's image sizes, from its directory (0 in a byte means 256). */
function icoSizes(buf: Buffer): number[] {
    expect(buf.readUInt16LE(2), "an icon resource").toBe(1);
    const n = buf.readUInt16LE(4);
    return Array.from({ length: n }, (_, i) => buf[6 + i * 16] || 256).sort((a, b) => a - b);
}

async function image(res: APIResponse, type: RegExp): Promise<Buffer> {
    expect(res.status(), `${res.url()} answers`).toBe(200);
    expect(res.headers()["content-type"] ?? "", `${res.url()} is an image`).toMatch(type);
    return res.body();
}

async function groundHex(page: Page): Promise<string> {
    return page.evaluate(() => {
        const c = getComputedStyle(document.querySelector(".app-shell")!).backgroundColor;
        const probe = document.createElement("canvas").getContext("2d")!;
        probe.fillStyle = c;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    });
}

async function themeColor(page: Page): Promise<string> {
    return (await page.locator('meta[name="theme-color"]').getAttribute("content")) ?? "";
}

test.describe("FORTY-FIRST B — the mark and the head", () => {
    test("the icons and the share card are served as images of the right size", async ({ request }) => {
        expect(pngSize(await image(await request.get("/favicon-32.png"), /image\/png/))).toEqual({ w: 32, h: 32 });
        expect(pngSize(await image(await request.get("/favicon-16.png"), /image\/png/))).toEqual({ w: 16, h: 16 });
        expect(pngSize(await image(await request.get("/apple-touch-icon.png"), /image\/png/))).toEqual({ w: 180, h: 180 });
        expect(pngSize(await image(await request.get("/og.png"), /image\/png/))).toEqual({ w: 1200, h: 630 });
        expect(icoSizes(await image(await request.get("/favicon.ico"), /image\/(x-icon|vnd\.microsoft\.icon)/))).toEqual([16, 32]);
    });

    test("favicon.svg is the flat mark: only the tiles' own colours, both themes, no gradient", async ({ request }) => {
        const res = await request.get("/favicon.svg");
        expect(res.status()).toBe(200);
        const svg = await res.text();
        const literals = new Set((svg.match(/#[0-9a-f]{6}\b/gi) ?? []).map((h) => h.toLowerCase()));
        expect([...literals].filter((h) => !TILE_LITERALS.has(h)), "no colour outside the two tiles").toEqual([]);
        expect(literals.has("#fdf5ec") && literals.has("#352a22"), "both tiles").toBe(true);
        expect(svg).toContain("prefers-color-scheme:dark");
        expect(svg).not.toMatch(/Gradient|filter|opacity/);
    });

    test("the head links the icons, names the share card and carries one theme colour", async ({ page }) => {
        await page.goto("/paper");
        const head = page.locator("head");
        for (const href of ["/favicon.ico", "/favicon.svg", "/favicon-32.png", "/favicon-16.png"]) {
            await expect(head.locator(`link[rel="icon"][href="${href}"]`)).toHaveCount(1);
        }
        await expect(head.locator('link[rel="apple-touch-icon"][href="/apple-touch-icon.png"]')).toHaveCount(1);
        await expect(head.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og\.png$/);
        await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
        await expect(head.locator('meta[name="theme-color"]')).toHaveCount(1);
    });

    test("the theme colour is the page's ground and follows the site's own toggle", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.emulateMedia({ colorScheme: "light" });
        await page.goto("/paper");
        await expect(page.locator(".app-dock")).toBeVisible({ timeout: 30_000 });
        await expect.poll(() => themeColor(page)).toBe(await groundHex(page));
        const light = await themeColor(page);
        const dock = await openAppDock(page);
        await dock.getByRole("button", { name: "Dark mode" }).click();
        await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);
        await expect.poll(() => themeColor(page), { timeout: 5_000 }).not.toBe(light);
        expect(await themeColor(page)).toBe(await groundHex(page));
    });

    for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
        test(`the folded seal draws the mark, not the letter, at ${vp.width}`, async ({ page }) => {
            await page.setViewportSize(vp);
            await page.goto("/equation");
            const dock = page.locator(".app-dock");
            await expect(dock).toHaveClass(/(^|\s)collapsed(\s|$)/, { timeout: 30_000 });
            const summary = dock.locator(".dock-layer--summary");
            await expect(summary.locator("svg[data-mark]")).toHaveCount(1);
            expect(await summary.textContent()).not.toContain("ℱ");
            // 0.74 of the plate's diameter, in the page's own Fourier red.
            const ratio = await dock.evaluate((d) => {
                const svg = d.querySelector(".dock-layer--summary svg[data-mark]")!.getBoundingClientRect();
                return svg.width / d.getBoundingClientRect().height;
            });
            expect(ratio).toBeGreaterThan(0.68);
            expect(ratio).toBeLessThan(0.8);
            const ring = await summary.locator("svg[data-mark] circle").first().evaluate((c) => getComputedStyle(c).stroke);
            const red = await page.evaluate(() => {
                const p = document.createElement("span");
                p.style.color = "var(--viz-fourier)";
                document.body.append(p);
                const v = getComputedStyle(p).color;
                p.remove();
                return v;
            });
            expect(ring).toBe(red);
        });
    }
});
