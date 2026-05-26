# SLUG-WORDS — shared slug word-list spec

**Status**: drafted at fourier-B.W1; per the orphan verdict at
`coordination/CRUD-CONSTELLATION.md`, joint ratification was not reached
in the original window. The spec text below is the substrate of record
for any successor binding.
**Authority**: this document binds `CRUD-CONTRACT.md §2 (slug algorithm)` and `§9 (shared-data disposition)`. It supersedes the three-option menu at `CRUD-CONTRACT.md:213-215`: the disposition is **(b) precepts submodule** (the form admitted as fallback in `R-identity-spec.md §5c`), promoted to default by virtue of both repos already pinning precepts. No new package, no new pin.
**Companion**: `R-identity-spec.md §3, §5` (keyspace + admit-rule rationale); `CONFORMANCE-MATRIX.md §2` (C2.4 row); `instructions/CONSUMING.md` (submodule contract).

## Goal criterion (document-level)

Bind the location, format, schema, loader API, and curation policy of
the cohort's slug word-lists — so both repos consume one source of
truth at `docs/precepts/data/slug-words.json`, drift is impossible by
construction, and the slug keyspace is enumerable in one place.

## Completion criterion (document-level)

Eight numbered sections each carry a goal-and-completion block, the
spec prose, the JSON Schema fragment (preserved verbatim), the
per-language loader source (preserved verbatim — Python at
`api/lib/crud/slugs.py`; TypeScript at `api/src/crud/slugs.ts`), and
the conformance assertions that drop into `CONFORMANCE-MATRIX.md §2`
and §9.

---

## §1 — Spec

**Goal.** Pin the canonical location (`docs/precepts/data/slug-words.json`),
the file format (JSON with five top-level keys), the schema invariants
(non-empty lists; lowercase ASCII; uniqueness within list), the counts
(120/120/128/128 → 235,929,600 keyspace), the licence (MIT), and the
versioning policy (SemVer: MINOR=add, MAJOR=remove).

**Completion.** The spec blocks below are the binding ledger; counts
match the schema; the keyspace satisfies the R-identity-spec §3e
birthday-bound analysis through 10⁵ entities.

### Canonical location

```
docs/precepts/data/slug-words.json
```

Both repos already pin the `precepts` submodule (`docs/precepts/` per `instructions/CONSUMING.md`). No new pin, no new package, no new publish pipeline. The data file ships as a sibling of `instructions/` and `audits/` under the shared substrate root.

> **Wave-2 audit note (2026-05-26 per C3 §1 + C6 §6).** The data file is **empirically absent** at HEAD `f8db2c6` — `ls docs/precepts/data/` returns ENOENT. The location is the ratified canonical destination per C3 §6 recommendation 2 (no alternative considered); the file itself is **owed at B.W3 close** per `waves/W3.md` scope item 12 ("Slug-words data consumption"; binding the `api/lib/crud/slugs.py` module-init loader against the precepts JSON). The empirical-absence is honest deferral — the loader is named, the location is fixed, the data lands when the precepts submodule receives the curated word-lists (or W3 lands them as part of the utility-module landing, whichever sequences first).

### Format

JSON. UTF-8. Trailing newline. Two-space indent (matches `prettier --tab-width 2` and `black`-compatible JSON tooling). The top level is an object with **exactly five keys**:

```json
{
  "_version": "1.0.0",
  "adjective": ["ancient", "arctic", "..."],
  "verb":      ["arching", "bending", "..."],
  "color":     ["amber",   "ash",     "..."],
  "animal":    ["alpaca",  "ant",     "..."]
}
```

- `_version` — SemVer string, `^\d+\.\d+\.\d+$`. See §1.6 for policy.
- `adjective`, `verb`, `color`, `animal` — arrays of lowercase ASCII strings each matching `^[a-z]+$` (no hyphens, no digits, no underscores; the hyphen is the slug joiner and may not appear inside an atomic word).

