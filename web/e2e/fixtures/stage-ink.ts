import type { Page } from "@playwright/test";

/**
 * Readings of the visualizer's stage canvas, for the specs that judge what it
 * draws. The canvas is downsampled to 240 px wide before it is read, so a
 * sample costs little even on a throttled phone.
 */
export interface StageInk {
    /** Pixels in the trail's red (the Fourier hue), opaque enough to be the line. */
    red: number;
    /** Pixels with any paint. */
    inked: number;
    /** The sum of alpha, in whole pixels. */
    alpha: number;
}

/** The function the page runs to read the stage (stringified into the page). */
export const SAMPLE_STAGE = (): StageInk | null => {
    const c = document.querySelector<HTMLCanvasElement>(".canvas-stage > .canvas-container canvas");
    if (!c || !c.width || !c.height) return null;
    const o = document.createElement("canvas");
    o.width = 240;
    o.height = Math.max(1, Math.round((240 * c.height) / c.width));
    const x = o.getContext("2d")!;
    x.drawImage(c, 0, 0, o.width, o.height);
    const d = x.getImageData(0, 0, o.width, o.height).data;
    let red = 0, inked = 0, alpha = 0;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i]!, g = d[i + 1]!, b = d[i + 2]!, al = d[i + 3]!;
        if (al > 40 && r > 120 && r > g + 45 && r > b + 45) red++;
        if (al > 8) inked++;
        alpha += al;
    }
    return { red, inked, alpha: Math.round(alpha / 255) };
};

export async function sampleStage(page: Page): Promise<StageInk | null> {
    return page.evaluate(SAMPLE_STAGE);
}

/** The drawing's position on its cycle, as the timeline reports it (0..1). */
export async function timelineT(page: Page): Promise<number> {
    return page.evaluate(() => {
        const thumb = document.querySelector('.animation-dock [role="slider"][aria-label="Timeline"]');
        return Number(thumb?.getAttribute("aria-valuenow") ?? NaN);
    });
}

/**
 * Sample the stage every `everyMs` for `ms` in the page (no round trip per
 * sample), each row the time, the timeline's t and the stage's ink.
 */
export async function filmStage(
    page: Page,
    ms: number,
    everyMs = 120,
): Promise<{ ms: number; t: number; ink: StageInk | null }[]> {
    return page.evaluate(
        ({ ms, everyMs, src }) =>
            new Promise<{ ms: number; t: number; ink: StageInk | null }[]>((done) => {
                const sample = new Function(`return (${src})()`) as () => StageInk | null;
                const rows: { ms: number; t: number; ink: StageInk | null }[] = [];
                const t0 = performance.now();
                const id = setInterval(() => {
                    const thumb = document.querySelector('.animation-dock [role="slider"][aria-label="Timeline"]');
                    rows.push({ ms: performance.now() - t0, t: Number(thumb?.getAttribute("aria-valuenow") ?? NaN), ink: sample() });
                    if (performance.now() - t0 >= ms) {
                        clearInterval(id);
                        done(rows);
                    }
                }, everyMs);
            }),
        { ms, everyMs, src: SAMPLE_STAGE.toString() },
    );
}

/** The renderer the page draws with (the GPU lane's proof). */
export async function rendererOf(page: Page): Promise<string> {
    return page.evaluate(() => {
        const c = document.createElement("canvas");
        const gl = c.getContext("webgl");
        if (!gl) return "no webgl";
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        const r = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return r;
    });
}
