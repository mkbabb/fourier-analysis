// SERVED MODEL: claude-opus-5[1m]
import type { Page } from "@playwright/test";

/**
 * X·F F.W9 `.b` — the gallery/admin network fixtures, AUTHORED ONCE.
 *
 * §4a-7's AXE-SEAT ECONOMY is *"author ONCE, cite many; extend the keystone,
 * never clone it"*, and by this wave three specs needed the same deterministic
 * gallery surface: F.W4's admin axe keystone, this wave's S4 seat (`G-F9-9`
 * opens a card) and this wave's visual checkpoint (`G-F9-23` photographs one).
 * A second copy of these fixtures would have been a second oracle: two specs
 * asserting over two silently diverging fixture sets, which is the shape
 * `KF.W4` forbids. They live here, once.
 *
 * WHY THE NETWORK BOUNDARY AND NOT A SEEDED DATABASE — the reasoning F.W4 `.g`
 * recorded, carried here with its subject: a fresh CI database renders every
 * one of these surfaces EMPTY, and a gate that grades an empty table, opens a
 * card that is not there, or photographs a blank grid passes vacuously. Only
 * the HTTP boundary is stubbed; the store, the components, the styles and the
 * DOM are the shipped code path.
 */

export const ADMIN_TOKEN = "e2e-admin-token";

/** One deterministic gallery row, shaped by `lib/types.ts`'s `Visualization`. */
export const ENTRY = {
    slug: "amber-fox-spiral-one",
    owner_slug: "amber-fox-12",
    visibility: "public",
    content_hash: "c0ffee00",
    image_slug: "img-amber-fox-spiral-one",
    contour_hash: "deadbeef",
    active_bases: ["fourier-epicycles"],
    n_harmonics: 64,
    set_hash: "5e7ha5h0",
    fork_of: null,
    fork_of_hash: null,
    fork_count: 0,
    version_count: 1,
    title: "Amber fox spiral",
    description: null,
    tags: [],
    palette_slug: null,
    views: 12,
    likes: 3,
    tier: "normal",
    pinned: false,
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-01T10:00:00Z",
    deleted_at: null,
};

export const ADMIN_STATS = {
    total_entries: 128,
    featured: 7,
    saved: 41,
    normal: 80,
    total_views: 9314,
    total_likes: 452,
    storage_bytes: 73_400_320,
};

export const ADMIN_USERS = {
    items: [
        {
            user_slug: "amber-fox-12",
            created_at: "2026-04-02T10:15:00Z",
            last_seen_at: "2026-09-17T22:41:00Z",
            entry_count: 9,
            status: "active",
        },
        {
            user_slug: "quiet-heron-77",
            created_at: "2026-06-19T08:02:00Z",
            last_seen_at: "2026-09-01T11:20:00Z",
            entry_count: 2,
            status: "suspended",
        },
    ],
    total: 2,
    page: 1,
    pages: 1,
};

export const ADMIN_FLAGGED = {
    items: [
        {
            slug: "spiral-lattice-04",
            flag_count: 3,
            flags: [
                {
                    reporter_slug: "amber-fox-12",
                    reason: "inappropriate",
                    detail: "reported from the gallery grid",
                    created_at: "2026-09-10T14:00:00Z",
                },
            ],
            image_slug: "img-spiral-lattice-04",
            owner_slug: "quiet-heron-77",
            tier: "normal",
            created_at: "2026-08-30T09:00:00Z",
        },
    ],
    next_cursor: null,
    has_more: false,
};

export const ADMIN_AUDIT = {
    items: [
        {
            timestamp: "2026-09-17T22:44:10Z",
            action: "set_tier",
            target: "spiral-lattice-04",
            ip_hash: "6f1c9a2d",
        },
        {
            timestamp: "2026-09-17T21:02:55Z",
            action: "delete",
            target: "gull-figure-19",
            ip_hash: "b03e77aa",
        },
    ],
    total: 2,
    page: 1,
    pages: 1,
};

/** A 1×1 transparent PNG, so thumbnail requests resolve instead of 404-ing. */
export const PIXEL_PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
);

function json(body: unknown) {
    return { status: 200, contentType: "application/json", body: JSON.stringify(body) };
}

/** Serve the gallery list and its thumbnails deterministically. */
export async function stubGallery(page: Page, items: unknown[] = [ENTRY]): Promise<void> {
    await page.route("**/api/visualizations**", (route) =>
        route.fulfill(json({ items, next_cursor: null, has_more: false })),
    );
    await page.route("**/api/images/**", (route) =>
        route.fulfill({ status: 200, contentType: "image/png", body: PIXEL_PNG }),
    );
}

/**
 * Serve the admin surface deterministically; leave every other route live.
 *
 * The empty grid is deliberate for the ADMIN reading: it keeps that gate about
 * the admin panels and off the card grid, which the `/visualize` keystones and
 * `stubGallery` already cover.
 */
export async function stubAdminApi(page: Page, items: unknown[] = []): Promise<void> {
    await page.route("**/api/admin/verify", (r) => r.fulfill(json({ ok: true })));
    await page.route("**/api/admin/stats", (r) => r.fulfill(json(ADMIN_STATS)));
    await page.route("**/api/admin/users**", (r) => r.fulfill(json(ADMIN_USERS)));
    await page.route("**/api/admin/flagged**", (r) => r.fulfill(json(ADMIN_FLAGGED)));
    await page.route("**/api/admin/audit**", (r) => r.fulfill(json(ADMIN_AUDIT)));
    await stubGallery(page, items);
}
