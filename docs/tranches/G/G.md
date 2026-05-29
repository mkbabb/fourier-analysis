# G — correctness-honesty + one-identity convergence + legacy excision + performance transposition + deploy-spine completion

**Tranche letter**: G — fourier-analysis's elegance/simplicity/performance transposition tranche; successor to F (post-cohort hygiene), which closed GREEN-with-named-residuals.
**Predecessor close**: F — `docs/tranches/F/FINAL.md` at fourier HEAD `d34d21b`; deploy-repo (`mkbabb/deploy`) HEAD `7c4e96b`.
**Cohort**: single repo (value.js-I closed Scenario A at ordering η; no peer required).
**Mode**: **direct** for the convergence/legacy/perf threads (β, γ, δ — source-bounded, strongly-gated); **research-light** for α (the frontend-deploy path is known; verify-before-wire) and ε (host-side; capture-before-mutate, inv-21 single-window + receipts).
**Authored**: 2026-05-29 — from the user's directive "DEEPLY audit with 6 agents in parallel… architectural transpositions in the sake of elegance, simplicity, and performance above all… NO legacy code… delineate chronic + deferred and fold them… recap ALL prompts… NOT an implementation phase. Tranche development only." (FE3). Substrate: the 6-lane G-audit `docs/audits/runs/2026-05-29-G-audit/` (GA1–GA6 + SYNTHESIS).
**Open**: TBD (after user authorises G.W0).

## §0 — Goal criterion and completion criterion (paired)

**Goal criterion (the aim).** Land **six threads** that (a) correct the three honest overstatements F's close carried, (b) execute the inv-11 convergence transpositions the elegance mandate makes first-class, (c) excise the surviving legacy (inv-20/inv-15), (d) land the real performance win, (e) complete the deploy spine, and (f) honor the recurring demands (Lighthouse prod+dev; deploy-of-record honesty). G is the *elegance* tranche — every thread either removes a source of truth, removes legacy, or removes a third-party hop.

