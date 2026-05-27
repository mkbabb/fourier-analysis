# Challenge-P3 — cross-repo-timing + image-blob-deferral honesty

**Probe**: Wχ.P3 (tranche-B challenge wave). **Mode**: RESEARCH-ONLY — single deliverable; no source/spec/coordination edits, no commit.
**Date**: 2026-05-26. **Working tree**: `fourier-analysis` @ branch `master`.

Two sub-probes:
- **A** — cross-repo timing: does the W4 orphan-verdict fallback EXIST and is it HONEST, with no hidden value.js publish dependency?
- **B** — image-blob deferral: does retiring the `storage_budget_gb` eviction band-aid in W3 (while deferring the blob redesign to fourier-C) leave invariant 12 in VIOLATION?

Every Wα claim cited below was independently verified against the live tree (`api/services/{janitor,image_storage,database}.py`, `api/config.py`, `web/src/lib/{colors,easings}.ts`, `web/package.json`) and the live plan docs (`W4.md`, `W3.md`, `B.md §7`, `R-lifecycle-spec.md`, `R4-scaling-bounds.md`, `R6-timing.md`). Findings are mine, not relays.

---

## §1 — W4 fallback existence + honesty

**Verdict: the W4 orphan-verdict fallback is FULLY SPECIFIED and HONEST. No hidden value.js publish dependency survives. (y)**

### 1.1 The fallback exists and is the *primary* path (not a contingency)

`docs/tranches/B/waves/W4.md` carries the fallback as the **default-firing** path, not a branch reachable only on failure:

- **Two mutually-exclusive hard-gate arms** (`W4.md:101-110`): gate item 3 (cohort-active — ≥80 LOC deleted from `colors.ts`, `@latest` pinned) vs gate item 4 (orphan-verdict primary — byte-identical files + named PROGRESS residual). `W4.md:7` + the §Status line declare the orphan-verdict arm the default at 2026-05-26. `R6-timing.md:102` confirms "the default arm is the one that fires."
- **Agent B's unit is explicitly a near-no-op** (`W4.md:58, 69-75`): under the orphan verdict its work product *reduces to* authoring the PROGRESS named-residual entry and confirming `colors.ts`/`easings.ts` byte-equality. The cohort-active sub-gate (`:74`) is retained only as the "should value.js re-engage mid-wave" alternative, gated behind the triumvirate trigger at `W4.md:95`.

### 1.2 The HELD files are byte-identical, NOT gutted — confirmed honest

- `web/src/lib/colors.ts` (117 lines) and `web/src/lib/easings.ts` (127 lines) are held at their W3-close state; the File Bounds table (`W4.md:42-43`) marks both "no W4 modification," and gate item 4 (`W4.md:104`) requires `git diff W3-close..W4-close -- web/src/lib/colors.ts web/src/lib/easings.ts` **empty**. This is a HOLD, not a gut. The plan does not gut-then-restore.
- The residual is a **named PROGRESS entry with destination `fourier-tranche-C-or-successor`** (`W4.md:11, 19, 52, 104, 108`; `B.md §7:154`; `PROGRESS.md:101`), with provenance citations to `docs/audits/runs/2026-05-19-refinement-assay/{r1-assay.md,r4-valuejs-C-refinement.md}`. The wave-fail condition (`W4.md:11`) is *"the residual is silent"* — silence is explicitly forbidden. Honest by construction.

**Nuance worth recording (not a defect):** `easings.ts` ALREADY imports value.js (`import { timingFunctions, easeInOut* } from "@mkbabb/value.js"` at `:9-16`); `EASING_PRESETS` is already backed by value.js timing functions. The held residual is narrower than "retire easings.ts onto value.js" implies — it is specifically the **hand-rolled SVG-path sampler** (`sampleToSVGPath`, which does not appear anywhere in `web/src`). The preset wiring already landed; only the sampler lift is deferred. `R6-timing.md:42` is concordant: the "`easings.ts` SVG-sampling workaround stays as a fourier-internal primitive." The W4 prose ("`easings.ts` keeps its easing-curve presets," `:20`) is accurate.

