<!-- SERVED MODEL: claude-fable-5-1 · X.F.W14U.shell: claude-opus-5-5 -->
<script setup lang="ts">
/**
 * X.F.W11.c (COHESION §0ao OA-3) — the app's chrome is a `GlassDock`.
 *
 * `AppHeader.vue` is RETIRED, not reduced: every control it carried has one
 * home here, on the producer's dock family (`@mkbabb/glass-ui/dock`) — `Home`
 * (the wordmark) · the sections · the page's tools · the account group
 * (`UserSlugBar`) · `About Fourier analysis` beside `Dark mode`.
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
import { useEventListener, useMediaQuery, useResizeObserver } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import { prefetchRoute } from "@/router";
import DarkModeToggle from "./DarkModeToggle.vue";
import FourierMark from "./FourierMark.vue";
import UserSlugBar from "@/components/auth/UserSlugBar.vue";
import { ChevronDown, Compass, ExternalLink, House, Info, SlidersHorizontal } from "@lucide/vue";
import { sectionNav, type SectionTab } from "@/router/routes";
import { useAuthStore } from "@/stores/auth";
import { GlassDock, DockControl, DockSeparator } from "@mkbabb/glass-ui/dock";
import { DockTrigger } from "@mkbabb/glass-ui/dock-trigger";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@mkbabb/glass-ui/menu";
import { Popover, PopoverContent } from "@mkbabb/glass-ui/popover";
import { Separator } from "@mkbabb/glass-ui/separator";
import { Button } from "@mkbabb/glass-ui/button";
import { ScrollProgressRim } from "@mkbabb/glass-ui/scroll-progress-rim";
import { usePageScroll } from "@/composables/usePageScroll";
import { safeGetItem, safeSetItem, safeStorage } from "@/composables/useSafeStorage";
import { PAGE_TOOLS_COMPACT, usePageTools, type PageToolsForm } from "@/composables/usePageTools";
import { useDockPane } from "@/composables/useWorkspacePane";
import { useDockProgress } from "@/composables/useDockProgress";

const route = useRoute();
const router = useRouter();
const baseUrl = import.meta.env.BASE_URL;
const REPO_URL = "https://github.com/mkbabb/fourier-analysis";
const ABOUT_TAGLINE = "Orthogonal decomposition, drawn with epicycles.";

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

/**
 * FORTY-FIRST E: on a touch screen the dock folds once a section has been
 * chosen (it stayed open after the menu's hold was released, a finger has no
 * leave). After the navigation, as the scroll fold calls it, and never while
 * another surface holds the dock.
 */
const coarsePointer = useMediaQuery("(pointer: coarse)");
function onTabSelect(path: string) {
    void router.push(path).then(() => {
        const dock = dockRef.value;
        if (coarsePointer.value && dock?.expanded && !dock.isHeld) dock.collapse();
    });
}

/**
 * Home (owner, "a home button" on every site; the design critique's S2 and
 * N1): the dock's first seat goes to the paper, the page a first visit opens
 * on. It is a house on a phone (the shared map's Home glyph; the ℱ is the
 * Fourier basis on the stage and the chips) and the wordmark where a desk has
 * room for the word. On the paper a press does nothing, so Home never re-runs
 * the route's entrance (his [110]). It never claims `aria-current`: glass
 * gives a current seat three pitches of the run (`--dock-open-seat`), which
 * pushed the theme seat off a phone's screen and left the desk's wordmark
 * hanging over its own plate. The Sections seat already names where you are.
 */
