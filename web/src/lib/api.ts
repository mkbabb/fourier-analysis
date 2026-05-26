import type {
    AnimationData,
    ContourAsset,
    ContourSettings,
    AnimationSettings,
    EpicycleData,
    ImageMeta,
    Snapshot,
    GalleryEntry,
    GalleryCursorResponse,
    GalleryTier,
    FlagReason,
    SessionResponse,
    UserInfo,
    AdminStats,
    AdminUserListResponse,
    FlaggedListResponse,
    AuditListResponse,
    BatchResponse,
} from "./types";

const BASE = import.meta.env.VITE_API_URL || "";

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

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
    body?: FormData | Record<string, unknown> | BodyInit;
}

async function apiFetch<T>(
    path: string,
    abortKey: string,
    options?: ApiFetchOptions,
): Promise<T> {
    const headers: Record<string, string> = {
        ...((options?.headers as Record<string, string>) ?? {}),
    };

    if (sessionToken) {
        headers["X-Session-Token"] = sessionToken;
    }

    const rawBody = options?.body;
    const isFormData = rawBody instanceof FormData;

    // FormData: let browser set Content-Type with boundary
    // Plain object: set JSON content type and stringify
    // No body: no content type
    let body: BodyInit | undefined;
    if (isFormData) {
        body = rawBody;
    } else if (rawBody != null && typeof rawBody === "object" && !(rawBody instanceof Blob) && !(rawBody instanceof ArrayBuffer) && !(rawBody instanceof ReadableStream)) {
        headers["Content-Type"] ??= "application/json";
        body = JSON.stringify(rawBody);
    } else {
        body = rawBody as BodyInit | undefined;
    }

    const res = await fetch(`${BASE}${path}`, {
        method: options?.method,
        headers,
        body,
        signal: options?.signal ?? abortable(abortKey),
    });

    if (!res.ok) {
        let text: string;
        try {
            text = await res.text();
        } catch {
            text = "(could not read response body)";
        }
        throw new Error(`API ${res.status}: ${text}`);
    }

    try {
        return await res.json();
    } catch {
        throw new Error(`API ${res.status}: invalid JSON response`);
    }
}

async function adminFetch<T>(
    path: string,
    adminToken: string,
    options?: ApiFetchOptions,
): Promise<T> {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${adminToken}`,
        ...((options?.headers as Record<string, string>) ?? {}),
    };

    if (sessionToken) {
        headers["X-Session-Token"] = sessionToken;
    }

    const rawBody = options?.body;
    const isFormData = rawBody instanceof FormData;

    let body: BodyInit | undefined;
    if (isFormData) {
        body = rawBody;
    } else if (rawBody != null && typeof rawBody === "object" && !(rawBody instanceof Blob) && !(rawBody instanceof ArrayBuffer) && !(rawBody instanceof ReadableStream)) {
        headers["Content-Type"] ??= "application/json";
        body = JSON.stringify(rawBody);
    } else {
        body = rawBody as BodyInit | undefined;
    }

    const res = await fetch(`${BASE}${path}`, {
        method: options?.method,
        headers,
        body,
    });

    if (!res.ok) {
        let text: string;
        try {
            text = await res.text();
        } catch {
            text = "(could not read response body)";
        }
        throw new Error(`API ${res.status}: ${text}`);
    }

    try {
        return await res.json();
    } catch {
        throw new Error(`API ${res.status}: invalid JSON response`);
    }
}

// ── Images ──

export async function computeSha256(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export async function checkImageHash(hash: string): Promise<ImageMeta | null> {
    const res = await fetch(`${BASE}/api/images/by-hash/${hash}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Hash check failed: ${res.status}`);
    return res.json();
}

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

export function imageUrl(imageSlug: string): string {
    return `${BASE}/api/images/${imageSlug}/blob`;
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

// ── Snapshots ──

export async function saveSnapshot(
    imageSlug: string,
    req: {
        contour_hash: string;
        contour_settings: ContourSettings;
        animation_settings: AnimationSettings;
    },
): Promise<Snapshot> {
    return apiFetch<Snapshot>(
        `/api/images/${imageSlug}/snapshots`,
        "saveSnapshot",
        {
            method: "POST",
            body: { ...req },
        },
    );
}

export async function getSnapshot(
    imageSlug: string,
    snapshotHash: string,
): Promise<Snapshot> {
    return apiFetch<Snapshot>(
        `/api/images/${imageSlug}/snapshots/${snapshotHash}`,
        "getSnapshot",
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

// ── Gallery ──

export async function getGalleryEntry(hash: string): Promise<GalleryEntry> {
    return apiFetch<GalleryEntry>(`/api/gallery/${hash}`, "getGalleryEntry");
}

export async function publishToGallery(
    snapshotHash: string,
    imageSlug: string,
): Promise<GalleryEntry> {
    return apiFetch<GalleryEntry>("/api/gallery", "publishToGallery", {
        method: "POST",
        body: { snapshot_hash: snapshotHash, image_slug: imageSlug },
    });
}

export async function recordView(hash: string): Promise<{ views: number }> {
    return apiFetch<{ views: number }>(
        `/api/gallery/${hash}/view`,
        "recordView",
        { method: "POST" },
    );
}

export async function toggleLike(
    hash: string,
): Promise<{ liked: boolean; likes: number }> {
    return apiFetch<{ liked: boolean; likes: number }>(
        `/api/gallery/${hash}/like`,
        "toggleLike",
        { method: "POST" },
    );
}

// ── Admin ──

export async function verifyAdmin(
    token: string,
): Promise<{ ok: boolean }> {
    return adminFetch<{ ok: boolean }>("/api/admin/verify", token);
}

export async function getAdminStats(token: string): Promise<AdminStats> {
    return adminFetch<AdminStats>("/api/admin/stats", token);
}

export async function setGalleryTier(
    token: string,
    hash: string,
    tier: GalleryTier,
): Promise<GalleryEntry> {
    return adminFetch<GalleryEntry>(`/api/admin/gallery/${hash}/tier`, token, {
        method: "PUT",
        body: { tier },
    });
}

export async function deleteGalleryEntry(
    token: string,
    hash: string,
): Promise<{ ok: boolean }> {
    return adminFetch<{ ok: boolean }>(`/api/admin/gallery/${hash}`, token, {
        method: "DELETE",
    });
}

// ── Cursor pagination ──

export async function listGalleryCursor(params: {
    limit?: number;
    sort?: string;
    cursor?: string;
    tier?: GalleryTier;
    q?: string;
    basis?: string;
    user_slug?: string;
}): Promise<GalleryCursorResponse> {
    const qs = new URLSearchParams();
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.sort) qs.set("sort", params.sort);
    if (params.cursor) qs.set("cursor", params.cursor);
    if (params.tier) qs.set("tier", params.tier);
    if (params.q) qs.set("q", params.q);
    if (params.basis) qs.set("basis", params.basis);
    if (params.user_slug) qs.set("user_slug", params.user_slug);
    const query = qs.toString();
    return apiFetch<GalleryCursorResponse>(
        `/api/gallery/cursor${query ? `?${query}` : ""}`,
        "listGalleryCursor",
    );
}

// ── User entry ownership ──

export async function deleteOwnGalleryEntry(
    hash: string,
): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/api/gallery/${hash}`, "deleteOwnEntry", {
        method: "DELETE",
    });
}

