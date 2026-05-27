# C — progress log

Updated at every wave boundary. Reconciled against reality at W5 close.

## Goal of this log

Record what *actually happened* at each wave of fourier-tranche-C — the
infrastructure and image-blob storage tranche — so the close ceremony
can reconcile claim against artefact without archaeology.

## Completion criterion

Every wave's row in the status board below carries (a) a status word
from the canonical set, (b) a close timestamp once the wave closes,
and (c) a notes cell that names the wave's binding deliverable. At
W5 close, every row reconciles against `FINAL.md`'s gate table.

## Status board

| Wave | Status | Closed at | Notes |
|---|---|---|---|
| W0 — *Open · research dispatch · baseline audit* | **closed** | 2026-05-27 | tranche opened after B close (`fc5b3b0`); `W0-baseline.md` lands the infra-baseline snapshot (deploy.sh + `:8091` port bug, 3 TLS sites, port map=8100, 2 inline blobs), the **B-residual catalog** (~30 `snapshot_hash` sites + 1 `as unknown as` cast + 14 conformance skip-stubs), the **`--reload` baseline finding** (dev-only), brittleness window §8 ratified-provisional; Wα 4-lane research dispatched |
| Wα — *Research wave (storage, CI/CD, TLS)* | **closed** | 2026-05-27 | 4 parallel lanes landed (7 artefacts, 1,487 L) — **R1** filesystem+nginx app-served, atomic cutover YES → window REMOVED; **R2** `adnanh/webhook` host-binary, HMAC-SHA256, self-reverting rollback, deploy.sh deleted; **R3** server-only TLS+SCRAM, re-provision under recorded self-signed internal CA, 3+1 sites; **R4** 11 audit rows on existing `admin_audit` shape, `--reload` fix = drop `--reload-dir src`. `research/README.md` reconciles; no source touched |
| Wχ — *Challenge wave* | planned | — | adversarial review; **four probes** P1 (storage smallest-mechanism) / P2 (CI/CD truly replaces deploy.sh) / P3 (brittleness window honest) / **P4 (thread γ removes the legacy name at the ROOT, not behind a new cast)** |
| W1 — *Webhook CI/CD + secret extraction* | provisional | — | thread α — retires `scripts/deploy.sh` (+ its health-check port bug); secrets exit compose files |
| W2 — *MongoDB TLS + port standardization* | provisional | — | thread α — retires `tlsAllowInvalidCertificates` (3 sites); pins prod port map |
| W3 — *Janitor audit-log + recovery + `--reload` compute-abort fix* | provisional | — | thread α — audit-row per delete_many; partial-failure recovery; the dev `--reload`-aborts-compute fix |
| **W4 — *Slug-identity completeness + B-residual discharge*** | **provisional** | — | **NEW 2026-05-27 (thread γ + conditional δ)** — rename the `snapshot_hash` DTO band → slug end-to-end; remove the `as unknown as` cast; reconcile `FlaggedListResponse`; fill-or-retire the 15 conformance skeletons; e2e axe settle; **conditional δ**: consume value.js `sampleToSVGPath` iff published. Discharges the one precept violation (invariant 20). Independent of α/β — parallel-capable |
| W5 — *Image-blob migration* | provisional | — | thread β — relocates primary + **thumbnail** blobs to the Wα-R1 backend (filesystem+nginx default); inline-write deletion proof (`storage_budget_gb` already retired at B.W3 — gate corrected) |
| W6 — *Close* | provisional | — | reconcile PROGRESS; cite commits in FINAL; restore brittleness window; record the conditional δ disposition + the inverted cross-repo edge |

## Log

### 2026-05-19 — tranche authored (opening plan, scoping pass)

**WHAT.** C authored as the named successor for two deferral lineages:

- **Infra hygiene** carried from `A.md §8` (webhook CI/CD, MongoDB
  TLS, port standardization) per
  `~/.claude/projects/-Users-mkbabb-Programming-fourier-analysis/memory/project_infra_plan.md`.
- **Image-blob storage redesign** carried from `B.md §7` and
  `R-lifecycle-spec.md §6` — deferred explicitly from B's
  identity-convergence thesis as orthogonal storage-architecture work.

**WHY.** Both deferrals carry a named destination per P-Inv 28; C is
that destination. Splitting into two smaller tranches would mean the
storage migration deploys through the very `scripts/deploy.sh` C
exists to retire (the dependency ordering at §4 phases makes the two
threads load-bearingly co-scheduled).

C is fourier-local (no peer-tranche cohort). The agent report
`docs/audits/runs/2026-05-19-refinement-assay/r6-fourier-C-scope.md`
records the scoping decisions and the why-not on a cross-repo binding.

