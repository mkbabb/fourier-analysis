# CA2 — Master deferred / chronic-item inventory and tranche-C destination map

**Lane**: CA2 (audit lane, fourier tranche-C DEVELOPMENT phase — planning only).
**Mode**: READ-ONLY (one deliverable; no source edits, no commits).
**HEAD substrate**: B CLOSED 2026-05-27 (`docs/tranches/B/FINAL.md`); A CLOSED 2026-05-26 (`f874dac`); C exists as a stub at `docs/tranches/C/C.md` scoped to infra + image-blob ONLY.
**Directive**: "Delineate any chronically deferred items and fold them into this new tranche. Delineate any deferred items and fold them into this new tranche."

## §0 — Goal + completion criterion (paired)

**Goal.** Enumerate EVERY deferred / named-successor / chronic item across tranches A + B, classify each by chronicity and load-bearing weight, and map each to a tranche-C destination (existing C wave / NEW C wave / value.js peer / different tranche / WONTFIX-with-rationale) — so the C-authoring round folds the B residuals C's stub does not yet absorb, and routes the rest with destination-discipline.

**Completion.** A single document carrying: the master inventory table (§1); the chronic-risk callouts for items deferred ≥ 2 tranches (§2); the C-fold recommendation grouped into proposed wave threads (§3); the items that must NOT go in C with their correct successor named (§4). Both criteria hold at this writing.

## §0.1 — Classification key

- **CHRONIC** = deferred across ≥ 2 discrete planning gates (A→B, A→B→C, or A→B→C-stub-without-absorption). The L6 chronic-deferral definition (`L6-deferred-chronic.md §3`) is the governing rubric.
- **LOAD-BEARING** = an architectural surface drift or a correctness/observability obligation; its non-discharge degrades the system, not merely the cosmetics.
- **RESIDUAL** = a cosmetic, ergonomic, or latent-affordance item; its non-discharge is honest indefinitely OR awaits an external (orphaned) party.
- Four cells: **CHRONIC-LOAD-BEARING**, **CHRONIC-RESIDUAL**, **DEFERRED-LOAD-BEARING**, **DEFERRED-RESIDUAL** (the latter two = one-gate-deep, not yet chronic).

## §0.2 — Empirical state-checks run at this writing (load-bearing for the map)

| Check | Finding | Effect on map |
|---|---|---|
| `grep storage_budget_gb api/config.py` | The config FIELD is already retired at B.W3; only a NOTE comment survives (`api/config.py:19-24`). | C.W4's gate "`api/config.py` does not define `storage_budget_gb`" is **already satisfied** — C.W4 retires the inline *blob* + the comment, not the field. |
| `web/e2e/visualization-ux.spec.ts` | `@axe-core/playwright` `AxeBuilder` integration **already present** (the harness landed at B.W4.d). | The B/FINAL §6 "axe-keystone settle-wait" carry is **timing tuning only**, not absent infra — DEFERRED-RESIDUAL, e2e-local. |
| `FlaggedListResponse` at `web/src/lib/types.ts:201` | Type exists; B.W4 worked around with a local cast (vue-tsc green). | DEFERRED-LOAD-BEARING (type-soundness), web-local — not infra/storage. |
| `api/services/janitor.py:31` | Source comment: "Image-blob redesign is deferred to fourier tranche C." | Confirms C.W4 is the live destination for the blob; janitor observability is C.W3. |

## §1 — Master inventory table

Rows aggregated from `B/FINAL.md §6`, `B/B.md §7`, `A/FINAL.md §5-6`, `L6-deferred-chronic.md §2-3,§7`, `r6-fourier-C-scope.md`, and the in-code/in-doc grep. Citation = first-class source. "C-stub status" reads the existing `C.md` (what it already covers vs. what it omits).

