import type { Component } from "vue";
import type { RouteLocationNormalized, RouteMeta, RouteRecordRaw } from "vue-router";
import { Eye, FileText, LayoutGrid, Shuffle, Sigma } from "@lucide/vue";
import { getImageMeta, getVisualization } from "@/lib/api";
import { ApiProblem } from "@/lib/api-problem";
import { safeGetItem, safeStorage } from "@/composables/useSafeStorage";

/**
 * X.F.W14V.au6 — A2-FO-L1-25: the route table, and with it the app's one
 * section registry. A section is declared once, on its route: `meta.tab` says
 * which section a route belongs to (UIA-F-119/F-212), and `meta.nav` on the
 * one route that names the section gives the dock its label, glyph and place.
 * The dock (`AppDock.vue`) builds its tabs, its current section and the
 * remembered-tab set from these records (`sectionNav`); nothing else lists
 * the sections. The router itself (`./index.ts`) is built from `routes`.
 */

/** A section's dock entry, declared on its route (`meta.nav`). */
export interface SectionNav {
    label: string;
    icon: Component;
    order: number;
}

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
        /**
         * X.F.W14V.au6 — A2-FO-L1-25: the section's entry in the dock, declared
         * on the one route that names it (the dock links to its `tab`).
         * `order` places it: `router.getRoutes()` returns the matchers by
         * path rank, not by declaration.
         */
        nav?: SectionNav;
    }
}

/** One dock entry: the route's `meta.nav`, linking to its section (`meta.tab`). */
export interface SectionLink {
    label: string;
    icon: Component;
    value: SectionTab;
}

/**
 * The dock's sections, from the route records (`routes` or `router.getRoutes()`),
 * in their declared order. An alias record (`/visualize` of the workspace
 * route) shares its original's meta and is not a second entry.
 */
export function sectionNav(records: readonly { meta?: RouteMeta; aliasOf?: unknown }[]): SectionLink[] {
    return records
        .filter((r) => !r.aliasOf)
        .flatMap((r) => (r.meta?.nav && r.meta.tab ? [{ ...r.meta.nav, value: r.meta.tab }] : []))
        .sort((a, b) => a.order - b.order)
        .map(({ label, icon, value }) => ({ label, icon, value }));
}

/**
 * X.F.W14U.misc — UIA-F-212: the remembered tab has ONE writer (`afterEach`,
 * from `meta.tab`) and one reader (the `/` redirect), both through the safe
 * accessor (UIA-F-120: with site data blocked, reading `localStorage` itself
 * throws; losing storage only means no remembered tab).
 */
export const SAVED_TAB_KEY = "fourier_active_tab";
const DEFAULT_TAB: SectionTab = "/paper";

function getSavedTab(): string {
    const saved = safeGetItem(safeStorage("local"), SAVED_TAB_KEY);
    const tabs = new Set(routes.map((r) => r.meta?.tab));
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

export const routes: RouteRecordRaw[] = [
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
            nav: { label: "Paper", icon: FileText, order: 0 },
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
            nav: { label: "Visualize", icon: Eye, order: 1 },
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
            nav: { label: "Gallery", icon: LayoutGrid, order: 2 },
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
            nav: { label: "Equation", icon: Sigma, order: 3 },
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
            nav: { label: "Morph", icon: Shuffle, order: 4 },
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
];
