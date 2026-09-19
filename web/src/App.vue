<script setup lang="ts">
import { RouterView } from "vue-router";
import { TooltipProvider } from "@mkbabb/glass-ui/tooltip";
import { Toaster } from "@mkbabb/glass-ui/toast";
import AppHeader from "@/components/layout/AppHeader.vue";
import SvgFilters from "@/components/decorative/SvgFilters.vue";
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
</script>

<template>
    <SvgFilters />
    <TooltipProvider :delay-duration="400" :skip-delay-duration="200">
        <div class="h-dvh flex flex-col bg-background text-foreground paper-texture overflow-hidden">
            <AppHeader />
            <main class="flex-1 min-h-0 flex flex-col overflow-y-auto">
                <RouterView />
            </main>
        </div>
    </TooltipProvider>
    <Toaster />
</template>
