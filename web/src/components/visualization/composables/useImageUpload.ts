import { ref, inject, onUnmounted, type InjectionKey, type Ref } from "vue";

const IMAGE_EXTENSIONS = new Set([
    "png", "jpg", "jpeg", "gif", "bmp", "webp", "svg", "tiff", "tif",
]);

/** Safari-safe image detection: fall back to extension when MIME type is empty. */
function isImageFile(file: File): boolean {
    if (file.type.startsWith("image/")) return true;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    return IMAGE_EXTENSIONS.has(ext);
}

export function useImageUpload(onFile: (file: File) => void) {
    const isDragging = ref(false);
    const preview = ref<string | null>(null);
    const rejection = ref<string | null>(null);

    // Track active FileReader so we can abort on new selection or unmount
    let activeReader: FileReader | null = null;

    onUnmounted(() => {
        if (activeReader && activeReader.readyState === FileReader.LOADING) {
            activeReader.abort();
        }
        activeReader = null;
    });

    // Counter-based drag tracking to handle child element enter/leave events
    let dragCounter = 0;

    // X.F.W14.u — UIA-F-19: the sidebar panel's drop target sits inside the
    // view root's, so one drop reached two `handleDrop`s (three, with the
    // overlay's) and uploaded twice: two POSTs, two router pushes, a race.
    // One drop has one owner: the innermost target takes it (and marks it
    // handled by preventing its default); every outer host only resets its
    // own drag state.
    function handleDrop(e: DragEvent) {
        const handled = e.defaultPrevented;
        e.preventDefault();
        dragCounter = 0;
        isDragging.value = false;
        if (handled) return;
        const file = e.dataTransfer?.files[0];
        if (file) accept(file);
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        // Safari fallback: dragenter may not fire reliably
        if (!isDragging.value && dragCounter === 0) {
            dragCounter = 1;
            isDragging.value = true;
        }
    }

    function handleDragEnter(e: DragEvent) {
        e.preventDefault();
        dragCounter++;
        isDragging.value = true;
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) {
            dragCounter = 0;
            isDragging.value = false;
        }
    }

    function handleFileSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) accept(file);
    }

    /**
     * X.F.W14U.vstage — UIA-F-166: a file that is not an image was dropped
     * and nothing said so. The rejection names the file and what is taken,
     * for the drop target to show; the next file clears it.
     */
    function accept(file: File) {
        if (!isImageFile(file)) {
            rejection.value = `${file.name} is not an image. Choose a PNG, JPG or SVG.`;
            return;
        }
        rejection.value = null;
        setPreview(file);
        onFile(file);
    }

    function setPreview(file: File) {
        // Abort any in-progress read
        if (activeReader && activeReader.readyState === FileReader.LOADING) {
            activeReader.abort();
        }
        const reader = new FileReader();
        activeReader = reader;
        reader.onload = (e) => {
            preview.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    function clearPreview() {
        if (activeReader && activeReader.readyState === FileReader.LOADING) {
            activeReader.abort();
        }
        activeReader = null;
        preview.value = null;
    }

    return {
        isDragging,
        preview,
        rejection,
        clearPreview,
        handleDrop,
        handleDragOver,
        handleDragEnter,
        handleDragLeave,
        handleFileSelect,
    };
}

/**
 * X.F.W14V.au2 — A2-FO-L1-11: one upload owner. The workspace view holds the
 * single `useImageUpload` and the single file input; the Image layer
 * (`ImageUpload.vue`) is presentation only and reads what it shows (the
 * picker, the drag state, the local preview) from here. Before, the layer ran
 * a second instance with a second input and a drop target nested inside the
 * view's.
 */
export interface ImageUploadContext {
    /** Open the view's one file picker. */
    openPicker: () => void;
    isDragging: Readonly<Ref<boolean>>;
    /** The picked or dropped file's local preview, until the upload lands. */
    preview: Readonly<Ref<string | null>>;
}

export const IMAGE_UPLOAD_KEY: InjectionKey<ImageUploadContext> = Symbol("image-upload");

/** The Image layer's read of the view's upload owner. */
export function useImageUploadContext(): ImageUploadContext {
    const upload = inject(IMAGE_UPLOAD_KEY);
    if (!upload) throw new Error("The Image layer is mounted outside the workspace view, which owns the upload.");
    return upload;
}
