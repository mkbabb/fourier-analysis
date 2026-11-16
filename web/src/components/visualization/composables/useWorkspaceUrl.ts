import { watch, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAnimationStore } from "@/stores/animation";
import { CONTOUR_DEFAULTS } from "@/lib/defaults";
import { DEFAULT_ANIMATION_EASING } from "@/lib/easings";
import { isOwnWrite, pageOf, writeParams } from "@/lib/urlState";
import { formatWorkspaceQuery, parseWorkspaceQuery } from "../lib/workspace-query";

/**
 * The workspace's tuned state in the URL (`lib/workspace-query.ts`): the
 * harmonic budget `n`, the paused moment `t`, the rate `speed` and the
 * `ease`. Each is written by replace, and only off the piece's own value: the
 * piece (the picture the path names) brings its saved budget, rate and easing,
 * captured once as it loads, and the URL carries what this view changed.
 *
 * A link read cold applies over the piece as it lands; Back and Forward apply
 * the URL they arrive at. The moment `t` is written only while the reader
 * holds the drawing paused (absent, it plays), so a running clock never
 * writes the URL.
 */
export function useWorkspaceUrl(nHarmonics: Ref<number>) {
    const route = useRoute();
    const router = useRouter();
    const store = useWorkspaceStore();
    const anim = useAnimationStore();
    const own = pageOf(route);
    const url = () => parseWorkspaceQuery(route.query);
    const write = (raws: Record<string, string | undefined>) => writeParams(router, raws, false, own);

    /** The piece's own values, captured as it loads (null until then). */
    const base = { n: null as number | null, speed: null as number | null, ease: null as string | null };
    let baseFor: string | null = null;
    const pieceKey = () => `${store.visualizationSlug ?? ""}|${store.imageSlug ?? ""}`;

    // The piece's budget lands with its contour settings; its rate and easing
    // with its animation settings. The URL's values apply over them once, as
    // they land (the loader seeds the refs from the same settings first).
    watch(
        () => [store.contourSettings, store.animationSettings, pieceKey(), store.loading] as const,
        ([cs, as, key, loading]) => {
            if (loading || (!store.imageSlug && !store.visualizationSlug)) return;
            if (!cs && !as) return;
            if (baseFor === key && base.n !== null) return;
            baseFor = key;
            base.n = cs?.n_harmonics ?? CONTOUR_DEFAULTS.n_harmonics;
            base.speed = as?.speed ?? 1;
            base.ease = as?.easing ?? DEFAULT_ANIMATION_EASING;
            applyUrl();
        },
        { immediate: true, flush: "post" },
    );

    function applyUrl() {
        const v = url();
        if (base.n !== null) {
            const n = v.n ?? base.n;
            if (nHarmonics.value !== n) nHarmonics.value = n;
        }
        if (base.speed !== null) anim.speed = v.speed ?? base.speed;
        if (base.ease !== null) anim.easing = (v.ease ?? base.ease) as typeof anim.easing;
    }

    // Back and Forward (or any navigation to a different query on this page).
    watch(
        () => route.fullPath,
        () => {
            if (isOwnWrite(route.fullPath) || pageOf(route) !== own || baseFor === null) return;
            applyUrl();
            applyTime(url().t);
        },
    );

    // ── Writes ──
    watch(nHarmonics, (n) => {
        if (base.n === null) return;
        write(formatWorkspaceQuery({ n: n === base.n ? null : n }));
    });
    watch(
        () => anim.speed,
        (s) => {
            if (base.speed === null) return;
            write(formatWorkspaceQuery({ speed: s === base.speed ? null : (s as never) }));
        },
    );
    watch(
        () => anim.easing,
        (e) => {
            if (base.ease === null) return;
            write(formatWorkspaceQuery({ ease: e === base.ease ? null : e }));
        },
    );
    // The paused moment: held by the reader, not playing, not mid-scrub.
    // A scrub writes once, as the hand lets go.
    watch(
        () => (anim.scrubbing ? undefined : anim.heldByReader && !anim.playing ? anim.t : null),
        (t) => {
            if (t === undefined || (!store.epicycleData && !store.basesData)) return;
            write(formatWorkspaceQuery({ t }));
        },
    );

    /** Hold the drawing at `t` (a link's paused moment), or let it play when absent. */
    function applyTime(t: number | null) {
        if (t !== null) {
            if (!anim.heldByReader || Math.abs(anim.t - t) > 0.0005) anim.holdAt(t);
        } else if (anim.heldByReader && !anim.playing) {
            anim.toggle();
        }
    }

    /** The URL's paused moment, read as the first drawing lands (the loader asks). */
    function initialTime(): number | null {
        return url().t;
    }

    return { initialTime };
}
