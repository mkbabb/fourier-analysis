import * as path from "node:path";

/**
 * The standard sample: every spec that uploads an image uploads this one,
 * through these constants; no spec keeps its own path or type.
 * `assets/portraits/human.png` is a 780x780 RGBA portrait photograph, the
 * same primary sample the contour tests draw (`tests/test_contour_strokes.py`).
 */
export const SAMPLE_IMAGE = path.resolve(import.meta.dirname, "../../../assets/portraits/human.png");
export const SAMPLE_MIME = "image/png";
