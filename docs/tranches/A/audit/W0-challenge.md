# A.W0 — Challenge ratification

Authored by **agent A.W0.b** (the Challenge wave moiety of W0). Read-only across the substrate; the sole created artefact is this document. Validates every load-bearing claim in `A.md`, `waves/W{1..5}.md`, `coordination/CONSTELLATION.md`, and `PROGRESS.md` against the post-W0.a substrate (`master` at `c2e2054`).

---

## §0 — Goal criterion and completion criterion (paired)

Per the paired-criterion discipline at `docs/precepts/instructions/TRANCHE-AND-WAVE-SPEC.md §"Goal criterion + completion criterion (paired)"`.

**Goal criterion.** The W0 challenge step satisfies the pre-execution audit pattern (`docs/precepts/glossary/meta-terms.md §"Pre-execution audit"`) — every load-bearing claim in the A tranche plan set is verified against the as-of-`c2e2054` substrate, with each claim ratified, amended, or escalated on cited evidence. A reader opening A after this document should dispatch W1 with no further audit churn.

**Completion criterion.** Twenty-two per-claim rows are dispatched in §2 below with disposition + evidence + notes; the rate-limiter decision is recorded in §3; the AMEND ledger is enumerated in §4 so W6 holds a checklist of plan-doc updates; §5 lists ESCALATE rows (empty closes the hard gate); §6 restates the wave's hard-gate status. The challenge file lands at `docs/tranches/A/audit/W0-challenge.md` per `A.md §3` row W0.

Both criteria hold at this writing.

---

## §1 — Substrate observed

| Field | Value |
|---|---|
| HEAD | `c2e2054` — `chore(A.W0): log W0.a open + hygiene closure` |
| W0.a precedent commits | `3fc960c` submodule + planning artefacts; `c69aa33` tsbuildinfo untrack |
| Build state (per W0.a log) | `vue-tsc -b --force` exit 0; `npm run build` exit 0 (2.60s, 2655 modules); `uv run pytest` 87 passed, **2 failed** in `tests/test_bases.py::TestEvaluatePartialSum::{test_chebyshev_partial_sum, test_legendre_partial_sum}` |
| Brittleness window | declared per `A.md §10` for the two pytest failures above — restoration wave **W0.c**; failures are EXPECTED, not an escalation |
| Plan-doc inputs verified | `A.md` (178 lines), `W1..W5.md`, `coordination/CONSTELLATION.md`, `PROGRESS.md` |
| Audit corpora drawn from | `docs/audits/runs/2026-05-18-fourier-tranche/{a..f}.md`; `docs/audits/runs/2026-05-18-tranche-harden/{SYNTHESIS,h1..h6}.md`; `docs/audits/runs/2026-05-19-crud-deepen/SYNTHESIS.md` |

---

## §2 — Per-claim ratification

Twenty-two rows. Citations carry `file:line` per the precepts.

