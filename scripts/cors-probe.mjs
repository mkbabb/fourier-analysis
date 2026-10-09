// F.REL .c — the headless browser edit + delete, cross-origin, through the
// web client's own bytes (web/src/lib/api.ts, served by Vite dev).
//
// Usage: node scripts/cors-probe.mjs <spa-origin> <api-origin> <image-path>
// Driven by scripts/cors-probe.sh, which boots the local stack. Chrome runs
// headless (COHESION §0ei). Exits non-zero on any failed step.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(join(root, "web", "package.json"))("playwright");

const [spa, api, imagePath] = process.argv.slice(2);
if (!spa || !api || !imagePath) {
    console.error("usage: cors-probe.mjs <spa-origin> <api-origin> <image-path>");
    process.exit(2);
}
const image = readFileSync(imagePath).toString("base64");

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const corsErrors = [];
page.on("console", (m) => {
    if (m.type() === "error" && /CORS|Access-Control/i.test(m.text())) corsErrors.push(m.text());
});
// Chromium does not surface CORS preflights as page requests; the API's own
// access log (read by cors-probe.sh) is the preflight witness.
const requests = [];
page.on("request", (r) => {
    if (r.url().startsWith(api)) requests.push(`${r.method()} ${new URL(r.url()).pathname}`);
});

await page.goto(`${spa}/`, { waitUntil: "domcontentloaded" });

const result = await page.evaluate(
    async ({ image, name }) => {
        const c = await import("/src/lib/api.ts");
        const steps = [];
        const step = (label, value) => steps.push([label, value]);

        const session = await c.createSession();
        c.setSessionToken(session.token);
        step("session", session.user_slug);

        const bytes = Uint8Array.from(atob(image), (ch) => ch.charCodeAt(0));
        const meta = await c.uploadImage(new File([bytes], name, { type: "image/png" }));
        step("upload", meta.image_slug);

        const contour = await c.saveContour(meta.image_slug, {
            x: [0, 1, 1, 0, 0],
            y: [0, 0, 1, 1, 0],
        });
        step("contour", contour.contour_hash.slice(0, 12));

        const created = await c.createVisualization({
            image_slug: meta.image_slug,
            contour_hash: contour.contour_hash,
            active_bases: ["fourier-epicycles"],
            n_harmonics: 8,
            visibility: "draft",
        });
        step("create.etag", created.etag);

        const read = await c.getVisualization(created.data.slug);
        step("read.etag", read.etag);

        // The edit: the store's exact call (If-Match from the read's ETag).
        const edited = await c.updateVisualization(
            created.data.slug,
            { title: "F.REL .c cors probe" },
            read.etag,
        );
        step("edit.title", edited.data.title);
        step("edit.etag", edited.etag);

        // Every remaining client request header on a preflighted verb:
        // If-Match + Idempotency-Key + Content-Type + X-Session-Token.
        const again = await c.apiFetch(`/api/visualizations/${created.data.slug}`, "frel-cors", {
            method: "PATCH",
            body: { description: "edited with every client header" },
            ifMatch: edited.etag,
            idempotencyKey: crypto.randomUUID(),
        });
        step("edit2.description", again.description);

        const fresh = await c.getVisualization(created.data.slug);
        await c.deleteVisualization(created.data.slug, fresh.etag);
        step("delete", "204");

        // Soft delete (CRUD-CONTRACT §5): the owner still reads the row, now
        // stamped deleted_at (restorable in grace); anyone else gets 404.
        const owned = await c.getVisualization(created.data.slug);
        step("owner-read-after-delete.deleted_at", owned.data.deleted_at ?? "null");
        c.setSessionToken(null);
        let anon;
        try {
            await c.getVisualization(created.data.slug);
            anon = "still readable";
        } catch (e) {
            anon = `${e.status ?? "?"} ${e.type ?? e.message}`;
        }
        step("anon-read-after-delete", anon);
        return steps;
    },
    { image, name: basename(imagePath) },
);

await browser.close();

for (const [label, value] of result) console.log(`${label}: ${value}`);
console.log(`requests: ${requests.join(" · ")}`);
const map = Object.fromEntries(result);
const failures = [];
for (const k of ["create.etag", "read.etag", "edit.etag"]) if (!map[k]) failures.push(`${k} unreadable`);
if (map["edit.title"] !== "F.REL .c cors probe") failures.push("edit did not land");
if (map["edit2.description"] !== "edited with every client header") failures.push("second edit did not land");
if (map["owner-read-after-delete.deleted_at"] === "null") failures.push("delete did not stamp deleted_at");
if (!/^404 /.test(map["anon-read-after-delete"])) failures.push(`delete not observed: ${map["anon-read-after-delete"]}`);
if (new URL(spa).origin === new URL(api).origin) failures.push("SPA and API share an origin: no CORS exercised");
if (corsErrors.length) failures.push(`CORS console errors: ${corsErrors.join(" | ")}`);
if (failures.length) {
    console.log(`cors-probe: FAIL — ${failures.join("; ")}`);
    process.exit(1);
}
console.log("cors-probe: PASS");
