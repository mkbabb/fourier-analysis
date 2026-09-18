import { test, expect, type Page } from "@playwright/test";
import {
    CONTRAST_PAIRS,
    PAIRS_AWAITING_THEIR_OWNER,
    type ContrastPair,
} from "./contrast-pairs";
import { FLOOR, fmtRatio, gradeAgainstFloor } from "../scripts/contrast";

/**
 * X·F F.W4 `.g` — `G-F4-CONTRAST-FLOOR`.
 *
 * THE BORN-RED WITNESS: *"No executable harness anywhere"*, reproduced at the
 * bytes by seat 0 (`grep -rln 'contrast\|relativeLuminance' e2e/` → ∅). Every
 * one of the wave's named ratios was a number in a markdown table that nothing
 * in the repo could reproduce, in either arm.
 *
 * ⊘ WHY THIS EXISTS BESIDE THE AXE KEYSTONES, MEASURED AND NOT ASSUMED.
 * `G-F4-A11Y-ROUTE`'s `/paper` keystone landed GREEN this same seat — zero
 * serious/critical, including zero `color-contrast` — while `PS D-B2` books
 * 2.39:1 and `PS D-M4 extended` books four sub-4.5 ramp stops on that very
 * route. axe grades what it can attribute to a text node over a solid
 * ancestor background; ramp inks behind `color-mix` plates, canvas strokes and
 * control BOUNDARIES (1.4.11) fall outside that. **A green axe run is not a
 * contrast reading**, and this harness is the reading.
 *
 * HOW A RATIO IS RE-DERIVED RATHER THAN COPIED
 * --------------------------------------------
 * Each pair is a stack of CSS colour expressions. The page paints them in order
 * onto a 1×1 canvas — the browser's own compositor resolving `var()`,
 * `light-dark()`, `color-mix()`, `oklch()` and alpha exactly as it does on
 * screen — and reads back the sRGB bytes after the plate and again after the
 * ink. The arithmetic (`scripts/contrast.ts`) is pure and separately asserted by
 * the unit floor. The registry's `banked` figures are NEVER asserted against:
 * the live reading is the fact, and a divergence is reported as drift.
 *
 * BOTH ARMS, ALWAYS. §4 says *"in BOTH arms"*, and the registry is full of rows
 * whose dark arm passes while light fails (`GAB-1`, `AA-3`, `FR-EQR-7`) and at
 * least one — `HLG-37` — that fails in both. A harness that graded one arm
 * would certify the theme that is not the shipped default.
 */

type Arm = "light" | "dark";
const ARMS: Arm[] = ["light", "dark"];

interface Resolved {
    plate: string;
    ink: string;
}

/**
 * Paint the stack on a 1×1 canvas and read back the composited sRGB after the
 * plate (all but the last expression) and after the ink (all of it).
 *
 * An expression the engine cannot parse paints nothing, which would silently
 * read back as the plate and produce a flattering 1.000 — so every expression
 * is first validated through a real element's computed style, and an
 * unresolvable one throws rather than grading.
 */
async function resolveStack(page: Page, stack: string[]): Promise<Resolved> {
    return page.evaluate((exprs: string[]) => {
        const probe = document.createElement("span");
        probe.style.position = "fixed";
        probe.style.left = "-9999px";
        document.body.appendChild(probe);

        const concrete = exprs.map((expr) => {
            probe.style.color = "";
            probe.style.color = expr;
            const used = getComputedStyle(probe).color;
            if (!used || used === "rgba(0, 0, 0, 0)") {
                // The engine rejected the declaration, or it resolved to fully
                // transparent — either way there is no colour to grade, and
                // `★MF-10`'s zero-headroom ramp is exactly how that happens
                // (`var(--section-color-13)` is invalid-at-computed-value-time).
                throw new Error(`unresolvable colour expression: ${expr}`);
            }
            return used;
        });
        probe.remove();

        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("no 2D context — cannot composite");

        const readBack = (): string => {
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            return `rgb(${r}, ${g}, ${b})`;
        };

        // Start from opaque white so a fully-transparent bottom layer cannot
        // leave the buffer's own zeroed alpha masquerading as black.
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.fillRect(0, 0, 1, 1);

        let plate = readBack();
        for (let i = 0; i < concrete.length; i++) {
            ctx.fillStyle = concrete[i]!;
            ctx.fillRect(0, 0, 1, 1);
            if (i === concrete.length - 2) plate = readBack();
        }
        const ink = readBack();

        return { plate, ink };
    }, stack);
}

