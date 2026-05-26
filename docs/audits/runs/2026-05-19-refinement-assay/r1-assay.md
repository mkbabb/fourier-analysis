# R1 — Cross-repo assay (state of the world)

**Authored**: 2026-05-26.
**Mission**: reconstruct what actually happened in fourier and value.js since the 2026-05-18 cohort plan was authored, so R5's canonical ordering can be ordered against reality.
**Mode**: read-only assay.

## 1 — fourier-analysis state of the world

### git state

- Branch `master`, ahead of `origin/master` by 1 commit. Most recent commit `926ca6a` (2026-05-18) — `fix(resolution): adopt cross-repo dev-resolution contract consumer half (glass-ui Q.W1 Lane D)`. **No commits since 2026-05-18.**
- Working tree: **109 uncommitted paths** (verified): 62 modified + 31 deleted + 16 untracked. Exact match to the count A.md §1 + A.W1 deletion-ledger assert.
- Tranche A authored 2026-05-18 (plus the harden + crud-deepen + utility-extraction refinements logged at A/PROGRESS through 2026-05-19). Tranche B authored 2026-05-18 (research-first, opens after A close). Neither has run a single execution wave.

### 109 files by category (from `git status --short` grouped)

| Category | Path roots | Count |
|---|---|---|
| Frontend Vue/TS migration cohort | `web/src/components/**`, `web/src/lib/**`, `web/src/composables/**`, `web/src/stores/**`, `web/src/router/`, `web/src/styles/`, `web/index.html`, `web/DESIGN.md`, `tsbuildinfo` | ~85 (the bulk — the glass-ui v1.x migration cohort A.W1 is meant to attribute and land) |
| Backend Python | `api/routers/{admin,contours,equations,gallery,images}.py`, `api/services/{database,janitor,rate_limiter}.py`, `api/models/{gallery,admin}.py`, `api/main.py`, `api/dependencies.py` | 12 |
| Infra / Docker / nginx | `api/Dockerfile`, `docker-compose.yml`, `docker-compose.prod.yml`, `nginx/fourier.conf`, `scripts/dev.sh`, `.env.example`, `.gitignore` | 7 |
| Plan substrate (untracked) | `.gitmodules`, `docs/precepts/`, `docs/instructions/`, `docs/tranches/`, `docs/audits/` | 5 |

The shape exactly matches A.md's W1 + W4 + W5 ownership tables. A's "lands the 109-file cohort" claim is verified against current reality — every uncommitted path is in scope. No work has happened on B (B requires A close).

### A / B execution

- **A**: every wave `planned`; zero waves dispatched. No execution commits exist.
- **B**: every wave `planned`/`provisional`; zero waves dispatched. B's research wave (Wα) has not opened (it opens after A.W6 close).
- Last activity on either: 2026-05-19 (utility-extraction refinement round logged to PROGRESS, but no code/file deliverables landed).

## 2 — value.js tranche-by-tranche summary C → H

| Tranche | Open | Close | Theme (one-line) |
|---|---|---|---|
| C (cohort peer) | 2026-05-18 (planning-only) | NEVER opened | CRUD facility convergence with fourier-B; research-first; gated on value.js-B close AND fourier-B.W1 ratify. |
| D | 2026-05-19 | 2026-05-20 (v0.6.0) | Contract-v2 alignment + api/ god-module refactor + frontend cohesion + L8 Color flatten + Playwright 3→21. |
| E | 2026-05-20 | (closed pre-F; v0.7.0) | Architectural transpositions in src/ + pipeline parity (`routes/sessions.ts` + `routes/colors.ts` retire) + cross-repo consumption of glass-ui `./styles.css`. |
| F | 2026-05-20 | (closed; v0.8.0) | "No deferrals" + `lerpLegacy` retirement + W8-W12 substrate hygiene back-reference + CI hardening. |
| G | 2026-05-21 | 2026-05-21 (v0.9.0) | Type-system completion (`as any` corpus → 0) + decomposition of `src/units/color/utils.ts` 1430 LoC → 9 modules + invariant codification via 6 proof scripts. |
| H | 2026-05-22 | OPEN (planning-only; H.W0 ratified, H.W1+ awaiting dispatch) | Cascade-correctness (`createPalette` + `patchPalette` `withTransaction`) + `as unknown as` ≤ 3 + demo decomposition + proof-script extension. |

