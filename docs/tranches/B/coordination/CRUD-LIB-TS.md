# CRUD-LIB-TS — value.js TS utility-module specification (U4)

**Lane**: B / Wβ / U4. **Mirror of**: U3 (`api/src/crud/` Python peer).
**Status**: drafted at fourier-B.Wβ; per the orphan verdict at
`coordination/CRUD-CONSTELLATION.md`, value.js-C did not consume the
joint ratification in the shape originally intended; this spec is
preserved as the substrate for any successor binding.
**Scope**: utility modules at `~/Programming/value.js/api/src/crud/` consumed by the existing Hono routes (`palettes.ts`, `sessions.ts`, `admin.ts`). **Pure utilities**: small functions, small types; no `BaseCRUDRouter`, no Hono inversion of control, no framework-in-disguise (Wχ probe P1 falsifier).

The contract this implements is `coordination/CRUD-CONTRACT.md`. The schema this realises is `coordination/SCHEMA.md`. Where value.js's existing code already does it correctly, this spec *extracts* from there with `file:line` citation — no re-implementation.

## Goal criterion (document-level)

Author the TypeScript-side utility module — eight files at
`~/Programming/value.js/api/src/crud/{slugs,cursors,errors,etag,idempotency,softdelete,pinnedCron}.ts`
plus `index.ts` — that mirrors the U3 Python module's surface against
the value.js stack (Hono, native Node 22 `Buffer.from(_, "base64url")`,
`MongoServerError code=11000`). Every helper is invocable in three
lines from a hand-rolled Hono route.

## Completion criterion (document-level)

Each of the eight sub-module sections below carries a goal+completion
block, a signature block, an integration example, and a test surface
enumeration. The aggregate LOC ceiling is **~750** (target ~500;
budgets sum to ~670); the `verbatimModuleSyntax` discipline binds every
type-only import.

---

## §0 — Module shape (binding)

**Goal / Completion.** Pin the file layout, the dependency surface, and
the TS-strictness configuration before any sub-module's contents appear,
so later sections can reference the layout without re-stating it.

```
~/Programming/value.js/api/src/crud/
├── slugs.ts          # ~120 LOC — generate / validate / retry
├── cursors.ts        # ~50 LOC  — base64url encode / decode (palettes.ts:29-41)
├── errors.ts         # ~140 LOC — RFC 9457 problem+json envelope
├── etag.ts           # ~80 LOC  — strong validator + If-Match
├── idempotency.ts    # ~110 LOC — Idempotency-Key middleware (Mongo TTL)
├── softdelete.ts     # ~60 LOC  — deleted_at filter + soft/restore
├── pinnedCron.ts     # ~80 LOC  — pinned flag + bounded prune
└── index.ts          # ~30 LOC  — public re-exports
```

**Total ceiling: ~670 LOC, target ~500.** Each sub-module ≤ 150 LOC after type imports. Per-module vitest specs at `api/test/crud/*.test.ts` (eight files, one per sub-module).

### Dependencies (binding)

- `mongodb` (`api/package.json:15`, v6.12.0+) — typed `Db`, `Collection`, `Filter`, `Document`, `MongoServerError`.
- `hono` (`api/package.json:14`, v4.7.0+) — `Context`, `Next`, `MiddlewareHandler`, `HTTPException`. Used at the function boundary; lifecycle ownership stays with the route.
- `node:crypto`, `node:buffer` — `createHash`, `randomInt`, `Buffer.from(_, "base64url")` (Node 22 native per `package.json:52` engines pin).
- `../types.js` — `AppEnv` (`api/src/types.ts:1-7`).
- `../db.js` — `getDb()` (`api/src/db.ts:6`).

**No new heavy dependencies.** No Zod (value.js api does not ship Zod today). No `node-cron` consumption inside `crud/` (`pinnedCron.ts` exposes a `prune` function for `cron.ts` to call).

### TS strictness (binding)

```jsonc
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "verbatimModuleSyntax": true
}
```

Per-module `import type { … }` for every type-only import (`verbatimModuleSyntax` gate).

---

## §1 — `slugs.ts` — generator + retry

**Goal.** A 120-LOC module owning slug generation, validation, and the
insert-then-catch retry loop on `MongoServerError code=11000` —
replacing `slugWords.ts:92-99`'s pre-check `generateUniqueSlug` with
insert-then-catch per CRUD-CONTRACT §2 C2.3.

**What.** Three public symbols `generateSlug`, `validateSlug`,
`slugWithRetry<T>(insertFn, maxAttempts?)`; one type `SlugWords`.
Word-list loading happens once at module init per U2.

