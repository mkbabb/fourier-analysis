import type { PairKind } from "../scripts/contrast";

/**
 * X·F F.W4 `.g` — THE PAIR REGISTRY behind `G-F4-CONTRAST-FLOOR`.
 *
 * The gate asks for *"an executable harness [that] re-derives the wave's named
 * pairs, asserts ≥3:1 non-text / ≥4.5:1 text in BOTH arms"*. This file is the
 * registry half: every pair `F-W4.md` §4 names, with the CSS expression stack
 * that produces it. The harness resolves those expressions in a live page — so
 * the ratio is re-derived from the values that actually paint, never copied
 * from the banked number. `banked` is carried for DRIFT DISCLOSURE only and is
 * never asserted against: if the live reading and the registry disagree, the
 * live reading is the fact and the divergence is reported.
 *
 * THE DIVISION OF LABOUR, per the wave's unit plan: `.g` owns the HARNESS, the
 * surface units own the PAIRS. A pair is expressed here as a stack of CSS
 * colour expressions painted bottom-to-top; the last one is the ink. When a
 * surface unit cures its pair it changes the component, and this registry's
 * entry starts passing — it does not need editing. When a cure MOVES the
 * expression (a token swap, a new plate), the owning unit updates its own row
 * here, in the same commit as the cure.
 *
 * ⊘ `FR-IC` IS ABSENT BY DELETION, NOT BY OMISSION. §4 names
 * *"FR-IC 1.815–3.574"*, but `InfoCard.vue` was DELETED at F.W0 (`5842377`,
 * COHESION §0j.D `G-10` / F8-REACH-01), so the component those ratios charge no
 * longer exists. Every `FR-IC-*` row is DISCHARGED-BY-DELETION — recorded at
 * the wave record's `greenBeforeCure` #3 and repeated here so this registry's
 * silence is legible as a ruling and not as a silent drop.
 */
export interface ContrastPair {
    /** The banked row id — original for life (anti-rename). */
    id: string;
    /** What the ink is, in the component's own words. */
    what: string;
    /** Bottom-to-top CSS colour expressions; the LAST one is the ink. */
    stack: string[];
    kind: PairKind;
    /** The registry's own figures, for drift disclosure only. */
    banked: { light?: number | number[]; dark?: number | number[] };
    /** The unit that owns the cure. */
    owner: string;
}

/** `--section-color-0..12`, the paper ramp: 13 roots consume exactly 13 stops. */
const SECTION_STOPS = 13;

/**
 * `fr-PaperSidebar D-M4 extended` — the four failing LIGHT-arm ramp stops are
 * 4.36 / 4.48 / 4.33 / **3.58**, *"and the worst (stop 11, appendix B, live at
 * 13/13) was missing from the axis's own verdict table"*. §4 is explicit that
 * **the harness asserts all four, not the worst alone** — so the registry
 * enumerates EVERY stop rather than four hand-picked indices. Enumerating the
 * ramp is strictly stronger than naming four: it cannot go stale when a cure
 * moves which stops fail, and `★MF-10`'s zero-headroom finding (13 roots, 13
 * stops, no fallback) means a 14th stop would resolve to nothing — which this
 * enumeration catches as an unresolvable colour rather than as a silent pass.
 */
const sectionRamp: ContrastPair[] = Array.from({ length: SECTION_STOPS }, (_, i) => ({
    id: `PS-D-M4-extended[stop-${i}]`,
    what: `--section-color-${i} heading ink on the page`,
    stack: ["var(--background)", `var(--section-color-${i})`],
    kind: "text" as const,
    banked: i === 11 ? { light: 3.58 } : {},
    owner: ".e",
}));

