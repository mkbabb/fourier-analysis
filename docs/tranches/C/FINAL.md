# C — Final disposition

**Status**: CLOSED 2026-05-27. **Tranche**: C — fourier infrastructure hardening, image-blob storage architecture, and B-residual discharge. **Predecessor**: fourier-B (`docs/tranches/B/FINAL.md`, `fc5b3b0`). **Mode**: research-first for storage (β); direct for infra (α) and residual-discharge (γ). Executed W0 → Wα → Wχ(+harden) → W3 ∥ W4 → W1 ∥ W5 → W2 → W6.

## §0 — Goal criterion and completion criterion (paired)

**Goal criterion (the aim).** Land four threads honestly: **α** retire the manual SSH-push deploy + the unfaithful prod MongoDB TLS posture + the operational-maturity gaps (janitor audit trail, the dev `--reload`-aborts-compute interruption); **β** relocate image + thumbnail blobs out of inline-Mongo into a bounded, observable, reclaimable backend; **γ** complete the slug-identity convergence the B landing left stranded at the API boundary (the one precept violation the C-development audit found); **δ** conditionally consume the narrow value.js colour lift iff published. All to the degree warranted by KISS (invariant 12) — no new container, no horizontal scaling, no library nobody calls.

**Completion criterion (the evidence).** The close holds when:

- (a) **γ — the precept violation is discharged at the ROOT.** `git grep -nE "snapshot_hash|snapshotHash" web/src` → zero on identity paths; the `as unknown as` cast removed; `FlaggedListResponse` deleted; `vue-tsc -b --force` green WITH the cast removed (the T1 keystone). **Met** — W4 `f91a656`.
- (b) **β — the inline-blob write is gone and the footprint is reclaimable.** `grep 'Binary(content)' api/services/image_storage.py` → zero; the `image_bytes` blob-read branch deleted (no dual-read); the janitor unlinks relocated files (invariant 18 delete-coupling); migration count-parity + byte-identity spot-check proven. **Met** — W5 `817cfcc`.
- (c) **α — the manual deploy is retired and TLS made honest, to the repo boundary.** `scripts/deploy.sh` does not exist; the tracked `deploy-hook.sh` carries flock + a real `:8100` gate + rebuild-on-rollback; the scoped `[:/]8091` grep → zero; the janitor emits an `admin_audit` row per destructive op; the `--reload-dir src` watch dropped; the verified-TLS provisioning tool + precept landed. **Met (repo-local)** — W1 `49cb714`, W3 `e6a6b95`, W2 `4905682`; the host-coupled remainders are named residuals (§6).
- (d) **δ — the colour-consume disposition is recorded.** value.js v0.10.0 does not export `sampleToSVGPath`; the consume is a **named residual**; `easings.ts` + the value.js pin are byte-identical to HEAD. **Met (named residual)** — W4.
- (e) the 14 conformance skeletons are FILLED honestly (49 real assertions, zero `test_placeholder`); the matrix cites only methods + files that exist (the §U phantom-path discharged). **Met** — W4 `f91a656`, W6 `27c883b`.
- (f) `uv run pytest` green; `vue-tsc -b --force` green; `npm run build` exit 0. **Met** — §8.

Both criteria hold. The close is **clean against the repo-landable aim** and **`complete_with_host_residuals`** against the full operational aim — every host-coupled remainder (the shared-dispatcher wiring, the prod cert provisioning, the prod migration run, the precepts-submodule promotion) carries a named, runnable successor (§6). No miss is silent.

## §1 — Thesis recap