### Schema (load-time invariants)

- All four lists are present and non-empty.
- Every entry matches `^[a-z]+$`.
- Within each list, entries are unique (no duplicates).
- Counts match §1.5 exactly.
- The four lists are pairwise disjoint **only by intention, not by hard rule** — the joiner-hyphen plus position-pinning makes overlap (e.g. `amber` appearing in both `adjective` and `color`) parseable in either slot. Curation discourages overlap (§2) but the loader does not reject it.

### Counts (binding)

| Key | Count | Keyspace contribution |
|---|---|---|
| `adjective` | **120** | factor 1 |
| `verb`      | **120** | factor 2 |
| `color`     | **128** | factor 3 |
| `animal`    | **128** | factor 4 |
| product     | **120 × 120 × 128 × 128 = 235,929,600** | ≈ 2.36 × 10⁸ |

Per `R-identity-spec.md §3e` birthday-bound analysis: birthday-safe through ~10⁵ entities (≤ 0.21 % collision over 10⁴; ~19 % over the full population at 10⁵, with per-insert expected-retry on the order of 10⁻⁴). The 10-retry ceiling in `CRUD-CONTRACT §2` is wildly over-provisioned at the cohort's current scale.

### License

```jsonc
// docs/precepts/data/slug-words.json — opening _license key
{
  "_license": "MIT — Copyright (c) 2026 Mike Babb. See docs/precepts/LICENSE.",
  "_version": "1.0.0",
  ...
}
```

The `_license` key is an **optional** sixth key (loader ignores unknown leading-underscore keys). MIT matches the `@mkbabb` convention used by `value.js` and the rest of the cohort. The full license text lives in `docs/precepts/LICENSE` (one file, one canonical text); the JSON carries only the short attribution. Word lists are factual data — uncopyrightable in many jurisdictions — but the MIT grant makes downstream consumption unambiguous.

### Versioning

`_version` is SemVer (`MAJOR.MINOR.PATCH`).

| Change | Bump | Rationale |
|---|---|---|
| **Add** new word to a list | **MINOR** | Existing slugs remain dictionary-valid; new keyspace is purely additive. |
| **Remove** word from a list | **MAJOR** | Invalidates every existing slug that contains the removed word — a breaking change for any consumer that asserts dictionary-membership at read time (which both loaders do at module-init only, but downstream tests may at read time). |
| **Rename / replace** a word | **MAJOR** | Equivalent to remove + add. |
| **Reorder** lists | no bump | There is no "Nth word" contract. Reorderings have **no semantic meaning**. Tests must sort before comparing. |
| **Recount adjustment** (e.g. add 8 more verbs to lift the keyspace) | **MINOR** | Purely additive; the §1.5 count table updates with the version. |

Reorderings have no semantic meaning because the slug algorithm draws by random index, not by position; the only contract over the array is "set of strings × cardinality." Linters / formatters may sort the arrays alphabetically on save without bumping the version. (Recommended: keep the file sorted; makes diffs reviewable.)

---

## §2 — Curation guidance

**Goal.** Codify the curation axes (tone, length, pronounceability,
distinctness) so future word-additions land cleanly without churn at
review time.

**Completion.** The four axis blocks plus the rule-of-three heuristic
constitute the binding curation policy; smaller cohorts collapse the
rule to "author + 24-hour overnight soak".

Word inclusion decisions should be made on the same axes as value.js's existing `slugWords.ts` corpus (the seed for §5). When in doubt, prefer **omission**: every word that gets into the list shows up in user-facing share links forever, and removing it is a MAJOR bump.

### Tone

- Positive or neutral connotation. Slug `dapper-soaring-jade-falcon` reads well; `bruised-failing-rust-vulture` does not. The user's first impression of the system is often their auto-assigned handle.
- **No slurs, no obscenities, no medical / clinical terms, no political terms.** Standard guardrails; the loader does not check this (impossible to enumerate), curation does.
- **No trademarks** (no `apple`, no `google`, no `coca` etc.). Generic nouns only.
- **No proper names** (no `albert`, no `paris`). Generic descriptors only.
- **No numerals as words** (no `seven`, no `dozen`). Numbers create cognitive load on a 4-word slug.

