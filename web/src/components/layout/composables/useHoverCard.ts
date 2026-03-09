import { ref, onUnmounted } from "vue";

export function useHoverCard(closeDelay = 150) {
    const isOpen = ref(false);
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    onUnmounted(() => {
        if (closeTimer) clearTimeout(closeTimer);
    });

    function toggle() {
        isOpen.value = !isOpen.value;
    }

    function close() {
        isOpen.value = false;
    }

    function onHoverEnter() {
        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }
        isOpen.value = true;
    }

    function onHoverLeave() {
        closeTimer = setTimeout(() => {
            isOpen.value = false;
            closeTimer = null;
        }, closeDelay);
    }

    return { isOpen, toggle, close, onHoverEnter, onHoverLeave };
}
