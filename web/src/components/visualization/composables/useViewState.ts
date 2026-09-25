import { ref, watch } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { safeGetItem, safeSetItem, safeStorage } from "@/composables/useSafeStorage";

const VIEW_STATE_KEY = "fourier_visualizer_view_state";

function loadViewState(): { editing?: boolean; overlay?: boolean; equation?: boolean } {
    try {
        return JSON.parse(safeGetItem(safeStorage("local"), VIEW_STATE_KEY) ?? "{}");
    } catch {
        return {};
    }
}

export function useViewState() {
    const store = useWorkspaceStore();
    const saved = loadViewState();

    const isEditing = ref(false);
    const showGhost = ref(true);
    const showImageOverlay = ref(typeof saved.overlay === "boolean" ? saved.overlay : false);
    const showEquation = ref(typeof saved.equation === "boolean" ? saved.equation : false);

    // Restore editing immediately once contour is available
    if (saved.editing) {
        let restored = false;
        watch(
            () => store.contour,
            (contour) => {
                if (contour && !restored) {
                    restored = true;
                    isEditing.value = true;
                }
            },
            { immediate: true },
        );
    }

    // Auto-exit editing if contour disappears
    watch(() => store.contour, (c) => {
        if (!c && isEditing.value) isEditing.value = false;
    });

    watch([isEditing, showImageOverlay, showEquation], () => {
        // X.F.W14U.misc — UIA-F-213: the write goes through the safe accessor
        // (it threw on every toggle with site data blocked).
        safeSetItem(safeStorage("local"), VIEW_STATE_KEY, JSON.stringify({
            editing: isEditing.value,
            overlay: showImageOverlay.value,
            equation: showEquation.value,
        }));
    });

    return { isEditing, showGhost, showImageOverlay, showEquation };
}
