# GA4 — Chronic + deferred inventory + G-fold decision

**Lane**: GA4 of the 6-lane G-development audit (fourier-analysis tranche G). READ-ONLY; tranche DEVELOPMENT, not implementation.
**Subject**: the complete ledger of every chronic + deferred item across the entire A→F history (plus value.js-cohort cross-repo residuals), each with a G-disposition. Folds the user's directive: "Delineate any chronically deferred items and fold them into this new tranche."
**Substrate HEADs**: fourier-analysis `d98da91` (F CLOSED 2026-05-29 GREEN-with-named-residuals); deploy-repo `mkbabb/deploy` `7c4e96b`. value.js-I closed Scenario A at ordering η (pre-F).
**Sources mined**: `FA4-chronic-deferred-inventory.md` (F-audit, the 33-item dedup) · `EA2`/`DA2`/`CA2` chronic inventories · `F/FINAL.md §5` (named residuals) · `F.md §7` (cross-tranche debt + deferrals) · `docs/constellation/ADOPTION-ASKS.md` (the 7 asks) · live `git grep` state-checks at `d98da91`.
**Methodology note**: every "current status" word resolves to the live HEAD tree or a FINAL.md close-record, not a charter's aspirational claim. F discharged a large slice of FA4's body; this ledger records what F actually closed and re-grades the residue against G.

---

## §0 — Headline numbers

| Metric | Count |
|---|---|
| **Total unique items inventoried (A→F lineage)** | **41** (FA4's ~33 + 3 F-new residuals + the 7 adoption-ask rows deduped against N4/N7 + Ask-4-fourier-self) |
| **CLOSED by F (confirm-close, no G action)** | **9** |
| **Already-DISCHARGED pre-F (ledger-only)** | **11** |
| **OPEN (live, needing a disposition)** | **18** |
| → **FOLD-INTO-G** | **5** |
| → **DEFER-TO-successor (value.js-J / infra-wave / glass-ui)** | **6** |
| → **STAYS-OUT-with-rationale (cross-repo / never-built / cosmetic)** | **7** |
| **Chronics that have festered ≥3 tranches and are STILL open** | **3** (C1, C5, C6) — see §4 flag |

**The honest headline**: F discharged the entire host-ops + deploy-spine + chronic-cheap surface (C4, C8-fourier-subset, C9, N1, N2, E1, E3, the dead vhost, dangling images, the 2-month webhook regression). What remains genuinely OPEN-and-fourier-actionable is **small**: G's fold-shortlist is **5 items**, only **2** of which are fourier-source work (Ask-4 docker-hardening of fourier's OWN compose + the cross-env Playwright matrix); the rest are infra (real-client-IP) and coordination (the 7 maintainer-owned asks, dispatch.sh retirement). The perennial cross-repo chronics (C1/C5/C6) STAY-OUT under inv-16 as they have for 4–6 gates.

---

## §1 — The full ledger

Legend — **Status**: CLOSED-by-F / DISCHARGED-pre-F / OPEN. **G-disposition**: FOLD-INTO-G / DEFER-TO-successor / STAYS-OUT / CLOSED-confirm.

### §1.a — CHRONICS (C-series; carried ≥2 tranches)

