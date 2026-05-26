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
