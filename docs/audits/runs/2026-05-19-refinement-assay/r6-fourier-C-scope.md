# R6 — fourier tranche C scoping report

**Agent role**: R6 — fourier tranche C scoping agent (refinement-assay batch).
**Date**: 2026-05-19.
**Deliverable type**: tranche skeleton author + scoping-decisions record.
**Artefacts written**: `/Users/mkbabb/Programming/fourier-analysis/docs/tranches/C/C.md`, `/Users/mkbabb/Programming/fourier-analysis/docs/tranches/C/PROGRESS.md`.
**Inputs verified in full**: `docs/tranches/A/A.md §8`, `docs/tranches/B/B.md §7`, `docs/tranches/B/research/R-lifecycle-spec.md §6`, `~/.claude/projects/-Users-mkbabb-Programming-fourier-analysis/memory/project_infra_plan.md`, `docker-compose.yml`, `docker-compose.prod.yml`, `nginx/fourier.conf`, `scripts/deploy.sh`, `api/services/image_storage.py`, `api/services/janitor.py`, `api/services/rate_limiter.py`, `docs/precepts/instructions/tranche/SPEC.md`, `docs/tranches/A/PROGRESS.md`, `docs/tranches/B/PROGRESS.md`, `docs/tranches/B/coordination/CRUD-CONSTELLATION.md`.

---

## 1. Scoping verdict

C is a fourier-local tranche with two intentionally separable threads under one umbrella:

1. **Infra hygiene** (direct mode) — webhook CI/CD, MongoDB TLS, port standardization, janitor maturity. Well-scoped engineering work that follows `project_infra_plan.md` (2026-03-28, noted 59 days old at memory-stamp; assumptions verified against current `docker-compose*.yml` / `scripts/deploy.sh` rather than the memory).
2. **Storage architecture** (research-first) — image-blob relocation out of Mongo. The candidate set is named (`R-lifecycle-spec.md §6.3`); the choice is genuinely open and requires a research lane plus a challenge probe.

Both threads close in the same tranche because they share one load-bearing dependency chain: the W4 image-blob migration ships through the W1 webhook pipeline and depends on the W2 TLS posture. Splitting into two micro-tranches would have routed the storage migration through the very `scripts/deploy.sh` C exists to retire.

## 2. Provisional wave shape (7 waves)

```
W0   Open · research dispatch · infra-baseline audit       (1 agent, ceremony)
Wα   Research wave — 3-4 parallel lanes (R1-storage,       (3-4 agents, read-only)
     R2-CI/CD, R3-TLS, optional R4-janitor-audit)
Wχ   Challenge wave — 3 probes (storage smallness,         (2-3 agents)
     CI/CD substitution honesty, brittleness honesty)
W1   Webhook CI/CD + secret extraction                     (2 agents)
W2   MongoDB TLS + port standardization                    (2 agents)
W3   Janitor audit log + recovery hardening                (1 agent)
W4   Image-blob migration to chosen backend                (2-3 agents)
W5   Close                                                 (1 agent)
```

Peak parallelism 4 (Wα); hard ceiling 10 respected with substantial headroom. W0 → Wα → Wχ is strict gate (no implementation wave dispatches before the challenge closes), exactly matching B's lifecycle pattern.

## 3. Decisions taken — and the alternatives rejected

### 3.1 Cross-repo coordination — **rejected**

`R-lifecycle-spec.md §6.2` is explicit: value.js does not store image blobs (palettes are ≤ 50 colours × few-hundred-byte CSS strings). There is no peer-tranche counterpart for the storage redesign, and the infra concerns (`mbabb.fridayinstitute.net` deploy posture, webhook CI/CD for fourier) are fourier-deployment-specific. C therefore authors no `coordination/CRUD-CONSTELLATION.md`-equivalent. A speculative cross-cohort infra standardization tranche is named at `C.md §7` as **out of scope** so the deferral is not silent.

### 3.2 Rate-limiter upgrade — **deferred out of C**

The prompt names rate-limiter upgrade as a candidate for C if multi-replica is ever needed. A.W4 chose single-replica Option A deliberately (`docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md §5`); the documented honesty is in place. Re-opening this in C would mean either (a) silently changing scale assumptions or (b) authoring a multi-replica deploy without a current need — both invariant 12 violations. C records the deferral at `§7` so a future fourier-D can pick it up if and when multi-replica becomes a real requirement.

### 3.3 Janitor maturity — **admitted as small wave (W3)**

A.W4's pinned-flag invert landed; B.W3 retired the `$nin` pattern; what remains is observability (every cron `delete_many` should write an `admin_audit` row) and recovery (a cron pass that dies mid-cycle should re-run cleanly). The substrate (the `admin_audit` collection) already exists from A.W5; W3 is single-agent because the file bounds are narrow. Made a wave rather than a folded task because the recovery semantics need a real integration test, not a quick patch.

### 3.4 Storage-backend default — **deferred to research; KISS-ordered priors recorded**

Per `R-lifecycle-spec.md §6.3`: filesystem + nginx > GridFS > MinIO > managed S3. C does not pre-decide; Wα-R1 carries the verdict and Wχ-P1 enforces that no candidate is admitted without per-line invariant-12 justification. The brittleness window §8 is declared **provisionally** because the answer to "does the chosen backend admit an atomic cutover?" depends on the backend (filesystem yes; managed S3 no).

