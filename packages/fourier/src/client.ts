/**
 * A small client for the fourier API's token routes (`/api/v1/spectrum/*`).
 *
 * The token is a server-side secret: use this from a server, a build step or
 * a script, never from code shipped to a browser (a token in a public bundle
 * is a published token). The API answers browsers only from its own origins.
 */
import type { Spectrum } from "./spectrum.js";

/** Extraction settings for `spectrumOfImage` (the API's `ContourSettings` subset). */
export interface ImageSettings {
    strategy: string;
    resize: number;
    blur_sigma: number;
    n_points: number;
    n_harmonics: number;
    n_classes: number;
    min_contour_length: number;
    min_contour_area: number;
    max_contours: number | null;
    smooth_contours: number;
    ml_threshold: number;
    ml_detail_threshold: number;
}

export interface Contour {
    x: number[];
    y: number[];
}

export interface ImageSpectrum {
    /** The single closed tour through the image's contours, resampled. */
    contour: Contour;
    spectrum: Spectrum;
    /** `[minX, minY, maxX, maxY]` of the resized image in the contour's units. */
    imageBounds?: [number, number, number, number];
}

export interface FourierClient {
    spectrumOfImage(image: Blob, settings?: Partial<ImageSettings>, signal?: AbortSignal): Promise<ImageSpectrum>;
    spectrumOfContour(
        points: Contour,
        opts?: { nHarmonics?: number; nPoints?: number },
        signal?: AbortSignal,
    ): Promise<Spectrum>;
}

/** A non-2xx answer: its status, its problem+json body, and for a 429 the wait the server asked for. */
export class FourierApiError extends Error {
    readonly status: number;
    readonly problem: unknown;
    readonly retryAfterS?: number;

    constructor(status: number, problem: unknown, retryAfterS?: number) {
        const p = problem as { title?: unknown; detail?: unknown } | null;
        const what = typeof p?.detail === "string" ? p.detail : typeof p?.title === "string" ? p.title : "";
        super(`fourier API ${status}${what ? `: ${what}` : ""}`);
        this.name = "FourierApiError";
        this.status = status;
        this.problem = problem;
        if (retryAfterS !== undefined) this.retryAfterS = retryAfterS;
    }
}

interface WireSpectrum {
    c: number[];
    n?: number | null;
}

const spectrumOfWire = (w: WireSpectrum): Spectrum =>
    w.n == null ? { c: Float64Array.from(w.c) } : { c: Float64Array.from(w.c), n: w.n };

export function createFourierClient(opts: { baseUrl: string; token: string; fetch?: typeof fetch }): FourierClient {
    if (!opts.baseUrl) throw new TypeError("createFourierClient: baseUrl is required");
    if (!opts.token) throw new TypeError("createFourierClient: token is required");
    const base = opts.baseUrl.replace(/\/+$/, "");
    const doFetch = opts.fetch ?? fetch;

    async function call<T>(path: string, body: BodyInit, json: boolean, signal?: AbortSignal): Promise<T> {
        const headers: Record<string, string> = { Authorization: `Bearer ${opts.token}`, Accept: "application/json" };
        if (json) headers["Content-Type"] = "application/json";
        const init: RequestInit = { method: "POST", headers, body };
        if (signal) init.signal = signal;
        const res = await doFetch(`${base}${path}`, init);
        if (!res.ok) {
            let problem: unknown = null;
            try {
                problem = await res.json();
            } catch {
                problem = null;
            }
            const ra = Number(res.headers.get("Retry-After"));
            throw new FourierApiError(res.status, problem, res.status === 429 && Number.isFinite(ra) ? ra : undefined);
        }
        return (await res.json()) as T;
    }

    return {
        async spectrumOfImage(image, settings = {}, signal) {
            const form = new FormData();
            form.append("image", image, "image");
            form.append("settings", JSON.stringify(settings));
            const r = await call<{
                contour: Contour;
                spectrum: WireSpectrum;
                image_bounds?: { minX: number; minY: number; maxX: number; maxY: number } | null;
            }>("/api/v1/spectrum/image", form, false, signal);
            const out: ImageSpectrum = { contour: r.contour, spectrum: spectrumOfWire(r.spectrum) };
            const b = r.image_bounds;
            if (b) out.imageBounds = [b.minX, b.minY, b.maxX, b.maxY];
            return out;
        },
        async spectrumOfContour(points, o = {}, signal) {
            const body: Record<string, unknown> = { points };
            if (o.nHarmonics !== undefined) body.n_harmonics = o.nHarmonics;
            if (o.nPoints !== undefined) body.n_points = o.nPoints;
            const r = await call<{ spectrum: WireSpectrum }>("/api/v1/spectrum/contour", JSON.stringify(body), true, signal);
            return spectrumOfWire(r.spectrum);
        },
    };
}
