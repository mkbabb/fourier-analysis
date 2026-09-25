// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page, type Locator } from "@playwright/test";
import { ENTRY, PIXEL_PNG, stubGallery, stubAdminApi, ADMIN_TOKEN } from "./fixtures/gallery";
import { seededViz, SEED_NAMESPACE } from "./fixtures/seed";

/**
 * X.F.W14U.gallery — the gallery family (spec `F-W14U.md` Units :8-18; register
 * `audit/UI-AUDIT-fourier.md` sections gallery-public, gallery-card-modal,
 * gallery-drafts and visualization-saved F-96). One case per cured row; every
 * case frames the served page under `FW14U_PHASE` (before | after) BEFORE its
 * first assertion, so a RED case still banks its before frame.
 *
 * g39  UIA-F-39 (BROKEN) — search, tier and basis reach the server and narrow
 *      the grid (live API, the per-run global seed).
 * g46  UIA-F-46 (BROKEN) — Like is a persisted toggle (live API, the seed).
 * g96  UIA-F-96 — Open Visualizer routes to /v/<slug>.
 * g97  UIA-F-97 — the filter drawer dismisses on Escape and outside, and an
 *      outside tap at 390 opens nothing behind it.
 * g98  UIA-F-98 — the card is glass Card: --radius-card, no role=button div,
 *      no cartoon offset shadow, a native open button.
 * g99  UIA-F-99 — the title leads on the card and in a visible dialog header.
 * g101 g102 g103 g189 g190 g248 — the Drafts tab.
 * g184 g185 g186 g187 g188 g247 — the gallery's MEDIUM/LOW rows.
 *
 * Data: stubbed lists (`fixtures/gallery`) except g39/g46, which read the live
 * API through the per-run global seed (`e2e/global-seed.ts`).
 */

const PHASE = process.env.FW14U_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14u/gallery";

