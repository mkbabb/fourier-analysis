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
        // 854 kB (warned by Vite). A named vendor chunk is only ever for a
        // cluster EVERY route loads (it is cached apart from the app code):
        //   - vendor-vue:    Vue/Pinia/vue-router/vueuse — long-lived; cache-friendly.
        //   - vendor-math:   value.js colour maths (`lib/colors.ts`, run at boot).
        //   - vendor-keyframes: animation runtime.
        //   - <route>:       Vite's built-in route-level chunking handles the rest.
        //
        // X·OD19 ALL (owner, 2026-10-19: "All loading times for all apps needs
        // to be improved, every page") — a weld of a lazy dependency into an
        // eager chunk makes every route pay for it, so three welds are struck:
        //   - `katex` (258 kB) rode `vendor-math`, which boot needs, so every
        //     route parsed it; it now rides the chunk its consumers share
        //     (/paper, /equation, the visualizer's notation).
        //   - `vendor-ui` (glass-ui + reka-ui + lucide, 369 kB) put every
        //     component any route uses on the boot path (DataTable, Dialog,
        //     the paper's and the admin's controls); Rollup now places each
        //     where it is imported — the shell's own in the entry, a route's in
        //     its chunk, a shared set in a shared chunk.
        //   - `vendor-paper` named the packages' bare `"."` entries, which the
        //     app never imports (it imports `@mkbabb/latex-paper/vue`), so it
        //     built an EMPTY chunk that /paper fetched for nothing; the paper
        //     cluster rides PaperView's chunk, the one route that loads it.
        //
        // F.W1 — value.js 4.0.0 publishes NO `"."` export, so its cluster is
        // named by the subpaths this repo imports. A bare `@mkbabb/value.js` id
        // here resolves to nothing and would silently drop the split.
        rollupOptions: {
            output: {
                manualChunks: {
                    "vendor-vue": ["vue", "vue-router", "pinia", "@vueuse/core"],
                    // `./easing` is deliberately NOT named here (FR-AH-7): the
                    // persistent header reaches it through DarkModeToggle →
                    // useFourierMorph → lib/easings, so welding it to katex is
                    // what made a 348 kB math cluster eager. The easing curves
                    // ride the chunk of whoever imports them; so does katex
                    // (X·OD19 ALL, above).
                    "vendor-math": [
                        "@mkbabb/value.js/color",
                        "@mkbabb/value.js/css",
                    ],
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
