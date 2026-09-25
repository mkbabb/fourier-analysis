// SERVED MODEL: claude-opus-5-5
import { describe, expect, it } from "vitest";

/**
 * X.F.W14V.au6 — the AUDIT-2 cross-app / lib / shell family (A2-FO-L1-17,
 * L1-21, L1-22, L1-24, L1-25, and the one search-with-glyph field for the
 * hand-rolled sites of F-W14U addendum (e)). Every row here is a question of
 * where code lives and how many copies of it exist, so the falsifier reads the
 * module graph: the file set (`import.meta.glob` keys), the modules' own
 * exports, and, where a row names an importer, the importer's specifiers.
 */

const SOURCES = import.meta.glob<string>("/src/**/*.{vue,ts}", {
    query: "?raw",
    import: "default",
    eager: true,
});
const FILES = Object.keys(SOURCES);
const has = (path: string) => FILES.includes(path);
const under = (dir: string) => FILES.filter((f) => f.startsWith(dir));
const base = (f: string) => f.slice(f.lastIndexOf("/") + 1);
/** The module specifiers a source imports (static and lazy). */
function specifiers(src: string): string[] {
    const out: string[] = [];
    for (const m of src.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) out.push(m[1]);
    return out;
}
const importers = (target: string) =>
    FILES.filter((f) => specifiers(SOURCES[f]).some((s) => s === target || s.endsWith(`/${target}`)));

describe("A2-FO-L1-17 — the slug-identity control lives with auth, not under visualization/gallery", () => {
    it("UserSlugBar is components/auth/UserSlugBar.vue and the shell mounts it from there", () => {
        expect(FILES.filter((f) => base(f) === "UserSlugBar.vue")).toEqual(["/src/components/auth/UserSlugBar.vue"]);
        expect(importers("auth/UserSlugBar.vue")).toContain("/src/components/layout/AppDock.vue");
    });
});

describe("A2-FO-L1-21 — no toast compatibility shim", () => {
    it("composables/useToast.ts is gone and every toast site calls glass toast directly", () => {
        expect(has("/src/composables/useToast.ts")).toBe(false);
        expect(importers("@/composables/useToast")).toEqual([]);
    });
});

describe("A2-FO-L1-22 — no dead library code, no dead components", () => {
    it("the superseded client-side multi-basis evaluation is deleted; the one evaluators module keeps the Fourier pair", async () => {
        expect(has("/src/lib/bases.ts")).toBe(false);
        const evaluators = await import("@/lib/evaluators");
        expect(Object.keys(evaluators).sort()).toEqual(["evaluateFourier", "fourierPositionsAt"]);
    });

    it("the draft store keeps no caller-less loader", async () => {
        const drafts = await import("@/lib/draftStorage");
        expect(Object.keys(drafts)).not.toContain("loadDraftByVisualizationSlug");
    });

    it("every component file has an importer", () => {
        const orphans = FILES.filter((f) => f.endsWith(".vue") && f !== "/src/App.vue").filter(
            (f) => importers(base(f)).filter((i) => i !== f).length === 0,
        );
        expect(orphans).toEqual([]);
    });
});

describe("A2-FO-L1-24 — the directory structure matches responsibility", () => {
    it("(a) the gallery route, the admin panels and the account control have their own homes", () => {
        expect(under("/src/components/visualization/gallery/")).toEqual([]);
        expect(has("/src/components/gallery/GalleryView.vue")).toBe(true);
        const admin = FILES.filter((f) => /\/(Admin[A-Za-z]*|BatchActionBar)\.vue$/.test(f));
        expect(admin.length).toBeGreaterThan(0);
        expect(admin.filter((f) => !f.startsWith("/src/components/admin/"))).toEqual([]);
        const gallery = FILES.filter((f) => /\/Gallery[A-Za-z]*\.vue$|\/Tier(Mark|Control)\.vue$/.test(f));
        expect(gallery.filter((f) => !f.startsWith("/src/components/gallery/"))).toEqual([]);
    });

    it("(b) equation/ does not import visualization/ (the shared canvas setup lives in shared/canvas)", () => {
        const back = under("/src/components/equation/").filter((f) =>
            specifiers(SOURCES[f]).some((s) => s.startsWith("@/components/visualization/")),
        );
        expect(back).toEqual([]);
        expect(FILES.filter((f) => base(f) === "useCanvasSetup.ts")).toEqual(["/src/components/shared/canvas/useCanvasSetup.ts"]);
        expect(FILES.filter((f) => base(f) === "NotationPills.vue")).toEqual(["/src/components/shared/NotationPills.vue"]);
    });

    it("(c) equation code has one lib home", () => {
        expect(under("/src/components/equation/lib/")).toEqual([]);
        for (const m of ["grid.ts", "harmonics.ts", "hit-test.ts"]) expect(has(`/src/lib/equation/${m}`)).toBe(true);
    });

    it("(d) the dev-only shape extractor lives under components/dev/", () => {
        expect(FILES.filter((f) => base(f) === "FourierShapeExtractor.vue")).toEqual(["/src/components/dev/FourierShapeExtractor.vue"]);
    });
});

describe("A2-FO-L1-25 — one section registry, declared on the routes", () => {
    it("the dock's sections are the routes' meta.nav, one per section, in order", async () => {
        const { routes, sectionNav } = await import("@/router/routes");
        const nav = sectionNav(routes);
        expect(nav.map((s) => [s.label, s.value])).toEqual([
            ["Paper", "/paper"],
            ["Visualize", "/visualize"],
            ["Gallery", "/gallery"],
            ["Equation", "/equation"],
            ["Morph", "/morph"],
        ]);
        const tabs = new Set(routes.map((r) => r.meta?.tab).filter(Boolean));
        expect(new Set(nav.map((s) => s.value))).toEqual(tabs);
    });

    it("AppDock builds its list from the router, not a second list", () => {
        const dock = SOURCES["/src/components/layout/AppDock.vue"];
        expect(specifiers(dock)).toContain("@/router/routes");
        expect(dock).not.toMatch(/value:\s*"\/(paper|visualize|gallery|equation|morph)"/);
    });
});

describe("F-W14U (e) — one search-with-glyph field (until glass Input has a leading adornment, O-74 §10)", () => {
    const HOSTS = [
        "/src/components/paper/search/PaperSearchInput.vue",
        "/src/components/admin/AdminUserToolbar.vue",
        "/src/components/gallery/GallerySearchBar.vue",
    ];

    it("the hand-rolled hosts mount shared/SearchField.vue and draw no glyph of their own", () => {
        expect(has("/src/components/shared/SearchField.vue")).toBe(true);
        for (const h of HOSTS) {
            expect(has(h), h).toBe(true);
            expect(specifiers(SOURCES[h]), h).toContain("@/components/shared/SearchField.vue");
            expect(SOURCES[h], h).not.toMatch(/import\s*\{[^}]*\bSearch\b[^}]*\}\s*from\s*"@lucide\/vue"/);
        }
    });
});
