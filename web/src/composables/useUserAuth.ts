import { ref, computed, type Ref } from "vue";
import { createSession, loginWithSlug, deleteSession, setSessionToken } from "@/lib/api";
import { safeGetItem, safeSetItem, safeRemoveItem } from "./useSafeStorage";

const SLUG_KEY = "fourier-user-slug";
const TOKEN_KEY = "fourier-user-token";

let _userSlug: Ref<string | null> | null = null;
let _userToken: Ref<string | null> | null = null;
let _ensurePromise: Promise<string> | null = null;

function getUserSlug(): Ref<string | null> {
    if (!_userSlug) {
        _userSlug = ref<string | null>(safeGetItem(localStorage, SLUG_KEY));
    }
    return _userSlug;
}

function getUserToken(): Ref<string | null> {
    if (!_userToken) {
        _userToken = ref<string | null>(safeGetItem(localStorage, TOKEN_KEY));
    }
    return _userToken;
}

function persist(slug: string, token: string) {
    const slugRef = getUserSlug();
    const tokenRef = getUserToken();
    slugRef.value = slug;
    tokenRef.value = token;
    safeSetItem(localStorage, SLUG_KEY, slug);
    safeSetItem(localStorage, TOKEN_KEY, token);
    setSessionToken(token);
}

export function useUserAuth() {
    const slugRef = getUserSlug();
    const tokenRef = getUserToken();

    // Restore session token on first use
    if (tokenRef.value) {
        setSessionToken(tokenRef.value);
    }

    const userSlug = computed(() => slugRef.value);
    const isLoggedIn = computed(() => !!slugRef.value);

    async function register(): Promise<string> {
        const res = await createSession();
        if (!res.user_slug) {
            throw new Error("Server did not return a user slug");
        }
        persist(res.user_slug, res.token);
        return res.user_slug;
    }

    async function login(slug: string): Promise<void> {
        const res = await loginWithSlug(slug);
        if (!res.user_slug) {
            throw new Error("Server did not return a user slug");
        }
        persist(res.user_slug, res.token);
    }

    async function logout() {
        try {
            await deleteSession();
        } catch {
            // Session may already be expired
        }
        slugRef.value = null;
        tokenRef.value = null;
        safeRemoveItem(localStorage, SLUG_KEY);
        safeRemoveItem(localStorage, TOKEN_KEY);
        setSessionToken(null);
    }

    async function ensureUser(): Promise<string> {
        if (slugRef.value) return slugRef.value;
        if (_ensurePromise) return _ensurePromise;
        _ensurePromise = register().finally(() => {
            _ensurePromise = null;
        });
        return _ensurePromise;
    }

    return { userSlug, isLoggedIn, register, login, logout, ensureUser };
}