**Why.** Centralises the TS-side slug-generation surface so the C2.1,
C2.2, C2.3, C2.4, U-slugs-1–7 conformance rows have one TS
implementation to bind against; the `keyPattern` check propagates
duplicate-key errors on other unique keys unchanged.

**Completion.** Seven `slugs.test.ts` rows PASS (pattern match;
validate negatives; deterministic under mocked RNG; first-attempt
success; retry on slug dup-key; propagate other-key dup; 503 on
exhaustion).

**Budget**: ~120 LOC. **Mirrors U3** `crud/slugs.py`.

### Signatures

```ts
import type { Collection, Document } from "mongodb";

export interface SlugWords {
    adjectives: readonly string[];
    verbs:      readonly string[];
    colors:     readonly string[];
    animals:    readonly string[];
}

/** Generate a contract-shaped slug: `adjective-verb-color-animal`. */
export function generateSlug(): string;

/** Validate against `^[a-z]+(-[a-z]+){3}$`, length 7-60. */
export function validateSlug(s: string): boolean;

/**
 * Generate a fresh slug, attempt the insert, catch DuplicateKeyError on
 * the `slug` unique key, retry up to maxAttempts (default 10). On
 * exhaustion throws `HTTPException(503)` (problem+json type=slug-pool-exhausted).
 * The insert function performs the actual insert; this helper never
 * pre-checks via findOne (CRUD-CONTRACT §2 C2.3).
 */
export async function slugWithRetry<T>(
    insertFn: (slug: string) => Promise<T>,
    maxAttempts?: number,
): Promise<{ slug: string; result: T }>;
```

### Word-list loading (per U2 spec)

Loaded **once** at module init from the path the U2 spec ratifies. Default: vendored JSON resolved relative to `import.meta.url`. If U2 ratifies CRUD-CONTRACT §9 (a) (`@mkbabb/slug-words` package), the import becomes `import WORDS from "@mkbabb/slug-words/words.json" with { type: "json" };`. Word lists are `Object.freeze`d.

### Generator

Mirrors `slugWords.ts:84-90`; only the source of arrays changes (loader vs inline). `randomInt(0, len)` indexes each list; the non-null `!` is safe because lists are non-empty (validated at init: throw if any list empty).

### Retry — the load-bearing change

Replaces the pre-check loop at `slugWords.ts:92-99` (`generateUniqueSlug`) with insert-then-catch. The keyPattern check propagates duplicate-key errors on *other* unique keys unchanged (mirrors the Python form at `image_storage.py:106` post-fix):

```ts
catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
        const kp = e.keyPattern as Record<string, unknown> | undefined;
        if (kp && "slug" in kp) continue;  // retry our slug dup
    }
    throw e;  // different key or non-Mongo error
}
```

### Integration example

```ts
// Replaces palettes.ts:362-364 client-slug validation:
const { slug } = await slugWithRetry(async (candidate) =>
    await db.collection("palettes").insertOne({ slug: candidate, /* ... */ })
);
return c.json({ slug }, 201);
```

### Test surface (`api/test/crud/slugs.test.ts`)

- `validateSlug` accepts 1000 outputs of `generateSlug()` (C-slug-1).
- `validateSlug` rejects: empty, 3- or 5-word, uppercase, digits, hyphen-edged.
- `generateSlug` deterministic under mocked `randomInt`.
- `slugWithRetry` succeeds on first attempt.
- `slugWithRetry` retries on `MongoServerError{11000, keyPattern:{slug:1}}`.
- `slugWithRetry` propagates `MongoServerError{11000, keyPattern:{userSlug:1}}` unchanged.
- `slugWithRetry` throws `HTTPException(503)` after `maxAttempts`.

---

## §2 — `cursors.ts` — base64url opaque cursor

**Goal.** A 50-LOC module owning the opaque-base64url cursor
encode/decode — direct port of `palettes.ts:29-41` with one type-narrow
fix (`decodeCursor(b64u("42"))` decoded silently to a number; the fix
returns `null` on non-object).

**What.** Two functions `encodeCursor` and `decodeCursor`; one type
`CursorPayload`.

**Why.** Native Node 22 `Buffer.from(_, "base64url")` keeps the body
tight; the non-object narrowing closes a silent-malformed-filter path.
Conformance: CS1.1, CS1.2, CS1.3, U-cursors-1–4.

**Completion.** Four `cursors.test.ts` rows PASS (round-trip; null on
bad input; null on non-object payload; type-level `CursorPayload | null`).

**Budget**: ~50 LOC. **Ported from**: `palettes.ts:29-41`. **Mirrors U3** `crud/cursors.py`.

### Signatures

```ts
export type CursorPayload = Record<string, unknown>;

export function encodeCursor(payload: CursorPayload): string;
export function decodeCursor(raw: string | undefined): CursorPayload | null;
```