### 3.5 Two-thread sequencing — **W1 → W2 → (W3 ∥) → W4**

W1 (CI/CD) precedes W2 (TLS) so the TLS rollout itself ships through the new pipeline — a load-bearing first exercise of the substitute deploy. W3 (janitor) is dependency-free and may overlap. W4 (storage) sits last because the migration is dispatched through W1's pipeline and reaches the chosen backend over W2's verified TLS (if MinIO or managed S3).

## 4. Brittleness-window verdict

**Provisionally declared yes, scoped to W4.**

The image-blob migration may require a dual-read span (Mongo `blob` AND new backend `storage_uri`) until the backfill is verified complete. The window is **conditional on the backend choice**: a filesystem cutover can be atomic (write the file, update the doc with `storage_uri`, delete the `blob` field, all in one logical commit per object); a managed-S3 backfill cannot (objects upload one at a time; the cutover spans many seconds).

The window text at `C.md §8` declares the window provisionally and names W4 itself as the restoration wave (same wave — the migration completes within it). Wχ removes the window if Wα-R1 selects the filesystem backend; it confirms the window otherwise.

## 5. Does C need its own research wave for image-blob? — **YES**

Reasoning:

- The candidate set has four members with materially different KISS, operational-cost, and migration-risk profiles. A verdict is not pre-determined by the prior tranches.
- The migration is the largest in fourier's history (image blobs are the largest single class of data in the deployed Mongo). A naive cutover invites real data loss.
- Invariant 17 (migration is verified, not hoped) requires the migration shape — backfill + verification + reversibility-OR-completeness-proof — to be designed before the implementation wave. That design is the research lane's deliverable.
- The challenge probe P1 specifically interrogates whether the chosen backend is the smallest honest mechanism. Without a research lane to challenge, P1 has nothing adversarial to test.

A research lane is **non-negotiable** for the storage thread; it is **optional** for the infra-hygiene thread (the Wα-R2 CI/CD lane and Wα-R3 TLS lane are admitted as research because the chosen webhook framework and the cert-provisioning model are also open).

## 6. Invariants added — and why two suffice

C adds invariants 18 and 19 to the inherited 1–17 set:

- **18** — storage location bounded and observable; `pinned`/`last_accessed_at` retention; `storage_uri` on the owning document; `storage_budget_gb` retired by relocation, never reintroduced. This binds W4 and prevents the band-aid from coming back through the back door.
- **19** — production credentials TLS-protected with verified certs; secrets not in compose files; deploy pipeline cryptographically authenticated. This binds W1 and W2 and forbids the `tlsAllowInvalidCertificates` regression in any future hotfix.

Resisted the temptation to add invariants for "no managed cloud" (covered by 12), "no shared CRUD framework" (covered by 16), "audit-traced cron actions" (a hard gate on W3, not an invariant — gates close on artefacts per invariant 6, invariants set policy across waves).

## 7. Open questions surfaced for Wα to answer

Recorded here so the research wave's lane briefs can pick them up:

1. **Storage backend** — which of the four candidates is the smallest honest mechanism for fourier's deployed scale (single host, ≤ few-GB image volume, single-replica)? What does the migration look like for that backend? Is the cutover atomic?
2. **Webhook framework** — adnanh/webhook is named in `project_infra_plan.md`; is it still the right choice 59 days later? What is the auth model? How does rollback work?
3. **TLS cert provisioning** — Let's Encrypt? Self-signed via internal CA? What is the rotation cadence? How is dev parity preserved (the dev `MONGO_URI` in `docker-compose.yml` is plaintext today)?
4. **Janitor audit-log spec** — what fields, what retention, what query patterns does the admin viewer (A.W5) need? Possibly an optional research deliverable; folded into Wα only if Wχ confirms the need.
5. **Port standardization** — `project_infra_plan.md` calls for 10-port-block scheme (fourier 8100); current `docker-compose.prod.yml:68` is 8100-bound, but the deploy SSH itself is at port 1022 and the prod health-check probes 8091. Is 8091 a stale reference? W0 baseline snapshot resolves.

## 8. Compliance check against SPEC.md

Verified against `docs/precepts/instructions/tranche/SPEC.md`:

- ✓ §1 opening: what C completes (infra + image-blob carries).
- ✓ §2 thesis: why the two threads compose (shared dependency chain).
- ✓ §3 invariants: inherited 1–17 + added 18, 19.
- ✓ §4 wave table: wave / agents / closes-on / status, 7 waves W0..W5 + Wα + Wχ.
- ✓ §5 phases: 4 phases linked to wave specs (wave specs deferred to post-Wχ hardening per B's pattern).
- ✓ §6 critical files and ownership: disjoint write bounds, B.W3 substrate consumed.
- ✓ §7 hard gates: artefact-anchored, with invalid-form rejections listed.
- ✓ §8 cross-tranche debt: inherited (A, B), emitted (potential cost/operational-surface), deferred out (multi-replica, cross-cohort infra).
- ✓ §9 brittleness window: provisional, scoped to W4, named restoration wave, removal condition recorded.

C.md is ~150 lines (within the 150–250 target). PROGRESS.md follows A/B template (status board + log + next action).
