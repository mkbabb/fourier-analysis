#!/usr/bin/env node
// scripts/ds-census.mjs — X-DS LIGHTING CENSUS (value.js docs/tranches/X/waves/X-DS.md, COHESION §0ej).
//
// Counts the lighting the X-DS canon forbids on chrome, in two halves, and prints JSON:
//   static   — the app's own CSS and Vue <style> blocks (web/src/**), the latex-paper theme
//              it imports (web/node_modules/@mkbabb/latex-paper/src/vue/theme.css), plus Tailwind lighting
//              utilities in Vue templates: box-shadow layers, inset (highlight) layers,
//              text-shadow, filter drop-shadow / blur, backdrop blur, decorative gradients,
//              @keyframes run `infinite`.
//   computed — every served route via the REAL Chrome in new-headless mode (§0ei: channel
//              "chrome", headless true, never a visible window): computed box-shadow layers,
//              inset highlight layers (focus-ring spreads excluded), text-shadow, filter
//              drop-shadow / blur, backdrop blur, gradient fills on controls, and running
//              infinite animations on chrome (canvas / svg subjects excluded).
//
// Usage:
//   node scripts/ds-census.mjs [--base http://localhost:3100] [--static-only]
//                              [--frames DIR] [--routes /paper,/gallery,...] [--root REPO_DIR]
//   --root scans another checkout's web/src (e.g. a historical worktree) in the static half.
//   --frames DIR also writes <route>-<theme>-<width>.png for every route × light/dark × 1440/390.
// The served app is expected at --base (vite on :3100 proxying the API on :8000).
import { readFileSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(process.argv.includes("--root") ? process.argv[process.argv.indexOf("--root") + 1] : ROOT, "web", "src");
const args = process.argv.slice(2);
const opt = (k, d) => {
    const i = args.indexOf(k);
    return i >= 0 ? args[i + 1] : d;
};
const BASE = opt("--base", "http://localhost:3100");
const FRAMES = opt("--frames", null);
const STATIC_ONLY = args.includes("--static-only");

// ── layer splitting (commas outside parentheses) ─────────────────────────────
function splitLayers(v) {
    const out = [];
    let depth = 0, cur = "";
    for (const ch of v) {
        if (ch === "(") depth++;
        if (ch === ")") depth--;
        if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out.filter((l) => l && l !== "none");
}

// ── STATIC ───────────────────────────────────────────────────────────────────
function walk(dir, acc = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p, acc);
        else if (/\.(vue|css)$/.test(name)) acc.push(p);
    }
    return acc;
}
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

