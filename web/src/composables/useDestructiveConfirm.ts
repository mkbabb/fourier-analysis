import { ref, shallowRef, type Ref } from "vue";

/**
 * X.F.W14V.au4 — A2-FO-L1-9: the destructive-confirm state machine, written
 * once. The gallery batch/single delete, the admin users list and the flagged
 * queue each re-derived it (a pending intent, an in-flight guard, a footer),
 * three spellings of one machine with three different release rules.
 *
 * - `ask(intent)` opens the dialog on a typed intent; it is refused while an
 *   act is in flight.
 * - `setOpen(false)` (Cancel, Escape, the outside press) clears the intent;
 *   it is refused while an act is in flight, so the dialog is locked, not
 *   dismissed under a running mutation.
 * - `confirm(run)` runs the held intent once, holds the lock for the whole
 *   act, and closes after it settles (success or failure). A caller that
 *   handles its own failure never sees a throw; one that does not gets it.
 *
 * `busy` may be the caller's own flag, so the rows' controls and the dialog
 * read one lock (the users list's per-row Suspend shares it).
 */
export function useDestructiveConfirm<I>(options: { busy?: Ref<boolean> } = {}) {
    const pending = shallowRef<I | null>(null);
    const open = ref(false);
    const busy = options.busy ?? ref(false);

    function ask(intent: I) {
        if (busy.value) return;
        pending.value = intent;
        open.value = true;
    }

    function setOpen(next: boolean) {
        if (busy.value) return;
        open.value = next;
        if (!next) pending.value = null;
    }

    async function confirm(run: (intent: I) => Promise<unknown>) {
        const intent = pending.value;
        if (intent === null || busy.value) return;
        busy.value = true;
        try {
            await run(intent);
        } finally {
            busy.value = false;
            open.value = false;
            pending.value = null;
        }
    }

    return { pending, open, busy, ask, setOpen, confirm };
}