| ID | Description | Origin | Status | Owner | G-disposition |
|---|---|---|---|---|---|
| **C1** | Colour-lift `sampleToSVGPath` consume (`easings.ts`) | A.W2.b (2026-05-18) | OPEN (**6 gates**: A→B→C→D→E→F) | value.js maintainer | **STAYS-OUT** — value.js@0.10.0 still does NOT export the helper (only `cubicBezierToSVG`); consume cannot fire. inv-16: a value.js publish wave, not fourier's. no-silent-orphan watchdog holds. |
| **C2** | Full `Palette`/`colorScale` value.js domain model | B.W2 | OPEN (4 gates, latent) | value.js | **STAYS-OUT** — inv-15 (no library nobody calls); zero fourier consumer surfaced through F. |
| **C3** | 53 DEFERRED-TO-VALUE.JS CRUD-CONTRACT cells | B.W1 | DISCHARGED-pre-F (via value.js-I W1–W4) | — | **CLOSED-confirm** — discharged in the E/I Scenario-A cohort close. |
| **C4** | onnxruntime CPU-vendor warning flood | A.W3.5 | CLOSED-by-F (`d08e515`) | — | **CLOSED-confirm** — `ORT_LOGGING_LEVEL=3` in `api/__init__.py` (verified live at `:12`). Killed a 4-gate chronic. |
| **C5** | glass-ui substrate carries (7-item: `--scale-press*`, `--viz-easing`, `::selection`, Tabs entry anim, Pagination primitive, ConfiguratorLayer header-actions, dock `aria-hidden-focus`) | A.W0 | OPEN (**6 gates**: A→B→C→D→E→F) | glass-ui maintainer | **STAYS-OUT** — CONSTELLATION discipline; local carry verified live (`EasingPicker.vue:37` filed-upstream comment). Awaits a glass-ui surface tranche; fourier must not annex. |
| **C6** | glass-ui `style.css:3` import cold-boot race | A.W3.5.d | OPEN (**6 gates**: A→B→C→D→E→F) | glass-ui maintainer | **STAYS-OUT** — same substrate root as C5; not surfaced as a prod blocker. |
| **C7** | 6 §U conformance strikes (never-built-by-design) | B.W1 | OPEN (4 gates) | — | **STAYS-OUT** — WONTFIX-revive-if-built; KISS. Not a debt — a never-built affordance. |
| **C8** | Cross-cohort infra plan (constellation-wide) | `project_infra_plan.md` 2026-03-28 | OPEN-but-substantially-discharged | host-ops + maintainers | **DEFER-TO-successor (split)** — fourier-subset CLOSED by F (host-ops sweep + the `mkbabb/deploy` spine + the survey). The constellation-wide residue IS the 7 adoption asks (see §1.d). The C8 chronic itself is RECLASSIFIED: its forward body = the maintainer-owned asks, not a fourier source item. |
| **C9** | inv-18/19/20 numbering collision | C.§2 | CLOSED-by-F (`ca9a751`) | — | **CLOSED-confirm** — `docs/tranches/INVARIANTS.md` canonical ledger authored (verified live); non-destructive name-resolution. Closed a 3-gate cosmetic chronic. |

### §1.b — N-series (NEW-IN-D footguns + operator-coord)

| ID | Description | Origin | Status | Owner | G-disposition |
|---|---|---|---|---|---|
| **N1** | Dispatcher value.js arm latent-broken (`git fetch` on non-git rsync dir) | D.W11 | OPEN (PARTIALLY discharged) | value.js maintainer | **DEFER-TO-successor** — F per-repo-isolated the arm at W3b; the REAL fix (rsync-dir → git checkout, then adopt `deploy-hook.sh`) is Ask 3 in ADOPTION-ASKS (maintainer-owned). STAYS-OUT of fourier source per inv-16. |
| **N2** | CF wildcard `*.babb.dev` GH-Pages footgun | D.W10 | CLOSED-by-F (W6 `dns-cf-sync.sh` re-run) | — | **CLOSED-confirm** — narrowed at the W6 DNS surface. |
| **N3** | W11 FULL palette-api → color rename (host dir/compose/volume) | D.W11 | OPEN (cosmetic) | operator | **STAYS-OUT** — URL-layer GREEN (`api.color.babb.dev`); data-bearing-volume orphan risk outweighs cosmetic benefit; operator-scheduled-downtime item, not fourier's. |
| **N4** | csp-solver missing solve/openapi/docs routes | D.W9 | OPEN | csp-solver maintainer | **STAYS-OUT** — folded into ADOPTION-ASKS Ask 6 (1-line `app.include_router`); external repo; ASK-only. |
| **N5** | keyframes.js GH-Pages teardown | D.W9 | DISCHARGED-pre-F (cohort cutover) | — | **CLOSED-confirm**. |
| **N6** | value.js GH-Pages teardown | D.W9 | DISCHARGED-pre-F (I cohort) | — | **CLOSED-confirm** (frontend-hosting convergence to CF Pages restated as Ask 5; the GH-Pages job retirement rides it). |
| **N7** | floridify Mongo-bind upstream hardening | D.W1 | OPEN | floridify maintainer | **STAYS-OUT** — folded into ADOPTION-ASKS Ask 7; external repo. |
| **N8** | palette-api compose upstream | D.W1 | DISCHARGED-pre-F (value.js `f3a67a9`) | — | **CLOSED-confirm**. |
| **N9** | `test_backfill_image_bounds_on_migrated_image` failure | D.W3 | DISCHARGED-pre-F (E.W10 root-caused) | — | **CLOSED-confirm**. |
| **N10** | Frontend bundle 854 kB single chunk | D.W6 | DISCHARGED-pre-F (E.W7 T-P1, 6 chunks) | — | **CLOSED-confirm**. |
| **N11** | Deploy-hook migration auto-run | D.W1 | CLOSED-by-F (`a04f636`+`4007ec5`) | — | **CLOSED-confirm** — auto-migration GREEN-verified; 3 SUCCESS via deploy-hook. |

