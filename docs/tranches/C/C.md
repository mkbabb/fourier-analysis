# C — fourier infrastructure and image-blob storage architecture

**Tranche letter**: C — fourier-analysis's infrastructure-hardening and
image-blob storage-architecture tranche; successor to B (the
identity-and-CRUD convergence cohort).
**Predecessor close**: B — `docs/tranches/B/FINAL.md` (TBD); per the
orphan verdict at `B/coordination/CRUD-CONSTELLATION.md`, B closed
partially-discharged. C opens only after B closes.
**Cohort**: fourier-only. C is repo-local infrastructure and
storage-architecture work; no peer-tranche binding. If a cross-repo
concern surfaces in research, C reschedules around it rather than
absorbing it.
**Mode**: **research-first** for the storage architecture lane;
**direct** for the infra hygiene lane. The implementation waves below
are *provisional* and harden at challenge close.
**Open**: TBD (after B.W5 close).

## Goal criterion (tranche-level)

C exists to retire three architectural surface drifts that A merely
catalogued and B did not address: the manual SSH push that today
serves as the deploy pipeline (`scripts/deploy.sh`), the unfaithful
MongoDB TLS posture in production (`docker-compose.prod.yml:8`
`tlsAllowInvalidCertificates=true`), and the inline-blob storage
band-aid governed by `storage_budget_gb` eviction
(`api/services/image_storage.py:97` + `api/services/janitor.py:84-119`).
Success means the deploy pipeline is observable and webhook-driven, the
TLS posture is verified-certs end-to-end, and image blobs live in a
storage backend whose total footprint is enumerable by a single bounded
query — the storage-budget eviction retires by relocation, not by
re-introduction.

## Completion criterion (tranche-level)

Every wave below either lands its hard gates (deletion proofs;
end-to-end recorded deploy chain; verified-cert issuer in the precepts
infra page; bounded-query enumeration of the new storage backend;
migration count-parity artefact; per-stage test green) or names a
honest successor. The tranche-level hard-gate list in §6 is the
binding ledger; `PROGRESS.md` reconciles to reality; `FINAL.md` cites
every commit and gate.

## §1 — Thesis

fourier-analysis's deploy surface is held together by a manual SSH
push (`scripts/deploy.sh`), MongoDB credentials in cleartext on the
wire (`docker-compose.prod.yml:8` `tlsAllowInvalidCertificates=true`),
a host-bound prod gateway at port 8100 inside a private SSH-tunnel
deploy at port 1022, and image blobs that live inline in MongoDB
documents with an explicit storage-budget eviction band-aid
(`api/services/janitor.py:84-119`, `api/services/image_storage.py:97`).
A retired the surface drift; B converged the identity model and
retired the band-aid's pre-condition (the unbounded `$nin` janitor
pattern landed at B.W3 per `R-lifecycle-spec.md §4`). What survives —
the unfaithful TLS, the manual deploy, the inline blobs — is
*architectural*, not stylistic, and it is what C exists to land
honestly.

C is composed of two intentionally separable threads: the **infra
hygiene** thread (webhook CI/CD, MongoDB TLS, port standardization,
audit-traced janitor) is well-scoped engineering work that follows
`~/.claude/projects/-Users-mkbabb-Programming-fourier-analysis/memory/project_infra_plan.md`;
the **storage architecture** thread (image-blob relocation out of
Mongo) is open-design work whose verdict the research wave produces,
in the candidate set `R-lifecycle-spec.md §6.3` names (filesystem +
nginx > GridFS > MinIO > managed S3). The two threads share neither
files nor risk; they are sequenced so infra hardening precedes the
storage migration that depends on it. KISS — invariant 12 — is the
load-bearing constraint of both.

## §2 — Invariants

C inherits all 13 of tranche A's invariants (`docs/tranches/A/A.md §2`)
and all 4 of tranche B's CRUD-specific invariants 14–17
(`docs/tranches/B/B.md §2`) unchanged. It adds two storage-and-deploy
invariants:

18. **Storage location is bounded and observable** — image blobs (and
    any future bulk binary asset) live in a storage backend whose
    total footprint can be enumerated by a single bounded query, whose
    per-object retention is governed by the same
    `pinned`/`last_accessed_at` pattern `R-lifecycle-spec.md §4.2`
    ratified, and whose backend identity is recorded on the owning
    document (`storage_uri: str`). The `storage_budget_gb` eviction
    band-aid is retired by relocation, never by re-introduction.
