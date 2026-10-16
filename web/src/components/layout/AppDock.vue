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
 * FACES. Transient surfaces (the attribution card, the section menu) ride
 * `DockTrigger`; the dark-mode control wears `DockControl` (`DarkModeToggle.vue`).
 * The dock's hover plate, press spring, specular gleam and coarse hit floor are the
 * producer's on every control (UIA-F-153: dock faces only, no nested stadium).
 *
 * X.F.W14U.shell:
 *  - X.F.W14V `.nav` (owner ruling, COHESION §0dw, reversing UIA-F-151's tab
 *    limb): the five sections are ONE `DockTrigger for="dropdown"` menu at
 *    every viewport — "this should be a dropdown, not expanded out into paper,
 *    visualize, etc." No inline tab row at any width.
 *  - UIA-F-231: the menu is non-modal (a press on the logo while it is open
 *    reaches About in one press), its trigger shows the section's name, and a
 *    route outside the five claims none.
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
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { useEventListener, useResizeObserver } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import DarkModeToggle from "./DarkModeToggle.vue";
import UserSlugBar from "@/components/auth/UserSlugBar.vue";
import { ChevronDown, Compass, ExternalLink } from "@lucide/vue";
import { sectionNav } from "@/router/routes";
import { useAuthStore } from "@/stores/auth";
import { GlassDock, DockTrigger, DockSeparator } from "@mkbabb/glass-ui/dock";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@mkbabb/glass-ui/menu";
import { Popover, PopoverContent } from "@mkbabb/glass-ui/popover";
import { Separator } from "@mkbabb/glass-ui/separator";
import { Button } from "@mkbabb/glass-ui/button";

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

function onTabSelect(path: string) {
    router.push(path);
}

// ── F.REL `.x5` (COHESION §0fo.2 arm (a), the §0fh.4 idiom): the run keeps what fits ──
// The run's seats are About, Sections, Account and Dark mode, each at glass's
// 44 px floor; all four fit every phone run, so the seat set is whole. What
// does not always fit is the Sections seat's visible section name: at 390 on
// linux metrics the run needed 348 px for a 346 px run (the name 63 px, the
// ℱ wordmark's fallback glyph 46 px), and panned. The name is the run's
// lowest-priority content and it already has its menu home: the menu's
// `aria-current` row, and the trigger's accessible name ("Navigate — current
// section …"). So the trigger shows the name only while the run holds it —
// MEASURED from layout boxes at the bytes the browser rendered, never a
// breakpoint guessed from one platform's font metrics. When glass O-85
// DOCK-PRIORITY-OVERFLOW lands, this measure is retired for it.
const headerRef = useTemplateRef<HTMLElement>("header");
const showNavLabel = ref(true);

/** The dock run: the nearest ancestor that scrolls inline (glass's overflow contract). */
function scrollPort(el: Element): HTMLElement | null {
    for (let node = el.parentElement; node !== null; node = node.parentElement) {
        const overflow = getComputedStyle(node).overflowX;
        if (overflow === "auto" || overflow === "scroll") return node;
    }
    return null;
}

/** Whether the run's children extend past its content box (layout boxes, not `scrollWidth`). */
function overflows(run: HTMLElement): boolean {
    const box = run.getBoundingClientRect();
    const end = box.left + run.clientLeft + run.clientWidth - parseFloat(getComputedStyle(run).paddingInlineEnd);
    let right = -Infinity;
    for (const child of run.children) right = Math.max(right, child.getBoundingClientRect().right);
    return right + run.scrollLeft - end > 0.5;
}

/**
 * X-DS fourier pass 11 · DS-F11X-C1: ONE answer for every route. Measuring
 * only the current section's name put each phone route within a pixel of the
 * run's capacity, so the dock kept "Visualize" (fits by 0.16 px) and dropped
 * "Equation" (1 px over): its form changed per route on sub-pixel glyph
 * widths. The run is now tried with EVERY section's name in turn (the
 * longest is whichever overflows, read from the rendered boxes, not guessed
 * from a character count), and the name shows only if the run holds them
 * all. Each trial is a microtask turn, so no trial name is ever painted.
 */
