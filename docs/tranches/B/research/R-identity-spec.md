# R-identity-spec — Slug, internal ID, content hash (the A2 deep-research deliverable)

**Lane**: B / Wα — research wave / A2 — identity deep-research.
**Mode**: read-only against both repos; the deliverable is a normative spec proposal that drops cleanly into `coordination/CRUD-CONTRACT.md §1 (identity) + §2 (slug algorithm) + §9 row "slug word-list"`.
**Scope**: the fourier-analysis ⇄ value.js cohort. Cohort invariants **14** (typed non-null owner) and **16** (shared by contract before shared by code) are load-bearing throughout. Invariant **17** (verified migration) is the gate for §7.
**Relationship to siblings**: §1 here is the long form of what `R-auth-spec.md §1` covers in passing for the session entity; §6 of this document binds the URL shape that `R-lifecycle-spec.md` quotes for visibility transitions.

## Research-artefact discipline

This document is a *research artefact* — it records findings as of authoring time. The substance does not re-decide; the explication does. Every claim traces to a `file:line` citation; every count is reproducible from the cited source; every ratified decision is preserved.

## Goal criterion (research-artefact framing)

This research lane succeeds if the identity model is bounded enough to populate `CRUD-CONTRACT.md §1` (the three-identifier model: slug, content hash, internal `_id`), `§2` (the slug algorithm, validation, collision handling, birthday-bound), and `§9 row "slug word-list"` (the shared-data disposition) — and if the conformance assertions named in §3g, §4f, §6f, and §7f can each be transcribed into a `CRUD-CONTRACT.md §10` conformance-matrix row without re-research.

## Completion criterion (research-artefact framing)

The document closes when the headline summary holds, all citations resolve, and the §9 open-questions list names exactly the items the Wχ — challenge wave's P1 / P2 probes adversarially test.

---

## §1 — Current state, two-repo comparison

Both repos already converge on the *shape* of "a slug per user-named noun, an internal id, a content hash for dedup." The divergence is in (a) which fields are present, (b) what the slug looks like (number of words, character class), (c) whether the slug is generated server-side, (d) which collisions are caught at the unique index vs pre-checked, and (e) — load-bearing — *which hashes have leaked into user-facing URLs*. The audit at `docs/audits/runs/2026-05-18-fourier-tranche/e-crud-slug-valuejs.md:24` named the fourier gallery's `snapshot_hash` URL as the central incoherence; this section confirms and quantifies.

### 1a. Side-by-side identity tables

**fourier (per-entity):**

