/**
 * Intrinsic pixel dimensions for the paper figures (I.θ).
 *
 * The paper figures are static raster assets rasterized once from the
 * `fNN_*.pdf` source set (committed under `assets/`, served from
 * `${BASE_URL}assets/`). `PaperFigureData` carries only `filename`/`caption`,
 * not dimensions — so the windowed paper scroll has no way to reserve space
 * for a figure before it loads, and an un-dimensioned `<img>` in a
 * mount/unmount window is a CLS generator.
 *
 * This map lets `PaperArticleWindow` set `width`/`height` on each figure so the
 * browser reserves the correct box (the rendered size is still capped by the
 * `max-height: 400px` CSS — `width`/`height` only supply the aspect ratio the
 * layout reserves). Keyed by the resolved `.png` filename (the same string the
 * template derives from `figure.filename`). A figure absent from this map
 * simply renders without reserved dimensions (the prior behaviour), so the map
 * is additive and never breaks an unlisted figure.
 *
 * The AVIF/WebP variants emitted by `<picture>` share these dimensions; they
 * are transcoded 1:1 from the PNGs (same pixel grid).
 */
export const FIGURE_DIMENSIONS: Record<string, readonly [number, number]> = {
    "f01_title_epicycle.png": [1213, 1731],
    "f02_partial_sums.png": [1838, 1261],
    "f03_projection.png": [1378, 1016],
    "f04_function_as_vector.png": [2330, 981],
    "f05_inner_product_1.png": [2931, 1131],
    "f06_inner_product_2.png": [2931, 1131],
    "f07_fourier_projection.png": [3531, 981],
    "f08_heat_plate.png": [1597, 1453],
    "f09_gibbs.png": [2070, 1258],
    "f10_fejer_vs_partial.png": [2931, 1131],
    "f11_parseval.png": [2931, 1131],
    "f12_laurent_annulus.png": [1728, 1611],
    "f13_laurent_to_fourier.png": [2797, 1303],
    "f14_analyticity_strip.png": [2611, 1251],
    "f14_dft_matrix.png": [3530, 1175],
    "f15_butterfly.png": [2387, 1539],
    "f16_bluestein.png": [2931, 1130],
    "f17_convolution_theorem.png": [2931, 2038],
    "f18_epicycle_annotated.png": [1832, 1707],
    "f19_epicycle_convergence.png": [2035, 2332],
    "f20_contour_pipeline.png": [2600, 2920],
    "f21_epicycle_portraits.png": [4276, 1765],
    "f22_svd_ellipsoid.png": [2762, 1281],
    "f23_pca_ellipse.png": [2761, 1281],
    "f24_runge_phenomenon.png": [2931, 1303],
    "f25_hermite_eigenfunctions.png": [2651, 1744],
};

/**
 * X·F F.W4 `.e` — `PAW-6`: figures the dark arm must NOT photo-negate.
 *
 * The consumer used to decide this with `filename.includes("portrait")`, and
 * the record measured that substring wrong in BOTH directions on the only two
 * figures where it decides anything: `f21` matches and was left un-inverted (a
 * white slab inside `hsl(24 8% 16%)`), while `f20` does not match and WAS
 * inverted — the Fourier engraving, photo-negated.
 *
 * The discriminator is data now, not a guess about a filename. ⊘ `K-17` is
 * carried and it is why this is an exemption list rather than a cure: NO
 * whole-figure boolean is correct for `f20`, whose panels are mixed. The real
 * repair is asset-side — re-rasterise `f20`'s panels separately, or ship
 * dark-mode variants and retire whole-figure `invert()` altogether — and it
 * travels on the LATEX-PAPER relay. Until then this list is wrong for neither
 * of the two figures the record measured, where the substring was wrong for
 * both, and the line-art figures keep the inversion that serves them.
 */
export const DARK_INVERT_EXEMPT: ReadonlySet<string> = new Set([
    "f20_contour_pipeline.png",
    "f21_epicycle_portraits.png",
]);

/** Figures transcoded to AVIF + WebP alongside the PNG (the `<picture>` set). */
const TRANSCODED_FIGURES = new Set(Object.keys(FIGURE_DIMENSIONS));

/** True when `.avif`/`.webp` siblings exist for this `.png` figure. */
export function hasModernVariants(pngFilename: string): boolean {
    return TRANSCODED_FIGURES.has(pngFilename);
}

export interface ResolvedFigure {
    png: string;
    avif: string | null;
    webp: string | null;
    width?: number;
    height?: number;
}

/**
 * Resolve a figure's served URLs and intrinsic dimensions.
 *
 * `PAW-24`: the consumer used to run a `.pdf`→`.png` replace here and carry a
 * doc comment stating the INVERSE of the installed contract. Measured at the
 * producer's bytes this round — latex-paper's parser normalises the filename
 * before any consumer sees it (`chunk-5VAEDP55.js`: *"if (!filename.includes(
 * ".")) filename += ".png"; filename = filename.replace(/\.pdf$/, ".png")"*) —
 * so the replace was dead and the comment was the load-bearing half of the
 * defect. `figure.filename` arrives as a `.png` basename.
 *
 * `<picture>` does NOT fall back on a 404, only on an unsupported format, so
 * the AVIF/WebP sources are emitted ONLY for figures known to carry variants.
 *
 * ⊘ Lives here rather than in the SFC so that it is reachable by the unit floor
 * (`G-F4-VITEST`) — `PAW-12`'s set-equality rider is F.W9/W10's and needs a
 * function it can import.
 */
export function resolveFigure(filename: string, assetBase: string): ResolvedFigure {
    const dims = FIGURE_DIMENSIONS[filename];
    const png = `${assetBase}${filename}`;
    const base: ResolvedFigure = {
        png,
        avif: null,
        webp: null,
        width: dims?.[0],
        height: dims?.[1],
    };
    if (!hasModernVariants(filename)) return base;
    const stem = filename.replace(/\.png$/, "");
    return { ...base, avif: `${assetBase}${stem}.avif`, webp: `${assetBase}${stem}.webp` };
}
