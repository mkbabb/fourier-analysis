// SERVED MODEL: claude-opus-5-5
import { expect, test, type Locator, type Page } from "@playwright/test";
import { checkA11y } from "./a11y";
import { expectHardwareGpu } from "./fixtures/gpu";

/**
 * Owner order 2026-11-05: "fourier should have a dock collapse state, too".
 *
 * The app dock is `collapse="open"`: it is open on first paint at every
 * width, it yields to work (the pointer leaving it, a press on the page),
 * and collapsed it wears a seal, the current section's glyph (Compass off
 * the five). Nothing below the dock moves when it folds.
 *
 * U1 F-1  the seal is the full layer's section glyph, every section and a 404.
 * U2 F-2  the content below the dock does not move across the morph; the gate
 *         is shown to see a block-size mutant.
 * U3 F-3  an open dock surface (About, Sections, Log in) is not folded under
 *         the user: the pointer resting in it (a), or leaving straight to the
 *         page (b); a dismiss then lets the dock yield.
 * U4 F-4  the section name's fit is measured on the expanded run, never the
 *         collapsed circle: after a resize and a font load while collapsed,
 *         the expanded dock shows the name the run holds.
 * U5      disclosure, focus and axe, collapsed and expanded.
 * U8      a page left alone rests at the seal (no press, the pointer parked
 *         off the dock), and reopens through intermediate widths.
 * U7      frame-time baseline of the morph and six mid-morph frames, recorded
 *         only (`@gpu`, glass 10.1.3; a gate at the 10.2.0 repin).
 */

const SECTIONS = [
    { path: "/paper", icon: "file-text" },
    { path: "/w", icon: "eye" },
    { path: "/gallery", icon: "layout-grid" },
    { path: "/equation", icon: "sigma" },
    { path: "/morph", icon: "shuffle" },
    { path: "/no-such-page-1105", icon: "compass" },
] as const;

const COLLAPSED = /(^|\s)collapsed(\s|$)/;
const EXPANDED = /(^|\s)expanded(\s|$)/;

function appDock(page: Page): Locator {
    return page.locator(".app-dock");
}

async function settled(dock: Locator): Promise<void> {
    await expect(dock).not.toHaveAttribute("data-morphing", { timeout: 5_000 });
}

async function open(page: Page, path: string): Promise<Locator> {
    await page.goto(path);
    const dock = appDock(page);
    await expect(dock.locator(".dock-layer--full .nav-trigger")).toBeVisible({ timeout: 30_000 });
    await expect(dock).toHaveClass(EXPANDED);
    return dock;
}

/** A point in the header band beside the dock: outside the dock, outside the page's content. */
async function besideDock(dock: Locator): Promise<{ x: number; y: number }> {
    const b = (await dock.boundingBox())!;
    return { x: 3, y: b.y + b.height / 2 };
}

/** The fine-pointer path: the pointer enters the dock, then leaves it for the page; the idle window folds it. */
async function collapseByLeaving(page: Page, dock: Locator): Promise<void> {
    const b = (await dock.boundingBox())!;
    await page.mouse.move(b.x + 8, b.y + b.height / 2);
    await page.mouse.move(b.x + b.width / 2, b.y + b.height + 160, { steps: 4 });
    await expect(dock).toHaveClass(COLLAPSED, { timeout: 8_000 });
    await settled(dock);
}

/** The touch path: a tap on the page outside the dock folds it. */
async function collapseByTap(page: Page, dock: Locator): Promise<void> {
    const p = await besideDock(dock);
    await page.touchscreen.tap(p.x, p.y);
    await expect(dock).toHaveClass(COLLAPSED, { timeout: 8_000 });
    await settled(dock);
}

interface GlyphRead {
    full: { sig: string; svg: string; w: number; h: number } | null;
    seal: { sig: string; svg: string; w: number; h: number } | null;
    sealCount: number;
}

async function readGlyphs(dock: Locator): Promise<GlyphRead> {
    return dock.evaluate((d) => {
        const read = (el: Element | null) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            const sig = [...el.classList].filter((c) => c.startsWith("lucide-")).sort().join(" ");
            return { sig, svg: el.innerHTML, w: Math.round(r.width), h: Math.round(r.height) };
        };
        return {
            full: read(d.querySelector(".dock-layer--full .nav-trigger .nav-tab-icon")),
            seal: read(d.querySelector(".dock-layer--summary .nav-tab-icon")),
            sealCount: d.querySelectorAll(".dock-layer--summary .dock-summary-glyph").length,
        };
    });
}

