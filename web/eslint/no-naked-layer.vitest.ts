/**
 * X·F F-D8 (F.W3 g16) — the @layer law in lint: an SFC <style> block may open
 * only `@layer glass-overrides`. Any other layer (a block or an ordering
 * statement) re-registers a cascade layer from a component, which inverts the
 * order index.html declares (FR-AH-30: a component's `@layer components` lands
 * BELOW glass-ui's).
 */
import { ESLint } from "eslint";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const fixtures = fileURLToPath(new URL("./__fixtures__/", import.meta.url));

async function lint(file: string) {
    const eslint = new ESLint({ cwd: fileURLToPath(new URL("..", import.meta.url)), ignore: false });
    const [result] = await eslint.lintFiles([`${fixtures}${file}`]);
    return result.messages.filter((m) => m.ruleId === "fourier/no-naked-layer");
}

describe("fourier/no-naked-layer", () => {
    it("fails a component layer other than glass-overrides", async () => {
        const found = await lint("naked-layer.vue");
        expect(found.map((m) => m.line)).toEqual([7, 10]);
    });

    it("passes @layer glass-overrides, and layer names inside comments", async () => {
        expect(await lint("glass-overrides-layer.vue")).toEqual([]);
    });
});
