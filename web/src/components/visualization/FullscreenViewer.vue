<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Minimize2 } from "@lucide/vue";
import type { ContourAsset } from "@/lib/types";
import BasisCanvas from "./BasisCanvas.vue";
import ContourEditorCanvas from "./ContourEditorCanvas.vue";
import AnimationControls from "./AnimationControls.vue";

const props = defineProps<{
    visible: boolean;
    activeBases: string[];
    showGhost: boolean;
    showImageOverlay?: boolean;
    isEditing?: boolean;
    contour?: ContourAsset;
    imageSlug?: string | null;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "toggleGhost"): void;
    (e: "toggleImageOverlay"): void;
}>();

const canvasComponent = ref<InstanceType<typeof BasisCanvas>>();
const containerRef = ref<HTMLElement>();
const show = ref(false);

// ── Focus trap (A2 MED) ──
// The teleported fullscreen layer must contain Tab focus; without this, Tab
// leaks to the background document behind the overlay.  A tiny inline trap
// (no new dep): wrap Tab from last→first and Shift+Tab from first→last across
// the container's focusable descendants, scoped to the Teleport target.
let lastFocused: HTMLElement | null = null;

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableEls(): HTMLElement[] {
    const root = containerRef.value;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
    );
}

function onTrapKeydown(e: KeyboardEvent) {
    if (e.key !== "Tab") return;
    const els = focusableEls();
    if (els.length === 0) {
        e.preventDefault();
        containerRef.value?.focus();
        return;
    }
    const first = els[0];
    const last = els[els.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
        if (active === first || !containerRef.value?.contains(active)) {
            e.preventDefault();
            last.focus();
        }
    } else if (active === last || !containerRef.value?.contains(active)) {
        e.preventDefault();
        first.focus();
    }
}

watch(() => props.visible, (v) => {
    if (v) {
        lastFocused = document.activeElement as HTMLElement | null;
        show.value = true;
        // Autofocus the first focusable inside the layer once it mounts.
        nextTick(() => {
            const els = focusableEls();
            (els[0] ?? containerRef.value)?.focus();
        });
    } else {
        show.value = false;
        // Return focus to the trigger that opened the viewer.
        lastFocused?.focus?.();
        lastFocused = null;
    }
}, { immediate: true });

function onAfterLeave() {
    // Nothing needed — the teleport stays in DOM but invisible
}

function onKeydown(e: KeyboardEvent) {
    if (!props.visible) return;
    if (e.key === "Escape") {
        emit("close");
        return;
    }
    onTrapKeydown(e);
}

onMounted(() => document.addEventListener("keydown", onKeydown));
onUnmounted(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
    <Teleport to="body">
        <Transition name="fs" @after-leave="onAfterLeave">
            <div v-if="show" class="fs-backdrop" @click.self="emit('close')">
                <div ref="containerRef" class="fs-container" tabindex="-1">
                    <!-- Close button -->
                    <Button emphasis="primary" size="md" icon-only class="fs-close" @click="emit('close')">
                        <Minimize2 class="h-5 w-5" />
                    </Button>

                    <!-- Canvas fills the viewport -->
                    <ContourEditorCanvas
                        v-if="isEditing && contour"
                        :contour="contour"
                        :image-slug="imageSlug ?? null"
                        :show-image-overlay="showImageOverlay"
                    />
                    <BasisCanvas
                        v-else
                        ref="canvasComponent"
                        :active-bases="activeBases"
                        :show-ghost="showGhost"
                        :show-image-overlay="showImageOverlay"
                    />

                    <!-- Timeline overlaid at the bottom -->
                    <div v-if="!isEditing" class="fs-controls">
                        <AnimationControls
                            :active-bases="activeBases"
                            :show-ghost="showGhost"
                            :show-image-overlay="showImageOverlay"
                            max-width="60rem"
                            @toggle-ghost="emit('toggleGhost')"
                            @toggle-image-overlay="emit('toggleImageOverlay')"
                            @export-frame="canvasComponent?.exportFrame()"
                        />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.fs-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-fullscreen);
    background: var(--background);
}

