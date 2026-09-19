// SERVED MODEL: claude-opus-5[1m]
import { test, expect, type Page } from "@playwright/test";

import { ADMIN_TOKEN, ENTRY, stubAdminApi, stubGallery } from "./fixtures/gallery";

/**
 * X·F F.W9 `.b` — `G-F9-23`: AN INSTRUMENT FOR THE F.W1 VISUAL-REGRESSION
 * CHECKPOINT SET (`carry/F-W1-CARRY.md` §CrossEdges item 9, homed here by R-2b).
 *
 * ════════════════════════════════════════════════════════════════════════════
 * THE BORN-RED, RE-MEASURED AT THESE BYTES
 * ════════════════════════════════════════════════════════════════════════════
 * ⟨cmd⟩ `grep -c toHaveScreenshot web/e2e/*.spec.ts` → **0 across all 12
 * specs**; ⟨cmd⟩ `find web -name '*-snapshots' -type d` → **∅**. The repo's one
 * screenshot harness, `visual-baseline.spec.ts`, writes bare full-page PNGs
 * through `page.screenshot()` into `docs/tranches/J/audit/screenshots/` — it
 * CAPTURES, it does not COMPARE. So all eight checkpoint items were minted with
 * no typecheck signal (a token sign change paints; it never types) AND no
 * screenshot-diff signal. This file is the comparing half, and
 * `toHaveScreenshot()` is the whole difference: it diffs against a committed
 * baseline and fails on a pixel change.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * §4a-16 CHECKPOINT-AS-A-PAIR — THE RELIEF, STATED ON THE INSTRUMENT'S FACE
 * ════════════════════════════════════════════════════════════════════════════
 * The lock reads: the set is *"only falsifiable as a **pair**: a capture taken
 * **before** F.W1's atomic transaction and a comparison taken **after**. A
 * single post-hoc capture proves nothing."*
 *
 * **THE BEFORE LEG IS STRUCTURALLY UNOBTAINABLE AT THIS SEAT, AND IT IS NOT
 * MANUFACTURED HERE.** F.W1 CLOSED 2026-09-18 — its twelve-limb transaction has
 * landed — and no pre-transaction capture was ever taken, because no comparing
 * instrument existed to take one (that absence IS this gate's born-RED). A
 * capture taken today is a capture of the POST-transaction tree. Dressing it up
 * as the pair's first leg would be exactly the base the wave's close act names:
 * *"a checkpoint set 'instrumented' by a single post-hoc capture that can
 * compare against nothing"*.
 *
 * What this instrument therefore IS, precisely: a baseline minted at the
 * post-F.W1 frontier plus a comparison on every later run. It can falsify every
 * drift from here forward, including F.W3/W4's remaining cures and the SS-6
 * producer round. It cannot, and does not claim to, falsify F.W1's own
 * transaction. `G-F9-23` stays RED on that leg; the relief is the reason, not
 * an excuse, and F.W10 holds the terminal disposition of all eight items.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * THE PRECONDITIONS, EACH OWNED ELSEWHERE AND EACH NOW MET
 * ════════════════════════════════════════════════════════════════════════════
 *   · `G-F9-9`  — a card/modal is opened (item 5, GCM-22's `p-0` insets). LANDED
 *                 in this unit; the modal shot below is the first time any check
 *                 in this repo has seen that surface.
 *   · `G-F9-13` — the coarse project (item 4, the tooltip re-proportion). LANDED
 *                 in this unit, BEFORE this file, per §4a-8.
 *   · `S1`'s admin entry (item 8, `text-admin-label`). LANDED at F.W4 `.g`;
 *                 its fixtures are shared rather than cloned (§4a-7).
 *
 * ⊘ F.W9 OWNS THIS CHECKPOINT AND NO CURE. Items 1, 5 and 7 are limbs of F.W1's
 * atomic transaction; item 3's register is PRODUCER-side and rides SS-6 — a
 * producer row never becomes a frontend hack to turn this green. A green here
 * is evidence of an instrument, never of a repair.
 */

/** Deterministic paint: no animation, no motion, no caret. */
async function freeze(page: Page): Promise<void> {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({
        content: `*, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            caret-color: transparent !important;
        }`,
    });
}

const SHOT = { animations: "disabled" } as const;

