# DA6 — adversarial guard on the tranche-D shape · design/Playwright/cohesion thread scoping

**Lane**: DA6 (fourier-analysis tranche-D DEVELOPMENT phase — planning only; READ-ONLY; ONE deliverable; NO source edits, NO commits).
**Date**: 2026-05-27. **HEAD**: post-C-close (`27c883b` + close-record); fourier-A/B/C all CLOSED (`c7cfd82`, `fc5b3b0`, C-close). **value.js**: H CLOSED (v0.10.0, `16129e0`); I seeded-unscoped.
**Charter (user, verbatim intent)**: assemble a LARGE tranche D — *integrate+deploy all C host residuals; a 4-agent design-refinement wave (via the `frontend-design` plugin); cross-repo palette/visualization CRUD cohesion (fourier + value.js); Playwright-test both apps across local/dev/prod.* Precepts: NO quick solutions/workarounds; idiomatic/gestalt; architectural transposition for elegance/simplicity/performance DESIRABLE; NO legacy; KISS (invariant 12). DA6 is the **adversarial guard + concrete scoping of the new threads** — the over-engineering + scope-sprawl sentry.

**Convention modelled on**: `docs/audits/runs/2026-05-27-C-audit/CA6-prompts-precepts-guard.md §4` (the adversarial plan-shape guard, the per-candidate KISS-guardrail list, the recommended scope boundary). DA6 mirrors CA6's `§4` discipline verbatim in shape: each candidate thread gets a **smallest-honest-mechanism** + a **named trap to reject** + a per-line KISS justification for anything beyond the minimum.

