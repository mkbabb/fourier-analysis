# R-auth-spec — Authorisation, sessions, admin moderation (the A3 deep-research deliverable)

**Lane**: B / Wα — research wave / A3 — authorisation deep-research.
**Mode**: read-only; the deliverable is a normative spec proposal that drops cleanly into `coordination/CRUD-CONTRACT.md §3 (session model) + §6 (admin / moderation) + §7 (cross-cutting)`.
**Scope**: the fourier-analysis ⇄ value.js cohort. Cohort invariant 14 (typed non-null owner) is load-bearing throughout.

## Research-artefact discipline

This document is a *research artefact* — it records findings as of authoring time. The substance does not re-decide; the explication does. Every claim traces to a `file:line` citation; every ratified decision is preserved (the session-model verdict, the anonymous-publish rule, the 5-actor authorisation matrix, the batch-shape resolution, the rate-limit posture all stand as decided).

## Goal criterion (research-artefact framing)

This research lane succeeds if the authorisation surface — sessions, ownership, admin moderation, rate-limiting, cross-cutting concerns — is bounded enough to populate `CRUD-CONTRACT.md §3 / §6 / §7` and to supply the row substance for the corresponding `§10` conformance-matrix entries.

## Completion criterion (research-artefact framing)

The document closes when every divergence in §1's side-by-side table is resolved by an explicit decision (kept, adopted, converged-on, ratified, rejected), the headline summary holds, and the §9 open-questions list names exactly the items the Wχ — challenge wave's probes adversarially test.

---

## §1 — Current state, two-repo comparison

Both repos have **independently arrived at the same six-layer auth shape**: an opaque random session token in `X-Session-Token` header, a MongoDB session document keyed by the token, slug-as-user-id (no e-mail, no password), seven-day session TTL, in-process per-IP rate limiting, a single-static-Bearer admin token. The convergence is structural — variation lies in detail.

### 1a. Side-by-side

| Aspect | fourier-analysis | value.js | Convergence verdict |
|---|---|---|---|
| Token transport | header `X-Session-Token` (`api/dependencies.py:147`) | header `X-Session-Token` (`value.js/api/src/middleware.ts:141`) | **agreed** |
| Token shape | `str(uuid.uuid4())` (`api/routers/sessions.py:27`) | `crypto.randomUUID()` (`value.js/api/src/routes/sessions.ts:13`) | **agreed — UUIDv4** |
| Session storage | Mongo `sessions._id = token` (`sessions.py:52`) | Mongo `sessions._id = token` (`sessions.ts:30`) | **agreed — opaque server-side** |
| Session TTL | `expires_at = now + 7d` (`sessions.py:32`, `config.py:18`) | `expiresAt = now + 7d` (`sessions.ts:35,80`) | **agreed — 7 days** |
| User id | `users._id = slug` (`sessions.py:48`) | `users._id = slug` (`sessions.ts:23`) | **agreed** |
| Auth dependency | FastAPI `require_session` (`dependencies.py:192`) — explicit 401 if absent | Hono middleware `resolveSession` (`middleware.ts:140`) — *silently* sets `c.var.userSlug` if present; the route does the 401 | **diverges** — fourier rejects at the door; value.js defers. Spec: **explicit require / optional helper**. |
| Suspension check | post-resolve, with `_suspended_cache` 60 s TTL (`dependencies.py:24, 161-172`) | post-resolve, with `suspendedCache` 60 s TTL (`middleware.ts:138,154-170`) | **agreed — single-replica process-local cache, 60 s TTL** |
| Admin token | `Bearer ADMIN_TOKEN` + `hmac.compare_digest` (`dependencies.py:200-208`) | `Bearer ADMIN_TOKEN` + `crypto.timingSafeEqual` (`middleware.ts:235-254`) | **agreed — timing-safe Bearer** |
| Admin no-token posture | `503 Admin not configured` (`dependencies.py:203`) | `503 Admin not configured` (`middleware.ts:238`) | **agreed** |
| Admin in prod when token unset | `RuntimeError` at startup (`api/main.py:30`) | warn but boot (no equivalent guard) | **fourier wins** — adopt fourier's behaviour. |
| Rate-limit substrate | `SlidingWindowLimiter` in-memory keyed on **hashed IP** (`api/services/rate_limiter.py:50, 19`) | in-memory `Map<ip, {count, resetAt}>` keyed on **raw IP** (`middleware.ts:74-89, 91-93`) | **diverges** — fourier's hashing posture is correct. **Hash all rate-limiter keys.** |
| Rate-limit tiers | 4 named (`login=5/min`, `like=10/min`, `write=10/min`, `admin=30/min`, `compute=5/min`) (`rate_limiter.py:110-113, 132`) | 3 method-tiered (`read=60/min`, `write=10/min`, `register=3/min`, `login=5/min`) (`middleware.ts:91-93, 209`) | **mostly agreed** — converge on the named-tier shape (next §6). |
| Body-injection guard | `reject_dollar_keys` middleware (`api/main.py:76-93`) | `sanitizeBody` middleware (`middleware.ts:273-289`) | **agreed — keep** |
| CORS | explicit `allow_origins` from the `CORS_ORIGINS` env, credentials on, methods `[GET,POST,PUT,DELETE,OPTIONS]`, headers `[Content-Type, Authorization, X-Session-Token]` (`main.py:54-61`) | reflective `ALLOWED_ORIGINS` allowlist, credentials on, methods `[GET,POST,PATCH,DELETE,OPTIONS]`, headers `[Content-Type, X-Session-Token, Authorization]` (`middleware.ts:7-25`) | **agreed — converge on the explicit allowlist + credentials true + the union of methods (`+PATCH`).** |
| CSRF | none — relies on the header-required `X-Session-Token` not being settable by cross-origin forms | none — same posture | **agreed — header-required ⇒ no CSRF token. Document explicitly.** |
| IP resolution | `X-Forwarded-For` last-hop or `X-Real-IP` then `request.client` (`dependencies.py:125-136`) | trusted-proxy gate (127.0.0.1) then XFF / XRI (`middleware.ts:33-55`) | **value.js wins** — fourier today blindly trusts XFF. **Adopt the trusted-proxy gate.** |
| IP hashing | SHA-256, applied at usage site (`dependencies.py:139-141`, `rate_limiter.py:19`) | SHA-256, web-crypto, applied at usage site (`middleware.ts:300-306`) | **agreed** |
| Audit log | `db.admin_audit { timestamp, ip_hash, action, target }` (`api/routers/admin.py:50-59`); 90 d retention via janitor (`api/services/janitor.py:176-179`) | `db.admin_audit { timestamp, ipHash, action, target }` (`value.js/api/src/routes/admin.ts:12-26`); no documented retention | **agreed shape; converge on 90 d retention** |
| Audit on failure | fails closed (the write error propagates) | fails open (`try { … } catch { /* silently swallow */ }`, `admin.ts:24`) | **diverges** — see §5. Recommend **best-effort with a logged warning**, not silent swallow. |
| Batch return shape | `{ok: true, affected: N}` (`api/routers/admin.py:397, 451`) | `{processed: N}` (`value.js/api/src/routes/admin.ts:510, 559`) | **diverges — the H3-named contract bug.** Resolution in §5. |
| Anonymous publish | **admits orphans** — `resolve_session` may return `None`; the gallery insert proceeds with `user_slug: None` (`api/routers/gallery.py:206, 233`) | publish requires `userSlug` (palette routes, e-audit:25) | **fourier loses cohort invariant 14.** Resolution in §3. |
| Impersonation | none | `POST /admin/impersonate` mints a session for an arbitrary slug (`admin.ts:269-293`) — note: the inserted session has **no `expiresAt`** | **fourier-side feature gap + value.js correctness bug** (the un-expiring session). See §5. |

