import { describe, expect, it } from "vitest";
import { relativeTime } from "./time";

/**
 * X.F.W3 `.e` — the unit floor for `fr-AdminUserList FR-AUL-17`.
 *
 * Every case below is a defect that shipped in at least one of the five copies
 * this module replaces, so the file is a regression net rather than a
 * restatement of the implementation: each `it` names the copy's behaviour it
 * forbids.
 */
const NOW = Date.parse("2026-09-19T12:00:00.000Z");
const at = (ms: number) => new Date(NOW - ms).toISOString();

describe("relativeTime", () => {
    it("floors below a minute instead of printing '0m ago' (the admin dialect)", () => {
        expect(relativeTime(at(0), NOW).text).toBe("just now");
        expect(relativeTime(at(59_000), NOW).text).toBe("just now");
    });

    it("steps minute → hour → day at the boundaries", () => {
        expect(relativeTime(at(60_000), NOW).text).toBe("1m ago");
        expect(relativeTime(at(59 * 60_000), NOW).text).toBe("59m ago");
        expect(relativeTime(at(60 * 60_000), NOW).text).toBe("1h ago");
        expect(relativeTime(at(23 * 3_600_000), NOW).text).toBe("23h ago");
        expect(relativeTime(at(24 * 3_600_000), NOW).text).toBe("1d ago");
    });

    it("CAPS at 30 days rather than truncating at days forever (GCM-34)", () => {
        expect(relativeTime(at(29 * 86_400_000), NOW).text).toBe("29d ago");

        const capped = relativeTime(at(412 * 86_400_000), NOW).text;
        expect(capped).not.toMatch(/ago$/);
        expect(capped).not.toContain("412");
    });

    it("reads a future instant as the present, never as a negative age", () => {
        // Clock skew between client and API. Every copy printed "-3m ago".
        const future = new Date(NOW + 3 * 60_000).toISOString();
        expect(relativeTime(future, NOW).text).toBe("just now");
    });

    it("renders nothing for an unreadable instant instead of 'NaNm ago'", () => {
        expect(relativeTime("nonsense", NOW)).toEqual({
            text: "",
            datetime: "",
            absolute: "",
        });
        expect(relativeTime(null, NOW).text).toBe("");
        expect(relativeTime(undefined, NOW).text).toBe("");
        expect(relativeTime("", NOW).text).toBe("");
    });

    it("carries the referent beside the words (m-17)", () => {
        const r = relativeTime(at(3 * 3_600_000), NOW);
        expect(r.text).toBe("3h ago");
        // A real `<time datetime>` value, and an absolute form for the title.
        expect(Date.parse(r.datetime)).toBe(NOW - 3 * 3_600_000);
        expect(r.absolute).not.toBe("");
    });

    it("is pure in `now`, which is what makes the shared clock possible", () => {
        const iso = at(0);
        expect(relativeTime(iso, NOW).text).toBe("just now");
        expect(relativeTime(iso, NOW + 90 * 60_000).text).toBe("1h ago");
    });
});
