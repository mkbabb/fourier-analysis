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

export interface ContourData {
    n_contours: number;
    contours: { x: number[]; y: number[]; n_points: number }[];
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

export interface Snapshot {
    snapshot_hash: string;
    image_slug: string;
    contour_hash: string;
    contour_settings: ContourSettings;
    animation_settings: AnimationSettings;
    created_at: string;
}

export type NotationMode = "trig" | "exponential" | "polar";
export type EquationTier = "symbolic" | "identified" | "spline";

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

export interface GalleryEntry {
    snapshot_hash: string;
    image_slug: string;
    contour_hash: string;
    user_slug: string | null;
    tier: GalleryTier;
    views: number;
    likes: number;
    active_bases: string[];
    n_harmonics: number;
    created_at: string;
    updated_at: string;
}

export interface GalleryListResponse {
    items: GalleryEntry[];
    total: number;
    page: number;
    pages: number;
}

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

// ── Cursor Pagination ──

export interface CursorInfo {
    next_cursor: string | null;
    has_more: boolean;
}

export interface GalleryCursorResponse {
    items: GalleryEntry[];
    cursor: CursorInfo;
    total: number;
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

export interface FlaggedEntryInfo {
    snapshot_hash: string;
    flag_count: number;
    flags: FlagInfo[];
    image_slug: string | null;
    user_slug: string | null;
    tier: string | null;
    created_at: string | null;
}

export interface FlaggedListResponse {
    items: FlaggedEntryInfo[];
    total: number;
    page: number;
    pages: number;
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
