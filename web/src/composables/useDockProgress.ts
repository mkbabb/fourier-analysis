import { computed, onScopeDispose, shallowRef, type Ref } from "vue";

/**
 * A page's measure on the app dock's rim, for a page whose progress is not a
 * scroll (a job running on the stage). The dock draws it where it draws the
 * reading progress: glass's `ScrollProgressRim` as the dock's own border, so
 * the folded circle wears it too. 0..1, or null for none. Released when the
 * providing scope is disposed (the view unmounts).
 */
interface DockProgress {
    owner: symbol;
    value: Readonly<Ref<number | null>>;
}

const current = shallowRef<DockProgress | null>(null);

export function provideDockProgress(value: Readonly<Ref<number | null>>): void {
    const owner = Symbol("dock-progress");
    current.value = { owner, value };
    onScopeDispose(() => {
        if (current.value?.owner === owner) current.value = null;
    });
}

/** The dock's read: the page's measure now, or null when the page gives none. */
export function useDockProgress() {
    return computed(() => current.value?.value.value ?? null);
}
