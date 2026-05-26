<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { Button, useClipboard } from "@mkbabb/glass-ui";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import { User, LogIn, LogOut, Copy, Check, Dices } from "lucide-vue-next";

const auth = useAuthStore();
const { userSlug, isLoggedIn } = storeToRefs(auth);
const { login, logout, register } = auth;
const { toast } = useToast();

const slugInput = ref("");
const showLogin = ref(false);
const loggingIn = ref(false);

/* P.W5 Lane B.2 — migrated from bare `navigator.clipboard.writeText` + manual
   `copied` ref + setTimeout to glass-ui's `useClipboard` composable (the
   reactive `copied` flag drives the Check/Copy icon swap below). 1.5 s reset
   preserved from HEAD. */
const { copied, copy } = useClipboard({ resetMs: 1500 });

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

function copySlug() {
    if (!userSlug.value) return;
    copy(userSlug.value);
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
            <Button
                variant="ghost"
                size="icon"
                class="size-5 rounded-full text-muted-foreground"
                title="Copy slug"
                @click="copySlug"
            >
                <Transition name="icon-swap" mode="out-in">
                    <Check v-if="copied" :size="12" class="text-green-500" />
                    <Copy v-else :size="12" />
                </Transition>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                class="size-5 rounded-full text-muted-foreground"
                title="Log out"
                @click="handleLogout"
            >
                <LogOut :size="12" />
            </Button>
        </div>

        <!-- Login trigger / form -->
        <template v-else>
            <Button
                v-if="!showLogin"
                variant="ghost"
                size="sm"
                class="size-10 sm:size-auto sm:px-2.5 sm:py-1 gap-1 rounded-full text-muted-foreground"
                @click="showLogin = true"
            >
                <LogIn class="size-5 sm:size-3.5" />
                <span class="hidden sm:inline">Log in</span>
            </Button>

            <div v-else class="flex items-center gap-1">
                <input
                    v-model="slugInput"
                    type="text"
                    placeholder="your-slug-here 🐌"
                    class="w-44 rounded-md border border-foreground/12 bg-card px-2 py-1 text-sm text-foreground outline-none fira-code transition-[border-color] duration-150 focus:border-foreground/30 placeholder:text-muted-foreground/40"
                    @keydown="onKeydown"
                />
                <Button
                    variant="outline"
                    size="icon"
                    class="size-7 text-foreground"
                    :disabled="!canSubmit || loggingIn"
                    @click="handleLogin"
                >
                    <LogIn :size="14" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    class="size-7 text-muted-foreground"
                    :disabled="loggingIn"
                    title="Generate new slug"
                    @click="handleGenerate"
                >
                    <Dices :size="14" />
                </Button>
            </div>
        </template>
    </div>
</template>

<style scoped>
/* A.W3.d — named properties + canonical tokens, no `transition: all`. */
.icon-swap-enter-active,
.icon-swap-leave-active { transition: opacity 0.15s var(--ease-standard), transform 0.15s var(--ease-standard); }
.icon-swap-enter-from,
.icon-swap-leave-to { opacity: 0; transform: scale(0.7); }
</style>
