// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";
import { ADMIN_TOKEN, ADMIN_USERS, ENTRY, stubAdminApi, stubGallery } from "./fixtures/gallery";
import { seededViz, type SeededViz } from "./fixtures/seed";

/**
 * X.F.W14.u — the UIA-F register (`value.js/docs/tranches/X/audit/UI-AUDIT-fourier.md`).
 *
 * One falsifier per CONSUMER row this unit cures at its cause, named by the
 * row id so a regression reads back to the register. Each test drives the
 * served page (Vite dev at `BASE_URL`) and asserts the computed or behavioural
 * reading the row's "expected (canon)" names, never a pixel copy.
 */

/** Collect uncaught page errors for the life of the test. */
function pageErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    return errors;
}

const FEATURED = { ...ENTRY, slug: "crowned-heron-lattice", title: "Crowned heron lattice", tier: "featured" };

test.describe("UIA-F-1 — a featured entry renders the strip, not a crash", () => {
    test("the pager lives inside its Carousel; no useCarousel pageerror", async ({ page }) => {
        const errors = pageErrors(page);
        await stubGallery(page, [FEATURED, ENTRY]);
        await page.goto("/gallery");
        const strip = page.locator("section.featured-section");
        await expect(strip).toBeVisible();
        await expect(strip.getByRole("heading", { name: "Featured" })).toBeVisible();
        await expect(strip.getByRole("group", { name: FEATURED.title })).toBeVisible();
        await expect(page.getByRole("button", { name: `Open ${ENTRY.title}` })).toBeVisible();
        expect(errors.filter((m) => /useCarousel/.test(m))).toEqual([]);
    });
});

/**
 * The saved visualization the `/v/`, dock, export, publish and drafts rows
 * drive. X.F.W14.s (addendum (f), COHESION §0cm): the suite's global setup
 * (`e2e/global-seed.ts`) mints it through the public `/api` with a session,
 * namespaced and torn down after the run; this spec reads that record and
 * seeds nothing of its own.
 */
function firstSavedViz(): SeededViz {
    return seededViz();
}

/** Push through the app's own router (no in-app link targets `/v/` yet). */
async function routerPush(page: Page, path: string): Promise<void> {
    await page.waitForFunction(() => "__vue_app__" in (document.querySelector("#app") ?? {}));
    await page.evaluate(async (p) => {
        const el = document.querySelector("#app") as unknown as {
            __vue_app__: { config: { globalProperties: { $router: { push(p: string): Promise<unknown> } } } };
        };
        await el.__vue_app__.config.globalProperties.$router.push(p);
    }, path);
}

test.describe("UIA-F-2 / UIA-F-3 — /v/:visualizationSlug loads the saved entity", () => {
    test("F-2: a cold deep link sends GET /api/visualizations/<slug> and leaves the upload stage", async ({ page }) => {
        const viz = firstSavedViz();
        const got = page.waitForResponse(
            (r) => new URL(r.url()).pathname === `/api/visualizations/${viz.slug}` && r.request().method() === "GET",
        );
        await page.goto(`/v/${viz.slug}`);
        expect((await got).status()).toBe(200);
        await expect(page.getByText(/Drop or click to upload/i)).toHaveCount(0);
        await expect(page).toHaveURL(new RegExp(`/v/${viz.slug}$`));
    });

    test("F-3: an in-app push /w/ → /v/ stays on /v/ with no orphaned transition", async ({ page }) => {
        const errors = pageErrors(page);
        const viz = firstSavedViz();
        await page.goto(`/w/${viz.image_slug}`);
        await expect(page).toHaveURL(new RegExp(`/w/${viz.image_slug}$`));
        await routerPush(page, `/v/${viz.slug}`);
        await page.waitForTimeout(600);
        await expect(page).toHaveURL(new RegExp(`/v/${viz.slug}$`));
        expect(errors).toEqual([]);
    });
});

