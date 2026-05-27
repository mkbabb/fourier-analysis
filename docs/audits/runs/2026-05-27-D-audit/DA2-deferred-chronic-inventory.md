# DA2 — Master deferred / chronic-item inventory and tranche-D destination map

**Lane**: DA2 (audit lane, fourier tranche-D DEVELOPMENT phase — planning only).
**Mode**: READ-ONLY (one deliverable; no source edits, no commits).
**HEAD substrate**: C CLOSED 2026-05-27 (`docs/tranches/C/FINAL.md`, `1e47115`); B CLOSED 2026-05-27 (`fc5b3b0`); A CLOSED 2026-05-26 (`c7cfd82`). D does not yet exist as a stub.
**Directive**: "Tranche D folds in EVERY deferred item; chronic ones (deferred across ≥ 2 tranches) explicitly delineated. CRUCIALLY — prod SSH is now available, so the host-coupled residuals C named (out-of-repo-reach then) are NOW in-scope for D: all must be integrated and deployed." Precepts: NO legacy code, idiomatic/gestalt, fix-at-ROOT.

## §0 — Goal + completion criterion (paired)

**Goal.** Enumerate EVERY deferred / named-successor / chronic item across tranches A + B + C, classify each by chronicity and load-bearing weight, and map each to a tranche-D destination (NEW D wave / existing-thread fold / value.js peer / different tranche / WONTFIX-with-rationale) — so the D-authoring round folds the C carries (now that the host residuals are in repo-reach because prod SSH is available), surfaces the chronic items the directive most cares about, and routes the rest with destination-discipline.