- **α — deploy-of-record integrity + δ ships for real** *(correctness; top priority)*: F's δ frontend (`9bd80b3` — font SHA pin, `robots.txt`, `meta-description`, a11y aria-labels) **never shipped to prod** — the restored auto-deploy drives only the API; the CF Pages SPA deploy is a separate manual `wrangler` step nobody ran (GA1 §1). G wires the frontend deploy into the standing automated path (the `deploy/cf/pages-deploy.sh` recipe, invoked from fourier's own tracked deploy), re-ships δ, and LIVE-verifies (prod must serve the pinned font SHA, F's `robots.txt`, the `meta-description`, and the a11y fixes). Authors the **inv-25 deploy-of-record-automated** precept.
- **β — one-identity convergence** *(inv-11; the two TOP transpositions)*: **T1** — collapse the THREE api↔web type sources (the unused 65 KB generated `web/src/lib/api-schema.d.ts`, the hand-written `lib/types.ts`, the inline `api.ts` `Visualization` decls) to ONE source of truth (decide codegen-canonical with thin re-exports OR delete the codegen + keep hand-types; whichever is the simpler honest end-state) — closes inv-26. **T2** — converge the rate-limiter onto the existing `get_client_ip` resolver (`dependencies.py:182`) + add nginx `real_ip` so `RateLimitHeaderMiddleware` keys on the REAL client IP behind the 2-hop Apache→nginx chain — making the budget a true per-client number and **retiring the `read_limiter=1200` global-headroom workaround** (re-tighten to a real per-client budget).
- **γ — NO-legacy excision** *(inv-20/inv-15)*: dead `like_limiter` + `"/like"` path arm (`rate_limiter.py:155,184` — the like route was removed at B-convergence); six dead exports in `lib/types.ts` (`Snapshot`/`ContourData`/`CursorInfo`/`GalleryCursorResponse`/duplicate `NotationMode`+`EquationTier`); the `GalleryEntry` projection vestige (`gallery.ts:26 toGalleryEntry` — lossy `owner_slug`→`user_slug`; consume `Visualization` directly); naive `compute_cache.py:105 datetime.utcnow()` under a `tz_aware` client; the misleading `rate_limiter.py:143` comment.
- **δ — performance transposition + Lighthouse gate** *(perf; the real LCP win)*: self-host the Computer-Modern fonts + KaTeX CSS same-origin behind CF (the LCP path currently fans to THREE third-party origins — jsdelivr KaTeX CSS render-blocking + Google Fonts + jsdelivr CM fonts; GA5 T5(1)). The binding gate is a **real Lighthouse run in BOTH prod AND dev** with captured artefacts (literally honoring the recurring demand FA1/FA2/F paid lip-service to).
- **ε — deploy-spine completion** *(thread-ζ continuation in `mkbabb/deploy` + host + fourier compose)*: reconcile the secret-model doc↔host lie (the spine docs + rotation runbook claim `${HMAC_<REPO>}` env-interpolation; the live `hooks.json` inlines literals — adnanh/webhook has no env-expansion → the runbook is non-executable; GA2 §1) by rendering the template via a wrapper OR documenting the inline reality honestly so rotation works; add deploy-repo self-CI/shellcheck (dog-food); converge fourier's `scripts/deploy-hook.sh` onto the `deploy/templates/` version (T3); canonicalize the deploy-root; make dispatcher-retirement a tracked ask; level fourier's OWN `docker-compose.prod.yml` to the hardening floor (`read_only`+`cap_drop`+`no-new-privileges`+limits — GA4 ASK-4-fourier-half); prune the stale host backups (hygiene).
- **ζ — invariant honesty + chronic re-affirmation + coordination** *(ASK-only / doc)*: reconcile inv-22 honestly (color is value.js-owned; document its actual partial state vs the symmetric definition); re-affirm the 6-gate STAYS-OUT for C1/C5/C6 with the binding predicate (do NOT silently re-defer a 7th time); re-trigger the 30-day stale-watch on the 7 adoption asks + dispatcher-retirement; fold E2 cross-env Playwright as a single CI-config delta only.

**Completion criterion (the evidence).** The close holds when:
- **α**: prod `https://fourier.babb.dev` serves the pinned CM-font SHA (not `@latest`), F's `robots.txt` (103 B, not Cloudflare's auto-file), the `<meta name="description">`, and the a11y aria-labels — verified by live fetch + the Lighthouse artefact; the frontend deploy is invoked from a tracked fourier script on the standing automated path; `FINAL.md` cites an automated `deploy_run_id` for both API and SPA (inv-25).
- **β**: exactly ONE api↔web type source of truth (the other two deleted; `grep` proves no orphaned `api-schema.d.ts` import and no shadow inline decls); `rate_limiter` calls `get_client_ip` (no second `hash_ip`, no raw `request.client.host`); nginx `real_ip` resolves the client; a burst from two distinct IPs shows independent budgets (per-client, not a shared global bucket); `read_limiter` re-tightened with rationale.
- **γ**: zero references to `like_limiter`/`"/like"`; the six dead exports gone (`grep` zero importers→removed); `toGalleryEntry` removed (components read `Visualization`); `datetime.now(tz=UTC)`; the misleading comment corrected. `vue-tsc -b` + `npm run build` green; `uv run pytest api/tests/` green.
- **δ**: fonts + KaTeX CSS served same-origin (no jsdelivr/Google render-blocking origin on the LCP path); Lighthouse run captured for prod AND dev (perf + a11y + SEO scores recorded as artefacts under `docs/tranches/G/receipts/`); LCP improvement recorded.
- **ε**: the rotation runbook is executable end-to-end (a dry-run dual-key swap demonstrated, or the inline reality honestly documented with a working render path); `deploy/` carries a CI workflow that shellchecks its templates; fourier `deploy-hook.sh` == the template shape (or the divergence is a documented, tracked delta); fourier `docker-compose.prod.yml` carries the hardening floor; host backups pruned (receipt).
- **ζ**: inv-22 reconciled in `INVARIANTS.md` (the enforced-surface honestly scoped); C1/C5/C6 re-affirmed with the gating predicate; stale-watch re-triggered; E2 lands as one CI-config delta or stays out with rationale.
- T7 conformance still 12/12 PASS; `uv run pytest api/tests/` green (214/214 maintained or higher); `vue-tsc -b` + `npm run build` green.
- `PROGRESS.md` matches reality; `FINAL.md` cites every commit + gate + an automated `deploy_run_id`.

