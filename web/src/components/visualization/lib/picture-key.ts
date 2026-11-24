/**
 * The wash's key (UIA-F-174; FORTY-SIXTH D): how much of each pixel a picture
 * keeps when it lies as a wash under a drawing, decided from the picture's own
 * pixels, never from its name or where it came from.
 *
 * One rule: the tone the picture lies on gives way, and the rest stays in its
 * own colour.
 *
 * - A drawing laid on near-white paper (a sketch, a scan of an engraving on
 *   its sheet, line art) lies on its paper. Each pixel keeps the share of the
 *   wash by which it is darker than the paper, so the paper vanishes on any
 *   ground and the ink stays, in light and in dark.
 * - Anything else (a photograph, a painting, a figure cut from its ground)
 *   lies on the stage's ground. A tone darker than the ground keeps the share
 *   of the room below the ground it stands down; a lighter one keeps the share
 *   of the picture's own lights it stands up, so a dim photograph's lights carry
 *   the whole wash on a dark stage. On the cream stage this is the darkness key
 *   it always was.
 * - Whether a picture lies on paper is measured (`measureTones`): a near-white,
 *   flat tone that makes up its edges and a good share of the whole. Between
 *   the two it blends.
 *
 * On a dark stage dark ink, and a photograph whose lights sit close to the
 * ground, can still read far less than on paper, so there the wash is laid
 * more densely, up to two coats, until it reads at least `READ_FLOOR` as far as
 * on white paper. On the cream stage nothing is thickened.
 *
 * All of it is measured once per picture (`measureTones`) and once per ground
 * (`keeper`, `washGain`), never in the frame loop.
 */

/** Lightness bins of a picture's histogram (0.01 each). */
export const BINS = 100;

/** On any ground, a wash reads at least this share as far as on white paper (`washGain`). */
export const READ_FLOOR = 0.6;

/** The most densely a wash is ever laid: two coats of itself. */
export const MAX_GAIN = 2;

/** What a picture's own pixels say about how its wash keys. */
export interface Tones {
    /** The lightness (0..1) of what the picture lies on: the commonest tone of its edges. */
    paper: number;
    /** How far the picture is laid on near-white paper: 1 a drawing on its sheet, 0 anything else. */
    drawn: number;
    /** The share of the picture's opaque pixels in each lightness bin. */
    hist: Float64Array;
}

/** A colour's lightness, 0..1 (sRGB-encoded, Rec. 709 weights). */
export function lightness(r: number, g: number, b: number): number {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** 0 below `a`, 1 above `b`, smooth between. */
function smooth(a: number, b: number, x: number): number {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
}

/** A pixel is paper when every channel is within this of the paper's colour (the paper is one flat tone). */
const PAPER_NEAR = 15;

/**
 * Measure a picture (RGBA, `w` x `h`) on every `step`-th pixel each way: its
 * lightness histogram, its paper, and how far it is a drawing laid on that
 * paper.
 *
 * - The paper is what the picture is laid on, so it is read at the picture's
 *   edges (a band 2 % of its shorter side deep): the commonest tone of its
 *   opaque edge pixels, its colour the mean of those at that tone. A figure cut
 *   from its ground has no paper there (its edges are clear, or the figure
 *   itself), and its own whites are its lights, not a ground.
 * - The paper is near-white when it is 0.8 to 0.9 light or more and nearly
 *   neutral (cream passes, a blue sky does not).
 * - It is the ground when 30 to 60 % or more of the edge is that one tone, and
 *   10 to 25 % or more of the whole picture.
 */
export function measureTones(px: Uint8ClampedArray, w: number, h: number, step = 2): Tones {
    const hist = new Float64Array(BINS);
    const edgeHist = new Float64Array(BINS);
    const band = Math.max(2, Math.round(0.02 * Math.min(w, h)));
    const atEdge = (x: number, y: number) => x < band || y < band || x >= w - band || y >= h - band;
    let n = 0;
    let edge = 0;
    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const i = (y * w + x) * 4;
            if (px[i + 3]! < 128) continue;
            const b = Math.min(BINS - 1, Math.floor(lightness(px[i]!, px[i + 1]!, px[i + 2]!) * BINS));
            hist[b]!++;
            n++;
            if (atEdge(x, y)) {
                edgeHist[b]!++;
                edge++;
            }
        }
    }
    for (let b = 0; b < BINS; b++) hist[b]! /= n || 1;
    if (!edge) return { paper: 1, drawn: 0, hist };

    let peak = 0;
    for (let b = 1; b < BINS; b++) if (edgeHist[b]! > edgeHist[peak]!) peak = b;
    const paper = (peak + 0.5) / BINS;

    let sr = 0;
    let sg = 0;
    let sb = 0;
    let at = 0;
    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const i = (y * w + x) * 4;
            if (px[i + 3]! < 128 || !atEdge(x, y)) continue;
            if (Math.abs(lightness(px[i]!, px[i + 1]!, px[i + 2]!) - paper) > 0.03) continue;
            sr += px[i]!;
            sg += px[i + 1]!;
            sb += px[i + 2]!;
            at++;
        }
    }
    const pr = sr / at;
    const pg = sg / at;
    const pb = sb / at;
    const chroma = (Math.max(pr, pg, pb) - Math.min(pr, pg, pb)) / 255;

    let onPaper = 0;
    let edgeOnPaper = 0;
    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const i = (y * w + x) * 4;
            if (px[i + 3]! < 128) continue;
            if (Math.max(Math.abs(px[i]! - pr), Math.abs(px[i + 1]! - pg), Math.abs(px[i + 2]! - pb)) > PAPER_NEAR) continue;
            onPaper++;
            if (atEdge(x, y)) edgeOnPaper++;
        }
    }

    const white = smooth(0.8, 0.9, paper) * (1 - smooth(0.1, 0.2, chroma));
    const ground = smooth(0.3, 0.6, edgeOnPaper / edge) * smooth(0.1, 0.25, onPaper / n);
    return { paper, drawn: white * ground, hist };
}

