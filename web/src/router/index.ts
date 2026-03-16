import { createRouter, createWebHistory, type RouteLocationNormalized } from "vue-router";

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            redirect: () => {
                const saved = localStorage.getItem("fourier_active_tab");
                if (saved === "/visualize" || saved === "/morph" || saved === "/gallery" || saved === "/equation")
                    return saved;
                return "/paper";
            },
        },
        {
            path: "/paper",
            name: "paper",
            component: () => import("@/components/paper/PaperView.vue"),
        },
        {
            path: "/w/:imageSlug?/:snapshotHash?",
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
            component: () => import("@/components/FourierMorphDemo.vue"),
        },
        {
            path: "/demo/shape-extractor",
            name: "shape-extractor",
            component: () => import("@/components/FourierShapeExtractor.vue"),
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
