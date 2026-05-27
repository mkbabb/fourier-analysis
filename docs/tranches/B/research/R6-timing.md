# R6 — Cross-repo constellation timing (orphan-verdict edition)

**Lane**: R6 — constellation-timing, tranche-B research wave (Wα), fourier-analysis.
**Mode**: research-only (read source/docs; write this one deliverable; no source/spec/coordination edits; no commit).
**Authored**: 2026-05-26.
**Charter as posed (2026-05-18)**: value.js was mid its own tranche A (demo un-break, planning-only) and tranche B ("close A, simplify, complete the AND" — non-CRUD), so the CRUD peer was deferred to a *future* value.js tranche **C**; fourier-B.W4 (the `colors.ts` gut onto value.js's palette facility) could not complete until value.js opened *and* closed that CRUD peer. Map the sequence and the single hard cross-repo dependency.
**Verdict as it now stands (2026-05-26)**: the dependency is **severed, not delayed**. value.js never opened C for execution; C is formally **RETIRED**; the once-largest fragility in B has collapsed and the W4 fallback path is now unconditionally primary.

---

## §1 — Cross-repo timing resolution

### §1.1 — value.js tranche state (confirmed against the repo, not just the plan)

| Fact | Evidence (read 2026-05-26) |
|---|---|
| value.js HEAD | `16129e0` — *"Merge tranche-h into master — Tranche H close (v0.10.0)"* |
| value.js version | `package.json` → `0.10.0` |
| Tranche dirs present | `docs/tranches/{A,B,C,D,E,F,G,H}` — C exists as a **planning artefact**, never as an execution branch |
| Tranche C status | **RETIRED 2026-05-26** — `~/Programming/value.js/docs/tranches/C/FINAL.md` ("RETIRED via the AB+1 retrospective pattern"); `PROGRESS.md` status board flips every wave row `provisional → RETIRED` (W0 NEVER MET, W1 ORPHANED, W2 DISCHARGED-IN-SUBSTANCE, W3 ORPHANED, W4 CONVERTED-TO-RETIREMENT) |

### §1.2 — the actual close lineage (replaces the planned A → B → C)

The canonical close lineage **as planned** was `A → B → C` (C the CRUD peer). The lineage **as executed** is:

```
A → B → C[RETIRED] → D(v0.6.0) → E(v0.7.0) → F(v0.8.0) → G(v0.9.0) → H(v0.10.0)
                ▲
        the planned CRUD peer — authored, never opened for execution;
        D/E discharged its api-alignment axis under different theses
```

Per the FINAL ceremonies: D (v0.6.0, closed 2026-05-20, "contract-v2 / backend refactor"), E (v0.7.0, merged `47399c2`), F (v0.8.0, merged `6b3a41b`, closed 2026-05-21), G (v0.9.0, merged `e166d37`, closed 2026-05-22), H (v0.10.0, branch `tranche-h` off `e166d37`, closed 2026-05-26, HEAD `16129e0`). value.js raced **five tranches** (D–H) past the rendezvous fourier-B was holding at.

### §1.3 — the dependency collapse

The single hard cross-repo dependency was **`fourier-B.W4 → value.js-C.W1 published with the @latest tag`** (cited at `B.md:144`, `CRUD-CONSTELLATION.md:160`, `W4.md:4,146`, H5 §6.4 R-T-2). It required two things that never co-occurred:

1. value.js-C opens (gated on value.js-B close **AND** fourier-B.W1 ratifies `CRUD-CONTRACT.md` — the H5-corrected binding open-gate);
2. value.js-C.W1 publishes the library `Palette` + `colorScale` + `sampleToSVGPath` to npm.

Neither fired. value.js-C never opened (W0 "NEVER MET" — the contract was never ratified by the value.js side; the cohort dissolved). Therefore **there is no future value.js publish to wait for.** The dependency is not a deferred edge in the graph — the edge's target node was deleted. value.js-C's `FINAL.md §5` records the symmetric fourier-B impact: the W4 fallback contract becomes the primary path, the `colors.ts` gut is canceled, and the `easings.ts` SVG-sampling workaround stays as a fourier-internal primitive.

### §1.4 — absence proofs (cross-referenced to the sibling lane)

The structural deliverables that B.W4 would have consumed do not exist in value.js. Re-verified at value.js HEAD `16129e0` for this lane, and concordant with the sibling-lane surface report (`research/R2-valuejs-surface.md`) and value.js-C `FINAL.md §2`:

| Absence | Probe | Result |
|---|---|---|
| Library `Palette` domain type | `ls src/palette/` | ENOENT (no such directory) |
| Any palette module in library | `find src -iname 'palette*'` | empty |
| `colorScale` / `sampleToSVGPath` lifts | `src/math.ts` still carries only the un-generalised `cubicBezierToSVG` (value.js-C `FINAL.md §2` Axis 2) | not landed |
| value.js api CRUD utility module | `ls api/src/crud/` | ENOENT (no such directory) |
| Cross-repo contract in value.js | `find . -name 'CRUD-CONTRACT.md'` (in value.js) | empty — the only authoritative copy is the fourier-side `coordination/CRUD-CONTRACT.md` (973L), never ratified by value.js |

The "once B's largest fragility" reading is retired: the wait window from B.W1 close to a `value.js-C.W1` publish (the H4 §4.W4 fragility) is identically zero-probability — the publish is not late, it is structurally impossible absent a new value.js mandate.

---

## §2 — fourier-B internal dependency graph

With the cross-repo edge severed, the remaining sequencing is **purely fourier-internal**. The graph (per `B.md §3` wave table + §4 phases):

```
W0 (open · research dispatch)
  └─▶ Wα (6 read-only research lanes — this lane is R6)
        └─▶ Wχ (challenge: P1 framework-in-disguise, P2 migration-preserves-data,
                  P3 cross-repo-timing+image-blob, P4 invariants 18–20 binding)
              └─▶ W1 (CRUD-contract ratification — fourier-only; value.js sign-off DEFERRED)
                    ├─▶ W2  (UX coherence — fourier-side surface; dock/a11y/Configurator)   ─┐
                    │     · W2-tracking (value.js palette facility — ORPHANED, not load-bearing)│ ∥ parallel
                    └─▶ W3  (visualization entity + migration + api/lib/crud landing)         ─┘
                          └─▶ W4 (convergence wiring — orphan-verdict FALLBACK = PRIMARY)
                                └─▶ W5 (close ceremony)
```

### §2.1 — per-edge blocker analysis

| Edge | Blocker (as authored) | Status now |
|---|---|---|
| W0 → Wα | predecessor fourier-A closed; value.js close-state recorded | internal; unaffected |
| Wα → Wχ | six research deliverables landed | internal; R6 (this file) is the last-named Wα lane |
| Wχ → W1 | challenge `audit/challenge.md` ships P1–P4 | internal; **P3's "cross-repo timing real" sub-probe resolves automatically** — the cohort peer is structurally orphaned (B.md §3 Wχ row overlay) |
| W1 → {W2,W3} | contract ratified | **W1 ratifies fourier-only** — the value.js sign-off that would have made §10's "both columns PASS" gate meetable is DEFERRED; the gate downgrades to **paper-binding** (every conformance row has a non-empty Run-command cell), per `B.md §7` C4 §5 path |
| W3 → W4 | W3 entity live **AND** `value.js-C.W1 published` | **the value.js conjunct is deleted** — W4 now opens on the W3 close alone |
| W4 → W5 | W4 closes | internal; W4's `colors.ts`/`easings.ts` residuals carry as named B-residuals |

### §2.2 — what is now UNBLOCKED that the original plan thought blocked

- **W1 — CRUD-contract ratification.** Originally one half of a *joint* ratification (fourier-B.W1 ↔ value.js-C.W0 consumption). It no longer waits on any value.js act; it closes on fourier-unilateral ratification. The §10 "both columns PASS" close-rule is now a historical artefact (`CRUD-CONSTELLATION.md` orphan banner); 88 value.js conformance cells hold DEFERRED.
- **W2 — UX coherence** and **W2-tracking — value.js palette facility.** W2-tracking ceases to be load-bearing — it exists only to keep the latent cross-repo dependency legible ("tracked-as-orphaned, awaits future value.js re-engagement"). The W2 slot was reactivated for fourier-side UX coherence (Wave-1 audit synthesis), which never depended on value.js.
- **W3 — visualization entity + migration + `api/lib/crud/`.** Always fourier-internal at file bounds (`B.md §5` disjoint-by-repo); it proceeds unchanged and was never truly blocked — but the original plan's "Phase II substrate, subject to constellation timing (§6)" framing implied a coupling that is now formally gone.
- **W4 — convergence wiring.** See §2.3.

### §2.3 — the ONE wave that hard-blocked on value.js: W4-via-fallback

W4 carried **the** single hard cross-repo dependency. Under the orphan verdict (`W4.md` throughout; `B.md §3,§7`):

- W4's primary path **is** the H4 §4.W4 fallback contract: "B.W4 lands everything *except* the `colors.ts` gut-onto-value.js."
- Concretely, W4 collapses to the admin/store re-point: scope items 1–4 (gallery/workspace/animation stores + `draftStorage`), 7–10 (api endpoint table, admin SFCs, router, Playwright + axe), 12 (helper adoption), 13–15 (session-TTL, RateLimit headers, ETag/If-Match consumer half). Items **5–6** (the `colors.ts` gut + `easings.ts` sampler retirement) and **11** (the `@mkbabb/value.js @latest` bump) are **held** — the files stay byte-identical to W3 close, and the carry records as a named B-residual with destination `fourier-tranche-C-or-successor`.
- Agent B.W4.b's worktree is "largely a no-op" — its work product is the `PROGRESS.md` named-residual entry citing `docs/audits/runs/2026-05-19-refinement-assay/{r1-assay.md,r4-valuejs-C-refinement.md}`.
- W4's hard gate has two mutually exclusive arms — **gate item 3** (cohort-active: ≥80 LOC deleted from `colors.ts`, `@latest` pinned) and **gate item 4** (orphan-verdict primary, the default: byte-identical files + named-residual PROGRESS row). The default arm is the one that fires.

W4 was made *dispatchable regardless of sibling timing* by the H4 §4.W4 naming of the fallback — that hardening is precisely what de-risked B against the now-realized orphan outcome.

---

## §3 — Latent affordance

The ratified contract (W1 output: `coordination/CRUD-CONTRACT.md`, 973L; plus `SCHEMA.md`, `CONFORMANCE-MATRIX.md`, the U2 `SLUG-WORDS.md`, the U3/U4 utility specs `CRUD-LIB-PY.md`/`CRUD-LIB-TS.md`) does not evaporate with the cohort's dissolution. It becomes a **latent cohort affordance**: a fully-authored, fourier-ratified contract that a future value.js re-engagement consumes **rather than re-researches** (`B.md §1` orphan-verdict-effect paragraph; `B.md §6` "for value.js latent — held DEFERRED").

A future value.js re-engagement would consume it at one of two sites:

1. **A reopened value.js-C** — value.js-C `FINAL.md §6` parks the library-`Palette` axis as a **CONDITIONAL FUTURE-TRANCHE (post-H, post-user-re-mandate)**. If the user re-mandates, that tranche's open-wave (the analog of the never-met C.W0) reads the fourier-side `CRUD-CONTRACT.md` as its ratification substrate. The CONFORMANCE-MATRIX's 88 DEFERRED value.js cells become its conformance checklist.
2. **A new value.js letter (I or later)** — value.js-C `FINAL.md §2` notes H "rejects new architectural axes," so a clean re-engagement is a future letter, not a mid-H insert. That letter's library-`Palette` + `colorScale` + `sampleToSVGPath` work (the C.W1 deliverables) is the surface fourier-B.W4's *held* scope items 5–6 + 11 would finally consume — i.e. the fourier-tranche-C-or-successor residual's actual landing site is gated on **this** value.js letter publishing.

The slug word-list extraction (U2) is doubly latent: value.js-C `FINAL.md §6` parks it as **CONDITIONAL FUTURE-TRANCHE paired with the fourier-side `slug-words.json` consumer** — it opens only when a *second* consumer materialises (invariant 16's standalone-package-extraction rule). fourier-B.W1's `docs/precepts/data/slug-words.json` is the candidate first consumer; the shared extraction stays two-copies until value.js re-engages.

The CRUD-CONTRACT **ratification** axis itself is **DISSOLVED-NOT-DEFERRED** on the value.js side (value.js-C `FINAL.md §6`) — no future value.js tranche *owns* the joint sign-off; fourier's copy stands as a fourier-internal coherence document whose value.js sign-off is optional. The affordance is therefore *fourier-published, value.js-consumable-on-re-engagement*, not a pending bilateral obligation.

---

## §4 — Internal risk register

With the cross-repo dependency gone, the remaining timing risks are entirely internal to fourier-B's execution. Ranked:

| # | Risk | Window | Severity | Mitigation in plan |
|---|---|---|---|---|
| **R-INT-1** | **W2 ∥ W3 parallel-execution integration collision.** W2 (UX coherence, `web/` SFCs/stores) and W3 (entity + `api/`) run concurrently after W1. The api endpoint table (`web/src/lib/api.ts`) and the store surfaces are touched by W2's Configurator-adoption *and* are the W4 re-point targets shaped by W3's entity — a `vue-tsc` shape collision between W2-touched components and W3's `Visualization` types can surface only at the W2/W3 merge. | W2/W3 concurrent span | **HIGH** (top internal risk) | `B.md §5` declares W3=model / W4=consumers disjoint, but W2 (web/) and W3 (api/) disjointness is by-directory only; the W4 triumvirate's `vue-tsc` shape-collision trigger (`W4.md §Triumvirate`) catches it downstream, not at the W2/W3 boundary — so the integration risk lands as a W4 surprise, not a W2/W3 one. |
| **R-INT-2** | **W3 migration brittleness window.** `B.md §8` declares a *provisional* brittleness window in W3 — old `snapshots`/`gallery` and new `visualizations` coexist, gallery list/read gates suspended during cutover. The close ceremony cannot run while it is open; if the migration backfill (invariant 17 — verified by count + spot-check) does not complete *within* W3, W4 cannot open and W5 cannot close. | W3 cutover | **HIGH** | Restoration is the same wave (W3); Wχ.P2 (migration-preserves-data) re-derives counts + spot-checks 10 `snapshot_hash` rows before W3 dispatches; Wα-R5 (`R5-migration.md`) decides whether a clean cutover avoids the window entirely. Image blobs are NOT migrated (Option B — stable `image_slug` FK), removing a correlated failure mode. |
| **R-INT-3** | **Docker / Mongo availability for W3/W4 integration tests.** W3's endpoint tests, W4's Playwright `e2e/visualization-crud.spec.ts` (3 viewports), the `mongosh admin_audit` count delta, and the `curl ... ratelimit-` header probe all require a live API + MongoDB. A Docker/Mongo outage stalls W3 and W4 hard gates with no internal workaround (these are runtime-evidence gates, not grep gates). | W3 + W4 gate execution | **MEDIUM** | Local `docker-compose.yml` (base) brings up api + Mongo; the gates are runtime-evidence by design (no fixture-mock fallback admitted). The risk is operational availability, not plan shape. |
| **R-INT-4** | **W1 paper-binding vs empirical-binding drift.** W1 ratifies on **paper-binding** (every conformance row has a non-empty Run-command cell; C4 §5 records 0/182 rows PASS at HEAD). If W1 closes on paper-binding and W3/W4/W5 never empirically bind the 94 fourier rows, the contract is ratified-but-unproven and W5's close inherits an aspirational matrix. | W1 close → W5 close | **MEDIUM** | The two-step path is explicit (`B.md §7`): B.W1 = paper binding; B.W3 = empirical binding of 94 fourier rows (88 cross-repo + 6 §F) with 88 value.js cells DEFERRED; `CONFORMANCE-MATRIX.md:515` §10 close-rule ratifies it. |
| **R-INT-5** | **W4 helper-adoption framework-in-disguise resurgence.** The `api/lib/crud/` utility module (landed W3) must be *consumed* by W4's migrated callers (≥3 `from api.lib.crud` imports in `admin.py`; ≥10 helper sites). If adoption lapses between W4 and W5, the utility decays toward an unconsumed framework — the very invariant-16 violation B forbids. | W4 → W5 | **LOW-MED** | `W4.md` hard-gate item 11 binds adoption across two waves (W4 threshold holds AND W5 re-runs the grep at the W5 boundary commit) — the C6 §2 risk-matrix row 5 binding. |

The cross-repo timing risk that dominated the original register (`W4.md §Archaeology`: "the projected wait window from B.W1 close to value.js-C.W1 publish was the largest fragility in B at authoring time") is **retired to zero** — it cannot recur absent a new value.js mandate, and even then it lands as a *future* successor-tranche concern, not a B-internal one.

---

## §5 — Crosswalk to `CRUD-CONSTELLATION.md §Timing`

**Does the authored timing section match orphan reality?** **Yes — the constellation doc was already retrofitted to the orphan verdict and is concordant with this lane's findings.** The crosswalk, clause by clause:

| `CRUD-CONSTELLATION.md` clause | Orphan reality (this lane) | Match? |
|---|---|---|
| Head banner: "HISTORICAL / PARTIALLY-DISCHARGED-AND-ORPHANED" (`:3`) | value.js-C RETIRED; fourier half held | **MATCH** |
| §Timing diagram (`:121-153`): "value.js-C open (had required value.js-B close AND fourier-B.W1 ratify — second precondition was not met before value.js raced ahead)" | C.W0 "NEVER MET"; contract never ratified by value.js side | **MATCH** |
| §Timing (`:159-162`): "**fourier-B.W4 → value.js-C.W1 published** was the single hard cross-repo dependency and that dependency was not consumed in the shape the document anticipated" | the dependency's target node was deleted; W4 fallback is primary | **MATCH** |
| §Timing (`:164-165`): "`research/R6-timing.md` (cited at original authoring) produced the intended firm sequence; the actual sequence is the one above" | **this file is that R6 deliverable** — it now records the *actual* (orphan) sequence, superseding the "intended firm sequence" the citation anticipated | **MATCH — citation now resolved** |
| §Authority orphan verdict (`:167-195`): cohort "neither fully ratified nor formally retired — it is *orphaned*"; future pick-up = (a) reopen with new value.js peer or (b) accept fait-accompli and rewrite fourier side to consume | matches §3's latent-affordance dispositions (reopened-C or new-letter) | **MATCH** |
| §10 "both columns PASS" close-rule "now historical" (`:21,206,228`) | W1 ratifies fourier-only; 88 value.js cells DEFERRED | **MATCH** |

**One internal inconsistency to note (not a drift, an as-of-date staleness):** `CRUD-CONSTELLATION.md` §Authority-orphan-verdict cites value.js as having "published v0.9.0" via the value.js-C `FINAL.md §5` quote it mirrors (`FINAL.md:110` — "value.js published v0.9.0 — a 5-minor-version drift"). At value.js HEAD `16129e0` the actual published version is **v0.10.0** (H close, 2026-05-26). The constellation/FINAL text was authored against the G-close (v0.9.0) snapshot; H closed the same day. This is a version-currency lag, not a structural drift — the orphan verdict is unchanged (still no `Palette`, no `colorScale`, no `api/src/crud/` at v0.10.0). The "5-minor-version drift" understates to a **6-minor-version drift** (fourier pins `^0.4.6`; value.js is at `0.10.0`).

**What needs the W5 close to reconcile.** The constellation doc's §Authority block states it "would record the final disposition of every convergence target … at B close (fourier-B.W5)." The reconciliation items the W5 close ceremony must discharge (per `B.md §3` W5 row + §6 + `CRUD-CONSTELLATION.md §Authority`):

1. **Flip the constellation status from "orphaned" to a terminal disposition** — record discharged-status with citation to value.js-C `FINAL.md` and the R4 refinement assay (value.js-C `FINAL.md §5` item 5 explicitly asks fourier-B to do this).
2. **Update the version-currency** — `^0.4.6` pinned vs `v0.10.0` published; record the 6-minor drift and the held `@latest` bump as a named B-residual.
3. **Stamp the W4 named-residuals** — `colors.ts` gut + `easings.ts` sampler retirement + dependency bump, destination `fourier-tranche-C-or-successor`, in `PROGRESS.md` and the constellation §Authority block.
4. **Record the latent-affordance hand-off** (§3 above) — name where a reopened-C or new-value.js-letter consumes the W1 contract, so the orphaned half has a future-discharge route rather than a dangling edge.
5. **Confirm the conformance matrix terminal state** — 94 fourier rows PASS (empirical), 88 value.js rows DEFERRED, §10 cohort-level "all 176 cross-repo cells PASS" recorded as contingent on a successor tranche reopening the value.js column.

Until W5 fires, the constellation doc is correctly self-described as *orphan binding* — substance-preserved, future-discharge-named, not-binding-after-2026-05-26. This R6 deliverable is the Wα input the W5 reconciliation draws on for items 1 and 4.

---

## Provenance

- value.js-C retirement: `~/Programming/value.js/docs/tranches/C/{PROGRESS,FINAL}.md` (read 2026-05-26).
- value.js HEAD/version/lineage: `git log`/`package.json`/`git tag` + `docs/tranches/{D,E,F,G,H}/FINAL.md` at value.js HEAD `16129e0`.
- Absence proofs: `ls src/palette`, `find src -iname 'palette*'`, `ls api/src/crud`, `find . -name CRUD-CONTRACT.md` (all empty/ENOENT at value.js HEAD `16129e0`); concordant with `research/R2-valuejs-surface.md`.
- fourier-B plan: `docs/tranches/B/B.md §1,§3,§4,§5,§6,§7,§8`; `docs/tranches/B/waves/W4.md`; `docs/tranches/B/coordination/CRUD-CONSTELLATION.md`.
- Refinement-assay authority (cited, not re-read by this lane): `docs/audits/runs/2026-05-19-refinement-assay/{r1-assay.md,r4-valuejs-C-refinement.md}`.