`decodeCursor` returns `null` on: undefined/empty, base64url decode failure, JSON parse failure, **decode to non-object** (added narrowing — `palettes.ts:33` lets a numeric cursor `"NDI="` decode to `42` and silently flow as malformed filter; one extra type-narrow closes it).

### Implementation note

Node 22 has native `Buffer.from(_, "base64url")` — no `replace(/\+/g, "-")` ceremony. The two-function body is 12-15 LOC; the rest of the file is JSDoc and the `CursorPayload` re-narrow.

### Integration example

```ts
// In palettes.ts list handler (replacing inline palettes.ts:30-41 form):
import { decodeCursor, encodeCursor } from "../crud/cursors.js";
const cursor = decodeCursor(c.req.query("cursor"));
if (cursor && cursor.sort_key !== sortParam) return cursorInvalid(c, "Stale cursor sort key");
```

### Test surface (`api/test/crud/cursors.test.ts`)

- Round-trip: `decodeCursor(encodeCursor(x)) === x` for object payloads.
- `decodeCursor(undefined | "" | "not-base64url!")` returns `null`.
- `decodeCursor(b64u("not-json"))`, `decodeCursor(b64u("42"))`, `decodeCursor(b64u("[1,2]"))` all return `null` (non-object narrowing).
- Type-level: returned value is `CursorPayload | null` via `expectTypeOf`.

---

## §3 — `errors.ts` — RFC 9457 problem+json

**Goal.** A 140-LOC module owning the problem+json envelope and one
helper per row of the SCHEMA §5 catalog — replacing the
`c.json({error: "..."}, status)` pattern at `middleware.ts:124,173,281`
and `palettes.ts:346,358,363,...` with `Content-Type:
application/problem+json` responses.

**What.** Two types `Problem` and `ProblemOpts`; one builder
`problem(c, opts)`; twenty one-line helpers (`notFound`, `slugInvalid`,
`sessionRequired`, …) — one per catalog row.

**Why.** Symmetry with U3's Python form; conformance: CS5.1, CS5.2,
U-errors-1–3.

**Completion.** Six `errors.test.ts` rows PASS (content-type; minimum
body; extension members preserved; helper triples; rate-limited sets
Retry-After; validation-error body shape).

**Budget**: ~140 LOC. **Mirrors U3** `crud/errors.py`.

Today value.js emits `c.json({ error: "..." }, status)` everywhere (`middleware.ts:124,173,281`; `palettes.ts:346,358,363,...`). The contract requires `application/problem+json` per CRUD-CONTRACT §0 SOTA convention 3 and SCHEMA §1.

### Types

```ts
import type { Context } from "hono";

export interface Problem {
    type:      string;             // urn:contract:<slug>
    title:     string;             // stable short summary
    status:    number;             // HTTP status
    detail?:   string;             // per-occurrence explanation
    instance?: string;             // request path
    errors?:   Array<{ path: string; message: string }>;
    [k: string]: unknown;          // RFC 9457 extensibility
}

export interface ProblemOpts extends Omit<Problem, "instance"> {
    instance?: string;             // default: c.req.path
}
```

### Core emitter

```ts
export function problem(c: Context, opts: ProblemOpts): Response;
```

Sets `Content-Type: application/problem+json` and the response status; preserves RFC 9457 extension members.

### Helpers (one per SCHEMA §5 catalog row)

One-line helpers, ~3 LOC each, over `problem()`. Required exports:

```ts
notFound(c, detail?)             // 404 urn:contract:not-found
slugInvalid(c, detail?)          // 400 urn:contract:slug-invalid
sessionRequired(c)               // 401 urn:contract:session-invalid
notOwner(c)                      // 403 urn:contract:not-owner
validationError(c, errors[])     // 422 urn:contract:validation-failed
preconditionRequired(c)          // 428 urn:contract:precondition-required
preconditionFailed(c, etag)      // 412 urn:contract:etag-mismatch
rateLimited(c, retryAfterSec)    // 429 urn:contract:rate-limited (sets Retry-After)
accountSuspended(c)              // 403 urn:contract:account-suspended
cursorInvalid(c, detail?)        // 400 urn:contract:cursor-invalid
idempotencyConflict(c)           // 409 urn:contract:idempotency-replay-conflict
softDeleted(c)                   // 410 urn:contract:soft-deleted
slugConflict(c)                  // 409 urn:contract:slug-conflict
adminNotConfigured(c)            // 503 urn:contract:admin-not-configured
adminForbidden(c)                // 403 urn:contract:admin-forbidden
ownerRequired(c)                 // 401 urn:contract:owner-required
flagSelf(c) / flagDuplicate(c)   // 400 / 409
payloadTooLarge(c, maxBytes)     // 413 urn:contract:payload-too-large
visibilityIllegalTransition(c)   // 409 urn:contract:visibility-illegal-transition
```

