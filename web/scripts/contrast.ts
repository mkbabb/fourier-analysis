/**
 * X·F F.W4 `.g` — the contrast arithmetic behind `G-F4-CONTRAST-FLOOR`.
 *
 * Pure, browser-free, and therefore assertable by the unit floor (`G-F4-VITEST`)
 * rather than only by a running page. The harness that drives it
 * (`e2e/contrast-floor.spec.ts`) does the colour RESOLUTION in the browser —
 * `var()`, `light-dark()`, `color-mix()`, `oklch()` and alpha compositing are the
 * engine's job and re-implementing them here would be the reverse of
 * *re-deriving at the values that actually paint*. This module owns only the
 * part that is arithmetic: sRGB → relative luminance → WCAG ratio, and the two
 * floors.
 *
 * WCAG 2.1 §1.4.3 (text) and §1.4.11 (non-text): the floors are 4.5:1 and 3:1.
 * The large-text relief is deliberately NOT implemented — every pair this wave
 * names was measured at a small register (`fr-GalleryAdminBanner GAB-1`:
 * *"value rung `text-mono-caption` caps at 16px, scale.css; no large-text
 * relief"*), and a relief clause no pair qualifies for is a hole waiting for a
 * future pair to fall through.
 */

export interface Rgb {
    r: number;
    g: number;
    b: number;
}

/** Text is WCAG 1.4.3 (4.5:1); everything else is 1.4.11 (3:1). */
export type PairKind = "text" | "non-text";

export const FLOOR: Readonly<Record<PairKind, number>> = Object.freeze({
    text: 4.5,
    "non-text": 3,
});

/**
 * Parses the `rgb()` / `rgba()` form a browser's `getComputedStyle` and canvas
 * read-back produce. Anything else throws: a silently-mis-parsed colour is a
 * ratio that is confidently wrong, which is the exact failure `GAB-1`'s
 * *"the failure is identical whether the token resolves or not"* warns about.
 */
export function parseRgb(value: string): Rgb {
    const m = value
        .trim()
        .match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*[\d.%]+\s*)?\)$/i);
    if (!m) {
        throw new Error(
            `contrast: cannot parse "${value}" as an sRGB colour — resolve it in the browser first`,
        );
    }
    const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
    for (const c of [r, g, b]) {
        if (!Number.isFinite(c) || c < 0 || c > 255) {
            throw new Error(`contrast: channel out of sRGB range in "${value}"`);
        }
    }
    return { r, g, b };
}

/** WCAG 2.1 relative luminance of an opaque sRGB colour. */
export function relativeLuminance({ r, g, b }: Rgb): number {
    const lin = (channel: number): number => {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.1 contrast ratio. Symmetric: order of arguments never matters. */
export function contrastRatio(a: Rgb, b: Rgb): number {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
    return (hi + 0.05) / (lo + 0.05);
}

/** The ratio of two colours already resolved to `rgb()`/`rgba()` strings. */
export function ratioOf(ink: string, plate: string): number {
    return contrastRatio(parseRgb(ink), parseRgb(plate));
}

export interface FloorVerdict {
    ratio: number;
    floor: number;
    passes: boolean;
}

/** Grades a resolved pair against its kind's floor. */
export function gradeAgainstFloor(
    ink: string,
    plate: string,
    kind: PairKind,
): FloorVerdict {
    const ratio = ratioOf(ink, plate);
    const floor = FLOOR[kind];
    return { ratio, floor, passes: ratio >= floor };
}

/** Two decimals is the precision every banked figure in the registry carries. */
export function fmtRatio(ratio: number): string {
    return ratio.toFixed(3);
}