### Length

- **3-10 characters per word, preferred.** Hard ceiling 14 (matches `coolname`'s longest: `multitudinous`). With 4 × 14 + 3 hyphens = 59, the slug max-length of 60 from `CRUD-CONTRACT §2` accommodates the corner.
- Two-character words (`ox`, `ax`) admitted but discouraged — they read as typos in a hyphen-joined chain.
- Mean word length ~6 characters. Mean slug length ~27 characters.

### Pronounceability

- Every word should be pronounceable by an English speaker on first sight. The slug is a *share-link readable aloud* (over the phone, in a conference, in a screenshare). Strings that defeat phonetic rendition are out.
- Strongly prefer Anglo-Saxon and Latin roots over Greek/uncommon imports (`gleaming` > `irenic`; `flowing` > `eurythmic`).

### Distinctness

- **No near-duplicates** in the same list. `green` and `greenish` collide for the reader; pick one. `flow`/`flowing`/`flowed`: pick the gerund (`flowing`) — the `verb` list is uniformly gerund-form for parsing legibility.
- **Cross-list overlap discouraged** but not forbidden. `amber` (adjective + color), `azure` (adjective + color), `ember` (adjective + color), `sable` (adjective + color) all appear in value.js's seed corpus and stay. The position-pinning of the slug (`adjective-verb-color-animal`) keeps the parse unambiguous.

### Curatorial heuristic (rule of three)

A candidate word lands iff three indepedent reviewers can each describe the word's tone, length, and pronounceability without disagreement. In practice for this cohort: the PR author + one other contributor + a one-week soak in a `proposed-words` PR-staging file. Smaller cohorts (1–2 people) collapse the rule to "author + 24-hour overnight soak."

---

## §3 — JSON Schema (JSON Schema 2020-12)

**Goal / Completion.** Author the machine-readable schema that both
loaders validate against at module-init; the schema below is preserved
verbatim and lives at `docs/precepts/data/slug-words.schema.json`. CI
in the precepts repo validates the data file on every commit.

The schema lives at `docs/precepts/data/slug-words.schema.json` and is referenced from the data file via `$schema`. Loaders validate the data against this schema at module-init (§4); CI in the precepts repo validates on every commit to the data file.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://precepts.mkbabb.dev/data/slug-words.schema.json",
  "title": "Slug Words",
  "description": "Canonical word lists for the cohort 4-word slug. See CRUD-CONTRACT §2 and R-identity-spec §3.",
  "type": "object",
  "required": ["_version", "adjective", "verb", "color", "animal"],
  "additionalProperties": false,
  "properties": {
    "_version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "SemVer. MINOR=add, MAJOR=remove/rename, no bump for reorder."
    },
    "_license": {
      "type": "string",
      "description": "Optional license attribution; full text in docs/precepts/LICENSE."
    },
    "adjective": { "$ref": "#/$defs/wordList120" },
    "verb":      { "$ref": "#/$defs/wordList120" },
    "color":     { "$ref": "#/$defs/wordList128" },
    "animal":    { "$ref": "#/$defs/wordList128" }
  },
  "$defs": {
    "word": {
      "type": "string",
      "pattern": "^[a-z]+$",
      "minLength": 2,
      "maxLength": 14
    },
    "wordList120": {
      "type": "array",
      "items": { "$ref": "#/$defs/word" },
      "minItems": 120,
      "maxItems": 120,
      "uniqueItems": true
    },
    "wordList128": {
      "type": "array",
      "items": { "$ref": "#/$defs/word" },
      "minItems": 128,
      "maxItems": 128,
      "uniqueItems": true
    }
  }
}
```

Notes:

- `additionalProperties: false` rejects typos in keys (e.g. `adjectives` plural).
- `minItems == maxItems` makes the count contract a hard schema rule. A MINOR / MAJOR version bump that recounts must update the schema file in the same commit.
- The `_license` key is admitted as the only additional underscore-prefixed key; loader convention is "ignore unknown `_*` keys" but the schema names the only one currently used.

---

## §4 — Per-language loader contract

**Goal.** A per-repo loader (Python at `api/lib/crud/slugs.py`; TypeScript
at `api/src/crud/slugs.ts`) — each module-init reads the shared JSON,
validates it against §3's invariants, and exposes the four lists +
`generate_slug` / `generateSlug` to the rest of the api.

**Completion.** The shared API-surface table is binding (same symbol
names on both sides); both loaders raise at import on validation
failure (RuntimeError / Error with the offending rule named); the
verbatim Python and TypeScript reference implementations below are the
substrate any future loader changes preserve.

The loader is **per-repo, not shared code**. Each repo ships its own thin loader that reads the same JSON. The Python loader lives in `api/lib/crud/slugs.py`; the TS loader in `api/src/crud/slugs.ts`. (For value.js the existing `api/src/slugWords.ts` is renamed and trimmed; for fourier the existing `api/slugs.py` is rewritten — see §5.)

### Shared API surface (binding)

Both loaders expose the same module-level shape:

| Symbol | Type | Semantics |
|---|---|---|
| `slug_words()` / `slugWords()` | `() -> dict[Literal["adjective","verb","color","animal"], list[str]]` | Returns the four lists. Pure; no side effects after module init. |
| `ADJECTIVES`, `VERBS`, `COLORS`, `ANIMALS` | `tuple[str, ...]` / `readonly string[]` | The four lists as named module-level constants; immutable. |
| `SLUG_WORDS_VERSION` / `SLUG_WORDS_VERSION` | `str` | The `_version` from the JSON (for log lines, conformance reporting). |
| `generate_slug()` / `generateSlug()` | `() -> str` | The cryptographic-RNG slug-minting function from `CRUD-CONTRACT §2 Generation` — co-located with the lists. |

### Init-time validation (load-bearing)

At module import / require, both loaders **read, parse, and validate** the JSON. Validation rules (matching §3):

1. All four required keys present, each an array.
2. Counts match exactly: `len(adjective) == 120`, `len(verb) == 120`, `len(color) == 128`, `len(animal) == 128`.
3. Every entry matches `^[a-z]+$`.
4. No duplicates within a list.
5. `_version` matches `^\d+\.\d+\.\d+$`.

**Drift is a correctness bug; fail loud** (cohort invariant 17). On any validation failure the loader raises (Python: `RuntimeError`; TS: `Error`) with a message naming the failed rule and the path to the JSON. There is **no fallback list, no `coolname`-style runtime synthesis, no "best-effort" recovery.** The process refuses to start until the data file is conformant.

### Python loader (canonical shape)

```python
# fourier — api/lib/crud/slugs.py (post-convergence)
"""Cohort slug word-list loader. See docs/precepts/data/slug-words.json."""
from __future__ import annotations

