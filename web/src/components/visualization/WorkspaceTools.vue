<script setup lang="ts">
/**
 * The workspace's tool set in the app dock (owner, 2026-11-15: "Each page
 * should have a tool set in the main dock"): the page's own acts, Publish and
 * the series panel. The canvas's tools (view layers, reset view, export,
 * fullscreen, the editor) are the stage dock's (`CanvasControlsDock.vue`);
 * each tool has one home.
 *
 * Publish: X.F.W14V.u3 — UIA-F-183, publishing wears the gallery's glyph, and
 * once the session is the published piece the control says so and opens it
 * instead of publishing a second copy.
 *
 * On a phone (`PAGE_TOOLS_COMPACT`) the two are one menu seat, "Visualize
 * tools": the app dock's run holds its own four seats and one more.
 */
import { Ellipsis, Globe, GlobeCheck, Sigma } from "@lucide/vue";
import { useMediaQuery } from "@vueuse/core";
import { DockControl } from "@mkbabb/glass-ui/dock";
import { DockTrigger } from "@mkbabb/glass-ui/dock-trigger";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@mkbabb/glass-ui/menu";
import { Tooltip } from "@/components/ui/tooltip";
import { PAGE_TOOLS_COMPACT } from "@/composables/usePageTools";

const compact = useMediaQuery(PAGE_TOOLS_COMPACT);

defineProps<{
    /** The app dock's keep-open hold, for the phone's menu. */
    hold: (open: boolean) => void;
    hasData: boolean;
    hasContour: boolean;
    publishing: boolean;
    published: boolean;
    showEquation: boolean;
}>();

const emit = defineEmits<{
    publish: [];
    toggleEquation: [];
}>();
</script>

<template>
    <DropdownMenu v-if="compact" :modal="false" @update:open="hold">
        <DockTrigger for="dropdown" aria-label="Visualize tools">
            <Ellipsis />
        </DockTrigger>
        <DropdownMenuContent align="center">
            <DropdownMenuItem v-if="hasContour" @select="emit('publish')">
                <GlobeCheck v-if="published" aria-hidden="true" />
                <Globe v-else aria-hidden="true" />
                <span>{{ published ? "Published — open it" : "Publish to Gallery" }}</span>
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem v-if="hasData" :model-value="showEquation" @update:model-value="emit('toggleEquation')">
                Equation
            </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
    </DropdownMenu>
    <template v-else>
        <Tooltip v-if="hasContour && published" text="Published — open it" side="bottom">
            <DockControl aria-label="Published — open it" @click="emit('publish')">
                <GlobeCheck />
            </DockControl>
        </Tooltip>
        <Tooltip v-else-if="hasContour" text="Publish to Gallery" side="bottom">
            <DockControl aria-label="Publish to Gallery" :active="publishing" @click="emit('publish')">
                <Globe :class="{ 'animate-pulse': publishing }" />
            </DockControl>
        </Tooltip>
        <Tooltip v-if="hasData" text="Equation" side="bottom">
            <DockControl aria-label="Equation" :active="showEquation" @click="emit('toggleEquation')">
                <Sigma />
            </DockControl>
        </Tooltip>
    </template>
</template>
