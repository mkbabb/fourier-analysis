import { describe, expect, it } from "vitest";
import { BINS, MAX_GAIN, READ_FLOOR, keeper, laid, measureTones, reading, washGain, type Tones } from "./picture-key";

/** The two stage grounds, as the stage reads them (lightness 0..1). */
const CREAM = 0.953;
const DARK = 0.171;

type Paint = (x: number, y: number) => [number, number, number, number?];

function picture(w: number, h: number, paint: Paint): Uint8ClampedArray {
    const px = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const [r, g, b, a = 255] = paint(x, y);
            px.set([r, g, b, a], (y * w + x) * 4);
        }
    }
    return px;
}

const tones = (w: number, h: number, paint: Paint): Tones => measureTones(picture(w, h, paint), w, h);

/** A ring of ink on paper of colour `paper`, `w` square. */
function ring(w: number, paper: [number, number, number]): Paint {
    return (x, y) => {
        const d = Math.hypot(x - w / 2, y - w / 2);
        return Math.abs(d - w * 0.33) < w * 0.03 ? [12, 10, 8] : paper;
    };
}

/** An engraving's figure: hatching on white paper, heavier below; `around` is what lies outside the figure. */
function engraving(around: [number, number, number, number]): Paint {
    return (x, y) => {
        if (Math.hypot(x - 100, y - 100) >= 80) return around;
        const dark = y > 110 ? (x + y) % 5 < 4 : (x + y) % 5 < 2;
        return dark ? [20, 18, 16] : [250, 249, 246];
    };
}
/** The figure cut from its ground (the gallery's portraits): clear around it. */
const cutOut = engraving([0, 0, 0, 0]);
/** The same engraving on its sheet, as a scan. */
const onSheet = engraving([250, 249, 246, 255]);

/** A dim photograph: smooth tones from shadow to a lit face, coloured, nothing near white. */
const photo: Paint = (x, y) => {
    const t = 0.5 + 0.5 * Math.sin(x / 17) * Math.cos(y / 23);
    const v = 10 + 150 * t * (y / 200) + 20 * Math.sin((x * y) / 300);
    return [v * 1.15, v * 0.92, v * 0.8];
};

/** A bright photograph under a blue sky: the commonest light tone is blue, not paper. */
const sky: Paint = (x, y) => (y < 90 ? [150 + y / 3, 190 + y / 4, 235] : [60 + (x % 40), 110 + (y % 30), 40]);

describe("measureTones: whether a picture lies on near-white paper, from its own pixels", () => {
    it("a ring of ink on white paper is a drawing on white paper", () => {
        const t = tones(200, 200, ring(200, [255, 255, 255]));
        expect(t.drawn).toBeGreaterThan(0.99);
        expect(t.paper).toBeGreaterThan(0.99);
    });

    it("a drawing on cream paper is a drawing, its paper the cream", () => {
        const t = tones(200, 200, ring(200, [246, 241, 228]));
        expect(t.drawn).toBeGreaterThan(0.99);
        expect(t.paper).toBeCloseTo(0.945, 2);
    });

    it("an engraving on its sheet lies on its paper", () => {
        expect(tones(200, 200, onSheet).drawn).toBeGreaterThan(0.99);
    });

    it("an engraving cut from its ground does not: its whites are the figure's lights, not a ground", () => {
        expect(tones(200, 200, cutOut).drawn).toBe(0);
    });

    it("a dim photograph and a photograph under a blue sky are not", () => {
        expect(tones(200, 200, photo).drawn).toBe(0);
        expect(tones(200, 200, sky).drawn).toBe(0);
    });

    it("a blank sheet is all paper", () => {
        expect(tones(64, 64, () => [255, 255, 255]).drawn).toBeGreaterThan(0.99);
    });

    it("the histogram holds the opaque pixels only, and sums to one", () => {
        const t = tones(200, 200, cutOut);
        expect(t.hist.length).toBe(BINS);
        expect(t.hist.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
        // The cut-away ground (clear) is not counted as black.
        expect(t.hist[0]).toBe(0);
    });
});

describe("keeper: the share of the wash each tone keeps", () => {
    it("a drawing's paper gives way on either ground, and its ink keeps the whole wash", () => {
        const t = tones(200, 200, ring(200, [255, 255, 255]));
        for (const ground of [CREAM, DARK]) {
            const keep = keeper(t, ground);
            expect(keep(1), `paper on ${ground}`).toBeLessThan(0.01);
            expect(keep(0.05), `ink on ${ground}`).toBeGreaterThan(0.94);
        }
    });

    it("on the cream stage a photograph keeps the darkness key it always had", () => {
        const keep = keeper(tones(200, 200, photo), CREAM);
        for (const L of [0, 0.2, 0.5, 0.8, 0.95]) expect(keep(L)).toBeCloseTo(Math.max(0, (CREAM - L) / CREAM), 6);
    });

    it("on the dark stage a photograph's ground tone keys out, and its own lights keep the whole wash", () => {
        const t = tones(200, 200, photo);
        const keep = keeper(t, DARK);
        expect(keep(DARK)).toBe(0);
        // Its lightest tones (well under white) reach the whole wash; f2a2fa1's key held them near half.
        let top = 0;
        for (let b = BINS - 1; b >= 0; b--) if (t.hist[b]! > 0) { top = (b + 0.5) / BINS; break; }
        expect(top).toBeLessThan(0.75);
        expect(keep(top)).toBe(1);
        // Its deepest shadows darken the ground by the wash, as ink does.
        expect(keep(0)).toBe(1);
    });
});

describe("washGain: what reads faintly on the dark stage is laid thicker, at most two coats", () => {
    it("the dim photograph reads at least the floor of its reading on white paper", () => {
        const t = tones(200, 200, photo);
        const gain = washGain(t, DARK);
        expect(gain).toBeGreaterThan(1);
        expect(gain).toBeLessThanOrEqual(MAX_GAIN);
        // At a small strength the thicker wash reads in proportion to its gain.
        const w = 0.01;
        const floor = Math.min(READ_FLOOR * reading(t, 1), MAX_GAIN * reading(t, DARK));
        expect((laid(w, gain) / w) * reading(t, DARK)).toBeGreaterThanOrEqual(floor * 0.99);
    });

    it("on the cream stage nothing is thickened", () => {
        expect(washGain(tones(200, 200, photo), CREAM)).toBe(1);
        expect(washGain(tones(200, 200, sky), CREAM)).toBe(1);
    });

    it("a drawing's dark ink on the dark stage takes the two coats; on the cream stage one", () => {
        const t = tones(200, 200, ring(200, [255, 255, 255]));
        expect(washGain(t, DARK)).toBe(MAX_GAIN);
        expect(washGain(t, CREAM)).toBe(1);
    });

    it("a figure cut from its ground reads by its own lights on the dark stage, and is not thickened", () => {
        expect(washGain(tones(200, 200, cutOut), DARK)).toBe(1);
    });

    it("laid is the wash itself at one coat, full at full strength, and rises with the gain", () => {
        expect(laid(0.22, 1)).toBeCloseTo(0.22, 9);
        expect(laid(1, 2.5)).toBe(1);
        expect(laid(0, 2.5)).toBe(0);
        expect(laid(0.22, 2)).toBeGreaterThan(laid(0.22, 1.5));
        expect(laid(0.5, 2)).toBeLessThan(1);
    });
});
