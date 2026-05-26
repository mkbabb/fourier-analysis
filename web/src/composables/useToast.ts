import {
    toast as glassToast,
    useToast as glassUseToast,
    type ToastVariant,
} from "@mkbabb/glass-ui";

export type ToastType = "error" | "info" | "success";

const VARIANT_MAP: Record<ToastType, ToastVariant> = {
    error: "destructive",
    info: "default",
    success: "default",
};

const TITLE_MAP: Record<ToastType, string> = {
    error: "Error",
    info: "Info",
    success: "Success",
};

function addToast(message: string, type: ToastType = "info", options?: { duration?: number; slug?: string }) {
    const description = options?.slug ? `${message} (${options.slug})` : message;

    glassToast({
        title: TITLE_MAP[type],
        description,
        variant: VARIANT_MAP[type],
    });
}

export function useToast() {
    const { dismiss } = glassUseToast();

    return {
        toast: addToast,
        dismiss,
    };
}
