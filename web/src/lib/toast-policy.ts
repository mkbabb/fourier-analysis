import { toast, type ToastHandle, type ToastOptions } from "@mkbabb/glass-ui/toast";

/**
 * X.F.W14V.au6 — A2-FO-L1-21: every toast site calls glass `toast({ title,
 * description, tone, action })` itself; the positional `(message, type)`
 * adapter (`composables/useToast.ts`) is deleted. What it carried that is
 * policy, not API, is this one datum (UIA-F-214): an actionable failure waits
 * for the person — it stays until dismissed rather than leaving on the same
 * ~5 s clock as "Logged in". Error sites call `errorToast`; the title is the
 * act that failed and the description, when there is one, is the server's own
 * word (`problemDetail`).
 */
const ERROR_TOAST = {
    tone: "destructive",
    duration: Number.POSITIVE_INFINITY,
} as const satisfies ToastOptions;

/**
 * X-DS pass 1 · F1-18 — one failure, one toast. The same failure raised twice
 * (two loads hitting one rate limit) stacked two identical sticky toasts over
 * the dock. A repeat now replaces the toast it repeats, so the newest stays
 * and the stack never doubles.
 */
const live = new Map<string, ToastHandle>();

export function errorToast(options: Omit<ToastOptions, "tone" | "duration">): ToastHandle {
    const key = `${options.title ?? ""}\u0000${options.description ?? ""}`;
    live.get(key)?.dismiss();
    const handle = toast({ ...ERROR_TOAST, ...options });
    live.set(key, handle);
    return handle;
}
