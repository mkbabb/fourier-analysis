# 2026-05-27 — D-development audit synthesis

**Substrate**: 6 read-only audit lanes (`DA1`–`DA6`, 1,477 L) + 4 design lanes (`design/DA-design-A1..A4`, 285 L) + a live validation pass (`validation-matrix.md`, screens captured) auditing the full A→B→C lineage, everything landed this session, both repos, the running apps, and the prod host. **Mode**: tranche development only — no product implementation. **Authority for the D scope decision**: this synthesis; the per-lane deliverables are the evidence.

## §0 — Verdict

A and B and C all landed cleanly *to the repo boundary* (DA5: 39 directives, 0 outstanding; DA1: C's NO-legacy discharge was real). But the audit surfaces one pivotal reality and three concrete classes of debt that together define tranche D:

1. **The pivotal reality (DA4) — none of A/B/C is in production.** Prod fourier serves SHA `8818ae5` (2026-03-28), a **pre-A build**, from a dirty host tree (hand-edited compose with an inline plaintext Mongo password), an empty/pre-A DB, and has **never deployed through the webhook chain**. The `image_blobs` `external:true` volume does not exist, so a naive deploy of current master **would fail**. Now that **prod SSH is available**, C's host-coupled residuals stop being residuals — **D's headline is the first real deploy of A/B/C to prod**, sequenced safely on a shared multi-app host (`fourier`, `floridify`, and value.js's live `palette-api` co-tenant it).

2. **The NO-legacy asymmetry (DA1) — C discharged `snapshot_hash` on the frontend only.** The **backend still speaks `snapshot_hash`**: the `flags` collection field + unique index (`database.py:125-126`), 9 `admin.py` sites, dead `snapshots`/`gallery` boot indexes. The exact legacy-name-behind-a-value pattern W4 fixed on the frontend, symmetric backend half left. Plus a **dead `gallery` collection stratum** (`_entry_from_doc` + `GalleryEntryResponse` + 9 boot indexes — nothing writes it) and the **untyped image-asset `dict` shim** that *caused* the C9/C10 bugs. These are the user's "NO legacy code" + "architectural transpositions for elegance" mandate made concrete.

3. **The cross-repo cohesion is live, not academic (DA3).** value.js ships a **deployed `palette-api` v2.0.0** (Hono+Mongo+Zod, in-repo, healthy on prod) — richer than fourier's CRUD but divergent on ~11 contract clauses (top-level `id`, no soft-delete/grace/restore, none of the SOTA envelopes). And fourier's `visualization.palette_slug` is **already a dangling slug-FK into value.js's palette noun** (`api/models/visualization.py:119`) — "one identity model across both repos" is concrete. Cohesion = re-author `CRUD-CONTRACT v2.0.0` (two KISS relaxations) + a value.js-heavy alignment tranche, NOT a shared framework (the B trap).

4. **The shipped design is strong but carries surgical debt (DA-design A1-A4).** Distinctive identity (serif ℱ wordmark, cut-paper cards, the sun↔moon Fourier-morph toggle, a real glass-ui light/dark token system) — but: **`.cartoon-card` is a DEAD class** (glass-ui removed it ~C.W5) still applied by **14 components → every card renders flat/borderless** (a regression); a **triple upload affordance** in the workspace; **two orphan gallery components** (`GalleryMarquee`/`GalleryGrid`); a **systematic light-mode WCAG-AA contrast cluster**; and **missing `:focus-visible` rings**. All surgical refinements, no rebrand.

## §1 — The ten lanes, consolidated

- **DA1 (execution fidelity)**: C NO-legacy-clean EXCEPT the frontend-only `snapshot_hash` discharge; top transpositions = dead gallery stratum, untyped image dict (caused C9/C10), prod.yml TLS. Gate honesty: G1/G2 were `web/src`-scoped — true for the frontend, silent on the backend.
- **DA2 (deferred/chronic)**: 27 items, 11 chronic; the 3 host chronics (dispatcher, prod TLS, blob-migration) are now D **deliverables** (SSH). prod TLS verified genuinely unmet (`prod.yml:8,53,58`).
- **DA3 (value.js cohesion)**: live `palette-api` v2.0.0 in-repo; ~11 divergent clauses; the `palette_slug` FK is live; two-sided value.js-heavy thread; the δ colour-lift is orthogonal to the backend cohesion.
- **DA4 (host/deploy/prod)**: prod is pre-A (`8818ae5`); never webhook-deployed; dirty tree + inline plaintext pw; empty DB; no `image_blobs` volume (naive deploy fails); 4-phase deploy sequence; disk ample (497 GiB — refutes the 60-day-old 15 GiB plan premise).
- **DA5 (prompts/precepts)**: 39 directives — 34 addressed/held, 0 partial, 5 routed-to-D, **0 outstanding**; no precept violation in C; the one standing NO-legacy breach discharged at C.W4 (frontend) — DA1 shows the backend half remains.
- **DA6 (guard + scoping)**: reject re-architecting the shared host / k8s / a shared CRUD framework / a design rebrand / a bespoke test harness; **invert the frontend-design brief to "audit the shipped surface"**; the 4-screen split; the 2-app×3-env test matrix.
- **Design A1-A4**: the `.cartoon-card` dead class (14 components), the triple-dropzone IA, the gallery orphans, the light-mode contrast cluster, the missing focus rings; identity + token system are genuinely strong.
- **Validation**: fourier local e2e 3/49 pass (429 rate-limit + `storage_uri`-on-unmigrated-doc); prod stale; `api/tests` 129/0-fail; value.js `palette-api` healthy (200).

## §2 — Tranche D scope (five threads)

D is **partly cross-repo** (the cohesion thread reaches value.js), **research-first only for δ** (the CRUD cohesion — contract v2.0.0 + value.js open thesis); the rest are **direct** (the procedures + findings are concrete). KISS (invariant 12) and NO-legacy are load-bearing throughout.

- **α — prod integration & deploy** (the headline; SSH-enabled, the C host residuals become deliverables): reconcile the dirty host tree + extract the inline secret; wire the fourier arm to the improved `deploy-hook.sh` + tighten hook perms `0664→0600`; provision the verified-TLS cert (`gen-mongo-certs.sh`) then apply the `infra/tls.md §9` 3-site diff (provision-before-flags); `docker volume create image_blobs`; the **first real A/B/C deploy** via the gated chain + transcript; **run `migrate_image_blobs` as part of the cutover** (code+migration atomic); rollback proof; promote the staged `infra/{tls.md, blob-backend-dr.md}` into the precepts submodule. Shared-host-safe (the TLS CA swap is fourier-isolated; the dispatcher hardening is constellation-flagged).
- **β — frontend design refinement** (surgical, from A1-A4): resurrect `.cartoon-card` (one shim lifts 14 components — the single biggest win); resolve the triple-dropzone IA to one hero dropzone + a source-strip; resolve the gallery orphans (wire the marquee as a living empty-state band or delete both + give the empty state a real CTA); the **light-mode contrast token sweep** (amber/golden/dimmed-text — one pass clears A1+A3+A4); add `:focus-visible` rings (TOC + cards); fix the measured AA fails. No rebrand.
- **γ — backend NO-legacy symmetry + architectural transpositions** (fix-at-ROOT): rename the backend `snapshot_hash` band → slug-identity (the `flags` field+index, 9 admin sites) symmetric to W4; **delete the dead `gallery` collection stratum** (`_entry_from_doc`, `GalleryEntryResponse`, the 9 dead boot indexes, the dead `snapshots` indexes); **type the image asset as a Pydantic model** (retiring the untyped `dict` shim that caused C9/C10) + resolve `images.py:140,159` through the typed shim; stale docstring (`image_storage.py:1`).
- **δ — cross-repo palette/visualization CRUD cohesion** (research-first; value.js-heavy, user-re-mandate-gated on the value.js side): re-author `CRUD-CONTRACT v2.0.0` with two KISS relaxations (admit user-supplied slugs; bind behaviour not module-layout); fourier-light (hold + flip the ~88 DEFERRED matrix cells against `palette-api`); a value.js alignment tranche (visibility split, soft-delete+grace+restore, the four SOTA envelopes in value.js's own service+repository idiom, hide top-level `id`, conformance suite); the inverted colour-lift (`sampleToSVGPath`) as a bounded sub-item.
- **ε — test integrity** (direct): the cross-env Playwright matrix (fourier + value.js × local/dev/prod, prod non-mutating only); a CI Mongo so the 83 `@requires_mongo` load-bearing proofs stop skipping; the `COMPUTE_RATE_LIMIT` e2e harness env; record `settings-persistence.spec.ts` inert (`.skip`) not green.

## §3 — Concrete items D must address (with `file:line`)

- Backend `snapshot_hash` legacy band: `api/services/database.py:125-126` (flags field+unique index), 9 `admin.py` sites, dead `snapshots`/`gallery` indexes `database.py:68-69` (DA1 §3). → γ.
- Dead `gallery` stratum: `_entry_from_doc`, `GalleryEntryResponse`, the boot indexes — nothing writes `gallery` (DA1). → γ.
- Untyped image-asset `dict`: the shim across `image_storage.py`/`dependencies.py`/`images.py`; `images.py:140,159` subscript `doc["storage_uri"]` (500 on unmigrated docs). → γ (+ the migration-with-deploy in α).
- `.cartoon-card` dead class applied by 14 components (DA-design A4). → β.
- Triple upload affordance: `ImageUpload.vue:88-110`, the canvas placeholder (`placeholder.ts`, `VisualizationView.vue:126-136,198`), the global drop-overlay (`:144-153`). → β.
- Gallery orphans: `GalleryMarquee.vue`, `GalleryGrid.vue` (zero imports). → β.
- Light-mode contrast: `--viz-amber` 3.54:1, hardcoded `#f0b632` text 1.76:1 (`EquationView.vue:420`, `FunctionInput.vue:247`), dimmed `text-foreground/35` ~1.9:1 (gallery), placeholder `rgba(150,150,150,0.6)` 3.05:1. → β.
- Prod: SHA `8818ae5`, dirty tree, no `image_blobs` volume, hook perms `0664`, `prod.yml:8,53,58` TLS flags live. → α.
- value.js divergence: top-level `id` (`format/palette.ts:59`), no soft-delete, no SOTA envelopes; `palette_slug` FK (`visualization.py:119`). → δ.

## §4 — Cross-repo cohesion (the value.js side; δ)

`CRUD-CONTRACT v2.0.0` re-ratified jointly. fourier already conforms — its work is light (re-author the contract with the two relaxations; flip the DEFERRED cells). value.js carries the bulk in **its own idiom** (the D.W2 service+repository+errors+events+DI architecture, `626b107` — NOT fourier's `lib/crud/` layout; binding behaviour, not module shape — the relaxation that keeps cohesion KISS). The colour-lift (`sampleToSVGPath` into `value.js/src/math.ts`) is orthogonal to the backend cohesion and stays a bounded sub-item. This thread is **user-re-mandate-gated on the value.js side** (value.js-I thesis is open); D authors the fourier-side contract + records the value.js ask in `coordination/`.

## §5 — Prompts + precepts disposition (DA5)

39 directives across the lineage; **0 outstanding** (34 addressed/held, 5 routed-to-D). The 11-clause D-development prompt is fully decomposed and routed (the 6-agent audit, NO-legacy, fold-deferred, fold-chronic, recap-all-prompts, tranche-dev-only — all addressed this round; SSH+deploy, the 4 design agents, CRUD cohesion, audit value.js, Playwright both apps — routed to the D threads). No precept violated in the C execution; the backend `snapshot_hash` half is a *completeness* gap (the frontend was discharged), routed to γ.

## §6 — CANONICAL-ORDERING reconciliation (ordering ε)

Post-D-development: fourier-A/B/C CLOSED; fourier-D **AUTHORED** (this round). The cross-repo edge is no longer a single latent colour seam — it **broadens** to the live `palette-api` cohesion (the `palette_slug` FK + the contract v2.0.0) PLUS the conditional colour-lift. value.js-I (open thesis) is the candidate host for the value.js-side cohesion + the colour publish. The synthesis re-authors CANONICAL-ORDERING as ordering ε.

## §7 — Path forward (next action)

This is tranche development. The artefacts: this SYNTHESIS; the 6 DA lanes + 4 design lanes + the validation matrix + screens; the forthcoming **`docs/tranches/D/D.md`** (the five-thread charter), `D/PROGRESS.md`, `D/coordination/` (the value.js cohesion ask + the prod-deploy runbook), and the CANONICAL-ORDERING reconcile. The D wave specs harden at Wχ per the research-first discipline (δ is the research-first thread; α/β/γ/ε are direct). **No implementation dispatches until the user authorizes D.W0.**
