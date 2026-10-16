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

/** Laplacian smoothing for closed curves (centroid-preserving) */
export function smoothClosedPoints(
    points: Point2D[],
    iterations = 4,
    alpha = 0.4,
): Point2D[] {
    let pts = points.map((p) => ({ ...p }));
    const n = pts.length;

    // Save original centroid
    const cx0 = pts.reduce((s, p) => s + p.x, 0) / n;
    const cy0 = pts.reduce((s, p) => s + p.y, 0) / n;

    for (let iter = 0; iter < iterations; iter++) {
        const next = pts.map((_, i) => {
            const prev = pts[(i - 1 + n) % n];
            const curr = pts[i];
            const nxt = pts[(i + 1) % n];
            return {
                x: curr.x + alpha * ((prev.x + nxt.x) / 2 - curr.x),
                y: curr.y + alpha * ((prev.y + nxt.y) / 2 - curr.y),
            };
        });
        pts = next;
    }

    // Restore centroid
    const cx1 = pts.reduce((s, p) => s + p.x, 0) / n;
    const cy1 = pts.reduce((s, p) => s + p.y, 0) / n;
    const dx = cx0 - cx1;
    const dy = cy0 - cy1;
    return pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
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
