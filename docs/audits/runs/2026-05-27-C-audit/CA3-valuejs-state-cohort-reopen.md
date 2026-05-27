# CA3 — value.js current state + the cohort-reopen verdict

**Audit lane**: CA3 (fourier-analysis tranche-C DEVELOPMENT phase).
**Authored**: 2026-05-27.
**Mode**: READ-ONLY. No source edits, no commits, no writes to `~/Programming/value.js`.
**Charter question**: "In both value.js and herein. What is next for tranche C?" — determine value.js's current state and what a value.js re-engagement would need to host the colour-domain lift (the cohort reopen). This decides whether fourier-C is fourier-only or reopens the cross-repo cohort.

**One-line answer**: value.js-H is **CLOSED at v0.10.0** (`16129e0`); I is **seeded but unscoped** (no thesis pre-declared, no I-mandatory items); the colour-domain lift (`Palette` + `colorScale` + `sampleToSVGPath`) is **still wholly absent** from the library. The cohort-reopen verdict is **(a) — a value.js tranche must publish the library colour-domain surface with fourier-C consuming**, and the lift needs a **dedicated value.js tranche (or a forward-themed I)**, NOT a fold into the existing I-SEED ledger (which carries zero palette-domain work).

---

## §1 — value.js current state (H closed; I-SEED summary)

### H is closed — v0.10.0

| Fact | Value | Source |
|---|---|---|
| Tranche H status | **CLOSED** 2026-05-26 | `value.js/docs/tranches/H/FINAL.md` |
| Tag | **v0.10.0** | `git describe --tags` → `v0.10.0`; `package.json` "version": "0.10.0" |
| Master HEAD | **`16129e0`** ("Merge tranche-h into master — Tranche H close (v0.10.0)") | `git log --oneline -1` |
| Executed lineage | A → B → **C[RETIRED]** → D → E → F → G → H | `H/FINAL.md`; `C/FINAL.md` |
| Precepts pin | `68d9b20` (unchanged through D–H) | `H/FINAL.md §3` |

**What H delivered** (`H/FINAL.md §1` — four axes, all SATISFIED; H was *polish-grade, not structural rescue*):
- **Axis 1 — cascade-correctness**: `withTransaction` coverage 7 → **16** sites; `createPalette`/`patchPalette` orphan-version defect repaired; standing reference `audit/api-withTransaction-coverage.md`.
- **Axis 2 — type-system completion II**: `as unknown as` corpus 4 → **2** in `src/` (both irreducible: DOM `CSSStyleDeclaration` + clone-reinterpret); codified by `proof:as-unknown-as-budget` (budget 2, no headroom).
- **Axis 3 — demo decomposition**: every `demo/` file ≤ 400 LoC (`palette/api.ts` 484 → 9 modules; two Vue sub-component lifts; `colorSpaceInfo` data lift).
- **Axis 4 — cross-tree invariant codification**: all 9 proof scripts at full applicability; `api/tsconfig.json` lifted to root strictness (4 flags; 36 errors repaired genuinely).
- **Release surface**: INTERNAL-only, no BREAKING. v1.0.0 was *deferred* (a separate marketing/comms decision, not orchestrator-defaulted).

**Crucially**: H's thesis was cascade-correctness + type/demo polish. **It touched ZERO palette-domain library work.** The cohort colour-domain lift was never on H's roadmap and was explicitly out of bounds (`H.md §5`: `fourier-analysis/` read-only; `docs/tranches/C/` "not H's to write").

### I-SEED summary (the predecessor-authored forward-carry ledger)

`value.js/docs/tranches/H/I-SEED.md` is **advisory, not binding**. It explicitly declares:

> "The H-thesis closing left no immediate 'you must fold this in I' items."
> "The next 'theme' question is open. … The I-thesis is to be decomposed at I open, not pre-declared here."

I-SEED proposes **no concrete tranche thesis**. It offers three candidate *postures* for I (§4):
1. **forward-themed** — pick a new architectural direction (its examples: "Metaballs migration if speedtest's `glass-ui/MetaballCanvas` lands; CSS Custom Properties first-class; OKLCH gamut-mapping perf; etc.").
2. **maintenance-themed** — a no-thesis dep-bump + chronic-carry-retirement tranche.
3. **API-themed** — backend-focused (cron transactional semantics; api/ decomposition; new endpoints).

