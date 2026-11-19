/**
 * The workspace's view in its URL (`/w/<image>` and `/v/<visualization>`; the
 * path names the picture). Short stable keys, each omitted at its default, so
 * the plain path is the clean link:
 *
 *   bg=0      the picture under the drawing is hidden (default shown)
 *   trace=1   the original outline is shown (default hidden)
 *   eq=1      the series panel is open
 *   edit=1    the contour editor is open
 *   fs=1      the fullscreen takeover is open
 *   n=<1..500>    the harmonic budget, when it differs from the piece's own
 *   t=<0..1>      the moment the reader paused on (absent: the drawing plays)
 *   speed=<rate>  the playback rate, when it differs from the piece's own
 *   ease=<name>   the easing, when it differs from the piece's own
 *
 * The toggles are pushes (Back undoes them); `n`, `t`, `speed` and `ease` are
 * replaces (a drag or a menu tune never fills the history).
 */
import type { LocationQuery } from "vue-router";
import { flagOff, flagOn, intIn, rawOf, unit, type Codec } from "@/lib/urlState";
import { ANIMATION_SPEEDS, type AnimationSpeed } from "@/lib/defaults";
import { isAnimationEasingName, type AnimationEasingName } from "@/lib/easings";

/** A rate the transport offers; anything else is the piece's own (null). */
const speedCodec: Codec<AnimationSpeed | null> = {
    parse: (raw) => {
        const v = raw === undefined ? NaN : Number(raw);
        return (ANIMATION_SPEEDS as readonly number[]).includes(v) ? (v as AnimationSpeed) : null;
    },
    format: (v) => (v === null ? undefined : String(v)),
};

/** An easing the transport offers; anything else is the piece's own (null). */
const easeCodec: Codec<AnimationEasingName | null> = {
    parse: (raw) => (isAnimationEasingName(raw) ? raw : null),
    format: (v) => v ?? undefined,
};

export const WORKSPACE_QUERY = {
    // The picture shows and the dashed outline does not, by default; a link
    // written before the flip (`bg=1`, `trace=0`) still reads as it was.
    bg: flagOff,
    trace: flagOn,
    eq: flagOn,
    edit: flagOn,
    fs: flagOn,
    n: intIn(1, 500),
    t: unit,
    speed: speedCodec,
    ease: easeCodec,
} as const;

export type WorkspaceKey = keyof typeof WORKSPACE_QUERY;

export type WorkspaceView = {
    [K in WorkspaceKey]: ReturnType<(typeof WORKSPACE_QUERY)[K]["parse"]>;
};

export function parseWorkspaceQuery(query: LocationQuery): WorkspaceView {
    const out = {} as Record<WorkspaceKey, unknown>;
    for (const key of Object.keys(WORKSPACE_QUERY) as WorkspaceKey[]) {
        out[key] = WORKSPACE_QUERY[key].parse(rawOf(query, key));
    }
    return out as WorkspaceView;
}

export function formatWorkspaceQuery(view: Partial<WorkspaceView>): Record<string, string | undefined> {
    const out: Record<string, string | undefined> = {};
    for (const key of Object.keys(view) as WorkspaceKey[]) {
        out[key] = (WORKSPACE_QUERY[key] as Codec<unknown>).format(view[key]);
    }
    return out;
}

/** The view keys a new picture keeps (how this reader looks at drawings, not where one stood). */
export const CARRIED_VIEW_KEYS = ["bg", "trace"] as const;
