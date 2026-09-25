import * as path from "node:path";

/**
 * The owner's standard sample (F-W14V addendum (d)): *"The daraksha image
 * should be used over the golden retriver one from now on."* Every spec that
 * uploads an image uploads this one, through this constant; no spec keeps its
 * own path. `assets/portraits/daraksha.jpg` is 3024x4032, 1.19 MB, EXIF and GPS
 * stripped, orientation baked in (fourier `4c38b12`).
 */
export const SAMPLE_IMAGE = path.resolve(import.meta.dirname, "../../../assets/portraits/daraksha.jpg");
