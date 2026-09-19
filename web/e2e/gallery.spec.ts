// SERVED MODEL: claude-opus-5[1m]
import { test, expect } from "@playwright/test";

import { ENTRY, stubGallery } from "./fixtures/gallery";

/**
 * X·F F.W9 `.b` — the S4 seat (`G-F9-7`), plus `G-F9-9` and `G-F9-10`.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * WHAT WAS WRONG WITH THIS FILE, MEASURED BEFORE IT WAS REWRITTEN
 * ════════════════════════════════════════════════════════════════════════════
 * Four of its six tests could not fail. Not "did not fail" — could not:
 *
 *   · `:21-22`  `expect(glassDock.or(searchInput)).toBeVisible()` — a mask.
 *     `/gallery` renders `GallerySearchBar`, a plain `<div role="search">`;
 *     `.glass-dock` is glass-ui's DOCK class and on this route nothing mounts
 *     one (it lives on `/visualize`, in `CanvasControlsDock`). The assertion
 *     passed on the right-hand side while claiming to check either, so deleting
 *     the search bar would have been caught only by luck. `FR-GSB-17`.
 *   · `:49-53`  `if (await glassDock.locator(".dock-layer--summary").isVisible()
 *     .catch(() => false))` — an expand branch for a dock that does not exist on
 *     this route. Unreachable, and the `.catch(() => false)` guaranteed silence.
 *   · `:58`     `if (await filterToggle.isVisible())` — the ENTIRE body of the
 *     filter test, including its only `expect`, sat inside this `if`. Delete the
 *     filter toggle and the test goes green. `FR-GSB-17`, verbatim shape.
 *   · `:72`     `if (await loginBtn.isVisible().catch(() => false))` — the same
 *     for the whole login test. `FR-USB-16`'s unguard half.
 *
 * `FR-GV-36` books the census of the class. `G-F9-7`'s falsifier is stated as a
 * property, so it can be checked rather than believed: **deleting the search
 * bar or the slug bar must redden its spec.** Every guard below asserts that
 * its precondition EXISTS. Nothing is conditional; nothing is `.catch`ed.
 *
 * ⊘ `C-M4` IS NOT FOLDED IN HERE. Its mechanism is different — a guard reading
 * the WRONG ELEMENT's `data-state` (a Tooltip's, not the Collapsible root's) —
 * and its cure is a `web/src` restructure owned by F.W3/W4. Folding it into
 * this seat would have hidden a distinct defect under a shared cure shape.
 *
 * ⊘ F.W9 OWNS GATES AND NO CURE. Nothing under `web/src/**` is touched by this
 * file; where an assertion is RED, it routes.
 */

/**
 * The fixtures live in `./fixtures/gallery` and are shared with F.W4's admin
 * axe keystone and this wave's visual checkpoint — authored once, cited three
 * times (§4a-7). `stubGallery` serves the list and its thumbnails; the reason
 * it is a network stub rather than a seeded database is recorded there.
 *
 * `G-F9-9` asks that a spec OPEN A CARD. A fresh CI database renders an empty
 * grid, so the card to be opened would not exist and the test would pass
 * vacuously — the very defect class this seat ends.
 */

