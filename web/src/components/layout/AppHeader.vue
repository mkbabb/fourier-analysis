<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGalleryStore } from "@/stores/gallery";
import DarkModeToggle from "./DarkModeToggle.vue";
import UserSlugBar from "@/components/visualization/gallery/UserSlugBar.vue";
import { Shield, ChevronDown, FileText, Eye, LayoutGrid, Sigma, Shuffle } from "@lucide/vue";
import { Button } from "@mkbabb/glass-ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@mkbabb/glass-ui/menu";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@mkbabb/glass-ui/popover";

const route = useRoute();
const router = useRouter();
const baseUrl = import.meta.env.BASE_URL;

const tabs = [
    { label: "Paper", value: "/paper", icon: FileText },
    { label: "Visualize", value: "/visualize", icon: Eye },
    { label: "Gallery", value: "/gallery", icon: LayoutGrid },
    { label: "Equation", value: "/equation", icon: Sigma },
    { label: "Morph", value: "/morph", icon: Shuffle },
];

const activeTab = computed(() => {
    if (route.path === "/paper") return "/paper";
    if (route.path === "/visualize" || route.path.startsWith("/s/") || route.path.startsWith("/w/")) return "/visualize";
    if (route.path === "/equation") return "/equation";
    if (route.path === "/gallery") return "/gallery";
    if (route.path === "/morph") return "/morph";
    return "/paper";
});

const activeTabData = computed(() => tabs.find((t) => t.value === activeTab.value) ?? tabs[0]);

function onTabSelect(path: string) {
    router.push(path);
}

/* FR-AH-19 — `useWorkspaceStore()` was instantiated here and never read: a
   Pinia store mounted on every route, on the app's only always-present
   component, for nothing. It is the enabling condition G-F4-NO-UNUSED was
   turned on to expose, and it is one of the eighteen diagnostics the gate is
   RED on. */
const galleryStore = useGalleryStore();
</script>

<template>
    <header class="app-header sticky top-0 z-[var(--z-overlay)] bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div class="header-inner">
            <!-- Logo with attribution card.
                 F.W1 / FR-AH-13 — `./hover-card` is definition-absent at the
                 adopted pin and the Popover union replaces it. `trigger="hover"`
                 is passed EXPLICITLY, which is what makes the card reachable at
                 all on touch: the union reads `(pointer: coarse)` and seats the
                 CLICK root there, so the excludeTouch dead end is gone.
                 That also resolves the click collision this trigger carried: a
                 coarse tap used to open the card AND navigate away in the same
                 gesture, so the attribution could never be read. One element
                 carries ONE activation — the trigger discloses, and /paper stays
                 one tap away in the nav menu beside it (`tabs[0]`). -->
            <Popover trigger="hover">
                <PopoverTrigger
                    class="logo-trigger relative shrink-0"
                    aria-label="About Fourier analysis"
                >
                    <span class="logo-mark cm-serif font-semibold tracking-tight cursor-pointer select-none">
                        <span class="fourier-f">&#x2131;</span><span class="logo-text">ourier analysis</span>
                    </span>
                </PopoverTrigger>
                <PopoverContent class="hover-card-content" align="start" :side-offset="6">
                    <div class="flex items-center gap-3">
                        <!-- Self-hosted maintainer avatar (θ): restores the zero-third-party-origins
                             posture — no avatars.githubusercontent.com handshake/beacon. Served from
                             /assets (the repo's committed-raster convention; 80px source for 2×
                             density in the 40px h-10 box). -->
                        <img
                            :src="`${baseUrl}assets/maintainer-avatar.png`"
                            alt="mkbabb"
                            width="80"
                            height="80"
                            decoding="async"
                            class="h-10 w-10 rounded-full shrink-0"
                        />
                        <div class="flex-1 min-w-0">
                            <a
                                href="https://github.com/mkbabb"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="fira-code text-sm font-normal text-foreground hover:underline"
                                @click.stop
                            >@mbabb</a>
                            <p class="mt-0.5 text-xs italic text-muted-foreground">Fourier analysis &amp; orthogonal decomposition</p>
                        </div>
                    </div>
                    <hr class="my-2 border-border/50" />
                    <a
                        href="https://github.com/mkbabb/fourier-analysis"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block text-sm text-foreground hover:underline"
                        @click.stop
                    >View project on GitHub 🎉</a>
                </PopoverContent>
            </Popover>

            <div class="header-divider" />

            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button
                        emphasis="quiet"
                        class="nav-trigger"
                        :aria-label="`Navigate — current section ${activeTabData.label}`"
                    >
                        <component :is="activeTabData.icon" class="nav-trigger-icon" />
                        <span class="nav-trigger-label">{{ activeTabData.label }}</span>
                        <ChevronDown class="nav-trigger-chevron" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="nav-dropdown" :side-offset="6" align="start">
                    <DropdownMenuItem
                        v-for="tab in tabs"
                        :key="tab.value"
                        class="nav-dropdown-item"
                        :class="{ 'is-active': activeTab === tab.value }"
                        @select="onTabSelect(tab.value)"
                    >
                        <component :is="tab.icon" class="nav-item-icon" />
                        <span>{{ tab.label }}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div class="ml-auto flex items-center gap-1.5 shrink-0">
                <div v-if="galleryStore.adminMode" class="admin-badge" title="Admin mode active">
                    <Shield :size="14" />
                </div>
                <UserSlugBar />
                <DarkModeToggle class="dark-mode-toggle" />
            </div>
        </div>
    </header>
</template>

<style scoped>
@reference "tailwindcss";
.app-header {
    font-feature-settings: "liga", "kern";
}

.header-inner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.625rem;
    min-height: 2.75rem;
}

