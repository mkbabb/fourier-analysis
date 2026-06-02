# J.W1 — the visualization CRUD + REMIX API spec (WAVE D CORE)

**Wave**: J.W1 (the CORE; constellation WAVE D).
**Disposition**: DEV (design doc; the IMPL boundary opens at J.W2).
**Author**: fourier-tranche-J.
**Substrate read**: `docs/constellation/next/audit/A3-fourier-valuejs.md §4` (the WAVE-D seed — the NEED) + value.js's already-built fork/version/provenance shape (`api/src/services/palette/forks.ts`, `api/src/services/palette/versions.ts`, `api/src/models.ts`) + fourier's CRUD surface (`api/routers/visualizations.py`, `api/models/visualization.py`, `api/lib/crud/`).

This is the spec the audit named the CORE. The audit found the asymmetry file:line — fourier ships a `fork_count`/`most-forked` READ side (`api/lib/crud/cursors.py:17,21`) with **zero** fork/remix endpoints, no version collection, no atom-diff. value.js ships the whole fork+version+provenance machinery but no atom-diff. WAVE D closes both gaps with one pattern: fourier inherits the proven fork/version/provenance shape, both repos gain the atom-diff layer. This doc is the fourier authoring; value.js-J adopts the same pattern over its `PaletteColor[]` atoms.

---

## §0 — The KISS line (what this is NOT)

The single load-bearing constraint, stated first so every downstream decision reads against it:

- **Single-parent, LINEAR provenance.** A remix descends from exactly one source-version. The provenance chain is a list, walked parent→child→…→root. **NO DAG, NO merge, NO rebase, NO CRDT.** There is no operation that has two parents; there is no operation that reconciles divergent edits. value.js's `getProvenance` (`forks.ts:161`) already walks a single-parent `forkOf` chain with a ≤50 cap and a `visited` cycle-guard — WAVE D keeps that exact walk and hangs a diff off each edge.
- **The atoms are a small, flat, content-addressable BAG.** Not a tree, not a document, not a Merkle structure. A viz's diffable state is a fixed handful of named config atoms (`active_bases`, `n_harmonics`, `contour_settings`, `animation_settings`, `palette_slug`). A diff is a per-atom set-difference over two bags. No three-way anything.
- **No new storage engine.** The diff is a JSON payload persisted on the version/edge document in the existing `visualizations` + a new `visualization_versions` collection, written under the existing `withTransaction`-equivalent cross-collection discipline (Mongo session). MongoDB documents, the existing `api.lib.crud` helpers, the existing problem+json / ETag / soft-delete envelopes.
- **Shared PATTERN, not shared package.** Per inv-16 (shared-by-contract; per-language utility modules admitted, frameworks rejected) the atom-diff is a `api/lib/crud/atomdiff.py` utility module in fourier and a `lib/crud/atomdiff.ts` in value.js — authored once as a contract, adopted twice. No cross-repo codegen (inv-26), no shared binary. The atom-SET differs (config vs colors); everything else (the version record, the diff persistence, the two endpoints, the provenance walk) is identical in shape.

If a future need pushes toward a DAG / merge / collaborative-edit model, that is a DIFFERENT tranche with a DIFFERENT primitive — it is explicitly out of scope here and named so in §9.

---

## §1 — The atoms (the whole design is here)

A fourier visualization's *remixable* state is a fixed, named bag of config atoms. The content-hash material already in the codebase (`visualizations.py:72` `_compute_content_hash`) hashes four fields; WAVE D **decomposes** that one hash into per-atom hashes so a diff is cheap, and **widens** the bag to include the two settings sub-objects + the palette binding that a remix actually changes.

### §1.1 — The atom set (canonical)

| Atom key | Source field | Type | Why it is an atom |
|---|---|---|---|
| `active_bases` | `Visualization.active_bases` | `list[str]` (1–16) | the basis set — the primary remix lever |
| `n_harmonics` | `Visualization.n_harmonics` | `int` (1–4096) | the harmonic count — the second remix lever |
| `contour_settings` | `Visualization.contour_settings` | `ContourSettings` | a settings sub-object; a remix retunes contour params |
| `animation_settings` | `Visualization.animation_settings` | `AnimationSettings` | a settings sub-object; a remix retunes animation params |
| `palette_slug` | `Visualization.palette_slug` | `str | None` | the palette binding; a remix re-skins |

