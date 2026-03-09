import { ref, readonly } from "vue";

export interface Toast {
    id: number;
    message: string;
    type: "error" | "info" | "success";
}

let nextId = 0;
const toasts = ref<Toast[]>([]);

const DEFAULT_DURATION: Record<Toast["type"], number> = {
    error: 6000,
    info: 4000,
    success: 3000,
};

function addToast(message: string, type: Toast["type"] = "info", duration?: number) {
    const id = nextId++;
    toasts.value.push({ id, message, type });
    setTimeout(() => dismiss(id), duration ?? DEFAULT_DURATION[type]);
}

function dismiss(id: number) {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx !== -1) toasts.value.splice(idx, 1);
}

export function useToast() {
    return {
        toasts: readonly(toasts),
        toast: addToast,
        dismiss,
    };
}