test.describe("UIA-F-50 / UIA-F-4 / UIA-F-49 — not-found and load-error states", () => {
    test("F-50: an unknown path renders a titled, noindexed not-found card", async ({ page }) => {
        await page.goto("/nope/deeper");
        const card = page.getByTestId("not-found");
        await expect(card.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
        await expect(card.getByRole("button", { name: "Browse the gallery" })).toBeVisible();
        await expect(page).toHaveTitle("Not found — Fourier Analysis");
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
        // Leaving the not-found route drops the noindex again.
        await card.getByRole("button", { name: "Browse the gallery" }).click();
        await expect(page).toHaveURL(/\/gallery$/);
        await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    });

    test("F-4: /v/<unknown> names the failed slug instead of the upload prompt", async ({ page }) => {
        await page.goto("/v/no-such-slug");
        const card = page.getByTestId("not-found");
        await expect(card.getByRole("heading", { name: "Could not open this visualization" })).toBeVisible();
        await expect(card).toContainText("no-such-slug");
        await expect(page.getByText(/Drop or click to upload/i)).toHaveCount(0);
    });

    test("F-49: the error card's action is labelled, and nothing covers the diagnosis", async ({ page }) => {
        await page.goto("/v/no-such-slug");
        const card = page.getByTestId("not-found");
        const action = card.getByRole("button", { name: "Upload a new image" });
        await action.hover();
        await action.focus();
        await page.waitForTimeout(700);
        await expect(page.getByRole("tooltip")).toHaveCount(0);
        await action.click();
        await expect(page).toHaveURL(/\/(visualize|w)\/?$/);
        await expect(page.getByTestId("not-found")).toHaveCount(0);
    });
});

test.describe("UIA-F-7 — the collapsed dock's position readout paints its fill", () => {
    test("the mini readout is a progressbar whose painted fill tracks the clock", async ({ page }) => {
        const viz = firstSavedViz();
        await page.goto(`/v/${viz.slug}`);
        await page.mouse.move(5, 5);
        const bar = page.locator(".mini-progress").first();
        await expect(bar).toHaveAttribute("role", "progressbar");
        await expect.poll(async () => Number(await bar.getAttribute("aria-valuenow")), { timeout: 10_000 }).toBeGreaterThan(0);
        const fill = await bar.evaluate((el) => {
            const ind = el.firstElementChild as HTMLElement;
            const r = ind.getBoundingClientRect();
            const box = el.getBoundingClientRect();
            const bg = getComputedStyle(ind).backgroundColor;
            // The painted span is the part of the indicator inside the rail.
            const painted = Math.max(0, Math.min(r.right, box.right) - Math.max(r.left, box.left));
            return { h: r.height, painted, transparent: bg === "transparent" || /,\s*0\)$/.test(bg) };
        });
        expect(fill.h).toBeGreaterThan(0);
        expect(fill.transparent).toBe(false);
        expect(fill.painted).toBeGreaterThan(0);
    });
});

/** Count the painted (alpha > 0) pixels of a PNG, decoded in the page. */
async function paintedPixels(page: Page, png: Buffer): Promise<number> {
    return page.evaluate(async (b64) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
        return n;
    }, png.toString("base64"));
}

test.describe("UIA-F-17 — every export switch changes the PNG", () => {
    test("switching Epicycles and Trace path off removes their pixels", async ({ page }) => {
        // A declared budget, sized from measurement (F.W14 Repair 1, R-C5-1):
        // four full exports plus a 5.1 s wall-clock progress poll run 15.2-17.2 s
        // at load 9-15; each post-export hover waits ~0.3 s for the dock's
        // morph back from its menu layer (`.dock-layers` intercepts pointer
        // events until it settles), so the case's cost is serial and scales
        // with host load — at load 44.5 it crossed the 30 s default mid-hover
        // of the fourth export. 60 s = 3.5x the measured 17.2 s.
        test.setTimeout(60_000);
        const viz = firstSavedViz();
        await page.goto(`/v/${viz.slug}`);
        const bar = page.locator(".mini-progress").first();
        await expect.poll(async () => Number(await bar.getAttribute("aria-valuenow")), { timeout: 10_000 }).toBeGreaterThan(0.2);
        // Paused by keyboard: a pointer press on a persistent dock control can
        // be discarded by the producer's click-integrity guard mid-morph
        // (UIA-F-8, glass), which would leave the clock running.
        const pause = page.getByRole("button", { name: "Pause animation" }).first();
        await pause.focus();
        await page.keyboard.press("Enter");
        await expect(page.getByRole("button", { name: "Play animation" }).first()).toBeVisible();

        async function exportWith(off: string[]): Promise<number> {
            // X.F.W14V.u1 (UIA-F-182, §0bt): Export is the canvas dock's own control.
            // The dock expands under the pointer; let its morph settle first.
            await page.locator(".controls-dock-anchor .glass-dock").hover();
            await page.waitForTimeout(800);
            await page.locator(".controls-dock-anchor [aria-label='Export frame']").click();
            const dialog = page.getByRole("dialog", { name: "Export Frame" });
            // X.F.W14U.vdock (UIA-F-243): the dialog remembers its choices across
            // opens, so each export SETS every layer switch rather than toggling
            // from a presumed default.
            for (const name of ["Epicycles", "Trace path", "Grid lines", "Labels"]) {
                const sw = dialog.getByRole("switch", { name });
                if ((await sw.getAttribute("aria-checked")) !== String(!off.includes(name))) await sw.click();
            }
            const dl = page.waitForEvent("download");
            await dialog.getByRole("button", { name: "Save PNG" }).click();
            const file = await (await dl).path();
            const { readFileSync } = await import("node:fs");
            await expect(dialog).toHaveCount(0);
            return paintedPixels(page, readFileSync(file!));
        }

        const all = await exportWith(["Grid lines", "Labels"]);
        const noChain = await exportWith(["Grid lines", "Labels", "Epicycles"]);
        const noTrace = await exportWith(["Grid lines", "Labels", "Trace path"]);
        const again = await exportWith(["Grid lines", "Labels"]);
        // A layer's removal must stand well clear of the repeat-export noise
        // (the same switches twice) and of a 1% floor.
        const floor = Math.max(all * 0.01, 10 * Math.abs(all - again));
        expect(all - noChain, "Epicycles off removes the chain").toBeGreaterThan(floor);
        expect(all - noTrace, "Trace path off removes the trace").toBeGreaterThan(floor);
    });
});

