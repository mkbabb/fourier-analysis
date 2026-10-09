// SERVED MODEL: claude-opus-5-5
import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { HONEST_RED } from "../playwright.config";

/**
 * F.REL `.g` — the verdict over the named honest-RED set (`HONEST_RED` in
 * `playwright.config.ts`, the one declaration).
 *
 * Run as `npx playwright test --project=honest-red --reporter=list,./e2e/honest-red-reporter.ts`.
 * Every row is a glass ADOPT-AT-LANDING falsifier, RED until the producer
 * ships. The run PASSES only when the set is exactly as declared:
 *
 *   - every row matches at least one test (a renamed falsifier cannot fall out
 *     of the set unseen);
 *   - every matched test FAILED, on every attempt, and its failure carries the
 *     row's `token` (a timeout or a crash is RED for a reason that is not the
 *     row's, which is a defect to cure, not a producer wait);
 *   - no matched test passed or was skipped (a pass means glass landed: adopt the
 *     cure and delete the row; a skip would hide the row).
 *
 * Anything else FAILS the run, with each offending test named. This is the
 * expected-failure contract of `test.fail()`, held in one table instead of
 * being spread across the specs.
 */
interface Seen {
    test: TestCase;
    outcome: ReturnType<TestCase["outcome"]>;
    messages: string[];
}

export default class HonestRedReporter implements Reporter {
    private readonly seen = new Map<string, Seen>();

    onTestEnd(test: TestCase, result: TestResult): void {
        const prior = this.seen.get(test.id);
        const messages = [...(prior?.messages ?? []), ...result.errors.map((e) => e.message ?? e.value ?? "")];
        this.seen.set(test.id, { test, outcome: test.outcome(), messages });
    }

    async onEnd(_result: FullResult): Promise<{ status: FullResult["status"] }> {
        const problems: string[] = [];
        let matchedTests = 0;
        for (const row of HONEST_RED) {
            const hits = [...this.seen.values()].filter((s) => row.title.test(s.test.titlePath().join(" ")));
            if (hits.length === 0) {
                problems.push(`row matches no test: ${row.row} (${row.spec}, ${row.title})`);
                continue;
            }
            for (const s of hits) {
                matchedTests++;
                const name = s.test.titlePath().filter(Boolean).join(" › ");
                if (s.outcome !== "unexpected") {
                    problems.push(
                        s.outcome === "skipped"
                            ? `SKIPPED (a row may never be skipped): ${name}`
                            : `NOW PASSES (${s.outcome}) — glass landed; adopt and delete the row "${row.row}": ${name}`,
                    );
                } else if (!s.messages.some((m) => m.includes(row.token))) {
                    problems.push(`RED without its token "${row.token}" (a different failure, a defect): ${name}`);
                }
            }
        }
        const unmatched = [...this.seen.values()].filter(
            (s) => !HONEST_RED.some((row) => row.title.test(s.test.titlePath().join(" "))),
        );
        for (const s of unmatched) problems.push(`ran but matches no row: ${s.test.titlePath().join(" › ")}`);

        if (problems.length) {
            console.error(`\nhonest-RED set: NOT as declared (${problems.length}):\n  ${problems.join("\n  ")}`);
            return { status: "failed" };
        }
        console.log(
            `\nhonest-RED set: as declared — ${HONEST_RED.length} rows, ${matchedTests} tests, every one RED on its own token.`,
        );
        return { status: "passed" };
    }
}
