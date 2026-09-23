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
import { useToast } from "@/composables/useToast";
import { User, LogIn, LogOut, Copy, Check, Dices } from "@lucide/vue";

const auth = useAuthStore();
const { userSlug, isLoggedIn } = storeToRefs(auth);
const { login, logout, register } = auth;
const { toast } = useToast();

const slugInput = ref("");
const showLogin = ref(false);
const loggingIn = ref(false);

/* P.W5 Lane B.2 — migrated from bare `navigator.clipboard.writeText` + manual
   `copied` ref + setTimeout to glass-ui's `useClipboard` composable. F.W1 /
   FR-EQR-1: at glass-ui ≥7 the composable returns `status`, never a `copied`
   boolean — the icon swap below reads the state by name. 1.5 s reset preserved
   from HEAD. */
const { status, copy } = useClipboard({ resetMs: 1500 });

/**
 * X·F F.W4 `.d` — FR-USB-12: the credential field had no `autocomplete`, `name`,
 * `id`, `pattern` or `aria-invalid`, no client-side shape check (`canSubmit` was
 * a non-empty trim) and no retained error — on a RATE-LIMITED path whose shape
 * contract is published and trivially mirrorable. Every malformed slug spent one
 * of the user's attempts to be told, by the server, what the client already knew.
 *
 * The pattern mirrors `slugs.py:15` exactly. It is stated in both places
 * deliberately: the client's copy prevents a doomed request, the server's remains
 * the authority, and a drift between them fails CLOSED (the server rejects). The
 * shared-constant seam is F.W5–W8's contract work.
 */
const SLUG_PATTERN = /^[a-z]+(-[a-z]+){3}$/;
const SLUG_PATTERN_ATTR = "[a-z]+(-[a-z]+){3}";

const slugError = ref<string | null>(null);

const canSubmit = computed(() => SLUG_PATTERN.test(slugInput.value.trim()));

/** Abbreviate "jasper-newt-of-rampant-courage" → "j-n-o-r-c" */
const abbreviatedSlug = computed(() => {
    if (!userSlug.value) return "";
    return userSlug.value.split("-").map((w) => w[0]).join("-");
});

async function handleLogin() {
    const candidate = slugInput.value.trim();
    if (!candidate) {
        slugError.value = "Enter your slug to log in.";
        return;
    }
    if (!SLUG_PATTERN.test(candidate)) {
        slugError.value = "A slug is four lowercase words joined by hyphens.";
        return;
    }
    slugError.value = null;
    loggingIn.value = true;
    try {
        await login(slugInput.value.trim());
        showLogin.value = false;
        slugInput.value = "";
        toast("Logged in!", "success");
    } catch (e: unknown) {
        const message = e instanceof Error && e.message ? e.message : "Login failed";
        slugError.value = message;
        toast(message, "error");
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
    } catch (e: unknown) {
        const message = e instanceof Error && e.message ? e.message : "Generation failed";
        slugError.value = message;
        toast(message, "error");
    } finally {
        loggingIn.value = false;
    }
}

