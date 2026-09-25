<template>
    <!-- X.F.W14U.misc — UIA-F-211: a centred, bounded column (it sat flush left
         under a centred dock with half the desktop empty); the title on the
         display rung, the subject names on the heading rung; each subject framed
         by a glass Card instead of a hand-rolled square. -->
    <div class="extractor-page">
        <header class="extractor-header">
            <h1>Shape extractor</h1>
            <p class="extractor-lede">Internal tool: traces the morph demo's sun and moon into contour data.</p>
        </header>

        <div class="subject-row">
            <!-- Sun SVG -->
            <Card size="sm" class="subject-card">
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
            </Card>

            <!-- Moon SVG -->
            <Card size="sm" class="subject-card">
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
            </Card>
        </div>

        <!-- §2.K · FSE-D-8 — the output is a named, focusable region with a
             polite live announcement of the OUTCOME rather than of the payload
             (a 128-point contour dump read aloud would be worse than silence).
             X.F.W14U.misc — UIA-F-118: the dump was one unwrapped 24,047-char
             line in an 18px-tall `<pre>` with no surface; it is pretty-printed
             into a holder on a glass Card at the field radius, with a Copy
             action. UIA-F-255: each run reports itself in the status line (a
             second press looked like nothing happened), and the region wears
             glass's one focus ring. -->
        <Card size="sm" class="output-card">
            <div class="output-bar">
                <Button id="extract-btn" emphasis="primary" size="sm" @click="extractAndOutput">
                    Extract shape contours
                </Button>
                <Button emphasis="secondary" size="sm" :disabled="!output" @click="copyOutput">
                    <component :is="copyStatus === 'success' ? Check : ClipboardCopy" />
                    {{ copyStatus === "success" ? "Copied" : "Copy" }}
                </Button>
            </div>
            <p id="extract-status" class="output-status" role="status">{{ status }}</p>
            <pre
                id="output"
                class="output-log focus-ring"
                tabindex="0"
                role="region"
                aria-labelledby="extract-status"
            >{{ output }}</pre>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, useId } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Card } from "@mkbabb/glass-ui/card";
import { useClipboard } from "@mkbabb/glass-ui";
import { Check, ClipboardCopy } from "@lucide/vue";
import { generateSunRays, wobbleDiamond, wobbleStarPolygon } from "@mkbabb/pencil-boil";
import { extractContours } from "@/lib/svg-contours";

const sunSvgRef = ref<SVGSVGElement | null>(null);
const moonSvgRef = ref<SVGSVGElement | null>(null);
/* FSE-M-5 — the owned-ref idiom replaced `document.getElementById("output")`.
   X.F.W14U.misc — UIA-F-118: the region now renders the pretty-printed text
   itself (`{{ output }}`), so no element ref is written to. */
const output = ref("");
const runs = ref(0);
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

    const data = {
        sun: sunContours,
        moon: moonContours,
    };

    output.value = JSON.stringify(data, null, 2);
    runs.value += 1;
    status.value = `Run ${runs.value}: extracted ${sunContours.length} sun and ${moonContours.length} moon contours.`;

    // UIA-F-255: the Playwright hook is a development affordance; production
    // bundles never publish it.
    if (import.meta.env.DEV) (window as any).__fourierShapeData = data;
}

/* UIA-F-118 — Copy reports its outcome in the status line (the button's face
   says Copied; a refusal says why). */
const { status: copyStatus, copy } = useClipboard({ resetMs: 1500 });

async function copyOutput() {
    const result = await copy(output.value);
    if (!result.ok) status.value = "Copying failed. Select the output and copy it manually.";
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
    width: 100%;
    max-width: 56rem;
    margin-inline: auto;
    padding: var(--space-body);
    box-sizing: border-box;
}

@media (min-width: 640px) {
    .extractor-page {
        padding: var(--space-family);
    }
}

/* X.F.W14.h · OA-45 ⊕ X.F.W14U.misc — UIA-F-211: the tool's hierarchy on
   glass's type scale — the title on the display rung, the lede on body, the
   subject names on the heading rung. */
.extractor-header {
    margin-bottom: var(--space-family);
}

.extractor-page h1 {
    font-family: var(--font-serif);
    font-size: var(--type-display-2);
    line-height: var(--type-leading-display);
    font-weight: 400;
    margin-bottom: var(--space-atom);
}

.extractor-lede {
    font-size: var(--type-body);
    line-height: var(--type-leading-body);
    color: var(--muted-foreground);
}

.extractor-page h2 {
    font-family: var(--font-serif);
    font-size: var(--type-heading);
    line-height: var(--type-leading-heading);
    font-weight: 600;
    margin-bottom: var(--space-atom);
}

.subject-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-body);
    margin-bottom: var(--space-family);
}

.subject-card {
    padding: var(--space-body);
}

.subject-svg {
    display: block;
    max-width: 100%;
    height: auto;
}

.output-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-atom);
    padding: var(--space-body);
}

.output-bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-atom);
}

.output-status {
    font-size: var(--type-small);
    line-height: var(--type-leading-small);
    color: var(--muted-foreground);
}

/* UIA-F-118: a multi-line holder at the field radius, on the card's inset
   ground; long lines scroll inside it rather than wrapping numbers apart. */
.output-log {
    min-height: 10rem;
    max-height: 24rem;
    overflow: auto;
    padding: var(--space-atom) var(--space-body);
    font-family: var(--font-mono);
    font-size: var(--type-caption);
    line-height: var(--type-leading-caption);
    border-radius: var(--radius-field);
    background: var(--muted);
}
</style>