@media (min-width: 640px) {
    .header-inner {
        height: 3.5rem;
        gap: 1rem;
        padding: 0 1.5rem;
    }
}

/* ── Nav trigger (dropdown button) ── */
.nav-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: 0.4375rem;
    border: none;
    background: none;
    color: var(--foreground);
    cursor: pointer;
    transition: color 0.15s ease;
    -webkit-tap-highlight-color: transparent;
}

.nav-trigger:hover {
    color: color-mix(in srgb, var(--foreground) 70%, transparent);
}

/* FM-2 rider — `--ring` is undeclared at 8.0.0, so this outline was invalid
   and dropped: the app's only nav control had no focus ring. See style.css. */
.nav-trigger:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: 2px;
}

.nav-trigger-icon {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
    color: var(--viz-amber);
    filter: drop-shadow(0 0 3px color-mix(in srgb, var(--viz-amber) 40%, transparent));
}

.nav-trigger-label {
    display: none;
    color: var(--viz-amber);
}

.nav-trigger-chevron {
    width: 1rem;
    height: 1rem;
    opacity: 0.5;
    flex-shrink: 0;
    transition: transform 0.2s ease;
}

.nav-trigger[data-state="open"] .nav-trigger-chevron {
    transform: rotate(180deg);
}

@media (min-width: 640px) {
    .nav-trigger {
        padding: 0.25rem;
    }
}

/* Mobile: compact logo, divider, toggle sizing */
.logo-mark {
    @apply text-2xl;
}

.logo-text {
    display: none;
}

.header-divider {
    width: 1.5px;
    height: 1.25rem;
    align-self: center;
    background: color-mix(in srgb, var(--foreground) 18%, transparent);
    flex-shrink: 0;
}

.dark-mode-toggle {
    --toggle-size: 2.5rem;
}

@media (min-width: 640px) {
    .logo-mark {
        @apply text-xl;
    }
    .logo-text {
        display: inline;
    }
    .header-divider {
        height: 1.75rem;
    }
    .dark-mode-toggle {
        --toggle-size: 2.75rem;
    }
}

/* ── Admin badge ── */
.admin-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--tier-featured) 10%, transparent);
    color: var(--tier-featured);
    flex-shrink: 0;
}

/* ── Attribution hover card ── */
.logo-trigger {
    /* The union's trigger renders a real <button> (`type="button"` from the
       primitive), which is what carries Enter/Space activation natively — the
       `role="button"` + `tabindex="0"` div it replaces carried neither once the
       click handler moved off it. The UA button chrome is neutralised here so the
       wordmark paints exactly as before. */
    cursor: pointer;
    appearance: none;
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    color: inherit;
    text-align: inherit;
}

/* Share button enter/leave (A.W3.d — bezier→`--ease-apple-spring`) */
.share-pop-enter-active {
    transition: opacity 0.25s var(--ease-standard), transform 0.3s var(--ease-apple-spring);
}
.share-pop-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.share-pop-enter-from {
    opacity: 0;
    transform: scale(0.5);
}
.share-pop-leave-to {
    opacity: 0;
    transform: scale(0.5);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>

<!-- Global style for portaled components -->
<style>
/* X.F.W4 / SP-6 · FR-AH-11 (+MISS-3) — the ONE cascade decision, executed.

   The four classes below escape scoping because their elements are PORTALED
   out of this component's subtree; that mechanism is correct and unchanged
   (superlative S-6). What was wrong is that the block was UNLAYERED, so it
   beat glass-ui's `@layer components` menu recipe wholesale.

   DELETED, not layered — the producer's `.glass-menu-row` recipe governs them
   and the override carried no deliberate intent (rowClass ships
   `interactive-item glass-menu-row relative flex w-full cursor-default
   select-none items-center py-1 px-2 text-dropdown …`, re-read at the adopted
   8.0.0 pin):
     · the base re-skin (padding / border / background / colour / font-family /
       font-size / font-weight / cursor / display+align) — it replaced the
       glass plate, the density rung, the `text-dropdown` type rung and the
       `min-block-size: max(2rem, var(--touch-target, 2.75rem))` coarse-pointer
       floor;
     · `transition: background .12s, color .12s` (MISS-3) — it TRUNCATED the
       producer's six-leg list (background-color/color/border-color/box-shadow/
       translate/scale) while declaring no `translate`, so the layered hover
       rule's `--menu-row-lift: -1px` still fired, INSTANTLY. Every row kept
       the lift and lost the spring: read as jitter, not as a bug;
     · `outline: none` — it deleted the focus paint outright;
     · the `:hover` / `[data-highlighted]` re-skin — it replaced the glass
       hover plate with a flat tint.

   KEPT, inside `@layer glass-overrides` (declared after `utilities` in
   style.css) — genuine consumer divergence the producer ships no variant for:
   the portaled surfaces' own sizing, the icon+label gap this app's rows carry,
   and the current-route amber state. */
@layer glass-overrides {
    /* portaled glass-ui PopoverContent (the attribution card) */
    .hover-card-content {
        min-width: 17rem;
    }

    /* portaled glass-ui DropdownMenuContent */
    .nav-dropdown {
        min-width: 12rem;
        padding: 0.5rem;
    }

    /* icon + label rows: the producer's row recipe carries no gap */
    .nav-dropdown-item {
        gap: 0.625rem;
    }

    .nav-dropdown-item.is-active {
        color: var(--viz-amber);
        background: color-mix(in srgb, var(--viz-amber) 8%, transparent);
    }

    .nav-dropdown-item.is-active .nav-item-icon {
        filter: drop-shadow(0 0 3px color-mix(in srgb, var(--viz-amber) 50%, transparent));
    }

    .nav-item-icon {
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
    }
}
</style>
