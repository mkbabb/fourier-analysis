import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { createSession, loginWithSlug, deleteSession, setSessionToken } from "@/lib/api";
import { safeGetItem, safeSetItem, safeRemoveItem } from "@/composables/useSafeStorage";

const USER_SLUG_KEY = "fourier-user-slug";
const USER_TOKEN_KEY = "fourier-user-token";
const ADMIN_TOKEN_KEY = "fourier-admin-token";
const SESSION_TOKEN_KEY = "fourier-session-token";

export const useAuthStore = defineStore("auth", () => {
    // ── State ───────────────────────────────────────────────────────────

    const userSlug = ref<string | null>(safeGetItem(localStorage, USER_SLUG_KEY));
    const userToken = ref<string | null>(safeGetItem(localStorage, USER_TOKEN_KEY));
    const adminToken = ref<string | null>(safeGetItem(localStorage, ADMIN_TOKEN_KEY));
    const sessionToken = ref<string | null>(safeGetItem(sessionStorage, SESSION_TOKEN_KEY));

    // ── Derived ─────────────────────────────────────────────────────────

    const isLoggedIn = computed(() => !!userSlug.value);
    const isAdminAuthenticated = computed(() => !!adminToken.value);

    // ── Bootstrap ───────────────────────────────────────────────────────
    // Restore the API-layer session token on store creation.

    if (userToken.value) {
        setSessionToken(userToken.value);
    } else if (sessionToken.value) {
        setSessionToken(sessionToken.value);
    }

    // ── User auth ───────────────────────────────────────────────────────

    function persistUser(slug: string, token: string) {
        userSlug.value = slug;
        userToken.value = token;
        safeSetItem(localStorage, USER_SLUG_KEY, slug);
        safeSetItem(localStorage, USER_TOKEN_KEY, token);
        setSessionToken(token);
    }

    async function register(): Promise<string> {
        const res = await createSession();
        if (!res.user_slug) {
            throw new Error("Server did not return a user slug");
        }
        persistUser(res.user_slug, res.token);
        return res.user_slug;
    }

    async function login(slug: string): Promise<void> {
        const res = await loginWithSlug(slug);
        if (!res.user_slug) {
            throw new Error("Server did not return a user slug");
        }
        persistUser(res.user_slug, res.token);
    }

    async function logout() {
        try {
            await deleteSession();
        } catch {
            // Session may already be expired
        }
        userSlug.value = null;
        userToken.value = null;
        safeRemoveItem(localStorage, USER_SLUG_KEY);
        safeRemoveItem(localStorage, USER_TOKEN_KEY);
        setSessionToken(null);
    }

    let _ensurePromise: Promise<string> | null = null;

    async function ensureUser(): Promise<string> {
        if (userSlug.value) return userSlug.value;
        if (_ensurePromise) return _ensurePromise;
        _ensurePromise = register().finally(() => {
            _ensurePromise = null;
        });
        return _ensurePromise;
    }

    // ── Admin auth ──────────────────────────────────────────────────────

    function adminLogin(token: string) {
        adminToken.value = token;
        safeSetItem(localStorage, ADMIN_TOKEN_KEY, token);
    }

    function adminLogout() {
        adminToken.value = null;
        safeRemoveItem(localStorage, ADMIN_TOKEN_KEY);
    }

    function getAdminToken(): string | null {
        return adminToken.value;
    }

    // ── Session (anonymous) ─────────────────────────────────────────────

    async function ensureSession(): Promise<string> {
        if (sessionToken.value) return sessionToken.value;

        const res = await createSession();
        sessionToken.value = res.token;
        safeSetItem(sessionStorage, SESSION_TOKEN_KEY, res.token);
        setSessionToken(res.token);
        return res.token;
    }

    function clearSession() {
        sessionToken.value = null;
        try {
            sessionStorage.removeItem(SESSION_TOKEN_KEY);
        } catch {
            // Safari private browsing
        }
    }

    return {
        // state
        userSlug,
        userToken,
        adminToken,
        sessionToken,
        // derived
        isLoggedIn,
        isAdminAuthenticated,
        // user actions
        register,
        login,
        logout,
        ensureUser,
        // admin actions
        adminLogin,
        adminLogout,
        getAdminToken,
        // session actions
        ensureSession,
        clearSession,
    };
});
