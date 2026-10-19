<script setup lang="ts">
/**
 * X.F.W14.u — UIA-F-50 (no catch-all route: an unknown path rendered an empty
 * `<main>`, a soft 404) and UIA-F-4 (`/v/<unknown>` rendered the upload
 * dropzone with no error). One not-found card in the app's idiom: the glass
 * Card on `--radius-card` (glass DESIGN.md radius table), a real heading, the
 * thing that was not found named in the body, and routes back as labelled
 * buttons (never a tooltip carrying the meaning, FR-TT-2).
 */
import { useRouter } from "vue-router";
import { Upload } from "@lucide/vue";
import { Button } from "@mkbabb/glass-ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@mkbabb/glass-ui/card";

withDefaults(
    defineProps<{
        title?: string;
        description?: string;
        /** The server's diagnosis, shown verbatim when there is one. */
        detail?: string | null;
    }>(),
    {
        title: "Page not found",
        description: "Nothing lives at this address.",
        detail: null,
    },
);

const router = useRouter();
</script>

<template>
    <div class="flex flex-1 items-center justify-center py-4 px-[var(--page-gutter)]">
        <!-- X-DS pass 3 · DS-F3-C6: glass's `md` card, the gallery card's size;
             `sm` left the actions on the edge. X-DS fourier pass 9 · DS-F9C-C1:
             its pad takes the step above `md` (see the style) so the route-rung
             title has room. X-DS fourier pass 18 · DS-F18C-T2: the card takes
             its content's measure up to 28rem (a full 28rem left ~70px of empty
             slack beside left-set content); on a phone it still fills the gutter. -->
        <Card surface="opaque" size="md" class="not-found-card w-fit max-w-md" data-testid="not-found">
            <CardHeader>
                <!-- X-DS F4R · DS-F4R-C5: this h1 is the route's title, so it sets
                     on the route rung (see the style), not glass's card-title rung. -->
                <CardTitle as="h1" class="not-found-title">{{ title }}</CardTitle>
                <CardDescription>{{ description }}</CardDescription>
            </CardHeader>
            <CardContent v-if="detail">
                <!-- X-DS pass 1 · F1-16: the diagnosis on the caption rung, under the description. -->
                <p class="text-mono-small break-all text-muted-foreground">{{ detail }}</p>
            </CardContent>
            <!-- X-DS fourier pass 5 · DS-F5-C5: the quiet link's glyph edge is
                 the column's when it wraps to its own line (see the style). -->
            <CardFooter class="not-found-actions flex flex-wrap gap-2">
                <!-- A host that owns state to clear on the way out (the
                     workspace store) supplies its own actions. -->
                <slot name="actions">
                    <Button emphasis="primary" size="md" @click="router.push('/visualize')"><Upload />Upload a new image</Button>
                    <!-- X-DS pass 4 · DS-F4-C2: one grammar for "go back", as on the load
                         error and the empty stage: one primary and one quiet link. -->
                    <Button emphasis="text" size="sm" @click="router.push('/gallery')">Browse the gallery</Button>
                </slot>
            </CardFooter>
        </Card>
    </div>
</template>

<style scoped>
/* X-DS fourier pass 9 · DS-F9C-C1: the pad agrees with the title's rung. The
   h1 is on the route rung (display-1, DS-F4R-C5), but `md` pads for the
   card-title rung (`--space-body`, 12px), so the 42px title started 13px off
   the card's edges. Glass ships no `lg` Card, so the card takes its own pad
   token one ladder step up (`--space-family`, 20px; ORIGIN cards were p-4).
   Token only; the material and its edge are glass's. */
.not-found-card {
    --card-pad: var(--space-family);
}
/* X-DS F4R · DS-F4R-C5: the route's h1 is on ONE rung app-wide (display-1 at
   400; DS-F16-C2, as /morph's title and the stage messages). On the card-title
   rung at 600 it was the only bold title in the app. */
.not-found-title {
    font-size: var(--type-display-1);
    line-height: var(--type-leading-display);
    font-weight: 400;
    text-wrap: balance;
}
/* X-DS fourier pass 5 · DS-F5-C5: glass's text-emphasis Button keeps its
   `--space-residue` pad and 1px edge, so wrapped onto its own line at 390
   "Browse the gallery" started ~5 px right of the title and body. The link
   pulls back by exactly that inset, and the row's column gap grows by the
   same amount, so beside the primary the spacing is unchanged and, wrapped,
   the glyph sits on the card's text column. Layout only; glass's skin is
   untouched. */
/* X-DS fourier pass 19 · DS-F19C-N1: wrapped at 390, the quiet link's 44px
   coarse tap box centres a 20px line, so 12px of empty box sat on top of the
   card's bottom pad: the ink-to-edge inset read 23 against 9 at the top. The
   link keeps its whole tap box, but the box bleeds that slack out of layout on
   both block sides (so it stays centred in an unwrapped row), and the row gap
   takes the same amount back, so wrapped it never overlaps the primary above
   while its bottom slack lies inside the pad. The slack is read from glass's
   own sizing: the `sm` box is `--control-h-sm`, raised on coarse pointers to
   `--touch-target` by glass's `[data-control-target]` rule; the line is `1lh`
   on the link's own rung (the footer holds only buttons, which set their own
   type, so its font here is a measuring context only). Layout only. */
.not-found-actions {
    --text-link-inset: calc(var(--space-residue) + 1px);
    --text-link-box: var(--control-h-sm);
    --text-link-bleed: calc((var(--text-link-box) - 1lh) / 2);
    font-size: var(--control-text-sm);
    line-height: 1.1;
    column-gap: calc(0.5rem + var(--text-link-inset));
    row-gap: calc(0.5rem + var(--text-link-bleed));
}
@media (pointer: coarse) {
    .not-found-actions {
        --text-link-box: var(--touch-target, 2.75rem);
    }
}
.not-found-actions > [data-emphasis="text"] {
    margin-inline-start: calc(-1 * var(--text-link-inset));
    margin-block: calc(-1 * var(--text-link-bleed));
}
</style>
