<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { Button } from "@mkbabb/glass-ui/button";
import { Input } from "@mkbabb/glass-ui/input";
import { DockTrigger } from "@mkbabb/glass-ui/dock";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@mkbabb/glass-ui/menu";
import { Popover, PopoverContent } from "@mkbabb/glass-ui/popover";
import { useClipboard } from "@mkbabb/glass-ui";
import { useAuthStore } from "@/stores/auth";
import { useGalleryStore } from "@/stores/gallery";
import { useToast } from "@/composables/useToast";
import { ApiProblem, problemMessage } from "@/lib/api-problem";
import { User, LogIn, LogOut, Copy, Check, Dices, Shield } from "@lucide/vue";

const auth = useAuthStore();
const { userSlug, isLoggedIn } = storeToRefs(auth);
const { login, logout, register } = auth;
const gallery = useGalleryStore();
const { toast } = useToast();

const slugInput = ref("");
const showLogin = ref(false);
const loggingIn = ref(false);

/* P.W5 Lane B.2 — glass-ui's `useClipboard` (at glass-ui ≥7 it returns
   `status`, never a `copied` boolean); 1.5 s reset preserved. */
const { status, copy } = useClipboard({ resetMs: 1500 });

/**
 * X·F F.W4 `.d` — FR-USB-12: the pattern mirrors `slugs.py:15` exactly; the
 * client's copy prevents a doomed request on a rate-limited path, the server's
 * remains the authority, and a drift fails CLOSED (the server rejects).
 */
const SLUG_PATTERN = /^[a-z]+(-[a-z]+){3}$/;
const SLUG_PATTERN_ATTR = "[a-z]+(-[a-z]+){3}";
const SHAPE_MESSAGE = "A slug is four lowercase words joined by hyphens.";

/**
 * X.F.W14U.shell — UIA-F-155 ⊕ UIA-F-232: the client's shape check and the
 * server's answer are two sources, so they are two slots. The shape message is
 * DERIVED from the field (shown once the field is left, or on a submit), so a
 * pointer user who types a malformed slug reads why before pressing anything;
 * Submit stays enabled and a press on a malformed slug says so rather than
 * doing nothing. The server's answer is kept until the slug it answered
 * changes. One failure, one channel: the field (no toast beside it).
 */
const touched = ref(false);
const submitted = ref(false);
const serverError = ref<{ slug: string; message: string } | null>(null);

const trimmed = computed(() => slugInput.value.trim());
const shapeError = computed(() => {
    if (!touched.value && !submitted.value) return null;
    if (!trimmed.value) return submitted.value ? "Enter your slug to log in." : null;
    return SLUG_PATTERN.test(trimmed.value) ? null : SHAPE_MESSAGE;
});
const serverMessage = computed(() =>
    serverError.value && serverError.value.slug === trimmed.value ? serverError.value.message : null,
);
const invalid = computed(() => !!shapeError.value || !!serverMessage.value);
const describedBy = computed(
    () =>
        [shapeError.value ? "user-slug-hint" : "", serverMessage.value ? "user-slug-error" : ""]
            .filter(Boolean)
            .join(" ") || undefined,
);

/** UIA-F-232: the dock face reads the slug's first word, not "j-n-o-r". */
const handle = computed(() => userSlug.value?.split("-")[0] ?? "");

/** UIA-F-121: a 404 on login is an unknown slug, said with what to do next. */
function loginFailure(e: unknown): string {
    if (e instanceof ApiProblem && e.status === 404) {
        return "No account uses that slug — check the four words, or generate a new slug.";
    }
    return problemMessage(e, "Logging in failed — try again.");
}

async function handleLogin() {
    submitted.value = true;
    if (shapeError.value) return;
    const candidate = trimmed.value;
    serverError.value = null;
    loggingIn.value = true;
    try {
        await login(candidate);
        closeLogin();
        toast("Logged in", "success");
    } catch (e: unknown) {
        serverError.value = { slug: candidate, message: loginFailure(e) };
    } finally {
        loggingIn.value = false;
    }
}

async function handleGenerate() {
    serverError.value = null;
    loggingIn.value = true;
    try {
        await register();
        closeLogin();
        toast("Logged in with a new slug", "success");
    } catch (e: unknown) {
        serverError.value = { slug: trimmed.value, message: problemMessage(e, "A new slug could not be made — try again.") };
    } finally {
        loggingIn.value = false;
    }
}

function closeLogin() {
    showLogin.value = false;
    slugInput.value = "";
    touched.value = false;
    submitted.value = false;
    serverError.value = null;
}

/**
 * FR-USB-18: logout had no in-flight state and no busy affordance, so a
 * second press issued a second DELETE; the guard and the disable hold it.
 */
const loggingOut = ref(false);

async function handleLogout() {
    if (loggingOut.value) return;
    loggingOut.value = true;
    try {
        await logout();
        toast("Logged out", "info");
    } finally {
        loggingOut.value = false;
    }
}

