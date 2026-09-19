import { ApiProblem } from "@/lib/api-problem";
import { isAbortError } from "@/lib/api";

/**
 * X·F F.W4 `.d` — the typed catch for the `/gallery` route.
 *
 * SP-12's RFC-7807 discard row (`FR-AFP-22` = `FR-AUL-50` = `FR-USB-9` = the
 * `EV-C·D-02` cohort): every catch on this route was `catch (e: any)` reading
 * `e.message`, and `ApiProblem`'s constructor calls `super(title)` — so
 * `.message` carries the TITLE only and `detail`, the sole actionable half of
 * the server's answer, was stored and never read. On `sessions.py`'s bare
 * `HTTPException`s (FastAPI emits `{"detail": …}` with no title) a mistyped slug
 * therefore read **"Not Found"**.
 *
 * Two further holes close with it: `e.message ?? fallback` never fires for an
 * EMPTY message (`"" ?? x` is `""`, and `statusText` is empty under HTTP/2), and
 * a non-`Error` throw rendered `undefined`.
 *
 * ⊘ The SHARED seam version of this helper belongs in `lib/api-problem.ts`,
 * which is unit `.f`'s file under the wave's §1 bounds — this is the
 * gallery-route home, declared so `.f`'s SP-12 sweep can cite it rather than
 * re-derive it. ⊘ `isAbortError` is re-exported here so a catch can never reach
 * for the message of a request this code itself cancelled.
 */
export function problemMessage(e: unknown, fallback: string): string {
    if (e instanceof ApiProblem) {
        const detail = e.detail?.trim();
        if (detail) return detail;
        const title = e.title?.trim();
        if (title) return title;
        return fallback;
    }
    if (e instanceof Error) {
        const message = e.message?.trim();
        if (message) return message;
    }
    return fallback;
}

export { isAbortError };
