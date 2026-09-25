import { nextTick } from "vue";
import { createRouter, createWebHistory, type RouteLocationNormalized } from "vue-router";
import { supportsViewTransitions } from "@mkbabb/glass-ui";
import { getImageMeta, getVisualization } from "@/lib/api";
import { ApiProblem } from "@/lib/api-problem";
import { safeGetItem, safeSetItem, safeStorage } from "@/composables/useSafeStorage";

/** The five sections the dock names; a route's `meta.tab` is one of them, or absent. */
export type SectionTab = "/paper" | "/visualize" | "/gallery" | "/equation" | "/morph";

declare module "vue-router" {
    interface RouteMeta {
        title?: string;
        description?: string;
        noindex?: boolean;
        /**
         * X.F.W14U.misc — UIA-F-119 / UIA-F-212: the section this route belongs
         * to, declared once, here. The dock's current section and the
         * remembered tab both read it; a route without one (the internal tool,
         * the not-found page) belongs to no section.
         */
        tab?: SectionTab;
        /**
         * X.F.W14V.au5 — A2-FO-L1-19: the route restores its own scroll (its
         * scroller is not the shell's `<main>`), so the shell's per-entry
         * restore (`App.vue`) stands aside for it.
         */
        ownsScroll?: boolean;
    }
}

// I.ε — the `/w/`↔`/v/` route-morph. The worked-example (`/w/:imageSlug`) and
// the saved visualization (`/v/:visualizationSlug`) both render
// `VisualizationView`; a plain route swap remounts it, flashing the canvas. The
// View Transitions API morphs the old/new frames on the compositor instead.
//
// Gate (inv-29): only when `document.startViewTransition` exists AND the user
// has not requested reduced motion. The named pairs that morph are the
// worked-example ↔ saved-visualization views (same component, param change) and
// the back-and-forth with the gallery. Every other navigation falls straight
// through to the unchanged remount path (the floor). glass-ui's
// `view-transition.css` owns the `::view-transition-*` LOOK + the PRM carve.
// ⊘ FR-AH-6 — one predicate, one home. A second copy lives at
// `composables/useFourierMorph.ts`, gating the morph clock. WHICH home survives
// is F.W5's rider; both sites carry this note so the collapse is one move.
const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const VIZ_ROUTES = new Set(["visualization", "workspace"]);
/** The routes that morph with the visualization surface (I.ε; UIA-F-96: the gallery's card opens the saved entity). */
const MORPH_ROUTES = new Set([...VIZ_ROUTES, "gallery"]);

/** The slug a visualization-surface route addresses (`/visualize` alone carries none). */
function vizSlug(r: RouteLocationNormalized): string | undefined {
    return (r.params.visualizationSlug ?? r.params.imageSlug) as string | undefined;
}

/**
 * True when the from→to pair is a visualization-surface morph worth animating.
 *
 * X.F.W14U.misc — UIA-F-246: one view transition per navigation. A
 * visualization route that carries no slug (`/visualize`) is not a
 * destination: the loader `replace()`s it with the loaded workspace's `/w/`
 * at once, and a transition opened for it was aborted by the one that
 * replace opened. The transition is opened for the navigation that lands.
 */
function isVizMorph(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
): boolean {
    if (!MORPH_ROUTES.has(to.name as string) || !MORPH_ROUTES.has(from.name as string)) return false;
    if (!VIZ_ROUTES.has(to.name as string) && !VIZ_ROUTES.has(from.name as string)) return false;
    if (VIZ_ROUTES.has(to.name as string) && !vizSlug(to)) return false;
    return to.fullPath !== from.fullPath;
}

/**
 * X.F.W14U.misc — UIA-F-212: the remembered tab has ONE writer (`afterEach`,
 * from `meta.tab`) and one reader (the `/` redirect), both through the safe
 * accessor (UIA-F-120: with site data blocked, reading `localStorage` itself
 * throws; losing storage only means no remembered tab).
 */
const SAVED_TAB_KEY = "fourier_active_tab";
const DEFAULT_TAB: SectionTab = "/paper";

