import { expect, test, type Page } from "@playwright/test";
import * as path from "node:path";

/**
 * X.F.W14.g — gate G-g, OA-43 (owner, 2026-09-23, frame
 * `fourier/evidence/W14/owner-2026-09-23-grayed.png`, light theme, image mode):
 * "why is the controls items, these sidebars and elements, so gray and grayed
 * out?"
 *
 * Measured in the frame's state (an image loaded on `/w/…`), in both themes, at
 * 1440 and 390:
 *  1. every ancestor of every sidebar control computes `opacity: 1`, carries no
 *     `filter` (and no `grayscale()` / `saturate(<1)` in its backdrop filter),
 *     and is not `inert`;
 *  2. the sidebar's painted surface (every background from the root down to the
 *     controls column, composited) is glass's surface token for a panel,
 *     `--card`, within ΔE_OK ≤ 0.02, and equals the other pane's surface (the
 *     stage's card) within the same bound;
 *  3. every piece of ink in the sidebar clears WCAG AA against what it sits on.
 *
 * Colours are resolved by the browser (a 1×1 canvas reads any CSS colour back
 * as sRGB), so the figures are the ones that paint, never a copied value.
 */

const TEST_IMAGE = path.resolve(import.meta.dirname, "../../assets/animals/golden-retriever.webp");
const PHASE = process.env.FW14_PHASE ?? "after";

async function loadImage(page: Page): Promise<void> {
    await page.goto("/visualize");
    await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("image-file-input").setInputFiles(TEST_IMAGE);
    await page.waitForURL(/\/w\//, { timeout: 20_000 });
    // X.F.W14V.u4 — UIA-F-74: below lg a finished upload brings the canvas to
    // the front; this setup reads the Controls sheet, so it selects that tab.
    if (page.viewportSize()!.width < 1024) {
        await expect(page.locator(".canvas-stage")).not.toHaveClass(/panel-inactive/, { timeout: 60_000 });
        await page.getByRole("tab", { name: "Controls" }).click();
    }
    // The frame's state: the sidebar is in (at 390 the Controls tab selected
    // above, the stage behind it).
    await expect(page.locator(".viz-panel-left-wrap")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: /Replace image/ })).toBeVisible({ timeout: 30_000 });
    // The sidebar arrives on the glass panel spring; read it once every
    // time-based animation in it has finished (scroll-driven timelines — the
    // fading scroll-port's feather — are positions, not motion, and never end).
    await settled(page);
}

async function settled(page: Page): Promise<void> {
    await page.waitForFunction(() => {
        const w = document.querySelector(".viz-panel-left-wrap");
        return (
            !!w &&
            w
                .getAnimations({ subtree: true })
                .every(
                    (a) =>
                        a.playState !== "running" ||
                        !(a.timeline instanceof DocumentTimeline) ||
                        a.effect?.getTiming().iterations === Infinity,
                )
        );
    });
}

interface Reading {
    veils: string[];
    surface: number[];
    card: number[];
    stage: number[];
    ink: { text: string; ratio: number; floor: number }[];
}