const HOME: SectionTab = "/paper";
const homeHref = router.resolve(HOME).href;
const atHome = computed(() => activeTab.value === HOME);
function goHome(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (!atHome.value) void router.push(HOME);
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
const dockRef = useTemplateRef<InstanceType<typeof GlassDock>>("dockRef");

/*
 * LAST-TEN F-08 (the site's half): the fit is read on the
 * resting expanded run, so the phone's first open showed the name and then
 * dropped it, the dock snapping 334 -> 283 px inside 450 ms of opening. The
 * dock now opens at its final width: an open dock never takes the name on
 * (a name the run turns out to hold waits for the next fold, unseen behind
 * the seal, and the next open reserves it); it only drops one the run cannot
 * hold, which a resize can force. The answer is remembered per header width
 * and run (session storage), so a later page load opens right the first
 * time; with no answer yet a header under 40rem opens without the name.
 */
const FIT_KEY = "fourier_dock_label_fit";
let fitKey = "";
function readFitMemory(key: string): boolean | null {
    const v = safeGetItem(safeStorage("session"), `${FIT_KEY}:${key}`);
    return v === null ? null : v === "1";
}
const showNavLabel = ref(true);
/** The measured answer the next fold applies, when it grows the run. */
let pendingLabel: boolean | null = null;

function settleLabel(fits: boolean): void {
    if (fitKey) safeSetItem(safeStorage("session"), `${FIT_KEY}:${fitKey}`, fits ? "1" : "0");
    const dock = dockRef.value;
    // Dropping is never deferred (an overflowing run pans); taking the name on is.
    if (!fits || !dock?.expanded) {
        pendingLabel = null;
        showNavLabel.value = fits;
    } else if (!showNavLabel.value) {
        pendingLabel = true;
    }
}

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
    // Collapsed, the full layer is inert and inset into the seal's circle, so
    // its run overflows by construction. Morphing, glass holds the box at the
    // width it reserved for the content it measured (`--dock-expanded-px`), so
    // a longer trial name overflows that box whatever room the header has. The
    // fit is read on the RESTING expanded run only, and read again when an
    // opening morph settles (the watch below).
    const dock = dockRef.value;
    if (!dock?.expanded || dock.isTransitioning) return;
    const run0 = ++fitRun;
    const shown = showNavLabel.value;
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
    showNavLabel.value = shown;
    settleLabel(fits);
}

// The header spans the viewport, so its inline size changes only with the
// viewport, never with the name it holds (the dock itself is content-sized).
let headerWidth = -1;
useResizeObserver(headerRef, (entries) => {
    const width = Math.round(entries[0]?.contentRect.width ?? 0);
    if (width === headerWidth) return;
    headerWidth = width;
    rememberedFit();
    void fitNavLabel();
});
/** The remembered answer for this header and run, applied while the dock is folded. */
function rememberedFit(): void {
    fitKey = `${headerWidth}|${pageSeats.value ? "seats" : "-"}|${auth.userSlug ? "in" : "out"}`;
    if (dockRef.value?.expanded) return;
    const known = readFitMemory(fitKey);
    showNavLabel.value = known ?? !matchMedia(PAGE_TOOLS_COMPACT).matches;
}
// The web fonts' arrival changes every name's measure, and signing in or out
// changes the Account seat beside it. A route switch does not: the answer
// already covers every section's name.
const auth = useAuthStore();
watch(() => auth.userSlug, () => {
    rememberedFit();
    void fitNavLabel();
}, { flush: "post" });
// Only an expansion re-measures, once its morph has settled (glass 11 holds a
// morphing dock at its reserved width, so a fit read on the expand flip itself
// saw every longer name overflow and dropped the label for good). The ref's
// arrival at mount (undefined -> true) is not one: answering it ran the
// six-name trial inside the first route's mount, six forced layouts of a page
// still being built (od19 A/B on CI, 12 pairs: +53-76 ms median own time per
// /v/ and /visualize load at 1440; with this guard the cost is 0 against the
// pre-collapse dock). The header's ResizeObserver already takes the first
// measure after layout.
watch(
    () => {
        const dock = dockRef.value;
        return dock ? dock.expanded && !dock.isTransitioning : undefined;
    },
    (resting, was) => resting && was === false && void fitNavLabel(),
    { flush: "post" },
);
// The fold applies what the open run measured, behind the seal.
watch(
    () => dockRef.value?.expanded,
    (expanded) => {
        if (expanded !== false || pendingLabel === null) return;
        showNavLabel.value = pendingLabel;
        pendingLabel = null;
    },
);
if (typeof document !== "undefined" && document.fonts) {
    useEventListener(document.fonts, "loadingdone", () => void fitNavLabel());
}

// O16 [49] [57] (owner, 13 Nov: "it should by default be collapsed"): the dock
// rests at its seal from first paint, glass's `collapse="closed"` (its
// default); hover, focus or a press opens it, and glass's idle window folds it
// again. The first-route open hold (o1105) is retired with the open start.
/*
 * Canon F6 (restraint, C-35): "Docks shrink on scroll; page progress is a
 * hairline border of the dock, edge to edge" (owner, 2026-11-06). The page's
 * scroller is `<main>`, or the port a route lends (/paper). Scrolling down it
 * folds the dock to its seal, unless a surface the dock opened is held; hover
 * and focus open it again (glass's own writers). A scroll is read as a
 * distance, not a velocity, so a key press (Page Down, End) folds it too. A route's reading progress is
 * glass's `ScrollProgressRim`, seated in the dock's own box (below) and
 * styled as its bottom border.
 */