function getSavedTab(): string {
    const saved = safeGetItem(safeStorage("local"), SAVED_TAB_KEY);
    const tabs = new Set(router.getRoutes().map((r) => r.meta.tab));
    return saved && tabs.has(saved as SectionTab) ? saved : DEFAULT_TAB;
}

const isNotFound = (e: unknown) => e instanceof ApiProblem && e.status === 404;

/**
 * X.F.W14U.misc — UIA-F-246: `/s/:slug` resolves to the entity it names,
 * instead of redirecting blindly to `/w/`. A saved visualization's slug opens
 * `/v/`; an image's opens its working session, `/w/`; a slug that names
 * neither stays and renders the not-found card. A failure other than 404
 * opens `/v/`, whose loader reports it.
 */
async function resolveShareSlug(to: RouteLocationNormalized): Promise<string | true> {
    const slug = to.params.slug as string;
    try {
        await getVisualization(slug);
        return `/v/${slug}`;
    } catch (e) {
        if (!isNotFound(e)) return `/v/${slug}`;
    }
    try {
        await getImageMeta(slug);
        return `/w/${slug}`;
    } catch (e) {
        return isNotFound(e) ? true : `/w/${slug}`;
    }
}

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            redirect: getSavedTab,
        },
        {
            path: "/paper",
            name: "paper",
            component: () => import("@/components/paper/PaperView.vue"),
            meta: {
                tab: "/paper",
                ownsScroll: true,
                title: "Paper — Fourier Analysis",
                description:
                    "The full typeset treatise: deriving the Fourier transform through the dual lenses of linear algebra and complex analysis — Sturm–Liouville theory, Hilbert spaces, and the spectral theorem.",
            },
        },
        // B.W4 — one slug per noun (CRUD-CONTRACT §1). `/v/:visualizationSlug`
        // addresses a SAVED visualization entity; `/w/:imageSlug` is the
        // pre-save working session over an image asset. The converged entity is
        // slug-addressed, so the saved view needs only the single path segment.
        {
            path: "/v/:visualizationSlug",
            name: "visualization",
            component: () =>
                import("@/components/visualization/VisualizationView.vue"),
            meta: {
                tab: "/visualize",
                title: "Visualize — Fourier Analysis",
                description:
                    "Decompose any image's contour into a chain of rotating epicycles and watch the Fourier series redraw it stroke by stroke.",
            },
        },
        {
            path: "/w/:imageSlug?",
            name: "workspace",
            alias: ["/visualize"],
            component: () =>
                import("@/components/visualization/VisualizationView.vue"),
            meta: {
                tab: "/visualize",
                title: "Visualize — Fourier Analysis",
                description:
                    "Decompose any image's contour into a chain of rotating epicycles and watch the Fourier series redraw it stroke by stroke.",
            },
        },
        {
            path: "/gallery",
            name: "gallery",
            component: () => import("@/components/gallery/GalleryView.vue"),
            meta: {
                tab: "/gallery",
                title: "Gallery — Fourier Analysis",
                description:
                    "A curated gallery of community epicycle visualizations — saved Fourier decompositions of hand-traced contours.",
            },
        },
        {
            path: "/equation",
            name: "equation",
            component: () => import("@/components/equation/EquationView.vue"),
            meta: {
                tab: "/equation",
                title: "Equation Explorer — Fourier Analysis",
                description:
                    "Enter an arbitrary function and watch its Fourier, Chebyshev, and Legendre series converge — coefficients, partial sums, and the convergence plot rendered live.",
            },
        },
        {
            path: "/morph",
            name: "morph",
            component: () => import("@/components/morph/FourierMorphDemo.vue"),
            meta: {
                tab: "/morph",
                title: "Morph — Fourier Analysis",
                description:
                    "Morph one shape into another through their shared Fourier harmonic basis — an interactive study of epicycle interpolation.",
            },
        },
        // X.F.W14V.au6 — A2-FO-L1-24 (d): a developer's tool (it traces the
        // morph demo's sun and moon into contour data), registered on the dev
        // server only; the production bundle carries neither the route nor its
        // chunk (`import.meta.env.DEV` is statically false there). UIA-F-255:
        // titled, and asked out of the index; UIA-F-119: it belongs to no section.
        ...(import.meta.env.DEV
            ? [
                  {
                      path: "/demo/shape-extractor",
                      name: "shape-extractor",
                      component: () => import("@/components/dev/FourierShapeExtractor.vue"),
                      meta: {
                          title: "Shape extractor (internal) — Fourier Analysis",
                          description: "An internal tool that traces the morph demo's sun and moon into contour data.",
                          noindex: true,
                      },
                  },
              ]
            : []),
        {
            path: "/s/:slug",
            name: "share",
            component: () => import("@/components/shared/NotFoundCard.vue"),
            beforeEnter: resolveShareSlug,
            meta: {
                title: "Not found — Fourier Analysis",
                noindex: true,
            },
        },
        // X.F.W14.u — UIA-F-50: the last route. An unknown path rendered an
        // empty `<main>` under the generic title (a soft 404); it now renders
        // the not-found card, titled, and asks crawlers not to index it.
        {
            path: "/:pathMatch(.*)*",
            name: "not-found",
            component: () => import("@/components/shared/NotFoundCard.vue"),
            meta: {
                title: "Not found — Fourier Analysis",
                noindex: true,
            },
        },
    ],
});