**Completion.** A single document carrying: the master inventory table (§1); the chronic-risk callouts for items deferred ≥ 2 tranches (§2); the **host-residuals-now-in-scope** reclassification (§3 — the directive's CRUX); the D-fold recommendation grouped into proposed wave threads (§4); the items that must NOT go in D with their correct successor named (§5). Both criteria hold at this writing.

## §0.1 — Classification key

- **CHRONIC** = deferred across ≥ 2 discrete planning gates (A→B, A→B→C, A→B→C→D, or filed-and-re-filed without absorption). This mirrors the C-audit's L6-governed rubric (`docs/audits/runs/2026-05-27-C-audit/CA2-deferred-chronic-inventory.md §0.1`).
- **LOAD-BEARING** = an architectural surface drift or a correctness / observability / deploy obligation; its non-discharge degrades the system, not merely the cosmetics.
- **RESIDUAL** = a cosmetic, ergonomic, or latent-affordance item; its non-discharge is honest indefinitely OR awaits an external (orphaned) party.
- Four cells: **CHRONIC-LOAD-BEARING**, **CHRONIC-RESIDUAL**, **DEFERRED-LOAD-BEARING**, **DEFERRED-RESIDUAL** (the latter two = one-gate-deep, not yet chronic).
- **HOST-RECLASSIFIED** = a marker on items C named as "host-activation pending / repo-local landed" residuals that the prod-SSH availability promotes from out-of-reach-residual to **D implementation deliverable**. This is the directive's central re-grading.

## §0.2 — Empirical state-checks run at this writing (load-bearing for the map)

Every status word below resolves to the live HEAD tree, not to a doc's claim.

| Check | Finding | Effect on map |
|---|---|---|
| `grep -n 'tlsAllowInvalid\|tlsAllowConnectionsWithoutCertificates' docker-compose.prod.yml` | **Three sites STILL present** — `docker-compose.prod.yml:8` (`tlsAllowInvalidCertificates=true` on `MONGO_URI`), `:53` (`--tlsAllowConnectionsWithoutCertificates`), `:58` (healthcheck `--tlsAllowInvalidCertificates`). | The C.W2 Stratum-B compose cutover **never landed** — prod TLS is genuinely unfaithful at HEAD. This is a live D deliverable, not a closed gate (item 2). |
| `test -f scripts/deploy.sh` | **GONE** (deleted at C.W1 `49cb714`). `scripts/deploy-hook.sh` (8011 B) + `scripts/gen-mongo-certs.sh` (7259 B) both present + tracked. | The Stratum-A halves landed; only the host-side wiring + cert-run remain (items 1, 2). |
| `grep -rn 'Binary(content)' api/services/image_storage.py` | **Zero** — the inline-blob write is gone (C.W5 `817cfcc`). | The migration *code* + harness are proven; only the prod **migration RUN** against live data remains (item 3). |
| `git grep -nE 'snapshot_hash\|snapshotHash' web/src api/routers/visualizations.py` | **Zero on identity paths**; `FlaggedListResponse` returns zero in `web/src/`. | The γ slug-identity residual (B carry) is **discharged at root** (C.W4 `f91a656`). Closed — record as discharged, no D action. |
| `grep -n storage_budget_gb api/` | Only a NOTE comment (`api/config.py:25`) + test guards survive; the field + the inline-blob eviction band-aid are gone (B.W3 + C.W5). | The `storage_budget_gb` retire-by-relocation chronic is **fully discharged** across B+C. Closed. |
| `grep -rn onnxruntime src/fourier_analysis/contours/ml.py` | Live at `:72,213` — `import onnxruntime as ort` inside the ML contour path. | The onnxruntime CPU-vendor warning flood (A carry) survives; still a cosmetic-log residual. |
| `api/scripts/migrate_visualization.py:30` | Source docstring names "the L6 chronic-residual #5 — the migration is interrupted mid-pass on every dev-server reload." | The `--reload`-aborts-compute chronic was the *same* root as this migration-reload hazard; C.W3 fixed the watch-narrowing — verify the migration-reload note is now moot, not a fresh D item. |

## §1 — Master inventory table

Rows aggregated from `A/FINAL.md §5–7`, `B/FINAL.md §6`, `C/FINAL.md §6`, `C/coordination/{DEPLOY-RECONCILE.md, COLOUR-LIFT.md}`, `C/infra/{tls.md, blob-backend-dr.md}`, `B/coordination/{CRUD-CONSTELLATION.md, CONFORMANCE-MATRIX.md}`, the `memory/*` files, the `git log` deferral-grep, and the live-tree `git grep` + state-checks of §0.2. Citation = first-class source. "Current status" reads the empirical HEAD, not a doc's word.

| # | Item | Origin (tranche/wave) | Chronic? [gates] | Current status | D destination + thread |
|---|---|---|---|---|---|
| 1 | **Shared `/opt/deploy/dispatch.sh` rewrite + fourier-hook registration** (touches 4 sibling repos) | A.§9 infra → B.§7 → C.W1 (`DEPLOY-RECONCILE.md §3`) | **CHRONIC-LOAD-BEARING** [3+] | Stratum-A `deploy-hook.sh` landed (`49cb714`); host wiring **never performed** — "repo-local landed, host-activation pending" (`C/FINAL.md §6`). **prod SSH now available.** | **NEW D wave (α-host) — IMPLEMENT + DEPLOY.** See §3.1. Register the fourier `case` arm at `/opt/deploy/hooks.json` → `scripts/deploy-hook.sh`; capture the G10 deploy-chain + G11 bad-commit-revert transcripts. |
| 2 | **Prod MongoDB TLS cutover** (`gen-mongo-certs.sh` host-run + the `tls.md §9` 3-site compose diff) | A.§9 infra → B.§7 → C.W2 (`tls.md §9`) | **CHRONIC-LOAD-BEARING** [3+] | Stratum-A tool + precept landed (`4905682`); compose **STILL carries all 3 `tlsAllowInvalid*` flags** (`docker-compose.prod.yml:8,53,58` — verified §0.2). Invariant-19 gate UNMET. | **NEW D wave (α-host) — IMPLEMENT + DEPLOY.** See §3.2. Run `gen-mongo-certs.sh` on host → apply the verbatim Edit 1/2/3 diff → live `ping`-with-CA proof → post-apply grep gate. |
| 3 | **Prod image-blob migration RUN** (`python -m api.scripts.migrate_image_blobs` against prod data) | A.§9 (image-blob ledger) → B.§6/§7 (Option B) → C.W5 | **CHRONIC-LOAD-BEARING** [3+] | Code + dry-run + harness + count-parity proven (`817cfcc`); the **prod data run** never executed (host op). **prod SSH now available.** | **NEW D wave (β-host) — RUN + VERIFY.** See §3.3. Run the migration against prod; prove count-parity + byte-identity spot-check + `blob` XOR `storage_uri` post-condition on live data; confirm `image_blobs` external volume exists (`docker volume create image_blobs`). |
| 4 | **Precepts-submodule promotion** of `docs/tranches/C/infra/{tls.md, blob-backend-dr.md}` + the staged `deploy.md` content → `docs/precepts/infra/` | C.W1/W2/W5/W6 (all 3 staged in-tree; submodule push pending) | **DEFERRED-LOAD-BEARING (host/submodule)** [1] | Content staged + reachable from fourier's chain; the submodule push + gitlink bump never performed (outward-facing shared-repo act). | **D infra-close step (α-host).** See §3.4. Land the 3 notes in the `precepts.git` submodule + bump the gitlink + dual-cite. In-scope now (no longer "out-of-reach"). |
| 5 | **Backend `--reload` aborts in-flight compute** (`ERR_EMPTY_RESPONSE` cascade); the migration-reload twin (`migrate_visualization.py:30`) | A.W3.5 (#254) → routed-C → C.W3 (in-process fix landed) | **CHRONIC-RESIDUAL (likely DISCHARGED at C)** [2] | C.W3 dropped `--reload-dir src` (`dev.sh:76` + `api/Dockerfile:16`, `e6a6b95`); the *in-process root fix* landed. The **background-queue** alternative explicitly deferred to fourier-D (`C/FINAL.md §6`; `C/waves/W3.md §B.3`). | **WONTFIX-in-D unless trigger fires** — confirm the watch-narrowing closed it at C.W0-equivalent baseline. The background queue lands ONLY if D needs compute outliving a request (the named trigger). Default: no D work. |
| 6 | **C4.5 / C4.6 visibility-transition guard** (backend `$set`s visibility unconditionally; `visibility_illegal_transition` helper unused) | B.W1 (matrix authored) → B.W4 (struck) → C.W4 (struck again, "route to a backend wave") | **CHRONIC-LOAD-BEARING** [2 strikes] | Struck from the conformance matrix at B.W4 AND C.W4 (`CONFORMANCE-MATRIX.md:119,121`); `C/FINAL.md §6` names "a successor wave if the guard is wanted." The helper exists, unused. | **NEW D wave (backend-CRUD).** See §4 thread γ. The guard is a backend-router change (`update_visualization`) — the natural D home; fill the two struck conformance rows once landed. |
| 7 | **The 6 §U conformance strikes** (slug_words import-validator + immutable-view; cursor HMAC-tamper; problem-type catalog-reject; include_deleted_filter; surface-coverage test) | B.W1 (§U authored) → B.W4 → C.W6 (§U citation reconciled, rows STRUCK as NOT-IMPLEMENTED) | **CHRONIC-RESIDUAL** [2] | All 6 struck per the "no-phantom-citation" rule (`CONFORMANCE-MATRIX.md:365,367,380,391,430,448`) — the asserted symbols/behaviours were never built; the matrix cites only what exists. | **WONTFIX-in-D (revive-if-built).** These are "deferred — not implemented" by design choice (KISS); revive a row only if D builds the corresponding symbol (e.g. an import-time slug-word validator). Not a debt, a never-built affordance. |
| 8 | **`colors.ts` dup cleanup + `easings.ts` `sampleToSVGPath` consume + value.js dep bump** (the colour-domain lift, narrowed) | A.W2.b/W6 (#292) → B.W4 (orphan residual) → C.W4-δ (conditional, did not fire) | **CHRONIC-RESIDUAL** [3] | value.js v0.10.0 does NOT export `sampleToSVGPath` (`C/FINAL.md §0(d)`); C.W4-δ held it a **named residual** — `easings.ts` + the value.js pin byte-identical to HEAD. The 2 `colors.ts` dups (a fourier-internal cleanup, no cross-repo dep) are still present. | **Split. (a) the 2-dup `colors.ts` cleanup → a D web-frontend sub-task** (fourier-internal, no cross-repo dep, idiomatic). **(b) the `sampleToSVGPath` consume → value.js peer (PRIMARY); D consumer-half CONTINGENT** on a value.js publish. See §2 chronic callout 4 + §5. |
| 9 | **The full `Palette` / `colorScale` colour-domain model** | B.W2 (CRUD-CONSTELLATION "Three") → B (orphaned) → C.W4 (held latent) | **CHRONIC-RESIDUAL (latent)** [3] | Held latent every gate — fourier has no gradient/scale consumer (`VIZ_COLORS.rainbow` never sampled, `COLOUR-LIFT.md §2`); building it is the "library nobody calls" anti-pattern + an invariant-15 violation if built in-app. | **Different tranche — value.js (when a real fourier consumer lands).** NOT D unless D ships a gradient/scale UI. `CRUD-CONTRACT §9` records "0 library." Latent affordance. |
| 10 | **value.js-side conformance-matrix rows** (180 cross-repo cells held DEFERRED) | B.W1 (matrix) → B.W4 → C (untouched — fourier-only tranche) | **CHRONIC-RESIDUAL (orphaned)** [2+] | value.js-C RETIRED; the value.js half is terminal-orphaned (`CRUD-CONSTELLATION.md` orphan verdict). The fourier contract is a latent affordance consumable without re-research. | **value.js reopened cohort — DEFERRED.** Not fourier-D's to land. Pending a value.js re-engagement (the `I-SEED` thesis carries no colour/CRUD reference per `CA3`). |
| 11 | **slug-words `slug_words.json` precepts-submodule relocation** | B.W3 (`slugs.py:18`) → B.§6 → C.§7 ("when a second consumer materialises") | **DEFERRED-RESIDUAL** [1–2] | In-repo at `api/lib/crud/slug_words.json` per invariant-16 "in-repo first"; comment at `api/lib/crud/slugs.py:18` names the recorded B-residual. Still 1 consumer. | **Different successor — precepts-submodule extraction on second consumer** (value.js re-engagement). Premature in D. NOT infra/storage. |
| 12 | **`FlaggedListResponse` type reconciliation** (cursor-envelope shape) | B.W4 (`types.ts:201` local cast) → C.W4 (DELETED at root) | **DEFERRED-LOAD-BEARING (DISCHARGED at C)** [1] | `git grep FlaggedListResponse web/src` → zero (verified §0.2); the `as unknown as` cast removed; `vue-tsc -b --force` green with the cast gone (the T1 keystone, `f91a656`). | **WONTFIX-in-D — discharged at C.W4.** Record as closed in D.W0 baseline; no D action. |
| 13 | **e2e axe-keystone settle-wait** (transient dock-collapse-animation artifacts) | A.W5.a (a11y carry) → B.W4 (harness landed) → C.W4 (folded) | **DEFERRED-RESIDUAL** [1–2] | `@axe-core/playwright` `AxeBuilder` harness present (`web/e2e/visualization-crud.spec.ts:2,85`); only the settle-wait constant is the residual. | **Different successor — minor e2e-timing tuning (web-local).** Fold opportunistically into a D web wave if D touches the e2e surface; not load-bearing. |
| 14 | **onnxruntime CPU-vendor warning flood** | A.W3.5 (#254) → routed-C → C (not folded) | **CHRONIC-RESIDUAL** [2] | Live at `src/fourier_analysis/contours/ml.py:72,213` (verified §0.2); C never folded it (CA2 §1 item 13 marked WONTFIX-able). | **WONTFIX-able / D-W0 if a one-line suppression.** Cosmetic log noise; honest indefinitely (no-fallbacks precept does not mandate it). Fold opportunistically only if trivial. |
| 15 | **Rate-limiter Option B** (Mongo TTL bucket; multi-replica) | A.W4 (Option A chosen) → C.§7 (deferral named) → "fourier-D if ever needed" | **DEFERRED-LOAD-BEARING (latent)** [1–2] | Option A deliberate (single-replica `replicas: 1`); the module-level `SlidingWindowLimiter` is process-local by construction (`CONFORMANCE-MATRIX.md:236`). Only triggers on a real multi-replica need. | **D-only-if-trigger.** `C/FINAL.md §6` + `C.md §7` route it to "a fourier-D if ever needed (invariant 19 single-replica preserved)." Default: no D work unless D opens multi-replica. |
| 16 | **Multi-replica fourier deployment** | A.W4 (replicas:1 pin) → C.§7 (out of scope, invariant 19) → "fourier-D if ever needed" | **DEFERRED-LOAD-BEARING (latent)** [1–2] | Invariant-19 single-replica preserved through C; explicitly "a fourier-D opens if ever needed" (`C.md §7`). | **D-only-if-trigger.** The named successor IS fourier-D — but only conditioned on a real horizontal-scale need. Pairs with item 15. |
| 17 | **`--scale-press*` glass-ui unification** (press-scale token) | A.W0-challenge → A.W6 ("STILL FILED") → B.§7 (substrate carry) | **CHRONIC-RESIDUAL** [2–3] | No upstream glass-ui commit; awaits glass-ui's next surface tranche (`A/FINAL.md §7,§291`; `B/FINAL.md §7`). | **Different tranche — glass-ui next surface tranche.** Neither C nor D should annex; CONSTELLATION discipline holds. |
| 18 | **glass-ui `ConfiguratorLayer` header-actions slot + dock `aria-hidden-focus`** | B.W2/W4 (substrate carries) | **DEFERRED-RESIDUAL** [1] | Filed to glass-ui, not a fourier-side fork (`B/FINAL.md §7`). | **Different tranche — glass-ui next surface tranche.** |
| 19 | **glass-ui Pagination primitive; `--viz-easing` token; `::selection` base; Tabs entry animation** (A's STILL-FILED emitted carries) | A.W5.a / A.W6 (`A/FINAL.md §3,§7`) | **CHRONIC-RESIDUAL** [2] | All "STILL FILED — local carry; awaits glass-ui's next surface tranche" at A close; B did not absorb (correctly — glass-ui substrate). | **Different tranche — glass-ui next surface tranche.** Not fourier-D's to author. |
| 20 | **glass-ui `style.css:3` import cold-boot race** | A.W3.5.d (`A/FINAL.md §5`) | **DEFERRED-RESIDUAL** [1] | Routed to glass-ui constellation carry (`pnpm vite optimize --force` mitigation; structural fix at glass-ui). | **Different tranche — glass-ui.** Not fourier-D. |
| 21 | **Levels-derivation drift** (`workspace.runComputeBases` ⇄ `compute_bases`) | A.W3.5.d (#253) → routed-B → B.W3 invariant 19 (absorbed) | **DEFERRED-LOAD-BEARING (DISCHARGED at B)** [1] | B's invariant 19 (auto-recompute discipline, `ComputeBasesRequest` seam) absorbed it (`A/FINAL.md §5`; `CA2 §1 item 15`). | **WONTFIX-in-D — discharged at B.** Verify closed at D.W0; no D action. |
| 22 | **Ruff F841 unused `result` at `image_storage.py:224`** | A.W4.b (#7, routed-B) → B.W3.b (incidental retire) | **DEFERRED-RESIDUAL (DISCHARGED at B)** [1] | B.W3.b file-bounds modify-carve naturally retired it (`CA2 §1 item 16`). | **WONTFIX-in-D — discharged at B.** Verify; no D action. |
| 23 | **Cross-cohort infra standardisation** (floridify migration, ncdpi-ai-tools removal, sudoku/speedtest 10-port blocks, Mongo-8 upgrade) | `project_infra_plan.md` (2026-03-28) → A.§9 → C.§7 (fourier subset only) | **CHRONIC-LOAD-BEARING (out of fourier scope)** [3+] | C addressed only the fourier-bound subset (port 8100 ratified, `tls.md §8`); the fuller plan is constellation-wide. The plan file is **60 days stale** — verify against live compose, do not trust the memory. | **Different successor — constellation-wide infra effort.** D owns ONLY the fourier subset (which the host waves §3 now discharge). The floridify/ncdpi/sudoku/speedtest items are not fourier-D's to author. |
| 24 | **Backup / DR for the `image_blobs` sole-copy surface** (split-brain-on-restore hazard) | C.W5 (`blob-backend-dr.md`) — net-new at C | **DEFERRED-LOAD-BEARING (net-new)** [1] | The DR note records the hazard (`mongo_data` + `image_blobs` must snapshot together); **no backup mechanism exists in the tree** (no `mongodump`/snapshot cron). The `external: true` guard landed; the consistent-snapshot cron did not. | **NEW D wave (β-host) — pairs with item 3.** Once the prod migration runs (item 3), `image_blobs` holds the sole copy; D should land the consistent-snapshot mechanism the note specifies. In-scope now (host op, prod SSH available). |
| 25 | **Managed-S3 ongoing-cost concern** (if a future storage re-survey selects S3) | C.§7 (potential-emit) | **DEFERRED-RESIDUAL (potential)** [1] | C selected local-filesystem (invariant-12 default); the concern is a conditional emit that did not fire. | **WONTFIX-in-D.** Filesystem held; no S3 selected. Record as not-triggered; revisit only on a storage re-survey. |
| 26 | **Host `hooks.json` + `/opt/deploy/.env` `0664` secret-hardening** (world-readable; any local user can forge `X-Hub-Signature-256`) | C.W1 (`DEPLOY-RECONCILE.md §3.2`) — measured, recorded-not-fixed | **DEFERRED-LOAD-BEARING (host)** [1] | Recorded as "accepted-or-to-be-hardened posture," not silently claimed fixed. Touches the shared dispatcher. **prod SSH now available.** | **NEW D wave (α-host) — fold into the shared-dispatcher hardening (item 1).** Harden to `0600`/root OR document the accepted weaker posture explicitly. In-scope now. |
| 27 | **Host dirty-tree reconcile** (`M docker-compose.prod.yml`, `M docker-compose.yml`, stale SHA `8818ae5`) before the first gated deploy | C.W1 (`DEPLOY-RECONCILE.md §3.3`) | **DEFERRED-LOAD-BEARING (host)** [1] | The Stratum-A deploy-hook's dirty-tree clause surfaces it loud; the host tree must be reconciled or the `$PREV` baseline is unreproducible. | **NEW D wave (α-host) — precondition of item 1.** Reconcile the host tree (the modified compose files may be the very TLS work of item 2) before the first gated deploy. In-scope now. |

**Total enumerated items: 27.**

## §2 — Chronic-risk callouts (items deferred ≥ 2 tranches — at risk of becoming permanent)

**Eleven items** meet the ≥ 2-gate chronic bar. The directive wants these surfaced prominently. Grouped by hazard:

### The host-coupled chronics (3-gate, now finally dischargeable)

1. **Shared `/opt/deploy/dispatch.sh` rewrite + fourier-hook registration** (item 1) — **CHRONIC-LOAD-BEARING, 3+ gates** (A.§9 → B.§7 → C.W1). C landed the Stratum-A `deploy-hook.sh` but the host wiring was provably out-of-reach (no SSH). **The hazard that defined it — out-of-repo-reach — is now removed.** D MUST perform the wiring + capture the deploy-chain transcripts. See §3.1.

2. **Prod MongoDB TLS cutover** (item 2) — **CHRONIC-LOAD-BEARING, 3+ gates** (A.§9 → B.§7 → C.W2). **The most acute chronic**: prod is genuinely insecure — `docker-compose.prod.yml:8,53,58` STILL carry all three `tlsAllowInvalid*` escapes (empirically verified §0.2). The invariant-19 gate ("no `tlsAllowInvalidCertificates` in prod.yml") has been UNMET across three tranches. D MUST run `gen-mongo-certs.sh` on the host, apply the verbatim §9 diff, and prove the live ping. See §3.2.

3. **Prod image-blob migration RUN** (item 3) — **CHRONIC-LOAD-BEARING, 3+ gates** (A.§9 → B.§6 → C.W5). The code is proven; the prod data run is the unexecuted host act. D MUST run + verify it against live data. See §3.3.

### The conformance-strike chronics (struck across ≥ 2 matrices)

4. **C4.5 / C4.6 visibility-transition guard** (item 6) — **CHRONIC-LOAD-BEARING, 2 strikes** (struck at B.W4 AND C.W4). This is a *real backend correctness gap* (the router `$set`s visibility unconditionally; `visibility_illegal_transition` exists but is dead code), routed "to a backend wave" twice without one materialising. D is the natural backend-CRUD home — **fold it, or it risks a third indefinite strike.**

5. **The 6 §U conformance strikes** (item 7) — **CHRONIC-RESIDUAL, 2 gates**. These are "never-built-by-design" (KISS), struck honestly twice. Not a debt — revive only if the symbol is built. Surfaced for completeness; the recommend is WONTFIX-revive-if-built.

### The colour-lift chronics (the headline orphaning hazard)

6. **HEADLINE — the colour-domain lift** (`sampleToSVGPath` consume, item 8) — **CHRONIC-RESIDUAL, 3 gates** (A.W2.b → B.W4 orphan-verdict → C.W4-δ conditional-did-not-fire). **The item most at risk of permanent orphaning.** The blocker is structural and unchanged: value.js v0.10.0 still does not export `sampleToSVGPath`. The CA2 verdict holds — its true home is a **reopened value.js cohort**; D carries only the conditional consumer-half. The fourier-internal 2-dup `colors.ts` cleanup (item 8a) IS dischargeable in D with no cross-repo dependency — fold that half. Recommend: re-state the consume in D.§carries with a hard no-silent-orphan check; do NOT annex the domain model.

7. **The full `Palette` / `colorScale` domain model** (item 9) — **CHRONIC-RESIDUAL (latent), 3 gates**. Held latent every gate. Building it in fourier violates invariant 15; building it at all is "the library nobody calls." Correctly-placed latent affordance; NOT D unless a gradient/scale UI lands.

8. **value.js-side conformance rows** (item 10) — **CHRONIC-RESIDUAL (orphaned), 2+ gates**. Terminal-orphaned; not fourier's to land.

### The ergonomics / cosmetic / substrate chronics

9. **Backend `--reload` aborts compute** (item 5) — **CHRONIC-RESIDUAL, 2 gates** (A.W3.5 → C.W3). The *root fix* landed at C.W3 (watch-narrowing). The background-queue successor is fourier-D-trigger-gated. Likely DISCHARGED — verify the watch-narrowing closed both it and its migration-reload twin (`migrate_visualization.py:30`), then close unless the queue trigger fires.

10. **onnxruntime CPU-vendor warning flood** (item 14) — **CHRONIC-RESIDUAL, 2 gates** (A.W3.5 → C-not-folded). Cosmetic log noise; live at `ml.py:72,213`. WONTFIX-able indefinitely; fold into D.W0 only if a one-line suppression.

11. **`--scale-press*` + the A-emitted glass-ui carries** (items 17, 19) — **CHRONIC-RESIDUAL, 2–3 gates** (A.W0-challenge → A.W6 → B). Belongs to glass-ui's next surface tranche; CONSTELLATION discipline holds; neither C nor D should absorb. Also **cross-cohort infra** (item 23, 3+ gates) is chronic-load-bearing but constellation-wide, not fourier-D's beyond the fourier subset.

## §3 — Host residuals now in scope (the directive's CRUX) — RESIDUALS → D DELIVERABLES

The directive's central instruction: prod SSH is now available, so the four host-coupled residuals C named — which were out-of-repo-reach and therefore honestly held as "host-activation pending" — **are no longer residuals. They become D implementation deliverables.** State that plainly. C did not under-deliver: it landed and proved every repo-landable half (the Stratum-A spine) and named the host halves as runnable procedures rather than claim a green it had not earned (`C/FINAL.md §5,§6`). What changed is the *reach*, not the design. Each carries a recorded, runnable procedure ready to execute.

### §3.1 — The shared `/opt/deploy/dispatch.sh` rewrite + fourier-hook registration → D DELIVERABLE

Source procedure: `C/coordination/DEPLOY-RECONCILE.md §3` + the `§5.1` bad-commit verification design.

- **Register** the fourier `case` arm at `/opt/deploy/hooks.json` to invoke `scripts/deploy-hook.sh` (the arm exists but has never fired — the host checkout is on stale SHA `8818ae5`, `/opt/deploy/logs/` has zero fourier entries).
- **Reconcile the dirty host tree** (item 27) FIRST — `M` on both compose files, stale SHA — or the `$PREV` baseline is unreproducible.
- **Harden the shared dispatcher** (the four improvements `deploy-hook.sh` has that the live `dispatch.sh` lacks: `flock`, a real `:8100` health-gate, rebuild-on-rollback, dirty-tree-fail-loud) + the `0664` secret hardening (item 26) — these touch 4 sibling repos, so this is constellation-level coordination, executed deliberately.
- **Capture** the G10 deploy-chain transcript + the G11 intentional-bad-commit rollback transcript (the recipe is fully recorded at `DEPLOY-RECONCILE.md §5.1`) — these were "host-activation pending" gates; D activates them.

### §3.2 — The prod MongoDB TLS cutover → D DELIVERABLE

Source procedure: `C/infra/tls.md §9` (the verbatim, ready-to-apply diff) + `§4` (the provisioning run).

- **Run** `bash scripts/gen-mongo-certs.sh` on the host from `/var/www/fourier-analysis` (CA `CN=fourier-internal-ca` reused if present; leaf with all four SANs: `mongo`, `localhost`, `127.0.0.1`, `mbabb.fridayinstitute.net`). Confirm the §4 Gp SAN dump.
- **Apply** Edit 1 (backend `MONGO_URI` `tlsAllowInvalidCertificates=true` → `tlsCAFile=/etc/ssl/mongo-ca.pem` + the read-only CA mount), Edit 2 (drop `--tlsAllowConnectionsWithoutCertificates` from the mongod command), Edit 3 (healthcheck `--tlsAllowInvalidCertificates` → `--tlsCAFile`). **The spine is provision-then-flags; inversion forbidden** — never drop the flags before a SAN-correct cert sits at `./ssl/mongo.pem`, or the next connection breaks.
- **Verify** (Gf) — a live `db.runCommand('ping')` with `tlsCAFile` and NO invalid-cert flag must succeed; capture the transcript.
- **Post-apply gate**: `git grep -nE 'tlsAllowInvalid|tlsAllowConnectionsWithoutCertificates' docker-compose.prod.yml` → zero (currently THREE — §0.2). This is the invariant-19 close gate, UNMET across A/B/C.
- `api/services/database.py` is a binding **do-not-touch** (TLS rides in the URI; `tz_aware=True` preserved).

### §3.3 — The prod image-blob migration RUN → D DELIVERABLE

Source procedure: `C/infra/blob-backend-dr.md` + `api/scripts/migrate_image_blobs.py` (proven dry-run + harness).

- **Pre-create** the external volume: `docker volume create image_blobs` (the `external: true` guard means compose will not create it).
- **Run** `python -m api.scripts.migrate_image_blobs` against prod data; prove count-parity (`images_before == relocated + skipped`), the 10-row byte-identity spot-check, and the `blob` XOR `storage_uri` post-condition on LIVE data (proven only on transient Mongo at C.W5).
- **Pair with the DR mechanism** (item 24): post-cutover the files are the sole copy — D should land the consistent-snapshot mechanism `blob-backend-dr.md` specifies (snapshot `mongo_data` + `image_blobs` together, writes quiesced).

### §3.4 — The precepts-submodule promotion → D DELIVERABLE

Source: `C/infra/tls.md` placement note + `blob-backend-dr.md` placement note + `DEPLOY-RECONCILE.md §4` (the staged `deploy.md` content).

- **Land** `docs/tranches/C/infra/tls.md` → `docs/precepts/infra/tls.md`, `blob-backend-dr.md` → `docs/precepts/infra/blob-backend-dr.md`, and the staged `deploy.md` content → `docs/precepts/infra/deploy.md` **inside the `precepts.git` submodule**; bump the fourier gitlink; dual-cite both repos.
- This is an outward-facing shared-repo act (the content is staged in-tree and reachable now). Was "carried as host-ops alongside §3" at C; with prod SSH + submodule push reach, it is a D infra-close step.

**These four (plus the secret-hardening item 26, the dirty-tree reconcile item 27, and the DR mechanism item 24, which attach to them) are no longer residuals. They are the spine of D's host-integration thread.** Every one carries a recorded, runnable procedure; D's job is execution + transcript capture, not re-design.

## §4 — D-fold recommendation (proposed wave threads)

D does not yet have a stub. The directive ("fold in EVERY deferred item") requires D to absorb the C host residuals (now in-reach) plus the one chronic backend gap C struck twice. Grouped into proposed threads:

**Thread α-host — the deploy + TLS + secret integration (NEW, the directive's core):**
- Items 1, 2, 4, 26, 27. The shared-dispatcher wiring + fourier-hook registration; the prod TLS cutover; the precepts-submodule promotion; the `0664` hardening; the dirty-tree reconcile. All procedures recorded at `C/coordination/DEPLOY-RECONCILE.md` + `C/infra/tls.md`. D executes + captures transcripts. **This thread discharges 3 of the 11 chronics.**

**Thread β-host — the storage migration RUN + DR (NEW):**
- Items 3, 24. Run the prod image-blob migration; prove on live data; land the consistent-snapshot DR mechanism. Sequenced after α-host (the migration ships through the activated pipeline + honours verified TLS).

**Thread γ — the backend visibility-transition guard (NEW, the twice-struck chronic):**
- Item 6. Implement the `visibility_illegal_transition` guard in `update_visualization` (the helper already exists, unused); fill the two struck conformance rows (C4.5 / C4.6). The natural backend-CRUD home; folding it discharges the directive's "chronically deferred" clause for the correctness axis.

**Thread δ — the colour-lift consumer half + dup cleanup (CONDITIONAL + a fourier-internal half):**
- Item 8a (the 2 `colors.ts` dups → a D web sub-task, unconditional, no cross-repo dep). Item 8b (the `sampleToSVGPath` consume → fires ONLY if value.js republishes during D's window; else re-state with a no-silent-orphan check). Item 9/10 NOT folded (latent / orphaned).

**Thread ε — confirm-and-close (already-discharged, no D work beyond verification):**
- Items 5 (`--reload` root-fixed at C.W3 — confirm the migration-reload twin is moot), 12 (`FlaggedListResponse` deleted at C.W4), 21 (levels-derivation at B invariant 19), 22 (ruff F841 at B.W3.b). Record in D.W0 as "discharged upstream, no D action."
- Item 14 (onnxruntime) → fold into D.W0 ONLY if a one-line suppression; else WONTFIX.

## §5 — Items that should NOT go in D (with the correct successor named)

| Item | Why not D | Correct successor |
|---|---|---|
| 8b — colour-lift DOMAIN consume (the cross-repo half) | The lift's premise is library-relocation; D carries only the consumer half, contingent on a value.js publish. Annexing the domain model violates invariant 15. | **value.js reopened cohort** (forward-themed I or a dedicated value.js tranche). D consumer-half only, contingent. |
| 9 — `Palette` / `colorScale` domain model | "Library nobody calls" + invariant 15; fourier has no gradient/scale consumer. | **value.js (when a real fourier consumer lands).** |
| 10 — value.js-side conformance rows | Orphaned cohort half; not fourier's to land. | **value.js reopened cohort — DEFERRED.** |
| 11 — slug-words precepts-submodule relocation | Invariant-16 "extract on second consumer"; only 1 consumer today. Premature. | **precepts-submodule extraction on value.js re-engagement.** |
| 13 — e2e axe-keystone settle-wait | Harness present; only a timing constant; web-local, not host/infra. | **minor e2e-timing tuning** (fold opportunistically if D touches e2e). |
| 15, 16 — rate-limiter Option B / multi-replica | Option A deliberate; triggers only on a real multi-replica need. C.§7 names the deferral-out. | **fourier-D ONLY IF the multi-replica trigger fires** (else held). |
| 17, 18, 19, 20 — glass-ui substrate carries | glass-ui substrate fixes, not fourier-side forks; CONSTELLATION discipline holds. | **glass-ui next surface tranche.** |
| 23 — cross-cohort infra (floridify, ncdpi, sudoku/speedtest) | Constellation-wide; D owns only the fourier subset (discharged by §3). | **constellation-wide infra effort** (not fourier-authored). |
| 25 — managed-S3 cost concern | Filesystem held (invariant 12); no S3 selected. | **revisit on a storage re-survey** (not triggered). |

---

### Quantitative summary

- **Total items enumerated**: **27**.
- **CHRONIC (≥ 2-gate)**: **11** — items 1, 2, 3 (CHRONIC-LOAD-BEARING host, 3+ gates), 6 (CHRONIC-LOAD-BEARING, 2 strikes), 7 (CHRONIC-RESIDUAL, 2), 8 (CHRONIC-RESIDUAL, 3 — the headline), 9 (CHRONIC-RESIDUAL latent, 3), 10 (CHRONIC-RESIDUAL orphaned, 2+), 5 (CHRONIC-RESIDUAL, 2 — likely discharged), 14 (CHRONIC-RESIDUAL, 2), 17/19/23 (CHRONIC-RESIDUAL/-LOAD-BEARING glass-ui + constellation, 2–3+).
- **Host-residuals-now-deliverables** (the directive's CRUX): **items 1 (dispatcher wiring), 2 (prod TLS cutover), 3 (blob migration run), 4 (precepts-submodule promotion)** — plus the attached 26 (`0664` hardening), 27 (dirty-tree reconcile), 24 (DR snapshot mechanism). All move from out-of-reach-residual to D implementation deliverable now that prod SSH is available. Empirical check confirms prod TLS is genuinely UNMET (`docker-compose.prod.yml:8,53,58` still carry all three `tlsAllowInvalid*` flags).
- **NEW D folds**: thread α-host (1, 2, 4, 26, 27); thread β-host (3, 24); thread γ backend guard (6); thread δ dup-cleanup (8a) + conditional consume (8b).
- **Already-discharged, confirm-and-close**: items 5, 12, 21, 22 (root-fixed at B/C); item 14 opportunistic.
- **Must NOT go in D**: items 8b-domain, 9, 10, 11, 13, 15, 16, 17, 18, 19, 20, 23, 25 — successors named in §5.
- **At greatest orphaning risk**: item 8 (the colour-domain lift) — true home is a reopened value.js cohort; D carries only the conditional consumer-half + the fourier-internal dup cleanup, with a hard no-silent-orphan check.