### Did D/E/F/G/H touch the cohort plan's CRUD targets?

| Cohort plan target | What value.js D-H actually did | Status |
|---|---|---|
| `routes/palettes.ts:formatPalette` `??` fallback | **EXCISED at D.W2 Lane D** (`ee8bfa4`, F1 disposition); the file is now `api/src/format/palette.ts` and its docstring states "Pre-migration `??` defaults were excised". Verified at `/Users/mkbabb/Programming/value.js/api/src/format/palette.ts`. | DONE (D) |
| `cron.ts:24` unbounded `$nin` | **EXTIRPATED at E.W2 Lane A**; cron now reads from a typed repository surface (`sessions.deleteExpired`, `sessions.deleteStale`, `votes.deleteOrphaned(paletteSlugs)`) — no `$nin` exists in `api/src/cron.ts` at HEAD. | DONE (E) |
| palette-api god modules (`palettes.ts` 845 / `admin.ts` 750) | **D.W2 split**: palettes.ts → 5 concerns; admin.ts → 8 concerns; 9 repositories interpose between routes and `db.collection(...)`; `withTransaction` introduced and extended through G.W3 + (open) H.W1. | DONE (D + E + G + H) |
| Service / repository / errors / validation layering | D.W2 Lane C landed 20 files (`db/collections.ts`, `models.ts`, 9 repositories, `errors/`, `events/auditLog.ts`, DI middleware, zod schemas). | DONE (D) |
| `withTransaction` cross-collection coverage | G.W3 expanded to 4 sites; H.W1 (planned) closes the class (`createPalette` + `patchPalette` defect). | IN PROGRESS (G done, H planned) |
| `as any` / `@deprecated` / `@ts-ignore` corpus | All three at **0** in `src/`, codified by proof scripts (F + G). | DONE (F + G) |
| `slugWords.ts` (still present, 108 LoC) | Untouched as a *facility* by D-H. The file still lives at `api/src/slugWords.ts`, consumed by `UserRepository`. **No `slug-words.json` shared-data extraction**, **no relocation to `docs/precepts/data/`**, **no `@mkbabb/slug-words` package**. | NOT DONE |
| `CRUD-CONTRACT.md` (the shared contract artefact) | **NEVER created on value.js side**. The 13-section spec authored at fourier-B coordination 2026-05-19 has no value.js sign-off, no commit referencing it, no `proof:cohort-conformance` script. | NOT DONE |
| Library `Palette` domain type at `src/palette/` | **NEVER landed**. The library has no `src/palette/` directory; `Palette` lives only at `demo/@/lib/palette/types.ts` (the demo storage shape — which C.W1 explicitly proposed to rename to `PersistedPalette` but never did). | NOT DONE |
| `colorScale` + `sampleToSVGPath` library lifts | **NEVER landed** as named library exports. | NOT DONE |
| `palette-schema` migration + ownership / visibility 3-state | Not addressed. The `Palette` model still carries `userSlug: string | null` (the legacy-allowed orphan path the cohort plan explicitly forbids via the required-non-null-owner invariant 14). | NOT DONE |
| `api/src/crud/` utility module (U4 spec, ≤500 LoC) | **NEVER created**. No directory exists at `api/src/crud/`. | NOT DONE |
| `coordination/CRUD-CONSTELLATION.md` mirror in value.js | Does not exist at value.js side. The fourier-side document still cites it. | NOT DONE |

### Cross-reference signal

