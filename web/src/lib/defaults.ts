import type { ContourSettings, AnimationSettings } from "./types";
// The default easing is spelled once, in the catalogue (`DEFAULT_ANIMATION_EASING`);
// both the defaults and the restore-seam coercion below read it (X.F.W14V.r3).
import { coerceAnimationEasingName, DEFAULT_ANIMATION_EASING } from "./easings";


export const CONTOUR_DEFAULTS: ContourSettings = {
    strategy: "auto",
    resize: 1024,
    blur_sigma: 0.5,
    n_harmonics: 200,
    n_points: 1024,
    n_classes: 3,
    min_contour_length: 40,
    min_contour_area: 0.001,
    max_contours: 24,
    smooth_contours: 0.03,
    ml_threshold: 0.5,
    ml_detail_threshold: 0.3,
};

export const ANIMATION_DEFAULTS: AnimationSettings = {
    fps: 60,
    duration: 5000,
    max_circles: 100,
    easing: DEFAULT_ANIMATION_EASING,
    speed: 1,
    active_bases: ["fourier-epicycles"],
};

export function defaultContourSettings(): ContourSettings {
    return { ...CONTOUR_DEFAULTS };
}

export function defaultAnimationSettings(): AnimationSettings {
    return { ...ANIMATION_DEFAULTS, active_bases: [...ANIMATION_DEFAULTS.active_bases] };
}

// ── SP-13 · the restore/rehydration validation seam ──────────────────
//
// `AC-L-11 + M-10` = `EP L/M-3` = `SS-D-08 / SS-L-01 / SS-C-6`: persisted
// `speed` AND `easing` were restored unvalidated. Two records reach these
// settings — an IndexedDB draft (`draftStorage.loadDraft`) and a server
// `Visualization.animation_settings` — and NEITHER is typed by anything at
// runtime: both were spread straight over the defaults, so whatever had been
// persisted became the live value and the controls were left to disagree about
// it. The coercers below are the seam; `stores/workspace.ts` is where they run,
// on both paths.

/**
 * `SS-L-07 / SS-C-10` — the speed catalog, and the wave's single
 * highest-leverage change.
 *
 * The value domain existed ONLY as template literals in `SpeedSelect.vue`'s
 * five `<SelectItem value="…">` attributes, while both wires typed it as a bare
 * `number`. Nothing connected the control's domain to the persisted atom, so an
 * off-set persisted value — the banked `L-11`/`M-10` state — rendered an EMPTY
 * trigger beside a live badge that read the number back correctly. Naming the
 * domain once, here, makes that state unrepresentable after a restore.
 *
 * ⊘ The type reaches F.W5's wire rows (`SS-C-1`'s persisted-atom row and the
 * `AnimationSettings.speed` contract): this is the CLIENT half, booked; the
 * wire half is cited and not authored here.
 */
export const ANIMATION_SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

export type AnimationSpeed = (typeof ANIMATION_SPEEDS)[number];

export function isAnimationSpeed(v: unknown): v is AnimationSpeed {
    return typeof v === "number" && (ANIMATION_SPEEDS as readonly number[]).includes(v);
}

/**
 * Land a restored speed inside the catalog.
 *
 * Off-catalog but finite and positive → the NEAREST catalog member, ties to the
 * faster arm. A rate is a magnitude the person chose: restoring a persisted 3×
 * as 1× would discard that choice silently, while 4× keeps it and the control
 * can finally show it. Non-finite, non-positive, absent or non-numeric → the
 * default. ⊘ `if (as?.speed)` — the banked mechanism — dropped a legitimate 0
 * by truthiness; this reads the VALUE, never its truthiness, so 0 is rejected
 * for being outside the domain rather than for being falsy.
 */
export function coerceAnimationSpeed(
    v: unknown,
    fallback: AnimationSpeed = 1,
): AnimationSpeed {
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return fallback;
    if (isAnimationSpeed(v)) return v;
    let nearest: AnimationSpeed = ANIMATION_SPEEDS[0];
    let best = Infinity;
    for (const candidate of ANIMATION_SPEEDS) {
        const distance = Math.abs(candidate - v);
        if (distance <= best) {
            best = distance;
            nearest = candidate;
        }
    }
    return nearest;
}

/** A finite number, or the default in its place. */
function finite(v: unknown, fallback: number): number {
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/**
 * `EV C·D-04`-class shape validation for a restored `AnimationSettings`
 * (`FR-NP-14`/`-15` fold here; `FR-IC-6`'s schema-version limb is discharged by
 * deletion — its component no longer exists).
 *
 * Every field is read from the raw record and rejected field-by-field, so one
 * drifted atom cannot take the rest of the record with it. `active_bases` keeps
 * only its string members: a single non-string entry used to ride through
 * `structuredClone` into the draft and out again.
 */
export function coerceAnimationSettings(raw: unknown): AnimationSettings {
    const base = defaultAnimationSettings();
    if (raw === null || typeof raw !== "object") return base;
    const r = raw as Partial<Record<keyof AnimationSettings, unknown>>;
    const active = Array.isArray(r.active_bases)
        ? r.active_bases.filter((b): b is string => typeof b === "string")
        : [];
    return {
        fps: finite(r.fps, base.fps),
        duration: finite(r.duration, base.duration),
        max_circles: finite(r.max_circles, base.max_circles),
        easing: coerceAnimationEasingName(r.easing, DEFAULT_ANIMATION_EASING),
        speed: coerceAnimationSpeed(r.speed),
        active_bases: active.length > 0 ? active : base.active_bases,
    };
}

/** The same seam for the contour half of a restored record. */
export function coerceContourSettings(raw: unknown): ContourSettings {
    const base = defaultContourSettings();
    if (raw === null || typeof raw !== "object") return base;
    const r = raw as Partial<Record<keyof ContourSettings, unknown>>;
    return {
        strategy: typeof r.strategy === "string" ? r.strategy : base.strategy,
        resize: finite(r.resize, base.resize),
        blur_sigma: finite(r.blur_sigma, base.blur_sigma),
        n_harmonics: finite(r.n_harmonics, base.n_harmonics),
        n_points: finite(r.n_points, base.n_points),
        n_classes: finite(r.n_classes, base.n_classes),
        min_contour_length: finite(r.min_contour_length, base.min_contour_length),
        min_contour_area: finite(r.min_contour_area, base.min_contour_area),
        max_contours:
            r.max_contours === null
                ? null
                : typeof r.max_contours === "number" && Number.isFinite(r.max_contours)
                  ? r.max_contours
                  : base.max_contours,
        smooth_contours: finite(r.smooth_contours, base.smooth_contours),
        ml_threshold: finite(r.ml_threshold, base.ml_threshold),
        ml_detail_threshold: finite(r.ml_detail_threshold, base.ml_detail_threshold),
    };
}
