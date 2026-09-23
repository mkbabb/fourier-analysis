<!-- SERVED MODEL: claude-fable-5-1 -->
<script setup lang="ts">
/**
 * X.F.W11.c (COHESION §0ao OA-3) — the app's chrome is a `GlassDock`.
 *
 * `AppHeader.vue` is RETIRED, not reduced: every control it carried has one
 * home here, on the producer's dock family (`@mkbabb/glass-ui/dock`), with its
 * accessible name unchanged — `About Fourier analysis` · `Navigate — current
 * section <label>` · the account group (`UserSlugBar`) · `Dark mode`.
 *
 * FACES. The two transient surfaces (the attribution card, the route menu)
 * ride `DockTrigger` — the producer's ONE trigger face for popover / dropdown
 * / select — so the dock's hover plate, press spring, specular gleam and
 * coarse hit floor are the producer's, never a re-skinned `Button`. Groups are
 * ordinary DOM with a name and a `DockSeparator` between them, as the dock
 * README prescribes. `DockControl` and `DockLayer` are not used: no control
 * here is a plain toggle/nav button (the dark-mode control is its own morphing
 * component), and the shell owns no selectable panes.
 *
 * THE ABOUT CARD IS A CLICK DISCLOSURE. The header's `Popover trigger="hover"`
 * seated a `HoverCardRoot` under a fine pointer; the dock's popover face is
 * reka's `PopoverTrigger`, which requires the click root. One activation on
 * both pointers — the same contract FR-AH-13 wanted for touch, now everywhere.
 *
 * `sticky top-0` / `backdrop-blur-md` from the old header are RETIRED with it
 * (`fr-App MG-epsilon`'s open choice, decided): the dock's own plate is the
 * surface, and the landmark is a flex sibling of the app's sole scroller.
 */
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGalleryStore } from "@/stores/gallery";
import DarkModeToggle from "./DarkModeToggle.vue";
import UserSlugBar from "@/components/visualization/gallery/UserSlugBar.vue";
import { Shield, ChevronDown, FileText, Eye, LayoutGrid, Sigma, Shuffle } from "@lucide/vue";
import { GlassDock, DockTrigger, DockSeparator } from "@mkbabb/glass-ui/dock";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@mkbabb/glass-ui/menu";
import { Popover, PopoverContent } from "@mkbabb/glass-ui/popover";

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

const galleryStore = useGalleryStore();
</script>

<template>
    <header class="app-header">
        <GlassDock class="app-dock" orientation="horizontal" shape="pill" :collapse="false">
            <!-- Logo + attribution card. The wordmark is the trigger's whole
                 face; at <640px it is the lone ℱ glyph and the dock's control
                 cell (≥44px coarse) is its hit box. -->
            <Popover>
                <DockTrigger for="popover" class="logo-trigger" aria-label="About Fourier analysis">
                    <span class="logo-mark font-serif-math font-semibold tracking-tight select-none">
                        <span class="fourier-f">&#x2131;</span><span class="logo-text">ourier analysis</span>
                    </span>
                </DockTrigger>
                <PopoverContent class="hover-card-content" align="start" :side-offset="10">
                    <div class="flex items-center gap-3">
                        <!-- Self-hosted maintainer avatar: zero third-party origins;
                             80px source for 2× density in the 40px box. -->
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

            <DockSeparator />

            <!-- Route navigation: ONE affordance whose name CARRIES the current
                 section (the only statement of it a screen reader gets), and a
                 menu whose current row is marked by `aria-current` — the
                 announcement and the amber paint are the same fact. -->
            <DropdownMenu>
                <DockTrigger
                    for="dropdown"
                    class="nav-trigger"
                    :aria-label="`Navigate — current section ${activeTabData.label}`"
                >
                    <component :is="activeTabData.icon" class="nav-trigger-icon" />
                    <span class="nav-trigger-label">{{ activeTabData.label }}</span>
                    <ChevronDown class="nav-trigger-chevron" aria-hidden="true" />
                </DockTrigger>
                <DropdownMenuContent class="nav-dropdown" :side-offset="10" align="start">
                    <DropdownMenuItem
                        v-for="tab in tabs"
                        :key="tab.value"
                        class="nav-dropdown-item"
                        :aria-current="activeTab === tab.value ? 'page' : undefined"
                        @select="onTabSelect(tab.value)"
                    >
                        <component :is="tab.icon" class="nav-item-icon" />
                        <span>{{ tab.label }}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DockSeparator />

            <div class="contents" role="group" aria-label="Account">
                <div v-if="galleryStore.adminMode" class="admin-badge" title="Admin mode active">
                    <Shield :size="14" />
                </div>
                <UserSlugBar />
            </div>

            <DockSeparator />

            <DarkModeToggle class="dark-mode-toggle" />
        </GlassDock>
    </header>