test.describe("Gallery UX", () => {
    test("gallery page renders with tabs and search bar", async ({ page }) => {
        await stubGallery(page);
        await page.goto("/gallery");

        // GalleryView migrated BouncyToggle → glass-ui UnderlineTabs, which
        // renders `<button role="tab">` inside `role="tablist"` with the tab
        // label as the accessible name and `aria-selected` for active state.
        const galleryTab = page.getByRole("tab", { name: "Gallery" });
        const draftsTab = page.getByRole("tab", { name: "Drafts" });
        await expect(galleryTab).toBeVisible({ timeout: 30_000 });
        await expect(draftsTab).toBeVisible();

        // Gallery tab is active by default.
        await expect(galleryTab).toHaveAttribute("aria-selected", "true");

        // ── THE UNMASKED ASSERTION (`G-F9-7`, `FR-GSB-17`) ──
        // The search bar is ONE element on this route and it is asserted as
        // that one element. `GallerySearchBar` renders
        // `role="search" aria-label="Gallery search and filters"` around an
        // input labelled "Search gallery by slug" — both are the component's
        // own accessible contract, so this reddens the moment the bar is
        // deleted, moved off-route or stripped of its landmark.
        await expect(
            page.getByRole("search", { name: "Gallery search and filters" }),
        ).toBeVisible();
        await expect(page.getByRole("searchbox", { name: "Search gallery by slug" })).toBeVisible();
    });

    test("switching to drafts tab shows drafts section", async ({ page }) => {
        await stubGallery(page);
        await page.goto("/gallery");

        const draftsTab = page.getByRole("tab", { name: "Drafts" });
        await expect(draftsTab).toBeVisible({ timeout: 30_000 });
        await draftsTab.click();

        // Drafts tab becomes active (aria-selected is the UnderlineTabs contract).
        await expect(draftsTab).toHaveAttribute("aria-selected", "true");

        // Should show either drafts or the empty state ("No drafts yet." copy
        // from GalleryView's drafts-tab empty state).
        const draftsContent = page.getByText("No drafts yet").or(page.locator(".draft-item"));
        await expect(draftsContent.first()).toBeVisible({ timeout: 15_000 });
    });

    test("search bar filter drawer toggles", async ({ page }) => {
        await stubGallery(page);
        await page.goto("/gallery");

        // ── THE UN-VACUATED GUARD (`G-F9-7`) ──
        // Was: `if (await filterToggle.isVisible()) { … }` wrapping the only
        // assertion in the test, preceded by an expand branch for a dock this
        // route does not mount. Both are gone. The toggle is a REQUIRED
        // precondition and is asserted as one, by its accessible name rather
        // than by `.filter-toggle`, so a class rename does not silently
        // re-vacuate this.
        const filterToggle = page.getByRole("button", { name: "Filters and sorting" });
        await expect(filterToggle).toBeVisible({ timeout: 30_000 });

        // It is a disclosure: `aria-expanded` is its contract and the drawer's
        // existence is the consequence. Assert both, in order.
        await expect(filterToggle).toHaveAttribute("aria-expanded", "false");
        await filterToggle.click();
        await expect(filterToggle).toHaveAttribute("aria-expanded", "true");
        await expect(page.locator("#gallery-filter-drawer")).toBeVisible({ timeout: 10_000 });
    });

    test("login form shows emoji placeholder and dice button", async ({ page }) => {
        await stubGallery(page);
        await page.goto("/gallery");

        // ── THE UN-VACUATED GUARD (`G-F9-7`, `FR-USB-16`'s unguard half) ──
        // Was: `if (await loginBtn.isVisible().catch(() => false))` around the
        // whole body. The slug bar's logged-out state IS the default for an
        // anonymous run, so the login trigger is a precondition, not a
        // possibility. Deleting the slug bar now reddens this spec — which is
        // `G-F9-7`'s stated falsifier, checked rather than asserted.
        const loginBtn = page.getByRole("button", { name: "Log in" });
        await expect(loginBtn).toBeVisible({ timeout: 30_000 });
        await loginBtn.click();

        // The field is labelled ("Your slug — four lowercase words joined by
        // hyphens"); the emoji placeholder is the FORMAT hint beside it, and
        // both are asserted because `FR-USB-5` books the placeholder as the
        // only visible statement of the required shape.
        const slugInput = page.getByRole("textbox", { name: /Your slug/i });
        await expect(slugInput).toBeVisible({ timeout: 10_000 });
        await expect(slugInput).toHaveAttribute("placeholder", "your-slug-here 🐌");

        await expect(page.getByRole("button", { name: "Generate a new slug" })).toBeVisible();
    });

    test("a gallery card opens its modal and the modal names itself", async ({ page }) => {
        // ── `G-F9-9` ──
        // Born-RED witness, reproduced at these bytes before this test existed:
        // `grep -cE 'modal|dialog|card|Open Visualizer' web/e2e/gallery.spec.ts`
        // → 0. Six `test(` blocks and not one reached a card (`FR-GFC-27`), so
        // `GCM-42`'s console warnings, `GCM-22`'s `p-0` insets and `GCM-4`'s
        // unnamed dialog were all invisible to the suite by construction.
        await stubGallery(page);
        await page.goto("/gallery");

        // `GalleryCard` is a keyboard-accessible `role="button"` named
        // `Open ${entry.image_slug}` (D.W4.c). That name is the card's own
        // contract, so this does not depend on a layout class.
        const card = page.getByRole("button", { name: `Open ${ENTRY.image_slug}` });
        await expect(card).toBeVisible({ timeout: 30_000 });
        await card.click();

        // `GalleryCardModal` is a glass-ui `Dialog`; `GCM-4`'s cure gave it a
        // `<DialogTitle>` carrying the slug. A dialog is only usable if it is
        // NAMED, so the name is the assertion — not the box.
        const modal = page.getByRole("dialog");
        await expect(modal).toBeVisible({ timeout: 10_000 });
        await expect(modal).toHaveAccessibleName(ENTRY.image_slug);

        // The modal's terminal affordance, which is also the checkpoint surface
        // `G-F9-23` item 5 (GCM-22's `p-0` insets) needs opened.
        await expect(modal.getByText("Open Visualizer")).toBeVisible();
    });

    test("no console errors OR warnings on gallery page", async ({ page }) => {
        // ── `G-F9-10` ──
        // The guard filtered `msg.type() === "error"` only. `GCM-4` emits two
        // dev `console.warn`s per card open and `FR-EQR-3`'s four
        // zero-console-error gates were all reading through the same blind
        // spot: a warning was, by construction, not an event.
        //
        // §4a-9's INTERACTION LOCK ("no widening before F.W1 lands") is
        // RELEASED — F.W1 CLOSED 2026-09-18 — so the widening lands here, which
        // is the wave this spec's own §2.3 S4 row assigns it to.
        const messages: string[] = [];
        page.on("console", (msg) => {
            const type = msg.type();
            if (type === "error" || type === "warning") {
                messages.push(`[${type}] ${msg.text()}`);
            }
        });

        await stubGallery(page);
        await page.goto("/gallery");
        await expect(page.getByRole("tab", { name: "Gallery" })).toBeVisible({
            timeout: 30_000,
        });

        // ⊘ THE FILTER IS A TRANSPORT FILTER, NOT A DEFECT FILTER, AND THE
        // DISTINCTION IS WHY IT IS ALLOWED TO EXIST. Each entry below is a
        // browser-level fetch outcome that says nothing about the app's own
        // console hygiene; none of them can mask an app warning, because an app
        // warning does not contain these strings. Nothing app-authored is
        // filtered, and no entry was added to make a run pass.
        const real = messages.filter(
            (m) =>
                !m.includes("favicon") &&
                !m.includes("ERR_CONNECTION_REFUSED") &&
                !m.includes("Failed to load resource"),
        );
        expect(
            real,
            "console errors AND warnings on /gallery (the guard is no longer " +
                "blind to `warn` — GCM-4, FR-EQR-3):\n" +
                real.map((m) => `  • ${m}`).join("\n"),
        ).toEqual([]);
    });
});

