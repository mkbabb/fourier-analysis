# H.ε (W6 + W7) — constellation perfection, BOOKED (inv-16′)

**Mode**: BOOK-ALL. **Decision (user, 2026-06-01)**: when asked how ε should proceed given that all five constellation sibling repos are mid-flight, the user chose **"Book all precise fixes — touch no sibling repo."** This wave therefore writes each exact, ready-to-apply CI fix as an inv-16′ ask; it mutates **no** other repo's source and pushes nothing cross-repo. Per inv-16′: a sweep *enables* but does not *compel* — "mid-flight stays booked with its owner."

## §1 — Why book, not force (the recon)

inv-16′ requires a working-tree check before any cross-repo edit. Run 2026-06-01 (`git -C <repo> status` + `rev-list @{u}...HEAD`):

| Repo | Tree | vs origin/master | Verdict |
|---|---|---|---|
| **value.js** | clean (stray untracked `docs/tranches/C/` only) | 0 / 0 (in sync) | the only sweepable one — but cascade-greening needs keyframes/glass-ui too |
| **keyframes.js** | dirty (`docs/precepts` submodule) | **+19 unpushed** | mid-flight → BOOK |
| **glass-ui** | dirty (`docs/precepts` submodule) | **+111 unpushed** | heavily mid-flight → BOOK |
| **words** | 8 dirty backend files | **+11 unpushed** | mid-flight → BOOK |
| **speedtest** | dirty (deletions + `docs/precepts`) | **+563 unpushed** | massively mid-flight → BOOK |

The decisive hazard: a `git push` to fix any repo would *also publish its entire unpushed backlog* (a `push` ships every local commit ahead of origin) — up to 563 commits of possibly-in-progress work — and trigger that repo's deploy. Forcing CI fixes onto that is precisely the silent cross-repo clobber inv-16 forbids. `api.color` / `api.sudoku` / `csp-solver` are **absent from the local clone set** entirely, so their fixes are verify-then-fix in their own trees and cannot be authored blind. Hence: book the precise fixes; the owner applies each on a clean checkout.

## §2 — The precise, ready-to-apply fixes (verified at Wχ.3 against the actual files)

The constellation CI reds are **one cascade**: the `163ca47`-style vendor-seam → `^published` migration the consumers never did. All published `@mkbabb/*` versions already exist on npm, so these fixes consume the **already-published** registry versions — **no new publish required**; each greens the repo's OWN CI.

### A — value.js (cascade HEAD; CI red, run 26620907499)
Root: `npm ci` → `ERESOLVE` — `unplugin-vue-markdown@29.2.0` vite peer caps at `^7`, root is `vite@^8.0.13`; + residual `file:../glass-ui`,`file:../keyframes.js` devDep seams (package.json L79–80).
```
1. package.json: bump devDep  unplugin-vue-markdown  ^29.2.0 → ^32.0.0
   (v32.0.0 is the FIRST release whose vite peer adds ^8.0.0-0; 30/31 still cap at 7 — `npm view` verified)
2. package.json L79–80: @mkbabb/glass-ui  file:../glass-ui → ^3.0.0 ;
                        @mkbabb/keyframes.js file:../keyframes.js → ^2.1.1
3. npm install  → regen package-lock.json against the registry (drops the link:true nodes; vite@8 resolves)
   `npm ci` then succeeds with NO --force / --legacy-peer-deps.
```

### B — keyframes.js (CI red, run 25972035276; depends on A green on the registry)
Root: lockfile drift (`npm ci` EUSAGE `Missing: @popperjs/core`) + residual `@mkbabb/glass-ui: file:../glass-ui` (L64); the absent `file:../value.js` seam is the TS2307.
```
1. package.json L64: @mkbabb/glass-ui  file:../glass-ui → ^3.0.0
2. npm install  → regen lockfile against the registry (resolves value.js@^0.10.0 + glass-ui@^3.0.0 from npm,
   re-adds @popperjs/core). `npm ci` → `tsc --noEmit` then clears (TS2307 gone).
```

### C — glass-ui (CI red, run 26074402780; depends on B; PURE lockfile drift)
package.json is ALREADY `^published` (`@mkbabb/keyframes.js: ^2.1.1`, `@mkbabb/value.js: ^0.10.0`); only the lockfile still resolves both `link:true → ../keyframes.js / ../value.js`.
```
1. npm install  → regen package-lock.json ONLY (no package.json change) so the two @mkbabb/* nodes
   resolve to registry tarballs instead of link:true. Commit the regenerated lockfile.
```

### D — words SPA (genuine 404 outage; CI partial)
The `frontend/` Vue SPA (`floridify-frontend`) is published nowhere — no CF-Pages/deploy-pages workflow, no `frontend/package-lock.json`, no wrangler/CNAME. The backend deploys via its EC2 push workflow; the SPA never builds+ships.
```
1. Add .github/workflows/deploy-pages.yml + scripts/pages-deploy.sh modeled on fourier's δ
   (on push to master touching frontend/**: setup-node, npm ci, vue-tsc --noEmit, wrangler pages deploy
   via CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID repo secrets; push-to-master-gated, public-repo-safe).
2. Commit a frontend/package-lock.json (npm ci needs a lockfile).
3. Register the words CF-Pages project + CNAME.
   Separately (guarded): bump frontend @mkbabb/glass-ui ^2.0.0 → ^3.0.0 — depends on C green; 3.0.0 had an alias break.
```