// ── I.ε — View-Transitions route-morph bracket ──────────────────────────────
// The navigation guard brackets an eligible swap in `document.startViewTransition`:
// `beforeResolve` opens the transition and parks the route commit on a promise
// the `updateCallback` awaits; `afterEach` (after `nextTick`) resolves it so the
// browser snapshots the post-swap frame. Non-morph or unsupported navigations
// resolve the parked promise immediately and never open a transition (the floor).
let resolveViewSwap: (() => void) | null = null;

router.beforeResolve((to, from) => {
    // Flush any resolver left parked by a prior aborted navigation so the
    // browser's view-transition queue can never deadlock.
    resolveViewSwap?.();
    resolveViewSwap = null;
    if (
        !supportsViewTransitions() ||
        prefersReducedMotion() ||
        !isVizMorph(to, from)
    ) {
        return;
    }
    const swapped = new Promise<void>((resolve) => {
        resolveViewSwap = resolve;
    });
    document.startViewTransition(() => swapped);
});

const DEFAULT_TITLE = "Fourier Analysis";
const DEFAULT_DESCRIPTION =
    "An interactive treatise on Fourier analysis and orthogonal decomposition — epicycle visualizations, an equation explorer, and a full typeset paper deriving the transform through the dual lenses of linear algebra and complex analysis.";

function applyRouteMeta(to: RouteLocationNormalized) {
    document.title = (to.meta.title as string | undefined) ?? DEFAULT_TITLE;
    const description =
        (to.meta.description as string | undefined) ?? DEFAULT_DESCRIPTION;
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
    }
    tag.setAttribute("content", description);

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (to.meta.noindex) {
        if (!robots) {
            robots = document.createElement("meta");
            robots.setAttribute("name", "robots");
            document.head.appendChild(robots);
        }
        robots.setAttribute("content", "noindex");
    } else {
        robots?.remove();
    }
}

router.afterEach((to: RouteLocationNormalized) => {
    applyRouteMeta(to);

    // I.ε — release the View-Transition update callback once the DOM has
    // committed the new route component: Vue's next flush patches the
    // `RouterView`, so `nextTick` is the commit.
    //
    // ⊘ X.F.W10S.b — `G-F9-11` / `C2-M1`: NEVER a frame here. While the update
    // callback is pending the browser SUPPRESSES RENDERING for the document, and
    // `requestAnimationFrame` callbacks run only inside a rendering update — so
    // the double-rAF this release used to wait on could not fire until the
    // browser gave up on the callback: every `/visualize` → `/w/` upload froze
    // the page for the 4 s DOM-update timeout ("Transition was aborted because
    // of timeout in DOM update"), dropped the pointer's hover for that long, and
    // the late dock expansion then swallowed the first click on its Fullscreen
    // control (the producer's click guard discards a press begun mid-morph).
    if (resolveViewSwap) {
        const release = resolveViewSwap;
        resolveViewSwap = null;
        void nextTick(release);
    }

    if (to.meta.tab) safeSetItem(safeStorage("local"), SAVED_TAB_KEY, to.meta.tab);
});

export default router;
