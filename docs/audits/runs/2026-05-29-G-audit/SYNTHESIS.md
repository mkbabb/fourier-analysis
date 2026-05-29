# G-audit SYNTHESIS — the binding scope for tranche G

**Mode**: 6-lane parallel READ-ONLY audit (GA1–GA6), 2026-05-29, informing fourier-analysis **tranche G** (successor to F). Tranche DEVELOPMENT only — no implementation ran. **Substrate**: `GA1-f-execution.md`, `GA2-deploy-constellation.md`, `GA3-arc-invariants.md`, `GA4-chronic-deferred.md`, `GA5-transpositions.md`, `GA6-prompts-precepts.md` (this directory). **Predecessor**: F closed GREEN-with-named-residuals at fourier HEAD `d34d21b` + deploy `7c4e96b`.

## §0 — The verdict

F's close **survives gate-falsification** (GA3 re-derived all 13 §6 gates independently — pytest 214/214, T7 12/12, inv-22 fourier-side, rate-limit dynamic, β cache, C4, C9 all reproduce). But the audit caught **three honest overstatements** in F's FINAL plus a set of elegance/legacy transpositions the mandate ("architectural transpositions for elegance, simplicity, performance above all; NO legacy") now makes first-class. G exists to (a) correct the overstatements at root, (b) land the convergence transpositions, (c) excise the surviving legacy, (d) honor the recurring demands F paid lip-service to.

## §1 — The three overstatements (correctness — G's spine)