export async function updateGalleryEntry(
    hash: string,
    data: { image_slug?: string },
): Promise<GalleryEntry> {
    return apiFetch<GalleryEntry>(`/api/gallery/${hash}`, "updateEntry", {
        method: "PUT",
        body: data,
    });
}

// ── Content flagging ──

export async function flagGalleryEntry(
    hash: string,
    reason: FlagReason,
    detail?: string,
): Promise<{ flagged: boolean }> {
    return apiFetch<{ flagged: boolean }>(`/api/gallery/${hash}/flag`, "flagEntry", {
        method: "POST",
        body: { reason, detail: detail || null },
    });
}

// ── Admin: user management ──

export async function listAdminUsers(
    token: string,
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
    token: string,
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
    token: string,
    slug: string,
): Promise<{ deleted: boolean; entries_deleted: number }> {
    return adminFetch<{ deleted: boolean; entries_deleted: number }>(
        `/api/admin/users/${slug}`,
        token,
        { method: "DELETE" },
    );
}

export async function pruneEmptyUsers(
    token: string,
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
export async function batchGallery(
    token: string,
    action: "delete" | "feature" | "unfeature",
    hashes: string[],
): Promise<BatchResponse> {
    return adminFetch<BatchResponse>("/api/admin/gallery/batch", token, {
        method: "POST",
        body: { action, hashes },
    });
}

export async function batchUsers(
    token: string,
    action: "delete" | "suspend" | "unsuspend",
    slugs: string[],
): Promise<BatchResponse> {
    return adminFetch<BatchResponse>("/api/admin/users/batch", token, {
        method: "POST",
        body: { action, slugs },
    });
}

// ── Admin: flagged content ──

export async function listFlaggedEntries(
    token: string,
    params: { page?: number; limit?: number },
): Promise<FlaggedListResponse> {
    const qs = new URLSearchParams();
    if (params.page != null) qs.set("page", String(params.page));
    if (params.limit != null) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return adminFetch<FlaggedListResponse>(
        `/api/admin/flagged${query ? `?${query}` : ""}`,
        token,
    );
}

export async function dismissFlags(
    token: string,
    hash: string,
): Promise<{ dismissed: number }> {
    return adminFetch<{ dismissed: number }>(`/api/admin/flags/${hash}`, token, {
        method: "DELETE",
    });
}

// ── Admin: audit log ──

export async function listAuditLog(
    token: string,
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
