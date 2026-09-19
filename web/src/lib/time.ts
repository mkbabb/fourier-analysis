/**
 * X.F.W3 `.e` / `fr-AdminUserList FR-AUL-17` (⊕ `fr-GalleryCardModal GCM-34`,
 * `m-17`) — THE ONE `timeAgo`, CAPPED AND GUARDED.
 *
 * Five divergent copies in two dialects lived in five SFCs — ⟨cmd⟩ this seat,
 * 2026-09-19, `grep -rn 'function timeAgo' src` → `AdminFlaggedPanel.vue:299` ·
 * `AdminUserList.vue:350` · `GalleryCard.vue:56` · `GalleryDraftsSection.vue:41`
 * · `GalleryCardModal.vue:58` — and not one of them had a sub-minute floor AND
 * a cap AND a negative guard AND a `<time>` element AND a reactive clock AND a
 * NaN guard. The two dialects disagreed about the first of those, so the same
 * three-second-old row read "0m ago" in the admin list and "just now" in the
 * gallery card beside it.
 *
 * Every defect the row books is answered here, and each is answered once:
 *
 *  · SUB-MINUTE FLOOR — "just now" below a minute. The admin dialect printed
 *    "0m ago", which is a measurement nobody asked for.
 *  · CAP — past 30 days the relative form stops meaning anything ("412d ago"
 *    is not a fact a reader can use), so it hands over to an absolute date.
 *    This is `GCM-34`'s "truncates at days forever", cured at its mechanism.
 *  · NEGATIVE GUARD — a future timestamp is clock skew between the client and
 *    the API, not a fact about the entity. Every copy rendered it as
 *    "-3m ago". It reads "just now" here, which is the honest answer to a
 *    skew of a few seconds and a non-answer to a larger one — neither is a
 *    claim the data supports, and only one of them looks like a bug report.
 *  · NaN GUARD — `new Date("nonsense")` yields NaN and every copy printed
 *    "NaNm ago" into the UI. An unreadable instant renders NOTHING.
 *  · REACTIVE CLOCK — the copies sampled `Date.now()` DURING RENDER, so a
 *    string froze at whatever it said when the component last patched. See
 *    `useTimeAgo`.
 *  · `<time>` + THE REFERENT (`m-17`) — a bare "3h ago" collides across
 *    adjacent tabs, because the reader cannot tell 3h-since-created from
 *    3h-since-seen, nor what "now" it was measured against. `relativeTime`
 *    returns the machine-readable instant and the absolute rendering beside
 *    the words, so a call site can mount a real `<time :datetime :title>` and
 *    the referent is one hover away.
 */
import { computed, toValue, type MaybeRefOrGetter, type ComputedRef } from "vue";
import { createSharedComposable, useNow } from "@vueuse/core";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Past this age the relative form stops carrying information and a date is shown. */
const RELATIVE_CAP = 30 * DAY;

/** A relative instant, in the three forms a call site needs. */
export interface RelativeTime {
    /** Human text — "just now", "12m ago", "3h ago", "9d ago", or a date. */
    readonly text: string;
    /** The `<time datetime>` value, or `""` when the instant is unreadable. */
    readonly datetime: string;
    /** The absolute rendering, for a `title` — this is `m-17`'s referent. */
    readonly absolute: string;
}

const UNREADABLE: RelativeTime = { text: "", datetime: "", absolute: "" };

/**
 * The relative form of `iso`, measured against `now`.
 *
 * `now` is a PARAMETER rather than a `Date.now()` call inside, which is what
 * makes this function pure, unit-testable without a fake clock, and reactive
 * when `useTimeAgo` feeds it a ticking source.
 */
export function relativeTime(
    iso: string | null | undefined,
    now: number = Date.now(),
): RelativeTime {
    if (!iso) return UNREADABLE;

    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return UNREADABLE;

    const date = new Date(then);
    const datetime = date.toISOString();
    const absolute = date.toLocaleString();

    // Clock skew reads as the present, never as a negative age.
    const age = Math.max(0, now - then);

    let text: string;
    if (age >= RELATIVE_CAP) {
        text = date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } else if (age < MINUTE) {
        text = "just now";
    } else if (age < HOUR) {
        text = `${Math.floor(age / MINUTE)}m ago`;
    } else if (age < DAY) {
        text = `${Math.floor(age / HOUR)}h ago`;
    } else {
        text = `${Math.floor(age / DAY)}d ago`;
    }

    return { text, datetime, absolute };
}

/**
 * ONE clock for the whole app.
 *
 * `createSharedComposable` gives every caller the SAME `useNow` instance, so a
 * gallery page rendering ninety cards holds one interval rather than ninety,
 * and the interval is torn down automatically when the last consumer unmounts.
 * Thirty seconds is chosen against the smallest unit this module prints: a
 * minute. Anything faster re-renders for no visible change; anything slower
 * lets "just now" outstay its welcome by more than half a step.
 */
const useSharedClock = createSharedComposable(() => useNow({ interval: 30_000 }));

/**
 * The relative form of `iso`, which TICKS.
 *
 * The five copies this replaces read `Date.now()` during render, so their
 * output was not a clock at all — it was a snapshot of whenever the component
 * last happened to patch, and on a gallery page that can be never.
 */
export function useTimeAgo(
    iso: MaybeRefOrGetter<string | null | undefined>,
): ComputedRef<RelativeTime> {
    const now = useSharedClock();
    return computed(() => relativeTime(toValue(iso), now.value.getTime()));
}

/**
 * The same clock, as a function — for a LIST.
 *
 * `useTimeAgo` is a composable and therefore cannot be called per row of a
 * `v-for`. A list maps itself through this inside ONE computed instead, which
 * keeps the work at one `relativeTime` call per field per tick rather than one
 * per template read.
 */
export function useRelativeTime(): (iso: string | null | undefined) => RelativeTime {
    const now = useSharedClock();
    return (iso) => relativeTime(iso, now.value.getTime());
}
