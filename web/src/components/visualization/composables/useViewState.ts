import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { pageOf, useQueryParam, writeParams } from "@/lib/urlState";
import { formatWorkspaceQuery, WORKSPACE_QUERY } from "../lib/workspace-query";
import { isJustThePicture, toggleJustThePicture, type DrawnLayer, type Layers } from "../lib/layers";

/**
 * The workspace's view state, held in the URL (owner, 2026-11-15: "Each page
 * should have state defined in the URL ... background showing, etc.";
 * `lib/workspace-query.ts` names the keys). Each ref reads the current URL, so
 * Back and Forward restore it, and each write is a push, so Back undoes it.
 * The URL is the one home: a clean link opens the defaults
 * (`lib/layers.ts` `LAYER_DEFAULTS`).
 */
export function useViewState() {
    const store = useWorkspaceStore();
    const route = useRoute();
    const router = useRouter();
    const own = pageOf(route);

    const showImageOverlay = useQueryParam("bg", WORKSPACE_QUERY.bg, true);
    const showGhost = useQueryParam("trace", WORKSPACE_QUERY.trace, true);
    const showLine = useQueryParam("line", WORKSPACE_QUERY.line, true);
    const showCircles = useQueryParam("circles", WORKSPACE_QUERY.circles, true);
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

    /** The four layers as one record. */
    const layers = computed<Layers>(() => ({
        picture: showImageOverlay.value,
        outline: showGhost.value,
        line: showLine.value,
        circles: showCircles.value,
    }));

    /** Set several layers in one push, so one Back undoes them together. */
    function setLayers(next: Layers): void {
        writeParams(
            router,
            formatWorkspaceQuery({ bg: next.picture, trace: next.outline, line: next.line, circles: next.circles }),
            true,
            own,
        );
    }

    /** What "just the picture" hid, so pressing it again brings exactly that back. */
    const hid = ref<DrawnLayer[] | null>(null);
    const justThePicture = computed(() => isJustThePicture(layers.value));
    function toggleJustPicture(): void {
        const next = toggleJustThePicture(layers.value, hid.value);
        hid.value = next.hid;
        setLayers(next.layers);
    }

    return {
        isEditing,
        showGhost,
        showImageOverlay,
        showLine,
        showCircles,
        showEquation,
        showFullscreen,
        layers,
        justThePicture,
        toggleJustPicture,
    };
}
