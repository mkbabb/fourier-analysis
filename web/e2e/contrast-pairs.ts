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
    // F.REL `.w2` (2026-10-16, COHESION §0fk.1) — RE-POINTED to today's paint.
    // The `.info-chip` plate is DELETED (X.F.W3 `.d` FMD-12; X-DS DS-F3-C13):
    // the readout is four glass `Metric`s, `posture="inline"`, with NO plate
    // (glass `metric/styles.css`: `.metric` ink `--foreground`, `.metric__label`
    // and `.metric__unit` ink `--muted-foreground`), on `.stage-column`'s
    // `background-color: var(--background)` (`FourierMorphDemo.vue`). The
    // readout's affordance is now its weakest ink, the label; the floor is kept.
    // The phase tone (`.phase-value`, `MorphShapePreview.vue`) is the one
    // consumer ink in the row, graded in both of its hues.
    {
        id: "FR-MSP-7",
        what: "the readout's Metric label ink against the page it sits on",
        stack: ["var(--background)", "var(--muted-foreground)"],
        kind: "non-text",
        banked: { light: 1.038, dark: 1.084 },
        owner: ".a",
    },
    ...(
        [
            ["settle", "var(--accent-red)"],
            ["morph", "var(--accent-pink)"],
        ] as const
    ).map(
        ([phase, tone]): ContrastPair => ({
            id: `FR-MSP-7[phase-value ${phase}]`,
            what: `the ${phase} phase reading's toned ink (the hue a quarter toward --foreground)`,
            stack: [
                "var(--background)",
                `color-mix(in oklab, ${tone} 75%, var(--foreground))`,
            ],
            kind: "text",
            banked: {},
            owner: ".a",
        }),
    ),

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
        what: ".grid-cell 1px boundary against its own fill (DS-F12X-C1: weight 1.5px -> 1px, ink unchanged)",
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
    // X-DS fourier pass 11 (DS-F11X-C2): the edge is the selection's alone;
    // the bound mark moved to the tile's caption, `--foreground` on `--card`.
    {
        id: "FMD-18[bound-tile-caption]",
        what: ".grid-cell.is-bound caption against the cell fill",
        stack: ["var(--card)", "var(--foreground)"],
        kind: "text",
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
    // F.REL `.w2` (2026-10-16, COHESION §0fk.1 · the R-e-2 precedent) —
    // `FR-USB-5` ×3 RETIRED. The field is glass-ui's `<Input>` now
    // (`auth/UserSlugBar.vue`: `import { Input } from "@mkbabb/glass-ui/input"`,
    // its only class `w-full fira-code`), so the resting border, the focus
    // border and the placeholder are the producer's `field-control` paint, with
    // no consumer expression left to grade. A row for a paint nothing renders
    // could only pass on a stack the page never shows. The producer reading of
    // the three rides the BK relay `valuejs-outbound-2026-10-16-frel-w2-bk-relay.md`.

    // ── fr-PaperSearchModal PSM-4 ──
    // *"`--muted-foreground` diluted to 45%/50%/40% via `color-mix(…,
    // transparent)` composites to 1.88:1 (hint, light) / 2.39:1 (dark) / 2.04:1
    // (empty) / 1.74:1 (placeholder)"*. The modal plate is
    // `PaperSearch.vue:53` `background: var(--background)`.
    // F.REL `.w2` (2026-10-16, COHESION §0fk.1) — RE-POINTED to today's paint.
    // The three dilutions are gone: the modal's own chrome ink is ONE rung,
    // `paper/search/PaperSearchModal.vue` `.search-palette-hint { color:
    // var(--muted-foreground-strong) }` ("`PSM-4`: the strong rung"), and the
    // empty state and the field are the producer's `DialogContent`/`Command*`.
    // The three ids are kept for life (anti-rename) and each grades that rung.
    ...([40, 45, 50] as const).map(
        (pct): ContrastPair => ({
            id: `PSM-4[muted-foreground@${pct}%]`,
            what: `modal chrome ink (authored at ${pct}%; today the strong muted rung)`,
            stack: ["var(--background)", "var(--muted-foreground-strong)"],
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
    // F.REL `.w2` (2026-10-16, COHESION §0fk.1) — `[instance]` RE-POINTED:
    // `equation/EquationResult.vue` `.copy-ok { color: var(--section-color-4) }`
    // (the app's meaning-bearing ramp; `green-500` is gone).
    {
        id: "FR-EQR-7[instance]",
        what: "the copied Check glyph (--section-color-4) on the result card",
        stack: ["var(--card)", "var(--section-color-4)"],
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
    // F.REL `.w2` (2026-10-16, COHESION §0fk.1) — plate and border RE-POINTED
    // to `gallery/GalleryAdminBanner.vue` `.admin-banner { border-color:
    // var(--viz-amber); background: color-mix(in srgb, var(--viz-amber) 10%,
    // transparent) }`. The wash plate is RED-with-cause (`.d`'s standing ruling:
    // a 10% wash cannot reach 3:1 and stay a wash; the register is carried by
    // the border and the mark) and is held BY PAIR ID in `producer-held.json`
    // `pairs`. The two tier numerals are producer registers, held by pair id too
    // and relayed (BK, ADOPT-AT-LANDING); their plate is the same wash.
    {
        id: "GAB-1[plate/page]",
        what: "the admin plate against the page — is there an admin register at all",
        stack: ["var(--background)", "color-mix(in srgb, var(--viz-amber) 10%, transparent)"],
        kind: "non-text",
        banked: { light: 1.03 },
        owner: ".d",
    },
    {
        id: "GAB-1[border]",
        what: "the admin plate's 1.5px border against the page",
        stack: ["var(--background)", "var(--viz-amber)"],
        kind: "non-text",
        banked: { light: [1.25, 1.27] },
        owner: ".d",
    },
    {
        id: "GAB-1[--tier-featured value]",
        what: "the featured numeral — the colour chosen to distinguish the tier",
        stack: [
            "var(--background)",
            "color-mix(in srgb, var(--viz-amber) 10%, transparent)",
            "var(--tier-featured)",
        ],
        kind: "text",
        banked: { light: 1.45 },
        owner: ".d",
    },
    {
        id: "GAB-1[--tier-saved value]",
        what: "the saved numeral on the same plate",
        stack: [
            "var(--background)",
            "color-mix(in srgb, var(--viz-amber) 10%, transparent)",
            "var(--tier-saved)",
        ],
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
    // F.REL `.w2` (2026-10-16, COHESION §0fk.1) — RE-POINTED to the glass
    // `Badge` tones. `admin/AdminAuditLog.vue` `AuditActionCell` renders each
    // action as `<Badge>`: a destructive verb is `variant="secondary"
    // tone="destructive"` (glass `badge`: `bg-destructive
    // text-destructive-foreground`), every other action `variant="outline"
    // tone="neutral"` (`badge-atom--outline text-foreground`, no fill: the ink
    // sits on the row's `--card`). The five ids are kept for life; each grades
    // the Badge its fixture action renders today (`actionTone` by verb).
    ...(
        [
            ["delete", ["var(--destructive)", "var(--destructive-foreground)"]],
            ["set_user_status", ["var(--foreground)"]],
            ["set_tier/dismiss", ["var(--foreground)"]],
            ["batch", ["var(--foreground)"]],
            ["default", ["var(--foreground)"]],
        ] as const
    ).map(
        ([tone, paint]): ContrastPair => ({
            id: `AA-3[${tone}]`,
            what: `the ${tone} action's glass Badge ink — the action string itself`,
            stack: ["var(--card)", ...paint],
            kind: "text",
            banked: { light: [1.36, 1.81] },
            owner: ".d",
        }),
    ),
    // ── F.REL `.w2` (2026-10-16, COHESION §0fk.1) — THE SIX AWAITING PAIRS,
    // AUTHORED. Each stack is read from the code that paints it today, never
    // from a screenshot; each keeps the floor §4 booked it against.

    // fr-ConvergencePlot `FR-CP-D1` — the canvas axes. `equation/ConvergencePlot.vue`
    // reads `ink = getComputedStyle(canvas).color` off a canvas classed
    // `text-muted-foreground`; `lib/equation/grid.ts` strokes the axes in that
    // ink at `globalAlpha = AXIS_ALPHA` (0.8). The plot composites over the
    // stage card, `--card` (the registry's adopted plate correction).
    {
        id: "FR-CP-D1",
        what: "ConvergencePlot axes: --muted-foreground at the canvas's AXIS_ALPHA 0.8",
        stack: ["var(--card)", "color-mix(in srgb, var(--muted-foreground) 80%, transparent)"],
        kind: "non-text",
        banked: { light: 1.19, dark: 1.38 },
        owner: ".b",
    },
    // fr-EditorControlsDock `ECD D-5` — the `.dock-badge` is glass `Metric`
    // `.dock-count` now (`visualization/EditorControlsDock.vue` `#persistent`,
    // UIA-F-242): value `--foreground`, unit "pts" `--muted-foreground`, the
    // weaker ink graded. `D-6` — the saved Check: `.is-save.saved { color:
    // var(--success) }` on `.is-save`'s plate `color-mix(in srgb,
    // var(--foreground) 6%, transparent)`. Both over the page, the registry's
    // recorded bound (the autoLuminance premise is dead; the glass composite is
    // SS-13's).
    {
        id: "ECD D-5",
        what: "the dock's point-count Metric unit ink against the page",
        stack: ["var(--background)", "var(--muted-foreground)"],
        kind: "text",
        banked: { light: 3.32 },
        owner: ".c",
    },
    {
        id: "ECD D-6",
        what: "the saved Check glyph on the Save control's own plate",
        stack: [
            "var(--background)",
            "color-mix(in srgb, var(--foreground) 6%, transparent)",
            "var(--success)",
        ],
        kind: "non-text",
        banked: { light: 1.97 },
        owner: ".c",
    },
    // fr-EquationView `EV D·D-B3` — the tier pill is glass `<Badge
    // :tone="tierTone">` (`equation/EquationView.vue`, UIA-F-253; `TIER_TONE`
    // symbolic→success · identified→warning · spline→info; glass `badge`:
    // `bg-<tone> text-<tone>-foreground`), and the energy reading is glass
    // `Metric` (unit "% energy", `--muted-foreground`), both on `PopoverContent`.
    ...(
        [
            ["symbolic", "success"],
            ["identified", "warning"],
            ["spline", "info"],
        ] as const
    ).map(
        ([tier, tone]): ContrastPair => ({
            id: `EV D·D-B3[tier ${tier}]`,
            what: `the ${tier} tier Badge (${tone} tone) label`,
            stack: ["var(--popover)", `var(--${tone})`, `var(--${tone}-foreground)`],
            kind: "text",
            banked: tier === "identified" ? { light: 2.02 } : tier === "spline" ? { light: 3.57 } : {},
            owner: ".b",
        }),
    ),
    {
        id: "EV D·D-B3[energy]",
        what: "the energy Metric's unit ink on the popover",
        stack: ["var(--popover)", "var(--muted-foreground)"],
        kind: "text",
        banked: {},
        owner: ".b",
    },
    // fr-PaperSidebar `PS D-B2` — the "Contents" label, `paper/PaperTocDrawer.vue`
    // `.sidebar-label { color: var(--muted-foreground) }` (full strength; was
    // the 60% dilution) over the drawer's `--card`.
    {
        id: "PS D-B2",
        what: "the ToC drawer's Contents label on its card",
        stack: ["var(--card)", "var(--muted-foreground)"],
        kind: "text",
        banked: { light: 2.39, dark: 3.0 },
        owner: ".e",
    },
    // fr-PaperView `PV D/M-8` — the page readout, `paper/PaperPageReadout.vue`
    // `.page-readout { color: var(--muted-foreground-strong) }`, no plate of its
    // own. Both of its hosts are glass's opaque surface (`data-surface="opaque"`:
    // solid `--card`; X-DS DS-F7X-C1, `5fbe1cf`): the desktop rail in
    // `PaperTocDrawer.vue` and the phone `.floating-toc-bar--trigger` in
    // `PaperTocBar.vue`. One plate, so one row.
    {
        id: "PV D/M-8",
        what: "the page readout on the ToC hosts' opaque --card",
        stack: ["var(--card)", "var(--muted-foreground-strong)"],
        kind: "text",
        banked: { light: 2.88 },
        owner: ".e",
    },
];

/**
 * §4 names further pairs whose ink is painted, not declared. Each was declared
 * here at F.W4 and the harness FAILED on every one until its stack was
 * authored: an un-re-derived pair is an open hole in the gate, not a pass.
 *
 * F.REL `.w2` (2026-10-16, COHESION §0fk.1) authored the six (`FR-CP-D1`,
 * `ECD D-5`/`D-6`, `EV D·D-B3`, `PS D-B2`, `PV D/M-8`) into `CONTRAST_PAIRS`
 * above, read from the code that paints each. The roster is EMPTY, which is how
 * it closes. ⊘ It stays exported and asserted: a pair named later without a
 * stack enters here and turns the gate RED again.
 */
export const PAIRS_AWAITING_THEIR_OWNER: Array<{
    id: string;
    what: string;
    banked: string;
    owner: string;
}> = [];