### 1b. Headline gaps

1. **Anonymous publish** orphans gallery rows in fourier (cohort invariant 14 violation; `gallery.py:206`).
2. **Admin batch contract** mismatch: the backends return different field names; the H3 audit named this latent because no Vue caller exists yet.
3. **Audit record shape** is convergent but minimal (no actor slug, no before / after diff, no resource-typed target).
4. **Rate-limit headers** are absent — neither repo emits `Retry-After` or `X-RateLimit-*`.
5. **Trusted-proxy gate** missing on the fourier side — XFF spoofable from arbitrary clients.
6. **Impersonation** session is un-expiring in value.js (`admin.ts:283-289` omits `expiresAt`).
7. **fourier's `SLUG_PATTERN`** at `api/dependencies.py:27` is named `SLUG_PATTERN` but is *only* applied to image slugs (`validate_image_slug`); user slugs are not pattern-validated on `/login` (`sessions.py:67`). The e-audit §3.6 confirmed.

---

## §2 — Session model spec

### 2a. SOTA framing

PASETO v4-local and JWT (RS256) were considered. Both bring user-visible complexity (revocation pain, jti-tracking, key rotation, crypto pitfalls in the `none`-algorithm class of bugs) without buying anything the cohort needs. Both repos already have **opaque-token + server-side session store**, which is the SOTA recommendation at this scale (Stripe, GitHub, Discord, every admin console). **Verdict: stay with opaque tokens + the Mongo session store.** JWT is rejected by KISS (invariant 12) and by invariant 16 (no superfluous machinery).

### 2b. Token

