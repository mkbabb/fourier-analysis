// SERVED MODEL: claude-opus-5-5
import * as fs from "node:fs";
import * as path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { ADMIN_TOKEN, ENTRY, stubAdminApi } from "./fixtures/gallery";
import { seededViz } from "./fixtures/seed";

/**
 * X.F.W14V `.au0` — the AUDIT-2 fourier register re-baselined at HEAD
 * (F-W14V.md §1 `.au0`; F-W14U.md addendum (e); COHESION §0cy/§0cz).
 *
 * MEASURE ONLY. This instrument frames the views AUDIT-2's Lens 3 never read
 * (addendum (e)): the admin Audit Log, the fullscreen viewer, contour-editor
 * mode, the /w equation (Σ) panel, View options, the playback More-options
 * menu, the floating ToC and the inline paper search, the inline login, the
 * About popover, the nav dropdown, /morph and the Export dialog — at 1440×900
 * and 390×844 in both themes, plus tablet 768×1024 and 1024×768; and the
 * logged-in shell in light at 360 and 430. Phone widths carry the register's
 * safe-area insets through CDP `Emulation.setSafeAreaInsetsOverride`
 * (portrait: top 47, bottom 34), the instrument the register used (§0cy 11).
 *
 * Per view it records: page errors and console errors (the Lens 3 m-dark
 * "DropdownMenu parts must be used within DropdownMenu" re-check reads
 * these), the document's horizontal overflow, and the box of every open
 * floating plate (dialog / menu / popover / listbox) with its distance to
 * each viewport edge. It asserts one thing only: the DropdownMenu-parts
 * runtime error does not occur (the re-check the spec names).
 *
 * Frames: `e2e/screenshots/f-w14v/au0/` (PNG, git-ignored). Metrics JSON is
 * written to `$AU0_METRICS` when that is set (a scratch directory; the
 * figures are published in the wave record, not committed here).
 *
 * Served from :3100 (BASE_URL) against the API on :8000; data = the e2e
 * global seed (the saved visualization) and the stubbed admin API.
 */

const FRAMES = "e2e/screenshots/f-w14v/au0";
/** Presses the Canvas tab took per cell (instrument note; 1 = first press selected it). */
const tabPresses = new Map<string, number>();
const METRICS = process.env.AU0_METRICS;
const PARTS_ERROR = /DropdownMenu parts must be used within DropdownMenu/;

type Scheme = "light" | "dark";
interface Cell {
    id: string;
    width: number;
    height: number;
}

const CELLS: Cell[] = [
    { id: "d1440", width: 1440, height: 900 },
    { id: "m390", width: 390, height: 844 },
    { id: "t768", width: 768, height: 1024 },
    { id: "t1024", width: 1024, height: 768 },
];

interface Plate {
    kind: string;
    x: number;
    y: number;
    w: number;
    h: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
    scrollH: number;
    clientH: number;
}

interface ViewMetrics {
    view: string;
    state: "framed" | "absent";
    note?: string;
    docScrollW: number;
    docScrollH: number;
    innerW: number;
    innerH: number;
    plates: Plate[];
    dockScrollers?: string[];
}

interface Run {
    errors: string[];
    views: ViewMetrics[];
}

/** Collect page errors and console errors for the whole walk. */
function arm(page: Page, run: Run): void {
    page.on("pageerror", (e) => run.errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
        if (m.type() === "error" || (m.type() === "warning" && PARTS_ERROR.test(m.text()))) {
            run.errors.push(`console.${m.type()}: ${m.text().slice(0, 300)}`);
        }
    });
}

/** The register's portrait insets on phone widths (CDP; Chromium only). */
async function insets(page: Page, width: number): Promise<void> {
    if (width >= 640) return;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride" as never, {
        insets: { top: 47, bottom: 34, left: 0, right: 0 },
    } as never);
}

async function measure(page: Page, run: Run, view: string, note?: string): Promise<void> {
    const m = await page.evaluate(() => {
        const sel = [
            "[role=dialog]",
            "[role=menu]",
            "[role=listbox]",
            "[data-slot=popover-content]",
            "[data-reka-popper-content-wrapper] > *",
        ].join(",");
        const seen = new Set<Element>();
        const plates: Plate[] = [];
        for (const el of Array.from(document.querySelectorAll(sel))) {
            if (seen.has(el)) continue;
            seen.add(el);
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (r.width < 2 || r.height < 2 || cs.visibility === "hidden" || cs.display === "none") continue;
            plates.push({
                kind: el.getAttribute("role") ?? el.getAttribute("data-slot") ?? el.tagName.toLowerCase(),
                x: Math.round(r.left),
                y: Math.round(r.top),
                w: Math.round(r.width),
                h: Math.round(r.height),
                left: Math.round(r.left),
                right: Math.round(innerWidth - r.right),
                top: Math.round(r.top),
                bottom: Math.round(innerHeight - r.bottom),
                scrollH: el.scrollHeight,
                clientH: el.clientHeight,
            });
        }
        // Horizontal scrollers inside the docks (L2-15 / L2-19 read these).
        const dockScrollers = Array.from(document.querySelectorAll(".glass-dock, .glass-dock *"))
            .filter((el) => el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0)
            .map((el) => `${(el.className || el.tagName).toString().split(" ")[0]} ${el.scrollWidth}/${el.clientWidth}`);
        const d = document.documentElement;
        return {
            dockScrollers,
            docScrollW: d.scrollWidth,
            docScrollH: d.scrollHeight,
            innerW: innerWidth,
            innerH: innerHeight,
            plates,
        };
    });
    run.views.push({ view, state: "framed", note, ...m });
}

