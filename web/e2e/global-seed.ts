// SERVED MODEL: claude-opus-5-5
import * as fs from "node:fs";
import * as path from "node:path";

import { request, type APIRequestContext, type FullConfig } from "@playwright/test";

import { SEED_ENV, SEED_NAMESPACE, type SeededViz } from "./fixtures/seed";

/**
 * X.F.W14.s (addendum (f), COHESION §0cm) — the suite seeds what it assumes,
 * through the public `/api`, before any spec runs; the returned function is
 * the global teardown and removes what it made.
 *
 * The saved visualization is minted the way the app mints one: a session,
 * the image upload, the contour extraction, then a public
 * `POST /api/visualizations` titled and tagged with `SEED_NAMESPACE`.
 *
 * IDEMPOTENT. The owning session token and the row's slug are recorded in
 * `e2e/.seed/<host>.json` (a self-ignoring directory). A re-run, including
 * one after a run that died before its teardown, first reads that record: a
 * live row that still carries the namespace is reused, so a re-run never adds
 * a second one. Teardown soft-deletes the row with its own session
 * (`DELETE /api/visualizations/<slug>` under `If-Match`), ends the session and
 * removes the record. The uploaded image stays: images are content-addressed
 * (`/api/images/by-hash`) and the API exposes no image delete, so a re-upload
 * of the same bytes resolves to the same asset.
 */

const SEED_IMAGE = path.resolve(import.meta.dirname, "../../assets/animals/golden-retriever.webp");
const SEED_CONTOUR = {
    strategy: "auto",
    resize: 800,
    blur_sigma: 2.0,
    n_harmonics: 100,
    n_points: 1024,
    n_classes: 3,
    min_contour_length: 40,
    min_contour_area: 0.01,
    max_contours: 5,
    smooth_contours: 0.1,
} as const;

interface SeedRecord extends SeededViz {
    token: string;
}

function recordPath(baseURL: string): string {
    const dir = path.resolve(import.meta.dirname, ".seed");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, ".gitignore"), "*\n");
    return path.join(dir, `${new URL(baseURL).host.replace(/[^\w.-]/g, "_")}.json`);
}

function readRecord(file: string): SeedRecord | null {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8")) as SeedRecord;
}

async function ok(res: Awaited<ReturnType<APIRequestContext["get"]>>, what: string): Promise<void> {
    if (!res.ok()) throw new Error(`e2e seed: ${what} → ${res.status()} ${await res.text()}`);
}

/** The recorded row, when it is still live and still ours. */
async function reusable(api: APIRequestContext, rec: SeedRecord): Promise<boolean> {
    const res = await api.get(`/api/visualizations/${rec.slug}`);
    if (!res.ok()) return false;
    const row = (await res.json()) as { title?: string | null; deleted_at?: string | null };
    return row.title === SEED_NAMESPACE && !row.deleted_at;
}

async function mint(api: APIRequestContext): Promise<SeedRecord> {
    const session = await api.post("/api/sessions");
    await ok(session, "POST /api/sessions");
    const { token } = (await session.json()) as { token: string };
    const headers = { "X-Session-Token": token };

    const image = await api.post("/api/images", {
        headers,
        multipart: {
            file: { name: path.basename(SEED_IMAGE), mimeType: "image/webp", buffer: fs.readFileSync(SEED_IMAGE) },
        },
    });
    await ok(image, "POST /api/images");
    const { image_slug } = (await image.json()) as { image_slug: string };

    const contour = await api.post(`/api/images/${image_slug}/extract-contour`, {
        headers,
        data: { contour_settings: SEED_CONTOUR },
        timeout: 120_000,
    });
    await ok(contour, `POST /api/images/${image_slug}/extract-contour`);
    const { contour_hash } = (await contour.json()) as { contour_hash: string };

    const created = await api.post("/api/visualizations", {
        headers,
        data: {
            visibility: "public",
            image_slug,
            contour_hash,
            active_bases: ["fourier-epicycles"],
            n_harmonics: 50,
            title: SEED_NAMESPACE,
            tags: [SEED_NAMESPACE],
        },
    });
    if (created.status() !== 201) {
        throw new Error(`e2e seed: POST /api/visualizations → ${created.status()} ${await created.text()}`);
    }
    const { slug } = (await created.json()) as { slug: string };
    return { token, slug, image_slug };
}

async function remove(api: APIRequestContext, rec: SeedRecord): Promise<void> {
    const headers = { "X-Session-Token": rec.token };
    const live = await api.get(`/api/visualizations/${rec.slug}`);
    if (live.ok()) {
        const etag = live.headers()["etag"];
        if (!etag) throw new Error(`e2e seed: GET /api/visualizations/${rec.slug} carried no ETag`);
        const del = await api.delete(`/api/visualizations/${rec.slug}`, {
            headers: { ...headers, "If-Match": etag },
        });
        await ok(del, `DELETE /api/visualizations/${rec.slug}`);
    }
    await ok(await api.delete("/api/sessions", { headers }), "DELETE /api/sessions");
}

export default async function globalSeed(config: FullConfig): Promise<() => Promise<void>> {
    const baseURL = config.projects[0].use.baseURL;
    if (!baseURL) throw new Error("e2e seed: no baseURL on the first project");
    const file = recordPath(baseURL);
    const api = await request.newContext({ baseURL });

    let rec = readRecord(file);
    if (rec && !(await reusable(api, rec))) rec = null;
    if (!rec) {
        rec = await mint(api);
        fs.writeFileSync(file, JSON.stringify(rec, null, 2));
    }
    await api.dispose();

    const handle: SeededViz = { slug: rec.slug, image_slug: rec.image_slug };
    process.env[SEED_ENV] = JSON.stringify(handle);

    const seeded = rec;
    return async () => {
        const td = await request.newContext({ baseURL });
        try {
            await remove(td, seeded);
            fs.rmSync(file, { force: true });
        } finally {
            await td.dispose();
        }
    };
}
