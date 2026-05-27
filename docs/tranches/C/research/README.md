# C.Wα — research wave index

**Wave**: Wα (research; 4 parallel lanes). **Authored**: 2026-05-27. **Gate**: this index is the Wα close artefact — it reconciles the four lanes into a single decision surface and opens Wχ (the challenge wave). Every verdict here measures against `../W0-baseline.md` (the binding baseline); no source was touched (Phase 0 discipline, `C.md §4`).

## The four lanes

| Lane | Thread | Artefacts | Verdict (one line) |
|---|---|---|---|
| **R1 — storage backend** | β | `R1-storage-backend.md` (survey) + `R-storage-spec.md` (contract) | **filesystem + nginx, app-served**; atomic per-doc cutover **YES** → brittleness window **REMOVED** |
| **R2 — webhook CI/CD** | α | `R2-cicd.md` (survey) + `R-deploy-spec.md` (contract) | **`adnanh/webhook`** (host binary, no container); HMAC-SHA256; health-gated self-reverting rollback; `deploy.sh` deleted |
| **R3 — MongoDB TLS** | α | `R3-tls.md` (audit) + `R-tls-spec.md` (contract) | **server-only TLS + SCRAM**; cert provenance **unknown** → re-provision under a recorded self-signed internal CA; 3 sites + 1 latent removed |
| **R4 — janitor + `--reload`** | α | `R4-janitor-reload.md` | 11 audit rows on the **existing** `admin_audit` shape; idempotent recovery; `--reload` fix = drop `--reload-dir src` (one-token root fix) |

## Verdicts that bind the implementation waves

### R1 → W5 (storage, thread β)
- **Backend**: filesystem + nginx, **app-served** variant (`FileResponse` through FastAPI). The nginx-direct variant is **rejected/deferred** — the prod `nginx:alpine` container shares no volume with `backend` (`prod.yml:73-74`) and direct-serve would surrender the `last_accessed_at` retention touch (`dependencies.py:54` → `janitor.py:99-102`). This is R1's genuine refinement over `CA5`'s bare "nginx static serve."
- **Atomic cutover confirmed**: per-doc `write file → update_one($set storage_uri, $unset blob)` holds `blob` XOR `storage_uri` document-by-document. **The §8 brittleness window is removed** (Wχ-P3 must confirm the atomicity claim survives adversarial probing).
- **The load-bearing risk**: the deletion-proof commit must drop *both* the inline `blob` write (`image_storage.py:104`) **and** the `blob`-reading branch of the `image_bytes` shim in the **same commit** — a surviving read branch becomes the dual-read legacy layer invariant 3 forbids. The atomicity proof is what makes the deletion safe.
- **Two blobs**: primary (`storage_uri`) + thumbnail (`thumbnail_uri`, nullable). Invariant 18 binds both.

### R2 → W1 (CI/CD, thread α)
- **Receiver**: `adnanh/webhook` — single static Go binary, systemd-supervised, loopback `:9000`, fronted by the host's **outer** reverse proxy (outside this repo's compose). **Zero new containers** (the receiver must outlive the stack it restarts). Pre-decided by `project_infra_plan.md:12`.
- **Auth**: HMAC-SHA256 over the GitHub `push` payload (`X-Hub-Signature-256`), constant-time verified against a host-only secret in `/etc/webhook/hooks.json` (`0600`, un-tracked). Invariant-19 clean; strictly dominates a static deploy token.
- **Rollback**: capture `PREV` → `reset --hard origin/master` → rebuild → **gate on `:8100/api/health`** → on failure `reset --hard $PREV` + rebuild + re-gate. The deploy logic lives in a **tracked** `scripts/deploy-hook.sh`; only the secret-bearing `hooks.json` is un-tracked.
- **`deploy.sh` fully replaced** — the only surviving manual act is `git push` (the intended trigger, not a remnant). No named residual.
- **The load-bearing risk**: the receiver + `hooks.json` + `webhook.service` are **host artefacts outside the repo**. W1 must document where they live (`docs/precepts/infra/`) and capture a real commit-to-deploy + bad-commit-revert transcript — "webhook configured" without the transcript is an invalid gate (`C.md §6`).