Helpers ~3 LOC × 20 rows = ~60 LOC; envelope + types + imports = ~80 LOC. Fits the 140 budget.

### Integration example

```ts
// Replace palettes.ts:346: `return c.json({ error: "Session token required" }, 401);`
import { sessionRequired, slugInvalid } from "../crud/errors.js";
if (!sessionToken) return sessionRequired(c);
if (!validateSlug(body.slug)) return slugInvalid(c, "Slug must match ^[a-z]+(-[a-z]+){3}$");
```

### Test surface (`api/test/crud/errors.test.ts`)

- `problem()` sets `Content-Type: application/problem+json`.
- Body has `{type, title, status, instance}` minimum.
- RFC 9457 extension members are preserved through `problem()`.
- Each helper emits the SCHEMA §5 row's exact `(type, status, title)` triple.
- `rateLimited` sets `Retry-After`.
- `validationError` body has `errors: [{path, message}]`.

---

## §4 — `etag.ts` — strong validator + If-Match

**Goal.** An 80-LOC module that introduces ETag + If-Match on
palette PATCH/DELETE (today's `palettes.ts:507,473` are unguarded
last-write-wins) — `W/"<hash[:16]>-<versionCount>"` shape per the
GitHub-API convention.

**What.** Three functions `computeETag`, `requireIfMatch`,
`etagResponse`; one interface `ETagDoc` that accepts both the contract
field `content_hash` and value.js's current `currentHash` (transition
aid only).

**Why.** Symmetry with U3; conformance: CS2.1, CS2.2, U-etag-1–5.

**Completion.** Eight `etag.test.ts` rows PASS (both field names
accepted; truncation; throws on missing field; undefined on match;
428 on absent If-Match; 412 on wrong; wildcard accepted; etagResponse
sets header).

**Budget**: ~80 LOC. **Mirrors U3** `crud/etag.py`.

Value.js does not implement ETags today; palette PATCH/DELETE (`palettes.ts:507`, `:473`) are unguarded last-write-wins. The contract requires ETag + If-Match per CRUD-CONTRACT §0 SOTA convention 2 and SCHEMA §1.

### Signatures

```ts
import type { Context } from "hono";

interface ETagDoc {
    content_hash?: string;
    currentHash?:  string;   // value.js field name; both accepted
    version_count?: number;
    versionCount?:  number;
}

/** `W/"<hash[:16]>-<versionCount>"`. Throws if either field is missing. */
export function computeETag(doc: ETagDoc): string;

/** Returns undefined on match; problem+json Response on absence/mismatch (caller `return`s). */
export function requireIfMatch(c: Context, expectedETag: string): Response | undefined;

/** Set the `ETag` response header from a document. */
export function etagResponse(c: Context, doc: ETagDoc): void;
```

ETag shape per CRUD-CONTRACT §0 SOTA 2 and R-identity §4e: `W/"<content_hash[:16]>-<version_count>"`. Truncates the hash to 16 hex chars (64 bits, ample for single-entity scope; GitHub-API convention). `requireIfMatch` honours RFC 9110 §13.1.1: accepts `*` wildcard and comma-separated lists.

**Field-name alias** (`content_hash` ∪ `currentHash`) is a *transition aid*, not a permanent surface. CRUD-CONTRACT names `content_hash`; value.js currently stores `currentHash` (`palettes.ts:415`, `hash.ts:13`). One name wins at C.W2 migration close (Wχ open item §11 below).

### Integration example

```ts
// In palettes.ts PATCH (today's :507; replaces last-write-wins):
const existing = await db.collection("palettes").findOne({ slug });
if (!existing) return notFound(c);
const mismatch = requireIfMatch(c, computeETag(existing));
if (mismatch) return mismatch;

await db.collection("palettes").updateOne(
    { slug },
    { $set: { ...updates, currentHash: newHash }, $inc: { versionCount: 1 } },
);
const updated = await db.collection("palettes").findOne({ slug });
etagResponse(c, updated!);
return c.json(formatPalette(updated!));
```

### Test surface (`api/test/crud/etag.test.ts`)

- `computeETag` accepts both `content_hash` and `currentHash`.
- Truncates hash to 16 chars (`W/"a3f1e2c4b5d6e7f8-7"`).
- Throws on missing field.
- `requireIfMatch` returns `undefined` on exact match.
- Returns 428 (precondition-required) on absent `If-Match`.
- Returns 412 (etag-mismatch) on wrong ETag.
- Accepts `*` and comma-separated list (RFC 9110 §13.1.1).
- `etagResponse` sets the `ETag` response header.