function staticCensus() {
    const totals = {
        boxShadowDecls: 0, boxShadowLayers: 0, insetLayers: 0, textShadow: 0,
        filterDropShadow: 0, filterBlur: 0, backdropBlur: 0, gradients: 0,
        infiniteAnimations: 0, keyframes: 0, twShadow: 0, twDropShadow: 0,
        twBackdropBlur: 0, twGradient: 0, twLoopAnimate: 0,
    };
    const sites = [];
    const hit = (file, line, kind, text) => sites.push({ file: relative(ROOT, file), line, kind, text: text.trim().slice(0, 160) });
    // X-DS DS-F7-C1: the latex-paper theme /paper imports (PaperView.vue) is
    // scanned with the app's own CSS; the census missed its rules before.
    const theme = join(SRC, "..", "node_modules", "@mkbabb", "latex-paper", "src", "vue", "theme.css");
    let themeFiles = [];
    try { if (statSync(theme).isFile()) themeFiles = [theme]; } catch {}
    for (const file of [...walk(SRC), ...themeFiles]) {
        const raw = readFileSync(file, "utf8");
        let css = raw, tpl = "";
        if (file.endsWith(".vue")) {
            // keep line numbers: blank every non-style region
            css = raw.replace(/<style[^>]*>([\s\S]*?)<\/style>|[^\n]/g, (m, body) => (body !== undefined ? m : m.replace(/[^\n]/g, " ")));
            const t = raw.match(/<template>([\s\S]*)<\/template>/);
            tpl = t ? raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, (m) => m.replace(/[^\n]/g, " ")).replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " ")) : "";
        }
        css = stripComments(css);
        const lines = css.split("\n");
        lines.forEach((ln, i) => {
            const n = i + 1;
            let m;
            if ((m = ln.match(/(?:^|[;{\s])box-shadow\s*:\s*([^;]+)/))) {
                const v = m[1];
                if (!/^\s*(none|inherit|initial|unset)\b/.test(v)) {
                    const layers = splitLayers(v);
                    totals.boxShadowDecls++; totals.boxShadowLayers += layers.length;
                    const ins = layers.filter((l) => /\binset\b/.test(l)).length;
                    totals.insetLayers += ins;
                    hit(file, n, ins ? "box-shadow(inset)" : "box-shadow", ln);
                }
            }
            if (/(?:^|[;{\s])text-shadow\s*:(?!\s*none)/.test(ln)) { totals.textShadow++; hit(file, n, "text-shadow", ln); }
            if (/(?:^|[;{\s])filter\s*:[^;]*drop-shadow/.test(ln) || /^\s*\d+%[^{]*\{[^}]*drop-shadow/.test(ln)) { totals.filterDropShadow++; hit(file, n, "filter:drop-shadow", ln); }
            if (/(?:^|[;{\s])filter\s*:[^;]*blur\(/.test(ln) && !/backdrop-filter/.test(ln)) { totals.filterBlur++; hit(file, n, "filter:blur", ln); }
            if (/backdrop-filter\s*:[^;]*blur\(/.test(ln)) { totals.backdropBlur++; hit(file, n, "backdrop-filter:blur", ln); }
            if (/(linear|radial|conic)-gradient\(/.test(ln) && !/mask(-image)?\s*:/.test(ln)) { totals.gradients++; hit(file, n, "gradient", ln); }
            if (/@keyframes\s+/.test(ln)) totals.keyframes++;
            if (/animation(-iteration-count)?\s*:[^;]*\binfinite\b/.test(ln)) { totals.infiniteAnimations++; hit(file, n, "animation:infinite", ln); }
        });
        if (tpl) {
            tpl.split("\n").forEach((ln, i) => {
                const n = i + 1;
                const cls = [...ln.matchAll(/\bclass="([^"]*)"/g)].map((m) => m[1]).join(" ");
                if (!cls) return;
                const tw = (re, key, kind) => { const c = cls.match(re); if (c) { totals[key] += c.length; hit(file, n, kind, cls); } };
                tw(/(?:^|\s)(?:[\w-]+:)*shadow(?:-(?:sm|md|lg|xl|2xl|inner))?(?=\s|$)/g, "twShadow", "tw:shadow");
                tw(/(?:^|\s)(?:[\w-]+:)*drop-shadow(?:-[\w]+)?(?=\s|$)/g, "twDropShadow", "tw:drop-shadow");
                tw(/(?:^|\s)(?:[\w-]+:)*backdrop-blur(?:-[\w]+)?(?=\s|$)/g, "twBackdropBlur", "tw:backdrop-blur");
                tw(/(?:^|\s)(?:[\w-]+:)*bg-(?:linear|radial|conic|gradient)-[\w-]+/g, "twGradient", "tw:gradient");
                tw(/(?:^|\s)(?:[\w-]+:)*animate-(?:pulse|ping|bounce|spin|shimmer)\b/g, "twLoopAnimate", "tw:animate-loop");
            });
        }
    }
    return { totals, sites };
}

// ── COMPUTED ────────────────────────────────────────────────────────────────
async function discoverRoutes() {
    const routes = ["/paper", "/gallery", "/equation", "/morph", "/w/"];
    try {
        const r = await fetch(`${BASE}/api/visualizations?limit=1`);
        const j = await r.json();
        const slug = j?.items?.[0]?.slug;
        if (slug) routes.push(`/v/${slug}`);
    } catch { /* API down: the /v route is skipped and named in the output */ }
    routes.push("/no-such-route");
    return routes;
}

// Runs in the page. Chrome = anything that is not a canvas, inside an <svg>, or a <video>/<img>.
function pageCensus() {
    const split = (v) => {
        const out = []; let d = 0, c = "";
        for (const ch of v) { if (ch === "(") d++; if (ch === ")") d--; if (ch === "," && d === 0) { out.push(c.trim()); c = ""; } else c += ch; }
        if (c.trim()) out.push(c.trim());
        return out.filter((l) => l && l !== "none");
    };
    const lum = (s) => { const m = s.match(/rgba?\(([\d.]+),?\s*([\d.]+),?\s*([\d.]+)(?:[,/]\s*([\d.]+))?/); if (!m) return 0; return (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255; };
    const isFocusRing = (l) => /\b0px 0px 0px\b/.test(l) || /^\S*\s*0px 0px 0px/.test(l.replace(/rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)/g, "").trim());
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0; };
    const desc = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : ""}`;
    const controlSel = "button,[role=button],a[href],input,select,textarea,summary,[role=tab],[role=slider],[role=switch],[role=menuitem],[role=option],[role=checkbox],[role=radio]";
    const t = { elements: 0, boxShadowEls: 0, boxShadowLayers: 0, multiLayerShadowEls: 0, insetHighlightLayers: 0, textShadowEls: 0, filterDropShadowEls: 0, filterBlurEls: 0, backdropBlurEls: 0, controlGradientEls: 0, loopingAnimations: 0 };
    const samples = { boxShadow: {}, inset: {}, textShadow: {}, dropShadow: {}, blur: {}, backdrop: {}, gradient: {}, loop: {} };
    const bump = (k, el, v) => { const key = desc(el); samples[k][key] ??= { n: 0, v: v.slice(0, 200) }; samples[k][key].n++; };
    for (const el of document.querySelectorAll("body *")) {
        if (el.closest("svg") || el.tagName === "CANVAS" || el.tagName === "VIDEO" || el.tagName === "IMG") continue;
        if (!visible(el)) continue;
        t.elements++;
        const s = getComputedStyle(el);
        const bs = split(s.boxShadow || "none");
        if (bs.length) {
            const nonRing = bs.filter((l) => !isFocusRing(l));
            if (nonRing.length) { t.boxShadowEls++; t.boxShadowLayers += nonRing.length; bump("boxShadow", el, s.boxShadow); }
            if (nonRing.length > 1) t.multiLayerShadowEls++;
            for (const l of nonRing) if (/\binset\b/.test(l) && (lum(l) > 0.6 || /rgba?\(255, 255, 255/.test(l))) { t.insetHighlightLayers++; bump("inset", el, l); }
        }
        if (s.textShadow && s.textShadow !== "none") { t.textShadowEls++; bump("textShadow", el, s.textShadow); }
        if (/drop-shadow/.test(s.filter)) { t.filterDropShadowEls++; bump("dropShadow", el, s.filter); }
        if (/blur\((?!0px\))/.test(s.filter)) { t.filterBlurEls++; bump("blur", el, s.filter); }
        const bf = s.backdropFilter || s.webkitBackdropFilter || "none";
        if (/blur\((?!0px\))/.test(bf)) { t.backdropBlurEls++; bump("backdrop", el, bf); }
        // A gradient whose stops are all one colour is a flat tint layer (glass composites its
        // plate that way); only a gradient with differing stops is a decorative fill.
        const decorative = (bg) => (bg.match(/(?:linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)/g) || []).some((g) => new Set(g.match(/(?:rgba?|oklch|oklab|color|hsla?)\([^)]*\)/g) || []).size > 1);
        if (/gradient\(/.test(s.backgroundImage) && el.matches(controlSel) && decorative(s.backgroundImage)) { t.controlGradientEls++; bump("gradient", el, s.backgroundImage); }
    }
    for (const a of document.getAnimations()) {
        const tgt = a.effect && a.effect.target;
        if (!tgt || tgt.closest?.("svg") || tgt.tagName === "CANVAS") continue;
        const timing = a.effect.getComputedTiming();
        if (timing.iterations === Infinity && a.playState === "running") { t.loopingAnimations++; bump("loop", tgt, a.animationName || a.id || "anim"); }
    }
    const top = (o) => Object.entries(o).sort((a, b) => b[1].n - a[1].n).slice(0, 12).map(([k, v]) => ({ el: k, n: v.n, v: v.v }));
    return { totals: t, top: Object.fromEntries(Object.entries(samples).map(([k, v]) => [k, top(v)])) };
}

async function computedCensus() {
    const { chromium } = await import(join(ROOT, "web", "node_modules", "playwright", "index.mjs"));
    // §0ei: the real Chrome, new headless, never a visible window.
    const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
    const routes = (opt("--routes", null)?.split(",")) ?? (await discoverRoutes());
    const out = {};
    if (FRAMES) mkdirSync(FRAMES, { recursive: true });
    try {
        for (const theme of ["light", "dark"]) {
            for (const width of [1440, 390]) {
                const ctx = await browser.newContext({
                    viewport: { width, height: width === 390 ? 844 : 900 },
                    deviceScaleFactor: 1,
                    colorScheme: theme,
                    isMobile: width === 390,
                    hasTouch: width === 390,
                });
                await ctx.addInitScript((t) => { try { localStorage.setItem("vueuse-color-scheme", t); } catch {} }, theme);
                const page = await ctx.newPage();
                for (const route of routes) {
                    const key = `${route}|${theme}|${width}`;
                    try {
                        await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
                    } catch { /* long-poll pages: settle on load */ }
                    await page.waitForTimeout(2500);
                    out[key] = await page.evaluate(pageCensus);
                    if (FRAMES) {
                        const name = route.replace(/^\//, "").replace(/[^\w-]+/g, "_").replace(/_+$/, "") || "root";
                        await page.screenshot({ path: join(FRAMES, `${name}-${theme}-${width}.png`) });
                    }
                }
                await ctx.close();
            }
        }
    } finally {
        await browser.close();
    }
    const sum = {};
    for (const v of Object.values(out)) for (const [k, n] of Object.entries(v.totals)) if (k !== "elements") sum[k] = (sum[k] ?? 0) + n;
    return { base: BASE, routes, sum, perPage: out };
}

const result = { tool: "ds-census", at: new Date().toISOString(), static: staticCensus() };
if (!STATIC_ONLY) result.computed = await computedCensus();
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
