import type { PaperSectionData } from "@/lib/paperContent";

/**
 * X·F F.W4 `.e` — `fr-PaperSidebar M5` (+`L-3`).
 *
 * The preview string is read once per row per `activeId` tick in the render
 * path, and re-deriving it there was the sole reason the sidebar pinned the
 * whole content payload. It is memoised per section — the content is a
 * build-time constant, so a value computed once is a value that cannot go
 * stale — and the lookup takes the slot the dead `treeIndex: Map<string, any>`
 * prop vacated: two findings, one edit.
 *
 * ⊘ The `paperSectionToTreeNode` ADAPTER that used to live here is deleted
 * (COHESION §0o `ESC-2` / §3 `D9`): it existed only to feed latex-paper's
 * `useTreeIndex` — the losing derivation — and with one ToC model owned by
 * `PaperView` there is nothing left to adapt.
 */
export function getPaperPreview(section: PaperSectionData): string {
    const text =
        section.content?.find((block): block is string => typeof block === "string") ?? "";
    const clean = text.replace(/\$[^$]+\$/g, "…").replace(/<[^>]+>/g, "");
    const preview = clean.length > 100 ? `${clean.slice(0, 100)}…` : clean;

    const parts: string[] = [];
    if (preview) parts.push(preview);
    if (section.summary) parts.push(section.summary);

    return parts.join(" · ");
}

/** A memoised `getPaperPreview`, one cache per ToC model. */
export function createPreviewLookup(): (section: PaperSectionData) => string {
    const cache = new Map<string, string>();
    return (section) => {
        const hit = cache.get(section.id);
        if (hit !== undefined) return hit;
        const preview = getPaperPreview(section);
        cache.set(section.id, preview);
        return preview;
    };
}
