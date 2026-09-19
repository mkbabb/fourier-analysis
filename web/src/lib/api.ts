import type {
    AnimationData,
    ContourAsset,
    ContourSettings,
    EpicycleData,
    ImageMeta,
    GalleryTier,
    SessionResponse,
    UserInfo,
    AdminStats,
    AdminUserListResponse,
    FlaggedCursorResponse,
    AuditListResponse,
    BatchResponse,
    Visibility,
    Visualization,
    VisualizationCreate,
    VisualizationPatch,
    VisualizationListResponse,
    WithETag,
} from "./types";

const BASE = import.meta.env.VITE_API_URL || "";

// ── Converged `visualization` entity (CRUD-CONTRACT §1–§5; SCHEMA.md §3) ──
//
// The contract types now live canonically in `./types` (inv-26: one source of
// truth). They are re-exported here so the ~14 call sites importing them from
// `@/lib/api` resolve unchanged.
export type {
    Visibility,
    Visualization,
    VisualizationCreate,
    VisualizationPatch,
    VisualizationListResponse,
    WithETag,
};

// ── Session token management ──

let sessionToken: string | null = null;

export function setSessionToken(token: string | null) {
    sessionToken = token;
}

/**
 * Per-key AbortController registry. Calling `abortable(key)` cancels any
 * in-flight request for that key and returns a fresh AbortSignal.
 */
const inflight = new Map<string, AbortController>();

function abortable(key: string): AbortSignal {
    inflight.get(key)?.abort();
    const ac = new AbortController();
    inflight.set(key, ac);
    return ac.signal;
}

export function abortInflight(keys: string[]) {
    for (const key of keys) {
        inflight.get(key)?.abort();
        inflight.delete(key);
    }
}

/** Check if an error is an abort (not a real failure). */
export function isAbortError(e: unknown): boolean {
    return e instanceof DOMException && e.name === "AbortError";
}

// ── E.W5 — Parametric fetch core (T-E1 + T-S5 collapse) ──
//
// One core replaces the 4 pre-W5 helpers (apiFetch / apiFetchWithETag /
// adminFetch / eqFetch). The named wrappers below are thin pass-throughs
// preserving the per-call-site signatures; the duplicated header assembly,
// body branching, error parsing, and JSON parse all consolidate here.
//
// Per CONSUMER-HARDENING.md §5: this collapse retires the 2 `as unknown
// as` survivors at equation/api.ts:36+53 structurally — the `body` axis
// is typed as `FormData | Record<string, unknown> | BodyInit | undefined`,
// a structural union that accepts any serialisable object without a cast.

import { ApiProblem, readRateLimitResetSeconds } from "./api-problem";

export type CoreAuth = "session" | "admin" | "none";

/**
 * SP-12's `getAdminToken()!` type-lie, cured where it is caused (`AA-28` =
 * `FR-AFP-25` = `FR-AUL-30` = `GM-23`, the guard-posture family row).
 *
 * The store's accessor has always returned `string | null`; this seam demanded
 * `string`, so every admin call site had to assert the null away with `!` —
 * eleven of them — and the three call-site families then invented three
 * different answers for a null that the type said could not happen: an
 * assertion (the admin panels), a toast (`GalleryView`'s batch flow), and a
 * silent `return` (`stores/gallery.ts`). The seam now ACCEPTS the null the
 * store can produce and answers it once, so the three postures collapse to one
 * and the `!` at the call sites is inert rather than load-bearing.
 */
export type AdminToken = string | null;

/**
 * `urn:fourier:admin-token-missing` — the one answer to a missing admin token.
 *
 * Before this, the null path threw `new Error("coreFetch: auth='admin'
 * requires adminToken")` and five admin-facing toasts rendered that internal
 * sentence verbatim to an operator (`FR-AUL-30`, `FR-AFP-25`). It is now an
 * `ApiProblem`, so `problemMessage()` reads its `detail` and every existing
 * catch reports a sentence written for the person reading it.
 */
export const ADMIN_TOKEN_MISSING = "urn:fourier:admin-token-missing";

