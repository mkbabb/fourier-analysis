// SERVED MODEL: claude-opus-5-5
import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * X.F.W14U.paper — the paper family's UI-audit rows (register
 * `audit/UI-AUDIT-fourier.md`, sections paper-desktop / paper-search-inline /
 * paper-search-modal / paper-mobile-floating-toc), on the post-`.t` merged ToC
 * (`PaperToc.vue`, one component, two presentations; since X.F.W14V.au5 the one `PaperTocTree` in two hosts).
 *
 * One case per row (or per row limb). Every figure is read from the served
 * page. `FW14U_PHASE` names the frame set (before | after).
 */

const PHASE = process.env.FW14U_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14u/paper";
const DESKTOP = { width: 1440, height: 900 } as const;
const PHONE = { width: 390, height: 844 } as const;

async function openPaper(page: Page): Promise<Locator> {
    await page.goto("/paper");
    await expect(page.locator(".paper-article h1")).toBeVisible({ timeout: 60_000 });
    const scroller = page.locator(".paper-scroll");
    await expect
        .poll(() => scroller.evaluate((el) => el.scrollHeight), { timeout: 15_000 })
        .toBeGreaterThan(5000);
    return scroller;
}

function inlineField(page: Page): Locator {
    return page.getByRole("combobox", { name: "Search the paper" }).locator("visible=true").first();
}

/** Open the phone ToC from the floating bar. */
async function openFloatingToc(page: Page): Promise<void> {
    await page.locator(".floating-toc-title-btn").click();
    await expect(page.locator('.floating-toc-dropdown .toc-link[data-depth="0"]').first()).toBeVisible();
}

/** Scroll the phone paper far enough that every mounting condition holds. */
async function phoneScrolled(page: Page): Promise<Locator> {
    const scroller = await openPaper(page);
    await scroller.evaluate((el) => el.scrollTo({ top: 2500 }));
    await expect(page.locator(".floating-toc-title-btn")).toBeVisible();
    return scroller;
}

// ── Frames (not a gate: the before/after record) ────────────────────────────
for (const scheme of ["light", "dark"] as const) {
    test.describe(`frames ${scheme}`, () => {
        test.describe("1440", () => {
            test.use({ viewport: DESKTOP, colorScheme: scheme });
            test(`frame 1440 ${scheme}`, async ({ page }) => {
                await openPaper(page);
                await page.screenshot({ path: `${FRAMES}/${PHASE}-1440-${scheme}.png` });
                await inlineField(page).fill("parseval");
                await expect(page.getByRole("option").first()).toBeVisible();
                await page.screenshot({ path: `${FRAMES}/${PHASE}-1440-${scheme}-search.png` });
                await page.keyboard.press("Escape");
                await page.locator("body").click({ position: { x: 5, y: 5 } });
                await page.keyboard.press("ControlOrMeta+k");
                const dialog = page.getByRole("dialog", { name: "Search the paper" });
                await expect(dialog).toBeVisible();
                await dialog.getByRole("combobox").fill("parseval");
                await page.waitForTimeout(400);
                await page.screenshot({ path: `${FRAMES}/${PHASE}-1440-${scheme}-palette.png` });
            });
        });
        test.describe("390", () => {
            test.use({ viewport: PHONE, colorScheme: scheme, hasTouch: true, isMobile: true });
            test(`frame 390 ${scheme}`, async ({ page }) => {
                await openPaper(page);
                await page.screenshot({ path: `${FRAMES}/${PHASE}-390-${scheme}.png` });
                await phoneScrolled(page);
                await openFloatingToc(page);
                await page.waitForTimeout(300);
                await page.screenshot({ path: `${FRAMES}/${PHASE}-390-${scheme}-toc.png` });
            });
        });
    });
}