export const CONTRAST_PAIRS: ContrastPair[] = [
    ...sectionRamp,

    // ── fr-MorphShapePreview FR-MSP-7 ──
    // *"`--muted`@60% over the actual backdrop (`--background`) = 1.038:1 light
    // (`#f8f6f3` on `#fbfaf8`) / 1.084:1 dark"*. The `.info-chip` plate
    // (`MorphShapePreview.vue:153`) is the affordance itself, so the pair is
    // plate-vs-page and the floor is 1.4.11's.
    {
        id: "FR-MSP-7",
        what: ".info-chip plate against the page it sits on",
        stack: [
            "var(--background)",
            "color-mix(in srgb, var(--muted) 60%, transparent)",
        ],
        kind: "non-text",
        banked: { light: 1.038, dark: 1.084 },
        owner: ".a",
    },

    // ── fr-HarmonicLevelGrid HLG-37 ──
    // *"`.grid-cell` border 1.275 L / 1.398 D, … with 1.000:1 fill
    // separation"*. The border is a control boundary → 1.4.11, graded against
    // the cell's own fill, `var(--card)`.
    // X.F.W12 `.a` (2026-09-22, COHESION §0as · R-e-2) — the quote's elided
    // second clause graded the Harmonic-Levels number field's hand-drawn
    // boundary. That row is RETIRED below with the chrome it described.
    // ⊘ `.a` CURED THESE AND MOVED THE EXPRESSIONS, per this file's own rule.
    // The two boundary mixes went 12%/15% → 50% of `--foreground`; the stacks
    // below are the values that paint TODAY, and `banked` keeps the pre-cure
    // figures so the drift line reads as the cure rather than as a surprise.
    {
        id: "HLG-37[grid-cell-border]",
        what: ".grid-cell 1.5px boundary against its own fill",
        stack: [
            "var(--card)",
            "color-mix(in srgb, var(--foreground) 50%, transparent)",
        ],
        kind: "non-text",
        banked: { light: 1.275, dark: 1.398 },
        owner: ".a",
    },
    // X.F.W12 `.a` (2026-09-22, COHESION §0as · R-e-2) — `HLG-37`'s field
    // arm RETIRED. It graded a 1.5px `--foreground` 50% boundary over
    // `--background` that F.W11 `.e` removed when the field moved onto the
    // producer's surface; the field is now glass-ui's `NumberField`, whose
    // `field-control` boundary is the producer's to grade. A row for a paint
    // nothing renders could only pass on a stack the page never shows.
    // ⊘ NOT CURED, AND NOT MOVED — this one is a PRODUCER row. `--card` and
    // `--background` carry the same luminance in the light arm, so no consumer
    // edit can give the cell's fill separation from the page without re-minting
    // a palette token app-wide. It rides `.z`'s SS-6 relay as a GLASS-RELAY ask
    // and stays RED here, which is the honest reading. The cell's boundary
    // (above) is what now carries the affordance.
    {
        id: "HLG-37[grid-cell-fill]",
        what: ".grid-cell fill against the page — the 1.000:1 separation",
        stack: ["var(--background)", "var(--card)"],
        kind: "non-text",
        banked: { light: 1.0 },
        owner: ".a",
    },
    // ── fr-FourierMorphDemo FMD-18 ⊕ FMD-19, the bound/focus blue ──
    // `#60a5fa` measured 2.446:1 on the page and 2.354:1 on `--card` — below
    // 1.4.11 in the light arm at both of its sites. `.a` tokenised both to
    // `--viz-legendre`. X.F.W14U.misc (UIA-F-254) retired the basis hue from
    // the bound tile: its edge is `--foreground` at full strength now.
    {
        id: "FMD-18[bound-tile-border]",
        what: ".grid-cell.is-bound boundary against the cell fill",
        stack: ["var(--card)", "var(--foreground)"],
        kind: "non-text",
        banked: {},
        owner: ".a",
    },
    // X.F.W12 `.a` (2026-09-22, COHESION §0as · R-e-2) — `FMD-19` RETIRED.
    // It graded the number field's `--viz-legendre` focus border, which F.W11
    // `.e` retired for the producer's one focus grammar (the `field-control`
    // `:focus-visible` outline on `--focus-ring-width`); on glass-ui's
    // `NumberField` there is no consumer focus paint left to measure.
    // ── fr-DarkModeToggle DMT M-2, moved out of the awaiting-owner roster ──
    // The glyph is the button's only visual content and its only sighted state
    // channel. It was two hard-coded sRGB triples; `.a` routed both through the
    // palette (FR-AH-23) and the mix through oklab (DMT N-13), so the resting
    // colour in each arm is now a token and both are expressible here. The two
    // rows are the two resting states, and each is graded in BOTH arms because
    // a glyph that only passes in the theme it belongs to is half a reading.
    {
        id: "DMT M-2[sun]",
        what: "the light-arm sun glyph against the page — the banked 2.51:1",
        stack: ["var(--background)", "var(--viz-amber)"],
        kind: "non-text",
        banked: { light: 2.513 },
        owner: ".a",
    },
    {
        id: "DMT M-2[moon]",
        what: "the dark-arm moon glyph against the page",
        stack: ["var(--background)", "var(--viz-legendre)"],
        kind: "non-text",
        banked: { dark: 7.484 },
        owner: ".a",
    },

    // ── fr-UserSlugBar FR-USB-5 ──
    // *"focused border vs fill 1.93:1 · resting border vs fill 1.28:1 ·
    // placeholder 1.73–1.76:1"*. `UserSlugBar.vue:135` — `border-foreground/12`,
    // `focus:border-foreground/30`, `placeholder:text-muted-foreground/40`, all
    // on `bg-card`.
    {
        id: "FR-USB-5[resting-border]",
        what: "credential field resting border against its fill",
        stack: ["var(--card)", "color-mix(in srgb, var(--foreground) 12%, transparent)"],
        kind: "non-text",
        banked: { light: 1.28 },
        owner: ".d",
    },
    {
        id: "FR-USB-5[focused-border]",
        what: "credential field focused border — the only focus affordance",
        stack: ["var(--card)", "color-mix(in srgb, var(--foreground) 30%, transparent)"],
        kind: "non-text",
        banked: { light: 1.93 },
        owner: ".d",
    },
    {
        id: "FR-USB-5[placeholder]",
        what: "placeholder ink — the only visible statement of the slug format",
        stack: [
            "var(--card)",
            "color-mix(in srgb, var(--muted-foreground) 40%, transparent)",
        ],
        kind: "text",
        banked: { light: 1.73 },
        owner: ".d",
    },

    // ── fr-PaperSearchModal PSM-4 ──
    // *"`--muted-foreground` diluted to 45%/50%/40% via `color-mix(…,
    // transparent)` composites to 1.88:1 (hint, light) / 2.39:1 (dark) / 2.04:1
    // (empty) / 1.74:1 (placeholder)"*. The modal plate is
    // `PaperSearch.vue:53` `background: var(--background)`.
    ...([40, 45, 50] as const).map(
        (pct): ContrastPair => ({
            id: `PSM-4[muted-foreground@${pct}%]`,
            what: `modal chrome ink at the authored ${pct}% dilution`,
            stack: [
                "var(--background)",
                `color-mix(in srgb, var(--muted-foreground) ${pct}%, transparent)`,
            ],
            kind: "text",
            banked: pct === 45 ? { light: 1.88, dark: 2.39 } : {},
            owner: ".e",
        }),
    ),

    // ── fr-EquationResult FR-EQR-7 ──
    // *"`text-green-500` on light `--card`: 2.101 … the design system's own
    // light-arm `--success` ALSO fails at 2.175"*. Both are carried: the
    // instance is `.b`'s, the token rung is the producer's and rides the SS-6
    // glass relay. §4's parenthetical — *"(`--success` itself 2.175)"* — is a
    // SECOND pair, not a footnote to the first.
    {
        id: "FR-EQR-7[instance]",
        what: "the success glyph (green-500) on the result card",
        stack: ["var(--card)", "rgb(34 197 94)"],
        kind: "non-text",
        banked: { light: 2.101 },
        owner: ".b",
    },
    {
        id: "FR-EQR-7[--success rung]",
        what: "the design system's own light-arm --success on the same card",
        stack: ["var(--card)", "var(--success)"],
        kind: "non-text",
        banked: { light: 2.175 },
        owner: "GLASS-RELAY (SS-6) — producer rung, never a frontend hack",
    },

    // ── fr-GalleryAdminBanner GAB-1 ──
    // *"plate/page 1.03, border 1.25–1.27, shield 1.60, tile/plate 1.06,
    // `--tier-featured` value 1.45, `--tier-saved` value 2.58 — against a 4.5:1
    // floor"*. The banner is `border-amber-500/30` over `bg-amber-500/[0.04]`
    // over the page (`GalleryAdminBanner.vue:25-27`); the two tier numerals are
    // the stat values.
    {
        id: "GAB-1[plate/page]",
        what: "the admin plate against the page — is there an admin register at all",
        stack: ["var(--background)", "rgb(245 158 11 / 0.04)"],
        kind: "non-text",
        banked: { light: 1.03 },
        owner: ".d",
    },
    {
        id: "GAB-1[border]",
        what: "the admin plate's 1.5px border against the page",
        stack: ["var(--background)", "rgb(245 158 11 / 0.3)"],
        kind: "non-text",
        banked: { light: [1.25, 1.27] },
        owner: ".d",
    },
    {
        id: "GAB-1[--tier-featured value]",
        what: "the featured numeral — the colour chosen to distinguish the tier",
        stack: [
            "var(--background)",
            "rgb(245 158 11 / 0.04)",
            "var(--tier-featured)",
        ],
        kind: "text",
        banked: { light: 1.45 },
        owner: ".d",
    },
    {
        id: "GAB-1[--tier-saved value]",
        what: "the saved numeral on the same plate",
        stack: ["var(--background)", "rgb(245 158 11 / 0.04)", "var(--tier-saved)"],
        kind: "text",
        banked: { light: 2.58 },
        owner: ".d",
    },

    // ── fr-AdminAuditLog AA-3 ──
    // *"All five `actionTone` inks fail WCAG 1.4.3 in the default light arm:
    // 1.36–1.81:1 band … on `text-[0.65rem]` = 10.4 px desktop — the ink IS the
    // action string"*. `AdminAuditLog.vue:67-81` — each tone is a Tailwind
    // `-300` ink on its own `/10` plate. The violet `batch` arm has no home in
    // the producer's five TONES and rides the relay ask; it is graded here all
    // the same, because an ink with nowhere to go is still an ink that fails.
    ...(
        [
            ["delete", "rgb(252 165 165)", "rgb(239 68 68 / 0.1)"],
            ["set_user_status", "rgb(252 211 77)", "rgb(245 158 11 / 0.1)"],
            ["set_tier/dismiss", "rgb(110 231 183)", "rgb(16 185 129 / 0.1)"],
            ["batch", "rgb(196 181 253)", "rgb(139 92 246 / 0.1)"],
            ["default", "rgb(203 213 225)", "rgb(100 116 139 / 0.1)"],
        ] as const
    ).map(
        ([tone, ink, plate]): ContrastPair => ({
            id: `AA-3[${tone}]`,
            what: `the ${tone} actionTone ink — the action string itself`,
            stack: ["var(--card)", plate, ink],
            kind: "text",
            banked: { light: [1.36, 1.81] },
            owner: ".d",
        }),
    ),
];

