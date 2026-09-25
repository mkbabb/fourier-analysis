import { h } from "vue";
import type { RouteLocationRaw } from "vue-router";
import {
    ToastAction,
    toast as glassToast,
    useToast as glassUseToast,
} from "@mkbabb/glass-ui/toast";
import router from "@/router";

export type ToastType = "error" | "info" | "success";

/**
 * F.W1 / FR-AUL-10 ⊕ FR-AUL-45 — the adapter rides the producer's TONE axis:
 * the three types land on the three tones they name.
 */
const TONE_MAP = {
    error: "destructive",
    info: "info",
    success: "success",
} as const;

/** A toast's one follow-up: a labelled action that opens a route. */
export interface ToastLink {
    label: string;
    to: RouteLocationRaw;
}

export interface ToastOptions {
    /**
     * `fr-App MG-λ` — HONOURED: forwarded when given (glass's `ToastOptions`
     * `duration`, ms; `Number.POSITIVE_INFINITY` keeps the toast open).
     */
    duration?: number;
    /** UIA-F-248 ⊕ UIA-F-183: the follow-up a success offers (e.g. View). */
    action?: ToastLink;
}

/**
 * X.F.W14U.shell — UIA-F-214 ⊕ UIA-F-256, the toast policy.
 *
 * - The message IS the toast. The generic "Error" / "Success" / "Info" title
 *   only repeated the tone the plate already paints and doubled its height, so
 *   there is no title.
 * - An error waits for the person: it stays until dismissed (an actionable
 *   failure must not leave on the same ~5 s clock as "Logged in"). Other tones
 *   keep the provider default unless a caller asks.
 * - A toast names what it is about in its own words; the `(slug)` suffix the
 *   adapter used to append is gone (callers say what the piece is).
 * - `action` is glass's `ToastAction` (its `altText` = the label), opening a
 *   route through the app's router.
 */
function addToast(message: string, type: ToastType = "info", options?: ToastOptions) {
    const duration = options?.duration ?? (type === "error" ? Number.POSITIVE_INFINITY : undefined);
    const link = options?.action;
    glassToast({
        description: message,
        tone: TONE_MAP[type],
        ...(duration !== undefined ? { duration } : {}),
        ...(link
            ? { action: h(ToastAction, { altText: link.label, onClick: () => router.push(link.to) }, () => link.label) }
            : {}),
    });
}

export function useToast() {
    const { dismiss } = glassUseToast();

    return {
        toast: addToast,
        dismiss,
    };
}