async function frame(page: Page, tag: string, view: string): Promise<void> {
    await page.screenshot({ path: `${FRAMES}/${tag}-${view}.png` });
}

/** Frame and measure one open state, then dismiss it. */
async function shot(page: Page, run: Run, tag: string, view: string, note?: string): Promise<void> {
    await page.waitForTimeout(450);
    await frame(page, tag, view);
    await measure(page, run, view, note);
}

function absent(run: Run, view: string, note: string): void {
    run.views.push({ view, state: "absent", note, docScrollW: 0, docScrollH: 0, innerW: 0, innerH: 0, plates: [] });
}

function flush(tag: string, run: Run): void {
    if (!METRICS) return;
    fs.mkdirSync(METRICS, { recursive: true });
    const out = { ...run, canvasTabPresses: tabPresses.get(tag) ?? 0 };
    fs.writeFileSync(path.join(METRICS, `${tag}.json`), JSON.stringify(out, null, 1));
}

async function openViz(page: Page, tag: string): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    // Below lg the workspace is tabbed (Controls / Canvas); frame the Controls
    // tab first, then open the Canvas tab where the docks live.
    const canvasTab = page.getByRole("tab", { name: "Canvas" }).filter({ visible: true }).first();
    // Either the tabbed form (a Canvas tab) or the side-by-side form (the dock).
    await expect(canvasTab.or(page.locator(".animation-dock")).first()).toBeVisible({ timeout: 30_000 });
    if (await canvasTab.count()) {
        await page.waitForTimeout(600);
        await frame(page, tag, "workspace-controls-tab");
        // The number of presses the tab takes is recorded (a press that does
        // not select the tab is a measured fact, not retried silently).
        let presses = 0;
        await expect(async () => {
            presses += 1;
            await canvasTab.click();
            await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 4_000 });
        }).toPass({ timeout: 40_000 });
        tabPresses.set(tag, presses);
    }
    await expect(page.locator(".animation-dock")).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(600);
}

async function expandCanvasDock(page: Page): Promise<void> {
    await page.getByRole("button", { name: "Edit contour" }).first().hover();
    await page.waitForTimeout(700);
}

/** Open a trigger if it is on the page at this width, else record why not. */
async function openIf(page: Page, run: Run, tag: string, view: string, trigger: string, why: string): Promise<boolean> {
    const t = page.locator(trigger).locator("visible=true").first();
    if ((await t.count()) === 0) {
        absent(run, view, why);
        return false;
    }
    await t.click();
    await shot(page, run, tag, view);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    return true;
}

/** The shell's own overlays: About, the inline login, the nav dropdown. */
async function walkShell(page: Page, run: Run, tag: string): Promise<void> {
    await page.goto("/gallery");
    await expect(page.locator(".app-dock")).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(800);
    await shot(page, run, tag, "shell");
    await openIf(page, run, tag, "about", "[aria-label='About Fourier analysis']", "no About trigger");
    await openIf(page, run, tag, "login", "[aria-label='Log in']", "no Log in trigger (session present)");
    await openIf(page, run, tag, "nav", ".nav-trigger", "inline Sections nav at this width (no dropdown)");
}

/** /paper: the floating ToC (below lg) and the inline search. */
async function walkPaper(page: Page, run: Run, tag: string): Promise<void> {
    await page.goto("/paper");
    await expect(page.locator("main, article").first()).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    await shot(page, run, tag, "paper");
    await openIf(page, run, tag, "paper-floating-toc", ".floating-toc-title-btn", "desktop drawer ToC (floating ToC is below lg)");
    // Below lg the inline search opens from the floating bar's Search control.
    const opener = page.locator(".floating-toc-bar [aria-label='Search paper']").locator("visible=true").first();
    if (await opener.count()) await opener.click();
    const search = page.getByRole("combobox", { name: "Search the paper" }).locator("visible=true").first();
    if ((await search.count()) === 0) {
        absent(run, "paper-inline-search", "no visible inline search at this width");
        return;
    }
    await search.click();
    await search.fill("fourier");
    await shot(page, run, tag, "paper-inline-search");
    await page.keyboard.press("Escape");
}

async function walkMorph(page: Page, run: Run, tag: string): Promise<void> {
    await page.goto("/morph");
    await page.waitForTimeout(2500);
    await shot(page, run, tag, "morph");
}

