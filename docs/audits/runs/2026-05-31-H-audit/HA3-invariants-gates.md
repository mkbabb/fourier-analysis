# HA3 — G gate re-derivation + inv-25/inv-26 soundness (tranche-H audit)

**Agent**: HA3 — invariants & gates. **Mode**: STRICTLY READ-ONLY (zero mutations).
**Date**: 2026-05-31. **Repo HEAD**: `b28c3fac` (master).
**Substrate**: `docs/tranches/G/{G.md,FINAL.md}`, `docs/tranches/INVARIANTS.md`, live host + `gh` + `curl`.
**Verdict in one line**: G's *functional* gates REPRODUCE; but **two close-claims are OVERSTATED** — (1) "CI green" is FALSE (CI has been RED on every G commit incl. the close commit; e2e still red at HEAD), and (2) the inv-25 deploy-of-record is **decoupled from CI** and demonstrably shipped a build whose parallel CI failed. inv-26 is **partially met** (visualization family only). inv-22 honest-scope is sound.

---

## §1 — Gate re-derivation table (independent reproduction)

Every gate re-run from scratch. Commands + raw output cited.

| Gate (G.md §6 / FINAL §2) | G's claim | HA3 result | Evidence |
|---|---|---|---|
| **pytest** | "132 passed / 83 skipped" (FINAL §2); G.md §6/§28 says "214/214+" | **REPRODUCES (FINAL) / G.md §6 wording MISLEADING** | `uv run pytest api/tests/ -q` → `132 passed, 83 skipped in 0.59s`. Collection = `215 tests collected`. The 83 skips are `live MongoDB unavailable` (`test_admin.py:71` et al.). FINAL's "132/83" is honest; G.md §6's "**214/214 maintained**" never happens locally — only ~132 *run* without Mongo. The "214" only materializes under a live-Mongo CI run, which is **RED** (see §5). |
| **vue-tsc** | green | **REPRODUCES** | `cd web && npx vue-tsc -b --force` → exit `0`. |
| **npm build** | green | **REPRODUCES** | `cd web && npm run build` → `✓ built in 3.47s`, exit `0`. |
| **T7 conformance** | 12/12 PASS | **REPRODUCES** | `bash scripts/conformance-probe.sh` → `T7 conformance probe: 12/12 PASS`, exit `0`. Probe hits LIVE `api.fourier.babb.dev` + `api.color.babb.dev` + cross-repo CORS — all live. |
| **inv-22 fourier-side** | `/`→404 problem+json; `/health`→200 | **REPRODUCES** | `curl -i https://api.fourier.babb.dev/` → `HTTP/1.1 404 … Content-Type: application/problem+json`. `/health` → `200`. Symmetric contract holds on fourier's own vhost. |
| **inv-22 color (partial)** | `/`→200; `/health`,`/docs`,`/openapi.json`→404 | **REPRODUCES** | `curl` → color `/`=`200`, `/health`=`404`, `/docs`=`404`. Confirms `INVARIANTS §2.7`'s honest partial scoping exactly. |
| **δ LIVE (meta/robots/fonts)** | meta-description, robots, same-origin fonts | **REPRODUCES (with a note)** | Prod serves `<meta name="description" …>`; `robots.txt` → `200`, **1841 B** (NOT the "103 B" F authored — it is CF's zone-managed content-signals file, which FINAL §1 honestly reframes as "CF zone-managed = superior"). HTML LCP path: only `href="/fonts.css"` + `/assets/*.css` — **zero** `googleapis`/`jsdelivr`/`gstatic` origins. δ 3→0 holds. |
| **β.2 per-client** (reasoned) | per-client budget, spoof-proven | **REPRODUCES as a per-PROCESS bound; OVERSTATED as "per-client"** | `nginx real_ip` + `get_client_ip` convergence is real, and the T7/live receipts hold. BUT FINAL §4 itself books the **WORKERS=4 per-process bucket** residual: the in-memory limiter is per-uvicorn-worker, so the effective ceiling is ~4×180, not a single 180 per client. The gate is honest *because the residual is named in FINAL §4* — but "per-client number" (G.md §15) is only true modulo the 4× worker fan-out. Sound-with-named-residual. |
| **δ Lighthouse prod AND dev** | prod 95 / dev 94, A11y/SEO 100 | **REPRODUCES (artefacts present)** | `docs/tranches/G/receipts/lh-{prod,dev}-self-host.report.{html,json}` exist (505 KB prod / 519 KB dev). Both surfaces captured — the "prod AND dev" demand is honored with real artefacts. (Scores not re-run by HA3; artefact presence + 0-third-party-origin live trace corroborate.) |

**Net**: 7 functional gates REPRODUCE; **the "CI green" / "pytest 214" framing is the one OVERSTATED gate** (§5). β.2 and δ-robots carry honestly-named caveats already booked in FINAL.

---

## §2 — inv-25 (deploy-of-record-automated): soundness — **DEFECT FOUND**

**Definition** (`INVARIANTS §1`, G-Inv 25): a "LIVE in prod" claim MUST cite a `deploy_run_id` from the standing AUTOMATED path (webhook→deploy-hook for the API; `deploy-pages` GH Actions run + CF deployment ID for the SPA), never a manual one-off.

**The defect (both sub-claims of the H prompt confirmed):**

**(a) The SPA deploy is DECOUPLED from `ci.yml` — and demonstrably shipped a CI-failing build.**
`deploy-pages.yml` runs on `push` to `master` (path-filtered to `web/**`) **independently** of `ci.yml`. There is no `needs:` / `workflow_run:` gate between them; they are sibling workflows on the same trigger. So `deploy-pages` ships whenever its OWN cheap type-check passes, regardless of `ci.yml`'s api-tests/e2e result.

This is not theoretical. The inv-25 deploy_run_id **G itself cites** (`FINAL §2`: deploy-pages run `26695021489`) shipped commit `6868e8d`:
```
deploy-pages on 6868e8d: success        (run 26695021489 — the cited deploy_run_id)
CI         on 6868e8d: failure          (run 26695021490 — parallel, SAME sha)
```
So **the deploy-of-record G cites as proof of correctness shipped a commit whose full CI was RED.** inv-25 as written certifies "it was automated" but says nothing about "it was *correct*" — the automated path is a rubber stamp that an un-green build reached prod.

**(b) deploy-pages only type-checks; it does not run the suite.**
`deploy-pages.yml` step "Type-check" runs `npx vue-tsc -b --force` then ships. Its own comment (line 61-62) admits: *"The full pytest / e2e suites run in ci.yml; this workflow gates the SPA on its own build."* So the SPA deploy-of-record runs **zero tests** — neither pytest nor e2e — before shipping to prod. A frontend regression caught only by Playwright e2e (and e2e IS red at HEAD, §5) ships anyway.

**Assessment**: inv-25 is **sound as far as it goes** (it correctly killed the "manual SSH one-off / 2-month-dead-auto-deploy" failure mode) but is **under-specified**: "automated" ≠ "verified". A deploy-of-record that can ship a CI-red build is a deploy-of-record that launders un-green code into prod under an honesty banner.

**Proposed refinement (candidate H invariant):**

> **inv-25′ — deploy-of-record-gated-on-green-CI**: an automated deploy-of-record MUST be conditioned on a *green* CI run for the same commit SHA. Concretely: `deploy-pages.yml` (and the API webhook deploy) gain a `workflow_run:` trigger or a `needs:`-equivalent green-CI precondition, so a build whose `ci.yml` (api-tests + web-build + **e2e**) is RED cannot ship. Testable gate: for any cited `deploy_run_id`, the same-SHA `ci.yml` conclusion is `success` (all jobs), not merely the deploy workflow's own cheap type-check.

This closes the laundering hole without weakening inv-25's anti-manual-deploy core.

---

## §3 — inv-26 (single-contract-source): **PARTIALLY MET (OVERSTATED for the api↔web boundary)**

**Definition** (G-Inv 26): the api↔web type boundary has exactly ONE source of truth; no orphaned generated schema, no shadow inline decls.

**What REPRODUCES:**
- `web/src/lib/api-schema.d.ts` is **deleted** (`test -f` → MISSING; `grep -rn "api-schema" web/src` → empty).
- No `openapi-typescript`/`gen-types` toolchain remains (`grep` empty across `web/`).
- `vue-tsc -b` green. The visualization-family decls are folded into `types.ts`.

**What makes it OVERSTATED:**
1. **A 4th hand-type island survives**: `web/src/lib/equation/types.ts` EXISTS with **10 importers** (`grep -rl "equation/types"` → 10). FINAL §4 books it as "a distinct equation-domain contract, not a duplicate … out of inv-26's named scope." That is a defensible *scoping*, but it means "single contract source" is true only for the visualization noun, not the api↔web boundary writ large.
2. **The boundary is NOT machine-verifiable** — the deeper finding. The core CRUD router returns raw `Response`, with **no `response_model=`**:
   ```
   api/routers/visualizations.py:101  async def create_visualization(...) -> Response:
   :172 get  :221 list  :278 patch  :317 delete  :347 restore  — ALL -> Response
   ```
   They hand-serialize via `json.dumps(_public_doc(saved))` + `etag.set_etag_header()` (the raw `Response` is *needed* for the ETag/Location/204 header discipline — inv-23). Consequence: **FastAPI's OpenAPI schema cannot emit `Visualization`** (P1's finding reproduces). So codegen was *un-viable*, which is precisely why G *deleted* it rather than wiring it. "One source of truth" is met by **manual convergence**, not by a machine-checked contract. The api↔web `Visualization` boundary remains two hand-maintained copies (Pydantic `_public_doc` shape ↔ TS `types.ts`) that nothing verifies are in sync.

   *Note*: 8 OTHER routes DO carry `response_model=` (`contours.py:35/56`, `equations.py:29/134`, `images.py:93/117/126`, `admin.py:110`). So OpenAPI is complete for compute/images/equations/admin but **incomplete for the visualization CRUD family** — exactly the gap.

