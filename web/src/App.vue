<script setup lang="ts">
import { nextTick, onScopeDispose, useTemplateRef } from "vue";
import { RouterView, useRouter } from "vue-router";
import { TooltipProvider } from "@mkbabb/glass-ui/tooltip";
import { Toaster } from "@mkbabb/glass-ui/toast";
import { useGlobalDark } from "@mkbabb/glass-ui/dark";
import AppDock from "@/components/layout/AppDock.vue";
import { resolveVizColors } from "@/lib/colors";

/**
 * X.F.W3 `.e` / `fr-App MG-γ` ⊕ `m-2`/`L-3`/`C-7` ⊕ `L-6` — THE ONE DARK-MODE
 * OWNER, RUNTIME HALF. Re-homed HERE at X.F.W3 Repair 1 (`LW-W3-1`).
 *
 * WHY IT LIVES IN THIS FILE. `.e` wrote this arm into `web/src/lib/colors.ts`,
 * which carries no §1 Bounds row and no §5e Files line — a bounds expansion,
 * and §6 line 1 makes that a triumvirate event rather than an edit. The code
 * was sound and the room was wrong, so the `colors.ts` hunk is reverted to its
 * pre-wave bytes and the arm stands in the file that owns the defect it cures:
 * `App.vue` is a §1 row (cluster H), and the hand-rolled authority this
 * replaces was authored here.
 *
 * WHAT STOOD HERE: a `MutationObserver` on `documentElement`'s class list that
 * was NEVER disconnected, fired `resolveVizColors()` — five `getComputedStyle`
 * reads, each a forced synchronous reflow — on every firing, and observed the
 * wrong event besides, since an OS-level scheme change mutates no class at all
 * (`light-dark()` follows `color-scheme`). It also re-resolved the palette in
 * `onMounted`, which `main.ts` had already done before mount for a documented
 * reason (a root's `onMounted` fires LAST, so a child reading the palette while
 * it mounts must not be racing it).
 *
 * ⊘ WHY THE SEED IS HERE AND EXPLICIT. `useGlobalDark`'s `initialValue` is
 * ONE-SHOT: only the call that constructs the singleton is honoured, and a
 * later conflicting seed THROWS. This `<script setup>` body runs at ROOT setup
 * — before every descendant's, so before `DarkModeToggle.vue`'s bare
 * `useGlobalDark()` — which is what stops a component becoming the seeder by
 * mounting first. `"auto"` is vueuse's own default and is passed anyway,
 * because the producer's contract is to pair it with `darkModeSyncScript()` in
 * `index.html` so the parse-time answer and the runtime answer are the SAME
 * answer.
 *
 * ⊘ WHY `onFlipSettled` AND NOT `installDarkModeSync`. Both live on the same
 * subpath and watch the same singleton, so neither can miss a flip the other
 * catches. They differ in exactly the respect `L-6` names: `installDarkModeSync`
 * returns `void`, `onFlipSettled` returns its own unsubscribe — and a composable
 * that cannot be stopped is how the observer this replaces got written. It is
 * also the hook the producer documents FOR a palette memo: every subscriber
 * drains in ONE coalesced post-flip task instead of paying N reflows on the
 * flip's own frame.
 *
 * ⊘ THE RESIDUE, DISCLOSED. `installVizColors()`'s own
 * `prefers-color-scheme` listener in `colors.ts` came back with the revert. It
 * is redundant beside the `"auto"` seed rather than harmful — `resolveVizColors`
 * is idempotent, so an OS flip costs one extra token re-read — and deleting it
 * is a one-line edit in a file this wave may not open. It is escalated, not
 * swept.
 */
const stopVizColorSync = useGlobalDark({ initialValue: "auto" }).onFlipSettled(
    () => resolveVizColors(),
);
onScopeDispose(stopVizColorSync);

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

/*
 * X.F.W14V.au5 — A2-FO-L1-19: ONE restoration per route. A route that owns
 * its scroll (`meta.ownsScroll`: /paper restores its windowed article by
 * section id, `PaperView`) is left alone here — the shell neither records nor
 * writes `<main>` for it, so one mechanism acts on each route.
 *
 * The entry being LEFT is the key captured when it was entered. On a back or
 * forward (popstate) the history state has already moved to the target when
 * `beforeEach` runs, so a key computed there filed the leaving route's offset
 * under the arriving entry and the restore read it back (a /morph entry left
 * at 400 px came back at 0). The shell mounts after the initial navigation has
 * settled, so the first entry's key is read at setup.
 */
let currentKey = historyKey();
let currentOwnsScroll = router.currentRoute.value.meta.ownsScroll === true;

const stopBefore = router.beforeEach(() => {
    if (mainEl.value && !currentOwnsScroll) {
        offsets.set(currentKey, mainEl.value.scrollTop);
    }
});

const stopAfter = router.afterEach(async (to) => {
    currentKey = historyKey();
    currentOwnsScroll = to.meta.ownsScroll === true;
    if (currentOwnsScroll) return;
    const restored = offsets.get(currentKey) ?? 0;
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
        <div class="app-shell h-dvh flex flex-col bg-background text-foreground paper-texture overflow-hidden isolate">
            <!-- X.F.W11.b (COHESION §0ao OA-2) — the grid is the APP's ground, not
                 the paper's: the producer's `.paper-grid` (glass-ui
                 `styles/paper.css`, theme-aware via its `.dark` blend arm)
                 paints one fixed, full-viewport layer under every route.
                 `isolate` makes this shell the stacking context, so `-z-10`
                 sits above the shell's own ground and beneath all content;
                 the paper keeps its own surface on top of it. -->
            <div class="paper-grid fixed inset-0 -z-10 pointer-events-none" aria-hidden="true" />
            <!-- X.F.W11.c (COHESION §0ao OA-3) — the shell's chrome is a
                 `GlassDock` (`AppDock.vue`); `AppHeader.vue` is retired with
                 every control re-homed once. `fr-App MG-epsilon`'s open choice
                 (the old header's structurally inert `sticky top-0` +
                 `backdrop-blur-md`) is DECIDED by retirement: the dock's own
                 plate is the surface, and the landmark stays a flex sibling of
                 `<main>`, the app's sole scroller. -->
            <AppDock />
            <!-- X.F.W14V.au1 — A2-FO-L2-1: `<main>` is also the containing block
                 of what it scrolls. Unpositioned, an out-of-flow box in a route
                 (a gallery card's `sr-only` label, `position: absolute` with no
                 positioned ancestor) was laid out against the document instead,
                 at its place far down the grid, and gave the document a scroll
                 range of its own (1031 of 844 at 390) that the shell's premise
                 says is zero. -->
            <main ref="main" class="relative flex-1 min-h-0 flex flex-col overflow-y-auto">
                <RouterView />
            </main>
        </div>
    </TooltipProvider>
    <Toaster />
</template>