### 1.3 No hidden cross-repo dependency in any W4 sub-gate — audited each

I traced every W4 scope item / sub-gate for a latent value.js publish requirement:

| W4 sub-gate | Depends on value.js publish? |
|---|---|
| Stores re-point (`gallery/workspace/animation.ts`) → `/visualizations` (item 1-3, 7) | No — consumes the W3-landed fourier entity. |
| `draftStorage.ts` re-key on `visualizationSlug` (item 4) | No — fourier-internal IndexedDB. |
| `colors.ts` gut (item 5) | HELD — the *only* value.js edge, and it is severed, not deferred. |
| `easings.ts` sampler retire (item 6) | HELD — same edge; preset usage already landed. |
| `package.json` `@latest` bump (item 11) | HELD — currently `"@mkbabb/value.js": "file:../../value.js"` (`web/package.json:18`), a local file ref, NOT a published-tag pin. The bump is deferred; nothing breaks by holding it. |
| `api/lib/crud/` helper adoption (item 12, gate 9) | No — W3 lands the helpers; W4 wires fourier routers. |
| Session TTL 7→30 (item 13, gate 14) | No — fourier `database.py` config + one-shot Mongo update. |
| RateLimit headers (item 14, gate 12) | No — ~15 LOC fourier middleware. |
| ETag/If-Match consumer adoption (item 15, gate 13) | No — fourier stores send `If-Match`; W3 lands the server half. |
| `@axe-core/playwright` (item 10, gate 5) | No — npm devDep (`@axe-core/playwright`); not present in `web/package.json` yet but W4.d adds it; no value.js coupling. |

Every load-bearing sub-gate is **purely fourier-internal**. The single cross-repo edge (`colors.ts`/`easings.ts`/dep-bump) is held as a named residual. `R6-timing.md:7` independently confirms the edge is **severed, not delayed** (value.js-C RETIRED; `~/Programming/value.js/docs/tranches/C/FINAL.md`), so there is no future publish to wait for — the dependency's target node was deleted. **Confirmed: no hidden value.js dependency.**

---

## §2 — Image-blob storage-growth bound analysis

**The probe brief's framing carries one factual error that must be corrected before the analysis lands honestly.** The brief asserts the bound comes from "the converged entity's soft-delete + `pinned`-flag cron (already landed in tranche A) + `deleted_at`-grace hard-delete." Live-tree verification:

- **`pinned`-flag cron: ALREADY LANDED in tranche A — CONFIRMED.** `janitor.py:54-77` runs `_recompute_pin_flags` (an idempotent server-side `$merge` aggregation, `:181-276`) then deletes `{"pinned": False, "last_accessed_at": {"$lt": cutoff}}` against the live compound indexes `(pinned, last_accessed_at)` (`database.py:49, 57`). No `$nin` anywhere in the 305-line file. This bound is REAL and live.
- **soft-delete + `deleted_at`-grace hard-delete: NOT YET LANDED.** There is **zero** `deleted_at` / `soft_delete` / `is_deleted` token anywhere in `api/` (verified by grep). The `deleted_at` field, the soft-delete pass, and the grace hard-delete are **net-new W3 work** (`R4-scaling-bounds.md:18, :130` "Absent today … New W3 work"; `R-lifecycle-spec.md §1.1` "Soft-delete: **Absent**"). The brief's "already landed in tranche A" is wrong for this component — it lands in the SAME wave (W3) that retires the band-aid.

This correction matters: the storage bound post-W3 does NOT rest on a pre-existing soft-delete mechanism. It rests on the access-recency cron that A landed, PLUS the soft-delete grace pass W3 lands concurrently.

### 2.1 The actual storage-growth bound post-W3 (traced against live code)

