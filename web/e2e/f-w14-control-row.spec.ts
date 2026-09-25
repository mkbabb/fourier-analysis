import { expect, test, type Page } from "@playwright/test";
import * as fs from "node:fs";
import { SAMPLE_IMAGE } from "./fixtures/sample";

/**
 * X.F.W14.h — gate G-h, OA-45 (owner, 2026-09-23, frame
 * `fourier/evidence/W14/owner-2026-09-23-hierarchy.png`): "the design hierarchy
 * and spacing of these elements and sliders, likely on every page, too, is not
 * optimal and needs total reconfiguration".
 *
 * The frame's row took three lines: the label; the value field alone on a
 * right-aligned line; a thick bar with no visible thumb. The cure is ONE
 * control-row idiom (`ui/SliderControl.vue`, `[data-control-row]`): label and
 * value field on one line, the producer's Slider directly beneath it with a
 * visible thumb and a track fill.
 *
 * The census walks every page and mode that mounts a slider, reads every
 * `role="slider"` thumb in it, and for each one measures:
 *  1. it sits inside a `[data-control-row]` (the idiom, not a per-page shape);
 *  2. its label and its value field share one line (vertical overlap);
 *  3. the track lies beneath that line;
 *  4. the thumb is visible (a box ≥ 4 px wide, opacity > 0);
 *  5. the track shows a fill (a painted range, or a gradient on the track);
 *  6. the row's height is the idiom's measured height ± 4 px.
 * EquationPanel's "Terms" row (the /w stage overlay) is the same `SliderControl`
 * and is read by construction; the overlay did not open under the dock toggle in
 * this instrument (recorded in the F.W14.h receipt).
 * Only GlassTimeline's playhead is outside the census: it is a transport
 * scrubber (its caret carries the value), not a labelled parameter row, and is
 * named here so the exclusion is visible.
 *
 * Every page is also framed at 1440 and 390 (`FW14_PHASE` = before | after),
 * and the card titles / control-row rhythm are read against glass's type and
 * spacing scales.
 */
const PHASE = process.env.FW14_PHASE ?? "after";
const SHOTS = "e2e/screenshots/f-w14";
const VIEWPORTS = [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
] as const;

interface Row {
    where: string;
    name: string;
    onIdiom: boolean;
    oneLine: boolean;
    beneath: boolean;
    thumb: boolean;
    fill: boolean;
    height: number;
}

/** Reads every visible `role="slider"` thumb on the page (outside the timeline). */
async function census(page: Page, where: string): Promise<Row[]> {
    return page.evaluate((where) => {
        const out: Row[] = [];
        const thumbs = [...document.querySelectorAll<HTMLElement>('[role="slider"]')].filter(
            (t) => !t.closest(".timeline-slider") && t.getClientRects().length > 0,
        );
        for (const thumb of thumbs) {
            const idiom = thumb.closest<HTMLElement>("[data-control-row]");
            // BEFORE (no idiom): the row is the widest ancestor holding only this slider.
            let row = idiom;
            if (!row) {
                row = thumb;
                while (
                    row.parentElement &&
                    row.parentElement.querySelectorAll('[role="slider"]').length === 1 &&
                    row.parentElement.querySelectorAll('[role="spinbutton"]').length <= 1 &&
                    !row.parentElement.matches(".cartoon-card, [data-slot=card], [role=dialog], [data-slot=configurator-layer]")
                )
                    row = row.parentElement;
            }
            const root = thumb.closest<HTMLElement>(".glass-slider") ?? thumb.parentElement!;
            const track = root.querySelector<HTMLElement>(".slider-track") ?? root;
            const range = root.querySelector<HTMLElement>(".slider-range");
            const label =
                row.querySelector<HTMLElement>("[data-row-label]") ??
                [...row.querySelectorAll<HTMLElement>("label, span, h3")].find(
                    (e) => !e.closest('[role="spinbutton"], .glass-slider') && e.textContent!.trim().length > 0,
                ) ??
                null;
            const value = row.querySelector<HTMLElement>('[role="spinbutton"], [data-row-value]');
            const tr = track.getBoundingClientRect();
            const lr = label?.getBoundingClientRect();
            const vr = value?.getBoundingClientRect();
            const oneLine = !!lr && !!vr && vr.top < lr.bottom && lr.top < vr.bottom;
            const lineBottom = Math.max(lr?.bottom ?? 0, vr?.bottom ?? 0);
            const beneath = !!lr && tr.top >= lineBottom - 1;
            const th = thumb.getBoundingClientRect();
            const thumbCs = getComputedStyle(thumb);
            const thumbVisible = th.width >= 4 && Number(thumbCs.opacity) > 0;
            const trackBg = getComputedStyle(track).backgroundImage;
            const rangeCs = range ? getComputedStyle(range) : null;
            const rangePaints =
                !!range &&
                range.getBoundingClientRect().width > 0 &&
                (range.classList.contains("glass-liquid-fill") ||
                    (rangeCs!.backgroundColor !== "rgba(0, 0, 0, 0)" && rangeCs!.backgroundColor !== "transparent"));
            out.push({
                where,
                name: thumb.getAttribute("aria-label") ?? root.getAttribute("aria-label") ?? "?",
                onIdiom: !!idiom,
                oneLine,
                beneath,
                thumb: thumbVisible,
                fill: rangePaints || /gradient/.test(trackBg),
                height: Math.round(row.getBoundingClientRect().height * 10) / 10,
            });
        }
        return out;
    }, where) as Promise<Row[]>;
}