### §1.c — E-series (value.js-J deferrals + post-cohort hygiene)

| ID | Description | Origin | Status | Owner | G-disposition |
|---|---|---|---|---|---|
| **E1** | T-S3 host-flip dispatcher retire | E.W8 | CLOSED-by-F (W3b per-repo URL+HMAC) | — | **CLOSED-confirm** (the full `dispatch.sh` *rm* survives as F-residual R3 — see §1.e). |
| **E2** | Cross-env Playwright matrix → GREEN | D.W6 | OPEN (AMBER) | fourier-G | **FOLD-INTO-G (bounded)** — F.md §7 + F/FINAL §5 both name fourier-G as the owner "if a real UX regression surfaces." API is proven by T7; this is a UX-layer matrix. Fold ONLY as a bounded single CI-config delta (the E2-must-NOT escape: no matrix *expansion*). |
| **E3** | Compute cache hit-rate instrumentation | E.W7 | CLOSED-by-F (W2 `0a0a45b`) | — | **CLOSED-confirm** — CACHE_HIT/MISS logging on `compute_cache`. |
| **E4** | Per-call-site adoption If-Match/Idempotency-Key (~5 sites) | E.W5+W6 | OPEN (decorative) | value.js-J / I-tail | **DEFER-TO-successor** — plumbed; per-site adoption is decorative; rides a consumer-touch wave, not a standalone G allocation. |
| **E5** | Idempotency-Key API-side middleware | E.W4 | OPEN | value.js-J / I-tail | **STAYS-OUT** — F must-NOT #14; replay store belongs to value.js-J. |
| **E6** | Per-repo conformance suite (value.js side) | I.W4 | OPEN | value.js-J | **STAYS-OUT** — cross-repo; T7 probe covers the contract. |
| **E7** | `id`-field hard-removal from palette envelope | I.W4 | OPEN | value.js-J | **STAYS-OUT** — cross-repo source (inv-16). |

### §1.d — Cross-repo adoption asks (the 7; ADOPTION-ASKS.md §3 — the C8-forward body)

All maintainer-owned, inv-16-bounded; each is a request, not a fourier change. Booked F-close on the 30-day stale-watch.