</template>

<style scoped>
@reference "tailwindcss";

/* The landmark is a plain flex row: no plate of its own (the dock IS the
   surface), no sticky, no backdrop filter. */
.app-header {
    display: flex;
    justify-content: center;
    padding: 0.5rem 0.625rem 0;
    z-index: var(--z-overlay);
    position: relative;
    font-feature-settings: "liga", "kern";
}

@media (min-width: 640px) {
    .app-header {
        padding: 0.75rem 1.5rem 0;
    }
}

/* Every face in this dock sits in the dock's control cell. The producer
   floors `.dock-control` by `--dock-control-size` (≥44px coarse via
   `--dock-control-floor`) and floors a `DockTrigger` by a `::after` hit
   pseudo; the SAME cell is given to the trigger faces' own boxes through the
   producer's `--dock-trigger-min-height` hook + a matching inline floor, and
   to the dark-mode control through its `--toggle-size` register — one
   measure for all, read from one token. */
.app-dock {
    --dock-trigger-min-height: var(--dock-control-size);
}

.logo-trigger,
.nav-trigger {
    min-inline-size: var(--dock-control-size);
}

.dark-mode-toggle {
    --toggle-size: var(--dock-control-size);
}

/* ── Wordmark ── */
.logo-mark {
    @apply text-2xl;
    line-height: 1;
}

.logo-text {
    display: none;
}

/* ── Nav trigger face ── */
.nav-trigger {
    gap: 0.25rem;
    color: var(--foreground);
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
    transition: transform var(--duration-fast) var(--ease-standard);
}

.nav-trigger[data-state="open"] .nav-trigger-chevron {
    transform: rotate(180deg);
}

@media (min-width: 640px) {
    .logo-mark {
        @apply text-xl;
    }
    .logo-text {
        display: inline;
    }
    .nav-trigger-label {
        display: inline;
    }
}

/* ── Admin badge (a status mark, not a control) ── */
.admin-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: var(--radius-badge);
    background: color-mix(in srgb, var(--tier-featured) 10%, transparent);
    color: var(--tier-featured);
    flex-shrink: 0;
}
</style>

<!-- Portaled surfaces escape the scoped subtree; consumer divergence the
     producer ships no variant for stays inside `@layer glass-overrides`
     (declared after `utilities` in style.css) so the producer's own menu row
     recipe governs everything else. -->
<style>
@layer glass-overrides {
    .hover-card-content {
        min-width: 17rem;
    }
    .nav-dropdown {
        min-width: 12rem;
        padding: 0.5rem;
    }
    .nav-dropdown-item {
        gap: 0.625rem;
    }
    .nav-dropdown-item[aria-current] {
        color: var(--viz-amber);
        background: color-mix(in srgb, var(--viz-amber) 8%, transparent);
    }
    .nav-dropdown-item[aria-current] .nav-item-icon {
        filter: drop-shadow(0 0 3px color-mix(in srgb, var(--viz-amber) 50%, transparent));
    }
    .nav-item-icon {
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
    }
}
</style>