async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png` });
}

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

const FEATURED = { ...ENTRY, slug: "gilded-crane-orbit-two", image_slug: "img-gilded-crane", title: "Gilded crane orbit", tier: "featured" };
const SAVED = { ...ENTRY, slug: "quiet-heron-lattice-three", image_slug: "img-quiet-heron", title: "Quiet heron lattice", tier: "saved" };

/** A gallery card, by the title (after) or by the image slug (before). */
function cardByName(page: Page, e: { title?: string | null; image_slug: string }): Locator {
    const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const names = [e.title, e.image_slug].filter(Boolean).map((t) => esc(t!));
    return page.getByRole("button", { name: new RegExp(`^Open (${names.join("|")})$`) }).first();
}

async function openFilters(page: Page): Promise<void> {
    await page.getByRole("button", { name: "Filters and sorting" }).click();
    await expect(page.locator("#gallery-filter-drawer")).toBeVisible();
    // Frame the settled plate, not its enter animation.
    await page.locator("#gallery-filter-drawer").evaluate((el) =>
        Promise.all((el.closest('[role="dialog"]') ?? el).getAnimations({ subtree: true }).map((a) => a.finished)),
    );
}

/** Put local drafts into the app's IndexedDB store, then reload the Drafts tab. */
async function seedDrafts(page: Page, drafts: object[]): Promise<void> {
    await page.goto("/gallery");
    await page.getByRole("tab", { name: "Drafts" }).waitFor();
    await page.evaluate(
        (rows) =>
            new Promise<void>((resolve, reject) => {
                const open = indexedDB.open("fourier-drafts", 2);
                open.onupgradeneeded = () => {
                    const s = open.result.createObjectStore("drafts", { keyPath: "imageSlug" });
                    s.createIndex("by-visualization-slug", "visualizationSlug", { unique: false });
                };
                open.onsuccess = () => {
                    const tx = open.result.transaction("drafts", "readwrite");
                    for (const r of rows) tx.objectStore("drafts").put(r);
                    tx.oncomplete = () => (open.result.close(), resolve());
                    tx.onerror = () => reject(tx.error);
                };
                open.onerror = () => reject(open.error);
            }),
        drafts,
    );
    await page.reload();
    await page.getByRole("tab", { name: "Drafts" }).click();
}

function draft(imageSlug: string, withContour: boolean, minutesAgo: number) {
    return {
        imageSlug,
        contour: withContour ? { contour_hash: `h-${imageSlug}`, points: [[0, 0], [1, 0], [1, 1]] } : null,
        contourSettings: { n_harmonics: 50 },
        animationSettings: { active_bases: ["fourier-epicycles"] },
        epicycleData: null,
        basesData: null,
        savedSnapshots: [],
        lastOpenedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    };
}

// ── frames: /gallery at 1440 and 390, light and dark ─────────────────────────
for (const scheme of ["light", "dark"] as const) {
    for (const vp of [DESKTOP, PHONE]) {
        test.describe(`frames — /gallery ${vp.width} ${scheme}`, () => {
            test.use({ viewport: vp, colorScheme: scheme, hasTouch: vp.width < 1024 });
            test("grid, filters, modal, drafts", async ({ page }) => {
                await stubGallery(page, [FEATURED, ENTRY, SAVED]);
                await page.goto("/gallery");
                await expect(cardByName(page, ENTRY)).toBeVisible({ timeout: 30_000 });
                await frame(page, `grid-${scheme}`);
                await openFilters(page);
                await frame(page, `filters-${scheme}`);
                await page.keyboard.press("Escape");
                await page.mouse.click(5, vp.height - 5);
                await cardByName(page, ENTRY).click();
                await expect(page.getByRole("dialog")).toBeVisible();
                await frame(page, `modal-${scheme}`);
                await page.keyboard.press("Escape");
                await expect(page.getByRole("dialog")).toHaveCount(0);
                await seedDrafts(page, [draft("img-draft-one", true, 3), draft("img-draft-two", false, 40)]);
                await page.waitForTimeout(400);
                await frame(page, `drafts-${scheme}`);
            });
        });
    }
}

// ── BROKEN rows (live API, the per-run seed) ──────────────────────────────────
test.describe("g39 UIA-F-39 — search, tier and basis narrow on the server", () => {
    test.use({ viewport: DESKTOP });
    test("each control's value reaches GET /api/visualizations and the grid follows", async ({ page }) => {
        const viz = seededViz();
        const listed: URL[] = [];
        page.on("request", (r) => {
            const u = new URL(r.url());
            if (u.pathname === "/api/visualizations" && r.method() === "GET") listed.push(u);
        });
        const seedCard = page.locator(".gallery-card").filter({ hasText: new RegExp(`${viz.slug}|${viz.image_slug}`) });
        await page.goto("/gallery");
        await expect(seedCard.first()).toBeVisible({ timeout: 30_000 });
        await frame(page, "g39-loaded");

        // Search: no row matches → the request carries q, no card is left.
        const search = page.getByRole("searchbox");
        await search.fill("zzz-no-such-e2e");
        await expect.poll(() => listed.some((u) => u.searchParams.get("q") === "zzz-no-such-e2e"), { timeout: 5000 }).toBe(true);
        await expect(page.locator(".gallery-card")).toHaveCount(0);
        await frame(page, "g39-search-nomatch");
        // The seed's namespace matches its title → the seed returns.
        await search.fill(SEED_NAMESPACE);
        await expect.poll(() => listed.some((u) => u.searchParams.get("q") === SEED_NAMESPACE)).toBe(true);
        await expect(seedCard.first()).toBeVisible();
        await search.fill("");

        // Tier: the seed is untiered (normal) → Saved excludes it.
        await openFilters(page);
        await page.getByRole("combobox", { name: "Filter by tier" }).click();
        await page.getByRole("option", { name: "Saved" }).click();
        await expect.poll(() => listed.some((u) => u.searchParams.get("tier") === "saved")).toBe(true);
        await expect(seedCard).toHaveCount(0);
        await frame(page, "g39-tier-saved");
        await page.getByRole("combobox", { name: "Filter by tier" }).click();
        await page.getByRole("option", { name: "All tiers" }).click();
        await expect(seedCard.first()).toBeVisible();

        // Basis: the seed is fourier-epicycles → Legendre excludes it, Epicycles keeps it.
        await page.getByRole("radio", { name: /Legendre/ }).click();
        await expect.poll(() => listed.some((u) => u.searchParams.get("basis") === "legendre")).toBe(true);
        await expect(seedCard).toHaveCount(0);
        await page.getByRole("radio", { name: /Epicycles/ }).click();
        await expect.poll(() => listed.some((u) => u.searchParams.get("basis") === "fourier-epicycles")).toBe(true);
        await expect(seedCard.first()).toBeVisible();
        await frame(page, "g39-basis-epicycles");
    });
});

test.describe("g46 UIA-F-46 — Like is a toggle, and it persists", () => {
    test.use({ viewport: DESKTOP });
    test("press → liked (+1), press → unliked (−1), press → liked; a reload keeps it", async ({ page }) => {
        const viz = seededViz();
        const puts: boolean[] = [];
        page.on("request", (r) => {
            if (r.method() === "PUT" && new URL(r.url()).pathname === `/api/visualizations/${viz.slug}/like`) {
                puts.push((r.postDataJSON() as { liked: boolean }).liked);
            }
        });
        const openSeed = async () => {
            await page.goto("/gallery");
            const card = page.locator(".gallery-card").filter({ hasText: new RegExp(`${viz.slug}|${viz.image_slug}`) }).first();
            await expect(card).toBeVisible({ timeout: 30_000 });
            await card.getByRole("button", { name: /^Open / }).or(card.and(page.getByRole("button", { name: /^Open / }))).first().click();
            const dialog = page.getByRole("dialog");
            await expect(dialog).toBeVisible();
            return dialog.getByRole("button", { name: "Like" });
        };
        let like = await openSeed();
        const count = async () => Number((await like.innerText()).match(/\d+/)![0]);
        const n0 = await count();
        await frame(page, "g46-modal");
        await like.click();
        await expect.poll(() => puts.length, { timeout: 5000 }).toBe(1);
        await expect(like).toHaveAttribute("aria-pressed", "true");
        await expect.poll(count).toBe(n0 + 1);
        await like.click();
        await expect.poll(() => puts.length).toBe(2);
        await expect(like).toHaveAttribute("aria-pressed", "false");
        await expect.poll(count).toBe(n0);
        await like.click();
        await expect.poll(() => puts.length).toBe(3);
        expect(puts).toEqual([true, false, true]);
        await expect.poll(count).toBe(n0 + 1);
        like = await openSeed();
        await expect(like).toHaveAttribute("aria-pressed", "true");
        await expect.poll(count).toBe(n0 + 1);
        await frame(page, "g46-after-reload");
        // Leave the seed as found.
        await like.click();
        await expect.poll(() => puts.length).toBe(4);
    });
});

test.describe("g96 UIA-F-96 — Open Visualizer opens the saved entity", () => {
    test.use({ viewport: DESKTOP });
    test("the CTA routes to /v/<visualization slug>", async ({ page }) => {
        await stubGallery(page, [ENTRY]);
        await page.goto("/gallery");
        await cardByName(page, ENTRY).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await frame(page, "g96-modal");
        await dialog.getByRole("button", { name: /Open Visualizer/ }).click();
        await expect(page).toHaveURL(new RegExp(`/v/${ENTRY.slug}$`));
    });
});

for (const vp of [DESKTOP, PHONE]) {
    test.describe(`g97 UIA-F-97 — the filter drawer is a dismissable popover (${vp.width})`, () => {
        test.use({ viewport: vp, hasTouch: vp.width < 1024 });
        test("Escape and an outside press close it; the press opens nothing behind", async ({ page }) => {
            await stubGallery(page, [ENTRY]);
            await page.goto("/gallery");
            await expect(cardByName(page, ENTRY)).toBeVisible({ timeout: 30_000 });
            await openFilters(page);
            await frame(page, "g97-open");
            await page.keyboard.press("Escape");
            await expect(page.locator("#gallery-filter-drawer")).toBeHidden();
            await expect(page.getByRole("button", { name: "Filters and sorting" })).toBeFocused();
            // The card's box is read before the drawer opens: a modal popover
            // leaves the page behind it inert (out of the accessibility tree).
            const box = (await cardByName(page, ENTRY).boundingBox())!;
            await openFilters(page);
            // Press the card that sits outside the drawer.
            const drawer = (await page.locator("#gallery-filter-drawer").boundingBox())!;
            const y = Math.max(box.y + box.height - 8, drawer.y + drawer.height + 12);
            if (vp.width < 1024) await page.touchscreen.tap(box.x + 12, y);
            else await page.mouse.click(box.x + 12, y);
            await expect(page.locator("#gallery-filter-drawer")).toBeHidden();
            await expect(page.getByRole("dialog")).toHaveCount(0);
            await frame(page, "g97-dismissed");
        });
    });
}

/** The card element that carries the chrome (the article after, the div before). */
function cardRoot(page: Page, e: { title?: string | null; image_slug: string }): Locator {
    return page.locator(".gallery-card").filter({ has: cardByName(page, e) }).or(cardByName(page, e).and(page.locator(".gallery-card"))).first();
}

test.describe("g98 UIA-F-98 ⊕ g186 UIA-F-186 — the card is glass Card; tier, focus and selection separate", () => {
    test.use({ viewport: DESKTOP });
    test("radius --radius-card, no role=button div, no offset stamp; tier rim ≠ focus ink, elevation kept", async ({ page }) => {
        await stubGallery(page, [ENTRY, SAVED, FEATURED]);
        await page.goto("/gallery");
        const card = cardRoot(page, ENTRY);
        await expect(card).toBeVisible({ timeout: 30_000 });
        await frame(page, "g98-grid");
        const m = await card.evaluate((el) => {
            const cs = getComputedStyle(el);
            const probe = document.createElement("div");
            probe.style.borderRadius = "var(--radius-card)";
            el.parentElement!.appendChild(probe);
            const want = getComputedStyle(probe).borderTopLeftRadius;
            probe.remove();
            return { role: el.getAttribute("role"), radius: cs.borderTopLeftRadius, want, shadow: cs.boxShadow, isCard: el.classList.contains("card") };
        });
        expect(m.isCard, "glass Card").toBe(true);
        expect(m.role, "no role=button on the card box").toBeNull();
        expect(m.radius).toBe(m.want);
        expect(m.shadow, "no cartoon offset stamp").not.toMatch(/-3px 3px 0px/);
        expect(await card.locator("button.card-open, button[aria-label^='Open ']").count()).toBe(1);
        // F-186: the saved rim is not the focus ink, and a tiered card keeps its cast.
        const saved = cardRoot(page, SAVED);
        const t = await saved.evaluate((el) => {
            const cs = getComputedStyle(el);
            const ring = getComputedStyle(document.documentElement).getPropertyValue("--focus-ring-color").trim();
            return { border: cs.borderTopColor, ring, shadow: cs.boxShadow, accent: cs.getPropertyValue("--glass-accent").trim() };
        });
        expect(t.accent, "tier through --glass-accent").not.toBe("");
        expect(t.accent).not.toBe("transparent");
        expect(t.border).not.toBe(t.ring);
        expect(t.shadow).not.toBe("none");
    });
});

test.describe("g99 UIA-F-99 ⊕ g187 UIA-F-187 — the title leads; one basis vocabulary", () => {
    test.use({ viewport: DESKTOP });
    test("card and dialog show the title; names come from it; filter and badge share labels", async ({ page }) => {
        await stubGallery(page, [ENTRY]);
        await page.goto("/gallery");
        const card = cardRoot(page, ENTRY);
        await expect(card).toBeVisible({ timeout: 30_000 });
        await frame(page, "g99-card");
        await expect(card.getByText(ENTRY.title, { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: `Open ${ENTRY.title}` })).toHaveCount(1);
        await openFilters(page);
        const pill = page.locator("#gallery-filter-drawer").getByText("Epicycles");
        await expect(pill).toBeVisible();
        await expect(page.locator("#gallery-filter-drawer").getByText("Fourier", { exact: true })).toHaveCount(0);
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: `Open ${ENTRY.title}` }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await frame(page, "g99-modal");
        const heading = dialog.getByRole("heading", { name: ENTRY.title });
        await expect(heading).toBeVisible();
        const hb = (await heading.boundingBox())!;
        expect(hb.width * hb.height, "the DialogTitle is painted, not sr-only").toBeGreaterThan(40);
        await expect(dialog).toHaveAccessibleName(ENTRY.title);
        await expect(dialog).toHaveAccessibleDescription(new RegExp(ENTRY.slug));
    });
});

test.describe("g184 UIA-F-184 — one clear control, a query-aware empty state, Skeleton loading", () => {
    test.use({ viewport: DESKTOP });
    test("the native cancel is withdrawn; a nomatch names the query and clears; loading is skeletons", async ({ page }) => {
        let delay = 1500;
        await page.route("**/api/images/**", (r) => r.fulfill({ status: 200, contentType: "image/png", body: PIXEL_PNG }));
        await page.route("**/api/visualizations**", async (r) => {
            const q = new URL(r.request().url()).searchParams.get("q");
            await new Promise((res) => setTimeout(res, delay));
            await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: q ? [] : [ENTRY], next_cursor: null, has_more: false }) });
        });
        await page.goto("/gallery");
        await page.waitForTimeout(500);
        await frame(page, "g184-loading");
        expect(await page.locator(".animate-spin").count(), "no hand-rolled spinner").toBe(0);
        await expect(page.locator('[data-slot="skeleton"], .skeleton, [class*="skeleton"]').first()).toBeAttached();
        delay = 0;
        await expect(cardByName(page, ENTRY)).toBeVisible({ timeout: 30_000 });
        const search = page.getByRole("searchbox");
        // The engine's cancel glyph paints at the end of the field's content
        // box when it holds a value (Chromium reports no computed style for the
        // pseudo-element, so the paint is read): the strip there is identical
        // empty and filled when the glyph is withdrawn.
        await search.focus();
        const strip = await search.evaluate((el) => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return { x: r.right - parseFloat(cs.paddingRight) - 24, y: r.top + 4, width: 22, height: r.height - 8 };
        });
        const empty = await page.screenshot({ clip: strip });
        await search.fill("zzz");
        await page.waitForTimeout(100);
        const filled = await page.screenshot({ clip: strip });
        expect(filled.equals(empty), "the engine's cancel glyph is withdrawn (one clear control)").toBe(true);
        await expect(page.getByText("No visualizations match “zzz”.")).toBeVisible({ timeout: 10_000 });
        await frame(page, "g184-nomatch");
        await page.getByRole("button", { name: "Clear search and filters" }).click();
        await expect(search).toHaveValue("");
        await expect(cardByName(page, ENTRY)).toBeVisible();
    });
});

test.describe("g185 UIA-F-185 — the drawer's Selects keep the producer's sizing", () => {
    test.use({ viewport: DESKTOP });
    test("no consumer h-8 / rounded-lg / border override; the drawer is glass's plate", async ({ page }) => {
        await stubGallery(page, [ENTRY]);
        await page.goto("/gallery");
        await openFilters(page);
        await frame(page, "g185-open");
        const trig = page.getByRole("combobox", { name: "Filter by tier" });
        const cls = (await trig.getAttribute("class")) ?? "";
        expect(cls).not.toMatch(/\bh-8\b|\brounded-lg\b|border-foreground\/12/);
        const plate = await page.locator("#gallery-filter-drawer").evaluate((el) => !!el.closest('[role="dialog"], [data-slot="popover-content"], .popover-content'));
        expect(plate, "inside glass PopoverContent").toBe(true);
    });
});

test.describe("g188 UIA-F-188 ⊕ g247 UIA-F-247 — the modal's controls are glass's; gallery micro-issues", () => {
    test.use({ viewport: DESKTOP });
    test("tier is one 3-state ToggleGroup; the CTA is primary; no consumer rim; no chatter; no bounce", async ({ page }) => {
        await stubAdminApi(page, [ENTRY, FEATURED]);
        await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);
        const card = cardRoot(page, ENTRY);
        await expect(card).toBeVisible({ timeout: 30_000 });
        // F-247: no "N loaded" / "No more entries"; hover does not scale; the crown is the tier token.
        await expect(page.getByText(/\d+ loaded/)).toHaveCount(0);
        await expect(page.getByText("No more entries")).toHaveCount(0);
        await card.hover();
        await page.waitForTimeout(400);
        const tf = await card.evaluate((el) => getComputedStyle(el).transform);
        expect(tf === "none" || tf === "matrix(1, 0, 0, 1, 0, 0)", `hover transform ${tf}`).toBe(true);
        const crown = await page.locator(".featured-header svg").first().evaluate((el) => {
            const probe = document.createElement("span");
            probe.style.color = "var(--tier-featured)";
            el.parentElement!.appendChild(probe);
            const want = getComputedStyle(probe).color;
            probe.remove();
            return { got: getComputedStyle(el).color, want };
        });
        expect(crown.got).toBe(crown.want);
        const ph = await page.getByRole("searchbox").evaluate((el) => getComputedStyle(el).fontFamily);
        expect(ph, "the search field is not mono").not.toMatch(/Fira Code|mono/i);
        await cardByName(page, ENTRY).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await frame(page, "g188-admin-modal");
        await expect(dialog.getByRole("radiogroup", { name: "Tier" })).toBeVisible();
        await expect(dialog.getByRole("radiogroup", { name: "Tier" }).getByRole("radio")).toHaveCount(3);
        const cta = dialog.getByRole("button", { name: /Open Visualizer/ });
        expect(await cta.getAttribute("data-emphasis")).toBe("primary");
        const cls = (await dialog.getAttribute("class")) ?? "";
        expect(cls, "the producer plate is not re-bordered").not.toMatch(/border-2|border-foreground/);
        // F-247: the modal carries a DialogDescription.
        expect(await dialog.getAttribute("aria-describedby")).toBeTruthy();
    });
});

// ── Drafts ─────────────────────────────────────────────────────────────────
test.describe("g101 g102 g189 — the drafts are gallery cards with one keyboard action", () => {
    test.use({ viewport: DESKTOP });
    test("glass Card at --radius-card; no My Drafts disclosure; a Draft badge; a link opens /w/<slug>", async ({ page }) => {
        await stubGallery(page, []);
        await page.route("**/api/images/img-draft-broken/**", (r) => r.fulfill({ status: 404, body: "" }));
        await seedDrafts(page, [draft("img-draft-one", true, 3), draft("img-draft-broken", true, 10)]);
        const link = page.getByRole("link", { name: "img-draft-one" });
        await page.waitForTimeout(600);
        await frame(page, "g189-drafts");
        await expect(page.getByRole("button", { name: /My Drafts/ })).toHaveCount(0);
        await expect(link).toBeVisible();
        const card = page.locator("article.card").filter({ has: link });
        const r = await card.evaluate((el) => {
            const probe = document.createElement("div");
            probe.style.borderRadius = "var(--radius-card)";
            el.appendChild(probe);
            const want = getComputedStyle(probe).borderTopLeftRadius;
            probe.remove();
            return { got: getComputedStyle(el).borderTopLeftRadius, want };
        });
        expect(r.got).toBe(r.want);
        await expect(card.getByText("Draft", { exact: true })).toBeVisible();
        // F-189: a broken thumbnail paints no alt text.
        const broken = page.locator("article.card").filter({ has: page.getByRole("link", { name: "img-draft-broken" }) });
        await expect(broken.locator("img")).toHaveCount(0);
        // F-102: the link is reachable by keyboard and opens the workspace.
        await link.focus();
        await expect(link).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/w\/img-draft-one$/);
    });
    test("the empty Drafts state has its action", async ({ page }) => {
        await stubGallery(page, []);
        await page.goto("/gallery");
        await page.getByRole("tab", { name: "Drafts" }).click();
        await expect(page.getByText("No drafts yet.")).toBeVisible();
        await frame(page, "g189-empty");
        await expect(page.getByRole("button", { name: /Open the Visualizer/ })).toBeVisible();
    });
});

test.describe("g103 UIA-F-103 ⊕ g190 UIA-F-190 ⊕ g248 UIA-F-248 — publishing a draft", () => {
    test.use({ viewport: DESKTOP });
    test("the publishing row is busy, the others live; no-contour is disabled with a reason; the toast names the piece", async ({ page }) => {
        await stubGallery(page, []);
        await page.route("**/api/sessions", (r) => r.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ user_slug: "amber-fox-12", token: "t" }) }));
        const created = { ...ENTRY, slug: "bright-lattice-heron-fox", image_slug: "img-draft-one", title: null };
        await page.route("**/api/visualizations", async (r) => {
            if (r.request().method() !== "POST") return r.fallback();
            await new Promise((res) => setTimeout(res, 2500));
            await r.fulfill({ status: 201, contentType: "application/json", headers: { ETag: '"e"' }, body: JSON.stringify(created) });
        });
        await seedDrafts(page, [draft("img-draft-one", true, 3), draft("img-draft-two", true, 5), draft("img-draft-bare", false, 9)]);
        const pubOf = (slug: string) => page.locator("article.card, .draft-item").filter({ hasText: slug }).getByRole("button", { name: /^Publish/ });
        await expect(pubOf("img-draft-one")).toBeVisible();
        // F-190: a draft without a contour cannot be published, and says why.
        await expect(pubOf("img-draft-bare")).toBeDisabled();
        await expect(pubOf("img-draft-bare")).toHaveAccessibleDescription(/contour/i);
        await pubOf("img-draft-one").click();
        await page.waitForTimeout(300);
        await frame(page, "g103-publishing");
        await expect(pubOf("img-draft-one")).toHaveAttribute("aria-busy", "true");
        await expect(pubOf("img-draft-two")).toBeEnabled();
        // F-248: the toast names the published piece, and no "Publish failed" follows.
        // `.first()`: reka's toast also writes its text into a hidden live region.
        await expect(page.getByText(`Published ${created.slug}`).first()).toBeVisible({ timeout: 10_000 });
        await page.waitForTimeout(800);
        await expect(page.getByText(/Publish failed/)).toHaveCount(0);
    });
    test("logging out keeps the local drafts listed (one rule)", async ({ page }) => {
        await stubGallery(page, []);
        await page.route("**/api/sessions**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
        await page.addInitScript(() => {
            localStorage.setItem("fourier-user-slug", "amber-fox-12");
            localStorage.setItem("fourier-user-token", "t");
            localStorage.setItem("fourier-session-token", "t");
        });
        await seedDrafts(page, [draft("img-draft-one", true, 3)]);
        await expect(page.getByText("img-draft-one").first()).toBeVisible();
        await page.evaluate(async () => {
            const app = (document.querySelector("#app") as unknown as { __vue_app__: { config: { globalProperties: { $pinia: { _s: Map<string, { logout: () => Promise<void> }> } } } } }).__vue_app__;
            await app.config.globalProperties.$pinia._s.get("auth")!.logout();
        });
        await page.waitForTimeout(600);
        await frame(page, "g190-after-logout");
        await expect(page.getByRole("tab", { name: "Drafts" })).toHaveAttribute("aria-selected", "true");
        await expect(page.getByText("img-draft-one").first()).toBeVisible();
    });
});

test.describe("g248 UIA-F-248 — a draft card's hover is visible", () => {
    test.use({ viewport: DESKTOP });
    test("hovering a draft changes its paint", async ({ page }) => {
        await stubGallery(page, []);
        await seedDrafts(page, [draft("img-draft-one", true, 3)]);
        const row = page.locator("article.card, .draft-item").filter({ hasText: "img-draft-one" }).first();
        await expect(row).toBeVisible();
        await page.mouse.move(2, 2);
        // The row's elevation moves on hover (a 2 % tint was the invisible "hover").
        const paint = () => row.evaluate((el) => getComputedStyle(el).boxShadow);
        const rest = await paint();
        await row.hover();
        await page.waitForTimeout(500);
        const hover = await paint();
        await frame(page, "g248-hover");
        expect(hover).not.toBe(rest);
    });
});