### R3 → W2 (TLS, thread α)
- **Posture**: server-only TLS + SCRAM-SHA-256 (no client cert). KISS — the `--tlsAllowConnectionsWithoutCertificates` flag (`:48`) is **inert** under SCRAM-only auth (no x509), so deletion is honest; the real threat (client trusting a forged server cert) is closed by `tlsCAFile` validation alone. Mutual TLS would double the cert surface for zero gain on a single operator.
- **Cert provenance is unknowable from the tree** (`ssl/` gitignored at `.gitignore:79`; no generation script anywhere). **W2 must re-provision** under a documented self-signed internal CA (`CN=fourier-internal-ca`) — the existing undocumented certs cannot satisfy the invariant-19 issuer-recording gate; a recorded re-issue can.
- **The SAN footgun**: the leaf must carry SANs for `mongo`, `localhost`, `127.0.0.1`, `mbabb.fridayinstitute.net` — default verification fails without them. (R3 also caught a host-spelling drift: `.env.example:21` says `friday.institute`, `deploy.sh:6` says `fridayinstitute.net` — reconcile to the live value.)
- **3 sites removed** (`prod.yml:8,48,53`) **+ 1 latent** (`.env.example:21`). `database.py` is **unchanged** for TLS (`tlsCAFile` rides in the URI; `tz_aware=True` preserved). Dev-local mongo stays plaintext-on-bridge as a **named, justified residual**.
- **The W2 pre-condition**: the §2 cert-provisioning step must run *before* the flag removal, or the connection breaks. W2 is provisioning-then-flags, in that order.

### R4 → W3 (janitor + `--reload`, thread α)
- **Audit rows**: 11 destructive ops (the 9 `delete_many` at `janitor.py:73,113,139,147,155,163,168,265,273` + the `:127` cascade-soft-delete + the `:95`→`pinned_cron.py:45` contour prune) each emit one row into the **existing** `admin_audit` collection — mapped onto its current 4-field shape (`action="janitor:<sweep>"`, `target="count={n}, cutoff={iso}"`, `timestamp`, `ip_hash="system:janitor"`), **no schema bloat**. Gated on `count ≥ 1`. Helpers stay side-effect-free; rows emit from the orchestrating cycle.
- **Recovery**: idempotent under arbitrary mid-sweep death — every deletion is a `delete_many` over a live-state predicate (no checkpoint cursor), so re-runs converge; rows never double-count; the only failure mode is one *lost* (never duplicated) row — fail-safe under-counting. The stale-user cascade self-heals via `stale_slugs` re-derivation; no saga warranted.
- **`--reload` fix = (a)**: drop `--reload-dir src` at `dev.sh:76`, narrow the dev `Dockerfile:16` to `--reload --reload-dir api`. Root cause: `computation.py:44` runs `src/` numerics in-process via `asyncio.to_thread`; a `src/` write fires watchfiles → worker kill → compute-thread death. Prod confirmed unaffected (`Dockerfile:24-25` has no `--reload`). The background queue (process-isolation / job queue) is **rejected per-line** and **deferred to a fourier-D** with an explicit trigger (compute outliving a request).

## Cross-lane reconciliation (no conflicts; three shared touch-points)

1. **`docs/precepts/infra/` is created by W2** (R3 §4 — it is a git submodule, `infra/` does not yet exist). R2 also records its host-artefact locations there. **W2 creates the dir; W1 and W2 both write into it** — no conflict (different files: `tls.md` vs the deploy-artefact note). Sequencing: W1 precedes W2 (`C.md §3`), so W1 may need to create the dir if it writes first; the harden step assigns dir-creation to whichever lands first. **Resolved at Wχ harden**: assign `docs/precepts/infra/` creation to W1 (it lands first), W2 adds `tls.md`.
2. **Port 8100** is the single source of truth across R2 (health gate) and the baseline §1.4. No renumber — ratification only. The `:8091` bug dies with `deploy.sh` (W1).
3. **`database.py` is touched by no lane** — R3 explicitly keeps TLS in the URI; R4's `--reload` fix is in `dev.sh`/`Dockerfile`; W5's storage work touches `image_storage.py`/`images.py`. The `tz_aware=True` B.W3 fix is preserved by every lane that names `database.py`.

## What Wα did NOT decide (open for Wχ)
- Whether filesystem's atomic-cutover claim survives adversarial probing (**Wχ-P3**).
- Whether `adnanh/webhook` is truly the smallest mechanism and truly replaces `deploy.sh` incl. failure modes (**Wχ-P1, P2**).
- Whether thread γ's discharge (W4) removes the legacy `snapshot_hash` name at the ROOT vs behind a new cast (**Wχ-P4**) — note: thread γ (W4) is a *direct* lane and was not a Wα research subject, but Wχ-P4 still guards it.

## Gate status
✅ Four lanes landed (7 artefacts, 1,487 L). ✅ Verdicts reconciled, no cross-lane conflict. ✅ No source touched. **⇒ Wχ opens** (P1 storage-smallest-mechanism · P2 CI/CD-replaces-deploy.sh · P3 cutover-atomic-or-window-honest · P4 γ-removes-legacy-name-at-root).