/** Open the saved visualization in contour-edit mode; return the editor's shell. */
async function openEditor(page: Page) {
    const viz = firstSavedViz();
    await page.goto(`/v/${viz.slug}`);
    const edit = page.getByRole("button", { name: "Edit contour" }).first();
    await edit.hover();
    await page.waitForTimeout(600);
    await edit.click();
    const shell = page.locator(".editor-shell:not(.is-hidden) > .editor-shell").first();
    const point = page.locator("circle.control-point").nth(10);
    await expect(point).toBeVisible();
    return { shell, point };
}

/** Drag a control point by a few screen pixels. */
async function dragPoint(page: Page, point: ReturnType<Page["locator"]>) {
    const box = (await point.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 12, y + 9, { steps: 4 });
    await page.mouse.up();
}

test.describe("UIA-F-16 — Undo enables after a point drag", () => {
    test("a drag writes history and the dock's Undo is enabled", async ({ page }) => {
        const { point } = await openEditor(page);
        // The Undo control lives in the editor dock's expanded layer, which is
        // inert while collapsed; its disabled state is read off the element.
        const undo = page.locator('[aria-label="Undo"]').first();
        const disabled = () =>
            undo.evaluate((el) => (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true");
        expect(await disabled()).toBe(true);
        await dragPoint(page, point);
        await expect.poll(disabled).toBe(false);
    });
});

test.describe("UIA-F-15 — editor shortcuts act only on the editor", () => {
    test("Delete works on a picked point; out of edit mode a sidebar field keeps its Backspace", async ({ page }) => {
        const { point } = await openEditor(page);
        const points = page.locator("circle.control-point");
        const before = await points.count();
        await dragPoint(page, point); // picks (selects) the point
        await page.keyboard.press("Delete");
        await expect(points).toHaveCount(before - 1);

        // Pick another point, then leave edit mode with it still selected.
        await dragPoint(page, points.nth(20));
        const edit = page.getByRole("button", { name: "Edit contour" }).first();
        await edit.hover();
        await page.waitForTimeout(600);
        await edit.click();
        // F.W14U.vedit — UIA-F-180: leaving with unsaved edits asks first; the
        // case keeps its edits (a new contour asset, as the dock's Save makes).
        await page.getByRole("dialog", { name: /unsaved/i }).getByRole("button", { name: "Save", exact: true }).click();

        const field = page.getByRole("spinbutton").first();
        await field.click();
        await page.keyboard.press("End");
        const typed = await field.inputValue();
        await page.keyboard.press("Backspace");
        await expect(points).toHaveCount(before - 1);
        await expect(field).toHaveValue(typed.slice(0, -1));
        await expect(page.locator(".canvas-stage > .editor-shell")).toHaveAttribute("inert", "");
    });
});

test.describe("UIA-F-18 — one Publish action gives one outcome", () => {
    test("a double-click sends one save and shows no false 'Could not save'", async ({ page }) => {
        const viz = firstSavedViz();
        const saved = { ...ENTRY, slug: "quiet-amber-lattice-fox", visibility: "draft" };
        let posts = 0;
        await page.route("**/api/visualizations", async (route) => {
            if (route.request().method() !== "POST") return route.fallback();
            posts++;
            await new Promise((r) => setTimeout(r, 700));
            await route.fulfill({ status: 201, contentType: "application/json", headers: { ETag: '"e1"' }, body: JSON.stringify(saved) });
        });
        await page.route(`**/api/visualizations/${saved.slug}`, (route) =>
            route.fulfill({ status: 200, contentType: "application/json", headers: { ETag: '"e2"' }, body: JSON.stringify({ ...saved, visibility: "public" }) }),
        );
        // Publishing needs a session (F.W14U.vstage, UIA-F-95: logged out,
        // Publish sends nothing); the viewer is logged in the app's own way.
        await page.addInitScript(() => localStorage.setItem("fourier-user-slug", "e2e-publisher"));
        await page.goto(`/v/${viz.slug}`);
        // The canvas dock expands under the pointer (its persistent control).
        await page.getByRole("button", { name: "Edit contour" }).first().hover();
        const publish = page.getByRole("button", { name: "Publish to Gallery" }).first();
        await expect(publish).toBeVisible();
        await page.waitForTimeout(600);
        await publish.dblclick();
        await expect(page.getByText(`Published “${saved.title}”`, { exact: true })).toBeVisible({ timeout: 10_000 });
        expect(posts).toBe(1);
        await expect(page.getByText(/Could not save/i)).toHaveCount(0);
    });
});

test.describe("UIA-F-19 — one drop, one upload", () => {
    test("a file dropped over a loaded image sends exactly one POST /api/images", async ({ page }) => {
        const viz = firstSavedViz();
        const meta = await (await page.request.get(`/api/images/${viz.image_slug}`)).json();
        let posts = 0;
        await page.route("**/api/images", async (route) => {
            if (route.request().method() !== "POST") return route.fallback();
            posts++;
            await new Promise((r) => setTimeout(r, 400));
            await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(meta) });
        });
        await page.goto(`/v/${viz.slug}`);
        await expect(page.locator("circle.control-point, canvas").first()).toBeAttached();
        await page.evaluate(() => {
            const bytes = Uint8Array.from(
                atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
                (c) => c.charCodeAt(0),
            );
            const dt = new DataTransfer();
            dt.items.add(new File([bytes], "drop.png", { type: "image/png" }));
            const x = innerWidth / 3;
            const y = innerHeight / 2;
            const fire = (type: string) => {
                const target = document.elementFromPoint(x, y)!;
                target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
            };
            fire("dragenter");
            fire("dragover");
            return new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => { fire("dragover"); fire("drop"); r(); })));
        });
        await page.waitForTimeout(1500);
        expect(posts).toBe(1);
    });
});

