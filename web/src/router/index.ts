import { createRouter, createWebHistory } from "vue-router";
import PaperView from "@/components/paper/PaperView.vue";
import VisualizationView from "@/components/visualization/VisualizationView.vue";
import FourierMorphDemo from "@/components/FourierMorphDemo.vue";
import FourierShapeExtractor from "@/components/FourierShapeExtractor.vue";

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            redirect: () => {
                const saved = localStorage.getItem("fourier_active_tab");
                if (saved === "/visualize" || saved === "/morph") return saved;
                return "/paper";
            },
        },
        { path: "/paper", name: "paper", component: PaperView },
        {
            path: "/visualize",
            name: "visualize",
            component: VisualizationView,
            beforeEnter: (_to, _from, next) => {
                const slug = localStorage.getItem("fourier_last_slug");
                slug ? next(`/s/${slug}`) : next();
            },
        },
        { path: "/s/:slug", name: "session", component: VisualizationView },
        { path: "/morph", name: "morph", component: FourierMorphDemo },
        { path: "/demo/fourier-morph", redirect: "/morph" },
        { path: "/demo/shape-extractor", name: "shape-extractor", component: FourierShapeExtractor },
    ],
});

router.afterEach((to) => {
    if (to.path === "/paper" || to.path === "/visualize" || to.path === "/morph") {
        localStorage.setItem("fourier_active_tab", to.path);
    } else if (to.path.startsWith("/s/")) {
        localStorage.setItem("fourier_active_tab", "/visualize");
        const slug = to.params.slug as string;
        if (slug) localStorage.setItem("fourier_last_slug", slug);
    }
});