/**
 * FR-USB-18: logout had no in-flight state and no busy affordance — no
 * `:disabled`, no guard — so the control stayed live across the round trip and a
 * second press issued a second DELETE. Harm is bounded (the endpoint is
 * idempotent, unslept, and returns `{"ok": true}` unconditionally), which is why
 * this is a minor; the affordance is still owed, and the half that does not
 * depend on the producer is the guard and the disable. ⊘ The `loading` prop half
 * is F.W1's and is ESC-1/G1-gated — cited, not booked here.
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
 * FR-USB-10: `copy()` returns a discriminated `CopyResult` and the installed
 * contract's own docblock promises "the failure is REPORTED, never silently
 * swallowed" — this call site discarded it and set no `onCopyError`, inverting
 * that promise on the ONLY path to the credential that works on touch. When the
 * write failed, `status` never left `idle`: no icon change, no message, nothing
 * at all, and the user walked away believing they held their slug.
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

function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
        showLogin.value = false;
        slugInput.value = "";
        slugError.value = null;
    }
}
</script>

<template>
    <!-- X.F.W14.u — UIA-F-28 · UIA-F-29 · UIA-F-30: the account group is one
         dock trigger, never a run of controls in the dock row. Logged out, the
         inline form (a 27ch field plus two buttons, 586 px in a 312 px dock at
         390) morphed the dock row and pushed Submit, Dice and the input off the
         plate; its error paragraph inherited the dock root's `nowrap` and ran
         ~400 px out of its box. Logged in, the slug pill with Copy and Log out
         (433–468 px in a 284 px box) pushed the dark-mode toggle out. Transient
         surfaces ride the Reka popover and menu families (dock README): "Log
         in" opens a popover holding the form, with the error in its own line
         beneath the field, and the account is a dropdown holding the slug, Copy
         and Log out. The identity text and every accessible name the earlier
         rows fixed (FR-USB-13, -17..-20, -5) are kept. -->
    <div class="flex items-center">
        <DropdownMenu v-if="isLoggedIn">
            <DockTrigger for="dropdown" class="account-trigger" :aria-label="`Account: ${userSlug}`">
                <User aria-hidden="true" />
                <span class="fira-code hidden sm:inline">{{ abbreviatedSlug }}</span>
            </DockTrigger>
            <DropdownMenuContent :side-offset="10" align="end">
                <DropdownMenuLabel>
                    <span class="sr-only">Logged in as </span>
                    <span class="fira-code">{{ userSlug }}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem @select="copySlug">
                    <Check v-if="status === 'success'" class="text-success" aria-hidden="true" />
                    <Copy v-else aria-hidden="true" />
                    Copy your slug
                </DropdownMenuItem>
                <DropdownMenuItem :disabled="loggingOut" @select="handleLogout">
                    <LogOut aria-hidden="true" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Popover v-else v-model:open="showLogin">
            <DockTrigger for="popover" class="account-trigger" aria-label="Log in">
                <LogIn aria-hidden="true" />
                <span class="hidden sm:inline">Log in</span>
            </DockTrigger>
            <PopoverContent align="end" :side-offset="10" class="login-popover">
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
                        :invalid="!!slugError"
                        :aria-describedby="slugError ? 'user-slug-error' : undefined"
                        placeholder="your-slug-here 🐌"
                        class="w-full fira-code"
                        @keydown="onKeydown"
                        @input="slugError = null"
                    />
                    <p v-if="slugError" id="user-slug-error" role="alert" class="login-error text-destructive">
                        {{ slugError }}
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
                            :disabled="!canSubmit || loggingIn"
                            :loading="loggingIn"
                        >
                            <LogIn aria-hidden="true" />
                        </Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    </div>
</template>

<style scoped>
/* The account triggers sit in the app dock's control cell, the one measure
   AppDock gives its own trigger faces: the block floor rides the producer's
   `--dock-trigger-min-height` hook (set on `.app-dock`), and the inline floor
   is this matching `min-inline-size`, so the icon-only face at 390 px holds
   the ≥44 px coarse cell (`--dock-control-size`), not the 40 px of its icon
   and padding. */
.account-trigger {
    min-inline-size: var(--dock-control-size);
}

.login-popover {
    inline-size: min(22rem, calc(100vw - 2rem));
}

/* The error is its own line under the field; the dock root's `nowrap` does not
   reach into the portalled popover, and the wrap is stated anyway. */
.login-error {
    white-space: normal;
    overflow-wrap: anywhere;
}

/* A.W3.d — named properties + canonical tokens, no `transition: all`. */
.icon-swap-enter-active,
.icon-swap-leave-active { transition: opacity 0.15s var(--ease-standard), transform 0.15s var(--ease-standard); }
.icon-swap-enter-from,
.icon-swap-leave-to { opacity: 0; transform: scale(0.7); }
</style>
