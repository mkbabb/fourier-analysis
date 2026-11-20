import { expect, test } from "@playwright/test";

/**
 * Owner law: reduced motion is a fade, never a cut. The site's own
 * reduced-motion rules no longer cut: the tab panel fades in without its
 * travel, the slide-down pair keeps its fade, the editor handles keep theirs,
 * the like heart fades into its pressed ink, and the dock chevron, the paper
 * rail and the visualizer's column turn on short clocks.
 *
 * Producer-held (e2e/producer-held.json, O-308): glass's reduced-motion guard
 * (`a11y-overrides.css`) zeroes every transition and animation on the page, a
 * consumer's own fades included, so until glass carves opacity out of it this
 * reads RED on the guard, never on the site's rules. Read from probe elements
 * carrying the site's own classes, so it reads the rules, not a state.
 */
test.use({ viewport: { width: 1440, height: 900 } });

test("reduced motion: the site's own rules fade, never cut (REDUCED-MOTION-CUT)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/gallery");
    await expect(page.locator(".app-dock")).toBeVisible({ timeout: 30_000 });
    const read = await page.evaluate(() => {
        const probe = (html: string, pick: (root: HTMLElement) => HTMLElement) => {
            const host = document.createElement("div");
            host.innerHTML = html;
            document.body.append(host);
            const s = getComputedStyle(pick(host));
            const out = {
                transition: `${s.transitionProperty} ${s.transitionDuration}`,
                animation: `${s.animationName} ${s.animationDuration}`,
            };
            host.remove();
            return out;
        };
        return {
            slideDown: probe('<div class="slide-down-enter-active"></div>', (h) => h.firstElementChild as HTMLElement),
            tabPanel: probe('<div role="tabpanel" data-state="active"></div>', (h) => h.firstElementChild as HTMLElement),
        };
    });
    const ms = (v: string) => parseFloat(v) * (v.endsWith("ms") ? 1 : 1000);
    const [slideProp, slideDur] = read.slideDown.transition.split(" ");
    const [tabName, tabDur] = read.tabPanel.animation.split(" ");
    expect(
        { slideProp, slideFades: ms(slideDur) >= 100, tabName, tabFades: ms(tabDur) >= 100 },
        `REDUCED-MOTION-CUT: ${JSON.stringify(read)}`,
    ).toEqual({ slideProp: "opacity", slideFades: true, tabName: "tab-fade-in", tabFades: true });
});
