import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN_TOKEN, ENTRY, stubAdminApi } from "./fixtures/gallery";
import { seededViz } from "./fixtures/seed";

/**
 * X·OD19 ALL (fourier) — owner row OD19-ALL (2026-10-19): "All loading times
 * for all apps needs to be improved, every page, every app", and route-to-route
 * transitions "smoothly and subtly".
 *
 * THE INSTRUMENT. Every route is read on the PRODUCTION bundle, served by
 * `vite preview` — the suite's own production instrument on :4190, built and
 * started by `playwright.config.ts`'s `webServer` (`/api` proxies to the same
 * backend) — in headless Chromium at a CPU throttle of 4× (CDP
 * `Emulation.setCPUThrottlingRate`); the network is localhost and unthrottled,
 * so the bytes are read as bytes.
 *
 *  · cold — a fresh context (empty HTTP cache), a hard load of the route;
 *  · warm — a second hard load of the same route in the same context;
 *  · nav  — an in-app navigation from another section through the dock's
 *    section menu (pointer over the item, then the click — the reader's own
 *    path), timed from the click.
 *
 * Read on each: the JS and CSS bytes the load fetched (decoded), the time to
 * the route's own content (its content selector visible and nothing in
 * `<main>` `aria-busy`), the long tasks (count and blocking time, Σ(d − 50 ms),
 * from navigation start to content), and, for nav, the frame gaps over the
 * transition (max and the count over 50 ms).
 *
 * The bars. The JS bytes bar of every route sits above its AFTER reading (×2)
 * and below its BEFORE reading, as do the two prefetch-on-intent checks (the
 * admin Users tab fetches no code; an open gallery card has fetched its
 * visualization's chunk), so these were RED before the cure. The time and
 * frame bars are budgets: about 1.5× the worst AFTER reading on a shared,
 * loaded machine. At CPU ×4 on localhost a route's time is rendering-bound (a
 * page's first style and layout pass, and Vue's mount), so they hold a
 * regression out rather than prove the bytes cure. Every time bar reads the
 * page's OWN time: the reading less its wait on the API (`apiMs`, the union of
 * the `/api/` request spans inside the timed window). A cold `/equation` waits
 * ~1.4-5 s on the backend's compute of its default series, a latency that is
 * the server's and the shared machine's, not the bundle's; the raw `ms` is
 * still recorded beside it.
 * `OD19_LOAD_OUT=<file>` also writes the readings.
 */

const PROD = process.env.OD19_LOAD_PROD ?? "http://localhost:4190";
const CPU_THROTTLE = 4;

interface Route {
    name: string;
    path: () => string;
    ready: string;
    /** At 390 the stage sits behind the "Canvas" tab: the content the phone opens on. */
    ready390?: string;
    /** The dock section menu item that opens it (nav); absent = not a section. */
    nav?: string;
    /** Bars: eager+route JS decoded KB (cold), cold / warm / nav content ms. */
    bar: { jsKB: number; coldMs: number; warmMs: number; navMs?: number };
}

const ROUTES: Route[] = [
    { name: "paper", path: () => "/paper", ready: ".paper-section", nav: "Paper", bar: { jsKB: 1550, coldMs: 1100, warmMs: 700, navMs: 1000 } },
    { name: "visualize", path: () => "/visualize", ready: ".viz-configurator .configurator-stage", nav: "Visualize", bar: { jsKB: 1260, coldMs: 800, warmMs: 450, navMs: 700 } },
    { name: "visualization", path: () => `/v/${seededViz().slug}`, ready: ".viz-configurator .configurator-stage canvas", ready390: ".viz-configurator .configurator-layer", bar: { jsKB: 1260, coldMs: 1500, warmMs: 1100 } },
    { name: "gallery", path: () => "/gallery", ready: ".gallery-card", nav: "Gallery", bar: { jsKB: 870, coldMs: 1100, warmMs: 600, navMs: 1000 } },
    { name: "equation", path: () => "/equation", ready: ".eq-card", ready390: ".eq-configurator .configurator-layer", nav: "Equation", bar: { jsKB: 1170, coldMs: 1000, warmMs: 700, navMs: 700 } },
    { name: "morph", path: () => "/morph", ready: ".demo-layout .stage-column svg path", nav: "Morph", bar: { jsKB: 810, coldMs: 1100, warmMs: 700, navMs: 900 } },
];

/** The admin seat: /gallery in admin mode (stubbed admin API), then its lazy Users tab. */
const ADMIN_BAR = { jsKB: 910, coldMs: 1100, tabMs: 450 };

/** The transition's frame budget (every nav): no frame gap over this, and at most this many janked frames. */
const FRAME_BAR = { maxGapMs: 450, over50: 20 };

interface Reading {
    jsKB: number;
    cssKB: number;
    ms: number;
    longTasks: number;
    tbt: number;
    /** The part of `ms` spent waiting on the API (the union of `/api/` request spans in the window). */
    apiMs: number;
    maxGapMs?: number;
    over50?: number;
}

