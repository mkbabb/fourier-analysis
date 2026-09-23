<script setup lang="ts">
import { Popover, PopoverTrigger, PopoverContent } from "@mkbabb/glass-ui/popover";
import SliderControl from "@/components/ui/SliderControl.vue";
import { GlassDock, DockControl, DockSeparator } from "@mkbabb/glass-ui/dock";
import { Tooltip } from "@/components/ui/tooltip";
import {
    Undo2,
    Redo2,
    Wand2,
    Sparkles,
    Minimize2,
    Trash2,
    ImageIcon,
    Eye,
    Spline,
    Magnet,
    RotateCcw,
    Save,
    Check,
} from "@lucide/vue";

const props = defineProps<{
    canUndo: boolean;
    canRedo: boolean;
    canDelete: boolean;
    pointCount: number;
    showImageOverlay: boolean;
    showGhost?: boolean;
    magnetRadius: number;
    isSaved: boolean;
}>();

const emit = defineEmits<{
    undo: [];
    redo: [];
    smooth: [];
    simplify: [];
    delete: [];
    toggleOverlay: [];
    toggleGhost: [];
    "update:magnetRadius": [value: number];
    reset: [];
    save: [];
}>();

</script>

<template>
    <GlassDock fit-content>
        <!--
          X.F.W4 · SP-5 — `fr-EditorControlsDock B-2` ⊕ `fr-CanvasControlsDock M-2`,
          THE INVERSION LOCK, cured on both faces in one edit.

          At 4.0.0 the two docks failed inversely: this one put a real focusable
          Save inside `#collapsed`, so keyboard entry expanded the dock, which
          stamped `inert` on the summary layer out from under the focused button
          and threw focus to the body (B-2); the sibling put only glyphs there,
          so a keyboard user could never open it at all (M-2). The sibling's
          booked cure — "focusable summary content" — would have MANUFACTURED
          B-2 there, which is why the two rows are one object.

          glass-ui 8.0.0 ships the producer half both relay letters asked for:
          the summary layer is itself the disclosure (`role="button"`,
          `tabindex="0"`, `aria-label="Expand dock"`, `aria-expanded`,
          `aria-controls`), its `focusin` is `.stop`-modified so focus into the
          summary no longer triggers the expand-flip, and its Enter/Space
          handler expands and then MOVES focus into the full layer. The
          destruction chain is gone at the producer.

          What that leaves is a consumer defect the producer's cure creates
          here and nowhere else: a `role="button"` host may not contain
          interactive content, and this file's `#collapsed` did. So the Save
          leaves the summary for `#persistent` — the never-inert region the
          producer renders OUTSIDE `.dock-layers`, present at both poles. The
          collapsed summary keeps a non-interactive identity glyph, the
          disclosure semantics stay valid, and S-4/M-9's design fact — the one
          action that persists work survives the auto-collapse — is not merely
          preserved but strengthened: Save is now reachable in EVERY state.
          The expanded row's duplicate Save and badge go with it (one action,
          one control).
        -->
        <template #persistent>
            <span class="dock-badge">{{ pointCount }} pts</span>
            <Tooltip text="Save contour">
                <DockControl
                    class="is-save"
                    :class="{ saved: isSaved }"
                    aria-label="Save contour"
                    @click.stop="emit('save')"
                >
                    <Check v-if="isSaved" />
                    <Save v-else />
                </DockControl>
            </Tooltip>
        </template>

        <!--
          Collapsed summary — identity mark only; NO interactive content.

          X.F.W4 · `fr-EditorControlsDock M-5` ⊕ `fr-CanvasControlsDock M-8 / C-9`
          — ONE GLYPH PER MEANING, across BOTH docks, because they swap in place
          over one canvas on the `isEditing` flip and a reader sees them as one
          surface. `Wand2` was this dock's identity mark AND its Smooth action,
          one gesture apart (Smooth is now `Sparkles`); `Eye` was the overlay
          MENU trigger here and the ghost-ON STATE glyph, so the trigger painted
          identically in all four overlay states, while the sibling spelt the
          same trace toggle `Spline` (both are `Spline` now, and the state rides
          `aria-pressed`/`data-active` where it belongs); and `import { Image }`
          shadowed the global (C-17) for a glyph lucide also exports as
          `ImageIcon`, which is what the sibling already imports.
        -->
        <template #collapsed>
            <Wand2 class="shrink-0 dock-summary-glyph" aria-hidden="true" />
        </template>

        <!--
          Expanded controls.

          X.F.W4 · SP-6 / `fr-EditorControlsDock D-18` — `gap-2` pinned the row
          at a fixed 0.5rem against the family's `--dock-layer-gap`
          (0.375rem × `--dock-scale`): 33% wide at 1×, and frozen on touch where
          the scale moves and the literal does not. The token governs now.

          ⊘ The row's banked cure was "discharged for free by INFO-3's
          `DockLayerGroup` adoption", and that premise has MOVED at 8.0.0 — see
          the separator note below. The defect is cured directly instead, which
          is what the row actually describes.
        -->
        <div class="dock-row flex items-center w-full">
            <Tooltip text="Undo">
                <DockControl aria-label="Undo" :disabled="!canUndo" @click="emit('undo')">
                    <Undo2 />
                </DockControl>
            </Tooltip>
            <Tooltip text="Redo">
                <DockControl aria-label="Redo" :disabled="!canRedo" @click="emit('redo')">
                    <Redo2 />
                </DockControl>
            </Tooltip>

            <DockSeparator />

            <Tooltip text="Smooth">
                <DockControl class="is-amber" aria-label="Smooth contour" @click="emit('smooth')">
                    <Sparkles />
                </DockControl>
            </Tooltip>
            <Tooltip text="Simplify">
                <DockControl class="is-sky" aria-label="Simplify contour" @click="emit('simplify')">
                    <Minimize2 />
                </DockControl>
            </Tooltip>
            <Tooltip text="Delete point">
                <DockControl class="is-rose" aria-label="Delete point" :disabled="!canDelete" @click="emit('delete')">
                    <Trash2 />
                </DockControl>
            </Tooltip>

            <!-- Magnet popover with slider -->
            <Popover trigger="click" keep-dock-open>
                <PopoverTrigger as-child>
                    <DockControl aria-label="Magnet options">
                        <Magnet :class="magnetRadius > 0 ? 'text-viz-fourier' : ''" />
                    </DockControl>
                </PopoverTrigger>
                <PopoverContent side="top" align="center">
                    <div class="magnet-popover-content">
                        <!-- X.F.W14.h · OA-45 — the magnet radius is the app's one
                             control-row idiom (label + value field on one line,
                             the slider beneath); the read-only `Metric` beside a
                             thumbless bar retires with it. -->
                        <SliderControl
                            label="Magnet"
                            :model-value="magnetRadius"
                            :min="0"
                            :max="10"
                            :step="1"
                            color="var(--viz-fourier)"
                            aria-label="Magnet radius"
                            @update:model-value="emit('update:magnetRadius', $event)"
                            @mousedown.stop
                            @pointerdown.stop
                        />
                    </div>
                </PopoverContent>
            </Popover>

            <DockSeparator />

            <!-- Overlay stack (ghost + image) -->
            <Popover trigger="click" keep-dock-open>
                <PopoverTrigger as-child>
                    <DockControl aria-label="Overlay options">
                        <Eye />
                    </DockControl>
                </PopoverTrigger>
                <PopoverContent side="top" align="center">
                    <div class="flex flex-col gap-1 p-1">
                        <Tooltip text="Contour trace">
                            <DockControl aria-label="Contour trace" :active="showGhost" @click="emit('toggleGhost')">
                                <Spline />
                            </DockControl>
                        </Tooltip>
                        <Tooltip text="Image overlay">
                            <DockControl aria-label="Image overlay" :active="showImageOverlay" @click="emit('toggleOverlay')">
                                <ImageIcon />
                            </DockControl>
                        </Tooltip>
                    </div>
                </PopoverContent>
            </Popover>

            <Tooltip text="Reset to extraction">
                <DockControl aria-label="Reset to extraction" @click="emit('reset')">
                    <RotateCcw />
                </DockControl>
            </Tooltip>

            <span class="dock-spacer" />
        </div>
    </GlassDock>
