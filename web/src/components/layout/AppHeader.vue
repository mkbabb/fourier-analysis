<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHoverCard } from "./composables/useHoverCard";
import { useWorkspaceStore } from "@/stores/workspace";
import DarkModeToggle from "./DarkModeToggle.vue";
import BouncyToggle from "@/components/ui/BouncyToggle.vue";
// ShareButton moved to timeline dock

const route = useRoute();
const router = useRouter();

const { isOpen: cardOpen, toggle: toggleCard, close: closeCard, onHoverEnter, onHoverLeave } = useHoverCard();

// Close hover card on outside click (for touch devices)
function onDocClick() { closeCard(); }
onMounted(() => document.addEventListener("click", onDocClick));
onUnmounted(() => document.removeEventListener("click", onDocClick));

const tabOptions = [
    { label: "Paper", value: "/paper" },
    { label: "Visualize", value: "/visualize" },
    { label: "Equation", value: "/equation" },
    { label: "Gallery", value: "/gallery" },
    { label: "Morph", value: "/morph" },
];

const activeTab = computed(() => {
    if (route.path === "/paper") return "/paper";
    if (route.path === "/visualize" || route.path.startsWith("/s/") || route.path.startsWith("/w/")) return "/visualize";
    if (route.path === "/equation") return "/equation";
    if (route.path === "/gallery") return "/gallery";
    if (route.path === "/morph") return "/morph";
    return "/paper";
});

function onTabChange(path: string) {
    router.push(path);
}

const workspaceStore = useWorkspaceStore();
</script>

<template>
    <header class="app-header sticky top-0 z-50 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div class="header-inner">
            <!-- Logo with attribution hover card -->
            <div
                class="logo-trigger relative shrink-0"
                role="button"
                tabindex="0"
                aria-label="Show project info"
                @click.stop="toggleCard"
                @keydown.enter="toggleCard"
                @mouseenter="onHoverEnter"
                @mouseleave="onHoverLeave"
            >
                <span class="logo-mark cm-serif font-semibold tracking-tight cursor-pointer select-none">
                    <span class="fourier-f">&#x2131;</span><span class="logo-text">ourier analysis</span>
                </span>

                <!-- Hover card -->
                <div class="hover-card" :class="{ 'is-open': cardOpen }">
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
                </div>
            </div>

            <div class="header-divider" />

            <div class="tab-scroll-container">
                <BouncyToggle
                    :options="tabOptions"
                    :model-value="activeTab"
                    @update:model-value="onTabChange"
                />
            </div>

            <div class="ml-auto flex items-center gap-1.5 shrink-0">
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
    padding: 0.375rem 0.5rem;
}

@media (min-width: 640px) {
    .header-inner {
        height: 3.5rem;
        gap: 1rem;
        padding: 0 1.5rem;
    }
}

/* ── Scrollable tab container with edge fade ── */
.tab-scroll-container {
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    mask-image: linear-gradient(
        to right,
        transparent,
        black 0.75rem,
        black calc(100% - 0.75rem),
        transparent
    );
    -webkit-mask-image: linear-gradient(
        to right,
        transparent,
        black 0.75rem,
        black calc(100% - 0.75rem),
        transparent
    );
}
.tab-scroll-container::-webkit-scrollbar {
    display: none;
}
/* Remove mask when not overflowing (enough room for all tabs) */
@media (min-width: 400px) {
    .tab-scroll-container {
        mask-image: none;
        -webkit-mask-image: none;
    }
}

/* Mobile: compact logo, divider, toggle sizing */
.logo-mark {
    @apply text-lg;
}

.logo-text {
    display: none;
}

.header-divider {
    width: 1px;
    height: 1rem;
    background: hsl(var(--foreground) / 0.15);
    flex-shrink: 0;
}

.dark-mode-toggle {
    --toggle-size: 2.25rem;
}

@media (min-width: 640px) {
    .logo-mark {
        @apply text-xl;
    }
    .logo-text {
        display: inline;
    }
    .header-divider {
        height: 1.25rem;
    }
    .dark-mode-toggle {
        --toggle-size: 2.75rem;
    }
}

/* ── Attribution hover card ── */
.logo-trigger {
    cursor: pointer;
}

.hover-card {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.25rem;
    padding: 0.875rem 1rem;
    background: color-mix(in srgb, hsl(var(--popover)) 85%, transparent);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border: 1.5px solid hsl(var(--border) / 0.4);
    border-radius: 0.75rem;
    opacity: 0;
    pointer-events: none;
    transform: scale(0.92) translateY(6px);
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 60;
    min-width: 17rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Bridge gap so hover doesn't drop */
.hover-card::before {
    content: '';
    position: absolute;
    top: -0.75rem;
    left: 0;
    right: 0;
    height: 0.75rem;
}

.hover-card.is-open {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1) translateY(0);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
}

/* Share button enter/leave */
.share-pop-enter-active {
    transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
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
