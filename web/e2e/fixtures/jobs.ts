import type { Page, Response } from "@playwright/test";

/**
 * O16 frame 50: the long computations are compute jobs (docs/api/compute-jobs.md).
 * A POST answers 202 with a ticket; the job's events stream carries its stage,
 * its partials and, last, its `result`. A spec that used to wait on a
 * synchronous compute response waits on the job instead: the POST, then the
 * stream it opened, read to its end.
 */

export const EQUATION_JOB = "**/api/equations/jobs";
export const IMAGE_JOB = "**/api/images/*/jobs";
export const CONTOUR_JOB = "**/api/contours/*/jobs";
export const JOB_EVENTS = "**/api/jobs/*/events*";

const EVENTS_PATH = /\/api\/jobs\/[^/]+\/events$/;

export type JobKind = "equations" | "images" | "contours";

export function isJobPost(r: Response, kind?: JobKind): boolean {
    if (r.request().method() !== "POST") return false;
    const path = new URL(r.url()).pathname;
    const re = kind
        ? new RegExp(`/api/${kind}${kind === "equations" ? "" : "/[^/]+"}/jobs$`)
        : /\/api\/(equations|images\/[^/]+|contours\/[^/]+)\/jobs$/;
    return re.test(path);
}

export function isJobStream(r: Response): boolean {
    return EVENTS_PATH.test(new URL(r.url()).pathname);
}

/**
 * Arm before the action that starts the job; resolves once the job's first
 * events stream has been read to its end (the `result`, an `error` or a
 * `cancelled`). Gives the POST (202) and the stream.
 */
export function waitForJob(
    page: Page,
    kind?: JobKind,
    timeout = 60_000,
): Promise<{ post: Response; events: Response }> {
    const post = page.waitForResponse((r) => isJobPost(r, kind), { timeout });
    const events = page.waitForResponse(
        (r) => isJobStream(r) && !new URL(r.url()).searchParams.has("after"),
        { timeout },
    );
    return Promise.all([post, events]).then(async ([p, e]) => {
        await e.finished();
        return { post: p, events: e };
    });
}

/**
 * Answer the job POST at `postGlob` with a stub ticket whose stream carries
 * `result` at once: the job-era form of fulfilling the synchronous route.
 */
export async function stubJob(page: Page, postGlob: string, result: unknown): Promise<void> {
    let n = 0;
    await page.route(postGlob, async (route) => {
        if (route.request().method() !== "POST") return route.fallback();
        const id = `e2e-stub-${++n}`;
        await route.fulfill({
            status: 202,
            contentType: "application/json",
            body: JSON.stringify({
                id,
                kind: "stub",
                state: "done",
                status_url: `/api/jobs/${id}`,
                events_url: `/api/jobs/${id}/events`,
            }),
        });
    });
    await page.route("**/api/jobs/e2e-stub-*", (route) =>
        route.request().method() === "DELETE" ? route.fulfill({ status: 204 }) : route.fallback(),
    );
    await page.route("**/api/jobs/e2e-stub-*/events*", (route) =>
        route.fulfill({
            status: 200,
            contentType: "text/event-stream",
            body: `id: 1\nevent: result\ndata: ${JSON.stringify(result)}\n\n`,
        }),
    );
}

/**
 * Hold back a job's `result` (its bases) by `ms` while its earlier events go
 * through: the first stream is answered with every event but the result, so
 * the page draws its partials and then resumes with `?after=`; that resume is
 * delayed. Stands in for a slow bases compute on a slow runner. Returns a
 * reader for the moment the held result was released (0 while still held).
 */
export async function holdJobResult(page: Page, ms: number): Promise<() => number> {
    let releasedAt = 0;
    await page.route(JOB_EVENTS, async (route) => {
        if (new URL(route.request().url()).searchParams.has("after")) {
            await new Promise((r) => setTimeout(r, ms));
            releasedAt = Date.now();
            return route.continue().catch(() => {});
        }
        const res = await route.fetch();
        const body = await res.text();
        const kept = body
            .split(/\n\n/)
            .filter((block) => block.trim() && !/^event: result$/m.test(block))
            .map((block) => `${block}\n\n`)
            .join("");
        await route.fulfill({ status: res.status(), contentType: "text/event-stream", body: kept });
    });
    return () => releasedAt;
}
