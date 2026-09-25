<script setup lang="ts">
/**
 * The Controls/Canvas strip of a stage-plus-inspector route in its `sheet`
 * form (`useWorkspaceForm`): `/w`, `/v` and `/equation` render this one bar.
 *
 * X.F.W14V.au1 — A2-FO-L2-5. Each view carried its own `flex px-3 py-1`
 * wrapper, which pinned glass's content-width strip at x = 12, aligned to
 * neither the column's gutter nor its axis (its centre sat 75–110 px left of
 * the viewport's at 360–430). The strip is now centred on the column's axis,
 * inside the page gutter the Configurator below it keeps (`--page-gutter`),
 * on the page's own ground (no band, UIA-F-238).
 */
import { SegmentedTabs } from "@mkbabb/glass-ui/tabs";

export type WorkspaceView = "controls" | "canvas";

const view = defineModel<WorkspaceView>({ required: true });

const OPTIONS: { label: string; value: WorkspaceView }[] = [
    { label: "Controls", value: "controls" },
    { label: "Canvas", value: "canvas" },
];
</script>

<template>
    <div class="workspace-tabs">
        <SegmentedTabs variant="underline" :options="OPTIONS" v-model="view" />
    </div>
</template>

<style scoped>
.workspace-tabs {
    display: flex;
    justify-content: center;
    min-width: 0;
    padding-block: 0.25rem;
    margin-inline: var(--page-gutter);
}
</style>
