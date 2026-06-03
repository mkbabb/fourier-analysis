# J — constellation-adoption fold (dev.sh/deploy.sh standard · screenshot inventory + archival · visual-evidence protocol · cruft booking)

**Wave**: J.W0-adjacent (DEV/audit intake — the open-window ledger). **Authored**: 2026-06-02.
**Mode**: ADDITIVE + DOCS-ONLY. Nothing in this document mutates code, scripts,
or build config; every action it names is BOOKED for a later IMPL wave, not
executed here. The repo tree is clean at HEAD (below) — this fold touches only
`docs/tranches/J/`.

This is fourier's repo-side fold of the constellation deliverables value.js
authored + validated this session (the SOURCE docs are repo-qualified, NOT
copied: `value.js:docs/dev-deploy-standard.md`,
`value.js:docs/tranches/K/audit/screenshot-catalogue-2026-06-02.md`,
`value.js:docs/tranches/K/design/K.W1-visual-evidence-protocol.md`, and the
shared precept submodule `docs/precepts/instructions/tranche/SPEC.md` §"The π
visual-runtime lane" §"Before/after + compare-at-close"). It records what fourier
ADOPTS, what is already in place, and what is booked — grounded in fourier's own
real state, NOT value.js's.

It coexists with fourier's own already-authored deploy view
(`docs/constellation/DEPLOY-STANDARDIZATION-DESIGN.md`, the F-ζ thread; the
`mkbabb/deploy` repo decision at its §6) — the `dev.sh`/`deploy.sh` CLI-surface
standard is the *local-dev + deploy-trigger interface* layer above that design's
host-spine/CI/hardening layer; the two compose, they do not conflict.

---

## §0 — fourier real-state record (cited)

| Fact | Value |
|---|---|
| HEAD | `36f760e` — *docs(constellation): author CONSTELLATION.md — the single orchestration manifest* (2026-06-02 16:36 -0400) |
| Branch | `master`; working tree CLEAN (`git status --short` = 0 entries) |
| Active tranche | **J** (the visualization REMIX tranche; AUTHORED-only, awaits "Begin") |
| Backend version | `pyproject.toml` `fourier-analysis 0.1.0`; Python ≥ 3.12; FastAPI/uvicorn (`[web]` extra) on **uv** |
| Frontend version | `web/package.json` `fourier-analysis-web 0.1.0`; Vue + Vite |
| App shape | **fullstack** — FastAPI (`api.main:app`, uvicorn) + Vue/Vite SPA (`web/`) + MongoDB 8.0 (docker `mongo:8.0`, `docker-compose.yml`) + a filesystem blob backend (`image_blobs` volume, C.W5) |
| Frontend routes | `/` `/paper` `/v/:slug` (visualization) `/w/:imageSlug?` (workspace) `/gallery` `/equation` `/morph` `/demo/shape-extractor` `/s/:slug` (`web/src/router/`) |
| Precepts submodule | `docs/precepts` @ `63240e6` (`heads/main`) — SAME pointer value.js carries |
| Existing dev orchestrator | `scripts/dev.sh` (3.6 KB, pre-standard shape — see §1) |
| Existing deploy surface | `scripts/deploy-hook.sh` (hardened host hook), `scripts/pages-deploy.sh` (CF Pages), `scripts/e2e.sh`, `scripts/conformance-probe.sh` |

**Audit-dir convention note.** fourier's tranches keep diagnostics under
`docs/tranches/<T>/audit/*.md`; screenshot captures live under
`docs/tranches/<T>/audit/W<N>-screenshots/` (the A-tranche shape) or under
`docs/audits/runs/<date>-<T>-audit/screens/`. J had no `audit/` dir before this
fold; this doc opens it. The visual-evidence protocol (§3) reuses this existing
convention rather than introducing a parallel top-level `screenshots/` tree.

---

## §1 — (a) dev.sh / deploy.sh standard adoption (BOOKED)

value.js owns + validated the one-CLI-shape standard
(`value.js:docs/dev-deploy-standard.md`); fourier is row **BOOKED (draft ready)**
in its §4 rollout table:

> `fourier-analysis | fullstack | 9100 : 9101 | docker mongo:8.0 | FastAPI/uvicorn (uv) + Vue; unset VIRTUAL_ENV; prod TLS MONGO_URI treated as operator-owned | BOOKED (draft ready)`

### §1.1 — Current `scripts/dev.sh` vs. the standard (the delta the adoption closes)

fourier already ships a `scripts/dev.sh` — and it already carries the
fourier-specific CONFIG the standard's draft prescribes: ports **9100/9101**
(`dev.sh:14-15`), `unset VIRTUAL_ENV` (`dev.sh:7`), `uv run uvicorn api.main:app
--reload` (`dev.sh:74`), the prod-TLS `MONGO_URI` treated as operator-owned with
a local-docker fallback (`dev.sh:41-43`), the `kill_tree` recursive teardown
(`dev.sh:28-32`), and `--strictPort` Vite (`dev.sh:84`). It is the **pre-standard
shape**, not a non-conformant one. The adoption is a conformance rewrite onto the
canonical template, NOT a from-scratch authoring.

| Standard surface (`value.js:dev-deploy-standard.md §1`) | fourier's current `scripts/dev.sh` | Adoption delta |
|---|---|---|
| Subcommands `up\|down\|status\|logs\|build\|test` | bare invocation only (≈ `up`) | ADD the 5 missing subcommands |
| `up` is the default (bare == `up`) | already the only behavior | rename to explicit `cmd_up` dispatch |
| Uniform exit-code table (0/1/2/3/4/5/6/7) | generic `exit 1` on no-free-port; no usage/status codes | ADOPT the table (esp. 5 missing-env, 6 missing-dep, 7 no-free-port) |
| Fail-explicit: every prereq checked, one actionable line, no `\|\| true` on load-bearing checks | mongo fallback is silent (`MONGO_URI:-localhost`, `dev.sh:43`); no `require_bins`/docker-daemon check | ADOPT `require_bins` + the announced (not silent) mongo fallback |
| `.env` discovery with `REQUIRED_ENV` contract + dev sentinels | sources `.env` (`dev.sh:10`); `ADMIN_TOKEN:-dev` sentinel present; no `REQUIRED_ENV=()` declaration | ADOPT the explicit `REQUIRED_ENV=()` (fourier dev needs none — sentinels cover it) |
| TCP-probe port resolution (IPv4+IPv6) | `lsof`-based probe (`dev.sh:18-25`) | ADOPT the `/dev/tcp` probe (no `lsof` dependency) |
| `trap cleanup EXIT INT TERM` + recursive `kill_tree` | already present (`dev.sh:63-70`) | KEEP (already conformant) |
| `logs` via `tail -f .dev/logs/*.log` | no log dir; children inherit stdout | ADD `.dev/logs/` + the `logs` subcommand |

**Per-repo divergence the standard sanctions for fourier** (`dev-deploy-standard.md §1` per-SHAPE + §4 row):
- **No Mongo replica set.** Unlike value.js (whose api uses multi-document
  transactions and needs `--replSet rs0`), fourier-J's remix CORE is
  *deliberately* re-expressed as **ordered idempotent content-addressed writes,
  NO Mongo transaction** (`design/J.W1-crud-remix.md §11`; J.md §7). fourier's
  `NEEDS_MONGO=1` provisions a **bare** docker `mongo:8.0` (the
  `docker-compose.yml` image), not a replica set. This is fourier's clean
  divergence from value.js's CONFIG — the inverse note value.js records about
  itself.
- **`unset VIRTUAL_ENV`** before `uv run` (the uv-in-a-venv shadowing guard,
  already in `dev.sh:7`).
- **Prod-TLS `MONGO_URI` is operator-owned** — when `.env` carries the real
  prod TLS URI, `dev.sh` must NOT provision a local mongo over it (the standard's
  `ensure_mongo` "external — operator owns that target" branch).
- **Backend runner is `uv run uvicorn`**, frontend is `npx --prefix web vite`.

### §1.2 — deploy.sh standard (`dev-deploy-standard.md §5`)

fourier's deploy surface is the standard's REFERENCE shape on the backend side:
`scripts/deploy-hook.sh` is the hardened spine (flock + dirty-tree-fail-loud +
bounded health-gate + rollback-on-rollback) the standard names as the
git-push→webhook→`deploy.babb.dev/hooks/<repo>` pattern, and
`scripts/pages-deploy.sh` is the CF-Pages frontend recipe. The adoption ask is
the thin operator-facing `scripts/deploy.sh [all|api|frontend]` *wrapper* over
those two — `deploy.sh api` (push + poke the per-repo webhook + health-gate) and
`deploy.sh frontend` (the CF Pages wrap). This composes with — does not replace —
fourier's own `DEPLOY-STANDARDIZATION-DESIGN.md` F-ζ thread + the `mkbabb/deploy`
spine repo (its §6).

### §1.3 — The adoption ask (BOOKED, not executed here)

> **BOOKED — `scripts/dev.sh` conformance rewrite + `scripts/deploy.sh` wrapper.**
> Land the canonical template (`value.js:dev-deploy-standard.md §2`) with
> fourier's CONFIG block filled (SHAPE=fullstack, 9100:9101, `NEEDS_MONGO=1`
> bare-mongo, `unset VIRTUAL_ENV`, `uv run uvicorn`, operator-owned prod
> `MONGO_URI`); add the thin `deploy.sh` wrapper over the existing
> `deploy-hook.sh` + `pages-deploy.sh`. This is a cross-repo IMPL rollout step
> per `value.js:dev-deploy-standard.md §4`, its own per-repo commit, NOT
> performed under J's tranche-writing scope and NOT a J wave. **This doc does not
> create `scripts/dev.sh` or `scripts/deploy.sh`** — the existing `dev.sh` is left
> untouched.