import json
import re
import secrets
from pathlib import Path
from typing import Final

_DATA_FILE: Final = Path(__file__).resolve().parents[3] / "docs" / "precepts" / "data" / "slug-words.json"
_WORD_RE: Final = re.compile(r"^[a-z]+$")
_SEMVER_RE: Final = re.compile(r"^\d+\.\d+\.\d+$")
_EXPECTED_COUNTS: Final = {"adjective": 120, "verb": 120, "color": 128, "animal": 128}


def _load_and_validate() -> dict[str, tuple[str, ...]]:
    with _DATA_FILE.open("r", encoding="utf-8") as f:
        raw = json.load(f)
    if not _SEMVER_RE.match(raw.get("_version", "")):
        raise RuntimeError(f"slug-words: _version missing or malformed in {_DATA_FILE}")
    out: dict[str, tuple[str, ...]] = {}
    for key, expected in _EXPECTED_COUNTS.items():
        words = raw.get(key)
        if not isinstance(words, list):
            raise RuntimeError(f"slug-words: {key} missing or not an array")
        if len(words) != expected:
            raise RuntimeError(f"slug-words: {key} has {len(words)}, expected {expected}")
        if len(set(words)) != len(words):
            raise RuntimeError(f"slug-words: {key} contains duplicates")
        for w in words:
            if not isinstance(w, str) or not _WORD_RE.match(w):
                raise RuntimeError(f"slug-words: {key} contains invalid entry {w!r}")
        out[key] = tuple(words)
    return out


