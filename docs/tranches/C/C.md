# C — fourier infrastructure, storage architecture, and B-residual discharge

**Tranche letter**: C — fourier-analysis's infrastructure-hardening, image-blob storage-architecture, and convergence-residual-discharge tranche; successor to B (the identity-and-CRUD convergence cohort).
**Predecessor close**: B — `docs/tranches/B/FINAL.md` (`fc5b3b0`); B closed `complete_with_misses` against the cohort aim, clean against the fourier aim, per the orphan verdict at `B/coordination/CRUD-CONSTELLATION.md`.
**Cohort**: **fourier-only.** C is repo-local infra, storage-architecture, and residual-discharge work; no peer-tranche binding. The one cross-repo concern — the colour-domain lift — is held as a *conditional consume* (thread δ) of a value.js-authored deliverable; C does not author value.js's tranche, only records the inverted-edge ask in `coordination/`.
**Mode**: **research-first** for the storage-architecture lane (thread β); **direct** for the infra-hygiene (α) and residual-discharge (γ) lanes. The implementation waves below are *provisional* and harden at challenge close.
**Open**: TBD (after the user authorises C.W0).
**Authored**: 2026-05-19 (infra + storage scoping); **expanded 2026-05-27** (the 6-agent C-development audit, `docs/audits/runs/2026-05-27-C-audit/SYNTHESIS.md`) to fold the B-residual discharge (thread γ) and the conditional colour-consume (thread δ).

## Goal criterion (tranche-level)

C exists to land four threads honestly:

- **α — infra hygiene**: retire the manual SSH-push deploy (`scripts/deploy.sh`), the unfaithful MongoDB TLS posture (`docker-compose.prod.yml:8` `tlsAllowInvalidCertificates=true`), and the operational-maturity gaps (the janitor's missing audit trail; the dev `--reload`-aborts-compute interruption).
- **β — storage architecture**: relocate image (and thumbnail) blobs out of inline-Mongo into a bounded, observable backend whose total footprint is a single bounded query.
- **γ — B-residual discharge (NO legacy code)**: complete the slug-identity convergence the B landing left stranded at the API boundary — the frontend DTO band still *named* `snapshot_hash` (a slug value under a legacy name), masked by an `as unknown as` cast on a stale `FlaggedListResponse`. Fill-or-retire the 15 conformance skeletons honestly. This discharges the **one precept violation** the C-development audit found (`CA6 §2`: NO-legacy-code / fix-at-ROOT / no-workarounds).
- **δ — conditional colour-consume**: iff a value.js tranche publishes the narrow `sampleToSVGPath(fn, n)` lift during C's window, fourier consumes it (collapsing the `easings.ts` internal sampler dup); otherwise it remains a named residual. The richer `Palette` / `colorScale` domain model is **held latent** — per `CA4`, fourier has no gradient/scale consumer, so building it is the rejected "library nobody calls" anti-pattern.

## Completion criterion (tranche-level)

Every wave lands its hard gates (deletion proofs; recorded deploy chain; verified-cert issuer; bounded-query storage enumeration; migration count-parity artefact; the `snapshot_hash` legacy band renamed end-to-end with the cast removed; per-stage test green) or names an honest successor. The §6 hard-gate list is the binding ledger; `PROGRESS.md` reconciles to reality; `FINAL.md` cites every commit and gate.

## §1 — Thesis

fourier-analysis carries three *architectural* surface drifts A catalogued and B did not address — the manual deploy, the unfaithful prod TLS, the inline image blobs — and one *convergence residual* B's own execution left: the frontend half of the slug-identity model. A retired the stylistic drift; B converged the identity model *on the backend* and retired the band-aid's pre-condition (the unbounded `$nin` janitor pattern + the `storage_budget_gb` eviction pass + the config field itself, all landed at B.W3 per `CA5`). What survives is architectural and residual, not stylistic — and it is what C exists to land honestly.

C is composed of **four intentionally separable threads** that share neither files nor risk:

- **α infra hygiene** — well-scoped engineering following `memory/project_infra_plan.md` (webhook CI/CD, MongoDB TLS, port standardization, janitor audit log + recovery, the `--reload` compute-abort fix).
- **β storage architecture** — open-design work whose verdict the research wave (Wα-R1) produces; `CA5` ratifies **filesystem + nginx** as the KISS candidate (zero new container/dependency/cost; the only backend admitting an atomic per-doc cutover, which removes the brittleness window).
- **γ B-residual discharge** — bounded, direct frontend + test work: rename the `snapshot_hash` DTO band to `slug` end-to-end, remove the `as unknown as` cast, reconcile `FlaggedListResponse` to the cursor envelope; fill-or-retire the conformance skeletons honestly. Independent of α/β at file bounds (`web/src/**` + `api/tests/conformance/` vs `api/services/**` + `docker-compose*.yml`) — parallel-capable.
- **δ conditional colour-consume** — the narrow `sampleToSVGPath` consume, conditional on a value.js publish; the inverted cross-repo edge (value.js authors → fourier consumes), user-re-mandate-gated on the value.js side.

KISS — invariant 12 — is the load-bearing constraint across all four. The threads sequence so infra (α) precedes the storage migration (β) that depends on the pipeline + TLS; γ runs parallel (independent files); δ is conditional.

## §2 — Invariants

C inherits all 13 of tranche A's invariants (`docs/tranches/A/A.md §2`) and all 11 of tranche B's invariants 14–24 (`docs/tranches/B/B.md §2`) unchanged. It adds three:

18. **Storage location is bounded and observable — and the delete path is coupled to the bytes** — image and thumbnail blobs (and any future bulk binary asset) live in a storage backend whose total footprint is a single bounded query, whose per-object retention is governed by the same `pinned` / `last_accessed_at` pattern B.W3 landed, and whose backend identity is recorded on the owning document (`storage_uri: str`). The `storage_budget_gb` eviction is retired by relocation, never re-introduction. (Note per `CA5`: the `storage_budget_gb` *config field* and *eviction pass* were ALREADY retired at B.W3 — this invariant binds the inline-blob *write* relocation + the `storage_uri` recording; the thumbnail is a second blob that must relocate alongside the primary.) **Added clause (2026-05-27, Wχ-P1 condition C1):** "bounded" requires the *delete* path to unlink the relocated bytes, not merely the owning document — `_delete_images_and_cascade` (`janitor.py:251-274`) and every image-delete site must remove `<blob_dir>/<slug>` + `<slug>.thumb` whenever they delete an `images` doc, or the relocation defeats the very bound it was meant to honour (orphan files growing unbounded). The footprint is observable only if it is also reclaimable.

19. **Production credentials are TLS-protected at rest, in transit, and in the deploy pipeline** — MongoDB connections in prod use TLS with verified certificates (no `tlsAllowInvalidCertificates`); secrets are not committed to compose files; deploy artefacts authenticate cryptographically rather than via shared bearer / SSH-key reuse. The single-replica deployment constraint (`docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md §5 Option A`) is preserved; C does not introduce horizontal scaling.

20. **Slug-identity convergence is complete end-to-end — no legacy identity name survives behind a cast** (added 2026-05-27 — the one precept violation the C-development audit found, `CA1 §3` + `CA6 §2`). The B convergence collapsed the five identity schemes to one `slug` on the backend, but the frontend mirrors that slug into DTO fields still *named* `snapshot_hash` (`web/src/stores/gallery.ts:29,37`; `workspace.ts:33,364`; `web/src/lib/types.ts:88-95,115-127,191-199,201-206`; `api.ts:577,582,694,698`; `AdminFlaggedPanel.vue:53-60`), masked by an `as unknown as` cast on a stale `FlaggedListResponse`. The **root field name** is `slug` (+ `owner_slug` for the flagged item's owner), confirmed from the response-producing code at Wχ-P4 (`visualizations.py:215-263`, `gallery.py:43-85`, `admin.py:508`) — the wire is already correct; the lie lives only in the frontend type roots. **No identity-bearing field carries a legacy name; no cast masks a type-truth gap on the visualization/gallery surface.** Testable gate (strengthened at Wχ-P4 — the two base greps are necessary but *insufficient*, three cheats pass them): **G1** `git grep -nE "snapshot_hash|snapshotHash" web/src` zero on identity paths; **G2** `git grep -n "as unknown as" web/src/components/visualization web/src/lib/{api,types}.ts` zero; **G3** no type-alias keeps the legacy name; **G4** `git grep -nE "as any|as unknown|@ts-expect-error|@ts-ignore" …` zero on the converged surface (the cast cannot be swapped for a different mask); **G5 (decisive)** `git grep -n FlaggedListResponse web/src` zero — the stale type is *deleted* (requires deleting the dead-duplicate `listFlaggedEntries`, `api.ts:691`); **G6** the flagged type carries the cursor envelope `{items, next_cursor, has_more}` with item `{slug, owner_slug, …}`; **T1 (keystone)** `vue-tsc -b --force` green *with the cast removed* (the truthful shape cannot assign to the stale offset type without a cast, so green-without-cast proves a genuine reshape). Discharges the `CA6 §2` violation.

C opens with **one provisional brittleness window** declared at §8 for the image-blob migration (W5). If Wα-R1 selects the filesystem backend (the `CA5` KISS default), the cutover is atomic per-document and the window is removed at Wχ close. The infra (α) and residual-discharge (γ) waves close green with no window.

## §3 — Wave schedule (provisional — hardened at challenge close; expanded 2026-05-27)

| Wave | Title | Thread | Agents | Closes on (completion) | Status |
|---|---|---|---|---|---|
| W0 — *Open · research dispatch · baseline audit* | open · dispatch · baseline | — | 1 | B confirmed closed (`fc5b3b0`); research lanes dispatched; infra-baseline snapshot (current `deploy.sh` path + health-check port bug, TLS posture, port map) committed; the B-residual catalog (the `snapshot_hash` band + conformance skeletons, from `CA1 §3`) committed; the `--reload` baseline finding recorded; brittleness window §8 ratified or removed | planned |
| Wα — *Research wave (storage, CI/CD, TLS)* | β/α | 3-4 parallel | **R1** storage-backend survey (filesystem+nginx ⊳ GridFS ⊳ MinIO ⊳ managed-S3) with KISS-ordered verdict + per-backend migration shape (including the thumbnail second-blob); **R2** webhook CI/CD survey (auth model; rollback path; does it truly replace `deploy.sh`); **R3** MongoDB TLS posture audit (cert provisioning, rotation, verification mode, prod↔dev parity); optional **R4** janitor-audit-log + `--reload` compute-abort fix spec | planned |
| Wχ — *Challenge wave* | — | 2-3 parallel | `audit/challenge.md` ships **P1** (is the chosen storage backend the smallest honest mechanism — reject any new container/dependency without per-line justification); **P2** (does the webhook CI/CD design actually replace `deploy.sh` including failure modes); **P3** (is the brittleness window honest, or is the filesystem cutover truly atomic); **P4** (does thread γ's discharge actually remove the legacy name at the ROOT — no rename-behind-a-new-cast) | planned |
| W1 — *Webhook CI/CD + secret extraction* | α | 2 parallel | **RECONCILE with the existing host dispatcher (Wχ-P2 C5) — do NOT impose the greenfield design.** A live multi-repo `adnanh/webhook` (`/opt/deploy/`, 4 sibling repos) already runs; W1 lands the *repo-local* artefacts (tracked `scripts/deploy-hook.sh` matching the dispatcher contract + `flock` + a real `:8100` health-gate + rebuild-on-rollback + dirty-tree-fail-loud, C7); `deploy.sh` retired (deletion proof); `git grep -nE '[:/]8091' -- ':!docs/*' ':!*.lock' ':!**/*.json'` returns zero (the honest scoped grep, C8); secrets stay out of compose (already clean per baseline §1.3); `docs/precepts/infra/` created (deploy note + host-artefact locations). **The shared-dispatcher rewrite is a named host-ops residual** (C6) touching 4 other repos — proposed, not landed unilaterally; the deploy-chain transcript is recorded iff host wiring is performed, else "repo-local landed, host-activation pending" — never claimed proven-when-not | provisional |
| W2 — *MongoDB TLS + port standardization* | α | 2 parallel | `tlsAllowInvalidCertificates` removed (`docker-compose.prod.yml:8,48,53` — three sites per `CA5`); verified certs in place (issuer recorded); prod port map ratified per `project_infra_plan.md` (fourier 8100); dev `MONGO_URI` updated; `docs/precepts/infra/` records the convention | provisional |
| W3 — *Janitor audit-log + recovery + `--reload` compute-abort fix* | α | 1-2 | every janitor `delete_many` writes an `admin_audit` row (category, count, cutoff); partial-failure recovery re-runs cleanly; the dev `--reload`-aborts-compute interruption (`Dockerfile:16`, `scripts/dev.sh:74` — dev-only; prod uses `--workers`) is scoped/disabled on the compute path (KISS) or routed to a background queue (deferred-if-needed); integration tests assert all | provisional |
| W4 — *Slug-identity completeness + B-residual discharge* | γ (+ conditional δ) | 2-3 parallel | the `snapshot_hash` DTO band renamed to `slug` end-to-end; the `as unknown as` cast removed; `FlaggedListResponse` reconciled to the cursor envelope; invariant-20 greps return zero; **all 14** conformance skeletons FILLED (Wχ-P4: the backing utilities exist in `api/lib/crud/`, 9 of 14 already have a green proxy suite — zero retire; the matrix must cite test methods that actually exist); the dead-duplicate `listFlaggedEntries` (`api.ts:691`) deleted; the e2e axe-keystone settle-wait landed; the strengthened gate (G1–G6 + T1, `audit/challenge.md §4`) green. **Conditional δ**: iff value.js has published `sampleToSVGPath` by W4 dispatch, `easings.ts`'s internal sampler swaps onto it (the internal dup collapses); else the consume holds as a named residual. **Independent of W1–W3/W5 at file bounds — may run parallel with the infra waves.** | provisional |
| W5 — *Image-blob migration* | β | 2-3 parallel | filesystem+nginx app-served (Wα-R1; `R-storage-spec.md`). `image_storage.py:104` no longer writes `Binary(content)` (deletion proof); primary + thumbnail relocate with `storage_uri`/`thumbnail_uri` on the `images` doc; migration script + harness (count-parity, 10-row byte-identity spot-check, blob-XOR-uri post-condition); `…/blob` + `…/thumbnail` serve via `FileResponse`. **Wχ-P1/P3 conditions (binding, same deletion-proof commit):** the **janitor image-delete unlinks the relocated files** (C1, inv-18 delete-coupling — else orphans defeat the bound); **volume ownership** established so the unprivileged `app` user can write (C2, EACCES); a **path-confinement guard** on `_resolve()` (C3); a **backup/DR note** + `external:true`-protected volume (C4); the **dedup-hit path rewritten** through the shim + thumbnail write-back as a file not an inline `Binary`, proven by `test_dedup_hit_on_migrated_doc` (C9 — the real runtime bug); the **compute-backfill projection** changed off `{blob:1}` (C10); **no "skip if file exists"** short-circuit (C11). | provisional |
| W6 — *Close* | — | 1 | `PROGRESS.md` reconciled; `FINAL.md` cites every commit + gate; `coordination/` updated (the conditional δ disposition; the inverted cross-repo edge); brittleness window §8 restored; any residual named with destination | provisional |

Hard ceiling 10 agents/wave; C peaks at ~4. W0 → Wα → Wχ is a strict gate (research-first). W1 (CI/CD) precedes W2 (TLS) so the TLS rollout ships through the new pipeline. W3 (janitor + `--reload`) is independent of W1/W2 and may overlap. **W4 (residual discharge — thread γ) is independent of all infra/storage waves and runs parallel** subject to agent budget. W5 (storage) depends on W1 (the migration dispatches through the new pipeline) + W2 (the new backend, if networked, honours the verified-TLS contract). The implementation waves W1–W6 harden into `waves/W*.md` at Wχ close.

## §4 — Phases

**Phase 0 — research and challenge (W0–Wχ).** The storage backend and the CI/CD shape are open; research surveys honestly, challenge tests nothing was over-engineered, and Wχ.P4 confirms thread γ removes the legacy name at the root. No infra change commits before Wχ closes.

**Phase I — deploy honesty (W1–W2).** Pipeline first (so the rollout is observable), TLS second (so the rollout exercises the pipeline on a non-trivial change). Secrets exit compose files in the pipeline-landing wave.

**Phase II — operations maturity (W3).** The janitor acquires the audit trail A.W4 deferred and the recovery semantics a 6-hour loop lacks; the dev `--reload` compute-abort is fixed.

**Phase III — convergence completion (W4).** The slug-identity model finishes at the frontend; the legacy DTO name and the masking cast are removed at the ROOT; the conformance citations become honest. Runs parallel with Phases I–II (disjoint files). The conditional colour-consume δ fires here iff value.js has published.

**Phase IV — storage relocation (W5).** With the pipeline operational and TLS honest, the image+thumbnail blobs relocate to the Wα-R1 backend; the inline-blob write deletes; `storage_uri` is recorded. The brittleness window §8 governs whether dual-read is required (removed at Wχ if filesystem is chosen).

**Phase V — close (W6).**

## §5 — Critical files and ownership

The research wave refines this; the known scope at open:

| Surface | Files | Owning wave |
|---|---|---|
| Deploy pipeline | `scripts/deploy.sh` (retire), new webhook receiver config (path TBD by Wα-R2), `docker-compose*.yml` secret references | W1 |
| TLS + ports | `docker-compose.prod.yml`, `nginx/*.conf`, `.env.example`, dev `MONGO_URI` in `docker-compose.yml`, `docs/precepts/infra/` (create) | W2 |
| Janitor + `--reload` | `api/services/janitor.py` (audit-log emission), `api/routers/admin.py` (audit row), `Dockerfile` / `scripts/dev.sh` (the `--reload` compute-path scope), `api/tests/test_janitor_audit.py` (create) | W3 |
| Slug-identity completeness (γ) | `web/src/stores/{gallery,workspace}.ts`, `web/src/lib/{types,api}.ts`, `web/src/components/visualization/gallery/AdminFlaggedPanel.vue` (+ the ~16 gallery-component consumers), `api/tests/conformance/*.py` (fill-or-retire), `e2e/visualization-ux.spec.ts` (axe settle), `web/src/lib/easings.ts` (conditional δ) | W4 |
| Image-blob migration (β) | `api/services/image_storage.py`, `api/routers/images.py`, `api/models/assets.py`, `api/scripts/migrate_image_blobs.py` (create) | W5 |

No two waves hold overlapping write bounds. W3's `janitor.py` touch is the audit-log emission; W5's `image_storage.py` touch is the blob-write site — sequential, no conflict. W4 (web + tests) is disjoint from all api/infra waves. The B.W3 `pinned`-flag pattern is the substrate W5 builds on; W5 does not re-introduce a `$nin` query.

## §6 — Hard gates (completion criterion)

Per-wave gates set in the hardened `waves/W*.md` after Wχ. Tranche-level close gates:

- `scripts/deploy.sh` does not exist; `git grep -nE '[:/]8091' -- ':!docs/*' ':!*.lock' ':!**/*.json'` returns zero (the honest scoped grep — Wχ-P2 C8; incidental `8091` substrings in `uv.lock`/JSON assets make a bare grep unachievable). The repo-local deploy artefacts land + are reviewed; the recorded commit-to-deploy chain is the gate **iff** host wiring is performed (else the host-activation residual is recorded honestly, never claimed proven — Wχ-P2 C6).
- `docker-compose.prod.yml` source contains no plaintext password and no `tlsAllowInvalidCertificates` (all three sites); the verified cert issuer is recorded in `docs/precepts/infra/`.
- **Invariant 20**: `git grep -nE "snapshot_hash|snapshotHash" web/src` returns zero on identity paths; `git grep -n "as unknown as" web/src/components/visualization web/src/lib/{api,types}.ts` returns zero on the converged surface; `FlaggedListResponse` carries the cursor-envelope shape.
- All **14** `api/tests/conformance/*.py` skeletons are implemented (passing) — Wχ-P4: the backing `api/lib/crud/` utilities exist, so all fill, zero retire; `CONFORMANCE-MATRIX.md` cites only test methods that exist. The dead-duplicate `listFlaggedEntries` (`api.ts:691`) is deleted (`git grep -n FlaggedListResponse web/src` → zero).
- `api/services/image_storage.py` source contains no `Binary(content)` write **and no inline-`Binary` thumbnail write-back on the dedup path** (the W5 deletion proof + Wχ-P3 C9); the chosen backend's enumeration query returns a bounded total recorded by the migration verification; primary + thumbnail both relocated; the **janitor image-delete unlinks the relocated files** (Wχ-P1 C1 — inv-18 delete-coupling), proven by a delete-then-assert-file-gone test.
- Migration verification harness ran green: pre-count = post-count + skipped; seed-spot-check of 10 returns identical bytes from old and new sources before the old field deletes.
- Janitor audit-log + partial-failure-recovery integration tests pass; the `--reload` compute-abort is fixed (compute survives a dev reload, or the path is scoped off `--reload`).
- `uv run pytest` green; `vue-tsc -b --force` green; `npm run build` succeeds.
- `PROGRESS.md` matches reality; `FINAL.md` cites commits + artefacts; the conditional δ disposition recorded.

Invalid hard gates (rejected at challenge): "webhook configured" without a recorded deploy chain; "TLS enabled" without a verified-cert issuer; "blobs moved" without a count-parity artefact; "`snapshot_hash` removed" by renaming behind a new cast rather than at the type root; a dual-read compatibility layer left in place "for safety".

## §7 — Cross-tranche debt and explicit deferrals

**Inherited from A:**
- Infra items deferred at A.W4 (webhook CI/CD, MongoDB TLS, port standardization per `A.md §8`). → **W1, W2.**
- Rate-limiter Option A (single-replica, documented honestly) is in place; C does **not** revisit unless Wα surfaces a multi-replica requirement. Default: no work in C.

**Inherited from B (per `B/FINAL.md §6` + the C-development audit):**
- **Image-blob-out-of-Mongo storage redesign** (`B.md §7`). → **Wα-R1, W5.** **Correction (`CA5`)**: B.W3 already retired the `storage_budget_gb` *config field* AND the eviction *pass* (the prior `C.md §7` claim that "B did NOT retire the config" was a factual error). C.W5's gate is the inline-write relocation + `storage_uri`, not the config retirement.
- **The slug-identity frontend residual** (the `snapshot_hash` DTO band + the `as unknown as` cast + the stale `FlaggedListResponse`). → **W4** (thread γ; invariant 20). This is the one precept violation the audit found — its discharge is C's compliance restoration.
- **The 15 conformance skeletons** (skip-stubs the matrix cites as evidence). → **W4** (fill-or-retire honestly).
- **The e2e axe-keystone settle-wait** (timing-tuning only; the harness exists). → **W4.**
- **The `--reload`-aborts-compute** chronic-residual (dev-only). → **W3.**
- B.W3's `pinned`-flag pattern is the substrate W5 builds on (the migrated `images` collection already carries `pinned` + `last_accessed_at`).

**Cross-repo (the inverted colour-lift edge — thread δ):**
- The colour-domain lift (`colors.ts`/`easings.ts` → value.js) was a B residual with destination `fourier-tranche-C-or-successor`. The C-development audit (`CA4`) found it is **much narrower than feared**: `colors.ts` has 0 domain symbols (brand tokens + DOM glue + 2 dups — all stay in fourier); the only genuine lift is `easings.ts`'s `generateCurveSVGPath` → a generic `sampleToSVGPath(fn, n)` in `value.js/src/math.ts` (generalising `cubicBezierToSVG`). The richer `Palette` / `colorScale` domain model is **premature** — fourier has no gradient/scale consumer; building it is the "library nobody calls" anti-pattern (and building it *in fourier* violates invariant 15). **Disposition**: the lift is a **value.js-authored deliverable** (the edge inverts — value.js publishes, fourier consumes), user-re-mandate-gated on the value.js side (per `CA3`: value.js-H is closed, its `I-SEED` thesis is open with no colour reference, so this needs a forward-themed or dedicated value.js tranche). fourier-C holds only the **conditional W4-δ consume** of `sampleToSVGPath`; the rest stays a latent affordance (`CRUD-CONTRACT §9` "0 library"). `coordination/COLOUR-LIFT.md` records the cross-repo ask.

**Emitted by C (potential):**
- If Wα-R1 selects a managed-S3 backend, C emits an ongoing-cost concern (invariant 12 default is filesystem; named here so the verdict is binding).
- If Wα-R2 selects a webhook framework requiring its own container, C emits an operational-surface-inflation concern (Wχ.P1 enforces).

**Deferred out of C (potential successor tranches):**
- Multi-replica fourier deployment — out of scope per invariant 19; a fourier-D opens if ever needed.
- The full `Palette` / `colorScale` colour-domain model — held latent until a real fourier consumer (a gradient/scale UI) lands; then a value.js tranche authors it and a fourier successor consumes.
- Cross-cohort infrastructure standardization (the fuller `project_infra_plan.md` scope — other repos' migrations/ports) — constellation-wide, not fourier's to author.

## §8 — Brittleness window — STRUCK at Wχ close (with conditions)

**Resolved 2026-05-27 (Wα-R1 + Wχ-P3): the window is REMOVED.** Wα-R1 selected filesystem+nginx; Wχ-P3 adversarially confirmed the atomic per-document cutover survives (single standalone `mongod`, fresh `find_one` per request, no app-side doc cache ⇒ `blob` XOR `storage_uri` holds per-doc at every instant, no stale-read hole; the endpoint is never suspended and never wrong mid-sweep). `breaking_changes_during_wave` resolves to **no**; `suspended_gates` is **empty**. The strike is **conditional** on the Wχ-P3 correctness conditions (C9 dedup-hit path, C10 compute-backfill projection, C11 no skip-if-exists) being bound into W5's deletion-proof commit — without them the cutover is atomic *but the write path silently regresses*. The original provisional window text is retained below for the close-ceremony record.

The W5 image-blob migration *was* feared to require a brittleness window — a span where reads are dual-pathed (Mongo `blob` field AND new backend `storage_uri`) until the new backend is verified complete. Whether the chosen backend admits an atomic cutover was a research question (Wα-R1); `CA5` ranked **filesystem+nginx** first precisely because it admits an atomic per-document cutover, removing the window — which Wα-R1's `R-storage-spec.md §4` and Wχ-P3 confirmed.

```yaml
breaking_changes_during_wave: no   # resolved at Wχ — atomic per-doc cutover (Wχ-P3)
suspended_gates: []                # empty — the endpoint is never suspended; each doc serves from exactly one backend throughout
restoration_wave: n/a (no window to restore)
reason: a relocated blob cannot be reached through the old Mongo-inline path once
        the field is deleted; a dual-read compatibility layer left past the cutover
        would be the legacy code invariant 3 forbids. The window (if any) opens for
        the backfill + verification sweep and closes on the commit that deletes the
        Mongo `blob` field. If Wα-R1 selects the filesystem backend (the CA5 KISS
        default), an atomic per-document cutover is possible and the window is
        removed at Wχ close.
```

W1–W4 close green with no window; W5 owns its own restoration; the close ceremony cannot run while the window is open.