| # | Item | Source citation | Classification | Proposed C destination | One-line rationale |
|---|---|---|---|---|---|
| 1 | **Infrastructure standardisation** (webhook CI/CD, MongoDB TLS, port standardisation) | `project_infra_plan.md`; `A/A.md §9`; `B/B.md §7`; `L6 §3.3,§7`; `C.md §6` | **CHRONIC-LOAD-BEARING** | **Already in C** — Wα-R2/R3 + W1 + W2 | Deferred A→B→C across 3 gates; C's stub already owns it as the infra-hygiene thread; the governing plan is 60 days old (verify, don't trust). |
| 2 | **Image-blob-out-of-Mongo storage redesign** | `A/A.md §9`; `B/B.md §7,§138`; `R-lifecycle-spec.md §6.2-6.3`; `L6 §3.4`; `C.md §1,§7` | **CHRONIC-LOAD-BEARING** | **Already in C** — Wα-R1 + W4 | Deferred A→B→C, research-ratified-as-C; C's stub already owns it as the storage thread (Option B held: stable `image_slug` FK). |
| 3 | **`storage_budget_gb` retire by relocation** (the config-field/blob-write retirement) | `C.md §6 gate`; `B/B.md §138`; `api/config.py:19-24`; `api/services/janitor.py:31` | **CHRONIC-LOAD-BEARING** | **Already in C** — W4 (gate already half-met) | B.W3 retired the *field*; C.W4 retires the inline blob write + the surviving comment — narrower than the stub implies. |
| 4 | **`colors.ts` gut + `easings.ts` sampler retirement + value.js dep bump** (the colour-domain lift) | `B/FINAL.md §6`; `B/B.md §33,§149,§154`; `A/FINAL.md §6 #292`; `L6 §3.1,§7`; `2026-05-19-refinement-assay/{r1,r4}.md` | **CHRONIC-RESIDUAL** | **value.js peer (PRIMARY) + NEW C wave (CONTINGENT)** — see §2 headline | Filed A.W2→A.W6→B.W4 across 3 gates; blocked on value.js library `Palette`/`colorScale`/`sampleToSVGPath` which were NEVER published (value.js-C RETIRED). |
| 5 | **slug-words `slug-words.json` precepts-submodule relocation** | `B/FINAL.md §6`; `api/lib/crud/slugs.py:18`; `B/B.md` (invariant 16 "in-repo first") | **DEFERRED-RESIDUAL** | **Different successor** — precepts-submodule extraction on second-consumer (value.js re-engagement) | Invariant-16 gate is "extract on third consumer"; currently 1 consumer; relocating in C would be premature. Not infra/storage. |
| 6 | **`FlaggedListResponse` type reconciliation** (cursor-envelope shape) | `B/FINAL.md §6`; `web/src/lib/types.ts:201` | **DEFERRED-LOAD-BEARING** | **Different successor** — web-frontend type-soundness sweep (not C) | One-gate type-cast workaround; C is infra+storage backend work; this is a `web/src/lib` typing concern, wrong thread. |
| 7 | **e2e axe-keystone settle-wait** (transient dock-collapse-animation artifacts) | `B/FINAL.md §6`; `web/e2e/visualization-ux.spec.ts` (harness present) | **DEFERRED-RESIDUAL** | **Different successor** — minor e2e-timing tuning (web-local, not C) | Harness + measurement already in place; only the settle-wait constant needs tuning; not an infra/storage concern. |
| 8 | **value.js-side conformance-matrix rows** | `B/FINAL.md §6,§7`; `B/B.md §140`; `L6 §6` | **CHRONIC-RESIDUAL** | **value.js peer** — DEFERRED pending re-engagement (latent affordance) | Orphaned cohort half; the ratified contract is consumable without re-research; not fourier's to land. |
| 9 | **glass-ui ConfiguratorLayer header-actions slot** | `B/FINAL.md §6` (substrate carry) | **DEFERRED-RESIDUAL** | **Different tranche** — glass-ui next surface tranche | Substrate carry filed to glass-ui, not a fourier-side fork; CONSTELLATION discipline holds. |
| 10 | **glass-ui dock collapsed/expanded `aria-hidden-focus`** (transient axe finding) | `B/FINAL.md §6` (substrate carry) | **DEFERRED-RESIDUAL** | **Different tranche** — glass-ui next surface tranche | Same — glass-ui substrate, transient a11y artifact, upstream's to fix. |
| 11 | **glass-ui `--scale-press*` unification** (inherited from A) | `B/FINAL.md §6`; `A/FINAL.md §7,§291`; `L6 §3.2,§7` | **CHRONIC-RESIDUAL** | **Different tranche** — glass-ui next surface tranche | Filed A.W0→A.W6→B across 2-3 gates; awaits glass-ui's next surface tranche; B should-not / C should-not absorb. |
| 12 | **Backend `--reload` aborts in-flight compute** (`ERR_EMPTY_RESPONSE` cascade) | `A/FINAL.md §5 #254`; `A/audit/W3.5-pipeline.md`; `L6 §3.5,§7` | **CHRONIC-RESIDUAL** | **NEW C wave** (or fold into W0 infra-baseline) — dev-ergonomics | Surfaced A.W3.5→routed-C across 2 gates; C unauthored kept it open; an infra/deploy concern → legitimately C, but unmentioned in C's stub. |
| 13 | **onnxruntime CPU-vendor warning flood** | `A/FINAL.md §5 #254`; `A/audit/W3.5-pipeline.md`; `L6 §3.6,§7` | **DEFERRED-RESIDUAL** | **WONTFIX-able / C-W0 if trivial** | Cosmetic log noise; explicit cosmetic deferral acceptable indefinitely (L6 §3.6); fold opportunistically into C.W0 baseline only if a one-line suppression. |
| 14 | **Rate-limiter Option B** (Mongo TTL bucket; multi-replica) | `A/audit/W4-deploy-note.md`; `C.md §7`; `L6 §2 #12,§3.7`; `r6 §3.2` | **DEFERRED-LOAD-BEARING** (latent) | **Different tranche** — hypothetical fourier-D; C.§7 already names the deferral | Option A chosen deliberately A.W4; only triggers if multi-replica becomes a real need; C.md §7 already records the deferral-out. |
| 15 | **Levels-derivation drift** (`workspace.runComputeBases` ⇄ `compute_bases`) | `A/FINAL.md §5 #253`; `L6 §3.9,§4 FLAG-GAP`; `B/B.md §49 invariant 19` | **DEFERRED-LOAD-BEARING** (likely DISCHARGED at B) | **WONTFIX-in-C** — folded into B.W3 invariant 19 | L6 flagged it a B-scope-GAP; B's invariant 19 (auto-recompute discipline, `ComputeBasesRequest` seam) absorbed it; verify closed at B, not C-bound. |
| 16 | **Ruff F841 unused `result` at `image_storage.py:224`** | `A/FINAL.md §5,§6 #7`; `L6 §3.8,§4` | **DEFERRED-RESIDUAL** (likely DISCHARGED at B) | **WONTFIX-in-C** — incidental at B.W3.b modify-carve | One gate; B.W3.b file-bounds naturally retired it; not C-bound. |
| 17 | **Cross-cohort infra standardisation** (floridify migration, ncdpi-ai-tools removal, sudoku/speedtest port blocks) | `C.md §7`; `project_infra_plan.md` | **DEFERRED-LOAD-BEARING** (out of fourier scope) | **Different successor** — constellation-wide, not fourier's to author; C.§7 names it out | C addresses only the fourier-bound subset (port 8100); the fuller plan is constellation-wide infra, explicitly out of C. |
| 18 | **Managed-S3 ongoing-cost concern** (if Wα-R1 selects S3) | `C.md §7 emitted` | **DEFERRED-RESIDUAL** (potential emit) | **Already in C** — emitted by C if R1 selects S3; invariant-12 default is filesystem | C names this as a potential C-emitted concern; binding default per invariant 12 is local-filesystem. |

