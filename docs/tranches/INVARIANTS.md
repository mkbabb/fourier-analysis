# INVARIANTS — the canonical fourier-analysis tranche-invariant ledger

**Authored**: 2026-05-29 (fourier-F thread ε, wave W6 — chronic item **C9 invariant-numbering reconciliation**).
**Authority**: this ledger is the single locatable index of every tranche-local invariant fourier-analysis has declared across tranches A→F, the canonical resolution of the known 18/19/20 numbering collision, and the cross-reference between the `inv-N` shorthand and the `X-Inv N` namespaced convention codified at `docs/precepts/glossary/meta-terms.md §"Tranche-local invariants"`. The per-tranche `*.md §Invariants` blocks remain the authoritative *definitions* (their wording is unchanged by this ledger); this ledger is the *index* that makes each invariant's authority locatable and reconciles the cross-references.

## §0 — What this ledger reconciles, and what it deliberately does NOT touch (C9)

C9 — "invariant numbering" — has stood as a named chronic since tranche C. It was acknowledged in-place at `D.md §2` ("the C-era numbering of its three additions as 18/19/20 overlaps B's 18–24 range — a known doc inconsistency; a γ sub-item reconciles the numbering at execution, binding by *name* not number meanwhile") and re-acknowledged at `E.md §2`. Neither D nor E discharged it; both bound their additions *by name* and carried the chronic forward. fourier-F.W6 discharges it here.

The drift, stated plainly, was threefold:

1. **A 18/19/20 collision.** Tranche A numbered a baseline set 1–13 (`A.md §3`); tranche B continued the flat sequence 14–24 (`B.md §2`); tranche C then *restarted* its three additions at 18/19/20 (`C.md §2`) rather than continuing at 25/26/27 — so the integers 18, 19, 20 each name **two distinct invariants** depending on the declaring tranche.
2. **An `inv-19` semantic split.** C-Inv 19 is "Production credentials TLS-protected at rest, in transit, and in the deploy pipeline" — whose *body* preserves the single-replica deployment constraint as a clause. The infra precepts (`infra/tls.md`, `infra/domains.md`, `infra/blob-backend-dr.md`) and the deferral rows at `D.md §146` / `E.md §156` cite "invariant 19" to mean **the single-replica topology** specifically. These are not two invariants in conflict — the single-replica posture is a *clause of* C-Inv 19 (and traces to A-Inv 12, "scale without contrivance") — but the bare citation read as a second, separate meaning.
3. **An ambiguous `inv-N` shorthand.** D, E, and F adopted the bare `inv-N` form (e.g. `inv-16`, `inv-19`, `inv-21`). That shorthand does not name a tranche, so for any N in the collided 18–20 band the reference was ambiguous on its face.

**The reconciliation is NON-destructive by design.** No invariant in any A/B/C/D/E/F charter is renumbered, reworded, or has its meaning altered. Renumbering C's 18/19/20 → 25/26/27 in place would silently rewrite five tranches' worth of cross-references (and the closed FINAL.md ledgers that cite "invariant 18 delete-coupling" et al.), trading a documented, locatable inconsistency for an undocumented, history-rewriting one. Instead this ledger:

- records the **actual current inventory** under the canonical `X-Inv N` namespacing (§1), so every integer's authority is locatable;
- fixes the **canonical resolution rule** for the bare `inv-N` shorthand and the 18/19/20 collision (§2);
- cross-references the **precepts** usages so the fourier-local set and the glass-ui/constellation-wide precept set (invariant 28–33) are never conflated (§3).

The meaning of every invariant is preserved exactly. Only numbering, naming, and cross-reference *consistency* are reconciled.

## §1 — The canonical inventory (`X-Inv N`)

Per `docs/precepts/glossary/meta-terms.md §"Tranche-local invariants"`, the canonical form is **`X-Inv N`** ("Tranche X's Nth invariant"), so authority is locatable. fourier realises this set as a *flat-continued* sequence A→B (1→24), then *per-tranche-additive* C→F (each tranche adds by name). The table below is the authoritative index. The "Defining block" column is the binding definition.

