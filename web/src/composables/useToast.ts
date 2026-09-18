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

function addToast(message: string, type: ToastType = "info", options?: { duration?: number; slug?: string }) {
    const description = options?.slug ? `${message} (${options.slug})` : message;

    glassToast({
        title: TITLE_MAP[type],
        description,
        tone: TONE_MAP[type],
    });
}

export function useToast() {
    const { dismiss } = glassUseToast();

    return {
        toast: addToast,
        dismiss,
    };
}
