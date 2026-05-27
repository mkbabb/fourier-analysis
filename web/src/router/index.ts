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
        },
        {
            path: "/w/:imageSlug?",
            name: "workspace",
            alias: ["/visualize"],
            component: () =>
                import("@/components/visualization/VisualizationView.vue"),
        },
        {
            path: "/gallery",
            name: "gallery",
            component: () =>
                import("@/components/visualization/GalleryView.vue"),
        },
        {
            path: "/equation",
            name: "equation",
            component: () => import("@/components/equation/EquationView.vue"),
        },
        {
            path: "/morph",
            name: "morph",
            component: () => import("@/components/morph/FourierMorphDemo.vue"),
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

router.afterEach((to: RouteLocationNormalized) => {
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