**Sibling lanes (DA1–DA5)**: DA6 supplies the guard + new-thread scoping layer; it does not re-derive the C-residual integration backlog (a DA-sibling lane's ground-truth) nor the CRUD-substrate diff. Where DA6 cites a residual it cites `C/FINAL.md §6` directly.

---

## §0 — Goal criterion and completion criterion (paired)

**Goal.** Give the D-authoring round (a) a per-candidate over-engineering guard naming the smallest-honest-mechanism and the trap to reject, with KISS justification; (b) a concrete screen-by-screen scope for the 4-agent design-refinement wave grounded in `router/index.ts` + `components/`; (c) a concrete Playwright-validation scope grounded in the e2e spec list of BOTH repos, defined as a status matrix not new authoring; (d) an adversarial pass over the "architectural-transposition" mandate separating genuine wins from gold-plating; (e) a recommended D thread/wave structure with a hard agent-budget ceiling and an explicit must-NOT list.

**Completion.** This document carries all five (§1 guard, §2 design-thread scope, §3 Playwright scope, §4 transposition lens, §5 D structure). Every screen/route claim grounds in `file:line`; every e2e claim cites the spec path. Both criteria hold at this writing.

---

## §1 — Over-engineering guard (per candidate thread)

Tranche D fronts **four** candidate theses. A tranche, per `TRANCHE-AND-WAVE-SPEC.md §Tranche`, "closes a *single* binding question" — four theses already strains that. The guard's first job is to keep each thread at its smallest-honest-mechanism. Verdict format mirrors `CA6 §4`: **smallest-honest-mechanism** | **trap to reject** | **KISS justification for anything beyond**.

### (a) Thread INFRA/DEPLOY — integrate + deploy the C host residuals

**Smallest-honest-mechanism.** C did the hard part. `C/FINAL.md §6` enumerates the host-coupled residuals, each with a *runnable procedure already recorded*: (1) re-point the live `/opt/deploy/hooks.json` fourier `case` arm at the tracked `scripts/deploy-hook.sh` (the arm already exists — `DEPLOY-RECONCILE.md §1`); (2) run `scripts/gen-mongo-certs.sh` on the host + apply the `infra/tls.md §9` 3-site compose diff + live ping (the prod-TLS cutover); (3) run `python -m api.scripts.migrate_image_blobs` against prod data (the code + dry-run + harness are proven repo-local); (4) capture the deploy-chain + bad-commit-rollback transcripts (the G10/G11 host-activation gates, `DEPLOY-RECONCILE.md §5–5.1`); (5) promote the staged `infra/{tls.md,blob-backend-dr.md,deploy.md}` content into the `docs/precepts/` submodule + bump the gitlink. D's infra thread is therefore **execution of recorded procedures + transcript capture**, not design. The whole thread is *host-ops choreography*: SSH in, run the named commands in the named order, capture the named logs, flip the named gates from "host-activation pending" to "GREEN."

**Trap to reject.** Re-architecting the shared host or adopting k8s/registry/MinIO/S3. `C/FINAL.md §3` records the KISS rejections that *already HELD*: GridFS/MinIO/S3, a webhook framework, a new container, a registry, mutual TLS+ACME. D must NOT reopen any of them. The specific adversarial danger: the shared `/opt/deploy/dispatch.sh` serves four sibling repos (`words`, `speedtest`, `value.js`, `csp-solver` — `DEPLOY-RECONCILE.md §3`), and "harden the shared dispatcher" is genuinely tempting now that D touches the host. **REJECT** rewriting the shared dispatcher as a fourier-D act — it is constellation-level coordination across five repos (`DEPLOY-RECONCILE.md §3`, §6), explicitly *proposed, not imposed*. D wires the fourier arm only (minimal: point the existing `case` at the tracked script); the shared-dispatcher rewrite stays a named residual unless the user re-mandates a constellation-wide host-ops tranche.

**KISS justification for anything beyond the minimum.** The only beyond-minimum act D should consider is the `0664→0600` secret-permission hardening on `hooks.json`/`/opt/deploy/.env` (`DEPLOY-RECONCILE.md §3.2`) — and even that touches shared host state, so per-line: it is justified ONLY if it can be scoped to fourier's own hook entry without affecting the four siblings; otherwise it is a named residual. The dirty host tree (`M` on both compose files, stale SHA `8818ae5` — `DEPLOY-RECONCILE.md §3.3`) MUST be reconciled before the first gated deploy or the `$PREV` rollback baseline is unreproducible — that reconcile is mandatory minimum, not gold-plating.

### (b) Thread DESIGN — the 4-agent refinement wave (frontend-design plugin)

**Smallest-honest-mechanism.** A **per-screen findings document** per agent — an inventory of concrete, located refinement opportunities (spacing, typography, hierarchy, motion, state-coverage, a11y, dark-mode parity), each grounded in `component:line` with a before/after sketch — **NOT a redesign**. The user said *refinement*. Refinement is a delta against an existing, shipped, A-polished surface (A closed the stylistic-drift thread — `C/FINAL.md §1`: "A retired fourier's stylistic drift"). The design thread's deliverable is the *findings*, ranked by impact-over-effort; the *implementation* of accepted findings is D-execution (or a later wave), not the analysis wave.

**Trap to reject.** A full redesign/rebrand when refinement is asked. This is the load-bearing guard for this thread, because **the `frontend-design` plugin's own charter pulls hard toward maximalist greenfield generation**: its `SKILL.md` instructs "commit to a BOLD aesthetic direction," "Pick an extreme," "What makes this UNFORGETTABLE," "Bold maximalism… need elaborate code with extensive animations." That is the correct posture for a *new* interface and the **wrong** posture for refining a shipped one. **REJECT** any agent output that proposes a new font system, a new colour identity, a new layout paradigm, or "atmosphere/grain/custom-cursor" theatrics for screens that already have a settled, glass-ui-grounded aesthetic. The plugin is the *tool* (it knows what good frontend looks like); the *brief* must be inverted from "create distinctive" to "audit the existing surface against distinctive-design principles and name the gaps." An agent that returns a rebrand has misread the mandate.

**KISS justification for anything beyond per-screen findings.** A genuine redesign is warranted ONLY for a screen that is demonstrably *unfinished* — and the candidate set is bounded: `/demo/shape-extractor` (a `/demo/*` route, likely a scratch surface) and any screen a DA-sibling flags as never having received A's polish pass. For every *other* screen, beyond-findings work is gold-plating. Per-line rule: an agent proposing more than a findings doc for a settled screen must cite the specific A-era polish gap that justifies it.

### (c) Thread CRUD-COHESION — cross-repo palette/visualization CRUD coherence (fourier + value.js)

**Smallest-honest-mechanism.** A **cohesion findings/diff document**: compare the two apps' CRUD *user experience* (the save→publish→unlist→delete→restore lifecycle, the admin/flagged/audit surfaces, the slug-identity addressing, the optimistic-update + toast patterns) and name where they *diverge gratuitously* vs *legitimately* (fourier addresses visualizations; value.js addresses palettes/colors — different nouns, so some divergence is correct). The output is a list of "these two should match and don't" items, each grounded in both repos' `file:line`, plus a verdict on whether each divergence is a bug or a domain difference. The CRUD *contracts already exist* in both repos — `B/coordination/CRUD-CONTRACT.md`, `CRUD-CONSTELLATION.md` (fourier) and `value.js/docs/tranches/C/coordination/CRUD-CONSTELLATION.md` + the v2 contract (`value.js/docs/tranches/D/research/Dh-contract-v2.md`). Cohesion is *reconciling against the ratified contract*, not authoring a new one.

**Trap to reject.** Building a shared framework or codegen. This is **the B trap, named verbatim by invariant 16** and adversarially re-certified clear at B close (CA1 §4: `api/lib/crud/` is "genuinely a called-from library, 525 LOC exact" — `cursors.py`, `slugs.py`, `softdelete.py`, `idempotency.py`, `etag.py`, `pinned_cron.py`). **REJECT** any proposal for a `BaseCRUDRouter`, a shared CRUD npm/PyPI package spanning both repos, a schema-codegen step, a coordinator service, or a "unified CRUD DSL." The two apps share a *contract* (the slug-identity model, the cursor-pagination envelope, the soft-delete lifecycle) — they do NOT share *code*, and the cohesion thread must not invert that into control. Per `C/FINAL.md §3` the cross-repo edge is *inverted and conditional* (value.js publishes, fourier consumes a single function) — cohesion is alignment of two independent implementations to one written contract, the opposite of a shared framework.

**KISS justification for anything beyond a findings doc.** The one beyond-findings act that *might* be warranted: lifting a genuinely-shared *contract clause* (e.g. the cursor-envelope shape, or a slug-word list) into the existing `CRUD-CONSTELLATION.md` as the single source of truth — but ONLY if both repos already implement it identically and the lift is documentation, not code. The moment "shared contract" becomes "shared library both repos import," it is the B trap. Per-line: any code-level shared artefact requires a named consumer in *both* repos plus an inv-16 adversarial certification, or it is rejected.

### (d) Thread TESTING — Playwright validation of both apps across local/dev/prod

**Smallest-honest-mechanism.** **Run the existing Playwright suites against three base URLs and record a pass/fail status matrix** (app × environment). Both repos already have mature suites: fourier has 7 specs under `web/e2e/` (§3.1); value.js has 36 smoke specs across 5 playwright projects (§3.2). Playwright already supports environment retargeting via base-URL override — fourier's `playwright.config.ts:11` reads `process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"`. So "test both apps across local/dev/prod" is **set the base URL three times and capture three result sets**, not write new tests. The deliverable is a *matrix* (§3.3), not a harness.

**Trap to reject.** A bespoke test harness when Playwright suffices. **REJECT** a custom orchestrator that "runs both repos' suites against three environments and aggregates" — that is a CI/reporting concern Playwright's own HTML reporter + a 6-cell shell loop already cover. **REJECT** also: a new shared test-fixture library across repos, a "test data factory service," or a synthetic-monitoring daemon. KISS: three base URLs × two repos = six `npx playwright test` invocations with an env var; the matrix is assembled from six HTML reports. New *spec authoring* (e.g. a fourier↔value.js CRUD-parity spec, or wiring value.js's `smoke-safari` to fourier) is **D-execution work, explicitly out of the validation thread** (the validation thread proves the *current* state; authoring is a separate decision).

