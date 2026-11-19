import { onScopeDispose, shallowRef, type Ref, type WritableComputedRef } from "vue";
import { oneOf, useQueryParam } from "@/lib/urlState";

/**
 * The pane a stage-plus-inspector route shows on a phone (`useWorkspaceForm`'s
 * `sheet`): the stage (`canvas`) or its controls. Owner, 19 Nov: "the tabs
 * toggle for controls should potentially be re-integrated into the top dock".
 *
 * The choice lives in the URL (`tab=controls`; absent is the canvas). Showing
 * the controls is a press a person expects Back to undo, so it pushes; Back
 * returns to the canvas.
 *
 * While `tabbed` is true the app dock draws the switch, one seat outside its
 * fold (`AppDock.vue`, glass's `#persistent-end` region), so it is one press
 * from rest; the view lays out the two panes (`styles/workspace.css`).
 */
export type WorkspacePane = "canvas" | "controls";

const PANE = oneOf<WorkspacePane>(["canvas", "controls"], "canvas");

/** The URL key the pane is written under. */
export const PANE_KEY = "tab";

export interface PaneSeat {
    owner: symbol;
    /** Whether the view is in its one-pane form (the seat shows only then). */
    tabbed: Readonly<Ref<boolean>>;
    pane: WritableComputedRef<WorkspacePane>;
}

const current = shallowRef<PaneSeat | null>(null);

export function useWorkspacePane(tabbed: Readonly<Ref<boolean>>): { pane: WritableComputedRef<WorkspacePane> } {
    const pane = useQueryParam(PANE_KEY, PANE, true);
    const owner = Symbol("workspace-pane");
    current.value = { owner, tabbed, pane };
    onScopeDispose(() => {
        if (current.value?.owner === owner) current.value = null;
    });
    return { pane };
}

/** The app dock's read of the current view's pane (null off a stage route). */
export function useDockPane() {
    return current;
}
