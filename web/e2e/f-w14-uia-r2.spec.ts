// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page } from "@playwright/test";
import { ENTRY, stubGallery } from "./fixtures/gallery";

/**
 * X.F.W14.u — Repair 2 continuation of the UIA-F register
 * (`value.js/docs/tranches/X/audit/UI-AUDIT-fourier.md`), BROKEN rows first.
 *
 * One falsifier per CONSUMER row cured at its cause in this sitting, named by
 * the row id. Each drives the served page (Vite dev at `BASE_URL`) and asserts
 * the row's "expected (canon)" reading.
 */

async function openPaper(page: Page) {
    await page.goto("/paper");
    const scroller = page.locator(".paper-scroll");
    await expect.poll(() => scroller.evaluate((el) => el.scrollHeight), { timeout: 15_000 }).toBeGreaterThan(5000);
    return scroller;
}

/** The element's top relative to the scroller's viewport, or null when it is not mounted. */
async function topInScroller(page: Page, id: string): Promise<number | null> {
    return page.evaluate((id) => {
        const el = document.getElementById(id);
        const s = document.querySelector(".paper-scroll");
        if (!el || !s) return null;
        return el.getBoundingClientRect().top - s.getBoundingClientRect().top;
    }, id);
}

test.describe("UIA-F-26 — Enter on a theorem result lands on that theorem", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    for (const { query, number, anchor } of [
        { query: "Residue Theorem", number: "4.2.1", anchor: "thm-residue" },
        { query: "Parseval's Identity", number: "2.10.2", anchor: "thm-parseval" },
    ]) {
        test(`Thm ${number} (${query}) scrolls #${anchor} into the viewport`, async ({ page }) => {
            const scroller = await openPaper(page);
            const field = page.getByRole("combobox", { name: "Search the paper" }).first();
            await field.fill(query);
            const row = page.getByRole("option").filter({ hasText: number }).first();
            await expect(row).toBeVisible();
            await field.focus();
            // Arrow to the theorem row, then Enter (the register's interaction).
            const selected = page.locator('[role="option"][aria-selected="true"]');
            for (let i = 0; i < 12; i++) {
                if (((await selected.count()) && (await selected.first().innerText()).includes(number))) break;
                await page.keyboard.press("ArrowDown");
            }
            await expect(selected.first()).toContainText(number);
            await page.keyboard.press("Enter");
            const h = await scroller.evaluate((el) => el.clientHeight);
            await expect
                .poll(() => topInScroller(page, anchor), { timeout: 15_000 })
                .not.toBeNull();
            await expect
                .poll(async () => {
                    const t = await topInScroller(page, anchor);
                    return t != null && t >= -4 && t < h;
                }, { timeout: 15_000 })
                .toBe(true);
        });
    }
});

test.describe("UIA-F-21 — paper search labels typeset their math", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    for (const query of ["convergence", "pipeline", "Parseval", "energy"]) {
        test(`"${query}": no raw TeX in any label, KaTeX present, no mark inside the math`, async ({ page }) => {
            await openPaper(page);
            const field = page.getByRole("combobox", { name: "Search the paper" }).first();
            await field.fill(query);
            await expect(page.getByRole("option").first()).toBeVisible();
            const read = await page.evaluate(() =>
                [...document.querySelectorAll('[role="option"] .paper-search-label')].map((label) => {
                    const clone = label.cloneNode(true) as HTMLElement;
                    clone.querySelectorAll(".katex").forEach((k) => k.remove());
                    return {
                        text: clone.textContent ?? "",
                        katex: label.querySelectorAll(".katex").length,
                        markInMath: label.querySelectorAll(".katex mark").length,
                    };
                }),
            );
            expect(read.length).toBeGreaterThan(0);
            // Some result for each query carries math (the register's frames).
            expect(read.some((r) => r.katex > 0)).toBe(true);
            for (const r of read) {
                expect(r.text, r.text).not.toMatch(/\$|\\[a-zA-Z]/);
                expect(r.markInMath).toBe(0);
            }
        });
    }
});

