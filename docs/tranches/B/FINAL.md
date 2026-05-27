# B — Final disposition

**Status**: CLOSED 2026-05-27. **Tranche**: B — CRUD convergence (one identity model across fourier-analysis and value.js). **Predecessor**: fourier-A (`docs/tranches/A/FINAL.md`, `c7cfd82`). **Mode**: research-first; executed W0 → Wα → Wχ → W1 → W2 ∥ W3 → W4 → W5.

## §0 — Goal criterion and completion criterion (paired)

**Goal criterion (the aim).** Converge fourier's five divergent identity schemes into one `visualization` entity (one human-readable slug, required non-null owner, 3-state visibility, soft-delete); relocate the colour/palette domain model to value.js the library; align both backends to one written CRUD contract — to a degree warranted by KISS (no shared framework, no codegen, no third coordinating service). Under the **orphan verdict** (value.js-C RETIRED), the "for both backends" clause downgrades to "fourier ratified; value.js latent — held DEFERRED".

**Completion criterion (the evidence).** The close holds when:

- (a) `coordination/CRUD-CONTRACT.md` is ratified fourier-side; the §10 conformance matrix names a real test artefact per assertion (value.js cells DEFERRED). **Met** — W1 `4626d4c`.
- (b) fourier carries one `visualizations` collection; `git grep` finds no surviving `snapshot`/`gallery` *identity* scheme on user paths; full CRUD + soft-delete proven by endpoint tests. **Met** — W3 `52bdcf5`; `snapshots.py` deleted, `gallery.py` carved to a public-visibility alias.
- (c) the migration is verified (counts + spot-check + post-conditions) with no loss (invariant 17). **Met** — `audit/migration-counts.md`; the seeded `test_migrate_integration.py` is the load-bearing proof (the live dev DB is empty per Wχ P2).
- (d) `web/src/lib/colors.ts` shows the LOC drop under the primary path; **under the orphan-verdict fallback** it is byte-identical to the W3 close and `PROGRESS.md` records the named residual. **Met (fallback)** — `git diff 52bdcf5..HEAD -- web/src/lib/colors.ts web/src/lib/easings.ts` is empty.
- (e) no shared CRUD framework / codegen / coordinator service (invariant 16); the challenge close certifies it. **Met** — Wχ P1 ACCEPTED (0 % shared code; `audit/challenge.md §1`).
- (f) `uv run pytest` green; `vue-tsc -b --force` green; the value.js peer row holds at "orphaned, DEFERRED". **Met** — see §8.

Both criteria hold. The close is **clean against the fourier aim** and **`complete_with_misses` against the original cohort aim** (the value.js half never landed); every miss carries a named successor (§6).

## §1 — Thesis recap

fourier and value.js independently built the same CRUD facility in two languages; fourier's own side carried five divergent identity schemes for one user-experienced noun (a saved visualization). B converges fourier internally to one entity + a per-language utility module realising a written contract, and files the colour-domain lift to value.js. The trap the brief named — "build a shared framework" — was rejected by invariant 16 and adversarially certified clear (Wχ P1). The cohort half is structurally orphaned (value.js raced A→…→H, never opening C for execution); fourier-B ratifies the contract unilaterally and leaves it as a latent affordance.

## §2 — Wave-by-wave commit ledger

| Wave | Title | Commits |
|---|---|---|
| W0 | open · research dispatch | `b0a85d8` |
| Wα | research wave (6 ground-truth lanes) | `193ad57` |
| Wχ | challenge wave (4 adversarial probes) | `ba02e66` |
| W1 | CRUD-contract ratification | `4626d4c` + `8b8298a` |
| W2 | UX coherence (Configurator + a11y + render budget) | `ca58321` + `1b8b32f` |
| W3 | visualization entity + migration + `api/lib/crud` | `52bdcf5` + `5eb4421` + `93a566b` |
| W4 | convergence wiring | `7315ba6` + `71b2bd2` + `be75c6d` |
| W5 | close | this commit |

