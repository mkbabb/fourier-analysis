/**
 * Event delegation for hovering individual a_n / b_n / c_n / A_n symbols
 * in the sigma-notation KaTeX output.
 */

import { ref, computed, type Ref } from "vue";
import katex from "katex";
import type { FourierTermDTO, NotationMode } from "@/lib/equation/types";

export type CoeffKind = "an" | "bn" | "cn" | "An";

const CLASS_MAP: Record<string, CoeffKind> = {
    "eq-an": "an",
    "eq-bn": "bn",
    "eq-cn": "cn",
    "eq-An": "An",
};

export function useCoeffHover(
    coefficients: Ref<FourierTermDTO[]>,
    notation: Ref<NotationMode>,
) {
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
        const harmonics = coeffs.filter((c) => c.n !== 0);
        const lines: string[] = [];
        const seen = new Set<number>();

        if (kind === "an" || kind === "bn") {
            for (const t of harmonics) {
                const k = Math.abs(t.n);
                if (seen.has(k)) continue;
                seen.add(k);
                const pos = harmonics.find((h) => h.n === k);
                const neg = harmonics.find((h) => h.n === -k);
                const cP = pos ? [pos.coefficient_re, pos.coefficient_im] : [0, 0];
                const cN = neg ? [neg.coefficient_re, neg.coefficient_im] : [0, 0];
                const val = kind === "an" ? cP[0] + cN[0] : -(cP[1] - cN[1]);
                if (Math.abs(val) > 1e-10) {
                    const label = kind === "an" ? "a" : "b";
                    lines.push(`{\\color{#f0b632}${label}_{${k}}} = ${val.toFixed(4)}`);
                }
                if (lines.length >= 6) { lines.push("\\vdots"); break; }
            }
        } else if (kind === "cn") {
            for (const t of coeffs.slice(0, 6)) {
                const im = t.coefficient_im;
                const val = `${t.coefficient_re.toFixed(3)}${im >= 0 ? "+" : ""}${im.toFixed(3)}i`;
                lines.push(`{\\color{#f0b632}c_{${t.n}}} = ${val}`);
            }
            if (coeffs.length > 6) lines.push("\\vdots");
        } else if (kind === "An") {
            for (const t of coeffs.slice(0, 6)) {
                lines.push(`{\\color{#f0b632}A_{${t.n}}} = ${t.amplitude.toFixed(4)}`);
            }
            if (coeffs.length > 6) lines.push("\\vdots");
        }

        if (!lines.length) return "";
        try {
            return katex.renderToString(lines.join(" \\\\ "), {
                displayMode: true, throwOnError: false, trust: true,
            });
        } catch { return ""; }
    });

    return { hoveredCoeff, popoverPos, popoverHtml, onMouseMove, onMouseLeave };
}