---

## §2 — (b) Screenshot inventory + date-stamped archival plan + current-app-state

### §2.1 — Inventory (file-verified at HEAD `36f760e`)

The constellation catalogue's fourier row
(`value.js:.../screenshot-catalogue-2026-06-02.md §1`) is reconciled against the
real tree:

| Class | Location | Count (verified) | Tracked? | Catalogue row | Reconciliation |
|---|---|---|---|---|---|
| LOOSE SCRATCH | repo-root `w2-workspace-configurator.png` | 1 | **untracked** | "1 (`w2-workspace-configurator.png`)" | matches; note it is UNTRACKED (not a `git mv` candidate — see §2.2) |
| Archived doc captures | `docs/tranches/A/audit/{W2,W3,W3.5,W5}-screenshots/` | 16 + 4 + 21 + 7 = **48** | tracked | folded into the "W2/W3/W3.5/W5-screenshots" entry | matches the shape |
| Archived doc captures | `docs/audits/runs/2026-05-27-D-audit/screens/` | **6** (`d-{equation,gallery,morph,paper,shape-extractor,visualize}.png`) | tracked | "2026-05-27-D-audit/screens" | matches |
| App assets (NOT screenshots) | `assets/**` (incl. `epicycle-reconstructions/`, `portraits/`, `animals/`) | ~51 PNG (28 top + 17 + 5 + 1) | tracked | "80 assets" | catalogue over-counted; these are app DATA, out of visual-protocol scope |
| e2e snapshots | (none on disk) | **0** | — | "13 e2e snapshots" | RECONCILED: the 7 `web/e2e/*.spec.ts` specs exist but commit **no** baseline snapshot PNGs at HEAD; the catalogue's "13" does not materialize on disk — recorded as drift, no action |
| Cruft — `.playwright-mcp/` | repo-root | 114 MB (console `.log` + page `.yml` scratch) | **gitignored** (`.gitignore:66`) | "114 MB" | matches; already ignored — see §4 |
| Cruft — paper log | `paper/fourier_paper.log` | 1 | **gitignored** (`.gitignore:17` `paper/*.log`) | "`fourier_paper.log`" | matches; already ignored — see §4 |

