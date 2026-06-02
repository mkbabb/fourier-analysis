# A3 — value.js CRUD/REMIX SPEC + CROSS-REPO SYMMETRY audit

**Auditor**: A3 (value.js palette REMIX / atom-diff spec + fourier↔value.js symmetry).
**Date**: 2026-06-02.
**Scope**: value.js-J `J.md` / `PROGRESS.md` / `design/J.W1-palette-remix.md`; the value.js as-built palette surface (`api/src/services/palette/*`, `repositories/{palette,paletteVersion}.ts`, `routes/palettes/*`, `validation/palette.ts`, `format/palette.ts`, `models.ts`, `middleware/etag.ts`); the fourier twin `docs/tranches/J/design/J.W1-crud-remix.md` + `J.md`.

**Verdict: SOUND-WITH-REFINEMENTS.** The atom-diff layer is genuinely well-formed, KISS, and git-like — single-parent linear, per-atom set-difference, no DAG/merge/CRDT, no new storage engine, `fork` = `remix`-with-empty-diff as one code path. The atom keying decision (palette: key=`position`, hash over `(css,name)`; the content-equality short-circuit) is exactly right and is the crux done correctly. **But the cross-repo `/diff` envelope the two J.md docs both claim is "verified parity at close" is NOT isomorphic today — it merely rhymes.** Three concrete divergences (op vocabulary `changed` vs `modified`; op-array field `ops` vs `atom_diff`; from/to + set-hash field names and presence) would only surface at the close-gate, the most expensive moment to discover them. The fix is cheap and must be done NOW in W1: pin a single canonical JSON shape doc both impls bind against. Plus two real asymmetries (idempotency + conformance are already-shipped in fourier but I-tail-deferred in value.js) and one dangling source citation (the constellation seed both specs treat as authoritative exists only in glass-ui).

---

## §1 — Audit question 1: does value.js already ship fork/version/provenance, and is the J atom-diff spec fully formed?

**Already-shipped (confirmed file:line):**
- `forkPalette` — `api/src/services/palette/forks.ts:29-129`. Full cross-collection `withTransaction` (forks.ts:83), in-txn source re-read closing the delete-race (forks.ts:88-94), insert child + `createVersionRecord` + `incrementForkCount` (forks.ts:97-118).
- `palette_versions` collection + `createVersionRecord` — `versions.ts:37-80`; content-hash dedup (versions.ts:45-49), walks parent chain for `rootHash`/`depth` (versions.ts:51-63). `PaletteVersion` model `models.ts:115-129`.
- `getProvenance` — `forks.ts:161-187`. Single-parent `forkOf` chain walk, ≤50 cap (forks.ts:169), `visited` cycle-guard (forks.ts:166,171). **This is a NODE chain — it answers "descended from whom", never "what changed".** Confirmed.
- `revertToVersion` — `versions.ts:126-186`.

The J premise is exactly right: `/provenance` is node-only; the atom-diff layer is the genuine gap.

**Is the J spec fully formed? YES, substantially.** `design/J.W1-palette-remix.md` specifies: `computeAtomHash`/`computeAtomSetHash` (J.W1:49-65), `diffAtoms` pure set-difference (J.W1:101-117), the `PaletteVersion.atomDiff?` soft-add (J.W1:144-160), `remixPalette` as `forkPalette`-re-expressed (J.W1:169-191), `GET /:slug/diff?from=` with the single-parent guard + ETag (J.W1:195-220), and the §9 surface inventory with per-artifact ≥2-consumer checks (J.W1:263-277). The KISS line is stated first and held throughout (J.W1:12-23, §10:281-289). This is a fully-formed, buildable spec — **the refinements below are at the seams, not the core.**

## §2 — Audit question 2: the atoms — granular per-stop, git-like?

**Correct and decisive.** `PaletteColor[]` is the atom array (`models.ts:55-64`: `{css, name?, position}`); **each color stop is an atom**, NOT the whole array. The diff is **granular per-stop** (J.W1:32-36, 101-117). The keying decision is the crux and it is reasoned explicitly (J.W1:25-36):

