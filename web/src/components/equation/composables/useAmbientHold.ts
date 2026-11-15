import { onMounted, onUnmounted, ref, type Ref } from "vue";

/**
 * LAST-TEN F-06: when the reader acts, the ambient motion holds still.
 *
 * /equation's convergence sweep autoplays from mount and repainted the plot
 * every frame under every interaction (typing, the notation toggles, a slider
 * drag, the plot hover: 17 to 67 % of frames over 33 ms at 1440). The sweep
 * is ambient, motion nobody asked for, so it holds while the reader is busy:
 *  - a press is down anywhere (a slider drag, a scrub, a click held);
 *  - a key went down in the last second (typing an expression);
 *  - the pointer is over `target` (reading a curve under its tooltip);
 *  - an overlay is open (a menu, a select's list, a dialog: their portals sit
 *    on <body>, and a modal one sets `pointer-events: none` there).
 * It resumes `resumeAfter` ms after the last of these ends. `held` only says
 * so; the owner of the motion decides what holding means.
 *
 * LAST-TEN F-07: it starts HELD. The reader arrives by acting (a menu press,
 * a link), and the route's crossfade and the view's first layout and paint
 * fill the next frames; the ambient motion begins once they are past, not on
 * top of them.
 */
export function useAmbientHold(target: Ref<HTMLElement | undefined>, resumeAfter = 600) {
    const held = ref(true);
    let pressed = false;
    let hovering = false;
    let overlay = false;
    let lastKey = -Infinity;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let observer: MutationObserver | null = null;
    const TYPING_MS = 1000;

    const busy = () => pressed || hovering || overlay || performance.now() - lastKey < TYPING_MS;

    function update() {
        if (timer) { clearTimeout(timer); timer = null; }
        if (busy()) {
            held.value = true;
            // Typing ends by itself: look again when the key's second is up.
            if (!pressed && !hovering && !overlay) timer = setTimeout(update, TYPING_MS - (performance.now() - lastKey) + 10);
            return;
        }
        if (held.value) timer = setTimeout(() => { timer = null; if (!busy()) held.value = false; }, resumeAfter);
    }

    function overlayOpen(): boolean {
        if (document.body.style.pointerEvents === "none") return true;
        for (const el of Array.from(document.body.children)) {
            if (el.id === "app" || el.tagName === "SCRIPT") continue;
            if (el.matches("[role=dialog], [role=alertdialog], [role=menu], [role=listbox]") ||
                el.querySelector("[role=dialog], [role=alertdialog], [role=menu], [role=listbox]")) return true;
        }
        return false;
    }

    const onDown = () => { pressed = true; update(); };
    const onUp = () => { pressed = false; update(); };
    const onKey = () => { lastKey = performance.now(); update(); };
    const onEnter = () => { hovering = true; update(); };
    const onLeave = () => { hovering = false; update(); };

    onMounted(() => {
        window.addEventListener("pointerdown", onDown, true);
        window.addEventListener("pointerup", onUp, true);
        window.addEventListener("pointercancel", onUp, true);
        window.addEventListener("keydown", onKey, true);
        target.value?.addEventListener("pointerenter", onEnter);
        target.value?.addEventListener("pointerleave", onLeave);
        // <body> and each portal host under it (never the app's own subtree,
        // which changes every frame while the sweep plays).
        const watched = new WeakSet<Element>();
        const watchHosts = () => {
            for (const el of Array.from(document.body.children)) {
                if (el.id === "app" || el.tagName === "SCRIPT" || watched.has(el)) continue;
                watched.add(el);
                observer!.observe(el, { childList: true, subtree: true });
            }
        };
        observer = new MutationObserver(() => {
            watchHosts();
            const now = overlayOpen();
            if (now !== overlay) { overlay = now; update(); }
        });
        observer.observe(document.body, { childList: true, attributes: true, attributeFilter: ["style"] });
        watchHosts();
        overlay = overlayOpen();
        update();
    });

    onUnmounted(() => {
        if (timer) clearTimeout(timer);
        observer?.disconnect();
        window.removeEventListener("pointerdown", onDown, true);
        window.removeEventListener("pointerup", onUp, true);
        window.removeEventListener("pointercancel", onUp, true);
        window.removeEventListener("keydown", onKey, true);
        target.value?.removeEventListener("pointerenter", onEnter);
        target.value?.removeEventListener("pointerleave", onLeave);
    });

    return { held };
}