**Total enumerated items: 18.**

## §2 — Chronic-risk callouts (items deferred ≥ 2 tranches — at risk of becoming permanent)

Six items meet the ≥ 2-gate chronic bar. Five carry forward from L6's chronic ledger; the headline (item 4) is the one the directive most directly targets.

1. **Infrastructure standardisation** (item 1) — **CHRONIC-LOAD-BEARING, 3 gates** (A.§9 → B.§7 → C-stub). *Mitigated*: C's stub already owns it (Wα-R2/R3, W1, W2). Residual risk: the governing `project_infra_plan.md` is 60 days old; r6 §7 already flags `8091` as a possibly-stale port reference. C.W0 must re-baseline against live `docker-compose*.yml`, not the memory file.

2. **Image-blob storage redesign** (item 2) — **CHRONIC-LOAD-BEARING, 3 gates** (A.§9 → B.§7 → C-stub). *Mitigated*: research-ratified as C's primary thesis (Wα-R1 + W4). Lowest orphaning risk of the chronics — C exists *for* this.

3. **`storage_budget_gb` retire-by-relocation** (item 3) — **CHRONIC-LOAD-BEARING, 3 gates**. *Mitigated*: half-discharged already (field gone at B.W3; only the blob write + comment remain for C.W4). The "retire by relocation, never re-introduction" half is invariant-18-bound.