</template>

<style scoped>
@reference "tailwindcss";

/**
 * X.F.W4 · SP-6 / `fr-EditorControlsDock D-9 · L-8` (+D-26; and `INFO-3`,
 * answered rather than obeyed) — the scoped `.dock-separator` and `.dock-spacer`
 * rules are DELETED and `<DockSeparator>` is adopted.
 *
 * Both classes are shipped by the producer in `@layer components`, and scoped
 * styles are UNLAYERED, so these two rules beat them unconditionally: the
 * hairline lost the library's `0 0.375rem` margin, re-based its tint off a
 * local `color-mix` instead of `--dock-hairline` (and off its dark-arm
 * re-base), and forfeited `role="separator"` + `data-orientation` entirely. The
 * drift was visible on one stage: the sibling dock's copy carried
 * `margin: 0 0.125rem` — two docks, one canvas, two hairline rhythms. Both
 * copies are gone.
 *
 * ⊘ `INFO-3`'s further ask — "the separator cure should take the whole family",
 * adopting `DockLayerGroup`/`DockLayer` to discharge `D-18` and `D-26` in the
 * same edit — is NOT executed, and the reason is a measured change in the
 * producer, not a decision to do less. At 4.0.0 `DockLayerGroup` was a grouping
 * primitive carrying a gap token. At 8.0.0 it is a multi-FACE switcher: it
 * composes `<DockCrossfade>`, registers `<DockLayer>` descriptors, and renders a
 * `role="tablist"` of `role="tab"` buttons with roving focus. This dock has ONE
 * face. Adopting it would mint a tablist over a single tab to obtain a gap —
 * the kind of adoption-for-its-own-sake this program treats as a defect. The
 * gap is taken from `--dock-layer-gap` directly, which is the same number from
 * the same authority. Recorded as a dated addendum-beside (E-3).
 */