export interface CoreFetchOptions extends Omit<RequestInit, "body" | "signal"> {
    /** Body branches: FormData (multipart); any object (JSON-serialised); or raw BodyInit. */
    body?: FormData | BodyInit | object;
    /** Auth mode. `session` adds X-Session-Token. `admin` adds Bearer + session-token. */
    auth?: CoreAuth;
    /** Bearer token for `auth: "admin"`. Answered, not asserted, when absent. */
    adminToken?: AdminToken;
    /** If-Match header value (typically an ETag captured by a prior read). */
    ifMatch?: string | null;
    /** Idempotency-Key header value (UUID); honoured by the API for POST + PUT. */
    idempotencyKey?: string | null;
    /** Retry-on-429 strategy: read `RateLimit-Reset` and wait that many seconds; up to 2 retries. */
    retryOn429?: boolean;
    /** Custom abort signal; defaults to `abortable(abortKey)` per-key registry. */
    signal?: AbortSignal | null;
}

interface CoreFetchResult<T> {
    data: T;
    etag: string | null;
    response: Response;
}

const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RATE_LIMIT_RESET_SECONDS = 30; // cap server-provided wait at 30s

/**
 * `EV-L·M-4` ⊕ `C·C-34 (RD-1)` ⊕ `R2-N6` ⊕ `R2-r4` — the ~150s
 * auto-amplification, bounded (X·F F.W4 `.f`; cure handed over by `.b`).
 *
 * The compute-saturation 429 is raised only after a 30s server-side semaphore
 * wait and arrives STAMPED by `RateLimitHeaderMiddleware`, so `waitSec =
 * min(reset ≈ 60, 30) = 30` on EVERY retry: two retries bought 60s of pure
 * client sleeping on top of two 30s round trips, with `computing` pinned true
 * and the spinner reading "Computing…" throughout. A per-request cap cannot see
 * that, because each individual wait is within its cap — the budget has to be
 * cumulative, so it is.
 */
const RATE_LIMIT_BUDGET_MS = 20_000;

/**
 * Sleep that an `AbortSignal` can actually cut short.
 *
 * The prior backoff was `await new Promise(r => setTimeout(r, waitSec * 1000))`
 * and ignored `signal` entirely, so a 30s sleep SURVIVED the abort that was
 * supposed to cancel it and its generation then clobbered the request that
 * replaced it — a 30s × 2-generation clobber window on the app's most
 * re-triggered call. The timer is cleared on abort and the rejection is the
 * same `AbortError` the rest of this module already recognises.
 */
function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
    if (signal.aborted) return Promise.reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            signal.removeEventListener("abort", onAbort);
            resolve();
        }, ms);
        function onAbort() {
            clearTimeout(timer);
            reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
        }
        signal.addEventListener("abort", onAbort, { once: true });
    });
}