The §6 hard-gate list is the binding ledger.

## §1 — Thesis

F closed honestly-labeled GREEN-with-named-residuals and survives gate-falsification (GA3). But the re-audit caught that F's δ **never reached prod** (the auto-deploy it restored covers only the API; the SPA is a separate un-automated CF Pages step), that F's rate-limit residual was **under-scoped** (a one-identity convergence, not a future wave — and "fixed" by *widening* a budget to paper over the defect), and that the inv-22 symmetric claim is **overstated** for color. Alongside, the elegance mandate ("architectural transpositions for elegance, simplicity, and performance above all; NO legacy") makes first-class a set of convergences the codebase has earned: three api↔web type sources collapsing to one, two IP identities to one, three LCP-path third-party origins to zero, and the surviving dead code excised.

G is the **elegance tranche**: each thread removes a source of truth (β), removes legacy (γ), removes a third-party hop (δ), or removes a gap between claim and reality (α, ε, ζ). It is single-repo, inv-21-bounded, KISS-honest, and — load-bearing — it refuses the anti-pattern it was born correcting: **no residual widened to mask a defect; no "LIVE" claimed without an automated deploy-of-record.**

## §2 — Invariants

G inherits all prior invariants (`docs/tranches/INVARIANTS.md`, inv-1…24 + the named C/F invariants) unchanged. G adds **two new invariants by name**:

- **inv-25 — deploy-of-record-automated**: a tranche close (or any "LIVE in prod" claim) MUST cite a `deploy_run_id` produced by the standing AUTOMATED deploy path (the webhook→deploy-hook chain), not a manual SSH one-off. Rationale: the auto-deploy was silently dead ~2 months while C/D/E/I/F all closed asserting "LIVE" (GA6). Testable gate: `FINAL.md` cites an automated `deploy_run_id` for both API and SPA surfaces.
- **inv-26 — single-contract-source**: the api↔web type boundary has exactly ONE source of truth (strengthens inv-11 at the codegen seam). Rationale: three parallel type sources, the generated one unused (GA5 T1). Testable gate: `grep` proves no orphaned generated-schema import and no shadow inline type decls duplicating the canonical source.

## §3 — Wave schedule (provisional — hardened at Wχ)