test.describe("UIA-F-20 — the paper restores its scroll position", () => {
    test("a reload returns to the saved section instead of the top", async ({ page }) => {
        await page.goto("/paper");
        const main = page.locator(".paper-scroll");
        await expect.poll(() => main.evaluate((el) => el.scrollHeight), { timeout: 10_000 }).toBeGreaterThan(5000);
        // Scroll the paper's scroller a long way into the paper.
        await main.evaluate((el) => el.scrollTo({ top: el.scrollHeight * 0.5 }));
        await expect
            .poll(() => page.evaluate(() => sessionStorage.getItem("paper-active-section")), { timeout: 10_000 })
            .not.toBeNull();
        const saved = await page.evaluate(() => sessionStorage.getItem("paper-active-section"));
        await page.reload();
        await expect.poll(() => main.evaluate((el) => el.scrollTop), { timeout: 10_000 }).toBeGreaterThan(1000);
        const top = await page.evaluate((id) => document.getElementById(id!)?.getBoundingClientRect().top ?? null, saved);
        expect(top, `section #${saved} is brought into view`).not.toBeNull();
        expect(Math.abs(top!)).toBeLessThan(900);
    });
});

test.describe("UIA-F-24 — floating ToC chapter rows navigate; the disclosure toggles", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("tapping a chapter row scrolls to it; the chevron is its own control", async ({ page }) => {
        await page.goto("/paper");
        const scroller = page.locator(".paper-scroll");
        // The floating bar appears once the inline contents scroll away.
        await expect.poll(() => scroller.evaluate((el) => el.scrollHeight), { timeout: 10_000 }).toBeGreaterThan(5000);
        await scroller.evaluate((el) => el.scrollTo({ top: 2500 }));
        const trigger = page.locator(".floating-toc-title-btn");
        await trigger.click();
        const rows = page.locator(".floating-toc-root");
        await expect(rows.first()).toBeVisible();
        const n = await rows.count();
        const before = await scroller.evaluate((el) => el.scrollTop);
        await rows.nth(n - 1).click();
        await expect(page.locator(".floating-toc-root")).toHaveCount(0);
        await expect.poll(() => scroller.evaluate((el) => el.scrollTop), { timeout: 10_000 }).toBeGreaterThan(before + 2000);

        await trigger.click();
        const disclosure = page.getByRole("button", { name: /^Subsections of / }).first();
        const expanded = await disclosure.getAttribute("aria-expanded");
        await disclosure.click();
        await expect(disclosure).toHaveAttribute("aria-expanded", expanded === "true" ? "false" : "true");
        await expect(page.locator(".floating-toc-row").first()).toBeVisible();
    });
});

/** Open the gallery in admin mode (stubbed admin API) on the named tab. */
async function openAdminTab(page: Page, tab: string) {
    await stubAdminApi(page);
    await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);
    await expect(page.getByRole("region", { name: "Admin mode banner" })).toBeVisible({ timeout: 60_000 });
    await page.getByRole("tab", { name: tab }).click();
}

test.describe("UIA-F-36 — the users batch bar docks below the list without displacing it", () => {
    test("ticking a row neither moves the rows nor seats the bar off-screen", async ({ page }) => {
        await openAdminTab(page, "Users");
        const row = page.getByRole("listitem").filter({ hasText: ADMIN_USERS.items[0].user_slug }).first();
        await expect(row).toBeVisible();
        const topBefore = (await row.boundingBox())!.y;
        await row.getByRole("checkbox").click();
        const bar = page.getByRole("group", { name: "Batch user actions" });
        await expect(bar).toBeVisible();
        const topAfter = (await row.boundingBox())!.y;
        expect(Math.abs(topAfter - topBefore), "the ticked row stays under the pointer").toBeLessThanOrEqual(1);
        const box = (await bar.boundingBox())!;
        const vh = page.viewportSize()!.height;
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height).toBeLessThanOrEqual(vh);
        // The bar sits after the rows it acts on.
        expect(box.y).toBeGreaterThan(topAfter);
    });
});