**KISS justification for anything beyond running the existing suites.** Prod runs must be **read-only/idempotent** — the fourier CRUD lifecycle spec (`visualization-crud.spec.ts`) creates → publishes → deletes real entities, which is destructive against prod data. Per-line: prod validation runs the *non-mutating* subset (paper-render, gallery-read, a11y keystones, health probes) and explicitly SKIPS the destructive CRUD lifecycle against prod — that subsetting is mandatory minimum, not gold-plating. Anything beyond (new specs, new projects, CI wiring) is D-execution, not validation.

---

## §2 — Scope the design thread (the 4 frontend-design agents)

### §2.1 — Every fourier screen/route that must be analyzed

Grounded in `web/src/router/index.ts` (the authoritative route table) cross-referenced with the lazy-import component targets:

| # | Route | Name | Component (`router/index.ts:L`) | What it is |
|---|---|---|---|---|
| 1 | `/` | (redirect) | `getSavedTab()` → last tab or `/paper` (`:15-17`) | entry redirect — no own screen; verify the redirect UX |
| 2 | `/paper` | paper | `paper/PaperView.vue` (`:19-22`) | the windowed LaTeX paper reader (sidebar TOC, search, mobile floating TOC, scroll-nav) |
| 3 | `/v/:visualizationSlug` | visualization | `visualization/VisualizationView.vue` (`:27-32`) | a SAVED visualization entity (read/replay of a slug-addressed viz) |
| 4 | `/w/:imageSlug?` (alias `/visualize`) | workspace | `visualization/VisualizationView.vue` (`:33-39`) | the pre-save working session — upload, contour-edit, compute, animate (the same component as #3, working mode) |
| 5 | `/gallery` | gallery | `visualization/GalleryView.vue` (`:41-45`) | the public gallery — grid/infinite-grid, featured carousel, marquee, search, drafts, admin banner/panels |
| 6 | `/equation` | equation | `equation/EquationView.vue` (`:47-50`) | the function→Fourier-series equation explorer (function input, coefficient panel, convergence plot, frequency graph) |
| 7 | `/morph` | morph | `morph/FourierMorphDemo.vue` (`:52-55`) | the Fourier morph demo (harmonic-level grid, phase config, shape preview) |
| 8 | `/demo/shape-extractor` | shape-extractor | `morph/FourierShapeExtractor.vue` (`:57-60`) | a `/demo/*` scratch route — shape extraction harness (candidate "unfinished" surface) |
| 9 | `/s/:slug` | (redirect) | → `/w/:slug` (`:62-64`) | legacy slug redirect — no own screen |

**Cross-cutting surfaces** (not routes, but rendered across screens — every design agent must account for these where they appear): the app header + dark-mode toggle (`layout/AppHeader.vue`, `layout/DarkModeToggle.vue`); the shared UI kit (`ui/{CollapsibleSection,PathPreview,SliderControl}.vue` + `ui/tooltip/`); decorative SVG (`decorative/{FourierMorphSvg,SvgFilters}.vue`); the shared coefficients spectrum (`shared/CoefficientsSpectrum.vue`). **Dark mode** is a first-class axis (memory records "Dark mode paper is totally broken" was an A-era fix — every screen must be analyzed in BOTH themes).

The visualization area is the heaviest screen by far — 20 top-level components (`visualization/*.vue`) plus the gallery sub-area (13 components: `gallery/{AdminAuditLog,AdminFlaggedPanel,AdminUserList,GalleryAdminBanner,GalleryCard,GalleryCardModal,GalleryDraftsSection,GalleryFeaturedCarousel,GalleryGrid,GalleryInfiniteGrid,GalleryMarquee,GallerySearchBar,UserSlugBar}.vue`) plus 9 composables. The split must weight for this.

### §2.2 — Proposed 4-agent split (by surface weight, not route count)

Balance the *component mass*, not the route count — routes #3 and #4 share one component; the gallery sub-tree alone is 13 components.

- **Design agent 1 — Paper reader.** `/paper` (#2): `PaperView`, `PaperSidebar`, `PaperArticleWindow`, `PaperSearch` + `search/*` (7 files), `MobileFloatingToc`, `useScrollNavigation`. The most self-contained screen; one agent owns it whole (it carries A-era polish history — opacity tuning, sidebar glass-ui — so the findings are "did the A polish hold + what's left").
- **Design agent 2 — Visualization workspace.** `/v/:slug` + `/w/:slug` + `/visualize` (#3, #4): `VisualizationView` and the 20 `visualization/*.vue` working-mode components (canvas, controls docks, contour editor, animation, export modal, easing picker, etc.) MINUS the gallery sub-tree. The interaction-densest surface.
- **Design agent 3 — Gallery + admin.** `/gallery` (#5): `GalleryView` + the 13 `gallery/*.vue` components (grid, carousel, marquee, search, drafts, admin banner/flagged/audit/users, cards). A coherent presentation-and-moderation surface; pairs naturally with the CRUD-cohesion thread's fourier half.
- **Design agent 4 — Equation + morph + demo + chrome.** `/equation` (#6: `EquationView` + 8 equation components + convergence sub-tree), `/morph` (#7: `FourierMorphDemo` + 4 morph components), `/demo/shape-extractor` (#8 — the candidate unfinished surface), PLUS the cross-cutting chrome (`layout/*`, `ui/*`, `decorative/*`, `shared/*`) and the **dark-mode parity sweep across all four agents' screens** (one agent owns the cross-screen theme consistency check so it isn't done four inconsistent times).

This is a clean ~even split by component mass (≈10 / ≈20 / ≈13 / ≈19) with no shared-file contention between agents.

### §2.3 — The design-refinement deliverable shape (per agent)

Each agent produces ONE `DA-design-<area>.md` findings doc — **a per-screen findings audit, NOT a redesign, NOT new code**. Required shape (mirrors the audit-lane discipline):

1. **Per-screen inventory** — each screen the agent owns, each in BOTH themes (light/dark), at desktop + mobile breakpoints.
2. **Located findings** — each refinement opportunity as `component:line` + a one-line problem statement + a one-line proposed delta (spacing, type scale, hierarchy, motion, empty/loading/error state coverage, a11y, dark-mode parity, glass-ui adherence). Grounded, not vague.
3. **Impact-over-effort ranking** — so D-execution (a later wave) can take the top N; the findings doc does NOT implement.
4. **A-polish-hold check** — for screens with A-era history (paper especially), an explicit "did the prior fix hold" line.
5. **The hard NO-REDESIGN line** — each doc states up front it is refinement-against-the-shipped-surface; any genuine redesign recommendation (bounded to `/demo/shape-extractor` or a flagged-unfinished screen) is called out as the *exception* with its justification.

**Operational note.** The `frontend-design` plugin is the tool; it must be invoked with the **inverted brief** (audit-the-existing, not generate-distinctive — §1(b)). The app runs locally: backend on `:8000` (per memory), the frontend `vite` dev server on `:3000` (`playwright.config.ts:11`) — **the frontend must be stood up** (`cd web && npm run dev`) for agents to inspect live screens (paired with Playwright screenshots, §3). Findings should reference live-rendered evidence, not source-only inference.

---

## §3 — Scope the Playwright validation

### §3.1 — Existing fourier e2e specs (`web/e2e/*.spec.ts`)

| Spec | Targets | Shape (grounded) |
|---|---|---|
| `paper-performance.spec.ts` | `/paper` | serial perf suite — windowed render, no-page-regress on scroll, far-TOC jump without over-mount, bounded mounted sections + no console errors, appendix/proof/bib canonical render (`:95-194`). Non-mutating ✓ |
| `gallery.spec.ts` | `/gallery`, `/visualize` | gallery renders w/ tabs + search; drafts tab; filter drawer; login emoji+dice; visualizer overlay flex; no console errors (`:3-117`). Non-mutating ✓ |
| `workspace-flow.spec.ts` | `/visualize` | asset-based flow — upload→extract→canvas; image metadata via API; extract-contour asset; compute epicycles; image-blob endpoint cache headers; no console errors (`:9-183`). **Mutating** (creates assets) |
| `contour-extraction.spec.ts` | `/visualize` | per-animal-image upload+extract (data-driven from `ANIMALS_DIR`); control recompute; strategy switch; no console errors. Several `test.skip()` guards (`:45,94,140`). **Mutating** |
| `settings-persistence.spec.ts` | `/visualize` | **whole describe is `.skip`** (`:9`) — session-slug persistence, sample-points, shared-URL load, easing/speed/bases persist. Currently inert. |
| `visualization-crud.spec.ts` | `/visualize`, `/v/:slug` | the heavy lifecycle suite — `upload→draft→publish→unlisted→delete→restore` across viewports (`:451-481`); a11y keystones (workspace clean, ExportModal-open clean) (`:573-583`). **Destructive** (creates+deletes real entities) |
| `visualization-ux.spec.ts` | `/visualize` | B.W2 a11y keystones — workspace default, ContourSettings Configurator-open, ExportModal Dialog-open, AnimationControls dropdown-open all axe-clean (`:64-110`). Non-mutating ✓ |

**Config**: `web/playwright.config.ts` — single `chromium` project, `baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"` (`:11`). Environment retargeting is already a one-env-var operation. **Mutation classification matters**: the destructive/mutating specs (`visualization-crud`, `workspace-flow`, `contour-extraction`) MUST NOT run against prod.

### §3.2 — value.js e2e (the "validate both apps" other half)

value.js has a **mature** Playwright suite — far beyond a healthcheck. `value.js/e2e/smoke/` carries **36 specs** across **5 playwright projects** (`value.js/playwright.config.ts`): `smoke` (user-view + walk + WebGL + flows), `smoke-admin` (5 admin-view + admin-walk + 6 admin-flow specs via an addInitScript admin-auth fixture), `smoke-mobile` (Pixel-7 boot), `smoke-reactivity` (workers:1 wall-clock), `smoke-safari` (iPhone-14 WebKit 30s sustained). The view specs (`views/{browse,extract,generate,gradient,mix,palettes}.spec.ts`) + the flow specs (`flows/{color-propose,login-register,palette-{delete,edit,flag,fork,save},vote-toggle}.spec.ts`) ARE the palette CRUD coverage. So **"validate both apps" for value.js = run its existing 5-project smoke suite**, NOT author a palette-api healthcheck (it has full e2e already). A health-probe (`color.babb.dev` reachable + API `/health` ok) is the *prod-safe subset*, the same way fourier's non-mutating subset is. value.js mutating flows (palette-save/delete/edit/fork, admin flows) MUST NOT run against prod.

**value.js prod**: `color.babb.dev` (CNAME); dev server `vite --port 9000`. **fourier prod**: `fourier.babb.dev` (`docker-compose.prod.yml:7` CORS origin); dev `:3000`; prod bind `127.0.0.1:${HTTP_PORT:-8100}:80` (`:77`). Shared host: `mbabb.fridayinstitute.net:1022`.

### §3.3 — The validation deliverable: a status matrix (NOT new test authoring)

The deliverable is a **status matrix `app × environment × spec-subset → pass/fail`**, assembled from running the *existing* suites with a base-URL override. Authoring new specs is D-execution, explicitly out of scope here.

| App | Local (docker) | Dev | Prod (non-mutating subset only) |
|---|---|---|---|
| **fourier** (`web/e2e`, 7 specs, chromium) | full suite incl. mutating CRUD | full suite | paper-perf + gallery-read + ux/crud **a11y keystones** + health; SKIP `visualization-crud` lifecycle, `workspace-flow`, `contour-extraction` (mutating); `settings-persistence` already `.skip` |
| **value.js** (`e2e/smoke`, 36 specs, 5 projects) | all 5 projects incl. flows/admin | all 5 projects | page-load + view-render + walk + webgl + health; SKIP palette CRUD flows + admin flows (mutating) |

Base-URL plumbing: fourier `PLAYWRIGHT_BASE_URL=https://fourier.babb.dev npx playwright test <non-mutating greps>`; value.js analogously against `https://color.babb.dev`. Each cell records: pass/fail count, the HTML-report path, and any flake/skip with its reason. The matrix is the gate — six cells (2 apps × 3 envs, with prod cells subsetted). Local-docker is the *baseline* cell (must be all-green); dev validates the deploy chain; prod validates the live deploy + the C residual integration (the §1(a) thread's proof that the residuals actually landed on the host).

**Pre-flight**: `settings-persistence.spec.ts` is currently `.skip` (`:9`) — the matrix must record it as inert (not silently counted green). The skipped guards in `contour-extraction.spec.ts` (`:45,94,140`) likewise. Honesty: a skip is a skip, not a pass.

---

## §4 — The architectural-transposition lens (genuine wins vs gold-plating)

The user explicitly wants elegance/simplicity/performance transpositions — but the standing precept-canon also names "transposition for its own sake" as a trap (KISS / invariant 12). C's transpositions were genuine and earned (five identity schemes → one collection; inline-blob → filesystem; manual SSH → webhook — `C/FINAL.md §3`). D's danger is *manufactured* transpositions to justify a large tranche. Adversarial classification:

**GENUINE wins (transpose):**
- **The δ `sampleToSVGPath` consume** (`COLOUR-LIFT.md §2,§5`) — IFF value.js publishes it during D's window: `easings.ts`'s internal sampler collapses onto the library primitive, deleting a real dup. Genuine (named consumer, real dedup, contract-grounded) but **conditional** — fires only on a value.js publish, blocks nothing.
- **The two `colors.ts` dups** (`COLOUR-LIFT.md §2`) — `parseCSSColor`/`color2` duplicate value.js's existing primitives; deleting onto them is a fourier-internal cleanup with NO cross-repo dependency. Small, genuine, low-risk.
- **CRUD-contract consolidation as documentation** (§1(c)) — IF both repos already implement a clause identically, recording it once in `CRUD-CONSTELLATION.md` is a genuine simplification (single source of truth, zero code).

**GOLD-PLATING (reject as transposition-for-its-own-sake):**
- **The `--reload` background-queue** (`C/FINAL.md §6` → fourier-D) — C named this as a D successor BUT the root fix already landed (the one-token watch-narrowing). A full background-compute queue is justified ONLY by a real trigger ("compute outliving a request") that has not been observed in prod. **REJECT** building the queue speculatively; carry it as a named residual with the trigger condition, exactly as C did. Building it now is "performance transposition for its own sake" with no measured need.
- **Any shared CRUD framework/codegen** (§1(c)) — re-rejected here as the headline transposition trap (inv-16, the B trap).
- **The `Palette`/`colorScale` domain model** (`COLOUR-LIFT.md §2` "held latent") — fourier has no gradient/scale consumer (`VIZ_COLORS.rainbow` never sampled). Building it is the "library nobody calls" anti-pattern + an inv-15 domain-in-app violation. **REJECT** — held latent until a real consumer lands.
- **A "unified design system" extraction** from the design thread — refinement findings do NOT warrant lifting fourier's UI kit into a shared package. The glass-ui dependency already IS the shared design substrate (`@mkbabb/glass-ui` file-dep). **REJECT** a second design-system layer.

**The lens rule (binding):** a transposition is genuine iff it has (a) a *named, present* consumer, (b) a *measured or structural* simplicity/performance delta, and (c) it removes more than it adds. Absent any of the three, it is gold-plating and held as a named residual with its trigger condition — never built speculatively to fill a large tranche.

---

## §5 — Recommended tranche-D thread/wave structure

Given the four candidates, the sibling lanes (DA1–DA5), and the must-NOT list, the honest D shape is **four threads, research-first-gated, hard-capped at 4 agents/wave**:

- **Thread α — C-residual integration + deploy** (host-ops; the §1(a) thread). Execute the recorded procedures (`C/FINAL.md §6`), capture the G10/G11 transcripts, flip the pending gates. NOT a host re-architecture.
- **Thread β — design refinement** (4-agent analysis; the §2 thread). Per-screen findings docs, NOT redesign. The frontend-design plugin with the inverted audit brief.
- **Thread γ — CRUD cohesion** (the §1(c) thread). Cross-repo findings/diff against the ratified contract. NOT a shared framework.
- **Thread δ — Playwright validation** (the §3 thread). The 6-cell status matrix from existing suites. NOT new authoring, NOT a harness.

**The research-first gate shape** (mirrors B/C's W0→Wα→Wχ discipline, `C/FINAL.md` lifecycle line):
- **D.W0** — open + baseline (re-measure the live host state read-only — the host tree drifts; `DEPLOY-RECONCILE.md §3.3` found it dirty + stale; D.W0 must re-probe before any host act) + research dispatch.
- **D.Wα — research wave (≤4 lanes)**: the C-residual procedure re-validation (do the recorded commands still apply against the current host?); the design-screen inventory (the §2.1 enumeration as binding contracts per agent); the CRUD-cohesion contract-diff (fourier vs value.js against the ratified contract); the Playwright environment plumbing (base-URL retarget + the mutation-classification subsetting). The design *findings* are themselves a research-wave product (analysis, not implementation).
- **D.Wχ — challenge wave (≤4 probes)**: adversarially probe the four threads — does the host integration assume host state that has drifted? does any design finding smuggle a redesign? does the CRUD-cohesion diff propose shared code? does the prod Playwright subset actually exclude every mutating spec? (C's Wχ found a real flaw in EACH of its four probes — `C/FINAL.md §5` — D's Wχ must be equally adversarial, especially against the design thread's redesign pull.)
- **D execution waves** — accepted findings implemented, host residuals flipped, parallelized on disjoint files; capped at 4 agents/wave (`feedback_parallelization.md` honoured but inv-12 bounds it).

**Hard agent-budget ceiling: 4 agents per wave** (matching B/C's peak; the 4-agent design wave IS the peak — do not stack design + CRUD + Playwright agents into one 12-agent mega-wave). Total D should not exceed the C-shaped lifecycle agent count.

**What D must NOT include** (the binding exclusion list):
1. **NO host re-architecture** — no k8s, no registry, no MinIO/S3, no shared-dispatcher rewrite as a fourier act (constellation-level coordination — `DEPLOY-RECONCILE.md §3,§6`). All C KISS-rejections stay rejected (`C/FINAL.md §3`).
2. **NO redesign/rebrand** — the design thread produces refinement *findings*; genuine redesign is bounded to `/demo/shape-extractor` or a flagged-unfinished screen, called out as the exception.
3. **NO shared CRUD framework / codegen / DSL / coordinator** (inv-16, the B trap). Cohesion is contract-alignment of two independent implementations.
4. **NO bespoke test harness / synthetic-monitoring daemon** — the matrix is six `playwright test` runs with a base-URL env var.
5. **NO `Palette`/`colorScale` domain model in fourier** (inv-15, "library nobody calls" — held latent until a real consumer).
6. **NO speculative `--reload` background queue** (root fix already landed; the queue is a named residual with a trigger condition).
7. **NO mutating Playwright specs against prod** — prod runs the non-mutating subset only (§3.3).
8. **NO new spec authoring inside the validation thread** — authoring is a separate D-execution decision; the validation thread proves the *current* state.

**The one-line boundary** (the recap the user's mandate demands): *D = {flip the C host-residual gates (deploy/TLS/migration/transcripts, NOT re-architect the shared host); 4-agent per-screen design **refinement findings** across the 9 routes + chrome (NOT redesign); cross-repo CRUD **cohesion diff** against the ratified contract (NOT a shared framework); a 6-cell Playwright **status matrix** from the existing fourier-7 + value.js-36 suites, prod-subsetted to non-mutating (NOT new authoring/harness)} — research-first-gated, ≤4 agents/wave, all genuine-transpositions-only.*

---

## §6 — Provenance

- Route enumeration: `web/src/router/index.ts:11-83` (the route table + the saved-tab afterEach).
- Component mass: `web/src/components/{paper,visualization,visualization/gallery,equation,morph,layout,ui,decorative,shared}/` (directory listing, 2026-05-27).
- fourier e2e specs: `web/e2e/{paper-performance,gallery,workspace-flow,contour-extraction,settings-persistence,visualization-crud,visualization-ux}.spec.ts`; config `web/playwright.config.ts:11`.
- value.js e2e: `value.js/e2e/smoke/**` (36 specs); `value.js/playwright.config.ts` (5 projects).
- C host residuals: `docs/tranches/C/FINAL.md §6`; deploy reality `docs/tranches/C/coordination/DEPLOY-RECONCILE.md §1,§3,§5–5.1`.
- Colour lift / δ: `docs/tranches/C/coordination/COLOUR-LIFT.md §2,§3,§5`.
- CRUD contracts: `docs/tranches/B/coordination/{CRUD-CONTRACT,CRUD-CONSTELLATION}.md`; `value.js/docs/tranches/{C/coordination/CRUD-CONSTELLATION.md, D/research/Dh-contract-v2.md}`. CRUD library: `api/lib/crud/` (10 files, inv-16-clean per CA1 §4).
- frontend-design plugin charter: `~/.claude/plugins/cache/claude-plugins-official/frontend-design/unknown/skills/frontend-design/SKILL.md` (the "BOLD/maximalist/distinctive" generative posture — the redesign trap source).
- Prod URLs: fourier `fourier.babb.dev` (`docker-compose.prod.yml:7,77`); value.js `color.babb.dev` (`value.js/CNAME`). Host `mbabb.fridayinstitute.net:1022`.
- Guard discipline modelled on: `docs/audits/runs/2026-05-27-C-audit/CA6-prompts-precepts-guard.md §4` + `SYNTHESIS.md §0`.
- Precepts: `TRANCHE-AND-WAVE-SPEC.md`; memory `feedback_{no_fallbacks,parallelization,em_dashes}.md`, `project_infra_plan.md`; invariants 12/15/16/18/19/20.