C is **research-first** for the storage lane and **direct** for infra
hygiene. The implementation waves W1–W5 are *provisional*; they are
hardened to `waves/W*.md` after Wχ close — the same lifecycle as B.

C does not open until fourier tranche B closes (B.W5). B was still
pre-W0 at 2026-05-19; B opens after A closes. (Per the 2026-05-26
orphan verdict at `B/coordination/CRUD-CONSTELLATION.md`, B closed
partially-discharged; C remains gated on the discharge taking final
form in B/FINAL.md.)

Provisional brittleness window declared at `C.md §8` for the W4
image-blob migration; Wα-R1 (storage-backend survey) determines
whether the chosen backend admits an atomic cutover and removes the
window, or requires the dual-read span and confirms it.

### Authoring decisions taken (recorded for the close ceremony)

- **Two threads, one tranche.** Infra hygiene and storage architecture
  are intentionally scheduled together because they share a
  load-bearing pre-condition (the W4 migration ships through the W1
  pipeline and depends on the W2 TLS posture). Splitting into two
  smaller tranches would have meant the storage migration deploys
  through `scripts/deploy.sh` and that is the very surface C exists
  to retire.
- **Rate-limiter explicitly out.** A.W4 chose single-replica Option A
  deliberately
  (`docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md §5`).
  C does not re-litigate; if multi-replica is ever needed a fourier
  tranche D opens for it. Recorded in `C.md §7` so the deferral is
  not silent.
- **One conditional cross-repo edge (revised 2026-05-27).** The
  image-blob work has no value.js peer (per `R-lifecycle-spec.md §6.2`),
  but the C-development audit (`CA3` + `CA4`) found a single
  *inverted-edge* concern: the narrow colour lift (`sampleToSVGPath`).
  The edge inverts vs the original B plan — value.js publishes, fourier
  consumes — and is conditional + user-re-mandate-gated on the value.js
  side. C authors `coordination/COLOUR-LIFT.md` to record the ask, and
  holds the consume as the conditional thread-δ scope item in W4; it
  does not block any C wave.
- **Storage-backend default**: KISS-ordered candidates per
  `R-lifecycle-spec.md §6.3` are filesystem+nginx > GridFS > MinIO >
  managed S3. Wα-R1 carries the verdict; Wχ-P1 enforces that no
  candidate is admitted without per-line invariant-12 justification.

### 2026-05-27 — C-development expansion (6-agent audit fold)

**WHAT.** Following the B close (`fc5b3b0`), the user directed a 6-agent
parallel audit of the B plan + all B changes + both repos, with a recap
of all prompts/precepts, and to "fold items into C, expand and augment
that tranche and wave set." The audit ran as lanes `CA1`–`CA6` at
`docs/audits/runs/2026-05-27-C-audit/` (1,054 L + `SYNTHESIS.md`).

**Findings folded into C:**

- **The one precept violation** (`CA1 §3` + `CA6 §2`): the B slug-identity
  convergence stopped at the API boundary — the frontend DTO band is still
  *named* `snapshot_hash` (a slug value under a legacy name), masked by an
  `as unknown as` cast on a stale `FlaggedListResponse`. → **new thread γ /
  W4**; **new invariant 20** (slug-identity completeness, no legacy name
  behind a cast).
- **The colour-lift KISS correction** (`CA4`): `colors.ts` has 0 domain
  symbols; the only genuine lift is `easings.ts`'s `generateCurveSVGPath`
  → a narrow `sampleToSVGPath` in value.js. The `Palette`/`colorScale`
  domain model is premature ("library nobody calls"). → **conditional
  thread δ / W4** (consume iff value.js publishes); the rest held latent.
  The cross-repo edge **inverts** (value.js publishes → fourier consumes).
- **value.js state** (`CA3`): H closed (v0.10.0); `I-SEED` thesis is open
  with no colour reference — the lift needs a forward-themed or dedicated
  value.js tranche, user-re-mandate-gated. → `coordination/COLOUR-LIFT.md`.
- **Anchor + fact corrections** (`CA5`): `storage_budget_gb` config +
  eviction were ALREADY retired at B.W3 (the prior `C.md §7` claim was a
  factual error) — W5's gate corrected to the inline-write relocation; the
  thumbnail is a second blob; `image_storage.py:97`→`:104`; the `deploy.sh`
  health-check port bug (8091 vs 8100); the `--reload`-aborts-compute item
  (dev-only) → **W3**.
- **Deferred/chronic inventory** (`CA2`): 18 items, 6 chronic; every item
  mapped to a C destination or a named successor — `C.md §7` carries the
  full disposition.