/** The loaded workspace: View options, Σ panel, Export, More options, fullscreen, editor. */
async function walkWorkspace(page: Page, run: Run, tag: string): Promise<void> {
    await openViz(page, tag);
    await shot(page, run, tag, "workspace");
    const anchor = ".controls-dock-anchor";

    await expandCanvasDock(page);
    await openIf(page, run, tag, "view-options", `${anchor} [aria-label='View options']`, "no View options control");

    await expandCanvasDock(page);
    const eq = page.locator(`${anchor} [aria-label='Equation']`).first();
    await eq.click();
    await page.waitForTimeout(1500);
    await shot(page, run, tag, "equation-panel");
    await expandCanvasDock(page);
    await eq.click();
    await page.waitForTimeout(400);

    await expandCanvasDock(page);
    await page.locator(`${anchor} [aria-label='Export frame']`).first().click();
    await expect(page.getByRole("dialog", { name: "Export Frame" })).toBeVisible();
    await shot(page, run, tag, "export");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    await page.getByRole("button", { name: /(Play|Pause) animation/ }).first().hover();
    await page.waitForTimeout(800);
    await shot(page, run, tag, "playback-dock-expanded");
    await openIf(page, run, tag, "more-options", ".animation-dock [aria-label='More options']", "no More options control");

    await expandCanvasDock(page);
    await page.locator(`${anchor} [aria-label='Fullscreen']`).first().click();
    await expect(page.getByRole("dialog", { name: /fullscreen/i })).toBeVisible();
    await shot(page, run, tag, "fullscreen");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(700);

    await page.getByRole("button", { name: "Edit contour" }).first().click();
    await expect(page.getByRole("button", { name: "Save contour" }).first()).toBeVisible();
    await shot(page, run, tag, "contour-editor");
    await page.getByRole("button", { name: "Save contour" }).first().hover();
    await page.waitForTimeout(800);
    await shot(page, run, tag, "editor-dock-expanded");
}

/** The admin Audit Log over the stubbed admin API (Lens 3's frames were blank). */
async function walkAudit(page: Page, run: Run, tag: string): Promise<void> {
    await stubAdminApi(page, [ENTRY]);
    await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);
    await expect(page.getByRole("region", { name: "Admin mode banner" })).toBeVisible({ timeout: 60_000 });
    await page.getByRole("tab", { name: "Audit Log" }).click();
    // X.F.W14V.au4 (A2-FO-L2-11): below 640 px the ledger is DataTable's cards.
    await expect(page.locator("table tbody tr, .data-table-card").first()).toBeVisible({ timeout: 60_000 });
    await shot(page, run, tag, "audit-log");
}

function partsErrors(run: Run): string[] {
    return run.errors.filter((e) => PARTS_ERROR.test(e));
}

for (const scheme of ["light", "dark"] as Scheme[]) {
    for (const cell of CELLS) {
        const tag = `${cell.id}-${scheme}`;
        test.describe(`au0 ${tag}`, () => {
            test.use({
                viewport: { width: cell.width, height: cell.height },
                colorScheme: scheme,
                hasTouch: cell.width < 1024,
            });
            test.setTimeout(240_000);

            test(`frames the unread views ${tag}`, async ({ page }) => {
                const run: Run = { errors: [], views: [] };
                arm(page, run);
                await insets(page, cell.width);
                await walkShell(page, run, tag);
                await walkPaper(page, run, tag);
                await walkMorph(page, run, tag);
                await walkWorkspace(page, run, tag);
                await walkAudit(page, run, tag);
                flush(tag, run);
                expect(partsErrors(run), "DropdownMenu parts runtime error").toEqual([]);
            });
        });
    }
}

/** The logged-in shell in light at 360 and 430 (the L2 seat's missed twins). */
for (const width of [360, 430]) {
    const tag = `m${width}-light-loggedin`;
    test.describe(`au0 ${tag}`, () => {
        test.use({ viewport: { width, height: width === 360 ? 780 : 932 }, colorScheme: "light", hasTouch: true });
        test.setTimeout(120_000);

        test(`frames the logged-in shell ${tag}`, async ({ page }) => {
            const run: Run = { errors: [], views: [] };
            arm(page, run);
            await insets(page, width);
            await page.addInitScript(() => {
                localStorage.setItem("fourier-user-slug", "quiet-amber-lattice-fox");
                localStorage.setItem("fourier-user-token", "e2e-token");
            });
            await page.goto("/gallery");
            await expect(page.locator(".app-dock")).toBeVisible({ timeout: 30_000 });
            await page.waitForTimeout(800);
            await shot(page, run, tag, "shell");
            await openIf(page, run, tag, "account", ".account-trigger", "no account trigger");
            await openIf(page, run, tag, "nav", ".nav-trigger", "inline Sections nav at this width");
            flush(tag, run);
            expect(partsErrors(run), "DropdownMenu parts runtime error").toEqual([]);
        });
    });
}
