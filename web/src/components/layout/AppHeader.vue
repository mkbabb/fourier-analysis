<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHoverCard } from "./composables/useHoverCard";
import { useSessionStore } from "@/stores/session";
import { Share2, Check } from "lucide-vue-next";
import DarkModeToggle from "./DarkModeToggle.vue";
import BouncyToggle from "@/components/ui/BouncyToggle.vue";
import { Tooltip } from "@/components/ui/tooltip";
import PathPreview from "@/components/ui/PathPreview.vue";
import { VIZ_COLORS } from "@/lib/colors";

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
    { label: "Morph", value: "/morph" },
];

const activeTab = computed(() => {
    if (route.path === "/paper") return "/paper";
    if (route.path === "/visualize" || route.path.startsWith("/s/")) return "/visualize";
    if (route.path === "/morph") return "/morph";
    return "/paper";
});

function onTabChange(path: string) {
    router.push(path);
}

const sessionStore = useSessionStore();
const copied = ref(false);

async function copyShareUrl() {
    if (!sessionStore.slug || !sessionStore.hasImage) return;
    const url = `${window.location.origin}/s/${sessionStore.slug}`;
    await navigator.clipboard.writeText(url);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
}
</script>

<template>
    <header class="app-header sticky top-0 z-50 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div class="flex h-14 items-center gap-2 sm:gap-4 px-2 sm:px-6">
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
                <span class="cm-serif text-lg font-semibold tracking-tight cursor-pointer select-none">
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

            <div class="h-5 w-px bg-foreground/15 shrink-0" />

            <div class="tab-scroll-container">
                <BouncyToggle
                    :options="tabOptions"
                    :model-value="activeTab"
                    @update:model-value="onTabChange"
                />
            </div>

            <div class="ml-auto flex items-center gap-1.5 shrink-0">
                <Transition name="share-pop">
                    <Tooltip
                        v-if="activeTab === '/visualize' && sessionStore.slug && sessionStore.hasImage"
                        side="bottom"
                    >
                        <template #content>
                            <div class="share-tooltip" @click="copyShareUrl">
                                <div v-if="sessionStore.epicycleData" class="share-tooltip-grid">
                                    <PathPreview
                                        :path-x="sessionStore.epicycleData.path.x"
                                        :path-y="sessionStore.epicycleData.path.y"
                                        :size="80"
                                        :stroke-width="1.5"
                                        :stroke-color="VIZ_COLORS.fourier"
                                        class="share-tooltip-preview"
                                    />
                                    <Transition name="copied-fade">
                                        <div v-if="copied" class="share-tooltip-copied">
                                            <Check class="h-5 w-5" />
                                        </div>
                                    </Transition>
                                </div>
                                <hr v-if="sessionStore.epicycleData" class="share-tooltip-divider" />
                                <span class="share-tooltip-desc">
                                    {{ copied ? 'Link copied!' : 'Share your image animation' }}
                                </span>
                            </div>
                        </template>
                        <button class="share-btn" @click="copyShareUrl">
                            <Transition name="icon-swap" mode="out-in">
                                <Check v-if="copied" class="h-5 w-5 text-green-500" />
                                <Share2 v-else class="h-5 w-5" />
                            </Transition>
                        </button>
                    </Tooltip>
                </Transition>
                <DarkModeToggle style="--toggle-size: 2.75rem" />
            </div>
        </div>
    </header>
</template>

<style scoped>
.app-header {
    font-feature-settings: "liga", "kern";
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

/* Mobile: hide "ourier analysis" text */
.logo-text {
    display: none;
}
@media (min-width: 640px) {
    .logo-text {
        display: inline;
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

.share-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border: none;
    background: none;
    color: hsl(var(--muted-foreground));
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 0;
}

.share-btn:hover {
    color: hsl(var(--foreground));
    transform: scale(1.1);
}

.share-btn:active {
    transform: scale(0.95);
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

/* Icon swap transition */
.icon-swap-enter-active,
.icon-swap-leave-active {
    transition: all 0.15s ease;
}
.icon-swap-enter-from {
    opacity: 0;
    transform: scale(0.7);
}
.icon-swap-leave-to {
    opacity: 0;
    transform: scale(0.7);
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

<style>
/* Share tooltip (global — renders in portal) */
.share-tooltip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
    cursor: pointer;
}
.share-tooltip-grid {
    position: relative;
    border-radius: 0.375rem;
    overflow: hidden;
    background-color: hsl(var(--card));
    background-image:
        linear-gradient(hsl(var(--foreground) / 0.06) 1px, transparent 1px),
        linear-gradient(90deg, hsl(var(--foreground) / 0.06) 1px, transparent 1px);
    background-size: 10px 10px;
}
.share-tooltip-preview {
    position: relative;
    z-index: 1;
}
.share-tooltip-copied {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    background: hsl(var(--card) / 0.8);
    color: #22c55e;
    border-radius: 0.375rem;
}
.copied-fade-enter-active {
    transition: opacity 0.2s ease;
}
.copied-fade-leave-active {
    transition: opacity 0.3s ease;
}
.copied-fade-enter-from,
.copied-fade-leave-to {
    opacity: 0;
}
.share-tooltip-divider {
    width: 100%;
    border: none;
    border-top: 1px solid hsl(var(--border) / 0.5);
    margin: 0;
}
.share-tooltip-desc {
    font-size: 0.8125rem;
    font-weight: 500;
    white-space: nowrap;
    animation: gold-pulse 2.5s ease-in-out infinite;
    transition: color 0.2s ease;
}

@keyframes gold-pulse {
    0%, 100% { color: inherit; }
    50% { color: #f0b632; }
}
</style>
