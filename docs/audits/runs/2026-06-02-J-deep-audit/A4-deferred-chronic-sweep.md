# A4 — DEFERRED & CHRONIC-DEFERRAL SWEEP (J deep audit)

**Auditor**: A4 — the consolidated deferred/booked/residual ledger across BOTH repos' full tranche history (fourier A–J, value.js A–J), plus the constellation `ADOPTION-ASKS.md` and `INVARIANTS.md`.
**Date**: 2026-06-02. **Scope**: tranche-development audit only (no implementation). Verdict + fold recommendations.

**Governing precepts** (binding on every recommendation): no workarounds / gestalt only; no legacy; KISS (single-parent linear remix, atom-diff as PATTERN not package); inv-15 substrate-without-consumer-is-binary; inv-16/16′ cross-repo boundary; inv-26 single-contract-source; inv-27 green-means-green; inv-29 progressive-enhancement-floor; inv-30 platform-over-library.

**The user's standing demand** (re-asserted every tranche-open from F onward): *delineate chronically-deferred items and FOLD them — no perpetual punts.* This audit enforces resolve-or-kill on every chronic, justified-continued-book only behind a NAMED hard external gate.

---

## §1 — The consolidated ledger

Status legend: EXECUTED (landed + verified) · BOOKED (named-forward, owner+gate) · DEFERRED (named-successor, no hard gate) · CHRONIC (deferred ≥2 tranches) · DISCLAIMED (other-repo concern) · DECLINED (recorded-not-deferred) · RETIRED (moot/withdrawn).

### 1a — fourier-analysis residuals

