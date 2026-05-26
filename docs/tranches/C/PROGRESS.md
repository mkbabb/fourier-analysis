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
| W0 — *Open · research dispatch · infra-baseline audit* | planned | — | tranche open after B close; research lanes dispatched; infra baseline snapshot committed |
| Wα — *Research wave (storage, CI/CD, TLS)* | planned | — | 3-4 parallel lanes — R1 storage-backend survey, R2 webhook CI/CD, R3 MongoDB TLS posture, optional R4 janitor-audit-log |
| Wχ — *Challenge wave* | planned | — | adversarial review of storage backend + CI/CD shape; three probes P1/P2/P3 |
| W1 — *Webhook CI/CD + secret extraction* | provisional | — | retires `scripts/deploy.sh`; secrets exit compose files |
| W2 — *MongoDB TLS + port standardization* | provisional | — | retires `tlsAllowInvalidCertificates`; pins prod port map |
| W3 — *Janitor audit log + recovery hardening* | provisional | — | audit-log row per delete_many; partial-failure recovery |
| W4 — *Image-blob migration* | provisional | — | relocates blobs to Wα-R1-chosen backend; retires `storage_budget_gb` |
| W5 — *Close* | provisional | — | reconcile PROGRESS; cite commits in FINAL; restore brittleness window |

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
- **No cross-repo binding.** The deferred image-blob work has no peer
  in value.js (per `R-lifecycle-spec.md §6.2` — value.js does not
  store image blobs). C therefore authors no
  `coordination/CRUD-CONSTELLATION.md`-equivalent; if Wα surfaces a
  cross-repo concern, C reschedules around it rather than absorbing
  it.
- **Storage-backend default**: KISS-ordered candidates per
  `R-lifecycle-spec.md §6.3` are filesystem+nginx > GridFS > MinIO >
  managed S3. Wα-R1 carries the verdict; Wχ-P1 enforces that no
  candidate is admitted without per-line invariant-12 justification.

### Next action

None until B.W5 close. At that point, dispatch C.W0 (research dispatch
+ infra-baseline snapshot) and Wα (three parallel research lanes).