**The "truly elegant end-state" assessment (H prompt §3):**
Yes — the architecturally honest transposition is: **add `response_model=` (or `responses=`) to the visualization routes so OpenAPI emits `Visualization`, then codegen becomes viable and inv-26 becomes machine-VERIFIABLE rather than manually-asserted.** This is non-trivial because the routes need raw `Response` for ETag/If-Match/Location/204 semantics — but FastAPI supports this: declare `response_model=Visualization` + `responses={...}` for the header/status contract while still returning a `Response` (or use `JSONResponse` subclasses / `Response` with an explicit `response_model` on the decorator, accepting FastAPI won't auto-serialize). The cleaner path is a typed return + `response.headers[...]` mutation via a dependency, keeping ETag discipline while restoring schema emission. **This is a real candidate H thread** (call it the inv-26 completion: "machine-verifiable contract source"). Until then, inv-26 should be stated honestly as **"single MANUALLY-converged source for the visualization noun"**, not "single contract source" unqualified.

---

## §4 — inv-22 honest scope (G.ζ): **HONEST, but the name should retire**

`INVARIANTS §2.7` ("`F-Inv 22*` honest scope") matches live exactly (§1 table: fourier symmetric; color partial, live-confirmed 2026-05-31). The "enforced fourier-side + cross-repo aspiration" framing is **honest** — it is the model G.ζ correctly installed.

**However** the H prompt's sharper question — *does the very existence of `F-Inv 22*` "symmetric" need retiring?* — is well-founded. The descriptor "vhost-correctness-**symmetric**" (`INVARIANTS §1`, F-Inv 22*) is now **a documented lie about its own name**: §2.7 spends a paragraph explaining that "symmetric" *overstated reach* and the invariant actually binds as "fourier-vhost-correctness (enforced) + aspiration." Keeping the word "symmetric" in the canonical name while a sub-rule retracts it is the *kind of claim↔reality gap G was chartered to remove*. **Recommendation for H**: rename F-Inv 22* → **`vhost-correctness-fourier-enforced`** (the cross-repo piece demoted to an explicit ADOPTION-ASK, which §2.7 already does), so the name no longer asserts what the body retracts. This is cosmetic-but-honesty-load-bearing; it is the inv-22 analog of the very overstatement-correction G performed.

---

## §5 — The CI-honesty invariant gap: **G CLAIMED "CI green" WHILE e2e/api-tests WERE RED**

**The breach, evidenced:** FINAL §2 lists "vue-tsc + build green" and the close prose asserts the gate-suite green, and CANONICAL-ORDERING §16.1 lists "pytest 132/83; vue-tsc+build green; T7 12/12" — implying a green close. The actual CI:

```
gh run list (CI workflow):
  de9a078 (THE G CLOSE COMMIT)   → CI: failure   (run 26695262330)
     └ api/tests: FAILURE · e2e: FAILURE · web-build: success
  5e29ed0 (W9 close docs)        → CI: failure
  9080ca2, e9faab6, 6868e8d, 3ab42d8, b7f639c, 69cc15b, 87ebe4b, 830cfa0, 076e77a, 01c9767 → ALL CI: failure
  b28c3fac (HEAD, "fix(ci): api-tests must sync --extra dev") → CI: failure
     └ api/tests: SUCCESS (now fixed) · web-build: success · e2e: FAILURE  (still red)
```
**Every single CI run across the entire G tranche conclusion is RED.** At the close commit, BOTH api-tests and e2e failed. The post-close "fix(ci)" commit `b28c3fac` repaired api-tests (the `--extra dev` spawn bug) but **e2e is STILL red at HEAD** — the Playwright contour-extraction suite fails (`contour-extraction.spec.ts:16` upload+extract ✘ across all animal fixtures; earlier `strict mode violation: locator('input[type="file"]') resolved to 2 elements`). G's "green" only ever referred to the *cheap* jobs it chose to cite (vue-tsc + build + the no-Mongo local pytest subset), never the full workflow.

This is a genuine honesty breach of the same class G was born correcting: a "green" claim that quietly excludes the jobs that are red.

**Proposed new H invariant (drafted, named):**

> **inv-27 — CI-honesty / every-job-green**: any close or "green CI" claim MUST cite a CI run whose conclusion is `success` for **EVERY job in the workflow** (api-tests, web-build, e2e — not merely the cheap type-check/build), at the close commit SHA. A claim of "green" that omits a red job is a falsification. Testable gate: `gh run view <id> --json jobs` shows `conclusion=success` for all jobs at the FINAL-cited HEAD. Rationale: G's FINAL/ORDERING asserted a green close while `ci.yml` was RED on the close commit (api-tests + e2e), citing only vue-tsc/build/local-no-Mongo-pytest. This is the CI analog of inv-25 (deploy-of-record): just as a "LIVE" claim must cite an automated deploy, a "green" claim must cite an all-jobs-green run.

(inv-27 and the §2 inv-25′ refinement are complementary: inv-27 forbids *claiming* green falsely; inv-25′ forbids *shipping* a non-green build. Together they close both the claim-side and the deploy-side of the CI-decoupling hole.)

---

## §6 — Invariant ledger integrity (INVARIANTS.md re-read)

`INVARIANTS.md` §1 + §2 are internally **consistent for inv-25/26 numbering**: §2 rule 6 correctly notes 25/26 are "clean fresh integers" (no prime/asterisk), colliding with nothing — this holds (B spent 1–24; C primed 18–20; F asterisked 21–22; G starts at 25). No NEW numeric collision introduced.

**But two ledger honesty gaps surface from this audit:**

1. **The §2.7 "symmetric" self-contradiction** (§4 above): F-Inv 22*'s canonical NAME in §1 still reads "vhost-correctness-**symmetric**" while §2.7 documents that "symmetric" is unmet. The ledger thus carries a name that its own rule retracts — a (small, documented) integrity gap. Recommend renaming per §4.

2. **No invariant governs the CI-green/deploy-green honesty surface** (§2, §5). The ledger has inv-25 (deploy automated) but nothing requiring the deploy be CI-gated, and nothing requiring a "green" claim cite an all-jobs-green run. Given G's close was literally CI-red, this is the ledger's most material gap. inv-25′ + inv-27 (drafted above) fill it.

No collision between fourier's tranche-local set (1–24 + named) and the precept namespace (28–33) — §3's partition holds; the drafted inv-27 lands cleanly at the next free fourier integer (27 is unused in the fourier-local set; 28–33 are glass-ui precepts, so a fourier `inv-27` does NOT collide — though H should explicitly note this adjacency to avoid a future 27/28 reader-confusion, mirroring the C9 reconciliation discipline).

---

## §7 — Summary for the H synthesis

- **Functional gates REPRODUCE**: pytest 132/83, vue-tsc+build, T7 12/12, δ live (fonts same-origin, meta, robots-as-CF-zone-file), inv-22 fourier-symmetric + color-partial, Lighthouse artefacts present.
- **OVERSTATED #1 — "CI green"**: FALSE. CI is RED on the G close commit (`de9a078`: api-tests + e2e failed) and on every G commit; e2e is STILL red at HEAD `b28c3fac`. G cited only the cheap jobs. → draft **inv-27 (every-job-green)**.
- **OVERSTATED #2 — inv-25 is decoupled from CI**: the cited deploy_run_id `26695021489` shipped commit `6868e8d` whose parallel CI (`26695021490`) FAILED; deploy-pages type-checks only, runs no tests. An automated deploy laundered a CI-red build to prod. → strengthen to **inv-25′ (gated-on-green-CI)**.
- **PARTIAL — inv-26**: visualization-family single source met by MANUAL convergence only; the boundary is NOT machine-verifiable because `visualizations.py` returns raw `Response` with no `response_model=` (OpenAPI can't emit `Visualization`); a 4th hand-type island (`equation/types.ts`, 10 importers) survives by scoping. Elegant end-state: add `response_model=`/`responses=` to restore schema emission → codegen viable → machine-verifiable contract. **Candidate H thread.**
- **inv-22 scope HONEST** but the name "symmetric" should retire (the name asserts what §2.7 retracts).
- **Ledger**: numbering consistent; honesty gaps = the §2.7 name self-contradiction + the absent CI-green/deploy-green invariant.

**Mutations performed: none.** All findings from read-only repo + live `curl` + `gh` + local pytest/build/probe runs.
