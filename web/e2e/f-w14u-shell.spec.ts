// SERVED MODEL: claude-opus-5-5
import { existsSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ADMIN_TOKEN, ENTRY, stubAdminApi, stubGallery } from "./fixtures/gallery";

/**
 * X.F.W14U.shell — the shell family (spec `F-W14U.md` Units :8-18; register
 * `audit/UI-AUDIT-fourier.md` sections shell-app-dock, shell-about-popover,
 * shell-login-inline, shell-nav-dropdown, toasts). One case per row (a few
 * rows share a case where one reading answers both); the frame cases bank the
 * served page under `FW14U_PHASE` (before | after) at 1440 and 390, light and
 * dark.
 */

const PHASE = process.env.FW14U_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14u/shell";

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const SLUG = "quiet-amber-lattice-fox";

/** A pictograph anywhere in a string (the placeholder's snail, About's party popper). */
const PICTOGRAPH = /\p{Extended_Pictographic}/u;

async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png`, fullPage: false });
}

async function loggedIn(page: Page): Promise<void> {
    await page.addInitScript((slug) => {
        localStorage.setItem("fourier-user-slug", slug);
        localStorage.setItem("fourier-user-token", "e2e-token");
    }, SLUG);
}

/** The toasts on screen (reka's viewport list; the hidden announcer is not counted). */
function toasts(page: Page) {
    return page.getByRole("region", { name: /Notifications/ }).locator("li");
}

async function openLogin(page: Page): Promise<void> {
    await page.goto("/gallery");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("textbox", { name: /Your slug/ })).toBeVisible({ timeout: 10_000 });
}

async function dockBox(page: Page) {
    return page.locator(".app-dock").evaluate((d) => {
        const r = d.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
    });
}

for (const vp of [DESKTOP, PHONE]) {
    test.describe(`s52 UIA-F-52 — the login surface moves focus in, returns it, dismisses (${vp.width})`, () => {
        test.use({ viewport: vp });
        test("open focuses the field; Escape and an outside press close and return focus", async ({ page }) => {
            await openLogin(page);
            await expect(page.getByRole("textbox", { name: /Your slug/ })).toBeFocused();
            await page.keyboard.press("Escape");
            await expect(page.getByRole("textbox", { name: /Your slug/ })).toHaveCount(0);
            await expect(page.getByRole("button", { name: "Log in" })).toBeFocused();
            await page.getByRole("button", { name: "Log in" }).click();
            await expect(page.getByRole("textbox", { name: /Your slug/ })).toBeVisible();
            await page.mouse.click(vp.width / 2, vp.height - 40);
            await expect(page.getByRole("textbox", { name: /Your slug/ })).toHaveCount(0);
        });
    });

    test.describe(`s55 UIA-F-55 ⊕ s53 UIA-F-53 — the dock row never morphs for the form (${vp.width})`, () => {
        test.use({ viewport: vp });
        test("opening the form and a slug error leave the dock box unchanged", async ({ page }) => {
            await page.goto("/gallery");
            await expect(page.getByRole("button", { name: "Log in" })).toBeVisible({ timeout: 30_000 });
            const before = await dockBox(page);
            await page.getByRole("button", { name: "Log in" }).click();
            const field = page.getByRole("textbox", { name: /Your slug/ });
            await field.fill("Not A Slug");
            expect(await dockBox(page)).toEqual(before);
            await field.press("Enter");
            await expect(page.getByRole("alert").filter({ hasText: /slug/i })).toBeVisible();
            expect(await dockBox(page)).toEqual(before);
        });
    });
}

test.describe("s54 UIA-F-54 ⊕ s153 UIA-F-153 — one face per control, no plate inside the dock", () => {
    test.use({ viewport: DESKTOP });
    test("logged in: the account is one trigger; every dock control is a dock face; no bordered plate", async ({ page }) => {
        await loggedIn(page);
        await page.goto("/gallery");
        const account = page.getByRole("group", { name: "Account" });
        await expect(account.getByRole("button", { name: /^Account: / })).toBeVisible({ timeout: 30_000 });
        expect(await account.getByRole("button").count()).toBe(1);
        const read = await page.locator(".app-dock").evaluate((dock) => {
            const faces: string[] = [];
            const plates: string[] = [];
            for (const el of dock.querySelectorAll<HTMLElement>("*")) {
                // The dock's own surface (glass's `.dock-plate`) is the one plate allowed.
                if (el.closest("[data-reka-popper-content-wrapper]") || el.classList.contains("dock-plate")) continue;
                const cs = getComputedStyle(el);
                const isControl = el.matches("button, a[href]");
                if (isControl && el.getBoundingClientRect().width > 0) {
                    if (!/\bdock-(trigger|icon-button|tab-button)\b/.test(el.className.toString())) faces.push(el.getAttribute("aria-label") ?? el.className.toString());
                }
                if (!isControl && !el.closest("button, a") && parseFloat(cs.borderTopWidth) > 0 && parseFloat(cs.borderTopLeftRadius) > 12) plates.push(el.className.toString());
            }
            return { faces, plates };
        });
        expect(read.faces, "controls that are not a dock face").toEqual([]);
        expect(read.plates, "bordered rounded plates nested in the dock").toEqual([]);
    });
});

test.describe("s155 UIA-F-155 — the field says what is wrong, on one channel", () => {
    test.use({ viewport: DESKTOP });
    test("a malformed slug is named on blur, before any Enter", async ({ page }) => {
        await openLogin(page);
        const field = page.getByRole("textbox", { name: /Your slug/ });
        await field.fill("Not A Slug");
        await page.keyboard.press("Tab");
        await expect(page.getByText("A slug is four lowercase words joined by hyphens.")).toBeVisible();
        await expect(field).toHaveAttribute("aria-invalid", "true");
    });
    test("a server failure is reported in the field only (no toast), Generate too", async ({ page }) => {
        await page.route("**/api/sessions/login", (r) =>
            r.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ detail: "User not found" }) }),
        );
        await page.route("**/api/sessions", (r) =>
            r.request().method() === "POST"
                ? r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ title: "Service Unavailable", status: 503, detail: "Registration is paused — try again in a minute." }) })
                : r.fallback(),
        );
        await openLogin(page);
        await page.getByRole("textbox", { name: /Your slug/ }).fill(SLUG);
        await page.getByRole("button", { name: "Submit slug and log in" }).click();
        await expect(page.locator("#user-slug-error")).toBeVisible();
        await page.waitForTimeout(800);
        expect(await toasts(page).count(), "a login failure also toasted").toBe(0);
        await page.getByRole("button", { name: "Generate a new slug" }).click();
        await expect(page.locator("#user-slug-error")).toContainText("Registration is paused");
        await page.waitForTimeout(800);
        expect(await toasts(page).count(), "a generate failure also toasted").toBe(0);
    });
});

test.describe("s232 UIA-F-232 — the login micro-issues", () => {
    test.use({ viewport: DESKTOP, permissions: ["clipboard-read", "clipboard-write"] });
    test("a readable identity, a quiet placeholder, glass emphasis, and copy is announced", async ({ page }) => {
        await openLogin(page);
        const placeholder = await page.getByRole("textbox", { name: /Your slug/ }).getAttribute("placeholder");
        expect(PICTOGRAPH.test(placeholder ?? ""), `placeholder "${placeholder}"`).toBe(false);
        await page.keyboard.press("Escape");
        await loggedIn(page);
        await page.goto("/gallery");
        const trigger = page.getByRole("button", { name: /^Account: / });
        await expect(trigger).toBeVisible({ timeout: 30_000 });
        const face = (await trigger.innerText()).trim();
        expect(face, "the abbreviation is not an identity").not.toMatch(/^[a-z](-[a-z])+$/);
        expect(face).toContain("quiet");
        await trigger.click();
        const copy = page.getByRole("menuitem", { name: /Copy your slug/ });
        await copy.click();
        const live = page.locator('[aria-live="polite"]:not([role="region"])').filter({ hasText: /copied/i });
        await expect(live).toHaveCount(1);
        await trigger.click();
        const colourClasses = await page.getByRole("menu").evaluate((m) =>
            [...m.querySelectorAll("[class]")].map((e) => e.className.toString()).filter((c) => /\btext-(success|destructive|primary)\b/.test(c)),
        );
        expect(colourClasses).toEqual([]);
    });
});

test.describe("s121 UIA-F-121 — no raw HTTP status as the message", () => {
    test.use({ viewport: DESKTOP });
    test("an unknown slug and a refused admin token say what happened, not 'Not Found' / 'Forbidden'", async ({ page }) => {
        await stubGallery(page);
        await page.route("**/api/sessions/login", (r) =>
            r.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ detail: "Not Found" }) }),
        );
        await page.route("**/api/admin/verify", (r) =>
            r.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ detail: "Forbidden" }) }),
        );
        await page.goto(`/gallery?admin=not-the-token`);
        const toast = toasts(page).first();
        await expect(toast).toBeVisible({ timeout: 30_000 });
        await frame(page, "toast-admin-error");
        const said = (await toast.innerText()).replace(/\s+/g, " ");
        expect(said).not.toMatch(/\bForbidden\b/);
        expect(said).toMatch(/admin token/i);
        await page.getByRole("button", { name: "Log in" }).click();
        await page.getByRole("textbox", { name: /Your slug/ }).fill(SLUG);
        await page.getByRole("button", { name: "Submit slug and log in" }).click();
        const err = page.locator("#user-slug-error");
        await expect(err).toBeVisible();
        expect((await err.innerText()).trim()).not.toMatch(/^Not Found$/i);
        await expect(err).toContainText(/slug/i);
    });
    test("the gallery route's duplicate problemMessage is gone (one reader, lib/api-problem)", () => {
        expect(existsSync("src/components/visualization/gallery/adminError.ts")).toBe(false);
    });
});

test.describe("s214 UIA-F-214 — toast policy", () => {
    test.use({ viewport: DESKTOP });
    test("no tone-echo title; an error stays until dismissed", async ({ page }) => {
        await stubGallery(page);
        await page.route("**/api/sessions/login", (r) =>
            r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user_slug: SLUG, token: "t" }) }),
        );
        await page.route("**/api/admin/verify", (r) =>
            r.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ detail: "Forbidden" }) }),
        );
        await openLogin(page);
        await page.getByRole("textbox", { name: /Your slug/ }).fill(SLUG);
        await page.getByRole("button", { name: "Submit slug and log in" }).click();
        const ok = toasts(page).first();
        await expect(ok).toBeVisible({ timeout: 10_000 });
        expect((await ok.innerText()).replace(/\s+/g, " ")).not.toMatch(/\b(Success|Info|Error)\b/);
        await page.goto(`/gallery?admin=not-the-token`);
        const bad = toasts(page).first();
        await expect(bad).toBeVisible({ timeout: 30_000 });
        expect((await bad.innerText()).replace(/\s+/g, " ")).not.toMatch(/\bError\b/);
        await page.waitForTimeout(7_000);
        await expect(bad, "an actionable error auto-dismissed").toBeVisible();
    });
    test("a failed morph Export copy reports itself", async ({ page }) => {
        await page.addInitScript(() => {
            Object.defineProperty(navigator, "clipboard", {
                configurable: true,
                value: { writeText: () => Promise.reject(new DOMException("denied", "NotAllowedError")) },
            });
        });
        await page.goto("/morph");
        const exportBtn = page.getByRole("button", { name: "Export", exact: true });
        await expect(exportBtn).toBeVisible({ timeout: 30_000 });
        await exportBtn.click();
        await expect(toasts(page).filter({ hasText: /cop/i }).first()).toBeVisible({ timeout: 10_000 });
    });
});

/** One local draft with a contour in the app's IndexedDB store (the `.gallery` seeding shape). */
async function seedDraft(page: Page): Promise<void> {
    await page.goto("/gallery");
    await page.getByRole("tab", { name: "Drafts" }).waitFor();
    await page.evaluate(
        (row) =>
            new Promise<void>((resolve, reject) => {
                const open = indexedDB.open("fourier-drafts", 2);
                open.onupgradeneeded = () => {
                    const s = open.result.createObjectStore("drafts", { keyPath: "imageSlug" });
                    s.createIndex("by-visualization-slug", "visualizationSlug", { unique: false });
                };
                open.onsuccess = () => {
                    const tx = open.result.transaction("drafts", "readwrite");
                    tx.objectStore("drafts").put(row);
                    tx.oncomplete = () => (open.result.close(), resolve());
                    tx.onerror = () => reject(tx.error);
                };
                open.onerror = () => reject(open.error);
            }),
        {
            imageSlug: "img-draft-one",
            contour: { contour_hash: "h-img-draft-one", points: [[0, 0], [1, 0], [1, 1]] },
            contourSettings: { n_harmonics: 50 },
            animationSettings: { active_bases: ["fourier-epicycles"] },
            epicycleData: null,
            basesData: null,
            savedSnapshots: [],
            lastOpenedAt: new Date(Date.now() - 180_000).toISOString(),
        },
    );
    await page.reload();
    await page.getByRole("tab", { name: "Drafts" }).click();
}

test.describe("s256 UIA-F-256 ⊕ UIA-F-248 (View) — the publish toast names the piece and offers it", () => {
    test.use({ viewport: DESKTOP });
    test("no parenthesised slug; a View action opens the piece", async ({ page }) => {
        await stubGallery(page, []);
        await page.route("**/api/sessions", (r) => r.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ user_slug: "amber-fox-12", token: "t" }) }));
        const created = { ...ENTRY, slug: "bright-lattice-heron-fox", image_slug: "img-draft-one", title: null };
        await page.route("**/api/visualizations", (r) =>
            r.request().method() === "POST"
                ? r.fulfill({ status: 201, contentType: "application/json", headers: { ETag: '"e"' }, body: JSON.stringify(created) })
                : r.fallback(),
        );
        await seedDraft(page);
        await page.getByRole("button", { name: /^Publish/ }).first().click();
        const toast = toasts(page).filter({ hasText: created.slug }).first();
        await expect(toast).toBeVisible({ timeout: 10_000 });
        expect(await toast.innerText()).not.toContain(`(${created.slug})`);
        await toast.getByRole("button", { name: "View" }).click();
        await expect(page).toHaveURL(new RegExp(`/v/${created.slug}$`), { timeout: 10_000 });
    });
});

async function openAbout(page: Page) {
    await page.goto("/gallery");
    await page.getByRole("button", { name: "About Fourier analysis" }).click();
    const card = page.locator("[data-reka-popper-content-wrapper]").filter({ hasText: /orthogonal/i });
    await expect(card).toBeVisible({ timeout: 10_000 });
    return card;
}

test.describe("s57 UIA-F-57 ⊕ s154 UIA-F-154 ⊕ s233 UIA-F-233 (About) ⊕ s219 UIA-F-219 — the About card", () => {
    test.use({ viewport: DESKTOP });
    test("a type ramp under the body size; glass Separator; the house ring; content that earns its place; no offset literal", async ({ page }) => {
        const card = await openAbout(page);
        const read = await card.evaluate((c) => {
            const body = parseFloat(getComputedStyle(document.body).fontSize);
            const links = [...c.querySelectorAll<HTMLAnchorElement>("a[href]")];
            const texts = [...c.querySelectorAll<HTMLElement>("a, p, span")].filter((e) => e.childElementCount === 0 && e.textContent!.trim());
            return {
                body,
                sizes: texts.map((e) => parseFloat(getComputedStyle(e).fontSize)),
                hr: c.querySelectorAll("hr").length,
                separators: c.querySelectorAll('[role="separator"], [data-orientation][class*="separator"]').length,
                links: links.map((a) => ({ href: a.href, ring: a.classList.contains("focus-ring") })),
                text: c.textContent ?? "",
                classes: [...c.querySelectorAll("[class]")].map((e) => e.className.toString()).join(" "),
            };
        });
        expect(read.sizes.every((s) => s < read.body), `sizes ${read.sizes} vs body ${read.body}`).toBe(true);
        expect(read.hr).toBe(0);
        expect(read.separators).toBeGreaterThan(0);
        expect(read.links.every((l) => l.ring)).toBe(true);
        expect(read.links.filter((l) => /github\.com/.test(l.href)).length, "two GitHub links").toBe(1);
        expect(PICTOGRAPH.test(read.text)).toBe(false);
        expect(read.text, "the tagline echoes the wordmark").not.toMatch(/Fourier analysis/);
        expect(read.classes).not.toMatch(/hover-card-content/);
        const gap = await page.evaluate(() => {
            const t = document.querySelector('[aria-label="About Fourier analysis"]')!.getBoundingClientRect();
            const c = document.querySelector("[data-reka-popper-content-wrapper] > *")!.getBoundingClientRect();
            return Math.round(c.top - t.bottom);
        });
        expect(gap, "the consumer's 10px side-offset literal").not.toBe(10);
    });
});

/**
 * X.F.W14V `.nav` — OWNER-RULING RE-BASELINE (COHESION §0dw, reversing UIA-F-151's
 * tab limb): "this should be a dropdown, not expanded out into paper,
 * visualize, etc." The s151 case asserted, at 1440, the `nav[aria-label=Sections]`
 * row of five links with `aria-current` on Gallery, NO Navigate button, and a
 * link click moving `aria-current` to Equation. Each of those assertions is
 * re-pointed, none dropped: the row is asserted ABSENT, the Navigate trigger
 * asserted as the ONE nav affordance, the five sections are its menu items with
 * `aria-current` on the active one, and a keyboard open → select → close
 * round-trip moves `aria-current` to Equation — at 1440, 1024, 768 and 390.
 */
for (const vp of [DESKTOP, { width: 1024, height: 768 }, { width: 768, height: 1024 }, PHONE]) {
    test.describe(`s151 (re-baselined, §0dw) — the sections are one dropdown (${vp.width})`, () => {
        test.use({ viewport: vp });
        test("one Navigate trigger, no Sections tab row; the menu marks the current section; keyboard open/close", async ({ page }) => {
            await page.goto("/gallery");
            const trigger = page.getByRole("button", { name: /^Navigate/ });
            await expect(trigger).toBeVisible({ timeout: 30_000 });
            await expect(trigger).toHaveCount(1);
            await expect(page.getByRole("navigation", { name: "Sections" })).toHaveCount(0);
            await trigger.focus();
            await page.keyboard.press("Enter");
            const menu = page.getByRole("menu");
            await expect(menu).toBeVisible();
            for (const label of ["Paper", "Visualize", "Gallery", "Equation", "Morph"]) {
                await expect(menu.getByRole("menuitem", { name: label })).toBeVisible();
            }
            await expect(menu.getByRole("menuitem", { name: "Gallery" })).toHaveAttribute("aria-current", "page");
            await page.keyboard.press("Escape");
            await expect(menu).toHaveCount(0);
            await expect(trigger).toBeFocused();
            await page.keyboard.press("Enter");
            await expect(menu).toBeVisible();
            await menu.getByRole("menuitem", { name: "Equation" }).focus();
            await page.keyboard.press("Enter");
            await expect(page).toHaveURL(/\/equation$/);
            await expect(menu).toHaveCount(0);
            await trigger.click();
            await expect(page.getByRole("menu").getByRole("menuitem", { name: "Equation" })).toHaveAttribute("aria-current", "page");
        });
    });
}

test.describe("s128 UIA-F-128 ⊕ s233 (nav) ⊕ s231 UIA-F-231 — the phone nav menu", () => {
    test.use({ viewport: PHONE });
    test("no local current-row tint or plate literals; a visible label; one press reaches About", async ({ page }) => {
        await page.goto("/gallery");
        const trigger = page.getByRole("button", { name: /^Navigate/ });
        await expect(trigger).toBeVisible({ timeout: 30_000 });
        expect((await trigger.innerText()).trim(), "the phone trigger has no visible label").toBe("Gallery");
        await trigger.click();
        const menu = page.getByRole("menu");
        await expect(menu).toBeVisible();
        const read = await menu.evaluate((m) => {
            const rows = [...m.querySelectorAll<HTMLElement>('[role="menuitem"]')];
            const cur = rows.find((r) => r.getAttribute("aria-current") === "page")!;
            const other = rows.find((r) => r !== cur)!;
            const glow = [...m.querySelectorAll("svg")].some((s) => getComputedStyle(s).filter !== "none");
            return { curBg: getComputedStyle(cur).backgroundColor, otherBg: getComputedStyle(other).backgroundColor, glow, cls: m.className.toString() };
        });
        expect(read.curBg, "a local tint on the current row").toBe(read.otherBg);
        expect(read.glow, "icon glow filters").toBe(false);
        expect(read.cls).not.toMatch(/nav-dropdown/);
        // Non-modal: with the menu open, one press on the logo opens About.
        await page.getByRole("button", { name: "About Fourier analysis" }).click();
        await expect(page.locator("[data-reka-popper-content-wrapper]").filter({ hasText: /orthogonal/i })).toBeVisible();
    });
    test("an unknown route does not claim a section", async ({ page }) => {
        await page.goto("/nope-not-a-route");
        const trigger = page.getByRole("button", { name: /^Navigate/ });
        await expect(trigger).toBeVisible({ timeout: 30_000 });
        await expect(trigger).not.toHaveAccessibleName(/current section Paper/);
    });
});

test.describe("s152 UIA-F-152 ⊕ s130 UIA-F-130 — the dock's gutter and one face for the theme control", () => {
    test.use({ viewport: DESKTOP });
    test("the header clears content by its gutter; the theme control is a dock face in the dock cell", async ({ page }) => {
        await page.goto("/paper");
        const header = page.locator("header.app-header");
        await expect(header).toBeVisible({ timeout: 30_000 });
        const pad = await header.evaluate((h) => {
            const cs = getComputedStyle(h);
            return { top: cs.paddingTop, bottom: cs.paddingBottom };
        });
        expect(parseFloat(pad.bottom)).toBeGreaterThan(0);
        expect(pad.bottom).toBe(pad.top);
        const toggle = page.getByRole("button", { name: "Dark mode" });
        const cls = await toggle.getAttribute("class");
        expect(cls).toMatch(/\bdock-(icon-button|tab-button|trigger)\b/);
        const [t, l] = await Promise.all([toggle.boundingBox(), page.getByRole("button", { name: "Log in" }).boundingBox()]);
        expect(Math.round(t!.height)).toBe(Math.round(l!.height));
        await expect(toggle).toHaveAttribute("aria-pressed", /^(true|false)$/);
    });
});

test.describe("s150 UIA-F-150 ⊕ s144 UIA-F-144 (consumer) — one admin state, one Log out", () => {
    test.use({ viewport: DESKTOP });
    test("no admin disc in the dock; the account menu carries the admin state; one Log out", async ({ page }) => {
        await loggedIn(page);
        await stubAdminApi(page, [ENTRY]);
        await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);
        await expect(page.getByRole("region", { name: "Admin mode banner" })).toBeVisible({ timeout: 60_000 });
        expect(await page.locator(".app-dock .admin-badge, .app-dock [title='Admin mode active']").count()).toBe(0);
        await page.getByRole("button", { name: /^Account: / }).click();
        await expect(page.getByRole("menu").getByText("Admin mode")).toBeVisible();
        const logOuts = await page.locator("button:visible, [role='menuitem']:visible").filter({ hasText: /^\s*Log out\s*$/ }).count();
        expect(logOuts, "two controls read Log out").toBe(1);
    });
});

// ── frames: the shell's states at 1440 and 390, light and dark ───────────────
for (const scheme of ["light", "dark"] as const) {
    for (const vp of [DESKTOP, PHONE]) {
        test.describe(`frames ${scheme} ${vp.width}`, () => {
            test.use({ viewport: vp, colorScheme: scheme });
            test("dock, login, error, About, nav, account", async ({ page }) => {
                await page.goto("/gallery");
                await expect(page.getByRole("button", { name: "Log in" })).toBeVisible({ timeout: 30_000 });
                await page.waitForTimeout(400);
                await frame(page, `dock-${scheme}`);
                await page.getByRole("button", { name: "Log in" }).click();
                await page.getByRole("textbox", { name: /Your slug/ }).fill("Not A Slug");
                await page.getByRole("textbox", { name: /Your slug/ }).press("Enter");
                await page.waitForTimeout(300);
                await frame(page, `login-error-${scheme}`);
                await page.keyboard.press("Escape");
                await page.getByRole("button", { name: "About Fourier analysis" }).click();
                await page.waitForTimeout(300);
                await frame(page, `about-${scheme}`);
                await page.keyboard.press("Escape");
                const navBtn = page.getByRole("button", { name: /^Navigate/ });
                if (await navBtn.count()) {
                    await navBtn.click();
                    await page.waitForTimeout(300);
                    await frame(page, `nav-${scheme}`);
                    await page.keyboard.press("Escape");
                }
                await loggedIn(page);
                await page.goto("/gallery");
                await page.getByRole("button", { name: /^Account: / }).click();
                await page.waitForTimeout(300);
                await frame(page, `account-${scheme}`);
            });
        });
    }
}
