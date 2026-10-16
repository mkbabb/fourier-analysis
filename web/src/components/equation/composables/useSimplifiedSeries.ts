import { onScopeDispose, ref, toValue, type MaybeRefOrGetter } from "vue";
import { simplifyCoefficients, isAbortError, abortInflight } from "@/lib/equation/api";
import { problemMessage } from "@/lib/api-problem";
import type { NotationMode, SimplifyResponse } from "@/lib/equation/types";
import type { BasisComponent } from "@/lib/types";

/**
 * X.F.W14V.au3 — A2-FO-L1-5: the simplified series, written once. The /equation
 * route and /visualize's equation panel each re-implemented the same flow (read
 * the notation and the budget, POST `/simplify`, hold the LaTeX and the energy,
 * drop a superseded answer); both now read this.
 *
 * `simplify()` answers the response it wrote, or `null` when there was nothing
 * to send, when a later call superseded it (`L·M-2`'s generation rule: only the
 * current request writes or clears a flag), or when it failed; a failure is
 * named on `error`, an abort never is.
 */
export interface SimplifiedSeriesOptions {
    notation: MaybeRefOrGetter<NotationMode>;
    budget: MaybeRefOrGetter<number>;
    autoHarmonics?: MaybeRefOrGetter<boolean>;
    /** A restored series (the /equation cache), shown until the first answer. */
    initial?: { latex?: string; latexSigma?: string; energy?: number };
}

export function useSimplifiedSeries(
    components: MaybeRefOrGetter<BasisComponent[]>,
    options: SimplifiedSeriesOptions,
) {
    const latex = ref(options.initial?.latex ?? "");
    const latexSigma = ref(options.initial?.latexSigma ?? "");
    const energy = ref(options.initial?.energy ?? 1);
    const loading = ref(false);
    const error = ref<string | null>(null);

    let generation = 0;

    async function simplify(): Promise<SimplifyResponse | null> {
        const terms = toValue(components);
        if (!terms.length) return null;
        const gen = ++generation;
        loading.value = true;
        try {
            const resp = await simplifyCoefficients(
                terms,
                toValue(options.budget),
                toValue(options.notation),
                toValue(options.autoHarmonics) ?? false,
            );
            if (gen !== generation) return null;
            latex.value = resp.latex;
            latexSigma.value = resp.latex_sigma;
            energy.value = resp.energy_captured;
            error.value = null;
            return resp;
        } catch (e) {
            if (gen === generation) {
                error.value = isAbortError(e) ? null : problemMessage(e, "Could not re-render the series");
            }
            return null;
        } finally {
            if (gen === generation) loading.value = false;
        }
    }

    /* A dead view's answer must not land (`L·M-7`). */
    onScopeDispose(() => abortInflight(["eq-simplify"]));

    return { latex, latexSigma, energy, loading, error, simplify };
}
