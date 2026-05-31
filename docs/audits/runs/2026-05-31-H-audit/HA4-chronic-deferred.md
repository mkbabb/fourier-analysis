# HA4 — Chronic + deferred inventory + H-fold disposition (the master ledger)

**Lane**: HA4 of the tranche-H audit (fourier-analysis). **STRICTLY READ-ONLY** — zero mutations; repo + read-only host + `gh` + `curl` only.
**Subject**: every deferred/chronic item across A→G **plus** the new residuals this session (G execution receipts + the G-audit reason context), each re-graded against H. Folds the standing directive: *"Delineate any chronically deferred items and fold them into this new tranche. Delineate any deferred items and fold them into this new tranche."* — exhaustively, so nothing silently re-defers.
**Substrate HEADs**: fourier-analysis `de9a078` + the G.W9 close commit (G CLOSED GREEN 2026-05-30); deploy-repo `mkbabb/deploy` `a7b58ab`. value.js-J latent (not opened).
**Sources mined**: `G/FINAL.md §4` (6 booked residuals) · `G.md §7` (cross-tranche debt + deferrals) · `G/waves/W1–W8 + Walpha + Wchi` (every "booked"/"residual"/"BOOKED" note) · `F/FINAL.md §5` (F residuals) · `docs/audits/runs/2026-05-29-G-audit/GA4-chronic-deferred.md` (the prior 41-item / 18-open ledger) · `docs/constellation/ADOPTION-ASKS.md` (7 asks + dispatcher + inv-22-color) · `docs/tranches/INVARIANTS.md §2.7` · `docs/tranches/CANONICAL-ORDERING.md §15–§16` · **live state-checks** (`gh run`, `curl`, repo `grep` at HEAD).
**Methodology**: every "current status" word resolves to the live HEAD tree, a `gh`/`curl` probe, or a FINAL.md close-record — never a charter's aspirational claim. G discharged a large slice of GA4's open body; this ledger records what G *actually* closed, what G *newly booked*, and the items execution *newly surfaced this session* — then grades the whole residue against H.

---

## §0 — Headline numbers