interface Scale {
    offType: string[];
    offSpace: string[];
}

/**
 * Page and card headings (h1–h3), card titles/subtitles and row labels read against glass's type scale; the
 * idiom's internal gap and the gap between consecutive rows read against its
 * spacing scale. Both scales are resolved by the browser from glass's own
 * tokens (a probe element per token), so no figure is copied.
 */
async function scale(page: Page): Promise<Scale> {
    return page.evaluate(() => {
        const probe = (prop: "fontSize" | "width", v: string): number => {
            const el = document.createElement("div");
            el.style.position = "absolute";
            el.style.visibility = "hidden";
            if (prop === "fontSize") el.style.fontSize = v;
            else el.style.width = v;
            document.body.append(el);
            const n = parseFloat(getComputedStyle(el)[prop]);
            el.remove();
            return n;
        };
        const types = ["micro", "caption", "small", "body", "prose", "subheading", "heading", "title", "display-1", "display-2"].map((t) =>
            probe("fontSize", `var(--type-${t})`),
        );
        const spaces = ["residue", "atom", "body", "family", "section", "page"].map((t) =>
            probe("width", `var(--space-${t})`),
        );
        spaces.push(0);
        const near = (n: number, set: number[]) => set.some((s) => Math.abs(s - n) <= 0.5);
        const visible = (e: Element) => e.getClientRects().length > 0;
        const offType: string[] = [];
        const titled = document.querySelectorAll<HTMLElement>(
            "h1, h2, h3, [data-card-title], [data-card-subtitle], [data-row-label], [data-row-sub]",
        );
        for (const e of titled) {
            if (!visible(e)) continue;
            const fs = parseFloat(getComputedStyle(e).fontSize);
            if (!near(fs, types)) offType.push(`${e.textContent!.trim().slice(0, 24)}=${fs}px`);
        }
        const offSpace: string[] = [];
        for (const r of document.querySelectorAll<HTMLElement>("[data-control-row]")) {
            if (!visible(r)) continue;
            const gap = parseFloat(getComputedStyle(r).rowGap);
            if (!near(gap, spaces)) offSpace.push(`row-gap ${r.textContent!.trim().slice(0, 16)}=${gap}`);
        }
        return { offType, offSpace };
    });
}

/** A slider by name, read on its root: the scrubber thumb is 0 px wide by contract (BEFORE). */
function sliderRoot(page: Page, name: string | RegExp) {
    return page.locator(".glass-slider").filter({ has: page.getByRole("slider", { name, includeHidden: true }) }).first();
}

/** The canvas docks rest collapsed; open every one so its controls are reachable. */
async function expandDocks(page: Page): Promise<void> {
    for (const b of await page.getByRole("button", { name: "Expand dock" }).all())
        if (await b.isVisible()) await b.click();
}

async function settle(page: Page): Promise<void> {
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForFunction(() =>
        document
            .getAnimations()
            .every(
                (a) =>
                    a.playState !== "running" ||
                    !(a.timeline instanceof DocumentTimeline) ||
                    a.effect?.getTiming().iterations === Infinity,
            ),
    );
}

const PAGES = [
    { name: "home", url: "/" },
    { name: "paper", url: "/paper" },
    { name: "gallery", url: "/gallery" },
    { name: "shape-extractor", url: "/demo/shape-extractor" },
    { name: "equation", url: "/equation" },
    { name: "morph", url: "/morph" },
] as const;

