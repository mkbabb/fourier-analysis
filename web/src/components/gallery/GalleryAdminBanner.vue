<script setup lang="ts">
import { computed, nextTick, useTemplateRef } from "vue";
import type { AdminStats } from "@/lib/types";
import { Shield, LogOut, AlertTriangle } from "@lucide/vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Card } from "@mkbabb/glass-ui/card";
import { Metric } from "@mkbabb/glass-ui/metric";

const props = defineProps<{
    stats: AdminStats | null;
    loading: boolean;
    error?: string | null;
}>();

const emit = defineEmits<{
    logout: [];
}>();

/**
 * X·F F.W4 `.d` — GAB-14: `formatBytes` mis-rendered at BOTH binary boundaries.
 *
 * Each arm tested the RAW count and then formatted the DIVIDED value, so
 * 1048575 read `1024.0 KB` and 1073741823 read `1024.0 MB`; there was no TB arm
 * (1099511627776 read `1024.00 GB`) and `NaN` read `NaN GB`. The unbounded
 * `$sum` over `db.images` makes all four reachable. The unit ladder is walked
 * once, so a boundary cannot land in two arms, and the value is emitted APART
 * from its unit (GAB-7): `unit` is the producer's own baseline-aligning slot,
 * and this file was the directory's sole concatenator — typesetting " MB" as a
 * numeral through `tabular-nums`, which pins letterforms to digit widths.
 */
/**
 * X.F.W14U.admin — UIA-F-249: the failure sentence states what failed and the
 * server's own detail, punctuated; it no longer blames the credential for every
 * failure (a timeout, a 500, an offline network all read "dead credential").
 */
const errorSentence = computed(() => {
    const detail = props.error?.trim() ?? "";
    if (!detail) return "Admin statistics could not be loaded.";
    return `Admin statistics could not be loaded: ${detail}${/[.!?]$/.test(detail) ? "" : "."}`;
});

/**
 * X.F.W14U.admin — UIA-F-192: Log out unmounts this banner (and the button),
 * so focus fell to `<body>`. The stable neighbour is the block mounted before
 * the banner — the gallery's tabs and search, which outlive admin mode.
 */
const root = useTemplateRef<InstanceType<typeof Card>>("root");
const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

async function logout() {
    const neighbour = (root.value?.$el as HTMLElement | undefined)?.previousElementSibling as HTMLElement | null;
    emit("logout");
    await nextTick();
    neighbour?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
}

const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

const storage = computed<{ value: string; unit: string }>(() => {
    const bytes = props.stats?.storage_bytes;
    if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) {
        return { value: "—", unit: "" };
    }
    let n = bytes;
    let i = 0;
    while (n >= 1024 && i < UNITS.length - 1) {
        n /= 1024;
        i += 1;
    }
    return {
        value: i === 0 ? String(Math.round(n)) : n.toFixed(n < 10 ? 2 : 1),
        unit: UNITS[i],
    };
});
</script>