13 execution commits atop the B-development authoring closes (`f8db2c6`, `eea7473`).

## §3 — Cumulative metrics

- **Identity convergence**: five schemes → one `visualizations` collection (slug · `owner_slug` · `visibility{draft,unlisted,public}` · `deleted_at`); `snapshots.py` deleted; `gallery.py` → public-visibility alias.
- **`api/lib/crud/` utility module**: 8 framework-free modules, **exactly 525 LOC** (the framework-in-disguise ceiling); all 6 consumed by `visualizations.py` (errors 24× · etag 6× · slugs 5× · cursors 4× · idempotency 4× · softdelete 3×); admin re-point adopts 4 imports / 57 helper sites across migrated routers.
- **Tests**: 144 api specs pass (incl. the load-bearing migration integration test); the full suite (inherited + new) green at §8; 14 conformance skeletons land the paper-binding; the visualization-crud lifecycle e2e passes end-to-end (3 viewports).
- **Conformance matrix**: reconciled to **187 rows** (180 cross-repo + 7 §F); fourier rows empirically bound at W3/W4; value.js rows DEFERRED.
- **Contract**: 13 sections; §9 disposition 10 contract / 1 data / 0 library / 0 service; slug word-list corrected 120/120 → **128/128/128/128** (keyspace 2.68×10⁸).
- **SOTA**: RFC 9457 problem+json · RFC 9110 ETag/If-Match · RFC 9239 RateLimit headers · RFC 4648 base64url cursors — all landed; 9/9 KISS rejections HOLD.

## §4 — Hard-gate evidence (B.md §6)

- One `visualizations` collection; `git grep snapshot_hash api/routers/visualizations.py api/main.py` → zero (identity paths).
- Migration: `audit/migration-counts.md` + `test_migrate_integration.py` (count parity `V == S == G + orphans`; idempotent re-run; dangling-hash abort; naive→aware coercion; gallery-side owner; zombie-orphan `was_public`).
- Invariant 16: Wχ P1 ACCEPTED (0 % shared code; utility is a called-from library, no control inversion).
- Invariant 21: `coolname` → `secrets.choice`. Invariant 22: problem+json. Invariant 23: ETag/If-Match (8 consumer sites). Invariant 24: RateLimit-* headers on every response.
- `uv run pytest` green; `vue-tsc -b --force` green; `npm run build` exit 0 (§8).

## §5 — Scope-reveals, narrowings, and live-validation catches

- **Wχ narrowings folded into the waves** (H-W1-1 slug 120→128; H-W3-1/2/3 migration transform corrections + zombie-orphan + seeded-test-is-load-bearing; H-W3-4 `deleted_at` net-new; H-W3-5/6 band-aid-retire conditions + janitor-scope-shrink; H-BW-1 brittleness window narrowed to a clean one-way cutover).
- **Live-browser validation caught + fixed two real defects the static gates missed**: (1) the **canvas-render regression** (`71b2bd2`) — W2's Configurator stage-slot lift collapsed the epicycle canvas to 0 px (compute succeeded, nothing drew); fixed with `.viz-panel-right { height: 100% }`. (2) the **image-slug FK hazard** (`93a566b`) — the strict 4-word `SLUG_PATTERN` was over-applied to `validate_image_slug`; restored a lax pattern so the stable image FK survives the migration (Option B).
- **Integration reconciliations** (orchestrator, at wave boundaries): `tz_aware=True` on the Mongo clients (the H-W3-1(a) naive/aware janitor landmine, root-fixed); a conftest rate-limiter-reset fixture (direct-call test isolation); the compute rate-limit made config-driven (`COMPUTE_RATE_LIMIT`) so the compute-heavy e2e can run without weakening the production 5/60s limiter.

## §6 — Carries (named successors)

