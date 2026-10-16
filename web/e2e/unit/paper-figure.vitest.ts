import { describe, expect, it } from "vitest";
import {
    DARK_INVERT_EXEMPT,
    FIGURE_DIMENSIONS,
    hasModernVariants,
    resolveFigure,
} from "@/lib/figureDimensions";

/**
 * X·F F.W4 `.e` — `G-F4-VITEST`'s `resolveFigure` rider (D6's third name).
 *
 * ⊘ HARNESS BEFORE RIDER (§5.1(3)): this file exists because `.g` landed the
 * runner first. `PAW-12`'s set-equality check — does the emitted `<picture>`
 * set match the assets on disk? — is F.W9/W10's and is NOT attempted here; what
 * is asserted is the contract this wave changed.
 *
 * The defect class is *valid-and-wrong output*: every branch returns a
 * plausible object, and a wrong URL renders as a broken image only for the
 * figures that happen to be scrolled into the window on the day someone looks.
 */
describe("resolveFigure", () => {
    const BASE = "/assets/";

    it("serves the filename it is given — `PAW-24`'s dead `.pdf` replace is gone", () => {
        // The producer's parser normalises to `.png` before a consumer sees it
        // (verified at the installed bytes this wave). A consumer-side replace
        // was dead code, and the comment beside it stated the inverse contract.
        expect(resolveFigure("f09_gibbs.png", BASE).png).toBe("/assets/f09_gibbs.png");
    });

    it("emits AVIF and WebP siblings ONLY for figures known to carry them", () => {
        const known = resolveFigure("f09_gibbs.png", BASE);
        expect(known.avif).toBe("/assets/f09_gibbs.avif");
        expect(known.webp).toBe("/assets/f09_gibbs.webp");

        // `<picture>` does not fall back on a 404 — only on an unsupported
        // format — so an unknown figure must emit NO modern source at all.
        const unknown = resolveFigure("f99_not_transcoded.png", BASE);
        expect(unknown.avif).toBeNull();
        expect(unknown.webp).toBeNull();
        expect(unknown.png).toBe("/assets/f99_not_transcoded.png");
    });

    it("carries the intrinsic dimensions that reserve the box, or none at all", () => {
        const known = resolveFigure("f21_epicycle_portraits.png", BASE);
        expect([known.width, known.height]).toEqual([4276, 1765]);

        const unknown = resolveFigure("f99_not_transcoded.png", BASE);
        expect(unknown.width).toBeUndefined();
        expect(unknown.height).toBeUndefined();
    });

    it("keeps the variant set and the dimension table in agreement", () => {
        // `hasModernVariants` is derived from the dimension table's keys, so a
        // figure with dimensions and no variants (or the reverse) would mean one
        // of the two has drifted from the assets on disk.
        for (const name of Object.keys(FIGURE_DIMENSIONS)) {
            expect(hasModernVariants(name)).toBe(true);
            expect(resolveFigure(name, BASE).avif).not.toBeNull();
        }
    });

    it("keeps `PAW-6`'s dark-inversion exemptions inside the known figure set", () => {
        // The exemption list replaced a `filename.includes("portrait")` test
        // that was wrong in BOTH directions on the only two figures it decided.
        // A name that matches no real figure would be a silent no-op — which is
        // how the substring version stayed wrong.
        for (const name of DARK_INVERT_EXEMPT) {
            expect(FIGURE_DIMENSIONS[name]).toBeDefined();
        }
        expect(DARK_INVERT_EXEMPT.has("f20_contour_pipeline.png")).toBe(true);
        expect(DARK_INVERT_EXEMPT.has("f21_epicycle_portraits.png")).toBe(true);
    });
});