1. **δ never shipped to prod (GA1 §1, GA6 #1) — the headline.** The auto-deploy F restored drives ONLY the API (origin Apache→nginx→FastAPI). The SPA is CF-Pages-served via a SEPARATE manual `wrangler pages deploy` that fourier does not even carry in its own `scripts/` (template-only in `mkbabb/deploy`). Nobody ran it after `9bd80b3`. **Live proof**: prod serves `cm-web-fonts@latest` (not the pinned SHA `333f55e`); `/robots.txt` is Cloudflare's 4497 B auto-file (not F's 103 B); no `<meta name="description">`. F/FINAL marks δ gates PASS — they are PASS-in-**source**, not live. The frontend deploy is OUTSIDE the standing automated path entirely.
2. **The rate-limit residual is under-scoped (GA1 §3, GA3 #1, GA5 T2).** F booked "real-client-IP behind the 2-hop proxy" as a future infra wave and *widened* `read_limiter` 240→1200/min to paper over a shared global bucket. The real defect is an **inv-11 one-identity violation**: `rate_limiter.py:227` uses raw `request.client.host` while a correct XFF-aware `get_client_ip` (`dependencies.py:182`) is already used by 11 other call sites — and the comment at `rate_limiter.py:143` *names* `get_client_ip` but the code never calls it. The fix is convergence onto the existing resolver (+ nginx `real_ip`), not a new wave; it retires the 1200 workaround.
3. **inv-22 "symmetric" is overstated (GA3 #2).** `api.color.babb.dev` returns 404 (not JSON) on `/health`/`/docs`/`/openapi.json`; only `/`→json holds. The 4-endpoint symmetric *definition* is unmet for color. Color is value.js-owned (inv-16-out-of-bounds, so not a close-breaker) — but the claim must be reconciled honestly.

## §2 — The transpositions (elegance / simplicity / performance — the mandate)

- **T1 — one api↔web contract source (inv-11, TOP elegance).** THREE sources of truth: the 65 KB generated `web/src/lib/api-schema.d.ts` (whose own header claims it retires hand-types) is imported by NOTHING; every consumer reads hand-written `lib/types.ts`; `api.ts` *also* inline-declares the `Visualization` family. Pick ONE (thin re-export from the codegen, or delete the codegen) and delete the rest. The inv-11 the repo believes it closed.
- **T2 — one IP identity (inv-11, elegance+perf).** Same root as overstatement #2. Converge to `get_client_ip` + nginx `real_ip` so the budget is a real per-client number.
- **T5(1) — self-host fonts + KaTeX CSS (PERF, the real LCP win).** First paint reaches THREE third-party origins (jsdelivr KaTeX CSS render-blocking + Google Fonts + jsdelivr CM fonts) on the LCP path. This is the genuine perf win F wrongly deferred as "manufactured"; vendoring same-origin behind CF is bounded + high-value.
- **T4 — drop the `GalleryEntry` projection (elegance).** `gallery.ts:26 toGalleryEntry` lossily renames `owner_slug`→`user_slug` — a vestige of the pre-CRUD-CONTRACT separate-gallery entity; 6 components can consume `Visualization` directly.
- **T3 — converge `deploy-hook.sh`** (fourier's 196-line near-clone of the 220-line template) → thread ζ-completion.

## §3 — The legacy to excise (inv-20 / inv-15 — "NO legacy code")

- Dead `like_limiter` + `"/like" in path` (`rate_limiter.py:155,184`) — the like route was removed in B-convergence (GA1 §2).
- Six dead exports in `lib/types.ts` (`Snapshot`, `ContourData`, `CursorInfo`, `GalleryCursorResponse`, duplicate `NotationMode`+`EquationTier`) — zero live consumers (GA5 T6).
- The misleading `rate_limiter.py:143` comment (names a resolver it doesn't call) (GA3).
- `compute_cache.py:105` naive `datetime.utcnow()` under a `tz_aware` client (GA5 T7).

## §4 — Deploy-spine completion (ζ residuals — GA2)

- **Secret-model doc↔host reconciliation (GA2 §1, SECURITY).** Spine docs + rotation runbook claim `${HMAC_<REPO>}`-via-`EnvironmentFile` interpolation; the live `hooks.json` INLINES literal secrets (adnanh/webhook has no native env-expansion). The runbook is non-executable as written. Reconcile to reality (a wrapper that renders the template, or honest inline-secret docs) so rotation actually works.
- Deploy repo doesn't eat its own dog food — no self-CI/shellcheck over the bash templates it vends (GA2 §2). The one item fully inside fourier-owned write surface (`deploy/**`).
- Deploy-root divergence — template default `/srv/constellation/<app>` matches nothing live (GA2 §4); canonicalize.
- Dispatcher-deletion isn't its own tracked ask; the dead fourier arm in `dispatch.sh` (GA2 §3).
- fourier's OWN `docker-compose.prod.yml` carries NONE of the hardening floor (GA4 ASK-4-fourier-half) — the one adoption ask with a fourier-source lever.
- Host hygiene: stale root-owned backups (GA2 §4 — corrected: the `.W1-pre` is an env-ref, NOT a plaintext password; hygiene, not exposure).

## §5 — Honor the recurring demands (GA6)

- **Run Lighthouse in PROD *and* DEV** — literally, with captured artefacts (paid lip-service across FA1/FA2/F; never an actual dev Lighthouse run). This is also the δ-live-verification gate.
- **New precept (inv-25 candidate): deploy-of-record must be automated-path-backed.** C/D/E/I/F all closed GREEN asserting "LIVE in prod" while only manual SSH (or nothing) reached prod — the auto-deploy was silently dead ~2 months. A close claiming "LIVE" must cite a `deploy_run_id` from the standing automated path, not a one-off.

## §6 — Chronic + deferred (GA4 — fold decision)

18 OPEN of 41 inventoried. **FOLD-INTO-G** (fourier-actionable): R1 real-IP (→β), fourier-half docker-hardening (→ε), E2 cross-env Playwright as a single CI-config delta (→ζ). **COORDINATION carries** (inv-16, ASK-only, stale-watch): the 7 adoption asks, dispatch.sh retirement (gated on value.js Ask-3). **STAYS-OUT, re-affirm (do NOT silently re-defer a 7th time)**: C1 colour-lift, C5 glass-ui carries, C6 glass-ui cold-boot — all 6-gate, all structurally cross-repo (value.js/glass-ui).

## §7 — The G must-NOT list (scope ceiling; inv-21 bounded)

1. NO new architectural lift beyond the §2 named transpositions (T1–T5 + the IP convergence).
2. NO manufactured perf — T5(1) self-host is justified by the 3-origin LCP-path evidence; do NOT chase synthetic bundle micro-opts.
3. NO cross-repo source edits (inv-16) — the 7 asks stay maintainer-owned.
4. NO re-litigating the F gates that survived falsification.
5. NO host SSH mutation without dry-run + receipt (inv-21).
6. NO widening a residual to paper over a defect (the read_limiter=1200 anti-pattern is the thing G corrects).
7. NO "LIVE" claim at G-close without an automated `deploy_run_id` (the new precept).

## §8 — Proposed G threads (6)

- **G.α — deploy-of-record integrity + δ ships for real** (correctness, top priority): wire the CF Pages frontend into the standing automated path; re-ship + LIVE-verify δ (font SHA, robots.txt, meta, a11y); author the inv-25 deploy-of-record precept.
- **G.β — one-identity convergence** (inv-11 transpositions T1+T2): single api↔web contract source; single client-IP identity (`get_client_ip` + nginx `real_ip`) → real per-client rate limit, retiring the 1200 workaround.
- **G.γ — NO-legacy excision** (inv-20/inv-15): like_limiter, 6 dead type exports, GalleryEntry vestige, datetime.utcnow, misleading comment.
- **G.δ — performance transposition + Lighthouse gate**: self-host fonts + KaTeX CSS same-origin (T5(1)); real Lighthouse prod AND dev as the binding gate.
- **G.ε — deploy-spine completion** (ζ continuation): secret-model doc↔host reconciliation + executable runbook; deploy-repo self-CI; deploy-hook convergence (T3); root canonicalization; dispatcher-retirement tracked ask; fourier docker-hardening floor; host hygiene.
- **G.ζ — invariant honesty + chronic re-affirmation + coordination**: inv-22 color reconciliation (honest); C1/C5/C6 6-gate STAYS-OUT re-affirmation; 7-ask + dispatcher-retirement stale-watch; E2 cross-env Playwright single CI-delta.

Two new named invariants: **inv-25 — deploy-of-record-automated** (a "LIVE" close cites an automated `deploy_run_id`); **inv-26 — single-contract-source** (the api↔web type boundary has exactly one source of truth — strengthens inv-11 at the codegen seam).

End of SYNTHESIS.
