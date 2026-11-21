<script setup lang="ts">
import type { EditorState } from "./lib/editor-state";
import { useMediaQuery } from "@vueuse/core";
import SliderControl from "@/components/ui/SliderControl.vue";
import { GlassDock, DockControl, DockSeparator } from "@mkbabb/glass-ui/dock";
import { DockTrigger } from "@mkbabb/glass-ui/dock-trigger";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@mkbabb/glass-ui/menu";
import { Metric } from "@mkbabb/glass-ui/metric";
import { Button } from "@mkbabb/glass-ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import {
    Undo2,
    Redo2,
    Ellipsis,
    Sparkles,
    Minimize2,
    Trash2,
    RotateCcw,
    Save,
    Check,
    Magnet,
    ImageIcon,
    CircleDashed,
    Pencil,
    ScanSearch,
    Maximize2,
    Shrink,
} from "@lucide/vue";

/** One Magnet step carries this much more of the curve, each side of the point. */
const REACH_STEP_PX = 16;

/*
 * X.F.W14V.u4 — UIA-F-172 (the non-colour limb; the Fourier hue on the glyph
 * stays, §0da): the magnet's on/off state reads in text, not by hue alone. At
 * 0 the magnet is off and its field says so; on, it shows its reach along the
 * curve, in pixels on screen.
 */
const magnetReadout = (radius: number) => (radius === 0 ? "Off" : `${radius * REACH_STEP_PX} px`);
/* The slider's keys stay with the slider (the menu would read its arrows as
   item navigation), except Escape and Tab, which leave the menu. With the
   slider the row's one control (canon F2), a blanket stop kept a keyboard user
   inside the open menu. */
function keepSliderKeys(e: KeyboardEvent) {
    if (e.key !== "Escape" && e.key !== "Tab") e.stopPropagation();
}

defineProps<EditorState & {
    magnetRadius: number;
    isSaved: boolean;
    /** The two layers the editor shows (FORTY-FIRST H: with the stage's other
     *  dock gone, the editor carries them; one press each from a desk). */
    picture: boolean;
    outline: boolean;
    /** The editor's view is zoomed or panned off the fit. */
    viewMoved: boolean;
    isFullscreen: boolean;
}>();

const emit = defineEmits<{
    undo: [];
    redo: [];
    smooth: [];
    simplify: [];
    delete: [];
    "update:magnetRadius": [value: number];
    reset: [];
    save: [];
    toggleLayer: [layer: "picture" | "outline"];
    /** Leave the editor (the host asks first when there are unsaved edits). */
    done: [];
    resetView: [];
    toggleFullscreen: [];
}>();

/*
 * The editor's seats, in the stage's one dock (FORTY-FIRST L). Nothing folds:
 * an edit is made of Undo, Delete and Save, and each is one press at every
 * width. From `sm` (Tailwind's 40rem) the two layers stand in the row as
 * toggles; below it they are rows of the tools menu, so the row holds at 390.
 */
const isSm = useMediaQuery("(min-width: 640px)");
</script>

