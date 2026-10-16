# AU.W7 — the blob trio [the user-ruled headline]

The user-ruled headline (CHARTER §3 W7, §1). The blob trio is the load-bearing carry
— AT's plan reads as if it shipped, but HEAD is still 3.2.0 with no `/goo-blob`
export (`deferred-lineage.md §10`, the adversarial trap). AU ships both primitives
onto the AU.W6 substrate with the third forced transposition (the injected
`ColorResolver` seam), then the W5 shader-quality wave onto the GAMMA shader. This is
ONE headline wave carrying the lift + the seam + the shader-quality SOTA — the
DEC-AT-7 GAMMA→LINEAR space-seam runs WITHIN it (lift = GAMMA, shader-quality stage =
LINEAR). The blob's ≥2 is value.js + a glass-ui demo story — NOT muster (its blob
interest is design-SURVEY, `deferred-lineage.md §10`).

## §Scope

### The primitives (onto the AU.W6 substrate)

1. **Lift watercolor-dot (#2) — `/watercolor-dot` + `useWatercolorBlob` + internalized
   SVG filter + `prng` leaf.** The sibling of goo-blob, sharing the injected-color
   seam. The SVG filter is INTERNALIZED (auto-mounted, namespaced, zero-wiring,
   DEC-AT-3) — mount the component and the filter just works. The `prng` leaf is
   hoisted (seeded, deterministic).

2. **Lift goo-blob (#1) — `/goo-blob` + `useMetaballRenderer` + `metaball.{vert,frag}.glsl`
   onto the AU.W6 substrate (the headline).** The faithful lift paints **GAMMA sRGB**
   (HSV needed no OETF — DEC-AT-7's W4 space). This is the lift's declared space; the
   LINEAR flip is the shader-quality stage below.

### The seam (the third transposition, P1/P2)

3. **The `ColorResolver` injected seam (DEC-AT-2, CHARTER §1.2).** REQUIRED-injected;
   `defaultBlobColorResolver` is OPT-IN. The DOM-coupled 1×1-canvas `cssColorToRgb`
   probe is DELETED (P1, no alias) — REPLACED by the injected resolver, which THROWS
   BY NAME (`defaultBlobColorResolver`) on a no-resolver mount (the loud failure, not a
   silent gray default). value.js supplies its OWN `ColorResolver`; the demo story uses
   `defaultBlobColorResolver`. The seam is the proof the blob is substrate-shaped, not
   value.js-coupled.

4. **The demo story (#2, DEC-AT-5).** goo-blob's 2nd consumer is a glass-ui demo story
   — the `deriveAurora` precedent. value.js is the firm #1; the demo story is the
   honest #2 (muster NOT claimed). OFF the root barrel + OFF the value.js peer
   (DEC-AT-6).

### The shader-quality stage (the W5 wave, DEC-AT-7's LINEAR half)

5. **The five byte-isolated, individually-gated edits (DEC-AT-8) onto the goo-blob
   shader:** `fwidth` AA · Quilez quadratic `smin` · rotated-octave FBM · **OKLCh
   linear-flip + the mandatory `linearToSrgb()` OETF (the HEADLINE correctness bug —
   left implicit the blob ships too-dark AND the perceptual claim voids)** · exact
   Ottosson matrices + radians (the matrix-source trap, DEC-AT-10 — value.js's EXACT
   constants transposed column-major, NOT the LYGIA convenience matrices ~1e-4 off) ·
   hue-preserving gamut mapping. This stage flips `uBaseColor` to LINEAR and adds the
   `linearToSrgb()` output stage — DEC-AT-7's W5/LINEAR half closing the seam the lift
   opened at GAMMA.

## §HARD gates

Per CHARTER §3 W7: **`proof:blob-value-free` (two-tier: source-graph + dist; throw
names `defaultBlobColorResolver`) green; `proof:webgl-golden` (zero-perturb identity);
the 8-assertion CPU-equivalence over the TS port (1e-6, asymmetric witness `#3a7bd5`);
≥2 by value.js + the demo story.** Registered `gates.mjs`:

1. **`proof:blob-value-free`** (#1/#2, two-tier P6) — a SOURCE-graph gate
   (comment-stripped transitive walker over `/goo-blob` + `/watercolor-dot`) BENEATH a
   DIST-floor gate (`grep "@mkbabb/value.js" dist/goo-blob.js = 0`). No baked value.js
   default. **bite-check:** importing value.js into the blob's built path reddens the
   dist tier.

2. **`proof:no-value-default`** (#1, DEC-AT-2) — a no-resolver mount THROWS, naming
   `defaultBlobColorResolver` — NOT a silent gray default (the forbidden form, P6).
   **bite-check:** replacing the throw with a gray return reddens it.

3. **`proof:webgl-golden`** (DEC-AT-4) — promote `profile-aurora.mjs`: a zero-perturb
   blob render is byte-identical to a checked-in golden. Manual-visual SCOPED to
   `--blob-edge-glow-l` ONLY. **bite-check:** a 1-px shader regression reddens it.

4. **The 8-assertion CPU-equivalence gate** (`proof:blob-color-equivalence`,
   DEC-AT-4/8/10) — a TS port textually-parallel to the GLSL; 8 known color round-trips
   through OKLCh→linear→sRGB match value.js's CPU result to 1e-6; the witness is
   asymmetric (`#3a7bd5`) so a transpose OR source-matrix error DIVERGES.
   **bite-check 1:** the LYGIA convenience matrix reddens it (~1e-4 off). **bite-check
   2:** removing `linearToSrgb()` reddens it (too-dark — the OETF correctness under
   test).

5. **The DEC-AT-7 space-seam, asserted per stage.** `proof:blob-space-gamma` (the
   lift paints GAMMA, no premature linear flip) co-runs with the equivalence gate (the
   shader-quality stage paints LINEAR with `linearToSrgb()`). The two together prove
   the space is NAMED per stage, never defaulted. Premultiplied-alpha asserted.

inv ε: each gate is a passing instrument + a named bite-inject. The equivalence gate is
RED if the matrix is the convenience one OR the OETF stage is absent — both are the
named traps. The seam gates prove the space was named per stage.

## §The seam (DEC-AT-7, load-bearing)

Lift = GAMMA (the faithful lift, HSV no OETF). Shader-quality stage = LINEAR (the
OKLCh flip + `linearToSrgb()`). Left implicit, the blob ships visibly too-dark AND the
perceptual-uniformity claim voids. This is the one design decision an AU executor
cannot rediscover from the code; carried verbatim. After the stage, the blob is
perceptually-uniform AND gamma-correct.

## §No-legacy + anti-gold-plating

The 1×1-canvas `cssColorToRgb` DOM probe DELETED (P1), replaced by the throwing
injected resolver. The five shader edits REPLACE their naive predecessors — no "fast"
and "correct" shader paths; ONE quality level (the correct one). The blobs are OFF the
root barrel (DEC-AT-6). The shader-quality wave is the CEILING — analytic-derivative
noise, exponential smin, raymarching, a binding Playwright golden are BOOKED, NOT
folded (AT.md §BOOK). The golden is `profile-aurora.mjs`-promoted, not a new Playwright
binding.
