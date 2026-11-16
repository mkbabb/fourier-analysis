import { expect, type Page } from "@playwright/test";

/**
 * A per-frame film of one overlay's leave, read in the page.
 *
 * `filmLeave` locks onto the element `selector` names at the moment it is
 * armed, then samples it on every animation frame: whether it is still in the
 * document, its effective opacity (the product over its ancestors; 0 when it
 * or an ancestor is `display: none`, `visibility: hidden` or has no box), and
 * whether `probe` (a selector inside it, or a text it holds) is still there.
 * The clock starts at the closing input itself: the first `pointerdown`,
 * `keydown` or `click` after arming, by the event's own timestamp.
 */
export interface LeaveFrame {
    /** ms after the closing input. */
    t: number;
    present: boolean;
    op: number;
    /** The surface still shows what it showed (`probe`), when one is given. */
    held: boolean;
}

export interface LeaveFilm {
    frames: LeaveFrame[];
    /** ms from the closing input to the first frame the element is gone. */
    goneAt: number | null;
    /** The longest gap between two frames while the element was present. */
    longestFrame: number;
}

export async function filmLeave(
    page: Page,
    selector: string,
    close: () => Promise<void>,
    options: { probe?: { selector?: string; text?: string }; timeoutMs?: number } = {},
): Promise<LeaveFilm> {
    await expect(page.locator(selector).first()).toBeVisible();
    // The close starts from a rested open: the surface's own enter has run to
    // full opacity and held there. A close pressed inside the enter reverses
    // from wherever the enter had reached, which is right, and is not the
    // leave this film reads.
    await page.evaluate(
        (selector) =>
            new Promise<void>((resolve) => {
                let rested = 0;
                const tick = () => {
                    let o = 1;
                    for (let n = document.querySelector(selector); n; n = n.parentElement) {
                        o *= parseFloat(getComputedStyle(n).opacity);
                    }
                    rested = o > 0.999 ? rested + 1 : 0;
                    if (rested >= 12) resolve();
                    else requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            }),
        selector,
    );
    await page.evaluate(
        ({ selector, probe }) => {
            const el = document.querySelector(selector);
            const rec = { t0: null as number | null, frames: [] as unknown[], done: false };
            (window as unknown as { __leave: typeof rec }).__leave = rec;
            const mark = (e: Event) => {
                if (rec.t0 === null) rec.t0 = e.timeStamp;
            };
            for (const type of ["pointerdown", "keydown", "click", "touchstart"]) {
                document.addEventListener(type, mark, { capture: true, once: true });
            }
            const opacity = (node: Element): number => {
                const box = node.getBoundingClientRect();
                if (box.width < 1 || box.height < 1) return 0;
                if (getComputedStyle(node).visibility === "hidden") return 0;
                let o = 1;
                for (let n: Element | null = node; n; n = n.parentElement) {
                    const cs = getComputedStyle(n);
                    if (cs.display === "none") return 0;
                    o *= parseFloat(cs.opacity);
                }
                return o;
            };
            const held = (node: Element): boolean => {
                if (!probe) return true;
                if (probe.selector && !node.querySelector(probe.selector)) return false;
                if (probe.text && !(node.textContent ?? "").includes(probe.text)) return false;
                return true;
            };
            let goneFor = 0;
            const tick = (ts: number) => {
                const present = !!el && el.isConnected;
                if (rec.t0 !== null) {
                    rec.frames.push({
                        t: ts - rec.t0,
                        present,
                        op: present ? Math.round(opacity(el!) * 1000) / 1000 : 0,
                        held: present ? held(el!) : false,
                    });
                    goneFor = present ? 0 : goneFor + 1;
                    if (goneFor >= 4) {
                        rec.done = true;
                        return;
                    }
                }
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        },
        { selector, probe: options.probe ?? null },
    );
    await close();
    await page.waitForFunction(() => (window as unknown as { __leave: { done: boolean } }).__leave.done, null, {
        timeout: options.timeoutMs ?? 5_000,
    });
    const frames = (await page.evaluate(
        () => (window as unknown as { __leave: { frames: LeaveFrame[] } }).__leave.frames,
    )) as LeaveFrame[];
    const gone = frames.find((f) => !f.present && f.t >= 0);
    let longestFrame = 0;
    for (let i = 1; i < frames.length; i++) {
        if (!frames[i - 1].present) break;
        longestFrame = Math.max(longestFrame, frames[i].t - frames[i - 1].t);
    }
    return { frames, goneAt: gone ? gone.t : null, longestFrame };
}

/**
 * The leave is a tween, not a cut: through the first 100 ms after the closing
 * input the surface is still in the document and still visible, and it stays
 * in the document until its fade has run down (it is removed faint, not whole).
 * With `held`, it also keeps showing what it showed for as long as it is there.
 */
export function expectEasedLeave(film: LeaveFilm, label: string, options: { held?: boolean } = {}): void {
    // Every frame up to 100 ms, and the first one past it: on a page whose
    // frames run long (a live canvas), the frame that closes the window is the
    // one that proves the surface was still there at 100 ms.
    const past = film.frames.findIndex((f) => f.t > 100);
    const early = film.frames.slice(0, past === -1 ? film.frames.length : past + 1).filter((f) => f.t >= 0);
    expect(early.length, `${label}: frames sampled across the first 100 ms`).toBeGreaterThan(1);
    expect(early[early.length - 1].t, `${label}: no frame past 100 ms`).toBeGreaterThan(100);
    for (const f of early) {
        expect(f.present, `${label}: removed at +${f.t.toFixed(0)} ms`).toBe(true);
        expect(f.op, `${label}: opacity 0 at +${f.t.toFixed(0)} ms`).toBeGreaterThan(0);
    }
    expect(film.goneAt, `${label}: never left`).not.toBeNull();
    const lastPresent = [...film.frames].reverse().find((f) => f.present)!;
    expect(lastPresent.op, `${label}: removed at opacity ${lastPresent.op}, before its leave ended`).toBeLessThan(0.35);
    if (options.held) {
        for (const f of film.frames.filter((x) => x.present)) {
            expect(f.held, `${label}: emptied while leaving, at +${f.t.toFixed(0)} ms`).toBe(true);
        }
    }
}