A retired fourier's stylistic drift; B converged the identity model on the backend. C lands what survives: three *architectural* surface drifts A catalogued and B did not address (the manual deploy, the unfaithful prod TLS, the inline image blobs) and one *convergence residual* B's own execution left (the frontend half of the slug-identity model, masked by an `as unknown as` cast). The C-development audit (6 lanes) found the colour lift much narrower than feared — `colors.ts` has zero domain symbols — so δ collapsed to a single conditional function consume, and the cross-repo edge inverted (value.js publishes, fourier consumes). The trap the threads each named — over-engineering (a webhook framework, mutual TLS, GridFS/MinIO/S3, a `Palette` library nobody calls) — was rejected per-line and adversarially certified clear at Wχ.

## §2 — Wave-by-wave commit ledger

| Wave | Title | Thread | Commits |
|---|---|---|---|
| W0 | open · baseline · research dispatch | — | `fce1808` |
| Wα | research wave (4 lanes → binding contracts) | β/α | `8b111a8` |
| Wχ | challenge wave (4 probes) + harden | — | `f2b9b1a` + `45684e7` |
| W3 | janitor audit-log + recovery + `--reload` fix | α | `e6a6b95` |
| W4 | slug-identity completeness + B-residual discharge | γ (+δ) | `f91a656` |
| W1 | webhook deploy-hook + `deploy.sh` retirement | α | `49cb714` |
| W5 | image-blob migration (filesystem, deletion-proof cutover) | β | `817cfcc` |
| W2 | MongoDB verified-TLS (Stratum A; B host-gated) | α | `4905682` |
| W6 | close (§U reconcile + this disposition) | — | `27c883b` + this commit |

9 execution commits atop the C-development authoring close (`9003cba`) + two intra-tranche close-record commits (`95601d4`, `ba697eb`).

## §3 — Cumulative metrics

- **γ slug-identity**: `snapshot_hash`/`snapshotHash` 44 sites → 0 on identity paths (renamed to `slug`/`owner_slug` matching the backend wire — no alias, no cast); `FlaggedListResponse` reshaped to the cursor envelope + deleted; two dead-duplicate functions (`listFlaggedEntries`, `dismissFlags`) removed.
- **β storage**: filesystem app-served backend; primary + thumbnail relocate atomically per-doc (`write file → $set storage_uri/$unset blob`); the inline `Binary(content)` write deleted; the dedup-hit runtime bug (C9 — `KeyError` swallowed by a broad `except`) fixed + regression-tested; the janitor delete-coupled (C1) so the footprint stays reclaimable.
- **α infra**: `deploy.sh` deleted; `deploy-hook.sh` with the four improvements the live dispatcher lacks; janitor emits 11 `admin_audit` rows on the existing shape (no schema bloat); the `--reload` compute-abort fixed with a one-token watch-narrowing; the verified-TLS provisioning tool + `CN=fourier-internal-ca` issuer recorded.
- **Tests**: 129 api specs pass (83 honest `@requires_mongo` skips); the W5 migration harness + the C9 dedup regression proven against a transient Mongo (212 passed); all 14 conformance skeletons FILLED (49 assertions); the §U matrix reconciled (23 re-pointed, 6 struck honestly).
- **KISS rejections that HELD**: GridFS/MinIO/S3 (β); a webhook framework + new container + registry (α); mutual TLS + ACME (α); the `Palette`/`colorScale` library (δ); a background queue for `--reload` (→ fourier-D); a dual-read storage compatibility layer (β).

## §4 — Hard-gate evidence (C.md §6)