async function coreFetch<T>(
    path: string,
    abortKey: string,
    options?: CoreFetchOptions,
): Promise<CoreFetchResult<T>> {
    const auth: CoreAuth = options?.auth ?? "session";

    // Auth headers (session + optional admin Bearer).
    const headers: Record<string, string> = {
        ...((options?.headers as Record<string, string>) ?? {}),
    };
    if (auth === "admin") {
        if (!options?.adminToken) {
            throw new ApiProblem(
                ADMIN_TOKEN_MISSING,
                "Admin session required",
                401,
                "Your admin session is no longer available. Re-enter the admin token and try again.",
                path,
            );
        }
        headers["Authorization"] = `Bearer ${options.adminToken}`;
    }
    if (auth !== "none" && sessionToken) {
        headers["X-Session-Token"] = sessionToken;
    }
    if (options?.ifMatch) {
        headers["If-Match"] = options.ifMatch;
    }
    if (options?.idempotencyKey) {
        headers["Idempotency-Key"] = options.idempotencyKey;
    }

    // Body branching: FormData (multipart), plain object (JSON), or raw BodyInit.
    const rawBody = options?.body;
    const isFormData = rawBody instanceof FormData;
    let body: BodyInit | undefined;
    if (isFormData) {
        body = rawBody;
    } else if (
        rawBody != null &&
        typeof rawBody === "object" &&
        !(rawBody instanceof Blob) &&
        !(rawBody instanceof ArrayBuffer) &&
        !(rawBody instanceof ReadableStream)
    ) {
        headers["Content-Type"] ??= "application/json";
        body = JSON.stringify(rawBody);
    } else {
        body = rawBody as BodyInit | undefined;
    }

    const signal = options?.signal ?? abortable(abortKey);
    const retryOn429 = options?.retryOn429 ?? true;
    let attempt = 0;
    let spentMs = 0;
    while (true) {
        const res = await fetch(`${BASE}${path}`, {
            method: options?.method,
            headers,
            body,
            signal,
        });

        if (res.status === 429 && retryOn429 && attempt < MAX_RATE_LIMIT_RETRIES) {
            const reset = readRateLimitResetSeconds(res);
            const waitMs = Math.min(reset ?? 2 ** attempt, MAX_RATE_LIMIT_RESET_SECONDS) * 1000;
            // The budget is checked BEFORE the sleep, so the caller is told the
            // truth at the moment the wait stops being worth taking rather than
            // after another half-minute of pretending to compute.
            if (spentMs + waitMs > RATE_LIMIT_BUDGET_MS) {
                throw await ApiProblem.from(res);
            }
            await abortableSleep(waitMs, signal);
            spentMs += waitMs;
            attempt++;
            continue;
        }

        if (!res.ok) {
            // RFC 7807 problem+json: typed ApiProblem; otherwise statusText fallback.
            throw await ApiProblem.from(res);
        }

        const etag = res.headers.get("ETag");

        // 204 No Content (soft-delete) carries no JSON body.
        if (res.status === 204) {
            return { data: undefined as T, etag, response: res };
        }
        try {
            return { data: (await res.json()) as T, etag, response: res };
        } catch {
            throw new ApiProblem(
                "about:blank",
                `Invalid JSON response`,
                res.status,
                undefined,
                path,
            );
        }
    }
}

interface ApiFetchOptions extends Omit<RequestInit, "body" | "signal"> {
    body?: FormData | BodyInit | object;
    signal?: AbortSignal | null;
    /** Optional If-Match header (typically a captured ETag for concurrent-edit safety). */
    ifMatch?: string | null;
    /** Optional Idempotency-Key header (UUID; honoured by API for POST + PUT). */
    idempotencyKey?: string | null;
    /**
     * `EV-L·M-4` (i) — opt OUT of the 429 backoff.
     *
     * `retryOn429` was declared on `CoreFetchOptions` and absent here, and
     * `apiFetch` is the only exported wrapper — so a caller could not decline
     * the retry **even in principle**, whatever it knew about its own latency
     * budget. The equation ops are the callers that know: an interactive
     * compute wants the 429 reported, not slept through.
     */
    retryOn429?: boolean;
}

/** Default body-bearing fetch with session auth + retry-on-429 + typed ApiProblem errors. */
export async function apiFetch<T>(
    path: string,
    abortKey: string,
    options?: ApiFetchOptions,
): Promise<T> {
    const { data } = await coreFetch<T>(path, abortKey, {
        ...options,
        auth: "session",
    });
    return data;
}

/**
 * Like `apiFetch`, but returns the parsed body alongside the response's
 * `ETag` header so the caller can replay it as `If-Match` on a later
 * conditional mutation (CRUD-CONTRACT §0 SOTA-2 / RFC 9110).
 */
async function apiFetchWithETag<T>(
    path: string,
    abortKey: string,
    options?: ApiFetchOptions,
): Promise<WithETag<T>> {
    const { data, etag } = await coreFetch<T>(path, abortKey, {
        ...options,
        auth: "session",
    });
    return { data, etag };
}

/** Admin-authenticated fetch (Bearer + session token). */
async function adminFetch<T>(
    path: string,
    adminToken: AdminToken,
    options?: ApiFetchOptions,
): Promise<T> {
    const { data } = await coreFetch<T>(path, /* abortKey */ path, {
        ...options,
        auth: "admin",
        adminToken,
    });
    return data;
}