- **`colors.ts` gut + `easings.ts` sampler retirement + value.js dep bump** → `fourier-tranche-C-or-successor` (orphan verdict; value.js library `Palette`/`colorScale`/`sampleToSVGPath` never published). Provenance: `docs/audits/runs/2026-05-19-refinement-assay/{r1-assay,r4-valuejs-C-refinement}.md`.
- **slug-words `docs/precepts/data/slug-words.json` relocation** → precepts-submodule extraction when a second consumer (value.js re-engagement) materialises. Currently in-repo at `api/lib/crud/slug_words.json` (invariant-16 "in-repo first").
- **Image-blob storage redesign** → fourier-C (Option B held: `image_slug` stable FK, blobs not migrated, `storage_budget_gb` band-aid retired with the recency-prune + `deleted_at`-grace bound).
- **e2e axe-keystone settle-wait** → minor e2e-timing tuning (the settled UI is axe-clean; the residual keystone failures are transient dock-collapse-animation artifacts; the Invariant-18 harness + measurement are in place).
- **`FlaggedListResponse` type reconciliation** (`web/src/lib/types.ts`) → cursor-envelope shape (W4-C worked around with a local cast; vue-tsc green).
- **value.js-side conformance rows** → DEFERRED pending value.js re-engagement (latent affordance: the ratified contract is consumable without re-research).

**glass-ui substrate carries** (filed, not fourier-side forks): `ConfiguratorLayer` header-actions slot; dock collapsed/expanded slot `aria-hidden-focus` (the transient axe finding); `--scale-press*` unification (inherited from A).

## §7 — Constellation final state

value.js is at tranche **H close (v0.10.0, `16129e0`)**; tranche **C is RETIRED** (`~/Programming/value.js/docs/tranches/C/FINAL.md`). `src/palette/` and `api/src/crud/` confirmed absent. The cross-repo dependency (`fourier-B.W4 → value.js-C.W1`) is **severed, not delayed** — the W4 fallback was the unconditional primary path. The ratified `CRUD-CONTRACT.md` is the latent affordance a future value.js re-engagement consumes. The W2-tracking row closes **orphaned — terminal**.

## §8 — Tranche close evidence

- `uv run pytest tests/ api/tests/` — green (full suite; see the W5 close-sweep log in `PROGRESS.md`).
- `cd web && npx vue-tsc -b --force` — exit 0.
- `cd web && npm run build` — exit 0.
- `e2e/visualization-crud.spec.ts` — full CRUD lifecycle (upload → draft → publish → unlisted → delete → restore + 412 etag-mismatch) passes at 3 viewports against the live stack.
- W4 helper-adoption carry-forward greps re-asserted at the W5 boundary: `from api.lib.crud` in `admin.py` = 4 (≥ 3); helper sites across migrated routers = 57 (≥ 10).
- Brittleness window: the migration retains `snapshots`/`gallery` as rollback substrate; the cutover (rename → `_legacy`) is the deploy-time final step (the dev DB carries no legacy data — the rename is moot in dev and documented in the migration-script docstring for prod).

## §9 — Reflection

B is the architectural transposition A declined to attempt. It composed because it had one root: two repos, and one repo internally, grew the same facility without a plan to hold it. The research-first lifecycle paid for itself twice over — the Wα ground-truth pass caught that the janitor `$nin` was already retired (W3 scope shrank), that `compute.py` didn't exist, and that the slug lists were 128 not 120 (the schema would have rejected live data); the Wχ challenge certified invariant 16 and surfaced the migration's zombie-orphan path and the empty-DB-means-seeded-test-is-load-bearing reality before any code dispatched. And the discipline of *testing the UI in a real browser before claiming done* caught the single most consequential defect — the core epicycle visualization rendering as a blank 0 px canvas despite every static gate (vue-tsc, build, grep) passing green. The orphan verdict was handled honestly throughout: every value.js-dependent outcome carries a named successor, nothing closed silent, and the contract waits as a consumable affordance rather than a dead plan.