/**
 * FR-USB-10: `copy()` returns a discriminated `CopyResult`; the failure is
 * REPORTED. UIA-F-232: the success is announced too — the menu closes on
 * select, so the icon swap alone is never heard; the live region below says it.
 */
async function copySlug() {
    if (!userSlug.value) return;
    const result = await copy(userSlug.value);
    if (!result.ok) {
        toast(
            result.reason === "no-api"
                ? "This browser will not grant clipboard access — select the slug and copy it manually."
                : "Copying failed. Select the slug and copy it manually.",
            "error",
        );
    }
}
</script>

<template>
    <!-- X.F.W14.u — UIA-F-28 · UIA-F-29 · UIA-F-30: the account group is one
         dock trigger, never a run of controls in the dock row. Logged out, "Log
         in" opens a popover holding the form (focus moves in to the field,
         Escape and an outside press dismiss, focus returns to the trigger —
         reka's, UIA-F-52); logged in, the account is a dropdown holding the
         slug, Copy and Log out. The popovers take glass's own offset
         (UIA-F-219: no consumer literal). X.F.W14U.shell — UIA-F-150: the
         admin state lives in this menu, not as a disc beside it. -->
    <div class="flex items-center">
        <DropdownMenu v-if="isLoggedIn">
            <DockTrigger for="dropdown" class="account-trigger" :aria-label="`Account: ${userSlug}`">
                <User aria-hidden="true" />
                <span class="fira-code hidden sm:inline">{{ handle }}</span>
            </DockTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                    <span class="sr-only">Logged in as </span>
                    <span class="fira-code">{{ userSlug }}</span>
                </DropdownMenuLabel>
                <DropdownMenuLabel v-if="gallery.adminMode" class="flex items-center gap-2">
                    <Shield aria-hidden="true" />
                    Admin mode
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem @select="copySlug">
                    <Check v-if="status === 'success'" aria-hidden="true" />
                    <Copy v-else aria-hidden="true" />
                    Copy your slug
                </DropdownMenuItem>
                <DropdownMenuItem :disabled="loggingOut" @select="handleLogout">
                    <LogOut aria-hidden="true" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Popover v-else :open="showLogin" @update:open="(open) => (open ? (showLogin = true) : closeLogin())">
            <DockTrigger for="popover" class="account-trigger" aria-label="Log in">
                <LogIn aria-hidden="true" />
                <span class="hidden sm:inline">Log in</span>
            </DockTrigger>
            <PopoverContent align="end" class="login-popover">
                <form class="flex flex-col gap-2" novalidate @submit.prevent="handleLogin">
                    <label class="sr-only" for="user-slug-input">
                        Your slug — four lowercase words joined by hyphens
                    </label>
                    <Input
                        id="user-slug-input"
                        v-model="slugInput"
                        name="username"
                        type="text"
                        size="sm"
                        autocomplete="username"
                        autocapitalize="none"
                        autocorrect="off"
                        spellcheck="false"
                        enterkeyhint="go"
                        :pattern="SLUG_PATTERN_ATTR"
                        :invalid="invalid"
                        :aria-describedby="describedBy"
                        placeholder="your-four-word-slug"
                        class="w-full fira-code"
                        @blur="touched = trimmed.length > 0"
                    />
                    <p v-if="shapeError" id="user-slug-hint" role="alert" class="login-error text-small text-destructive">
                        {{ shapeError }}
                    </p>
                    <p v-if="serverMessage" id="user-slug-error" role="alert" class="login-error text-small text-destructive">
                        {{ serverMessage }}
                    </p>
                    <div class="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            emphasis="secondary"
                            size="sm"
                            :disabled="loggingIn"
                            aria-label="Generate a new slug"
                            @click="handleGenerate"
                        >
                            <Dices aria-hidden="true" />
                        </Button>
                        <Button
                            type="submit"
                            emphasis="primary"
                            size="sm"
                            aria-label="Submit slug and log in"
                            :disabled="loggingIn"
                            :loading="loggingIn"
                        >
                            <LogIn aria-hidden="true" />
                        </Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>

        <!-- UIA-F-232: the copy success, said to assistive tech. -->
        <span class="sr-only" aria-live="polite">{{ status === "success" ? "Slug copied to the clipboard" : "" }}</span>
    </div>
</template>

<style scoped>
/* The account triggers sit in the app dock's control cell, the one measure
   AppDock gives its own trigger faces: the block floor rides the producer's
   `--dock-trigger-min-height` hook (set on `.app-dock`), and the inline floor
   is this matching `min-inline-size`, so the icon-only face at 390 px holds
   the ≥44 px coarse cell (`--dock-control-size`). */
.account-trigger {
    min-inline-size: var(--dock-control-size);
}

.login-popover {
    inline-size: min(22rem, calc(100vw - 2rem));
}

/* The error is its own line under the field; the wrap is stated. */
.login-error {
    white-space: normal;
    overflow-wrap: anywhere;
}
</style>