---

## §5 — `idempotency.ts` — Idempotency-Key middleware

**Goal.** A 110-LOC module owning the Mongo-backed Idempotency-Key
replay store with 24-hour TTL — implemented as a Hono middleware so
the route's `app.post("/", idempotent(store), handler)` form stays
the existing idiom (handler ownership preserved, not inverted).

**What.** One class `IdempotencyStore` with async factory `create()`;
one interface `IdempotencyRecord`; functions `hashBody` and
`idempotent(store)` (returning a `MiddlewareHandler`).

**Why.** Symmetry with U3; conformance: CS3.1, CS3.2, U-idem-1–3.

**Completion.** Seven `idempotency.test.ts` rows PASS (create
idempotent; middleware no-op without header; 400 on short key; first
call records; replay returns stored; different body 409; TTL).

**Budget**: ~110 LOC. **Mirrors U3** `crud/idempotency.py`.

Implements `Idempotency-Key` per CRUD-CONTRACT §0 SOTA convention 4 and SCHEMA §1. Storage is Mongo-backed with a TTL index (open item §12 of the contract decided "Mongo TTL collection"); 24-hour replay window.

### Types and store

```ts
import type { Db } from "mongodb";
import type { Context, Next } from "hono";
import type { AppEnv } from "../types.js";

export interface IdempotencyRecord {
    _id:        string;       // "<actor>:<key>"
    actor:      string;       // userSlug | sessionToken | "anonymous"
    key:        string;
    bodyHash:   string;       // sha256(canonical body)
    status:     number;
    response:   string;       // stored JSON body
    createdAt:  Date;
    expiresAt:  Date;         // createdAt + 24h
}

export class IdempotencyStore {
    static async create(): Promise<IdempotencyStore>;   // creates TTL index (idempotent)
    async get(actor: string, key: string): Promise<IdempotencyRecord | null>;
    async put(record: IdempotencyRecord): Promise<void>;
}

export function hashBody(body: unknown): string;          // sha256 hex
export function idempotent(store: IdempotencyStore): MiddlewareHandler;
```

### Middleware semantics

- No `Idempotency-Key` header → pass-through.
- Key pattern: `^[\x20-\x7e]{8,255}$`; violations return 400 problem+json.
- Actor = `c.get("userSlug") ?? c.get("sessionToken") ?? "anonymous"`.
- Existing record + body hash matches → replay stored `{status, response}` verbatim.
- Existing record + body hash differs → 409 problem+json `urn:contract:idempotency-replay-conflict`.
- New record → run `next()`; capture `c.res.status` and `c.res.clone().text()`; insert with `expiresAt = now + 24h`.

The TTL index `{ expiresAt: 1 }` with `expireAfterSeconds: 0` is created in `IdempotencyStore.create()` and is idempotent (matches `db.ts:21-75` collection-init pattern).

### Integration example

```ts
// In palettes.ts:
import { IdempotencyStore, idempotent } from "../crud/idempotency.js";
const idemStore = await IdempotencyStore.create();
palettes.post("/", idempotent(idemStore), async (c) => { /* existing handler */ });
```

### Test surface (`api/test/crud/idempotency.test.ts`)

- `IdempotencyStore.create()` is idempotent (second call: createIndex does not throw).
- Middleware no-ops without `Idempotency-Key`.
- 400 on key shorter than 8 chars.
- First call: handler runs; record stored.
- Replay with same key + body: stored response returned unchanged.
- Replay with same key + different body: 409 problem+json.
- TTL: record older than 24h is not returned (force-delete in test).

---

## §6 — `softdelete.ts` — `deleted_at` helpers

**Goal.** A 60-LOC module that retires `palettes.ts:491`'s hard-delete
and replaces it with a soft-delete that respects the 30-day grace
window per CRUD-CONTRACT §5.

**What.** One interface `SoftDeletable`; three functions
`notDeletedFilter`, `softDelete<T>`, `restore<T>(...graceDays?)`.

**Why.** Symmetry with U3; conformance: C5.1, C5.2, C5.3, U-soft-1–3.

**Completion.** Six `softdelete.test.ts` rows PASS (sets deleted_at;
idempotent re-delete; filter excludes soft-deleted; restore clears
deleted_at + sets restored_at; throws past-grace; throws not-found).

**Budget**: ~60 LOC. **Mirrors U3** `crud/softdelete.py`.

CRUD-CONTRACT §5 binds the `deleted_at: datetime | null` pattern. Value.js's `DELETE /palettes/:slug` at `palettes.ts:491` is a hard delete — retired at C.W2.

