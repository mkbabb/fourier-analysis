// SERVED MODEL: claude-opus-5[1m]
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import vitestConfig from "../../vitest.config";

/**
 * X·F F.W9 `.b` — `G-F9-1`, THE FLOOR'S OWN FALSIFIER.
 *
 * THE DEFECT THIS EXISTS FOR, MEASURED BEFORE IT EXISTED
 * ------------------------------------------------------
 * X.F.W3 `.e` authored three real vitest files — `src/lib/basis.test.ts`,
 * `src/lib/time.test.ts`, `src/lib/equation/notation.test.ts` — and every one
 * of them matched NO runner's glob in this repo. Naming all three on the
 * command line still returned *"No test files found, exiting with code 1"*.
 * Assertions existed, a runner existed, a blocking CI step existed, and the
 * three files ran in none of them. Nothing in the repo said so.
 *
 * A FLOOR stated in prose ("the population is these globs") cannot catch that:
 * prose goes stale the first time a seat adds a file, which is exactly how the
 * three got written. So the population is asserted instead. Add a fourth
 * orphan and this test reddens, in the same blocking step, on the same run.
 *
 * WHAT IT ASSERTS
 * ---------------
 *   1. **No orphans.** Every unit-shaped test file under `web/` is claimed by
 *      a runner — this vitest config, F.W0's `node:test` seat (read out of
 *      `ci.yml`, the step that IS the authority), or Playwright.
 *   2. **No double claims.** A file claimed by two runners runs under two
 *      frameworks; that is a defect of its own, not redundancy.
 *
 * ⊘ ORACLE DISCIPLINE (`KF.W4(d)` — *a gate may not re-derive its own oracle*).
 * Nothing here restates a runner's configuration. The vitest globs are READ
 * from `vitest.config.ts`; the `node:test` seat's operands are READ from
 * `.github/workflows/ci.yml`; Playwright's claim is READ from
 * `playwright.config.ts`'s `testDir` plus its documented default `testMatch`.
 * The only literal in this file is that default pattern, which the config does
 * not override — stated here with its provenance and asserted absent below, so
 * an override cannot silently make this reading wrong.
 *
 * ⊘ It is NOT F.W0's `G-9` seat re-measured. The seat asks whether a runner is
 * installed; this asks whether the whole population reaches one. `R-5` holds
 * the two apart and neither discharges the other.
 */

const HERE = fileURLToPath(new URL(".", import.meta.url)); // web/e2e/unit/
const WEB = resolve(HERE, "../..");                        // web/
const REPO = resolve(WEB, "..");                           // repo root

/** Directories that hold no first-party source. */
const SKIP_DIRS = new Set([
    "node_modules",
    "dist",
    ".git",
    "playwright-report",
    "test-results",
    "coverage",
    ".vite",
]);

/** The shapes a human reads as "this is a test file". */
const TEST_FILE = /\.(test|spec|vitest|unit)\.[cm]?[jt]sx?$/;

function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            walk(join(dir, entry.name), out);
        } else if (TEST_FILE.test(entry.name)) {
            out.push(relative(WEB, join(dir, entry.name)));
        }
    }
    return out;
}

/**
 * The subset of glob syntax the two configs actually use: `**` (any depth,
 * including zero), `*` (within one segment), and literals. Deliberately not a
 * general matcher — a general one would be a second implementation of the
 * runner's own matching, i.e. an oracle of this test's own making.
 */
function globToRegExp(glob: string): RegExp {
    let out = "";
    for (let i = 0; i < glob.length; i++) {
        const c = glob[i]!;
        if (c === "*") {
            if (glob[i + 1] === "*") {
                i++;
                if (glob[i + 1] === "/") {
                    i++;
                    out += "(?:[^/]+/)*";
                } else {
                    out += ".*";
                }
            } else {
                out += "[^/]*";
            }
        } else if ("\\^$+?.()|{}[]".includes(c)) {
            out += `\\${c}`;
        } else {
            out += c;
        }
    }
    return new RegExp(`^${out}$`);
}

// ── Runner 1 — this vitest config, read from the config itself ──────────────
const vitestInclude: string[] = (vitestConfig as { test?: { include?: string[] } }).test
    ?.include ?? [];
const vitestClaims = vitestInclude.map(globToRegExp);

// ── Runner 2 — F.W0's `node:test` seat, read from the CI step that runs it ──
const CI_YML = readFileSync(join(REPO, ".github/workflows/ci.yml"), "utf8");
const nodeTestOperands = [...CI_YML.matchAll(/node --test[^\n]*?([\w./-]+\.[cm]?[jt]s)\b/g)].map(
    (m) => m[1]!,
);

// ── Runner 3 — Playwright, read from its config's `testDir` ─────────────────
const PW_CONFIG = readFileSync(join(WEB, "playwright.config.ts"), "utf8");
const testDir = /testDir:\s*"\.\/([^"]+)"/.exec(PW_CONFIG)?.[1] ?? null;
/**
 * Playwright's documented default when `testMatch` is unset
 * (https://playwright.dev/docs/api/class-testconfig#test-config-test-match):
 * the segment before the extension must be exactly `spec` or `test`.
 */
const PW_DEFAULT_TEST_MATCH = /\.(spec|test)\.[cm]?[jt]sx?$/;

function claimants(file: string): string[] {
    const found: string[] = [];
    if (vitestClaims.some((re) => re.test(file))) found.push("vitest");
    if (nodeTestOperands.includes(file)) found.push("node:test (F.W0 G-9 seat)");
    if (testDir && file.startsWith(`${testDir}/`) && PW_DEFAULT_TEST_MATCH.test(file)) {
        found.push("playwright");
    }
    return found;
}

describe("G-F9-1 — the unit floor's population", () => {
    const files = walk(WEB).sort();

    it("finds the test population at all (the walker itself is not vacuous)", () => {
        // A guard, not a threshold: if the walk returns nothing, every
        // assertion below passes vacuously and the floor measures air.
        expect(files.length).toBeGreaterThan(0);
        expect(vitestInclude.length).toBeGreaterThan(0);
        expect(nodeTestOperands.length).toBeGreaterThan(0);
        expect(testDir).not.toBeNull();
    });

    it("Playwright's default testMatch is still in force (this file's one literal)", () => {
        // If a seat ever sets `testMatch`, the Playwright column above becomes
        // a guess. Redden here rather than mis-classify silently.
        expect(PW_CONFIG).not.toMatch(/^\s*testMatch:/m);
    });

    it("leaves NO test file unclaimed by every runner", () => {
        const orphans = files.filter((f) => claimants(f).length === 0);
        expect(
            orphans,
            "these test files run in NO runner and in no CI job — the exact defect " +
                "`G-F9-1` is the instrument for:\n" +
                orphans.map((f) => `  • web/${f}`).join("\n"),
        ).toEqual([]);
    });

    it("claims no test file twice", () => {
        const doubled = files
            .map((f) => [f, claimants(f)] as const)
            .filter(([, c]) => c.length > 1);
        expect(
            doubled,
            "these test files are claimed by more than one runner, so they run " +
                "under two frameworks:\n" +
                doubled.map(([f, c]) => `  • web/${f} → ${c.join(" + ")}`).join("\n"),
        ).toEqual([]);
    });
});