<template>
    <GlassDock :collapse="false" fit-content aria-label="Editor tools">
        <div class="dock-row flex items-center">
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
            <Tooltip text="Delete point">
                <DockControl class="is-rose" aria-label="Delete point" :disabled="!canDelete" @click="emit('delete')">
                    <Trash2 />
                </DockControl>
            </Tooltip>

            <DropdownMenu :modal="false">
                <DockTrigger for="dropdown" aria-label="More editor tools">
                    <!-- X.F.W14V.u4 — UIA-F-146: no Tooltip around the glyph; the
                         trigger's own aria-label names the control. -->
                    <Ellipsis />
                </DockTrigger>
                <DropdownMenuContent :side-offset="8" align="center">
                    <!-- The magnet is the menu's one setting section (the app's
                         control-row idiom); X.F.W14.h · OA-45. -->
                    <div class="magnet-section">
                        <Magnet class="magnet-glyph" :class="{ 'is-on': magnetRadius > 0 }" aria-hidden="true" />
                        <SliderControl
                            class="magnet-row"
                            label="Magnet"
                            :model-value="magnetRadius"
                            :min="0"
                            :max="10"
                            :step="1"
                            color="var(--viz-amber)"
                            aria-label="Magnet radius"
                            :format-value="magnetReadout"
                            @update:model-value="emit('update:magnetRadius', $event)"
                            @keydown="keepSliderKeys"
                        />
                    </div>
                    <DropdownMenuSeparator />
                    <!-- O16 [53] [54]: the commands are buttons (glass Button
                         merged onto the menu item, so the menu's roving focus and
                         `select` stay), on the menu's one inset and glyph column. -->
                    <div class="tool-commands">
                        <Button as-child emphasis="quiet" size="sm">
                            <DropdownMenuItem class="tool-row is-amber" @select="emit('smooth')">
                                <Sparkles class="tool-glyph" />
                                Smooth contour
                            </DropdownMenuItem>
                        </Button>
                        <!-- The point count belongs to the one tool that changes
                             it, so it is set into that row (nothing in the dock
                             is a readout). -->
                        <Button as-child emphasis="quiet" size="sm">
                            <DropdownMenuItem class="tool-row is-sky" @select="emit('simplify')">
                                <Minimize2 class="tool-glyph" />
                                Simplify contour
                                <Metric :value="pointCount" unit="pts" size="sm" class="tool-count" />
                            </DropdownMenuItem>
                        </Button>
                        <Button as-child emphasis="quiet" size="sm">
                            <DropdownMenuItem class="tool-row is-neutral" @select="emit('reset')">
                                <RotateCcw class="tool-glyph" />
                                Reset to extraction
                            </DropdownMenuItem>
                        </Button>
                        <Button as-child emphasis="quiet" size="sm">
                            <DropdownMenuItem class="tool-row is-neutral" :disabled="!viewMoved" @select="emit('resetView')">
                                <ScanSearch class="tool-glyph" />
                                Reset view
                            </DropdownMenuItem>
                        </Button>
                        <!-- While editing, Fullscreen's home is here. (Minimize2 is
                             Simplify's glyph in this menu: one glyph per meaning.) -->
                        <Button as-child emphasis="quiet" size="sm">
                            <DropdownMenuItem class="tool-row is-neutral" @select="emit('toggleFullscreen')">
                                <Shrink v-if="isFullscreen" class="tool-glyph" />
                                <Maximize2 v-else class="tool-glyph" />
                                {{ isFullscreen ? "Exit fullscreen" : "Fullscreen" }}
                            </DropdownMenuItem>
                        </Button>
                    </div>
                    <!-- Below sm the two layers are the menu's last rows. -->
                    <template v-if="!isSm">
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem :model-value="picture" @select.prevent @update:model-value="emit('toggleLayer', 'picture')">
                            <ImageIcon class="h-4 w-4" />
                            Picture
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem :model-value="outline" @select.prevent @update:model-value="emit('toggleLayer', 'outline')">
                            <CircleDashed class="h-4 w-4" />
                            Outline
                        </DropdownMenuCheckboxItem>
                    </template>
                </DropdownMenuContent>
            </DropdownMenu>

            <template v-if="isSm">
                <DockSeparator />
                <Tooltip text="Picture">
                    <DockControl aria-label="Picture" :active="picture" @click="emit('toggleLayer', 'picture')">
                        <ImageIcon />
                    </DockControl>
                </Tooltip>
                <Tooltip text="Outline">
                    <DockControl aria-label="Outline" :active="outline" @click="emit('toggleLayer', 'outline')">
                        <CircleDashed />
                    </DockControl>
                </Tooltip>
            </template>

            <DockSeparator />

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
            <!-- The door out is the door in: the stage's Edit seat, lit. -->
            <Tooltip text="Done">
                <DockControl aria-label="Edit contour" :active="true" @click.stop="emit('done')">
                    <Pencil />
                </DockControl>
            </Tooltip>
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

.dock-row {
    gap: var(--dock-layer-gap);
}

