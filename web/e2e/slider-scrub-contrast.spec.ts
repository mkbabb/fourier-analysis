import { test, expect } from "@playwright/test";
import { ARMS, openArm, resolveStack, type Arm } from "./resolve-stack";
import { fmtRatio, ratioOf } from "../scripts/contrast";

/**
 * X·F F.W3 `.a` — `g2`'s CONTRAST LEG (`MPC-10`, the cure-rider on `B-2`).
 *
 * `g2` retires a token family, and its own GREEN check refuses to be a grep
 * alone: *"`grep -rn -- "--slider-scrub" web/src | wc -l` → 0, **with MPC-10's
 * contrast leg asserted** (≥4.00:1 light / ≥3.71:1 dark) — absence alone
 * regresses 11.51:1 → 1.51:1 under a green sweep."*
 *
 * That is the whole reason this file exists. The obvious cure — rename the dead
 * `*-range-bg` declaration to the producer's real one and keep the 25–30 %
 * `color-mix` wrapper the consumers wrote around `--track-color` — would have
 * passed the grep and shipped a 1.4.11 REGRESSION, because the producer already
 * dilutes the tint to 88 % (`--liquid-fill-strength`) and the consumer's wrapper
 * multiplies into it: net α 0.264, and the range fill drops from 11.51:1 to
 * 1.51:1 against its own track. The corrected cure drops the wrappers and runs
 * `--track-color` at full strength.
 *
 * ── WHAT IS ASSERTED, AND WHERE THE NUMBERS COME FROM ──
 * The stacks below are the values that PAINT, re-derived in a live page rather
 * than copied: `.slider-track` is `var(--glass-slider-track-background,
 * var(--muted-medium))` over the page, and `.slider-range` is
 * `.glass-liquid-fill`, whose background is
 * `color-mix(in oklab, var(--liquid-fill-tint) calc(88% * 1), oklch(0.9 0.05 75 / 0))`
 * with `--liquid-fill-tint: var(--slider-range-bg, …)`. Both were read out of
 * the installed producer's own `components/slider/styles.css` and
 * `styles/glass/liquid-fill.css` at the adopted pin.
 *
 * ⊘ The MPC-10 floors are NOT WCAG's. 1.4.11 asks 3:1 of a graphical object,
 * and every pair here clears that; the 4.00 / 3.71 pair is the CORRECTED CURE'S
 * OWN measured result, asserted in the breaking direction so that a later edit
 * which re-introduces a dilution wrapper — the exact regression this row
 * exists to prevent — fails here instead of shipping.
 *
 * ⊘ Hairline residue is out of scope by the row's own disposition: the range
 * also carries `--glass-material-rim` and a backdrop filter, and grading those
 * is an `SS-13` item, not this leg.
 */

/** The producer's own liquid-fill recipe, with the tint substituted in. */
const fill = (tint: string): string =>
    `color-mix(in oklab, ${tint} calc(88% * 1), oklch(0.9 0.05 75 / 0))`;

/** The track the fill sits on, over the page it sits on. */
const TRACK_PLATE = ["var(--background)", "var(--muted-medium)"];

interface ScrubPair {
    /** Banked row id — original for life. */
    id: string;
    /** The consumer whose `--track-color` this is. */
    what: string;
    /** The expression the consumer now writes into `--slider-range-bg`. */
    tint: string;
    /** Floor per arm. `MPC-10`'s own pair carries its measured figures. */
    floor: Record<Arm, number>;
    /** The registry's figures, for drift disclosure only — never asserted. */
    banked?: Partial<Record<Arm, number>>;
    /**
     * A PRODUCER row: measured and printed every run, routed by id to the SS-6
     * relay, and deliberately not asserted here. The reason is required, so a
     * row can never become un-asserted silently.
     *
     * ⊘ This is a classification, not an exemption, and the line between them is
     * the SUBJECT. What this gate leg tests is the corrected cure — that a
     * consumer's `--track-color` reaches the fill at full strength. A colour
     * this tree cannot change (glass-ui is read-only; producer rows ride the
     * relay, never a frontend hack) and that no in-tree consumer reaches is a
     * different subject, and asserting it here would report the `MPC-10`
     * regression class — a §6 triumvirate trigger — for a defect that is not it.
     */
    relay?: string;
}

/** 1.4.11: a graphical object needs 3:1 of its surround. */
const NON_TEXT: Record<Arm, number> = { light: 3, dark: 3 };