| Wave | Title | Thread | Agents | Closes on | Status |
|---|---|---|---|---|---|
| W0 | Open + audit intake + the cheapest legacy excision (the misleading comment + `datetime.utcnow`) | — | 1 | F close re-confirmed; GA1–GA6 + SYNTHESIS committed as binding baseline; the 2 one-line γ items land | planned |
| Wα | Research-light (2 lanes): frontend-deploy path verify + nginx `real_ip` chain | α/β | 2 | confirm the CF Pages deploy invocation + that nginx `real_ip` correctly resolves through Apache's XFF | planned |
| Wχ | Challenge (3 probes): inv-26 single-source decision + T2 per-client-budget value + δ self-host blast radius | — | 3 | ratify the contract-source choice, the re-tightened read budget, the self-host scope | planned |
| W1 | G.α deploy-of-record + δ ships | α | 1-2 | wire `pages-deploy.sh` into fourier's tracked deploy; re-ship; live-verify δ; inv-25 precept | provisional |
| W2 | G.β.1 one contract source (T1) | β | 1-2 | collapse to one api↔web type source; inv-26 gate | provisional |
| W3 | G.β.2 one IP identity (T2) | β | 1-2 | `get_client_ip` + nginx `real_ip`; per-client budget; retire read_limiter=1200 | provisional |
| W4 | G.γ legacy excision | γ | 1 | like_limiter; 6 dead exports; GalleryEntry vestige | provisional |
| W5 | G.δ perf transposition + Lighthouse | δ | 1-2 | self-host fonts + KaTeX CSS; Lighthouse prod AND dev artefacts | provisional |
| W6 | G.ε.1 secret-model reconciliation + deploy-repo CI | ε | 1-2 | executable rotation runbook; `deploy/` self-CI/shellcheck | provisional |
| W7 | G.ε.2 deploy-hook convergence + fourier hardening floor + host hygiene | ε | 1 | T3 convergence; fourier compose hardening; prune backups (receipt) | provisional |
| W8 | G.ζ invariant honesty + chronic re-affirm + coordination | ζ | 1 | inv-22 reconciled; C1/C5/C6 re-affirm; stale-watch; E2 single CI-delta | provisional |
| W9 | Close + stale-watch re-trigger | — | 1 | reconcile PROGRESS; `FINAL.md` (with automated `deploy_run_id`); CANONICAL-ORDERING → ordering ι′ | provisional |

Hard ceiling 4 agents/wave. Research-light gate (W0→Wα→Wχ) governs α + β; γ/δ/ε/ζ direct but pass Wχ for inv-21/inv-25/inv-26 KISS-cert. α (W1) precedes nothing (independent); β (W2/W3) is the convergence core; γ (W4) ∥ δ (W5); ε (W6/W7) host-coordinated; ζ (W8) doc/ASK. 11 wave slots; granularity expands as needed.

## §4 — Phases

**Phase 0 — research-light + challenge (W0–Wχ).** Verify the frontend-deploy path + the nginx `real_ip` chain; ratify the single-source decision + the re-tightened budget + the self-host scope.
**Phase I — correctness (W1).** δ ships for real + inv-25.
**Phase II — convergence (W2–W3).** One contract source + one IP identity.
**Phase III — legacy + perf (W4–W5).**
**Phase IV — deploy-spine completion (W6–W7).**
**Phase V — honesty + coordination + close (W8–W9).**

## §5 — Critical files and ownership

| Surface | Files | Wave |
|---|---|---|
| G.α frontend deploy | fourier tracked deploy script invoking `deploy/cf/pages-deploy.sh`; `web/index.html` (re-verify font SHA); `web/public/robots.txt` | W1 |
| G.β.1 contract source | `web/src/lib/{api-schema.d.ts, types.ts, api.ts}`; `web/scripts/gen-types.sh` | W2 |
| G.β.2 IP identity | `api/services/rate_limiter.py`; `api/dependencies.py` (`get_client_ip`); `nginx/fourier.conf` (`real_ip`) | W3 |
| G.γ legacy | `api/services/rate_limiter.py`; `api/services/compute_cache.py`; `web/src/lib/types.ts`; `web/src/stores/gallery.ts` (+ 6 components) | W4 |
| G.δ perf | `web/public/` (vendored fonts + KaTeX CSS); `web/index.html`; `web/vite.config.ts`; `docs/tranches/G/receipts/` (Lighthouse) | W5 |
| G.ε deploy spine | `deploy/**` (rotation runbook + CI + template convergence); `scripts/deploy-hook.sh`; `docker-compose.prod.yml`; host `/opt/deploy/` (hygiene) | W6-W7 |
| G.ζ honesty | `docs/tranches/INVARIANTS.md` (inv-22 reconcile); `docs/constellation/ADOPTION-ASKS.md` (stale-watch) | W8 |