_WORDS: Final = _load_and_validate()
SLUG_WORDS_VERSION: Final[str] = json.loads(_DATA_FILE.read_text())["_version"]
ADJECTIVES: Final = _WORDS["adjective"]
VERBS: Final = _WORDS["verb"]
COLORS: Final = _WORDS["color"]
ANIMALS: Final = _WORDS["animal"]


def slug_words() -> dict[str, tuple[str, ...]]:
    return dict(_WORDS)


def generate_slug() -> str:
    return "-".join((
        secrets.choice(ADJECTIVES),
        secrets.choice(VERBS),
        secrets.choice(COLORS),
        secrets.choice(ANIMALS),
    ))
```

### TS loader (canonical shape)

```ts
// value.js — api/src/crud/slugs.ts (post-convergence)
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const DATA_FILE = resolve(dirname(fileURLToPath(import.meta.url)), "../../../docs/precepts/data/slug-words.json");
const WORD_RE = /^[a-z]+$/;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const EXPECTED_COUNTS = { adjective: 120, verb: 120, color: 128, animal: 128 } as const;

type Key = keyof typeof EXPECTED_COUNTS;

function loadAndValidate(): { version: string; words: Record<Key, readonly string[]> } {
  const raw = JSON.parse(readFileSync(DATA_FILE, "utf-8")) as Record<string, unknown>;
  const version = String(raw._version ?? "");
  if (!SEMVER_RE.test(version)) throw new Error(`slug-words: _version missing or malformed in ${DATA_FILE}`);
  const words = {} as Record<Key, readonly string[]>;
  for (const [key, expected] of Object.entries(EXPECTED_COUNTS) as [Key, number][]) {
    const list = raw[key];
    if (!Array.isArray(list)) throw new Error(`slug-words: ${key} missing or not an array`);
    if (list.length !== expected) throw new Error(`slug-words: ${key} has ${list.length}, expected ${expected}`);
    if (new Set(list).size !== list.length) throw new Error(`slug-words: ${key} contains duplicates`);
    for (const w of list) {
      if (typeof w !== "string" || !WORD_RE.test(w)) throw new Error(`slug-words: ${key} contains invalid entry ${JSON.stringify(w)}`);
    }
    words[key] = Object.freeze([...list]);
  }
  return { version, words: Object.freeze(words) };
}

const _LOADED = loadAndValidate();
export const SLUG_WORDS_VERSION = _LOADED.version;
export const ADJECTIVES = _LOADED.words.adjective;
export const VERBS = _LOADED.words.verb;
export const COLORS = _LOADED.words.color;
export const ANIMALS = _LOADED.words.animal;

export function slugWords(): Record<Key, readonly string[]> {
  return _LOADED.words;
}

