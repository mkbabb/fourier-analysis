<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { Button } from "@mkbabb/glass-ui/button";
import { Input } from "@mkbabb/glass-ui/input";
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
    if (e.key === "Enter") handleLogin();
    if (e.key === "Escape") {
        showLogin.value = false;
        slugInput.value = "";
        slugError.value = null;
    }
}
</script>

<template>
    <div class="flex items-center">
        <!-- Logged in: slug pill -->
        <!-- FR-USB-13 ⊕ FR-USB-33: below 640 px this pill communicated NO
             identity — `hidden sm:inline` erased the abbreviation and the only
             remaining carrier was `title`, which touch never reaches. `sm:` is a
             WIDTH breakpoint, not a pointer query, so it was hiding the datum on
             exactly the devices that had no other way to get it. The abbreviation
             is five characters; it stays at every width. (It is also 1066× lossy
             — 268,435,456 slugs collapse onto 251,712 initials — so it identifies
             the session, never the credential.)
             FR-USB-17..-20: `title` is not an accessible name. Both controls are
             icon-only with auto-`aria-hidden` glyphs, so they had none at all. -->
        <div
            v-if="isLoggedIn"
            class="inline-flex items-center gap-1 rounded-full border border-foreground/12 bg-foreground/3 px-1 sm:px-2 py-0.5 text-sm text-muted-foreground"
        >
            <User :size="12" aria-hidden="true" />
            <span class="fira-code">{{ abbreviatedSlug }}</span>
            <span class="sr-only">Logged in as {{ userSlug }}</span>
            <Button
                emphasis="quiet"
                size="xs"
                icon-only
                class="rounded-full text-muted-foreground"
                aria-label="Copy your slug"
                @click="copySlug"
            >
                <Transition name="icon-swap" mode="out-in">
                    <Check v-if="status === 'success'" :size="12" class="text-success" aria-hidden="true" />
                    <Copy v-else :size="12" aria-hidden="true" />
                </Transition>
            </Button>
            <Button
                emphasis="quiet"
                size="xs"
                icon-only
                class="rounded-full text-muted-foreground"
                aria-label="Log out"
                :disabled="loggingOut"
                @click="handleLogout"
            >
                <LogOut :size="12" aria-hidden="true" />
            </Button>
        </div>

        <!-- Login trigger / form -->
        <template v-else>
            <Button
                v-if="!showLogin"
                emphasis="quiet"
                size="sm"
                class="size-10 sm:size-auto sm:px-2.5 sm:py-1 gap-1 rounded-full text-muted-foreground"
                aria-label="Log in"
                @click="showLogin = true"
            >
                <LogIn class="size-5 sm:size-3.5" />
                <span class="hidden sm:inline">Log in</span>
            </Button>

            <!-- FR-USB-5 (one element, one cure, three legs) ⊕ FR-USB-12 ⊕
                 FR-USB-14. The raw field carried `outline-none` with a border
                 SHIFT as its only focus replacement, and the three figures of
                 record — focused border vs fill 1.93:1 (SC 1.4.11), resting border
                 1.28:1, placeholder 1.73–1.76:1 (SC 1.4.3, on the only visible
                 statement of the required format) — were reproduced to the
                 hundredth by both readers. The resting figure re-introduced by
                 hand the exact failure the producer's own field annotation had
                 diagnosed and fixed; swapping to the primitive is what stops a
                 consumer re-deriving a calibrated surface badly.
                 FR-USB-14: `w-44` showed ≈18.8 monospace characters of a
                 credential whose four-word contract measures min 17 / mean 26.3 /
                 max 40 — the user could never see their whole slug at ANY
                 breakpoint. `w-[27ch]` covers the mean; `max-w-[60vw]` keeps it
                 inside a phone. -->
            <div v-else class="flex items-center gap-1">
                <div class="flex flex-col gap-0.5">
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
                        class="w-[27ch] max-w-[60vw] fira-code"
                        @keydown="onKeydown"
                        @input="slugError = null"
                    />
                    <p
                        v-if="slugError"
                        id="user-slug-error"
                        role="alert"
                        class="max-w-[27ch] text-xs text-destructive"
                    >
                        {{ slugError }}
                    </p>
                </div>
                <Button
                    emphasis="secondary"
                    size="sm"
                    icon-only
                    class="text-foreground"
                    aria-label="Submit slug and log in"
                    :disabled="!canSubmit || loggingIn"
                    :loading="loggingIn"
                    @click="handleLogin"
                >
                    <LogIn :size="14" aria-hidden="true" />
                </Button>
                <Button
                    emphasis="secondary"
                    size="sm"
                    icon-only
                    class="text-muted-foreground"
                    :disabled="loggingIn"
                    aria-label="Generate a new slug"
                    @click="handleGenerate"
                >
                    <Dices :size="14" aria-hidden="true" />
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
