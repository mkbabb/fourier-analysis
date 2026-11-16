/**
 * A page's state in its URL (owner, 2026-11-15: "Each page should have state
 * defined in the URL, like with fourier for the currently selected picture,
 * background showing, etc.").
 *
 * Each piece of state is one short query parameter with a codec: `parse`
 * reads the raw value (absent, repeated or junk reads as the default) and
 * `format` writes it back, the default written as nothing, so a page's plain
 * path stays its clean link. A write keeps every parameter it does not own.
 *
 * History: a discrete move a person expects Back to undo (the picture, a layer
 * toggle, the editor, the fullscreen takeover, opening a card) is a push; a
 * continuous one (time, terms, a typed expression, a scroll position) is a
 * replace, so Back never walks through every frame of a drag.
 *
 * Theme is a personal setting, not page state: it is never written here.
 */
import { computed, type WritableComputedRef } from "vue";
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw, type RouteLocationNormalizedLoaded, type Router } from "vue-router";

export interface Codec<T> {
    /** The value from the raw parameter (absent or junk reads as the default). */
    parse(raw: string | undefined): T;
    /** The raw parameter for a value, or undefined at the default (then omitted). */
    format(value: T): string | undefined;
}

/** A switch whose default is off: "1" when on, omitted when off. */
export const flagOn: Codec<boolean> = {
    parse: (raw) => raw === "1",
    format: (on) => (on ? "1" : undefined),
};

/** A switch whose default is on: "0" when off, omitted when on. */
export const flagOff: Codec<boolean> = {
    parse: (raw) => raw !== "0",
    format: (on) => (on ? undefined : "0"),
};

/** One of a closed set of words; anything else (and the default) is omitted. */
export function oneOf<T extends string>(values: readonly T[], fallback: T): Codec<T> {
    return {
        parse: (raw) => {
            const v = raw ?? "";
            return (values as readonly string[]).includes(v) ? (v as T) : fallback;
        },
        format: (v) => (v === fallback ? undefined : v),
    };
}

/** An integer in [min, max]; junk or out of range reads as null (the page decides). */
export function intIn(min: number, max: number): Codec<number | null> {
    return {
        parse: (raw) => {
            if (raw === undefined || !/^-?\d+$/.test(raw)) return null;
            const n = Number(raw);
            return n >= min && n <= max ? n : null;
        },
        format: (v) => (v === null ? undefined : String(Math.round(v))),
    };
}

/** A fraction in [0, 1] at three decimals (a thousandth of the cycle); null when absent. */
export const unit: Codec<number | null> = {
    parse: (raw) => {
        if (raw === undefined || raw === "" || !/^\d*\.?\d+$/.test(raw)) return null;
        const v = Number(raw);
        return v >= 0 && v <= 1 ? v : null;
    },
    format: (v) => {
        if (v === null || !Number.isFinite(v)) return undefined;
        const r = Math.round(Math.max(0, Math.min(1, v)) * 1000) / 1000;
        return String(r);
    },
};

/** Free text (a search, an expression); empty is the default. */
export const text: Codec<string> = {
    parse: (raw) => raw ?? "",
    format: (v) => (v === "" ? undefined : v),
};

/** The first value of a query entry, as a string (vue-router allows arrays and nulls). */
export function rawOf(query: LocationQuery, key: string): string | undefined {
    const v = query[key];
    const first = Array.isArray(v) ? v[0] : v;
    return typeof first === "string" ? first : undefined;
}

/** The query with each of `raws` set (or removed when undefined), every other parameter kept. */
export function withParams(query: LocationQuery | LocationQueryRaw, raws: Record<string, string | undefined>): LocationQueryRaw {
    const next: LocationQueryRaw = { ...query };
    for (const [key, raw] of Object.entries(raws)) {
        if (raw === undefined) delete next[key];
        else next[key] = raw;
    }
    return next;
}

/** Whether writing `raws` would change `query`. */
export function changes(query: LocationQuery, raws: Record<string, string | undefined>): boolean {
    return Object.entries(raws).some(([key, raw]) => (raw === undefined ? key in query : rawOf(query, key) !== raw));
}

/**
 * The page a route shows, for ownership: its section (`meta.tab`; `/w/` and
 * `/v/` are one page, the same component) or else its name.
 */
export function pageOf(route: Pick<RouteLocationNormalizedLoaded, "meta" | "name">): string | symbol | null | undefined {
    return route.meta.tab ?? route.name;
}

/**
 * Writes several parameters on the current route in one navigation, by push
 * or replace, and only when one of them changes. `owner` is the page the
 * write belongs to (`pageOf`): while that page is leaving (the next route is
 * already current) nothing is written into the next page's URL.
 */
export function writeParams(router: Router, raws: Record<string, string | undefined>, push = false, owner?: string | symbol | null): void {
    const route = router.currentRoute.value;
    if (owner !== undefined && pageOf(route) !== owner) return;
    // Two writes in one turn (a toggle and the clock, say) both land: the
    // second builds on the first's query while its navigation is in flight,
    // and a push in flight keeps the merged navigation a push.
    const inFlight = pending !== null && pending.path === route.path;
    const base = inFlight ? pending!.query : route.query;
    if (!changes(base, raws)) return;
    const query = withParams(base, raws) as LocationQuery;
    const asPush = push || (inFlight && pending!.push);
    const entry = { path: route.path, query, push: asPush };
    pending = entry;
    const to = { path: route.path, hash: route.hash, query };
    ownWrites.add(router.resolve(to).fullPath);
    void (asPush ? router.push(to) : router.replace(to)).finally(() => {
        if (pending === entry) pending = null;
    });
}

/** The query a write in flight is navigating to (see `writeParams`). */
let pending: { path: string; query: LocationQuery; push: boolean } | null = null;

/** The URLs this module navigated to, not yet seen arrive (see `isOwnWrite`). */
const ownWrites = new Set<string>();

/**
 * Whether the route just arrived at is one a page's own write made (consumed
 * once). A page that applies its URL to its state on navigation (Back and
 * Forward, a pasted link) skips its own echo, so a write that lands after the
 * reader has moved on (a drag, typing) never pulls the state back.
 */
export function isOwnWrite(fullPath: string): boolean {
    return ownWrites.delete(fullPath);
}

/**
 * One parameter as a ref: reading parses the current URL (Back and Forward
 * included), writing formats into it. `push` says how a write enters history.
 */
export function useQueryParam<T>(key: string, codec: Codec<T>, push = false): WritableComputedRef<T> {
    const route = useRoute();
    const router = useRouter();
    const own = pageOf(route);
    let last = codec.parse(rawOf(route.query, key));
    return computed({
        get: () => (pageOf(route) === own ? (last = codec.parse(rawOf(route.query, key))) : last),
        set: (v) => writeParams(router, { [key]: codec.format(v) }, push, own),
    });
}
