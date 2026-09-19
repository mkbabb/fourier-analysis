import {
    toast as glassToast,
    useToast as glassUseToast,
} from "@mkbabb/glass-ui/toast";

export type ToastType = "error" | "info" | "success";

/**
 * F.W1 / FR-AUL-10 ⊕ FR-AUL-45 — the adapter is rewritten onto the producer's
 * TONE axis, and the tone restoration folds into the same edit.
 *
 * `ToastVariant` is definition-absent at the adopted pin: a toast reports, so it
 * carries the five-rung semantic `tone` (`neutral · success · warning · info ·
 * destructive`) and no style `variant` at all. The old map flattened BOTH
 * `success` and `info` onto `default` — every non-error toast painted the same
 * neutral plate although the Toaster maps distinct tone classes for each. The
 * three types now land on the three tones they name.
 */
const TONE_MAP = {
    error: "destructive",
    info: "info",
    success: "success",
} as const;

const TITLE_MAP: Record<ToastType, string> = {
    error: "Error",
    info: "Info",
    success: "Success",
};

/**
 * `fr-App MG-λ` — the typed knob that was accepted and thrown away (X·F F.W4
 * `.f`; SP-2, because this adapter IS the app's error channel).
 *
 * `options.duration` was declared, typed and documented, and the body read
 * `options?.slug` alone — so every caller that asked for a longer-lived toast
 * got the provider default and no signal that its request had been dropped.
 * The ruling is HONOUR-OR-DELETE, never the half-landing, and the producer
 * settles it: glass-ui 8.0.0's `ToastOptions` carries `duration` ("auto-dismiss
 * delay in ms, forwarded to reka-ui's `ToastRoot`; omit to inherit the
 * `ToastProvider` default; `Number.POSITIVE_INFINITY` keeps the toast open
 * until dismissed"). The knob is therefore HONOURED — forwarded when given,
 * omitted when not, so the provider default still governs the common case.
 *
 * ⊘ The `ToastVariant` limb of the same row is F.W1's fold, cited and not
 * re-booked: this adapter already rides the producer's five-rung `tone` axis.
 */
function addToast(message: string, type: ToastType = "info", options?: { duration?: number; slug?: string }) {
    const description = options?.slug ? `${message} (${options.slug})` : message;

    glassToast({
        title: TITLE_MAP[type],
        description,
        tone: TONE_MAP[type],
        ...(options?.duration !== undefined ? { duration: options.duration } : {}),
    });
}

export function useToast() {
    const { dismiss } = glassUseToast();

    return {
        toast: addToast,
        dismiss,
    };
}