| Canonical | Bare shorthand | Defining block | Name / meaning (verbatim short form) |
|---|---|---|---|
| A-Inv 1 | inv-1 | `A.md §3` | KISS / DRY |
| A-Inv 2 | inv-2 | `A.md §3` | No quick fixes, no workarounds |
| A-Inv 3 | inv-3 | `A.md §3` | No legacy code |
| A-Inv 4 | inv-4 | `A.md §3` | Substrate lands with its consumer |
| A-Inv 5 | inv-5 | `A.md §3` | No overfitting |
| A-Inv 6 | inv-6 | `A.md §3` | Gates close on evidence |
| A-Inv 7 | inv-7 | `A.md §3` | No silent deferral |
| A-Inv 8 | inv-8 | `A.md §3` | Numerical correctness precedes UI polish |
| A-Inv 9 | inv-9 | `A.md §3` | Surface-appropriate evidence |
| A-Inv 10 | inv-10 | `A.md §3` | Token-first, component-over-CSS-class |
| A-Inv 11 | inv-11 | `A.md §3` | One identity scheme |
| A-Inv 12 | inv-12 | `A.md §3` | Scale without contrivance (incl. the single-replica posture) |
| A-Inv 13 | inv-13 | `A.md §3` | Repo voice is deliberate |
| B-Inv 14 | inv-14 | `B.md §2` | One converged entity per user-named noun, with a typed owner |
| B-Inv 15 | inv-15 | `B.md §2` | Domain model in the library, persistence in the app |
| B-Inv 16 | inv-16 | `B.md §2` | Shared by contract; per-language utility modules admitted; frameworks rejected |
| B-Inv 17 | inv-17 | `B.md §2` | Migration is verified, not hoped |
| B-Inv 18 | inv-18 *(see §2)* | `B.md §2` | UI surface conventions (modal a11y; dock naming; `--z-*` ladder) |
| B-Inv 19 | inv-19 *(see §2)* | `B.md §2` | Auto-recompute discipline |
| B-Inv 20 | inv-20 *(see §2)* | `B.md §2` | Visvalingam-Whyatt + epicycle-render performance budget |
| B-Inv 21 | inv-21 *(see §2)* | `B.md §2` | Slug-mint cryptographic RNG |
| B-Inv 22 | inv-22 *(see §2)* | `B.md §2` | RFC-compliant error contract (`application/problem+json`) |
| B-Inv 23 | inv-23 | `B.md §2` | Optimistic concurrency via ETag / If-Match |
| B-Inv 24 | inv-24 | `B.md §2` | RateLimit header transparency |
| C-Inv 18′ | "inv-18 delete-coupling" | `C.md §2` | Storage location is bounded and observable — delete path coupled to the bytes |
| C-Inv 19′ | "inv-19" (TLS) | `C.md §2` | Production credentials TLS-protected at rest, in transit, in the deploy pipeline (the single-replica clause lives here, lifting A-Inv 12) |
| C-Inv 20′ | "inv-20" (slug-convergence) | `C.md §2` | Slug-identity convergence is complete end-to-end — no legacy identity name behind a cast |
| D-Inv (by name) | — | `D.md §2` | Production parity · Code-and-migration-cut-over-together · Token-system-single-source-of-surface-truth (D bound *by name*, never by number) |
| E-Inv (by name) | — | `E.md §2` | Auto-migration discipline · Cross-repo source boundary (E bound *by name*; "Cross-repo source boundary" is the load-bearing `inv-16`-adjacent boundary often cited as `inv-16` in E/F) |
| F-Inv 21* | inv-21 *(F-scope)* | `F.md §2` | post-cohort-hygiene-bounded *(F's own additive; see §2 note on the F-local re-use of the integer 21)* |
| F-Inv 22* | inv-22 *(F-scope)* | `F.md §2` | fourier-vhost-correctness (+ cross-repo aspiration) *(F's own additive; the "symmetric" name is RETRACTED — see §2.7)* |
| G-Inv 25 | inv-25 | `G.md §2` | deploy-of-record-automated — a "LIVE in prod" claim cites a `deploy_run_id` from the standing AUTOMATED path (webhook→deploy-hook for the API; the `deploy-pages` GH Actions run + CF deployment ID for the SPA), never a manual SSH/`wrangler` one-off |
| G-Inv 26 | inv-26 | `G.md §2` | single-contract-source — the api↔web type boundary has exactly ONE source of truth (strengthens inv-11 at the codegen seam); no orphaned generated schema, no shadow inline decls |
| H-Inv 27 | inv-27 | `H.md §2` | green-means-green — a claim that "tests/CI pass" (in a close, a wave receipt, or a status) cites a green CI run id covering EVERY job in the workflow, or enumerates + books each red job as a named residual; local gates passing ≠ CI passing |
| H-Inv 28 | inv-28 *(see §2)* | `H.md §2` | verified-deploy-of-record — the automated deploy path ships ONLY a SHA whose same-SHA CI run is green; composes with inv-25 (automated AND verified). *(NOTE: the integer 28 also names a glass-ui constellation precept — see §2 + §3; namespace-partitioned)* |
| H-Inv 16′ | "inv-16′" | `H.md §2` | authorized-cross-repo-sweep — cross-repo writes (beyond `fourier-analysis/** + deploy/**`) only under an explicit, user-authorized, NAMED, ledgered sweep, each its own commit booked to an `ADOPTION-ASKS` entry + gated on that repo's own green CI (inv-27); the honesty refinement of inv-16 (preserves "no SILENT cross-repo mutation") |

## §2 — The canonical resolution rule

1. **The bare `inv-N` shorthand, for N ∈ 1…24, resolves to the A→B flat-continued sequence** (A-Inv 1…13, B-Inv 14…24). This is the dominant reading across D/E/F and is the one the FINAL ledgers assume. So `inv-12` = KISS, `inv-15` = domain-model-in-library, `inv-16` = shared-by-contract, `inv-20` = NO-legacy *as used in A→B-rooted prose*.

2. **Tranche C's three additions are `C-Inv 18′ / 19′ / 20′`** — the prime mark (′) disambiguates them from B-Inv 18/19/20. They are *always* bound by their descriptive name in running prose (`inv-18 delete-coupling`, the TLS invariant, the slug-convergence invariant), exactly as C/D/E already practise. The collision is therefore *named-resolved*, not number-resolved: the integer alone never disambiguates a C-era addition; the appended phrase always does. This ledger blesses that existing practice as canonical rather than renumbering.

3. **`inv-19` in infra precepts and in the D/E multi-replica deferral rows means the single-replica clause of C-Inv 19′**, which lifts A-Inv 12. It is one invariant viewed from its topology clause, not a second invariant. Citations of "invariant 19" in `infra/tls.md`, `infra/domains.md`, and `infra/blob-backend-dr.md` are conformant under this reading.

4. **F's `inv-21` / `inv-22` are F-local additives** (`F-Inv 21*` post-cohort-hygiene-bounded; `F-Inv 22*` fourier-vhost-correctness — the "symmetric" name RETRACTED per §2.7). The asterisk marks that F re-used the integers 21/22, which B already spent on B-Inv 21 (slug-RNG) / B-Inv 22 (error contract). As with the C collision, F binds these *by name* in all running prose, and `F.md §2` is their authoritative definition. No renumbering: F's invariants are unambiguous in context (post-cohort-hygiene vs slug-RNG share no surface), and renumbering F to 25/26 would orphan the many `inv-21`/`inv-22` cross-references already in `F.md` and `F/PROGRESS.md`.

5. **D and E added invariants by name only** (no integer), precisely to side-step the collision while it stood open. Those bindings remain by-name; this ledger records them in §1 for completeness and does not retro-assign integers (doing so would invent numbers that no charter ever declared).

6. **G's `inv-25` / `inv-26` are clean fresh integers** — no prime, no asterisk. Authored after this ledger discharged C9, G deliberately continued the flat sequence at the next-free integers (B spent 1–24; C's primes and F's asterisks re-used 18–22 but invented no new integer beyond 24), so 25/26 collide with nothing. `inv-25` (deploy-of-record-automated) and `inv-26` (single-contract-source) bind by integer AND name with no ambiguity; `G.md §2` is their authoritative definition. This is the numbering hygiene the ledger prescribes — G is the first post-C9 tranche and models it.

7. **`F-Inv 22*` (vhost-correctness-symmetric) — honest scope (G.ζ reconciliation).** The descriptor "symmetric" overstated reach. The invariant is **ENFORCED and verified on fourier's OWN vhost only**: `api.fourier.babb.dev` serves `/`→404 problem+json and `/health`/`/docs`/`/openapi.json`→200, and the deploy-hook health gate **co-enforces** the `/`→404 contract on every deploy (a stale-SPA regression fails the gate). The "symmetric" reading — that every constellation API vhost holds the same 4-endpoint contract — is NOT fourier-verifiable and is **unmet for `api.color.babb.dev`** (value.js-owned, inv-16-out-of-bounds): live, color serves only `/`→200, with `/health`/`/docs`/`/openapi.json`→404 (G.ζ live-checked 2026-05-30). So `F-Inv 22*` binds as **fourier-vhost-correctness (enforced) + a cross-repo aspiration (coordination, maintainer-owned)** — NOT a constellation-wide guarantee. The color gap is a value.js coordination note (`docs/constellation/ADOPTION-ASKS.md §4`), not a fourier residual.

8. **H's `inv-27` continues the clean fresh-integer sequence** (G modeled 25/26; H adds 27 — no prime, no asterisk; `H.md §2` authoritative). `inv-27` (green-means-green) is the **test-signal analog of inv-25** (deploy-of-record-automated): inv-25 forbade citing a manual `wrangler`/SSH one-off as "LIVE in prod"; inv-27 forbids citing local-gate-passing as "CI green." A close/status asserting "tests pass" or "CI green" MUST cite a run id whose **every** job is green, or enumerate + book each red job as a named residual. Rationale: G's `FINAL §2` marked the cheap gates ✅ and read as "CI green" while the `e2e (Playwright)` job was red on every G commit (the chronic H repairs). *(Heads-up for the reader: H also adds `inv-28` (verified-deploy-of-record) in W2; H-Inv 28 is fourier-tranche-local and numerically collides with the glass-ui **precepts** "invariant 28" (zero-deferral) — they are namespace-partitioned exactly as §3 prescribes; the §2 note added at W2 makes that explicit.)*

9. **`inv-26` (single-contract-source) — honest completion (H.δ reconciliation).** inv-26 reads "the api↔web type boundary has exactly ONE source of truth." Its true end-state is **per-domain**: the fourier api↔web surface is two *disjoint* domain boundaries, each with exactly one hand-typed-canonical source — not one global type module. The reconciliation has two parts:

   - **(a) The 4th-island disposition — `web/src/lib/equation/types.ts` is NOT an inv-26 violation.** G's W-execution collapsed the **visualization/CRUD/contour** boundary to one source (`web/src/lib/types.ts`; `api.ts` re-exports from it) and deleted the orphaned codegen. A 4th hand-typed module remained: `web/src/lib/equation/types.ts` (`FourierTermDTO`, `ComputeEquationRequest`/`Response`, `SimplifyRequest`/`Response`, `NotationMode`, `EquationTier`; 10 importers under `web/src/components/equation/`). H.δ assessed it against the backend models (`api/models/equations.py`, routed by `api/routers/equations.py`) and found **field-for-field agreement, no drift**. This is the `/api/equations/compute`+`/simplify` **equation-compute domain** — a *distinct* contract, not a duplicate of the collapsed visualization boundary (disjoint importers, disjoint Pydantic models, disjoint routers). inv-26's "exactly ONE source" therefore **holds per-domain**: `lib/types.ts` is the single source for the visualization/CRUD boundary, `lib/equation/types.ts` is the single source for the equation-compute boundary. Forcing them into one module (or a cross-domain barrel re-export) would *conflate* two distinct contracts — the opposite of inv-26's intent. **Disposition: keep-as-is, documented (not merged).** No `.ts` changed under H.δ.

   - **(b) No `response_model=` codegen revival — DECLINED-WITH-RATIONALE (not deferred).** inv-26 is satisfied by **hand-typed-canonical**, NOT by machine-verified codegen. G correctly *deleted* the OpenAPI→TS codegen. Reviving it (or adding `response_model=` to the visualization read/write/list/restore endpoints to feed it) would make the schema **LIE**: those endpoints return a raw `Response(content=json.dumps(_public_doc(doc)))` with a manual `ETag`/`If-Match` validator (`api/routers/visualizations.py` — `_public_doc` projection + `etag.set_etag_header`), and **FastAPI ignores `response_model` when the handler returns a raw `Response`** — so the generated OpenAPI schema would advertise a model the wire bytes do not match (the hand-projected public doc, minus internal fields). The boundary is therefore **hand-verified-canonical by design**; machine-verification is declined because it cannot describe the ETag/projection bytes honestly. (NOTE: the equation endpoints in (a) *do* carry `response_model=` and return Pydantic models directly — they are honest there; the decline is specific to the raw-`Response` ETag/projection surface that codegen would have to misdescribe.) This decision is also booked in `H.md §"Declined (recorded, not deferred)"`.

10. **H's `inv-28` (verified-deploy-of-record) + `inv-16′` (authorized-cross-repo-sweep).** `inv-28` continues the clean fresh-integer sequence (25/26/27/28; `H.md §2` authoritative) and **composes with inv-25**: G's inv-25 made the deploy path AUTOMATED; inv-28 makes it VERIFIED — it ships only a SHA whose **same-SHA CI run is green**. Rationale: the H-audit found a SPA deploy that shipped to prod while its same-SHA CI was RED ("automated ≠ verified"). **SPA arm (LANDED, demonstrable):** `deploy-pages.yml` is rewired to `on: workflow_run [CI] completed` + gated `if: workflow_run.conclusion == 'success' && head_branch == 'master' && event == 'push'` (with the `web/**` path filter re-imposed via a same-SHA diff job + every checkout pinned to `workflow_run.head_sha`); a RED CI → `conclusion != 'success'` → the deploy job never runs (refusal is mechanical). **API arm (host-coupled, ζ):** the webhook→deploy-hook path gains a fail-closed `commits/<sha>/status` precondition reading a host-only read-only PAT; because it needs a host secret it lands with the PAT in ζ (operator-coordinated, inv-21), not in the SPA-arm wave. **NAMESPACE COLLISION (resolved):** the integer 28 ALSO names a glass-ui constellation **precept** — `invariant 28` = zero-deferral-at-close (§3). These never conflate: `H-Inv 28` is fourier-tranche-local (deploy-gate), the precepts' `invariant 28` is glass-ui-owned (close-discipline); a reader resolves by NAMESPACE (the fourier `inv-N`/`X-Inv N` set vs the `docs/precepts/` set), exactly as §3 already partitions 28–33. The bare integer never disambiguates; the namespace (or the appended name) always does. **`inv-16′`** is the prime-marked honesty refinement of B-Inv 16's cross-repo boundary: inv-16 protected "no SILENT cross-repo mutation"; inv-16′ keeps that while permitting an EXPLICIT, user-authorized, NAMED, ledgered sweep (each commit booked to `ADOPTION-ASKS`, gated on the target repo's own green CI). It binds by name (the prime mark), never by a fresh integer — so it collides with nothing.

**Net rule for a reader encountering a bare `inv-N`:** read N against the A→B flat sequence (§1) unless the surrounding prose appends a C-era descriptive phrase (delete-coupling / TLS / slug-convergence → C-Inv ′ band), sits inside an F charter discussing hygiene/vhost scope (→ F-Inv * band), or names a deploy-gate/close-discipline at 28 (→ resolve by namespace per §2.10 + §3). The descriptive phrase (or namespace) is always load-bearing for any contested N.

## §3 — Relation to the constellation-wide precept invariants (do NOT conflate)

The `docs/precepts/` tree carries a **second, distinct** invariant namespace — the glass-ui-owned, constellation-wide precept invariants codified across the glass-ui K→Q tranches: **invariant 28** (zero-deferral at close), **invariant 29** (one-release-tag attribution), **invariant 30** (cross-repo dev-resolution contract; `precepts/cross-repo-dev-resolution.md`), **invariant 31** (component props fail-explicit), **invariant 32** (RETIRED-class corpus grep), **invariant 33** (dead-code-removal corpus grep), plus **K-invariant-3** (shadow-execution anti-pattern) and **O invariant 24/27**. These live in `docs/precepts/instructions/LESSONS-LEARNED.md` and `docs/precepts/cross-repo-dev-resolution.md`.

These integers (28–33) do **not** belong to fourier's tranche-local set and never collide with it (fourier's set runs 1–24 + named C/D/E additions + F's 21*/22*). A reader must not read precepts "invariant 30" as a fourier tranche invariant. The infra-precept citations of "invariant 12 / 16 / 19", by contrast, **do** reference the fourier tranche-local set (per §2 above) — they were authored under fourier-C and inherit fourier's KISS / shared-by-contract / TLS-single-replica meanings.

## §4 — Evidence that this is now consistent

- Every integer in §1 has exactly one *defining block* citation; the only re-used integers (18/19/20 across B↔C; 21/22 across B↔F) are flagged with the disambiguating prime/asterisk and the by-name binding rule (§2).
- The `inv-19` semantic split is resolved as a single invariant with a topology clause (§2.3), reconciling the infra precepts with `C.md §2`.
- The fourier tranche-local namespace (1–24 + named) and the glass-ui constellation precept namespace (28–33) are explicitly partitioned (§3), so no future citation conflates them.
- No charter file was edited to change a meaning; the reconciliation is index + rule, preserving the closed FINAL.md ledgers verbatim.
