# J-diff-shape — the canonical, repo-neutral atom-diff envelope (the binding contract)

**Wave**: J.W1 (CORE; constellation WAVE D). **Disposition**: DEV (contract doc; binds both impls + both conformance probes).
**Author**: fourier-tranche-J (FA1). **Date**: 2026-06-02.
**Status**: THE single source of truth for the cross-repo `/diff` boundary. Both `fourier/api/lib/crud/atomdiff.py` and `value.js/lib/crud/atomdiff.ts` bind against THIS doc; neither binds against the other.

**Why this file exists.** The deep-audit synthesis (`docs/audits/runs/2026-06-02-J-deep-audit/J-deep-audit.md §4`, the P0-class diff-envelope row) and A3 (`A3-valuejs-crud-symmetry.md §3`) found that the cross-repo `/diff` envelope claimed "parity-verified at close" is **not isomorphic today — it merely rhymes**. Op vocabulary (`modified`/`changed`), the op-array field name (`atom_diff`/`ops`), the from/to field names (`from`/`fromHash`), and value.js's four extra body fields (`fromSetHash`/`toSetHash`/`identical`) all diverge; A6-4 found the PATTERN itself is named three incompatible ways. A close-gate shape-parity probe would FAIL at the most expensive moment. This doc resolves every divergence by **picking one canonical form and stating each decision explicitly**, so the two impls cannot drift by construction — they bind to one repo-neutral shape, not to each other's prose.

**inv boundary.** This is the inv-26 spirit (one contract source, hand-typed twins, no codegen) applied to the diff envelope — it is a **shape DOCUMENT**, NOT a shared package or shared binary (inv-16: shared-by-contract, per-language module, frameworks rejected). It lives in fourier's tree; value.js binds to it by reference via the value.js-J `ADOPTION-ASKS` row (which FA3 authors), exactly as INVARIANTS.md cross-references glass-ui precepts by repo-qualified citation. The seed is NOT forked into value.js.

---

## §1 — The two layers: the WIRE shape (identical) vs the atom VALUE (expected to differ)

The diff boundary has exactly two layers, and the audit's confusion came from conflating them:

1. **The ENVELOPE (the WIRE shape)** — the `/diff` response body and the `AtomOp` structure: field names, the op vocabulary, the casing rule. This is **IDENTICAL across both repos** (modulo the deterministic TS-camel ↔ Python-snake casing rule in §4). A generic client written against this doc parses both fourier's and value.js's `/diff` responses without a branch.

2. **The atom VALUE (the payload INSIDE `before`/`after`)** — what one atom *is*. This is **EXPECTED to differ** by repo: fourier's atom value is a config sub-object or scalar (a `ContourSettings` dump, an `int`, a sorted `list[str]`, a palette-slug string-or-null); value.js's atom value is a `{css, name?, position}` color stop. The envelope carries these as opaque JSON; the conformance probes assert the ENVELOPE is identical and assert each repo's atom VALUE against that repo's own schema — never against the other repo's.

> **The single rule that resolves the whole audit finding:** the ENVELOPE must be byte-isomorphic (after casing normalization); the atom VALUE is deliberately repo-local. The close-gate parity probe asserts the former and ONLY the former across repos.

---

## §2 — The canonical decisions (each divergence → one chosen form + justification)

### §2.1 — Op vocabulary → `"added" | "removed" | "changed"`

**CANONICAL = the past-tense triple `added` / `removed` / `changed`.**

- value.js already ships `"added" | "removed" | "changed"` (`api/src/services/palette/diff.ts:79`).
- fourier's design doc currently says `Literal["added", "removed", "modified"]` (`J.W1-crud-remix.md:141`). **fourier's design doc CHANGES `modified` → `changed`.** This is the explicit decision: `changed` wins, `modified` is retired.
- Rationale: `changed` is already-shipped in value.js source (changing it would be a real code edit + a re-ship); `modified` exists only in fourier's design prose (changing it is a doc edit, the cheaper move per no-legacy/KISS). The triple is past-tense throughout (`added`/`removed`/`changed`, not `add`/`remove`/`change`) — the op describes a completed edit recorded on an immutable provenance edge, not an imperative command.
- The vocabulary is CLOSED: exactly these three values, no fourth. (A future `moved` op — re-order detection — is explicitly out of scope; both specs degrade a re-order to `changed`-ops by design.)