<template>
    <!-- GAB-4 / GAB-10: the box STAYS. `adminStatsLoading` is set true before the
         await with `stats` already populated, so `(stats && !loading)` — the only
         branch this component had — unmounted the whole six-tile grid on every
         setTier and every batch action, inside the page's own scroller, with no
         announcement of any kind. The tiles now hold their geometry and report
         their own busy state through the primitive's `loading` posture, and the
         cluster announces itself through one live region. -->
    <!-- X.F.W14V.u3 — UIA-F-149 (consumer half): the banner was a hand-rolled
         10 px box (`rounded-lg`) holding 16 px Metric cells, so the nested
         radius inverted the concentric law. It is a glass Card, on the card
         radius (`--radius-card`), so no cell is rounder than its container.
         The cell radius derived from `--radius-ctx` less the inset is glass's
         half (O-59). -->
    <Card
        ref="root"
        as="section"
        size="sm"
        class="admin-banner mx-[var(--page-gutter)] px-3 py-2.5 border-[1.5px]"
        aria-label="Admin mode banner"
        :aria-busy="loading || undefined"
    >
        <div class="flex items-center gap-1.5 mb-2">
            <Shield :size="16" class="admin-banner__mark" aria-hidden="true" />
            <span class="font-serif-math text-small font-semibold tracking-tight">Admin Mode</span>
            <Button
                emphasis="secondary"
                size="sm"
                class="ml-auto gap-1"
                @click="logout"
            >
                <LogOut :size="14" aria-hidden="true" />
                Exit admin mode
            </Button>
        </div>

        <!-- GAB-3: loading, failed and loaded-never rendered identically as
             NOTHING. The failure arm is INLINE (⊘ never a toast — the spine's own
             ⊘, and the toast adapter is F.W1's), and it says what a dead
             credential means for the surface still enabled below it. -->
        <p
            v-if="error"
            role="alert"
            class="flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5 text-caption"
        >
            <AlertTriangle class="mt-px h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden="true" />
            <span>{{ errorSentence }}</span>
        </p>

        <!-- X.F.W14U.admin — UIA-F-105 (consumer half): below `sm` the six
             cells sit two to a row, wide enough that no label or number splits
             ("ENTRI/ES", "70./0"); from `sm` up the auto-fit strip is unchanged.
             The glass half (Metric's `overflow-wrap: anywhere`) rides O-59. -->
        <div
            v-else
            class="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(5rem,1fr))]"
        >
            <!-- GAB-6 / GAB-19 / GAB-27: `.admin-stat` is gone. Its six unlayered
                 scoped declarations beat the primitive's own `@layer components`
                 recipe and half-neutralised it — re-declaring the geometry the
                 stacked arm already ships, silently overriding its documented
                 `flex-start`, and requesting six backdrop-filter compositing
                 layers over a uniform 4% wash. `posture="cell"` IS the tile seat
                 at the adopted pin (the ruled seat, GAB-2/K-4), so the producer
                 draws the plate and the consumer stops fighting it.

                 GAB-8: `compact` is the abbreviating formatter, and it lands WITH
                 the separators it would otherwise worsen — the cure-coupling lock.
                 Raw counts inside `truncate` inside an un-overridden
                 `overflow: hidden` could render a DIFFERENT number, unsignalled. -->
            <Metric
                :value="stats?.total_entries"
                :loading="loading"
                compact
                placeholder="—"
                label="entries"
                posture="cell"
                size="md"
            />
            <!-- GAB-22: the hard-coded `#fbbf24`/`#60a5fa` fallbacks had drifted
                 from the tokens they shadowed in both arms and would have pinned a
                 light-arm sRGB value if they ever fired. Only the STALE HEX was
                 ever the defect; the drift-proof idiom is the `text-tier-*` bridge
                 class, which is what the sibling card already uses. -->
            <Metric
                :value="stats?.featured"
                :loading="loading"
                compact
                placeholder="—"
                label="featured"
                posture="cell"
                size="md"
                class="text-tier-featured"
            />
            <Metric
                :value="stats?.saved"
                :loading="loading"
                compact
                placeholder="—"
                label="saved"
                posture="cell"
                size="md"
                class="text-tier-saved"
            />
            <Metric
                :value="stats?.total_views"
                :loading="loading"
                compact
                placeholder="—"
                label="views"
                posture="cell"
                size="md"
            />
            <Metric
                :value="stats?.total_likes"
                :loading="loading"
                compact
                placeholder="—"
                label="likes"
                posture="cell"
                size="md"
            />
            <Metric
                :value="storage.value"
                :unit="storage.unit"
                :loading="loading"
                placeholder="—"
                label="storage"
                posture="cell"
                size="md"
            />
        </div>

        <!-- GAB-10(a): the stat cluster appeared, disappeared and changed with
             zero announcement — no aria-live, status or aria-busy in this file or
             any GalleryView ancestor. One permanently-mounted region, outside
             every gate, is the shape that actually fires. -->
        <p class="sr-only" role="status" aria-live="polite">
            {{
                error
                    ? "Admin statistics unavailable."
                    : loading
                      ? "Refreshing admin statistics."
                      : stats
                        ? `Admin statistics updated: ${stats.total_entries} entries, ${stats.featured} featured, ${stats.saved} saved.`
                        : ""
            }}
        </p>
    </Card>
</template>

<style scoped>
/* GAB-1 (BLOCKER) ⊕ GAB-18 — the one amber surface in the app that bypassed the
   app's own calibrated amber.

   The chassis was raw `border-amber-500/30` over `bg-amber-500/[0.04]` with an
   `amber-400` glyph: plate against page 1.03:1, border 1.25–1.27:1, shield
   1.60:1 — against a 3:1 non-text floor, in the DEFAULT light arm (the app seeds
   its own theme from `index.html`). There was no admin register at all; the
   colour chosen to mark the mode was invisible in it.

   `--viz-amber` is the repo's OWN ratified axe-contrast carry (`style.css`: the
   light value is darkened to hsl(35 76% 35%) ≈ 4.6:1 precisely because glass-ui's
   3.54:1 failed AA) — and `amber-400`, the value this file used, is LIGHTER than
   the value the project had already rejected. Composing the plate, the border and
   the mark off that token is GAB-18's cure and GAB-1's in one act.

   ⊘ The two tier numerals are NOT retinted here: `--tier-featured` (1.45:1) and
   `--tier-saved` (2.58:1) are producer registers whose light rebaseline is a
   GLASS-RELAY ask (collected for `.z`'s letter, GAB-9/GAB-2's ask (a)). Painting
   a local value over them would be the frontend hack §5.1(6) forbids.

   ⊘ Measured at this seat against the light page (`--background` hsl(40 30% 98%),
   `--viz-amber` hsl(35 76% 35%)): the border at FULL token strength reads
   ≈4.72:1 and the mark the same — both clear of the 3:1 non-text floor, where the
   `amber-500/30` border read 1.25–1.27 and the `amber-400` shield 1.60. The plate
   is a WASH and stays one: a 4%- or 10%-alpha fill cannot reach 3:1 against the
   page and remain a wash, so the admin register is carried by the border and the
   mark, which are the marks that can carry it. That is a reading, not an excuse —
   the `GAB-1[plate/page]` pair is named RED-with-cause in this unit's receipt. */
.admin-banner {
    border-color: var(--viz-amber);
    background: color-mix(in srgb, var(--viz-amber) 10%, transparent);
}

.admin-banner__mark {
    color: var(--viz-amber);
}
</style>