/**
 * §4 names further pairs whose ink is painted, not declared — `FR-CP-D1`'s
 * canvas axes (1.19 L / 1.38 D), `DMT M-2` (2.51), `ECD D-5`/`D-6` (3.32 /
 * 1.97), `EV D·D-B3` (2.02–3.57), `PS D-B2` (2.39 / 3.00), `PV D/M-8` (2.88).
 * Each is measurable only from the element that paints it, which is the
 * element its owning unit is about to change; expressing them as static
 * expressions at THIS seat would be a guess wearing a measurement's clothes.
 *
 * They are declared here rather than dropped, and the harness FAILS on every
 * one of them — an un-re-derived pair is an open hole in the gate, not a pass.
 * The owning unit supplies the expression stack in the same commit as its cure,
 * moving the row into `CONTRAST_PAIRS` above. ⊘ No skip, no allowlist, no
 * `fixme`: the roster below IS the RED, and it closes by being emptied.
 */
export const PAIRS_AWAITING_THEIR_OWNER: Array<{
    id: string;
    what: string;
    banked: string;
    owner: string;
}> = [
    {
        id: "FR-CP-D1",
        what: "ConvergencePlot axes — painted to canvas, read from the 2D context",
        banked: "1.19 light / 1.38 dark",
        owner: ".b",
    },
    {
        id: "ECD D-5",
        what: "EditorControlsDock",
        banked: "3.32",
        owner: ".c",
    },
    {
        id: "ECD D-6",
        what: "EditorControlsDock",
        banked: "1.97",
        owner: ".c",
    },
    {
        id: "EV D·D-B3",
        what: "EquationView",
        banked: "2.02–3.57",
        owner: ".b",
    },
    {
        id: "PS D-B2",
        what: "PaperSidebar label — axe grades it CLEAN, which is why this gate exists",
        banked: "2.39 / 3.00",
        owner: ".e",
    },
    {
        id: "PV D/M-8",
        what: "PaperView",
        banked: "2.88",
        owner: ".e",
    },
];