| # | Claim | Disposition | Evidence | Notes |
|---|---|---|---|---|
| 1 | `git status --short` post-W0.a reads ~105-106 paths (109 H1 reading minus the planning-artefact untracks W0.a committed) | **AMEND** | `git status --short \| wc -l` → **102**; with `--untracked-files=all` → **110** (60 M + 31 D + 19 ??) | Default `git status` collapses `web/src/styles/` + `web/src/components/paper/search/` directories into single `??` rows; expanded reading is 110, marginally above H1's 109. The expanded count is the honest cohort size W1 commits |
| 2 | Deletion bucket: 20 glass-ui-shadow-copy + 4 directory-relocation + 4 module-fold + 3 auth-store-replacement = 31 | **RATIFY** | 31 D paths enumerated; buckets discharge: shadow-copy = 19 `components/ui/{select/*,collapsible/*,slider/*,GlassDock,ToastContainer,UnderlineTabs,BouncyToggle}.vue` + `lib/utils.ts` (= 20); directory-relocation = root `FourierMorph{Demo,ShapeExtractor}.vue` + `composables/useHoverCard.ts` + `visualization/DockPopover.vue` (= 4); module-fold = `paperSearchIndex.ts` + `usePaperSearch.ts` + `useDockState.ts` + `visualization/lib/dock-buttons.css` (= 4); auth-store-replacement = `useAdminAuth.ts` + `useSession.ts` + `useUserAuth.ts` (= 3) | 20 + 4 + 4 + 3 = 31; W1 deletion ledger inherits this taxonomy |
| 3 | `BouncyToggle.vue` is the lone `flagged-for-rework` — no extant glass-ui-equivalent in consumer tree | **RATIFY** | `grep -rl 'BouncyToggle' web/src --include='*.vue' --include='*.ts'` returns no surviving consumer reference (the file itself is the only hit and is in `D` state) | The flag stands; W1 carries it as the lone unverified retirement pending W3 |
| 4 | `fourier-overrides.css` per-rule disposition 30 delete / 7 fold / 4 lift | **RATIFY** (count-class) | File exists at 354 lines; selector-block count via `grep -cE '^\s*[\.\#\@&a-zA-Z\*\[].*\{'` returns **52 selector openings** (consistent with ~41 logical rules once light/dark forks counted separately as H2 specifies). 30 + 7 + 4 = 41 logical rules; the 52-vs-41 delta is the multi-selector-rule bracing | Per-rule discharge happens at W2; the count-class is correct |
| 5 | `ios-fixes.css` exists with 2 rules | **AMEND** | File exists at 35 lines; contains 3 selector-block openings: `html` (lines 10-13), `@media (min-width: 768px) html` (15-20), `@media (max-width: 640px) .paper-article pre,code` + nested `pre` (24-35). Logically 2 *concerns* (mobile-first responsive font sizing + code-block overflow fix), but 3 selector blocks | Plan claim is conceptually right (2 concerns); the literal selector count is 3. W2 disposition ledger should clarify "2 rules" → "2 concerns / 3 blocks" |
| 6 | `buttons.css` deletes outright; no surviving consumer of any recipe it defines | **AMEND** | File exists at 216 lines. **Live consumers found**: `.styled-slider` referenced at `BasisSelector.vue`, `EditorControlsDock.vue`, `EditorToolsPanel.vue`, `HarmonicLevelGrid.vue` (x2), `MorphPhaseConfig.vue`, `useMorphConfig.ts` (comment); `.btn-icon-admin` at `GalleryCard.vue` (x3); `.btn-solid` + `.btn-ghost` at `ExportModal.vue`; `.basis-pill` at `BasisSelector.vue` + `GalleryCard.vue` + `GalleryCardModal.vue` + `notation.ts` (comment) | The H2 reading collapsed the `:not(.styled-slider)` native-range recipe (which truly has no sole consumers) with the `.styled-slider` recipe itself (which has 5 live sites). W2 cannot delete the file outright — it must migrate 5 styled-slider sites to `<Slider variant="glass-scrubber">` AND migrate `.btn-icon-admin` / `.btn-solid` / `.btn-ghost` / `.basis-pill` consumers (the W3 button migration overlap) before deletion. The deletion-after-migration sequencing is what W2 + W3 plan; the *outright* qualifier on W2.md item 3 should soften to "deletes after consumer migration completes" |
| 7 | Native interactive `<button>` count = 89 (79 git-tracked + 10 in `morph/*`) | **RATIFY** | `git ls-files 'web/src/**/*.vue' \| xargs grep -cE '<button\b'` → 79 git-tracked; full-tree `find web/src -name '*.vue' -print0 \| xargs -0 grep -cE '<button\b'` → 89 total; the 10-delta lives in `morph/{FourierMorphDemo,FourierShapeExtractor,MorphShapePreview}.vue` + working-tree dirty files | 79 + 10 = 89; W3 grep-zero gate inherits this baseline |
| 8 | `fira-code` / `font-mono` tabular-readout count = 69 | **AMEND** | `grep -rE 'fira-code\b\|font-mono\b' web/src --include='*.vue' --include='*.ts' \| wc -l` → **82** hits | The 82 raw-hit count is higher than the 69 the H2 reading specified. The delta likely traces to (a) multiple hits per file the H2 audit deduped, (b) untracked `morph/*` and `paper/search/*` files added since the H2 reading. W3.md item 3a should reflect "≥69" or recount under a single sed-canonical line-counting rule before W3 dispatches |
| 9 | `@keyframes` total in `web/src/` = 14, of which 7 duplicate a glass-ui canonical animation by name | **AMEND** | `grep -rE '@keyframes' web/src \| wc -l` → **16** total; canonical glass-ui keyframes in `glass-ui/src/styles/animations.css` include `ambient-pulse`, `collapsible-{open,close}`, `dock-in`, `fade-in`, `floating-panel-in`, `gold-shimmer-slide`, `pulse-dot-bounce`, `pulse-ring-spin`, `scale-in`, `scrim-breath`, `shake`, `shimmer`, `shimmer-sweep`, `slide-up`, `sparkle-sweep`, `tooltip-in`, `typewriter-blink`. Fourier-side name-shadow set: `fade-in`, `scale-in`, `slide-up` (in `fourier-overrides.css`); `collapsible-{open,close}` in `CollapsibleSection.vue`; `tooltip-in` in `ConvergencePlot.vue` — **6 named shadows**. Plus `tab-slide-in` (not in animations.css enumeration; possibly elsewhere in glass-ui — needs a glass-ui side recheck before W3) | Count is 16 not 14; shadow count is **6** verified, possibly 7 with `tab-slide-in`. W3.md item 4 inherits a +2 / -1 amendment |
| 10 | `<Button as="label">` required at `ImageUpload.vue:121` and `VisualizationView.vue:220` | **RATIFY** | `ImageUpload.vue:119-125` is the `<input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelect" />` pattern with the bordering trigger via `useImageUpload`; `VisualizationView.vue:220` is `<input ref="canvasFileInput" type="file" accept="image/*" class="hidden" @change="onCanvasFileSelect" />` | These are the file-input-trigger sites W3 names; current state is plain `<input class="hidden">` driven by an external trigger button — W3's job is to convert to `<Button as="label">` semantics. The line citations are correct |
| 11 | `MobileFloatingToc.vue` summary triggers use `<Collapsible.Trigger asChild>` wrapping `<Button>` | **RATIFY-as-target** | File reads: native `<button>` at lines 96, 101, 120, 131, 146 — no `<Collapsible.Trigger>` or `<Button>` import currently | The plan claim names the *target* pattern for W3, not present state; W3.md line 19 reads "summary triggers use … not plain `<Button>`" — i.e., the W3 migration target. The current state being plain native `<button>` is consistent with W3 owning the migration |
| 12 | `Skeleton` imports from root barrel `@mkbabb/glass-ui`, not `/skeleton` subpath | **RATIFY** | `web/node_modules/@mkbabb/glass-ui/dist/index.d.ts:5089` declares `export declare const Skeleton: DefineComponent<...>` — root-barrel export. `package.json typesVersions` enumerates many subpaths (`tokens`, `dock`, `search`, `sidebar`, etc.) but no `skeleton` row | W3 doc-nit correction holds |
| 13 | Contour-hash bug at `api/services/image_storage.py:180` — independent `sorted(xs)` / `sorted(ys)` | **RATIFY** | `image_storage.py:180` reads exactly `points_payload = json.dumps({"x": sorted(xs), "y": sorted(ys)}, sort_keys=True)`; line 181 hashes via SHA-256 | The bug is on a single line (180); the regression-test pair `xs=[0,1], ys=[0,1]` vs `xs=[0,1], ys=[1,0]` collides under the present hash and discriminates under the ordered-pair fix |
| 14 | Hard-coded Mongo password at 3 sites: `docker-compose.yml:14`, `docker-compose.prod.yml:8`, `docker-compose.prod.yml:47` | **RATIFY** | `docker-compose.yml:14` carries `MONGO_URI=mongodb://fourier-admin:cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb@mongo:27017/...`; `docker-compose.prod.yml:8` carries the same with TLS suffix; `docker-compose.prod.yml:47` is the healthcheck `mongosh -u fourier-admin -p cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb …` | Three sites verbatim; W4 moves all three to env reference |
| 15 | `logo.ts` (100 LOC), `math-worker.ts` (55 LOC), `compute.py` (tombstone) — all dead | **RATIFY** | `wc -l` → 100 / 55 / 1; `grep -rE 'from.*logo\|from.*math-worker\|from.*\bcompute\b' web/src api --exclude=…` returns zero consumer imports | Tombstone for `compute.py` confirmed (1 line); deletion proof is `git grep` empty after W4 |
| 16 | `gallery.ts:32 fetchPage()` consumed at `:137, :149, :189, :207` | **RATIFY** | `grep -nE 'fetchPage' web/src/stores/gallery.ts` → **declared at :32**, **called at :137, :149, :189, :207**, exported at :229 | All four call sites are admin actions (`setTier:132`, `deleteEntry:144`, `publish:183`, `publishDraft:195`). W4.b migration scope inherits exactly four call sites |
| 17 | Batch contract bug — `api.ts:526,:537` declare `{ processed }`; backend returns `{ ok, affected }` | **RATIFY** | `api.ts:530` reads `Promise<{ processed: number }>` for `batchGallery`; `:541` reads `Promise<{ processed: number }>` for `batchUsers`. `admin.py:397` reads `return {"ok": True, "affected": affected}` (batch_gallery); `:451` same shape (batch_users) | W5.c fixes the wrapper return types; the lift to multi-select UI rides corrected types |
| 18 | `FrequencyGraph.vue` applies un-annotated `log10(amplitude+1)` against unlabeled axis | **RATIFY** | `FrequencyGraph.vue:38-39` reads `displayComponents.value[0].amplitude; return props.logScale ? Math.log10(max + 1) : max`; `:47-48` `barFraction` applies `Math.log10(amplitude + 1)` | No axis label; no transform annotation in the rendered output — W5.d fixes |
| 19 | `ConvergencePlot.vue` carries `endpoint=False` off-by-one — plotted original curve stops one sample short | **RATIFY** | `ConvergencePlot.vue:111` carries the inline comment `// X-grid (endpoint=false to match backend)`; backend source `api/routers/equations.py:61` confirms `np.linspace(domain[0], domain[1], req.n_eval_points, endpoint=False)`; secondary site at `api/services/computation.py:121` same | The off-by-one is empirically the source; W5.d closes |
| 20 | glass-ui pin is `file:../../glass-ui` at v1.8.5, commit `7e2e385` | **ESCALATE-soft** (substrate-version skew) | `web/package.json` carries `"@mkbabb/glass-ui": "file:../../glass-ui"` — the path-pin is RATIFIED; however `git -C /Users/mkbabb/Programming/glass-ui log --oneline -1` returns `5e79443 refactor(metaballs): retire MetaballCanvas publisher per zero-consumer verification (G-W3-3 §6)`, and the glass-ui `package.json` declares `"version": "2.0.0"` (not v1.8.5). The `web/node_modules/@mkbabb/glass-ui/package.json` ALSO reads `"version": "2.0.0"` | The consumer is in fact consuming **glass-ui v2.0.0** at HEAD `5e79443`, not v1.8.5 / `7e2e385`. This is a substrate-version skew — the plan documents (A.md §1, CONSTELLATION.md "Node identity" table, W1.md scope statement) all reference "v1.8.5". A.W6's CONSTELLATION.md update must reconcile to v2.0.0 / `5e79443`; W3's adoption targets (Skeleton, AnimatedDigit, etc.) hold under v2.0.0 — confirmed by the root-barrel `Skeleton` export. **Not a hard-gate failure** — the migration cohort still composes against the present substrate; flagged soft so W6 carries the citation correction |
| 21 | press-scale three-way carry: glass-ui `button/index.ts:9` (token), `toggle/index.ts:33` (bare `active:scale-95`), `ConfiguratorRow.vue:91` (hardcoded fallback) | **RATIFY** (with one path fix) | `glass-ui/src/components/ui/button/index.ts:9` reads `'btn-pill focus-ring … active:scale-[var(--scale-press-btn)] …'` — token form. `glass-ui/src/components/ui/toggle/index.ts:33` reads `'… active:scale-95 …'` on the `card` variant — bare form. `ConfiguratorRow.vue` is at `glass-ui/src/components/custom/configurator/ConfiguratorRow.vue:91` (not the bare `components/` path), reading `'… active:scale-[var(--scale-press,0.97)]'` — hardcoded-fallback form | Three forms verified; the CONSTELLATION.md row should clarify the `custom/configurator/` subpath for ConfiguratorRow.vue |
| 22 | Rate-limiter — recommend Option A (single-replica documented via `replicas: 1` pin in `docker-compose.prod.yml` + deploy note) | **RATIFY** | `docker-compose.prod.yml` carries no `deploy.replicas` field — defaulting to 1 (the implicit single-replica reality). No indicator in source that prod ever ran multi-replica. H3 reasoning (SYNTHESIS §2 row 3, h3 lane): invariant 12 forbids superfluous cloud; prod is already single-replica de facto; the smallest honest mechanism is to document the constraint in the deploy surface, not add Redis | The W0-side ratification carries to W4.7 as Option A; W4.c lands the explicit `replicas: 1` pin and `audit/W4-deploy-note.md`. Option B (Mongo TTL) is named as fourier tranche C debt |