### Signatures

```ts
import type { Collection, Document, Filter } from "mongodb";

export interface SoftDeletable extends Document {
    slug:         string;
    deleted_at?:  Date | null;
    restored_at?: Date | null;
}

/** The default list filter — excludes soft-deleted rows. */
export function notDeletedFilter(): Filter<SoftDeletable>;

/** Soft-delete by slug. Idempotent (filter on `deleted_at: null` makes re-delete a no-op). */
export async function softDelete<T extends SoftDeletable>(
    collection: Collection<T>, slug: string,
): Promise<void>;

/** Restore. Throws "past-grace" if deleted_at < now - graceDays; "not-found" if absent. */
export async function restore<T extends SoftDeletable>(
    collection: Collection<T>, slug: string, graceDays?: number,
): Promise<void>;
```

Default `graceDays = 30` per CRUD-CONTRACT §5 (`SOFT_DELETE_GRACE_DAYS` env override at the call site). `restore` clears `deleted_at` via `$unset` and sets `restored_at` for audit.

### Integration example

```ts
// Replace palettes.ts:491 hard delete:
import { softDelete, restore } from "../crud/softdelete.js";
await softDelete(db.collection("palettes"), slug);
return c.json({ deleted: true });

// New restore route:
palettes.post("/:slug/restore", async (c) => {
    try { await restore(db.collection("palettes"), c.req.param("slug")); }
    catch (e) {
        if ((e as Error).message === "past-grace") return softDeleted(c);   // 410
        return notFound(c);
    }
    const doc = await db.collection("palettes").findOne({ slug: c.req.param("slug") });
    return c.json(formatPalette(doc!));
});
```

### Test surface (`api/test/crud/softdelete.test.ts`)

- `softDelete` sets `deleted_at` to a `Date`.
- Idempotent (re-delete is a no-op).
- `notDeletedFilter()` excludes soft-deleted rows from `find()`.
- `restore` clears `deleted_at` and sets `restored_at`.
- `restore` throws `past-grace` when `deleted_at < now - graceDays`.
- `restore` throws `not-found` on missing slug.

---

## §7 — `pinnedCron.ts` — bounded prune

**Goal.** An 80-LOC module that retires the unbounded `$nin` at
`cron.ts:18-24` per CRUD-CONTRACT §8 Option A — replacing it with the
indexed `{pinned: false, last_accessed_at: {$lt: cutoff}}` predicate.

**What.** Two functions `markPinned<T>(coll, query, pinned)` and
`cronPrune<T>(coll, cutoff, batchSize?)`; the two-step
`find→deleteMany` pattern bounds every operation.

**Why.** Symmetry with U3; conformance: C5.4, C8.1, C8.2, C8.4,
U-cron-1–3.

**Completion.** Seven `pinnedCron.test.ts` rows PASS (markPinned sets
flag; deletes pinned-false-old; leaves pinned alone; leaves new
unpinned alone; returns total deleted; correct batch count for
n>2·batchSize; no `$nin` source-grep).

**Budget**: ~80 LOC. **Mirrors U3** `crud/pinned_cron.py`.

Replaces the unbounded `$nin` at `cron.ts:18-24` per CRUD-CONTRACT §8 Option A: per-doc `pinned: bool` flag. Pattern: publish/restore sets `pinned: true`; soft-delete clears; cron prunes the bounded `{pinned: false, last_accessed_at: {$lt: cutoff}}` set in batches.

### Signatures

```ts
import type { Collection, Document, Filter } from "mongodb";

/** Set or clear `pinned` on documents matching a query. Returns matchedCount. */
export async function markPinned<T extends Document>(
    collection: Collection<T>, query: Filter<T>, pinned: boolean,
): Promise<number>;

/**
 * Bounded prune. Deletes `{pinned: false, last_accessed_at < cutoff}` in
 * batches of `batchSize` (default 1000). Returns total deletedCount.
 *
 * Bounded by the compound index (pinned, last_accessed_at); no `$nin`,
 * no `distinct()`, no collection scan.
 */
export async function cronPrune<T extends Document>(
    collection: Collection<T>, cutoff: Date, batchSize?: number,
): Promise<number>;
```

### Implementation note

Two-step per batch: `find({pinned:false, last_accessed_at:{$lt:cutoff}}, {projection:{_id:1}, limit:batchSize})` → `deleteMany({_id:{$in: ids}})`. Each Mongo operation is bounded by `batchSize`; the compound index `{pinned: 1, last_accessed_at: 1}` (CRUD-CONTRACT §8 C8.3) is required for the bounded plan and is added by `db.ts` at C.W2.

### Integration example