The value.js D / E / F / G / H **FINAL.md texts make zero references** to:
- `CRUD-CONSTELLATION.md`, `CRUD-CONTRACT.md`, "cohort", "fourier-B" — never appear.
- The single fourier-analysis mention across all five FINAL.md files reads (G §10): **"fourier-analysis: chronic 109-file dirty tree (unchanged)"**. F.FINAL §F3 lists `fourier-analysis` only to confirm zero cross-repo writes. E.FINAL §E5 names "fourier-analysis Phase-0" as a deferred (a)(b)(c) item with no progress.
- H's `coordination/Q.md §15` records: "Peer repo (fourier-analysis): HEAD `926ca6a` — ZERO drift. 109-file dirty tree exact. Chronic."

**Verdict**: D's "Contract-v2 alignment" is **a different contract** (the glass-ui post-Q dev-resolution contract at `68d9b20`, not the cohort's `CRUD-CONTRACT.md`). The two contracts share the word "contract" and nothing else.

## 3 — Cohort CRUD disposition

**Status: partially absorbed, organically — never executed as a contract.**

What value.js absorbed under different letters:
- The *engineering hygiene* the cohort plan would have produced via the contract (formatPalette fallback excision, unbounded `$nin` retirement, service/repository layering, withTransaction, type strictness, no-legacy-code) — **all landed**, distributed across D / E / F / G / H, *without ever opening tranche C and without ever ratifying the cohort contract*. value.js cleaned its own house at its own cadence.