- `scripts/deploy.sh` does not exist (`git rm`, deletion proof); `git grep -nE '[:/]8091' -- ':!docs/*' ':!*.lock' ':!**/*.json'` → zero (the honest scoped grep — `8091` survives only as incidental substrings in `uv.lock`/JSON assets).
- Invariant 20: G1 (`snapshot_hash`/`snapshotHash` → 0 identity), G2 (`as unknown as` → 0), G5 (`FlaggedListResponse` → 0), T1 (`vue-tsc -b --force` green with the cast removed). All green.
- All 14 `api/tests/conformance/*.py` implemented (zero `test_placeholder`); the matrix cites only existing methods + files (the conformance method-mismatch + the 6 phantom conformance files + the §U phantom-path tree all discharged).
- `grep 'Binary(content)' api/services/image_storage.py` → zero; the migration count-parity (`images_before == relocated + skipped`) + the 10-row byte-identity spot-check + the `blob` XOR `storage_uri` post-condition proven; the janitor-unlink delete-then-assert-file-gone test green (invariant 18 delete-coupling).
- Janitor audit-log: 11 destructive ops each emit a `janitor:<sweep>` `admin_audit` row, gated on `count ≥ 1`; `test_janitor_audit.py` green. The `--reload-dir src` watch dropped (`dev.sh:76` + `api/Dockerfile:16`); prod CMD byte-identical.
- Verified-TLS: `scripts/gen-mongo-certs.sh` proven (CA + leaf with all four SANs, chains + verifies); the issuer `CN=fourier-internal-ca` recorded in `docs/tranches/C/infra/tls.md` (the invariant-19 close-gate evidence).
- `uv run pytest` green (129 passed / 83 skipped / 0 failed); `vue-tsc -b --force` exit 0; `npm run build` exit 0 (§8).

## §5 — Scope-reveals, challenge catches, and the host-coupling honesty