test.describe("UIA-F-37 — the mobile users toolbar keeps its search usable", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("at 390 the search field spans the panel; the sort Select carries no literal height", async ({ page }) => {
        await openAdminTab(page, "Users");
        const search = page.getByRole("searchbox", { name: "Search users" });
        await expect(search).toBeVisible();
        const sw = (await search.boundingBox())!.width;
        expect(sw, "the search field is not crushed").toBeGreaterThan(300);
        const sort = page.getByRole("combobox", { name: "Sort users" });
        const cls = (await sort.getAttribute("class")) ?? "";
        expect(cls).not.toMatch(/\bh-8\b|w-\[10rem\]|\btext-sm\b/);
        // Every toolbar control stays inside the panel's width.
        const vw = page.viewportSize()!.width;
        // X.F.W14U.admin (UIA-F-194): Prune moved into the toolbar's overflow
        // menu; the toolbar's third control is that menu's trigger.
        for (const el of [search, sort, page.getByRole("button", { name: "More user actions" })]) {
            const b = (await el.boundingBox())!;
            expect(b.x + b.width).toBeLessThanOrEqual(vw);
        }
    });
});

test.describe("UIA-F-42 — at 390 every audit field is legible (cured by .t's DataTable, b5a650f)", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("no audit cell collapses to 0 px and no action badge overflows its pill", async ({ page }) => {
        await openAdminTab(page, "Audit Log");
        const table = page.locator('[aria-label="Admin audit entries"]');
        const rows = table.locator("tbody > tr");
        await expect(rows.first()).toBeVisible();
        const cells = await rows.evaluateAll((trs) =>
            trs.flatMap((tr) => [...tr.children].map((td) => ({ w: (td as HTMLElement).getBoundingClientRect().width, t: td.textContent?.trim() ?? "" }))),
        );
        expect(cells.length).toBeGreaterThan(0);
        for (const c of cells) expect(c.w, `cell "${c.t}"`).toBeGreaterThan(0);
        const badges = table.locator('[data-slot="badge"]');
        expect(await badges.count(), "one action badge per row is measured").toBeGreaterThanOrEqual(await rows.count());
        const spill = await badges.evaluateAll((els) =>
            els.filter((e) => e.scrollWidth > e.clientWidth).map((e) => e.textContent),
        );
        expect(spill).toEqual([]);
    });
});

test.describe("UIA-F-48 — the Drafts card sits inside the column gutter", () => {
    test("its right edge stays inside its column and the viewport", async ({ page }) => {
        const viz = firstSavedViz();
        await page.goto(`/w/${viz.image_slug}`); // saves this workspace as a local draft
        await expect(page).toHaveURL(new RegExp(`/w/${viz.image_slug}$`));
        await page.waitForTimeout(800);
        await page.goto("/gallery");
        await page.getByRole("tab", { name: "Drafts" }).click();
        const header = page.getByRole("list", { name: "Drafts" });
        await expect(header).toBeVisible();
        const m = await header.evaluate((list) => {
            const card = list.querySelector("article")!;
            const col = list.parentElement!;
            const r = card.getBoundingClientRect();
            const c = col.getBoundingClientRect();
            return { right: r.right, colRight: c.right, vw: innerWidth, docScroll: document.documentElement.scrollWidth };
        });
        expect(m.right).toBeLessThanOrEqual(m.colRight - 15);
        expect(m.right).toBeLessThanOrEqual(m.vw);
        expect(m.docScroll).toBeLessThanOrEqual(m.vw);
    });
});

test.describe("UIA-F-41 — the gallery column never scrolls sideways at 390 (consumer half)", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("focusing the last admin tab leaves the column at scrollLeft 0", async ({ page }) => {
        await openAdminTab(page, "Gallery");
        const tabs = page.getByRole("tab");
        const last = tabs.nth((await tabs.count()) - 1);
        await last.focus();
        await page.keyboard.press("End");
        await page.waitForTimeout(300);
        // The gallery column (the vertical scroller holding the strip and the
        // sections) and the document never move sideways; only the strip's own
        // track may.
        const scrolled = await page.evaluate(() =>
            [document.scrollingElement!, ...document.querySelectorAll("main *")]
                .filter((el) => el === document.scrollingElement || (getComputedStyle(el).overflowY === "auto" && el.childElementCount > 1 && el.querySelector('[role="tablist"]')))
                .filter((el) => el.scrollLeft > 0)
                .map((el) => `${el.tagName}.${(el as HTMLElement).className}`.slice(0, 80)),
        );
        expect(scrolled).toEqual([]);
    });
});

test.describe("UIA-F-45 — focus opens inside the card modal and stays there", () => {
    test("initial focus is the dialog's title and Tab never reaches the page behind", async ({ page }) => {
        await stubGallery(page, [ENTRY]);
        await page.goto("/gallery");
        await page.getByRole("button", { name: `Open ${ENTRY.title}` }).first().click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect.poll(() => dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
        expect(await page.evaluate(() => document.activeElement?.hasAttribute("data-initial-focus"))).toBe(true);
        for (let i = 0; i < 6; i++) {
            await page.keyboard.press("Tab");
            expect(await dialog.evaluate((d) => d.contains(document.activeElement)), `Tab #${i + 1}`).toBe(true);
        }
    });
});

test.describe("UIA-F-40 — the admin grid does not wait on admin stats", () => {
    test("a slow stats call neither delays the grid request nor shows the empty CTA over entries", async ({ page }) => {
        await stubAdminApi(page, [ENTRY]);
        let statsAt = 0;
        let gridAt = 0;
        const t0 = Date.now();
        await page.route("**/api/admin/stats", async (route) => {
            statsAt = Date.now() - t0;
            await new Promise((r) => setTimeout(r, 3000));
            await route.fallback();
        });
        page.on("request", (r) => {
            if (new URL(r.url()).pathname === "/api/visualizations" && !gridAt) gridAt = Date.now() - t0;
        });
        await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);
        await expect(page.getByRole("button", { name: `Open ${ENTRY.title}` }).first()).toBeVisible({ timeout: 2500 });
        expect(gridAt, "the grid request is not queued behind stats").toBeGreaterThan(0);
        expect(statsAt === 0 || gridAt < statsAt + 3000).toBe(true);
    });
});

