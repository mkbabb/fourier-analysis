<!-- SERVED MODEL: claude-opus-5-5 -->
<script setup lang="ts">
/**
 * X.F.W14V.au6 — F-W14U addendum (e): the one search field with a leading
 * glyph. The paper's inline search, the admin users toolbar and the gallery
 * bar each hand-rolled the same anatomy (a positioned glyph over glass
 * `Input`, the start padding that clears it, an actions run at the end), with
 * three glyph sizes, three insets and three paddings. They mount this instead.
 * (The ⌘K palette is glass `CommandInput`, which draws its own glyph.)
 *
 * It is consumer-owned until glass `Input` gains a leading-adornment slot
 * (O-74 §10, the glass half of UIA-F-106 / O-59); then this file becomes that
 * slot at its three hosts.
 *
 * - The field is glass `Input`. Every attribute and listener but `class`/
 *   `style` rides to it (`v-model`, `type`, `aria-*`, `role`, `@keydown`…);
 *   `class`/`style` place the field in its host.
 * - The glyph follows the field in tree order: the producer's field is its
 *   own stacking context (glass backdrop), so a positioned glyph before it is
 *   painted under it (X.F.W11 `.e`, UIA-F-106).
 * - The root is a `<label>`: the glyph and the gutters are hit area that
 *   focuses the field (`MISS-DU4`); a click on an action keeps its own
 *   behaviour (label activation is not forwarded from interactive content).
 * - The glyph's size, inset and the start padding are one anatomy per control
 *   size. A host with `#actions` reserves their run with `--search-field-end`;
 *   its own clear control is then the only one (UIA-F-184: the engine's
 *   `type=search` cancel glyph is withdrawn).
 * - The type register is the field's (glass `Input`); a host that keeps its
 *   own (the paper's 16 px iOS floor) sets it on `.search-field-input`.
 */
import { computed, ref, useAttrs, useSlots } from "vue";
import { Input } from "@mkbabb/glass-ui/input";
import { Search } from "@lucide/vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{ size?: "sm" | "md" }>(), { size: "md" });

const attrs = useAttrs();
const slots = useSlots();
const fieldAttrs = computed(() => {
    const { class: _class, style: _style, ...rest } = attrs;
    return rest;
});

const inputRef = ref<InstanceType<typeof Input> | null>(null);

function focus() {
    (inputRef.value?.$el as HTMLInputElement | undefined)?.focus();
}

defineExpose({ focus });
</script>

<template>
    <label
        class="search-field"
        :class="attrs.class"
        :style="attrs.style as never"
        :data-size="props.size"
        :data-actions="slots.actions ? '' : undefined"
    >
        <Input ref="inputRef" v-bind="fieldAttrs" :size="props.size" class="search-field-input" />
        <Search class="search-field-glyph" aria-hidden="true" />
        <span v-if="slots.actions" class="search-field-actions">
            <slot name="actions" />
        </span>
    </label>
</template>

<style scoped>
.search-field {
    --search-field-glyph: 1rem;
    --search-field-inset: 0.75rem;
    position: relative;
    display: flex;
    align-items: center;
    cursor: text;
}

.search-field[data-size="sm"] {
    --search-field-glyph: 0.875rem;
    --search-field-inset: 0.5rem;
}

.search-field-input {
    flex: 1;
    min-width: 0;
    padding-inline-start: calc(2 * var(--search-field-inset) + var(--search-field-glyph));
    padding-inline-end: var(--search-field-end, var(--search-field-inset));
}

.search-field-glyph {
    position: absolute;
    inset-inline-start: var(--search-field-inset);
    width: var(--search-field-glyph);
    height: var(--search-field-glyph);
    flex-shrink: 0;
    pointer-events: none;
    color: var(--muted-foreground);
}

.search-field-actions {
    position: absolute;
    inset-inline-end: 0.375rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.search-field[data-actions] .search-field-input::-webkit-search-cancel-button {
    appearance: none;
}
</style>