/** The page's own time to content: the reading less its wait on the API. */
const own = (r: Reading): number => r.ms - r.apiMs;

function record(route: string, mode: string, r: Reading): void {
    const out = process.env.OD19_LOAD_OUT;
    if (!out) return;
    // A failed test restarts the worker (and this module's state): merge into the file.
    mkdirSync(path.dirname(out), { recursive: true });
    const prior = existsSync(out) ? (JSON.parse(readFileSync(out, "utf8")).readings as Record<string, Record<string, Reading>>) : ({} as Record<string, Record<string, Reading>>);
    (prior[route] ??= {})[mode] = r;
    writeFileSync(out, JSON.stringify({ cpuThrottle: CPU_THROTTLE, readings: prior }, null, 2));
}

/** Long-task and frame-gap recorders, installed before any app script runs. */
const INIT = () => {
    const w = window as unknown as { __lt: { s: number; d: number }[]; __frames: number[] | null };
    w.__lt = [];
    w.__frames = null;
    new PerformanceObserver((l) => {
        for (const e of l.getEntries()) w.__lt.push({ s: e.startTime, d: e.duration });
    }).observe({ type: "longtask", buffered: true });
};

async function throttled(browser: Browser, width: number, height: number) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    await ctx.addInitScript(INIT);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
    return { ctx, page };
}

/** Poll for the route's content at frame cadence; return the in-page time it appeared. */
async function contentAt(page: Page, ready: string): Promise<number> {
    const h = await page.waitForFunction(
        (sel) => {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el || !el.getClientRects().length) return false;
            if (document.querySelector("main [aria-busy=true]")) return false;
            return performance.now();
        },
        ready,
        { polling: "raf", timeout: 60_000 },
    );
    return (await h.jsonValue()) as number;
}

/**
 * `since` bounds the bytes and long tasks; `waitFrom` (default `since`) bounds
 * the API wait, which is counted inside the timed span only.
 */
async function readLoad(page: Page, since: number, until: number, waitFrom = since): Promise<Omit<Reading, "ms">> {
    return page.evaluate(
        ([since, until, waitFrom]) => {
            const res = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
            const kb = (re: RegExp) =>
                Math.round(res.filter((r) => re.test(new URL(r.name).pathname) && r.startTime >= since).reduce((a, r) => a + r.decodedBodySize, 0) / 1024);
            const lt = (window as unknown as { __lt: { s: number; d: number }[] }).__lt.filter((t) => t.s >= since && t.s <= until);
            // The server's own time is not the page's: the union of every `/api/`
            // request's span inside the timed window (a cold /equation waits on
            // the backend's compute of its default series, whose latency is the
            // backend's and the machine's, not the bundle's).
            const spans = res
                .filter((r) => new URL(r.name).pathname.startsWith("/api/"))
                .map((r) => [Math.max(r.startTime, waitFrom), Math.min(r.responseEnd || until, until)] as const)
                .filter(([a, b]) => b > a)
                .sort((x, y) => x[0] - y[0]);
            let apiMs = 0;
            let end = -Infinity;
            for (const [a, b] of spans) {
                if (b <= end) continue;
                apiMs += b - Math.max(a, end);
                end = b;
            }
            return {
                apiMs: Math.round(apiMs),
                jsKB: kb(/\.m?js$/),
                cssKB: kb(/\.css$/),
                longTasks: lt.length,
                tbt: Math.round(lt.reduce((a, t) => a + Math.max(0, t.d - 50), 0)),
            };
        },
        [since, until, waitFrom] as const,
    );
}

async function hardLoad(page: Page, route: Route): Promise<Reading> {
    await page.goto(PROD + route.path(), { waitUntil: "commit" });
    const narrow = (page.viewportSize()?.width ?? 1440) < 640;
    const ms = await contentAt(page, (narrow && route.ready390) || route.ready);
    return { ms: Math.round(ms), ...(await readLoad(page, 0, ms)) };
}