test.describe("UIA-F-47 — a published draft leaves the Drafts list", () => {
    test("after Publish the draft row is gone, and stays gone on reload", async ({ page }) => {
        const viz = firstSavedViz();
        const created = { ...ENTRY, slug: "bright-lattice-heron-fox", image_slug: viz.image_slug };
        await page.route("**/api/sessions", (r) =>
            r.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ user_slug: "amber-fox-12", token: "t" }) }),
        );
        await page.route("**/api/visualizations", (r) =>
            r.request().method() === "POST"
                ? r.fulfill({ status: 201, contentType: "application/json", headers: { ETag: '"e"' }, body: JSON.stringify(created) })
                : r.fallback(),
        );
        // Open the workspace and let it extract + compute, so the local draft it
        // saves carries a contour (a draft without one cannot be published).
        await page.goto(`/w/${viz.image_slug}`);
        await expect(page.locator(".mini-progress")).toBeAttached({ timeout: 30_000 });
        // The workspace's debounced draft save lands the contour after extraction;
        // read the stored draft itself (`lib/draftStorage.ts`), not a fixed wait.
        await expect
            .poll(
                () =>
                    page.evaluate(
                        (slug) =>
                            new Promise<boolean>((resolve) => {
                                const open = indexedDB.open("fourier-drafts");
                                open.onerror = () => resolve(false);
                                open.onsuccess = () => {
                                    const db = open.result;
                                    if (!db.objectStoreNames.contains("drafts")) return (db.close(), resolve(false));
                                    const get = db.transaction("drafts").objectStore("drafts").get(slug);
                                    get.onsuccess = () => (db.close(), resolve(Boolean(get.result?.contour)));
                                    get.onerror = () => (db.close(), resolve(false));
                                };
                            }),
                        viz.image_slug,
                    ),
                { message: "the workspace's draft carries its contour", timeout: 30_000 },
            )
            .toBe(true);
        await page.goto("/gallery");
        await page.getByRole("tab", { name: "Drafts" }).click();
        const header = page.getByRole("list", { name: "Drafts" });
        await expect(header).toBeVisible();
        const publish = page.getByRole("button", { name: /^Publish/ });
        const before = await publish.count();
        expect(before).toBeGreaterThan(0);
        await publish.first().click();
        await expect(page.getByText(/^Published /).first()).toBeVisible();
        await expect(publish).toHaveCount(before - 1);
        await page.reload();
        await page.getByRole("tab", { name: "Drafts" }).click();
        await expect(page.getByRole("button", { name: /^Publish/ })).toHaveCount(before - 1);
    });
});

/** Open /equation with its result card in view (the Canvas panel below lg). */
async function openEquationCard(page: Page) {
    await page.goto("/equation");
    if (page.viewportSize()!.width < 1024) await page.getByRole("tab", { name: "Canvas" }).click();
    const card = page.locator(".eq-card");
    await expect(card.locator(".katex").first()).toBeVisible({ timeout: 20_000 });
    return card;
}

for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test.describe(`UIA-F-33 / UIA-F-34 — the equation card's controls sit in a header row (${vp.width})`, () => {
        test.use({ viewport: vp, hasTouch: vp.width < 1024 });

        test("no control overlaps another or the equation, and nothing is cut by the card", async ({ page }) => {
            const card = await openEquationCard(page);
            await card.getByRole("button", { name: /Expanded|a \+ b/ }).first().click();
            await page.waitForTimeout(400);
            const m = await card.evaluate((c) => {
                const r = (e: Element) => e.getBoundingClientRect();
                const btns = [...c.querySelectorAll("button")].map(r);
                const eq = r(c.querySelector(".eq-scroll-region")!);
                const inner = r(c.querySelector(".eq-scroll-region .katex-display, .eq-scroll-region .katex")!);
                return { btns: btns.map((b) => [b.left, b.top, b.right, b.bottom]), eq: [eq.left, eq.top, eq.right, eq.bottom], inner: [inner.top, inner.bottom], card: [r(c).top, r(c).bottom] };
            });
            expect(m.btns.length).toBeGreaterThanOrEqual(3);
            const hit = (a: number[], b: number[]) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
            for (let i = 0; i < m.btns.length; i++) {
                expect(hit(m.btns[i], m.eq), `control ${i} over the equation`).toBe(false);
                for (let j = i + 1; j < m.btns.length; j++) expect(hit(m.btns[i], m.btns[j]), `controls ${i}/${j}`).toBe(false);
            }
            expect(m.inner[1]).toBeLessThanOrEqual(m.card[1]);
        });
    });
}

