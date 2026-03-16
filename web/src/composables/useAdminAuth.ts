import { ref, computed, type Ref } from "vue";
import { safeGetItem, safeSetItem, safeRemoveItem } from "./useSafeStorage";

const STORAGE_KEY = "fourier-admin-token";

let _adminToken: Ref<string | null> | null = null;

function getAdminToken(): Ref<string | null> {
    if (!_adminToken) {
        _adminToken = ref<string | null>(safeGetItem(localStorage, STORAGE_KEY));
    }
    return _adminToken;
}

export function useAdminAuth() {
    const adminToken = getAdminToken();
    const isAuthenticated = computed(() => !!adminToken.value);

    function login(token: string) {
        adminToken.value = token;
        safeSetItem(localStorage, STORAGE_KEY, token);
    }

    function logout() {
        adminToken.value = null;
        safeRemoveItem(localStorage, STORAGE_KEY);
    }

    function getToken(): string | null {
        return adminToken.value;
    }

    return { isAuthenticated, login, logout, getToken };
}