/** Open the dock's section menu, point at `item`, click it; trace frames until the content shows. */
async function navTo(page: Page, item: string, ready: string): Promise<Reading> {
    const trigger = page.locator(".app-dock").getByRole("button", { name: /^Navigate/ });
    await expect(trigger).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(800);
    await trigger.click();
    const menuItem = page.getByRole("menuitem", { name: item, exact: true });
    await expect(menuItem).toBeVisible();
    const t0 = await page.evaluate(() => {
        const w = window as unknown as { __frames: number[] | null };
        const frames: number[] = [];
        w.__frames = frames;
        let last = performance.now();
        const tick = (t: number) => {
            frames.push(t - last);
            last = t;
            if (w.__frames === frames) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        return performance.now();
    });
    // The bytes are counted from the pointer's arrival (the prefetch on intent
    // starts there); the time from the click.
    await menuItem.hover();
    const tClick = await page.evaluate(() => performance.now());
    await menuItem.click();
    const at = await contentAt(page, ready);
    // The transition's tail: the crossfade runs on past the content's arrival.
    await page.waitForTimeout(700);
    const frames = await page.evaluate(() => {
        const w = window as unknown as { __frames: number[] | null };
        const f = w.__frames ?? [];
        w.__frames = null;
        return f;
    });
    const load = await readLoad(page, t0, at, tClick);
    return {
        ms: Math.round(at - tClick),
        ...load,
        maxGapMs: Math.round(Math.max(0, ...frames)),
        over50: frames.filter((d) => d > 50).length,
    };
}

test.describe("OD19-ALL · fourier load — every route, production bundle, CPU ×4", () => {
    test.setTimeout(180_000);

    for (const route of ROUTES) {
        for (const width of [1440, 390] as const) {
            test(`${route.name} @${width}: cold and warm loads reach content within the bar`, async ({ browser }) => {
                const { ctx, page } = await throttled(browser, width, width === 1440 ? 900 : 844);
                try {
                    const cold = await hardLoad(page, route);
                    record(`${route.name}@${width}`, "cold", cold);
                    const warm = await hardLoad(page, route);
                    record(`${route.name}@${width}`, "warm", warm);
                    expect.soft(cold.jsKB, `cold JS KB ${JSON.stringify(cold)}`).toBeLessThanOrEqual(route.bar.jsKB);
                    expect.soft(own(cold), `cold content ms (own) ${JSON.stringify(cold)}`).toBeLessThanOrEqual(route.bar.coldMs);
                    expect.soft(own(warm), `warm content ms (own) ${JSON.stringify(warm)}`).toBeLessThanOrEqual(route.bar.warmMs);
                } finally {
                    await ctx.close();
                }
            });
        }
    }

    for (const route of ROUTES.filter((r) => r.nav)) {
        test(`${route.name}: an in-app navigation reaches content within the bar, with a smooth transition`, async ({ browser }) => {
            const { ctx, page } = await throttled(browser, 1440, 900);
            try {
                // Enter from another section: /morph for /paper, /paper for the rest.
                const from = route.name === "paper" ? ROUTES.find((r) => r.name === "morph")! : ROUTES[0];
                await hardLoad(page, from);
                const nav = await navTo(page, route.nav!, route.ready);
                record(route.name, "nav", nav);
                expect.soft(own(nav), `nav content ms (own) ${JSON.stringify(nav)}`).toBeLessThanOrEqual(route.bar.navMs!);
                expect.soft(nav.maxGapMs!, `nav max frame gap ${JSON.stringify(nav)}`).toBeLessThanOrEqual(FRAME_BAR.maxGapMs);
                expect.soft(nav.over50!, `nav frames over 50 ms ${JSON.stringify(nav)}`).toBeLessThanOrEqual(FRAME_BAR.over50);
            } finally {
                await ctx.close();
            }
        });
    }

    test("gallery: an open card has already loaded its visualization's route chunk", async ({ browser }) => {
        const { ctx, page } = await throttled(browser, 1440, 900);
        try {
            await hardLoad(page, ROUTES.find((r) => r.name === "gallery")!);
            await page.locator(".gallery-card").first().click();
            await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
            // Prefetch on intent: the card's modal is the intent to open /v/<slug>.
            await expect
                .poll(
                    () =>
                        page.evaluate(() =>
                            performance.getEntriesByType("resource").some((r) => /\/VisualizationView-[^/]*\.js$/.test(new URL(r.name).pathname)),
                        ),
                    { timeout: 5_000 },
                )
                .toBe(true);
        } finally {
            await ctx.close();
        }
    });

    test("admin: the admin gallery and its lazy Users tab reach content within the bar", async ({ browser }) => {
        const { ctx, page } = await throttled(browser, 1440, 900);
        try {
            await stubAdminApi(page, [ENTRY]);
            await page.goto(`${PROD}/gallery?admin=${ADMIN_TOKEN}`, { waitUntil: "commit" });
            const at = await contentAt(page, "[aria-label='Admin mode banner']");
            const cold = { ms: Math.round(at), ...(await readLoad(page, 0, at)) };
            record("admin", "cold", cold);
            const t0 = await page.evaluate(() => performance.now());
            await page.getByRole("tab", { name: "Users" }).click();
            const tabAt = await contentAt(page, "[data-admin-row]");
            const tab = { ms: Math.round(tabAt - t0), ...(await readLoad(page, t0, tabAt)) };
            record("admin", "users-tab", tab);
            expect.soft(cold.jsKB, `admin cold JS KB ${JSON.stringify(cold)}`).toBeLessThanOrEqual(ADMIN_BAR.jsKB);
            expect.soft(own(cold), `admin cold content ms (own) ${JSON.stringify(cold)}`).toBeLessThanOrEqual(ADMIN_BAR.coldMs);
            expect.soft(own(tab), `admin Users tab ms (own) ${JSON.stringify(tab)}`).toBeLessThanOrEqual(ADMIN_BAR.tabMs);
            // Prefetch on intent: admin mode turning on loaded the panels' chunks.
            expect.soft(tab.jsKB, `the Users tab fetched no code of its own ${JSON.stringify(tab)}`).toBe(0);
        } finally {
            await ctx.close();
        }
    });
});