// ── Images ──
//
// `IU-25` (X·F F.W4 `.f`, SCRUB) — `computeSha256`, `checkImageHash` and
// `imageUrl` are DELETED here, each with a zero-consumer proof banked in
// `F-W4-SCRUB-LEDGER.md`. `checkImageHash` was additionally the module's one
// raw `fetch` outside the parametric core, with a bare `throw` that no typed
// catch could read — a second contract it kept only because nothing called it.
// The upload path deduplicates server-side by sha256 (`store_image_asset`), so
// the client-side hash-then-check pair had been superseded, not merely unused.

export async function uploadImage(file: File): Promise<ImageMeta> {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<ImageMeta>("/api/images", "uploadImage", {
        method: "POST",
        body: form,
    });
}

export async function getImageMeta(imageSlug: string): Promise<ImageMeta> {
    return apiFetch<ImageMeta>(`/api/images/${imageSlug}`, "getImageMeta");
}

export function thumbnailUrl(imageSlug: string): string {
    return `${BASE}/api/images/${imageSlug}/thumbnail`;
}

export function overlayUrl(imageSlug: string, resize: number = 1024): string {
    return `${BASE}/api/images/${imageSlug}/overlay?resize=${resize}`;
}

export async function extractContour(
    imageSlug: string,
    settings: ContourSettings,
): Promise<ContourAsset> {
    return apiFetch<ContourAsset>(
        `/api/images/${imageSlug}/extract-contour`,
        "extractContour",
        {
            method: "POST",
            body: { contour_settings: { ...settings } },
        },
    );
}

// ── Contours ──

export async function saveContour(
    imageSlug: string,
    points: { x: number[]; y: number[] },
): Promise<ContourAsset> {
    return apiFetch<ContourAsset>("/api/contours", "saveContour", {
        method: "POST",
        body: { image_slug: imageSlug, points },
    });
}

export async function getContour(contourHash: string): Promise<ContourAsset> {
    return apiFetch<ContourAsset>(`/api/contours/${contourHash}`, "getContour");
}

export async function computeEpicycles(
    contourHash: string,
    params: { n_harmonics: number; n_points: number },
): Promise<EpicycleData> {
    const res = await apiFetch<{ data: EpicycleData }>(
        `/api/contours/${contourHash}/compute/epicycles`,
        "computeEpicycles",
        {
            method: "POST",
            body: { ...params },
        },
    );
    return res.data;
}

export async function computeBases(
    contourHash: string,
    params: {
        max_degree: number;
        n_points: number;
        levels: number[];
        n_eval: number;
    },
): Promise<AnimationData> {
    const res = await apiFetch<{ data: AnimationData }>(
        `/api/contours/${contourHash}/compute/bases`,
        "computeBases",
        {
            method: "POST",
            body: { ...params },
        },
    );
    return res.data;
}

// ── Visualizations (the converged CRUD entity) ──
//
// Six slug-addressed endpoints over `/api/visualizations`, matching
// `api/routers/visualizations.py`. Identity is the 4-word `slug` — the single
// user-facing handle that gallery navigation keys off.

/** POST /api/visualizations — create (slug minted server-side if absent). */
export async function createVisualization(
    body: VisualizationCreate,
): Promise<WithETag<Visualization>> {
    return apiFetchWithETag<Visualization>(
        "/api/visualizations",
        "createVisualization",
        { method: "POST", body: { ...body } },
    );
}

/** GET /api/visualizations/{slug} — read by slug; captures the ETag. */
export async function getVisualization(
    slug: string,
): Promise<WithETag<Visualization>> {
    return apiFetchWithETag<Visualization>(
        `/api/visualizations/${slug}`,
        "getVisualization",
    );
}

/**
 * GET /api/visualizations — cursor-paginated list (CRUD-CONTRACT §6). The
 * anonymous/default view is `visibility=public`; `owner: "me"` (with a
 * session) returns the caller's rows in all three visibility states.
 */
export async function listVisualizations(params: {
    limit?: number;
    sort?: string;
    cursor?: string;
    owner?: string;
}): Promise<VisualizationListResponse> {
    const qs = new URLSearchParams();
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.sort) qs.set("sort", params.sort);
    if (params.cursor) qs.set("cursor", params.cursor);
    if (params.owner) qs.set("owner", params.owner);
    const query = qs.toString();
    return apiFetch<VisualizationListResponse>(
        `/api/visualizations${query ? `?${query}` : ""}`,
        "listVisualizations",
    );
}