**Wave set expanded** 6 → 7 implementation slots: the new **W4
(slug-identity completeness + B-residual discharge, thread γ + conditional
δ)** inserted; the storage migration renumbered W4 → **W5**; close
renumbered W5 → **W6**; **Wχ gains P4** (γ root-check). **Invariants 18–19
revised + invariant 20 added.** `CANONICAL-ORDERING.md` reconciled to
ordering γ (A/B/value.js-H closed; orphan settled; the inverted edge).

**Prompt disposition** (`CA6`): 27 directives — 23 ADDRESSED, 3 PARTIAL,
1 ROUTED-TO-C (the `snapshot_hash` discharge), 0 OUTSTANDING.

### 2026-05-27 — C.W0 opened + baseline landed

**WHAT.** The user authorised tranche-C execution ("Begin and continue the
current tranche"). C.W0 ran as the team-lead open/baseline/dispatch wave:
`W0-baseline.md` authored, grounding every Wα/Wχ measure in `file:line`
against the live tree (not the audit's drifted anchors). The baseline
confirmed all B-residual claims (the `snapshot_hash` band is ~30 sites,
broader than `CA1` sampled; the `as unknown as` cast is exactly one at
`AdminFlaggedPanel.vue:56`; 14 conformance files are skip-stubs whose skip
reason *falsely* reads "implemented at B.W3"), and corrected three facts:
(a) prod compose already uses `${MONGO_PASSWORD:?}` interpolation — no
committed plaintext, so W1's secret work is a refinement not a crisis;
(b) prod is already on port 8100 — W2's port work is ratification + the
deploy.sh `:8091` bug, not a renumber; (c) the conformance count is 14,
not 15. The mongod server is already `requireTLS` with cert/CA files — the
TLS gap is the *client trust* posture (3 sites: `prod.yml:8,48,53`).

**Gate.** W0 → Wα opened: 4 parallel research lanes dispatched (R1 storage,
R2 webhook CI/CD, R3 MongoDB TLS, R4 janitor-audit-log + `--reload` fix),
each measuring against `W0-baseline.md §1-§3`. No source files touched.

### 2026-05-27 — Wα research wave closed

**WHAT.** Four parallel lanes (R1-R4) produced 7 artefacts (1,487 L), each
grounded `file:line` against `W0-baseline.md` and each *refining* rather than
rubber-stamping the C-development audit:

- **R1 (storage)**: filesystem+nginx **app-served** (not direct-nginx — the prod
  nginx container shares no volume with backend, and direct-serve would forfeit
  the `last_accessed_at` retention touch). Atomic per-doc cutover **confirmed** →
  the §8 brittleness window is **removed**. Binding contract in `R-storage-spec.md`
  (migration script + count-parity/spot-check harness + the deletion-proof clause
  that drops the inline write AND the `blob`-read branch in one commit).
- **R2 (CI/CD)**: `adnanh/webhook` host binary (no container), HMAC-SHA256 auth,
  health-gated self-reverting rollback at `:8100`, tracked `scripts/deploy-hook.sh`.
  `deploy.sh` deleted; only `git push` survives (the intended trigger). Risk: the
  receiver lives outside the repo — W1 must capture a real deploy-chain transcript.
- **R3 (TLS)**: server-only TLS+SCRAM (the certless-allow flag is inert under
  SCRAM-only auth). Cert provenance **unknowable** → re-provision under a recorded
  self-signed internal CA (`CN=fourier-internal-ca`) with the SAN footgun handled.
  3 sites + 1 latent (`.env.example:21`); `database.py` untouched (URI-only). Dev
  plaintext-on-bridge is a named justified residual.
- **R4 (janitor/reload)**: 11 audit rows on the **existing** `admin_audit` 4-field
  shape (no bloat); idempotent fail-safe recovery; `--reload` fix = drop
  `--reload-dir src` (one-token root fix); background queue deferred to fourier-D.

**Cross-lane reconcile** (`research/README.md`): no conflicts. Three shared
touch-points resolved — `docs/precepts/infra/` created by W1 (lands first), W2
adds `tls.md`; port 8100 is the single source of truth; `database.py` touched by
no lane.

**Gate.** Wα → Wχ opened: dispatch P1 (storage smallest-mechanism) · P2 (CI/CD
truly replaces deploy.sh) · P3 (cutover atomic / window honest) · P4 (γ removes
legacy name at ROOT). No source touched.

### Next action

Wχ adversarial probes in flight (P1-P4). On their close, harden W1-W6 into
`waves/W*.md` and reconcile any probe-surfaced corrections into `C.md`, then begin
the implementation phase (W1 → W2, W3∥, W4∥, W5).
