import { defineComponent, onBeforeUnmount } from "vue";

/**
 * Says when an overlay's leave has run to its end.
 *
 * Placed inside a glass `DialogContent` or `PopoverContent`, it is unmounted
 * with that content, and the content is unmounted only when its exit has
 * finished (glass keeps it mounted through its own spring or keyframe exit).
 * A host that must keep showing its datum while the surface leaves clears the
 * datum on `left`, never in the close handler: clearing it there blanks the
 * surface on the first frame of its exit, or, behind a `v-if`, removes it whole.
 *
 * A reopen inside the exit keeps the content mounted, so `left` does not fire
 * and the datum survives. Glass mints no after-leave event on these parts;
 * this is the one signal that matches the content's own lifetime.
 */
export default defineComponent({
    name: "LeaveSignal",
    emits: ["left"],
    setup(_, { emit }) {
        onBeforeUnmount(() => emit("left"));
        return () => null;
    },
});
