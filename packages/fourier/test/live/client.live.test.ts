/**
 * F-L1-8: the client against a live API, with a synthetic drawing (never a
 * photo). FOURIER_API_URL is the API; FOURIER_ADMIN_TOKEN mints and revokes
 * the tokens this run uses.
 */
import { deflateSync } from "node:zlib";
import { afterAll, describe, expect, it } from "vitest";
import { createFourierClient, FourierApiError } from "../../src/client";
import { partialSum, topOf } from "../../src/index";

const base = process.env.FOURIER_API_URL;
const admin = process.env.FOURIER_ADMIN_TOKEN;
if (!base || !admin) throw new Error("set FOURIER_API_URL and FOURIER_ADMIN_TOKEN to run the live client test");

const minted: string[] = [];
async function mint(rate: number): Promise<string> {
    const res = await fetch(`${base}/api/admin/tokens`, {
        method: "POST",
        headers: { Authorization: `Bearer ${admin}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "client-live-test", scopes: ["spectrum"], rate_per_min: rate }),
    });
    expect(res.status).toBe(201);
    const { id, token } = (await res.json()) as { id: string; token: string };
    minted.push(id);
    return token;
}
afterAll(async () => {
    for (const id of minted)
        await fetch(`${base}/api/admin/tokens/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${admin}` } });
});

/** A grey PNG of a dark ring on white, encoded here: a drawing, not a photograph. */
function ringPng(size = 160): Blob {
    const raw = Buffer.alloc(size * (size + 1));
    for (let y = 0; y < size; y++) {
        raw[y * (size + 1)] = 0;
        for (let x = 0; x < size; x++) {
            const r = Math.hypot(x - size / 2, y - size / 2);
            raw[y * (size + 1) + 1 + x] = r > size * 0.22 && r < size * 0.34 ? 0 : 255;
        }
    }
    const crc = (buf: Buffer) => {
        let c = ~0;
        for (const b of buf) {
            c ^= b;
            for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
        }
        return ~c >>> 0;
    };
    const chunk = (type: string, data: Buffer) => {
        const t = Buffer.concat([Buffer.from(type), data]);
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length);
        const c = Buffer.alloc(4);
        c.writeUInt32BE(crc(t));
        return Buffer.concat([len, t, c]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 0; // greyscale
    const png = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", ihdr),
        chunk("IDAT", deflateSync(raw)),
        chunk("IEND", Buffer.alloc(0)),
    ]);
    return new Blob([png], { type: "image/png" });
}

function hausdorff(a: ArrayLike<number>, b: ArrayLike<number>): number {
    const one = (p: ArrayLike<number>, q: ArrayLike<number>) => {
        let worst = 0;
        for (let i = 0; i < p.length; i += 2) {
            let best = Infinity;
            for (let j = 0; j < q.length; j += 2) best = Math.min(best, Math.hypot(p[i]! - q[j]!, p[i + 1]! - q[j + 1]!));
            worst = Math.max(worst, best);
        }
        return worst;
    };
    return Math.max(one(a, b), one(b, a));
}

describe("the client against a live API", () => {
    it("turns a drawing into a spectrum whose N_c partial sum follows the contour", async () => {
        const client = createFourierClient({ baseUrl: base, token: await mint(10) });
        const { contour, spectrum } = await client.spectrumOfImage(ringPng(), {
            strategy: "threshold",
            resize: 160,
            n_points: 512,
            n_harmonics: 120,
        });
        expect(contour.x).toHaveLength(512);
        expect(spectrum.c).toBeInstanceOf(Float64Array);
        expect(topOf(spectrum)).toBe(120);
        const n = spectrum.n!;
        expect(n).toBeGreaterThan(0);
        expect(n).toBeLessThanOrEqual(120);

        const pts = contour.x.flatMap((x, i) => [x, contour.y[i]!]);
        const width = Math.max(...contour.x) - Math.min(...contour.x);
        const atTop = hausdorff(partialSum(spectrum, 120, 512), pts);
        const atN = hausdorff(partialSum(spectrum, n, 512), pts);
        expect(atN).toBeLessThanOrEqual(atTop + 0.0015 * width + 1e-9);
    });

    it("answers a bad token with a 401 FourierApiError", async () => {
        const client = createFourierClient({ baseUrl: base, token: "fk_aaaaaaaaaaaa_notarealsecretnotarealsecretnotarealsecret12" });
        const err = await client.spectrumOfContour({ x: [0, 10, 0], y: [0, 0, 10] }).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(FourierApiError);
        expect((err as FourierApiError).status).toBe(401);
    });

    it("answers past the token's rate with a 429 and its Retry-After", async () => {
        const client = createFourierClient({ baseUrl: base, token: await mint(2) });
        const pts = { x: [0, 10, 10, 0], y: [0, 0, 10, 10] };
        await client.spectrumOfContour(pts, { nHarmonics: 8, nPoints: 64 });
        await client.spectrumOfContour(pts, { nHarmonics: 8, nPoints: 64 });
        const err = await client.spectrumOfContour(pts, { nHarmonics: 8, nPoints: 64 }).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(FourierApiError);
        expect((err as FourierApiError).status).toBe(429);
        expect((err as FourierApiError).retryAfterS).toBeGreaterThan(0);
    });
});