export function generateSlug(): string {
  const pick = (xs: readonly string[]) => xs[crypto.randomInt(0, xs.length)]!;
  return [pick(ADJECTIVES), pick(VERBS), pick(COLORS), pick(ANIMALS)].join("-");
}
```

Both loaders raise at import; the process refuses to start with a bad data file. Neither loader caches across processes; the JSON load is ~50 μs and runs once per process.

---

## §5 — Migration path

**Goal.** Adopt value.js's existing curated word-lists (120/120/128/128
already field-tested) verbatim as v1.0.0 of `docs/precepts/data/slug-words.json` —
no merge, no curation churn, no review at v1.0.0.

**Completion.** The fourier code-path migration (drop `coolname`,
rewrite `api/slugs.py` to delegate to the new loader, add the C-slug-4
conformance test) and the value.js code-path migration (move arrays
into the precepts JSON, replace `slugWords.ts` with the loader, retire
the pre-check loop per CRUD-CONTRACT §2 C2.3) discharge the slug-words
side of the convergence.

### Word-list provenance

The seed corpus is value.js's existing `slugWords.ts` (`/Users/mkbabb/Programming/value.js/api/src/slugWords.ts`), which already encodes the exact counts (120/120/128/128) and curation conventions (lowercase, no hyphens, gerund verbs, generic descriptors). Copy this verbatim into `docs/precepts/data/slug-words.json`, wrapped in the JSON shape from §1.2. **No curation churn at migration**; the existing lists are the v1.0.0 contents.

fourier's existing `coolname` dictionaries are **not merged in.** Three reasons:

1. **`coolname`'s 4-word output is the `all` config** — a weighted mix across categories rather than the structured `adjective-verb-color-animal` shape (`R-identity-spec.md §3b`). Words are not pre-sorted into the four lists.
2. **Many `coolname` words violate §2 curation.** `coolname` admits proper names (`pickles`, `mister`), gendered nouns, and mixed registers (`bitter`, `seething`). Re-sorting and pruning would dominate the migration cost.
3. **Drift with value.js's lists is the central correctness bug §5b admits.** Adopting value.js's already-curated lists wholesale resolves the drift in one move.

The migration is **adoption**, not merge.

### fourier code-path migration

1. **`docs/precepts/` submodule sync.** Add `docs/precepts/data/slug-words.json` (copied verbatim from value.js's `slugWords.ts`) and `docs/precepts/data/slug-words.schema.json` in the precepts repo, bump the submodule SHA in both fourier and value.js.
2. **Drop `coolname` dependency.** Remove from `pyproject.toml`; remove `import coolname` from `api/slugs.py`.
3. **Rewrite `api/slugs.py`** to delegate to the new loader at `api/lib/crud/slugs.py` (or move the code outright; the existing module path is the public name; the implementation moves).
4. **Replace `secrets`-free path** by importing `generate_slug` from the new module. The current 2-line `api/slugs.py` becomes a 1-line re-export, or is deleted and the importing call sites move to the new path.
5. **C-slug-4 conformance test** (per `CRUD-CONTRACT.md §10`): assert every word emitted by `generate_slug()` is in the loaded lists. Trivially true post-migration; the test catches regression.

### value.js code-path migration

1. **Move `api/src/slugWords.ts` arrays into `docs/precepts/data/slug-words.json`** (verbatim; the existing curated corpus is the seed). The seed copy stays in the value.js commit history as the provenance pointer.
2. **Replace `api/src/slugWords.ts` with the loader** at `api/src/crud/slugs.ts` (per §4). The `generateSlug()` and `generateUniqueSlug()` functions retain their signatures; importers do not change beyond the path.
3. **Retire `generateUniqueSlug`'s pre-check loop** per `CRUD-CONTRACT §2 Collision handling` (insert-then-catch `DuplicateKeyError`, no check-then-insert). This is a separate `CRUD-CONTRACT §2 C2.3` migration; named here so the slug-words migration does not regress it.
4. **C-slug-4 conformance test**: same shape as fourier.

### Migration verdict

**Adopt value.js's existing curated lists verbatim as v1.0.0** of `docs/precepts/data/slug-words.json`. fourier retires `coolname` entirely. No merge, no churn, no curation review at v1.0.0 — the corpus is already field-tested in value.js production. Future curation is governed by §2 and §6.

---

## §6 — Precepts integration

**Goal.** Define how the `docs/precepts/data/slug-words.json` file lands
in the precepts submodule, how PRs against it are reviewed, and how
consumer repos pick up new versions (explicit, not automatic, per
`instructions/CONSUMING.md`).

**Completion.** The file layout (`docs/precepts/data/` named
generically so future shared-data targets land beside it without
restructure), the contribution process (PR + CI validation + ≥1
consuming-repo approval), and the update cadence (manual submodule
pin bump at wave boundaries) are binding.

### File layout

```
docs/precepts/
  README.md
  instructions/
  audits/
  data/                                ← new directory
    slug-words.json                    ← canonical word list
    slug-words.schema.json             ← JSON Schema 2020-12 (§3)
    README.md                          ← short pointer back to this spec
  LICENSE                              ← MIT (covers data + instructions)