/** One in-page read of the three limbs. Colours come back as sRGB 0–255 + alpha 0–1. */
function measure(page: Page): Promise<Reading> {
    return page.evaluate(() => {
        const cv = document.createElement("canvas");
        cv.width = cv.height = 1;
        const cx = cv.getContext("2d", { willReadFrequently: true })!;
        const rgba = (css: string): number[] => {
            cx.clearRect(0, 0, 1, 1);
            cx.fillStyle = "#000";
            cx.fillStyle = css;
            cx.fillRect(0, 0, 1, 1);
            const d = cx.getImageData(0, 0, 1, 1).data;
            return [d[0], d[1], d[2], d[3] / 255];
        };
        const over = (top: number[], under: number[]): number[] => {
            const a = top[3] + under[3] * (1 - top[3]);
            if (a === 0) return [0, 0, 0, 0];
            return [0, 1, 2].map((i) => (top[i] * top[3] + under[i] * under[3] * (1 - top[3])) / a).concat(a);
        };
        /** Every background from the root down to `el`, composited (an opaque one resets the stack). */
        const painted = (el: Element): number[] => {
            const chain: Element[] = [];
            for (let e: Element | null = el; e; e = e.parentElement) chain.unshift(e);
            let acc = [255, 255, 255, 1];
            for (const e of chain) acc = over(rgba(getComputedStyle(e).backgroundColor), acc);
            return acc;
        };
        /** A token resolved as the page paints it, in the active theme. */
        const token = (name: string): number[] => {
            const probe = document.createElement("div");
            probe.style.background = `var(${name})`;
            document.querySelector(".viz-panel-left-wrap")!.appendChild(probe);
            const c = rgba(getComputedStyle(probe).backgroundColor);
            probe.remove();
            return c;
        };

        const side = document.querySelector(".viz-panel-left-wrap")!;
        const controls = [
            ...side.querySelectorAll<HTMLElement>(
                "button, input:not([type=file]), [role=slider], [role=spinbutton], [role=button], [role=radio], [role=switch]",
            ),
        ].filter((c) => c.getBoundingClientRect().width > 0);
        const veils = new Set<string>();
        for (const c of controls)
            for (let e: Element | null = c; e; e = e.parentElement) {
                const s = getComputedStyle(e);
                const name = `${e.tagName.toLowerCase()}.${String(e.className).split(/\s+/).slice(0, 2).join(".")}`;
                if (s.opacity !== "1") veils.add(`${name} opacity ${s.opacity}`);
                if (s.filter !== "none") veils.add(`${name} filter ${s.filter}`);
                const bf = s.backdropFilter;
                if (/grayscale\(/.test(bf) || [...bf.matchAll(/saturate\(([\d.]+)\)/g)].some((m) => +m[1] < 1))
                    veils.add(`${name} backdrop-filter ${bf}`);
                if ((e as HTMLElement).inert) veils.add(`${name} inert`);
            }

        const lum = (c: number[]): number => {
            const [r, g, b] = c.slice(0, 3).map((v) => {
                const x = v / 255;
                return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const ink: Reading["ink"] = [];
        const walker = document.createTreeWalker(side, NodeFilter.SHOW_TEXT);
        const seen = new Set<Element>();
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const el = n.parentElement;
            if (!el || seen.has(el) || !n.textContent?.trim()) continue;
            seen.add(el);
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            if (r.width <= 1 || r.height <= 1 || s.visibility !== "visible" || el.closest("[aria-hidden=true]")) continue;
            const bg = painted(el);
            const fg = over(rgba(s.color), bg);
            const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
            const size = parseFloat(s.fontSize);
            const large = size >= 24 || (size >= 18.66 && +s.fontWeight >= 700);
            ink.push({
                text: n.textContent.trim().slice(0, 32),
                ratio: Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100,
                floor: large ? 3 : 4.5,
            });
        }

        return {
            veils: [...veils],
            surface: painted(side.querySelector(".viz-panel-left") ?? side),
            card: token("--card"),
            stage: painted(document.querySelector(".canvas-stage canvas.canvas-el") ?? document.body),
            ink,
        };
    });
}

/** ΔE in OKLab (Björn Ottosson's matrices), sRGB 0–255 in. */
function deltaEOK(a: number[], b: number[]): number {
    const lab = (c: number[]) => {
        const [r, g, bl] = c.slice(0, 3).map((v) => {
            const x = v / 255;
            return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        });
        const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bl);
        const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bl);
        const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bl);
        return [
            0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
        ];
    };
    const [x, y] = [lab(a), lab(b)];
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

const VIEWPORTS = [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
] as const;

for (const scheme of ["light", "dark"] as const) {
    for (const vp of VIEWPORTS) {
        test.describe(`G-g — OA-43 the image-mode sidebar is live, not veiled (${vp.width} ${scheme})`, () => {
            test.use({ viewport: vp, colorScheme: scheme });
            test.setTimeout(90_000);

            test("no veil on any ancestor · surface = --card = the stage's · ink AA", async ({ page }) => {
                await loadImage(page);
                await page.screenshot({ path: `e2e/screenshots/f-w14/${PHASE}-veil-${vp.width}-${scheme}.png` });
                // Every layer open, so every control the sidebar holds is live and
                // measured (a closed disclosure's region is `inert` by design — it
                // is not a veil on a live control).
                const triggers = page.locator('.viz-panel-left-wrap [data-slot="configurator-layer-trigger"]');
                for (let i = 0; i < (await triggers.count()); i++) {
                    const t = triggers.nth(i);
                    if ((await t.getAttribute("aria-expanded")) === "false") await t.click();
                    await expect(t).toHaveAttribute("aria-expanded", "true");
                }
                await settled(page);
                const r = await measure(page);
                const fmt = (c: number[]) => `rgba(${c.map((v) => Math.round(v * 1000) / 1000).join(", ")})`;
                console.log(
                    `[G-g ${vp.width} ${scheme}] veils=${r.veils.length} surface=${fmt(r.surface)} card=${fmt(r.card)} ` +
                        `stage=${fmt(r.stage)} ΔE(surface,card)=${deltaEOK(r.surface, r.card).toFixed(4)} ` +
                        `ΔE(surface,stage)=${deltaEOK(r.surface, r.stage).toFixed(4)} ink=${r.ink.length} ` +
                        `min=${Math.min(...r.ink.map((i) => i.ratio))}`,
                );

                expect.soft(r.veils, "ancestors with opacity<1 / a filter / a desaturating backdrop / inert").toEqual([]);
                expect.soft(r.surface[3], "the sidebar surface is opaque").toBe(1);
                expect.soft(deltaEOK(r.surface, r.card), "ΔE_OK(sidebar surface, --card)").toBeLessThanOrEqual(0.02);
                expect.soft(deltaEOK(r.surface, r.stage), "ΔE_OK(sidebar surface, the stage pane)").toBeLessThanOrEqual(0.02);
                expect.soft(r.ink.length, "ink was read").toBeGreaterThan(5);
                expect.soft(
                    r.ink.filter((i) => i.ratio < i.floor).map((i) => `${i.text} ${i.ratio}<${i.floor}`),
                    "ink below WCAG AA",
                ).toEqual([]);
            });
        });
    }
}
