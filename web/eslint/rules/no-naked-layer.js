/**
 * `fourier/no-naked-layer` — X·F F-D8 (F.W3 g16): the @layer law, in lint.
 *
 * The cascade-layer order is declared ONCE, in index.html's head
 * (`theme, base, components, utilities, glass-overrides`), because a layer
 * takes its position from where its name first appears and Vite emits SFC
 * styles before the entry stylesheet: a component that opens any other layer
 * registers it first, at the bottom of the order (FR-AH-30). So an SFC
 * <style> block may open only `@layer glass-overrides` — the one layer whose
 * job is to beat glass-ui's `@layer components` recipes by order. Any other
 * layer, as a block or as an ordering statement, is an error. Comments are
 * prose and are not read.
 */
const LAYER = /@layer\s+([^{;]*)([{;])/g;
const ALLOWED = "glass-overrides";

/** Blank out CSS comments, keeping offsets (and so line numbers) intact. */
function stripComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
}

export default {
    meta: {
        type: "problem",
        docs: { description: "An SFC <style> block may open only @layer glass-overrides." },
        messages: {
            naked:
                "`@layer {{names}}` in a component re-registers a cascade layer below glass-ui's; " +
                "components may open only `@layer glass-overrides` (the order is index.html's).",
        },
        schema: [],
    },
    create(context) {
        const fragment = context.sourceCode.parserServices?.getDocumentFragment?.();
        if (!fragment) return {};
        return {
            Program() {
                for (const node of fragment.children) {
                    if (node.type !== "VElement" || node.name !== "style") continue;
                    const text = node.children.find((c) => c.type === "VText");
                    if (!text) continue;
                    const css = stripComments(text.value);
                    for (const m of css.matchAll(LAYER)) {
                        const names = m[1].split(",").map((n) => n.trim()).filter(Boolean);
                        if (m[2] === "{" && names.length === 1 && names[0] === ALLOWED) continue;
                        const start = text.range[0] + m.index;
                        context.report({
                            loc: {
                                start: context.sourceCode.getLocFromIndex(start),
                                end: context.sourceCode.getLocFromIndex(start + m[0].length),
                            },
                            messageId: "naked",
                            data: { names: names.join(", ") },
                        });
                    }
                }
            },
        };
    },
};
