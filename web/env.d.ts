/// <reference types="vite/client" />

declare module "*.vue" {
    import type { DefineComponent } from "vue";
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_BASE_URL: string;
}

/**
 * PP-REDGATE (F.W1 limb 8) — `@mkbabb/latex-paper/theme` is a CSS-only export
 * (`"./theme": "./src/vue/theme.css"`), so it carries no types. Under the
 * toolchain's `noUncheckedSideEffectImports` a bare side-effect import of it is
 * TS2882 ("only a side-effect import … cannot be resolved"). The cure is the
 * ambient module declaration the flag asks for, beside the `*.vue` shim above —
 * not a suppression comment and not a flag rollback. A types fix on the
 * producer's side retires this block; that ask rides the LATEX-RELAY (NWO-5).
 */
declare module "@mkbabb/latex-paper/theme";
