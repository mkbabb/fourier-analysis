<script setup lang="ts">
import { computed } from "vue";
import type { GalleryEntry } from "@/lib/types";
import GalleryCard from "./GalleryCard.vue";

const props = defineProps<{
    entries: GalleryEntry[];
    adminMode?: boolean;
    likedHashes?: Set<string>;
}>();

const emit = defineEmits<{
    "card-click": [entry: GalleryEntry];
    like: [hash: string];
    "set-tier": [hash: string, tier: "featured" | "saved" | "normal"];
    delete: [hash: string];
}>();

const tracks = computed(() => {
    const result: GalleryEntry[][] = [[], []];
    props.entries.forEach((e, i) => result[i % 2].push(e));
    return result;
});
</script>

<template>
    <div v-if="entries.length >= 4" class="marquee-container">
        <div
            v-for="(track, tIdx) in tracks"
            :key="tIdx"
            class="marquee-track"
            :class="tIdx % 2 === 0 ? 'marquee-left' : 'marquee-right'"
        >
            <div class="marquee-inner">
                <div
                    v-for="entry in track"
                    :key="entry.snapshot_hash"
                    class="marquee-item"
                >
                    <GalleryCard
                        :entry="entry"
                        :admin-mode="adminMode"
                        :liked-hashes="likedHashes"
                        @click="emit('card-click', entry)"
                        @like="emit('like', $event)"
                        @set-tier="(h, t) => emit('set-tier', h, t)"
                        @delete="emit('delete', $event)"
                    />
                </div>
                <!-- Duplicate for seamless loop -->
                <div
                    v-for="entry in track"
                    :key="'dup-' + entry.snapshot_hash"
                    class="marquee-item"
                    aria-hidden="true"
                >
                    <GalleryCard
                        :entry="entry"
                        :admin-mode="adminMode"
                        :liked-hashes="likedHashes"
                        @click="emit('card-click', entry)"
                        @like="emit('like', $event)"
                        @set-tier="(h, t) => emit('set-tier', h, t)"
                        @delete="emit('delete', $event)"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.marquee-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.5rem 0;
}

.marquee-track {
    overflow: clip;
    /* Generous vertical padding so hover scale/translate stays inside the mask */
    padding: 0.75rem 0;
    /* Horizontal-only fade: tall vertical extent keeps top/bottom unclipped */
    mask: linear-gradient(to right, transparent, black 3rem, black calc(100% - 3rem), transparent)
          0 -50% / 100% 200%;
    -webkit-mask: linear-gradient(to right, transparent, black 3rem, black calc(100% - 3rem), transparent)
          0 -50% / 100% 200%;
}

.marquee-inner {
    display: flex;
    gap: 1rem;
    width: max-content;
    will-change: transform;
}

.marquee-track:hover .marquee-inner {
    animation-play-state: paused !important;
}

.marquee-left .marquee-inner {
    animation: marquee-scroll-left 45s linear infinite;
}

.marquee-right .marquee-inner {
    animation: marquee-scroll-right 50s linear infinite;
}

.marquee-item {
    flex-shrink: 0;
    width: 220px;
    padding: 0.25rem 0;
}

@keyframes marquee-scroll-left {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
}

@keyframes marquee-scroll-right {
    from { transform: translateX(-50%); }
    to { transform: translateX(0); }
}
</style>