19. **Production credentials are TLS-protected at rest, in transit,
    and in the deploy pipeline** — MongoDB connections in prod use TLS
    with verified certificates (no `tlsAllowInvalidCertificates`);
    secrets are not committed to compose files; deploy artefacts (the
    CI/CD pipeline, the webhook receiver) authenticate
    cryptographically rather than via shared bearer or SSH-key reuse.
    The single-replica deployment constraint
    (`docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md §5
    Option A`) is preserved as the chosen scale; C does not introduce
    horizontal scaling.

C opens with **one provisional brittleness window** declared at §9 for
the image-blob migration (W4). The infra hygiene waves close green;
the storage migration may require a dual-read window depending on the
backend the research wave selects (a filesystem-backed cutover can be
atomic; a managed-S3 backfill cannot).

## §3 — Wave schedule (provisional — hardened at challenge close)

| Wave | Title | Agents | Goal | Closes on (completion) | Status |
|---|---|---|---|---|---|
| W0 — *Tranche open, research dispatch, infra-baseline audit* | Open · research dispatch · infra-baseline audit | 1 | Confirm B is closed; dispatch the research lanes; snapshot the current infra posture so Wα has a baseline to measure against | predecessor B confirmed closed; storage-research lanes dispatched per `research/README.md`; infra-baseline snapshot (current deploy.sh path, current TLS posture, current port map) committed; brittleness window §9 ratified or removed | planned |
| Wα — *Research wave (storage architecture, CI/CD, TLS)* | Research wave — storage architecture | 3-4 parallel | Produce honest surveys for the three open design questions (storage backend, CI/CD framework, TLS posture) before any implementation wave commits | three deliverables under `research/`: **R1** storage-backend survey (filesystem+nginx, GridFS, MinIO, managed S3) with KISS-ordered verdict and migration shape per backend; **R2** webhook CI/CD survey (adnanh/webhook vs alternatives; auth model; rollback path); **R3** MongoDB TLS posture audit (cert provisioning, rotation, verification mode, prod ↔ dev parity). Optional **R4** janitor-audit-log spec if Wχ confirms the need. | planned |
| Wχ — *Challenge wave* | Challenge wave | 2-3 parallel | Adversarially review the research outputs so no over-engineered candidate slips through into implementation | `audit/challenge.md` ships **three probes**: **P1** — is the chosen storage backend the smallest honest mechanism, or did research over-engineer? (classify each candidate; reject any verdict that introduces a new container or external dependency without per-line justification). **P2** — does the webhook CI/CD design actually replace `scripts/deploy.sh`, including the failure modes (network partition, container build failure, rollback)? **P3** — is the brittleness window honest? (verify the chosen storage backend's migration is truly atomic or that the dual-read window has a named restoration commit). | planned |
| W1 — *Webhook CI/CD + secret extraction* | Infra hygiene — webhook CI/CD + secret extraction | 2 parallel | Retire the manual SSH push; secrets exit compose files into the pipeline's own secret store; end-to-end commit-to-deploy chain is recorded as evidence | webhook receiver deployed; `scripts/deploy.sh` retired (deletion proof, not commented out); secrets out of `docker-compose*.yml` (env-only); webhook end-to-end test: a commit to master triggers a deploy and the health check passes; rollback path verified by intentional bad commit | provisional |
| W2 — *MongoDB TLS + port standardization* | MongoDB TLS + port standardization | 2 parallel | Retire `tlsAllowInvalidCertificates` and pin the prod port map per `project_infra_plan.md`'s 10-port-block scheme | `tlsAllowInvalidCertificates` removed from `docker-compose.prod.yml:8`; verified certs in place (issuer recorded); prod port map ratified per `project_infra_plan.md` 10-port-block scheme (fourier 8100); dev `MONGO_URI` updated; `docs/precepts/infra/` page records the convention | provisional |
| W3 — *Janitor audit log + recovery hardening* | Janitor audit log + recovery hardening | 1 | The janitor acquires the audit trail A.W4 deferred and the recovery semantics a 6-hour loop without checkpointing lacks | every janitor `delete_many` writes an `admin_audit` row with category, count, cutoff; partial-failure recovery (a cron pass that dies mid-cycle) re-runs cleanly on the next wake; integration test asserts both | provisional |
| W4 — *Image-blob migration* | Image-blob migration — relocation to chosen backend | 2-3 parallel | Relocate inline blobs out of Mongo into the Wα-R1-chosen backend; retire `storage_budget_gb`; the new backend's storage-uri is recorded on each owning document | `image_storage.py:97` no longer writes `Binary(content)` to the doc (deletion proof); chosen backend stores blobs with `storage_uri` recorded on the `images` doc; migration script + verification harness per `R-lifecycle-spec.md §5.1` (count parity, spot-check, post-condition); `storage_budget_gb` config retired; `GET /api/images/{slug}/blob` serves from new backend | provisional |
| W5 — *Close* | Close | 1 | Reconcile, cite, restore brittleness window, name any residual debt | `PROGRESS.md` reconciled; `FINAL.md` cites every commit + gate; `coordination/CONSTELLATION.md` updated if any cross-repo concern surfaced; brittleness window §9 restored; any C-residual debt named with destination | provisional |

Hard ceiling 10 agents/wave; C peaks at 4. W0 → Wα → Wχ is strict
gate. W1 (CI/CD) precedes W2 (TLS) so that the TLS rollout itself
ships through the new pipeline. W3 (janitor) is independent of W1/W2
and may overlap. W4 (storage migration) depends on W1 (the migration
is dispatched through the new pipeline) and on the W2 TLS posture
(the new backend, if MinIO or managed-S3, must reach Mongo with the
same verified-TLS contract). The implementation waves W1–W5 are
provisional and re-synthesized into hardened `waves/W*.md` specs at
Wχ close.

## §4 — Phases

**Phase 0 — research and challenge (W0–Wχ).** The storage-backend
choice and the CI/CD shape are both open. Research lanes survey
honestly; challenge tests that nothing was overengineered. C does not
commit a single infra change before Wχ closes.

**Phase I — deploy honesty (W1–W2).** The manual deploy and the
unfaithful TLS are the two longest-standing surface drifts. They are
landed in dependency order: pipeline first (so the rollout itself is
observable), TLS second (so the rollout exercises the pipeline
immediately on a non-trivial change). Secrets exit compose files in
the same wave that lands the pipeline — the pipeline supplies them
through its own secret store.

**Phase II — operations maturity (W3).** The janitor acquires the
audit trail A.W4 deliberately deferred and the recovery semantics a
6-hour loop without checkpointing lacks. Small wave, single agent;
the substrate (audit log) already exists from A.W5's admin work.

**Phase III — storage relocation (W4).** With the pipeline operational,
TLS honest, and the janitor observable, the image-blob migration runs.
The chosen backend (per Wα-R1) supplies its own retention; the
inline-blob field deletes; the `storage_budget_gb` knob retires. The
brittleness window §9 governs whether dual-read is required during
the cutover.

**Phase IV — close (W5).**

## §5 — Critical files and ownership

The research wave refines this; the known scope at open:

| Surface | Files | Owning wave |
|---|---|---|
| Deploy pipeline | `scripts/deploy.sh` (retire), new webhook receiver config (path TBD by Wα-R2), `docker-compose*.yml` secret references | W1 |
| TLS + ports | `docker-compose.prod.yml`, `nginx/fourier.conf`, `.env.example`, dev `MONGO_URI` in `docker-compose.yml`, `docs/precepts/infra/` (create) | W2 |
| Janitor maturity | `api/services/janitor.py`, `api/routers/admin.py` (audit-log row), `api/tests/test_janitor_audit.py` (create) | W3 |
| Image-blob migration | `api/services/image_storage.py`, `api/routers/images.py`, `api/models/assets.py`, `api/scripts/migrate_image_blobs.py` (create), `api/config.py` (retire `storage_budget_gb`) | W4 |

No two waves hold overlapping write bounds. W3's `janitor.py` touch is
the audit-log emission; W4's `image_storage.py` touch is the
blob-write site — sequential, no conflict. The B.W3 `pinned` flag
pattern (canonical per `R-lifecycle-spec.md §4.2`) is the substrate
W4 builds on; W4 does not re-introduce a `$nin` query.

## §6 — Hard gates (completion criterion)

Per-wave gates are set in the hardened `waves/W*.md` after Wχ.
Tranche-level close gates:

- `scripts/deploy.sh` does not exist; `git grep -l deploy.sh` returns
  nothing in committed code.
- Webhook deploy proven end-to-end by a recorded commit-to-deploy
  chain (commit SHA → webhook receipt → container rebuild → health
  check OK).
- `docker-compose.prod.yml` source contains no plaintext password and
  no `tlsAllowInvalidCertificates`; the verified cert issuer is
  recorded in `docs/precepts/infra/`.
- `api/services/image_storage.py` source contains no `Binary(content)`
  write (the W4 deletion proof); the chosen backend's enumeration
  query returns a bounded total recorded by the migration verification.
- Migration verification harness ran green: pre-count = post-count +
  skipped; spot-check sample of 10 returns identical bytes from old
  (Mongo) and new (chosen backend) sources before the old field
  deletes.
- `api/config.py` does not define `storage_budget_gb`.
- Janitor audit-log integration test passes; partial-failure recovery
  test passes.
- `uv run pytest` green; `vue-tsc -b --force` green; `npm run build`
  (web) succeeds.
- `PROGRESS.md` matches reality; `FINAL.md` cites commits and
  artefacts.

Invalid hard gates (rejected at challenge): "webhook configured"
without a recorded deploy chain; "TLS enabled" without a verified-cert
issuer record; "blobs moved" without a count-parity verification
artefact; a dual-read compatibility layer left in place "for safety".

## §7 — Cross-tranche debt and explicit deferrals

**Inherited from A:**

- Infra items deferred at A.W4 (deploy-file hygiene was landed;
  webhook CI/CD, MongoDB TLS, port standardization were named as C
  scope per `A.md §8`). → **W1, W2.**
- Rate-limiter Option A (single-replica documented honestly) is in
  place; A.W4 chose it deliberately. C does **not** revisit unless Wα
  surfaces a multi-replica requirement, in which case the upgrade
  path is the Mongo TTL collection bucket per the W0 challenge
  alternatives. Default: no work in C.

**Inherited from B:**

- Image-blob-out-of-Mongo storage redesign explicitly deferred at
  `B.md §7` and `R-lifecycle-spec.md §6.1`. → **Wα-R1, W4.**
- B.W3 retired the `$nin` janitor pattern and landed the canonical
  `pinned` flag; C.W3 builds on this (audit log + recovery), C.W4
  builds on it (the migrated `images` collection already carries
  `pinned` and `last_accessed_at`).
- B did **not** retire `storage_budget_gb` config — only the eviction
  *pass* the band-aid drove. C.W4 retires the config field itself as
  the migration's gate.

**Emitted by C (potential):**

- If Wα-R1 selects a managed S3 backend (R2/B2/AWS), C emits a **new
  ongoing cost concern** to the constellation. The default verdict
  per invariant 12 is the local-filesystem backend; this debt is
  named here so the verdict is binding, not aspirational.
- If Wα-R2 selects a webhook framework that requires its own
  container, C emits an **operational-surface inflation** concern —
  challenge probe P1 enforces.

**Deferred out of C (potential successor tranches):**

- Multi-replica fourier deployment — out of scope per invariant 19;
  if ever needed, a fourier tranche D opens for it.
- Per-request rate-limiter migration to a shared bucket store — same;
  out of scope, named here only so the deferral is not silent.
- Cross-cohort infrastructure standardization (the fuller
  `project_infra_plan.md` scope — floridify migration,
  ncdpi-ai-tools removal, sudoku/speedtest port blocks) — these are
  constellation-wide infra concerns, not fourier's to author. C
  addresses only the fourier-bound subset.

## §8 — Brittleness window (provisional)

The W4 image-blob migration may require a brittleness window — a span
where reads are dual-pathed (Mongo `blob` field AND new backend
`storage_uri`) until the new backend is verified complete. Whether the
chosen backend admits an atomic cutover is a research question
(Wα-R1). Declared provisionally:

```yaml
breaking_changes_during_wave: maybe (W4)
suspended_gates:
  - GET /api/images/{slug}/blob during the migration cutover
restoration_wave: W4 (same wave — the migration completes within it)
reason: a relocated blob cannot be reached through the old Mongo-inline path
        once the field is deleted; a dual-read compatibility layer left in
        place past the cutover would be the very legacy code the invariants
        (3) forbid. The window opens for the duration of the backfill +
        verification sweep and closes on the same commit that deletes the
        Mongo `blob` field. If Wα-R1 selects a filesystem backend, an atomic
        cutover is possible and the window is removed at Wχ close.
```

No other window. W1–W3 close green; W4 owns its own restoration; the
close ceremony cannot run while the window is open.