### §2.2 — Op-array field name → `ops` (in the WIRE body) / `atom_diff` (on the STORED edge)

**CANONICAL WIRE field = `ops`** (the array-of-AtomOp INSIDE the `/diff` response body).
**CANONICAL STORED field = `atom_diff`** (the persisted array on the version document).

This **distinguishes the WIRE shape from the STORED shape** — they are NOT the same field and must not be unified, because they answer different questions:

- `ops` is the **response-body** field: "here is the diff you asked for between `from` and `to`." It is the wire contract a client/agent/conformance-probe parses. value.js already names it `ops` (`diff.ts:96`, `J.W1-palette-remix.md:208`); fourier adopts `ops` for the response body (was `atom_diff` at `J.W1-crud-remix.md:267` — **fourier's response body changes `atom_diff` → `ops`**).
- `atom_diff` is the **persisted-edge** field on the version document (`VisualizationVersion.atom_diff` / `PaletteVersion.atom_diff`): the adjacent parent→child diff stored at write time for cheap rendering. Both repos keep `atom_diff` as the STORED field name (fourier `J.W1-crud-remix.md:128`; value.js `J.W1-palette-remix.md:159`). The casing rule (§4) makes this `atomDiff` in the value.js TS model and `atom_diff` in the Python model — same logical field, per-language casing.

**Justification for the WIRE/STORED split** (not a unification): the stored `atom_diff` is the *adjacent-edge* diff (parent→child, recorded once at remix time); the wire `ops` is the *requested* diff (any `from`→`to` pair on the chain, often recomputed on the fly — `J.W1-crud-remix.md:207`, `J.W1-palette-remix.md:216`). They coincide only when `from == parent_hash`. Naming them identically would falsely imply the response always echoes the stored edge; it does not. The wire field is `ops` (the live answer); the stored field is `atom_diff` (the cached adjacent edge). This is the KISS resolution: one name per role, each role named for what it is.

### §2.3 — from/to identifiers → `fromHash` / `toHash`

**CANONICAL = `fromHash` / `toHash`** (explicit that they are set-hashes).

- value.js already uses `fromHash` / `toHash` (`diff.ts:93-94`).
- fourier currently uses bare `from` / `to` (`J.W1-crud-remix.md:267`). **fourier's response body changes `from` → `fromHash`, `to` → `toHash`.**
- Rationale: `from`/`to` are ambiguous (a slug? a depth? a date?); the values ARE set-hashes (fourier's version `_id` IS the `set_hash`, §1.3 of the remix spec; value.js's are version content-hashes on the chain). `fromHash`/`toHash` names the type at the field, which is the agent-legibility constraint both specs share (a WebMCP tool reads the field name to know it must pass a hash). The query-string parameter on the GET stays `?from=&to=` (URL params are conventionally short); the **response body** field names are `fromHash`/`toHash`.

### §2.4 — The convenience/redundancy fields → keep `identical` ONLY; drop `fromSetHash`/`toSetHash`

**CANONICAL extra body fields = `identical: bool` (kept). `fromSetHash` / `toSetHash` are DROPPED.**

value.js's current body carries four extra fields beyond fourier's: `fromSetHash`, `toSetHash`, `identical` (`diff.ts:91-97`, `J.W1-palette-remix.md:205-209`). The decision:

- **Keep `identical: bool`** — a single convenience flag, `identical == (ops.length == 0)`. It is a cheap, honest read-helper (a client renders "no changes" without inspecting array length; an agent branches on a boolean). It earns its place: ≥1 real consumer (the diff-viewer's empty-state) and zero redundancy with any other field (no other field exposes the empty-diff predicate directly).
- **Drop `fromSetHash` / `toSetHash`** — they are REDUNDANT. In the canonical envelope, **`fromHash`/`toHash` ARE the set-hashes** of the two compared versions. fourier's version `_id` is the `set_hash` (the atom-set identity, subject-free); the `/diff` endpoint compares two versions identified by their set-hashes, so `fromHash`/`toHash` already carry exactly the set-hash material `fromSetHash`/`toSetHash` would duplicate. Carrying both is the redundancy the audit flagged. **value.js's `/diff` body changes its `_id`/set-hash exposure so that `fromHash`/`toHash` ARE the atom-set-hashes** (value.js keeps `currentHash` as the version `_id` internally — A3 §7's documented asymmetry — but the `/diff` envelope's `fromHash`/`toHash` are the SET-hashes of the two versions, matching fourier; the redundant `fromSetHash`/`toSetHash` fields are removed from the wire body).

> **Net:** the canonical `/diff` body is `{ fromHash, toHash, ops, identical }` — four fields, zero redundancy. Two hashes (which ARE the set-hashes), the ops array, one convenience boolean.

### §2.5 — The PATTERN module name → `atomdiff` (the artifact name, both repos)

**CANONICAL artifact name = `atomdiff`.**

A6-4 found three names: fourier `lib/crud/atomdiff.{py,ts}`, value.js prose `lib/crud/remix`, value.js actual `api/src/services/palette/diff.ts`. The shape-parity gate is meaningless until the module name parity is fixed. The decision:

- **`atomdiff` names the ARTIFACT** (the diff utility module); **`remix` names the FEATURE** (the user-facing operation). They are not interchangeable.
- **fourier = `lib/crud/atomdiff.py`** (already correct).
- **value.js = `lib/crud/atomdiff.ts`** (the canonical path). The value.js prose `lib/crud/remix` and the as-built `api/src/services/palette/diff.ts` path are RECONCILED to this canonical name in the value.js-J `ADOPTION-ASK` (which FA3 authors) — value.js's diff core moves to / is named `lib/crud/atomdiff.ts`, matching fourier's contract path. This doc RECORDS the canonical name; FA3's ADOPTION-ASK is where value.js's prose+path are reconciled to it (inv-16: fourier authors the BOOKING; value.js executes the rename on its own clean checkout).

---

## §3 — The canonical shapes (repo-neutral)

The shapes below are the binding contract. They are presented language-neutrally; §4 gives the per-language casing. Field order is illustrative (JSON is unordered); field NAMES and the op vocabulary are normative.

### §3.1 — `AtomOp` (one atom-level change on a provenance edge)

```
AtomOp = {
  op:      "added" | "removed" | "changed",   // §2.1 — the closed past-tense triple
  atomKey: <repo-local key>,                  // fourier: atom-name string; value.js: position number
  before?: <repo-local atom value>,           // present for "removed" + "changed"; absent for "added"
  after?:  <repo-local atom value>            // present for "added"  + "changed"; absent for "removed"
}
```

- `op` — the closed vocabulary (§2.1). IDENTICAL across repos.
- `atomKey` — the atom's stable identity. **The KEY TYPE is repo-local** (fourier: one of the 5 config-atom-name string literals; value.js: a stop `position` number). This is the parameterization seam (the `AtomCodec.key` function); it is EXPECTED to differ and the conformance probes assert it per-repo.
- `before` / `after` — the raw atom VALUE (§1, layer 2). **The VALUE is repo-local** (opaque JSON to the envelope). Presence rule is IDENTICAL: `added` has only `after`; `removed` has only `before`; `changed` has both.

### §3.2 — The `/diff` response envelope (the WIRE body)

```
DiffResponse = {
  fromHash:  string,        // §2.3 — set-hash of the "from" version
  toHash:    string,        // §2.3 — set-hash of the "to" version (defaults to the live HEAD)
  ops:       AtomOp[],      // §2.2 — the requested diff (from → to); empty ⟺ identical
  identical: boolean        // §2.4 — convenience; identical == (ops.length == 0)
}
```

- Exactly four fields. No `fromSetHash`/`toSetHash` (§2.4 — `fromHash`/`toHash` ARE the set-hashes).
- `ops` is ALWAYS present (empty array when identical, never omitted/null) — a client never branches on presence.
- ETag (both repos): `"<fromHash>:<toHash>"` — a strong validator; the diff for a hash-pair is immutable. `If-None-Match` → 304. (This is envelope-adjacent contract, identical across repos; stated here so both bind it.)

### §3.3 — The STORED edge field (on the version document — NOT the wire body)

```
VersionDocument.atom_diff = AtomOp[]   // §2.2 — the persisted ADJACENT parent→child edge diff
```

- Stored field name = `atom_diff` (per-language casing → `atomDiff` in TS, `atom_diff` in Python).
- This is the *adjacent* (parent→child) diff recorded at remix time. The wire `ops` field (§3.2) is the *requested* diff and coincides with `atom_diff` only when `fromHash == parent_hash`. This is the WIRE/STORED distinction (§2.2) — kept deliberately distinct, not unified.

---

## §4 — The casing rule (TS-camel ↔ Python-snake)

The ONLY transformation between the two repos' envelopes is mechanical field-name casing. It is deterministic and total:

| Logical field | value.js (TS) | fourier (Python) |
|---|---|---|
| op | `op` | `op` |
| atom key | `atomKey` | `atom_key` |
| before | `before` | `before` |
| after | `after` | `after` |
| from-hash | `fromHash` | `from_hash` |
| to-hash | `toHash` | `to_hash` |
| ops array (wire) | `ops` | `ops` |
| identical flag | `identical` | `identical` |
| stored edge | `atomDiff` | `atom_diff` |

**Rule:** **TS uses lowerCamelCase; Python uses snake_case.** A multi-word logical field (`atomKey`, `fromHash`, `toHash`, `atomDiff`) is `camelCase` in TS and `snake_case` in Python; single-word fields (`op`, `before`, `after`, `ops`, `identical`) are identical in both. This is the ONLY allowed difference in the wire envelope — the conformance probes normalize casing (snake↔camel) before asserting cross-repo isomorphism. Op VALUES (`"added"`/`"removed"`/`"changed"`) are string literals and are NEVER cased (they are identical bytes in both repos).

> Each repo's framework serializer already does this casing (FastAPI/Pydantic with alias generators; the value.js TS objects are camelCase natively), so no hand-mapping is needed — the rule documents what the serializers already produce, so the conformance probe knows what to normalize.

---

## §5 — JSON examples (one per op)

The examples below show fourier (Python/snake) and value.js (TS/camel) producing the **same envelope shape** with **different atom values** — the §1 two-layer split made concrete.

### §5.1 — `changed` (fourier — a retuned config atom)

```json
{
  "from_hash": "a1b2c3d4e5f60718",
  "to_hash":   "f0e1d2c3b4a59687",
  "ops": [
    {
      "op": "changed",
      "atom_key": "n_harmonics",
      "before": 64,
      "after": 256
    }
  ],
  "identical": false
}
```

### §5.2 — `changed` (value.js — a recolored stop at a fixed position)

```json
{
  "fromHash": "9f8e7d6c5b4a3021",
  "toHash":   "0123456789abcdef",
  "ops": [
    {
      "op": "changed",
      "atomKey": 2,
      "before": { "css": "#ff0000", "name": "red", "position": 2 },
      "after":  { "css": "#cc0000", "name": "crimson", "position": 2 }
    }
  ],
  "identical": false
}
```

### §5.3 — `added` (value.js — an appended stop; `before` ABSENT)

```json
{
  "fromHash": "0123456789abcdef",
  "toHash":   "fedcba9876543210",
  "ops": [
    {
      "op": "added",
      "atomKey": 3,
      "after": { "css": "#0000ff", "name": "blue", "position": 3 }
    }
  ],
  "identical": false
}
```

### §5.4 — `added` (fourier — a palette binding set from null; `before` ABSENT)

```json
{
  "from_hash": "11223344556677aa",
  "to_hash":   "aa77665544332211",
  "ops": [
    {
      "op": "added",
      "atom_key": "palette_slug",
      "after": "aurora-dusk-fold"
    }
  ],
  "identical": false
}
```

> Note: `palette_slug` is the one nullable fourier atom, so it is the only fourier atom that can `add`/`remove` (set from / cleared to null). The other four fourier atoms are always present and only ever `change` (`J.W1-crud-remix.md:205`). value.js's variable `PaletteColor[]` bag exercises all three ops naturally.

### §5.5 — `removed` (value.js — a deleted stop; `after` ABSENT)

```json
{
  "fromHash": "fedcba9876543210",
  "toHash":   "0123456789abcdef",
  "ops": [
    {
      "op": "removed",
      "atomKey": 3,
      "before": { "css": "#0000ff", "name": "blue", "position": 3 }
    }
  ],
  "identical": false
}
```

### §5.6 — `identical` (either repo — no changes; `ops` is the empty array, never omitted)

```json
{
  "from_hash": "deadbeefcafef00d",
  "to_hash":   "deadbeefcafef00d",
  "ops": [],
  "identical": true
}
```

> When `fromHash == toHash` (or the two versions dedup to the same atom-set), `ops` is `[]` and `identical` is `true`. `ops` is the empty array, NOT null and NOT omitted — the dedup property (`set_hash` equal ⟺ diff empty) made visible on the wire.

---

## §6 — The close-gate clause (both conformance probes assert against THIS doc)

**BINDING:** the cross-repo `/diff` shape-parity verdict at the J close is computed by asserting EACH repo's `/diff` envelope against §3 + §4 of THIS document — **NOT by asserting one repo's output against the other repo's output.**

- fourier's conformance probe (`api/tests/conformance/`) asserts fourier's `DiffResponse` against §3.2 + the Python column of §4.
- value.js's conformance probe (`api/test/conformance/diff.test.ts`) asserts value.js's `DiffResponse` against §3.2 + the TS column of §4.
- The PARITY verdict is: "both probes pass against §3/§4" — which, because §3/§4 is one repo-neutral shape, MEANS the two envelopes are isomorphic under the §4 casing rule, WITHOUT either repo importing or hard-coding the other's output.
- The **atom VALUE** (`before`/`after` payloads, `atomKey` type) is asserted by each repo against its OWN schema only (§1 layer 2) — never cross-asserted. A fourier `n_harmonics: int` and a value.js `{css, name?, position}` are both VALID, both EXPECTED, and the parity probe does not compare them.

This is the inv-26 discipline made operational: one contract source, two hand-typed twins, each probe binds to the source not to its sibling. It eliminates the drift A3 §6 named ("the spec's defense against drift is prose in two separate documents that already disagree") — there is now ONE document, and disagreement is impossible because neither impl is the reference; this doc is.

**No-op-remix divergence (named here so the parity probe does not read it as a bug).** fourier REFUSES a no-op remix (empty diff → 422, `J.W1-crud-remix.md:242`); value.js PERMITS it (an empty-diff remix IS the preserved `fork`, `J.W1-palette-remix.md:191`). This is a DELIBERATE behavioral fork at the `/remix` endpoint — it is NOT an envelope divergence (the `/diff` shape is identical regardless), and it is documented in both `/remix` specs as intentional. The close-gate parity probe covers the `/diff` ENVELOPE (this doc); it does NOT assert remix no-op behavior, which is correctly repo-local.

---

## §7 — Summary (the contract in one paragraph)

The `/diff` boundary has two layers: an ENVELOPE that is byte-isomorphic across both repos (modulo TS-camel↔Python-snake casing), and an atom VALUE that is deliberately repo-local. The canonical envelope is `{ fromHash, toHash, ops, identical }` where `ops: AtomOp[]` and `AtomOp = { op, atomKey, before?, after? }`; the op vocabulary is the closed past-tense triple `added`/`removed`/`changed` (fourier retires `modified`); the wire array is `ops` while the persisted version-edge field stays `atom_diff` (WIRE vs STORED, kept distinct); `fromHash`/`toHash` ARE the set-hashes (so the redundant `fromSetHash`/`toSetHash` are dropped); `identical` is the one kept convenience boolean. The shared pattern artifact is named `atomdiff` in both repos (`fourier/api/lib/crud/atomdiff.py`, `value.js/lib/crud/atomdiff.ts`); `remix` names the feature, not the module. Both conformance probes assert against THIS document — not against each other — so the cross-repo parity verdict is "both pass §3/§4," and drift is structurally impossible because neither impl is the reference: this doc is.
