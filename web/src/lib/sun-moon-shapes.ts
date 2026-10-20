/**
 * X·OD19 ALL — the sun and moon, loaded beside the boot instead of inside it.
 *
 * The two shapes the header's theme toggle draws (and `/morph` previews) are
 * 2 × 10 harmonic levels of 512 points: ~450 kB of JSON. Imported statically
 * by `DarkModeToggle` (mounted on every route), they were 375 kB of the 520 kB
 * entry chunk, so every route parsed them before it could start. They now ride
 * their own chunk, requested the moment this module evaluates — in parallel
 * with the route's own chunk — and `main.ts` mounts once both have landed, so
 * the glyph never paints empty and nothing reads these before they are set.
 *
 * One home: `FourierMorphDemo` reads the same two shapes from here.
 */
import { prepareFourierShape, type FourierPathData, type FourierShape } from "@/lib/svg-fourier";

export let sunShape: FourierShape;
export let moonShape: FourierShape;

export const sunMoonShapesReady: Promise<void> = Promise.all([
    import("@/assets/fourier-paths/sun.json"),
    import("@/assets/fourier-paths/moon.json"),
]).then(([sun, moon]) => {
    sunShape = prepareFourierShape(sun.default as unknown as FourierPathData);
    moonShape = prepareFourierShape(moon.default as unknown as FourierPathData);
});
