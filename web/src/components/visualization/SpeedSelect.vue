<script setup lang="ts">
import { computed } from "vue";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@mkbabb/glass-ui/select";

const props = withDefaults(
    defineProps<{
        modelValue: number;
        compact?: boolean;
    }>(),
    { compact: false },
);

const emit = defineEmits<{
    (e: "update:modelValue", v: number): void;
}>();

const speedStr = computed({
    get: () => String(props.modelValue),
    set: (v: string) => emit("update:modelValue", parseFloat(v)),
});
</script>

<template>
    <Select v-model="speedStr">
        <SelectTrigger
            aria-label="Playback speed"
            :class="compact ? 'input-pill speed-trigger-compact' : 'speed-trigger'"
        >
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="0.25">0.25&times;</SelectItem>
            <SelectItem value="0.5">0.5&times;</SelectItem>
            <SelectItem value="1">1&times;</SelectItem>
            <SelectItem value="2">2&times;</SelectItem>
            <SelectItem value="4">4&times;</SelectItem>
        </SelectContent>
    </Select>
</template>

<style scoped>
/**
 * X.F.W4 · SP-9 ⊕ SP-10 ⊕ SP-13 — the 22-line hand-roll, re-authored against
 * what 8.0.0 actually ships. Read on the 8.0.0 arm per COHESION §0i.3.
 *
 * `SS-D-01 / SS-L-04` — the two fixed WIDTHS (3.5rem / 4rem) were smaller than
 * furniture + label in every band, so `0.25×` and `0.5×` lost 60%+ of their
 * glyphs, silently and mid-character: the base trigger spends ~24px on padding
 * and ~16px on the chevron, leaving 16px of a 56px box for a 42px label, and
 * `line-clamp-1` compiles to `-webkit-box` + `overflow:hidden`, whose ellipsis
 * fires only on a wrap that `white-space: nowrap` forbids. The widths are
 * DELETED rather than enlarged — a content-sized trigger cannot be too small
 * for its content, and the row's own note is that the `size` props that would
 * have carried a fix are gone at 8.0.0, so the deletion is the whole cure and
 * the only leg schedulable under either branch.
 *
 * `SS-D-02 / SS-L-02 / SS-C-5` — the two literal HEIGHTS opted this control out
 * of `max(calc(2.5rem · --ui-scale), --control-floor)`, which is precisely the
 * chain that raises every sibling control to the coarse-pointer touch floor:
 * 36px painted against a cohort at 67.5px below 640px, where the compact form
 * is the ONLY speed control on the surface. Deleted; the base governs.
 *
 * `SS-D-04 / SS-C-3` ⊕ `SS-D-05` — the hand-spelled `"Fira Code", monospace`
 * dropped `"Fira Code Fallback"`, the zero-payload metric-matched `local()`
 * face glass-ui puts on the critical path for exactly the swap window a fixed
 * clipping box suffers most. `var(--font-mono)` is the family-only cure the
 * record prescribes (NOT `text-mono-small`, K-3); this app does not restate
 * that token, so it resolves to the producer's own Fira Code stack, fallback
 * face included.
 *
 * `SS-D-06` — `@apply text-sm` froze the label at a constant, replacing the
 * `--control-text = calc(--type-small · --ui-scale)` comfort chain: on coarse
 * pointers every sibling label grew 1.5× and this one did not. Deleted, which
 * restores the trigger's own `text-dropdown` rung.
 *
 * `SS-D-03-demoted / SS-L-03` — `border: none; background: none` stripped the
 * two cheap `.control-surface` declarations and ORPHANED the two expensive
 * ones, leaving a live `blur(8px · --glass-level)` on a transparent element.
 * The reset is now explicit and names both longhands, which is the honest half
 * of the choice the row offers.
 *
 * `SS-D-10 / SS-C-14 + MISS-PILL` — the compact block was not a free-hand fork:
 * it is the producer's `.input-pill` register transcribed BY VALUE, with the
 * border alpha frozen at the producer's stale prose figure (~15%) rather than
 * the shipped token (19%). The transcription is replaced by the register
 * itself, applied in the template, so the drift cannot recur.
 */
.speed-trigger,
.speed-trigger-compact {
    flex-shrink: 0;
    font-family: var(--font-mono);
}

.speed-trigger {
    border: none;
    background: none;
    border-radius: 9999px;
    color: var(--muted-foreground);
    /* Both longhands, because the unprefixed one alone leaves WebKit filtering. */
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
}
</style>
