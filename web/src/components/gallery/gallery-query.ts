/**
 * The gallery's view in its URL (`/gallery`). Short stable keys, each omitted
 * at its default, so `/gallery` stays the clean link:
 *
 *   q=<text>          the search (replace, as it is typed)
 *   sort=views|likes  the order (default newest)
 *   tier=<tier>       featured, saved or normal (default all)
 *   basis=<key>       the basis filter (default none)
 *   tab=drafts        the Drafts tab (default the gallery; the admin tabs are
 *                     a session's own and never in a link)
 *   open=<slug>       the card opened over the grid
 *
 * The filters, the tab and the card are pushes (Back closes the card).
 * The scroll position is not page state: the shell restores it per history
 * entry, and the grid's later pages are a cursor that a link cannot name.
 */
import type { LocationQuery } from "vue-router";
import type { GallerySort, GalleryTierFilter } from "@/lib/types";
import { oneOf, rawOf, text, type Codec } from "@/lib/urlState";

export type GalleryTab = "gallery" | "drafts" | "users" | "flagged" | "audit" | "tokens";

const slugCodec: Codec<string | null> = {
    parse: (raw) => (raw && /^[a-z0-9-]{1,80}$/i.test(raw) ? raw : null),
    format: (v) => v ?? undefined,
};

export const GALLERY_QUERY = {
    q: text,
    sort: oneOf<GallerySort>(["newest", "views", "likes"], "newest"),
    tier: oneOf<GalleryTierFilter>(["all", "featured", "saved", "normal"], "all"),
    basis: oneOf<string>(["", "fourier-epicycles", "fourier-series", "chebyshev", "legendre"], ""),
    tab: oneOf<"gallery" | "drafts">(["gallery", "drafts"], "gallery"),
    open: slugCodec,
} as const;

export type GalleryKey = keyof typeof GALLERY_QUERY;

export type GalleryView = {
    [K in GalleryKey]: ReturnType<(typeof GALLERY_QUERY)[K]["parse"]>;
};

export function parseGalleryQuery(query: LocationQuery): GalleryView {
    const out = {} as Record<GalleryKey, unknown>;
    for (const key of Object.keys(GALLERY_QUERY) as GalleryKey[]) {
        out[key] = GALLERY_QUERY[key].parse(rawOf(query, key));
    }
    return out as GalleryView;
}

export function formatGalleryQuery(view: Partial<GalleryView>): Record<string, string | undefined> {
    const out: Record<string, string | undefined> = {};
    for (const key of Object.keys(view) as GalleryKey[]) {
        out[key] = (GALLERY_QUERY[key] as Codec<unknown>).format(view[key]);
    }
    return out;
}

/** The tab a link may name: an admin tab is never in a URL. */
export function linkableTab(tab: GalleryTab): "gallery" | "drafts" {
    return tab === "drafts" ? "drafts" : "gallery";
}