| ID | Ask | Targets | Status | Owner | G-disposition |
|---|---|---|---|---|---|
| **ASK-1** | Adopt `ci.yml` (no CI today) | words, speedtest, csp-solver | OPEN (P2) | each maintainer | **STAYS-OUT** — coordination/ASK-only; G re-affirms on stale-watch. |
| **ASK-2** | Adopt hardened `deploy-hook.sh` + per-repo `hooks.json` arm | words, speedtest, csp-solver | OPEN (P1/P2) | each maintainer | **STAYS-OUT** — coordination; gating for dispatch.sh retirement (R3). |
| **ASK-3** | value.js/palette-api rsync-dir → git checkout, then hook (the N1 real fix) | value.js | OPEN (P1) | value.js maintainer | **STAYS-OUT** — the highest-urgency maintainer ask; G coordinates, does not commit. |
| **ASK-4** | Docker-hardening floor (`read_only`/`cap_drop`/`no-new-privileges`/limits) | words, speedtest, csp-solver, **fourier-analysis** | OPEN (P3) | each maintainer; **fourier for its own compose** | **FOLD-INTO-G (fourier-half only)** — verified live: fourier's `docker-compose.prod.yml` carries NONE of the floor flags. ADOPTION-ASKS §3 Ask-4 explicitly says this "folds into fourier's own backlog rather than this cross-repo ledger." The ONLY adoption ask with a fourier-source half. The other 3 repos STAY-OUT (maintainer-owned). |
| **ASK-5** | Frontend-hosting convergence to CF Pages (retire peaceiris) | value.js, keyframes.js | OPEN (P3) | each maintainer | **STAYS-OUT** — coordination; subsumes N5/N6. |
| **ASK-6** | csp-solver register solve/openapi/docs routes (= N4) | csp-solver | OPEN (P2) | csp-solver maintainer | **STAYS-OUT** — external repo; ASK-only. |
| **ASK-7** | floridify Mongo-bind upstream hardening (= N7) | words/floridify | OPEN (P2) | floridify maintainer | **STAYS-OUT** — external repo; ASK-only. |

### §1.e — F-new named residuals (F/FINAL §5)

| ID | Description | Origin | Status | Owner | G-disposition |
|---|---|---|---|---|---|
| **R1** | Real-client-IP resolution behind the 2-hop Apache→nginx chain (rate-limit per-client correctness) | F.W1 | OPEN (LOAD-BEARING) | successor infra wave | **FOLD-INTO-G** — F's `read_limiter`=1200/min is global-safe headroom but the limiter keys on the proxy IP (shared bucket). The genuine per-client fix = nginx `real_ip` + XFF-hop resolver + Apache XFF verification. This is fourier+host-actionable and the most load-bearing OPEN correctness residual. The single strongest G candidate. |
| **R2** | The 7 cross-repo adoption asks (collectively) | F.W12 | OPEN | per-repo maintainers | **DEFER-TO-successor (coordination)** — G re-triggers the 30-day stale-watch; coordinates; commits none (inv-16). ASK-4-fourier-half is the carve-out folded above. |
| **R3** | `dispatch.sh` full retirement | F.W3b | OPEN | operator + maintainers | **DEFER-TO-successor** — gated on all 4 non-fourier repos adopting `deploy-hook.sh` (Asks 2+3). Per-repo isolation already achieved; the router stays until its last consumer migrates. Single host op once Ask-3 (the gating 4th) lands. |

### §1.f — Latent / trigger-gated (DA2-era, not yet fired)

| ID | Description | Origin | Status | G-disposition |
|---|---|---|---|---|
| **L1** | Rate-limiter Option B (Mongo TTL bucket; multi-replica) | A.W4 | OPEN (latent) | **STAYS-OUT** — trigger-gated on a real multi-replica need (inv-19 single-replica held). Note: R1 (real-client-IP) is the *correctness* fix; L1 is the *horizontal-scale* fix — distinct. Held. |
| **L2** | Multi-replica fourier deployment | A.W4 | OPEN (latent) | **STAYS-OUT** — inv-19; trigger-gated; pairs with L1. |
| **L3** | `image_blobs` consistent-snapshot DR cron | C.W5 / D.W2 | OPEN (latent) | **DEFER-TO-successor** — the `external: true` guard + single-`update_one` atomicity make the immediate hazard non-firing; the snapshot cron is a host-ops infra item. Note in G carries; fold to an infra wave only if a backup obligation surfaces. |
| **L4** | slug-words precepts-submodule relocation | B.W3 | OPEN (latent) | **STAYS-OUT** — inv-16 "extract on 2nd consumer"; still 1 consumer. Premature. |

