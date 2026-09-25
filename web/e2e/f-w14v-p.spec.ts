// SERVED MODEL: claude-opus-5-5
import { expect, test, type Page, type Route } from "@playwright/test";
import { ENTRY } from "./fixtures/gallery";
import { seededViz } from "./fixtures/seed";

/**
 * X.F.W14V.p — the anonymous publish path (F-W14V.md §1 `.p`, COHESION §0cz;
 * owner frame `fourier/evidence/W14/owner-2026-09-24-configurator-shell-band.png`).
 *
 * p1 — signed out, Publish opens the shell's own inline sign-in (the account
 *      popover in the app dock) instead of a toast, and the publish RESUMES once
 *      the person signs in: one save, sent with the new session, one lift to
 *      public.
 * p2 — a stale sign-in (the slug is remembered, its session token is not — the
 *      shape the owner frame shows: the client believes it is signed in, so
 *      the save is sent with no session): the server's typed
 *      answer, 401 `urn:contract:owner-required`, is the server contract and is
 *      not stubbed here. It must never surface as the raw "A session is required
 *      to publish." toast (the owner frame); it ends the stale local sign-in and
 *      reaches the same inline sign-in, then resumes.
 * p3 — a toast never covers the controls pane (the Configurator's aside), at
 *      1440×900 and 1024×768.
 *
 * Served from :3100 (BASE_URL) against the API on :8000: sign-in is the real
 * `POST /api/sessions`; only the save and the lift are fulfilled here, so a run
 * leaves no public piece behind. `FW14V_PHASE` names the frames.
 */

const PHASE = process.env.FW14V_PHASE ?? "after";
const FRAMES = "e2e/screenshots/f-w14v/p";
const RAW = /session is required/i;

async function frame(page: Page, name: string): Promise<void> {
    const w = page.viewportSize()!.width;
    await page.screenshot({ path: `${FRAMES}/${PHASE}-${name}-${w}.png` });
}

interface Tally {
    posts: number;
    patches: number;
    tokens: (string | undefined)[];
}

/** The save and the lift, fulfilled; with `passAnonymous`, a save sent with no session reaches the real API. */
async function routePublish(page: Page, passAnonymous = false): Promise<Tally> {
    const saved = { ...ENTRY, slug: "quiet-amber-harbor-finch", visibility: "draft", title: null };
    const tally: Tally = { posts: 0, patches: 0, tokens: [] };
    await page.route("**/api/visualizations", async (route: Route) => {
        if (route.request().method() !== "POST") return route.fallback();
        const token = route.request().headers()["x-session-token"];
        if (passAnonymous && !token) return route.fallback();
        tally.posts++;
        tally.tokens.push(token);
        await route.fulfill({ status: 201, contentType: "application/json", headers: { ETag: '"p1"' }, body: JSON.stringify(saved) });
    });
    await page.route(`**/api/visualizations/${saved.slug}`, (route) => {
        if (route.request().method() === "PATCH") tally.patches++;
        return route.fulfill({ status: 200, contentType: "application/json", headers: { ETag: '"p2"' }, body: JSON.stringify({ ...saved, visibility: "public" }) });
    });
    return tally;
}

async function pressPublish(page: Page): Promise<void> {
    await page.goto(`/v/${seededViz().slug}`);
    const edit = page.getByRole("button", { name: "Edit contour" }).first();
    await edit.hover();
    const publish = page.getByRole("button", { name: /^Publish to Gallery/ }).first();
    await expect(publish).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(600);
    await publish.click();
}

/** The press reaches the inline sign-in, and no toast says anything about it. */
async function expectInlineSignIn(page: Page, name: string): Promise<void> {
    const field = page.locator("#user-slug-input");
    await expect(field, "Publish opens the shell's inline sign-in").toBeVisible({ timeout: 10_000 });
    await expect(field).toBeFocused();
    await page.waitForTimeout(1_500);
    await expect(page.getByText(RAW), "never the raw owner_required toast").toHaveCount(0);
    await expect(page.getByText("Log in to publish"), "never a dead-end toast").toHaveCount(0);
    await frame(page, name);
}

async function signInAndExpectPublished(page: Page, tally: Tally): Promise<void> {
    await page.getByRole("button", { name: "Generate a new slug" }).click();
    await expect(page.getByText("Published to the gallery").first(), "the publish resumes after sign-in").toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(RAW)).toHaveCount(0);
    expect(tally.posts, "one save").toBe(1);
    expect(tally.patches, "one lift to public").toBe(1);
    const token = await page.evaluate(() => localStorage.getItem("fourier-user-token"));
    expect(token, "signed in").toBeTruthy();
    expect(tally.tokens[0], "the save carries the new session").toBe(token);
}

test.describe("F.W14V.p — a signed-out Publish reaches the inline sign-in and resumes", () => {
    test("p1: signed out → the inline sign-in, then the publish resumes", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        const tally = await routePublish(page);
        await pressPublish(page);
        await expectInlineSignIn(page, "p1-signin");
        expect(tally.posts, "nothing is sent before sign-in").toBe(0);
        await signInAndExpectPublished(page, tally);
        await frame(page, "p1-published");
    });

    test("p2: a stale sign-in → the server's owner_required reaches the inline sign-in, never the raw toast", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.addInitScript(() => {
            if (sessionStorage.getItem("fw14v-p2")) return;
            sessionStorage.setItem("fw14v-p2", "1");
            localStorage.setItem("fourier-user-slug", "stale-slug-long-gone");
        });
        let refused = 0;
        page.on("response", (r) => {
            if (r.url().endsWith("/api/visualizations") && r.request().method() === "POST" && r.status() === 401) refused++;
        });
        const tally = await routePublish(page, true);
        await pressPublish(page);
        await expectInlineSignIn(page, "p2-signin");
        expect(refused, "the real server answered 401 owner_required").toBe(1);
        await signInAndExpectPublished(page, tally);
    });
});

test.describe("F.W14V.p — a toast never covers the controls pane", () => {
    for (const vp of [
        { width: 1440, height: 900 },
        { width: 1024, height: 768 },
    ]) {
        test(`p3 @${vp.width}: the toast and the Configurator's aside do not intersect`, async ({ page }) => {
            await page.setViewportSize(vp);
            const tally = await routePublish(page);
            await page.addInitScript(() => {
                if (!localStorage.getItem("fourier-user-token")) localStorage.setItem("fourier-user-slug", "e2e-publisher");
            });
            await pressPublish(page);
            const toast = page.locator("li").filter({ hasText: "Published to the gallery" }).first();
            await expect(toast).toBeVisible({ timeout: 15_000 });
            expect(tally.posts).toBe(1);
            await page.waitForTimeout(800);
            await frame(page, "p3-toast");
            const aside = page.locator(".viz-configurator .configurator-aside").first();
            await expect(aside).toBeVisible();
            const a = (await aside.boundingBox())!;
            const t = (await toast.boundingBox())!;
            const overlap = {
                x: Math.max(0, Math.min(a.x + a.width, t.x + t.width) - Math.max(a.x, t.x)),
                y: Math.max(0, Math.min(a.y + a.height, t.y + t.height) - Math.max(a.y, t.y)),
            };
            expect(overlap.x * overlap.y, `toast ${JSON.stringify(t)} over aside ${JSON.stringify(a)}`).toBe(0);
        });
    }
});
