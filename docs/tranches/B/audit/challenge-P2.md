# Challenge P2 — migration-preserves-data (adversarial probe)

**Wave**: Wχ challenge wave, probe P2.
**Target plan**: B.W3 migration (`docs/tranches/B/waves/W3.md` scope items 8, 16–24).
**Mode**: RESEARCH-ONLY. Read source + read-only live Mongo. No source/spec edits, no migration run, no commit.
**Date**: 2026-05-26.

---

## §1 Count-parity re-derivation

**The Wα R5 formula under test:**

```
count(visualizations_after)
  == count(snapshots_before)
  == count(gallery_before) + count(orphan_snapshots_before)
```

resting on the premise: *every gallery row has a parent snapshot; every snapshot maps to exactly one visualization.*

**Premise tested against live code — VERDICT: the "every gallery row has a parent snapshot" premise is NOT enforced as a durable invariant. It holds only at publish time and is violable post-publish.**

Evidence:

1. **Enforced AT publish only.** `api/routers/gallery.py:167-169` (`publish_to_gallery`) does `db.snapshots.find_one({"snapshot_hash": body.snapshot_hash})` and 404s if absent. So a gallery row cannot be *created* without a parent snapshot. This is a creation-time check, **not** a foreign-key constraint.

2. **Snapshots are NEVER deleted; gallery rows ARE.** `grep -rnE 'db\.snapshots\.(delete|drop|remove)' api/` returns **zero** — no user, admin, or janitor path deletes from `snapshots`. Meanwhile gallery rows are deleted by:
   - user self-delete — `gallery.py:267`
   - admin delete / batch — `admin.py:157`, `admin.py:374`
   - janitor image-cascade — `janitor.py:293` (`_delete_images_and_cascade` removes gallery rows whose `image_slug` was evicted, but leaves the parent snapshot untouched)
   - janitor stale-user cascade — `janitor.py:141`

   So the live steady-state is the **inverse** of the premise's symmetric reading: `count(snapshots) >= count(gallery)` is the structural truth, with the gap being exactly the orphan-snapshot set. The middle equality `count(snapshots_before) == count(gallery_before) + count(orphan_snapshots_before)` is therefore **tautologically true by definition of orphan** (orphan := snapshot with no gallery row), so it survives — but only if "orphan" is defined snapshot-side, which it must be.

3. **The dangling direction the formula MISSES.** Because the image-cascade (`_delete_images_and_cascade`) deletes the gallery row but NOT the snapshot, and because nothing ever deletes a snapshot, **the formula's count is correct but the migration's *content* assumption is not**: an orphan snapshot in the live DB is not always "never published" — it can be "published-then-image-evicted." The W3.20 transform canonicalises orphan snapshots to `visibility=draft, pinned=False, anon-migrated-NNN`. A snapshot that *was* a featured/public gallery entry before its image was janitored becomes a silent `draft` with a synthetic anon owner. **No data row is lost, but the visibility + ownership of these rows is silently downgraded.** (Severity in §3.)

**Net §1 verdict:** the count *arithmetic* is sound (every snapshot → exactly one visualization; gallery rows fold onto their parent per W3.20). The premise's *FK durability* claim is FALSE — gallery→snapshot is a creation-time check, not an invariant — but this does not break the count because orphans are defined snapshot-side. It DOES surface a content-fidelity hazard (§3, candidate D-2).

---

## §2 Owner-less path census

| # | Path | Live anchor | Owner state | Resolution rule (per W3.17/G2) |
|---|------|-------------|-------------|--------------------------------|
| 1 | **Nullable-owner gallery row** | `gallery.py:162` `user_slug = await resolve_session(request)` → `resolve_session` returns `None` when no `X-Session-Token` (`dependencies.py:148-149`); written verbatim to `gallery_doc["user_slug"]` at `gallery.py:188`; model permits it — `models/gallery.py:25` `user_slug: str \| None = None`. | `None` (anonymous publish) | W3.6 retires the path going forward (publish → 401); migration mints `anon-migrated-NNNNN` for the existing `None` rows. |
| 2 | **Owner-less, delete-path-less snapshot** | snapshots carry **no owner field at all** (`snapshots.py:50-57` — only `snapshot_hash, image_slug, contour_hash, contour_settings, animation_settings, created_at`); never deleted (§1 evidence 2). | no owner field | orphan-snapshot pass mints `anon-migrated-NNNNN`, `visibility=draft`. |

**THIRD owner-less path — FOUND. Candidate: the published-then-evicted snapshot (the "zombie orphan").** This is distinct from path 2's "never-published draft." As established in §1 evidence 3, `_delete_images_and_cascade` (`janitor.py:279-304`) deletes the gallery row but not the snapshot. The resulting snapshot is owner-less AND was once a real public/featured gallery entry. The migration's orphan pass cannot distinguish it from a never-published draft — both look like "snapshot with no gallery row." **The plan's W3.20 treats all orphan snapshots identically (`draft`/anon), so this path is *handled for count purposes* but mis-classified for content.** Not a third *count* leak; it is a third *semantic* class the orphan rule collapses. Flag for §3.