test.describe("UIA-F-46 — Like is a toggle (consumer half; the persisting endpoint routes to the server)", () => {
    test("a second press un-likes: the count returns and aria-pressed clears, in the modal and on the card", async ({ page }) => {
        await stubGallery(page, [ENTRY]);
        // X.F.W14U.gallery (UIA-F-46): the like persists through
        // PUT /api/visualizations/{slug}/like (`.srv`); the stub answers it.
        const like0 = { liked: false, likes: ENTRY.likes };
        await page.route(`**/api/visualizations/${ENTRY.slug}/like`, async (r) => {
            if (r.request().method() === "PUT") {
                const want = (r.request().postDataJSON() as { liked: boolean }).liked;
                if (want !== like0.liked) like0.likes += want ? 1 : -1;
                like0.liked = want;
            }
            await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ slug: ENTRY.slug, ...like0 }) });
        });
        await page.goto("/gallery");
        await page.getByRole("button", { name: `Open ${ENTRY.title}` }).first().click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        const like = dialog.locator("button[aria-pressed]").first();
        await expect(like).toHaveAttribute("aria-pressed", "false");
        await expect(like).toContainText(String(ENTRY.likes));
        await like.click();
        await expect(like).toHaveAttribute("aria-pressed", "true");
        await expect(like).toContainText(String(ENTRY.likes + 1));
        await like.click();
        await expect(like).toHaveAttribute("aria-pressed", "false");
        await expect(like).toContainText(String(ENTRY.likes));
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        const card = page.locator(".like-btn").first();
        await expect(card).toHaveAttribute("aria-pressed", "false");
        await expect(card).toContainText(String(ENTRY.likes));
    });
});

test.describe("UIA-F-63 / UIA-F-65 — the palette's empty and Clear states", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    async function openPalette(page: Page) {
        await openPaper(page);
        await page.locator("body").click({ position: { x: 5, y: 5 } });
        await page.keyboard.press("ControlOrMeta+k");
        const dialog = page.getByRole("dialog", { name: "Search the paper" });
        await expect(dialog).toBeVisible();
        return dialog;
    }

    test("F-63: the open, empty palette does not say 'No results'; a real miss does", async ({ page }) => {
        const dialog = await openPalette(page);
        await expect(dialog.getByRole("combobox")).toHaveValue("");
        await page.waitForTimeout(300);
        await expect(dialog.getByText("No results")).toHaveCount(0);
        await dialog.getByRole("combobox").fill("qqqqzzzzxxxx");
        await expect(dialog.getByText("No results")).toBeVisible();
    });

    test("F-65: Clear empties the field, keeps the palette open and focuses its input", async ({ page }) => {
        const dialog = await openPalette(page);
        const input = dialog.getByRole("combobox");
        await input.fill("Parseval");
        await expect(dialog.getByRole("option").first()).toBeVisible();
        await dialog.getByRole("button", { name: "Clear" }).click();
        await page.waitForTimeout(300);
        await expect(dialog).toBeVisible();
        await expect(input).toHaveValue("");
        await expect(input).toBeFocused();
        await expect(dialog.getByRole("option")).toHaveCount(0);
    });
});

test.describe("UIA-F-59 — the inline results panel is sized to its content on the producer's menu plate", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("the panel is at least 22rem, inside the viewport, at --radius-card, on the menu plate", async ({ page }) => {
        await openPaper(page);
        const field = page.getByRole("combobox", { name: "Search the paper" }).first();
        await field.fill("Fourier Transform");
        const panel = page.locator(".paper-search-results");
        await expect(panel).toBeVisible();
        const read = await panel.evaluate((el) => {
            const cs = getComputedStyle(el);
            const probe = document.createElement("div");
            probe.style.borderRadius = "var(--radius-card)";
            el.appendChild(probe);
            const card = getComputedStyle(probe).borderTopLeftRadius;
            probe.remove();
            const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
            const r = el.getBoundingClientRect();
            return {
                width: r.width, right: r.right, vw: window.innerWidth, rem,
                radius: cs.borderTopLeftRadius, card,
                plate: el.classList.contains("glass-overlay-plate") && el.getAttribute("data-reveal") === "menu",
            };
        });
        expect(read.width, JSON.stringify(read)).toBeGreaterThanOrEqual(22 * read.rem);
        expect(read.right).toBeLessThanOrEqual(read.vw);
        expect(read.radius).toBe(read.card);
        expect(read.plate).toBe(true);
    });
});

test.describe("UIA-F-62 — the mobile search bar: one clear, one close, no Expand", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("the floating bar drops Expand; 'Clear search' clears and keeps the search open", async ({ page }) => {
        const scroller = await openPaper(page);
        await scroller.evaluate((el) => el.scrollTo({ top: 2500 }));
        await page.getByRole("button", { name: "Search paper" }).click();
        const input = page.getByRole("combobox", { name: "Search the paper" }).locator("visible=true").first();
        await input.fill("Parseval");
        await expect(page.getByRole("option").first()).toBeVisible();
        await expect(page.getByRole("button", { name: /Expand the search palette/ }).locator("visible=true")).toHaveCount(0);
        await page.getByRole("button", { name: "Clear search" }).locator("visible=true").tap();
        await page.waitForTimeout(400);
        await expect(page.getByRole("button", { name: "Close search" })).toBeVisible();
        await expect(input).toHaveValue("");
        await expect(input).toBeFocused();
    });
});