/* X.F.W4 · SP-5 (B-2) + `fr-CanvasControlsDock M-7`'s token leg — the collapsed
   identity glyph reads the dock's own glyph rung and the substrate's muted-glyph
   dial instead of a literal size and an ad-hoc `/50` alpha, so it tracks the
   `--dock-scale` ladder (including the coarse-pointer re-declaration) the way
   every other glyph in the dock does. */
.dock-summary-glyph {
    width: var(--dock-icon-glyph);
    height: var(--dock-icon-glyph);
    color: color-mix(
        in srgb,
        var(--foreground) calc(var(--opacity-icon-muted) * 100%),
        transparent
    );
}

.dock-row {
    gap: var(--dock-layer-gap);
}

.dock-badge {
    @apply text-base;
    color: color-mix(in srgb, var(--foreground) 50%, transparent);
    font-variant-numeric: tabular-nums;
    padding: 0 0.375rem;
    white-space: nowrap;
}

/* ── Accent variants for DockControl (hover tint + state) ── */
.is-amber { --btn-hover-color: var(--viz-amber); }
.is-sky { --btn-hover-color: var(--viz-chebyshev); }
.is-rose { --btn-hover-color: var(--accent-pink); }

.is-save {
    background: color-mix(in srgb, var(--foreground) 6%, transparent);
    --btn-hover-color: var(--viz-fourier);
}
.is-save:hover:not(:disabled) {
    background: color-mix(in srgb, var(--viz-fourier) 15%, transparent);
}
/* X.F.W4 · `fr-EditorControlsDock M-7` — one control, two hover registers,
   keyed by a boolean the CSS ignored. This unlayered `color` beat the layered
   hover unconditionally, so in the saved state the plate retinted toward
   `--viz-fourier` on hover while the glyph stayed `--success` green: a
   half-hover no one authored, on the control users hover to confirm. The
   saved state now owns BOTH registers. */
.is-save.saved {
    color: var(--success);
    --btn-hover-color: var(--success);
}
.is-save.saved:hover:not(:disabled) {
    background: color-mix(in srgb, var(--success) 15%, transparent);
}

/* X.F.W14.h — the popover holds one control row; the measure fits the label
   beside the field, the inset is on the spacing scale. */
.magnet-popover-content {
    width: 12rem;
    padding: var(--space-atom) var(--space-body);
}

/**
 * X.F.W4 · §3 D8 — RULED **DELETE WHOLE**, and the block is gone as ONE unit:
 * this rule, the `magnet-slider-track` class, the `:style` `--track-color`
 * binding, the `VIZ_COLORS` import edge and both stale `glass-scrubber`
 * comments. Half-landing it was forbidden in terms, and for a reason — a class
 * with no rule, or a binding with no consumer, is dead code wearing a cure's
 * clothes.
 *
 * The premise re-measured at the LIVE pin, because the record states it at
 * 4.0.0 and F.W1 moved this tree to 8.0.0: the retint namespace the deleted
 * block wrote returns ∅ from the producer's `dist` at EITHER pin, so all four
 * declarations were dead at both, and two were doubly dead (the scrubber thumb
 * paints `width: 0; opacity: 0` by contract — C-13).
 *
 * ⊘ X.F.W3 `.a` · `B-2` / `MPC-3` — the namespace is spelled out nowhere in
 * this tree any more, including in prose: the family's retirement gate counts
 * OCCURRENCES, and a receipt that quotes the retired spelling keeps it alive in
 * the one place a reader is most likely to copy it from. The deletion this
 * docblock records is unchanged; only its quotation of the dead token is.
 *
 * ⊘ The ONE sub-limb the ruling refused to inherit, re-earned here as it
 * required: K-8's "even `width: 100%` is a no-op" was verified against the
 * 4.0.0 cva base, and that probe does NOT reproduce at 8.0.0 (⟨cmd⟩ `grep -c
 * 'w-full' dist/slider-*.js` → 0). Re-measured at the byte that governs today,
 * double-run: the producer's own `components/slider/styles.css` declares
 * `.glass-slider { … inline-size: 100% … }` on the slider root. The width was
 * therefore redundant at 8.0.0 too, by a different mechanism — so the
 * zero-visual-delta claim holds, on evidence taken at this pin rather than
 * inherited from the last one.
 */
</style>
