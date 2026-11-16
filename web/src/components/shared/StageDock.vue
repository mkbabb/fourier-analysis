<script setup lang="ts">
/**
 * The stage's floating tools (owner, 2026-11-15: "pages like the quaran reader
 * and fourier should have an additional floating bar ... which is a
 * collapsible glass-ui dock"). One small dock at the top-right corner of a
 * page's stage card, built from glass's pieces as shipped: `GlassDock`
 * folded to the page's glyph (`collapse="closed"`, opened by a press,
 * `expandOn="press"`), the actions as `DockControl` seats in the default slot.
 * A dock with one action is that one control, plated and never folded.
 *
 * On a phone (under `sm`, 40rem) it stands as glass's vertical dock, a column
 * that opens downward from the corner, so it never spans the stage, never
 * reaches the dock above it, and never covers the drawing's centre.
 *
 * A menu opened from a seat holds the dock open while it is open (glass's
 * documented `keepOpen()`/`release()`, handed to the slot as `hold`), so the
 * seat that opened it is still there when it closes. When glass ships this
 * composition as a named piece, this file gives way to it.
 */
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { GlassDock } from "@mkbabb/glass-ui/dock";

const { label, fold = true } = defineProps<{
    /** The dock's name (the folded glyph's accessible name). */
    label: string;
    /** Several actions: the dock folds to the glyph and opens by a press. One action is never folded. */
    fold?: boolean;
}>();

/** A phone's column: glass's vertical dock under `sm` (the CSS below keys the same width). */
const PHONE = "(width < 40rem)";
const column = ref(false);
let query: MediaQueryList | null = null;
const onQuery = () => (column.value = !!query?.matches);
onMounted(() => {
    query = window.matchMedia(PHONE);
    query.addEventListener("change", onQuery);
    onQuery();
});
onBeforeUnmount(() => query?.removeEventListener("change", onQuery));

const dock = useTemplateRef<InstanceType<typeof GlassDock>>("dock");
const root = useTemplateRef<HTMLElement>("root");

/*
 * A press outside the dock while a menu holds it open closes the menu, and
 * the dock is still held at that moment, so glass's own outside-press fold
 * does not run. The press is remembered here; when the menu's close then gives
 * the hold back, the dock folds too, so one press outside closes both (a press
 * on the menu itself, or an Escape, leaves the dock open).
 */
let outsidePressAt = -Infinity;
function onPress(e: PointerEvent) {
    const t = e.target as Element | null;
    const outside = !!t && !root.value?.contains(t) && !t.closest("[role=menu], [data-reka-popper-content-wrapper]");
    outsidePressAt = outside ? e.timeStamp : -Infinity;
}
onMounted(() => document.addEventListener("pointerdown", onPress, true));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onPress, true));

/** One menu's open edge: it takes or gives back one glass keep-open count. */
let holds = 0;
function hold(open: boolean) {
    if (!fold) return;
    if (open) {
        holds++;
        dock.value?.keepOpen();
    } else if (holds > 0) {
        holds--;
        dock.value?.release();
        if (holds === 0 && performance.now() - outsidePressAt < 600) dock.value?.collapse();
    }
}
onBeforeUnmount(() => {
    while (holds > 0) hold(false);
});

defineExpose({
    /** Whether the dock is open (glass's `expanded`). */
    get expanded() {
        return dock.value?.expanded ?? false;
    },
});
</script>

<template>
    <div ref="root" class="stage-dock" :data-column="column || undefined">
        <GlassDock v-if="!fold" ref="dock" :collapse="false" fit-content :aria-label="label">
            <slot :hold="hold" :column="column" />
        </GlassDock>
        <GlassDock
            v-else
            ref="dock"
            collapse="closed"
            expand-on="press"
            fit-content
            :orientation="column ? 'vertical' : 'horizontal'"
            :collapsed-label="label"
            :aria-label="label"
        >
            <template #collapsed>
                <slot name="collapsed" />
            </template>
            <slot :hold="hold" :column="column" />
            <!-- A seat that must outlive the fold (the workspace's Edit contour,
                 the editor's one door in and out): glass's never-inert region. -->
            <template v-if="$slots['persistent-end']" #persistent-end>
                <slot name="persistent-end" :column="column" />
            </template>
        </GlassDock>
    </div>
</template>

<style scoped>
/* The box only: the host places it at its stage's top-right corner; the dock
   holds to the box's end edge, so it grows leftward (a row) or downward (a
   column) from the corner. */
.stage-dock {
    display: flex;
    justify-content: end;
    align-items: start;
}
</style>