- **Shape**: UUIDv4 string. 128 bits of entropy. `crypto.randomUUID()` / `uuid.uuid4()`. **No prefix scheme** (e.g. `fa_…` / `v_…`). The token is opaque; the server identifies the cohort member by route, not by token byte.
- **Transport**: HTTP header `X-Session-Token`. **Not** a cookie. Header-required transport closes CSRF without a CSRF token (§7).
- **Storage at rest**: the Mongo `sessions` collection, `_id = token` (the token *is* the document key — there is no separate `token_hash` because tokens are random and database access already requires admin credentials).
- **Storage on client**: `localStorage["fourier-session-token"]` (fourier) / the equivalent on value.js. Document this as a known trade-off — `localStorage` exposes the token to any in-page script, but the alternative (`Secure; HttpOnly` cookie) re-introduces CSRF and we have no need to read the token from JS for anything beyond setting the header.

### 2c. Session document (canonical shape)

```python
# Python (fourier)
{
    "_id":           str,        # the token (UUIDv4)
    "user_slug":     str,        # FK → users._id, NOT NULL (invariant 14 for sessions)
    "ip_hash":       str,        # SHA-256(ip) at issue time
    "created_at":    datetime,   # UTC
    "last_seen_at":  datetime,   # touched on every resolve
    "expires_at":    datetime,   # absolute; created_at + 7 d
    "issued_by":     str | None  # 'register' | 'login' | 'admin-impersonate'
}
```

```typescript
// TypeScript (value.js)
interface Session {
  _id: string;          // token
  userSlug: string;     // NOT NULL
  ipHash: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  issuedBy: 'register' | 'login' | 'admin-impersonate';
}
```

**Mandated invariant**: `user_slug` is **non-null on every session row** (cohort invariant 14 for the session entity). The anonymous-session-as-distinct-user-slug is the only way a row can exist without a real user (§3c).

### 2d. Lifetimes

- **Absolute TTL**: **7 days** from `created_at`. Hard expiry — no auto-extension. Matches both repos today (`config.py:18`, `sessions.ts:35`).
- **Idle TTL**: none. `last_seen_at` is recorded for janitor observation only; it does not gate auth. (Adding an idle-TTL adds a knob without a forcing requirement — declined.)
- **Refresh**: **none — re-issue, don't refresh.** The client re-registers / re-logins to obtain a new token when the current one expires. There is **no `/refresh` endpoint**. Rationale: refresh tokens are a JWT-shaped solution to a JWT-shaped problem. With server-side sessions, "refresh" is `DELETE /sessions` + `POST /sessions/login`.
- **Janitor**: deletes `sessions` where `expires_at < now()` and `users` where `last_seen_at < now() - user_max_age_days` (today: `janitor.py:122,131`). The spec retains this.

### 2e. Suspension propagation (single-replica honesty)

- `resolveSession` checks `users.status === 'suspended'` post-resolve, with a 60 s in-process cache (`api/dependencies.py:24, 161-172`; `middleware.ts:138, 154-170`).
- **Inherited from the fourier-A.W4 — image storage cleanup wave's Option A**: single-replica is the documented production posture. The 60 s cache is acceptable on one replica; on > 1 replicas, suspension lag is up to 60 s on the unaffected replica. This is named, not hidden — `docker-compose.prod.yml` is pinned to `replicas: 1`, and `api/dependencies.py:24` carries a `# IMPORTANT: single-replica state` block (B inherits A's deploy note).
- **Eager invalidation**: on `POST /admin/users/{slug}/status` and `DELETE /admin/users/{slug}`, the admin endpoint *also* deletes the user's sessions immediately (`admin.py:273`, `admin.ts:316`). The cache updates in-process via `mark_suspended_in_cache` (`admin.py:274`). The 60 s lag is therefore the upper bound on *cross-replica* lag, not on same-replica lag.

### 2f. Endpoints (canonical)

| Method | Path | Auth | Purpose | Returns |
|---|---|---|---|---|
| POST | `/api/sessions` | none + `register_limiter` | Create user + session (anonymous-onboarding) | `{token, user_slug}` 201 |
| POST | `/api/sessions/login` | none + `login_limiter` | Re-acquire session for an existing slug | `{token, user_slug}` 200 |
| GET | `/api/sessions/me` | required | Whoami | `{user_slug, created_at}` |
| DELETE | `/api/sessions` | optional (no-op if header absent) | Logout | `{ok: true}` |

`/login` carries a **constant 200 ms delay on every path** (`sessions.py:75`, `sessions.ts:62`) to flatten the user-found vs user-absent timing channel. Retain.

---

## §3 — Ownership spec

### 3a. The invariant

Cohort invariant 14: **every persisted entity has a non-null owner.** Today fourier violates this for gallery entries published from anonymous sessions (`api/routers/gallery.py:206`: `user_slug = await resolve_session(request)` may be `None`, then inserted at `:233`).

### 3b. Ownership assignment

