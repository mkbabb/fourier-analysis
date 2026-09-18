import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

/**
 * X·F F.W4 `.g` — the ESLint leg of `G-F4-NO-UNUSED`.
 *
 * THE GATE, EXACTLY: *"`noUnusedLocals` on the shared tsconfig; ESLint
 * `vue/require-v-for-key` + `no-duplicate-imports` over `web/src`; wired into
 * CI"*. The tsconfig leg is ALREADY GREEN — `noUnusedLocals` and
 * `noUnusedParameters` landed at F.W0 `b3b736c`, so the gate's born-RED witness
 * (*"tsconfig has 13 compilerOptions keys, no `noUnusedLocals`"*) is superseded
 * and this seat claims NO credit for it (recorded as `greenBeforeCure` #1 in
 * the wave's execution record). What lands here is the ESLint half and its CI
 * wiring — the enabling condition for `FR-AH-19`/`-37`, `FR-GFC-22` and
 * `EP-MISSED-F`.
 *
 * WHY EXACTLY TWO RULES AND NOT A RECOMMENDED SET
 * -----------------------------------------------
 * `eslint-plugin-vue`'s `flat/recommended` would import hundreds of rules whose
 * cures land in `web/src/**` — files this unit may not write, and whose owners
 * (`.a`–`.f`) have their own §2 rows. Turning them on here would either flood
 * CI with findings nobody is dispatched to cure, or invite the allowlist the
 * wave forbids. The gate names two rules; this config errors on exactly those
 * two and asserts nothing else. Widening the set is `F.W9`/`W10`'s act
 * (§6b: *"the lint script as a CI gate"* is the W9/W10 half), taken together
 * with `oxlint --deny-warnings`.
 *
 * ⊘ NO `eslint-disable`, NO `ignores` carve-out inside `src/`, NO
 * `--max-warnings` slack: both rules are `error`, the run is blocking, and any
 * finding is a real defect routed to its owning unit — never suppressed here.
 *
 * ⊘ `no-duplicate-imports` IS TAKEN BARE, AND THE DECLINE IS RECORDED SO A
 * LATER SEAT RE-OPENS IT AS A DECISION RATHER THAN DISCOVERING IT. ESLint ≥ 9.24
 * offers `allowSeparateTypeImports: true`, which exempts an `import type` and an
 * `import` of the same specifier. Measured over this tree at the settled bytes:
 * the bare rule finds **10**; with the option, **1**
 * (`BasisCanvas.vue:31` — two `import type` statements from `./lib/canvas-drawing`,
 * which is `EP-MISSED-F`'s own same-kind shape). The option is **DECLINED**: the
 * gate names the rule with no qualifier, and an option that suppresses nine
 * findings is the seat narrowing its own gate. The nine are the
 * type/value-split shape, each a one-line merge, and they are routed by path in
 * the wave's execution record — not hidden behind a config key.
 *
 * ⊘ `oxlint` (F.W0's `FR-IC-25` floor) is NOT replaced. It is zero-config and
 * correctness-scoped; it ships neither `vue/require-v-for-key` (no Vue template
 * AST) nor a duplicate-import rule this gate can name. The two floors are
 * complementary and both run in `web-build`.
 */
export default [
    {
        // Bounded to the gate's stated surface: `web/src`. `e2e/`, `scripts/`
        // and the config files are `oxlint`'s and `vue-tsc`'s (G-8 widened the
        // type scope to reach them); this gate says `over web/src` and means it.
        files: ["src/**/*.{js,ts,vue}"],
    },
    {
        files: ["src/**/*.{js,ts}"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: "module",
        },
        rules: {
            // ESLint core. Catches `EP-MISSED-F`'s class: the same module
            // imported twice, which `noUnusedLocals` cannot see because both
            // bindings are used.
            "no-duplicate-imports": "error",
        },
    },
    {
        files: ["src/**/*.vue"],
        plugins: { vue: pluginVue },
        languageOptions: {
            parser: vueParser,
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                // `<script setup lang="ts">` is the repo's universal idiom; the
                // template AST comes from `vue-eslint-parser`, the script body
                // from the TS parser it delegates to.
                parser: tsParser,
                extraFileExtensions: [".vue"],
            },
        },
        rules: {
            // The keyed-loop rule. `BS-1` is the reason it is named: this repo's
            // loop mass is NATIVE-element `v-for`, which a component-callsite
            // census cannot see — an unkeyed one is a correctness defect
            // (patch-in-place reuse) that no other gate in `web/` detects.
            "vue/require-v-for-key": "error",
            "no-duplicate-imports": "error",
        },
    },
];
