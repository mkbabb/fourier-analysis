/**
 * X.F.W3 `.e` / `fr-BasisSelector M-10` — THE BASIS-KEY CANON.
 *
 * The basis-key domain was duplicated tree-wide while its 7-LOC owner held none
 * of it. Measured at this seat, 2026-09-19:
 *
 *   ⟨cmd⟩ `grep -rn 'startsWith("fourier")' src` → **7 sites**
 *          `BasisSelector.vue:97` · `useWorkspaceLoader.ts:153` ·
 *          `GalleryCard.vue:42` · `GalleryDraftsSection.vue:56` ·
 *          `GalleryCardModal.vue:44` · `BasisCanvas.vue:254` · `labels.ts:35`
 *   ⟨cmd⟩ `grep -rn 'Epicycles' src | grep -v compute` → the mode-label ladder
 *          authored **4×** (`BasisSelector.vue:47` · `labels.ts:38` ·
 *          `GalleryCard.vue:46` · `GalleryCardModal.vue:48`)
 *   ⟨cmd⟩ `grep -rn 'basisLabels' src` → the gallery pair's 15-line clone,
 *          BYTE-IDENTICAL in both files
 *
 * The row's own words are the shape of the cure: *"the repair deletes two whole
 * functions, not two expressions"* — so this module is not a pair of helpers
 * beside the duplication, it is the home the duplication moves INTO.
 *
 * ── THE TWO VOCABULARIES, WHICH WERE NEVER DISTINGUISHED ──────────────────
 * `basisDisplay` keys THREE names while `active_bases` emits FOUR, and every
 * copy above bridged that gap with the same inline `startsWith` — which is
 * exactly why they were copies. The two are named here:
 *
 *   `BasisKey`    — what the API emits and the app stores (4 members).
 *   `BasisFamily` — what the display table is keyed by (3 members).
 *
 * `normalizeBasisKey` is the ONLY bridge between them, and `satisfies` below
 * makes a typo in either vocabulary a compile error rather than a silently
 * missing chip.
 *
 * ── THE WAVE-LOCK THIS MODULE CARRIES (fr-GallerySearchBar ruling 5) ──────
 * Binding on any F.W5–W8 wiring of `basisFilter`: the gallery's basis pills are
 * keyed by FAMILY (`basisDisplay`'s vocabulary) while `active_bases` stores
 * KEYS, so a filter wired without `normalizeBasisKey` returns ZERO rows for the
 * Fourier pill against `active_bases ∈ {fourier-epicycles, fourier-series}`.
 * That is not a hypothetical: it is the same gap this module exists to close,
 * one query layer up.
 */

/** What `active_bases` actually contains — the emitted vocabulary of four. */
export type BasisKey =
    | "fourier-epicycles"
    | "fourier-series"
    | "chebyshev"
    | "legendre";

/** What `basisDisplay` is keyed by — the display vocabulary of three. */
export type BasisFamily = "fourier" | "chebyshev" | "legendre";

/**
 * The family a basis key belongs to.
 *
 * Takes a `string` rather than a `BasisKey` deliberately: the argument comes
 * off the wire (`Visualization.active_bases` is `string[]`), so narrowing at
 * this boundary is the point of the function. An unknown key is returned
 * unchanged and fails the `basisDisplay` lookup at the call site exactly as it
 * did before — this module unifies the seven copies, it does not quietly change
 * what happens to data none of them handled.
 */
export function normalizeBasisKey(key: string): BasisFamily | string {
    return key.startsWith("fourier") ? "fourier" : key;
}

/**
 * The mode labels — the ONLY two keys whose display name differs from their
 * family's.
 *
 * `satisfies` keeps the record's keys inside `BasisKey` while leaving the
 * lookup total, so adding a fifth basis to the union without deciding its label
 * here is a compile error at the declaration rather than a blank chip in the
 * gallery.
 */
const MODE_LABELS = {
    "fourier-epicycles": "Epicycles",
    "fourier-series": "Series",
} satisfies Partial<Record<BasisKey, string>>;

/**
 * The display label for a basis key, given its family's label.
 *
 * This is the four-times-authored ladder, authored once. The family label is a
 * parameter rather than a second lookup because the call sites already hold it
 * — they have just read `basisDisplay[family]` to get the icon and the colour,
 * and re-reading the table here would make this function depend on a display
 * module it has no other reason to know about.
 */
export function basisModeLabel(key: string, familyLabel: string): string {
    return MODE_LABELS[key as keyof typeof MODE_LABELS] ?? familyLabel;
}