| Entity | Owner field | Set on | Required? |
|---|---|---|---|
| User | n/a (self-owned) | `POST /sessions` | self |
| Session | `user_slug` | `POST /sessions`, `/sessions/login` | yes, non-null |
| Image (fourier) | `owner_slug` (new field) | `POST /images` body or session-derived | yes — **invariant 14 closure** |
| Contour | `owner_slug` (derived from `image.owner_slug`) | `POST /contours` | yes |
| Visualization (B's converged entity) | `owner_slug` | `POST /visualizations` | yes |
| Gallery entry / publish action | `owner_slug` | `POST /visualizations/{slug}/publish` (visibility=public) | yes |
| Flag | `reporter_slug` | `POST /visualizations/{slug}/flag` | yes (anonymous flagging rejected) |
| Palette (value.js) | `userSlug` | `POST /palettes` | yes |

### 3c. Anonymous publish — the decision

**Verdict: admit + force a real session-bound owner. Reject the orphan path.**

`POST /visualizations` and `POST /visualizations/{slug}/publish` **require** `X-Session-Token`. Anonymous callers receive 401. The frontend mediates this transparently: on the first interaction that would trigger a save / publish, the client calls `POST /sessions` automatically (the existing `ensureUser()` pattern in `web/src/stores/auth.ts`) and proceeds with the resulting token. **The user never sees a login wall** — anonymity is preserved at the *human* level (no email, no password, just a slug minted on demand) while the *system* level honours invariant 14 unconditionally.

**Rejected alternatives**:

- *Synthesise an `anon-NNN` owner slug.* Creates a new identity class with no `last_seen_at`, no janitor membership, no way to claim posts. Adds complexity to satisfy an invariant we can satisfy by enforcing the existing `ensureUser` path. Rejected.
- *Continue admitting `user_slug: None`.* Violates invariant 14. Rejected by the cohort.

**Migration of existing orphans (cohort invariant 17)**: the W3 — fourier visualization entity wave's migration assigns a synthesised `anon-migrated-NNN` slug to every pre-existing `user_slug: None` gallery row, inserts a `users` doc with `status: 'orphan-migrated'` and `created_at: <original created_at>`, and proceeds. The synthesised slug is **only** used for legacy backfill — new orphans cannot be created post-cutover. This is the one and only place the `anon-*` slug class appears in the system. Document at the `R5-migration.md` cross-reference.

### 3d. Ownership transfer

- **Out of scope for B.** No `/transfer` endpoint. The user-facing "fork" operation (value.js calls this `forkOf`) is *not* a transfer — it duplicates the entity with a new owner and a backreference. Transfer-of-ownership is a v2 feature with its own contract.

### 3e. Ownership surrender

- `DELETE /api/sessions/{slug}` (admin) cascade-deletes the user's sessions, gallery entries, flags they filed, but **not** flags filed *against* them. Today both repos do this (`admin.py:283-319`, `admin.ts:323-344`).
- A user "deleting their account" is the same operation, just self-initiated. Reuse: `DELETE /api/users/me` (auth required, alias for the cascade).
- **No tombstone owner-slug retention.** Once the user is deleted, the slug is *available* for re-registration (slug-collision is statistically rare for the 4-word slug space, ~10¹⁰, e-audit §3.6). Document this — a future user with the same generated slug is **not** the same human. Slug stability is *intra-lifetime*, not cross-lifetime.

---

## §4 — Authorisation policy table

The canonical resource-action-actor matrix. Drops into `CRUD-CONTRACT.md §3.4`.

**Actor classes**:

- `public` — no `X-Session-Token` header.
- `session` — valid `X-Session-Token` resolving to an active (non-suspended) `user_slug`.
- `owner` — `session` where `session.user_slug == resource.owner_slug`.
- `admin` — valid `Bearer ADMIN_TOKEN`.

`admin` is **disjoint** from `session` — an admin acting in admin capacity does not also acquire ownership. Admin actions are always audit-logged. An admin who wishes to act as themselves uses their own session token (a separate identity).

| Resource | Action | public | session | owner | admin |
|---|---|---|---|---|---|
| `users` | read self (`/sessions/me`) | — | allow | allow | — |
| `users` | create (`POST /sessions`) | allow (rate-limited) | allow | allow | — |
| `users` | suspend / unsuspend | deny | deny | deny | **allow** |
| `users` | delete | deny | deny (own: see `/users/me`) | **allow (own only)** | **allow** |
| `users` | impersonate | deny | deny | deny | **allow** (mints owned session) |
| `visualizations` | read public | allow | allow | allow | allow |
| `visualizations` | read unlisted | allow with slug | allow with slug | allow | allow |
| `visualizations` | read draft | deny | deny (others') | **allow (own)** | allow |
| `visualizations` | list mine | deny | **allow (filter `owner_slug=self`)** | — | **allow (any filter)** |
| `visualizations` | create | deny | **allow** | — | — |
| `visualizations` | update | deny | deny (others') | **allow (own)** | **allow (audit-logged)** |
| `visualizations` | delete | deny | deny (others') | **allow (own, soft-delete)** | **allow (hard or soft, audit-logged)** |
| `visualizations` | publish (set visibility=public) | deny | deny (others') | **allow (own)** | allow |
| `visualizations` | set tier (featured / saved / normal) | deny | deny | deny | **allow** |
| `visualizations` | flag | deny | **allow (not own)** | deny (own) | n/a |
| `visualizations` | like / view | allow (IP-keyed) | allow | allow | allow |
| `flags` | dismiss | deny | deny | deny | **allow** |
| `admin_audit` | read | deny | deny | deny | **allow** |

**Rules of construction**:

1. The table is **closed-by-default**: any row that is not `allow` is `deny`. Middleware enforces; routes do *not* re-check.
2. **Ownership precedes session**: a `session` row only matches if `session && !owner` (the owner case wins).
3. **Admin override is explicit**: the table never writes "deny (admin)" — an admin action that should be forbidden requires removing the admin row outright (none in the current matrix).
4. **Suspended sessions are not `session`**: `resolveSession` raises 403 *before* the policy table is consulted (`dependencies.py:165-170`).

---

## §5 — Admin moderation contract

### 5a. Resources and actions

| Resource | Action | Method + Path | Returns |
|---|---|---|---|
| visualization | set tier | `PUT /api/admin/visualizations/{slug}/tier` | `VisualizationResponse` |
| visualization | delete | `DELETE /api/admin/visualizations/{slug}` | `{ok: true, affected: 1}` |
| user | list | `GET /api/admin/users?page,limit,sort,q` | `{items, total, page, pages}` |
| user | set status | `POST /api/admin/users/{slug}/status` | `{slug, status}` |
| user | delete (cascade) | `DELETE /api/admin/users/{slug}` | `{ok: true, affected: 1, deleted_entries: N}` |
| user | prune empty | `POST /api/admin/users/prune-empty` | `{ok: true, affected: N}` |
| user | impersonate | `POST /api/admin/users/{slug}/impersonate` | `{token, user_slug}` (the session has `expires_at`!) |
| flag | list flagged | `GET /api/admin/flagged?page,limit` | `{items, total, page, pages}` |
| flag | dismiss | `DELETE /api/admin/flags/{slug}` | `{ok: true, affected: N}` |
| audit | list | `GET /api/admin/audit?page,limit,action,target,after,before` | `{items, total, page, pages}` |
| batch | visualizations | `POST /api/admin/visualizations/batch` | `{ok: true, affected: N, errors: []}` |
| batch | users | `POST /api/admin/users/batch` | `{ok: true, affected: N, errors: []}` |

### 5b. Batch return-shape resolution — the H3 contract bug

The H3 audit named the latent mismatch: fourier returns `{ok: true, affected: N}` (`api/routers/admin.py:397, 451`); value.js returns `{processed: N}` (`value.js/api/src/routes/admin.ts:510, 559`); the fourier frontend type declares `{processed: N}`.

**Verdict — converge on fourier's shape, with an `errors` array added for partial-failure honesty:**

```json
{
  "ok": true,
  "affected": 23,
  "errors": [
    { "slug": "bad-slug", "code": "not_found" },
    { "slug": "rate-limited", "code": "internal" }
  ]
}
```

Rationale:

- `affected` is the unambiguous SQL / Mongo verb (`modifiedCount`, `deletedCount`); `processed` ambiguates between "attempted" and "succeeded".
- `errors: []` is the **always-present** array (empty on full success). This forces every batch caller to handle partial failure — the latent bug at `admin.py:451` is that delete-loop failures are silently swallowed via `affected += result.deleted_count` (a not-found user contributes 0 and goes uncounted-as-error).
- `ok` is **redundant with HTTP 200** but kept for grep-ability and parity with the singular-action endpoints. The frontend `if (resp.ok && resp.affected > 0)` is the canonical idiom.

Action: the W1 — CRUD-contract ratification wave sets this shape; the W3 — fourier visualization entity wave + the W4 — fourier convergence wiring wave migrate the fourier endpoints; the value.js peer-tranche C migrates the value.js endpoints (held DEFERRED under the orphan verdict).

### 5c. Audit record — canonical shape

SOTA pattern: **append-only event log; one row per privileged action; actor, action, resource, timestamp, before / after diff.** Today both repos emit `{timestamp, ip_hash, action, target}` — a thin string-target, no actor slug, no diff. B promotes to the SOTA shape:

```python
# api/models/admin.py (W3 — fourier visualization entity wave)
class AuditEntry(BaseModel):
    timestamp:    datetime           # UTC, indexed -1
    actor:        AuditActor         # who did it
    action:       str                # verb; namespaced; e.g. 'visualization.set_tier'
    resource:     AuditResource      # what was acted on
    diff:         AuditDiff | None   # before / after for updates; None for create / delete
    request_id:   str | None         # correlate with access logs
    note:         str | None         # free-form admin reason

class AuditActor(BaseModel):
    kind:         Literal['admin', 'system', 'user']
    user_slug:    str | None         # set when impersonating or when 'user'
    ip_hash:      str

class AuditResource(BaseModel):
    kind:         Literal['user', 'visualization', 'flag', 'palette', 'image']
    id:           str                # the slug / hash / object id
    owner_slug:   str | None         # captured at action time (denormalised on purpose)

class AuditDiff(BaseModel):
    before:       dict | None        # entity snapshot pre-change; key subset only
    after:        dict | None        # entity snapshot post-change
```

Wire-format example for "admin features visualization":

```json
{
  "timestamp":  "2026-05-19T14:23:11.482Z",
  "actor":      { "kind": "admin", "user_slug": null, "ip_hash": "a3f…" },
  "action":     "visualization.set_tier",
  "resource":   { "kind": "visualization", "id": "happy-rosy-fox-leaf", "owner_slug": "merry-bold-cat-bell" },
  "diff":       { "before": { "tier": "normal" }, "after": { "tier": "featured" } },
  "request_id": "req_01HXY…",
  "note":       null
}
```

**Action verbs are namespaced** (`<resource>.<verb>`): `user.suspend`, `user.unsuspend`, `user.delete`, `user.prune_empty`, `user.impersonate`, `visualization.set_tier`, `visualization.delete`, `visualization.batch_delete`, `visualization.batch_feature`, `visualization.batch_unfeature`, `flag.dismiss`, `tag.create`, `tag.delete`. The string is the join key for filter UIs and for grep-based forensics; case-insensitive. Index `(action, timestamp -1)` already exists in value.js (`db.ts:74`); add to fourier (`api/services/database.py`).

**Retention**: 90 days (`janitor.py:176-179`). Adopt for value.js (currently un-bounded).

**Failure mode**: best-effort with a logged warning. Today fourier propagates audit-write failures (the surrounding action also fails — *too strict*); value.js silently swallows them (*too loose*). **Verdict: log a `WARNING` and continue.** The privileged action is the source of truth; the audit row is the observation. Losing one observation does not justify rolling back a deletion. (Distinguish from the access-log: the action's HTTP 200 is always logged at the nginx / access layer.)

### 5d. Idempotency

POST / DELETE admin actions accept an **optional** `Idempotency-Key` header (Stripe convention; RFC draft `draft-ietf-httpapi-idempotency-key-header`):

- If present, the server records `{key, action, resource, response_hash}` keyed by `(actor.user_slug or 'admin', key)` for 24 h.
- A repeat call with the same key returns the stored response with HTTP 200 (not re-executing the side effect).
- A repeat call with the same key but a *different* body returns HTTP 422 `Idempotency-Key conflict`.
- Missing header is allowed — the admin UI doesn't have to opt in; it's available for scripted callers.

Storage: the `idempotency_keys` collection with a TTL index on `expires_at`. KISS — no Redis, no in-memory cache (would break under restart).

### 5e. Impersonation

The value.js endpoint at `admin.ts:269-293` mints a session for an arbitrary slug **without setting `expiresAt`** — that session is permanent. Bug.

**Spec**: impersonation sessions carry `expires_at = now + 1h` (shorter than the normal 7 d), `issued_by = 'admin-impersonate'`, and an `impersonator_ip_hash` field on the session row. The admin endpoint audit-logs `user.impersonate` with the target user as `resource.id`. The impersonator's IP — not the target's — is captured on the session for later forensics.

---

## §6 — Rate-limit spec

### 6a. Substrate (fourier-A.W4 Option A inheritance)

Inherited verdict from the fourier-A.W4 — image storage cleanup wave: **single-replica, process-local sliding-window in-memory limiter, keyed on hashed IP, documented as single-replica in the deploy surface.** `docker-compose.prod.yml` is pinned to `replicas: 1` (the fourier-A.W4 deploy note). B does not revise.

### 6b. Tiers (converged)

| Tier | Limit | Window | Applies to |
|---|---|---|---|
| `read` | 60 req | 60 s | All GETs (default) |
| `write` | 10 req | 60 s | POST / PUT / PATCH / DELETE on owned resources |
| `register` | 3 req | 60 s | `POST /sessions` (new-user creation) |
| `login` | 5 req | 60 s | `POST /sessions/login` |
| `like` | 10 req | 60 s | `POST /visualizations/{slug}/like` |
| `flag` | 5 req | 60 s | `POST /visualizations/{slug}/flag` |
| `compute` | 5 req | 60 s | Heavy compute endpoints (`/api/equations/compute`, `/api/contours/extract`) |
| `admin` | 30 req | 60 s | All `/api/admin/*` |

fourier today: `login=5`, `like=10`, `write=10`, `admin=30`, `compute=5` (`rate_limiter.py:110-113, 132`). value.js today: `read=60`, `write=10`, `register=3`, `login=5` (`middleware.ts:91-93, 209`). The merged table above is the union plus a new `flag=5` (parity with `login`'s anti-abuse posture; absent from both repos today).

### 6c. Key

**Always `SHA-256(ip)`.** value.js currently uses raw IP in the rate-limiter map (`middleware.ts:74-89`); B converges on the hashed form (fourier's `rate_limiter.py:19`). Rationale: the map is in-memory and short-lived, but the cohort posture is "no raw IP at rest in any cache, log, or DB row." Hash at admission.

**Per-session vs per-IP**: the limit is **per-IP** by default. Per-session would be defeated by the trivial "discard token, re-register" attack at the `register=3/min` tier. The `register` and `login` tiers in particular must remain per-IP. Authenticated `write` actions may *additionally* be per-`user_slug` rate-limited in a future tranche; not in B's scope.

### 6d. Response headers

On every response from a rate-limited endpoint:

```
X-RateLimit-Limit:     <max_requests>
X-RateLimit-Remaining: <max_requests - count_in_window>
X-RateLimit-Reset:     <unix-epoch seconds when window resets>
```

On 429:

```
HTTP/1.1 429 Too Many Requests
Retry-After: <seconds>
{"detail": "Rate limit exceeded. Please try again later.", "tier": "<tier>"}
```

Today both repos return 429 without these headers (`rate_limiter.py:98-101`, `middleware.ts:124`). B adds them — pure observability win, no semantic change.

### 6e. Multi-replica honesty

The single-replica constraint is **declared in code** at `api/services/rate_limiter.py`'s top-of-file and `api/dependencies.py:24`:

```python
# IMPORTANT: single-replica process-local state. Under >1 replicas:
#   - Rate budgets are per-replica (2x global budget at 2 replicas).
#   - Suspension propagation lags by up to _SUSPENSION_CACHE_TTL (60s)
#     on the replica that did not handle the admin action.
# Deploy posture is `docker-compose.prod.yml: replicas: 1` (A.W4 close).
# To scale out, replace _buckets and _suspended_cache with a Mongo-backed
# store with a TTL index — file as a successor tranche, not pre-built.
```

This block is a B-acceptance test: `grep -n 'single-replica' api/services/rate_limiter.py api/dependencies.py` must return non-empty.

---

## §7 — Cross-cutting

### 7a. CSRF

**Posture: no CSRF token.** The session token rides in `X-Session-Token` (a custom request header) — cross-origin requests cannot set custom headers without a CORS preflight, and the CORS allowlist (§7b) rejects all origins not in `ALLOWED_ORIGINS`. There is therefore no cross-origin attack surface that would benefit from a CSRF token.

**Constraint**: cookies must **not** be used for session transport. Switching to cookies would re-introduce CSRF and require a token. Document this at the top of `api/routers/sessions.py`.

### 7b. CORS

```
Access-Control-Allow-Origin:      <reflected if in ALLOWED_ORIGINS, else first allowed>
Access-Control-Allow-Methods:     GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers:     Content-Type, Authorization, X-Session-Token, Idempotency-Key
Access-Control-Allow-Credentials: true
Access-Control-Max-Age:           600
```

- **No wildcard origin in production.** `ALLOWED_ORIGINS` is required to be non-empty; if empty, both repos refuse to start in production (fourier already does this for `ADMIN_TOKEN` at `main.py:30`; extend the pattern).
- `Allow-Credentials: true` is *required* despite no cookies — `localStorage`-stored tokens go in `X-Session-Token`, which is not a credential, but the value.js middleware sets credentials true today (`middleware.ts:23`) and removing it has no benefit.
- `Idempotency-Key` is added to the allowed headers (§5d).

### 7c. Trusted-proxy IP resolution

Adopt value.js's posture (`middleware.ts:34-55`) on the fourier side. Only trust `X-Forwarded-For` / `X-Real-IP` when the connecting peer is `127.0.0.1` / `::1` / `::ffff:127.0.0.1` (the local nginx). From an untrusted peer, ignore the headers and use the raw connection IP. This closes the XFF-spoofing-from-arbitrary-clients gap noted in §1b.

### 7d. Idempotency keys (cross-reference §5d)

Header: `Idempotency-Key: <ascii printable, 8–64 chars>`. Storage: the `idempotency_keys` collection (Mongo), TTL 24 h, key `(actor, key)`. Scope: all POST / PUT / PATCH / DELETE on `/api/admin/*` and `/api/visualizations/*`. Optional on the caller side; never required.

### 7e. Body-injection guard

Retain both `reject_dollar_keys` (`api/main.py:76-93`) and `sanitizeBody` (`middleware.ts:273-289`). Test gate: a POST with `{"x": {"$gt": ""}}` returns HTTP 400.

### 7f. Audit-log retention

90 days, single source: the janitor. fourier today; value.js absent (B converges). `db.admin_audit.create_index([("timestamp", -1)])` already exists in value.js (`db.ts:73`); fourier needs the equivalent — verify at `api/services/database.py`.

---

## §8 — Citations and grep gates

Every claim in this spec traces to:

- `api/dependencies.py:24,27,125-141,144-198,200-208`
- `api/routers/sessions.py:23-33,36-54,57-82,85-90,93-100`
- `api/routers/admin.py:50-59,67-71,124-163,166-355,362-451,459-534,542-579`
- `api/routers/gallery.py:189-244,299-313,316-336,339-368`
- `api/services/rate_limiter.py:16-103,110-113,132`
- `api/services/janitor.py:122,131,176-179`
- `api/main.py:30-39,48-93`
- `api/config.py:10,16,18`
- `api/models/admin.py:31-103`
- `value.js/api/src/middleware.ts:7-25,33-55,57-133,135-181,183-231,233-254,257-289,291-306`
- `value.js/api/src/routes/sessions.ts:10-39,42-90,93-101,104-121`
- `value.js/api/src/routes/admin.ts:1-26,269-293,295-321,323-344,476-511,513-560,629-696,702-748`
- `value.js/api/src/db.ts:72-74`
- `value.js/api/src/types.ts:1-6`

Prior-audit cross-refs:

- `docs/audits/runs/2026-05-18-fourier-tranche/e-crud-slug-valuejs.md` §3.6 (the slug-pattern gap), §4a (orphan publish), §5 (single-replica honesty).
- `docs/audits/runs/2026-05-18-fourier-tranche/f-design-math-functionality.md` §1b (admin a11y, the audit-viewer dead half).
- `docs/audits/runs/2026-05-18-tranche-harden/h3-A-W4-W5-W6.md` row "Batch endpoints" — the `{processed}` vs `{ok, affected}` contract bug — resolved in §5b above.

---

## §9 — Open questions for the Wχ — challenge wave

Three items the challenge wave should probe:

1. **Impersonation scope** — should `POST /api/admin/users/{slug}/impersonate` exist at all in fourier (it doesn't today), or is it value.js-specific debugging machinery that should be removed from the converged contract? Recommend **keep, but specify** (audit-logged, time-bounded), per §5e.
2. **Anonymous-onboarding UX** — the §3c "client transparently registers" idiom must not introduce a race where a slow `POST /sessions` orphans the user's first publish action. The frontend store (`web/src/stores/auth.ts`) must serialise `ensureUser() → publish()`. Probe: is the current store already serialising this?
3. **Audit `diff` size** — for batch operations, `diff.before` / `diff.after` could grow unbounded. Bound to a hard 4 KB per row; truncate with an explicit `…truncated` marker. Probe: is 4 KB enough for the largest realistic update (visualization rename + tier set)?

---

## Headline summary (≤ 350 words)

**Session-model verdict.** Stay with opaque UUIDv4 in `X-Session-Token`, the Mongo-backed session store, a 7-day absolute TTL, no refresh, no JWT, no PASETO. Both repos already do this — the SOTA recommendation at this scale (the Stripe / GitHub model). JWT / PASETO buy nothing the cohort needs and bring revocation pain. The single divergence to resolve: `localStorage`-stored token over a header-required transport — keep, document the trade-off, document why cookies + CSRF is rejected.

**Ownership rule for anonymous publish.** Reject the orphan path. `POST /visualizations` and `POST /publish` require a session; the frontend mediates this transparently by calling `POST /sessions` (the `ensureUser()` pattern) on first save / publish. The user never sees a login wall; the system never sees a null owner. Synthesised `anon-NNN` owner slugs are rejected (a new identity class to satisfy an invariant we already satisfy by enforcing existing code). The W3 — fourier visualization entity wave's migration assigns `anon-migrated-NNN` slugs to existing orphan rows; new orphans cannot be created post-cutover.

**Authorisation policy table headline.** Five-actor model: `public`, `session`, `owner` (`session && session.user_slug == resource.owner_slug`), `admin` (Bearer). Closed-by-default — middleware enforces, routes do not re-check. Eight resource rows cover the converged surface (`users`, `visualizations`, `flags`, `admin_audit` and the action verbs each accepts). `owner` precedes `session`; `admin` is disjoint from `session` (audit-logged whenever used).

**Admin batch-return shape resolution.** Converge on `{ok: true, affected: N, errors: []}` — fourier's `affected` verb wins over value.js's ambiguous `processed`; `errors: []` becomes the always-present array, forcing partial-failure handling and closing the latent "silent zero-counted not-found" bug at `api/routers/admin.py:451`.

**Rate-limit posture.** Inherit the fourier-A.W4 Option A — single-replica, in-memory sliding-window, SHA-256-hashed-IP keyed. Add `X-RateLimit-*` and `Retry-After` headers on 429. Trusted-proxy gate for XFF (the fourier-side gap; adopt value.js's posture). Tier table: `read=60/m`, `write=10/m`, `register=3/m`, `login=5/m`, `like=10/m`, `flag=5/m`, `compute=5/m`, `admin=30/m`. The single-replica constraint declares in code (`grep 'single-replica'` is the test gate).