```ts
// Replace cron.ts:18-24 orphan-vote $nin:
import { cronPrune, markPinned } from "./crud/pinnedCron.js";
const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000);
await cronPrune(db.collection("palettes"), cutoff);

// On palette publish (palettes.ts POST after insert):
await markPinned(db.collection("palettes"), { slug }, true);
// On soft-delete (palettes.ts DELETE):
await markPinned(db.collection("palettes"), { slug }, false);
```

### Test surface (`api/test/crud/pinnedCron.test.ts`)

- `markPinned(_, _, true|false)` sets the flag on matching rows.
- `cronPrune` deletes `pinned:false` rows older than cutoff.
- Leaves pinned rows alone (even when old).
- Leaves unpinned-but-recent rows alone.
- Returns total `deletedCount` across batches.
- With a fixture of `n > 2·batchSize` rows: makes exactly `ceil(n/batchSize)` `deleteMany` calls (spy on collection).
- Source-grep: file contains no `$nin` and no `distinct(` (mechanical C8.1 gate).

---

## §8 — `index.ts` — public surface

**Goal.** A 30-LOC re-export file that establishes the canonical
`../crud/index.js` import path; every consumer imports from this file,
not from sub-modules directly.

**What.** Pure re-exports — every public symbol from the seven
sub-modules.

**Why.** A single import surface keeps consumer code terse; the
`.js` suffix matches the repo's existing ESM convention
(`palettes.ts:3` `from "../types.js"`).

**Completion.** Module imports without error; type-level checks pass
under `verbatimModuleSyntax`; U-meta-1 conformance row passes.

**Budget**: ~30 LOC. Pure re-exports — every consumer imports from `../crud/index.js`, not the sub-modules directly. ESM `.js` suffix on every `from` (the convention the repo already follows; `palettes.ts:3` `from "../types.js"`).

```ts
export { generateSlug, validateSlug, slugWithRetry } from "./slugs.js";
export type { SlugWords } from "./slugs.js";

export { encodeCursor, decodeCursor } from "./cursors.js";
export type { CursorPayload } from "./cursors.js";

export {
    problem, notFound, slugInvalid, sessionRequired, notOwner,
    validationError, preconditionRequired, preconditionFailed, rateLimited,
    accountSuspended, cursorInvalid, idempotencyConflict, softDeleted,
    slugConflict, adminNotConfigured, adminForbidden, ownerRequired,
    flagSelf, flagDuplicate, payloadTooLarge, visibilityIllegalTransition,
} from "./errors.js";
export type { Problem, ProblemOpts } from "./errors.js";

export { computeETag, requireIfMatch, etagResponse } from "./etag.js";

export { IdempotencyStore, idempotent, hashBody } from "./idempotency.js";
export type { IdempotencyRecord } from "./idempotency.js";

export { notDeletedFilter, softDelete, restore } from "./softdelete.js";
export type { SoftDeletable } from "./softdelete.js";

export { markPinned, cronPrune } from "./pinnedCron.js";
```

---

## §9 — Cross-reference to CRUD-CONTRACT §10

**Goal / Completion.** Map every CRUD-CONTRACT §10 row this module
touches to the test file that closes it; bidirectional traceability
holds with `CONFORMANCE-MATRIX.md`.

| §10 assertion | Sub-module | Test file |
|---|---|---|
| C1.2 — slug shape on read | `slugs.ts::validateSlug` | `crud/slugs.test.ts` + route integration |
| C2.1 — slug format on generate | `slugs.ts::generateSlug` | `crud/slugs.test.ts::shape` |
| C2.2 — collision retry | `slugs.ts::slugWithRetry` | `crud/slugs.test.ts::retry_on_dup_key` |
| C2.3 — no check-then-insert | `slugs.ts` (no `findOne` before insert) | `scripts/grep-no-check-then-insert.sh` |
| C4.x — visibility (route-level) | (consumers, not crud/) | `api/test/visibility/*.test.ts` |
| C5.1-C5.3 — soft-delete | `softdelete.ts` | `crud/softdelete.test.ts` |
| C5.4 / C8.1 — no unbounded `$nin` | `pinnedCron.ts` | `crud/pinnedCron.test.ts::no_nin_in_source` |
| C8.4 — cron idempotent | `pinnedCron.ts` (second tick returns 0) | `crud/pinnedCron.test.ts::second_tick_noop` |
| ETag / If-Match (§0 SOTA 2) | `etag.ts` | `crud/etag.test.ts` |
| Idempotency-Key (§0 SOTA 4) | `idempotency.ts` | `crud/idempotency.test.ts` |
| problem+json (§0 SOTA 3) | `errors.ts` | `crud/errors.test.ts` |
| Cursor pagination (§0 SOTA 1) | `cursors.ts` | `crud/cursors.test.ts` |

