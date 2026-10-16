/**
 * Safe localStorage/sessionStorage wrappers that silently handle
 * errors (e.g. Safari private browsing, quota exceeded).
 *
 * X.F.W14U.misc — UIA-F-120 / UIA-F-213: with site data blocked, READING the
 * `window.localStorage` / `window.sessionStorage` property throws
 * ("The operation is insecure." / SecurityError) — before any of the wrappers
 * below is entered, because a call site that names `localStorage` evaluates it
 * as the argument. `safeStorage` resolves the area inside the guard and answers
 * `null` when it is unavailable; losing storage then only means nothing is
 * remembered. Call sites resolve their area through it.
 */
export type StorageArea = "local" | "session";

export function safeStorage(area: StorageArea): Storage | null {
    try {
        return area === "local" ? window.localStorage : window.sessionStorage;
    } catch {
        return null;
    }
}

export function safeGetItem(storage: Storage | null, key: string): string | null {
    try {
        return storage?.getItem(key) ?? null;
    } catch {
        return null;
    }
}

export function safeSetItem(storage: Storage | null, key: string, value: string): void {
    try {
        storage?.setItem(key, value);
    } catch {
        // Safari private browsing or quota exceeded
    }
}

export function safeRemoveItem(storage: Storage | null, key: string): void {
    try {
        storage?.removeItem(key);
    } catch {
        // Safari private browsing
    }
}
