/** The client's contract with a stubbed fetch (the live API run is test/live/). */
import { describe, expect, it } from "vitest";
import { createFourierClient, FourierApiError } from "../src/client";

function stub(status: number, body: unknown, headers: Record<string, string> = {}) {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetch = (async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
    }) as unknown as typeof globalThis.fetch;
    return { fetch, calls };
}

describe("createFourierClient", () => {
    it("needs a base URL and a token", () => {
        expect(() => createFourierClient({ baseUrl: "", token: "fk_x_y" })).toThrow(TypeError);
        expect(() => createFourierClient({ baseUrl: "http://api", token: "" })).toThrow(TypeError);
    });

    it("sends the bearer token and returns a Float64Array spectrum", async () => {
        const { fetch, calls } = stub(200, { spectrum: { c: [1, 2, 3, 4, 5, 6], n: 1 } });
        const client = createFourierClient({ baseUrl: "http://api/", token: "fk_abc_def", fetch });
        const s = await client.spectrumOfContour({ x: [0, 1, 0], y: [0, 0, 1] }, { nHarmonics: 1 });
        expect(s.c).toBeInstanceOf(Float64Array);
        expect(Array.from(s.c)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(s.n).toBe(1);
        expect(calls[0]!.url).toBe("http://api/api/v1/spectrum/contour");
        expect((calls[0]!.init.headers as Record<string, string>).Authorization).toBe("Bearer fk_abc_def");
        expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ points: { x: [0, 1, 0], y: [0, 0, 1] }, n_harmonics: 1 });
    });

    it("maps a problem to FourierApiError, and a 429's Retry-After, without retrying", async () => {
        const unauth = stub(401, { type: "urn:contract:token-invalid", title: "Token invalid", status: 401 });
        await expect(
            createFourierClient({ baseUrl: "http://api", token: "fk_a_b", fetch: unauth.fetch }).spectrumOfContour({ x: [], y: [] }),
        ).rejects.toMatchObject({ status: 401, problem: { type: "urn:contract:token-invalid" } });

        const limited = stub(429, { type: "urn:contract:rate-limited", status: 429 }, { "Retry-After": "42" });
        const err = await createFourierClient({ baseUrl: "http://api", token: "fk_a_b", fetch: limited.fetch })
            .spectrumOfImage(new Blob([new Uint8Array([0x89, 0x50])]))
            .catch((e: unknown) => e);
        expect(err).toBeInstanceOf(FourierApiError);
        expect((err as FourierApiError).retryAfterS).toBe(42);
        expect(limited.calls).toHaveLength(1);
    });
});
