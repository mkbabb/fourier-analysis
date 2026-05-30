export interface BasisComponent {
    index: number;
    coefficient: [number, number]; // [re, im]
    amplitude: number;
    phase: number;
}

export interface BasisDecomposition {
    basis: "fourier" | "chebyshev" | "legendre" | string;
    components: BasisComponent[];
    domain: [number, number];
}

export interface AnimationData {
    original: { x: number[]; y: number[] };
    decompositions: Record<string, BasisDecomposition>;
    partial_sums: Record<string, Record<number, { x: number[]; y: number[] }>>;
    eval_points: number[];
    levels: number[];
}

export interface EpicycleData {
    n_components: number;
    components: BasisComponent[];
    trace: { x: number[]; y: number[] };
    path: { x: number[]; y: number[] };
}

export interface ContourSettings {
    strategy: string;
    resize: number;
    blur_sigma: number;
    n_harmonics: number;
    n_points: number;
    n_classes: number;
    min_contour_length: number;
    min_contour_area: number;
    max_contours: number | null;
    smooth_contours: number;
    ml_threshold: number;
    ml_detail_threshold: number;
}

export interface AnimationSettings {
    fps: number;
    duration: number;
    max_circles: number;
    easing: string;
    speed: number;
    active_bases: string[];
}

export interface ImageMeta {
    image_slug: string;
    sha256: string;
    original_name: string;
    content_type: string;
    bytes: number;
    created_at: string;
    last_accessed_at: string;
}

export interface ImageBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

export interface ContourAsset {
    contour_hash: string;
    image_slug: string | null;
    source: string;
    point_count: number;
    bbox: ImageBounds;
    image_bounds: ImageBounds | null;
    preview_path: string;
    created_at: string;
    last_accessed_at: string;
    points: { x: number[]; y: number[] };
}

export interface WorkspaceDraft {
    imageSlug: string;
    contour: ContourAsset | null;
    contourSettings: ContourSettings;
    animationSettings: AnimationSettings;
    epicycleData: EpicycleData | null;
    basesData: AnimationData | null;
    savedSnapshots: string[];
    lastOpenedAt: string;
}

// ── Gallery ──

export type GalleryTier = "featured" | "saved" | "normal";

// ── Session/Auth ──

export interface SessionResponse {
    token: string;
    user_slug: string;
}

export interface UserInfo {
    user_slug: string;
    created_at: string;
}

export interface AdminStats {
    total_entries: number;
    featured: number;
    saved: number;
    normal: number;
    total_views: number;
    total_likes: number;
    storage_bytes: number;
}

// ── Admin User Management ──

export interface AdminUserInfo {
    user_slug: string;
    created_at: string;
    last_seen_at: string;
    entry_count: number;
    status: string;
}

export interface AdminUserListResponse {
    items: AdminUserInfo[];
    total: number;
    page: number;
    pages: number;
}

// ── Content Flagging ──

export type FlagReason = "inappropriate" | "spam" | "copyright" | "other";

export interface FlagInfo {
    reporter_slug: string;
    reason: FlagReason;
    detail: string | null;
    created_at: string;
}

// A flagged row as `GET /api/admin/flagged` emits it (admin.py hand-builds the
// body; no `response_model`). The single user-facing identity is the
// visualization `slug`; `owner_slug` is the flagged item's owner. The canonical
// lift of the panel's former local interface.
export interface FlaggedVisualization {
    slug: string;
    flag_count: number;
    flags: FlagInfo[];
    image_slug: string | null;
    owner_slug: string | null;
    tier: string | null;
    created_at: string | null;
}

// The flagged stream rides the cursor envelope `{items, next_cursor, has_more}`
// the backend already emits — not the retired `{total, page, pages}` offset
// shape. Item identity is `slug` (CRUD-CONTRACT §1).
export interface FlaggedCursorResponse {
    items: FlaggedVisualization[];
    next_cursor: string | null;
    has_more: boolean;
}

// ── Audit Log ──

export interface AuditEntry {
    timestamp: string;
    action: string;
    target: string;
    ip_hash: string;
}

export interface AuditListResponse {
    items: AuditEntry[];
    total: number;
    page: number;
    pages: number;
}

// ── Admin batch operations ──
// The CRUD CONTRACT batch return shape: `{ok, affected, errors?}`. The W5.c
// contract-bug fix unified the api.ts wrappers around this shape, replacing a
// stale `{processed: number}` declaration that disagreed with the backend.
export interface BatchResponse {
    ok: boolean;
    affected: number;
    errors?: string[];
}

// ── Converged `visualization` entity (CRUD-CONTRACT §1–§5; SCHEMA.md §3) ──
//
// The single user-named noun. `slug` is the one user-facing identity (the URL
// handle, per §1 single-slug rule); `content_hash` is a non-identity dedup
// key. `image_slug` / `contour_hash` remain the IMAGE / CONTOUR asset FKs and
// are loaded unchanged. (Folded here from `api.ts` under inv-26: one contract
// source of truth — `api.ts` re-exports these for its call sites.)

export type Visibility = "draft" | "unlisted" | "public";

export interface Visualization {
    slug: string;
    owner_slug: string;
    visibility: Visibility;
    content_hash: string; // dedup key, never identity (§1)
    image_slug: string; // image asset FK — kept
    contour_hash: string; // contour asset FK — kept
    active_bases: string[];
    n_harmonics: number;
    title?: string | null;
    description?: string | null;
    tags?: string[];
    palette_slug?: string | null;
    views: number;
    likes: number;
    tier?: GalleryTier;
    pinned?: boolean;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    contour_settings?: ContourSettings;
    animation_settings?: AnimationSettings;
}

export interface VisualizationCreate {
    slug?: string;
    visibility?: Visibility;
    image_slug: string;
    contour_hash: string;
    active_bases: string[];
    n_harmonics: number;
    contour_settings?: ContourSettings;
    animation_settings?: AnimationSettings;
    title?: string | null;
    description?: string | null;
    tags?: string[];
    palette_slug?: string | null;
}

export interface VisualizationPatch {
    visibility?: Visibility;
    title?: string | null;
    description?: string | null;
    tags?: string[];
    palette_slug?: string | null;
}

/** The cursor envelope returned by every list endpoint (CRUD-CONTRACT §6). */
export interface VisualizationListResponse {
    items: Visualization[];
    next_cursor: string | null;
    has_more: boolean;
}

/**
 * A read result paired with its strong-validator `ETag` (RFC 9110 §8.8). The
 * caller stashes `etag` and replays it as `If-Match` on the next PATCH/DELETE
 * (CRUD-CONTRACT §0 SOTA-2). `null` when the server omitted the header.
 */
export interface WithETag<T> {
    data: T;
    etag: string | null;
}
