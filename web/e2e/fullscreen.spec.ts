// SERVED MODEL: claude-opus-5[1m]
import { test, expect } from "@playwright/test";
import { SAMPLE_IMAGE } from "./fixtures/sample";

/**
 * X·F F.W9 `.b` — `G-F9-11`: fullscreen is exercised, against the TELEPORTED
 * root.
 *
 * THE BORN-RED, REPRODUCED AT THESE BYTES
 * ---------------------------------------
 * The only occurrence of "Fullscreen" anywhere in `web/e2e/` was a COMMENT, at
 * `gallery.spec.ts:113`. `FV-26` books the consequence: the whole viewer —
 * its open path, its named dialog, its exit affordance — had no witness.
 *
 * WHY "AGAINST THE TELEPORTED ROOT" IS THE LOAD-BEARING HALF (`FV-27`)
 * -------------------------------------------------------------------
 * The viewer's content does not render inside the component that declares it.
 * `FullscreenViewer.vue` is a glass-ui `<Dialog>`, and glass-ui's
 * `DialogContent` wraps reka's `DialogPortal` (measured in the installed
 * 8.0.0 dist: `DialogContent-4hzLiaCQ.js` imports `DialogPortal`), which
 * teleports to `<body>`. A spec that scoped itself to the app root — the
 * obvious thing to write — would find nothing and could only be made to pass
 * by weakening it. So the portal is asserted as a FACT, not navigated around:
 * the dialog must be a descendant of `<body>` and must NOT be inside `#app`.
 *
 * ⊘ RE-MEASURED, AND THE SPEC'S COORDINATE IS STALE IN THE RIGHT DIRECTION.
 * `F-W9.md` names FV-27 as *"one of exactly two Teleport sites tree-wide, with
 * `PaperSearchModal.vue:41`"*. At these bytes the only hand-rolled
 * `<Teleport to="body">` left in `web/src/` is `PaperSearchDropdown.vue:163`:
 * F.W3 `.d` retired the viewer's hand-rolled Teleport in favour of the
 * producer's Dialog. The teleport is therefore the PRODUCER's now, which is
 * what this spec asserts — the mechanism moved, the requirement did not.
 *
 * ⊘ F.W9 OWNS GATES AND NO CURE.
 */

test.describe("Fullscreen viewer (G-F9-11)", () => {
    test("enters fullscreen and asserts against the teleported root @mutating", async ({
        page,
    }) => {
        await page.goto("/visualize");

        // The viewer only mounts once there is something to view: upload, then
        // wait for the canvas the auto-compute paints.
        await page.getByTestId("image-file-input").setInputFiles(SAMPLE_IMAGE);
        await page.waitForURL(/\/w\//, { timeout: 15_000 });
        await expect(page.locator("canvas").first()).toBeVisible({ timeout: 60_000 });

        const dock = page.locator(".controls-dock-anchor .glass-dock");
        await expect(dock).toBeVisible({ timeout: 10_000 });
        await dock.hover();
        // X.F.W14V.u1 (§0bt): the dock swallows a press that lands mid-expansion
        // (glass's morph guard), and the wider dock (Export joined it, UIA-F-182)
        // morphs longer; the click waits for the expansion to settle.
        await expect(dock).toHaveClass(/\bexpanded\b/);
        await expect(dock).not.toHaveAttribute("data-morphing");

        const fullscreenBtn = dock.locator('[aria-label="Fullscreen"]');
        await expect(fullscreenBtn).toBeVisible({ timeout: 10_000 });
        await fullscreenBtn.click();

        // ── THE DIALOG ──
        // Named, because `FV-2` books that the old hand-rolled overlay had no
        // `role="dialog"` and no name at all.
        const viewer = page.getByRole("dialog", { name: /fullscreen/i });
        await expect(viewer).toBeVisible({ timeout: 15_000 });

        // ── THE TELEPORTED ROOT (`FV-27`) ──
        const placement = await viewer.evaluate((el) => ({
            insideAppRoot: !!el.closest("#app"),
            underBody: document.body.contains(el),
        }));
        expect(
            placement,
            "the fullscreen surface must render at the portal root, not inside " +
                "the app subtree — a spec that asserts inside `#app` finds nothing",
        ).toEqual({ insideAppRoot: false, underBody: true });

        // The canvas follows it out of the app tree; a portal that carried the
        // chrome but not the content would satisfy the check above alone.
        await expect(viewer.locator("canvas").first()).toBeVisible({ timeout: 30_000 });

        // ── THE EXIT ──
        // X.F.W14V.u1 (UIA-F-93 ⊕ F-244, §0bt): the takeover hosts the canvas dock,
        // whose Fullscreen control is the Exit; the dock expands under the pointer.
        await viewer.locator(".controls-dock-anchor .glass-dock").hover();
        const exit = viewer.getByRole("button", { name: "Exit fullscreen" });
        await expect(exit).toBeVisible();
        await exit.click();
        await expect(viewer).toBeHidden({ timeout: 10_000 });
    });
});
