import { nextTick } from "vue";
import { createRouter, createWebHistory, type RouteLocationNormalized } from "vue-router";
import { supportsViewTransitions } from "@mkbabb/glass-ui";
import { safeSetItem, safeStorage } from "@/composables/useSafeStorage";
import { routes, SAVED_TAB_KEY } from "./routes";

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

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
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
