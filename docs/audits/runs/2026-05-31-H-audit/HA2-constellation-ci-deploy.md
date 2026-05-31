# HA2 — Constellation CI, Deploy Chain, APIs & Frontends — the TRUE health

**Auditor**: HA2 (tranche-H audit) · **Date**: 2026-05-31 · **Mode**: STRICTLY READ-ONLY (zero mutations; repo read + read-only host `ssh -p 1022 mbabb@34.197.214.67` + `gh` + `curl`).
**Scope**: map the real state across all `mkbabb/*` constellation repos + the deploy spine, honestly, and frame the inv-16-vs-"perfect-the-constellation" decision.

---

## §0 — Headline

The constellation is **healthier than the raw red-X count suggests, and the red is concentrated, cascading, and mechanically fixable.** Three findings dominate:

1. **The CI red is a single dependency cascade plus one fourier-owned test-selector rot — NOT eight independent breakages.** `value.js` (peer-dep `ERESOLVE`) → poisons `keyframes.js` (`file:../value.js` seam absent in CI) → poisons `glass-ui` (lockfile still pins `file:../keyframes.js`). The published `@mkbabb/*` packages all EXIST on npm; the consumer repos just never did the `163ca47` vendor-seam→`^published` migration that fourier did. Fourier's own red (e2e) is unrelated: a duplicate `<input type=file>` broke a strict-mode locator.
2. **`speedtest.babb.dev`→404 is EXPECTED, not an outage.** `speedtest.friday.institute`→**200**. speedtest is the friday.institute suite. It retains a babb.dev *deploy webhook arm* (legacy), but it is NOT a babb.dev-served site. The constellation model needs this correction.
3. **The deploy spine is applied-vs-authored split exactly as G predicted.** `render-hooks.sh` (G's secret-model fix) is **NOT on the host** — `/opt/deploy/hooks.json` is still the hand-inlined plaintext-secret file. `dispatch.sh` is **still live**, routing all 4 non-fourier repos. All 5 webhooks are healthy (active + secret + last:200).

---

## §1 — CI state per repo (root-caused)

Evidence: `gh api repos/mkbabb/<r>/actions/runs` + `.../jobs` + `gh run view <id> --log-failed`, fetched 2026-05-31.

| Repo | CI present | Latest run | Conclusion | Failing job → step | Root cause (evidence) |
|---|---|---|---|---|---|
| **deploy** | ✅ `ci.yml` | `26695196279` (05-30) | ✅ **success** | — | Healthy. The reference shape. |
| **fourier-analysis** | ✅ `ci.yml` (+`deploy-pages.yml`) | `26719598467` (05-31) | ❌ **failure** | `e2e (Playwright)` → `Run Playwright e2e` | **fourier-owned test-selector rot** (in-bounds, inv-16). `web` (vue-tsc+vite build) ✅ and `api/tests (live Mongo)` ✅ — the app builds & ships fine. 23/49 e2e failed: `locator('input[type="file"]')` **strict-mode violation: resolved to 2 elements**. A 2nd file input (`VisualizationView.vue:201` `canvasFileInput`) was added beside the original (`ImageUpload.vue:122`); the e2e specs use the bare locator without `.first()`. |
| **value.js** | ✅ `ci.yml` (+`node.js.yml`,`release.yml`) | `26620907499` (05-29) | ❌ **failure** | `gates` → `Run npm ci` | **Peer-dep `ERESOLVE` (lockfile/peer conflict — ROOT of the cascade).** Root pins `vite@^8.0.13`; `unplugin-vue-markdown@29.2.0` peer-deps `vite@"...||^6||^7"` (max 7). "Conflicting peer dependency: vite@7.3.3". `npm ci` aborts. Published `@mkbabb/value.js@0.10.0` exists, but THIS repo's CI can't install its own deps. |
| **keyframes.js** | ✅ `node.js.yml` | `25972035276` (05-16) | ❌ **failure** | `test`→`npm test`; `deploy`→`npm run gh-pages` | **Vendor seam absent in CI.** `package.json` declares `"@mkbabb/value.js": "file:../value.js"` — a **local sibling-path seam** that does not exist when CI checks out only keyframes.js → `TS2307: Cannot find module '@mkbabb/value.js'` across ~12 files (+ cascade TS7006/TS2345). The published `@mkbabb/value.js@0.10.0` is the fix target. |
| **glass-ui** | ✅ `ci.yml` | `26074402780` (05-19) | ❌ **failure** | `gates` → `typecheck` | **Lockfile vendor-seam drift.** `package.json` declares `"@mkbabb/keyframes.js": "^2.0.0"` (published 2.1.1 exists, ships types) BUT `package-lock.json` still bakes `"@mkbabb/keyframes.js": "file:../keyframes.js"` + `"@mkbabb/value.js": "file:../value.js"`. `npm ci` is lockfile-deterministic → installs the absent `file:../` paths → `TS2307: Cannot find module '@mkbabb/keyframes.js'`. Fix = regenerate lockfile vs published (the `163ca47` migration). |
| **csp-solver** | ⚪ only `deploy.yml.disabled` | `22559863469` (03-02, stale) | (disabled) | — | **No active CI.** The lone workflow is `.disabled`; the March "success" is stale. Ask-1 target. |
| **words** | ⚪ no real CI | `25768954583` (05-12) | ❌ (dep-graph job) | — | **No real CI.** Only the auto "Dependency Graph: uv" job exists (1 workflow, not a test suite). Its failure is cosmetic graph-update noise, not a code gate. Ask-1 target. |
| **floridify** | ⚪ none | — (Actions API 404) | — | — | **Actions disabled / no workflows.** floridify = the backend monorepo behind `words`. Ask-1 target. |
| **speedtest** | ⚪ none | — (0 workflows) | — | — | **No CI** (0 workflows). friday.institute suite. Ask-1 target (build stage). |

### The cascade, drawn

```
value.js  (ERESOLVE: vite@8 vs unplugin-vue-markdown peer<=7)   ← ROOT
   │  (published @mkbabb/value.js@0.10.0 DOES exist on npm)
   ▼
keyframes.js  (package.json: "@mkbabb/value.js": "file:../value.js"  ← seam absent in CI)
   │  (published @mkbabb/keyframes.js@2.1.1 DOES exist, ships types)
   ▼
glass-ui  (package-lock.json still pins "file:../keyframes.js" + "file:../value.js")
```

All three are the SAME class of defect fourier already fixed in `163ca47` ("migrate @mkbabb/* from vendor tgz seams to ^published versions"). The consumer repos lagged. `value.js`'s own `ERESOLVE` is a separate, additional regression (vite@8 bump outran `unplugin-vue-markdown`) that must be fixed FIRST or its published artifact can't be cut.

---

## §2 — The friday.institute / babb.dev constellation model (corrected)

The user's correction is CONFIRMED. Live probes (`curl -sI`, 2026-05-31):

| Host | GET `/` | Verdict |
|---|---|---|
| `speedtest.friday.institute` | **200** | LIVE — speedtest's real home |
| `speedtest.babb.dev` | **404** | **EXPECTED** — speedtest is NOT a babb.dev site |
| `fourier.babb.dev` | 200 | LIVE (CF Pages SPA) |
| `api.fourier.babb.dev` | 404 (`/health`,`/docs`→200) | intended vhost-correctness (inv-22 problem+json on `/`) |
| `api.color.babb.dev` | 200 | LIVE (`{"status":"ok","service":"palette-api"}`) |
| `api.sudoku.babb.dev` | 200 | LIVE |
| `words.babb.dev` | **404** | genuine frontend outage (see §3) |
| `api.words.babb.dev` | 000 | no DNS / no service |
| `words.friday.institute` | 000 | no DNS / no service |

**The corrected model — two suites sharing one deploy host + one webhook dispatcher:**

- **babb.dev suite** (served under `*.babb.dev`): `fourier-analysis` (fourier + api.fourier), `value.js`→palette-api (color/api.color), `csp-solver` (sudoku/api.sudoku), `words`/floridify (words — currently down), plus the npm libs `keyframes.js`, `glass-ui` (published packages, no served domain).
- **friday.institute suite**: `speedtest` (speedtest.friday.institute).

**The reconciliation**: speedtest is a friday.institute *site* that still carries a *babb.dev deploy-pipeline arm* — it has a `deploy.babb.dev/hooks/speedtest` webhook (active, last:200) and routes through the host `dispatch.sh`. This is a legacy coupling: the deploy *infrastructure* (host + dispatcher + webhook chain) is shared/babb.dev-centric, but the *served domain* is friday.institute. It is in `ADOPTION-ASKS.md` (Ask 1 & 2) because the deploy-spine standardization is host-scoped, not domain-scoped. So: **`speedtest.babb.dev`→404 is not a constellation outage; it never existed there.** The G-era (and earlier) framing that lumped it into a babb.dev "is every site up?" sweep was the error.

**"We should handle that regardless" — scoping "handling speedtest" (different domain):** Three legitimately-in-scope items even though speedtest serves friday.institute:
1. **CI** — add `deploy/templates/ci.yml` (Ask 1) so its edge/frontend build is gated. Domain-agnostic; pure repo hygiene.
2. **Deploy-arm migration** — move speedtest off `dispatch.sh` to a per-repo `scripts/deploy-hook.sh` + direct `hooks.json` arm (Ask 2). This is one of the 4 gating migrations for deleting `dispatch.sh`. Domain-agnostic (the webhook is on the shared host).
3. **Model honesty** — annotate the constellation docs so speedtest is recorded as friday.institute-served / babb.dev-deploy-wired, and remove `speedtest.babb.dev` from any "expected-up" gate. This is the cheapest and highest-leverage "handle."

---

## §3 — words.babb.dev (404) — characterized

`words.babb.dev/`→404; `api.words.babb.dev`→000 (no DNS); `words.friday.institute`→000. The webhook arm is **healthy**: `deploy.babb.dev/hooks/words` active + has_secret + last:200. So the deploy *trigger* is wired, but:
- No `api.words` backend resolves at all (no DNS record) → if floridify has a backend service it is not exposed under any probed name.
- The frontend (`words.babb.dev`) returns 404 — DNS/CF routing exists enough to answer, but no Pages project / origin serves content.

**Characterization**: **genuine outage of the words frontend**, distinct in kind from speedtest. Unlike speedtest (up elsewhere), words has no live home anywhere probed. Cause is most likely the same family as fourier's G-finding δ: the frontend is an **un-automated CF-Pages publish step** that simply was never (re)run, OR the Pages project was removed. The webhook only deploys a backend; the SPA publish is manual. Because words/floridify has NO CI (§1) and no working backend endpoint, this is a fully-dark site, not a partial degrade. Fixing it requires maintainer action in words/floridify (out of inv-16 strict bounds — see §5); from fourier's substrate the in-bounds lever is the `deploy/cf/pages-deploy.sh` recipe + Ask coordination.

---

## §4 — The deploy spine: applied vs authored

Host evidence (read-only, `ssh -p 1022`, `/opt/deploy/`):

| Item | Authored (G) | Applied on host | Evidence |
|---|---|---|---|
| `render-hooks.sh` (secret-model wrapper — interpolate `${HMAC_*}` from `.env`, never inline secrets) | YES (G.ε, in `mkbabb/deploy` as `host/render-hooks.sh`) | **NO** | `ls /opt/deploy/render-hooks.sh` → *No such file*. `ls .../host/render-hooks.sh` → absent. |
| `hooks.json` secret model | wrapper-rendered (intended) | **hand-inlined plaintext** | `/opt/deploy/hooks.json` (mtime 05-29) shows fourier's HMAC `640efbae...` **as a literal string in the file**. The G secret-model fix is authored-only. |
| `dispatch.sh` retirement | gated on all-4-migrate (Ask 2) | **STILL LIVE** | `/opt/deploy/scripts/dispatch.sh` present (+`.bak-d-w1`). `hooks.json` routes `words`, `speedtest`, `value.js`, `csp-solver` → `/opt/deploy/scripts/dispatch.sh`. Only `fourier-analysis` uses its own `/var/www/fourier-analysis/scripts/deploy-hook.sh`. |

**Webhook + HMAC health (all 5):** `gh api repos/mkbabb/<r>/hooks` — all `active:true`, `has_secret:true`, `last_response.code:200`, per-repo URL `deploy.babb.dev/hooks/<repo>`:

| Repo | URL | secret | last |
|---|---|---|---|
| fourier-analysis | `/hooks/fourier-analysis` | ✓ | 200 |
| value.js | `/hooks/value.js` | ✓ | 200 |
| words | `/hooks/words` | ✓ | 200 |
| speedtest | `/hooks/speedtest` | ✓ | 200 |
| csp-solver | `/hooks/csp-solver` | ✓ | 200 |

(keyframes.js + glass-ui have **NO webhooks** — correct; they are npm-publish libraries with no served backend.) The per-repo URL + per-repo HMAC hardening from F is intact and healthy. `fourier-last-green` = `b28c3fac...` (a recorded green deploy SHA exists).

**Net**: the deploy *chain* is healthy and signed; the deploy *spine hygiene* (G's two residuals) is unmoved — `render-hooks.sh` not applied (secrets still inline), `dispatch.sh` not retired (gated on the 4 migrations, none done).

---

## §5 — The inv-16 tension (the central H-scope decision)

**inv-16** (canonical, GA3): *fourier commits touch only `fourier-analysis/** + deploy/**`.* It HELD A→G and was "load-bearing for honesty" — it kept fourier from silently editing repos it doesn't author-of-record, and forced cross-repo work into the maintainer-owned `ADOPTION-ASKS.md` ledger (Ask 1–5, OPEN since F, 2026-05-28).

**The new fact**: the user owns ALL `mkbabb/*` and explicitly wants the constellation "perfected" (CI green everywhere). The asks have sat OPEN ~3 days but the CIs have been rotting longer (keyframes red since 05-16, glass-ui since 05-19, value.js since 05-29). The asks are a real-but-slow channel; the rot is mechanical and trivial.

### The honest options

**(a) Keep inv-16 strict.** H fixes ONLY fourier (the e2e selector — §1) + deploy (apply `render-hooks.sh`, progress `dispatch.sh`). The 5 other repos stay asks. 
- *Pro*: honesty invariant preserved verbatim; no surprise cross-repo writes; audit trail stays clean. 
- *Con*: the cascade keeps rotting; "perfect the constellation" is structurally unsatisfiable within H; the asks have no SLA and clearly aren't self-clearing.

**(b) H authorizes a bounded cross-repo CI-repair sweep.** The user IS the maintainer, so the "maintainer-owned" gate is satisfiable BY THIS user explicitly authorizing it. H gets a *named, bounded* mandate: fix the dependency cascade + add CI to no-CI repos, each as a real PR in the target repo's own tree, recorded against the relevant Ask.
- *Pro*: actually achieves "perfect the constellation"; the fixes are mechanical (the same `163ca47` migration + the `deploy/templates/ci.yml` copy); clears 5 OPEN asks. 
- *Con*: inv-16's verbatim wording breaks; must be REPLACED (not silently violated) by a successor invariant or the honesty ledger degrades.

### Recommendation — **(b), but as an explicit invariant transposition, not a quiet override**

Adopt **(b)** with these guardrails so honesty is preserved by *evolving* the invariant rather than breaking it:

1. **Introduce inv-16′** (successor, recorded in H's arc-invariants): *"fourier-tranche commits touch `fourier-analysis/**` + `deploy/**` by default; cross-repo writes to other `mkbabb/*` repos are permitted ONLY under an explicit, user-authorized, named cross-repo sweep, each landing as its own PR in the target repo and booked against a numbered ADOPTION-ASK."* This keeps the honesty property (no *silent* cross-repo writes) while unblocking the user's stated goal.
2. **Bound the sweep to the mechanical cascade + CI lever** — i.e. exactly Ask 1 (CI to words/floridify, speedtest, csp-solver via `deploy/templates/ci.yml`) + the cascade fix (value.js `ERESOLVE`, then keyframes.js seam→`^0.10.0`, then glass-ui lockfile regen). Do NOT fold in Ask 2/3 (deploy-arm migration + value.js git-checkout conversion) — those touch host state + the dispatcher-retirement gate and deserve their own deliberate thread.
3. **Keep fourier's own e2e fix inside strict bounds** — it needs no authorization (`web/e2e/*.spec.ts` `.first()` or scope-to-`ImageUpload`; §1) and should land regardless of the (a)/(b) decision.
4. **Sequence the cascade** — value.js first (cut a fixed `@mkbabb/value.js`), then keyframes.js (migrate seam, re-publish), then glass-ui (lockfile regen). Out-of-order fixes will re-red.

**Why not (a)**: the asks are demonstrably not self-clearing, the user is unambiguous about wanting green, and (a) leaves "perfect the constellation" impossible by construction. The honesty value inv-16 protected is **silent** cross-repo mutation — inv-16′ preserves exactly that protection while permitting *explicit, ledgered* sweeps. The lever for the no-CI half is already authored: `deploy/templates/ci.yml`.

---

## §6 — API gaps + cross-repo fix locations

Live probes (`curl`, 2026-05-31):

| API | Symptom | Detail | Fix location (read-only located) |
|---|---|---|---|
| **api.color** (value.js / palette-api) | partial inv-22 | `/`→200 `{"status":"ok","service":"palette-api"}`; `/health`→404, `/docs`→404, `/openapi.json`→404 (all `application/problem+json` `urn:palette-api:problem:not_found`). App is UP; the docs/health/openapi routes are simply not mounted. | **value.js / palette-api repo** — FastAPI app: add `/health`, enable `/docs` + `/openapi.json` (or stop the catch-all 404 from shadowing them). Cross-repo (inv-16/inv-16′). |
| **api.sudoku** (csp-solver) | `/api/v1/solve`→404 (N4) | The solve route is NOT under `/api/v1/`. Live: `/v1/openapi.json`→200, `/docs`→200, `/health`→200. POST `/v1/solve`→405, POST `/solve`→405, but `/api/v1/solve`→404 and `/api/...`→404. The router is mounted at root/`/v1`, not `/api/v1`. The documented `/api/v1/solve` path is wrong/unmounted (route-prefix mismatch). | **csp-solver repo** — FastAPI router `prefix` (and/or the nginx/vhost path-rewrite) — reconcile to the documented `/api/v1` OR fix the docs to `/v1`. Cross-repo. |
| **api.fourier** (fourier) | `/`→404 by design | `/health`→200, `/docs`→200. The `/`→404 is the intended vhost-correctness problem+json (inv-22 fourier-side, F.W). NOT a gap. | n/a — healthy. |

Both real gaps (color, sudoku) live in **non-fourier repos** → same inv-16 boundary as §5. Under recommendation (b)/inv-16′ they would be in-scope for an authorized sweep; under (a) they remain asks. They are *not* in the current `ADOPTION-ASKS.md` (which is deploy-standardization-scoped, not API-correctness-scoped) — if H authorizes the sweep, book them as new Asks 6 (api.color routes) + 7 (api.sudoku prefix).

---

## §7 — What H can fix in-bounds RIGHT NOW (no authorization needed)

1. **fourier e2e** (`web/e2e/*.spec.ts`): the bare `page.locator('input[type="file"]')` now matches 2 elements (`ImageUpload.vue:122` + `VisualizationView.vue:201` `canvasFileInput`). Scope to `.first()` or to the `ImageUpload` component. Pure fourier-source — inv-16 clean. Turns fourier CI from ❌→✅ (web + api already green).
2. **deploy spine** (in `mkbabb/deploy` + host, both fourier-of-record): apply G's `render-hooks.sh` to retire the inline plaintext secret in `/opt/deploy/hooks.json`. (Host write — out of THIS read-only audit's mandate, but in-bounds for an H execution thread.)

Everything else (the §1 cascade, §3 words, §6 APIs) is cross-repo and gated on the §5 decision.

---

## §8 — Evidence index

- CI runs/jobs: `gh api repos/mkbabb/{fourier-analysis,value.js,keyframes.js,glass-ui,csp-solver,words,floridify,speedtest,deploy}/actions/runs` + `.../runs/<id>/jobs` + `gh run view <id> --log-failed`.
- Run IDs: fourier `26719598467`, value.js `26620907499`, keyframes.js `25972035276`, glass-ui `26074402780`, deploy `26695196279` (✅).
- Manifests: `gh api repos/.../contents/package.json` + `.../package-lock.json` (decoded).
- npm registry: `npm view @mkbabb/{value.js@0.10.0,keyframes.js@2.1.1,glass-ui@2.1.0}` — all published; keyframes ships `types: ./dist/keyframes.d.ts`.
- Live HTTP: `curl -s -o /dev/null -w '%{http_code}'` against the §2 host table; sudoku method probes `/solve`,`/v1/solve`,`/api/v1/solve`.
- Webhooks: `gh api repos/mkbabb/<r>/hooks`.
- Host (read-only): `/opt/deploy/{hooks.json,scripts/dispatch.sh,fourier-last-green}`; `render-hooks.sh` absent.
- Fourier source loci: `web/src/components/visualization/{ImageUpload.vue:122,VisualizationView.vue:201}`; specs `web/e2e/*.spec.ts`.
- Framing: `docs/constellation/ADOPTION-ASKS.md` (Ask 1–5), `docs/audits/runs/2026-05-29-G-audit/{GA3-arc-invariants,SYNTHESIS}.md` (inv-16, inv-22, δ-never-shipped).

*HA2 mutated nothing.*
