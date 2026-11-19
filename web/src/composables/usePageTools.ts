import { onScopeDispose, shallowRef, type VNodeChild } from "vue";

/**
 * A page's own tool set in the app dock (owner, 2026-11-15: "Each page should
 * have a tool set in the main dock"; 19 Nov: "if you want to go this route, we
 * should better contextually display controls in the top bar depending on
 * page"). The top bar is contextual by design: the dock's leading seats (Home,
 * the sections) and trailing seats (account, About, theme) never move, and its
 * centre is the page's own.
 *
 * A route view declares its seats once, in setup. The seats exist from the
 * page's first frame: a seat that waits on data is rendered disabled by the
 * page's own render, never mounted late. `AppDock` renders the render
 * function in its own tree, so the seats are the dock's children (its press,
 * hover and keep-open context reach them) while their state stays the page's.
 * A page with no tools of its own provides nothing and the centre is empty.
 *
 * The dock hands the render the `form` it wants: `seats` (each act a dock
 * control) or `items` (each act a menu item, for a host whose page tools sit
 * in a menu, such as a stage dock's "more").
 *  · From 40rem the app dock renders `render({ form: "seats" })` in its centre.
 *  · Under 40rem the app dock renders no page tools: the run holds the
 *    leading and trailing seats with honest room, and the page renders its
 *    tools on its own stage surface.
 */
export type PageToolsForm = "seats" | "items";

export interface PageToolsContext {
    form: PageToolsForm;
}

/** The phone's run: under this width the app dock draws no page tools. */
export const PAGE_TOOLS_COMPACT = "(width < 40rem)";

export interface PageTools {
    owner: symbol;
    /** The tools' accessible group name, e.g. "Visualize tools". */
    label: string;
    render: (ctx: PageToolsContext) => VNodeChild;
}

const current = shallowRef<PageTools | null>(null);

export function providePageTools(label: string, render: (ctx: PageToolsContext) => VNodeChild): void {
    const owner = Symbol(label);
    current.value = { owner, label, render };
    onScopeDispose(() => {
        if (current.value?.owner === owner) current.value = null;
    });
}

/** The dock's read of the current page's tools (null off a page that has none). */
export function usePageTools() {
    return current;
}
