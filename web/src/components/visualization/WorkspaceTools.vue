<script setup lang="ts">
/**
 * The workspace's own acts: Publish, the series panel, and Copy link. Each
 * is there from the page's first frame, disabled until it has something to
 * act on.
 *
 * Publish: X.F.W14V.u3 — UIA-F-183, publishing wears the gallery's glyph, and
 * once the session is the published piece the control says so and opens it
 * instead of publishing a second copy.
 *
 * Copy link copies the address as it stands: the picture, the layers, the
 * bases, the view and the paused moment are all in it.
 *
 * Two forms of the same acts (`usePageTools`): `seats`, dock controls (the app
 * dock from 40rem, and the fullscreen takeover's stage dock), and `items`,
 * menu items (a stage dock's menu).
 */
import { computed } from "vue";
import { Check, Globe, GlobeCheck, Link, SquareFunction } from "@lucide/vue";
import { DockControl } from "@mkbabb/glass-ui/dock";
import { DropdownMenuCheckboxItem, DropdownMenuItem } from "@mkbabb/glass-ui/menu";
import { useClipboard } from "@mkbabb/glass-ui";
import { Tooltip } from "@/components/ui/tooltip";
import type { PageToolsForm } from "@/composables/usePageTools";

const { tooltipSide = "bottom" } = defineProps<{
    form: PageToolsForm;
    hasData: boolean;
    hasContour: boolean;
    publishing: boolean;
    published: boolean;
    showEquation: boolean;
    /** Where a seat's tooltip opens (a column's seats open theirs to the side). */
    tooltipSide?: "bottom" | "left" | "top";
}>();

const emit = defineEmits<{
    publish: [];
    toggleEquation: [];
}>();

const { status, copy } = useClipboard({ resetMs: 2000 });
const copyAnnouncement = computed(() => {
    if (status.value === "success") return "Link copied to the clipboard";
    if (status.value === "failure") return "Could not copy: the clipboard refused the write";
    return "";
});
function copyLink(): void {
    void copy(window.location.href);
}
/** The menu stays open on Copy link, so its check is seen. */
function onCopyItem(e: Event): void {
    e.preventDefault();
    copyLink();
}
</script>

<template>
    <template v-if="form === 'items'">
        <DropdownMenuItem :disabled="!hasData" @select="onCopyItem">
            <Transition name="icon-swap" mode="out-in">
                <Check v-if="status === 'success'" class="copy-ok" aria-hidden="true" />
                <Link v-else aria-hidden="true" />
            </Transition>
            <span>Copy link</span>
        </DropdownMenuItem>
        <DropdownMenuItem :disabled="!hasContour" @select="emit('publish')">
            <GlobeCheck v-if="published" aria-hidden="true" />
            <Globe v-else aria-hidden="true" />
            <span>{{ published ? "Published — open it" : "Publish to Gallery" }}</span>
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem :disabled="!hasData" :model-value="showEquation" @update:model-value="emit('toggleEquation')">
            <SquareFunction aria-hidden="true" />
            <span>Series</span>
        </DropdownMenuCheckboxItem>
    </template>
    <template v-else>
        <Tooltip v-if="published" text="Published — open it" :side="tooltipSide">
            <DockControl aria-label="Published — open it" :disabled="!hasContour" @click="emit('publish')">
                <GlobeCheck />
            </DockControl>
        </Tooltip>
        <Tooltip v-else text="Publish to Gallery" :side="tooltipSide">
            <DockControl aria-label="Publish to Gallery" :disabled="!hasContour" :active="publishing" @click="emit('publish')">
                <Globe :class="{ 'animate-pulse': publishing }" />
            </DockControl>
        </Tooltip>
        <Tooltip text="Series" :side="tooltipSide">
            <DockControl aria-label="Series" :disabled="!hasData" :active="showEquation" @click="emit('toggleEquation')">
                <SquareFunction />
            </DockControl>
        </Tooltip>
        <Tooltip text="Copy link" :side="tooltipSide">
            <DockControl aria-label="Copy link" :disabled="!hasData" @click="copyLink">
                <Transition name="icon-swap" mode="out-in">
                    <Check v-if="status === 'success'" class="copy-ok" />
                    <Link v-else />
                </Transition>
            </DockControl>
        </Tooltip>
    </template>
    <p class="sr-only" role="status">{{ copyAnnouncement }}</p>
</template>

<style scoped>
.copy-ok {
    color: var(--section-color-4);
}

.icon-swap-enter-active,
.icon-swap-leave-active {
    transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard);
}
.icon-swap-enter-from,
.icon-swap-leave-to {
    opacity: 0;
    transform: scale(0.7);
}
</style>
