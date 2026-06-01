import { test, expect, type Page } from "@playwright/test";

const MAX_MOUNTED_SECTIONS = 18;
const DESKTOP_SCROLL_OFFSET_PX = 16;

async function stubRemoteAssets(page: Page) {
    await page.route(/https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)\/.*/, async (route) => {
        const type = route.request().resourceType();
        if (type === "stylesheet") {
            await route.fulfill({
                status: 200,
                contentType: "text/css",
                body: "",
            });
            return;
        }

        if (type === "font") {
            await route.fulfill({
                status: 204,
                body: "",
            });
            return;
        }

        await route.abort();
    });
}

function parseOverlayPage(text: string): number {
    const match = text.match(/pg\s*(\d+)\s*\/\s*(\d+)/i);
    if (!match) {
        throw new Error(`Unexpected overlay text: ${text}`);
    }
    return Number(match[1]);
}

async function waitForPaperReady(page: Page) {
    await page.goto("/paper", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".paper-section").first()).toBeVisible({ timeout: 15_000 });
    // Growth-tolerant: assert the page NUMBER (4) and that a total exists, but do
    // NOT pin the total — the paper grows (97 → 110 → …) and hardcoding the total
    // is the original drift sin. The `/pg 4 / <total>/` shape verifies the
    // windowed initial render lands on page 4 with a live total denominator.
    await expect(page.locator(".overlay-page")).toHaveText(/pg\s*4\s*\/\s*\d+/i, {
        timeout: 15_000,
    });
    await expect(page.locator("#introduction .section-heading")).toContainText("0.1.Introduction");
}

async function mountedSectionCount(page: Page): Promise<number> {
    return page.locator(".paper-section").count();
}

async function overlayText(page: Page): Promise<string> {
    return page.locator(".overlay-page").innerText();
}

async function scrollPaperTo(page: Page, top: number) {
    await page.locator(".paper-scroll").evaluate((element, nextTop) => {
        (element as HTMLElement).scrollTo({ top: nextTop as number, behavior: "instant" });
    }, top);
    await page.waitForTimeout(160);
}

async function getScrollMetrics(page: Page): Promise<{ maxScrollTop: number }> {
    return page.locator(".paper-scroll").evaluate((element) => {
        const scroller = element as HTMLElement;
        return {
            maxScrollTop: Math.max(0, scroller.scrollHeight - scroller.clientHeight),
        };
    });
}

async function getSectionViewportTop(page: Page, id: string): Promise<number> {
    return page.evaluate((targetId) => {
        const scroller = document.querySelector(".paper-scroll");
        const target = document.getElementById(targetId);
        if (!(scroller instanceof HTMLElement) || !(target instanceof HTMLElement)) {
            throw new Error(`Missing section or scroller for ${targetId}`);
        }
        return target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    }, id);
}

/**
 * Click a TOC entry by its `data-toc-id` and wait for the target section to
 * render, expanding any collapsed parent first.
 *
 * The sidebar (`PaperSidebar.vue`) renders a section's sub-entries inside a
 * `CollapsibleContent` that is NOT mounted while the parent top-level section is
 * collapsed — and 3rd-level `subsub` entries only mount when their branch is the
 * active chain. So a nested appendix entry's `[data-toc-id]` does not exist in
 * the DOM until its ancestor section is expanded. (Top-level `\chapter` entries
 * map to top-level TOC sections; appendix `\section`s like
 * `sturm-liouville-completeness` are nested subsections under their chapter.)
 *
 * Rather than hardcode each target's parent slug (which drifts as the paper's
 * chapter titles change), discover the parent dynamically: if the entry is
 * absent, walk the top-level section toggles and expand each until the nested
 * entry materializes, then click it. This preserves the test's intent — the TOC
 * jump lands on the section and its content renders — while staying robust to
 * tree growth.
 */
async function activateTocEntry(page: Page, id: string) {
    const entry = page.locator(`[data-toc-id="${id}"]`);

    if ((await entry.count()) === 0) {
        // The entry is nested under a collapsed parent. Top-level section
        // toggles are the *first* `[data-toc-id]` button inside each direct `li`
        // child of `.sidebar-list` (the section's `Collapsible` trigger); their
        // sub-entries live in a `CollapsibleContent` that mounts/unmounts with the
        // section's open state. We must snapshot ONLY the top-level toggle ids —
        // a descendant-combinator snapshot (`> li [data-toc-id]`) would also pick
        // up already-expanded subsection ids (these tests run serially, so a prior
        // test may leave a section open). A captured subsection id can then unmount
        // before its turn in the loop, leaving its locator with zero matches and
        // hanging `.evaluate()` for the full timeout. The per-`li`-first snapshot
        // is stable: top-level section toggles are always mounted.
        const toggleIds = await page
            .locator(".sidebar-list > li")
            .evaluateAll((lis) =>
                (lis as HTMLElement[])
                    .map((li) => li.querySelector("[data-toc-id]")?.getAttribute("data-toc-id") ?? "")
                    .filter(Boolean),
            );

        for (const toggleId of toggleIds) {
            if (toggleId === id) break;
            // Only OPEN closed sections — `toggleSection` flips state, so
            // clicking an already-open chapter would collapse it (churning the
            // tree across the serial tests). Expand-if-closed is idempotent.
            await page
                .locator(`.sidebar-list > li [data-toc-id="${toggleId}"]`)
                .first()
                .evaluate((element) => {
                    const collapsible = (element as HTMLElement).closest("[data-state]");
                    if (collapsible?.getAttribute("data-state") !== "open") {
                        (element as HTMLButtonElement).click();
                    }
                });
            if ((await entry.count()) > 0) break;
        }

        await expect(entry, `TOC entry "${id}" never mounted after expanding parents`).toHaveCount(
            1,
            { timeout: 10_000 },
        );
    }

    await entry.first().evaluate((element) => (element as HTMLButtonElement).click());
    await expect(page.locator(`#${id}`)).toBeVisible({ timeout: 10_000 });
}