const pageScroll = usePageScroll();
/** How far down the page must move, from where it last stood, to fold the dock. */
const FOLD_PX = 48;
let foldFrom = 0;
watch(pageScroll.scroller, (el) => { foldFrom = el?.scrollTop ?? 0; });
useEventListener(pageScroll.scroller, "scroll", () => {
    const top = pageScroll.scroller.value?.scrollTop ?? 0;
    const dock = dockRef.value;
    if (!dock?.expanded || top < foldFrom) foldFrom = top;
    else if (top - foldFrom > FOLD_PX && !dock.isHeld) dock.collapse();
}, { passive: true });
/**
 * O16: an open Sections menu holds the dock open (glass's keep-open count, as
 * the editor dock's menus do, X-OD19 F4). With the dock resting collapsed and
 * opened by hover, a pointer that left the dock for the page folded it, and the
 * menu with it, under the reader. glass's DropdownMenu has no `keep-dock-open`
 * (its Popover does: About uses it).
 */
function holdDockWhileOpen(open: boolean) {
    if (open) dockRef.value?.keepOpen();
    else dockRef.value?.release();
}
/**
 * Owner, 2026-11-15: "Each page should have a tool set in the main dock"; 19
 * Nov: "if you want to go this route, we should better contextually display
 * controls in the top bar depending on page". The dock has three zones: Home
 * and the sections lead, the page's own seats stand in the centre, the account,
 * About and the theme close it. Only the centre changes with the page. A page
 * declares its seats in setup (`providePageTools`), so they are here from its
 * first frame, rendered in this dock's tree so they are its children. Between
 * pages the old seats leave before the new arrive (opacity, on the centre's
 * own wrapper); the plate's width is glass's.
 *
 * Under 40rem the dock draws no page tools: the page renders them on its own
 * stage surface. Every seat keeps glass's 44 px coarse cell.
 */
const pageTools = usePageTools();
const compact = useMediaQuery(PAGE_TOOLS_COMPACT);
const PageToolsOutlet = (props: { form: PageToolsForm }) =>
    pageTools.value?.render({ form: props.form }) ?? null;
const pageSeats = computed(() => !compact.value && !!pageTools.value);
/**
 * Owner, 19 Nov: "the tabs toggle for controls should potentially be
 * re-integrated into the top dock". On a phone a stage route shows one pane
 * at a time (`useWorkspacePane`); its switch is one seat in glass's
 * `#persistent-end` region, outside the fold, so it is one press from rest.
 */
const dockPane = useDockPane();
const paneSeat = computed(() => (dockPane.value?.tabbed.value ? dockPane.value : null));
function togglePane() {
    const seat = paneSeat.value;
    if (seat) seat.pane.value = seat.pane.value === "controls" ? "canvas" : "controls";
}
/**
 * On a phone the account has no seat of its own: it is the "i" card's last
 * part (`UserSlugBar` form "card"). With an account seat the open run with the
 * pane seat (Home, Sections, the rule, Account, About, the theme and Controls,
 * each on the 44 px cell) was 367 px, over the 358 the page gutter leaves, so
 * the "i" used to leave for the Sections menu where the pane seat stood. Log
 * in is not a primary function (STUDY 2.1); the "i" and the theme seat close
 * the run on every route, and the Sections menu holds only places.
 *
 * An act that asks for a sign-in (Publish, `auth.requestSignIn`) opens the dock
 * and the card, with the field focused; closing the card settles the request.
 */
const aboutOpen = ref(false);
/** Every control explains itself: on a phone the "i" is the way to sign in, and its name says so. */
const aboutName = computed(() =>
    compact.value
        ? { label: "About Fourier analysis and your account", title: "About and your account" }
        : { label: "About Fourier analysis", title: "About" },
);
const signInPending = computed(() => compact.value && auth.signInRequested);
watch(signInPending, (pending) => {
    if (!pending) return;
    dockRef.value?.expand();
    aboutOpen.value = true;
}, { immediate: true, flush: "post" });
function onAboutOpen(open: boolean) {
    aboutOpen.value = open;
    if (!open && auth.signInRequested) auth.endSignInRequest();
}
/** Asked for a sign-in, the card's focus goes to the field (else reka's first stop). */
function onAboutFocus(e: Event) {
    if (!signInPending.value) return;
    e.preventDefault();
    void nextTick(() => document.getElementById("user-slug-input")?.focus());
}
/** While a request is open, focus handed back elsewhere by the surface that asked does not dismiss the card. */
function onAboutFocusOutside(e: Event) {
    if (signInPending.value) e.preventDefault();
}
/** The rim: a page's own measure (a job on the stage), else its reading progress. */
const dockProgress = useDockProgress();
const rimValue = computed(() => dockProgress.value ?? pageScroll.progress.value);
// The page's seats change the run's width, so the label's fit is read again.
watch(pageSeats, () => {
    rememberedFit();
    void fitNavLabel();
}, { flush: "post" });
const dockEl = computed<HTMLElement | null>(() => (dockRef.value?.$el as HTMLElement | undefined) ?? null);
</script>

