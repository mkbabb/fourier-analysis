/**
 * Event delegation for hovering individual a_n / b_n / c_n / A_n symbols
 * in the sigma-notation KaTeX output.
 */

import { ref, computed, type Ref } from "vue";
import { renderLatex } from "@/lib/equation/render";
import type { FourierTermDTO } from "@/lib/equation/types";
import { groupTrigHarmonics } from "@/lib/equation/harmonics";
import { VIZ_COLORS } from "@/lib/colors";

/**
 * How many rows the popover shows before it elides. ONE constant for all three
 * branches: `L·m-12` — the `an`/`bn` branch tested `>= 6` AFTER pushing while
 * `cn`/`An` tested `> 6` before, so exactly six harmonics rendered a trailing ⋮
 * promising a seventh that does not exist in one branch and not in the others.
 */
const MAX_ROWS = 6;

export type CoeffKind = "an" | "bn" | "cn" | "An";

const CLASS_MAP: Record<string, CoeffKind> = {
    "eq-an": "an",
    "eq-bn": "bn",
    "eq-cn": "cn",
    "eq-An": "An",
};

/**
 * `L·m-2` — this composable took a `notation` ref it never read, advertising a
 * notation-sensitive contract it does not have. The parameter is gone rather
 * than wired: the class the hover lands on (`eq-an` vs `eq-cn` vs `eq-An`)
 * already IS the notation, chosen by the renderer that emitted the symbol.
 */
export function useCoeffHover(coefficients: Ref<FourierTermDTO[]>) {
    const hoveredCoeff = ref<CoeffKind | null>(null);
    const popoverPos = ref({ x: 0, y: 0 });

    /** Call from @mousemove on the equation card. */
    function onMouseMove(e: MouseEvent, cardEl: HTMLElement | undefined) {
        const target = (e.target as HTMLElement).closest?.(".eq-coeff");
        if (!target) { hoveredCoeff.value = null; return; }

        for (const [cls, kind] of Object.entries(CLASS_MAP)) {
            if (target.classList.contains(cls)) {
                hoveredCoeff.value = kind;
                if (cardEl) {
                    const cr = cardEl.getBoundingClientRect();
                    const er = target.getBoundingClientRect();
                    popoverPos.value = {
                        x: er.left - cr.left + er.width / 2,
                        y: er.bottom - cr.top + 4,
                    };
                }
                return;
            }
        }
        hoveredCoeff.value = null;
    }

    function onMouseLeave() { hoveredCoeff.value = null; }

    /** KaTeX-rendered HTML for the hovered coefficient values. */
    const popoverHtml = computed(() => {
        const kind = hoveredCoeff.value;
        if (!kind) return "";
        const coeffs = coefficients.value;
        const lines: string[] = [];

        // D.W4.d — KaTeX cannot resolve CSS vars; read the resolved
        // `--viz-amber` hex via VIZ_COLORS at render time (the runtime
        // token-shadow pattern documented at lib/colors.ts:11). The
        // STATIC.golden constant is the canonical fallback used when
        // `resolveVizColors` has not yet run (mounted before paint).
        const amber = VIZ_COLORS.amber || VIZ_COLORS.golden;

        if (kind === "an" || kind === "bn") {
            // `L·m-3` — the ±n → (a_n, b_n) fold used to be implemented a second
            // time right here, with an epsilon four orders of magnitude apart
            // from the canonical one (`|val| > 1e-10` against `amp > 1e-14`), so
            // a harmonic in that band appeared in the legend and not in the
            // popover. ONE fold, ONE epsilon: the legend's own grouping. It also
            // retires the in-loop `find` pair — the O(n²) half banked at
            // `fr-ConvergencePlot L-m12`.
            const harmonics = groupTrigHarmonics(coeffs);
            for (const h of harmonics.slice(0, MAX_ROWS)) {
                const label = kind === "an" ? "a" : "b";
                const val = kind === "an" ? h.a_n : h.b_n;
                lines.push(`{\\color{${amber}}${label}_{${h.k}}} = ${val.toFixed(4)}`);
            }
            if (harmonics.length > MAX_ROWS) lines.push("\\vdots");
        } else if (kind === "cn") {
            for (const t of coeffs.slice(0, MAX_ROWS)) {
                const im = t.coefficient_im;
                const val = `${t.coefficient_re.toFixed(3)}${im >= 0 ? "+" : ""}${im.toFixed(3)}i`;
                lines.push(`{\\color{${amber}}c_{${t.n}}} = ${val}`);
            }
            if (coeffs.length > MAX_ROWS) lines.push("\\vdots");
        } else if (kind === "An") {
            for (const t of coeffs.slice(0, MAX_ROWS)) {
                lines.push(`{\\color{${amber}}A_{${t.n}}} = ${t.amplitude.toFixed(4)}`);
            }
            if (coeffs.length > MAX_ROWS) lines.push("\\vdots");
        }

        if (!lines.length) return "";
        return renderLatex(lines.join(" \\\\ "));
    });

    return { hoveredCoeff, popoverPos, popoverHtml, onMouseMove, onMouseLeave };
}
