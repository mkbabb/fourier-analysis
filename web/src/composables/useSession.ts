import { ref, type Ref } from "vue";
import { createSession, setSessionToken } from "@/lib/api";
import { safeGetItem, safeSetItem } from "./useSafeStorage";

const SESSION_KEY = "fourier-session-token";

let _token: Ref<string | null> | null = null;
let _initialized = false;

function getToken(): Ref<string | null> {
    if (!_token) {
        _token = ref<string | null>(safeGetItem(sessionStorage, SESSION_KEY));
    }
    return _token;
}

function initialize() {
    if (_initialized) return;
    _initialized = true;
    const t = getToken();
    if (t.value) {
        setSessionToken(t.value);
    }
}

async function ensureSession(): Promise<string> {
    const token = getToken();
    if (token.value) return token.value;

    const res = await createSession();
    token.value = res.token;
    safeSetItem(sessionStorage, SESSION_KEY, res.token);
    setSessionToken(res.token);
    return res.token;
}

function clearSession() {
    const token = getToken();
    token.value = null;
    sessionStorage.removeItem(SESSION_KEY);
}

export function useSession() {
    initialize();
    return {
        token: getToken(),
        ensureSession,
        clearSession,
    };
}