---

## §2 — The G candidate scope (the FOLD-INTO-G subset)

**5 items fold into G.** Grouped into two coherent threads + one coordination carry. This is a *bounded post-cohort-hygiene + correctness-residual* tranche, not a catchall — the same discipline F held (inv-21).

### Thread α (proposed) — fourier-source hygiene + correctness (the load-bearing half)

The only two genuinely fourier-source items left open across the entire A→F lineage:

1. **R1 — real-client-IP resolution / rate-limit per-client correctness** *(LOAD-BEARING)*. nginx `real_ip` directive + XFF-hop resolver behind the Apache→nginx 2-hop chain + Apache XFF verification; then narrow `read_limiter` back from the 1200/min global headroom to a per-client bound. The most load-bearing OPEN residual; fourier+host-actionable; F explicitly named "successor infra wave" as owner. *Rationale: the F-α gate passed only via the "observably non-static" escape clause — the per-client 429 correctness was honestly carried, not closed.*

2. **ASK-4 (fourier-half) — docker-hardening floor on fourier's own compose** *(DEFENSE-IN-DEPTH)*. Level `docker-compose.prod.yml` up to the `mkbabb/deploy` `docker-compose.hardening.yml` baseline: `read_only: true` + `tmpfs /tmp` + `cap_drop: ALL` + `security_opt: no-new-privileges` + resource limits + json-file log rotation. *Rationale: verified live — fourier carries NONE of the floor flags; ADOPTION-ASKS §3 explicitly routes this fourier-half "into fourier's own backlog." The one adoption ask with a fourier-source lever. Acceptance must confirm functional parity (read_only is the likely break-point).*

### Thread β (proposed) — UX-layer test integrity (bounded)

3. **E2 — cross-env Playwright matrix → GREEN** *(bounded; UX-layer)*. F.md §7 and F/FINAL §5 both name fourier-G as the owner. **Fold ONLY as a bounded single CI-config delta** — the E2-must-NOT escape from F.md §6 forbids matrix *expansion*. *Rationale: API correctness is proven by T7 12/12; the residue is the local/host axe-keystone UI-drift AMBER from D.W6. Genuinely small; fold iff G surfaces a UX wave, else keep it a single-commit close.*

### Coordination carry (NOT fourier-source work)

4. **R2 / the 7 adoption asks + C8-constellation-wide-residue** *(coordination-only)*. G re-triggers the 30-day stale-watch (`ADOPTION-ASKS.md §4`); re-affirms / re-prioritizes / closes-on-landing each ask; commits NONE (inv-16). The forward body of the C8 chronic lives entirely here.

5. **R3 — `dispatch.sh` full retirement** *(coordination + single host op)*. Gated on Ask-3 (value.js, the 4th migration) landing. G tracks the gate; the deletion is a one-line host op the operator performs once the gate clears. Not fourier-source.

### Distinguishing fourier-source vs coordination

| G item | Class | Why |
|---|---|---|
| R1 real-client-IP | **fourier-source + host** | nginx/Apache config in fourier's deploy surface + `rate_limiter.py` narrow |
| ASK-4 fourier-half | **fourier-source** | `docker-compose.prod.yml` is fourier's own tree |
| E2 Playwright matrix | **fourier-source (bounded)** | `web/e2e/` + CI config in fourier's tree |
| R2 / 7 asks | **coordination-ONLY** | inv-16; maintainer-owned PRs in other repos |
| R3 dispatch.sh rm | **coordination + host op** | gated on other repos; single operator action |

---

## §3 — Disposition counts (the close-of-ledger summary)