**NOT atoms** (deliberately, with rationale):

- `image_slug` / `contour_hash` — these are the *subject* (the traced figure), not a remix lever. A remix that changed the subject would be a new visualization, not a descendant. They are FK-validated at create (`visualizations.py:114-117`) and pinned through the fork (the child inherits the parent's subject). Including them as atoms would let a "remix" diverge into an unrelated image — a provenance lie.
- `title` / `description` / `tags` — editorial metadata, already PATCH-able on the live row (`VisualizationUpdate`), not content-defining (they are excluded from `_compute_content_hash` today). A remix may set them but they are not diffed as content atoms (a re-title is not a remix). They ride the create body, not the atom-diff.
- `views` / `likes` / `pinned` / `bytes` / `owner_slug` / `visibility` — engagement counters, admin flags, ownership, lifecycle. Never atoms.

This is the overfitting discipline applied to the atom set: 5 atoms, each a real remix lever with ≥1 consumer (the diff endpoint + the remix recorder), no speculative atom. The set is closed; adding an atom is a deliberate schema decision, not a default.

### §1.2 — Per-atom hashing

Each atom hashes to a stable hex digest over its canonical serialization. The serialization rules mirror the existing `_compute_content_hash` discipline (`sort_keys=True`, compact separators) so order-independence holds:

```
atom_hash(key, value) = sha256( key + "\x00" + canonical_json(value) )[:16]
```

where `canonical_json`:
- `active_bases` → `json.dumps(sorted(value))` (order-independent — `[a,b]` and `[b,a]` are the SAME basis set, matching the existing `sorted(payload.active_bases)` at `visualizations.py:79`).
- `n_harmonics` → `json.dumps(value)`.
- `contour_settings` / `animation_settings` → `json.dumps(model_dump(), sort_keys=True, separators=(",",":"))`.
- `palette_slug` → `json.dumps(value)` (`null` hashes to a stable digest — absence is a real atom state).

A 16-hex-char (64-bit) truncation is sufficient for a 5-atom bag (collision-irrelevant at this cardinality; the full content-hash stays sha256 for dedup/ETag).

### §1.3 — The atom-SET hash (the version identity)

A version's identity is the order-independent hash of its atom-hash set:

```
set_hash(atoms) = sha256( "|".join(sorted( atom_hash(k, v) for k, v in atoms )) )
```

Two visualizations with the same atoms (regardless of `active_bases` array order) produce the same `set_hash` and DEDUP — exactly the property value.js's content-hash already gives palettes, narrowed to per-atom so the diff falls out for free. The `set_hash` becomes the `_id` of the version document (value.js precedent: `PaletteVersion._id = hash`, `models.ts:117`).

**Relationship to the existing `content_hash`.** `Visualization.content_hash` stays — it is the dedup/ETag substrate over `(image_slug, contour_hash, active_bases, n_harmonics)` and the ETag floor (`etag.compute_etag`). The new `set_hash` is the *atom-set* identity over the 5 remix atoms; it is the version `_id` and the provenance node key. The two coexist: `content_hash` answers "is this the same saved result?" (subject-bearing); `set_hash` answers "is this the same remix-config?" (subject-free). They are computed from overlapping but distinct material and serve distinct questions. No collapse — collapsing them would re-conflate subject with config (the §1.1 NOT-atom rationale).

---

## §2 — The persisted shapes (the one genuinely new collection + the edge)

### §2.1 — `Visualization` additions (the fork-bearing fields)

Lifted field-for-field from value.js's proven `Palette` shape (`models.ts:76-109`), Pydantic-ized. The audit's WAVE-D point 1: fourier inherits the substrate value.js already ships.

```python
class Visualization(SoftDeleteMixin):
    # ... existing fields unchanged ...

    # --- WAVE D: fork/version/provenance (lifted from value.js Palette) ---
    set_hash: str                       # atom-set identity (§1.3); the version _id at HEAD
    fork_of: str | None = None          # slug of the source viz this was remixed from (null = original)
    fork_of_hash: str | None = None     # source viz's set_hash at remix time (the edge's `fromHash`)
    fork_count: int = 0                 # WRITE side now exists (cursors.py:21 already reads it)
    version_count: int = 1              # how many versions this viz has accreted
```

`fork_count` is the field `cursors.py:21` already sorts `most-forked` by — today a phantom (never written, not even on the model). WAVE D makes it real. `fork_of` is the single-parent provenance pointer (value.js `forkOf`). No `root_hash`/`depth` on the *live* row — those live on the version document (§2.2) where the chain math belongs.

### §2.2 — `visualization_versions` collection (the one new persisted shape)

Mirrors value.js `PaletteVersion` (`models.ts:115-129`) with fourier's config atoms in place of color stops, **plus** the diff-bearing edge payload the audit names as the single genuinely-new shape (WAVE-D point 3):

```python
class VisualizationVersion(BaseModel):
    """An immutable snapshot of a viz's remix-atoms at one point on its
    single-parent provenance chain. `_id` is the atom-set hash (§1.3).
    The edge from this version's PARENT to this version carries the atom-diff.
    """

    id: str = Field(alias="_id")        # = set_hash (the atom-set identity)
    viz_slug: str                       # the visualization this version belongs to
    author_slug: str

    # --- the atoms snapshot (subject-free remix config) ---
    active_bases: list[str]
    n_harmonics: int
    contour_settings: ContourSettings
    animation_settings: AnimationSettings
    palette_slug: str | None

    # --- single-parent linear provenance (value.js PaletteVersion shape) ---
    parent_hash: str | None             # set_hash of the immediate parent version (null = root)
    forked_from_hash: str | None        # source viz's HEAD set_hash at remix time (null = not a fork)
    root_hash: str                      # set_hash of the chain root
    depth: int                          # 0 at root, +1 per version

    # --- WAVE D: the diff-bearing edge (the one new shape) ---
    # The atom-diff from parent_hash → this version. Empty list at a root
    # (depth 0 has no parent edge). This is what `GET /:slug/diff` returns.
    atom_diff: list[AtomOp] = Field(default_factory=list)

    created_at: datetime

    model_config = ConfigDict(extra="forbid", populate_by_name=True)
```

```python
class AtomOp(BaseModel):
    """One atom-level change on a provenance edge. `before`/`after` are the
    raw atom values (JSON-serializable); `op` is derived but persisted for
    cheap rendering (the diff-viewer reads `op` without re-deriving)."""

    op: Literal["added", "removed", "modified"]
    atom_key: Literal["active_bases", "n_harmonics", "contour_settings",
                      "animation_settings", "palette_slug"]
    before: object | None = None        # absent for "added"
    after: object | None = None         # absent for "removed"

    model_config = ConfigDict(extra="forbid")
```

`atom_diff` is the audit's "one genuinely new persisted shape" (`{fromHash, toHash, atomDiff}` — here `fromHash`=`parent_hash`, `toHash`=`_id`, `atomDiff`=`atom_diff`). The edge lives ON the child version document, not in a separate `provenance_edges` collection — the edge is 1:1 with the child (single-parent) so a separate collection would be a needless join. KISS.

### §2.3 — Indexes

```
visualization_versions:
  { _id: 1 }                          # set_hash identity (default)
  { viz_slug: 1, depth: 1 }           # the provenance walk + version list for one viz
  { root_hash: 1 }                    # all versions sharing a chain root (future fork-tree view)
visualizations:
  { fork_of: 1 }                      # listForks(slug) — children of a source (value.js findForksOf)
  { fork_count: -1, _id: 1 }          # most-forked cursor sort (cursors.py:21 — now write-backed)
```

The `{fork_count:-1, _id:1}` compound index makes the already-wired `most-forked` cursor sort real and stable (the `_id` tiebreak matches the cursor-pagination discipline in `cursors.py`).

---

## §3 — The atom-diff algorithm (the shared pattern)

`api/lib/crud/atomdiff.py` — the utility module authored once, parameterized over "how to enumerate + key the atoms" (the audit's WAVE-D point 5). The fourier instantiation keys over the 5 config atoms; the value.js instantiation (in `lib/crud/atomdiff.ts`) keys over `PaletteColor[]` by `position`. The CORE is repo-agnostic:

```python
def enumerate_atoms(viz_or_payload) -> dict[str, object]:
    """The ONE fourier-specific seam: name + extract the 5 config atoms.
    value.js's TS twin enumerates PaletteColor[] keyed by position."""
    return {
        "active_bases": sorted(viz_or_payload.active_bases),
        "n_harmonics": viz_or_payload.n_harmonics,
        "contour_settings": viz_or_payload.contour_settings.model_dump(),
        "animation_settings": viz_or_payload.animation_settings.model_dump(),
        "palette_slug": viz_or_payload.palette_slug,
    }


def diff_atoms(before: dict[str, object], after: dict[str, object]) -> list[AtomOp]:
    """Set-difference two atom bags into a list of per-atom ops.
    Order-stable (iterates the canonical atom-key order) so the diff is
    deterministic and ETag-able. Repo-agnostic: works on any {key: value} bag."""
    ops: list[AtomOp] = []
    keys = before.keys() | after.keys()
    for key in ATOM_KEY_ORDER:            # canonical order, not set-iteration order
        if key not in keys:
            continue
        b, a = before.get(key, _ABSENT), after.get(key, _ABSENT)
        if b is _ABSENT:
            ops.append(AtomOp(op="added", atom_key=key, after=a))
        elif a is _ABSENT:
            ops.append(AtomOp(op="removed", atom_key=key, before=b))
        elif atom_hash(key, b) != atom_hash(key, a):
            ops.append(AtomOp(op="modified", atom_key=key, before=b, after=a))
        # equal hash → no op (the dedup property)
    return ops
```

For fourier's *fixed* 5-atom bag, `added`/`removed` only fire on `palette_slug` (the one nullable atom) — `active_bases`/`n_harmonics`/`*_settings` are always present, so they only ever `modify`. For value.js's *variable* `PaletteColor[]` bag, all three ops fire (colors are genuinely added/removed). The algorithm is identical; the bag cardinality differs. That is exactly the "parameterized over atom-enumeration, identical otherwise" shape the audit prescribes.

**Diff between any two versions on the chain** (not just adjacent): `GET /:slug/diff?from={hash}` (§4.4) recomputes `diff_atoms(enumerate(from_version), enumerate(head))` on the fly — the persisted `atom_diff` is the adjacent-edge diff (parent→child); an arbitrary `from` is computed against the two snapshots. Both are the same `diff_atoms` call; nothing new.

---

## §4 — The endpoints (agent-legible, WebMCP-watched)

Five endpoints. The remix mutation + the read-only diff/provenance/versions reads. Every read carries `readOnlyHint`-able semantics (idempotent, ETag-able, cacheable) so a future WebMCP `registerTool` surface (the audit's G5, booked as a residual not a wave) exposes them verbatim. Every error is the existing RFC 9457 problem+json (`errors.problem`); descriptive validation errors so an agent can retry (the agent-legibility constraint).

### §4.1 — `POST /api/visualizations/{slug}/remix`

The remix = fork + a RECORDED atom-diff (audit WAVE-D point 2). Composes the existing create machinery; adds the version record + the diff edge + the parent `fork_count` bump in one transaction (value.js `forkPalette` shape, `forks.ts:29-129`).

**Request body** (`VisualizationRemix`): the changed atoms, OR a full atom-bag the server diffs against the source HEAD.

```python
class VisualizationRemix(BaseModel):
    slug: str | None = None             # child slug; server-generated if absent
    visibility: Visibility = "draft"
    # Atom overrides — any subset; absent atoms inherit the source HEAD.
    active_bases: list[str] | None = Field(default=None, min_length=1, max_length=16)
    n_harmonics: int | None = Field(default=None, ge=1, le=4096)
    contour_settings: ContourSettings | None = None
    animation_settings: AnimationSettings | None = None
    palette_slug: str | None = _UNSET   # tri-state: unset=inherit, null=clear, str=set
    # Editorial (rides the create, not the diff).
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    tags: list[str] = Field(default_factory=list, max_length=10)

    model_config = ConfigDict(extra="forbid")
```

**Behaviour** (transaction-bound, value.js `forkPalette` discipline):
1. Read source (read-only, outside txn — fail fast 404/400/401 without a session, matching `forks.ts:35-49`). Anonymous remix is a 401 (ownership, `visualizations.py:106-108` precedent).
2. `source_atoms = enumerate_atoms(source)`; `child_atoms = merge(source_atoms, body overrides)`; `child_set_hash = set_hash(child_atoms)`.
3. `atom_diff = diff_atoms(source_atoms, child_atoms)`. **If `atom_diff` is empty → 422 problem+json** (`detail="a remix must change at least one atom"`) — a no-op remix is a degenerate fork; refuse it (this is a fourier tightening over value.js's fork, which permits a verbatim copy). Agent-legible: the error names exactly why.
4. The subject (`image_slug`, `contour_hash`) is INHERITED from the source — the child traces the same figure (§1.1 NOT-atom rationale). `content_hash` recomputed over the inherited subject + the new atoms.
5. **One transaction** (Mongo session, the `forks.ts:83-126` shape):
   - re-verify source still exists inside the txn (closes the delete-race, `forks.ts:88-94`);
   - insert the child `Visualization` (`fork_of=source.slug`, `fork_of_hash=source.set_hash`, `fork_count=0`, `version_count=1`, `set_hash=child_set_hash`);
   - insert the root `VisualizationVersion` for the child (`parent_hash=None`, `forked_from_hash=source.set_hash`, `root_hash=child_set_hash`, `depth=0`, `atom_diff=[]` — the child's OWN chain starts fresh) — AND the cross-viz edge diff is recorded on the child row's `fork_of_hash` + a synthetic edge version is NOT created (the cross-viz diff is reconstructable from the two HEADs via `?from=`);
   - bump `source.fork_count += 1` (`incrementForkCount`, `forks.ts:118`).
6. 201 + `Location: /api/visualizations/{child_slug}` + ETag, matching `create_visualization`'s envelope (`visualizations.py:154-161`).

**Idempotency**: rides the existing `idempotency.replay_or_record` store (`visualizations.py:163`) scoped to the owner — a retried remix with the same `Idempotency-Key` replays the same child, never double-forks.

### §4.2 — `GET /api/visualizations/{slug}/forks`

List the direct children of a source (value.js `listForks`, `forks.ts:136`). Cursor-paginated over `{fork_of: slug}` + `not_deleted_filter()`, the existing `cursors.paginate` machinery. Read-only, anonymous-permissible (public children only for anon; owner sees all visibilities). `readOnlyHint`-clean.

### §4.3 — `GET /api/visualizations/{slug}/provenance`

Walk the single-parent chain root-ward (value.js `getProvenance`, `forks.ts:161`). Returns the ordered node list `[{slug, set_hash, author_slug, created_at, is_fork}]`, ≤50 entries, `visited` cycle-guard — the EXACT value.js walk, lifted. Read-only, ETag-able (the chain is immutable once written). This is the node-chain; the diff lives on `?from=` (§4.4).

### §4.4 — `GET /api/visualizations/{slug}/diff?from={hash}`

The read-only atom-diff endpoint (audit WAVE-D point 4). Returns the `AtomOp[]` between the `{from}` version and the viz's HEAD (or between `{from}` and `{to}` if both given).

- `from` / `to` are `set_hash` values on this viz's chain (validated against `visualization_versions` where `viz_slug == slug`); an off-chain hash → 404 problem+json (`detail="version {hash} is not on this visualization's chain"`).
- Default `to` = the viz HEAD `set_hash`.
- Body: `{from, to, atom_diff: AtomOp[]}` — `diff_atoms(enumerate(from_version), enumerate(to_version))`.
- **Idempotent, ETag-able, cacheable** (`Cache-Control: public, max-age=…` — versions are immutable). This is the operation a diff-viewer (the §5 highlight-ranges consumer) and a WebMCP `readOnlyHint` tool both consume. The audit names this the cacheable read.

### §4.5 — `GET /api/visualizations/{slug}/versions`

List the viz's own version chain (value.js `versions.ts` precedent), cursor-paginated over `{viz_slug: slug}` sorted by `depth`. Each entry carries its `atom_diff` (the adjacent-edge diff) so a version-list view renders "what changed at each step" without N round-trips. Read-only.

### §4.6 — endpoint table

| Method | Path | Disposition | Idempotent | ETag | WebMCP hint |
|---|---|---|---|---|---|
| POST | `/{slug}/remix` | mutation (fork + recorded diff) | yes (Idempotency-Key) | response ETag | — |
| GET | `/{slug}/forks` | read (children list) | yes | — (list) | `readOnlyHint` |
| GET | `/{slug}/provenance` | read (node chain) | yes | yes | `readOnlyHint` |
| GET | `/{slug}/diff?from=` | read (atom-diff) | yes | yes (immutable) | `readOnlyHint` |
| GET | `/{slug}/versions` | read (version chain) | yes | — (list) | `readOnlyHint` |

---

## §5 — The consumer surfaces (≥2-consumer discipline)

WAVE D is ≥2-consumer by construction (the audit's overfitting note): fourier AND value.js both adopt the atom-diff pattern. Within fourier, the new endpoints earn their keep against these consumers — substrate-without-consumer is binary (inv-15), so each endpoint names a real reader:

1. **The gallery `most-forked` write-side** — `cursors.py:21` already SORTS by `fork_count`; `POST /remix` is the missing writer. The READ side has shipped since B; WAVE D makes it non-phantom. (consumer: the existing gallery sort, now real.)
2. **The diff-viewer render** — the web client renders `GET /diff` via the CSS Custom Highlight API (the audit's G6 `highlight-text-ranges`): "these 2 atoms changed, this 1 was added" as `Highlight` ranges over the config panel, not wrapper spans. Widely-Baseline-adjacent; the natural diff primitive. (consumer: the web viz-config panel.)
3. **The provenance breadcrumb** — `GET /provenance` feeds a "remixed from → … → original" trail in the viz header. (consumer: the web viz header.)
4. **The future WebMCP tool surface** — `registerTool("remix-visualization", …)` + `registerTool("diff-visualizations", {readOnlyHint:true}, …)`. This is the DESIGN CONSTRAINT (agent-legible endpoints), BOOKED as a J-residual not a wave (Early-Preview: Chromium 146 + flag). The endpoints are authored agent-legibly NOW so the tool surface is a thin wrapper LATER. (consumer: deferred, named.)

The remix/diff endpoints are the resource layer; consumers 1–3 ship in fourier-J; consumer 4 is the named-forward.

---

## §6 — Cross-repo parity with value.js-J (the shared pattern, two adoptions)

The audit's WAVE-D cross-cut: authored once, adopted twice, NO shared package (inv-16 / inv-26).

| Concern | fourier-J (this doc) | value.js-J (the twin) |
|---|---|---|
| atom-enumeration seam | 5 config atoms (`enumerate_atoms`) | `PaletteColor[]` keyed by `position` |
| atom-diff core | `lib/crud/atomdiff.py` | `lib/crud/atomdiff.ts` (same algorithm) |
| version collection | `visualization_versions` (NEW) | `palette_versions` (EXISTS — gains `atom_diff`) |
| fork machinery | LIFT value.js's `forkPalette` shape | EXTEND existing `forkPalette` → `remixPalette` |
| diff edge | `VisualizationVersion.atom_diff` (NEW) | `PaletteVersion.atom_diff` (NEW field) |
| `/diff?from=` endpoint | NEW | NEW |
| starting point | fourier INHERITS the whole substrate | value.js EXTENDS its existing substrate |

The `{fromHash, toHash, atomDiff}` edge SHAPE is identical across both repos (the audit's "single new persisted shape"). The `/diff?from=` response body shape (`{from, to, atom_diff: [{op, atom_key, before?, after?}]}`) is verified for parity at the J close (a cross-repo `/diff` shape-parity check — fourier-J §close-gate + value.js-J §close-gate). The atom VALUES differ (config sub-objects vs `{css, name?, position}`); the ENVELOPE does not.

---

## §7 — Migration (existing rows)

Existing `visualizations` rows predate the fork fields. The migration is additive and idempotent (the `MigratedFrom` / `migrated_from` discipline already in the model, `visualization.py:71-85,134`):

- Each live row gets `set_hash = set_hash(enumerate_atoms(row))`, `fork_of = None`, `fork_of_hash = None`, `fork_count = 0`, `version_count = 1`.
- Each live row gets one root `VisualizationVersion` (`parent_hash=None`, `root_hash=set_hash`, `depth=0`, `atom_diff=[]`, `forked_from_hash=None`).
- `fork_count` back-fill: for any row whose `fork_of` is non-null after the (no-op for legacy) pass, increment the parent — legacy rows have no `fork_of`, so this is a no-op until the first native remix. No phantom fork-counts.

Written through the existing migration-runner (`api/scripts/run_pending_migrations.py` + the `run_pending_migrations` discipline), one `$set` per row, tz-aware datetimes (H-W3-1(a)). The migration is the one IMPL-side schema touch; gated on a green migration test (`api/tests/test_migrate_*` precedent).

---

## §8 — Test surface (the close evidence)

- **Unit** (`atomdiff.py`): `diff_atoms` over each op (`added` palette, `removed` palette, `modified` each atom, empty diff → no ops); `set_hash` order-independence (`active_bases` permutation → same hash); per-atom hash stability.
- **Integration** (`test_visualization_remix.py`): `POST /remix` happy path (child created, version recorded, parent `fork_count` bumped, diff edge present); anonymous remix → 401; no-op remix (no atom override) → 422; idempotent retry → same child; the delete-race (source deleted mid-txn → clean abort, no orphan — the `forks.ts:88` shape).
- **Read endpoints**: `/forks` cursor pagination + visibility filtering; `/provenance` chain order + ≤50 cap + cycle-guard; `/diff?from=` adjacent + arbitrary `from` + off-chain hash → 404 + ETag immutability; `/versions` depth order + per-edge diff.
- **Conformance** (`api/tests/conformance/`): the remix/diff endpoints carry the same problem+json / ETag / cursor envelopes the existing conformance suite asserts (extend `test_problem.py` / `test_etag.py` / `test_pagination.py` coverage to the new paths).
- **Cross-repo** (J close): `/diff?from=` response-shape parity between fourier + value.js (the audit's "cross-repo `/diff` shape parity verified").

Every "green" cites a CI run id (inv-27). e2e/axe for the diff-viewer render rides the J e2e/axe evidence wave (folded — see J.md §wave-sequence).

---

## §9 — Explicitly out of scope (the KISS guardrails, named)

Recorded here so a successor does not re-litigate them as gaps (audit §4.4):

- **No three-way merge / rebase / DAG.** Single-parent linear only. A "merge two remixes" need is a DIFFERENT primitive in a DIFFERENT tranche.
- **No CRDT / collaborative edit.** These are forked-then-remixed artifacts, not co-edited documents.
- **No new storage engine.** JSON-on-document, existing Mongo + `lib/crud`.
- **No cross-viz subject remix.** A remix inherits the subject (`image_slug`/`contour_hash`); changing the subject is a new visualization, not a descendant.
- **No `root_hash`/`depth` on the live row.** Chain math lives on the version document; the live row carries only `fork_of`/`fork_of_hash`/`fork_count` (the value.js `Palette` shape, not the `PaletteVersion` shape).
- **WebMCP tool surface is BOOKED, not built** (Early-Preview; Chromium 146 + flag). The endpoints are authored agent-legibly so the tool wrapper is thin later.

---

## §10 — Summary (the spec in one paragraph)

Viz remix-atoms are a small flat content-addressable bag of 5 named config atoms (`active_bases`, `n_harmonics`, `contour_settings`, `animation_settings`, `palette_slug`); each atom hashes; the order-independent set-hash is the version identity. A remix is a fork (lifting value.js's proven `forkPalette` transaction shape) PLUS a recorded atom-diff persisted as `{parent_hash, set_hash, atom_diff}` on a new `VisualizationVersion` document — the single genuinely-new persisted shape. Five endpoints (`POST /remix`, `GET /forks|/provenance|/diff?from=|/versions`), every read idempotent + ETag-able + agent-legible for a future WebMCP surface, every error RFC 9457 problem+json. Single-parent LINEAR provenance, no DAG/merge/rebase/CRDT. The atom-diff core is a shared PATTERN (`lib/crud/atomdiff.{py,ts}`), authored once, adopted twice (fourier config atoms, value.js color atoms), no shared package. fourier inherits the fork/version/provenance substrate it lacks; value.js extends its existing fork machinery with the diff layer. It EARNS value.js's substrate as a pattern and is ≥2-consumer by construction.