**Other surfaces checked and CLEARED:**
- **IndexedDB `WorkspaceDraft`** — explicitly deferred to W4 (W3.22); not server-migrated; `image_slug` keyPath stays resolvable. No owner-less server row introduced. Clear.
- **`images` collection** — has no owner field by design; FK-stable per W3.21 (`image_slug` not migrated). Not an identity row. Clear.
- **`contours` collection** — no owner field; content-addressed by `contour_hash`; not an identity row. Clear. (But see §4 — contours are the dangling-hash target, not an owner-less path.)
- **`flags` collection** — `reporter_slug` is owner-bearing but flags are moderation artefacts, not visualizations; out of migration scope. Clear.

---

## §3 Data-loss / corruption candidates

### D-1 — Naive/aware datetime landmine — **CONFIRMED, severity MEDIUM, scope addition REQUIRED**

- `snapshots.py:49` writes `created_at = datetime.utcnow()` → **naive** UTC.
- `gallery.py:176` writes `created_at = datetime.now(UTC)` → **aware** UTC.

Both confirmed verbatim. The W3 plan does **NOT** mention tz-coercion anywhere in items 8, 16–24, nor in the W3.20 canonicalisation rule. **This is a required scope addition.**

**Severity refinement (the probe owes precision here):** MongoDB stores both as UTC `ISODate` on the wire (verified live — `contours.created_at` round-trips as `ISODate(...)`), so the divergence is **invisible while data sits in Mongo** and invisible to the migration's own `$set` copy. The crash surface is **Python-side comparison after a `find()` that returns a mix of naive (snapshot-sourced) and aware (gallery-sourced) `created_at` values in one cursor.** The W3 spot-check (10 random rows, seed=42, per item 9/22) and any post-migration code that sorts/compares `visualizations.created_at` in Python across both provenances will raise `TypeError: can't compare offset-naive and offset-aware datetimes`.

Note: the janitor itself compares `last_accessed_at` / `last_seen_at` / `timestamp` (all written aware) against aware cutoffs — it does **not** compare `created_at`, so the "first janitor cycle crashes" framing in the probe brief is **not** literally where it bites. The bite is in the migration spot-check and any `visualizations` list/sort that reads mixed-provenance `created_at` back into Python. **Required addition:** the W3.20 transform must coerce every copied `created_at`/`updated_at` to a single tz-awareness (recommend: force aware UTC via `dt.replace(tzinfo=UTC)` when naive) before `$set`.

### D-2 — Orphan-snapshot visibility/ownership downgrade — **CONFIRMED, severity LOW-MEDIUM, scope NOTE required**

Per §1 evidence 3 / §2 third path: a published-then-image-evicted snapshot is migrated as `visibility=draft` + `anon-migrated-NNN`, silently demoting what was a public/owned entry. No row lost; metadata (original owner, public visibility, tier, view/like counts) is **gone with the gallery row** — but those were *already* gone pre-migration (the janitor deleted them). So the migration does not *cause* the loss; it inherits it. **Required note:** W3.20's spot-check appendix should state that orphan snapshots are intentionally `draft`/anon and that any pre-eviction public history is non-recoverable (it lives nowhere). This is honesty, not a fix.

### D-3 — Snapshot has no owner field to carry forward — **CONFIRMED, severity LOW (by design)**

`snapshots.py` doc shape carries **no `user_slug`**. A *gallery-backed* snapshot inherits its owner from the gallery row during the fold (W3.20: parent snapshot is source-of-truth for settings, gallery row supplies owner). A *non-gallery* snapshot has no owner anywhere → anon. This is correct and handled, but the transform MUST take `owner_slug` from the **gallery** side (settings from snapshot, owner from gallery) — a split-source merge. If the transform naively takes all fields from the snapshot parent (as W3.20's "canonicalise on the snapshot" wording risks implying), **owner_slug is lost for every gallery row.** **Required clarification:** W3.20 must explicitly state owner_slug is sourced gallery-side, not snapshot-side (the snapshot has no such field).

### D-4 — `null` user_slug rows + tightened `^anon-migrated-\d+$` — cleared

Mint function (W3.17) is correctly separated from `slug_with_retry` and the conformance exception is scoped. No corruption. Clear.

---

## §4 Orphan-detection + idempotency + dangling-hash

- **Bounded orphan detection (W3.16): SOUND.** The chunked `$lookup` `{from: "gallery", localField: "snapshot_hash", as: "gallery"}` + `$match {gallery: {$size: 0}}` has no BSON-16MB ceiling; the rejected `$nin` over `gallery.distinct("snapshot_hash")` is correctly excluded (sub-gate greps it to zero). Mirrors the janitor's own `$nin` retirement (`janitor.py` rewritten to `pinned`-flag aggregation + `$merge`, verified). **Verdict: bounded.**

- **`migrated_from` idempotency marker (W3.19): SOUND in principle, with one caveat.** `find({migrated_from: {$exists: false}})` re-run guard is correct, and the marker disambiguates the orphan re-mint. **Caveat:** the marker must be set in the **same `$set` as the payload**, not a second write — if the script `$set`s the payload then crashes before stamping `migrated_from`, a re-run double-processes that doc. Recommend the transform write `migrated_from` atomically within the per-doc `$set` (upsert keyed on a deterministic `_id` derived from source `_id`, so the second run is an idempotent no-op even mid-crash). **Verdict: sound if marker is co-written; flag the atomicity.**

- **Dangling-contour-hash post-condition (W3.18): SOUND and NECESSARY — live FK shape confirms the risk is real.** `contour_hash` → `contours` is a genuine dangling FK because `janitor.py:66` `db.contours.delete_many({pinned: False, last_accessed_at < cutoff})` deletes contours by age, while nothing guarantees the referencing snapshot/gallery row is pinned (a snapshot pins its contour via `_recompute_pin_flags`, but the pin recompute runs *at janitor cycle start* — a snapshot created between cycles whose contour was already past-cutoff-and-unpinned can have its contour swept in the same cycle's step 2 before… no — recompute precedes delete in the same cycle, so within-cycle it's safe; the hazard is a contour evicted in a *prior* cycle when no snapshot yet referenced it, then a snapshot created later carrying that now-dead `contour_hash`). The W3.18 `$lookup` post-condition that **aborts** on any `visualizations.contour_hash` not resolving in `contours` is therefore the correct guard. **Verdict: sound; abort-on-dangling is the right disposition.** Live note: `contours=5, images=4`, zero dangling image FKs observed, but the snapshot/gallery sets are empty so the contour-FK path is untested on real data — the post-condition is the only safety net and must stay.

---

## §5 Live counts

DB **`fourier`** reachable read-only via `docker exec fourier-analysis-mongo-1 mongosh -u fourier-admin -p fourier-dev-only --authenticationDatabase admin` (dev defaults from `docker-compose.yml`).

| Collection | Count |
|---|---|
| `snapshots` | **0** |
| `gallery` | **0** |
| `contours` | **5** |
| `images` | **4** |
| `users` | 1 |
| `flags` | 0 |

`visualizations` collection: **absent** (migration not yet run — correct pre-state).

**Grounding note:** the migration's *primary* source collections (`snapshots`, `gallery`) are **both empty** in this dev DB, so a real migration run here would produce `count(visualizations) == 0` and exercise none of the orphan/dangling/datetime hazards. The parity formula is verifiable only against seeded fixtures (W3.23's `test_migrate_integration.py`). **The empty primary collections mean the dry-run gate (W3.c sub-gate) will pass trivially and prove nothing about the hazards above** — the seeded integration test, not the dev-DB dry-run, is the load-bearing verification. The non-empty `contours`/`images` confirm the FK targets exist and (for the 5 contours observed) carry `contour_hash` + a resolvable `image_slug` (0 dangling image FKs), and `images.pinned` is already present (`false`) — consistent with the janitor backfill.

---

## §6 DISPOSITION

**NARROWED** (not rejected — every path can be made honest within the within-wave brittleness window; not accepted — the plan as written omits three required additions).

The migration's count arithmetic is sound and the orphan/bounded-query/idempotency/dangling-hash machinery (W3.16–19) is well-formed. But three scope additions MUST be absorbed by W3 before close:

1. **[REQUIRED] Datetime tz-coercion in the W3.20 transform (D-1).** Coerce every copied `created_at`/`updated_at` to aware UTC (`replace(tzinfo=UTC)` when naive) before `$set`. The naive `snapshots.utcnow()` vs aware `gallery.now(UTC)` split is confirmed and is absent from the plan. Without it the seed=42 spot-check and any mixed-provenance Python comparison raise `TypeError`.

2. **[REQUIRED] Split-source merge clarification in W3.20 (D-3).** Owner_slug MUST be sourced **gallery-side**; settings source-of-truth is the snapshot. The snapshot carries no owner field, so "canonicalise on the snapshot" must not be read as "take all fields from the snapshot" or every gallery owner is lost.

3. **[REQUIRED-NOTE] Orphan-class honesty + idempotency atomicity (D-2 + §4 caveat).** (a) The spot-check appendix must state that published-then-image-evicted snapshots migrate as `draft`/anon and their pre-eviction public history is non-recoverable (it was already destroyed by the janitor — the migration inherits, does not cause, the loss). (b) The `migrated_from` marker must be co-written in the same atomic `$set` as the payload (ideally via deterministic `_id`) so a mid-pass crash + re-run is a true no-op.

No data ROW is lost by the migration. The corruption candidates are (1) a crash-on-read tz landmine, (2) a silent owner-loss if the merge is mis-coded, and (3) an inherited visibility downgrade that must be documented, not fixed. All three are local edits inside the W3.c transform + W3.b model — well within the brittleness window. **Disposition: NARROWED with the three additions above.**
