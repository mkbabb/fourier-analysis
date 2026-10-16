import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { createSession, loginWithSlug, deleteSession, setSessionToken } from "@/lib/api";
import { ApiProblem } from "@/lib/api-problem";
import { safeGetItem, safeSetItem, safeRemoveItem, safeStorage } from "@/composables/useSafeStorage";

const USER_SLUG_KEY = "fourier-user-slug";
const USER_TOKEN_KEY = "fourier-user-token";
const ADMIN_TOKEN_KEY = "fourier-admin-token";
const SESSION_TOKEN_KEY = "fourier-session-token";

/*
 * X.F.W14U.misc — UIA-F-120 / UIA-F-213: every storage access resolves its area
 * through `safeStorage`. Naming `localStorage` as an argument threw before the
 * guard was entered when site data is blocked, which took the store — and the
 * app — down at boot; with storage gone the credentials simply live in memory.
 */
const local = () => safeStorage("local");
const session = () => safeStorage("session");

export const useAuthStore = defineStore("auth", () => {
    // ── State ───────────────────────────────────────────────────────────

    const userSlug = ref<string | null>(safeGetItem(local(), USER_SLUG_KEY));
    const userToken = ref<string | null>(safeGetItem(local(), USER_TOKEN_KEY));
    const adminToken = ref<string | null>(safeGetItem(local(), ADMIN_TOKEN_KEY));
    const sessionToken = ref<string | null>(safeGetItem(session(), SESSION_TOKEN_KEY));

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
        safeSetItem(local(), USER_SLUG_KEY, slug);
        safeSetItem(local(), USER_TOKEN_KEY, token);
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

    /**
     * X.F.W14U.misc — UIA-F-256 (the logout limb, `.shell` R-2): a session the
     * server no longer knows (401/404) is already ended, so the local sign-out
     * completes. Any other failure leaves a live server session behind: it is
     * rethrown with the account still signed in, so the caller reports it
     * instead of announcing "Logged out".
     */
    async function logout() {
        try {
            await deleteSession();
        } catch (e) {
            if (!(e instanceof ApiProblem && (e.status === 401 || e.status === 404))) throw e;
        }
        forgetUser();
        setSessionToken(null);
    }

    // ── Sign-in on request ──────────────────────────────────────────────
    /*
     * X.F.W14V.p — an act that needs a signed-in account (Publish) asks for the
     * sign-in instead of ending in a refusal. `requestSignIn` opens the shell's
     * own inline sign-in (the account popover in the app dock, which watches
     * `signInRequested`) and settles when that surface closes: `true` once the
     * person is signed in, `false` if they dismissed it. The caller resumes its
     * act on `true`. A second request supersedes the first (it settles `false`).
     */
    const signInRequested = ref(false);
    let settleSignIn: ((signedIn: boolean) => void) | null = null;

    function requestSignIn(): Promise<boolean> {
        if (isLoggedIn.value) return Promise.resolve(true);
        settleSignIn?.(false);
        signInRequested.value = true;
        return new Promise<boolean>((resolve) => {
            settleSignIn = resolve;
        });
    }

    /** The inline sign-in closed: settle the pending request with the outcome. */
    function endSignInRequest() {
        signInRequested.value = false;
        const settle = settleSignIn;
        settleSignIn = null;
        settle?.(isLoggedIn.value);
    }

    /**
     * X.F.W14V.p — the server answered `urn:contract:owner-required`: the
     * request carried no session, so the remembered slug is not a sign-in (its
     * token is gone). The local account state is ended to match the server's.
     */
    function forgetUser() {
        userSlug.value = null;
        userToken.value = null;
        safeRemoveItem(local(), USER_SLUG_KEY);
        safeRemoveItem(local(), USER_TOKEN_KEY);
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
        safeSetItem(local(), ADMIN_TOKEN_KEY, token);
    }

    function adminLogout() {
        adminToken.value = null;
        safeRemoveItem(local(), ADMIN_TOKEN_KEY);
    }

    function getAdminToken(): string | null {
        return adminToken.value;
    }

    // ── Session (anonymous) ─────────────────────────────────────────────

    async function ensureSession(): Promise<string> {
        if (sessionToken.value) return sessionToken.value;

        const res = await createSession();
        sessionToken.value = res.token;
        safeSetItem(session(), SESSION_TOKEN_KEY, res.token);
        setSessionToken(res.token);
        return res.token;
    }

    function clearSession() {
        sessionToken.value = null;
        safeRemoveItem(session(), SESSION_TOKEN_KEY);
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
        signInRequested,
        // user actions
        register,
        login,
        logout,
        ensureUser,
        requestSignIn,
        endSignInRequest,
        forgetUser,
        // admin actions
        adminLogin,
        adminLogout,
        getAdminToken,
        // session actions
        ensureSession,
        clearSession,
    };
});
