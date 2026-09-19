import type { Page } from "@playwright/test";

/**
 * X·F F.W3 `.a` — the colour-stack resolver, as a module.
 *
 * `G-F4-CONTRAST-FLOOR`'s harness (`contrast-floor.spec.ts`) established the
 * method this file makes importable: a pair of colours is expressed as a stack
 * of CSS expressions, the PAGE paints them onto a 1×1 canvas so the engine's own
 * compositor resolves `var()`, `light-dark()`, `color-mix()`, `oklch()` and
 * alpha exactly as it does on screen, and only the arithmetic — pure, in
 * `scripts/contrast.ts` — happens outside the browser.
 *
 * It lives here rather than inside a spec because a spec cannot be imported.
 *
 * X.F.W3 `.d` — THE BOOKED RESIDUE IS DISCHARGED. This header used to end: "⊘
 * RESIDUE, named rather than silently carried: `contrast-floor.spec.ts` still
 * holds its own private copy of `resolveStack`/`openArm`, and re-pointing that
 * spec at this module is a change to another unit's authored gate. The
 * duplication is booked for the wave's adjudicator, not resolved here."
 *
 * COHESION §0x note (iv) ruled it: this file is the ONE `resolveStack`/`openArm`
 * home and `contrast-floor.spec.ts` imports it. The two copies had already
 * diverged on the thing that decides whether a reading is trustworthy —
 * ⟨`grep -c SENTINEL`⟩ **3** here, **0** in the spec's copy — so the spec was
 * running the version that CANNOT detect a rejected colour expression. It has
 * the detector now. Definitions of either function outside this file: **0**.
 */

export type Arm = "light" | "dark";

export const ARMS: readonly Arm[] = ["light", "dark"];

export interface Resolved {
    /** The composite after every expression but the last. */
    plate: string;
    /** The composite after all of them. */
    ink: string;
}

/**
 * Paint the stack on a 1×1 canvas and read back the composited sRGB after the
 * plate and again after the ink.
 *
 * Every expression is first validated through a real element's computed style
 * against a KNOWN sentinel, so an expression the engine rejects throws instead
 * of silently reading back as the plate and grading a flattering 1.000.
 */
export async function resolveStack(page: Page, stack: string[]): Promise<Resolved> {
    return page.evaluate((exprs: string[]) => {
        const SENTINEL = "rgb(1, 2, 3)";

        const probe = document.createElement("span");
        probe.style.position = "fixed";
        probe.style.left = "-9999px";
        document.body.appendChild(probe);

        const concrete = exprs.map((expr) => {
            // Seeding the sentinel first means an expression the parser REJECTS
            // leaves the sentinel standing, which is detectable — whereas
            // clearing to "" leaves the inherited colour, which is not.
            probe.style.color = SENTINEL;
            probe.style.color = expr;
            const used = getComputedStyle(probe).color;
            if (!used || used === SENTINEL || used === "rgba(0, 0, 0, 0)") {
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
export async function openArm(page: Page, arm: Arm): Promise<void> {
    await page.goto("/");
    await page.waitForLoadState("networkidle", { timeout: 60_000 });
    await page.evaluate((a: string) => {
        document.documentElement.classList.toggle("dark", a === "dark");
        // `light-dark()` follows `color-scheme`, and the producer's tokens use
        // it — toggling the class alone would leave half the ramp on light.
        document.documentElement.style.colorScheme = a;
    }, arm);
    // One frame for the custom-property cascade to settle before any read.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
}
