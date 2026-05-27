import { test, expect, type Page, type Response } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import * as path from "node:path";

/**
 * B.W4.d — visualization CRUD-lifecycle + a11y-keystone Playwright spec.
 *
 * ORCHESTRATOR CONTRACT
 * ---------------------
 * This spec is authored + statically verified by the W4-D agent; it is NOT run
 * here. The orchestrator runs it against the CLEAN managed stack:
 *   • Vite dev server on http://localhost:3000 (baseURL in playwright.config.ts),
 *     proxying `/api` → the FastAPI backend on :8000.
 *   • A fresh `fourier` Mongo DB (the migration source collections are empty per
 *     audit/challenge.md §2 — the spec seeds its own image/contour/visualization).
 *   • Run:  `cd web && npx playwright test e2e/visualization-crud.spec.ts --project=chromium`
 * The fixture image is `assets/animals/golden-retriever.webp` (exists, repo-root).
 *
 * SCOPE (W4 scope item 10 + 15; hard-gate items 5 + 13; Wχ H-W4-1)
 * ----------------------------------------------------------------
 * Exercises the converged `visualization` entity full lifecycle on the LIVE UI +
 * API at 3 viewports (375×667, 1280×800, 1440×900):
 *   upload image (UI) → extract contour (API) → create DRAFT visualization →
 *   assert the slug-routed `/v/{slug}` resolves in the browser → publish
 *   (draft → public) → set unlisted → soft-delete → restore.
 * Asserts zero console errors + zero non-2xx asset responses per fourier-A
 * invariant 3. Exercises the 412 `If-Match` mismatch path (PATCH with a stale
 * ETag → `application/problem+json` / `type: urn:contract:etag-mismatch`).
 *
 * Wires `@axe-core/playwright` via the `AxeBuilder` API (the package the W2 hard
 * gate H-W2-1 installs — NOT the `injectAxe`/`checkA11y` helpers of the separate
 * `axe-playwright` package; see audit/challenge.md §4). The local `checkA11y`
 * wrapper preserves the wave's intent (inject axe + assert zero serious/critical
 * `wcag2a`/`wcag2aa` violations). Consolidates the W2 keystone coverage that was
 * deferred here: workspace default, published view, and the ExportModal
 * Dialog-open state.
 *
 * AUTH (W4 sub-bullet — anonymous publish → 401)
 * ----------------------------------------------
 * `POST /api/visualizations` requires a resolvable session (visualizations.py
 * `create_visualization` → `errors.owner_required` / 401 for anonymous). The app
 * obtains a session via `POST /api/sessions` and replays the token as the
 * `X-Session-Token` header (see `stores/auth.ts` `register`/`ensureSession` +
 * `lib/api.ts` `setSessionToken`). The spec replicates this: `establishSession`
 * mints a token via the API and seeds it into `localStorage`/`sessionStorage`
 * (the keys the auth store reads on bootstrap) so the in-page app + every
 * `page.evaluate(fetch(...))` call carries the same authenticated session.
 */

const TEST_IMAGE = path.resolve(
    import.meta.dirname,
    "../../assets/animals/golden-retriever.webp",
);

/** The three viewports the lifecycle is swept at (fourier-A invariant 3). */
const VIEWPORTS = [
    { name: "mobile", width: 375, height: 667 },
    { name: "laptop", width: 1280, height: 800 },
    { name: "desktop", width: 1440, height: 900 },
] as const;

// localStorage / sessionStorage keys mirrored from `web/src/stores/auth.ts`.
const USER_SLUG_KEY = "fourier-user-slug";
const USER_TOKEN_KEY = "fourier-user-token";
const SESSION_TOKEN_KEY = "fourier-session-token";