/**
 * PATCH /api/visualizations/{slug} — partial update. Sends `If-Match: <etag>`
 * (the validator captured from the prior GET) for optimistic concurrency
 * (CRUD-CONTRACT §0 SOTA-2). A stale ETag yields 412 `urn:contract:etag-mismatch`.
 */
export async function updateVisualization(
    slug: string,
    patch: VisualizationPatch,
    etag: string | null,
): Promise<WithETag<Visualization>> {
    const headers: Record<string, string> = {};
    if (etag) headers["If-Match"] = etag;
    return apiFetchWithETag<Visualization>(
        `/api/visualizations/${slug}`,
        "updateVisualization",
        { method: "PATCH", body: { ...patch }, headers },
    );
}

/**
 * DELETE /api/visualizations/{slug} — soft-delete (restorable within grace,
 * §5). Sends `If-Match: <etag>`; returns 204 No Content.
 */
export async function deleteVisualization(
    slug: string,
    etag: string | null,
): Promise<void> {
    const headers: Record<string, string> = {};
    if (etag) headers["If-Match"] = etag;
    await apiFetchWithETag<void>(
        `/api/visualizations/${slug}`,
        "deleteVisualization",
        { method: "DELETE", headers },
    );
}

/** POST /api/visualizations/{slug}/restore — restore from soft-delete (§5). */
export async function restoreVisualization(
    slug: string,
): Promise<WithETag<Visualization>> {
    return apiFetchWithETag<Visualization>(
        `/api/visualizations/${slug}/restore`,
        "restoreVisualization",
        { method: "POST" },
    );
}

// ── Sessions ──

export async function createSession(): Promise<SessionResponse> {
    return apiFetch<SessionResponse>("/api/sessions", "createSession", {
        method: "POST",
    });
}

export async function loginWithSlug(slug: string): Promise<SessionResponse> {
    return apiFetch<SessionResponse>("/api/sessions/login", "loginWithSlug", {
        method: "POST",
        body: { slug },
    });
}

export async function getMe(): Promise<UserInfo> {
    return apiFetch<UserInfo>("/api/sessions/me", "getMe");
}

export async function deleteSession(): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>("/api/sessions", "deleteSession", {
        method: "DELETE",
    });
}

// ── Admin ──

export async function verifyAdmin(
    token: AdminToken,
): Promise<{ ok: boolean }> {
    return adminFetch<{ ok: boolean }>("/api/admin/verify", token);
}

export async function getAdminStats(token: AdminToken): Promise<AdminStats> {
    return adminFetch<AdminStats>("/api/admin/stats", token);
}

// ── Admin: visualization moderation (CRUD-CONTRACT §7) ──
//
// Slug-addressed against the converged entity. `set_tier` and the
// soft/hard-delete are ETag-guarded server-side; the admin client passes
// `If-Match: *` (admins may override any owner's row per §3 admin-override).

/** PUT /api/admin/visualizations/{slug}/tier — admin curation tier (§7 feature). */
export async function setVisualizationTier(
    token: AdminToken,
    slug: string,
    tier: GalleryTier,
): Promise<Visualization> {
    return adminFetch<Visualization>(
        `/api/admin/visualizations/${slug}/tier`,
        token,
        { method: "PUT", body: { tier }, headers: { "If-Match": "*" } },
    );
}

/**
 * DELETE /api/admin/visualizations/{slug} — moderate-delete (§5 soft by
 * default; `hard=true` is the §7 grace-bypass for illegal content).
 */
export async function adminDeleteVisualization(
    token: AdminToken,
    slug: string,
    hard = false,
): Promise<{ ok: boolean }> {
    return adminFetch<{ ok: boolean }>(
        `/api/admin/visualizations/${slug}${hard ? "?hard=true" : ""}`,
        token,
        { method: "DELETE", headers: { "If-Match": "*" } },
    );
}

/**
 * GET /api/admin/flagged — flagged visualizations, cursor-paginated. Returns
 * the cursor envelope `{items, next_cursor, has_more}` from `admin.py`.
 */