- **CLOSED-confirm (no G action)**: C3, C4, C9, N2, N5, N6, N8, N9, N10, N11, E1, E3 — **12 confirm-closes** (9 closed-by-F + the pre-F discharges that F's close re-confirmed).
- **FOLD-INTO-G**: R1, ASK-4-fourier-half, E2 — **3 fourier-actionable** (2 source + 1 bounded test) + R2 and R3 as **2 coordination carries** = **5 G-scope items**.
- **DEFER-TO-successor**: C8-constellation-residue (→ asks), N1 (→ Ask-3), E4 (→ value.js-J/consumer-touch), L3 (→ infra wave if triggered) — **4**.
- **STAYS-OUT-with-rationale**: C1, C2, C5, C6, C7, N3, N4(=Ask6), N7(=Ask7), E5, E6, E7, ASK-1, ASK-2, ASK-3, ASK-5, L1, L2, L4 — **the perennial cross-repo + never-built + cosmetic + latent body**.

---

## §4 — FLAG: chronics festered ≥3 tranches and STILL OPEN

Three chronics have now been carried **6 gates** (A→B→C→D→E→F) and remain OPEN at G. All three are STAYS-OUT — and that is the *correct* disposition, but they must be flagged so G does not silently re-defer them a 7th time without re-affirming the rationale:

1. **C1 — colour-lift `sampleToSVGPath`** (6 gates). value.js@0.10.0 still exports only `cubicBezierToSVG`. Structurally cross-repo; fires the one-line consumer-half swap iff value.js publishes the helper. The no-silent-orphan watchdog in `easings.ts` keeps it honest. **G action: re-affirm STAYS-OUT in §carries; do NOT annex (inv-16).**
2. **C5 — glass-ui 7-item substrate carries** (6 gates). No glass-ui surface tranche since v2.0.0/`5e79443`. Verified live as local carries (`EasingPicker.vue:37`). **G action: re-affirm STAYS-OUT; consume via dep bump iff a glass-ui tranche opens.**
3. **C6 — glass-ui `style.css:3` cold-boot race** (6 gates). Same substrate root as C5; never a prod blocker. **G action: re-affirm STAYS-OUT.**

These three are *not* G-actionable (inv-16 cross-repo source boundary) — they are perennially-deferred-BECAUSE-cross-repo, not neglected. The flag's purpose is the discipline F's FA4 named: re-state the hold + the gating predicate each tranche so the deferral stays honest indefinitely rather than rotting unbooked.

**Note on C8** (the 4th historically-≥3-gate chronic): F genuinely *broke its back* — the fourier-subset is CLOSED and the constellation-wide residue is now booked as the 7 owner-named adoption asks (no longer an amorphous 91-day-stale plan file). C8 is NOT flagged as festering; it is reclassified to the coordination carry (§2 item 4).

---

## §5 — Headline finding

F discharged the entire cheap-chronic + host-ops + deploy-spine surface (C4, C9, N1-isolation, N2, N11, E1, E3, the webhook regression, the dead vhost) and reclassified the 91-day-stale C8 infra plan into 7 owner-named asks. The result for **G**: a genuinely small fold-shortlist of **5 items**, of which only **3 are fourier-actionable** (R1 real-client-IP rate-limit correctness — the one LOAD-BEARING open residual; ASK-4 docker-hardening of fourier's OWN compose — the only adoption ask with a fourier-source half, verified missing live; E2 Playwright matrix — bounded UX-test, single CI-config delta) and **2 are coordination carries** (the 7 maintainer-owned asks + dispatch.sh retirement, both inv-16-bounded). **18 items are OPEN; only 5 fold into G.** Three chronics (C1/C5/C6) have festered **6 gates** and STAY-OUT — correctly, because they are structurally cross-repo (value.js + glass-ui) — but are flagged (§4) so G re-affirms rather than silently re-defers them. The single strongest G candidate is **R1** (real-client-IP), the only LOAD-BEARING open correctness residual fourier itself can move.

End of GA4-chronic-deferred.md.
