// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";
import { ENTRY, stubGallery } from "./fixtures/gallery";

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
        await expect(page.getByText("1 loaded")).toBeVisible();
        expect(errors.filter((m) => /useCarousel/.test(m))).toEqual([]);
    });
});

/** The first public saved visualization on the served API (read-only GET). */
async function firstSavedViz(page: Page): Promise<{ slug: string; image_slug: string }> {
    const res = await page.request.get("/api/visualizations?limit=1");
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { items: { slug: string; image_slug: string }[] };
    expect(body.items.length, "the served API holds a saved visualization").toBeGreaterThan(0);
    return body.items[0];
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
        const viz = await firstSavedViz(page);
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
        const viz = await firstSavedViz(page);
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
        const viz = await firstSavedViz(page);
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
        const viz = await firstSavedViz(page);
        await page.goto(`/v/${viz.slug}`);
        const bar = page.locator(".mini-progress").first();
        await expect.poll(async () => Number(await bar.getAttribute("aria-valuenow")), { timeout: 10_000 }).toBeGreaterThan(0.2);
        const pause = page.getByRole("button", { name: "Pause animation" }).first();
        await pause.hover();
        await pause.click();
        await expect(page.getByRole("button", { name: "Play animation" }).first()).toBeAttached();

        async function exportWith(off: string[]): Promise<number> {
            const more = page.getByRole("button", { name: "More options" }).first();
            // The dock expands under the pointer; let its morph settle first.
            await page.getByRole("button", { name: "Play animation" }).first().hover();
            await page.waitForTimeout(800);
            await more.click();
            await page.getByRole("menuitem", { name: /export/i }).click();
            const dialog = page.getByRole("dialog", { name: "Export Frame" });
            for (const name of off) {
                await dialog.locator("label.option-row", { hasText: name }).getByRole("switch").click();
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
    const viz = await firstSavedViz(page);
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
        const viz = await firstSavedViz(page);
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
        await page.goto(`/v/${viz.slug}`);
        // The canvas dock expands under the pointer (its persistent control).
        await page.getByRole("button", { name: "Edit contour" }).first().hover();
        const publish = page.getByRole("button", { name: "Publish to Gallery" }).first();
        await expect(publish).toBeVisible();
        await page.waitForTimeout(600);
        await publish.dblclick();
        await expect(page.getByText(`Published! (${saved.slug})`, { exact: true })).toBeVisible({ timeout: 10_000 });
        expect(posts).toBe(1);
        await expect(page.getByText(/Could not save/i)).toHaveCount(0);
    });
});

test.describe("UIA-F-19 — one drop, one upload", () => {
    test("a file dropped over a loaded image sends exactly one POST /api/images", async ({ page }) => {
        const viz = await firstSavedViz(page);
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