export async function listFlaggedVisualizations(
    token: AdminToken,
    params: { limit?: number; cursor?: string },
): Promise<FlaggedCursorResponse> {
    const qs = new URLSearchParams();
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.cursor) qs.set("cursor", params.cursor);
    const query = qs.toString();
    return adminFetch<FlaggedCursorResponse>(
        `/api/admin/flagged${query ? `?${query}` : ""}`,
        token,
    );
}

/** DELETE /api/admin/visualizations/{slug}/flags — dismiss flags (§7). */
export async function dismissVisualizationFlags(
    token: AdminToken,
    slug: string,
): Promise<{ dismissed: number }> {
    return adminFetch<{ dismissed: number }>(
        `/api/admin/visualizations/${slug}/flags`,
        token,
        { method: "DELETE" },
    );
}

// ── Admin: user management ──

export async function listAdminUsers(
    token: AdminToken,
    params: { page?: number; limit?: number; sort?: string; q?: string },
): Promise<AdminUserListResponse> {
    const qs = new URLSearchParams();
    if (params.page != null) qs.set("page", String(params.page));
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.sort) qs.set("sort", params.sort);
    if (params.q) qs.set("q", params.q);
    const query = qs.toString();
    return adminFetch<AdminUserListResponse>(
        `/api/admin/users${query ? `?${query}` : ""}`,
        token,
    );
}

export async function setAdminUserStatus(
    token: AdminToken,
    slug: string,
    status: "active" | "suspended",
): Promise<{ slug: string; status: string }> {
    return adminFetch<{ slug: string; status: string }>(
        `/api/admin/users/${slug}/status`,
        token,
        { method: "POST", body: { status } },
    );
}

export async function deleteAdminUser(
    token: AdminToken,
    slug: string,
): Promise<{ deleted: boolean; entries_deleted: number }> {
    return adminFetch<{ deleted: boolean; entries_deleted: number }>(
        `/api/admin/users/${slug}`,
        token,
        { method: "DELETE" },
    );
}

export async function pruneEmptyUsers(
    token: AdminToken,
): Promise<{ pruned: number }> {
    return adminFetch<{ pruned: number }>(
        "/api/admin/users/prune-empty",
        token,
        { method: "POST" },
    );
}

// ── Admin: batch operations ──

// A.W5.c contract-bug fix — the wrappers previously declared a `{processed}`
// shape that disagreed with the backend's `{ok, affected, errors?}` (see
// `api/routers/admin.py:362-451`). The CRUD CONTRACT ratifies `BatchResponse`
// as the canonical batch return type; both wrappers now type against it.
//
// B.W4 — the batch endpoint moved onto the converged entity
// (`/api/admin/visualizations/batch`); the request's `hashes` field now
// carries visualization **slugs** under the single-slug identity (§7 batch_*).
export async function batchGallery(
    token: AdminToken,
    action: "delete" | "feature" | "unfeature",
    hashes: string[],
): Promise<BatchResponse> {
    return adminFetch<BatchResponse>("/api/admin/visualizations/batch", token, {
        method: "POST",
        body: { action, hashes },
    });
}

export async function batchUsers(
    token: AdminToken,
    action: "delete" | "suspend" | "unsuspend",
    slugs: string[],
): Promise<BatchResponse> {
    return adminFetch<BatchResponse>("/api/admin/users/batch", token, {
        method: "POST",
        body: { action, slugs },
    });
}

// ── Admin: audit log ──

export async function listAuditLog(
    token: AdminToken,
    params: {
        page?: number;
        limit?: number;
        action?: string;
        after?: string;
        before?: string;
        target?: string;
    },
): Promise<AuditListResponse> {
    const qs = new URLSearchParams();
    if (params.page != null) qs.set("page", String(params.page));
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.action) qs.set("action", params.action);
    if (params.after) qs.set("after", params.after);
    if (params.before) qs.set("before", params.before);
    if (params.target) qs.set("target", params.target);
    const query = qs.toString();
    return adminFetch<AuditListResponse>(
        `/api/admin/audit${query ? `?${query}` : ""}`,
        token,
    );
}
