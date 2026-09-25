import { ref, watch, onMounted, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAnimationStore } from "@/stores/animation";
import { toast } from "@mkbabb/glass-ui/toast";
import { ERROR_TOAST } from "@/lib/toast-policy";
import { CONTOUR_DEFAULTS } from "@/lib/defaults";
import { normalizeBasisKey } from "@/lib/basis";

/**
 * X.F.W4 · SP-4 — `prefers-reduced-motion`, read LIVE at every call.
 *
 * ⊘ FR-AH-6 (*"one predicate, one home"*) — the app carries further copies of
 * this predicate (`composables/useFourierMorph.ts` for the morph clock,
 * `router/index.ts` for the View-Transitions gate). WHICH home survives is
 * F.W5's rider to decide, so this seat does not pre-empt it: the predicate
 * lives with the clock it gates, every site carries this note, and the collapse
 * is one move whenever the ruling lands.
 *
 * It is a function and not a captured boolean because the preference can change
 * mid-session; a value read once at module scope is a gate that silently stops
 * being one.
 */
function prefersReducedMotion(): boolean {
    return (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
    );
}

export function useWorkspaceLoader(activeBases: Ref<string[]>) {
    const route = useRoute();
    const router = useRouter();
    const store = useWorkspaceStore();
    const anim = useAnimationStore();

    // Seed contour settings from workspace (defaults applied immediately)
    const nHarmonics = ref(store.contourSettings?.n_harmonics ?? CONTOUR_DEFAULTS.n_harmonics);
    const nPoints = ref(store.contourSettings?.n_points ?? 1024);

    // Route-based loading. Two routes mount this view (B.W4, one slug per
    // noun): `/w/:imageSlug?` is the working session over an image asset, and
    // `/v/:visualizationSlug` is a SAVED visualization entity.
    //
    // X.F.W14.u — UIA-F-2 / UIA-F-3: the loader used to read only
    // `imageSlug`. `/v/<slug>` therefore never sent GET `/api/visualizations/<slug>`
    // (`loadVisualization` had no caller) and rendered the empty upload stage,
    // and an in-app push from `/w/` to `/v/` saw `imageSlug` go undefined and
    // `router.replace`d straight back to `/w/`. The loader now dispatches on
    // the route's name, and acts only while one of its own two routes is the
    // current one.
    async function loadFromRoute(force: boolean) {
        if (route.name === "visualization") {
            const vizSlug = route.params.visualizationSlug as string;
            if (force || vizSlug !== store.visualizationSlug) {
                await store.loadVisualization(vizSlug);
            }
            return;
        }
        if (route.name !== "workspace") return;
        const imageSlug = route.params.imageSlug as string | undefined;
        if (!imageSlug) {
            if (store.imageSlug) router.replace(`/w/${store.imageSlug}`);
            return;
        }
        // Skip if we already have this workspace loaded (uploadImage just set
        // it and pushed the route).
        if (force || imageSlug !== store.imageSlug) {
            await store.loadWorkspace(imageSlug);
        }
    }

    onMounted(() => loadFromRoute(true));

    // Route watcher for in-app navigation between the two routes and their slugs.
    watch(
        () => [route.name, route.params.imageSlug, route.params.visualizationSlug],
        () => loadFromRoute(false),
    );

    // Seed animation settings from workspace (once)
    watch(
        () => store.animationSettings,
        (as) => {
            if (as?.active_bases?.length) {
                activeBases.value = [...as.active_bases];
            }
            if (as?.easing) anim.easing = as.easing;
            if (as?.speed) anim.speed = as.speed;
        },
        { once: true },
    );

    // Seed contour settings from workspace (once)
    watch(
        () => store.contourSettings,
        (cs) => {
            if (cs) {
                nHarmonics.value = cs.n_harmonics ?? CONTOUR_DEFAULTS.n_harmonics;
                nPoints.value = cs.n_points ?? 1024;
            }
        },
        { once: true },
    );

    // Reset harmonics when the *image* identity changes mid-session — not on
    // initial mount. The contour-settings watcher above seeds nHarmonics from
    // any persisted draft via `{ once: true }`; firing this reset on the
    // first slug assignment would clobber that seed before the user sees
    // their previous configuration.
    let priorSlug: string | null = store.imageSlug;
    watch(
        () => store.imageSlug,
        (slug) => {
            if (priorSlug !== null && slug !== priorSlug) {
                nHarmonics.value = CONTOUR_DEFAULTS.n_harmonics;
            }
            priorSlug = slug;
        },
    );

    // Auto-compute is owned solely by ContourSettings.vue, which holds the
    // canonical settings state. A prior duplicate watcher here on
    // `store.contour` raced with ContourSettings' settings watcher: both
    // would fire on a fresh upload, producing the bases-compute ERR_ABORTED
    // observed in the W3.5 e2e network log.

    // Auto-play when computation data first arrives.
    // Does NOT override the user's basis selection on recomputes.
    //
    // X.F.W4 · SP-4 / `fr-AnimationControls D-8 · C-19` — the 60fps clock was
    // entirely ungated and it AUTO-STARTED here, which is the half of that row
    // this site owns: the reader arrives, and motion begins without being asked
    // for. Decoration in this file was gated and substance was not.
    //
    // ⊘ M-D1's TERMINAL-FRAME LAW is the whole reason this is not simply
    // `if (reduced) return`. Suppressing playback at mount freezes the canvas at
    // t = 0 — for an epicycle drawing, the state in which nothing has been drawn
    // yet — so the "accessible" arm would show a reduced-motion reader a blank
    // instrument and call it an accommodation. The reduced arm therefore SEEKS
    // THE TERMINAL FRAME (t = 1, the fully traced curve) and leaves the clock
    // stopped: the same information, delivered as a static image.
    //
    // ⊘ Bounds, declared rather than half-landed: the rAF loop itself lives in
    // `stores/animation.ts`, which is unit `.f`'s file in this wave. An explicit
    // press of Play still starts an ungated loop, and that is a deliberate user
    // action, not an auto-start. The store-side gate (park the loop, or honour
    // the preference inside `tick`) is declared to `.f` and is NOT written from
    // here; what is cured here is every path on which the app starts moving on
    // its own.
    let hadDataBefore = false;
    watch(
        () => [store.epicycleData, store.basesData] as const,
        ([epicData, basesData]) => {
            if (!epicData && !basesData) {
                hadDataBefore = false;
                return;
            }
            const reduced = prefersReducedMotion();
            if (!hadDataBefore) {
                hadDataBefore = true;
                // First data arrival: ensure fourier-epicycles is selected
                if (!activeBases.value.includes("fourier-epicycles")) {
                    // X.F.W3 `.e` / `fr-BasisSelector M-10` — the key->family
                    // bridge, one of seven inline spellings, retired onto the
                    // canon. The predicate is "not a Fourier basis", and saying
                    // so through `normalizeBasisKey` is what keeps the family
                    // question answered in one place when a fifth basis lands.
                    activeBases.value = [
                        "fourier-epicycles",
                        ...activeBases.value.filter(
                            (b) => normalizeBasisKey(b) !== "fourier",
                        ),
                    ];
                }
                if (reduced) {
                    // Stop first, THEN seed: `reset()` pauses and zeroes, so
                    // seeking before it would be overwritten by it.
                    anim.reset();
                    anim.seek(1);
                    return;
                }
                anim.reset();
                anim.play();
            } else if (!anim.playing && !reduced) {
                anim.play();
            }
        },
        { immediate: true },
    );

    // Error toast
    watch(
        () => store.error,
        (err) => {
            if (err && store.imageSlug) {
                toast({ ...ERROR_TOAST, title: err });
                store.error = null;
            }
        },
    );

    return { nHarmonics, nPoints };
}
