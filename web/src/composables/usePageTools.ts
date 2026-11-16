import { onScopeDispose, shallowRef, type VNodeChild } from "vue";

/**
 * A page's own tool set in the app dock (owner, 2026-11-15: "Each page should
 * have a tool set in the main dock"). The route component hands the dock a
 * render function for its seats while it is mounted; `AppDock` renders it in
 * its own tree, after the sections, so the seats are the dock's children (its
 * press, hover and keep-open context reach them) while their state stays the
 * page's. A page with no tools of its own provides nothing and the seat is
 * not drawn.
 *
 * The dock hands the render its `hold`: a menu opened from a page's seat holds
 * the dock open while it is open (glass's keep-open count), as the sections
 * menu does. Under 40rem a page draws its tools as ONE menu seat (the run
 * holds the shell's four seats and one more, not the page's every act).
 */
export interface PageToolsContext {
    hold: (open: boolean) => void;
}

/** The phone's run: the page's tools are one menu seat below this width. */
export const PAGE_TOOLS_COMPACT = "(width < 40rem)";

interface PageTools {
    owner: symbol;
    /** The seats' accessible group name, e.g. "Visualize tools". */
    label: string;
    render: (ctx: PageToolsContext) => VNodeChild;
    /** Whether the page has a seat to show now (an empty group draws no separator). */
    shown: () => boolean;
}

const current = shallowRef<PageTools | null>(null);

export function providePageTools(label: string, render: (ctx: PageToolsContext) => VNodeChild, shown: () => boolean = () => true): void {
    const owner = Symbol(label);
    current.value = { owner, label, render, shown };
    onScopeDispose(() => {
        if (current.value?.owner === owner) current.value = null;
    });
}

/** The dock's read of the current page's tools (null off a page that has none). */
export function usePageTools() {
    return current;
}