// ── paper-desktop (1440) ────────────────────────────────────────────────────
test.describe("paper-desktop 1440", () => {
    test.use({ viewport: DESKTOP });

    test("UIA-F-61: the article is glass Card, the rail glass-quiet, one light source, one top line", async ({ page }) => {
        await openPaper(page);
        const read = await page.evaluate(() => {
            const nav = document.querySelector(".sidebar-nav") as HTMLElement;
            const art = document.querySelector(".paper-article") as HTMLElement;
            const shadowX = (el: Element) =>
                getComputedStyle(el)
                    .boxShadow.split(/,(?![^()]*\))/)
                    .filter((s) => !/inset/.test(s) && s.trim() !== "none")
                    .map((s) => parseFloat((s.replace(/^[^)]*\)|^[a-z]+\([^)]*\)/i, "").trim().split(/\s+/)[0]) || "0"));
            return {
                artSlot: art.getAttribute("data-slot"),
                navQuiet: nav.classList.contains("glass-quiet"),
                navX: shadowX(nav),
                artX: shadowX(art),
                navTop: nav.getBoundingClientRect().top,
                artTop: art.getBoundingClientRect().top,
            };
        });
        expect(read.artSlot, JSON.stringify(read)).toBe("card");
        expect(read.navQuiet, JSON.stringify(read)).toBe(true);
        // One light source: no offset shadow casts sideways on either surface in
        // opposite directions (the cartoon pair was +3px / −3px).
        const xs = [...read.navX, ...read.artX].filter((x) => x !== 0);
        expect(xs.some((x) => x > 0) && xs.some((x) => x < 0), JSON.stringify(read)).toBe(false);
        expect(Math.abs(read.navTop - read.artTop), JSON.stringify(read)).toBeLessThanOrEqual(1);
    });

    test("UIA-F-156: a compact disclosure, a wider rail, one active class (no inline style)", async ({ page }) => {
        await openPaper(page);
        const read = await page.evaluate(() => {
            const nav = document.querySelector(".sidebar-nav")!.getBoundingClientRect();
            const disc = document.querySelector(".sidebar-nav .toc-disclosure")!.getBoundingClientRect();
            // Glass Button writes its own press custom properties inline; a
            // consumer active literal is a colour, fill or weight.
            const styled = [...document.querySelectorAll(".sidebar-nav .toc-link")].filter((el) =>
                /(^|;)\s*(color|background|font-weight)\s*:/.test(el.getAttribute("style") ?? ""),
            ).length;
            const cur = document.querySelector(".sidebar-nav .toc-link[aria-current]");
            return { navW: nav.width, discW: disc.width, discH: disc.height, styled, current: !!cur };
        });
        expect(read.navW, JSON.stringify(read)).toBeGreaterThanOrEqual(240);
        expect(read.discW, JSON.stringify(read)).toBeLessThanOrEqual(28);
        expect(read.discH, JSON.stringify(read)).toBeLessThanOrEqual(28);
        expect(read.styled, JSON.stringify(read)).toBe(0);
        expect(read.current).toBe(true);
    });

    test("UIA-F-164 + UIA-F-234: no statistics tooltip on a row; a collapsed CONTENTS reclaims its space", async ({ page }) => {
        await openPaper(page);
        await page.locator(".sidebar-nav .toc-link").nth(2).hover();
        await page.waitForTimeout(900);
        await expect(page.getByRole("tooltip").locator("visible=true")).toHaveCount(0);
        const nav = page.getByRole("navigation", { name: "Table of contents" });
        await nav.getByRole("button", { name: "Contents", exact: true }).click();
        await expect(nav.locator("[data-toc-id]")).toHaveCount(0);
        await page.waitForTimeout(400);
        const read = await page.evaluate(() => {
            const n = document.querySelector(".sidebar-nav")!.getBoundingClientRect();
            const h = document.querySelector(".sidebar-header")!.getBoundingClientRect();
            return { navBottom: n.bottom, headerBottom: h.bottom };
        });
        // The card hugs its header: no list-sized empty band below it.
        expect(read.navBottom - read.headerBottom, JSON.stringify(read)).toBeLessThanOrEqual(14);
    });

    test("UIA-F-234: the page chip and the Back control sit on a glass-quiet surface at a role radius", async ({ page }) => {
        const scroller = await openPaper(page);
        await scroller.evaluate((el) => el.scrollTo({ top: 3000 }));
        const read = await page.locator(".overlay-page").evaluate((el) => {
            const probe = document.createElement("div");
            probe.style.borderRadius = "var(--radius-control)";
            document.body.appendChild(probe);
            const control = getComputedStyle(probe).borderTopLeftRadius;
            probe.remove();
            return { quiet: el.classList.contains("glass-quiet"), radius: getComputedStyle(el).borderTopLeftRadius, control };
        });
        expect(read.quiet, JSON.stringify(read)).toBe(true);
        expect(read.radius, JSON.stringify(read)).toBe(read.control);
    });

    test("UIA-F-147 (consumer half): ToC rows ride Button's sm rung; no local radius or padding override", async ({ page }) => {
        await openPaper(page);
        const read = await page.locator(".sidebar-nav .toc-link").first().evaluate((el) => {
            const probe = document.createElement("div");
            probe.style.blockSize = "var(--control-h-sm)";
            probe.style.borderRadius = "var(--radius-button)";
            document.body.appendChild(probe);
            const pc = getComputedStyle(probe);
            const sm = { h: pc.blockSize, r: pc.borderTopLeftRadius };
            probe.remove();
            return { size: el.getAttribute("data-size"), r: getComputedStyle(el).borderTopLeftRadius, h: el.getBoundingClientRect().height, sm };
        });
        expect(read.size, JSON.stringify(read)).toBe("sm");
        expect(read.r, JSON.stringify(read)).toBe(read.sm.r);
        expect(read.h, JSON.stringify(read)).toBeLessThanOrEqual(parseFloat(read.sm.h) + 0.5);
    });

    test("UIA-F-157: the reading progress is glass ScrollProgressRim and it tracks the scroll", async ({ page }) => {
        const scroller = await openPaper(page);
        await expect(page.locator(".paper-progress-track")).toHaveCount(0);
        const rim = page.locator(".paper-root .scroll-progress-rim");
        await expect(rim).toHaveCount(1);
        await scroller.evaluate((el) => el.scrollTo({ top: (el.scrollHeight - el.clientHeight) / 2 }));
        await expect
            .poll(() => rim.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue("--scroll-progress-rim-fill"))), { timeout: 5_000 })
            .toBeGreaterThan(40);
        const fill = await rim.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue("--scroll-progress-rim-fill")));
        expect(fill).toBeLessThan(60);
    });
});