| Metric | Count |
|---|---|
| Total unique items inventoried (A→G lineage + this-session-new) | **30 live-distinct** (the GA4 18-open re-graded post-G + G's 6 booked + this-session-new, deduped) |
| CLOSED-by-G (confirm-close, no H action) | **6** (R1/β.2, β.1 contract source, γ legacy, δ perf, ε spine, inv-22 honest-scope) |
| OPEN needing an H disposition | **24** |
| → **FOLD-INTO-H** (fourier+deploy-actionable under inv-16) | **8** |
| → **CROSS-REPO** (user owns; ASK / bounded-sweep) | **9** |
| → **STAYS-OUT, re-affirmed with predicate** | **7** |
| **Chronically deferred (≥3 tranches, STILL open)** — §4 flag | **5** (C1, C5, C6, the **chronic CI-red/e2e**, the **DNS tuple drift**) |

**The honest headline.** G discharged the three F overstatements at root and the cheap transposition surface — but **execution this session newly exposed (or re-exposed) a chronic that all prior closes papered over: CI has been RED on 20/20 of the last runs.** The cause is a real, fourier-source Playwright strict-mode violation (two `input[type="file"]` elements now match the e2e locator). This converts the long-standing E2 "Playwright matrix" deferral from a *cosmetic UX-coverage* item into a **chronic broken-gate** item — it is no longer "stays-out, chromium suffices," because the chromium suite itself is failing. That is H's single most load-bearing fold. The genuinely-fourier-actionable H backlog is **8 items**; the rest are cross-repo (the 7 asks + api.color + csp-solver) or the perennial structurally-cross-repo chronics (C1/C5/C6).

---

## §1 — The master ledger

Legend — **Status**: OPEN / CLOSED-by-G. **Times-deferred** counts the gates an item has been carried OPEN (A→G = up to 7). **H-disposition**: FOLD-INTO-H / CROSS-REPO / STAYS-OUT / CLOSED-confirm.

| # | Item | Origin tranche | Times-deferred | H-disposition | Owner | One-line rationale |
|---|---|---|---|---|---|---|
| **H1** | **Chronic CI-red — e2e Playwright strict-mode violation** (`input[type="file"]` resolves to 2 elements; whole `contour-extraction.spec.ts` suite ✘) | D.W6 (as E2 AMBER), **newly root-caused this session** | **≥4** (D→E→F→G all red) | **FOLD-INTO-H** | fourier (`web/e2e/` + the 2nd file input) | **Live: 20/20 last CI runs FAILURE; api-tests + web-build now GREEN, e2e is the sole red.** A 1-line locator scope (`.first()` / role-scoped) repairs the gate. Chronic broken gate — §4 flag. |
| **H2** | **DNS tuple drift** — `scripts/dns-cf-sync.sh:93,95,97,99` carries generic `fourier.pages.dev`/`color`/`sudoku`/`keyframes` but live projects are `fourier-682`/`color-enw`/`sudoku-hoq`/`keyframes-8uq` | D.W8 (E-audit μ + D/FINAL §123) | **3** (D→E→F→G; never reconciled in tree) | **FOLD-INTO-H** | fourier | **Live-confirmed in tree at HEAD.** A re-run of the script would REGRESS the 4 proxied CNAMEs. Cosmetic-but-latent-footgun; a 4-line tuple edit. §4 flag (rotted 3 closes; "fold into close" promised at D, E, never done). |
| **H3** | **WORKERS=4 per-process rate bucket** — in-memory `SlidingWindowLimiter` is per-process → effective per-client ceiling ~4× the configured 180 | G.Wχ/W3 (β.2 residual) | 1 (G-new) | **FOLD-INTO-H** | fourier | `api/Dockerfile:32` + `rate_limiter.py:148-150` name it honestly. Real fix = shared store (Redis) OR `WORKERS=1`. The genuine single-bucket completion of G's β.2 per-client claim. |
| **H4** | **Compose hardening floor — frontend/mongo/nginx `read_only`+`cap_drop`** (backend is at FULL floor; the other 3 carry only `no-new-privileges`) | G.W7 (ε residual) + Ask-4-fourier-half | 1 (G-new) | **FOLD-INTO-H** | fourier | `docker-compose.prod.yml` verified: backend full, others `security_opt` only. Needs per-image tmpfs/cap staging test (mongo stateful → read_only impossible; nginx/frontend bind privileged ports). Bounded staging-test wave. |
| **H5** | **4th hand-type island** — `web/src/lib/equation/types.ts` (10 importers; `FourierTermDTO`/`ComputeEquationResponse`/…) | G.W2/W4 (β.1 residual) | 1 (G-new) | **FOLD-INTO-H** (bounded; assess-then-decide) | fourier | A distinct equation-domain contract, **not** a duplicate of the inv-26-collapsed boundary. H assesses whether a `response_model` transposition collapses it to the API source; if not a true duplicate, re-affirm OUT. Do NOT force-fold if it's a genuine separate surface. |
| **H6** | **CSP `font-src 'self'` / `_headers`** — now possible (0 third-party font origins post-G.δ); no `_headers` file exists yet | G.W5 (δ bonus) | 1 (G-new) | **FOLD-INTO-H** (cheap hardening) | fourier | `find web -name _headers` → none. A CF Pages `_headers` with `font-src 'self'; style-src 'self'` is a real defense-in-depth win unlocked by G's self-host work. Single small file. |
| **H7** | **Host `render-hooks.sh` not-yet-applied** — the executable secret-render wrapper exists in `mkbabb/deploy` but the live host `hooks.json` is still the hand-inlined file | G.W6 (ε.1 operator residual) | 1 (G-new) | **FOLD-INTO-H** (operator-coordinated) | operator + fourier-coord | `G/waves/W6.md §Residual`: rendering live `hooks.json` from the wrapper needs the host `secrets.env` (inv-21 single-window; not in fourier's tree). H tracks the gate + runbook; the host op is operator-performed. |
| **H8** | **nginx bind-mount inode staleness on auto-deploy** | G.W3 (booked → W7) | 0 (DISCHARGED G.W7) | **CLOSED-confirm** | — | G.W7 (`a7b58ab`) made deploy-hook `--force-recreate nginx` on an `nginx/` diff + backported to template. Listed for completeness; closed. |
| **R1** | Real-client-IP / rate-limit per-client correctness (nginx `real_ip` + XFF-hop) | F.W1 | 0 (CLOSED-by-G) | **CLOSED-confirm** | — | G.β.2: nginx `real_ip` + `get_client_ip` (X-Real-IP), dropped `--proxy-headers`, budget 1200→180, **spoof-proven live**. The strongest GA4 candidate — discharged. (WORKERS=4 = H3 is the remaining sub-residual.) |
| **β.1** | api↔web 3 type sources → 1 | GA5/G.β.1 | 0 (CLOSED-by-G) | **CLOSED-confirm** | — | inv-26: deleted unused 65 KB codegen; folded inline → `types.ts`. grep-clean. (4th island = H5 carries.) |
| **γ** | NO-legacy excision (`like_limiter`, 6 exports, `GalleryEntry`, `datetime.utcnow`) | GA5/G.γ | 0 (CLOSED-by-G) | **CLOSED-confirm** | — | All grep-proven zero. |
| **δ** | LCP-path 3 third-party origins → 0; Lighthouse prod 95/dev 94 | GA5/G.δ | 0 (CLOSED-by-G) | **CLOSED-confirm** | — | Self-host fonts + KaTeX bundler-import; receipts under `G/receipts/`. |
| **inv-22-sym** | F-Inv 22* "symmetric" overstatement | F.W1 | 0 (CLOSED-by-G honesty) | **CLOSED-confirm** | — | `INVARIANTS §2.7` reconciled to fourier-enforced + cross-repo aspiration. |
| **C1** | Colour-lift `sampleToSVGPath` consume (`easings.ts`) | A.W2.b | **7** (A→B→C→D→E→F→G) | **STAYS-OUT** (re-affirm) | value.js maintainer | value.js@0.10.0 still exports only `cubicBezierToSVG`. Predicate: **fires iff value.js publishes the helper.** Structurally cross-repo; inv-16. §4 flag. |
| **C5** | glass-ui 7-item substrate carries | A.W0 | **7** (A→…→G) | **STAYS-OUT** (re-affirm) | glass-ui maintainer | No glass-ui substrate tranche since v2.0.0. Predicate: **consume via dep bump iff a glass-ui surface tranche opens.** inv-16. §4 flag. |
| **C6** | glass-ui `style.css:3` cold-boot race | A.W3.5.d | **7** (A→…→G) | **STAYS-OUT** (re-affirm) | glass-ui maintainer | Same substrate root as C5; never a prod blocker. Predicate: **opens when glass-ui addresses cold-boot ordering.** §4 flag. |
| **C2** | Full `Palette`/`colorScale` value.js domain model | B.W2 | 5 (B→…→G, latent) | **STAYS-OUT** | value.js | inv-15 (no library nobody calls); zero fourier consumer surfaced through G. |
| **C7** | 6 §U conformance strikes (never-built-by-design) | B.W1 | 5 (latent) | **STAYS-OUT** | — | WONTFIX-revive-if-built; not a debt, a never-built affordance. |
| **N3** | W11 FULL palette-api→color rename (host dir/compose/volume) | D.W11 | 4 (cosmetic) | **STAYS-OUT** | operator | URL-layer GREEN (`api.color.babb.dev`); data-volume orphan risk > cosmetic benefit; operator-scheduled-downtime, not fourier's. |
| **E4** | Per-call-site If-Match/Idempotency-Key (~5 sites) | E.W5+W6 | 3 (decorative) | **CROSS-REPO** (value.js-J) | value.js-J / I-tail | Plumbed; per-site adoption decorative; rides a consumer-touch wave. |
| **E5** | Idempotency-Key API-side replay store | E.W4 | 3 | **CROSS-REPO** (value.js-J) | value.js-J | G.§7 explicitly defers to value.js-J. Replay store belongs there. |
| **E6** | Per-repo conformance suite (value.js side) | I.W4 | 3 | **CROSS-REPO** (value.js-J) | value.js-J | T7 probe covers the contract from fourier's side. |
| **E7** | `id`-field hard-removal from palette envelope | I.W4 | 3 | **CROSS-REPO** (value.js-J) | value.js-J | Cross-repo source (inv-16). G.§7 names value.js-J owner. |
| **F-T-N1** | palette `status`-field drop (paired demo) | F.ε | 2 | **CROSS-REPO** (ASK) | value.js maintainer | Doc-ASK authored at F; value.js maintainer commits. inv-16. |
| **ASK-1** | Adopt `ci.yml` (no CI today) | F.W12 / C8-fwd | 2 (re-affirmed F,G) | **CROSS-REPO** (ASK) | words, speedtest, csp-solver maintainers | Maturity gap, not a live regression. 30-day stale-watch re-affirm. |
| **ASK-2** | Adopt hardened `deploy-hook.sh` + per-repo `hooks.json` arm | F.W12 | 2 | **CROSS-REPO** (ASK) | words, speedtest, csp-solver | Gating predicate for dispatcher retirement. |
| **ASK-3** | value.js/palette-api rsync-dir → git checkout, then hook (N1 real fix) | F.W12 | 2 (highest-urgency) | **CROSS-REPO** (ASK) | value.js maintainer | The one latent-broken arm; gating 4th migration for `dispatch.sh` rm. |
| **ASK-5** | Frontend-hosting convergence to CF Pages (retire peaceiris) | F.W12 | 2 | **CROSS-REPO** (ASK) | value.js, keyframes maintainers | Subsumes N5/N6; consistency/drift, not correctness. |
| **ASK-6 / N4** | csp-solver register `/solve` route | D.W9 / F.W12 | 3 | **CROSS-REPO** (ASK) | csp-solver maintainer | **Live: `/solve`→404 (still broken); `/openapi.json`→200 (improved since ask written).** 1-line `app.include_router`. External repo. |
| **ASK-7 / N7** | floridify/words Mongo-bind upstream hardening | D.W1 / F.W12 | 3 | **CROSS-REPO** (ASK) | floridify maintainer | External repo; internal-only bind posture. ASK-only. |
| **inv-22-color** | `api.color` 4-endpoint vhost contract | G.W8 (ζ-new) | 1 | **CROSS-REPO** (ASK) | value.js maintainer | **Live-confirmed: `api.color/`→200, `/health`→404.** value.js-owned (inv-16); booked `ADOPTION-ASKS §4`. Rides Ask-5. |
| **R3** | `dispatch.sh` full retirement | F.W3b | 2 | **CROSS-REPO** (coordination + host op) | operator + maintainers | Gated on all 4 non-fourier repos adopting `deploy-hook.sh` (Asks 2+3). Single host op once the 4th lands. |
| **L1** | Rate-limiter Option B (Mongo TTL bucket; multi-replica) | A.W4 | latent | **STAYS-OUT** | — | Trigger-gated on a real multi-replica need (C-Inv 19′ single-replica holds). **Note: H3 (WORKERS=4) is the *single-host correctness* fix; L1 is the *horizontal-scale* fix — distinct.** |
| **L2** | Multi-replica fourier deployment | A.W4 | latent | **STAYS-OUT** | — | C-Inv 19′; trigger-gated; pairs with L1. |
| **L3** | `image_blobs` consistent-snapshot DR cron | C.W5/D.W2 | latent | **STAYS-OUT** (infra-wave-if-triggered) | host-ops | `external: true` guard + single-`update_one` atomicity make the hazard non-firing; fold to an infra wave only if a backup obligation surfaces. |
| **L4** | slug-words precepts-submodule relocation | B.W3 | latent | **STAYS-OUT** | — | inv-16 "extract on 2nd consumer"; still 1 consumer. Premature. |

> **Node-version note (investigated, NOT an open item):** the prompt flagged a possible "Node20→24 Actions deprecation." Verified live — `ci.yml` + `deploy-pages.yml` use `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4` with `node-version: "22"`. No Node20 runner pin, no deprecated action major. **No item booked.** (If H wants future-proofing, a Node 22→24 bump is optional hygiene, not a deferral.)

> **CLOSED-by-F items (re-confirmed, not re-listed):** C3, C4, C8-fourier-subset, C9, N1-isolation, N2, N5, N6, N8–N11, E1, E3, the dead `:8140` vhost, the webhook regression — all CLOSED-by-F and re-confirmed by G's close. See `GA4 §1` for their full provenance; none needs an H disposition.

---

## §2 — The three H buckets (decision summary)

### FOLD-INTO-H — the actionable H backlog (8 items, fourier+deploy under inv-16)

The genuinely fourier-source/host-coordinated work H should carry:

1. **H1 — repair the chronic CI-red e2e suite** *(LOAD-BEARING; broken gate)*. Scope the `input[type="file"]` locator (`.first()` or role-scoped) so `contour-extraction.spec.ts` passes; restore CI green. **This is H's single most important fold** — it is a broken gate masquerading as a "matrix-coverage" deferral (the old E2). Do not re-defer.
2. **H2 — reconcile the DNS tuple drift** in `scripts/dns-cf-sync.sh` (4 generic `*.pages.dev` → the auto-suffixed live projects). Closes a 3-close-old latent CNAME-regression footgun; ~4-line edit.
3. **H3 — WORKERS=4 single-bucket completion** (shared store or `WORKERS=1`) — the honest completion of G.β.2's per-client claim.
4. **H4 — compose hardening floor** for frontend/mongo/nginx (bounded per-image staging test; the Ask-4-fourier-half tail).
5. **H5 — 4th hand-type island** assessment (response_model transposition *iff* it's a true duplicate; else re-affirm OUT with the "distinct contract surface" predicate).
6. **H6 — CSP `font-src 'self'` `_headers`** (cheap defense-in-depth unlocked by G.δ).
7. **H7 — host `render-hooks.sh` application** (operator-coordinated; H tracks the gate, operator performs the single-window host op).
8. *(H8 nginx-inode is CLOSED-by-G — listed for lineage only.)*

### CROSS-REPO — the user owns it (9 live; ASK or bounded sweep)

The 7 adoption asks + api.color + csp-solver `/solve`, all inv-16 maintainer-owned. H re-triggers the 30-day stale-watch (`ADOPTION-ASKS.md §4`) and may authorize a **bounded coordination sweep** (re-affirm / re-prioritize / close-on-landing), but commits NOTHING to another repo:

- **ASK-1** (CI template — words/speedtest/csp-solver), **ASK-2** (deploy-hook arm), **ASK-3** (value.js rsync→git — highest urgency, gating), **ASK-5** (CF Pages convergence — value.js/keyframes), **ASK-6/N4** (csp-solver `/solve` — **still 404 live**), **ASK-7/N7** (floridify Mongo-bind), **inv-22-color** (`api.color` — **`/health` 404 live**), plus the value.js-J successor cluster (**E4/E5/E6/E7, F-T-N1**), plus **R3** (`dispatch.sh` retirement — coordination + a single gated host op).

### STAYS-OUT, re-affirmed with binding predicate (7; do NOT silently re-defer)

| Item | Binding gating predicate (the hold's honest condition) |
|---|---|
| **C1** colour-lift | Fires iff **value.js publishes `sampleToSVGPath`**; today exports only `cubicBezierToSVG`. The `easings.ts` no-silent-orphan watchdog keeps it honest. |
| **C5** glass-ui 7-item carries | Consume via dep bump iff **a glass-ui surface tranche opens** (none since v2.0.0). |
| **C6** glass-ui cold-boot race | Opens iff **glass-ui addresses the cold-boot ordering**; never a prod blocker. |
| **C2** value.js domain model | Opens iff **a fourier consumer surfaces** (inv-15 — no library nobody calls). |
| **C7** §U conformance strikes | WONTFIX **unless the affordance is built** (never-built-by-design). |
| **N3** palette-api→color host rename | Operator-scheduled-downtime iff **the cosmetic benefit outweighs the data-volume orphan risk** (it does not today). |
| **L1/L2/L3/L4** latent set | Each trigger-gated: **multi-replica need** (L1/L2), **a backup obligation** (L3), **a 2nd slug-words consumer** (L4). None fired. |

---

## §3 — Disposition counts

- **CLOSED-confirm (no H action)**: R1/β.2, β.1, γ, δ, inv-22-sym, H8-nginx-inode — **6** G-discharges + the full A→F closed body (GA4 §1) re-confirmed.
- **FOLD-INTO-H**: H1, H2, H3, H4, H5, H6, H7 — **7 fourier-actionable** (H1 the load-bearing broken-gate; H7 operator-coordinated).
- **CROSS-REPO**: ASK-1/2/3/5/6/7, inv-22-color, R3, + the value.js-J cluster (E4/E5/E6/E7, F-T-N1) — **9 live ASK-bands** (12 rows). H re-triggers the stale-watch; commits nothing (inv-16).
- **STAYS-OUT-with-predicate**: C1, C5, C6, C2, C7, N3, L1/L2/L3/L4 — the perennial cross-repo + never-built + cosmetic + latent body, each re-affirmed with its gating condition above.

---

## §4 — FLAG: chronically deferred (≥3 tranches, STILL open) — the ones the user wants FOLDED, not re-deferred

Five items meet the chronic bar. **Three are structurally cross-repo (correctly STAYS-OUT); two are fourier-source and MUST fold into H.**

### The two NEW chronics this session surfaced — these are the discipline failures the directive targets:

1. **H1 — the chronic CI-red (e2e Playwright suite)** — **broken ≥4 gates (D→E→F→G)**, and **20/20 of the last CI runs are FAILURE (live `gh run`)**. Prior closes treated it as the cosmetic "E2 cross-env matrix" deferral and re-affirmed STAYS-OUT at G.W8 ("chromium suffices") — **but the chromium suite itself is red** on a real strict-mode locator violation (two `input[type="file"]` now match). This is the textbook *silently-rotting* item: a green-looking deferral hiding a red gate. **FOLD-INTO-H, top priority. Do not re-defer.**
2. **H2 — the DNS tuple drift** in `scripts/dns-cf-sync.sh` — **deferred 3 closes (D→E→F→G)**. D/FINAL §123 and the E-audit (μ) BOTH said "fold into the close-reconcile"; neither D, E, F, nor G did. Live tree at HEAD still carries `fourier.pages.dev` (not `fourier-682`), so a re-run regresses the live CNAMEs. A 4-line edit that has out-survived three promises to fix it. **FOLD-INTO-H.**

### The three structurally-cross-repo chronics — STAYS-OUT is correct, but re-affirm the predicate (now 7-gate):

3. **C1 — colour-lift** (**7 gates A→G**). value.js publish-bound. Re-affirm STAYS-OUT; predicate above. inv-16.
4. **C5 — glass-ui 7-item carries** (**7 gates**). glass-ui substrate-tranche-bound. Re-affirm STAYS-OUT.
5. **C6 — glass-ui cold-boot race** (**7 gates**). Same substrate root. Re-affirm STAYS-OUT.

These three are *perennially-deferred-BECAUSE-cross-repo*, not neglected — inv-16 forbids fourier annexing them. The flag's purpose (the discipline F/G's ledgers established): re-state the hold + the gating predicate each tranche so the deferral stays honest indefinitely rather than rotting unbooked. **Note C8** is NOT re-flagged (F broke its back; the residue is the 7 owner-named asks).

---

## §5 — Headline finding

G honestly discharged the three F overstatements and the cheap transposition surface (R1 real-client-IP, β.1 contract source, γ legacy, δ perf, inv-22 honest-scope) — and **refused to widen a residual to mask a defect**, which is the right discipline. But **G's own gate-table claims `T7 12/12` and `pytest 132/83` while NEVER citing the e2e job — and that job is RED on 20/20 of the last CI runs** (a real fourier-source Playwright strict-mode violation: two `input[type="file"]` elements now match the e2e locator). That broken gate has rotted ≥4 closes disguised as the cosmetic "E2 matrix" deferral. It is **H's single most load-bearing fold (H1)**. Alongside it, the **DNS tuple drift (H2)** has out-survived three explicit promises to reconcile it. The genuinely fourier-actionable H backlog is **7 items** (H1 CI-repair · H2 DNS reconcile · H3 WORKERS=4 single-bucket · H4 compose floor · H5 4th-island assess · H6 CSP `_headers` · H7 render-hooks host-apply); **9 live items are cross-repo** (the 7 asks + api.color + csp-solver `/solve`, all confirmed still-open by live `curl`) and re-enter the 30-day stale-watch under inv-16; **C1/C5/C6 stay out at 7 gates** with their predicates re-stated so they do not silently re-defer an 8th time. **Nothing is left un-booked.**

End of HA4-chronic-deferred.md.
