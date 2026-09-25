// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";
import { ENTRY, stubGallery } from "./fixtures/gallery";

/**
 * X.F.W14U.misc — the remaining register sections (spec `F-W14U.md` Units
 * :8-18; register `audit/UI-AUDIT-fourier.md` morph-demo,
 * shape-extractor-internal, root-redirect-and-404, and visualization-saved
 * UIA-F-246), plus the rows carried here by `.gallery` (R-1, F-96's route
 * morph) and `.shell` (R-1 F-57's morph remainder, R-2 F-256's logout limb).
 * One case per row; the frame cases bank the served page under `FW14U_PHASE`
 * (before | after) at 1440 and 390.
 */

const PHASE = process.env.FW14U_PHASE ?? "after";

/**
 * The blocked-storage cases (UIA-F-120 / UIA-F-213) read the PRODUCTION
 * bundle, served by `vite preview` (which proxies `/api` like the dev server).
 * On the dev server, pinia's development-only devtools hook reads
 * `localStorage` unguarded while the store installs
 * (`getTimelineLayersStateFromStorage`), so blocked storage crashes any dev page
 * before the app's own code runs; the shipped bundle carries no such hook.
 * `playwright.config.ts`'s `webServer` builds and serves it on :4190 (Repair 1,
 * C1-3), so the suite owns this instrument.
 */