// ── U1 · F-1: the seal is the current section's glyph ────────────────────────
const U1_CELLS = [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
    { width: 844, height: 390 },
];

async function sealEverySection(page: Page, collapse: (page: Page, dock: Locator) => Promise<void>, scheme: string) {
    for (const s of SECTIONS) {
        await test.step(s.path, async () => {
            const dock = await open(page, s.path);
            expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(scheme === "dark");
            const before = await readGlyphs(dock);
            expect(before.full?.sig, `the full layer's section glyph at ${s.path}`).toContain(`lucide-${s.icon}`);
            await collapse(page, dock);
            const summary = dock.locator(".dock-layer--summary");
            await expect(summary).toHaveClass(/is-active/);
            const after = await readGlyphs(dock);
            expect(after.sealCount, "one seal").toBe(1);
            expect(after.seal?.sig, `seal vs full glyph at ${s.path}`).toBe(before.full!.sig);
            expect(after.seal?.svg, `seal paths vs full glyph paths at ${s.path}`).toBe(before.full!.svg);
            expect({ w: after.seal!.w, h: after.seal!.h }, `seal box vs full glyph box at ${s.path}`).toEqual({
                w: before.full!.w,
                h: before.full!.h,
            });
        });
    }
}

for (const scheme of ["light", "dark"] as const) {
    for (const vp of U1_CELLS) {
        test.describe(`U1 F-1 seal ${vp.width}x${vp.height} ${scheme}`, () => {
            test.use({ viewport: vp, colorScheme: scheme });
            test("U1 the seal is the full layer's section glyph on every section and a 404", async ({ page }) => {
                test.setTimeout(120_000);
                await sealEverySection(page, collapseByLeaving, scheme);
            });
        });
    }
    for (const vp of [U1_CELLS[0], U1_CELLS[2]]) {
        test.describe(`U1 F-1 seal touch ${vp.width}x${vp.height} ${scheme}`, () => {
            test.use({ viewport: vp, colorScheme: scheme });
            test("@coarse U1 the seal is the full layer's section glyph on every section and a 404 (touch)", async ({ page }) => {
                test.setTimeout(120_000);
                await sealEverySection(page, collapseByTap, scheme);
            });
        });
    }
}