for (const vp of VIEWPORTS) {
    test.describe(`G-h control-row idiom @ ${vp.width}`, () => {
        test.use({ viewport: vp, colorScheme: "light" });

        test("every slider row on the one idiom · one height · type + spacing scales", async ({ page }) => {
            test.setTimeout(300_000);
            const rows: Row[] = [];
            const scales: Record<string, Scale> = {};
            const frame = (name: string) =>
                page.screenshot({ path: `${SHOTS}/${PHASE}-page-${name}-${vp.width}.png` });

            for (const p of PAGES) {
                await page.goto(p.url);
                await settle(page);
                if (p.name === "equation" || p.name === "morph")
                    // X.F.W14V.eq2: glass's Configurator renders its stage before the
                    // aside, so below lg the first slider in DOM is the stage's
                    // (hidden on the Controls tab); wait on a rendered one.
                    await expect(page.locator(".glass-slider:visible").first()).toBeVisible({ timeout: 30_000 });
                await frame(p.name);
                rows.push(...(await census(page, p.name)));
                scales[p.name] = await scale(page);
            }

            // Image mode (`/w`): basis + contour layers, Advanced open.
            await page.goto("/visualize");
            await expect(page.locator(".drop-target")).toBeVisible({ timeout: 60_000 });
            await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
            await page.waitForURL(/\/w\//, { timeout: 20_000 });
            // X.F.W14V.u4 — UIA-F-74: below lg the finished upload brings the
            // canvas to the front; the controls are read from the Controls tab.
            if (page.viewportSize()!.width < 1024) {
                await expect(page.locator(".canvas-stage")).not.toHaveClass(/panel-inactive/, { timeout: 60_000 });
                await page.getByRole("tab", { name: "Controls" }).click();
            }
            await expect(sliderRoot(page, "Harmonics")).toBeVisible({ timeout: 90_000 });
            await page.getByRole("button", { name: /^Contour/ }).first().click();
            await page.getByRole("button", { name: "Advanced" }).click();
            await expect(sliderRoot(page, "Smoothing")).toBeVisible({ timeout: 10_000 });
            await settle(page);
            await frame("image");
            rows.push(...(await census(page, "image")));
            scales.image = await scale(page);

            if (vp.width === 1440) {
                // Contour editing: the magnet popover on the editor dock.
                await page.getByRole("button", { name: "Edit contour" }).click();
                await expandDocks(page);
                // X.F.W14.u — UIA-F-12: the magnet popover opens on click (a
                // hover preview may not hold a state-changing slider).
                // X.F.W14U.vedit — UIA-F-88: the Magnet row is a section of the
                // editor dock's one menu (the 390 row kept Undo/Redo/Delete).
                await page.getByRole("button", { name: "More editor tools" }).click();
                await expect(sliderRoot(page, /Magnet/)).toBeVisible({ timeout: 10_000 });
                await settle(page);
                await frame("image-edit-magnet");
                rows.push(...(await census(page, "edit")).filter((r) => /Magnet/.test(r.name)));
            }

            fs.mkdirSync("test-results", { recursive: true });
            fs.writeFileSync(
                `test-results/f-w14-control-row-${PHASE}-${vp.width}.json`,
                JSON.stringify({ rows, scales }, null, 1),
            );
            console.log(`[G-h ${PHASE} ${vp.width}] ${rows.length} rows`);
            for (const r of rows)
                console.log(
                    `  ${r.where.padEnd(15)} ${r.name.padEnd(34)} idiom=${+r.onIdiom} line=${+r.oneLine} beneath=${+r.beneath} thumb=${+r.thumb} fill=${+r.fill} h=${r.height}`,
                );
            console.log(`  scales ${JSON.stringify(scales)}`);

            expect(rows.length).toBeGreaterThan(0);
            const off = rows.filter((r) => !(r.onIdiom && r.oneLine && r.beneath && r.thumb && r.fill));
            expect(off, "rows off the idiom").toEqual([]);
            const hs = rows.map((r) => r.height).sort((a, b) => a - b);
            const idiom = hs[Math.floor(hs.length / 2)];
            const tall = rows.filter((r) => Math.abs(r.height - idiom) > 4);
            expect(tall, `rows off the idiom height ${idiom}px ± 4`).toEqual([]);
            for (const [name, s] of Object.entries(scales)) {
                expect(s.offType, `${name}: off the type scale`).toEqual([]);
                expect(s.offSpace, `${name}: off the spacing scale`).toEqual([]);
            }
        });
    });
}