- **All four Wχ probes found real load-bearing flaws** the research missed — the discipline working: **P1** the janitor image-delete orphaned the relocated files (the storage move would have *defeated* invariant 18) → the C1 delete-coupling clause; **P2** a live multi-repo `/opt/deploy/` dispatcher already exists and contradicts the greenfield spec → W1 reconciles, not imposes; **P3** the dedup-hit path silently regresses on a migrated doc (a runtime `KeyError` swallowed by a broad `except`, zero coverage) → the C9 fix + test; **P4** invariant 20's two greps were insufficient (three cheats pass) → the strengthened G3–G6 + T1 keystone.
- **Three facts the baseline corrected against the C-development audit**: prod compose already uses `${MONGO_PASSWORD:?}` (no committed plaintext — W1 secret work was a refinement); prod is already on port 8100 (W2 port work was ratification, not a renumber); the conformance count is 14, not 15.
- **The harden surfaced still more precision, all folded**: the dev `api/Dockerfile:16` `app`=UID 1000 (prod-stage; feeds W5's C2 volume-ownership); a second dead-duplicate `dismissFlags`; six phantom files in the conformance matrix.
- **The host-coupling was handled by an honest two-strata split** (W1 + W2): everything safely landable from the repo is landed and proven; the outward-facing host acts (the shared-dispatcher rewrite touching four sibling repos; the prod TLS cert provisioning; the prod migration run; the precepts-submodule push) are specified with runnable procedures and named as residuals — never claimed proven-when-not. The "provisioning-then-flags spine (inversion forbidden)" kept `docker-compose.prod.yml` deliberately untouched, since removing the TLS escapes before the host holds a SAN-correct cert would break the next prod deploy.

## §6 — Carries (named successors)

- **The shared `/opt/deploy/dispatch.sh` rewrite + the fourier-hook registration** (touches 4 sibling repos) → a host-ops / constellation-level step. Recorded in `coordination/DEPLOY-RECONCILE.md`; the deploy-chain + bad-commit-revert transcripts are the W1 host-activation gate, runnable per the recorded design.
- **The prod MongoDB TLS cutover** (run `scripts/gen-mongo-certs.sh` on the host → apply the `docs/tranches/C/infra/tls.md §9` 3-site compose diff → deploy → live ping) → a coordinated host-ops step. The invariant-19 "no `tlsAllowInvalidCertificates` in prod.yml" gate is met only after it; prod.yml is not yet clean and is not claimed to be.
- **The prod image-blob migration run** (`python -m api.scripts.migrate_image_blobs`) → a host op against prod data; the code + dry-run + harness + count-parity are proven here.
- **The precepts-submodule promotion** of `docs/tranches/C/infra/{tls.md, blob-backend-dr.md}` + the `deploy.md` content staged in `DEPLOY-RECONCILE.md` → `docs/precepts/infra/` (a separate shared repo push; the content is staged in-tree and reachable now).
- **The `--reload` background-queue** → fourier-D (explicit trigger: compute outliving a request); (a)/(b) rejected per-line, the one-token watch-narrowing is the root fix.
- **The full `Palette`/`colorScale` colour-domain model** → a value.js tranche + a fourier successor consumer (held latent — fourier has no gradient/scale consumer; building it is the "library nobody calls" anti-pattern and would violate invariant 15).
- **The δ `sampleToSVGPath` consume** → a fourier successor, fired iff a value.js tranche publishes it (the inverted edge; value.js-side user-re-mandate-gated). `coordination/COLOUR-LIFT.md` records the ask.
- **Multi-replica fourier deployment** → a fourier-D if ever needed (invariant 19 single-replica preserved).
- **C4.5/C4.6 visibility-transition guard** (the backend `$set`s visibility unconditionally; the `visibility_illegal_transition` helper is unused) → struck honestly from the conformance matrix at W4; a successor wave if the guard is wanted.

## §7 — Constellation final state

fourier-A/B/C are **CLOSED** (`c7cfd82`, `fc5b3b0`, this commit). value.js is at tranche **H close (v0.10.0, `16129e0`)**; **I is seeded with an OPEN thesis** carrying no colour reference. The only live cross-repo edge is the **inverted, conditional δ**: `value.js-<tranche> publishes sampleToSVGPath → fourier-C-successor consumes` — latent, user-re-mandate-gated on the value.js side, blocking no fourier wave. `CANONICAL-ORDERING.md` is reconciled to **ordering δ** (post-C-close).

## §8 — Tranche close evidence

- `uv run pytest api/tests/` — **129 passed, 83 skipped (honest `@requires_mongo`), 0 failed**; the W5 migration harness + C9 dedup regression prove green against a transient Mongo (212 passed).
- `cd web && npx vue-tsc -b --force` — exit 0 (the T1 keystone: green WITH the `as unknown as` cast removed = a genuine type reshape, not a mask).
- `cd web && npm run build` — exit 0 (built in ~2.3 s).
- Invariant-20 greps (G1/G2/G5) → zero; the `Binary(content)` deletion-proof grep → zero; the scoped `[:/]8091` grep → zero.
- Brittleness window §8: **STRUCK** at Wχ close — the filesystem cutover is atomic per-document (single standalone `mongod`, fresh `find_one`, no app cache ⇒ `blob` XOR `storage_uri` holds at every instant); `suspended_gates: []`; no dual-read layer; no restoration needed. Wχ-P3 adversarially confirmed it (conditioned on C9–C11, which W5 landed).

## §9 — Reflection

C is the tranche where the discipline earned its keep at the boundary between repo and world. The research-first lifecycle was not ceremony: Wα's four lanes produced binding contracts, and Wχ's four probes each found a flaw the research had missed — most consequentially that relocating the image blobs would have *defeated* the very invariant 18 it served, because the janitor deleted the document but never the bytes; and that a greenfield deploy spec, written in good faith, contradicted a live multi-repo dispatcher already running on the host and serving four sibling repos. The honest answer to that second discovery was not to impose the spec but to split every infra wave into what the repo can land and prove versus what only the host can do — and to name the latter as runnable residuals rather than claim a green that wasn't earned. The frontend slug-identity residual — the one precept violation the C-development audit surfaced, a slug value wearing a legacy name behind an `as unknown as` cast — was discharged at the root, and the proof is the keystone: `vue-tsc` compiles only because the type was genuinely reshaped, not re-masked. Four threads, sequenced so infra preceded the storage migration that depends on it; γ and the infra waves ran parallel on disjoint files; δ held as a named residual because the library it would consume does not yet exist. Nothing closed silent.
