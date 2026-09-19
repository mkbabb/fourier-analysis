// SERVED MODEL: claude-opus-5[1m]
import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { FIGURE_DIMENSIONS, hasModernVariants, resolveFigure } from "@/lib/figureDimensions";

/**
 * X·F F.W9 `.b` — `G-F9-14` / `PAW-12`: the figure set-equality invariant,
 * asserted, and made to fail on a seeded mismatch.
 *
 * THE BORN-RED
 * ------------
 * `TRANSCODED_FIGURES = new Set(Object.keys(FIGURE_DIMENSIONS))` is the ONLY
 * statement anywhere that a given `.png` has `.avif`/`.webp` siblings, and
 * `<picture>` does NOT fall back on a 404 — only on an unsupported format. So a
 * figure listed here whose variants were never transcoded ships a `<source>`
 * that resolves to nothing, and a figure transcoded but not listed ships as a
 * bare PNG forever. `PAW-12` books that there is *"no generator, manifest, CI or
 * e2e anywhere"* to notice either, and `PAW-50` books why the assertion had no
 * home: `web/` had no unit harness.
 *
 * HARNESS-BEFORE-RIDER (§4a-4) — the FLOOR (`G-F9-1`) landed first, in this
 * wave, and this rider is written into it rather than beside it.
 *
 * ⊘ ORACLE DISCIPLINE (`KF.W4(d)`). The declared set and the measured set come
 * from two independent places: `FIGURE_DIMENSIONS` is the module's claim, the
 * `assets/` directory is the filesystem's fact. Neither is derived from the
 * other, so neither can launder the other's error. A test that recomputed the
 * expectation from the module would be the module agreeing with itself.
 *
 * ⊘ THE RIDER GUARDS DRIFT; IT REPAIRS NOTHING. The invariant HOLDS at HEAD
 * (28 top-level `.png` / 26 `.avif` / 26 `.webp`, the unpaired pair being
 * `fourier.png` and `maintainer-avatar.png`, against 26 declared keys). A green
 * here is not evidence of a repair — it is evidence that the next transcode run
 * cannot silently disagree with the code.
 */

const ASSETS = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../assets");

/**
 * The served figure root is FLAT: `resolveFigure` builds `${assetBase}${name}`
 * from a bare basename, so only `assets/`'s own entries can ever be figures.
 * `assets/animals/**` and `assets/epicycle-reconstructions/**` are other things
 * and are deliberately not walked.
 */
function topLevelAssets(): string[] {
    return readdirSync(ASSETS, { withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) => e.name);
}

/**
 * THE COMPARATOR — pure, and the single implementation both the live assertion
 * and the seeded-mismatch assertion run through. If it were written twice, the
 * falsifier would be testing a copy of the thing that guards the tree rather
 * than the thing itself.
 */
export function figureSetDifference(
    declared: Iterable<string>,
    transcodedOnDisk: Iterable<string>,
): { declaredButAbsent: string[]; onDiskButUndeclared: string[] } {
    const d = new Set(declared);
    const k = new Set(transcodedOnDisk);
    return {
        declaredButAbsent: [...d].filter((f) => !k.has(f)).sort(),
        onDiskButUndeclared: [...k].filter((f) => !d.has(f)).sort(),
    };
}

/** Every `.png` at the figure root that carries BOTH modern siblings. */
function transcodedOnDisk(files: string[]): string[] {
    const present = new Set(files);
    return files
        .filter((f) => f.endsWith(".png"))
        .filter((png) => {
            const stem = png.replace(/\.png$/, "");
            return present.has(`${stem}.avif`) && present.has(`${stem}.webp`);
        })
        .sort();
}

describe("G-F9-14 — FIGURE_DIMENSIONS ≡ the transcoded figure set on disk", () => {
    const files = topLevelAssets();
    const declared = Object.keys(FIGURE_DIMENSIONS);
    const onDisk = transcodedOnDisk(files);

    it("reads a non-empty figure root (the measurement is not vacuous)", () => {
        // Without this, a mis-resolved `ASSETS` path would empty BOTH sides and
        // the equality below would hold over nothing.
        expect(files.length).toBeGreaterThan(0);
        expect(declared.length).toBeGreaterThan(0);
        expect(onDisk.length).toBeGreaterThan(0);
    });

    it("declares every transcoded figure and transcodes every declared figure", () => {
        const diff = figureSetDifference(declared, onDisk);

        expect(
            diff.declaredButAbsent,
            "FIGURE_DIMENSIONS lists these, but `assets/` has no .avif+.webp pair " +
                "for them — `<picture>` will emit sources that 404 (a `<picture>` " +
                "does NOT fall back on a 404):\n" +
                diff.declaredButAbsent.map((f) => `  • ${f}`).join("\n"),
        ).toEqual([]);

        expect(
            diff.onDiskButUndeclared,
            "these figures ARE transcoded in `assets/` but are absent from " +
                "FIGURE_DIMENSIONS, so they ship as bare PNGs with no modern " +
                "variants and no intrinsic dimensions:\n" +
                diff.onDiskButUndeclared.map((f) => `  • ${f}`).join("\n"),
        ).toEqual([]);
    });

    it("the shipped predicate and the shipped resolver agree with the disk", () => {
        // The set equality above is about DATA. This is about the two exported
        // functions that consume it — the actual path a figure takes to the DOM.
        for (const png of onDisk) {
            expect(hasModernVariants(png), `${png} is transcoded but not offered`).toBe(true);
            const r = resolveFigure(png, "/assets/");
            expect(r.avif).toBe(`/assets/${png.replace(/\.png$/, ".avif")}`);
            expect(r.webp).toBe(`/assets/${png.replace(/\.png$/, ".webp")}`);
            expect(r.width, `${png} carries no intrinsic width`).toBeGreaterThan(0);
            expect(r.height, `${png} carries no intrinsic height`).toBeGreaterThan(0);
        }

        const untranscoded = files
            .filter((f) => f.endsWith(".png"))
            .filter((f) => !onDisk.includes(f));
        // The other half of the contract, and the reason the invariant matters:
        // a PNG with no siblings must be served as a PNG, with NO `<source>`.
        for (const png of untranscoded) {
            expect(hasModernVariants(png), `${png} has no siblings but is offered`).toBe(false);
            const r = resolveFigure(png, "/assets/");
            expect(r.avif).toBeNull();
            expect(r.webp).toBeNull();
        }
    });

    it("FAILS ON A SEEDED MISMATCH (the falsifier, not the happy path)", () => {
        // `G-F9-14`'s falsifier, literally: *"A vitest assertion or a Vite build
        // plugin fails on a seeded mismatch."* Running the comparator over the
        // real sets proves only that today's tree is consistent; it does not
        // prove the instrument can report an inconsistency. Both directions are
        // seeded here, through the SAME comparator the live assertion uses.
        const seededDeclared = [...declared, "f99_never_transcoded.png"];
        const seededOnDisk = [...onDisk.slice(1), "f98_orphan_transcode.png"];

        const diff = figureSetDifference(seededDeclared, seededOnDisk);

        expect(diff.declaredButAbsent).toContain("f99_never_transcoded.png");
        expect(diff.declaredButAbsent).toContain(onDisk[0]!);
        expect(diff.onDiskButUndeclared).toEqual(["f98_orphan_transcode.png"]);

        // And the real sets must still be clean, so this test cannot be read as
        // having relaxed anything.
        expect(figureSetDifference(declared, onDisk)).toEqual({
            declaredButAbsent: [],
            onDiskButUndeclared: [],
        });
    });
});
