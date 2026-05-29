import { createRouter, createWebHistory, type RouteLocationNormalized } from "vue-router";

const SAVED_TAB_KEY = "fourier_active_tab";
const VALID_TABS = new Set(["/paper", "/visualize", "/morph", "/gallery", "/equation"]);

function getSavedTab(): string {
    const saved = localStorage.getItem(SAVED_TAB_KEY);
    return saved && VALID_TABS.has(saved) ? saved : "/paper";
}

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            redirect: () => getSavedTab(),
        },
        {
            path: "/paper",
            name: "paper",
            component: () => import("@/components/paper/PaperView.vue"),
            meta: {
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
                title: "Visualize — Fourier Analysis",
                description:
                    "Decompose any image's contour into a chain of rotating epicycles and watch the Fourier series redraw it stroke by stroke.",
            },
        },
        {
            path: "/gallery",
            name: "gallery",
            component: () =>
                import("@/components/visualization/GalleryView.vue"),
            meta: {
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
                title: "Morph — Fourier Analysis",
                description:
                    "Morph one shape into another through their shared Fourier harmonic basis — an interactive study of epicycle interpolation.",
            },
        },
        {
            path: "/demo/shape-extractor",
            name: "shape-extractor",
            component: () => import("@/components/morph/FourierShapeExtractor.vue"),
        },
        {
            path: "/s/:slug",
            redirect: (to) => `/w/${to.params.slug}`,
        },
    ],
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
}

router.afterEach((to: RouteLocationNormalized) => {
    applyRouteMeta(to);

    const tab = to.path;
    if (
        tab === "/paper" ||
        tab === "/visualize" ||
        tab === "/morph" ||
        tab === "/gallery" ||
        tab === "/equation"
    ) {
        localStorage.setItem("fourier_active_tab", tab);
    } else if (tab.startsWith("/w/")) {
        localStorage.setItem("fourier_active_tab", "/visualize");
    }
});

export default router;