What the cohort plan demanded that did NOT land:
- The shared **CRUD-CONTRACT.md** artefact (never sign-off'd by value.js; no value.js commit cites it).
- The **library `Palette` domain type** (the library `src/palette/` directory does not exist).
- The **`colorScale` + `sampleToSVGPath`** library lifts (never landed).
- The **shared slug-words data** extraction (never extracted).
- The **`api/src/crud/` utility module** (never authored).
- The **palette schema migration to required-non-null-owner + 3-state visibility** (Palette.userSlug still `string | null`).
- The **`coordination/CRUD-CONSTELLATION.md`** mirror on value.js side (does not exist).
- value.js-C itself — `docs/tranches/C/` is still in place with `C.md` + `PROGRESS.md` + `coordination/CRUD-CONSTELLATION.md` (mirror) + `research/` + `waves/W1.md`/`W2.md`/`W3.md`, status `planned` for every wave. The directory was acknowledged at D.W0 ("acknowledged but not D's") and orphaned thereafter.

value.js-C disposition: **planning-only at 2026-05-18, never opened, structurally orphaned by the D→E→F→G→H sequence**. The letter was not re-purposed; D went straight to the next letter and never came back. The plan still exists on disk in both repos but neither has a path to it from current HEAD.

H.md / H Q.md confirm: H carries the cohort relationship forward **only as a "ZERO drift" coordination row** (i.e. as a noted-but-untouched state). H does NOT carry CRUD convergence; H's theme is the value.js-internal axes (cascade-correctness, type-system II, demo decomposition, invariant codification II). fourier-analysis is now a **peer with no live counterpart tranche** in value.js.

## 4 — Cross-repo dependency status (fourier-B.W4 → value.js-C.W1)

The named single hard cross-repo dependency: **fourier-B.W4 consumes the published version of `value.js@C.W1` (library `Palette` + `colorScale` + `sampleToSVGPath`)**.

Reality check:
- value.js-C never opened. value.js-C.W1 cannot publish what was never authored.
- value.js library does not ship `Palette`, `colorScale`, or `sampleToSVGPath`. Current published version is **v0.9.0** (G close). No commit since v0.6.0 (D close) has introduced a `Palette` domain class to `src/`.
- H is closed-scoped to value.js-internal hygiene with explicit `F3` H-default of **zero cross-repo writes**. H.W1-W5 (planned) does not even mention `Palette`.
- The next value.js tranche after H (call it I or J) has no seed for `Palette` either — `G/H-SEED.md` lists glass-ui primitives, Rolldown markers, keyframes.js precept-pin, and `MetaballCanvas` migration. **No CRUD seed, no Palette seed.**

**Honest fallback** (already named in B.md §7 + B/PROGRESS): if `value.js-C.W1` is not published at B.W4 dispatch, B.W4 lands everything *except* the `colors.ts` gut-onto-value.js. The `colors.ts` gut becomes a named B-residual destination. At today's reality this is no longer a hypothetical — it is the *certain* path forward unless the user explicitly re-opens the cohort.

The contract-ratification dependency (fourier-B.W1 → value.js-C sign-off) is in the same state: value.js has no live tranche willing to sign the contract.

## 5 — Recommended canonical-ordering implications (input for R5)

The 2026-05-18 cohort plan presumed two repos moving in lockstep. value.js then ran 5 tranches (D-H) in 4 days without engaging the cohort. R5's canonical ordering must be ordered against THIS:

1. **fourier-B's "library Palette" dependency is dead in the water and must be reframed.** value.js will not ship `src/palette/Palette` on the cohort's terms (it has had five chances and not done so; H explicitly defaults to zero cross-repo writes; no successor seed exists). R5 should EITHER (a) re-author fourier-B to drop the library-Palette consumption entirely and gut `colors.ts` onto value.js's *existing* surface (`parseCSSColor`, `mixColors`, `color2`, gamut mapping — all already shipping), accepting that `colorScale` + `sampleToSVGPath` get reimplemented as fourier-internal helpers; OR (b) treat fourier-B.W4's `colors.ts` gut as the canonical residual destination from day one and ship B without it. Path (a) is more honest. Path (b) preserves more of B.md unchanged.

2. **The CRUD-CONTRACT.md artefact has lost its second peer; it should be re-scoped as a fourier-only spec.** With value.js running independently and incidentally landing 6/13 contract sections under different letters, the contract is no longer *converging two backends*; it is *describing one backend* (fourier) plus a *compliance audit* of value.js's already-landed work. R5 should either (a) re-frame CRUD-CONTRACT.md as fourier's own architectural document (drop "ratified by both repos"), or (b) downgrade it to a one-page compliance memo noting which sections value.js *happens* to already satisfy. The 118-row CONFORMANCE-MATRIX should be re-scoped accordingly — the value.js column is now an observation, not a deliverable.

3. **fourier-A is the binding gate and remains entirely undispatched.** Every fourier-side problem (109 dirty files, override stylesheets, primitive adoption, scaling, admin parity, the contour-hash correctness bug) is gated on fourier-A. A has had its plan stable for 8 days with zero execution. R5's canonical ordering must put fourier-A.W0 dispatch at the top. The cohort coordination layer (B + value.js-C) was always downstream of A close; today it is *additionally* downstream of the realization that there is no live value.js peer. Treat A as a fourier-internal tranche with no cross-repo blockers and run it now; let B be re-synthesized after A close against the value.js-is-not-coming reality.

### Bonus implications

- **fourier-B's wave shape may compress.** Without a value.js peer to coordinate, B.W2 (the cross-repo tracking row) is moot and deletes. B's research wave (Wα) should re-scope away from "joint with value.js" and toward "fourier-internal architectural rewrite of its own CRUD given the value.js facility we already consume."
- **The `api/lib/crud/` utility module spec (U3) is still valid stand-alone work for fourier**, even if its paired `api/src/crud/` (U4) never lands on value.js — the per-language module is by design framework-free and language-local.
- **The `coordination/SLUG-WORDS.md` (U2) shared-data extraction** loses its second consumer; reduce it to a fourier-internal `slugs.py` clean-up unless the user wants to push the word-list package alone.

### Authority pins

- fourier HEAD: `926ca6a` (2026-05-18). 109 uncommitted paths.
- value.js HEAD: `a12a71d` (H.W0 close ratification, 2026-05-26). On `tranche-h` branch.
- value.js master tag at HEAD-relative: `v0.9.0` at `e166d37` (G merge).
- Cohort plan substrate: fourier-side intact at `docs/tranches/B/`; value.js-side intact at `docs/tranches/C/`; both remain at `planned` for every wave.