| # | Item | Origin | Repo | Owner | Status | Deferred-count | Folds into J? |
|---|---|---|---|---|---|---|---|
| F-1 | Real-client-IP behind 2-hop Apache→nginx (rate-limit shared bucket) | F.α | fourier | infra-successor | EXECUTED (G.β.2) | F→G = 1, then resolved | NO — closed at G (nginx `real_ip` + `get_client_ip`/X-Real-IP; spoof-proven live) |
| F-2 | WORKERS=4 per-process rate bucket | G.β.2 §4 | fourier | fourier-successor | EXECUTED (H.β) | G→H = 1, then resolved | NO — closed at H (`WORKERS=1`; budgets honest hard caps; + un-booked `_suspended_cache` bug fixed) |
| F-3 | Compose hardening — frontend/mongo/nginx `read_only`+`cap_drop` | G.ε §4 | fourier | fourier-successor | EXECUTED (H.γ) | G→H = 1, then resolved | NO — closed at H (frontend+nginx full floor; mongo stateful-exempt; verified compose-config) |
| F-4 | CSP `font-src 'self'` / `_headers` | G.δ §4 | fourier | fourier-successor | EXECUTED (H.γ) | G→H = 1, then resolved | NO — closed at H (`web/public/_headers` CSP, verified against built app) |
| F-5 | 4th hand-type island `web/src/lib/equation/types.ts` | G.β.1 §4 | fourier | (noted out-of-scope) | DECLINED-AS-NOT-A-DUPLICATE | G→H mention | NO — distinct equation-domain contract (10 importers), not an inv-26 boundary duplicate; correctly out of scope. Confirm-once. |
| F-6 | Cross-env Playwright matrix GREEN (D.W6 AMBER) | D.W6 | fourier | fourier-F→G | EXECUTED (H.α) | D→E→F→G = 3 | NO — superseded by H.α e2e repair (40 passed / 7 booked fixmes; CI run `26773946417`) |
| F-7 | e2e/axe CI evidence (γ LCP/INP delta, δ scroll-anchor pass, remix-flow e2e) | I.γ/I.δ | fourier | J | **BOOKED** | I = 1 (first book) | **YES — J.W5** (the inv-27 green claim I could not make in-session) |
| F-8 | `scheduler.yield()` on epicycle/gallery hot paths (highest remaining INP lever) | I.ι | fourier | J | **BOOKED** | I = 1 (named, never executed) | **YES — J.W3** |
| F-9 | `content-visibility` on the gallery grid (unapplied `.deferred-section` consumer) | A3 audit / I gap | fourier | J | **BOOKED** | discovered, never booked-as-defer | **YES — J.W4** |
| F-10 | Per-consumer CSP propagation (H.γ recipe) + `fetchLater()` analytics batching | I.ι | fourier | J + owner-repos | **BOOKED** | I = 1 | **YES — J.W6** (fourier's own CSP already shipped H.γ/I.θ; per-consumer arm is inv-16′ ask) |
| F-11 | WebMCP tool surface (`remix-visualization`, `diff-visualizations`) | J authored | fourier | K (named successor) | **BOOKED — Early-Preview** (Chromium 146+flag) | new in J | NO (named-forward, not a J wave) — hard external gate: Chromium 146 stable. Endpoints authored agent-legibly NOW. |
| F-12 | CSS Custom Highlight diff render (audit G6) | J authored | fourier | J | EXECUTED-AS-LEAF | new in J | YES — rides the CORE consumer surface in W5 axe pass |
| F-13 | DAG/merge/rebase/CRDT remix model | J authored | fourier | — | **DECLINED** (single-parent linear only — the KISS line) | — | NO — correctly declined; a multi-parent need is a different primitive in a different tranche |
| F-14 | Cross-viz subject remix (changing `image_slug`/`contour_hash`) | J authored | fourier | — | **DECLINED** | — | NO — that is a new visualization, not a descendant |
| F-15 | Shared atom-diff PACKAGE / OpenAPI→TS codegen revival | J authored | fourier | — | **DECLINED** (inv-16 PATTERN-not-package; inv-26 hand-typed-canonical) | — | NO — H.δ decline holds (raw-`Response` ETag/projection cannot be honestly codegen'd) |
| F-16 | passkeys | I.ι | fourier | named residual | **BOOKED** | I→J = 1 | NO (named-forward) — hard gate: no app owns a credential surface |
| F-17 | Idempotency-Key API-side replay store (server-side) | E.W10 | fourier | value.js-J / I-tail | DISCLAIMED-TO-VALUE.JS | E→F→I = 2+ | NO — plumbing LIVE on fourier consumers; the server replay store is value.js-J's surface (it owns the palette-api). Legitimate. |
| F-18 | csp-solver `useApi.ts` VITE_API_URL + route-registration (N4) | D.§6.2 | fourier-coord | csp-solver maintainer | **BOOKED** (Ask 6) | D→E→F→G→H = 4 | NO — inv-16 cross-repo; lives in `ADOPTION-ASKS.md`. CHRONIC (see §2). |
| F-19 | floridify Mongo-bind upstream hardening (N7) | D.§7 | fourier-coord | floridify maintainer | **BOOKED** (Ask 7) | D→E→F→G→H = 4 | NO — inv-16 cross-repo. CHRONIC (see §2). |
| F-20 | `dispatch.sh` full retirement | E.T-S3 | fourier-coord | operator + 4 maintainers | **BOOKED-GATED** (Ask 2/3) | E→F→G→H = 3 | NO — hard gate: all 4 non-fourier repos adopt `deploy-hook.sh`. CHRONIC (see §2). |
| F-21 | 7 cross-repo adoption asks (CI / hardening / CF-Pages convergence / palette-api git / etc.) | F.ζ.4 | fourier-coord | per-repo maintainers | **BOOKED** (Asks 1–7) | F→G→H = 2 | NO — inv-16 maintainer-owned. CHRONIC bucket (see §2). |
| F-22 | render-hooks host application + inv-28 API-arm PAT | H.ζ | fourier-coord | operator/credential-gated | **BOOKED** | H = 1 | NO — hard gate: host secret (read-only PAT). Working-chain-safe. inv-21. Legitimate gated-book. |
| F-23 | glass-ui-a11y `inert` on `ConfiguratorLayer` (axe `aria-hidden-focus` serious) | H.W1 | fourier-coord | glass-ui maintainer | **BOOKED** (test.fixme'd) | H→I = 1 | NO — inv-16′; un-fixme on glass-ui `inert` release + guarded `^2→^3` bump. Hard gate: upstream release. |
| F-24 | inv-22 `api.color` 4-endpoint vhost contract | G.ζ | fourier-coord | value.js maintainer | **BOOKED** (inv-22-color) | G→H = 1 | NO — value.js-owned vhost; honest `F-Inv 22*` scope. CHRONIC-adjacent (see §2). |
| F-25 | C9 invariant-numbering reconciliation | C | fourier | docs | EXECUTED (F.W6) | C→D→E = 2 | NO — closed at F (`INVARIANTS.md` canonical ledger). Was CHRONIC, now resolved. |
| F-26 | C4 chronic — ONNX logging flood | (C-era) | fourier | fourier | EXECUTED (F.W0) | carried to F | NO — closed at F (`ORT_LOGGING_LEVEL=3`). Was CHRONIC, now resolved. |
| F-27 | C1 colour-lift (`sampleToSVGPath` consume) | B.δ → C.δ → D.δ | fourier | value.js-publish-bound | **BOOKED-GATED / CHRONIC** | B→C→D→G = 3+ | NO — hard gate: value.js must EXPORT `sampleToSVGPath` (v0.10.0 does not). value.js-owned. See §2. |
| F-28 | C5 glass-ui substrate carries / C6 glass-ui cold-boot race | G.ζ | fourier-coord | glass-ui maintainer | **BOOKED-GATED / CHRONIC** | re-affirmed G→H | NO — inv-16 binds out; glass-ui-rooted. See §2. |
| F-29 | W11 FULL palette-api → color rename (container/dir/volume) | D.§6 | fourier-coord | operator | **BOOKED** (cosmetic) | D→E→F = 2 | NO — URL-layer GREEN; data-bearing volume orphan-risk; operator scheduled-downtime window. CHRONIC-cosmetic (see §2). |
| F-30 | `id` field hard-removal from response envelope (value.js side) | I (value.js) | value.js | value.js-J | **BOOKED** | I→J = 1 | NO — value.js-J's W4 sub-item. Legitimate. |

### 1b — value.js residuals

| # | Item | Origin | Repo | Owner | Status | Deferred-count | Folds into J? |
|---|---|---|---|---|---|---|---|
| V-1 | **VAL-9** `spring()→LinearStop[]` emitter | constellation chronic (A3 §2) | value.js | value.js-J (binary-gated) | **BOOKED-GATED / CHRONIC** | G→H→I→J = 3 | value.js-J.W4 (ship IFF ≥2-consumer; else re-book). DISCLAIMED by fourier-J (correctly). See §2 + §4. |
| V-2 | **VAL-1** OKLab aurora-LUT | constellation chronic (A3 §2) | value.js | value.js-J (binary-gated) | **BOOKED-GATED / CHRONIC** | G→H→I→J = 3 | value.js-J.W4 (ship IFF glass-ui `deriveAurora()` + 2nd consumer; else re-book). DISCLAIMED by fourier-J (correctly). See §2 + §4. |
| V-3 | Idempotency-Key API-side replay store | I (value.js) | value.js | value.js-J | **BOOKED** | I→J = 1 | value.js-J.W4 (plumbing LIVE on both consumers since I). Legitimate fold. |
| V-4 | Per-repo conformance suite `api/test/conformance/` | I (value.js) | value.js | value.js-J | **BOOKED** | I→J = 1 | value.js-J.W4 (T7 cross-repo probe LIVE at fourier-E; per-repo suite is the tail). Legitimate fold. |
| V-5 | Per-call-site `ifMatch`/`idempotencyKey` adoption on demo callers | I (value.js) | value.js | value.js-J | **BOOKED** | I→J = 1 | value.js-J.W4 (bounded but voluminous; lands w/ replay store). Legitimate. |
| V-6 | 7–8 glass-ui primitive asks (Aurora derive; BlobDot; SelectTrigger size; DockSelectTrigger clampLabel; TooltipContent variant; Button icon-sm; Tabs underline; Metaballs) | value.js Q-era | value.js | glass-ui (peer-authorship) | **BOOKED-GATED / CHRONIC** | A→…→H = "6-tranche carry" | glass-ui's next non-AK tranche-open. Peer-authorship. See §2. |
| V-7 | Contract-v2 §2.1 font-asset residual (glass-ui `dist/glass-ui.css` font-inlining) | value.js E | value.js | glass-ui maintainer | **BOOKED-GATED / CHRONIC** | E→F→G = 2 | Re-check at glass-ui `dist/glass-ui.css` next-publish (currently 0 `@font-face`). See §2. |
| V-8 | `lerpLegacy` retirement | value.js E→F | value.js | value.js | EXECUTED (F) | E→F = 1, then resolved | F headline "lerpLegacy retirement". |
| V-9 | Library `Palette`/`colorScale`/`sampleToSVGPath` domain model (Axis 2 residue) | value.js C | value.js | conditional future-tranche | **PARKED** (not deferred) | C-era | Opens only on user re-mandate. Legitimate park (no roadmap claim). Note: this is the SUPPLY side of F-27 (C1). |
| V-10 | CRUD-CONTRACT.md ratification (Axis 3) | value.js C | value.js | — | **DISSOLVED-NOT-DEFERRED** | C-era | Cohort dissolved when fourier-B did not pull; later REVIVED+CLOSED via value.js-I (Scenario A). Resolved. |
| V-11 | G2 `fetchLater()` analytics (value.js side) | value.js J | value.js | value.js | **BOOKED** | new in J | No value.js consumer surface earns it; named-forward. Legitimate. |
| V-12 | G4 Summarizer/Writer (palette blurb) | value.js J | value.js | value.js | **BOOKED — demo-or-drop** | new in J | Overfitting risk; booked unless a J.W3 demo earns it. Legitimate. |
| V-13 | G5 WebMCP agentic tools (palette side) | value.js J | value.js | value.js-K | **BOOKED — Early-Preview** | new in J | Hard gate: Chromium 146. Twin of F-11. Legitimate. |
| V-14 | passkeys (value.js side) | value.js J | value.js | named residual | **BOOKED** | new in J | No credential surface. Twin of F-16. Legitimate. |
| V-15 | Three-way merge / DAG remix; multi-replica palette-api | value.js J | value.js | — | **DECLINED / out-of-scope** | — | inv-J-1 KISS + inv-12. Correctly declined. |

### 1c — INVARIANTS.md booked / provisional

| # | Item | Origin | Status | Folds into J? |
|---|---|---|---|---|
| I-1 | inv-31 reservation ("a remix must change ≥1 atom") | J.§5 | **PROVISIONALLY NOT RESERVED** | YES — recorded at J close as fresh integer 31 IFF W2 surfaces it as a named contract (vs a bare 422). Clean sequence. Legitimate. |
| I-2 | `F-Inv 22*` cross-repo aspiration (color vhost) | G.ζ | BOOKED as coordination | = F-24; honest-scoped, not a fourier residual. |
| I-3 | inv-28/29/30 namespace collisions w/ glass-ui precepts | H/I | RESOLVED (namespace-partitioned) | NO — purely documentary; resolved at authoring. |

---

## §2 — CHRONIC classification (deferred ≥2 tranches) + resolve-or-kill decision

A chronic is any item deferred across ≥2 tranches. The user forbids perpetual punts: each gets RESOLVE-NOW, KILL, or JUSTIFIED-GATED-BOOK (with a NAMED hard external gate). No re-defer without a gate.

| Chronic | Deferral chain | Decision | Rationale |
|---|---|---|---|
| **CH-1 — VAL-9** `spring()→LinearStop[]` emitter (V-1) | G→H→I→J (3×) | **RESOLVE-NOW-OR-KILL at value.js-J.W0** | This is the most-deferred substrate edge in the constellation and it has a CONCRETE binary gate that J.W0 can EVALUATE NOW: does lifting the emitter to value.js de-dup keyframes⇄glass-ui at HEAD? The W0 evidence is already in hand (glass-ui's `regen-spring-tokens.mjs` imports `springLinearStops` from keyframes). J.W0 must render a SHIP or KILL verdict — not a 4th book. If the 2nd consumer does not exist at HEAD, KILL it explicitly (keyframes owns the emitter; value.js lifting it is substrate-without-consumer = binary = not shipped). Re-booking a 4th time violates the user's no-perpetual-punt demand. **fourier disclaims correctly (V-1 is value.js's surface).** |
| **CH-2 — VAL-1** OKLab aurora-LUT (V-2) | G→H→I→J (3×) | **JUSTIFIED-GATED-BOOK — but with a HARD KILL-DATE** | Hard external gate is NAMED and legitimate: glass-ui must actually adopt `deriveAurora()` (speedtest AS-GU-1) + a 2nd consumer. This is genuinely outside value.js's control (glass-ui-owned). BUT after 3 deferrals the gate must become a kill-date: if glass-ui's AQ aurora state does NOT consume it by the value.js-J.W0 re-check, the book converts to KILL (the conversion math stays in `oklab.ts` as already-shipped; the LUT sampling layer is simply not built). Do NOT carry a 4th time as an open book. **fourier disclaims correctly.** |
| **CH-3 — C1 colour-lift** `sampleToSVGPath` consume (F-27 / V-9 supply side) | B→C→D→G (3×) | **KILL the consume-ask; KEEP the supply as PARKED** | This is a two-repo deadlock: fourier-C/D booked a CONSUME that depends on value.js EXPORTING `sampleToSVGPath`, while value.js-C PARKED that very export as a conditional-future-tranche (V-9) with no roadmap. Neither side will move without the other → a perpetual punt by construction. RESOLVE by KILLING the fourier-side consume-ask: `easings.ts` is byte-identical and self-sufficient; there is no fourier consumer that needs the value.js export (inv-15 — substrate-without-consumer). The value.js supply stays legitimately PARKED (user-re-mandate-gated, no roadmap claim). The deadlock dissolves: nothing is owed. |
| **CH-4 — `dispatch.sh` full retirement** (F-20) | E→F→G→H (3×) | **JUSTIFIED-GATED-BOOK** (hard gate named) | The gate is real and mechanical: deleting `dispatch.sh` before all 4 non-fourier repos adopt `deploy-hook.sh` would 404 their deploy path. This is NOT a punt — per-repo URL+HMAC isolation is already DONE (F.W3b); only the final `rm` is gated. The gate is the 4th migration (Ask 3, value.js palette-api git-checkout). Legitimate continued-book; the hard gate is "Ask 2/3 acceptance green on all 4." Keep booked. |
| **CH-5 — The 7 constellation adoption asks** (F-18, F-19, F-21, F-24) | D/E/F→G→H (2–4×) | **JUSTIFIED-GATED-BOOK with a TRIAGE** | These are inv-16 maintainer-owned — fourier holds no lever, so fourier cannot RESOLVE them. But "maintainer-owned" must not become a forever-shelf. TRIAGE by priority: **P1 critical-path (Ask 3 value.js palette-api git-checkout)** is the gating 4th migration for CH-4 → escalate, it blocks a real retirement. **P2 correctness (Ask 6 csp-solver routes 404; Ask 7 floridify Mongo-bind)** are live-adjacent → keep booked with the 30-day stale-watch. **P3 hygiene (Ask 1 CI; Ask 4 hardening; Ask 5 CF-Pages convergence)** are drift, not fire → keep booked, lowest urgency. The stale-watch is the mechanism; it is honest. No fourier fold (inv-16). |
| **CH-6 — glass-ui primitive asks** (V-6, the value.js "6-tranche carry") | value.js A→…→H (6×!) | **FORCE A TERMINAL VERDICT at value.js-J.W0** | Six tranches is the worst chronic in either repo. Peer-authorship-required is a real constraint (glass-ui-owned), but a 6-tranche carry is exactly the "silent rotting" the user forbids. DECISION: at value.js-J.W0 each of the 7–8 asks gets a terminal verdict — KILL-AS-MOOT (the demo no longer needs the primitive), or RE-EXPRESS-AS-inv-16′-ASK (a precise, file-verified ADOPTION-ASKS entry with a hard gate = glass-ui's next tranche-open), or SHIP (if glass-ui already added it). No 7th carry as an open book. value.js-J names them; the user's "delineate + fold" demand is the trigger. |
| **CH-7 — Contract-v2 §2.1 font-asset residual** (V-7) | value.js E→F→G (2×) | **JUSTIFIED-GATED-BOOK** (concrete observable gate) | The gate is a single observable: glass-ui's `dist/glass-ui.css` currently ships 0 `@font-face` rules; the moment it ships non-zero (base64-inlined fonts), value.js can retire `siblingFsAllowTransient`. This is a clean re-check predicate, not a vague "later." Legitimate continued-book. Keep, with the re-check stamped at value.js-J.W0. |
| **CH-8 — W11 FULL palette-api→color rename** (F-29) | D→E→F (2×) | **JUSTIFIED-GATED-BOOK** (operator scheduled-downtime) | URL-layer is GREEN (`api.color.babb.dev` serves); only the data-bearing volume rename (`palette-api_mongo-data`) carries orphan-risk requiring a scheduled-downtime window. This is operator-gated and genuinely non-urgent (cosmetic). Legitimate continued-book — but it should NOT keep re-appearing in fourier tranche FINALs; it is an operator runbook item (`PALETTE-API-PROVENANCE.md §4`), not a fourier residual. Recommend MOVING it out of the fourier stale-watch into the operator runbook only. |
| **CH-9 — Idempotency-Key API-side store** (F-17 / V-3) | fourier E→F→I + value.js I→J (2×+) | **RESOLVE-NOW at value.js-J.W4** | Plumbing is LIVE on both consumers since I; only the server-side replay store is missing — and it lives in value.js (the palette-api owner). value.js-J.W4 folds it. fourier correctly DISCLAIMS the server arm (it owns no replay store; the palette-api does). RESOLVE = build it at value.js-J.W4. No further carry. |

**Net chronic verdict**: 9 chronics. 3 RESOLVE-NOW (CH-1 verdict, CH-3 kill-the-deadlock, CH-9), 1 force-terminal-verdict (CH-6), 5 JUSTIFIED-GATED-BOOK with NAMED hard gates (CH-2 with kill-date, CH-4, CH-5 triaged, CH-7, CH-8 reclassified to operator-runbook). **Zero perpetual punts remain** — every chronic now has a verdict, a gate, or a kill.

---

## §3 — Gap list: items NOT folded into J that SHOULD be

J.md §8 folds: WAVE-D CRUD/REMIX, I-deferred e2e/axe evidence (F-7), `scheduler.yield()` (F-8), CSP+`fetchLater()` tail (F-10), `content-visibility` gallery gap (F-9). It disclaims VAL-1/VAL-9, declines DAG/codegen/cross-subject-remix, books WebMCP+CSS-Highlight. That is a clean, complete fold of fourier-LOCAL debt. The gaps below are coordination/cross-repo items J does NOT name — most are correctly out of fourier-J's inv-16 boundary, but two warrant an explicit mention-to-disclaim so they do not silently rot.

| Gap | Why it should be (at least) named in J | Recommended fold |
|---|---|---|
| **G-1: CH-3 (C1 colour-lift) is not mentioned in J at all** | C1 is a 3-tranche fourier chronic (`sampleToSVGPath` consume) that J silently drops. Silently dropping a chronic is exactly the anti-pattern the user forbids — even a KILL must be RECORDED. | J.W0 audit-intake should NAME C1 and record the §2 CH-3 verdict (KILL the consume-ask; nothing owed). One line in J §8 "Declined/Killed (recorded)". |
| **G-2: CH-4/CH-5 (dispatch.sh + 7 asks) not referenced in J** | J is a data-model tranche, so these deploy-coordination chronics are genuinely out of J's executable scope — but J re-triggers the 30-day stale-watch at close (J §10), so it INHERITS the stale-watch ledger and should point at `ADOPTION-ASKS.md` as the live owner. | J §10 (30-day stale-watch) should cite `ADOPTION-ASKS.md §4` as the canonical home for CH-4/CH-5; no fourier fold (inv-16). |
| **G-3: CH-6 (value.js 6-tranche glass-ui primitive carry) has no terminal mechanism in fourier-J** | Correctly value.js's concern — but the cross-repo cohort (value.js-J + fourier-J) closes paired, and a 6-tranche carry rotting on the value.js side is a cohort-health item. | No fourier fold; flag to value.js-J.W0 to force the terminal verdict (CH-6). Record in the cohort-coordination note (J §6 cross-repo perimeter already names value.js-J). |
| **G-4: F-5 (4th hand-type island) confirm-once** | Booked at G as "out of inv-26 named scope" but never re-verified. inv-26 is a J load-bearing invariant; a one-line re-confirm that `web/src/lib/equation/types.ts` is still a distinct domain (not a drifted duplicate) closes it. | Fold a one-line inv-26 re-confirm into J.W1 (CORE design touches the type boundary anyway). Then DROP it from the ledger. |
| **G-5: F-25/F-26 (C9, C4) — already resolved, should be struck from any live ledger** | Both EXECUTED (F.W6, F.W0). They still appear in historical FINALs; a live J-era ledger should mark them CLOSED so they stop drawing audit attention. | Documentation hygiene only; mark CLOSED in this audit (done). No J fold. |

**Verdict on J's fold completeness**: J folds ALL fourier-local actionable debt correctly. The gaps are coordination/record-keeping (G-1 the one real miss: C1 silently dropped; should be recorded-as-killed), not missing implementation work. J is SOUND-WITH-REFINEMENTS on the fold.

---

## §4 — VAL-1 / VAL-9 disclaimer legitimacy (genuinely value.js's vs a dodge)

fourier-J §6 disclaims VAL-1 + VAL-9 as "value.js-J's concern, NOT a fourier residual." **The disclaimer is LEGITIMATE, not a dodge** — verified on three independent grounds:

1. **Source ownership.** Both artefacts live entirely in value.js source: VAL-9 = `value.js/src/easing.ts` (`spring()→LinearStop[]` emitter alongside `cssLinear`); VAL-1 = `value.js/src/units/color/conversions/oklab.ts` (the LUT sampling layer; `models.ts` persists `oklabColors`). fourier has no file, no import, no consumer of either. By inv-15 (substrate-without-consumer-is-binary) fourier cannot ship them and has no standing to.

2. **The consumers are value.js↔glass-ui↔keyframes, not fourier.** VAL-9's ≥2-consumer gate is "keyframes spring-emission core + glass-ui `--spring-*`" — fourier is nowhere in that triangle. VAL-1's gate is "glass-ui `deriveAurora()` + a 2nd consumer" (speedtest AS-GU-1) — again no fourier consumer. fourier naming them only to disclaim is exactly the correct inv-16 posture (named, ledgered, not silently dropped).

3. **value.js-J actually OWNS them in its own plan.** value.js-J.md §7 + §3 (W4) folds VAL-9 + VAL-1 as binary-gated ship-or-book items with the re-gate at value.js-J.W0; value.js-J/PROGRESS.md rows 30–31 track them with evidence. They are not orphaned — they have a real owning wave in the correct repo.

**The one caveat** (raised as CH-1/CH-2 in §2): the disclaimer is legitimate, but "BOOKED-not-shipped until the gate is met" must not become a 4th-then-5th perpetual book. The DISCLAIMER is clean; the DEFERRAL behind it is the chronic that value.js-J.W0 must terminate with a SHIP or a KILL (CH-1) / a kill-date (CH-2). fourier's disclaimer is correct; value.js's continued-book needs the terminal verdict. This is a value.js-J obligation, correctly outside fourier-J — so fourier-J's disclaimer stands as-written.

---

## §5 — Summary verdict

- **fourier-J's fold of fourier-local debt is COMPLETE and HONEST.** Every I-deferred lever (e2e/axe evidence, `scheduler.yield()`, gallery `content-visibility`, CSP/`fetchLater` tail) folds into a named J wave; the WAVE-D CRUD/REMIX gap is the CORE.
- **The VAL-1/VAL-9 disclaimer is legitimate** (value.js-owned source, value.js↔glass-ui↔keyframes consumers, value.js-J owning wave) — not a dodge.
- **9 chronics identified**; the user's no-perpetual-punt demand is enforced: 3 resolve-now, 1 force-terminal-verdict, 5 justified-gated-book with NAMED hard gates (one with a kill-date, one triaged, one reclassified to operator-runbook). **Zero open chronics without a verdict or a hard gate.**
- **The one real gap (G-1)**: fourier's own 3-tranche chronic C1 (colour-lift consume) is SILENTLY dropped by J — a chronic dropped without a record is the anti-pattern. RECOMMENDATION: J.W0 records the CH-3 verdict (kill the consume-ask; the value.js supply stays parked; the two-repo deadlock dissolves — nothing owed).
- Recommend J §8 grow a "Killed/recorded (chronic resolution)" sub-block citing CH-3 (C1) and the CH-6 cohort flag, so no chronic exits the lineage unrecorded.

End of A4-deferred-chronic-sweep.md.
