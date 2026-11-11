# @mkbabb/fourier

The Fourier series of a closed curve, in a few small functions: take a curve's
spectrum, draw any partial sum of it, walk its epicycle chain, and (on a
server) ask [fourier.babb.dev](https://fourier.babb.dev)'s API to turn an image
into one. It's the engine the fourier web app runs on. No dependencies.

```sh
npm install @mkbabb/fourier
```

## The spectrum

A `Spectrum` is one closed curve z(θ) = Σ c_k e^{2πikθ}, θ in [0, 1), with
x = Re z and y = Im z. The coefficients are stored flat, in frequency order:

```
c = [re0, im0, re+1, im+1, re-1, im-1, re+2, im+2, re-2, im-2, ...]   // up to ±top
```

`n`, when present, is N_c: the fewest harmonics whose partial sum sits within a
small tolerance of the whole band. This is the one shape everywhere, from the
API's JSON to the arrays you draw with.

## Drawing a curve

```ts
import { partialSum, resampleArcLength, spectrumOf, svgPathOf } from "@mkbabb/fourier";

// Points are flat too: [x0, y0, x1, y1, ...].
const outline = resampleArcLength(points, 1024);
const s = spectrumOf(outline, 200);

// The curve with its first 12 harmonics, at 512 points, as an SVG path.
const d = svgPathOf(partialSum(s, 12, 512));
```

`partialSum` takes a fractional level. The pair ±k fades in as the level moves
from k − 1 to k, so animating the level from 0 to N writes the curve in one term
at a time, and nothing pops.

## The epicycle chain

```ts
import { chainAt, evaluateAt } from "@mkbabb/fourier";

const tip = evaluateAt(s, t);          // [x, y] at θ = t
const chain = chainAt(s, t, 40);       // [0, 0, x1, y1, ...]: the 40 largest circles, largest first
```

## The lens

`nearestParam` finds where a point sits along a sampled curve, and `lensBlend`
lets the curve give way to a lower partial sum of itself in a small window
around that spot. Near the pointer the drawing loses detail; at depth 0 it is
exactly the rest form.

## Frame loop

`frameLoop(el, tick)` runs `tick(dtMs, nowMs)` once per frame, only while the
page is visible and `el` is on screen, with the step capped (50 ms by default)
so a tab that comes back doesn't jump. Return `false` from `tick` to stop.

## The API client

The client calls the API's two token routes. A token is a secret: use the
client from a server, a build step or a script, and never put a token in code a
browser loads.

```ts
import { createFourierClient } from "@mkbabb/fourier/client";

const fourier = createFourierClient({ baseUrl: "https://api.fourier.babb.dev", token: process.env.FOURIER_TOKEN! });

const { contour, spectrum } = await fourier.spectrumOfImage(imageBlob, { n_harmonics: 300 });
const s = await fourier.spectrumOfContour({ x, y }, { nHarmonics: 100 });
```

A non-2xx answer throws `FourierApiError` with its `status`, the
problem+json body as `problem`, and for a 429 the wait the server asked for as
`retryAfterS`. Nothing is retried for you. Each token has its own rate (10 calls
a minute unless it was minted with another), and the routes store nothing: no
image, no contour, no session.

Tokens are minted by the site's admin, under Gallery, Tokens.

## Versions

0.x minors may break; pin an exact version. The API's major version is in its
path (`/api/v1/`).

The Python library in [fourier-analysis](https://github.com/mkbabb/fourier-analysis)
is the reference: `spectrumOf`, `partialSum`, `evaluateAt` and `chainAt` are
held equal to it within 1e-9 by golden fixtures.