- **Key = `position`** (the stop's stable ladder identity); **hash = over `(css, name)`** (`computeAtomHash`, J.W1:49-55, deliberately excludes `position` from the hash since position is the key).
- Set-difference by `position`: positions only-in-before → `removed`; only-in-after → `added`; in-both with differing hash → `changed`; in-both with equal hash → elided (the dedup property).
- Consequence: a recolor-at-a-slot = one `changed`; an append = one `added`; a delete = one `removed` (J.W1:36). This is genuinely git-like diffing over the atomic items, NOT whole-array replace.

The one honest tradeoff (named in the spec, J.W1:36): a full re-order degrades to changed-ops. That is the correct KISS tradeoff — handling re-order cleanly would require move-detection (a Myers-style LCS), which is exactly the over-engineering the KISS line forbids. **No finding; this is right.**

## §3 — Audit question 3: cross-repo /diff SHAPE PARITY — isomorphic or merely rhyming?

**They merely RHYME. There are three concrete divergences that break isomorphism.** Both `J.md` docs assert parity is "verified at close" (value.js `J.md:31,105`; fourier `J.md:25,43,99`), but no shared shape is pinned, and the two W1 specs already disagree:

| Concern | value.js J.W1 (file:line) | fourier J.W1 (file:line) | Isomorphic? |
|---|---|---|---|
| op vocabulary | `"added" \| "removed" \| "changed"` (J.W1:79) | `Literal["added", "removed", "modified"]` (J.W1-crud-remix:141) | **NO — `changed` vs `modified`** |
| op-array field name | `ops: AtomDiffOp[]` (J.W1:96,208) | `atom_diff: list[AtomOp]` (J.W1-crud-remix:128,267) | **NO** |
| from/to field names | `fromHash` / `toHash` (J.W1:93-94,205) | `from` / `to` (J.W1-crud-remix:267) | **NO** |
| op key field | `atomKey: number` (J.W1:84) | `atom_key: Literal[...str...]` (J.W1-crud-remix:142) | param-differs (expected) |
| set-hash in body | `fromSetHash, toSetHash, identical` IN the diff body (J.W1:95-96,206-209) | absent from fourier `/diff` body (J.W1-crud-remix:267) | **NO** |
| envelope at-large | `{fromHash, toHash, fromSetHash, toSetHash, ops, identical}` | `{from, to, atom_diff}` | **NO** |

Naming-convention skew (camelCase vs snake_case) is *expected* across a TS/Python boundary and is not the issue. The issue is the **op VOCABULARY** (`changed` vs `modified` is a true value divergence — a client that parses one cannot parse the other) and the **envelope SHAPE itself** (value.js carries 4 extra body fields `fromSetHash`/`toSetHash`/`identical` that fourier omits; the field that holds the ops is named differently in a way no casing rule maps). A "cross-repo shape-parity probe" at close would FAIL on these. This is the single most important finding: the parity claim is currently false, and it is asserted as a close-gate where the cost of discovery is maximal. **Fold: pin a canonical JSON shape doc in W1 (see §6 + F1).**

## §4 — Audit question 4: is `remixPalette` fully specified? ETag / If-Match / idempotency / soft-delete-race?

**Mostly yes, with one structural gap.**
- **remix = fork + recorded atom-diff**: fully specified (J.W1:169-191). `forkPalette` → `remixPalette`, child version records `atomDiff: ops`, `incrementForkCount`. The transaction shape is preserved verbatim from the as-built `forks.ts:83-126`. `PaletteVersion` gains `atomDiff?` (J.W1:144-160) — correct soft-add.
- **soft-delete-race**: covered. The in-txn source re-read (forks.ts:88-94) closes the source-deleted-mid-remix race; J.W1:171 preserves it. value.js's soft-delete (`crud.ts:230-266`) + fork-count decrement on delete (crud.ts:257-262) are already race-correct.
- **ETag**: `/diff` ETag is `"<fromHash>:<toHash>"`, immutable-per-pair, `If-None-Match`→304 (J.W1:210,220). Sound. Reuses `middleware/etag.ts` (the I.W4 helper).
- **If-Match on remix**: `remix` is a POST-create (new resource), so If-Match doesn't apply to it — correct. No finding.
- **idempotency-key — STRUCTURAL GAP (P1).** The fourier twin makes the remix idempotent via the existing `idempotency.replay_or_record` store (fourier J.W1-crud-remix:251, wired at `visualizations.py:163`). **value.js has NO idempotency middleware/store at all** — confirmed: no `api/src/middleware/idempotency.ts`, no `api/src/repositories/idempotency.ts`. value.js-J books the idempotency store as an I-tail deferral to J.W4 (`J.md:60,114; PROGRESS.md:21`). So at the point `POST /:slug/remix` ships in **J.W2**, value.js has NO idempotency protection, while fourier's remix is idempotent from day one. A retried remix POST (network retry, double-click) double-forks on value.js until W4 lands. This is a real asymmetry AND a correctness weakness in the W2→W4 window. **The remix is weakened by value.js's structural lack of an idempotency key.** Fold: either pull the Idempotency-Key store FORWARD to land in the same wave as `/remix` (J.W2), or explicitly book the double-fork window as a known gap with a guard (a same-`(source, child-set-hash, owner)` dedup short-circuit in `remixPalette` itself would be a KISS in-band guard independent of a full replay store).

## §5 — Audit question 5: VAL-1 (OKLab aurora-LUT) + VAL-9 (spring→LinearStop emitter) — gated or perpetual punt?

**Be decisive: VAL-9 should be KILLED (not perpetually re-gated); VAL-1 should be BOOKED with a HARD trigger or killed at J close if the trigger doesn't fire.** Both are correctly *structured* as binary ≥2-consumer gates (`J.md:119-121; PROGRESS.md:28-31`), and the W0 evidence is accurate. But "ship-or-book" has now survived G→H→I→J unexecuted, and the gate evidence actually argues for resolution, not another deferral:

- **VAL-9** (`spring()→LinearStop[]` emitter). Confirmed as-built: `springLinearStops` lives in `keyframes.js/src/animation/springLinearStops.ts`; glass-ui's `scripts/regen-spring-tokens.mjs` imports it FROM `@mkbabb/keyframes.js`. value.js `src/easing.ts` has `LinearStop` (easing.ts:28) + `cssLinear` (easing.ts:33) but **NO `spring()` emitter** (confirmed: no `export function spring` / `springLinearStops` anywhere in `value.js/src`). The honest reading of the gate: keyframes.js ALREADY owns the emitter and glass-ui ALREADY consumes it from keyframes — lifting it into value.js de-dups **nothing** unless value.js *becomes* the single source AND keyframes re-imports from value.js. That is a dependency inversion no one has asked for. The ≥2-consumer gate is therefore **NOT met and structurally unlikely to be met** — the two consumers already share one source (keyframes) that is not value.js. **Decisive verdict: KILL VAL-9 in J** (record "the two consumers already share keyframes.js as the source; lifting to value.js inverts a dependency for no de-dup gain"), rather than book it a fourth time. If a future need genuinely wants value.js to own spring-emission, that is a deliberate new tranche with a stated dependency-inversion rationale, not a chronic carry.

- **VAL-1** (OKLab aurora-LUT). Confirmed as-built: `src/units/color/conversions/oklab.ts` ships the conversion math (`oklab2xyz`, `xyz2oklab`, `oklab2oklch`, etc.) but **NO `deriveAurora` / LUT** (confirmed absent). The gate is glass-ui actually adopting `deriveAurora()` (speedtest AS-GU-1) + a 2nd consumer. This is a cleaner binary than VAL-9 (the math exists; the LUT is a thin sampling layer that genuinely belongs in value.js as the color authority). **Decisive verdict: BOOK with a HARD expiry — if glass-ui's `deriveAurora()` adoption is not live at the J.W4 re-check, KILL it at J close** (do not carry to K). A thin sampling LUT with zero live consumer is exactly the substrate-without-consumer inv-15 forbids; it should not be allowed a fifth deferral.

The "ship-or-book" framing is correctly *gated*; the failure mode is treating "book" as a free perpetual option. J must convert both to terminal verdicts (VAL-9 kill, VAL-1 book-with-expiry) so they stop being chronic.

## §6 — Audit question 6: elegance/transposition — is the shared shape crisp enough that the two impls cannot drift?

**No — and §3 proves they ALREADY drifted before a line of impl was written.** The "one pattern, two languages" intent is right and the `AtomCodec<Atom, Key>` seam (value.js J.W1:128-133) is a clean parameterization. But the spec's defense against drift is *prose in two separate documents that already disagree*. The `lib/crud/atomdiff.{py,ts}` "shared pattern, not shared package" (inv-16) is correct — but inv-16 forbids a shared *package*, NOT a shared *contract document*. The contract should be a single canonical JSON shape doc (a "shape doc" — one file, repo-neutral, the literal `/diff` response and `AtomOp` shape with field names + op-vocabulary fixed) that BOTH `atomdiff.py` and `atomdiff.ts` bind against and both conformance suites assert against. This is exactly the inv-26 spirit (single contract source, hand-typed twins) applied to the diff envelope. Without it, the two impls drift by construction — they already have. **Fold: author `J/design/J-diff-shape.json` (or `.md` with the canonical shape) in W1; make the close-gate parity probe assert against THAT file, not against each other.**

---

## §7 — Symmetry matrix (fourier-atom ↔ palette-atom)

| Dimension | fourier (viz) | value.js (palette) | Symmetric? |
|---|---|---|---|
| atom unit | 5 fixed config atoms | `PaletteColor[]` (variable) | pattern-symmetric (cardinality differs by design) |
| atom key | atom-name (`Literal[...]`) | `position` (number) | seam-parameterized ✓ |
| atom hash | `atom_hash(key, canonical_json(v))[:16]` | `computeAtomHash` over `(css,name)` | shape-symmetric ✓ |
| set-hash | `set_hash` = version `_id` | `computeAtomSetHash` (additive projection; `_id` stays `computeContentHash`) | **ASYMMETRIC** — fourier makes set-hash the version `_id`; value.js keeps `currentHash` as `_id` and exposes set-hash separately (J.W1:68). Both defensible; NOT identical. |
| version `_id` source | `set_hash` (subject-free) | `computeContentHash(name, colors)` (folds name) | **ASYMMETRIC** (consequence of the row above) |
| diff edge | `VisualizationVersion.atom_diff` (new collection) | `PaletteVersion.atomDiff?` (existing collection, new field) | shape-symmetric ✓ (fourier INHERITS, value.js EXTENDS — expected) |
| op vocabulary | `added/removed/modified` | `added/removed/changed` | **BROKEN** (F1) |
| `/diff` body | `{from, to, atom_diff}` | `{fromHash, toHash, fromSetHash, toSetHash, ops, identical}` | **BROKEN** (F1) |
| `fork`→`remix` | LIFT (no prior fork) | EXTEND (`forkPalette` re-expressed) | symmetric-by-asymmetric-start ✓ |
| idempotent remix | yes (`replay_or_record` shipped) | **NO** (store deferred to W4) | **ASYMMETRIC** (F2) |
| conformance dir | EXISTS (`api/tests/conformance/`, incl. `test_idempotency.py`) | **ABSENT** (deferred to W4) | **ASYMMETRIC** (F2) |
| no-op remix | 422 refuse (J.W1-crud-remix:242 — a fourier tightening) | empty-diff ALLOWED (`fork` = remix-with-empty-diff, J.W1:191) | **DELIBERATE ASYMMETRY — but UNRECONCILED.** fourier refuses a no-op remix; value.js permits it (it IS the fork). The two specs make OPPOSITE choices on the same operation and neither names the other's choice. Must be reconciled or explicitly dual-documented. |

**The matrix's verdict**: the CORE (atom unit, keying, hash, edge, fork→remix) is symmetric by design. Five rows diverge — two are deliberate-but-acceptable (set-hash-as-id; inherit-vs-extend), three are real breaks needing reconciliation (op vocabulary + `/diff` body → F1; idempotency + conformance → F2; no-op-remix semantics → a NIT-to-P2 reconciliation).

---

## §8 — Findings

See structured output. Headline: F1 (the parity claim is false today; pin a canonical shape doc), F2 (idempotency + conformance are shipped in fourier, deferred in value.js — the remix is structurally un-idempotent in the W2→W4 window), F3 (VAL-9 should be killed, VAL-1 booked-with-hard-expiry — stop the perpetual punt), F4 (the dangling constellation seed citation), F5 (no-op-remix semantics diverge unreconciled).

## §9 — Fold list

See structured output `foldItems`.