const probeLabel = ref<string | null>(null);
const navLabel = computed(() => probeLabel.value ?? activeTabData.value?.label ?? "Sections");

/** Every name the trigger can show: the five sections, and "Sections" off them. */
const navLabels = [...tabs.map((t) => t.label), "Sections"];
let fitRun = 0;

async function fitNavLabel(): Promise<void> {
    const run0 = ++fitRun;
    showNavLabel.value = true;
    let fits = true;
    for (const label of navLabels) {
        probeLabel.value = label;
        await nextTick();
        if (run0 !== fitRun) return; // a newer fit owns the trial
        const trigger = headerRef.value?.querySelector(".nav-trigger");
        const run = trigger ? scrollPort(trigger) : null;
        if (run && overflows(run)) {
            fits = false;
            break;
        }
    }
    probeLabel.value = null;
    showNavLabel.value = fits;
}

// The header spans the viewport, so its inline size changes only with the
// viewport, never with the name it holds (the dock itself is content-sized).
let headerWidth = -1;
useResizeObserver(headerRef, (entries) => {
    const width = Math.round(entries[0]?.contentRect.width ?? 0);
    if (width === headerWidth) return;
    headerWidth = width;
    void fitNavLabel();
});
// The web fonts' arrival changes every name's measure, and signing in or out
// changes the Account seat beside it. A route switch does not: the answer
// already covers every section's name.
const auth = useAuthStore();
watch(() => auth.userSlug, () => void fitNavLabel(), { flush: "post" });
if (typeof document !== "undefined" && document.fonts) {
    useEventListener(document.fonts, "loadingdone", () => void fitNavLabel());
}
</script>

<template>
    <header ref="header" class="app-header">
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
                            <p class="text-mono-small text-foreground">@mbabb</p>
                            <p class="text-caption text-muted-foreground">Orthogonal decomposition, drawn with epicycles.</p>
                        </div>
                    </div>
                    <Separator class="my-2" />
                    <!-- X-DS pass 3 · DS-F3-C12: the card's one action reads as one:
                         glass's text Button (its link ink) with an external-link glyph. -->
                    <Button
                        as="a"
                        emphasis="text"
                        size="sm"
                        href="https://github.com/mkbabb/fourier-analysis"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="about-link"
                    >
                        View the project on GitHub
                        <ExternalLink class="size-3.5" aria-hidden="true" />
                    </Button>
                </PopoverContent>
            </Popover>

            <DockSeparator />

            <!-- The sections: ONE affordance at every width (owner ruling,
                 §0dw) whose name carries the current section, and a non-modal
                 menu (UIA-F-231) whose current row is `aria-current` (its
                 paint is glass's half, UIA-F-128). -->
            <DropdownMenu :modal="false">
                <DockTrigger for="dropdown" class="nav-trigger" :aria-label="navName">
                    <component :is="activeTabData?.icon ?? Compass" class="nav-tab-icon" aria-hidden="true" />
                    <span v-show="showNavLabel" class="nav-trigger-label">{{ navLabel }}</span>
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
   longest names, "Visualize" and "Equation", more). When the run cannot
   hold it, the trigger drops its visible label and keeps the section's glyph
   and the menu chevron; its accessible name still carries the section
   ("Navigate — current section …"). F.REL `.x5` (§0fo.2): "cannot hold"
   is MEASURED (`fitNavLabel`), not a 24rem breakpoint: the breakpoint held on
   darwin and was 2 px short at 390 on linux metrics. */

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
   21–24 px target on touch. X-DS pass 3 · DS-F3-C12: it is glass's text
   Button now, which owns its touch floor; the link starts on the card's
   text column. */
.about-link {
    padding-inline: 0;
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