---

## §3 — Rate-limiter decision (recorded)

**Option A — single-replica documented honestly.** Per H3 (SYNTHESIS §2 row 3): the prod surface is already implicitly single-replica (no `deploy.replicas` field in `docker-compose.prod.yml`), so invariant 12 (scale without contrivance) is satisfied by *documenting* the constraint rather than introducing Redis or any superfluous cloud system. W4.c lands the explicit `deploy.replicas: 1` pin in `docker-compose.prod.yml` and authors `docs/tranches/A/audit/W4-deploy-note.md` recording the constraint plus naming Option B (Mongo TTL bucket) as the future move slated to fourier tranche C debt. Option C (delete + nginx edge limit) is explicitly rejected — it requires an nginx change and is not free.

The W0-side challenge ratifies the recommendation; the W4-side execution carries the implementation.

---

## §4 — Net delta (AMEND ledger for W6 absorption)

Seven AMEND rows; each names a plan-doc string that requires the W6 close ceremony's reconciliation pass to update. None blocks dispatch.

| # | Plan doc + location | Plan claims | Substrate shows | Suggested edit at W6 |
|---|---|---|---|---|
| 1 | `A.md §1` + `W1.md` Scope-1 | "109-file in-flight cohort … 62 modified + 31 deleted + 16 untracked" | 110 paths with `--untracked-files=all` (60 M + 31 D + 19 ??); 102 paths under default `git status` | Update narrative to "~110-file cohort under expanded-untracked counting; default `git status` collapses two directories" |
| 5 | `W2.md §Scope` item 2 | "Its 2 rules discharge as 1 fold-to-component + 1 glass-ui addition" | File carries 3 selector blocks across 2 conceptual concerns (mobile-first responsive sizing + code-block overflow) | Reword "2 rules" → "2 concerns / 3 selector blocks" |
| 6 | `W2.md §Scope` item 3 + W2 hard-gate | "delete `buttons.css` outright … the `.styled-slider` recipe is discharged by `<Slider variant="glass-scrubber">` … the native-range `:not(.styled-slider)` recipe has zero consumers" | 5 live `.styled-slider` consumer sites + `.btn-icon-admin` (3 sites) + `.btn-solid` (1) + `.btn-ghost` (1) + `.basis-pill` (4 sites) all present | Soften "outright" → "after consumer migration completes"; record buttons.css deletion as the W2/W3 *joint* gate (W2 migrates non-button recipes, W3 migrates buttons, then file deletes); the `:not(.styled-slider)` zero-consumer reading remains correct for the *defensive-fallback* recipe alone |
| 8 | `W3.md §Scope` item 3a + `PROGRESS.md` 2026-05-18 H2 entry | "`fira-code` 30 → 69" (69 readouts) | 82 raw `grep -E 'fira-code\b\|font-mono\b'` hits across `web/src/**/*.{vue,ts}` | Rerun the canonical count under a single sed-rule before W3 dispatches; update the figure to the empirically verified value (≥69, ≤82) |
| 9 | `W3.md §Scope` item 4 + `PROGRESS.md` H2 entry | "14 total `@keyframes` in fourier `web/src`, of which 7 duplicate a glass-ui canonical animation by name" | 16 total; verified shadows: `fade-in`, `scale-in`, `slide-up`, `collapsible-open`, `collapsible-close`, `tooltip-in` (= 6); `tab-slide-in` is a candidate seventh if glass-ui defines it elsewhere | Update count to "16 total, ≥6 shadows"; W3.d cross-references glass-ui's `animations.css` enumeration before deletion |
| 20 | `A.md §1`, `CONSTELLATION.md` Node-identity table, `W1.md` scope statement | "glass-ui v1.8.5 … 7e2e385" | glass-ui repo HEAD at `5e79443`; both glass-ui `package.json` and `web/node_modules/@mkbabb/glass-ui/package.json` declare `"version": "2.0.0"` | W6 updates the pin notation to "v2.0.0 / `5e79443`"; reconciles audit corpora that name v1.8.5 |
| 21 | `CONSTELLATION.md` Emitted row "A → glass-ui press-scale" + `A.md §9` | "`ConfiguratorRow.vue:91`" | The file lives at `glass-ui/src/components/custom/configurator/ConfiguratorRow.vue:91` (subpath `custom/configurator/`) | Add the `custom/configurator/` subpath to the citation so the emitted carry is unambiguous |