---

## §10 — Extract-don't-reimplement citations

**Goal / Completion.** Cite every existing value.js file:line this
spec *extracts* from — discharging the §0 KISS guard "no
re-implementation". One negative citation (`cron.ts:18-24`'s unbounded
`$nin`) is named as the surface this module *retires*.

This spec **extracts** from the following existing locations rather than re-deriving:

- `~/Programming/value.js/api/src/routes/palettes.ts:29-41` — cursor encode/decode → `cursors.ts`.
- `~/Programming/value.js/api/src/hash.ts:13-22` — content hash → consumed by `etag.ts::computeETag` (the hash function itself stays in `hash.ts`; `etag.ts` reads `currentHash` from the doc).
- `~/Programming/value.js/api/src/slugWords.ts:80-90` — `generateSlug` shape → `slugs.ts::generateSlug` (word source changes per U2).
- `~/Programming/value.js/api/src/slugWords.ts:92-99` — `generateUniqueSlug` retry → `slugs.ts::slugWithRetry` (pre-check loop replaced with insert-then-catch).
- `~/Programming/value.js/api/src/migrate-slugs.ts:25-67` — migration idempotency idiom (referenced; migrations stay in `src/migrate-*.ts`, not in `crud/`).
- `~/Programming/value.js/api/src/middleware.ts:235-254` — admin auth (stays in middleware, not `crud/`).
- `~/Programming/value.js/api/src/cron.ts:18-24` — negative citation: the unbounded `$nin` pattern `pinnedCron.ts` retires.

Per CRUD-CONTRACT §9, none of `crud/` is admitted to shared *code*: each repo carries its own `crud/` directory. The contract is the cross-repo binding; this module is value.js's realisation.

---

## §11 — Open items for Wχ

**Goal / Completion.** Enumerate the three spec-local open questions
(U2 word-list path resolution; `IdempotencyStore` lifecycle;
`computeETag` field-name compatibility); each names a destination
(C.W2 confirmation or migration close).

1. **U2 word-list path resolution.** `slugs.ts` assumes U2 supplies `slug-words.json` at a deterministic path. If U2 ratifies `@mkbabb/slug-words` (CRUD-CONTRACT §9 form (a)), the import line in `slugs.ts` changes from a `readFileSync(resolve(...))` to `import WORDS from "@mkbabb/slug-words/words.json" with { type: "json" };`. Confirm with U2 author before C.W2 lands.
2. **`IdempotencyStore` lifecycle.** `IdempotencyStore.create()` is async; instantiation happens at app boot, not per-request. Value.js's `index.ts` already uses top-level await for `getDb()`; same pattern applies. Confirm at C.W2.
3. **`computeETag` field-name compatibility.** The function accepts both `content_hash` and `currentHash` as a transition aid. One name wins at C.W2 migration close — most likely `content_hash` per CRUD-CONTRACT §1's hash policy block. Then `currentHash` becomes a migration alias only.

---

## §12 — Budget summary

**Goal / Completion.** Reconcile sub-module budgets against the
750-LOC ceiling (target ~500); the shape-verdict paragraph reaffirms
the no-framework-in-disguise discipline at the file-by-file level.

| Module | LOC budget | Most consequential signature |
|---|---|---|
| `slugs.ts` | ~120 | `slugWithRetry<T>(insertFn, maxAttempts?) → {slug, result: T}` |
| `cursors.ts` | ~50 | `decodeCursor(raw) → CursorPayload \| null` |
| `errors.ts` | ~140 | `problem(c, opts: ProblemOpts) → Response` |
| `etag.ts` | ~80 | `requireIfMatch(c, expected) → Response \| undefined` |
| `idempotency.ts` | ~110 | `idempotent(store) → MiddlewareHandler` |
| `softdelete.ts` | ~60 | `softDelete<T>(collection, slug) → Promise<void>` |
| `pinnedCron.ts` | ~80 | `cronPrune<T>(collection, cutoff, batchSize?) → Promise<number>` |
| `index.ts` | ~30 | (re-exports only) |
| **total** | **~670** | (target ~500; ceiling 750) |

**Shape verdict.** Every export is a free function or a small class with a single async factory. No `BaseCRUDRouter`. No method-based dispatch. No inheritance. The route handlers in `palettes.ts`, `sessions.ts`, `admin.ts` continue to own their lifecycle and call into `crud/` for the eight concerns above. This is the shape that falsifies Wχ probe P1 ("framework-in-disguise"): `palettes.post("/", idempotent(s), handler)` stays the existing Hono idiom; `crud/` is *called*, never *inverted into*.