<template>
    <header ref="header" class="app-header">
        <GlassDock ref="dockRef" class="app-dock" orientation="horizontal" shape="pill" collapse="closed">
            <!-- Home: a house on a phone, the wordmark on a desk (the dock's
                 control cell its hit box), a link to the paper. The wordmark
                 opens with the site's mark, the epicycle figure the folded
                 seal and the tab carry, never the font's ℱ (which names the
                 Fourier basis on the stage). -->
            <DockControl
                as="a"
                compact
                :href="homeHref"
                class="logo-trigger"
                aria-label="Home — Fourier analysis"
                title="Home"
                @click="goHome"
            >
                <House class="home-glyph" aria-hidden="true" />
                <span class="logo-mark font-serif-math font-semibold tracking-tight select-none">
                    <FourierMark />
                    <span>Fourier analysis</span>
                </span>
            </DockControl>

            <!-- The sections: ONE affordance at every width (owner ruling,
                 §0dw) whose name carries the current section, and a non-modal
                 menu (UIA-F-231) whose current row is `aria-current` (its
                 paint is glass's half, UIA-F-128). -->
            <DropdownMenu :modal="false" @update:open="holdDockWhileOpen">
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
                        @pointerenter="prefetchRoute(tab.value)"
                        @focus="prefetchRoute(tab.value)"
                    >
                        <component :is="tab.icon" aria-hidden="true" />
                        <span>{{ tab.label }}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DockSeparator />

            <!-- The centre: the page's own seats, from 40rem. The old group
                 leaves before the next arrives; its rule leaves with it. -->
            <Transition name="page-seats" mode="out-in">
                <div
                    v-if="pageSeats && pageTools"
                    :key="pageTools.label"
                    class="page-seats"
                    role="group"
                    :aria-label="pageTools.label"
                    data-page-tools
                >
                    <PageToolsOutlet form="seats" />
                    <DockSeparator />
                </div>
            </Transition>

            <!-- The account seat from 40rem; on a phone it is the "i" card's last part. -->
            <div v-if="!compact" class="contents" role="group" aria-label="Account">
                <UserSlugBar />
            </div>

            <!-- About ("i"), beside the theme seat on every route. On a phone it
                 holds the account too, and is named for both. -->
            <Popover keep-dock-open :open="aboutOpen" @update:open="onAboutOpen">
                <DockTrigger for="popover" class="about-trigger" :aria-label="aboutName.label" :title="aboutName.title">
                    <Info class="about-glyph" aria-hidden="true" />
                </DockTrigger>
                <PopoverContent align="end" class="about-card" :class="{ 'about-card--account': compact }" @open-auto-focus="onAboutFocus" @focus-outside="onAboutFocusOutside">
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
                            <p class="text-small text-muted-foreground">{{ ABOUT_TAGLINE }}</p>
                        </div>
                    </div>
                    <Separator class="my-2" />
                    <!-- X-DS pass 3 · DS-F3-C12: the card's one action reads as one:
                         glass's text Button (its link ink) with an external-link glyph. -->
                    <Button
                        as="a"
                        emphasis="text"
                        size="sm"
                        :href="REPO_URL"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="about-link"
                    >
                        View the project on GitHub
                        <ExternalLink class="size-3.5" aria-hidden="true" />
                    </Button>
                    <template v-if="compact">
                        <Separator class="my-2" />
                        <UserSlugBar form="card" @done="onAboutOpen(false)" />
                    </template>
                </PopoverContent>
            </Popover>

            <DarkModeToggle class="dark-mode-toggle" />

            <!-- The phone's pane switch (`useWorkspacePane`): outside the fold. -->
            <template v-if="paneSeat" #persistent-end>
                <DockControl
                    class="pane-seat"
                    aria-label="Controls"
                    title="Controls"
                    :active="paneSeat.pane.value === 'controls'"
                    @click="togglePane"
                >
                    <SlidersHorizontal aria-hidden="true" />
                </DockControl>
            </template>

            <!-- Collapsed, the seal is the fourier mark (FORTY-FIRST B: "an
                 actual epicycle/series image"), the drawing the tab, the touch
                 icon and the share card carry, on every route. -->
            <template #collapsed>
                <FourierMark />
            </template>
        </GlassDock>
        <Teleport v-if="dockEl && rimValue !== null" :to="dockEl">
            <ScrollProgressRim edge="border" :value="rimValue" :stops="pageScroll.progressStops.value" class="dock-progress" />
        </Teleport>
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
   matching inline floor — one measure, read from one token.
   One glyph size in this dock (STUDY 2.7; owner question 4 holds any growth
   past it): glass's seats read `--dock-icon-glyph`, set here to the rung the
   site's trigger glyphs already wore (24 px), and every trigger glyph the
   site draws reads the same token by its own class (here, and the account
   glyphs in `UserSlugBar.vue`). */
.app-dock {
    --dock-trigger-min-height: var(--dock-control-size);
    --dock-icon-glyph: var(--icon-xl);
}
.nav-tab-icon,
.about-glyph {
    inline-size: var(--dock-icon-glyph);
    block-size: var(--dock-icon-glyph);
}

/* The centre group: the page's seats in a row at the run's own gap, and the
   rule that closes it. It leaves (120 ms) before the next group arrives
   (160 ms), by opacity alone; under reduced motion each is 120 ms. */
.page-seats {
    display: flex;
    align-items: center;
    gap: var(--dock-layer-gap, 0.375rem);
}
.page-seats-enter-active {
    transition: opacity 160ms var(--ease-standard);
}
.page-seats-leave-active {
    transition: opacity 120ms var(--ease-in);
}
.page-seats-enter-from,
.page-seats-leave-to {
    opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
    .page-seats-enter-active {
        transition-duration: 120ms;
    }
}

/* FORTY-FIRST E: the header is its own view-transition group, so a route
   change does not cross-fade the dock with the page (it is the same live dock
   on both routes). The rules for its images are in the unscoped block below. */
.app-header {
    view-transition-name: app-header;
}

.logo-trigger,
.nav-trigger,
.about-trigger {
    min-inline-size: var(--dock-control-size);
}

/* Home is a compact (auto-sized) control so the wordmark sets its width; its
   height keeps the dock's control cell (44 px on a coarse pointer). */
.logo-trigger {
    min-block-size: var(--dock-control-size);
}

/* ── Home: the house on a phone, the wordmark from 640px ── */
.home-glyph {
    inline-size: var(--dock-icon-glyph);
    block-size: var(--dock-icon-glyph);
}
.logo-mark {
    display: none;
    align-items: center;
    gap: 0.375rem;
    @apply text-xl;
    line-height: 1;
    /* The mark on the dock's one glyph size (FourierMark's own hook). */
    --fourier-mark-size: var(--dock-icon-glyph);
}

@media (min-width: 640px) {
    .home-glyph {
        display: none;
    }
    .logo-mark {
        display: inline-flex;
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

/* Reduced motion: the chevron still turns, on the shortest clock, never in one frame. */
@media (prefers-reduced-motion: reduce) {
    .nav-trigger-chevron {
        transition-duration: var(--duration-instant);
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
    /* X §0hm D-22: there the dock's own plate takes glass's compact block
       inset (the cockpit density's rung, `--dock-density-compact-padding-block`),
       not the comfortable one; the controls keep their touch floor. The short-
       height density itself is a glass row (relayed). */
    .app-dock {
        --dock-padding-block: calc(var(--dock-density-compact-padding-block, 0.25rem) * var(--dock-scale));
    }
}

/* With the account in it (a phone), the card takes the sign-in form's measure. */
.about-card--account {
    inline-size: min(22rem, calc(100vw - 2rem));
}

.about-avatar {
    inline-size: 2.5rem;
    block-size: 2.5rem;
    border-radius: var(--radius-circle);
    flex-shrink: 0;
}
</style>

<!-- The header's view-transition images (unscoped: they are pseudo-elements
     of the document). The old image is not shown and the new one is not
     animated, so across a route change the dock is the live dock, never dimmed
     or doubled. The group is not animated either: the browser gives every
     named group a 250 ms move from the old box to the new, which here would
     stretch the dock's picture whenever its width changes with the route; the
     group takes the live dock's box instead, and the dock's own width glides. -->
<style>
::view-transition-group(app-header) {
    animation: none;
}
::view-transition-old(app-header) {
    display: none;
}
::view-transition-new(app-header) {
    animation: none;
}
</style>