---

## §5 — Escalations

**One soft escalation, no hard escalation.**

- **Soft (claim 20)**: glass-ui substrate-version skew — the plan set asserts v1.8.5 / `7e2e385` but the consumer is in fact compiling against v2.0.0 / `5e79443`. The cohort still composes (`vue-tsc` and `npm run build` green per W0.a); the migration targets named in W3 (Skeleton root-barrel, AnimatedDigit, Metric*, StatusDot) all hold under v2.0.0. No hard-gate failure — flagged so W6's CONSTELLATION.md reconciliation does not perpetuate the stale citation.

**No hard escalations.** The challenge gate closes — the empty hard-escalation list satisfies the W0-side discipline.

The two pretist failures in `tests/test_bases.py::TestEvaluatePartialSum` are the **declared brittleness window** per `A.md §10`, not an escalation. W0.c (numerical-test repair) owns their restoration; they are expected red and must not be promoted to an escalation in this document.

---

## §6 — Challenge close

Per `A.md §3` row W0, the W0 hard gate enumerates: `vue-tsc -b --force` exits green; the two `test_bases.py` failures fixed-or-formally-re-scoped per §9; submodule wiring committed; `tsbuildinfo` untracked and gitignored; **challenge doc at `audit/W0-challenge.md`**.

| W0 gate item | Status | Owner |
|---|---|---|
| `vue-tsc -b --force` green | **SATISFIED** at W0.a (logged at `PROGRESS.md` 2026-05-26 entry) | W0.a |
| `npm run build` green | **SATISFIED** at W0.a | W0.a |
| `.gitmodules` + `docs/precepts` + `docs/instructions` committed | **SATISFIED** at `3fc960c` | W0.a |
| `tsbuildinfo` untracked + gitignored | **SATISFIED** at `c69aa33` | W0.a |
| Challenge doc at `audit/W0-challenge.md` | **SATISFIED** by this document | W0.b |
| `test_bases.py` two failures fixed or re-scoped | **OPEN** — brittleness window per `A.md §10` | W0.c |
| W0 close ceremony (status-board flip, PROGRESS log) | **OPEN** | W0.d |

The W0 challenge moiety is now discharged. The remaining wave hand-offs are:

- **W0.c — numerical-test repair**: investigate the consistent ≈0.85-factor mismatch in the Chebyshev / Legendre partial-sum evaluators; either fix the evaluator (`src/fourier_analysis/bases.py` likely), fix the test fixture if it was wrong, or re-scope formally with a paper-citation rationale and named successor wave per `A.md §10` invariant 8.
- **W0.d — close ceremony**: status-board flip from `planned` → `closed`; absorb the seven AMEND rows enumerated in §4 above into the named plan docs; record the W0 commit hashes; signal W1 dispatch.

The challenge gate now reads CLOSED. W1 dispatches against the substrate as observed; the AMEND ledger in §4 is the W6 reconciliation checklist; the single soft escalation in §5 is the W6 CONSTELLATION.md citation correction.
