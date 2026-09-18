<template>
    <div class="extractor-page">
        <h1>Shape Extractor (internal tool)</h1>

        <div class="subject-row">
            <!-- Sun SVG -->
            <div>
                <h2 :id="sunTitleId">Sun</h2>
                <svg
                    ref="sunSvgRef"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 200 200"
                    width="200"
                    height="200"
                    class="subject-svg"
                    role="img"
                    :aria-labelledby="sunTitleId"
                >
                    <g>
                        <!-- Rays -->
                        <polygon
                            :points="sunRayPoints.outerPoly"
                            fill="none"
                            stroke="red"
                            stroke-width="3"
                            stroke-linejoin="round"
                        />
                        <!-- Disc -->
                        <circle
                            cx="100"
                            cy="100"
                            r="48"
                            fill="none"
                            stroke="red"
                            stroke-width="3"
                        />
                        <!-- Golden spiral -->
                        <path
                            d="M100,100 C106,90 118,94 119,106 C121,122 105,130 90,124 C72,115 68,92 80,76 C96,56 126,56 138,76"
                            fill="none"
                            stroke="red"
                            stroke-width="3"
                            stroke-linecap="round"
                        />
                        <!-- Sparkle diamonds -->
                        <polygon
                            :points="sunSparklePoints[0]"
                            fill="none"
                            stroke="red"
                            stroke-width="2"
                        />
                        <polygon
                            :points="sunSparklePoints[1]"
                            fill="none"
                            stroke="red"
                            stroke-width="2"
                        />
                        <polygon
                            :points="sunSparklePoints[2]"
                            fill="none"
                            stroke="red"
                            stroke-width="2"
                        />
                        <!-- Tiny dots -->
                        <circle cx="30" cy="45" r="2" fill="red" />
                        <circle cx="55" cy="170" r="2.5" fill="red" />
                    </g>
                </svg>
            </div>

            <!-- Moon SVG -->
            <div>
                <h2 :id="moonTitleId">Moon</h2>
                <svg
                    ref="moonSvgRef"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 200 200"
                    width="200"
                    height="200"
                    class="subject-svg"
                    role="img"
                    :aria-labelledby="moonTitleId"
                >
                    <g>
                        <!-- Crescent -->
                        <path
                            d="M85,30 C40,40 15,90 35,140 C55,185 115,190 155,150 C120,165 70,145 60,95 C55,65 65,40 85,30 Z"
                            fill="none"
                            stroke="red"
                            stroke-width="3"
                            stroke-linejoin="round"
                        />
                        <!-- Inner stroke detail -->
                        <path
                            d="M75,45 C50,65 45,105 55,135"
                            fill="none"
                            stroke="red"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                        <!-- 5-point polygon stars -->
                        <polygon
                            :points="starPolygonPoints[0]"
                            fill="none"
                            stroke="red"
                            stroke-width="2"
                        />
                        <polygon
                            :points="starPolygonPoints[1]"
                            fill="none"
                            stroke="red"
                            stroke-width="2"
                        />
                        <polygon
                            :points="starPolygonPoints[2]"
                            fill="none"
                            stroke="red"
                            stroke-width="2"
                        />
                        <!-- Tiny dot stars -->
                        <circle cx="120" cy="30" r="2" fill="red" />
                        <circle cx="185" cy="35" r="2.5" fill="red" />
                        <circle cx="155" cy="75" r="1.5" fill="red" />
                    </g>
                </svg>
            </div>
        </div>

        <Button id="extract-btn" emphasis="primary" @click="extractAndOutput">
            Extract Shape Contours
        </Button>

        <!-- §2.K · FSE-D-8 — the output was an ANONYMOUS, UNANNOUNCED region:
             a bare `<pre>` that a keyboard user could not reach even though it
             scrolls, with no name and no announcement when it filled. It is now
             a named, focusable region with a polite live announcement of the
             OUTCOME rather than of the payload — a 128-point contour dump read
             aloud would be worse than silence, so the status line is the live
             text and the dump stays inside the region. -->
        <p id="extract-status" class="output-status" role="status">{{ status }}</p>
        <pre
            id="output"
            ref="outputRef"
            class="output-log"
            tabindex="0"
            role="region"
            aria-labelledby="extract-status"
        ></pre>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, useId } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { generateSunRays, wobbleDiamond, wobbleStarPolygon } from "@mkbabb/pencil-boil";
import { extractContours } from "@/lib/svg-contours";

const sunSvgRef = ref<SVGSVGElement | null>(null);
const moonSvgRef = ref<SVGSVGElement | null>(null);
/* FSE-M-5 — the owned-ref idiom, replacing `document.getElementById("output")`.
   A global id lookup from inside a component reaches whatever the document
   happens to hold, which on a route that can mount twice is not this instance. */