/** Load one page per arm; every pair in that arm reads from it. */
async function openArm(page: Page, arm: Arm): Promise<void> {
    await page.goto("/");
    await page.waitForLoadState("networkidle", { timeout: 60_000 });
    await page.evaluate((a: string) => {
        document.documentElement.classList.toggle("dark", a === "dark");
        // `light-dark()` follows `color-scheme`, and glass-ui's tokens use it —
        // toggling the class alone would leave half the ramp on the light arm.
        document.documentElement.style.colorScheme = a;
    }, arm);
    // One frame for the custom-property cascade to settle before any read.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
}

function describeDrift(pair: ContrastPair, arm: Arm, ratio: number): string {
    const banked = pair.banked[arm];
    if (banked === undefined) return "";
    // A scalar is a point figure (±0.05); an array is a BAND the registry
    // states as a range, so containment — not proximity to an endpoint — is
    // what "reproduced" means for it.
    const tol = 0.05;
    const near = Array.isArray(banked)
        ? ratio >= Math.min(...banked) - tol && ratio <= Math.max(...banked) + tol
        : Math.abs(banked - ratio) <= tol;
    const shown = Array.isArray(banked) ? banked.join("–") : String(banked);
    return near
        ? ` (banked ${shown}, reproduced)`
        : ` (banked ${shown} — DRIFT, the live reading governs)`;
}

test.describe("X·F F.W4 — contrast floor (G-F4-CONTRAST-FLOOR)", () => {
    for (const arm of ARMS) {
        test(`every named pair meets its floor — ${arm} arm`, async ({ page }) => {
            await openArm(page, arm);

            const failures: string[] = [];
            const readings: string[] = [];

            for (const pair of CONTRAST_PAIRS) {
                let verdict;
                try {
                    const { plate, ink } = await resolveStack(page, pair.stack);
                    verdict = gradeAgainstFloor(ink, plate, pair.kind);
                } catch (e) {
                    failures.push(
                        `  ✗ ${pair.id} [${arm}] — ${(e as Error).message} · owner ${pair.owner}`,
                    );
                    continue;
                }

                const line =
                    `${pair.id} [${arm}] ${fmtRatio(verdict.ratio)}:1 ` +
                    `(${pair.kind}, floor ${verdict.floor}:1)` +
                    describeDrift(pair, arm, verdict.ratio);
                readings.push(line);

                if (!verdict.passes) {
                    failures.push(`  ✗ ${line} — ${pair.what} · owner ${pair.owner}`);
                }
            }

            // The full table is attached whether the arm passes or fails: a gate
            // that only speaks when it fails leaves the passing rows unproven.
            await test.info().attach(`contrast-${arm}.txt`, {
                body: readings.join("\n"),
                contentType: "text/plain",
            });

            expect(
                failures,
                `contrast floor violations in the ${arm} arm ` +
                    `(text ≥ ${FLOOR.text}:1 · non-text ≥ ${FLOOR["non-text"]}:1), ` +
                    `${failures.length} of ${CONTRAST_PAIRS.length} pairs:\n` +
                    failures.join("\n"),
            ).toEqual([]);
        });
    }

    test("every named pair has a re-derivable expression", () => {
        // §4 names pairs whose ink is painted rather than declared. They are
        // enumerated, owned and RED — never skipped. This assertion closes by
        // being emptied, one row at a time, as each owning unit lands its cure
        // together with its pair's expression stack.
        expect(
            PAIRS_AWAITING_THEIR_OWNER,
            "pairs named at F-W4.md §4 that no expression stack re-derives yet " +
                "— each is owned, none is dropped:\n" +
                PAIRS_AWAITING_THEIR_OWNER.map(
                    (p) => `  ✗ ${p.id} — ${p.what} (banked ${p.banked}) · owner ${p.owner}`,
                ).join("\n"),
        ).toEqual([]);
    });
});
