// SERVED MODEL: claude-opus-5-5
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { request, type APIRequestContext, type FullConfig } from "@playwright/test";

import { SEED_ENV, SEED_NAMESPACE, type SeededViz } from "./fixtures/seed";
import { SAMPLE_IMAGE } from "./fixtures/sample";

/**
 * X.F.W14.s (addendum (f), COHESION §0cm) — the suite seeds what it assumes,
 * through the public `/api`, before any spec runs; the returned function is
 * the global teardown and removes what it made.
 *
 * The saved visualization is minted the way the app mints one: a session,
 * the image upload, the contour extraction, then a public
 * `POST /api/visualizations` titled and tagged with `SEED_NAMESPACE`.
 *
 * KEYED PER RUN (X.F.W14.s2, COHESION §0cv). Each run records the owning
 * session token and the row's slug in its own file,
 * `e2e/.seed/<host>.<pid>.<run>.json` (a self-ignoring directory), and reads
 * only the row its own process minted, so a concurrent suite on the same host
 * never reuses this run's row and this run's teardown never deletes another
 * run's. Teardown soft-deletes the row with its own session
 * (`DELETE /api/visualizations/<slug>` under `If-Match`), ends the session and
 * removes the record.
 *
 * IDEMPOTENT. A run that died before its teardown leaves its record behind;
 * the next run reclaims every record on this host whose process is no longer
 * alive (the same removal the teardown does) before it mints its own, so dead
 * runs never accumulate rows. A live process's record is never touched. The
 * uploaded image stays: images are content-addressed (`/api/images/by-hash`)
 * and the API exposes no image delete, so a re-upload of the same bytes
 * resolves to the same asset.
 */
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
    /** The Playwright runner process that minted the row. */
    pid: number;
}

/** This run's id; with the pid it keys the record file per run. */
const RUN = randomUUID();

function seedDir(): string {
    const dir = path.resolve(import.meta.dirname, ".seed");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, ".gitignore"), "*\n");
    return dir;
}

function hostKey(baseURL: string): string {
    return new URL(baseURL).host.replace(/[^\w.-]/g, "_");
}

/** Whether `pid` names a running process (`EPERM`: it runs under another user). */
function alive(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch (err) {
        return (err as NodeJS.ErrnoException).code === "EPERM";
    }
}

/** The records dead runs on this host left behind: this process has minted
 * nothing yet, so a record carrying its pid is a dead predecessor's. */
function abandoned(dir: string, host: string): string[] {
    return fs
        .readdirSync(dir)
        .filter((name) => name.startsWith(`${host}.`) && name.endsWith(".json"))
        .map((name) => path.join(dir, name))
        .filter((file) => {
            const { pid } = JSON.parse(fs.readFileSync(file, "utf8")) as SeedRecord;
            return pid === process.pid || !alive(pid);
        });
}

async function ok(res: Awaited<ReturnType<APIRequestContext["get"]>>, what: string): Promise<void> {
    if (!res.ok()) throw new Error(`e2e seed: ${what} → ${res.status()} ${await res.text()}`);
}

async function mint(api: APIRequestContext): Promise<SeedRecord> {
    const session = await api.post("/api/sessions");
    await ok(session, "POST /api/sessions");
    const { token } = (await session.json()) as { token: string };
    const headers = { "X-Session-Token": token };

    const image = await api.post("/api/images", {
        headers,
        multipart: {
            file: { name: path.basename(SAMPLE_IMAGE), mimeType: "image/jpeg", buffer: fs.readFileSync(SAMPLE_IMAGE) },
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
    return { token, slug, image_slug, pid: process.pid };
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
    const dir = seedDir();
    const host = hostKey(baseURL);
    const api = await request.newContext({ baseURL });

    for (const stale of abandoned(dir, host)) {
        await remove(api, JSON.parse(fs.readFileSync(stale, "utf8")) as SeedRecord);
        fs.rmSync(stale, { force: true });
    }
    const rec = await mint(api);
    const file = path.join(dir, `${host}.${rec.pid}.${RUN}.json`);
    fs.writeFileSync(file, JSON.stringify(rec, null, 2));
    await api.dispose();

    const handle: SeededViz = { slug: rec.slug, image_slug: rec.image_slug };
    process.env[SEED_ENV] = JSON.stringify(handle);

    return async () => {
        const td = await request.newContext({ baseURL });
        try {
            await remove(td, rec);
            fs.rmSync(file, { force: true });
        } finally {
            await td.dispose();
        }
    };
}