const PROD = process.env.FW14U_MISC_PROD ?? "http://localhost:4190";
const FRAMES = "e2e/screenshots/f-w14u/misc";

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png`, fullPage: false });
}

/** Site data blocked: reading either storage property throws, as a browser with storage blocked does. */
async function blockStorage(page: Page): Promise<void> {
    await page.addInitScript(() => {
        for (const area of ["localStorage", "sessionStorage"]) {
            Object.defineProperty(window, area, {
                configurable: true,
                get() {
                    throw new DOMException("The operation is insecure.", "SecurityError");
                },
            });
        }
    });
}

/**
 * Uncaught page errors, collected from the first script on. A handled storage
 * refusal that a library logs (vueuse's `useStorage` reports its guarded read
 * through `console.error` by default — glass's colour-scheme store) is not a
 * crash and is not counted; whether each page WORKS is asserted by what it
 * renders.
 */
function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    return errors;
}

/** Count `startViewTransition` calls and the transitions that were aborted before they finished. */
async function watchViewTransitions(page: Page): Promise<void> {
    await page.addInitScript(() => {
        const w = window as unknown as { __vt: { started: number; aborted: number } };
        w.__vt = { started: 0, aborted: 0 };
        const start = document.startViewTransition?.bind(document);
        if (!start) return;
        document.startViewTransition = ((arg: unknown) => {
            w.__vt.started++;
            const t = start(arg as never);
            t.finished.catch(() => undefined);
            t.ready.catch(() => {
                w.__vt.aborted++;
            });
            return t;
        }) as typeof document.startViewTransition;
    });
}

async function vt(page: Page): Promise<{ started: number; aborted: number }> {
    return page.evaluate(() => (window as unknown as { __vt: { started: number; aborted: number } }).__vt);
}

const stage = (page: Page) => page.getByRole("button", { name: "Morph between the sun and moon shapes" });
const tiles = (page: Page) => page.locator(".levels-card .grid-cell");

async function openMorph(page: Page): Promise<void> {
    await page.goto("/morph");
    await expect(stage(page)).toBeVisible({ timeout: 30_000 });
    await expect(tiles(page).first()).toBeVisible({ timeout: 30_000 });
}

// ── Frames (before | after), 1440 and 390 ────────────────────────────────
for (const vp of [DESKTOP, PHONE]) {
    for (const scheme of ["light", "dark"] as const) {
        test.describe(`frames ${vp.width} ${scheme}`, () => {
            test.use({ viewport: vp, colorScheme: scheme });
            test("morph idle · shape extractor · unknown route · storage blocked", async ({ page }) => {
                test.setTimeout(120_000);
                await openMorph(page);
                await page.waitForTimeout(400);
                await frame(page, `morph-idle-${scheme}`);
                await page.goto("/demo/shape-extractor");
                await expect(page.locator("#extract-status")).toContainText(/xtracted \d+ sun/, { timeout: 15_000 });
                await frame(page, `shape-extractor-${scheme}`);
                await page.goto("/nope");
                await page.waitForTimeout(400);
                await frame(page, `unknown-${scheme}`);
            });
        });
    }
    test.describe(`frames ${vp.width} storage blocked`, () => {
        test.use({ viewport: vp });
        test("the root with site data blocked", async ({ page }) => {
            await blockStorage(page);
            await page.goto(`${PROD}/`);
            await page.waitForTimeout(1500);
            await frame(page, "storage-blocked-root");
        });
    });
}

// ── /morph ────────────────────────────────────────────────────────────────
test.describe("m115 UIA-F-115 — the morph stage is the page's dominant content (1440)", () => {
    test.use({ viewport: DESKTOP });
    test("a large stage beside the controls", async ({ page }) => {
        await openMorph(page);
        const s = await stage(page).boundingBox();
        const card = await page.locator(".config-card").first().boundingBox();
        expect(s!.width, "stage width").toBeGreaterThanOrEqual(400);
        // The controls sit beside the stage, not under it.
        expect(card!.x, "controls column starts right of the stage").toBeGreaterThanOrEqual(s!.x + s!.width);
        expect(card!.y, "controls start level with the stage").toBeLessThan(s!.y + s!.height);
    });
});

test.describe("m115 UIA-F-115 — the stage stays in view while tuning (390)", () => {
    test.use({ viewport: PHONE });
    test("scrolled to the level strip, the stage is still on screen", async ({ page }) => {
        await openMorph(page);
        await tiles(page).last().scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        const s = await stage(page).boundingBox();
        expect(s!.y, "stage top on screen").toBeGreaterThanOrEqual(0);
        expect(s!.y + s!.height, "stage bottom on screen").toBeLessThanOrEqual(PHONE.height);
        expect(s!.height, "stage keeps a useful size").toBeGreaterThanOrEqual(120);
    });
});

test.describe("m117 UIA-F-117 — the readouts never move the controls (390)", () => {
    test.use({ viewport: PHONE });
    test("the first control keeps its place through a whole morph", async ({ page }) => {
        await openMorph(page);
        const top = () =>
            page.locator(".config-card").first().evaluate((e) => Math.round(e.getBoundingClientRect().top));
        const rest = await top();
        await stage(page).click();
        const seen = new Set<number>();
        for (let i = 0; i < 30; i++) {
            seen.add(await top());
            await page.waitForTimeout(40);
        }
        seen.add(await top());
        expect([...seen], "control top across the morph").toEqual([rest]);
        // One readout row: the mobile and desktop copies are one.
        await expect(page.locator(".demo-info")).toHaveCount(1);
    });
});

test.describe("m208 UIA-F-208 — mid-morph, the controls that are dropped look disabled", () => {
    test.use({ viewport: DESKTOP });
    test("tiles and Reset are disabled and the stage is busy while it morphs", async ({ page }) => {
        await openMorph(page);
        await stage(page).click();
        await expect(stage(page)).toHaveAttribute("aria-busy", "true");
        const n = await tiles(page).count();
        for (let i = 0; i < n; i++) await expect(tiles(page).nth(i)).toBeDisabled();
        await expect(page.getByRole("button", { name: "Reset" })).toBeDisabled();
        await expect(stage(page)).not.toHaveAttribute("aria-busy", "true", { timeout: 10_000 });
        await expect(tiles(page).first()).toBeEnabled();
    });
});

test.describe("m209 UIA-F-209 — the number fields keep a field's measure at 390", () => {
    test.use({ viewport: PHONE });
    test("no field renders as a circle", async ({ page }) => {
        await openMorph(page);
        const boxes = await page
            .locator('main [role="spinbutton"]')
            .evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ w: r.width, h: r.height })));
        expect(boxes.length).toBeGreaterThan(0);
        for (const b of boxes) expect(b.w / b.h, `field ${b.w}x${b.h}`).toBeGreaterThanOrEqual(1.5);
    });
});

test.describe("m210 UIA-F-210 — a preview tile previews; it never rewrites the range", () => {
    test.use({ viewport: PHONE });
    test("Low and High hold, the chosen tile is in view, the strip fades where it continues", async ({ page }) => {
        await openMorph(page);
        const low = page.getByRole("spinbutton", { name: "Low" });
        const high = page.getByRole("spinbutton", { name: "High" });
        const before = [await low.inputValue(), await high.inputValue()];
        const strip = page.locator(".levels-card .grid");
        // A strip that continues past its right edge says so.
        const mask = () => strip.evaluate((e) => getComputedStyle(e).maskImage || getComputedStyle(e).webkitMaskImage);
        expect(await mask(), "fading edge while the strip continues").toMatch(/gradient/);
        const target = tiles(page).nth(2);
        await target.click();
        await page.waitForTimeout(600);
        expect([await low.inputValue(), await high.inputValue()], "range after a preview").toEqual(before);
        const inView = await target.evaluate((t) => {
            const s = t.closest(".grid")!.getBoundingClientRect();
            const r = t.getBoundingClientRect();
            return r.left >= s.left - 1 && r.right <= s.right + 1;
        });
        expect(inView, "the chosen tile is inside the strip's view").toBe(true);
    });
});

test.describe("m254 UIA-F-254 — /morph's micro-issues", () => {
    test.use({ viewport: DESKTOP });
    test("no nested scroller · Export is secondary by the stage · bound tiles not in a basis hue", async ({ page }) => {
        await openMorph(page);
        const ov = await page.locator(".demo-page").evaluate((e) => {
            const cs = getComputedStyle(e);
            return [cs.overflowX, cs.overflowY];
        });
        for (const o of ov) expect(["visible", "clip"], "demo-page overflow").toContain(o);
        const exp = page.getByRole("button", { name: /Export|Copied/ });
        await expect(exp).not.toHaveAttribute("data-emphasis", "primary");
        const s = (await stage(page).boundingBox())!;
        const e = (await exp.boundingBox())!;
        expect(e.y - (s.y + s.height), "Export sits just under the stage").toBeLessThanOrEqual(120);
        expect(e.y, "Export below the stage's top").toBeGreaterThan(s.y);
        const legendre = await page.evaluate(() => {
            const p = document.createElement("i");
            p.style.color = "var(--viz-legendre)";
            document.body.append(p);
            const c = getComputedStyle(p).color;
            p.remove();
            return c;
        });
        const bound = await page.locator(".grid-cell.is-bound").first().evaluate((e) => getComputedStyle(e).borderTopColor);
        expect(bound, "bound tile edge").not.toBe(legendre);
    });
});

test.describe("m57 UIA-F-57 (.shell R-1, the morph remainder) — the tile label sits on a named rung", () => {
    test.use({ viewport: DESKTOP });
    test("the n= label is on the caption rung, not the dead text-sm", async ({ page }) => {
        await openMorph(page);
        const [label, caption] = await page.locator(".grid-label").first().evaluate((e) => {
            const probe = document.createElement("span");
            probe.style.fontSize = "var(--type-caption)";
            e.parentElement!.append(probe);
            const c = parseFloat(getComputedStyle(probe).fontSize);
            probe.remove();
            return [parseFloat(getComputedStyle(e).fontSize), c];
        });
        expect(label, `label ${label}px vs caption rung ${caption}px`).toBeCloseTo(caption, 1);
    });
});

// ── /demo/shape-extractor ────────────────────────────────────────────────
async function openExtractor(page: Page): Promise<void> {
    await page.goto("/demo/shape-extractor");
    await expect(page.locator("#extract-status")).toContainText(/xtracted \d+ sun/, { timeout: 15_000 });
}

for (const vp of [DESKTOP, PHONE]) {
    test.describe(`x118 UIA-F-118 — the extractor output is a readable, copyable holder (${vp.width})`, () => {
        test.use({ viewport: vp });
        test("multi-line, on a surface at the field radius, with a Copy control", async ({ page }) => {
            await openExtractor(page);
            const out = page.locator("#output");
            const r = await out.evaluate((e) => {
                const cs = getComputedStyle(e);
                const probe = document.createElement("i");
                probe.style.borderRadius = "var(--radius-field)";
                document.body.append(probe);
                const field = getComputedStyle(probe).borderTopLeftRadius;
                probe.remove();
                return {
                    lines: (e.textContent ?? "").split("\n").length,
                    h: e.getBoundingClientRect().height,
                    radius: cs.borderTopLeftRadius,
                    field,
                    surface: !!e.closest('[data-slot="card"]'),
                };
            });
            expect(r.lines, "pretty-printed").toBeGreaterThan(20);
            expect(r.h, "holder height").toBeGreaterThanOrEqual(120);
            expect(r.radius).toBe(r.field);
            expect(r.surface, "on a glass Card").toBe(true);
            await expect(page.getByRole("button", { name: /Copy/ })).toBeVisible();
        });
    });
}

test.describe("x211 UIA-F-211 — the extractor has a heading hierarchy, glass frames and a centred column (1440)", () => {
    test.use({ viewport: DESKTOP });
    test("title rung above body, subjects on Cards, the column centred and bounded", async ({ page }) => {
        await openExtractor(page);
        const h = await page.evaluate(() => {
            const px = (s: string) => parseFloat(getComputedStyle(document.querySelector(s)!).fontSize);
            return { h1: px("main h1"), h2: px("main h2"), body: parseFloat(getComputedStyle(document.body).fontSize) };
        });
        expect(h.h1, "h1 above body").toBeGreaterThan(h.body * 1.3);
        expect(h.h2, "h2 above body").toBeGreaterThan(h.body);
        expect(h.h1).toBeGreaterThan(h.h2);
        const framed = await page.locator(".subject-svg").evaluateAll((els) => els.map((e) => !!e.closest('[data-slot="card"]')));
        expect(framed).toEqual([true, true]);
        const col = await page.locator(".extractor-page").evaluate((e) => {
            const r = e.getBoundingClientRect();
            return { l: r.left, r: window.innerWidth - r.right, w: r.width };
        });
        expect(col.w, "bounded measure").toBeLessThanOrEqual(1000);
        expect(Math.abs(col.l - col.r), "centred").toBeLessThanOrEqual(24);
    });
});

test.describe("x255 UIA-F-255 — the extractor's micro-issues", () => {
    test.use({ viewport: DESKTOP });
    test("titled and noindexed · the extract action reports each run", async ({ page }) => {
        await openExtractor(page);
        await expect(page).toHaveTitle(/Shape extractor/i);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
        const before = await page.locator("#extract-status").textContent();
        await page.getByRole("button", { name: /Extract shape contours/i }).click();
        await expect(page.locator("#extract-status")).not.toHaveText(before ?? "");
    });
});

// ── routing, storage, the saved entity ───────────────────────────────────
const current = (page: Page) => page.locator('.app-dock [aria-current="page"]');

test.describe("r119 UIA-F-119 — the dock's section comes from the route's meta", () => {
    test.use({ viewport: DESKTOP });
    test("trailing slash and /v/ mark Visualize; tools and unknown paths mark none", async ({ page }) => {
        await stubGallery(page);
        for (const [url, label] of [
            ["/visualize/", "Visualize"],
            [`/v/${ENTRY.slug}`, "Visualize"],
            ["/morph", "Morph"],
        ] as const) {
            await page.goto(url);
            await expect(current(page), url).toHaveCount(1, { timeout: 30_000 });
            await expect(current(page), url).toContainText(label);
        }
        for (const url of ["/demo/shape-extractor", "/nope"]) {
            await page.goto(url);
            await expect(page.locator(".app-dock")).toBeVisible({ timeout: 30_000 });
            await expect(current(page), url).toHaveCount(0);
        }
    });
});

test.describe("r212 UIA-F-212 — one remembered-tab writer, from the route's meta", () => {
    test.use({ viewport: DESKTOP });
    test("a saved visualization and a trailing-slash path are remembered as Visualize", async ({ page }) => {
        await stubGallery(page);
        for (const url of [`/v/${ENTRY.slug}`, "/visualize/"]) {
            await page.goto("/gallery");
            await expect(page.locator(".app-dock")).toBeVisible({ timeout: 30_000 });
            await page.goto(url);
            await expect(current(page)).toContainText("Visualize", { timeout: 30_000 });
            await page.goto("/");
            await expect(page, `after ${url}`).toHaveURL(/\/visualize$/, { timeout: 30_000 });
        }
    });
});

for (const vp of [DESKTOP, PHONE]) {
    test.describe(`r120 UIA-F-120 — blocked site data never white-screens the app (${vp.width})`, () => {
        test.use({ viewport: vp });
        test("the root redirects and the shell mounts; the pages this unit owns render", async ({ page }) => {
            const errors = collectErrors(page);
            await blockStorage(page);
            await page.goto(`${PROD}/`);
            await expect(page).toHaveURL(/\/paper$/, { timeout: 30_000 });
            await expect(page.locator(".app-dock")).toBeVisible({ timeout: 30_000 });
            // /paper's own storage readers (PaperToc, PaperView) belong to
            // `.t` / `.paper`: carried (R-1), logged here and not asserted.
            const paperErrors = errors.splice(0);
            console.log(`[r120 /paper, carried] pageerrors=${paperErrors.length}`);
            await page.goto(`${PROD}/morph`);
            await expect(stage(page)).toBeVisible({ timeout: 30_000 });
            // X.F.W14V.au6 — A2-FO-L1-24 (d): the extractor is a dev-only route
            // (the dev-server read is `e2e/f-w14v-au6.spec.ts`); in the
            // production bundle its path is the not-found page, which renders
            // with site data blocked too.
            await page.goto(`${PROD}/demo/shape-extractor`);
            await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible({ timeout: 15_000 });
            expect(errors).toEqual([]);
        });
    });
}

test.describe("r213 UIA-F-213 — a storage write after boot never crashes (auth)", () => {
    test.use({ viewport: DESKTOP });
    test("logging in with site data blocked keeps the session in memory", async ({ page }) => {
        const errors = collectErrors(page);
        await blockStorage(page);
        await page.route("**/api/sessions/login", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ user_slug: "quiet-amber-lattice-fox", token: "e2e-token" }),
            }),
        );
        await page.goto(`${PROD}/gallery`);
        await page.getByRole("button", { name: "Log in" }).click();
        await page.getByRole("textbox", { name: /Your slug/ }).fill("quiet-amber-lattice-fox");
        await page.keyboard.press("Enter");
        await expect(page.getByRole("button", { name: /^Account: / })).toBeVisible({ timeout: 15_000 });
        expect(errors).toEqual([]);
    });
});

test.describe("v246 UIA-F-246 — /s/ resolves to the entity it names", () => {
    test.use({ viewport: DESKTOP });
    test("a saved visualization's slug opens /v/; an image slug opens /w/", async ({ page }) => {
        await page.route("**/api/visualizations/**", (route) =>
            route.request().url().includes(`/api/visualizations/${ENTRY.slug}`)
                ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ENTRY) })
                : route.fulfill({
                      status: 404,
                      contentType: "application/problem+json",
                      body: JSON.stringify({ type: "about:blank", title: "Not Found", status: 404 }),
                  }),
        );
        await page.goto(`/s/${ENTRY.slug}`);
        await expect(page).toHaveURL(new RegExp(`/v/${ENTRY.slug}$`), { timeout: 30_000 });
        await page.route("**/api/images/some-image-slug", (route) =>
            route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ slug: "some-image-slug" }) }),
        );
        await page.goto("/s/some-image-slug");
        await expect(page).toHaveURL(/\/w\/some-image-slug$/, { timeout: 30_000 });
        // A slug that names neither stays, and says it is not found.
        await page.route("**/api/images/no-such-slug", (route) =>
            route.fulfill({
                status: 404,
                contentType: "application/problem+json",
                body: JSON.stringify({ type: "about:blank", title: "Not Found", status: 404 }),
            }),
        );
        await page.goto("/s/no-such-slug");
        await expect(page).toHaveTitle(/Not found/, { timeout: 30_000 });
        await expect(page).toHaveURL(/\/s\/no-such-slug$/);
    });
});

test.describe("v246 UIA-F-246 ⊕ g96 UIA-F-96 (.gallery R-1) — one view transition per navigation", () => {
    test.use({ viewport: DESKTOP });
    test("gallery → saved visualization morphs once", async ({ page }) => {
        await watchViewTransitions(page);
        await stubGallery(page);
        await page.goto("/gallery");
        const open = page.locator(".card-open").first();
        await expect(open).toBeVisible({ timeout: 30_000 });
        await open.click();
        const cta = page.getByRole("button", { name: /Open Visualizer/ });
        await expect(cta).toBeVisible({ timeout: 10_000 });
        await cta.click();
        await expect(page).toHaveURL(new RegExp(`/v/${ENTRY.slug}$`), { timeout: 30_000 });
        await page.waitForTimeout(800);
        expect(await vt(page)).toEqual({ started: 1, aborted: 0 });
    });
});

test.describe("a256 UIA-F-256 (.shell R-2) — a failed logout is reported, not toasted as done", () => {
    test.use({ viewport: DESKTOP });
    test("the server refuses the delete: an error, and the account stays", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem("fourier-user-slug", "quiet-amber-lattice-fox");
            localStorage.setItem("fourier-user-token", "e2e-token");
        });
        await page.route("**/api/sessions", (route) =>
            route.request().method() === "DELETE"
                ? route.fulfill({
                      status: 500,
                      contentType: "application/problem+json",
                      body: JSON.stringify({ type: "about:blank", title: "Internal Server Error", status: 500 }),
                  })
                : route.fallback(),
        );
        await page.goto("/gallery");
        await page.getByRole("button", { name: /^Account: / }).click();
        await page.getByRole("menuitem", { name: /Log out/ }).click();
        const notes = page.getByRole("region", { name: /Notifications/ }).locator("li");
        await expect(notes.filter({ hasText: /log out|logout|session/i })).toHaveCount(1, { timeout: 10_000 });
        await expect(notes.filter({ hasText: /^Logged out$/ })).toHaveCount(0);
        await expect(page.getByRole("button", { name: /^Account: / })).toBeVisible();
    });
});
