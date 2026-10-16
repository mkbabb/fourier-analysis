<template>
    <!--
        X.F.W4 · SP-7 — FM-1 (= FMD-2), the leaf half.

        This 41-line leaf is mounted inside TWO controls whose only visible
        content it is, and it offered no way to name itself — which is why the
        `/morph` route's primary control shipped an EMPTY accessible name
        (WCAG 2.2 §4.1.2 Level A, nav-visible, never axe-scanned).

        The contract is: **decorative by DEFAULT, nameable on request.** A host
        that carries its own name (the dark-mode toggle, the morph button) mounts
        this leaf without `title` and it is `aria-hidden` — one name per control,
        which is also DMT N-4's cure. A host that has no other content passes
        `title` and the leaf becomes a named `role="img"`. There is no third
        state where a bare graphic sits unannounced in the tree.
    -->
    <svg
        :viewBox="viewBox"
        xmlns="http://www.w3.org/2000/svg"
        class="fourier-morph-svg"
        :style="{ color: strokeColor }"
        :role="title ? 'img' : undefined"
        :aria-label="title || undefined"
        :aria-hidden="title ? undefined : 'true'"
    >
        <path
            :d="path"
            fill="none"
            stroke="currentColor"
            :stroke-width="strokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </svg>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        /** Pre-computed SVG path `d` string (from useFourierMorph). */
        path: string;
        viewBox?: string;
        strokeColor?: string;
        strokeWidth?: number;
        /**
         * The accessible name, when this leaf IS the control's only content.
         * Omitted — the default — the graphic is `aria-hidden` and the host
         * owns the name.
         */
        title?: string;
    }>(),
    {
        viewBox: "0 0 200 200",
        strokeColor: "var(--accent-red)",
        strokeWidth: 3,
    },
);
</script>

<style scoped>
.fourier-morph-svg {
    display: block;
    overflow: visible;
}
</style>