I-SEED §3 enumerates **8 advisory audit pointers** (#1 demo `as any` ratio; #2 `dispatch.ts` LoC drift; #3 `as unknown as` irreducibles; #4 chronic 6-tranche glass-ui/keyframes carries; #5 speedtest-doesn't-consume-value.js; #6 bench-gate shell extraction; #7 cron transactional semantics; #8 perf regression watch).

**Not one of the 8 pointers, nor any of the 3 postures, references the palette/colour domain lift.** I-SEED is silent on `Palette`/`colorScale`/`sampleToSVGPath` — consistent with value.js-C's FINAL declaring the library-`Palette` axis "ORPHANED absent user re-mandate" and "not on value.js's roadmap" without that re-mandate. The lift exists only in the RETIRED C plan and the fourier-B latent-affordance hand-off — there is no live value.js artefact that schedules it.

---

## §2 — Live colour/palette surface at v0.10.0 (what exists / what is absent)

Enumerated empirically against `~/Programming/value.js` HEAD `16129e0`.

### What EXISTS (the colour authority is rich — but it is a *colour-conversion* library, not a *palette-domain* library)

`src/index.ts` barrel surface (colour-relevant):
- **Colour classes** (`src/units/color/`): `Color`, `RGBColor`, `HSLColor`, `HSVColor`, `HWBColor`, `LABColor`, `LCHColor`, `OKLABColor`, `OKLCHColor`, `XYZColor`, `KelvinColor`, `LinearSRGBColor`, `DisplayP3Color`, `AdobeRGBColor`, `ProPhotoRGBColor`, `Rec2020Color`.
- **Conversion / mixing** (`dispatch.ts`, `mix.ts`): `color2`, `gamutMap`, `interpolateHue`, `mixColors`, `mixColorsN`, `computeSafeAccent`, `safeAccentColor`, `getOklchLightness`.
- **Gamut** (`gamut.ts`): `deltaEOK`, `gamutMapOKLab`, `gamutMapSRGB`, `srgbToOKLab`, `oklabToRgb255`, `findCusp`, `findGamutIntersection`, etc.
- **Parsing** (`parsing/color.ts`): `CSSColor`, `parseCSSColor`, `registerColorNames`.
- **Quantization** (`src/quantize/`): `quantizePixels`, `dominantColor`.
- **Colour-filter solver** (`colorFilter.ts`): `rgb2ColorFilter`, `cssFiltersToString`.
- **Interpolation** (`src/units/interpolate.ts`): `lerpColorValue`, `lerpValue`.
- **Math** (`src/math.ts`): `clamp`, `scale`, `lerp`, `logerp`, `deCasteljau`, `cubicBezier`, `interpBezier`, **`cubicBezierToSVG`**, `cubicBezierToString`.
- **Easing** (`src/easing.ts`): the full timing-function corpus + `cssLinear`, `bezierPresets`, `solveCubicBezierX`.

### What is ABSENT (the cohort deliverables value.js-C RETIRED)

| Target | State at v0.10.0 | Proof |
|---|---|---|
| `src/palette/` directory | **ABSENT** | `find src -iname 'palette*'` → empty |
| Library `Palette` **domain** type (ordered colour stops + named ramps; serialize/deserialize; gamut-safe ops) | **ABSENT** | no `src/palette/`; barrel exports no `Palette` |
| `colorScale(stops, t, opts?)` | **ABSENT** | `grep -rn 'colorScale' src/` → empty |
| `sampleToSVGPath(fn, n)` | **ABSENT** | `grep -rn 'sampleToSVGPath' src/` → empty |

Matches `value.js/C/FINAL.md §2 Axis 2` verbatim — the library-`Palette` axis never landed; D–H never required it.

### The two pre-existing generalisation candidates (the "latent affordance" inside value.js itself)

1. **`cubicBezierToSVG` at `src/math.ts:69`** — the `sampleToSVGPath` generalisation candidate flagged at the prior H5 hardening. Its body (lines 69–84) is a hardcoded, single-purpose sampler: fixed `0.001` step, fixed `M0 0` origin, embeds `<circle>` debug markers, hardwired to `cubicBezier(t,...)`. A general `sampleToSVGPath(fn, n)` would parameterise the function-under-sample, the sample count `n`, and drop the debug markers. **It is a candidate, not a substitute** — the generalisation is real engineering work, not a rename.

2. **api-side `Palette` is the PERSISTED-DOC type, NOT the library domain type.** `api/src/models.ts:66` defines `interface Palette` with storage/identity fields (`slug`, `voteCount`, `sessionToken`, `userSlug`, `status`, `createdAt`, `currentHash`, `forkOf`, `versionCount`, `oklabColors`). This is the *persistence* shape, correctly resident in the app per cohort invariant 15 (domain in library, persistence in app). The **library domain `Palette`** (pure: ordered stops + named ramps + pure operations, no slug/owner/storage) does **not** exist anywhere in value.js. Invariant 15 is satisfied only in *form* (library = colour types, api = storage); the *intended load-bearing split* — a pure domain `Palette` the api's persisted `Palette` would layer over — was never realised (`C/FINAL.md §4`, cohort-15 "load-bearing miss").

---

## §3 — The cohort-reopen verdict (a / b / c with rationale)

### Q3 first — is the latent CRUD-CONTRACT still consumable?

**YES.** The CRUD-CONTRACT was ratified fourier-unilaterally at fourier-B.W1 (`4626d4c`) and reconciled to 187 conformance rows (`B/FINAL.md §3`). Per `CRUD-CONSTELLATION.md` (orphan-discharge note) and `B/FINAL.md §6/§8`, it is explicitly preserved as the **latent affordance a future value.js re-engagement consumes — it need not re-research, only adopt.** The contract's binding force at §0 is *mandatory-fourier-side; advisory-both-sides on cohort-reopening*. A value.js re-engagement therefore inherits a complete, fourier-validated contract surface (slug, ownership, visibility, soft-delete, sessions, admin, cron, conformance matrix) **and value.js-side conformance rows are already held DEFERRED awaiting exactly this** (`B/FINAL.md §6`). The latent affordance is live and consumable. The colour-domain lift (`Palette`/`colorScale`/`sampleToSVGPath`) is a *library-layer* concern adjacent to — not gated by — the contract; the contract governs the *persistence/identity* layer.

### Q4 — the recommendation: **(a), realised as a forward-themed value.js tranche.**

**Verdict: (a)** — a value.js tranche publishes the library colour-domain surface (the pure `Palette` domain type + `colorScale(stops, t)` + `sampleToSVGPath(fn, n)`), npm-version-bumps, and fourier-C consumes the published surface (gutting `web/src/lib/colors.ts` onto the library `Palette` and retiring the `web/src/lib/easings.ts:89` `generateCurveSVGPath` workaround onto `sampleToSVGPath`).

**Why not (b) — fourier abandons the lift, keeps `colors.ts` internal:**
- (b) is the *current* fourier-B fallback state: `web/src/lib/colors.ts` (117 LoC, `VIZ_COLORS.fourier` etc.) and `web/src/lib/easings.ts:89` are unchanged byte-identical (`B/FINAL.md §1 (d)`, diff empty). Keeping it *permanently* internal violates **cohort invariant 15** (domain model belongs in the library, not duplicated in each consumer) — the precise miss `C/FINAL.md §4` names as load-bearing. (b) also strands fourier's own colour primitives as a private fork of capability value.js is the designated authority for, and leaves the ratified contract's colour-domain clause permanently unhonoured. (b) is the *do-nothing* path; it discharges nothing.

**Why not pure (c) hybrid (fourier authors its own palette domain object):**
- A fourier-internal palette domain object (TypeScript, in `web/`) would *also* violate invariant 15's intent (the domain authority is value.js, the colour library; fourier is a consumer). It would create a second colour-domain authority in a Python+Vue repo whose colour identity is borrowed-from-value.js. `CANONICAL-ORDERING §5 β.6` floated this only as a degenerate orphan-fallback ("fourier independently authors its own palette domain object") — explicitly the *worse* branch.

**The recommended shape is (a) with a bounded hybrid carve-out** (call it **a-prime**): value.js publishes the **pure** domain `Palette` + the two functions; fourier-C consumes them AND keeps its *fourier-specific* concerns (the `VIZ_COLORS.fourier` semantic palette constants — which are application-domain colour *choices*, not colour-domain *machinery*) where they belong: in fourier. The lift gut is the *machinery* (scale sampling, SVG path sampling, stop interpolation, the domain type), not fourier's brand-colour table. This honours invariant 15 cleanly: machinery → library; application choices → consumer.

**Rationale for (a) over the alternatives**: the substrate is unusually favourable. The library already owns every colour primitive the domain type needs (`OKLABColor`, `mixColorsN`, `gamutMapOKLab`, `interpolateHue`, `lerpColorValue`) — `colorScale` is a *thin composition* over existing exports, not new colour science. `sampleToSVGPath` is a generalisation of the already-present `cubicBezierToSVG`. The fourier-side consumer is identified, the contract is ratified, the conformance rows are pre-staged DEFERRED. The cost of (a) is one focused value.js tranche; the cost of (b)/(c) is a permanent invariant-15 violation plus a forked colour authority. (a) is both the lowest-debt and the only invariant-honouring path.

### Does the lift fold into I, or need a dedicated tranche?

**It needs a dedicated value.js tranche** — equivalently, **I must be forward-themed *as* the colour-domain-lift tranche** (I-SEED's posture #1, "forward-themed", with the palette-domain lift as the chosen direction). It does **NOT** fold into the I-SEED ledger as authored, because:
- I-SEED carries **zero** palette-domain items (§1 above). Folding the lift "into I" would mean *defining I's thesis as the lift* — that is a dedicated tranche by another name, requiring user re-mandate (`C/FINAL.md §6`: "opens only if the user re-mandates the library-`Palette` domain object as a new value.js tranche; suggested letter: a future I or later").
- H rejected new architectural axes ("polish-grade — not structural rescue"); the lift IS a new architectural axis (a new `src/palette/` domain module). It cannot be a side-fold into a maintenance or polish tranche; it is a thesis in its own right.
- Therefore: **the I orchestrator's 6-agent audit at I open should adopt the colour-domain lift as I's forward thesis IF the user re-mandates the cohort** — otherwise I picks a different theme and the lift waits for a later letter. The decision is user-shaped per the C-FINAL re-mandate predicate.

---

## §4 — Proposed value.js-side wave-set for the colour lift

Modelled on the value.js tranche-prompt structure (`H-PROMPTS.md`: a 6-agent planning-only open + HEADLINE-flanked waves + ratification-before-execution per G1; `H.md §3` wave schedule). Suggested tranche letter: **I** (forward-themed) or a later letter if I takes another theme. This is a *sketch to seed cross-repo coordination*, not a binding plan.

| Wave | Headline | Scope | Closes on |
|---|---|---|---|
| **I.W0 HEADLINE** | Open · 6-agent audit · ratification ask · **cohort-reopen ratification** | Standard 6-agent planning-only audit + the C-FINAL re-mandate ratification (user confirms reopening the colour-domain cohort). Adopts the fourier-side ratified CRUD-CONTRACT as the latent affordance (no re-research). Surfaces the v1.0.0 question (I-SEED §4). | User ratifies cohort-reopen + colour-lift thesis |
| **I.W1** | `sampleToSVGPath(fn, n)` — generalise `cubicBezierToSVG` | Generalise `src/math.ts:69` `cubicBezierToSVG` to a parameterised `sampleToSVGPath(fn, n)` (function-under-sample + sample count; drop debug `<circle>` markers; keep `cubicBezierToSVG` as a thin caller or retire it per no-legacy F2). Unit tests; barrel export. | `sampleToSVGPath` exported + tested; `proof:*` green |
| **I.W2** | `colorScale(stops, t, opts?)` — composition over existing colour exports | Thin composition over `mixColorsN`/`interpolateHue`/`lerpColorValue`/`gamutMapOKLab`. `stops` = ordered colour positions; `t` ∈ [0,1]; `opts` for interpolation space (OKLab default) + hue method + gamut clamp. Tests across spaces; bench gate if hot. | `colorScale` exported + tested; gamut-safe; bench green |
| **I.W3** | Library `Palette` domain type at `src/palette/` | New `src/palette/` module: pure `Palette` (ordered stops + named ramps), `serialize`/`deserialize`, gamut-safe operations, built on `colorScale`/`OKLABColor`. **Pure domain only — no slug/owner/storage** (invariant 15). Aligns the *domain* shape to the contract's colour clauses without absorbing persistence fields. | `src/palette/` lands ≤ G3/H3 LoC caps; domain `Palette` exported + tested |
| **I.W4** | demo + api re-point + conformance rows + publish | demo `Palette → PersistedPalette` rename (storage shape distinct from domain shape); demo + api consume the library domain `Palette` first-class; fill the value.js-side conformance-matrix rows (currently DEFERRED) for the colour-domain clauses; npm version bump (**v0.11.0** or **v1.0.0** per W0 ratification) published with `@latest` tag. | demo/api consume library `Palette`; value.js conformance rows flip DEFERRED → PASS; published |
| **I.W5 HEADLINE close** | FINAL.md + cohort-discharge + merge + tag | Close ceremony; `CRUD-CONSTELLATION` cohort row flips orphan → DISCHARGED-JOINTLY; J-SEED; merge; tag. | 7-lane close audit; pre-merge gate matrix; tag |

**Parallelism**: W1 (`sampleToSVGPath`, `src/math.ts`) and W2 (`colorScale`, `src/units/color/`) are file-disjoint and may run concurrently. W3 depends on W2 (`Palette` composes `colorScale`). W4 depends on W3 + the npm publish. This mirrors value.js-C's original 3-agent-per-wave shape (`C/FINAL.md §3`: C.W1 was exactly "Library `Palette` + `colorScale` + `sampleToSVGPath`").

**Invariant inheritance**: the tranche inherits A–H invariants verbatim (`as any` 0; `as unknown as` ≤ 2; no god module; F2 no-legacy; F3 cross-repo write boundary — **publish is a value.js-side write + npm, NOT a fourier-side write**; G1 relay-before-ratification) plus cohort invariants 14–17 (one converged noun; domain-in-library/persistence-in-app; shared-by-contract; migration-verified).

---

## §5 — The cross-repo coordination shape fourier-C needs

fourier-C is currently **not authored** (`CANONICAL-ORDERING §1`: "not authored — R6 scoping in flight"); its scoped thesis is infra + image-blob-out-of-Mongo. The colour lift is a *carry into* fourier-C, not its core (`B/FINAL.md §6`: "`colors.ts` gut + `easings.ts` sampler retirement + value.js dep bump → `fourier-tranche-C-or-successor`").

**The coordination shape (under verdict (a), cohort reopened):**

1. **The hard cross-repo edge resurrects (inverted).** The original edge was `fourier-B.W4 → value.js-C.W1 published` (`CANONICAL-ORDERING §3` bottleneck). Reopened, it becomes **value.js-I.W4 published → fourier-C.Wn consumes**. fourier-C's `colors.ts` gut hard-depends on value.js-I.W4's published library `Palette` + the two functions. This is the *same* dependency the orphan verdict severed — now re-established on value.js-I's clock.

2. **fourier-C waits on value.js-I.W4, not the whole tranche.** Only the *publish* wave (I.W4) gates fourier; I.W0–W3 run independently. fourier-C can author + execute its infra/image-blob waves in parallel and sequence only the `colors.ts`-gut wave after the value.js publish lands. A fallback (mirroring fourier-B.W4's) keeps the gut deferrable if the publish slips.

3. **The contract is already consumable — coordination is publish-timing, not re-ratification.** Because the CRUD-CONTRACT is a ratified latent affordance and value.js-side conformance rows are pre-staged DEFERRED, the cross-repo coordination doc need only record: (i) the reopen ratification, (ii) the inverted dependency edge, (iii) the publish-version pin fourier-C consumes (the `@mkbabb/value.js` dep currently `file:../../value.js` per `web/package.json:18` — fourier-C bumps to the published v0.11.0/v1.0.0).

4. **`CANONICAL-ORDERING.md` is stale and must be re-authored.** It predates H close, value.js-C retirement, fourier-A close, fourier-B close, and any I seeding. Its §5 "ordering α/β" contingency is resolved (β/orphan fired) but a *new* ordering γ (cohort-REOPENED-on-value.js-I-clock) is needed. The fourier-C coordination doc should supersede CANONICAL-ORDERING with the reopened cross-repo map: `value.js-I (forward-themed colour lift)` ⇄ `fourier-C (infra + image-blob + colour-gut consume)`.

5. **The coordination document fourier-C authors** should be a successor to `CRUD-CONSTELLATION.md` — a `COLOUR-LIFT-CONSTELLATION.md` (or a reopen section in the fourier-C plan) that: names the inverted edge; cites the latent CRUD-CONTRACT affordance; records the reopen ratification; pins the consumed publish version; and carries the W4-fallback (defer the gut if publish slips). The slug-words precepts-submodule relocation (`B/FINAL.md §6`) also unblocks here — a value.js re-engagement is the "second consumer" that relocation was waiting on.

**Net**: fourier-C is **NOT** fourier-only IF the user re-mandates the cohort — it reopens the cross-repo cohort with value.js-I (forward-themed) as the publishing peer. If the user declines re-mandate, fourier-C is fourier-only and the colour lift carries forward again (invariant-15 violation persists; `colors.ts`/`easings.ts` stay internal permanently per verdict (b)). **The decision is user-shaped** (the C-FINAL re-mandate predicate) and is the central ratification fourier-C's open must relay.

---

## §6 — Decisive answers to the five charter questions

1. **Is value.js-H closed? Latest version/HEAD?** — **YES, closed 2026-05-26. Tag v0.10.0; master HEAD `16129e0`.** H was polish-grade (cascade-correctness + type/demo/invariant completion); it touched no palette-domain work.

2. **What does value.js-I (per I-SEED) propose? Could the lifts fold in?** — I-SEED proposes **no thesis** ("the next theme question is open"; "I-thesis to be decomposed at I open, not pre-declared"). It offers 3 candidate postures (forward / maintenance / API-themed) + 8 advisory pointers — **none touch palette/colour domain**. The lifts **cannot fold into the I-SEED ledger as authored**; hosting them means *defining I's forward thesis as the colour lift* (= a dedicated tranche, requiring user re-mandate).

3. **Does the latent CRUD-CONTRACT remain consumable?** — **YES.** Ratified fourier-side (`4626d4c`), 187 conformance rows, preserved as the latent affordance for a value.js re-engagement (consume, don't re-research); value.js-side rows pre-staged DEFERRED; binding-force advisory-on-reopen. Fully consumable.

4. **Cohort-reopen recommendation (a/b/c)?** — **(a)**: a value.js tranche publishes the library colour-domain surface (`Palette` + `colorScale` + `sampleToSVGPath`), fourier-C consumes. Refined as **a-prime**: value.js publishes the *machinery*; fourier keeps its *application colour choices* (`VIZ_COLORS.fourier`). Rejects (b) (permanent invariant-15 violation, do-nothing) and pure (c) (fourier-internal domain object = second colour authority, the degenerate branch). Honours cohort invariant 15.

5. **value.js-side wave-set?** — Sketched in §4: I.W0 open+ratify-reopen → I.W1 `sampleToSVGPath` (generalise `cubicBezierToSVG`) ∥ I.W2 `colorScale` (compose existing exports) → I.W3 `src/palette/` domain `Palette` → I.W4 demo/api re-point + conformance rows + publish (v0.11.0/v1.0.0) → I.W5 HEADLINE close + cohort-discharge.

---

## §7 — Authority and provenance

- value.js H close: `~/Programming/value.js/docs/tranches/H/{FINAL.md, PROGRESS.md, H.md, H-PROMPTS.md, I-SEED.md}`; tag `v0.10.0`; HEAD `16129e0`.
- value.js C retirement: `~/Programming/value.js/docs/tranches/C/FINAL.md` (RETIRED via AB+1 retrospective; library-`Palette` axis ORPHANED absent re-mandate).
- value.js v0.10.0 colour surface: `src/index.ts`, `src/math.ts:69` (`cubicBezierToSVG`), `src/units/color/`, `src/easing.ts`; `find src -iname 'palette*'` empty; `grep colorScale|sampleToSVGPath src/` empty. api persisted-doc `Palette`: `api/src/models.ts:66`.
- fourier coordination: `docs/tranches/B/coordination/CRUD-CONSTELLATION.md` (orphan + latent-affordance hand-off); `docs/tranches/B/FINAL.md §6/§8` (named successors); `docs/tranches/CANONICAL-ORDERING.md` (stale; α/β resolved to β-orphan).
- fourier consumer state: `web/package.json:18` (`@mkbabb/value.js: file:../../value.js`); `web/src/lib/colors.ts` (117 LoC, intact); `web/src/lib/easings.ts:89` (`generateCurveSVGPath`, intact).