// ── paper-search-inline / paper-search-modal (1440) ─────────────────────────
test.describe("paper-search 1440", () => {
    test.use({ viewport: DESKTOP });

    test("UIA-F-158: a query with no match says so in the inline panel", async ({ page }) => {
        await openPaper(page);
        await inlineField(page).fill("qqqqzzzzxxxx");
        await expect(page.locator(".paper-search-results")).toBeVisible();
        await expect(page.locator(".paper-search-results").getByText("No results")).toBeVisible();
        await expect(inlineField(page)).toHaveAttribute("aria-expanded", "true");
    });

    test("UIA-F-159: one inline surface and ⌘K — no Expand; ⌘K from the field carries the query", async ({ page }) => {
        await openPaper(page);
        const field = inlineField(page);
        await field.fill("parseval");
        await expect(page.getByRole("option").first()).toBeVisible();
        await expect(page.getByRole("button", { name: /Expand the search palette/ })).toHaveCount(0);
        await field.press("ControlOrMeta+k");
        const dialog = page.getByRole("dialog", { name: "Search the paper" });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole("combobox")).toHaveValue("parseval");
        // The inline panel is not live beside the palette.
        await expect(page.locator(".paper-search-results")).toHaveCount(0);
    });

    test("UIA-F-160: inline options are not tab stops; one cursor; canon Badge", async ({ page }) => {
        await openPaper(page);
        const field = inlineField(page);
        await field.fill("fourier");
        const options = page.locator(".paper-search-results").getByRole("option");
        await expect(options.first()).toBeVisible();
        const tabbable = await options.evaluateAll((els) =>
            els.filter((el) => (el as HTMLElement).tabIndex >= 0 || el.tagName === "BUTTON").length,
        );
        expect(tabbable, "an option is a tab stop").toBe(0);
        await options.nth(2).hover();
        await expect(options.nth(2)).toHaveAttribute("aria-selected", "true");
        const painted = () =>
            options.evaluateAll((els) =>
                els.filter((el) => {
                    const bg = getComputedStyle(el).backgroundColor;
                    return bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
                }).length,
            );
        // Settled (the selection fill eases): exactly one row is painted.
        await expect.poll(painted, { message: "more than one row paints as selected" }).toBe(1);
        await page.waitForTimeout(300);
        expect(await painted(), "more than one row paints as selected").toBe(1);
        const badgeSlots = await page.locator(".paper-search-results .paper-search-badge").evaluateAll((els) =>
            els.map((el) => el.getAttribute("data-slot")),
        );
        expect(badgeSlots.length).toBeGreaterThan(0);
        expect(badgeSlots.every((s) => s === "badge"), JSON.stringify(badgeSlots)).toBe(true);
    });

    test("UIA-F-161: word-start matching with contiguous highlights; a scattered subsequence matches nothing", async ({ page }) => {
        await openPaper(page);
        const field = inlineField(page);
        await field.fill("prsvl");
        await page.waitForTimeout(400);
        await expect(page.locator(".paper-search-results").getByRole("option")).toHaveCount(0);
        await field.fill("parseval");
        const options = page.locator(".paper-search-results").getByRole("option");
        await expect(options.first()).toBeVisible();
        const marks = await page.locator(".paper-search-results mark").evaluateAll((els) => els.map((m) => m.textContent ?? ""));
        expect(marks.length).toBeGreaterThan(0);
        // Every highlight is one contiguous run of the query, never a letter.
        expect(marks.every((m) => m.length >= 3), JSON.stringify(marks.slice(0, 12))).toBe(true);
    });

    test("UIA-F-64: the palette is glass Command — input, groups per type, items, empty", async ({ page }) => {
        await openPaper(page);
        await page.locator("body").click({ position: { x: 5, y: 5 } });
        await page.keyboard.press("ControlOrMeta+k");
        const dialog = page.getByRole("dialog", { name: "Search the paper" });
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('[data-slot="command"]')).toHaveCount(1);
        const input = dialog.locator('[data-slot="command-input"]');
        await expect(input).toHaveAttribute("role", "combobox");
        await expect(dialog.locator('[data-slot="command-empty"]')).toBeVisible();
        await input.fill("fourier");
        await expect(dialog.locator('[data-slot="command-item"]').first()).toBeVisible();
        expect(await dialog.locator('[data-slot="command-group"]').count()).toBeGreaterThan(1);
        const plateStyle = await dialog.evaluate((el) => el.getAttribute("style") ?? "");
        expect(plateStyle, "the plate geometry is inline style").not.toMatch(/translate|inline-size|max-block-size/);
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        await expect(dialog).toHaveCount(0);
    });

    test("UIA-F-235: search fields do not spellcheck", async ({ page }) => {
        await openPaper(page);
        await expect(inlineField(page)).toHaveAttribute("spellcheck", "false");
        await page.locator("body").click({ position: { x: 5, y: 5 } });
        await page.keyboard.press("ControlOrMeta+k");
        const dialog = page.getByRole("dialog", { name: "Search the paper" });
        await expect(dialog.getByRole("combobox")).toHaveAttribute("spellcheck", "false");
    });
});

