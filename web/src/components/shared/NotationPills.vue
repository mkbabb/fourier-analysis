<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from "@mkbabb/glass-ui/toggle-group";
import { NOTATION_OPTIONS } from "@/lib/equation/notation";
import { renderLatex } from "@/lib/equation/render";
import type { NotationMode } from "@/lib/equation/types";

/**
 * X.F.W14U.eq — UIA-F-204 (and the ToggleGroup limb UIA-F-85 names for the
 * same file): the notation is a one-of-three choice, so it is glass's
 * `ToggleGroup type="single"` (a radiogroup whose items are radios), the
 * chooser its neighbours use (`BasisSelector`'s Fourier mode), not three ad-hoc
 * Buttons carrying `aria-pressed`. Each item keeps its notation's hue on its
 * pressed state (addendum (g): an identity colour is not a defect).
 *
 * X.F.W14V `.u2` — UIA-F-85 / F-241: the hues are the palette's tokens (see
 * `NOTATION_OPTIONS`), and each glyph is KaTeX, typeset on the math baseline
 * like the series it names (the Unicode `eⁱ` sat at its own).
 */
const glyphs = NOTATION_OPTIONS.map((o) => renderLatex(o.glyph, { displayMode: false }));
const model = defineModel<NotationMode>({ required: true });

function onChoose(v: unknown) {
    // A single ToggleGroup emits `undefined` when the pressed item is pressed
    // again; a notation is always chosen, so that is not a change.
    if (typeof v === "string") model.value = v as NotationMode;
}
</script>

<template>
    <ToggleGroup type="single" size="sm" aria-label="Notation" class="notation-group"
        :model-value="model" @update:model-value="onChoose">
        <ToggleGroupItem v-for="(opt, i) in NOTATION_OPTIONS" :key="opt.value" :value="opt.value"
            class="notation-item" :style="{ '--pill-color': opt.color }">
            <span class="notation-glyph" aria-hidden="true" v-html="glyphs[i]" />
            {{ opt.label }}
        </ToggleGroupItem>
    </ToggleGroup>
</template>

<style scoped>
.notation-group {
    flex-wrap: wrap;
}
.notation-glyph {
    line-height: 1;
}
/* The pressed item's per-instance tint through glass's own `data-state`, the
   recipe of `BasisSelector`'s `.basis-chip`: the hue carried a quarter toward
   `--foreground` for the ink. */
.notation-item[data-state="on"] {
    background-color: color-mix(in srgb, var(--pill-color) 12%, transparent);
    color: color-mix(in oklab, var(--pill-color) 75%, var(--foreground));
}
</style>
