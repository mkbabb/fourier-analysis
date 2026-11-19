import { computed } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useQueryParam } from "@/lib/urlState";
import { WORKSPACE_QUERY } from "../lib/workspace-query";

/**
 * X.F.W14V.u1 — UIA-F-173: the view layers' defaults, in one place: the
 * picture under the drawing, and no dashed outline over it.
 */
export const VIEW_DEFAULTS = { ghost: false, overlay: true } as const;

export function isViewOffDefault(view: { ghost: boolean; overlay: boolean }): boolean {
    return view.ghost !== VIEW_DEFAULTS.ghost || view.overlay !== VIEW_DEFAULTS.overlay;
}

/**
 * The workspace's view state, held in the URL (owner, 2026-11-15: "Each page
 * should have state defined in the URL ... background showing, etc.";
 * `lib/workspace-query.ts` names the keys). Each ref reads the current URL, so
 * Back and Forward restore it, and each write is a push, so Back undoes it.
 * The URL is the one home: the per-browser copy this composable kept in
 * localStorage is retired with it (a clean link opens the defaults).
 */
export function useViewState() {
    const store = useWorkspaceStore();

    const showImageOverlay = useQueryParam("bg", WORKSPACE_QUERY.bg, true);
    const showGhost = useQueryParam("trace", WORKSPACE_QUERY.trace, true);
    const showEquation = useQueryParam("eq", WORKSPACE_QUERY.eq, true);
    const showFullscreen = useQueryParam("fs", WORKSPACE_QUERY.fs, true);
    const editParam = useQueryParam("edit", WORKSPACE_QUERY.edit, true);
    /** The editor is open only over a contour: `edit=1` waits for one to load. */
    const isEditing = computed<boolean>({
        get: () => editParam.value && !!store.contour,
        set: (v) => {
            editParam.value = v;
        },
    });

    return { isEditing, showGhost, showImageOverlay, showEquation, showFullscreen };
}
