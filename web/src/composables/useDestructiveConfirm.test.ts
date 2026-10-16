// SERVED MODEL: claude-opus-5-5
/**
 * X.F.W14V.au4 — A2-FO-L1-9: the destructive-confirm state machine (a typed
 * pending intent, an in-flight lock, close after the act settles) is written
 * once, in `useDestructiveConfirm`, and the gallery, users and flagged confirms
 * all read it.
 */
import { describe, expect, it } from "vitest";
import { effectScope, ref } from "vue";

import { useDestructiveConfirm as use } from "./useDestructiveConfirm";

type Intent = { kind: "delete"; slug: string } | { kind: "prune" };

const useConfirm = (...args: Parameters<typeof use<Intent>>) => effectScope().run(() => use<Intent>(...args))!;

function deferred() {
    let resolve!: () => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe("useDestructiveConfirm", () => {
    it("ask opens the dialog on a typed intent", () => {
        const c = useConfirm();
        expect(c.open.value).toBe(false);
        c.ask({ kind: "delete", slug: "a" });
        expect(c.open.value).toBe(true);
        expect(c.pending.value).toEqual({ kind: "delete", slug: "a" });
    });

    it("dismissing clears the intent", () => {
        const c = useConfirm();
        c.ask({ kind: "prune" });
        c.setOpen(false);
        expect(c.open.value).toBe(false);
        expect(c.pending.value).toBeNull();
    });

    it("confirm runs the intent once, locks while in flight, and closes after it settles", async () => {
        const c = useConfirm();
        const d = deferred();
        const seen: Intent[] = [];
        c.ask({ kind: "delete", slug: "a" });
        const run = c.confirm(async (i) => {
            seen.push(i);
            await d.promise;
        });
        expect(c.busy.value).toBe(true);
        expect(c.open.value, "held open while in flight").toBe(true);
        // A second confirm, a re-ask and a dismissal are all refused mid-flight.
        await c.confirm(async (i) => void seen.push(i));
        c.ask({ kind: "prune" });
        c.setOpen(false);
        expect(c.open.value).toBe(true);
        expect(c.pending.value).toEqual({ kind: "delete", slug: "a" });
        d.resolve();
        await run;
        expect(seen).toEqual([{ kind: "delete", slug: "a" }]);
        expect(c.busy.value).toBe(false);
        expect(c.open.value).toBe(false);
        expect(c.pending.value).toBeNull();
    });

    it("a failed act still releases the lock and closes", async () => {
        const c = useConfirm();
        c.ask({ kind: "prune" });
        await expect(c.confirm(async () => Promise.reject(new Error("x")))).rejects.toThrow("x");
        expect(c.busy.value).toBe(false);
        expect(c.open.value).toBe(false);
    });

    it("a caller's busy flag is the lock", async () => {
        const busy = ref(true);
        const c = useConfirm({ busy });
        c.ask({ kind: "prune" });
        expect(c.open.value, "no ask while the caller is busy").toBe(false);
        busy.value = false;
        c.ask({ kind: "prune" });
        let ran = false;
        await c.confirm(async () => {
            expect(busy.value).toBe(true);
            ran = true;
        });
        expect(ran).toBe(true);
        expect(busy.value).toBe(false);
    });
});