test.describe("G-F9-23 — the F.W1 checkpoint set, instrumented", () => {
    test("items 1 · 6 · 7 — the card's shadow, its badge rim and its fused-card gap", async ({
        page,
    }) => {
        // Item 1 `--shadow-cartoon` sign flip: re-measured at these bytes,
        // ⟨cmd⟩ `grep -rl -- '--shadow-cartoon' web/src/` → ONE file,
        // `gallery/GalleryCard.vue`, at `:193` / `:212` (the `-hover` twin) /
        // `:224`. A sign flip on that token paints and never types, so the card
        // is the one surface that can witness it.
        // Item 6 the Badge rim, item 7 `FR-CP-13`'s fused-card gap: both are
        // sub-pixel geometry on this same card. One photograph, three items —
        // which is why the set is checkpointed by SURFACE and not by token.
        await stubGallery(page);
        await page.goto("/gallery");

        const card = page.getByRole("button", { name: `Open ${ENTRY.image_slug}` });
        await expect(card).toBeVisible({ timeout: 30_000 });
        await freeze(page);

        await expect(card).toHaveScreenshot("checkpoint-card-resting.png", SHOT);
    });

    test("item 2 — `cartoon-card` hover, the state no spec in the suite reached", async ({
        page,
    }) => {
        // The carry's banked wording is *"`cartoon-surface` hover loss across 21
        // sites"*. The 21/14 denominator is F.W0 `G-12`'s and its token is
        // `cartoon-card`, quoted never re-derived; at the tree the two are not
        // interchangeable (`cartoon-surface` → 1 file, inside the `.cartoon-card`
        // shim). This takes the checkpoint in a HOVER state on one
        // representative site, which is the half no assertion anywhere reached —
        // hover is a state, and the suite had no state.
        await stubGallery(page);
        await page.goto("/gallery");

        const card = page.getByRole("button", { name: `Open ${ENTRY.image_slug}` });
        await expect(card).toBeVisible({ timeout: 30_000 });
        await freeze(page);
        await card.hover();

        await expect(card).toHaveScreenshot("checkpoint-card-hover.png", SHOT);
    });

    test("item 5 — GCM-22's `p-0` insets, on a modal no spec had ever opened", async ({
        page,
    }) => {
        // `G-F9-9` is this item's precondition and it is met in this same unit:
        // before it, no spec opened a card at all, so the inset was invisible
        // even to a screenshot. The retirement of `p-0` is a LIMB of F.W1's
        // transaction — F.W9 supplies the checkpoint and books no limb.
        await stubGallery(page);
        await page.goto("/gallery");

        const card = page.getByRole("button", { name: `Open ${ENTRY.image_slug}` });
        await expect(card).toBeVisible({ timeout: 30_000 });
        await card.click();

        const modal = page.getByRole("dialog");
        await expect(modal).toBeVisible({ timeout: 10_000 });
        await expect(modal).toHaveAccessibleName(ENTRY.image_slug);
        await freeze(page);

        await expect(modal).toHaveScreenshot("checkpoint-card-modal.png", SHOT);
    });

    test("item 8 — `text-admin-label`, reached through S1's admin entry", async ({ page }) => {
        // Invisible twice over at the fold: ⟨cmd⟩ `grep -rln "admin" web/e2e/`
        // → 0 (AA-44's packet root), and the label is a paint-only token.
        // F.W0 `G-12` publishes the denominator (7 sites / 4 files), quoted and
        // not re-derived; read-only corroboration at these bytes,
        // `grep -rl text-admin-label web/src/` → 4 files.
        await stubAdminApi(page);
        await page.goto(`/gallery?admin=${ADMIN_TOKEN}`);

        const banner = page.getByRole("region", { name: "Admin mode banner" });
        await expect(banner).toBeVisible({ timeout: 30_000 });
        await expect(banner.getByText("entries", { exact: false }).first()).toBeVisible({
            timeout: 30_000,
        });
        await freeze(page);

        await expect(banner).toHaveScreenshot("checkpoint-admin-banner.png", SHOT);
    });

    test("item 3 — the `.disclosure-content` body register, taken as the consumer sees it", async ({
        page,
    }) => {
        // ⟨cmd⟩ `grep -rl 'disclosure-content' web/src/` → **0**. The register is
        // PRODUCER-side, so the consumer can only ever see a render change, and
        // the cure rides SS-6 — a producer row never becomes a frontend hack to
        // turn this green. What is checkpointed is precisely the consumer-visible
        // render: the open body of a `CollapsibleSection`, which is the element
        // the register governs.
        await page.goto("/equation");
        const disclosureBody = page.locator(".slider-subtitle").first();
        await expect(disclosureBody).toBeVisible({ timeout: 60_000 });
        await freeze(page);

        const panel = page.locator(".eq-panel-left").first();
        await expect(panel).toBeVisible();
        await expect(panel).toHaveScreenshot("checkpoint-disclosure-body.png", SHOT);
    });

    test("@coarse item 4 — the tooltip re-proportion, taken under the coarse project", async ({
        page,
    }) => {
        // §4a-8 MATRIX-BEFORE-COARSE, honoured literally: this checkpoint is
        // TAGGED `@coarse` so it runs in the project `G-F9-13` landed, and it
        // could not have been written before it. `FR-TT-1`'s shim is the only
        // label on 17 icon-only triggers; a re-proportion moves HIT AREA, and
        // hit area is a coarse-pointer fact — at `pointer: fine` the
        // measurement is of a different control.
        //
        // ⊘ `G-F9-22` owns FR-TT-1's NAMING half. This is the GEOMETRY half,
        // distinct, and the two are never folded.
        await page.goto("/equation");
        await expect(page.locator(".slider-subtitle").first()).toBeVisible({ timeout: 60_000 });
        await freeze(page);

        // `FunctionInput`'s Parseval trigger is a `<Tooltip>`-wrapped icon-only
        // Button — the tree's `FunctionInput Wand2 ×1` leg of L-4's 17.
        const trigger = page.getByRole("button", {
            name: "Auto-select harmonics by Parseval energy",
        });
        await expect(trigger).toBeVisible({ timeout: 30_000 });

        await expect(trigger).toHaveScreenshot("checkpoint-tooltip-trigger.png", SHOT);
    });
});
