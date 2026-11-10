import { computed, type ComputedRef, type Ref } from "vue";
import { useElementSize, useMediaQuery } from "@vueuse/core";

/**
 * The form a stage-plus-inspector route (`/w`, `/v`, `/equation`) takes.
 *
 *  · `split`  glass `Configurator`'s own two columns: the stage and the aside
 *             side by side, laid out by glass.
 *  · `rail`   a viewport from 640 px up, too narrow for glass's split: the
 *             aside is a rail beside the stage (the host lays the two regions
 *             in a row).
 *  · `sheet`  a phone: one region at a time, picked by the Controls/Canvas
 *             tabs, opening on the canvas.
 *
 * X.F.W14V.au1 — A2-FO-X-1 ⊕ A2-FO-L2-4. The host used to gate on the viewport
 * (`(min-width: 1024px)`) while glass splits on its shell's inline size
 * (`@container (inline-size >= 64rem)`, `configurator/styles.css`). The shell
 * sits inside the page gutter, so between those two widths (1024×768 tablet
 * landscape) the host hid the tabs while glass stacked the regions, and the
 * stage was a 285 px strip under the dock. The split is now read from the
 * shell's own box, at glass's own threshold, so the two can never disagree.
 * Short and tablet landscape (844×390, 1024×768) take the rail instead of the
 * portrait tabs, so the controls sit beside the stage rather than a tab away.
 *
 * Canon F5 (restraint): portrait tablets (820×1180) take the rail too. The
 * tabs hid the plot behind a second layout where one layout fits; only a
 * phone, where the two regions cannot share a row, is tabbed.
 */
export type WorkspaceForm = "split" | "rail" | "sheet";

/** glass `Configurator`'s split threshold, in rem (its container query). */
const SPLIT_REM = 64;

export function useWorkspaceForm(shell: Ref<HTMLElement | null | undefined>): ComputedRef<WorkspaceForm> {
    // The content box: what a CSS container query measures.
    const { width } = useElementSize(shell);
    const roomy = useMediaQuery("(min-width: 640px)");
    const rem = typeof document === "undefined"
        ? 16
        : parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return computed(() => {
        if (width.value >= SPLIT_REM * rem) return "split";
        return roomy.value ? "rail" : "sheet";
    });
}
