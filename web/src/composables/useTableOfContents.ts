/**
 * Builds a flat index of all paper sections at every depth for TOC navigation.
 */

import type { PaperSectionData } from "@/lib/paperContent";

export interface TocEntry {
    section: PaperSectionData;
    depth: number;
    parentId: string | null;
    topIndex: number;
}

export function useTableOfContents(sections: PaperSectionData[]) {
    const tocIndex = new Map<string, TocEntry>();

    function indexSections(
        list: PaperSectionData[],
        depth: number,
        parentId: string | null,
        topIndex: number,
    ) {
        for (const s of list) {
            const ti = depth === 0 ? list.indexOf(s) : topIndex;
            tocIndex.set(s.id, {
                section: s,
                depth,
                parentId: depth === 0 ? s.id : parentId,
                topIndex: ti,
            });
            if (s.subsections) {
                indexSections(s.subsections, depth + 1, depth === 0 ? s.id : parentId, ti);
            }
        }
    }
    indexSections(sections, 0, null, 0);

    function isActive(id: string, activeId: string | null): boolean {
        return id === activeId;
    }

    function isInActiveChain(id: string, activeId: string | null): boolean {
        if (!activeId) return false;
        const entry = tocIndex.get(activeId);
        if (!entry) return false;
        if (id === activeId) return true;
        if (id === entry.parentId) return true;
        const target = tocIndex.get(id);
        if (!target) return false;
        return isDescendant(activeId, id);
    }

    function isDescendant(childId: string, ancestorId: string): boolean {
        const ancestor = tocIndex.get(ancestorId);
        if (!ancestor) return false;
        const section = ancestor.section;
        if (!section.subsections) return false;
        for (const sub of section.subsections) {
            if (sub.id === childId) return true;
            if (sub.subsections && isDescendant(childId, sub.id)) return true;
        }
        return false;
    }

    return { tocIndex, isActive, isInActiveChain, isDescendant };
}
