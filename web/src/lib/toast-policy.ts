import type { ToastOptions } from "@mkbabb/glass-ui/toast";

/**
 * X.F.W14V.au6 — A2-FO-L1-21: every toast site calls glass `toast({ title,
 * description, tone, action })` itself; the positional `(message, type)`
 * adapter (`composables/useToast.ts`) is deleted. What it carried that is
 * policy, not API, is this one datum (UIA-F-214): an actionable failure waits
 * for the person — it stays until dismissed rather than leaving on the same
 * ~5 s clock as "Logged in". Error sites spread it; the title is the act that
 * failed and the description, when there is one, is the server's own word
 * (`problemDetail`).
 */
export const ERROR_TOAST = {
    tone: "destructive",
    duration: Number.POSITIVE_INFINITY,
} as const satisfies ToastOptions;
