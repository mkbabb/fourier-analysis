import { nextTick } from "vue";
import { createRouter, createWebHistory, START_LOCATION, type RouteLocationNormalized, type RouteLocationRaw } from "vue-router";
import { routeTransition } from "@mkbabb/glass-ui/motion-core";
import { safeSetItem, safeStorage } from "@/composables/useSafeStorage";
import { routes, SAVED_TAB_KEY } from "./routes";

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

// ── X·OD19 F5 ⊕ ALL — every route change runs under glass's route grammar ──
// The owner (2026-10-19, OD19-F5): "going from one route to another should
// animate smoothly and subtly". `App.vue`'s `<RouterView />` swapped `<main>`'s
// child in one frame. Every navigation that changes the path now runs under
// glass `routeTransition({ nav: "route" })`: glass opens the View Transition
// (typed `route`, so `styles/view-transition.css` owns the crossfade on the
// `--route-route-clock`), and glass alone gates it — no API or reduced motion
// runs the mutation bare, so the swap lands with no animation.
//
// This supersedes I.ε's local `document.startViewTransition` bracket (the
// /w ↔ /v ↔ /gallery pairs only); the named `viz-canvas-stage` group those
// pairs morph still rides the same transition. The router seam cannot hand a
// navigation to `mutate`, so `mutate` returns a promise `afterEach` releases
// once the new route has committed.
//
// ⊘ X.F.W10S.b — `G-F9-11` / `C2-M1`: the release is a `nextTick`, NEVER a
// frame. While the update callback is pending the browser suppresses
// rendering, and `requestAnimationFrame` cannot fire until it gives up (the 4 s
// "Transition was aborted because of timeout in DOM update" freeze).
//
// X.F.W14U.misc — UIA-F-246: one view transition per navigation. A navigation
// that starts while a route transition is still running (the loader's
// `/visualize` → `/w/<slug>` replace, a second click mid-fade) opens none: its
// DOM change shows through the running transition's live new image, so it is
// never aborted by, or aborts, the transition that is already landing.
let releaseSwap: (() => void) | null = null;
let transitionRunning = false;

router.beforeResolve((to, from) => {
    // Flush any release left parked by a prior aborted navigation so the
    // browser's view-transition queue can never deadlock.
    releaseSwap?.();
    releaseSwap = null;
    if (from === START_LOCATION || to.path === from.path || transitionRunning) return;
    const swapped = new Promise<void>((resolve) => {
        releaseSwap = resolve;
    });
    transitionRunning = true;
    void routeTransition({ nav: "route", mutate: () => swapped }).finished.then(() => {
        transitionRunning = false;
    });
});

// ── X·OD19 ALL — prefetch on navigation intent ──────────────────────────────
// A section the reader points at is loaded before the click: its route chunk
// (the record's lazy component), and the route's own first data where its
// module offers a `prefetch()` (/equation's default compute, a 1.7–2.5 s cold
// server TTFB). Each is idempotent: the module cache dedupes the chunk, and the
// route's `prefetch()` memoises its own request.
const prefetched = new Set<string>();

export function prefetchRoute(to: RouteLocationRaw): void {
    for (const record of router.resolve(to).matched) {
        const load = record.components?.default;
        if (typeof load !== "function" || prefetched.has(record.path)) continue;
        prefetched.add(record.path);
        void (load as () => Promise<{ prefetch?: () => void }>)()
            .then((mod) => mod.prefetch?.())
            .catch(() => prefetched.delete(record.path));
    }
}

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

    // Release the route transition's update callback once the DOM has
    // committed the new route component: Vue's next flush patches the
    // `RouterView`, so `nextTick` is the commit (never a frame; see above).
    if (releaseSwap) {
        const release = releaseSwap;
        releaseSwap = null;
        void nextTick(release);
    }

    if (to.meta.tab) safeSetItem(safeStorage("local"), SAVED_TAB_KEY, to.meta.tab);
});

export default router;