/* The count rides the end of its row, on the row's own line. */
.tool-count {
    margin-inline-start: auto;
    padding-inline-start: 1rem;
    white-space: nowrap;
}

/* X.F.W14U.c2 — COHESION §0db (addendum (g)'s "and the like"): the tools'
   hues return from the one palette, through glass's published hover tokens —
   DockControl's `--btn-hover-color` (the glyph ink on hover) and the menu row's
   `--menu-row-bg` — never a restyle of glass's rules. Smooth amber, Simplify
   the Chebyshev sky, Delete the accent pink, Save the Fourier red. A tint is
   the bare hue; an INK is the hue carried a quarter toward `--foreground` in
   OKLab (the basis chip's recipe, X.F.W14.g OA-43): the bare amber, pink and
   red measured 2.5–2.84:1 on the light dock and menu plates, the carried inks
   clear 3:1 in both arms (the c2 record). */
.is-amber { --tool-hue: var(--viz-amber); }
.is-sky { --tool-hue: var(--viz-chebyshev); }
.is-rose { --tool-hue: var(--accent-pink); }
.is-save { --tool-hue: var(--viz-fourier); }
.is-amber, .is-sky, .is-rose, .is-save {
    --tool-ink: color-mix(in oklab, var(--tool-hue) 75%, var(--foreground));
}
.is-rose, .is-save {
    --btn-hover-color: var(--tool-ink);
}
.tool-row {
    --menu-row-bg: color-mix(in srgb, var(--tool-hue) 15%, transparent);
}

.is-save {
    background: color-mix(in srgb, var(--foreground) 6%, transparent);
}
.is-save:hover:not(:disabled) {
    background: color-mix(in srgb, var(--tool-hue) 15%, transparent);
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

/* O16 [53] [54] — one inset and one glyph column for the whole menu: every
   row starts on the menu row's own inset (0.5rem, glass's `.menu__item`), with
   a 1rem glyph and glass's `--icon-label-gap` after it, so the Magnet section,
   the three command buttons and (below sm) View options and Delete share one
   left edge at every pointer. The Magnet glyph is centred on its label's line
   (SliderControl's line is the sm control height), its readout sits right on
   that line, and the track starts on the labels' edge. */
.magnet-section {
    width: 13.5rem;
    display: grid;
    grid-template-columns: 1rem minmax(0, 1fr);
    column-gap: var(--icon-label-gap);
    align-items: start;
    padding-block: var(--space-atom);
    padding-inline: 0.5rem;
}
.magnet-row {
    min-width: 0;
}
/* X.F.W14U.c2 — the Magnet glyph wears the Fourier red while the magnet is
   on, the muted glyph ink while it is off; the ink tweens between them. */
.magnet-glyph {
    width: 1rem;
    height: 1rem;
    margin-block: calc((var(--control-h-sm) - 1rem) / 2);
    color: var(--muted-foreground);
    transition: color var(--duration-fast) var(--ease-standard);
}
.magnet-glyph.is-on {
    color: color-mix(in oklab, var(--viz-fourier) 75%, var(--foreground));
}

.tool-commands {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-block: var(--space-residue);
}
/* The commands are glass Buttons (their capsule plate, press and hover); the
   row reads left to right on the menu's inset like every row around it. Each
   glyph carries its tool's ink at rest (affordance by colour) and the plate
   takes the tool's tint. */
.tool-row {
    justify-content: flex-start;
    padding-inline: 0.5rem;
    gap: var(--icon-label-gap);
    --button-tone: var(--tool-ink);
}
/* A row under the pointer or the keyboard takes its tool's tint, the menu row's
   `--menu-row-bg`, as every menu row does; the Button's own quiet plate is
   the tone at the hover fill, too faint for a hue to read. */
.tool-row[data-highlighted]:not([data-disabled]) {
    background: var(--menu-row-bg);
}
.tool-glyph {
    width: 1rem;
    height: 1rem;
    color: var(--tool-ink);
}
.is-neutral {
    --tool-hue: var(--foreground);
    --tool-ink: var(--foreground);
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