The band-aid being retired (`janitor.py:79-118`, `config.py:15` `storage_budget_gb=5.0`): aggregates `$sum:"$bytes"` over `images`; if over `5 GB`, cursor-sorts unpinned images by `last_accessed_at` ascending and `_delete_images_and_cascade` oldest-first until under budget. It is a **hard CAP**.

After retiring it, growth is bounded by **two surviving/incoming mechanisms**, both access-recency-based, not a fixed cap:

1. **Time-based access-recency prune (A-landed, live).** `janitor.py:66-77`: every 6h, delete contours and images where `pinned == False AND last_accessed_at < now - asset_max_age_days` (`config.py:14`, default **30 days**). An image is `pinned` iff referenced by a snapshot or a featured/saved gallery row (post-W3: by a non-draft, non-deleted, or featured/saved `visualization` — `R4-scaling-bounds.md:45`). So **any image not accessed in 30 days and not pinned is reaped.** This is the load-bearing bound. It is NOT a fixed byte cap — it is a *recency horizon*.

2. **`deleted_at`-grace hard-delete (W3-incoming).** `R-lifecycle-spec.md §3.2`, `R4-scaling-bounds.md:18-29`: soft-deleted visualizations are hard-deleted by the janitor after a 30-day grace, cascading to now-unreferenced contours/images (which then fall to mechanism 1 on the next cycle). Bounded `$lt` query on a sparse `deleted_at` index — no `$nin`, no in-memory set. Invariant 12 held in shape.

**The bound is therefore: `Σ bytes(images reachable from a live, recently-accessed visualization within the 30-day recency horizon)`.** Steady-state storage is proportional to the *active working set over a rolling 30-day window*, not to all-time cumulative uploads. Unpinned, idle blobs evaporate at the recency horizon regardless of total byte volume.

### 2.2 Is this a real bound or a silent unbounded-growth liability?

It is a **real, if looser, bound — not unbounded growth.** The distinction the band-aid retirement changes:

- **Before**: a HARD byte cap (5 GB), enforced by eviction even on *recently-accessed pinned-adjacent* data.
- **After**: a SOFT recency-horizon bound (30-day access window × pin policy). The total can exceed 5 GB if the active+pinned working set genuinely exceeds 5 GB — but it cannot grow without limit from *abandoned* uploads, because those reap at 30 days.

The one residual liability class is **pinned data**: an image pinned by a featured/saved visualization (or, post-W3, a non-draft visualization) is exempt from the recency prune indefinitely. This is unbounded ONLY in the cardinality of deliberately-retained published artifacts — which is a *curatorial* growth (admin-/owner-chosen), not a *runaway* growth. `R4-scaling-bounds.md:119` keeps the per-doc `bytes` field precisely as "the C-migration's accounting input" so fourier-C can size the relocation. The deferral is precisely scoped to storage **location**, not storage **bound** (`R4-scaling-bounds.md:103, :109`; `R-lifecycle-spec.md §6.4`).

**One honesty caveat in the plan text.** `W3.md:43` (scope item 21) reads: "The `storage_budget_gb` band-aid retirement … removes the band-aid **without capping growth**; W3's brittleness window therefore implicitly bounds the storage clock until fourier-C opens." The "brittleness window bounds the storage clock" clause is **rhetorically loose** — the W3 brittleness window (`B.md §8`) is a within-wave migration coexistence span, not a storage-duration bound; it closes when W3 closes and does nothing to bound storage afterward. The *real* post-W3 bound is the recency-prune horizon (mechanism 1 above), which is live and independent of the brittleness window. The clause overstates the brittleness window's role but UNDERSTATES the actual safety: the recency prune is a stronger, standing bound than the sentence implies. Net effect: the deferral is *safer* than W3.md's own justification claims, not less safe.

---

## §3 — Invariant 12 verdict

**Invariant 12 ("the persistence story scales without contrivance") is NOT left in violation by retiring the band-aid + deferring the redesign. This is an HONEST deferral with a real (looser) bound, not a silent unbounded-growth liability.**

Reasoning, decisively:

1. **The band-aid was itself the invariant-12 violation, not its guardian.** `R-lifecycle-spec.md §1.1`, `e-crud-slug-valuejs.md §5.3`, and `h4-fourier-B.md:226` all name `storage_budget_gb` eviction as the KISS / invariant-12 *violation* — a contrivance that masks the storage question by deleting recently-relevant data to hold an arbitrary 5 GB line. Retiring it REMOVES a contrivance; it does not remove a principled bound.

2. **A principled bound survives the retirement.** The access-recency prune (`pinned=False, last_accessed_at < 30d`) is live (A-landed, verified at `janitor.py:66-77`) and bounds storage to the rolling active working set. This is the "smallest honest mechanism" invariant 12 demands. Abandoned blobs cannot accumulate without limit.

3. **The deferral is named, scoped, and non-silent.** Image-blob redesign is a CHRONIC-LOAD-BEARING item routed to fourier-C with an explicit cross-tranche-debt entry (`B.md §7:153`, `R-lifecycle-spec.md §6.5`), a candidate-backend survey (filesystem+nginx > GridFS > MinIO > managed S3), a preserved accounting field (`bytes`), and a stable FK (`image_slug`) that the C-migration relocates under. Nothing is hidden; the successor is named. Invariant 12's KISS clause ("no superfluous cloud, no pre-optimization") is *honored* by NOT pre-building GridFS/S3 before blob volume warrants it.

4. **The only correction to register is documentation, not architecture.** The W3.md:43 "brittleness window bounds the storage clock" clause is loose (§2.2); and the brief's "soft-delete already landed in A" premise is factually wrong (§2 head). Neither changes the verdict — the live recency prune is the standing bound, and it is real.

---

## §4 — DISPOSITION

**Sub-probe A (W4 fallback honesty): ACCEPTED-AS-HONEST.** The fallback exists, is the default-firing primary path, holds `colors.ts`/`easings.ts` byte-identical (not gutted), records a named non-silent residual to `fourier-tranche-C-or-successor`, and carries no hidden value.js publish dependency in any load-bearing sub-gate. The single cross-repo edge is severed (value.js-C RETIRED), not deferred. **No narrowing required.**

**Sub-probe B (image-blob deferral): NARROWED.**

> **W3 may retire the `storage_budget_gb` band-aid (delete the `janitor.py:79-118` eviction pass + the `config.py:15` setting; keep the per-doc `bytes` field) — this is an honest deferral with a real recency-horizon bound — ONLY IF W3 ALSO satisfies the following, which the plan already requires but the P3 audit pins as load-bearing:**
>
> 1. **The access-recency prune remains live and unweakened** for both `contours` and `images` (`{pinned: False, last_accessed_at: {$lt: cutoff}}`, `asset_max_age_days=30`), AND its pin-source is correctly re-rooted onto the converged `visualizations` collection (`R4-scaling-bounds.md:45` — pin iff referenced by a non-draft, non-deleted, or featured/saved visualization). If the pin re-root is botched, EVERY image could become unpinned-and-reapable OR every image could become permanently-pinned — both are real failure modes the W3 janitor edit must test (`test_pinned_flag_prevents_pruning` + the re-root case).
> 2. **The `deleted_at`-grace hard-delete cascade actually frees the now-unreferenced contours/images** (so soft-deleted visualizations' blobs return to the recency-prune horizon rather than pinning forever). This is W3 net-new work, NOT a tranche-A inheritance — W3 must land and test it.
> 3. **The W3.md:43 justification text is corrected** to attribute the post-retirement bound to the recency prune (the standing mechanism), not to the brittleness window (a within-wave span that bounds nothing after close). This is a documentation-honesty fix; it does not block the retirement.
>
> With (1)–(3), invariant 12 holds: storage is bounded by the rolling active working set, not by all-time uploads, and the redesign defers cleanly to fourier-C under a stable `image_slug` FK with `bytes` accounting preserved. **The retirement does NOT create a silent unbounded-growth liability and W3 MAY ship it under these conditions.**
