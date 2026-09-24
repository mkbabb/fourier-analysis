<!-- SERVED MODEL: claude-opus-5[1m] -->
<script setup lang="ts">
/**
 * X.F.W3 `.d` — `fr-AdminUserList FR-AUL-27 / FR-AUL-18 / FR-AUL-51 / FR-AUL-52`
 * (⊕ `FR-AFP-38`, `FR-AFP-39`), the ONE shared batch toolbar F-W3 §5a split (5)
 * declares. "The batch toolbar authored twice divergent on six positioning
 * decisions (one pushes the just-clicked row out from under the pointer)" —
 * "one shared local toolbar", "one repair unit, not a second pass over the
 * file".
 *
 * ▲ DRIFT RECORDED AT THE TRUE BYTES. Split (5) named the two authorings as
 * `AdminUserList.vue` (`.e`) and `AdminFlaggedPanel.vue` (`.d`), a derivation
 * from §5's Files lines rather than a measurement of the tree. At the bytes
 * `AdminFlaggedPanel.vue` has NO selection set and NO toolbar at all; the
 * second authoring is `GalleryView.vue` — which `AdminUserList.vue:114` names
 * itself ("the sibling gallery toolbar (`GalleryView.vue`)") — and which is
 * ALSO `.d`'s file. The declaration's INTENT is therefore honoured exactly as
 * written: the toolbar is authored ONCE, in `.d`, in this extracted module, and
 * `.e` re-points `AdminUserList.vue`'s call site after this commit. The order
 * does not invert; only the identity of `.d`'s own call site moved.
 *
 * THE SIX DECISIONS, SETTLED ONCE:
 *
 *  1. ROLE — `group`, not `toolbar`. `FR-AUL-33`: `role="toolbar"` asserted with
 *     zero roving `tabindex` and zero `keydown` is an announced affordance
 *     contradicting its own interaction. `AdminUserList` was corrected to
 *     `group` at F.W4; `GalleryView` still asserted `toolbar`. One answer.
 *  2. STICKY EDGE — `bottom`. This is `FR-AUL-51`'s "one pushes the just-clicked
 *     row out from under the pointer": a bar that appears `sticky top-2` inside
 *     the scroller it shares with the list displaces every row DOWNWARD at the
 *     moment of the first tick, so the pointer that ticked row *n* is now over
 *     row *n−1*. Entering from the bottom edge displaces nothing above it.
 *  3. Z-INDEX — `z-20`, once (`D-17`'s z-10/z-20 residue folds here).
 *  4. INLINE INSET — NONE, and that is the decision, not an omission. The two
 *     hosts have different padding contexts (`GalleryView`'s column is
 *     `py-4` with no inline padding; the admin panels are `px-4`), so an inset
 *     baked in here is wrong at one host by construction. The bar owns its
 *     CHROME — plate, sticky seat, z-tier, padding, gap, type rung — and the
 *     host supplies its own inline inset through `class` fallthrough.
 *  5. THE CLEAR CONTROL — `size="xs" icon-only`, with NO `h-`/`w-` literal.
 *     `AA-22`/`FR-AUL-37`: `cn`'s `["height", /^h-/]` bucket is last-write-wins,
 *     so a consumer `h-7 w-7` mechanically deletes the producer's WCAG-2.5.5
 *     coarse-pointer clamp. The rung is the `size` prop.
 *  6. THE COUNT SENTENCE — real pluralisation off a declared noun. `entr(ies)`
 *     was a third dialect beside `AdminUserList`'s correct `user`/`users`.
 *
 * ⊘ NOT here: the selection SET, its invalidation edges, and the confirm
 * dialog. Those are per-surface state with per-surface invalidation
 * (`FR-AUL-1`'s refilter edge is the users list's; `FR-GFC-20`'s mutation
 * eviction is the gallery's), and folding them into a shared chassis is the
 * wrapper mistake `M-2`'s cure law warns against. The toolbar is the chrome.
 */
import { nextTick, useTemplateRef } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { X } from "@lucide/vue";

const props = withDefaults(
    defineProps<{
        /** Size of the current selection. The bar renders only when ≥ 1. */
        count: number;
        /** Singular noun for the selected entity ("user", "entry"). */
        noun: string;
        /** Plural form; defaults to `noun + "s"`. */
        nounPlural?: string;
        /** Accessible name for the group. */
        label: string;
        /** Disables the clear control while a batch is in flight. */
        busy?: boolean;
    }>(),
    { busy: false },
);

const emit = defineEmits<{ clear: [] }>();

const plural = () => props.nounPlural ?? `${props.noun}s`;

/**
 * X.F.W14U.admin — UIA-F-192: clearing the selection unmounts this bar, and
 * the clear control with it, so focus fell to `<body>`. Both hosts mount the
 * bar directly AFTER the collection it acts on (UIA-F-36), so the stable
 * neighbour is that collection: focus moves to its first enabled control (a
 * card's or a row's own checkbox), the place the selection was made.
 */
const bar = useTemplateRef<HTMLElement>("bar");
const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

async function clear() {
    const host = bar.value?.previousElementSibling as HTMLElement | null;
    emit("clear");
    await nextTick();
    host?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
}
</script>

<template>
    <!-- X.F.W14U.admin — UIA-F-249: the count and the verbs are ONE group
         (the count sat far left, the verbs far right, across the whole column);
         the clear control closes the row. UIA-F-249 / the 390 overlap: the group
         wraps, and every verb keeps its own width, so at 390 the verbs flow onto
         a second line instead of overlapping each other ("FeatureUnfeature"). -->
    <div
        v-if="count > 0"
        ref="bar"
        role="group"
        :aria-label="label"
        class="cartoon-card sticky bottom-2 z-20 flex items-center gap-2 rounded-card px-3 py-2 text-small"
    >
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2 [&>*]:shrink-0">
            <span class="text-caption text-muted-foreground">
                {{ count }} {{ count === 1 ? noun : plural() }} selected
            </span>
            <!-- The actions are the host's: each surface's verbs, counts and
                 `aria-describedby` reasons are its own domain vocabulary. -->
            <slot />
        </div>
        <Button
            emphasis="quiet"
            size="xs"
            icon-only
            class="shrink-0 self-start"
            :disabled="busy"
            aria-label="Clear selection"
            @click="clear"
        >
            <X class="size-3.5" aria-hidden="true" />
        </Button>
    </div>
</template>