No two waves hold overlapping write bounds: β.1 (web types) ∥ β.2 (api/nginx) ∥ δ (web assets); γ touches api + web but distinct files from β; ε is deploy/host; α is the deploy path + web verify; ζ is docs.

## §6 — Hard gates (completion criterion)

Per-wave gates set in the hardened `waves/W*.md` after Wχ. Tranche-level close gates:
- **inv-25 deploy-of-record**: `FINAL.md` cites an automated `deploy_run_id` for BOTH API and SPA; prod live-serves the δ surface (font SHA + robots.txt + meta-description + a11y).
- **inv-26 single-contract-source**: one api↔web type source; the other two removed (grep-proven).
- **G.β.2 per-client rate limit**: two-IP burst shows independent budgets; `rate_limiter` uses `get_client_ip`; nginx `real_ip` live; `read_limiter` re-tightened.
- **G.γ legacy zero**: no `like_limiter`/`/like`; six dead exports gone; `toGalleryEntry` gone; `datetime.now(tz=UTC)`.
- **G.δ perf**: zero third-party render-blocking origin on the LCP path; Lighthouse prod AND dev artefacts captured; LCP delta recorded.
- **G.ε deploy-spine**: rotation runbook executable; `deploy/` self-CI; fourier compose hardened; backups pruned (receipt).
- **G.ζ honesty**: inv-22 reconciled; C1/C5/C6 re-affirmed with predicate; stale-watch re-triggered.
- T7 12/12; pytest 214/214+; vue-tsc + build green; PROGRESS/FINAL reconcile.

## §7 — Cross-tranche debt and explicit deferrals

**Folded into G (fourier-actionable):** real-client-IP (R1 → β.2); fourier docker-hardening floor (ASK-4-fourier-half → ε); E2 cross-env Playwright (single CI-config delta → ζ); the deploy-spine ζ-residuals (→ ε); the three F overstatements (→ α, β, ζ).
**Coordination carries (inv-16; ASK-only; stale-watch in ζ):** the 7 adoption asks (`ADOPTION-ASKS.md`); dispatcher full retirement (gated on value.js rsync→git, Ask-3).
**STAYS-OUT, re-affirmed (6-gate; structurally cross-repo — do NOT silently re-defer):** C1 colour-lift (value.js publish-bound); C5 glass-ui substrate carries; C6 glass-ui cold-boot race. inv-16 binds them out; G re-states the hold + the gating predicate.
**Deferred out of G (successors):** E5 Idempotency-Key API-side (value.js-J); E6 per-repo conformance suite (value.js-J); E7 id-field hard-removal (value.js-J); F-T-N1 status-field drop (value.js maintainer commits).

## §8 — Brittleness window (provisional)

G plans NO brittleness window. Each wave is reversible at its boundary: α (frontend deploy — CF Pages rollback to prior deployment ID); β (type collapse is compile-checked; IP convergence revertible by config); γ (dead-code removal — grep-proven zero consumers); δ (self-host assets — revert to CDN URLs); ε (deploy/host — dry-run + receipt per inv-21). No host-disruptive op beyond a documented single-window with receipts.

## §9 — Cross-repo coordination (ASK-only)

inv-16 holds: G commits touch only `fourier-analysis/**` + `deploy/**`. The 7 adoption asks + the C1/C5/C6 carries + F-T-N1 remain maintainer-owned, coordinated from `docs/constellation/ADOPTION-ASKS.md`, re-stale-watched at G.ζ.

## §X — Congruence

The 6 GA lanes + SYNTHESIS are the binding substrate. F is closed; no F reconcile required beyond correcting the three overstatements (α/β/ζ) — those are G scope, not a re-open of F. The transpositions (GA5) ride β/γ/δ; the chronic/deferred ledger (GA4) is folded per §7; the prompt/precept recap (GA6) yields inv-25 + the Lighthouse-prod-and-dev gate.

End of G.md.
