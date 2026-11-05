import { onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter } from "vue";
import { hasSession, imageSrc } from "@/lib/api";

/**
 * X·F F-D5 (FW6-G11) — the element sources for API image URLs, read through
 * the API's read gate with the session (`api.imageSrc`). An image only drafts
 * reference is its owner's, and an `<img src>` or SVG `<image href>` carries no
 * session, so with a session each URL is read once and handed to the element
 * as an object URL; without one the URL is its own source.
 *
 * `urls` is the set the component shows now; the returned function maps one of
 * them to its source (`undefined` while a session read is in flight). Object
 * URLs leave with their URL and with the component's scope.
 */
export function useImageSources(urls: MaybeRefOrGetter<readonly (string | null | undefined)[]>) {
    const sources = shallowRef(new Map<string, string>());
    let controller: AbortController | null = null;

    function release(keep: ReadonlySet<string>) {
        const next = new Map<string, string>();
        for (const [url, src] of sources.value) {
            if (keep.has(url)) next.set(url, src);
            else if (src.startsWith("blob:")) URL.revokeObjectURL(src);
        }
        sources.value = next;
    }

    watch(
        () => toValue(urls).filter((u): u is string => !!u),
        async (wanted) => {
            const keep = new Set(wanted);
            release(keep);
            controller?.abort();
            const ctl = (controller = new AbortController());
            for (const url of wanted) {
                if (sources.value.has(url)) continue;
                try {
                    const src = await imageSrc(url, ctl.signal);
                    if (ctl.signal.aborted) {
                        if (src.startsWith("blob:")) URL.revokeObjectURL(src);
                        return;
                    }
                    sources.value = new Map(sources.value).set(url, src);
                } catch {
                    return; // aborted: a newer set took over
                }
            }
        },
        { immediate: true },
    );

    onScopeDispose(() => {
        controller?.abort();
        release(new Set());
    });

    return (url: string | null | undefined): string | undefined =>
        url ? (sources.value.get(url) ?? (hasSession() ? undefined : url)) : undefined;
}