// ── U2 · F-2: nothing below the dock moves ────────────────────────────────────
/** Record, per animation frame, the header's block size and the top of the content below it. */
async function recordBelow(page: Page): Promise<void> {
    await page.evaluate(() => {
        const header = document.querySelector(".app-header")!;
        const below = header.nextElementSibling ?? document.querySelector("main")!;
        const w = window as unknown as { __f2: { h: number; top: number }[]; __f2stop: boolean };
        w.__f2 = [];
        w.__f2stop = false;
        const tick = () => {
            w.__f2.push({ h: header.getBoundingClientRect().height, top: below.getBoundingClientRect().top });
            if (!w.__f2stop) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}

async function stopBelow(page: Page): Promise<{ n: number; dh: number; dtop: number }> {
    return page.evaluate(() => {
        const w = window as unknown as { __f2: { h: number; top: number }[]; __f2stop: boolean };
        w.__f2stop = true;
        const s = w.__f2;
        const h0 = s[0].h;
        const t0 = s[0].top;
        return {
            n: s.length,
            dh: Math.max(...s.map((r) => Math.abs(r.h - h0))),
            dtop: Math.max(...s.map((r) => Math.abs(r.top - t0))),
        };
    });
}

async function morphRoundTrip(page: Page): Promise<{ n: number; dh: number; dtop: number }> {
    const dock = await open(page, "/gallery");
    await page.waitForTimeout(400);
    await recordBelow(page);
    await collapseByLeaving(page, dock);
    const b = (await dock.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await expect(dock).toHaveClass(EXPANDED);
    await settled(dock);
    await page.waitForTimeout(200);
    return stopBelow(page);
}

test.describe("U2 F-2 no reflow 844x390", () => {
    test.use({ viewport: { width: 844, height: 390 } });
    test("U2 the content below the dock holds still across collapse and expand", async ({ page }) => {
        const r = await morphRoundTrip(page);
        test.info().annotations.push({ type: "f2", description: JSON.stringify(r) });
        expect(r.n, "frames sampled").toBeGreaterThan(20);
        expect(r.dh, `header block size drift ${JSON.stringify(r)}`).toBeLessThanOrEqual(0.5);
        expect(r.dtop, `content top drift ${JSON.stringify(r)}`).toBeLessThanOrEqual(0.5);
    });
    test("U2 the gate sees a collapsed block-padding mutant", async ({ page }) => {
        await page.addInitScript(() => {
            document.addEventListener("DOMContentLoaded", () => {
                const s = document.createElement("style");
                s.textContent = ".app-dock.collapsed { --dock-padding-block: 1rem }";
                document.head.append(s);
            });
        });
        const r = await morphRoundTrip(page);
        test.info().annotations.push({ type: "f2-mutant", description: JSON.stringify(r) });
        expect(Math.max(r.dh, r.dtop), `the mutant moved the content ${JSON.stringify(r)}`).toBeGreaterThan(0.5);
    });
});

// ── U3 · F-3: an open surface is not folded under the user ───────────────────
const SURFACES = [
    { name: "About", trigger: /^About Fourier analysis$/, content: ".about-card" },
    { name: "Sections", trigger: /^Navigate/, content: "[role='menu']" },
    { name: "Log in", trigger: /^Log in$/, content: ".login-popover" },
] as const;

/** Past glass's idle window (3600 ms) and the morph. */
const IDLE = 4_600;

async function openSurface(page: Page, dock: Locator, s: (typeof SURFACES)[number], touch: boolean): Promise<Locator> {
    const trigger = dock.getByRole("button", { name: s.trigger });
    if (touch) await trigger.tap();
    else await trigger.click();
    const content = page.locator(s.content).first();
    await expect(content).toBeVisible();
    return content;
}

for (const s of SURFACES) {
    test.describe(`U3 F-3 ${s.name} 1440`, () => {
        test.use({ viewport: { width: 1440, height: 900 } });
        test(`U3 F-3a ${s.name}: the pointer resting in the open surface holds the dock`, async ({ page }) => {
            const dock = await open(page, "/gallery");
            const content = await openSurface(page, dock, s, false);
            const c = (await content.boundingBox())!;
            await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2, { steps: 4 });
            await page.waitForTimeout(IDLE);
            await expect(content).toBeVisible();
            await expect(dock).toHaveClass(EXPANDED);
        });
        test(`U3 F-3b ${s.name}: the pointer leaving straight to the page keeps the surface and the dock`, async ({ page }) => {
            const dock = await open(page, "/gallery");
            const content = await openSurface(page, dock, s, false);
            const b = (await dock.boundingBox())!;
            // Out of the dock, away from the surface (the surfaces open below the dock, start- or end-aligned).
            await page.mouse.move(b.x + b.width / 2, 860, { steps: 4 });
            await page.waitForTimeout(IDLE);
            await expect(content, "the open surface was closed under the user").toBeVisible();
            await expect(dock).toHaveClass(EXPANDED);
            // A press on the page dismisses it, and the dock then yields.
            const p = await besideDock(dock);
            await page.mouse.click(p.x, p.y);
            await expect(content).toBeHidden();
            await expect(dock).toHaveClass(COLLAPSED, { timeout: IDLE });
        });
    });
    test.describe(`U3 F-3 ${s.name} touch 390`, () => {
        test.use({ viewport: { width: 390, height: 844 } });
        test(`@coarse U3 F-3 ${s.name}: an open surface outlasts the idle window and a tap outside lets the dock yield`, async ({ page }) => {
            const dock = await open(page, "/gallery");
            const content = await openSurface(page, dock, s, true);
            await page.waitForTimeout(IDLE);
            await expect(content).toBeVisible();
            await expect(dock).toHaveClass(EXPANDED);
            const p = await besideDock(dock);
            await page.touchscreen.tap(p.x, p.y);
            await expect(content).toBeHidden();
            await expect(dock).toHaveClass(COLLAPSED, { timeout: IDLE });
        });
    });
}

test.describe("U3 F-3 Sections select 1440", () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test("U3 F-3a Sections: a row chosen from the open menu navigates", async ({ page }) => {
        const dock = await open(page, "/gallery");
        const menu = await openSurface(page, dock, SURFACES[1], false);
        await menu.getByRole("menuitem", { name: "Equation" }).click();
        await expect(page).toHaveURL(/\/equation$/);
        await expect(menu).toBeHidden();
    });
});

// ── U4 · F-4: the label fit is measured on the expanded run ──────────────────
test.describe("U4 F-4 label fit while collapsed 1440", () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    for (const cause of ["resize", "font load"] as const) {
        test(`U4 after a ${cause} while collapsed, the expanded dock shows the section name`, async ({ page }) => {
            const dock = await open(page, "/gallery");
            const label = dock.locator(".nav-trigger-label");
            await expect(label).toBeVisible();
            await collapseByLeaving(page, dock);
            if (cause === "resize") await page.setViewportSize({ width: 1400, height: 900 });
            else await page.evaluate(() => document.fonts.dispatchEvent(new Event("loadingdone")));
            await page.waitForTimeout(300);
            const b = (await dock.boundingBox())!;
            await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
            await expect(dock).toHaveClass(EXPANDED);
            await settled(dock);
            await expect(label, "the name the run holds at 1440").toBeVisible();
            await expect(label).toHaveText("Gallery");
        });
    }
});

// ── U5: disclosure, focus, axe ────────────────────────────────────────────────
test.describe("U5 disclosure, focus and axe 1440", () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test("U5 the collapsed dock is a disclosure that hands focus both ways", async ({ page }) => {
        const dock = await open(page, "/gallery");
        // Expanded: no disclosure button, the full layer is the toolbar.
        await expect(dock.getByRole("button", { name: "Expand dock" })).toHaveCount(0);
        await checkA11y(page, "app dock expanded", { include: ".app-header" });

        // Escape inside the run folds it and focus lands on the seal.
        await dock.getByRole("button", { name: "About Fourier analysis" }).focus();
        await page.keyboard.press("Escape");
        await expect(dock).toHaveClass(COLLAPSED);
        await settled(dock);
        const seal = dock.getByRole("button", { name: "Expand dock" });
        await expect(seal).toBeFocused();
        await expect(seal).toHaveAttribute("aria-expanded", "false");
        const full = await dock.locator(".dock-layer--full").getAttribute("id");
        await expect(seal).toHaveAttribute("aria-controls", full!);
        await expect(dock.locator(".dock-layer--full")).toHaveAttribute("inert", "");
        await checkA11y(page, "app dock collapsed", { include: ".app-header" });

        // Enter on the seal opens it and focus enters the run.
        await page.keyboard.press("Enter");
        await expect(dock).toHaveClass(EXPANDED);
        await settled(dock);
        await expect(dock.getByRole("button", { name: "About Fourier analysis" })).toBeFocused();
        await expect(dock.getByRole("button", { name: "Expand dock" })).toHaveCount(0);
    });
});

