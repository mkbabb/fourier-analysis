<script setup lang="ts">
/**
 * The workspace's tool set (owner, 2026-11-15: "Each page should have a tool
 * set in the main dock"): the page's own acts, Publish and the series panel.
 * The canvas's tools (view layers, reset view, export, fullscreen, the editor)
 * are the stage dock's (`CanvasControlsDock.vue`); each tool has one home.
 *
 * Publish: X.F.W14V.u3 — UIA-F-183, publishing wears the gallery's glyph, and
 * once the session is the published piece the control says so and opens it
 * instead of publishing a second copy.
 *
 * Two forms of the same acts (`usePageTools`): `seats`, dock controls (the app
 * dock from 40rem, and the fullscreen takeover's stage dock at every width),
 * and `items`, menu items (under 40rem the app dock's sections menu absorbs
 * them, so the phone's run holds four seats).
 */
import { Globe, GlobeCheck, Sigma } from "@lucide/vue";
import { DockControl } from "@mkbabb/glass-ui/dock";
import { DropdownMenuCheckboxItem, DropdownMenuItem } from "@mkbabb/glass-ui/menu";
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
    tooltipSide?: "bottom" | "left";
}>();

const emit = defineEmits<{
    publish: [];
    toggleEquation: [];
}>();
</script>

<template>
    <template v-if="form === 'items'">
        <DropdownMenuItem v-if="hasContour" @select="emit('publish')">
            <GlobeCheck v-if="published" aria-hidden="true" />
            <Globe v-else aria-hidden="true" />
            <span>{{ published ? "Published — open it" : "Publish to Gallery" }}</span>
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem v-if="hasData" :model-value="showEquation" @update:model-value="emit('toggleEquation')">
            Equation
        </DropdownMenuCheckboxItem>
    </template>
    <template v-else>
        <Tooltip v-if="hasContour && published" text="Published — open it" :side="tooltipSide">
            <DockControl aria-label="Published — open it" @click="emit('publish')">
                <GlobeCheck />
            </DockControl>
        </Tooltip>
        <Tooltip v-else-if="hasContour" text="Publish to Gallery" :side="tooltipSide">
            <DockControl aria-label="Publish to Gallery" :active="publishing" @click="emit('publish')">
                <Globe :class="{ 'animate-pulse': publishing }" />
            </DockControl>
        </Tooltip>
        <Tooltip v-if="hasData" text="Equation" :side="tooltipSide">
            <DockControl aria-label="Equation" :active="showEquation" @click="emit('toggleEquation')">
                <Sigma />
            </DockControl>
        </Tooltip>
    </template>
</template>
