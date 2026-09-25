<!-- SERVED MODEL: claude-fable-5-1 · X.F.W14U.shell: claude-opus-5-5 -->
<script setup lang="ts">
/**
 * X.F.W11.c (COHESION §0ao OA-3) — the app's chrome is a `GlassDock`.
 *
 * `AppHeader.vue` is RETIRED, not reduced: every control it carried has one
 * home here, on the producer's dock family (`@mkbabb/glass-ui/dock`) — `About
 * Fourier analysis` · the sections · the account group (`UserSlugBar`) · `Dark
 * mode`.
 *
 * FACES. Transient surfaces (the attribution card, the phone's section menu)
 * ride `DockTrigger`; the sections at desktop width are `DockControl` tabs; the
 * dark-mode control wears `DockControl` too (`DarkModeToggle.vue`). The dock's
 * hover plate, press spring, specular gleam and coarse hit floor are the
 * producer's on every control (UIA-F-153: dock faces only, no nested stadium).
 *
 * X.F.W14U.shell:
 *  - UIA-F-151: the five sections are visible when there is room (≥1024 px,
 *    measured: the inline row takes ~890 px, which a 768 px viewport cannot
 *    hold) as `DockControl shape="tab"` links, the current one `aria-current`
 *    and on glass's selected seat; below that, one menu.
 *  - UIA-F-231: the phone menu is non-modal (a press on the logo while it is
 *    open reaches About in one press), its trigger shows the section's name,
 *    and a route outside the five claims none.
 *  - UIA-F-128 ⊕ UIA-F-233: the menu is glass's as published — no local
 *    current-row tint, no plate padding/width literals, no icon glows; the
 *    `[aria-current]` paint is glass's half (O-59).
 *  - UIA-F-150 ⊕ UIA-F-144: the tinted admin disc is gone; the admin state
 *    lives in the account menu (`UserSlugBar`).
 *  - UIA-F-57 ⊕ UIA-F-154 ⊕ UIA-F-233 ⊕ UIA-F-219: the About card takes the
 *    named rungs (`text-small`, `text-caption`; `text-sm`/`text-xs` are dead
 *    under glass ≥8), glass `Separator`, the house `focus-ring`, one GitHub
 *    link, no emoji, a tagline that does not echo the wordmark, and glass's
 *    own popover offset. The avatar stays an `<img>` until glass exports an
 *    Avatar (F-145).
 *  - UIA-F-152: the header clears the content by the same gutter it keeps
 *    above the dock (`--space-body`).
 */
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useMediaQuery } from "@vueuse/core";
import DarkModeToggle from "./DarkModeToggle.vue";
import UserSlugBar from "@/components/auth/UserSlugBar.vue";
import { ChevronDown, Compass } from "@lucide/vue";
import { sectionNav } from "@/router/routes";
import { GlassDock, DockControl, DockTrigger, DockSeparator } from "@mkbabb/glass-ui/dock";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@mkbabb/glass-ui/menu";
import { Popover, PopoverContent } from "@mkbabb/glass-ui/popover";
import { Separator } from "@mkbabb/glass-ui/separator";

const route = useRoute();
const router = useRouter();
const baseUrl = import.meta.env.BASE_URL;

/**
 * X.F.W14V.au6 — A2-FO-L1-25: the sections are the routes' `meta.nav`, read
 * from the router (`router/routes.ts` declares them once); the dock keeps no
 * list of its own.
 */
const tabs = sectionNav(router.getRoutes());

/**
 * The section the route belongs to; `null` off the five (404, internal tools).
 * X.F.W14U.misc — UIA-F-119 / UIA-F-212: read from the route's `meta.tab`
 * (declared once, in the router), not a path-prefix ladder that missed the
 * trailing-slash and alias forms.
 */
const activeTab = computed<string | null>(() => route.meta.tab ?? null);

const activeTabData = computed(() => tabs.find((t) => t.value === activeTab.value) ?? null);

const navName = computed(() =>
    activeTabData.value ? `Navigate — current section ${activeTabData.value.label}` : "Navigate",
);

const inlineNav = useMediaQuery("(min-width: 1024px)");

