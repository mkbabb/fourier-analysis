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

/** Figures transcoded to AVIF + WebP alongside the PNG (the `<picture>` set). */
const TRANSCODED_FIGURES = new Set(Object.keys(FIGURE_DIMENSIONS));

/** True when `.avif`/`.webp` siblings exist for this `.png` figure. */
export function hasModernVariants(pngFilename: string): boolean {
    return TRANSCODED_FIGURES.has(pngFilename);
}