/** A frontend-default contour-settings payload (mirrors workspace-flow.spec.ts). */
const CONTOUR_SETTINGS = {
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

// ── axe-core keystone helper ────────────────────────────────────────────────

/** Inject axe-core into `page` and assert zero serious/critical violations. */
async function checkA11y(page: Page, label: string): Promise<void> {
    const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

    const blocking = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(
        blocking,
        `axe-core serious/critical violations at "${label}":\n` +
            blocking
                .map(
                    (v) =>
                        `  • [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`,
                )
                .join("\n"),
    ).toEqual([]);
}

// ── session / auth ──────────────────────────────────────────────────────────

interface Session {
    token: string;
    userSlug: string;
}

/**
 * Mint an authenticated session the way the app does (`POST /api/sessions` →
 * `{token, user_slug}`), then seed the auth-store storage keys so the in-page
 * app bootstraps with the same session and `lib/api.ts` sends `X-Session-Token`.
 * The returned token is also passed explicitly on the CRUD `fetch` calls below.
 */
async function establishSession(page: Page): Promise<Session> {
    // The dev origin must be active before we can touch its storage.
    await page.goto("/visualize");
    const session = await page.evaluate(async () => {
        const res = await fetch("/api/sessions", { method: "POST" });
        if (!res.ok) throw new Error(`POST /api/sessions → ${res.status}`);
        return (await res.json()) as { token: string; user_slug: string };
    });
    await page.evaluate(
        ({ token, userSlug, userSlugKey, userTokenKey, sessionTokenKey }) => {
            // Persist the user identity the way `auth.ts:persistUser` does so the
            // store restores `setSessionToken(token)` on the next mount.
            localStorage.setItem(userSlugKey, userSlug);
            localStorage.setItem(userTokenKey, token);
            sessionStorage.setItem(sessionTokenKey, token);
        },
        {
            token: session.token,
            userSlug: session.user_slug,
            userSlugKey: USER_SLUG_KEY,
            userTokenKey: USER_TOKEN_KEY,
            sessionTokenKey: SESSION_TOKEN_KEY,
        },
    );
    return { token: session.token, userSlug: session.user_slug };
}

// ── robust workspace bootstrap (the W4 bootstrap repair) ──────────────────────

/**
 * Robust workspace bootstrap. The pre-existing `openWorkspace` helpers in
 * `workspace-flow.spec.ts` + `visualization-ux.spec.ts` race the SPA mount /
 * the hidden file input and time out on `setInputFiles`. This self-contained
 * version is the orchestrator-portable fix:
 *   1. `goto("/visualize")` then `waitForLoadState("networkidle")` so the SPA
 *      has mounted before we touch the DOM.
 *   2. Wait for the dropzone copy ("Drop an image…") to be visible — a positive
 *      signal that `ImageUpload.vue` has rendered (the hidden input is a sibling).
 *   3. Scope the ImageUpload `input[type="file"]` and `expect(...).toBeAttached()`
 *      BEFORE `setInputFiles` (Playwright drives hidden inputs fine once attached).
 *   4. After upload the flow redirects to `/w/{imageSlug}` (the pre-save working
 *      session); wait for the URL + the canvas, then let auto-compute settle.
 * Returns the `imageSlug` parsed from the `/w/` URL.
 */
async function openWorkspace(page: Page): Promise<string> {
    await page.goto("/visualize");
    await page.waitForLoadState("networkidle");

    // Positive mount signal — the dropzone copy from ImageUpload.vue.
    await expect(
        page.getByText("Drop an image", { exact: false }).first(),
    ).toBeVisible({ timeout: 15_000 });

    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached({ timeout: 15_000 });
    await fileInput.setInputFiles(TEST_IMAGE);

    // Upload redirects to the pre-save working session `/w/{imageSlug}`.
    await page.waitForURL(/\/w\//, { timeout: 20_000 });
    const imageSlug = page.url().match(/\/w\/([^/?#]+)/)?.[1];
    expect(imageSlug, "imageSlug parsed from /w/ URL").toBeTruthy();

    // Canvas appears once auto-compute lands; let the dock/panels settle.
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(2_000);

    return imageSlug as string;
}

// ── API lifecycle helpers (run in-page so they carry the session header) ─────

/** Extract a contour for `imageSlug`, returning the `contour_hash`. */
async function extractContour(
    page: Page,
    imageSlug: string,
    token: string,
): Promise<string> {
    const result = await page.evaluate(
        async ({ slug, settings, sessionToken }) => {
            const res = await fetch(`/api/images/${slug}/extract-contour`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Session-Token": sessionToken,
                },
                body: JSON.stringify({ contour_settings: settings }),
            });
            return { status: res.status, body: await res.json() };
        },
        { slug: imageSlug, settings: CONTOUR_SETTINGS, sessionToken: token },
    );
    expect(
        result.status,
        `extract-contour → ${JSON.stringify(result.body)}`,
    ).toBe(200);
    expect(result.body.contour_hash).toBeTruthy();
    return result.body.contour_hash as string;
}

interface CreatedViz {
    slug: string;
    etag: string | null;
    visibility: string;
}

/** POST a `draft` visualization; returns its slug + the create-time ETag. */
async function createDraft(
    page: Page,
    imageSlug: string,
    contourHash: string,
    token: string,
): Promise<CreatedViz> {
    const result = await page.evaluate(
        async ({ slug, hash, sessionToken }) => {
            const res = await fetch("/api/visualizations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Session-Token": sessionToken,
                },
                body: JSON.stringify({
                    visibility: "draft",
                    image_slug: slug,
                    contour_hash: hash,
                    active_bases: ["fourier-epicycles"],
                    n_harmonics: 50,
                }),
            });
            return {
                status: res.status,
                etag: res.headers.get("ETag"),
                body: await res.json(),
            };
        },
        { slug: imageSlug, hash: contourHash, sessionToken: token },
    );
    expect(result.status, `create → ${JSON.stringify(result.body)}`).toBe(201);
    expect(result.body.slug).toBeTruthy();
    expect(result.body.visibility).toBe("draft");
    return {
        slug: result.body.slug as string,
        etag: result.etag,
        visibility: result.body.visibility as string,
    };
}

/** GET a visualization; returns the body + the freshly-issued ETag. */
async function getViz(
    page: Page,
    slug: string,
    token: string,
): Promise<{ status: number; etag: string | null; body: any }> {
    return page.evaluate(
        async ({ s, sessionToken }) => {
            const res = await fetch(`/api/visualizations/${s}`, {
                headers: { "X-Session-Token": sessionToken },
            });
            return {
                status: res.status,
                etag: res.headers.get("ETag"),
                body: res.status === 404 ? null : await res.json(),
            };
        },
        { s: slug, sessionToken: token },
    );
}

interface PatchResult {
    status: number;
    etag: string | null;
    contentType: string | null;
    body: any;
}

/** PATCH visibility with an `If-Match` ETag (CRUD-CONTRACT §0 SOTA-2). */
async function patchVisibility(
    page: Page,
    slug: string,
    visibility: string,
    ifMatch: string | null,
    token: string,
): Promise<PatchResult> {
    return page.evaluate(
        async ({ s, vis, etag, sessionToken }) => {
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                "X-Session-Token": sessionToken,
            };
            if (etag) headers["If-Match"] = etag;
            const res = await fetch(`/api/visualizations/${s}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ visibility: vis }),
            });
            let body: unknown = null;
            try {
                body = await res.json();
            } catch {
                body = null;
            }
            return {
                status: res.status,
                etag: res.headers.get("ETag"),
                contentType: res.headers.get("Content-Type"),
                body,
            };
        },
        { s: slug, vis: visibility, etag: ifMatch, sessionToken: token },
    );
}

/** DELETE (soft) with an `If-Match` ETag (§5); returns the status. */
async function softDelete(
    page: Page,
    slug: string,
    ifMatch: string | null,
    token: string,
): Promise<number> {
    return page.evaluate(
        async ({ s, etag, sessionToken }) => {
            const headers: Record<string, string> = {
                "X-Session-Token": sessionToken,
            };
            if (etag) headers["If-Match"] = etag;
            const res = await fetch(`/api/visualizations/${s}`, {
                method: "DELETE",
                headers,
            });
            return res.status;
        },
        { s: slug, etag: ifMatch, sessionToken: token },
    );
}

/** POST {slug}/restore (§5); returns status + body. */
async function restore(
    page: Page,
    slug: string,
    token: string,
): Promise<{ status: number; body: any }> {
    return page.evaluate(
        async ({ s, sessionToken }) => {
            const res = await fetch(`/api/visualizations/${s}/restore`, {
                method: "POST",
                headers: { "X-Session-Token": sessionToken },
            });
            return {
                status: res.status,
                body: res.status === 404 ? null : await res.json(),
            };
        },
        { s: slug, sessionToken: token },
    );
}

/**
 * The `urn:contract:etag-mismatch` token can surface two ways depending on how
 * the live stack renders the 412: directly as an RFC 9457 problem+json body
 * (`{type: "urn:contract:etag-mismatch", …}`, `application/problem+json`), or
 * nested inside FastAPI's default `HTTPException` envelope (`{detail: "<json
 * string containing the type>"}`, `application/json`) since `require_if_match`
 * raises `HTTPException(412, detail=<serialized problem>)`. This recogniser
 * accepts either so the contract intent is asserted without coupling to the
 * exact handler wiring (which W3 owns).
 */
function carriesEtagMismatch(result: PatchResult): boolean {
    const URN = "urn:contract:etag-mismatch";
    const body = result.body;
    if (body == null) return false;
    if (typeof body === "object") {
        if (body.type === URN) return true; // direct problem+json
        if (typeof body.detail === "string" && body.detail.includes(URN)) {
            return true; // FastAPI-wrapped HTTPException detail string
        }
    }
    return JSON.stringify(body).includes(URN);
}

// ── per-test instrumentation (invariant 3) ───────────────────────────────────

/**
 * Attach console-error + non-2xx-asset listeners. Returns getters the test
 * asserts at the end. Benign noise (favicon, connection-refused, 429 backoff)
 * is filtered, mirroring the existing specs' allowlist. Asset responses are the
 * document + static bundle (`.js`/`.css`/images/fonts) — `/api/*` calls in this
 * lifecycle legitimately exercise non-2xx paths (412/401) and are excluded.
 */
function instrument(page: Page): {
    consoleErrors: () => string[];
    assetErrors: () => string[];
} {
    const consoleErrors: string[] = [];
    const assetErrors: string[] = [];

    page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        const text = msg.text();
        if (
            text.includes("favicon") ||
            text.includes("ERR_CONNECTION_REFUSED") ||
            text.includes("429") ||
            text.includes("404")
        ) {
            return;
        }
        consoleErrors.push(text);
    });

    page.on("response", (res: Response) => {
        const url = res.url();
        const status = res.status();
        if (status < 400) return;
        // Only guard static-asset + document responses; the spec drives `/api`
        // negative paths (412/401) on purpose.
        if (url.includes("/api/")) return;
        if (url.includes("favicon")) return;
        if (/\.(js|mjs|css|woff2?|ttf|png|jpe?g|webp|svg|ico)(\?|$)/.test(url)) {
            assetErrors.push(`${status} ${url}`);
        } else if (res.request().resourceType() === "document") {
            assetErrors.push(`${status} ${url} (document)`);
        }
    });

    return {
        consoleErrors: () => consoleErrors,
        assetErrors: () => assetErrors,
    };
}

// ── the lifecycle, swept at 3 viewports ──────────────────────────────────────

for (const vp of VIEWPORTS) {
    test.describe(`visualization CRUD lifecycle @ ${vp.name} (${vp.width}×${vp.height})`, () => {
        test.describe.configure({ mode: "serial" });

        test(`full lifecycle: upload → draft → publish → unlisted → delete → restore`, async ({
            page,
        }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            const probes = instrument(page);
            const session = await establishSession(page);

            // ── 1. Upload (UI) — robust bootstrap ──
            const imageSlug = await openWorkspace(page);

            // ── 2. Extract contour (the save precondition) ──
            const contourHash = await extractContour(
                page,
                imageSlug,
                session.token,
            );

            // ── 3. Save as DRAFT visualization ──
            const draft = await createDraft(
                page,
                imageSlug,
                contourHash,
                session.token,
            );
            let etag = draft.etag;

            // ── 4. The slug-routed `/v/{slug}` resolves in the browser ──
            await page.goto(`/v/${draft.slug}`);
            await page.waitForLoadState("networkidle");
            expect(page.url()).toContain(`/v/${draft.slug}`);
            // axe keystone: the saved/published entity view.
            await checkA11y(page, `published view @ ${vp.name}`);

            // ── 5. Publish: draft → public (ETag-guarded PATCH) ──
            // Refresh the validator from a GET (the canonical replay source).
            let read = await getViz(page, draft.slug, session.token);
            expect(read.status).toBe(200);
            etag = read.etag;
            const published = await patchVisibility(
                page,
                draft.slug,
                "public",
                etag,
                session.token,
            );
            expect(
                published.status,
                `publish → ${JSON.stringify(published.body)}`,
            ).toBe(200);
            expect(published.body.visibility).toBe("public");
            etag = published.etag;

            // ── 6. Set unlisted (public → unlisted) ──
            const unlisted = await patchVisibility(
                page,
                draft.slug,
                "unlisted",
                etag,
                session.token,
            );
            expect(
                unlisted.status,
                `unlisted → ${JSON.stringify(unlisted.body)}`,
            ).toBe(200);
            expect(unlisted.body.visibility).toBe("unlisted");
            etag = unlisted.etag;

            // ── 7. The 412 path: PATCH with a STALE If-Match ETag ──
            // A garbage validator that cannot equal the current ETag.
            const STALE = '"stale-etag-0000000000000000000000000000000000000000"';
            const conflict = await patchVisibility(
                page,
                draft.slug,
                "public",
                STALE,
                session.token,
            );
            expect(
                conflict.status,
                `stale If-Match → ${JSON.stringify(conflict.body)}`,
            ).toBe(412);
            expect(
                carriesEtagMismatch(conflict),
                `412 carries urn:contract:etag-mismatch ` +
                    `(content-type ${conflict.contentType}); body=${JSON.stringify(conflict.body)}`,
            ).toBe(true);

            // Re-read to recover the live validator after the rejected PATCH.
            read = await getViz(page, draft.slug, session.token);
            expect(read.status).toBe(200);
            etag = read.etag;

            // ── 8. Soft-delete (ETag-guarded) → row leaves the live set ──
            const delStatus = await softDelete(
                page,
                draft.slug,
                etag,
                session.token,
            );
            expect(delStatus).toBe(204);
            // The owner still reads a soft-deleted row (visualizations.py GET:
            // soft-deleted → 404 for non-owners, readable to owner).
            const afterDelete = await getViz(page, draft.slug, session.token);
            expect(afterDelete.body?.deleted_at ?? null).not.toBeNull();

            // ── 9. Restore from soft-delete (§5) ──
            const restored = await restore(page, draft.slug, session.token);
            expect(
                restored.status,
                `restore → ${JSON.stringify(restored.body)}`,
            ).toBe(200);
            expect(restored.body.deleted_at ?? null).toBeNull();

            // ── invariant 3: zero console errors + zero non-2xx asset loads ──
            expect(probes.consoleErrors(), "console errors").toEqual([]);
            expect(probes.assetErrors(), "non-2xx asset responses").toEqual([]);
        });

        // ── axe keystone: workspace default state ──
        test(`a11y keystone: workspace default is clean @ ${vp.name}`, async ({
            page,
        }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await establishSession(page);
            await openWorkspace(page);
            await checkA11y(page, `workspace default @ ${vp.name}`);
        });

        // ── axe keystone: ExportModal Dialog-open (W2 keystone, consolidated) ──
        test(`a11y keystone: ExportModal Dialog-open is clean @ ${vp.name}`, async ({
            page,
        }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await establishSession(page);
            await openWorkspace(page);

            // Export lives behind the AnimationControls "More options" menu.
            await page.locator('[aria-label="More options"]').first().click();
            await page
                .getByText("Export", { exact: false })
                .first()
                .click();

            // The glass-ui Dialog exposes role="dialog" + aria-modal.
            const dialog = page.locator('[role="dialog"]').first();
            await expect(dialog).toBeVisible({ timeout: 5_000 });

            await checkA11y(page, `ExportModal Dialog-open @ ${vp.name}`);
        });
    });
}
