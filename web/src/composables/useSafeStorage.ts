/**
 * Safe localStorage/sessionStorage wrappers that silently handle
 * errors (e.g. Safari private browsing, quota exceeded).
 */
export function safeGetItem(storage: Storage, key: string): string | null {
    try {
        return storage.getItem(key);
    } catch {
        return null;
    }
}

export function safeSetItem(storage: Storage, key: string, value: string): void {
    try {
        storage.setItem(key, value);
    } catch {
        // Safari private browsing or quota exceeded
    }
}

export function safeRemoveItem(storage: Storage, key: string): void {
    try {
        storage.removeItem(key);
    } catch {
        // Safari private browsing
    }
}