.fs-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* X.F.W4 · `fr-FullscreenViewer FV-14` (R-2) — `flex: 1` and `min-height: 0`
   are DELETED, not kept "for safety": both children declare the pair on their
   own roots in their own scoped blocks (`BasisCanvas.vue`'s
   `.canvas-container`, `ContourEditorCanvas.vue`'s `.editor-shell`), so this
   was a no-op duplication that two corpus superlatives certified as craft. The
   CHROME STRIP below is the real design judgement and it stays — a card frame
   is meaningless when the surface IS the viewport. */
.fs-container :deep(.canvas-container),
.fs-container :deep(.editor-shell) {
    border: none;
    border-radius: 0;
    box-shadow: none;
}

.fs-container :deep(.canvas-container:hover) {
    border-color: transparent;
    box-shadow: none;
}

/**
 * X.F.W4 · `fr-FullscreenViewer` FV-8 ⊕ FV-12 ⊕ FV-13 ⊕ FV-22, one block,
 * because they are four readings of a single decision: this control
 * re-implemented, in unlayered scoped CSS, the chrome the `<Button>` it is
 * already wearing ships.
 *
 * FV-8 — the hover/press rules re-authored the glass chrome with ad-hoc
 * `color-mix()` literals over `--glass-bg/border-resting`, and unlayered scoped
 * CSS beats the layered utilities, so the producer's register lost. ⊘ The press
 * is the sharp half and the mechanism was corrected in adjudication: the local
 * rule set `transform`, while glass-ui's press seat is the `scale` LONGHAND, so
 * the two did not override — they COMPOUNDED, multiplying into a press deeper
 * than either author specified. Deleting the local rules is the whole cure;
 * they are a `feedback_glass_ui_first_class` violation besides.
 *
 * FV-12 — the same `transform` survived the producer's reduced-motion blanket
 * twice over: `base.css`'s `.tap-squish:active { scale: 1 }` reset targets the
 * longhand and cannot reach a `transform`, and the PRM blanket strips
 * `transform` from the TRANSITIONED set — which un-animates the jump without
 * removing it, so under `reduce` the scale applied INSTANTLY. Motion reduction
 * inverted into sharpening. It dies with the rules that declared it.
 *
 * FV-22 — `calc(var(--z-fullscreen) + 10)` minted an unnamed rung numerically
 * equal to `--z-toast`, inside the backdrop's OWN stacking context, where any
 * positive value orders identically. It bought nothing and collided nominally
 * with a named tier; `1` says what is actually meant.
 *
 * FV-13 — the 2.5rem box is left to the `<Button size="md" icon-only>` it is
 * declared on, so the control sits on the system's control ladder (and its
 * coarse-pointer floor) instead of beside it at a hand-set 40px. What remains
 * here is placement and the stacking rung: position is this file's business,
 * chrome is not.
 */
.fs-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 1;
}

.fs-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    /* FV-22, the second site: same unnamed rung, same own stacking context. */
    z-index: 1;
    padding: 0 1rem 0.75rem;
    display: flex;
    justify-content: center;
}

@media (min-width: 640px) {
    .fs-controls {
        padding: 0 2rem 1rem;
    }
}

/* Wider controls in fullscreen are now driven by the AnimationControls
   `max-width` prop (see template), replacing the former
   `--animation-dock-max-width` CSS-var contract. */

/* ── Fullscreen enter/leave transitions ── */
/* A.W3.d — bezier→`--ease-out-expo`. */
.fs-enter-active {
    transition: opacity 0.25s var(--ease-standard), transform 0.3s var(--ease-out-expo);
}
.fs-leave-active {
    transition: opacity 0.2s var(--ease-standard), transform 0.2s var(--ease-standard);
}
.fs-enter-from {
    opacity: 0;
    transform: scale(0.95);
}
.fs-leave-to {
    opacity: 0;
    transform: scale(0.95);
}
</style>
