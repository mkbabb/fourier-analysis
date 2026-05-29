<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { useGalleryStore } from "@/stores/gallery";
import DarkModeToggle from "./DarkModeToggle.vue";
import UserSlugBar from "@/components/visualization/gallery/UserSlugBar.vue";
import { Shield, ChevronDown, FileText, Eye, LayoutGrid, Sigma, Shuffle } from "lucide-vue-next";
import {
    Button,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
} from "@mkbabb/glass-ui";

const route = useRoute();
const router = useRouter();

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

const workspaceStore = useWorkspaceStore();
const galleryStore = useGalleryStore();
</script>

<template>
    <header class="app-header sticky top-0 z-[var(--z-overlay)] bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div class="header-inner">
            <!-- Logo with attribution hover card -->
            <HoverCard>
                <HoverCardTrigger as-child>
                    <div
                        class="logo-trigger relative shrink-0"
                        role="button"
                        tabindex="0"
                        aria-label="Go to paper"
                        @click.stop="router.push('/paper')"
                        @keydown.enter="router.push('/paper')"
                    >
                        <span class="logo-mark cm-serif font-semibold tracking-tight cursor-pointer select-none">
                            <span class="fourier-f">&#x2131;</span><span class="logo-text">ourier analysis</span>
                        </span>
                    </div>
                </HoverCardTrigger>
                <HoverCardContent class="hover-card-content" align="start" :side-offset="6">
                    <div class="flex items-center gap-3">
                        <img
                            src="https://avatars.githubusercontent.com/u/2848617?v=4"
                            alt="mkbabb"
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
                </HoverCardContent>
            </HoverCard>

            <div class="header-divider" />

            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button
                        variant="ghost"
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

.nav-trigger:focus-visible {
    outline: 2px solid var(--ring);
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
    cursor: pointer;
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
/* @global — portaled glass-ui HoverCardContent */
.hover-card-content {
    min-width: 17rem;
}

/* @global — portaled glass-ui DropdownMenuContent */
.nav-dropdown {
    min-width: 12rem;
    padding: 0.5rem;
}

.nav-dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: none;
    background: none;
    color: color-mix(in srgb, var(--foreground) 60%, transparent);
    font-family: var(--font-serif);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease;
    outline: none;
}

.nav-dropdown-item:hover,
.nav-dropdown-item[data-highlighted] {
    background: color-mix(in srgb, var(--foreground) 6%, transparent);
    color: var(--foreground);
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
</style>