### E — speedtest (NO CI; deps registry-clean → not a cascade victim)
package-lock is registry-clean (glass-ui@2.1.0/keyframes@2.1.1 from npm, vite 8.0.14, no unplugin). **Deploys to `speedtest.friday.institute`, NOT babb.dev** (the long-standing "speedtest.babb.dev down" framing is a category error — retired; see §4).
```
1. Add .github/workflows/ci.yml (setup-node 24, npm ci, type-check/test/build) — modeled on the keyframes.js ci.yml.
2. (optional) a friday.institute-targeted deploy-pages.yml. NO dependency bump needed.
```

### F — api.color + api.sudoku route gaps (repos ABSENT locally → verify-then-fix in-tree)
- **api.color** (value.js/palette-api): `/health`,`/docs`,`/openapi.json` → 404 (routes/auto-docs unmounted). Fix: construct `FastAPI()` without `docs_url=None/openapi_url=None` (or set explicitly) + `app.include_router(health_router)` / `@app.get("/health")`. Cannot quote the offending line (repo not local). Already booked as `inv-22-color` (ADOPTION-ASKS §4).
- **api.sudoku** (csp-solver): `/api/v1/solve` → 404 — the solve router mounts at prefix `/v1` not `/api/v1`. Fix: `include_router(..., prefix="/api/v1")` (or add the `/api` segment app-level). Already booked as Ask 6.

### G — glass-ui ConfiguratorLayer a11y (surfaced by H.W1)
The collapsed `ConfiguratorLayer` body sets `aria-hidden="true"` while keeping focusable children (omits `inert`) — an axe `aria-hidden-focus` **serious** violation, the reason fourier's a11y keystones are `test.fixme`'d. Fix: apply `inert` to the collapsed layer body in glass-ui, publish, then the app un-fixmes via the guarded `^2→^3` bump. Already booked as `glass-ui-a11y` (ADOPTION-ASKS §4).

## §3 — Bounded inv-16′ commit list (each its own commit, per-repo green-CI-gated; OWNER-applied)

1. `value.js`: `chore(deps): unplugin-vue-markdown ^32 (vite ^8 peer) + @mkbabb/* file:→^published + regen lockfile` — clears the ERESOLVE cascade head.
2. `keyframes.js`: `chore(deps): @mkbabb/glass-ui file:→^3.0.0 + npm install lockfile regen` — clears EUSAGE/@popperjs + TS2307. *(after 1)*
3. `glass-ui`: `chore(deps): regenerate package-lock.json so @mkbabb/{keyframes.js^2.1.1,value.js^0.10.0} resolve from registry` — no package.json change. *(after 2)*
4. `words`: `feat(deploy): add deploy-pages.yml + scripts/pages-deploy.sh (fourier δ model) + commit frontend/package-lock.json` — ends the SPA 404.
5. `words`: `chore(deps): frontend @mkbabb/glass-ui ^2→^3` — guarded. *(after 3)*
6. `speedtest`: `ci: add ci.yml gate (setup-node 24, npm ci, type-check/test/build)` — close the no-CI gap. (deploy = friday.institute)
7. `api.color`: `fix(router): mount /health,/docs,/openapi.json` — verify-then-fix in-tree.
8. `api.sudoku`: `fix(router): prefix /v1→/api/v1 so /api/v1/solve resolves` — verify-then-fix in-tree.
9. `glass-ui`: `fix(a11y): inert on collapsed ConfiguratorLayer body (aria-hidden-focus)` — then app `^2→^3` un-fixme.

## §4 — Constellation model corrections recorded here

- **speedtest = `speedtest.friday.institute`, NOT babb.dev.** `speedtest.friday.institute` → 200; `speedtest.babb.dev` → 404 is EXPECTED. speedtest is a SEPARATE suite that retains a babb.dev *deploy-webhook arm* (shared host/dispatcher) but serves friday.institute. All prior "speedtest.babb.dev down / :8140 teardown" framing (D/E/F/GA2/survey) is a **category error — retired, not re-asserted.** "Handle speedtest regardless" = CI gate (ask 6E) + the doc correction (here), domain-agnostic. (The fuller friday.institute reconciliation across the docs is H.ζ.)
- **`~/Programming/colors` is NOT api.color** — it is a 2021 pure-TS color util (`@mkbabb/colors@1.0.1`), no FastAPI, not part of the cascade.

## §5 — Disposition

ε is **BOOKED, not executed**, per the user's 2026-06-01 decision. No sibling repo was touched; fourier's write surface this wave is `fourier-analysis/docs/**` only (inv-16 held). The nine asks above carry the *exact* fixes (verified against the live files at Wχ.3) so the owner can apply each on a clean checkout with no further investigation. They enter the 30-day stale-watch (re-triggered at ζ). The ADOPTION-ASKS §4 table is updated with the cascade asks. inv-16′ governed: enabled, ledgered, named — and, here, deliberately not compelled.