test.describe("UIA-F-32 — the coefficient popover escapes the equation card", () => {
    test("hovering a coefficient shows the whole popover, clipped by no ancestor", async ({ page }) => {
        const card = await openEquationCard(page);
        const coeff = card.locator(".eq-coeff").first();
        await expect(coeff).toBeVisible();
        await coeff.hover();
        const pop = page.locator(".coeff-popover");
        await expect(pop).toBeVisible();
        await page.waitForTimeout(300);
        const visible = await pop.evaluate((p) => {
            const r = p.getBoundingClientRect();
            let [l, t, rt, b] = [r.left, r.top, r.right, r.bottom];
            for (let a = p.parentElement; a; a = a.parentElement) {
                const cs = getComputedStyle(a);
                if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
                    const ar = a.getBoundingClientRect();
                    l = Math.max(l, ar.left); t = Math.max(t, ar.top); rt = Math.min(rt, ar.right); b = Math.min(b, ar.bottom);
                }
            }
            return Math.max(0, rt - l) * Math.max(0, b - t) / (r.width * r.height);
        });
        expect(visible).toBeGreaterThan(0.99);
    });
});

test.describe("UIA-F-12 — the canvas dock's View options are reachable by keyboard", () => {
    // X.F.W14V.u1 (UIA-F-79, §0bt): View options is a menu now (UIA-F-77/F-79), so its
    // rows are reached with the menu's own keys (focus enters the menu; arrows move).
    test("Enter opens the menu and the keys reach both rows; Enter toggles one", async ({ page }) => {
        const viz = firstSavedViz();
        await page.goto(`/v/${viz.slug}`);
        await page.getByRole("button", { name: "Edit contour" }).first().hover();
        const view = page.getByRole("button", { name: "View options" }).first();
        await expect(view).toBeVisible();
        await page.waitForTimeout(600);
        await view.focus();
        await page.keyboard.press("Enter");
        await expect(page.getByRole("menu")).toBeVisible();
        const names: string[] = [];
        for (let i = 0; i < 3; i++) {
            names.push((await page.evaluate(() => document.activeElement?.textContent?.trim())) ?? "");
            await page.keyboard.press("ArrowDown");
        }
        expect(names).toContain("Contour trace");
        expect(names).toContain("Image overlay");
        const trace = page.getByRole("menuitemcheckbox", { name: "Contour trace" });
        await trace.focus();
        const was = await trace.getAttribute("aria-checked");
        await page.keyboard.press("Enter");
        await expect(trace).not.toHaveAttribute("aria-checked", was ?? "");
    });
});

test.describe("UIA-F-5 — at 390 every expanded canvas-dock control is visible and hittable", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("each control's centre hits that control, inside the viewport", async ({ page }) => {
        const viz = firstSavedViz();
        await page.goto(`/v/${viz.slug}`);
        await page.getByRole("tab", { name: "Canvas" }).click();
        await page.getByRole("button", { name: "Edit contour" }).first().hover();
        await expect(page.getByRole("button", { name: "Equation" }).first()).toBeVisible();
        await page.waitForTimeout(700);
        const res = await page.evaluate(() => {
            const anchor = document.querySelector(".controls-dock-anchor")!;
            return [...anchor.querySelectorAll<HTMLElement>("button[aria-label]")]
                .filter((b) => !b.closest("[inert]") && b.getClientRects().length)
                .map((b) => {
                    const r = b.getBoundingClientRect();
                    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                    return { name: b.getAttribute("aria-label"), ok: !!hit && (hit === b || b.contains(hit)), inView: r.left >= 0 && r.right <= innerWidth };
                });
        });
        expect(res.length).toBeGreaterThanOrEqual(4);
        for (const c of res) {
            expect(c.ok, `${c.name} is hittable`).toBe(true);
            expect(c.inView, `${c.name} is in view`).toBe(true);
        }
    });
});