4. **HEADLINE — the colour-domain lift** (`colors.ts` gut + `easings.ts` sampler + value.js dep bump, item 4) — **CHRONIC-RESIDUAL, 3 gates** (A.W2.b CONSTELLATION → A.W6 "STILL FILED" → B.W4 orphan-verdict residual). **This is the item most at risk of becoming permanently orphaned.** The blocker is structural: value.js's library `Palette` / `colorScale` / `sampleToSVGPath` were *never published* (value.js-C RETIRED; `~/Programming/value.js/docs/tranches/C/FINAL.md` per B/FINAL §7). The destination string `fourier-tranche-C-or-successor` is deliberately ambiguous — and that ambiguity is the orphaning hazard. **Verdict on where it belongs:** it belongs **primarily to a reopened value.js cohort** (the lift's whole premise is "the library owns the colour domain" — invariant 15; folding the *domain model* into fourier-C would re-implement in the app the very thing the lift exists to relocate to the library, an invariant-15 violation). fourier-C may carry **only the consumer half** *conditionally* — i.e., if a value.js re-engagement publishes the library surface during C's window, a NEW C wave re-points `colors.ts`/`easings.ts` onto it. If value.js stays orphaned, C must NOT annex the domain model; it should instead **re-state the carry with a hard "no-silent-orphan" check** so the residual does not evaporate into a third indefinite filing. **Recommend: name it explicitly in C.§7 as "deferred-out, primary destination value.js-reopened-cohort; consumer-half-only contingent on publication" — not fold the domain model into C.**

5. **glass-ui `--scale-press*` unification** (item 11) — **CHRONIC-RESIDUAL, 2-3 gates** (A.W0-challenge → A.W6 → B). Belongs to glass-ui's next surface tranche; neither B nor C should absorb. Orphaning risk is real but correctly-placed (it is a glass-ui substrate fix; CONSTELLATION discipline holds).

6. **Backend `--reload` aborts compute** (item 12) — **CHRONIC-RESIDUAL, 2 gates** (A.W3.5 → routed-C). C unauthored kept it open. It is genuinely an infra/deploy concern and so legitimately C-bound — but **C's stub never mentions it**, so it risks silently lapsing. Fold into C (see §3 thread γ).

## §3 — C-fold recommendation (which items expand C's scope, grouped into proposed wave threads)

C's stub today covers **only** items 1, 2, 3, 18 (infra + image-blob). The directive ("fold deferred items into this tranche") requires C to absorb the legitimately-fourier-infra residuals it currently omits. Grouped into proposed threads layered onto the existing wave schedule:

**Thread α — already in C (no expansion needed), confirm at C.W0:**
- Items 1, 2, 3, 18. C's `C.md §7` "Inherited from A/B" block already names these. C.W0 must re-baseline item 1 against live compose files (memory is stale).