function onTabSelect(path: string) {
    router.push(path);
}
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
                <PopoverContent align="start" class="about-card">
                    <div class="flex items-center gap-3">
                        <!-- Self-hosted maintainer avatar (zero third-party
                             origins; 80px source for 2× density in the 40px box). -->
                        <img
                            :src="`${baseUrl}assets/maintainer-avatar.png`"
                            alt=""
                            width="80"
                            height="80"
                            decoding="async"
                            class="about-avatar"
                        />
                        <div class="flex-1 min-w-0">
                            <p class="fira-code text-small text-foreground">@mbabb</p>
                            <p class="text-caption text-muted-foreground">Orthogonal decomposition, drawn with epicycles.</p>
                        </div>
                    </div>
                    <Separator class="my-2" />
                    <a
                        href="https://github.com/mkbabb/fourier-analysis"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="about-link focus-ring text-small text-foreground hover:underline"
                    >View the project on GitHub</a>
                </PopoverContent>
            </Popover>

            <DockSeparator />

            <!-- UIA-F-151: the sections, inline where the dock has room. -->
            <nav v-if="inlineNav" class="contents" aria-label="Sections">
                <DockControl
                    v-for="tab in tabs"
                    :key="tab.value"
                    shape="tab"
                    :as="RouterLink"
                    :to="tab.value"
                    class="nav-tab"
                    :aria-current="activeTab === tab.value ? 'page' : undefined"
                    :data-active="activeTab === tab.value ? '' : undefined"
                >
                    <component :is="tab.icon" class="nav-tab-icon" aria-hidden="true" />
                    <span>{{ tab.label }}</span>
                </DockControl>
            </nav>

            <!-- Below 1024px: ONE affordance whose name carries the current
                 section, and a non-modal menu (UIA-F-231) whose current row is
                 `aria-current` (its paint is glass's half, UIA-F-128). -->
            <DropdownMenu v-else :modal="false">
                <DockTrigger for="dropdown" class="nav-trigger" :aria-label="navName">
                    <component :is="activeTabData?.icon ?? Compass" class="nav-tab-icon" aria-hidden="true" />
                    <span class="nav-trigger-label">{{ activeTabData?.label ?? "Sections" }}</span>
                    <ChevronDown class="nav-trigger-chevron" aria-hidden="true" />
                </DockTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem
                        v-for="tab in tabs"
                        :key="tab.value"
                        :aria-current="activeTab === tab.value ? 'page' : undefined"
                        @select="onTabSelect(tab.value)"
                    >
                        <component :is="tab.icon" aria-hidden="true" />
                        <span>{{ tab.label }}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DockSeparator />

            <div class="contents" role="group" aria-label="Account">
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
   surface), no sticky, no backdrop filter. UIA-F-152: the gutter below the
   dock is the gutter above it (`--space-body`, 0.5rem → 0.75rem). */
.app-header {
    display: flex;
    justify-content: center;
    padding: var(--space-body) 0.625rem;
    z-index: var(--z-overlay);
    position: relative;
    font-feature-settings: "liga", "kern";
}

@media (min-width: 640px) {
    .app-header {
        padding-inline: 1.5rem;
    }
}

/* Every face in this dock sits in the dock's control cell: the producer's
   `--dock-trigger-min-height` hook for the trigger faces' block size and a
   matching inline floor — one measure, read from one token. */
.app-dock {
    --dock-trigger-min-height: var(--dock-control-size);
}

.logo-trigger,
.nav-trigger {
    min-inline-size: var(--dock-control-size);
}

/* ── Wordmark ── */
.logo-mark {
    @apply text-2xl;
    line-height: 1;
}

.logo-text {
    display: none;
}

@media (min-width: 640px) {
    .logo-mark {
        @apply text-xl;
    }
    .logo-text {
        display: inline;
    }
}

/* ── Section faces: the Fourier amber marks the section glyph ── */
.nav-trigger {
    gap: 0.25rem;
}

.nav-tab-icon {
    flex-shrink: 0;
    color: var(--viz-amber);
}

.nav-trigger-chevron {
    width: 1rem;
    height: 1rem;
    opacity: 0.5;
    flex-shrink: 0;
    transition: transform var(--duration-fast) var(--ease-standard);
}

/* X.F.W14V.au1 — A2-FO-X-5: at 360 the dock's one run is 334 px of faces in a
   316 px layer, so it panned sideways by 18 px (at every section, and the
   longest names, "Visualize" and "Equation", more). On the narrowest phones
   the trigger drops its visible label and keeps the section's glyph and the
   menu chevron; its accessible name still carries the section
   ("Navigate — current section …"). */
@media (max-width: 24rem) {
    .nav-trigger-label {
        display: none;
    }
}

.nav-trigger[data-state="open"] .nav-trigger-chevron {
    transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
    .nav-trigger-chevron {
        transition: none;
    }
}

/* ── About card ── */
/* X.F.W14V.au1 — A2-FO-L2-17: the card's link was a bare inline anchor, a
   21–24 px target on touch. It is a row whose block size is glass's touch
   target on a coarse pointer (`--touch-target`, the same floor glass's
   `[data-control-target]` controls take). */
.about-link {
    display: flex;
    align-items: center;
}
@media (pointer: coarse) {
    .about-link {
        min-block-size: var(--touch-target);
    }
}

/* X.F.W14V.au1 — A2-FO-L2-4: short landscape (844×390) spent 72 of 390 px on
   the app dock's band. The dock keeps its control size (glass owns it); the
   band around it tightens to the residue rung, so the stage gets the rows. */
@media (orientation: landscape) and (max-height: 500px) {
    .app-header {
        padding-block: var(--space-residue);
    }
}

.about-avatar {
    inline-size: 2.5rem;
    block-size: 2.5rem;
    border-radius: var(--radius-pill);
    flex-shrink: 0;
}
</style>
