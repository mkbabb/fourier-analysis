import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { pageOf, useQueryParam, writeParams } from "@/lib/urlState";
import { formatWorkspaceQuery, WASH_DEFAULT, WORKSPACE_QUERY } from "../lib/workspace-query";
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
    /**
     * FORTY-SIXTH D: the picture's strength under a drawing, in percent (`wash`,
     * a replace: the view is tuned, not navigated). `held` is the value under
     * the hand while the strength row is dragged; the URL is written once, as
     * the hand lets go, so Back never walks through a drag.
     */
    const washParam = useQueryParam("wash", WORKSPACE_QUERY.wash, false);
    /** The value under the hand, until the URL says otherwise. */
    const washHeld = ref<number | null>(null);
    /** The row is in the hand: the stage follows it 1:1, with no tween. */
    const washDragging = ref(false);
    const wash = computed(() => washHeld.value ?? washParam.value ?? WASH_DEFAULT);
    // A URL that moves under the row (Back, Forward, a link) is the strength.
    watch(washParam, () => {
        if (!washDragging.value) washHeld.value = null;
    });
    /** The row moves: the stage follows 1:1. A drag on a hidden picture shows it (one replace). */
    function holdWash(percent: number): void {
        washHeld.value = percent;
        washDragging.value = true;
        if (!showImageOverlay.value) {
            writeParams(router, formatWorkspaceQuery({ bg: true }), false, own);
        }
    }
    /** The hand lets go (or a key steps it): the strength is written to the URL once. */
    function commitWash(percent: number): void {
        washHeld.value = percent;
        washDragging.value = false;
        writeParams(router, formatWorkspaceQuery({ wash: percent, bg: true }), false, own);
    }
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
        wash,
        washDragging,
        holdWash,
        commitWash,
    };
}
