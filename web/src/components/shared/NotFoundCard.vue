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
        <Card class="w-full max-w-md" data-testid="not-found">
            <CardHeader>
                <CardTitle as="h1">{{ title }}</CardTitle>
                <CardDescription>{{ description }}</CardDescription>
            </CardHeader>
            <CardContent v-if="detail">
                <p class="fira-code break-all text-muted-foreground">{{ detail }}</p>
            </CardContent>
            <CardFooter class="flex flex-wrap gap-2">
                <!-- A host that owns state to clear on the way out (the
                     workspace store) supplies its own actions. -->
                <slot name="actions">
                    <Button emphasis="primary" @click="router.push('/visualize')">Upload a new image</Button>
                    <Button emphasis="secondary" @click="router.push('/gallery')">Browse the gallery</Button>
                </slot>
            </CardFooter>
        </Card>
    </div>
</template>