// ── paper-mobile-floating-toc + phone search (390, touch) ───────────────────
test.describe("paper-mobile 390", () => {
    test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

    test("UIA-F-66: floating ToC rows are start-aligned; Scroll to top is one line", async ({ page }) => {
        await phoneScrolled(page);
        await openFloatingToc(page);
        const read = await page.evaluate(() => {
            const rows = [...document.querySelectorAll('.floating-toc-dropdown .toc-link[data-depth="0"]')] as HTMLElement[];
            const lefts = rows.map((el) => {
                const range = document.createRange();
                range.selectNodeContents(el);
                return Math.round(range.getClientRects()[0]?.left ?? -1);
            });
            const top = document.querySelector(".floating-toc-top") as HTMLElement;
            const icon = top.querySelector("svg")!.getBoundingClientRect();
            const label = document.createRange();
            label.selectNodeContents(top);
            const rects = [...label.getClientRects()].filter((r) => r.width > 0);
            return {
                lefts,
                justify: rows.map((el) => getComputedStyle(el).justifyContent),
                iconMid: icon.top + icon.height / 2,
                textMid: rects.length ? rects[rects.length - 1].top + rects[rects.length - 1].height / 2 : -1,
            };
        });
        expect(new Set(read.lefts).size, JSON.stringify(read.lefts)).toBe(1);
        expect(read.justify.every((j) => j === "flex-start" || j === "start"), JSON.stringify(read.justify)).toBe(true);
        expect(Math.abs(read.iconMid - read.textMid), JSON.stringify(read)).toBeLessThanOrEqual(4);
    });

    test("UIA-F-67: the phone ToC is glass Popover; no inline overflow write; every level reachable", async ({ page }) => {
        const scroller = await phoneScrolled(page);
        await openFloatingToc(page);
        const content = page.locator(".floating-toc-dropdown");
        await expect(content).toHaveAttribute("data-slot", "popover-content");
        expect((await scroller.getAttribute("style")) ?? "").not.toMatch(/overflow/);
        // A chapter whose subsections have subsections: its deepest rows are
        // reachable from the phone as they are from the rail.
        const deep = await page.evaluate(() =>
            [...document.querySelectorAll("[data-toc-id]")].length,
        );
        const discs = page.getByRole("button", { name: /^Subsections of / });
        const n = await discs.count();
        for (let i = 0; i < n; i++) {
            const d = discs.nth(i);
            if ((await d.getAttribute("aria-expanded")) !== "true") await d.click();
        }
        const leafRows = await page.locator('.floating-toc-dropdown .toc-link[data-depth="2"]').count();
        expect(leafRows, `deep ${deep}`).toBeGreaterThan(0);
        await page.keyboard.press("Escape");
        await expect(content).toHaveCount(0);
        await expect(page.locator(".floating-toc-title-btn")).toBeFocused();
    });

    test("UIA-F-162: content first — no inline chapter list; a compact bar at the top; one icon radius", async ({ page }) => {
        await openPaper(page);
        await expect(page.getByRole("navigation", { name: "Chapters" })).toHaveCount(0);
        const bar = page.locator(".floating-toc-bar");
        await expect(bar).toBeVisible();
        const read = await page.evaluate(() => {
            const b = document.querySelector(".floating-toc-bar")!.getBoundingClientRect();
            const h1 = document.querySelector(".paper-article h1")!.getBoundingClientRect();
            const title = document.querySelector(".floating-toc-section") as HTMLElement;
            const btns = [...document.querySelectorAll(".floating-toc-bar button")] as HTMLElement[];
            const probe = document.createElement("div");
            probe.style.blockSize = "var(--control-h-sm)";
            document.body.appendChild(probe);
            const rung = parseFloat(getComputedStyle(probe).blockSize);
            probe.remove();
            return {
                rung,
                barH: b.height,
                barBottom: b.bottom,
                h1Top: h1.top,
                titleFont: parseFloat(getComputedStyle(title).fontSize),
                radii: btns.map((el) => getComputedStyle(el).borderTopLeftRadius),
            };
        });
        // The bar is the title's own rung (glass `sm`, at the touch floor on a
        // phone) plus its inset — the 81 px bar was the defect.
        expect(read.barH, JSON.stringify(read)).toBeLessThanOrEqual(read.rung + 12);
        expect(read.titleFont, JSON.stringify(read)).toBeLessThanOrEqual(16);
        expect(read.h1Top, "the bar covers the title").toBeGreaterThanOrEqual(read.barBottom);
        expect(new Set(read.radii).size, JSON.stringify(read.radii)).toBe(1);
    });

    test("UIA-F-163: no consumer :hover paint outside (hover: hover)", async ({ page }) => {
        await phoneScrolled(page);
        const offenders = await page.evaluate(() => {
            const out: string[] = [];
            const walk = (rules: CSSRuleList, gated: boolean) => {
                for (const rule of Array.from(rules)) {
                    if (rule instanceof CSSMediaRule) {
                        walk(rule.cssRules, gated || /hover:\s*hover/.test(rule.conditionText));
                    } else if (rule instanceof CSSStyleRule) {
                        if (/floating-toc[^,]*:hover/.test(rule.selectorText) && !gated) out.push(rule.selectorText);
                        if (rule.cssRules?.length) walk(rule.cssRules, gated);
                    } else if ("cssRules" in rule) {
                        walk((rule as CSSGroupingRule).cssRules, gated);
                    }
                }
            };
            for (const sheet of Array.from(document.styleSheets)) {
                try {
                    walk(sheet.cssRules, false);
                } catch {
                    /* cross-origin sheet */
                }
            }
            return out;
        });
        expect(offenders).toEqual([]);
    });

    test("UIA-F-236: the bar reports chapter and section, is inset from the edges, the chip stays clear", async ({ page }) => {
        await phoneScrolled(page);
        const read = await page.evaluate(() => {
            const bar = document.querySelector(".floating-toc-bar") as HTMLElement;
            const r = bar.getBoundingClientRect();
            return {
                left: r.left,
                right: window.innerWidth - r.right,
                radius: parseFloat(getComputedStyle(bar).borderTopLeftRadius),
            };
        });
        // Full-bleed with card corners was the defect: either inset, or square.
        expect(read.left >= 8 || read.radius === 0, JSON.stringify(read)).toBe(true);
        // Read a section: the bar names its chapter and the section.
        await openFloatingToc(page);
        const disc = page.getByRole("button", { name: /^Subsections of / }).first();
        if ((await disc.getAttribute("aria-expanded")) !== "true") await disc.click();
        await page.locator('.floating-toc-dropdown .toc-link[data-depth="1"]').nth(1).click();
        await expect(page.locator('.floating-toc-dropdown .toc-link[data-depth="0"]')).toHaveCount(0);
        await expect
            .poll(() => page.locator(".floating-toc-bar .floating-toc-crumb").count(), {
                message: "the bar reports only the chapter",
                timeout: 10_000,
            })
            .toBe(2);
        await openFloatingToc(page);
        const overlap = await page.evaluate(() => {
            const chip = document.querySelector(".overlay-page");
            const list = document.querySelector(".floating-toc-dropdown");
            if (!chip || !list) return null;
            const a = chip.getBoundingClientRect();
            const b = list.getBoundingClientRect();
            const hit = document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2);
            const covers = !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
            return { covers, chipOnTop: !!hit && chip.contains(hit) };
        });
        expect(overlap && overlap.covers && overlap.chipOnTop, JSON.stringify(overlap)).toBeFalsy();
    });

    test("UIA-F-158 + UIA-F-235: the phone search says 'No results'; its panel is the bar's width with a gap", async ({ page }) => {
        await phoneScrolled(page);
        await page.getByRole("button", { name: "Search paper" }).click();
        const field = inlineField(page);
        await field.fill("qqqqzzzzxxxx");
        await expect(page.locator(".paper-search-results").getByText("No results")).toBeVisible();
        await field.fill("parseval");
        await expect(page.locator(".paper-search-results").getByRole("option").first()).toBeVisible();
        const read = await page.evaluate(() => {
            const bar = document.querySelector(".floating-toc-bar")!.getBoundingClientRect();
            const panel = document.querySelector(".paper-search-results")!.getBoundingClientRect();
            return { barW: bar.width, panelW: panel.width, gap: panel.top - bar.bottom };
        });
        expect(read.panelW, JSON.stringify(read)).toBeGreaterThanOrEqual(read.barW - 0.5);
        expect(read.gap, JSON.stringify(read)).toBeGreaterThanOrEqual(4);
        await expect(field).toHaveAttribute("spellcheck", "false");
    });
});
