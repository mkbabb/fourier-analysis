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
        // Cross-repo dev-resolution contract (glass-ui Q invariant 30,
        // docs/precepts/cross-repo-dev-resolution.md §2.2): declare the
        // `development` condition explicitly so workspace-linked `@mkbabb/*`
        // siblings resolve their live `src/` rather than relying on Vite's
        // serve-mode auto-injection. No `@mkbabb/*` `dist/`-path `resolve.alias`
        // exists (and none may be added) — bare specifiers resolve through each
        // sibling's `exports` map via the `file:` symlink in node_modules.
        conditions: ["development", "module", "browser", "default"],
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
        // Widen fs.allow to the workspace root so the `development` condition's
        // sibling `src/`-relative assets (CSS, fonts, WASM) are served over the
        // `/@fs/` channel — closes the cross-repo 403 class (contract §2.2.3).
        // The web demo lives at `<workspace>/fourier-analysis/web`; `../../..`
        // reaches `<workspace>`, where the `@mkbabb/glass-ui` + `keyframes.js`
        // siblings are symlinked from.
        fs: {
            allow: ["../../.."],
        },
        proxy: {
            "/api": {
                target: process.env.VITE_PROXY_API || "http://localhost:8000",
                changeOrigin: true,
            },
        },
    },
});