test.describe("Visualizer overlay dock", () => {
    test("visualizer surfaces its overlay control dock", async ({ page }) => {
        await page.goto("/visualize");

        // Upload an image so the canvas + overlaid CanvasControlsDock mount.
        const fileInput = page.getByTestId("image-file-input");
        const testImage = new URL("../../assets/animals/golden-retriever.webp", import.meta.url)
            .pathname;
        await fileInput.setInputFiles(testImage);

        await page.waitForURL(/\/w\//, { timeout: 15_000 });

        // Wait for canvas (auto-compute populates `hasData`, which mounts the
        // top controls dock in `.controls-dock-anchor`).
        const canvas = page.locator("canvas").first();
        await expect(canvas).toBeVisible({ timeout: 60_000 });

        // `.glass-dock` IS reachable HERE — this is the route that mounts one,
        // which is exactly why the `/gallery` `.or()` mask above was a mask and
        // this is not. The dock starts collapsed; hovering expands it.
        const dock = page.locator(".controls-dock-anchor .glass-dock");
        await expect(dock).toBeVisible({ timeout: 10_000 });
        await dock.hover();

        // The dock's actions are keyed by aria-label (the dock idiom). "View
        // options" (image-overlay / contour-trace toggles) is the canonical
        // overlay affordance; "Fullscreen" is always present.
        await expect(dock.locator('[aria-label="View options"]')).toBeVisible({
            timeout: 5_000,
        });
    });
});