test.describe("UIA-F-28 / UIA-F-29 / UIA-F-30 — the account group fits the dock at 390", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    /** Every named control's centre hits itself inside the viewport. */
    async function allHittable(page: Page, names: string[]) {
        for (const name of names) {
            const el = page.getByRole("button", { name }).or(page.getByRole("textbox", { name })).first();
            await expect(el, name).toBeVisible();
            const ok = await el.evaluate((b) => {
                const r = b.getBoundingClientRect();
                const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                return r.left >= 0 && r.right <= innerWidth && !!hit && (hit === b || b.contains(hit) || hit.contains(b));
            });
            expect(ok, `${name} visible and hittable`).toBe(true);
        }
    }

    test("F-28/F-29: the login form opens in a popover; its error wraps in its own line", async ({ page }) => {
        await page.route("**/api/sessions/login", (r) =>
            r.fulfill({ status: 404, contentType: "application/problem+json", body: JSON.stringify({ title: "Not found", status: 404, detail: "No account uses this slug — check the four words, or generate a new slug to start fresh." }) }),
        );
        await page.goto("/gallery");
        const dockBefore = await page.locator("header").first().evaluate((h) => h.getBoundingClientRect().width);
        await page.getByRole("button", { name: "Log in" }).click();
        const field = page.getByRole("textbox", { name: /Your slug/ });
        await field.fill("quiet-amber-lattice-fox");
        await allHittable(page, ["Your slug — four lowercase words joined by hyphens", "Generate a new slug", "Submit slug and log in"]);
        expect(await page.locator("header").first().evaluate((h) => h.getBoundingClientRect().width)).toBe(dockBefore);
        await page.getByRole("button", { name: "Submit slug and log in" }).click();
        const err = page.locator("#user-slug-error");
        await expect(err).toBeVisible();
        const e = await err.evaluate((p) => ({ sw: p.scrollWidth, cw: p.clientWidth, r: p.getBoundingClientRect().right }));
        expect(e.sw).toBeLessThanOrEqual(e.cw);
        expect(e.r).toBeLessThanOrEqual(390);
        await allHittable(page, ["Generate a new slug", "Submit slug and log in"]);
    });

    test("F-30: logged in, the account is one trigger and the dark-mode toggle stays on the plate", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem("fourier-user-slug", "quiet-amber-lattice-fox");
            localStorage.setItem("fourier-user-token", "e2e-token");
        });
        await page.goto("/gallery");
        const trigger = page.getByRole("button", { name: /^Account: |^Copy your slug$/ }).first();
        await expect(trigger).toBeAttached();
        await page.waitForTimeout(500);
        const toggle = page.locator(".dark-mode-toggle").first();
        await expect(toggle).toBeVisible();
        const t = await toggle.evaluate((b) => {
            const r = b.getBoundingClientRect();
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return { inView: r.right <= innerWidth, hit: !!hit && (hit === b || b.contains(hit)) };
        });
        expect(t).toEqual({ inView: true, hit: true });
        await page.getByRole("button", { name: /^Account: / }).click();
        await expect(page.getByRole("menuitem", { name: "Copy your slug" })).toBeVisible();
        await expect(page.getByRole("menuitem", { name: "Log out" })).toBeVisible();
    });
});

test.describe("UIA-F-22 — mobile paper search: one instance, and a tapped result navigates", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("one listbox, no duplicate ids, and tapping a result scrolls to it", async ({ page }) => {
        await page.goto("/paper");
        const scroller = page.locator(".paper-scroll");
        await expect.poll(() => scroller.evaluate((el) => el.scrollHeight), { timeout: 10_000 }).toBeGreaterThan(5000);
        await scroller.evaluate((el) => el.scrollTo({ top: 2500 }));
        await page.getByRole("button", { name: "Search paper" }).click();
        await page.keyboard.type("Parseval");
        const options = page.getByRole("option");
        await expect(options.first()).toBeVisible();
        const dupes = await page.evaluate(() => {
            const ids = [...document.querySelectorAll("[id]")].map((e) => e.id).filter((id) => id.startsWith("paper-search"));
            return ids.filter((id, i) => ids.indexOf(id) !== i).length;
        });
        expect(dupes).toBe(0);
        expect(await page.getByRole("listbox").count()).toBe(1);
        const before = await scroller.evaluate((el) => el.scrollTop);
        await options.first().tap();
        await expect.poll(() => scroller.evaluate((el) => el.scrollTop), { timeout: 10_000 }).not.toBe(before);
    });
});

test.describe("UIA-F-23 — the floating ToC's Close search closes with a query typed", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("one tap on Close search closes the search and it stays closed", async ({ page }) => {
        await page.goto("/paper");
        const scroller = page.locator(".paper-scroll");
        await expect.poll(() => scroller.evaluate((el) => el.scrollHeight), { timeout: 10_000 }).toBeGreaterThan(5000);
        await scroller.evaluate((el) => el.scrollTo({ top: 2500 }));
        await page.getByRole("button", { name: "Search paper" }).click();
        await page.keyboard.type("Parseval");
        await expect(page.getByRole("option").first()).toBeVisible();
        await page.getByRole("button", { name: "Close search" }).tap();
        await page.waitForTimeout(600);
        await expect(page.getByRole("button", { name: "Close search" })).toHaveCount(0);
        await expect(page.getByRole("listbox")).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Search paper" })).toBeVisible();
    });
});

test.describe("UIA-F-25 — the search palette has one dismissal owner", () => {
    test("no ✕ under Clear, and Esc collapses the palette keeping the query", async ({ page }) => {
        await page.goto("/paper");
        const field = page.getByRole("combobox", { name: "Search the paper" }).first();
        await field.fill("Parseval");
        // X.F.W14U.paper — UIA-F-159 retired the Expand control; ⌘K from the
        // field is the one way into the palette with the field's query.
        await field.press("ControlOrMeta+k");
        const dialog = page.getByRole("dialog", { name: "Search the paper" });
        await expect(dialog).toBeVisible();
        const clear = dialog.getByRole("button", { name: "Clear" });
        await expect(clear).toBeVisible();
        // Nothing else paints under Clear's centre (the ✕ used to).
        const underClear = await clear.evaluate((b) => {
            const r = b.getBoundingClientRect();
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return !!hit && (hit === b || b.contains(hit));
        });
        expect(underClear).toBe(true);
        await expect(dialog.locator('[data-slot="dialog-close"], .dialog-close')).toHaveCount(0);
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(field).toHaveValue("Parseval");
    });
});
