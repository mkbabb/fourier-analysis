<script setup lang="ts">
import { ref, computed } from "vue";
import { useUserAuth } from "@/composables/useUserAuth";
import { useToast } from "@/composables/useToast";
import { User, LogIn, LogOut, Copy, Check, Dices } from "lucide-vue-next";

const { userSlug, isLoggedIn, login, logout, register } = useUserAuth();
const { toast } = useToast();

const slugInput = ref("");
const showLogin = ref(false);
const loggingIn = ref(false);
const copied = ref(false);

const canSubmit = computed(() => slugInput.value.trim().length > 0);

/** Abbreviate "jasper-newt-of-rampant-courage" → "j-n-o-r-c" */
const abbreviatedSlug = computed(() => {
    if (!userSlug.value) return "";
    return userSlug.value.split("-").map((w) => w[0]).join("-");
});

async function handleLogin() {
    if (!canSubmit.value) return;
    loggingIn.value = true;
    try {
        await login(slugInput.value.trim());
        showLogin.value = false;
        slugInput.value = "";
        toast("Logged in!", "success");
    } catch (e: any) {
        toast(e.message ?? "Login failed", "error");
    } finally {
        loggingIn.value = false;
    }
}

async function handleGenerate() {
    loggingIn.value = true;
    try {
        await register();
        showLogin.value = false;
        slugInput.value = "";
        toast("Logged in!", "success");
    } catch (e: any) {
        toast(e.message ?? "Generation failed", "error");
    } finally {
        loggingIn.value = false;
    }
}

async function handleLogout() {
    await logout();
    toast("Logged out", "info");
}

async function copySlug() {
    if (!userSlug.value) return;
    await navigator.clipboard.writeText(userSlug.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") handleLogin();
    if (e.key === "Escape") {
        showLogin.value = false;
        slugInput.value = "";
    }
}
</script>

<template>
    <div class="flex items-center">
        <!-- Logged in: slug pill -->
        <div
            v-if="isLoggedIn"
            class="inline-flex items-center gap-1 rounded-full border border-foreground/12 bg-foreground/3 px-1 sm:px-2 py-0.5 text-sm text-muted-foreground"
            :title="userSlug ?? ''"
        >
            <User :size="12" />
            <span class="fira-code hidden sm:inline">{{ abbreviatedSlug }}</span>
            <button
                class="flex items-center justify-center size-5 rounded-full p-0 border-none bg-transparent text-muted-foreground cursor-pointer transition-all duration-150 hover:text-foreground hover:bg-foreground/6"
                title="Copy slug"
                @click="copySlug"
            >
                <Transition name="icon-swap" mode="out-in">
                    <Check v-if="copied" :size="12" class="text-green-500" />
                    <Copy v-else :size="12" />
                </Transition>
            </button>
            <button
                class="flex items-center justify-center size-5 rounded-full p-0 border-none bg-transparent text-muted-foreground cursor-pointer transition-all duration-150 hover:text-foreground hover:bg-foreground/6"
                title="Log out"
                @click="handleLogout"
            >
                <LogOut :size="12" />
            </button>
        </div>

        <!-- Login trigger / form -->
        <template v-else>
            <button
                v-if="!showLogin"
                class="inline-flex items-center justify-center size-10 sm:size-auto sm:px-2.5 sm:py-1 gap-1 rounded-full border-none bg-transparent text-sm text-muted-foreground cursor-pointer transition-all duration-150 hover:text-foreground"
                @click="showLogin = true"
            >
                <LogIn class="size-5 sm:size-3.5" />
                <span class="hidden sm:inline">Log in</span>
            </button>

            <div v-else class="flex items-center gap-1">
                <input
                    v-model="slugInput"
                    type="text"
                    placeholder="your-slug-here 🐌"
                    class="w-44 rounded-md border border-foreground/12 bg-card px-2 py-1 text-sm text-foreground outline-none fira-code transition-[border-color] duration-150 focus:border-foreground/30 placeholder:text-muted-foreground/40"
                    @keydown="onKeydown"
                />
                <button
                    class="flex items-center justify-center size-7 rounded-md border border-foreground/12 bg-transparent text-foreground cursor-pointer transition-all duration-150 hover:not-disabled:border-foreground/25 hover:not-disabled:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed"
                    :disabled="!canSubmit || loggingIn"
                    @click="handleLogin"
                >
                    <LogIn :size="14" />
                </button>
                <button
                    class="flex items-center justify-center size-7 rounded-md border border-foreground/12 bg-transparent text-muted-foreground cursor-pointer transition-all duration-150 hover:not-disabled:border-foreground/25 hover:not-disabled:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed"
                    :disabled="loggingIn"
                    title="Generate new slug"
                    @click="handleGenerate"
                >
                    <Dices :size="14" />
                </button>
            </div>
        </template>
    </div>
</template>

<style scoped>
.icon-swap-enter-active,
.icon-swap-leave-active { transition: all 0.15s ease; }
.icon-swap-enter-from,
.icon-swap-leave-to { opacity: 0; transform: scale(0.7); }
</style>
