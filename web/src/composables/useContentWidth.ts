import { onScopeDispose, ref, watch, type Ref } from "vue";

/**
 * The inline size a box's content asks for, read live, so the box can tween
 * to it (the motion canon's P0: "a width that the browser would snap (content
 * swaps, a mounted or unmounted child) is measured and tweened").
 *
 * `host` is the box that tweens; its element children are the content (one
 * at a time, or two while a `<Transition>` swaps them), each laid out at its
 * own `max-content` width. The answer is the widest child's layout width
 * (`offsetWidth`: untransformed, so a scaling parent does not skew it), 0 when
 * the host is empty, and null until the host is in the document. Children
 * come and go under a `MutationObserver`; each is sized under a
 * `ResizeObserver`.
 */
export function useContentWidth(host: Readonly<Ref<HTMLElement | null | undefined>>): Ref<number | null> {
    const width = ref<number | null>(null);
    let resize: ResizeObserver | null = null;
    let children: MutationObserver | null = null;

    function measure(): void {
        const el = host.value;
        if (!el) {
            width.value = null;
            return;
        }
        let w = 0;
        for (const child of el.children) w = Math.max(w, (child as HTMLElement).offsetWidth);
        width.value = w;
    }

    function stop(): void {
        resize?.disconnect();
        children?.disconnect();
        resize = children = null;
    }

    watch(
        host,
        (el) => {
            stop();
            if (!el || typeof ResizeObserver === "undefined") {
                measure();
                return;
            }
            const ro = new ResizeObserver(measure);
            const observeAll = () => {
                ro.disconnect();
                for (const child of el.children) ro.observe(child);
                measure();
            };
            resize = ro;
            children = new MutationObserver(observeAll);
            children.observe(el, { childList: true });
            observeAll();
        },
        { immediate: true, flush: "post" },
    );
    onScopeDispose(stop);
    return width;
}
