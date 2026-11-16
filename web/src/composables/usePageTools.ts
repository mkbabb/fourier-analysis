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
 * The dock hands the render the `form` it wants: `seats` (each act a dock
 * control) or `items` (each act a menu item). Under 40rem the run holds only four seats with honest
 * room either side, so the dock draws no seat for the page: the sections menu
 * absorbs the page's acts as items under the five sections (one menu, one
 * seat). The fullscreen takeover hosts the same seats on its stage dock.
 */
export type PageToolsForm = "seats" | "items";

export interface PageToolsContext {
    form: PageToolsForm;
}

/** The phone's run: the page's tools are items of the sections menu below this width. */
export const PAGE_TOOLS_COMPACT = "(width < 40rem)";

interface PageTools {
    owner: symbol;
    /** The tools' accessible group name, e.g. "Visualize tools" (the menu's label for them). */
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
