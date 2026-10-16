import { expect, type Browser } from "@playwright/test";

/**
 * value.js COHESION §0ei — the `@gpu` instrument runs on the hardware GPU or
 * fails. Reads WebGL's `UNMASKED_RENDERER_WEBGL` on a blank page of `browser`
 * and asserts it names an Apple GPU on ANGLE Metal, not SwiftShader or
 * llvmpipe (a software renderer would measure the emulator, not the app).
 *
 * Measured 2026-10-06 under `chrome-gpu`: "ANGLE (Apple, ANGLE Metal Renderer:
 * Apple M5 Max, Unspecified Version)".
 */
export async function expectHardwareGpu(browser: Browser): Promise<string> {
    const page = await browser.newPage();
    try {
        const renderer = await page.evaluate(() => {
            const gl = document.createElement("canvas").getContext("webgl2");
            const ext = gl?.getExtension("WEBGL_debug_renderer_info");
            return gl && ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : null;
        });
        expect(renderer, "WebGL2 with WEBGL_debug_renderer_info").not.toBeNull();
        expect(renderer, "the @gpu instrument runs on a software renderer").not.toMatch(/SwiftShader|llvmpipe|softpipe|Software/i);
        expect(renderer, "the @gpu instrument runs on the Apple GPU (ANGLE Metal)").toMatch(/Apple.*Metal|Metal.*Apple/);
        return renderer!;
    } finally {
        await page.close();
    }
}