test.describe("Paper performance", () => {
    test.describe.configure({ mode: "serial" });

    test.beforeEach(async ({ page }) => {
        await stubRemoteAssets(page);
    });

    test("initial paper render stays windowed", async ({ page }) => {
        await waitForPaperReady(page);

        // Growth-tolerant: page number 4 + a live total (not pinned to 97).
        await expect(page.locator(".overlay-page")).toHaveText(/pg\s*4\s*\/\s*\d+/i);
        expect(await mountedSectionCount(page)).toBeLessThanOrEqual(MAX_MOUNTED_SECTIONS);
    });

    test("forward scrolling never regresses the page indicator back to 1", async ({ page }) => {
        await waitForPaperReady(page);

        const { maxScrollTop } = await getScrollMetrics(page);
        const checkpoints = Array.from({ length: 10 }, (_, index) =>
            Math.round((maxScrollTop * (index + 1)) / 11),
        ).filter((top) => top > 2000);

        const sampledPages: number[] = [];
        for (const top of checkpoints) {
            await scrollPaperTo(page, top);
            sampledPages.push(parseOverlayPage(await overlayText(page)));
        }

        expect(sampledPages.length).toBeGreaterThan(0);
        expect(sampledPages.every((sample) => sample > 1)).toBe(true);
    });

    test("far TOC jumps land on DFT as Matrix Multiplication without over-mounting", async ({ page }) => {
        await waitForPaperReady(page);

        // The top of the paper is page 4 (the windowed-render baseline). A far
        // jump must advance the page indicator well past it — this anchors the
        // assertion in BEHAVIOR (the jump lands deep in the paper) without
        // pinning an absolute page number that drifts as the paper grows
        // (the DFT subsection sits at pg 59 in the 97-page paper, pg 68 in the
        // 110-page paper, …; the assertion tracks the section, not the number).
        const topPage = parseOverlayPage(await overlayText(page));

        // Clicking the DFT *chapter* TOC entry expands it in the sidebar so the
        // `dft-as-matrix-multiplication` subsection entry becomes reachable — it
        // is a TOC-expand interaction, not a scroll (the page indicator stays at
        // the top). The prior version polled a `.teleport-overlay` fade cue here,
        // but the app no longer emits that fade for this jump, so the assertion
        // was checking a behavior that no longer exists; it is removed.
        await page.locator('[data-toc-id="the-discrete-fourier-transform"]').click();
        await expect(page.locator('[data-toc-id="dft-as-matrix-multiplication"]')).toBeVisible();

        // The subsection click is the actual far jump.
        await page.locator('[data-toc-id="dft-as-matrix-multiplication"]').click();

        // The jump LANDS on the subsection: it is top-aligned in the viewport and
        // the page indicator advances deep past the page-4 top. This verifies the
        // windowed-render + TOC-jump + page-tracking behavior; the absolute page
        // number is read from the running app, never hardcoded.
        await expect
            .poll(async () => {
                const [overlay, top] = await Promise.all([
                    overlayText(page),
                    getSectionViewportTop(page, "dft-as-matrix-multiplication"),
                ]);
                return {
                    aligned: Math.abs(top - DESKTOP_SCROLL_OFFSET_PX) <= 32,
                    deeperThanTop: parseOverlayPage(overlay) > topPage,
                };
            }, {
                timeout: 10_000,
            })
            .toEqual({
                aligned: true,
                deeperThanTop: true,
            });

        const top = await getSectionViewportTop(page, "dft-as-matrix-multiplication");
        expect(Math.abs(top - DESKTOP_SCROLL_OFFSET_PX)).toBeLessThanOrEqual(32);
        expect(parseOverlayPage(await overlayText(page))).toBeGreaterThan(topPage);
        expect(await mountedSectionCount(page)).toBeLessThanOrEqual(MAX_MOUNTED_SECTIONS);
    });

    test("long scroll keeps mounted sections bounded and logs no browser errors", async ({ page }) => {
        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];

        page.on("console", (message) => {
            if (message.type() === "error") {
                consoleErrors.push(message.text());
            }
        });
        page.on("pageerror", (error) => {
            pageErrors.push(error.message);
        });

        await waitForPaperReady(page);

        const { maxScrollTop } = await getScrollMetrics(page);
        const checkpoints = Array.from({ length: 12 }, (_, index) =>
            Math.round((maxScrollTop * index) / 11),
        );
        const mountedCounts: number[] = [];

        for (const top of checkpoints) {
            await scrollPaperTo(page, top);
            mountedCounts.push(await mountedSectionCount(page));
        }

        expect(Math.max(...mountedCounts)).toBeLessThanOrEqual(MAX_MOUNTED_SECTIONS);
        expect(pageErrors).toEqual([]);
        expect(
            consoleErrors.filter(
                (message) => !message.includes("favicon") && !message.includes("404"),
            ),
        ).toEqual([]);
    });

    test("appendix proofs, proof math, code listings, and bibliography render canonically", async ({ page }) => {
        await waitForPaperReady(page);

        await activateTocEntry(page, "alternative-orthogonal-bases");
        const orthogonalSection = page.locator("#alternative-orthogonal-bases");
        await expect(orthogonalSection).toBeVisible({ timeout: 10_000 });
        // H.W1: the `.paper-basis-term--fourier/--chebyshev` highlight spans were
        // emitted ONLY by `paperTextEnhancer.ts`, which was never wired into any
        // render path (born-dead in 6bbb291; the paper renders via the vendored
        // @mkbabb/latex-paper, which carries no term styling). The dead enhancer is
        // removed this wave (inv-15/inv-20); these two assertions tested a feature
        // that never shipped. The section visibility above + the proof/code/bib
        // assertions below verify the appendix renders canonically.
        const chebyshevSection = page.locator("#chebyshev-polynomials");
        await expect(chebyshevSection).toBeVisible({ timeout: 10_000 });

        await activateTocEntry(page, "sturm-liouville-completeness");
        const sturmSection = page.locator("#sturm-liouville-completeness");
        await expect(sturmSection.locator(".paper-proof-block")).toContainText("Proof of Theorem", {
            timeout: 10_000,
        });
        await expect(sturmSection.locator(".paper-proof-title .paper-ref")).toHaveText("1.2.2", {
            timeout: 10_000,
        });
        await expect(sturmSection.locator(".paper-proof-body")).toContainText("This operator is:", {
            timeout: 10_000,
        });
        await expect(sturmSection.locator(".math-block__number")).toContainText("(A.1)", {
            timeout: 10_000,
        });

        await activateTocEntry(page, "chebyshev-and-legendre-series-via-polynomial-fitting");
        const fittingSection = page.locator("#chebyshev-and-legendre-series-via-polynomial-fitting");
        await expect(fittingSection.locator(".paper-code-caption").filter({
            hasText: "Chebyshev coefficient computation",
        })).toBeVisible({ timeout: 10_000 });
        await expect(fittingSection.locator(".paper-code-pre").filter({
            hasText: "def chebyshev_fit(signal, degree):",
        })).toBeVisible({ timeout: 10_000 });
        await expect(fittingSection.locator(".paper-code-pre.hljs").first()).toBeVisible({
            timeout: 10_000,
        });

        await activateTocEntry(page, "contour-extraction-and-fft-pipeline");
        const strategyBlock = page.locator("#contour-extraction-and-fft-pipeline .paper-code-pre").first();
        await expect(strategyBlock).toHaveAttribute("data-language", "python");
        await expect(page.locator("#contour-extraction-and-fft-pipeline .hljs-keyword").first()).toBeVisible({
            timeout: 10_000,
        });

        const lightCodeTheme = await strategyBlock.evaluate((element) => {
            const style = getComputedStyle(element as HTMLElement);
            return {
                color: style.color,
                backgroundColor: style.backgroundColor,
            };
        });

        await page.getByRole("button", { name: /switch to dark mode/i }).click();
        await page.waitForTimeout(250);

        const darkCodeTheme = await strategyBlock.evaluate((element) => {
            const style = getComputedStyle(element as HTMLElement);
            return {
                color: style.color,
                backgroundColor: style.backgroundColor,
            };
        });

        expect(darkCodeTheme.backgroundColor).not.toBe(lightCodeTheme.backgroundColor);
        expect(darkCodeTheme.color).not.toBe(lightCodeTheme.color);

        await activateTocEntry(page, "epicycle-chain-computation");
        const epicycleBlock = page.locator("#epicycle-chain-computation .paper-code-pre").first();
        await expect(epicycleBlock).toHaveAttribute("data-language", "python");
        await expect(page.locator("#epicycle-chain-computation .hljs-meta").first()).toBeVisible({
            timeout: 10_000,
        });

        await activateTocEntry(page, "bibliography");
        const bibliographySection = page.locator("#bibliography");
        await expect(bibliographySection.locator(".section-heading")).toContainText("Bibliography", {
            timeout: 10_000,
        });
        await expect(bibliographySection.locator(".paper-bibliography")).toContainText("Fourier", {
            timeout: 5_000,
        });
    });
});
