// F.REL .d — the headless production check (F-REL.md §Units `.d`).
//
// Usage: node scripts/prod-verify.mjs <spa-origin> <api-origin> <out-dir> <image>...
// e.g.   node scripts/prod-verify.mjs https://fourier.babb.dev \
//            https://api.fourier.babb.dev ~/.dev-logs/frel/d-verify \
//            assets/portraits/daraksha.jpg ~/.fourier-samples/daraksha.jpeg
//
// Every API call is made from a page on <spa-origin>, so the browser enforces
// the real cross-origin contract (preflights for PATCH/DELETE + If-Match, the
// exposed ETag). Rows, in the spec's order:
//   upload (each image reads upright: the served thumbnail is portrait),
//   extract (the production contour pipeline, default settings),
//   preview (epicycles computed; /v/<slug> renders a canvas),
//   publish · remix · diff, edit (PATCH + If-Match) · delete, gallery.
// Writes <out-dir>/rows.json and screenshots. Chrome runs headless (COHESION
// §0ei). Everything the probe creates it deletes. Exit 0 only when every row
// is GREEN.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(join(root, "web", "package.json"))("playwright");

const [spa, api, outDir, ...images] = process.argv.slice(2);
if (!spa || !api || !outDir || images.length === 0) {
    console.error("usage: prod-verify.mjs <spa-origin> <api-origin> <out-dir> <image>...");
    process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const rows = [];
const row = (name, ok, detail) => {
    rows.push({ row: name, ok, detail });
    console.log(`${ok ? "GREEN" : "RED  "} ${name} — ${JSON.stringify(detail)}`);
};

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
await page.goto(`${spa}/`, { waitUntil: "domcontentloaded" });

// One cross-origin call from the SPA's origin. Returns status, ETag (only
// readable when the API exposes it) and the parsed body. The session token is
// held here, not in the page, because the probe navigates the page.
let token = null;
const call = (path, init = {}) =>
    page.evaluate(
        async ({ api, path, init, token }) => {
            const headers = { ...(init.headers ?? {}) };
            if (token) headers["X-Session-Token"] = token;
            let body = init.body;
            if (init.file) {
                const bytes = Uint8Array.from(atob(init.file.b64), (c) => c.charCodeAt(0));
                body = new FormData();
                body.append("file", new File([bytes], init.file.name, { type: "image/jpeg" }));
            } else if (body !== undefined) {
                headers["Content-Type"] = "application/json";
                body = JSON.stringify(body);
            }
            try {
                const r = await fetch(`${api}${path}`, { method: init.method ?? "GET", headers, body });
                const text = await r.text();
                let json = null;
                try { json = JSON.parse(text); } catch { /* non-JSON body */ }
                return { status: r.status, etag: r.headers.get("ETag"), json, text: text.slice(0, 300) };
            } catch (e) {
                return { status: 0, etag: null, json: null, text: String(e) };
            }
        },
        { api, path, init, token },
    );

// A thumbnail decoded in the browser: portrait means the EXIF orientation was
// honoured (both samples are portrait photographs).
const decodedSize = (path) =>
    page.evaluate(async ({ api, path }) => {
        const r = await fetch(`${api}${path}`);
        if (!r.ok) return { status: r.status };
        const bmp = await createImageBitmap(await r.blob());
        return { status: r.status, w: bmp.width, h: bmp.height };
    }, { api, path });

// ---- session ---------------------------------------------------------------
const session = await call("/api/sessions", { method: "POST" });
token = session.json?.token ?? null;
row("session", session.status === 200 && !!token, { status: session.status, user: session.json?.user_slug });

// ---- upload + upright + extract + preview, per image -------------------------
// Only the first image (a repo asset) is published, remixed and shown in the
// gallery: the later images may be private samples and stay private (draft).
const created = []; // visualization slugs the probe must delete
let primary = null;
for (const [i, imagePath] of images.entries()) {
    const name = basename(imagePath);
    const b64 = readFileSync(imagePath).toString("base64");
    const up = await call("/api/images", { method: "POST", file: { b64, name } });
    const slug = up.json?.image_slug;
    row(`upload ${name}`, up.status === 200 && !!slug, { status: up.status, slug, text: up.json ? undefined : up.text });
    if (!slug) continue;

    const thumb = await decodedSize(`/api/images/${slug}/thumbnail`);
    row(`upright ${name}`, thumb.status === 200 && thumb.h > thumb.w, thumb);

    const t0 = Date.now();
    const ex = await call(`/api/images/${slug}/extract-contour`, {
        method: "POST",
        body: { contour_settings: {} },
    });
    let hash = ex.json?.contour_hash;
    row(`extract ${name}`, ex.status === 200 && !!hash && ex.json.point_count > 0, {
        status: ex.status,
        ms: Date.now() - t0,
        source: ex.json?.source,
        points: ex.json?.point_count,
        text: hash ? undefined : ex.text,
    });
    if (!hash) {
        // The extract row is already RED. A drawn contour (the client's own
        // saveContour path) lets the remaining rows still be read; it never
        // turns the extract row green.
        const drawn = await call("/api/contours", {
            method: "POST",
            body: { image_slug: slug, points: { x: [0, 1, 1, 0, 0], y: [0, 0, 1, 1, 0] } },
        });
        hash = drawn.json?.contour_hash;
        console.log(`      (drawn contour for the downstream rows: ${drawn.status})`);
        if (!hash) continue;
    }

    const epi = await call(`/api/contours/${hash}/compute/epicycles`, {
        method: "POST",
        body: { n_harmonics: 64, n_points: 512 },
    });
    row(`epicycles ${name}`, epi.status === 200 && !!epi.json?.data, { status: epi.status, text: epi.json?.data ? undefined : epi.text });

    const viz = await call("/api/visualizations", {
        method: "POST",
        body: {
            image_slug: slug,
            contour_hash: hash,
            active_bases: ["fourier-epicycles"],
            n_harmonics: 64,
            title: `F.REL .d probe ${i}`,
        },
    });
    const vslug = viz.json?.slug;
    row(`create ${name}`, (viz.status === 200 || viz.status === 201) && !!vslug, { status: viz.status, slug: vslug, etag: viz.etag });
    if (!vslug) continue;
    created.push(vslug);
    if (i === 0) primary = vslug;
}

// ---- preview: the SPA renders the visualization ------------------------------
if (primary) {
    await page.goto(`${spa}/v/${primary}`, { waitUntil: "domcontentloaded" });
    const canvas = await page
        .locator("canvas")
        .first()
        .waitFor({ state: "visible", timeout: 30_000 })
        .then(() => true, () => false);
    await page.screenshot({ path: join(outDir, "preview-1440.png") });
    row("preview /v/<slug>", canvas, { slug: primary });
}

// ---- publish · remix · diff ----------------------------------------------------
let child = null;
if (primary) {
    const pub = await call(`/api/visualizations/${primary}/publish`, { method: "POST" });
    row("publish", pub.status === 200 && pub.json?.visibility === "public", { status: pub.status, visibility: pub.json?.visibility, text: pub.json ? undefined : pub.text });

    const rmx = await call(`/api/visualizations/${primary}/remix`, {
        method: "POST",
        body: { n_harmonics: 32 },
    });
    child = rmx.json?.slug ?? null;
    if (child) created.push(child);
    row("remix", rmx.status === 201 && !!child, { status: rmx.status, child, text: child ? undefined : rmx.text });

    if (child) {
        const diff = await call(`/api/visualizations/${child}/diff`);
        row("diff", diff.status === 200 && !!diff.json, { status: diff.status, keys: diff.json ? Object.keys(diff.json) : undefined, text: diff.json ? undefined : diff.text });
    } else {
        row("diff", false, { reason: "no remix child" });
    }

    // ---- gallery: the public listing carries the published row, the page renders
    const list = await call("/api/visualizations?limit=50&sort=newest");
    const listed = (list.json?.items ?? []).some((v) => v.slug === primary);
    await page.goto(`${spa}/gallery`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4_000);
    await page.screenshot({ path: join(outDir, "gallery-1440.png") });
    row("gallery", list.status === 200 && listed, { status: list.status, listed, items: list.json?.items?.length });
}

// ---- edit (PATCH + If-Match, ETag exposed) · delete, for every created row ---
for (const [k, vslug] of [...created].reverse().entries()) {
    const got = await call(`/api/visualizations/${vslug}`);
    if (k === 0) {
        const patch = await call(`/api/visualizations/${vslug}`, {
            method: "PATCH",
            headers: got.etag ? { "If-Match": got.etag } : {},
            body: { title: "F.REL .d probe — edited" },
        });
        row("edit (PATCH, If-Match)", !!got.etag && patch.status === 200 && patch.json?.title === "F.REL .d probe — edited", { etagExposed: !!got.etag, status: patch.status, text: patch.json ? undefined : patch.text });
    }
    const fresh = await call(`/api/visualizations/${vslug}`);
    const del = await call(`/api/visualizations/${vslug}`, {
        method: "DELETE",
        headers: fresh.etag ? { "If-Match": fresh.etag } : {},
    });
    row(`delete ${vslug}`, del.status === 204, { status: del.status, text: del.status === 204 ? undefined : del.text });
}

const cors = consoleErrors.filter((e) => /CORS|Access-Control/i.test(e));
row("no CORS console errors", cors.length === 0, { cors: cors.slice(0, 5) });

await browser.close();
writeFileSync(join(outDir, "rows.json"), `${JSON.stringify({ spa, api, at: new Date().toISOString(), rows }, null, 2)}\n`);
const red = rows.filter((r) => !r.ok).length;
console.log(`${rows.length - red}/${rows.length} GREEN`);
process.exit(red === 0 ? 0 : 1);
