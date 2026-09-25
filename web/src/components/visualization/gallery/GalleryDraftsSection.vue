<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import type { WorkspaceDraft } from "@/lib/types";
import { thumbnailUrl } from "@/lib/api";
import { useRelativeTime } from "@/lib/time";
import { basisChips } from "../lib/basis-display";
import { Upload } from "@lucide/vue";
import { Badge } from "@mkbabb/glass-ui/badge";
import { Button } from "@mkbabb/glass-ui/button";
import { Card } from "@mkbabb/glass-ui/card";

/**
 * X.F.W14U.gallery — the Drafts tab speaks the Gallery's card grammar.
 *
 * UIA-F-101: the container was a hand-rolled 10 px box with a literal border
 * width and alpha; every draft is now a glass Card (`--radius-card`).
 * UIA-F-189: the "My Drafts" disclosure repeated the tab it sat in, and
 * collapsing it left an empty page — it is gone; drafts render as cards with a
 * Draft badge, a thumbnail at the gallery's aspect and a fallback glyph when
 * the thumbnail fails (a broken image painted its alt text).
 * UIA-F-102: each card has ONE focusable primary action, a link to its
 * workspace (`/w/<imageSlug>`); Publish stays secondary.
 * UIA-F-103: only the draft being published is busy (glass Button `loading`:
 * aria-busy, still focusable); the others stay live, and the consumer's
 * colour class that pinned the disabled ink to the idle ink is gone.
 * UIA-F-190: a draft without a contour cannot be published, and says why.
 * UIA-F-248: hover lifts the card's cast one rung (glass's `--card-cast-rung`).
 */
const props = defineProps<{
    drafts: WorkspaceDraft[];
    /** The imageSlug of the draft being published, if any. */
    publishingSlug: string | null;
}>();

const emit = defineEmits<{
    publish: [draft: WorkspaceDraft];
}>();

const sortedDrafts = computed(() =>
    props.drafts
        .slice()
        .sort((a, b) => (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? "")),
);

/** The one shared ticking clock, applied per row (`lib/time.ts`). */
const relativeTimeOf = useRelativeTime();

/** The card's basis chips, in the gallery's one vocabulary (UIA-F-187). */
function basisOf(item: WorkspaceDraft) {
    return basisChips(item.animationSettings?.active_bases);
}

const brokenThumbs = ref(new Set<string>());
function markBroken(slug: string) {
    brokenThumbs.value = new Set(brokenThumbs.value).add(slug);
}
</script>

<template>
    <ul class="drafts-grid px-[var(--page-gutter)]" aria-label="Drafts">
        <li v-for="draft in sortedDrafts" :key="draft.imageSlug">
            <Card as="article" size="sm" shadow class="draft-card">
                <RouterLink :to="`/w/${draft.imageSlug}`" class="draft-open">
                    <span class="draft-media">
                        <img
                            v-if="!brokenThumbs.has(draft.imageSlug)"
                            :src="thumbnailUrl(draft.imageSlug)"
                            alt=""
                            loading="lazy"
                            @error="markBroken(draft.imageSlug)"
                        />
                        <span v-else class="font-serif-math text-2xl text-muted-foreground" aria-hidden="true">&Fscr;</span>
                    </span>
                    <span class="draft-title">{{ draft.imageSlug }}</span>
                </RouterLink>
                <div class="draft-meta">
                    <Badge variant="outline" size="sm">Draft</Badge>
                    <span v-for="b in basisOf(draft)" :key="b.label" class="whitespace-nowrap">{{ b.label }}</span>
                    <time
                        class="ml-auto whitespace-nowrap"
                        :datetime="relativeTimeOf(draft.lastOpenedAt).datetime"
                        :title="relativeTimeOf(draft.lastOpenedAt).absolute"
                    >{{ relativeTimeOf(draft.lastOpenedAt).text }}</time>
                </div>
                <div class="draft-actions">
                    <Button
                        emphasis="secondary"
                        size="sm"
                        class="gap-1"
                        :loading="publishingSlug === draft.imageSlug"
                        :disabled="!draft.contour"
                        :aria-describedby="draft.contour ? undefined : `draft-reason-${draft.imageSlug}`"
                        @click="emit('publish', draft)"
                    >
                        <Upload :size="14" aria-hidden="true" />
                        Publish
                    </Button>
                    <span
                        v-if="!draft.contour"
                        :id="`draft-reason-${draft.imageSlug}`"
                        class="text-xs text-muted-foreground"
                    >Open it to trace a contour first.</span>
                </div>
            </Card>
        </li>
    </ul>
</template>

<style scoped>
/* The gallery grid's own measure (GalleryInfiniteGrid). */
.drafts-grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    list-style: none;
    margin: 0;
}

.draft-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--card-gap);
    padding: var(--card-pad);
}
@media (hover: hover) {
    .draft-card:hover {
        --card-cast-rung: var(--glass-shadow-floating);
    }
}

.draft-open {
    display: flex;
    flex-direction: column;
    gap: var(--card-gap);
    border-radius: var(--radius-media);
    color: var(--foreground);
    text-decoration: none;
}
.draft-open:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: 2px;
}

.draft-media {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: var(--radius-media);
    background: var(--muted);
}
.draft-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.draft-title {
    font-size: 0.875rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.draft-meta,
.draft-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--muted-foreground);
}
</style>
