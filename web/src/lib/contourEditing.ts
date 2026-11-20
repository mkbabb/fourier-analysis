export interface Point2D {
    x: number;
    y: number;
}

/** Convert separate x/y arrays to Point2D array */
export function zipPoints(xs: number[], ys: number[]): Point2D[] {
    return xs.map((x, i) => ({ x, y: ys[i] }));
}

/** Convert Point2D array to separate x/y arrays */
export function unzipPoints(points: Point2D[]): { x: number[]; y: number[] } {
    return {
        x: points.map((p) => p.x),
        y: points.map((p) => p.y),
    };
}

/**
 * Generate SVG path `d` attribute for a closed Catmull-Rom spline.
 *
 * X.F.W4 · `fr-ContourPreview` CP-36 — the `tension` parameter is deleted, not
 * defaulted. It was accepted, typed and never read: the control-point factor
 * below is the hard-coded `1/6` of the uniform Catmull-Rom form, so passing a
 * tension did nothing at any of the callsites. A knob that cannot turn is a lie
 * about the API, and it was also the `noUnusedLocals` violation at
 * `contourEditing.ts(20,53)` (G-F4-VUE-TSC-CLEAN). No callsite passed one.
 */
export function closedSplinePath(points: Point2D[]): string {
    const n = points.length;
    if (n < 2) return "";
    if (n === 2)
        return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}Z`;

    const parts: string[] = [`M${points[0].x},${points[0].y}`];
    for (let i = 0; i < n; i++) {
        const p0 = points[(i - 1 + n) % n];
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        const p3 = points[(i + 2) % n];

        const factor = 1 / 6;
        const cp1x = p1.x + (p2.x - p0.x) * factor;
        const cp1y = p1.y + (p2.y - p0.y) * factor;
        const cp2x = p2.x - (p3.x - p1.x) * factor;
        const cp2y = p2.y - (p3.y - p1.y) * factor;

        parts.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
    }
    parts.push("Z");
    return parts.join("");
}

/**
 * The closed spline `closedSplinePath` draws through `points`, sampled at
 * `count` points evenly spaced along its length, starting at `points[0]`.
 *
 * Two outlines with different point counts (an outline and its simplified
 * form) have no point-for-point correspondence; sampled this way, both are
 * the same number of points in the same order along the curve, so one can be
 * blended into the other (`blendClosed`).
 */
export function sampleClosedSpline(points: Point2D[], count: number): Point2D[] {
    const n = points.length;
    if (n === 0 || count < 1) return [];
    if (n < 3) return Array.from({ length: count }, (_, i) => ({ ...points[i % n] }));

    // The spline's segments, each flattened into a few chords.
    const STEPS = 8;
    const dense: Point2D[] = [];
    for (let i = 0; i < n; i++) {
        const p0 = points[(i - 1 + n) % n];
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        const p3 = points[(i + 2) % n];
        const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
        const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
        for (let s = 0; s < STEPS; s++) {
            const t = s / STEPS;
            const u = 1 - t;
            const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
            dense.push({
                x: a * p1.x + b * c1.x + c * c2.x + d * p2.x,
                y: a * p1.y + b * c1.y + c * c2.y + d * p2.y,
            });
        }
    }

    // Cumulative length around the closed polyline, back to the start.
    const m = dense.length;
    const at = new Float64Array(m + 1);
    for (let i = 0; i < m; i++) {
        const q = dense[i];
        const r = dense[(i + 1) % m];
        at[i + 1] = at[i] + Math.hypot(r.x - q.x, r.y - q.y);
    }
    const total = at[m];
    if (total === 0) return Array.from({ length: count }, () => ({ ...dense[0] }));

    const out: Point2D[] = [];
    let j = 0;
    for (let k = 0; k < count; k++) {
        const want = (k / count) * total;
        while (j < m - 1 && at[j + 1] < want) j++;
        const span = at[j + 1] - at[j];
        const f = span > 0 ? (want - at[j]) / span : 0;
        const q = dense[j];
        const r = dense[(j + 1) % m];
        out.push({ x: q.x + (r.x - q.x) * f, y: q.y + (r.y - q.y) * f });
    }
    return out;
}

/**
 * `to` turned (cyclically) so that it starts at its point nearest `from[0]`:
 * an edit that drops the first point (Simplify can) still blends each part of
 * the outline into its own new place, not into a neighbour's.
 */
export function alignClosed(to: Point2D[], from: Point2D[]): Point2D[] {
    if (!to.length || !from.length) return to;
    const o = from[0];
    let best = 0;
    let bestD = Infinity;
    to.forEach((p, i) => {
        const d = (p.x - o.x) ** 2 + (p.y - o.y) ** 2;
        if (d < bestD) {
            bestD = d;
            best = i;
        }
    });
    return best === 0 ? to : [...to.slice(best), ...to.slice(0, best)];
}

/** The point-for-point blend of two equal-length outlines, `t` = 0 at `from`, 1 at `to`. */
export function blendClosed(from: Point2D[], to: Point2D[], t: number): Point2D[] {
    return from.map((p, i) => ({ x: p.x + (to[i].x - p.x) * t, y: p.y + (to[i].y - p.y) * t }));
}

/** A closed polyline through `points` as an SVG path `d`. */
export function closedPolylinePath(points: Point2D[]): string {
    if (points.length < 2) return "";
    return `M${points.map((p) => `${p.x},${p.y}`).join("L")}Z`;
}

/** Find the nearest segment index for inserting a new point */
export function nearestSegmentIndex(points: Point2D[], click: Point2D): number {
    let bestDist = Infinity;
    let bestIdx = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
        const a = points[i];
        const b = points[(i + 1) % n];
        const dist = pointToSegmentDist(click, a, b);
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i + 1;
        }
    }
    return bestIdx;
}

function pointToSegmentDist(p: Point2D, a: Point2D, b: Point2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Visvalingam-Whyatt simplification for closed curves — heap-driven.
 *
 * Each interior triangle's area lives in an indexed binary min-heap keyed
 * by the node index. Extracting the minimum, splicing the node from the
 * circular doubly linked list, and re-keying the two neighbours is
 * O(log n) per removal, yielding O(n log n) overall. The prior
 * implementation scanned the full node array on every removal: O(n²) on
 * each call and effectively O(n³) when removal fractions scale with n.
 *
 * Storage is parallel typed arrays — Float64Array for coordinates and
 * triangle areas, Int32Array for the prev/next linked-list pointers and
 * the indexed-heap permutation, Uint8Array for the live-flag bitmap.
 * Avoiding per-node object allocations keeps the inner loop in a tight
 * cache-friendly working set.
 *
 * On the heap re-key strategy: strict VW lifts a node's recomputed area
 * to its parent's area whenever the former is smaller (preserving the
 * total ordering of removal). The unrestricted form — used here — simply
 * re-keys to the recomputed triangle area. For resampled contours the
 * visual difference is imperceptible whilst the implementation is
 * substantially simpler.
 */
export function simplifyClosedPoints(
    points: Point2D[],
    removalFraction = 0.2,
): Point2D[] {
    if (points.length <= 6) return points;

    const n = points.length;
    const toRemove = Math.max(1, Math.floor(n * removalFraction));
    const targetCount = Math.max(4, n - toRemove);

    // Circular linked list as parallel arrays (cache-friendly; no Node objects)
    const px = new Float64Array(n);
    const py = new Float64Array(n);
    const prev = new Int32Array(n);
    const next = new Int32Array(n);
    const area = new Float64Array(n);
    const alive = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        px[i] = points[i].x;
        py[i] = points[i].y;
        prev[i] = (i - 1 + n) % n;
        next[i] = (i + 1) % n;
        alive[i] = 1;
    }

    const triArea = (i: number): number => {
        const a = prev[i], c = next[i];
        return Math.abs((px[i] - px[a]) * (py[c] - py[a]) - (px[c] - px[a]) * (py[i] - py[a])) * 0.5;
    };
    for (let i = 0; i < n; i++) area[i] = triArea(i);

    // Indexed binary min-heap over node indices. `pos[i]` is the position of
    // node `i` in `heap`; `-1` signals "not in heap" (already extracted).
    const heap = new Int32Array(n);
    const pos = new Int32Array(n);
    let heapSize = n;
    for (let i = 0; i < n; i++) { heap[i] = i; pos[i] = i; }

    const swap = (a: number, b: number) => {
        const ia = heap[a], ib = heap[b];
        heap[a] = ib; heap[b] = ia;
        pos[ia] = b; pos[ib] = a;
    };
    const siftUp = (k: number) => {
        while (k > 0) {
            const parent = (k - 1) >> 1;
            if (area[heap[parent]] <= area[heap[k]]) break;
            swap(k, parent); k = parent;
        }
    };
    const siftDown = (k: number) => {
        while (true) {
            const l = 2 * k + 1, r = l + 1;
            let smallest = k;
            if (l < heapSize && area[heap[l]] < area[heap[smallest]]) smallest = l;
            if (r < heapSize && area[heap[r]] < area[heap[smallest]]) smallest = r;
            if (smallest === k) break;
            swap(k, smallest); k = smallest;
        }
    };
    const reheapify = (k: number) => { siftUp(k); siftDown(pos[heap[k]]); };
    // Build initial heap in O(n).
    for (let i = (heapSize >> 1) - 1; i >= 0; i--) siftDown(i);

    let liveCount = n;
    while (liveCount > targetCount && heapSize > 0) {
        // Extract-min: the node whose removal perturbs the curve least.
        const idx = heap[0];
        heapSize--;
        if (heapSize > 0) {
            swap(0, heapSize);
            pos[idx] = -1;
            siftDown(0);
        } else {
            pos[idx] = -1;
        }

        if (!alive[idx]) continue;
        alive[idx] = 0;
        liveCount--;

        // Splice out + re-key neighbours.
        const a = prev[idx], c = next[idx];
        next[a] = c; prev[c] = a;
        if (pos[a] >= 0) { area[a] = triArea(a); reheapify(pos[a]); }
        if (pos[c] >= 0) { area[c] = triArea(c); reheapify(pos[c]); }
    }

    const result: Point2D[] = [];
    for (let i = 0; i < n; i++) {
        if (alive[i]) result.push({ x: px[i], y: py[i] });
    }
    return result.length >= 3 ? result : points;
}

/** Smooth's reach: a Gaussian along the curve, its sigma this fraction of the outline's length. */
export const SMOOTH_SIGMA_FRACTION = 0.0025;

/**
 * Smooth a closed curve by a Gaussian along its length, keeping its centroid.
 * The reach is a fraction of the outline's own length and each neighbour
 * weighs as much curve as it stands for, so the result is the same at every
 * zoom, on every screen and at every sample density: Smooth changes the saved
 * outline, so it must not depend on the view. (It counted samples, and moved a
 * dense outline by a twentieth of a pixel.)
 */
export function smoothClosedPoints(points: Point2D[], sigmaFraction = SMOOTH_SIGMA_FRACTION): Point2D[] {
    const n = points.length;
    const c = cumulativeLengths(points);
    const sigma = sigmaFraction * c[n];
    if (n < 3 || !(sigma > 0)) return points.map((p) => ({ ...p }));
    const seg = (i: number) => c[i + 1] - c[i];
    // The curve each sample stands for: half of each segment beside it.
    const share = (i: number) => (seg((i - 1 + n) % n) + seg(i)) / 2;
    const reach = 3 * sigma;
    const half = Math.floor((n - 1) / 2);
    const out: Point2D[] = Array.from({ length: n });
    for (let i = 0; i < n; i++) {
        let w = share(i);
        let x = points[i].x * w;
        let y = points[i].y * w;
        for (const dir of [1, -1]) {
            let d = 0;
            for (let k = 1; k <= half; k++) {
                const j = (i + dir * k + n) % n;
                d += dir > 0 ? seg((j - 1 + n) % n) : seg(j);
                if (d > reach) break;
                const wj = Math.exp(-(d * d) / (2 * sigma * sigma)) * share(j);
                x += points[j].x * wj;
                y += points[j].y * wj;
                w += wj;
            }
        }
        out[i] = { x: x / w, y: y / w };
    }
    let dx = 0;
    let dy = 0;
    for (let i = 0; i < n; i++) {
        dx += points[i].x - out[i].x;
        dy += points[i].y - out[i].y;
    }
    dx /= n;
    dy /= n;
    return out.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

/** The bounding box of a point set, with a per-axis pad already applied. */
export interface ContourBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    /** Extent along X, floored at 1 so a degenerate axis stays renderable. */
    width: number;
    /** Extent along Y, floored at 1 so a degenerate axis stays renderable. */
    height: number;
    /** Pad applied to the X axis (`width * margin`). */
    padX: number;
    /** Pad applied to the Y axis (`height * margin`). */
    padY: number;
    /** `min-pad  -(max+pad)  extent+2·pad` — the Y-flipped SVG viewBox string. */
    viewBox: string;
}

/**
 * X.F.W4 · `fr-ContourPreview` row 40 — THE single cure of the framing cluster.
 *
 * Three surfaces computed a contour's bounding box independently, and two of
 * them did it with *byte-identical* code two hundred lines apart: at this
 * wave's open, `md5` of `ContourPreview.vue:19-25` and of
 * `ContourEditorCanvas.vue:60-66` were both `b9bf953f46449d13d580f251f7f57ba8`
 * (row 33 — a whitespace-identical clone, which is why the extraction is an
 * adoption rather than an invention). Each copy then diverged in what it did
 * with the box, and every divergence is a booked defect this function ends:
 *
 *   • row 7 (MAJOR) — the preview spent an **X-derived pad on BOTH axes**, so
 *     on tall contours the vertical gutter collapsed and past h ≳ 15.8·w the
 *     extreme vertices clipped against the SVG root's default `overflow:
 *     hidden`. The pad is per-axis here, which is what the editor already did.
 *   • row 17 (MINOR) — no degenerate-extent guard: a zero X extent emits a
 *     viewBox of width 0, and the spec says a zero-width viewBox DISABLES
 *     rendering of the element. Two of the three siblings already carried the
 *     `|| 1` floor; now all of them do, on both axes.
 *   • row 28-client (MINOR) — one non-finite coordinate blanked the preview in
 *     silence, because an invalid viewBox is simply ignored by UAs. Non-finite
 *     input is screened here and reported through the return value, so a caller
 *     can render an honest empty state instead of an invisible one. (The write
 *     path that admits such a point is the boundary-validation half and is
 *     F.W5–W8's; this is the client screen the row names.)
 *
 * The margin stays the caller's: the preview's authored framing is 0.1 and the
 * editor's is 0.15, and unifying them would be a design change no row asked
 * for.
 *
 * Returns `null` when the point set cannot produce a renderable box — fewer
 * than two points, or any non-finite coordinate.
 */
export function contourBounds(
    points: readonly Point2D[] | undefined,
    margin: number,
): ContourBounds | null {
    if (!points || points.length < 2) return null;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of points) {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }

    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const padX = width * margin;
    const padY = height * margin;

    return {
        minX,
        maxX,
        minY,
        maxY,
        width,
        height,
        padX,
        padY,
        // Y is flipped because every consumer draws inside a `scale(1,-1)`.
        viewBox: `${minX - padX} ${-(maxY + padY)} ${width + padX * 2} ${height + padY * 2}`,
    };
}

/* ── The editor's geometry (pure; the editor composes it) ── */

/** `p` dropped onto the segment a-b. */
export function projectOntoSegment(p: Point2D, a: Point2D, b: Point2D): Point2D {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { x: a.x, y: a.y };
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    return { x: a.x + t * dx, y: a.y + t * dy };
}

/** One sample inside a drag's reach: its index, its signed distance along the
 *  curve from the grabbed sample, and how much of the drag it takes (0 to 1). */
export interface ReachSample {
    index: number;
    along: number;
    weight: number;
}

/**
 * The samples a drag of `index` carries: every sample within `reach` of it,
 * measured ALONG the curve, each with a raised-cosine weight (1 at the grabbed
 * sample, 0 at the reach, flat at both ends, so the bend joins the untouched
 * curve without a corner). The grabbed sample comes first. `reach` is in the
 * points' own unit; the editor passes screen pixels over its scale, so a bend
 * has the same width on screen at every zoom and every sample density.
 */
export function reachSamples(points: readonly Point2D[], index: number, reach: number): ReachSample[] {
    const n = points.length;
    const out: ReachSample[] = [{ index, along: 0, weight: 1 }];
    if (!(reach > 0) || n < 3) return out;
    // Each side stops at the reach, or half-way round a small curve.
    const half = Math.floor((n - 1) / 2);
    for (const dir of [1, -1] as const) {
        let along = 0;
        let prev = points[index];
        for (let step = 1; step <= half; step++) {
            const i = (((index + dir * step) % n) + n) % n;
            const p = points[i];
            along += Math.hypot(p.x - prev.x, p.y - prev.y);
            if (along >= reach) break;
            out.push({ index: i, along: dir * along, weight: 0.5 * (1 + Math.cos((Math.PI * along) / reach)) });
            prev = p;
        }
    }
    return out;
}

/**
 * The curve's handle stations: samples at least `gap` apart along the curve,
 * from the first. They stay where they are while the pointer moves, so the
 * handles near it light and dim in place; nothing slides or swaps. `gap` is in
 * the points' unit (the editor passes screen pixels over its scale, so a zoom
 * brings more handles out).
 */
export function handleStations(points: readonly Point2D[], gap: number): Uint8Array {
    const n = points.length;
    const mask = new Uint8Array(n);
    if (n === 0) return mask;
    mask[0] = 1;
    let since = 0;
    for (let i = 1; i < n; i++) {
        since += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
        if (since >= gap) {
            mask[i] = 1;
            since = 0;
        }
    }
    // The last station must not crowd the first across the seam.
    let tail = Math.hypot(points[0].x - points[n - 1].x, points[0].y - points[n - 1].y);
    for (let i = n - 1; i > 0 && tail < gap; i--) {
        if (mask[i]) {
            mask[i] = 0;
            break;
        }
        tail += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    return mask;
}

function cumulativeLengths(points: readonly Point2D[]): Float64Array {
    const n = points.length;
    const c = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) {
        const a = points[i];
        const b = points[(i + 1) % n];
        c[i + 1] = c[i] + Math.hypot(b.x - a.x, b.y - a.y);
    }
    return c;
}

/** The points of `before` that `after` no longer has (Simplify keeps the
 *  survivors' coordinates and order, so one pass finds what it took). */
export function removedPoints(before: readonly Point2D[], after: readonly Point2D[]): Point2D[] {
    const out: Point2D[] = [];
    let j = 0;
    for (const p of before) {
        const q = after[j];
        if (q && q.x === p.x && q.y === p.y) j++;
        else out.push(p);
    }
    return out;
}