**Thread β — NEW fold into C.W0 / C.W3 (infra-ergonomics residuals C's stub omits):**
- **Item 12 — backend `--reload` aborts compute** → fold into a **C.W0 infra-baseline finding + a C.W1 or C.W3 sub-task** (disable `--reload` on the compute container OR move compute to a background queue per L6 §5). This is the one CHRONIC item C silently dropped; folding it discharges the directive's "chronically deferred" clause for the dev-ergonomics axis.
- **Item 13 — onnxruntime warning** → fold into C.W0 baseline *only if* a one-line env suppression; else WONTFIX (cosmetic, indefinite-deferral-safe).

**Thread γ — NEW conditional C wave (the headline, contingent):**
- **Item 4 — colour-domain lift consumer half** → a NEW provisional C wave (e.g. "W6 — colour-domain consumer re-point") that fires *only if* value.js republishes the library surface during C's window. Default (value.js orphaned): NOT folded as a domain-model move; re-stated in C.§7 with a no-silent-orphan check. See §2 headline.

**Thread δ — already-discharged-at-B, confirm-and-close (no C work):**
- Items 15 (levels-derivation, B invariant 19) and 16 (ruff F841, B.W3.b) — verify closed at B; record in C.W0 as "discharged upstream, no C action."

## §4 — Items that should NOT go in C (with the correct successor named)

| Item | Why not C | Correct successor |
|---|---|---|
| 4 — colour-domain DOMAIN MODEL (item 4, domain half) | Folding the domain model into the app violates invariant 15 (domain in the library, persistence in the app); the lift's purpose is library-relocation. | **value.js reopened cohort** (new letter, or value.js-C re-opened). C carries the consumer half only, contingent. |
| 5 — slug-words precepts-submodule relocation | Invariant-16 "extract on (third) consumer"; only 1 consumer today; premature in C. Not infra/storage. | **precepts-submodule extraction** on value.js re-engagement (second consumer). |
| 6 — `FlaggedListResponse` type reconciliation | `web/src/lib` type-soundness, not backend infra/storage — wrong thread for C. | **web-frontend type-soundness sweep** (future web-surface tranche or incidental fix). |
| 7 — e2e axe-keystone settle-wait | Harness already present; only a timing constant; web-local, not infra/storage. | **minor e2e-timing tuning** (web-local, incidental). |
| 8 — value.js-side conformance rows | Orphaned cohort half; not fourier's to land; latent affordance. | **value.js reopened cohort** (DEFERRED). |
| 9, 10, 11 — glass-ui substrate carries (ConfiguratorLayer slot; dock aria-hidden-focus; `--scale-press*`) | glass-ui substrate fixes, not fourier-side forks; CONSTELLATION discipline holds. | **glass-ui next surface tranche.** |
| 14 — rate-limiter Option B | Option A chosen deliberately; only triggers on a real multi-replica need; C.§7 already names the deferral-out. | **hypothetical fourier-D** (if/when multi-replica is a real requirement). |
| 17 — cross-cohort infra standardisation | Constellation-wide (floridify, ncdpi, sudoku/speedtest); C owns only the fourier subset. | **constellation-wide infra effort** (not fourier-authored). |

---

### Quantitative summary

- **Total items enumerated**: **18**.
- **CHRONIC (≥ 2-tranche)**: **6** — items 1, 2, 3 (CHRONIC-LOAD-BEARING), 4, 11 (CHRONIC-RESIDUAL), 12 (CHRONIC-RESIDUAL).
- **CHRONIC-LOAD-BEARING**: 3 (1, 2, 3 — all already in C's stub). **CHRONIC-RESIDUAL**: 3 (4, 11, 12).
- **Already in C's stub**: 4 (items 1, 2, 3, 18). **Must NEW-fold into C**: 2 (item 12 backend `--reload`; item 13 onnxruntime opportunistically) + 1 conditional (item 4 consumer-half). **Must NOT go in C**: 11 (items 4-domain, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17).
- **C's stub omits exactly one CHRONIC item** that is legitimately fourier-infra: item 12 (backend `--reload`).
- **At risk of permanent orphaning**: item 4 (colour-domain lift) — the `fourier-tranche-C-or-successor` ambiguity is the hazard; its true home is a reopened value.js cohort, with only a contingent consumer-half in C.