// ── U8: a page left alone rests at the seal, and reopens through the widths ──
// The o1105 adversary's prod dock cell (r1, r2): no press, the pointer parked
// off the dock; by t+8 s the dock is a seal (its width its height), and the
// reopen passes through widths between the seal and the open run, like
// keyframes' dock.

/** Every rendered width of the dock from now until `stop()`, one per frame. */
async function recordWidths(page: Page): Promise<() => Promise<number[]>> {
    await page.evaluate(() => {
        const w = window as unknown as { __u8: number[]; __u8stop: boolean };
        w.__u8 = [];
        w.__u8stop = false;
        const d = document.querySelector(".app-dock")!;
        const tick = () => {
            w.__u8.push(Math.round(d.getBoundingClientRect().width));
            if (!w.__u8stop) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
    return () =>
        page.evaluate(() => {
            const w = window as unknown as { __u8: number[]; __u8stop: boolean };
            w.__u8stop = true;
            return w.__u8;
        });
}

async function restsAtSeal(page: Page, dock: Locator): Promise<{ w: number; h: number }> {
    await page.waitForTimeout(8_000);
    await expect(dock).toHaveClass(COLLAPSED);
    await settled(dock);
    const b = (await dock.boundingBox())!;
    expect(Math.abs(b.width - b.height), `the seal is a circle (${b.width}x${b.height})`).toBeLessThanOrEqual(2);
    return { w: b.width, h: b.height };
}

function throughIntermediates(widths: number[], seal: number, full: number): void {
    const between = widths.filter((w) => w > seal + 4 && w < full - 4);
    expect(between.length, `widths between ${seal} and ${full}: ${JSON.stringify(widths)}`).toBeGreaterThanOrEqual(2);
}

test.describe("U8 rest at the seal 1440", () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test("U8 a page left alone rests at the seal and reopens through intermediate widths", async ({ page }) => {
        const dock = await open(page, "/");
        const full = (await dock.boundingBox())!.width;
        await page.mouse.move(720, 880);
        const seal = await restsAtSeal(page, dock);
        const b = (await dock.boundingBox())!;
        const stop = await recordWidths(page);
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
        await expect(dock).toHaveClass(EXPANDED);
        await settled(dock);
        throughIntermediates(await stop(), seal.w, full);
    });
});

test.describe("U8 rest at the seal touch 390", () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test("@coarse U8 a page left alone rests at the seal and reopens through intermediate widths (touch)", async ({ page }) => {
        const dock = await open(page, "/");
        const full = (await dock.boundingBox())!.width;
        const seal = await restsAtSeal(page, dock);
        const b = (await dock.boundingBox())!;
        const stop = await recordWidths(page);
        await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
        await expect(dock).toHaveClass(EXPANDED);
        await settled(dock);
        throughIntermediates(await stop(), seal.w, full);
    });
});

// ── U7: frame-time baseline and mid-morph frames (recorded only) ─────────────
const U7_FRAMES = process.env.U7_FRAMES_DIR;

test.describe("U7 morph frame-time baseline 1440", { tag: "@gpu" }, () => {
    test.beforeAll(async ({ browser }) => {
        await expectHardwareGpu(browser);
    });
    test.use({ viewport: { width: 1440, height: 900 } });
    test("U7 the collapse and expand morph frame times and six mid-morph frames", async ({ page }) => {
        test.setTimeout(120_000);
        const dock = await open(page, "/gallery");
        await page.waitForTimeout(800);
        const rows: { dir: string; n: number; p50: number; p95: number; max: number }[] = [];
        const q = (xs: number[], p: number) => {
            const s = [...xs].sort((a, b) => a - b);
            return s[Math.min(s.length - 1, Math.floor(p * s.length))];
        };
        for (let i = 0; i < 3; i++) {
            for (const dir of ["collapse", "expand"] as const) {
                await page.evaluate(() => {
                    const w = window as unknown as { __u7: number[]; __u7stop: boolean };
                    w.__u7 = [];
                    w.__u7stop = false;
                    let last = performance.now();
                    const tick = (t: number) => {
                        w.__u7.push(t - last);
                        last = t;
                        if (!w.__u7stop) requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                });
                const b = (await dock.boundingBox())!;
                if (dir === "collapse") await collapseByLeaving(page, dock);
                else {
                    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
                    await expect(dock).toHaveClass(EXPANDED);
                    await settled(dock);
                }
                const d = await page.evaluate(() => {
                    const w = window as unknown as { __u7: number[]; __u7stop: boolean };
                    w.__u7stop = true;
                    return w.__u7.slice(1);
                });
                rows.push({ dir, n: d.length, p50: q(d, 0.5), p95: q(d, 0.95), max: Math.max(...d) });
            }
        }
        test.info().annotations.push({ type: "u7-frames", description: JSON.stringify(rows) });
        console.log(`U7 ${JSON.stringify(rows)}`);
        expect(rows.every((r) => r.n > 0)).toBe(true);

        // Six frames across one collapse morph, recorded for the W-0.8 census row.
        if (U7_FRAMES) {
            const b = (await dock.boundingBox())!;
            await page.mouse.move(b.x + 8, b.y + b.height / 2);
            await page.mouse.move(b.x + b.width / 2, b.y + b.height + 160);
            await expect(dock).toHaveAttribute("data-morphing", "", { timeout: 8_000 });
            const clip = { x: 0, y: 0, width: 1440, height: 96 };
            for (let i = 0; i < 6; i++) {
                await page.screenshot({ path: `${U7_FRAMES}/mid-morph-${i}.png`, clip });
            }
        }
    });
});