/** How far a photograph's own lights stand above `ground`: the 95th percentile of its lifts, at least 0.25. */
function liftReach(hist: Float64Array, ground: number): number {
    let above = 0;
    for (let b = 0; b < BINS; b++) if ((b + 0.5) / BINS > ground) above += hist[b]!;
    if (above <= 0) return 0.25;
    let seen = 0;
    for (let b = 0; b < BINS; b++) {
        const L = (b + 0.5) / BINS;
        if (L <= ground) continue;
        seen += hist[b]!;
        if (seen >= 0.95 * above) return Math.max(0.25, L - ground);
    }
    return 0.25;
}

/** The share of the wash a pixel of lightness `L` keeps on a ground of lightness `ground` (0..1 each). */
export function keeper(tones: Tones, ground: number): (L: number) => number {
    const { paper, drawn } = tones;
    const depth = Math.max(ground, 1e-3);
    const reach = liftReach(tones.hist, ground);
    return (L) => {
        const belowPaper = L < paper ? (paper - L) / paper : 0;
        const offGround = L <= ground ? (ground - L) / depth : Math.min(1, (L - ground) / reach);
        return drawn * belowPaper + (1 - drawn) * offGround;
    };
}

/**
 * How far the picture's wash stands off `ground`, per unit of strength: the
 * 90th percentile of the change it makes to the pixels it changes at all (its
 * features, not its average).
 */
export function reading(tones: Tones, ground: number): number {
    const keep = keeper(tones, ground);
    const changed: Array<[number, number]> = [];
    let total = 0;
    for (let b = 0; b < BINS; b++) {
        const share = tones.hist[b]!;
        if (share <= 0) continue;
        const L = (b + 0.5) / BINS;
        const d = keep(L) * Math.abs(L - ground);
        if (d <= 0.01) continue;
        changed.push([d, share]);
        total += share;
    }
    if (!total) return 0;
    changed.sort((a, b) => a[0] - b[0]);
    let seen = 0;
    for (const [d, share] of changed) {
        seen += share;
        if (seen >= 0.9 * total) return d;
    }
    return changed[changed.length - 1]![0];
}

/**
 * How densely the wash is laid on `ground` (1: as it is, at most `MAX_GAIN`),
 * so the picture reads at least `READ_FLOOR` as far as it reads on white
 * paper. On the cream stage that is always 1.
 */
export function washGain(tones: Tones, ground: number): number {
    const here = reading(tones, ground);
    if (here <= 0) return 1;
    return Math.min(MAX_GAIN, Math.max(1, (READ_FLOOR * reading(tones, 1)) / here));
}

/** The wash at `strength` (0..1) laid `gain` times over: thicker, and still 1 at full strength. */
export function laid(strength: number, gain: number): number {
    return 1 - (1 - Math.min(1, Math.max(0, strength))) ** gain;
}