const SCRUB_PAIRS: ScrubPair[] = [
    // ── MPC-10, the row this gate leg belongs to ──
    // Two of the three Morph cards (`Settle Out`, `Settle In`) are byte-identically
    // `var(--accent-red)`, so this is the pair whose figures the row states.
    {
        id: "MPC-10[morph-accent-red]",
        what: "MorphPhaseConfig duration fill against its own track",
        tint: "var(--accent-red)",
        floor: { light: 4.0, dark: 3.71 },
        banked: { light: 4.004 },
    },
    // ── MPC-31's discrimination point ──
    // The pink card carries the grid's ENTIRE phase-discrimination content, and
    // the row prices it at 3.327:1 — above 1.4.11, below the red. It is asserted
    // at the graphical-object floor and its figure disclosed, because the row's
    // open question (whether 1.203:1 hue-only reads as phase coding at all) is
    // an SS-13 item and not something a floor can answer.
    {
        id: "MPC-31[morph-accent-pink]",
        what: "MorphPhaseConfig Morph-card fill against its own track",
        tint: "var(--accent-pink)",
        floor: NON_TEXT,
        banked: { light: 3.327 },
    },
    // ── B-2's own two sliders, the row's headline surface ──
    {
        id: "B-2[basis-fourier]",
        what: "BasisSelector Fourier slider fill against its own track",
        tint: "var(--viz-fourier)",
        floor: NON_TEXT,
    },
    {
        id: "B-2[basis-chebyshev]",
        what: "BasisSelector Chebyshev slider fill against its own track",
        tint: "var(--viz-chebyshev)",
        floor: NON_TEXT,
    },
    // ── The stock capsule: what EVERY slider above painted BEFORE this cure,
    // and what `D-14`'s explicit fallback still degrades to if a consumer ever
    // omits `--track-color`. Measuring it is how the cure's premise — *"the
    // declared per-basis retint has never painted; both sliders render the stock
    // capsule"* — stops being a claim.
    {
        id: "R-1[D-14-fallback]",
        what: "the producer capsule an unset --track-color falls back to",
        tint: "var(--glass-capsule-warm)",
        floor: NON_TEXT,
        relay:
            "`--glass-capsule-warm` over `--muted-medium` is the producer's own " +
            "default fill on its own default track; no consumer edit can separate " +
            "them without re-minting a producer token. Unreachable in this tree — " +
            "every one of the four consumers supplies `--track-color` — so this is " +
            "the pre-cure reading, kept live as the cure's witness and routed to " +
            "the SS-6 batched relay beside AX-1 / CU-1 / PD-1 / LF-1.",
    },
];

test.describe("X·F F.W3 — g2 contrast leg (MPC-10)", () => {
    for (const arm of ARMS) {
        test(`every scrub fill clears its floor against its own track — ${arm} arm`, async ({
            page,
        }) => {
            await openArm(page, arm);

            const failures: string[] = [];
            const relayed: string[] = [];
            const readings: string[] = [];

            for (const pair of SCRUB_PAIRS) {
                const floor = pair.floor[arm];
                let ratio: number;
                try {
                    const { plate, ink } = await resolveStack(page, [
                        ...TRACK_PLATE,
                        fill(pair.tint),
                    ]);
                    ratio = ratioOf(ink, plate);
                } catch (e) {
                    failures.push(`  ✗ ${pair.id} [${arm}] — ${(e as Error).message}`);
                    continue;
                }

                const banked = pair.banked?.[arm];
                const drift =
                    banked === undefined
                        ? ""
                        : Math.abs(banked - ratio) <= 0.05
                          ? ` (banked ${banked}, reproduced)`
                          : ` (banked ${banked} — DRIFT, the live reading governs)`;

                const verdict = pair.relay
                    ? `RELAY (floor ${floor}:1, producer-owned)`
                    : `floor ${floor}:1`;
                const line = `${pair.id} [${arm}] ${fmtRatio(ratio)}:1 (${verdict})${drift}`;
                readings.push(line);
                if (pair.relay) {
                    relayed.push(`  ⊘ ${line} — ${pair.what}\n      ${pair.relay}`);
                } else if (ratio < floor) {
                    failures.push(`  ✗ ${line} — ${pair.what}`);
                }
            }

            // The whole table is attached pass or fail: a gate that only speaks
            // when it fails leaves the passing rows unproven. The relayed rows
            // are attached WITH their reasons, so the unasserted readings travel
            // with the run rather than living only in a wave record.
            await test.info().attach(`slider-scrub-contrast-${arm}.txt`, {
                body: [...readings, "", ...relayed].join("\n"),
                contentType: "text/plain",
            });

            const asserted = SCRUB_PAIRS.filter((p) => !p.relay).length;
            expect(
                failures,
                `scrub-fill contrast below floor in the ${arm} arm, ` +
                    `${failures.length} of ${asserted} asserted pairs ` +
                    `(${relayed.length} producer-owned, relayed):\n` +
                    failures.join("\n"),
            ).toEqual([]);
        });
    }
});