**Total awaiting first-time archival**: **1** loose-scratch PNG (the W2
configurator capture). The 54 archived doc captures (48 A-tranche + 6 D-audit)
already live under `docs/` in the canonical convention — they need only the
`baseline/`+`close/` reconciliation (§3), not relocation.

### §2.2 — Date-stamped ARCHIVAL plan (BOOKED — archive-not-delete; executed at J close)

Per the protocol's no-naive-delete rule
(`value.js:K.W1-visual-evidence-protocol.md §2`; precept SPEC.md §"Before/after +
compare-at-close" "Archive, never naive-delete"):

| Item | Owning surface | Booked disposition | Target |
|---|---|---|---|
| `w2-workspace-configurator.png` (root, **untracked**) | the W2 workspace configurator (the squared-inner-rounding P5 defect captures live here) | **ARCHIVE** — `git add` it into a date+tranche-stamped baseline leaf, then remove the root copy in the same ledgered move (archive, not bare-`rm`). Because it is UNTRACKED, the move is `git add <target>` + `rm <root>`, not `git mv`; the J-close ledger records it as a first-time archival with rationale, zero data loss. | `docs/tranches/J/audit/J.W5-visual-runtime/baseline/2026-06-02-Jopen/workspace-configurator-<WxH>-<light\|dark>.png` (the workspace surface is a W5/WC design-refinement target — gallery/diff-viewer/publish UI; the configurator capture seeds that wave's baseline) |
| `docs/tranches/A/audit/{W2,W3,W3.5,W5}-screenshots/` (48, tracked) | A-tranche surfaces (gallery/equation/visualize/paper) | **RETAIN in place** (already archived); reconcile into the `baseline/`+`close/` split only if a J-affected surface (§3) reuses them as a retroactive BEFORE | no relocation |
| `docs/audits/runs/2026-05-27-D-audit/screens/` (6, tracked) | D-audit per-route state (`d-gallery`, `d-visualize`, `d-morph`, `d-paper`, `d-equation`, `d-shape-extractor`) | **RETAIN; PROMOTE as J's retroactive BEFORE** for the gallery + visualize routes (the closest archived pre-J capture of the CORE-adjacent surfaces) | cite as `baseline/` source in J.W5 DELTA |

> No file is moved by this catalogue. The archival above is the booked action a
> J visual-shipping wave close (W5/W8) executes; this doc is the ledger, not the
> mover. Archive-not-delete is binding — zero `rm` without a recorded archival
> target.

### §2.3 — Current-app-state record (the protocol's CURRENT-STATE anchor)

| Surface | State at HEAD `36f760e` | Note |
|---|---|---|
| Backend | FastAPI `api.main:app` on uvicorn; MongoDB 8.0; filesystem blob backend (`image_blobs`); rate-limiter pinned single-replica (A.W4) | clean; J adds remix/publish endpoints additively (no brittleness window, J.md §9) |
| Frontend routes | `/` `/paper` `/v/:slug` `/w/:imageSlug?` `/gallery` `/equation` `/morph` `/demo/shape-extractor` `/s/:slug` | the J CORE renders on `/gallery` (most-forked sort), the diff-viewer, and the publish/visibility UI (J.W5 targets) |
| Known visual state — the P5 defect | **OPEN, booked-not-shipped**: the squared `ConfiguratorLayer` INNER-section rounding (the literal user defect captured in `w2-workspace-configurator.png`) is a discrete `glass-ui-P5-inner-rounding` ADOPTION-ASKS row (`docs/constellation/ADOPTION-ASKS.md`; J.md PROGRESS A5) — NOT marked satisfied until the inner sections round. This is fourier's analogue of value.js's open blob-position regression: a known, captured, booked visual defect the visual-evidence protocol exists to track close-to-close. |
| value.js blob-position regression | **N/A to fourier** — fourier has no hero WebGL2 blob; the analogous open visual defect is the P5 inner-rounding above. The protocol's WebGL/canvas present/positioned assertion (`SPEC.md` §"Before/after") nonetheless DOES apply to fourier's epicycle/morph `<canvas>` surfaces (`/morph`, `/v/:slug`) — a static screenshot of an epicycle canvas can read as a false blank, so any J visual capture of those routes pairs the screenshot with a DOM-rect + non-empty-pixel probe, exactly as value.js's blob assertion prescribes. |

---

## §3 — (c) Visual-evidence before/after protocol adoption + precepts-sync (BOOKED)

### §3.1 — Protocol adoption

fourier adopts the paired before/after visual-evidence protocol
(`value.js:K.W1-visual-evidence-protocol.md`; precept SPEC.md §"Before/after +
compare-at-close") at its next visual-shipping close. J **is** a visual-shipping
tranche (it ships the WC 4-lens design-refinement on the gallery/diff-viewer/
publish UI at W5, J.md §4) — so the π lane is **binding at J close** and runs
**paired**, not single-snapshot.

**J affected-page set** (derived from the J wave diff per the protocol, not from
memory — the routes the CORE + WC waves render on):

| Slug | Route | Why affected (J wave) |
|---|---|---|
| `gallery` | `/gallery` | the `most-forked` write-backed sort (W2 CORE), `content-visibility` on the grid (W4 CWV), WC layout/typo lens (W5) |
| `diff-viewer` | the `GET /:slug/diff` consumer (CSS Custom Highlight render, J.md §8 named-forward) | the recorded atom-diff render (W2 CORE consumer), WC diff-viewer lens (W5) |
| `publish-ui` | the publish/visibility control surface | the `POST /:slug/{publish,unpublish}` flip (W2 CORE publish half), WC lens (W5) |
| `visualization` | `/v/:slug`, `/w/:imageSlug?` | remix entry point + the epicycle `<canvas>` (canvas present/positioned assertion applies) |
| `morph` | `/morph` | `scheduler.yield()` on the morph hot path (W3 PERF); epicycle canvas assertion applies |

**Archival dir** (reusing fourier's existing convention, the protocol's §2 shape):

```
docs/tranches/J/audit/J.W5-visual-runtime/
  baseline/2026-<MM-DD>-Jopen/   # BEFORE — J-open HEAD (or D-audit screens promoted as retroactive baseline)
    <slug>-<WxH>-<light|dark>.png
  close/2026-<MM-DD>-Jclose/      # AFTER — J close HEAD
    <slug>-<WxH>-<light|dark>.png
  DELTA.md                        # per-page before→after compare table + verdict
```

The per-page `DELTA.md` verdict (feature-completeness + regression: position,
clipping, contrast, missing canvas content) is a **close-blocker** on any
unintended delta — including the P5 inner-rounding (§2.3): J close must either
resolve it or carry it with its named external gate, never silently note it.

### §3.2 — Precepts-sync (BOOKED — submodule pointer bump)

**Verified state**: the shared precept subsection §"The π visual-runtime lane"
§"Before/after + compare-at-close" is **NOT yet in fourier's precepts submodule**.

- fourier `docs/precepts` @ `63240e6` (`f27627e` is the latest `SPEC.md` commit) —
  `grep "Before/after + compare-at-close" instructions/tranche/SPEC.md` → **0
  matches** (absent).
- value.js's precepts working copy HAS the subsection (2 matches) but it is
  **uncommitted** (`git status` → ` M instructions/tranche/SPEC.md`; latest
  committed `SPEC.md` is the same `f27627e`).

So the sync is genuinely a two-step BOOKED action, NOT done:

> **BOOKED — precepts submodule pointer bump.** (1) value.js commits + pushes the
> canonical precepts commit carrying the §"Before/after + compare-at-close"
> subsection (value.js owns the precept authoring); (2) fourier bumps
> `docs/precepts` from `63240e6` to that new canonical SHA, exactly as the
> `.gitmodules` `heads/main` contract prescribes. This is a submodule-pointer
> commit, NOT a code change, and is performed when the canonical precepts commit
> lands — not under this fold. fourier's ι integrity-sweep at J close
> (`SPEC.md` §Close) walks `git log -- 'docs/precepts/'` and will record the
> bump as an EXPECTED, ledgered precept change (not an unexpected one that halts
> close).

The protocol is enforced **structurally** (the paired-π lane is a binding close
step in `SPEC.md`, verified by close-time review + the `DELTA.md` artefact) — NOT
by a committed `proof:*` script. The grep-based `proof:*` codification idiom is
RETIRED (the SPLIT-K-PLUS-L decision; `screenshot-catalogue §5`). No `proof:*`
script is added.

---

## §4 — (d) Cruft / temp-file cleanup booking

From the catalogue's fourier "Other cruft" column, reconciled against
`.gitignore`:

| Cruft | Size / count | gitignore state | Booked disposition |
|---|---|---|---|
| `.playwright-mcp/` | 114 MB (console `.log` + page `.yml` scratch) | **already gitignored** (`.gitignore:66 .playwright-mcp/`) | **BOOKED prune** — gitignored so it never enters history, but the on-disk 114 MB is local scratch; a local `rm -rf .playwright-mcp/` is a developer-machine hygiene step (NOT a repo commit, NOT in scope here). Recorded so the J ι-sweep notes it is ignored-and-prunable, not tracked debt. |
| `paper/fourier_paper.log` | 1 LaTeX build log | **already gitignored** (`.gitignore:17 paper/*.log`) | same — gitignored build artefact; local prune only, no repo action |
| `w2-workspace-configurator.png` (root) | 1, untracked | NOT ignored | **ARCHIVE per §2.2** (archive-not-delete) — the one item that is neither tracked-and-fine nor ignored; it is the loose scratch the protocol targets |
| `.DS_Store` (root + `docs/`) | 2 (`./.DS_Store`, `docs/.DS_Store`) | NOT ignored | **BOOKED hygiene sweep** — add `.DS_Store` is already at `.gitignore:25`, yet two pre-existing copies persist on disk; a separate `.DS_Store` hygiene sweep (verify-ignored + local-delete) is booked, out of visual-protocol scope, at the same J-close ι-sweep. Verify they are untracked before any delete. |

**Net cruft action for J**: the only repo-affecting booked action is the §2.2
archival of the single untracked root PNG. The 114 MB `.playwright-mcp/` and the
LaTeX log are **already gitignored** — they are local-machine scratch, prunable
without any repo commit, and are recorded here only so the ι-sweep does not
re-flag them as tracked debt.

---

## §5 — Booked-action ledger (summary — zero executed here)

| # | Action | Owner | When | Scope |
|---|---|---|---|---|
| 1 | `scripts/dev.sh` conformance rewrite onto the canonical template (fullstack CONFIG, bare-mongo, `unset VIRTUAL_ENV`, `uv run uvicorn`) | cross-repo dev.sh rollout (`value.js:dev-deploy-standard.md §4`) | rollout dispatch | IMPL — own commit, NOT a J wave |
| 2 | thin `scripts/deploy.sh [all\|api\|frontend]` wrapper over existing `deploy-hook.sh` + `pages-deploy.sh` | same | rollout dispatch | IMPL — own commit |
| 3 | archive `w2-workspace-configurator.png` → `J.W5-visual-runtime/baseline/2026-<MM-DD>-Jopen/` (archive-not-delete) | J visual wave (W5/W8) | J close | IMPL/ledger |
| 4 | adopt paired before/after π protocol; emit per-page `DELTA.md` for the J affected-page set; canvas present/positioned assertion on `/morph` + `/v/:slug` | J.W5 → J.W8 close | J close (binding) | IMPL — J wave |
| 5 | bump `docs/precepts` `63240e6` → canonical SHA carrying §"Before/after + compare-at-close" (after value.js commits it) | maintainer / J ι-sweep | when canonical precepts commit lands | submodule pointer commit |
| 6 | `.DS_Store` + `.playwright-mcp/` + `paper/*.log` local hygiene prune (all gitignored or to-be-verified-ignored) | developer machine / J ι-sweep note | J close | local-only, no repo commit |

All six are BOOKED. This document executed none of them; it added one doc (this
file) and the J `audit/` dir, and appended one pointer line to J's PROGRESS log
(§6). No code, no script, no build config, no submodule pointer, no git commit
was touched.
