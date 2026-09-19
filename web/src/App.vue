<script setup lang="ts">
import { nextTick, onScopeDispose, useTemplateRef } from "vue";
import { RouterView, useRouter } from "vue-router";
import { TooltipProvider } from "@mkbabb/glass-ui/tooltip";
import { Toaster } from "@mkbabb/glass-ui/toast";
import AppHeader from "@/components/layout/AppHeader.vue";
import { useVizColorSync } from "@/lib/colors";

/**
 * X.F.W3 `.e` / `fr-App MG-γ` ⊕ `m-2`/`L-3`/`C-7` ⊕ `L-6` — THE ONE DARK-MODE
 * OWNER, CONSUMER HALF.
 *
 * What stood here was a hand-rolled `MutationObserver` on `documentElement`'s
 * class list that was NEVER disconnected, fired `resolveVizColors()` — five
 * `getComputedStyle` reads, each a forced synchronous reflow — on every firing,
 * and observed the wrong event besides: an OS-level scheme change mutates no
 * class at all, because `light-dark()` follows `color-scheme`.
 *
 * It also re-resolved the palette in `onMounted`, which `main.ts` had already
 * done before mount for a documented reason (a root's `onMounted` fires LAST,
 * so a child reading the palette while it mounts must not be racing it). The
 * duplicate read is gone with the observer.
 *
 * The composable returns a stop handle (`L-6`). Nothing calls it here — this is
 * the app root and it does not unmount — and that is the point of returning it
 * rather than the point against: the previous authority could not be stopped
 * even in principle.
 */
useVizColorSync();

/**
 * X.F.W3 `.e` / `fr-App MG-alpha` — SCROLL POSITION, RESTORED; and the one
 * scroll authority for the shell, decided here.
 *
 * `<main>` below is the app's SOLE scroller — the shell is `overflow-hidden`
 * and `h-dvh`, so the document's own scroll range is zero. Two consequences
 * followed and neither had an owner:
 *
 *  1. NOTHING WAS EVER RESTORED, AND STRUCTURALLY COULD NOT BE. The router
 *     declares no `scrollBehavior`, and a `scrollBehavior` hook would not have
 *     helped: vue-router's hook targets `window`, and so does the platform's
 *     `history.scrollRestoration` — both of which have nothing to restore
 *     here. Every back-navigation into the book-length `/paper` treatise landed
 *     at section 1. That is why this books with the shell and not as a router
 *     one-liner: the restore must address THIS ELEMENT.
 *  2. THE OFFSET LEAKED FORWARD. `<main>` persists across navigations — only
 *     `<RouterView>`'s child swaps — so its `scrollTop` survived the swap and
 *     was merely CLAMPED to the incoming route's height. A long route entered
 *     from a scrolled one opened part-way down.
 *
 * The cure is the browser's own contract, applied to the element that actually
 * scrolls: remember the offset per HISTORY ENTRY, restore it when that entry is
 * re-entered, and start a NEW entry at the top. The key is vue-router's own
 * `position` in the history state, which is stable for an entry across back and
 * forward; if a history implementation does not publish one, the key degrades
 * to the path, which remembers less but never restores the wrong thing.
 *
 * The restore is deferred one tick plus one frame because the incoming view's
 * height is not known until it has laid out, and a `scrollTop` written against
 * a shorter document is silently clamped.
 */
const mainEl = useTemplateRef<HTMLElement>("main");
const router = useRouter();
const offsets = new Map<string, number>();

function historyKey(): string {
    const position = (window.history.state as { position?: unknown } | null)?.position;
    return typeof position === "number"
        ? `p${position}`
        : router.currentRoute.value.fullPath;
}

const stopBefore = router.beforeEach(() => {
    if (mainEl.value) offsets.set(historyKey(), mainEl.value.scrollTop);
});

const stopAfter = router.afterEach(async () => {
    const restored = offsets.get(historyKey()) ?? 0;
    await nextTick();
    requestAnimationFrame(() => {
        if (mainEl.value) mainEl.value.scrollTop = restored;
    });
});

onScopeDispose(() => {
    stopBefore();
    stopAfter();
});
</script>

<template>
    <TooltipProvider :delay-duration="400" :skip-delay-duration="200">
        <div class="h-dvh flex flex-col bg-background text-foreground paper-texture overflow-hidden">
            <!-- ⊘ X.F.W3 `.e` / `fr-App MG-epsilon` — RECORDED AS A DECISION,
                 DELIBERATELY NOT EXECUTED.

                 `AppHeader`'s `sticky top-0` and `backdrop-blur-md` are
                 STRUCTURALLY INERT here and have always been: the header is a
                 flex SIBLING of `<main>`, and its own scrollport is the
                 `overflow-hidden` shell below, whose scrollTop is pinned at 0.
                 `sticky` therefore never engages, nothing ever passes behind
                 the blur, and the app pays for a permanent compositing layer
                 that composites nothing.

                 The repair is a DESIGN CHOICE, not a defect fix — move the
                 header inside the scroller (making both treatments real) or
                 retire the treatment — and the record routes the at-rest
                 screenshot that would decide it to SS-13 (fr-App probe 8) -> S-9.
                 A silent flip in either direction is this row's failure mode,
                 so the finding is written where the mechanism lives and the
                 choice is left to the seat that holds the screenshot. -->
            <AppHeader />
            <main ref="main" class="flex-1 min-h-0 flex flex-col overflow-y-auto">
                <RouterView />
            </main>
        </div>
    </TooltipProvider>
    <Toaster />
</template>