const outputRef = ref<HTMLElement | null>(null);
const status = ref("Not extracted yet.");
const sunTitleId = useId();
const moonTitleId = useId();

// Use seed 42 for canonical shapes (first frame = seed * 100 + 42 = 42)
const sunRayPoints = computed(() => generateSunRays(42));

const starPolygonPoints = computed(() => [
    wobbleStarPolygon(160, 20, 12, 5, 1),
    wobbleStarPolygon(135, 50, 10, 4, 2),
    wobbleStarPolygon(175, 65, 9, 3.5, 3),
]);

const sunSparklePoints = computed(() => [
    wobbleDiamond(35, 40, 6, 10, 10),
    wobbleDiamond(170, 45, 5, 8, 20),
    wobbleDiamond(55, 170, 5, 9, 30),
]);

function extractAndOutput() {
    if (!sunSvgRef.value || !moonSvgRef.value) return;

    const sunContours = extractContours(sunSvgRef.value, 128);
    const moonContours = extractContours(moonSvgRef.value, 128);

    const output = {
        sun: sunContours,
        moon: moonContours,
    };

    if (outputRef.value) {
        outputRef.value.textContent = JSON.stringify(output);
    }
    status.value = `Extracted ${sunContours.length} sun and ${moonContours.length} moon contours.`;
    // Also put it on window for Playwright to access
    (window as any).__fourierShapeData = output;
}

/* FSE-L-M4 — the mount timeout was never cancelled, so a route change inside
   200 ms ran the extractor against a torn-down tree. The handle is held and
   cleared on scope disposal. */
let mountTimer: ReturnType<typeof setTimeout> | undefined;

// Auto-extract on mount
onMounted(() => {
    // Small delay to ensure SVGs are rendered
    mountTimer = setTimeout(() => {
        mountTimer = undefined;
        extractAndOutput();
    }, 200);
});

onUnmounted(() => {
    if (mountTimer !== undefined) clearTimeout(mountTimer);
    /* FSE-M-12 — `window.__fourierShapeData` outlived the tool that wrote it:
       a production-bundled debug handle left holding two full contour sets on
       every route the user visited afterwards. It is released with the view. */
    delete (window as any).__fourierShapeData;
});
</script>

<style scoped>
/* §2.K · FSE-D-1 ⊕ FSE-M-4 — THE 375px AMPUTATION.

   The page was framed by inline literals: `padding: 2rem` on the root and a
   `display:flex` subject row with `gap: 2rem` and no wrap, holding two
   fixed 200px subjects. At 375px that is 200 + 32 + 200 + 64 = 496px of
   incompressible content in a 375px viewport, so the Moon was cut off — the
   certified capture shows the amputation at 508px, and `.g` measured this
   route overflowing `<main>` by 97px at 375×667 after the occlusion gate was
   re-pointed at the element that actually scrolls.

   The row wraps and the subjects shrink to the viewport. The subjects keep
   their 200px intrinsic size as a MAXIMUM, so nothing about the extraction
   geometry changes — `extractContours` reads the SVG's own user-space
   coordinates through `viewBox`, not its rendered box.

   ⊘ FSE-L-B1 — DO-NOT-REGENERATE. Nothing here re-runs the extractor against
   `master`, and `moon.json` is not regenerated (G-F4-NEG-ROSTER). M-10's RNG
   rider is not engaged because no L-B1/L-B2 cure is attempted: the generator
   calls, their order and their discarded draws are untouched, so the canonical
   sun cannot re-roll.

   FSE-D-9 — token discipline. The `#ccc` frame literal becomes the app's own
   border token. ⊘ The `stroke="red"` subject ink is deliberately LEFT: it is
   the extractor's high-contrast tracing ink, the row rules it passes, and
   tokenising it would make a debug instrument follow a theme it must not. */
.extractor-page {
    padding: 1rem;
}

@media (min-width: 640px) {
    .extractor-page {
        padding: 2rem;
    }
}

.subject-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 1.5rem 0;
}

@media (min-width: 640px) {
    .subject-row {
        gap: 2rem;
        margin: 2rem 0;
    }
}

.subject-svg {
    border: 1px solid var(--border);
    max-width: 100%;
    height: auto;
}

.output-status {
    margin-top: 1rem;
    color: var(--muted-foreground);
}

.output-log {
    margin-top: 0.5rem;
    max-height: 300px;
    overflow: auto;
    font-size: 0.75rem;
    /* The region is focusable (FSE-D-8), so it must show that it is. */
    border-radius: 0.375rem;
}

.output-log:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: 2px;
}
</style>
