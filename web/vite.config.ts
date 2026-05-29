import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import latexPaperPlugin from "@mkbabb/latex-paper/vite";

export default defineConfig({
    plugins: [
        latexPaperPlugin({
            texPath: "../paper/fourier_paper.tex",
            callouts: {
                applications: {
                    text: "Upload an image and watch epicycles trace its contour",
                    link: "/visualize",
                },
                "image-reconstruction-via-epicycles": {
                    text: "Try the epicycle reconstruction yourself",
                    link: "/visualize",
                },
            },
        }),
        vue(),
    ],
    base: process.env.VITE_BASE_URL || "/",
    resolve: {
        // Cross-repo dev-resolution contract-v2 (docs/precepts/cross-repo-dev-resolution.md §2.2):
        // the `development` condition is STRUCK; consumers resolve `dist/` via the
        // bare specifier through each sibling's `exports` map, dev and prod alike.
        // No `@mkbabb/*` `dist/`-path `resolve.alias` (forbidden by §2.4).
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    css: {
        postcss: {
            plugins: [(await import("@tailwindcss/postcss")).default],
        },
    },
    appType: "spa",
    build: {
        // E.W7 T-P1 — manualChunks bundle split. Pre-W7 the index chunk was
        // 854 kB (warned by Vite). Splitting by load-cadence:
        //   - vendor-vue:    Vue/Pinia/vue-router/vueuse — long-lived; cache-friendly.
        //   - vendor-ui:     glass-ui + reka-ui + lucide — frequent visual deps.
        //   - vendor-math:   value.js + katex (the colour-math + LaTeX cluster).
        //   - vendor-paper:  paper compile/render path; only loaded on /paper routes.
        //   - vendor-keyframes: animation runtime.
        //   - <route>:       Vite's built-in route-level chunking handles the rest.
        rollupOptions: {
            output: {
                manualChunks: {
                    "vendor-vue": ["vue", "vue-router", "pinia", "@vueuse/core"],
                    "vendor-ui": [
                        "@mkbabb/glass-ui",
                        "reka-ui",
                        "lucide-vue-next",
                    ],
                    "vendor-math": ["@mkbabb/value.js", "katex"],
                    "vendor-paper": ["@mkbabb/latex-paper", "@mkbabb/pencil-boil"],
                    "vendor-keyframes": ["@mkbabb/keyframes.js"],
                },
            },
        },
    },
    server: {
        port: 3000,
        // Under contract-v2 the sibling-`src/` `fs.allow` widening is STRUCK
        // (docs/precepts/cross-repo-dev-resolution.md §2.2). Consumers resolve
        // sibling `dist/` via the `file:` symlink inside node_modules — already
        // inside Vite's default allow-list.
        proxy: {
            "/api": {
                target: process.env.VITE_PROXY_API || "http://localhost:8000",
                changeOrigin: true,
            },
        },
    },
});