```

The `data/` directory is named generically (not `slug-words/`) so future shared-data targets that pass R3's admit-rule (per `R-identity-spec.md §9 open question 1`: "framework-in-disguise probe" — are there other shared-data targets coming?) can land here without restructure. The first three candidates floated are tag word-lists, palette-name suggestions, and contour-tour-strategy names; none are admitted today, all would slot in beside `slug-words.json` if and when they pass the admit-rule.

### Contribution process

Edits to `data/slug-words.json` follow the precepts repo's PR process (per `instructions/CONSUMING.md`):

1. PR against the precepts repo with the change + version bump in `_version` per §1.6.
2. CI validates the JSON against `slug-words.schema.json` (single check; <1 s).
3. At least one consuming repo (fourier or value.js) approves before merge — a non-consuming approval is not sufficient because the consumers carry the loader-init blast radius.
4. After merge, consuming repos update their submodule pin in deliberate commits (`git submodule update --remote docs/precepts && git add docs/precepts && git commit`).

### Release cadence

The precepts submodule has no release cadence; consumers pin by SHA per their own schedule. The data file's `_version` is its own SemVer, independent of the precepts repo's commit cadence. A precepts-repo commit may bump the data file's `_version`, the instructions text, or both; the SHA is the version-of-record at the consumer level.

### Update cadence for consumers

The "consume the latest" pattern is **explicit, not automatic** (per `instructions/CONSUMING.md`: "Update deliberately"). The submodule pin is bumped at wave boundaries by intent. Drift between fourier and value.js's pinned SHAs is **admitted up to one wave**; if it persists across two waves the cohort is silently diverging on a shared substrate and a coordinated bump is required.

---

## §7 — Conformance assertions

**Goal / Completion.** The 10-row table below drops into
`CONFORMANCE-MATRIX.md` under §2 (slug algorithm) and §9 (shared-data).
C2.4 is promoted from `TBD` to a concrete file path; three new rows
(C-words.1 drift; C-words.2 schema validates; C-words.3 counts pinned)
extend the matrix; C9.1 is tightened to a file-existence + import
check.

These rows drop into `CONFORMANCE-MATRIX.md` under §2 (slug algorithm) and §9 (shared-data). The C2.4 row already exists with a placeholder fixture; this spec promotes it from `TBD` to a concrete file path. Three new rows (C-words.1, C-words.2, C-words.3) extend the matrix; one tightens C9.1.

| Assertion ID | Contract § | Assertion | Repo | Test name | Run command | Expected output / fixture |
|---|---|---|---|---|---|---|
| C2.4 | §2, §9 | Every emitted slug's words are members of the canonical lists at `docs/precepts/data/slug-words.json`. | fourier | `test_slug_format_words_in_list` | `uv run pytest api/tests/conformance/test_slug_format.py::test_words_in_list -v` | For 1,000 generated slugs, each word ∈ `slug_words()[<position-key>]`. |
| C2.4 | §2, §9 | Same. | value.js | `test/conformance/slug/words-in-list.test.ts` | `npx vitest run test/conformance/slug/words-in-list.test.ts` | Same shape on the TS loader. |
| **C-words.1** | §9, this doc §4 | Loader raises at module import if `docs/precepts/data/slug-words.json` count or pattern drifts. | fourier | `test_slug_loader_drift_init_fails` | `uv run pytest api/tests/conformance/test_slug_words.py::test_drift_init_fails -v` | Monkeypatch `_DATA_FILE` to a fixture with `len(adjective) == 119`; re-import; assert `RuntimeError("slug-words: adjective has 119, expected 120")`. |
| **C-words.1** | §9 | Same. | value.js | `test/conformance/slug/loader-drift-init-fails.test.ts` | `npx vitest run test/conformance/slug/loader-drift-init-fails.test.ts` | Stub `DATA_FILE` to bad fixture; assert thrown `Error` matching the same message. |
| **C-words.2** | §9, this doc §3 | The data file conforms to `slug-words.schema.json`. | fourier | `test_slug_words_json_schema_validates` | `uv run pytest api/tests/conformance/test_slug_words.py::test_schema_validates -v` | `jsonschema.validate(json.load(DATA_FILE), json.load(SCHEMA_FILE))` raises nothing. |
| **C-words.2** | §9 | Same. | value.js | `test/conformance/slug/json-schema-validates.test.ts` | `npx vitest run test/conformance/slug/json-schema-validates.test.ts` | `ajv.validate(schema, data) === true`. |
| **C-words.3** | §9, this doc §1.5 | The counts in the data file match 120/120/128/128 exactly. | fourier | `test_slug_words_counts_pinned` | `uv run pytest api/tests/conformance/test_slug_words.py::test_counts_pinned -v` | `len(ADJECTIVES) == 120 and len(VERBS) == 120 and len(COLORS) == 128 and len(ANIMALS) == 128`. |
| **C-words.3** | §9 | Same. | value.js | `test/conformance/slug/counts-pinned.test.ts` | `npx vitest run test/conformance/slug/counts-pinned.test.ts` | Same. |
| C9.1 | §9 | Shared data file exists at the contract location; both repos consume it. | fourier | `test_shared_data_consumed` | `uv run pytest api/tests/conformance/test_shared_data.py::test_slug_words_consumed -v` | `Path("docs/precepts/data/slug-words.json").exists()` and `import api.lib.crud.slugs` succeeds. |
| C9.1 | §9 | Same. | value.js | `test/conformance/shared-data/slug-words-consumed.test.ts` | `npx vitest run test/conformance/shared-data/slug-words-consumed.test.ts` | `existsSync(DATA_FILE) === true` and the loader module imports without throw. |

---

## §8 — Open items

**Goal / Completion.** Four spec-local open items (`_license` key vs
LICENSE file; future shared-data targets in `data/`; the 5-word slug
amendment for >10⁶ scale; word-removal grace period); each carries a
destination or a "future PR template" classification.

| Item | Notes | Destination |
|---|---|---|
| `_license` key vs separate `LICENSE` file | Spec carries both; the JSON's `_license` is an attribution shortcut, the canonical text lives in `docs/precepts/LICENSE`. | Precepts repo W0; resolved at the seed commit. |
| Future shared-data targets in `docs/precepts/data/` | tags, palette-name suggestions, contour-tour-strategies — all R3-pending. | `R-identity-spec.md §9 open question 1`. |
| 5-word slug amendment (for >10⁶ scale) | Not load-bearing now; add a `suffix` or `place` list, bump v2.0.0 (MAJOR because the slug pattern itself changes `^...{3}$` → `^...{4}$`). | Future amendment; documented for change-log. |
| Word removal grace period | Removing a word from a list invalidates every existing slug that contains it. Recommend: never remove except for legal compliance; in that case, the corresponding slugs are migrated (re-minted) before the v2.0.0 bump. | Future precepts repo PR template guidance. |