| Entity | Slug field | Internal `_id` | Content hash | User-facing handle today |
|---|---|---|---|---|
| `images` | `image_slug` 4-word, `coolname.generate_slug(4)` (`api/slugs.py:8-10`); unique index (`api/services/database.py:42`) | ObjectId (default) | `sha256` of bytes; unique index (`database.py:43`) | `image_slug` (`web/src/lib/api.ts` references `/images/{slug}`) |
| `contours` | — *(no slug)* | ObjectId | `contour_hash` = `sha256(json.dumps({x:xs,y:ys}, sort_keys=True))` (`api/services/image_storage.py:181`); unique (`database.py:47`); the A.W4 — image storage cleanup wave fixed the formerly-sorted-by-axis bug | `contour_hash` (passed as path param; opaque) |
| `snapshots` | — *(no slug)* | ObjectId | `snapshot_hash` = `sha256(json.dumps({image_slug, contour_hash, contour_settings, animation_settings}, sort_keys=True))` (`api/routers/snapshots.py:38-47`); unique (`database.py:53`) | `snapshot_hash` — **leaked to gallery URLs** |
| `gallery` | — *(borrows snapshot_hash)* | ObjectId | indexed `snapshot_hash` unique (`database.py:68`) | **`snapshot_hash`** — the 64-char hex string is the share URL |
| `users` | `_id = user_slug` (the user's slug **is** the internal id) (`api/routers/sessions.py:47-48`) | `user_slug` | none | `user_slug` |
| `sessions` | — | `_id = str(uuid.uuid4())` (`api/routers/sessions.py:27`) | none | token (server-internal only) |
| `flags` | — | ObjectId | `(snapshot_hash, reporter_slug)` unique (`database.py:81-83`) | n/a |

**value.js (per-entity):**

| Entity | Slug field | Internal `_id` | Content hash | User-facing handle today |
|---|---|---|---|---|
| `palettes` | `slug` (4-word, `generateSlug()` *applied to user slugs only*; palette slug is **client-supplied**, regex `^[a-z0-9][a-z0-9-]*$` length ≤ 120, `api/src/routes/palettes.ts:362`) | ObjectId | `currentHash` = sha256 of `{name, colors}` (`api/src/hash.ts:13-22`); not indexed unique | `slug` (`/palettes/{slug}`) |
| `palette_versions` | — | `_id = currentHash` (content-addressed) (`api/src/routes/palettes.ts:120,135`) | self | `hash` (admin / version-history surface only) |
| `users` | `_id = userSlug` (4-word, `generateUniqueSlug()` `slugWords.ts:92-99`) | `userSlug` | none | `userSlug` |
| `sessions` | — | `_id = randomUUID()` token | none | token (server-internal) |
| `votes` | — | ObjectId | `(userSlug, paletteSlug)` unique (`api/src/db.ts:43`) | n/a |
| `proposed_names`, `tags`, `flags`, `admin_audit` | various | ObjectId | — | n/a |

### 1b. The five-identity-scheme finding (re-derived)

Audit E claimed five divergent identity schemes on the fourier side. Re-derived against the live source:

1. **Human slug** (`image_slug`, `user_slug`) — `coolname.generate_slug(4)`; random.
2. **Content hash** (`contour_hash`, `snapshot_hash`, image `sha256`) — sha256 hex; deterministic from content.
3. **uuid4 token** (`sessions._id`) — opaque; cryptographic.
4. **ObjectId** (auto Mongo `_id` on every other collection) — opaque; embeds timestamp.
5. **Client-supplied path-keyed string** (`web/src/lib/draftStorage.ts:14` uses `imageSlug` as the IndexedDB keyPath) — derived from another entity's slug.

The audit count of five **stands**.

### 1c. Headline gaps and divergences

1. **fourier gallery URLs carry `snapshot_hash`** (a 64-char sha256), making gallery share-links opaque while workspace URLs are pretty slugs (`/w/{image_slug}`). The contract retires this.
2. **Slug character classes diverge.** fourier's `SLUG_PATTERN` (`api/dependencies.py:27`) is `^[a-zA-Z0-9][-a-zA-Z0-9]{2,80}$` — mixed-case, digits, 3–81 chars. value.js's palette slug pattern (`api/src/routes/palettes.ts:362`) is `^[a-z0-9][a-z0-9-]*$` ≤ 120 chars. Neither enforces "exactly N words." Both are lax.
3. **Slug word-counts agree at 4**: fourier `coolname.generate_slug(4)`; value.js `slugWords.ts:84-90` picks one each from `ADJECTIVES` / `VERBS` / `COLOR_TERMS` / `ANIMALS`. **But the word-lists are different.** A user-slug minted on fourier (the `coolname` dictionaries) is not in value.js's dictionary and vice versa. This is the load-bearing R3 question (§5).
4. **Slug generation primitive diverges.** value.js uses `crypto.randomInt` (`slugWords.ts:80-82`) — cryptographic. fourier delegates to `coolname` (CPython `random.choice`, **Mersenne Twister, not cryptographic**). For a 4-word slug this is not a security boundary (slugs are public handles, not secrets), but for consistency with the cohort's cryptographic-RNG posture (`R-auth-spec §2g`), fourier should swap to `secrets.choice`.
5. **Collision handling is inconsistent within fourier.**
    - `image_storage.py:75-77` pre-checks `db.images.find_one({"image_slug": slug})` in a `while` loop **then inserts**. TOCTOU race; the real safety net is the unique index. On a *user-slug* collision in `sessions.py:47-49`, there is **no pre-check, no retry, and no `DuplicateKeyError` catch** — the `_id` default-unique-index would raise, producing a 500.
    - value.js's `generateUniqueSlug` (`slugWords.ts:92-99`) does the same pre-check loop. Both repos should converge on **rely-on-the-unique-index + catch + retry**, never pre-check.
6. **Content-hash algorithms agree but inputs diverge.** Both use SHA-256. fourier hashes JSON-canonical points (`image_storage.py:180-181`, the A.W4 — image storage cleanup wave's fix); value.js hashes JSON-canonical `{name, colors}` (`hash.ts:13-22`). Different surfaces, identical algorithm choice — no problem, but the *algorithm itself* deserves its own §4 (is SHA-256 still the right choice?).
7. **Snapshot is a fourier-only concept** that does not exist on the value.js side. value.js has *versions* (`palette_versions`) but versions are content-addressed *children of a palette*, not stand-alone published entities. fourier's snapshot ⇄ gallery split is the structural debt.
8. **Internal id pattern divergence.** fourier's `users._id = user_slug` and `sessions._id = token` — slugs / tokens are first-class keys. value.js mirrors this on `users` and `sessions` but uses ObjectId on `palettes` (palette slug is a *secondary* indexed field). The contract should ratify one shape (see §2).

---

## §2 — Converged identity model

### 2a. Three orthogonal identifiers per entity

The model is intentionally simple. Each user-named entity (fourier: `visualization`; value.js: `palette`) carries exactly **three** identifiers, with disjoint roles:

| Identifier | Role | Shape | User-facing? | Mutable? |
|---|---|---|---|---|
| **`slug`** | The one human-readable handle. URL, share link, copy-target. | `^[a-z]+(-[a-z]+){3}$` (4 lowercase words, hyphenated) per §3 | **Yes** — the only user-facing identifier | **No** — immutable for the entity's lifetime |
| **`content_hash`** | Deduplication / cache key / ETag substrate. | sha256 hex (64 chars) per §4 | **No** — never appears in a URL or share link | Yes — recomputed on content change |
| **Mongo `_id`** | Internal pointer; cursor-pagination substrate. | ObjectId or the slug-string itself | **No** — never exposed in API or URL | No |

### 2b. Slug ↔ `_id` policy (the dual-id pattern decision)

The cohort already runs a dual-id pattern: a public slug + an opaque internal id. The SOTA dimension is whether the internal id should be a **monotonically-sortable** identifier (ULID, UUIDv7, KSUID, snowflake) rather than Mongo's ObjectId.

**ObjectId is monotonically sortable** by construction — bytes 0–3 are a Unix timestamp, bytes 4–8 are a random per-process value, bytes 9–11 are a per-process counter. Sort-by-`_id` is approximately sort-by-creation-time within a process; across processes the random portion preserves monotonicity at second granularity. The cursor-pagination code already exploits this (`api/routers/gallery.py:158-163`: `("_id", sort_dir)` as the tie-breaker on equal `created_at`; `value.js/api/src/routes/palettes.ts:208-224`: the identical pattern with `{_id: { $lt: cursor._id }}`).

ULID / UUIDv7 / KSUID would add the ability to sort by `_id` *across processes / replicas at millisecond granularity*. **For this cohort, that is not required**: cursor pagination already breaks ties with `created_at` first, `_id` second, and pagination correctness holds with second-granularity monotonicity. Snowflake (per-shard counter + machine id) is over-engineering for a single-replica cohort (the A.12 invariant; the A.W4 — image storage cleanup wave's single-replica posture).

**Decision: keep Mongo ObjectId as `_id` for entity collections** (`visualizations`, `palettes`, `votes`, `flags`). **Do not introduce ULID / UUIDv7 / KSUID / snowflake** — the affordance they add (cross-process millisecond monotonicity) is not load-bearing for any code path in either repo. KISS (invariant 12) rejects the migration.

**Exceptions retained**: users and sessions keep their existing `_id` shape (slug-as-id for users; uuid-token-as-id for sessions). These are *not* dual-id; the user-facing handle (slug) and the internal id are the same string, by design. Authentication routes look up `users._id = user_slug` directly (`api/dependencies.py:166`, `sessions.py:88`); inserting an intermediate ObjectId would add a join with no benefit.

**Disposition table** (drops into `CRUD-CONTRACT §1`):

| Collection | `_id` shape | Rationale |
|---|---|---|
| `visualizations` (fourier) | ObjectId | dual-id; slug is the public handle; ObjectId tie-breaks cursor pagination |
| `palettes` (value.js) | ObjectId | identical pattern; already in place |
| `users` | string = `user_slug` | the slug *is* the id; auth routes key on it |
| `sessions` | string = UUIDv4 token | the token *is* the id; matches `R-auth-spec §2c` |
| `votes`, `flags`, `palette_versions` | per-repo | not user-named; ObjectId or content-hash as appropriate |

### 2c. Content-hash separation (the load-bearing rule)

**Content hashes are never user-facing identity.** This is the single rule the migration enforces and the conformance matrix asserts.

Today:

- fourier's gallery URL: `/g/{snapshot_hash}` (or wherever the frontend reads `snapshot_hash` from `web/src/stores/gallery.ts`). **Retired.**
- value.js's `palette_versions._id` is the content hash, surfaced on admin-only routes (`GET /palettes/{slug}/versions/{hash}`, `api/src/routes/palettes.ts:624`). **Retained** — admin-only surface, no end-user share-link semantics; the version hash is **the natural addressing scheme for "show me palette X at content state Y."** The contract explicitly admits this as the *one* hash-in-URL pattern, scoped to version history.

Surviving content hashes after convergence:

- **fourier `images.sha256`** — image dedup. Stays. Not user-facing.
- **fourier `contours.contour_hash`** — contour dedup. Stays. Not user-facing.
- **fourier `visualizations.content_hash`** — ETag substrate + idempotency-key replay map. Stays. **Not user-facing.**
- **fourier `snapshots.snapshot_hash`** — **retired as a top-level concept.** Snapshots absorb into `visualizations` (the user-saved noun); the hash, if computed at all, becomes `visualization.content_hash`.
- **value.js `palettes.currentHash`** — head-version pointer. Stays. Not user-facing (read in `formatPalette` as content provenance, never as a URL).
- **value.js `palette_versions._id`** — content-addressed version. Stays, surfaced **only** on the `/palettes/{slug}/versions/{hash}` admin route.

### 2d. URL shape

| Pattern | Meaning |
|---|---|
| `GET /{entity}/{slug}` | Read by slug |
| `GET /{entity}?cursor=...` | List (cursor pagination per §0) |
| `POST /{entity}` | Create (slug generated server-side per §3) |
| `PATCH /{entity}/{slug}` | Update (requires `If-Match` ETag) |
| `DELETE /{entity}/{slug}` | Soft-delete |
| `POST /{entity}/{slug}/restore` | Restore from soft-delete |

Mongo `_id`, content hashes (except version history), and session tokens **never** appear in a URL path or query string. Recommended entity-noun decisions in §6.

### 2e. Five-line summary of the converged model

1. Every user-named entity has **one slug** (`^[a-z]+(-[a-z]+){3}$`), generated server-side at creation, immutable, unique within the collection.
2. Every entity has **one internal `_id`** (ObjectId for entity collections; slug-as-id for `users`; token-as-id for `sessions`); never user-facing.
3. Every entity has **at most one `content_hash`** (SHA-256, deterministic from canonical content); used for dedup, ETag, idempotency; never user-facing except in admin version-history routes.
4. **Slug ↔ content-hash collision is impossible** — disjoint character classes (slug `^[a-z-]+$`; hash `^[0-9a-f]{64}$`).
5. URL shape: `/{entity}/{slug}` only. No content hashes, no `_id`s, no tokens in URLs.

---

## §3 — Slug algorithm spec

### 3a. Shape

- **Word count**: 4 words, exactly.
- **Pattern**: `^[a-z]+(-[a-z]+){3}$` — lowercase ASCII, hyphen-separated, exactly 4 words. Tightens fourier's `^[a-zA-Z0-9][-a-zA-Z0-9]{2,80}$` (`api/dependencies.py:27`) and value.js's `^[a-z0-9][a-z0-9-]*$` (`api/src/routes/palettes.ts:362`). No digits, no uppercase, no underscores.
- **Length**: minimum 7 chars (4 one-letter words + 3 hyphens; pathological but allowed by the pattern); maximum 60 chars (sufficient for the longest known coolname / value.js word combinations — `coolname`'s longest is `multitudinous` (13); value.js's longest is `iridescent` / `cerulean`-class; 4 × ~14 + 3 = ~59).
- **Lowercase normalisation**: incoming slug query params lowercase before comparison; case-mismatched URLs 301 to the canonical lowercase form.

### 3b. Word-list composition

A 4-word slug needs to decide what each position contributes.

**fourier today** (via `coolname.generate_slug(4)`): four words drawn from `coolname`'s mixed dictionaries (adjective | adjective | adjective | noun, or similar — the library does not document the exact category sequence; per the `coolname` source, the 4-word sequence is from the `all` config with a weighted dictionary across categories). Effective category mix is **lossy** and not contract-pinnable.

**value.js today** (`slugWords.ts:84-90`): `adjective-verb-color-animal` — **a structured 4-word slug** with one word from each of four named lists.

The structured form **wins**:

1. **Combinatorial floor is explicit**: `|ADJ| × |VERB| × |COLOR| × |ANIMAL| = 120 × 120 × 128 × 128 ≈ 2.36 × 10⁸`. The birthday-bound (§3d) is then computable from first principles.
2. **Aesthetic floor**: every slug is a sensible English-ish phrase (e.g. `pristine-flowing-azure-falcon`). `coolname`'s output is *also* sensible but less predictably so.
3. **Drift-correctness**: the contract pins the category sequence, so a parser / validator can name the position of each word ("the 3rd word should be in the color list").
4. **Extensibility**: adding a 5th category later (e.g. `adjective-verb-color-animal-suffix` for 5-word slugs) is a contract amendment, not a library upgrade.

**Decision: adopt value.js's structured `adjective-verb-color-animal` 4-word scheme** as the cohort canonical. fourier swaps `coolname` for the same word-lists. See §5 for the shared-data disposition.

### 3c. Generation

- **Server-side only.** The slug is generated by the backend, not supplied by the client. value.js's palette route today accepts a client-supplied slug (`api/src/routes/palettes.ts:362`); this is **retired**. Client-supplied "vanity slugs" violate uniqueness invariants and the `^[a-z]+(-[a-z]+){3}$` structure simultaneously.
- **Cryptographic RNG**: `crypto.randomInt` in TypeScript (already in use, `slugWords.ts:80-82`); `secrets.choice` in Python (replacing the `random.choice` inside `coolname`). The slug is not a secret, but using a cryptographic RNG (a) removes Mersenne-Twister state-recovery as a theoretical observability surface, (b) aligns with `R-auth-spec §2g`'s cohort-cryptographic-primitives stance.
- **Code shape** (canonical, both repos):

```python
# fourier — api/slugs.py (post-convergence)
import secrets
from api.slug_words import ADJECTIVES, VERBS, COLOR_TERMS, ANIMALS

def generate_slug() -> str:
    return "-".join((
        secrets.choice(ADJECTIVES),
        secrets.choice(VERBS),
        secrets.choice(COLOR_TERMS),
        secrets.choice(ANIMALS),
    ))
```

```ts
// value.js — api/src/slugWords.ts (unchanged in shape; lists may move per §5)
export function generateSlug(): string {
    return [
        ADJECTIVES[crypto.randomInt(0, ADJECTIVES.length)]!,
        VERBS[crypto.randomInt(0, VERBS.length)]!,
        COLOR_TERMS[crypto.randomInt(0, COLOR_TERMS.length)]!,
        ANIMALS[crypto.randomInt(0, ANIMALS.length)]!,
    ].join("-");
}
```

### 3d. Collision handling

- **Rely on the unique index + `DuplicateKeyError` catch.** **No check-then-insert pre-flight.** This retires:
  - `api/services/image_storage.py:75-77` (the TOCTOU loop on `image_slug`).
  - `api/services/image_storage.py:106` (catches `sha256` dup only, not slug dup — would 500 on a slug collision).
  - `api/routers/sessions.py:47-49` — no retry, no catch — would 500 on a user-slug collision.
  - `api/src/slugWords.ts:92-99` value.js's `generateUniqueSlug` pre-check loop (replaced with insert-then-catch).
- **Retry policy**: on `DuplicateKeyError` (Mongo error code 11000), retry up to **10** times with fresh slugs; after 10 failures, return **503** with problem+json `type=slug-pool-exhausted`. The 10-retry ceiling exists to bound worst-case latency; the keyspace makes hitting it effectively impossible (§3e proves this).
- **Canonical shape**:

```python
async def insert_with_unique_slug(coll, doc_factory, max_retries=10):
    for _ in range(max_retries):
        slug = generate_slug()
        doc = doc_factory(slug)
        try:
            await coll.insert_one(doc)
            return slug
        except DuplicateKeyError as e:
            if "slug" not in str(e):
                raise  # different unique constraint — propagate
    raise HTTPException(503, detail="slug-pool-exhausted")
```

### 3e. Birthday-bound analysis (the keyspace question)

With the structured 4-word scheme (`120 × 120 × 128 × 128`) the slug keyspace is:

```
N = 120 × 120 × 128 × 128 = 235,929,600 ≈ 2.36 × 10⁸
```

The birthday-bound for probability *p* of at least one collision among *k* draws (uniform without-replacement; classic):

```
p(k, N) ≈ 1 − exp(−k² / 2N)
```

| Entities `k` | Collision probability `p` |
|---|---|
| 1,000 | 0.0021 % |
| 10,000 | 0.21 % |
| 100,000 | 19 % |
| 1,000,000 | ~88 % |

**Interpretation.** At fourier's current scale (gallery rows order ≤ 10⁴), the cohort lives in the safe regime: a single retry handles essentially every collision; the 10-retry ceiling is wildly over-provisioned. At 100k entities (where this cohort would already be a successful product), collision probability rises to ~20 % over the *entire population*, but the *per-insert* expected-retries-given-collision is bounded by `population / N`, which at 100k is `~4 × 10⁻⁴` — one in ~2,400 inserts retries once.

**Conclusion.** 4-word structured slugs are **sufficient through 10⁵ entities**. Beyond 10⁶, the scheme requires expansion. **Pre-emptive amendment** (not load-bearing now, but documented for the change-log): if either repo's entity count exceeds 10⁵, append a 5th word (e.g. a "suffix" or "place" list) to lift the keyspace to ~3 × 10¹⁰ and recompute. The R3 admit-rule (§5) checks size; adding a 5th list is an admitted contract amendment, not new structure.

### 3f. Validation

Both repos enforce the pattern at:

1. The router boundary (path params, body fields): `^[a-z]+(-[a-z]+){3}$` regex.
2. The DB schema validator (the MongoDB JSON schema on the `slug` field): the same regex.
3. The unit test (every random sample of 1,000 generated slugs checks).

`SLUG_PATTERN` at `api/dependencies.py:27` is renamed in scope (today it is named "slug" but only ever applied to `image_slug` — see `dependencies.py:30-33`). The contract names one pattern; one validator (`validate_slug(s: str) -> str`); one error shape (`problem+json type=invalid-slug`).

### 3g. Conformance assertions (mirror `CRUD-CONTRACT §2` C2.1–C2.4)

- **C-slug-1** — `pytest api/tests/test_slug_format.py::test_slug_shape` and `vitest test/slug-format.test.ts` validate `^[a-z]+(-[a-z]+){3}$` against 1,000 generated slugs.
- **C-slug-2** — both `test_slug_collision::test_duplicate_key_retry` cases force a collision (pre-insert a known slug, mock RNG once) and assert the retry path succeeds.
- **C-slug-3** — `grep -E 'find_one.*slug.*generate_slug|findOne.*slug.*generateSlug'` in both repos' router code returns **zero** (no check-then-insert remains).
- **C-slug-4** — every slug emitted belongs to the contract-binding word-lists; checked by the test (sample 1,000; assert every word ∈ the union of `ADJECTIVES ∪ VERBS ∪ COLOR_TERMS ∪ ANIMALS`, in the right position).
- **C-slug-5** — `db.users.countDocuments({_id: {$not: /^[a-z]+(-[a-z]+){3}$/}})` is **0** after migration.

---

## §4 — Content-hash algorithm decision

### 4a. Current state

Both repos use **SHA-256** for content hashing today, applied with different canonicalisations:

- fourier `image_storage.py:165, 181`: `hashlib.sha256(payload.encode())` over `json.dumps({"x": xs, "y": ys}, sort_keys=True)`.
- fourier `image_storage.py:130` for the contour extraction cache key: the same algorithm.
- fourier `images` collection: `sha256` of the raw image bytes.
- fourier `snapshots.snapshot_hash`: the same algorithm over `{image_slug, contour_hash, contour_settings, animation_settings}` (`api/routers/snapshots.py:38-47`).
- value.js `hash.ts:13-22`: `crypto.createHash("sha256").update(canonical).digest("hex")` over a canonicalised palette `{name, colors[].css, colors[].position}`.

The canonicalisation rules are similar but per-repo bespoke: both lowercase strings, both round positions / coords (value.js: `1e6`), both `JSON.stringify` / `json.dumps` with deterministic key ordering. **The hash is the same algorithm; the canonical form is repo-specific because the *content* is repo-specific.**

### 4b. The SOTA dimension

The candidate alternatives:

| Algorithm | Output size | Speed (vs SHA-256) | Notes |
|---|---|---|---|
| **SHA-256** | 256 bit / 64 hex | 1× (baseline) | Status quo; FIPS 180-4; universal language support; constant-time impls everywhere |
| **BLAKE3** | 256 bit (configurable) / variable hex | ~6–10× faster on modern CPUs (SIMD); parallelisable | RFC-track 2020+; native rust / c; node 22+ via libraries; pip `blake3` adds a build dep |
| **SHA-512/256** | 256 bit truncated from 512 | ~1.5× SHA-256 on 64-bit | wider digest internal state; same output size; rarely deployed |
| **xxh3** | 128 bit | ~30× faster | **non-cryptographic** — wrong tool; collision attacks trivial |

The cohort's hash uses:

1. **Dedup keys** (`images.sha256`, `contours.contour_hash`). A collision is a *correctness* bug — two distinct images would unify. Cryptographic collision resistance is the bar.
2. **ETag substrate** (proposed `visualizations.content_hash`). A collision is a correctness bug for `If-Match` optimistic-concurrency — two different content states would compare equal.
3. **Idempotency-key replay map** (per `CRUD-CONTRACT §0 SOTA convention 4`). The same: a collision lets a replay match a different content state.

All three uses require **second-preimage / collision resistance**. BLAKE3 is the only modern candidate that competes with SHA-256 on resistance while improving speed. xxh3 is **rejected** (non-cryptographic).

### 4c. BLAKE3 vs SHA-256 — the decision

**BLAKE3 wins on speed** (6–10× SHA-256 on AVX2 / NEON; substantially more on multi-megabyte payloads when parallelised). **SHA-256 wins on universality** (every language stdlib, every CDN, every TLS stack, every audit-ready FIPS context).

**For this cohort, SHA-256 is the right choice.** Three reasons:

1. **The cohort's hash payloads are tiny.** A contour's points list at 1024 points is ~16 KB of float-as-json; a palette's `{name, colors}` is at most a few hundred bytes; an image's sha256 is over the *bytes* (which are large) but is computed once at upload and cached forever. SHA-256 on a 16 KB payload is ~30 μs on a modern x86 core; BLAKE3 would shave ~25 μs. The hash is **not on a hot path**.
2. **Language-stdlib availability.** Python has `hashlib.sha256` in stdlib; Node has `crypto.createHash("sha256")` in stdlib. BLAKE3 in Python requires `pip install blake3` (Rust build dep); in Node requires `@noble/hashes/blake3` (no build dep) or `node-blake3` (build dep). **Adding a build dependency to fourier's `pyproject.toml` for a 25 μs win violates invariant 12 (KISS).**
3. **Status-quo agreement.** Both repos converged on SHA-256 *without coordination*. The decision is already made; this section ratifies it rather than reopens it.

**Decision: SHA-256 stays the cohort canonical content-hash algorithm.** BLAKE3 is rejected by KISS; xxh3 / non-crypto is rejected by collision-resistance. Document the choice in the contract.

### 4d. Canonicalisation rules (binding)

The hash *algorithm* is SHA-256; the *canonical form* is per-entity and must be stable across both repos for any entity that crosses the cohort boundary (none do today — image bytes don't cross, contour points don't cross, palette content doesn't cross). The canonicalisation rules from each repo are retained as-is:

- fourier `images.sha256`: SHA-256 of the raw uploaded bytes. Trivial; no canonicalisation.
- fourier `contours.contour_hash`: SHA-256 of `json.dumps({"x": xs, "y": ys}, sort_keys=True)` *with as-ordered point arrays* (post-A.W4 fix; the prior bug was independent-axis sort, retired).
- fourier `visualizations.content_hash` (new): SHA-256 of `json.dumps({"image_slug": …, "contour_hash": …, "contour_settings": …, "animation_settings": …}, sort_keys=True)` — i.e. the existing `snapshot_hash` formula, repurposed.
- value.js `palettes.currentHash`: SHA-256 of `JSON.stringify({name: name.trim().toLowerCase(), colors: colors.map(c => ({css: c.css.trim().toLowerCase(), position: Math.round(c.position * 1e6) / 1e6}))})` (`hash.ts:13-22`). Retained verbatim.

### 4e. ETag derivation

ETag (per `CRUD-CONTRACT §0` SOTA convention 2): strong validator `W/"<content_hash>-<version_count>"`. Versions matter because metadata-only updates (e.g. visibility change) leave `content_hash` constant but should still bump the ETag.

```
ETag: W/"a3f1e2…b9c0-7"
```

Where `a3f1e2…b9c0` is `content_hash[:16]` (16 hex chars — 64 bits of collision space; ample for an ETag scoped to a single entity) and `7` is `version_count`. Truncating to 16 hex matches the GitHub-API convention; full 64-char ETags work but are noisy in logs.

### 4f. Conformance assertions

- **C-hash-1** — `grep -rE 'blake3|xxh|md5|sha1' api/ web/src/ ~/Programming/value.js/{src,api/src}/` returns **zero** outside of vendored dependency directories.
- **C-hash-2** — every collection's content-hash field is `^[0-9a-f]{64}$` (regex match on a sample of 100 rows).
- **C-hash-3** — `ETag` header on `GET /{entity}/{slug}` matches `^W/"[0-9a-f]{16}-\d+"$`.
- **C-hash-4** — content_hash is **never** in a URL path or query (the C1.1 grep extended to also reject `[0-9a-f]{16,}`).

---

## §5 — Shared-data disposition (the R3 admit-rule applied)

### 5a. The admit-rule (recapped from `research/README.md`)

R3's "shared data" admits a target iff:

1. **Size** — fits in a single file ≤ 10 KB *or* a single npm / PyPI package with no runtime dependencies.
2. **Drift-correctness** — divergence between repos is a *correctness* bug, not a stylistic preference.
3. **Language-agnostic** — consumable from Python and Node without a parser / transpiler beyond standard JSON / YAML / TSV.

### 5b. Application to the slug word-list

**(1) Size.** value.js's `slugWords.ts` is 99 lines, exactly four arrays of strings:

```
ADJECTIVES: 120 entries
VERBS:      120 entries
COLOR_TERMS: 128 entries
ANIMALS:    128 entries
total:      496 strings, ~5 KB of source
```

As JSON: `{"adjectives": [...], "verbs": [...], "colors": [...], "animals": [...]}` would be ~6 KB. **Well under the 10 KB ceiling. PASSES.**

**(2) Drift-correctness.** If fourier and value.js draw from different word-lists, the cohort cannot honestly state "slug shape is one regex, one keyspace, one birthday-bound." A user-slug minted on fourier (e.g. `multitudinous-fox-cat`) might fail value.js's "word ∈ dictionary" assertion (C-slug-4 above); the cohort would have two regimes silently. **Drift IS a correctness bug. PASSES.**

**(3) Language-agnostic.** Plain JSON arrays of ASCII strings. Loadable from Node (`import words from "@mkbabb/slug-words"`) and from Python (`json.load(open(".../slug-words/words.json"))`). No code, no parser, no encoding ceremony. **PASSES.**

**All three tests pass. The slug word-list is admitted to the *shared-data* disposition.**

### 5c. Disposition shape

Three viable forms; recommend (a):

| Form | Shape | Trade-off |
|---|---|---|
| **(a) `@mkbabb/slug-words` npm + PyPI mirror** | one npm package publishing the four lists as JSON + a thin TypeScript wrapper; a PyPI package (`mkbabb-slug-words`) publishing the same JSON + a thin Python wrapper. Both packages bundle the same `words.json`; the npm one is the source of truth (one repo: `@mkbabb/slug-words`). | one new repo; two publishing pipelines; clean separation. |
| **(b) Vendored data file in the precepts submodule** | `~/Programming/precepts/data/slug-words.json`; both repos load relative to the submodule. | no new repo, no publish step; tighter coupling to precepts as a runtime artefact (today precepts is *spec*, not *runtime*). |
| **(c) Two copies kept in sync by this contract** | `slugWords.ts` is the source of truth (value.js); fourier reproduces the lists in `api/slug_words.py`; a contract assertion hashes both and compares. | zero new infrastructure; drift caught only by CI assertion; one source of truth in an awkward repo location. |

**Recommendation: (a)** `@mkbabb/slug-words`. Rationale:

- It is the *named* form in `CRUD-CONTRACT §2` ("(a) Shared data package `@mkbabb/slug-words`"; `coordination/CRUD-CONTRACT.md:213-215`). The contract already anticipates this disposition.
- The "no runtime dependencies" admit-rule clause is satisfied (the package has zero deps; it ships a single JSON + a 5-line `index.ts` wrapper).
- Versioning: a publishing cadence on word-list growth (e.g. adding a 5th list for 10⁶ scale per §3e) is a single `npm version` + `pip release`; no contract-amendment churn.
- It mirrors value.js's existing pattern: value.js itself ships an npm package; the cohort's substrate-as-package idiom is already established.

**Form (b)** is admitted as a fallback if the cost of two publishing pipelines is judged disproportionate at the value.js-C.W2 wave time; the lists can move to the precepts submodule with no semantic change. Form (c) is rejected: drift caught only by CI is worse than drift made impossible by single-sourcing.

### 5d. Migration path for word-lists

The contract retires `coolname` from fourier. fourier's existing slugs (in `images.image_slug`, `users._id`) were minted from `coolname`'s dictionaries, which **do not match** the value.js lists. The migration must answer: do we re-mint old slugs (breaking URLs), or keep them as legacy?

**Recommendation: keep legacy slugs as-is; enforce the new lists for new entities only.** The contract assertion C-slug-4 ("every slug ∈ dictionary") is scoped to slugs minted after a cutover datetime (`migrated_after: 2026-MM-DD`). Existing slugs validate as **shape-conformant** (`^[a-z]+(-[a-z]+){3}$`) but not necessarily dictionary-conformant. The conformance matrix records this scoping in §10.

This is a verified-not-hoped migration (invariant 17):

1. Pre-flight: `db.users.countDocuments({_id: {$not: /^[a-z]+(-[a-z]+){3}$/}})` — count of users whose slug does not even match the new shape pattern.
2. If non-zero (likely, given fourier's lax `SLUG_PATTERN` admitting digits and 5+ words), one of:
    - Backfill rename: assign a new contract-conformant slug; preserve the old as `legacy_slug` for one tranche; break any external URLs.
    - 410 Gone for legacy URLs; require the user to log in and pick a new slug.
3. Spot-check: 20 random users from each cohort; verify both old and new slug forms resolve.

The migration spec lives in `R-lifecycle-spec.md` and the W3 — fourier visualization entity wave's migration script; this document names only the requirement.

### 5e. Word-list ownership beyond the slug

The same `@mkbabb/slug-words` package could be re-used for other slug-generating surfaces (palette names, tag names) without expansion. **Out of scope**: the package is `slug-words` (4 lists for adjective-verb-color-animal); it is not a general "data" repo. R3 admits only the slug-word case.

### 5f. R3 disposition table row (drops into `CRUD-CONTRACT §9`)

| Target | Rationale | Admit-rule passed? | Disposition | Conformance assertion |
|---|---|---|---|---|
| slug word-list | data, not code; 4 fixed lists × 120-128 entries each; ~6 KB JSON; drift between repos creates birthday-bound mismatch | **YES** (size 6 KB ≤ 10 KB; drift = correctness bug; pure JSON) | **(a) shared data — `@mkbabb/slug-words`** | C-slug-4: every slug ∈ the package's lists (scoped to entities minted post-cutover) |
| slug algorithm logic | logic, not data; small (~10 LOC each side); per-language idiom (`secrets` vs `crypto.randomInt`) | **NO** on language-agnostic | **shared spec** (this contract §3) | C-slug-1, C-slug-2, C-slug-3 |
| hash algorithm | logic, not data; SHA-256 is universal stdlib | **NO** on extract-as-data | **shared spec** (this contract §4) | C-hash-1, C-hash-2 |
| canonicalisation (palette) | logic; varies per entity | **NO** | **per-repo** (value.js owns palette canonicalisation; fourier owns visualization canonicalisation) | per-entity test in each repo |

---

## §6 — URL shape spec

### 6a. Entity-noun decision

`CRUD-CONTRACT §0 SOTA convention 7` binds `GET /{entity}/{slug}`. The remaining decision is the entity-noun choice.

Candidates for fourier's user-named entity:

| Pattern | Pros | Cons |
|---|---|---|
| `/visualization/{slug}` (singular) | matches REST-purist orthodoxy ("a resource"); reads naturally in prose ("share my visualization") | inconsistent with collection endpoints (`GET /visualization?cursor=…` reads as "give me *a* visualization") |
| `/visualizations/{slug}` (plural) | matches collection plural everywhere (`GET /visualizations` lists, `GET /visualizations/{slug}` reads one); industry default (GitHub, Stripe, GitLab, Linear) | URL is one character longer |
| `/v/{slug}` (single-letter abbreviation) | shortest share-link form; mirrors Twitter `/t.co/`, GitHub `/g/` | opaque to a first-time reader; less greppable; abbreviation drift across repos (fourier uses `/w/{image_slug}` today for workspace — see `web/src/stores/workspace.ts:99`) |

**Recommendation: `/visualizations/{slug}`** (plural). Three reasons:

1. **Industry-standard.** Every major REST API uses the plural collection noun (GitHub `/repos/{owner}/{repo}`, Stripe `/customers/{id}`, Linear `/issues/{key}`). A first-time reader of either repo recognises the pattern immediately.
2. **Consistent with collection listing.** `GET /visualizations` (list) and `GET /visualizations/{slug}` (item) share the same prefix; `POST /visualizations` (create) is unambiguous. The singular form forces awkward `POST /visualization` reading as "create *the* visualization."
3. **Greppable.** A regex search for `/visualizations/` finds every reference; `/v/` matches noise (the letter `v` in any path). Greppability is a load-bearing convenience for cross-repo audits (already used heavily in the audit corpus).

**For value.js**, by symmetric reasoning: `/palettes/{slug}` (today's exact pattern; `api/src/routes/palettes.ts:323` `palettes.get("/:slug", …)`). **No change.**

### 6b. Sub-resource pattern

```
GET    /visualizations/{slug}                  # read
PATCH  /visualizations/{slug}                  # update (If-Match)
DELETE /visualizations/{slug}                  # soft-delete (If-Match)
POST   /visualizations/{slug}/restore          # restore
POST   /visualizations/{slug}/like             # idempotent like-toggle
POST   /visualizations/{slug}/view             # increment view counter
POST   /visualizations/{slug}/flag             # report
GET    /visualizations/{slug}/versions         # version history (if kept; fourier-side undecided)
GET    /visualizations/{slug}/versions/{hash}  # content-addressed version (the ONE hash-in-URL admission)
```

### 6c. Frontend route shape

The browser URL mirrors the API URL with one prefix difference:

```
Web:   /v/{slug}            # short, shareable; redirect from /visualizations/{slug} for parity
Web:   /visualizations/{slug}  # canonical; long form
API:   /api/visualizations/{slug}
```

**Recommendation: support both web URLs**; canonicalise to the short `/v/{slug}` form (302 from long → short). The short form is the share-link the gallery copy-button emits; the long form is the typed-in canonical. This is a frontend-only decision (no contract implications); recorded here for completeness.

For value.js: `/p/{slug}` short + `/palettes/{slug}` long. Symmetric.

### 6d. Trailing slash and case

- **No trailing slash** on either form. `/visualizations/{slug}/` → 301 to `/visualizations/{slug}`.
- **Lowercase.** Case-mismatched slug paths (`/visualizations/Pristine-Falcon-…`) → 301 to lowercase canonical. The slug pattern `^[a-z]+(-[a-z]+){3}$` already forbids uppercase; the redirect is for paste-failure ergonomics.

### 6e. Legacy URL handling

- fourier `/gallery/{snapshot_hash}` (the existing pre-migration pattern) → migration generates a slug per gallery row; the old hash-URL receives a **301** redirect to `/v/{slug}` for one tranche (90 days); after that, 410 Gone.
- fourier `/w/{image_slug}` (workspace draft URL, IndexedDB-backed) — retained as the *client-only* draft route; no server route. The transition from draft → published visualization moves the user to `/v/{slug}`.

### 6f. Conformance assertions

- **C-url-1** — `grep -rE '/(visualizations|palettes)/[0-9a-f]{32,}'` over `web/src/`, `~/Programming/value.js/{src,api/src}/`, and the value.js demo web returns **zero** (no content hash in any client-side URL pattern).
- **C-url-2** — `grep -rE '/(visualization|palette)/[a-z0-9-]+' web/src/ ~/Programming/value.js/` (singular) returns **zero** (the canonical is plural).
- **C-url-3** — `curl -i /visualizations/PRISTINE-FALCON-…` returns `301` to the lowercase canonical.
- **C-url-4** — `curl -i /v/{slug}` returns 200 with the visualization payload; `/visualizations/{slug}` returns 302 to `/v/{slug}`.

---

## §7 — Migration plan from the current 5-scheme state

### 7a. Per-entity disposition

| Today's identity | Today's surface | Disposition | Migration action |
|---|---|---|---|
| `image_slug` (4-word, coolname) | URL handle for images | **kept** | shape-validate; entities with non-conforming legacy slugs flagged in `migration_report.md`; recommend re-mint (see 7c) |
| `images.sha256` | dedup key | **kept** | no action |
| `contour_hash` | dedup key | **kept** | no action |
| `snapshot_hash` (currently user-facing via gallery URL) | gallery URL | **retired as user-facing**; reused as `visualization.content_hash` (server-internal) | per-row: mint a `visualization` slug; surface URL becomes `/v/{slug}`; legacy hash URL → 301 → 410 |
| `sessions._id = uuid4` | session token | **kept** | no action |
| `users._id = user_slug` | user handle | **kept** | shape-validate; re-mint legacy users per §5d |
| `imageSlug` (the IndexedDB keyPath, `web/src/lib/draftStorage.ts:14`) | client-only draft handle | **kept** | client-only; not part of server identity |
| value.js `palette.slug` (client-supplied) | URL handle | **server-generated post-cutover** | one-shot: post-cutover, `POST /palettes` ignores the client-supplied slug; existing rows keep their slug (already lowercase-hyphen-conforming, broadly) |
| value.js `palette_versions._id = currentHash` | admin version-history URL | **kept** (the only admitted hash-in-URL) | no action |

### 7b. Migration phases

**Phase 0 — pre-flight (read-only).**

1. Count entities per collection in both repos: `db.gallery.countDocuments()`, `db.snapshots.countDocuments()`, `db.images.countDocuments()`, `db.users.countDocuments()`, plus the value.js side.
2. Count slugs not matching `^[a-z]+(-[a-z]+){3}$`: `db.images.countDocuments({image_slug: {$not: /^[a-z]+(-[a-z]+){3}$/}})`; the same for `users._id`.
3. Count snapshots with `user_slug: None` in gallery: `db.gallery.countDocuments({user_slug: null})` — these are the orphan rows from `gallery.py:206-232`.
4. Count snapshots not referenced by any gallery row (orphans, un-prunable today): `db.snapshots.find({snapshot_hash: {$nin: db.gallery.distinct("snapshot_hash")}})` — bounded by the gallery's size.
5. Persist the counts to `audit/migration-counts-before.md`.

**Phase 1 — mint visualization slugs.**

Idempotent (mirroring `value.js/api/src/migrate-slugs.ts:31-36`):

```python
async def migrate():
    db = get_db()
    cursor = db.gallery.find({})
    async for entry in cursor:
        if entry.get("visualization_slug"):
            continue  # idempotent
        new_slug = await insert_with_unique_slug(db.visualizations, ...)
        await db.gallery.update_one({"_id": entry["_id"]}, {"$set": {"visualization_slug": new_slug}})
```

For orphan-snapshots (no gallery row): assign a synthetic owner (`anon-migrated-NNN` per `R-auth-spec §1b headline 1`) and visibility `draft`; mint a slug; insert into `visualizations`.

**Phase 2 — collapse snapshot ⇄ gallery into visualization.**

The new `visualizations` collection consolidates:

```python
{
    "_id": ObjectId,
    "slug": str,              # the slug, unique index
    "owner_slug": str,        # NOT NULL (invariant 14)
    "image_slug": str,
    "contour_hash": str,
    "contour_settings": dict,
    "animation_settings": dict,
    "content_hash": str,      # was snapshot_hash; server-internal only
    "visibility": "draft"|"unlisted"|"public",
    "tier": "normal"|"saved"|"featured",
    "views": int,
    "likes": int,
    "liked_ips": list,
    "version_count": int,     # ETag substrate
    "created_at": datetime,
    "updated_at": datetime,
    "deleted_at": datetime|None,  # soft-delete
    "last_accessed_at": datetime,
}
```

**Phase 3 — re-mint legacy non-conforming slugs.**

If pre-flight Phase 0 step 2 reports non-conforming slugs, the operator decides per §5d:

- (Option A — recommended for users) re-mint; preserve the old as `legacy_slug` for one tranche; 301 from old → new; 410 after the tranche.
- (Option B — recommended for images) keep as-is (image URLs are less commonly shared and less identity-bearing); enforce conformance only on entities minted after cutover.

**Phase 4 — verify.**

- `db.visualizations.countDocuments({owner_slug: null})` is **0**.
- `db.visualizations.countDocuments({slug: {$not: /^[a-z]+(-[a-z]+){3}$/}})` is **0** for entities `created_at > cutover_date`.
- Spot-check 20 random visualizations: open `/v/{slug}` and confirm the payload matches the pre-migration snapshot + gallery JOIN.
- Persist the counts to `audit/migration-counts-after.md`; diff vs Phase 0.

**Phase 5 — cutover.**

- The frontend re-points the gallery / share-link copy / store at `/v/{slug}` URLs.
- The old `/gallery/{snapshot_hash}` route registers a 301 to `/v/{slug}` lookup by content hash; remains for 90 days.
- After 90 days: `/gallery/{snapshot_hash}` → 410 Gone.

### 7c. Load-bearing migration risks

1. **Orphan snapshots without owner.** Phase 0 step 4 counts these; Phase 1 assigns `anon-migrated-NNN` slugs; visibility `draft`. The `anon-migrated-*` slug class is the *only* admitted non-conformant slug pattern (matches `^anon-migrated-\d+$` instead of `^[a-z]+(-[a-z]+){3}$`); the contract names it explicitly as a migration artefact, retired one tranche after cutover (entities aged out by `last_accessed_at` cron policy per `R-lifecycle-spec`).
2. **`user_slug: None` gallery rows.** Phase 1 reuses the `anon-migrated-NNN` owner-slug scheme. The user is real but unidentifiable; they cannot log in to claim the entity. After one tranche, the entity hard-deletes by cron (the orphan-user pattern).
3. **value.js's client-supplied slug retirement.** Existing palette rows have arbitrary user-typed slugs (matching `^[a-z0-9][a-z0-9-]*$` but **not** `^[a-z]+(-[a-z]+){3}$`). Per §5d, these are *kept as-is* (legacy); the dictionary assertion C-slug-4 scopes to `created_at > cutover_date`. value.js's frontend stops accepting user-supplied slugs at the value.js-C.W2 wave.
4. **Snapshot-without-gallery is silently lost if Phase 1 is not run.** The migration script must be all-or-nothing per phase; partial completion (e.g. Phase 1 ran for gallery rows but not for orphan snapshots) corrupts the dataset. The script's idempotency guarantee + the Phase 4 verification step closes this.
5. **Brittleness window for the 90-day legacy URL grace period.** During that window, `/gallery/{snapshot_hash}` must be honoured. The route handler does a content-hash lookup (`db.visualizations.find_one({content_hash: snapshot_hash})`) and 301s. The `content_hash` field needs an index for this (added in Phase 2's collection-init).

### 7d. Reversibility

The migration is **forward-only with a verified completeness proof** (invariant 17 admits this). Rollback after Phase 5 would require either (a) preserving the pre-migration `snapshots` and `gallery` collections under `snapshots_legacy` / `gallery_legacy` until the brittleness window expires (option exists — these are read-only after cutover; storage cost is bounded), or (b) re-running the migration in reverse from `visualizations` (lossy if visibility / soft-delete state has changed). **Recommend (a)**: keep `snapshots_legacy` and `gallery_legacy` collections for 90 days; hard-drop them with the brittleness-window close in the W5 — close ceremony.

### 7e. value.js-side migration

value.js's side is smaller because palette identity is already mostly correct (slug is the public handle; ObjectId is `_id`; `currentHash` is `palette_versions._id` for the version-history surface). The migration:

1. Backfill any palette row with `userSlug: null` (the `formatPalette ?? null` pattern; `api/src/routes/palettes.ts:25-26`). Use the `anon-migrated-NNN` slug class.
2. Reject client-supplied slugs going forward (the value.js-C.W2 wave); mint server-side. Existing palette slugs are retained (lax pattern is admitted for legacy).
3. Backfill `currentHash` on any palette missing it (already covered by H5's `migrate-palette-schema.ts` proposal; the proposal at `docs/audits/runs/2026-05-18-tranche-harden/h5-valuejs-C.md §4.2` is canonical).

### 7f. Conformance assertions (per `CRUD-CONTRACT §11`)

- **C-mig-1** — `db.visualizations.countDocuments()` after migration equals `db.gallery.countDocuments() + db.snapshots.countDocuments({snapshot_hash: {$nin: gallery_snapshot_hashes}})` (pre-migration). Counts in `audit/migration-counts-{before,after}.md`.
- **C-mig-2** — 20 random spot-check rows: every field in the migrated `visualizations` row matches a JOIN of the pre-migration `snapshots` and `gallery` rows.
- **C-mig-3** — `db.visualizations.countDocuments({owner_slug: null})` is **0**.
- **C-mig-4** — `db.users.countDocuments({_id: {$not: /^[a-z]+(-[a-z]+){3}$/}})` is **0** for users created after the cutover datetime.
- **C-mig-5** — `curl -i /gallery/{snapshot_hash}` returns 301 to `/v/{slug}` during the 90-day grace; 410 thereafter.

---

## §8 — Citations and grep gates

Every claim traces to:

- `api/slugs.py:1-11`
- `api/dependencies.py:23-44, 144-179, 200-208`
- `api/services/database.py:42-49, 53-54, 57-58, 68-78`
- `api/services/image_storage.py:31-110, 144-162, 165-216`
- `api/routers/sessions.py:23-54, 57-90, 93-100`
- `api/routers/snapshots.py:15-78`
- `api/routers/gallery.py:38-244, 299-368`
- `api/models/{assets,gallery,session,shared}.py`
- `web/src/stores/workspace.ts:84,99`
- `web/src/lib/draftStorage.ts:14, 21-55`
- `~/Programming/value.js/api/src/slugWords.ts:4-99`
- `~/Programming/value.js/api/src/hash.ts:1-22`
- `~/Programming/value.js/api/src/migrate-slugs.ts:1-74`
- `~/Programming/value.js/api/src/db.ts:21-79`
- `~/Programming/value.js/api/src/types.ts:1-7`
- `~/Programming/value.js/api/src/routes/palettes.ts:11-27, 108-149, 343-435, 472-505, 596-630, 679-742`

Prior audits:

- `docs/audits/runs/2026-05-18-fourier-tranche/e-crud-slug-valuejs.md §1, §2, §4`
- `docs/audits/runs/2026-05-18-tranche-harden/h4-fourier-B.md §1 (invariants 14-17), §3 (CRUD-CONTRACT §1-§2 outline), §6 (the P1 framework-in-disguise probe)`
- `docs/audits/runs/2026-05-18-tranche-harden/h5-valuejs-C.md §4 (migration idiom), §5.5 (`currentHash` backfill)`

Sibling specs:

- `docs/tranches/B/research/R-auth-spec.md §1, §2`
- `docs/tranches/B/research/R-lifecycle-spec.md` (visibility, soft-delete)
- `docs/tranches/B/coordination/CRUD-CONTRACT.md §1, §2, §9, §11`

---

## §9 — Open questions for the Wχ — challenge wave

Three items the challenge wave should probe; aligned to H4's named probes (P1, P2):

1. **Word-list extraction timing (the P1 framework-in-disguise probe).** §5 admits the slug word-list to *shared data* via R3's admit-rule, with the disposition `@mkbabb/slug-words` package. Probe: is creating one new package one-feature-too-many? Falsifier: if `@mkbabb/slug-words` is the only artefact at that location *forever* (no other slug-adjacent data ever joins), it is a contrived shared substrate. Counter-evidence: lists for tags, palette-name-suggestions, and contour-tour-strategy-names could plausibly all live in the same package. Probe action: enumerate the next 3 candidates and assess.
2. **Legacy-slug re-mint cost (the P2 migration-safety probe).** §5d / §7c #3 keeps legacy non-conformant slugs as-is. Probe: how many entities does this affect in production at cutover? Falsifier: if every gallery row's `snapshot_hash` URL is in the wild (shared on social media, for instance), 301 → 410 over 90 days breaks links. Counter-evidence: fourier's gallery is < 6 months old; share-link distribution is bounded. Probe action: search any external referrer logs for `snapshot_hash`-shaped URLs.
3. **`anon-migrated-NNN` owner-slug class admission.** §7c #1–#2 introduce a new owner-slug shape (`^anon-migrated-\d+$`) that violates the 4-word slug pattern. Probe: is this a contract-blessed exception, or is the migration silently flouting C-mig-3? Falsifier: the conformance matrix C-mig-3 asserts `owner_slug: null` is zero, but does *not* assert `owner_slug` matches the 4-word pattern; the loophole is admitted. Resolution: either rename to a conformant 4-word slug (`anon-MIGRATED-fish-FOX`-style), or scope C-slug-4 to exclude migration artefacts. **Recommend the latter** (KISS, no contrivance).

---

## Headline summary (≤ 350 words)

**Current-state verdict.** Five identity schemes in fourier (human slug, content hash, uuid4 token, ObjectId, IndexedDB key-derived string) confirmed against the live source. Both repos converge on SHA-256, opaque session tokens, slug-as-user-id, and 4-word slugs — but **word-lists diverge** (fourier `coolname` vs value.js's structured `adjective-verb-color-animal`), **collision handling is inconsistent within fourier** (TOCTOU on images, no handler on users), **fourier gallery URLs leak `snapshot_hash`** (the central incoherence), and **fourier `SLUG_PATTERN` is misnamed** (validates only image slugs).

**Converged model in 5 lines.** (1) Three identifiers per entity: **slug** (`^[a-z]+(-[a-z]+){3}$`, server-generated, immutable, public), **`_id`** (ObjectId for entities; slug-as-id for users; token-as-id for sessions; never public), **`content_hash`** (SHA-256, server-internal, ETag substrate; never public *except* value.js's admin version-history at `/palettes/{slug}/versions/{hash}`). (2) Word-list shape: `adjective-verb-color-animal`, 120 / 120 / 128 / 128 entries, keyspace ~2.4 × 10⁸ — birthday-safe through 10⁵ entities. (3) Collision handling: insert-then-catch `DuplicateKeyError`, 10 retries, 503 on exhaustion. (4) URL shape: `/visualizations/{slug}` API + `/v/{slug}` web (the short-canonical share form). (5) Cryptographic RNG (`secrets.choice` / `crypto.randomInt`) for slugs; SHA-256 for content hashes.

**Shared-data disposition.** The slug word-list is **admitted to shared data** via R3's admit-rule: size 6 KB ≤ 10 KB; drift = correctness bug (birthday-bound divergence); language-agnostic JSON. Disposition: **`@mkbabb/slug-words` npm + PyPI mirror** (the form `CRUD-CONTRACT §2` already anticipates). Fallback: vendor in the precepts submodule.

**Content-hash choice.** **SHA-256 ratified; BLAKE3 rejected by KISS.** Both repos already converged on SHA-256; payloads are tiny (~30 μs / hash); BLAKE3 would add a Rust build dep to fourier for a ~25 μs win — invariant 12 prohibits. xxh3 / non-cryptographic rejected by collision-resistance.

**Load-bearing migration risk.** Orphan snapshots (no gallery row, no owner) and `user_slug: None` gallery rows produce entities with no real owner; the migration introduces an `anon-migrated-NNN` owner-slug class (one tranche lifetime; cron-pruned thereafter) — which deliberately *violates* the 4-word slug pattern and must be admitted explicitly by C-slug-4's scoping clause. Renaming legacy non-conformant slugs (fourier's `coolname`-minted users and value.js's user-typed palette slugs) defers to opt-in re-mint; the conformance matrix scopes "every slug is in the dictionary" to entities created after cutover.
