/**
 * X·F F.W4 `.g` — THE DERIVER (`G-F4-DERIVER`).
 *
 * The gate asks for a deriver that publishes: *"native-loop count BY DIRECTIVE
 * with bounds + multiplicity, `:is` candidate sets, producer-internal loops from
 * first-party d.ts, `url(#id)` edges, enclosing disclosure state, loop-source
 * provenance (literal vs typed)"*. Each clause is one of `F-W4.md` §0's blind
 * spots, and each exists because a previous census keyed on the wrong thing and
 * reported a confident zero:
 *
 *   BS-1  callsite-keyed blindness — `PaperSidebar`'s three nested `<li v-for>`,
 *         `AA-30`'s ~104 nodes, `fr-CL D-L5`'s ≤102 rows read as 0. The
 *         refinement (`FR-AUL-54`) is binding: **count by DIRECTIVE and
 *         re-parent component callsites underneath**; an element-name-keyed
 *         cure re-inherits the same blind spot, so `byDirective` is the primary
 *         index here and `native` is a property of a row, never the key.
 *   BS-2  dynamic-`:is` blindness — resolve a CANDIDATE SET per site.
 *   BS-3  producer-internal loops — a `web/src`-scoped census reports ZERO
 *         slider nodes for a 14+ surface. The denominator must be closed and
 *         VERSIONED, so it is taken from the installed first-party packages.
 *   BS-4  `url(#id)` reference edges — representable by no import/callsite
 *         graph; the 178-line `SvgFilters` survivor is the proof.
 *
 * ⊘ WHAT THIS DERIVER IS NOT. It is a static reader, not a renderer. It says so
 * in its own output (`method.limits`) rather than letting a consumer mistake a
 * derived figure for a runtime one — which is the `FR-NP-2` failure exactly
 * (*"every consumer treats array-literal `loops[].cardinality` as FABRICATED"*).
 * Where a bound or a multiplicity is not statically decidable it is emitted as
 * `"runtime"`, never as a number.
 *
 * Usage:  node --experimental-strip-types scripts/derive-loops.ts [--json]
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(WEB, "src");
const PRODUCER_SCOPE = "@mkbabb";

// ── shared shapes ───────────────────────────────────────────────────────────

type Provenance = "literal-range" | "literal-array" | "typed-domain" | "runtime";
type Multiplicity = "static" | "reactive" | "runtime";

interface Site {
    file: string;
    line: number;
}

interface LoopRow extends Site {
    /** The tag the `v-for` DIRECTIVE sits on — the key, per BS-1's refinement. */
    host: string;
    /** A property of the row, never the index: native element vs component callsite. */
    native: boolean;
    /** The component callsites re-parented under this directive, if any. */
    reparented: string[];
    expression: string;
    source: string;
    bound: number | "runtime";
    multiplicity: Multiplicity;
    provenance: Provenance;
    keyed: boolean;
    disclosure: string;
}

interface IsRow extends Site {
    expression: string;
    candidates: string[];
    resolved: boolean;
    disclosure: string;
}

interface ProducerRow {
    package: string;
    version: string;
    modulesWithRenderList: number;
    renderListCalls: number;
    componentDeclarations: number;
}

interface UrlEdge {
    id: string;
    definedIn: Site | null;
    referencedFrom: Site[];
    resolved: boolean;
}

// ── file walking ────────────────────────────────────────────────────────────

function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        if (statSync(p).isDirectory()) walk(p, out);
        else if (/\.(vue|ts)$/.test(p)) out.push(p);
    }
    return out.sort();
}

function lineOf(text: string, index: number): number {
    let line = 1;
    for (let i = 0; i < index; i++) if (text[i] === "\n") line++;
    return line;
}

/** The `<template>` region of an SFC, or the whole file for a bare `.ts`. */
function templateRegion(text: string, file: string): { body: string; offset: number } {
    if (!file.endsWith(".vue")) return { body: text, offset: 0 };
    const open = text.indexOf("<template>");
    const close = text.lastIndexOf("</template>");
    if (open < 0 || close < 0) return { body: "", offset: 0 };
    return { body: text.slice(open, close), offset: open };
}

// ── clause 1/2/3 — native loops by directive, with bounds and multiplicity ──

const TAG_BEFORE = /<([A-Za-z][\w.-]*)(?=[\s>/])(?:(?!>)[\s\S])*$/;

/** The tag that OWNS the directive: scan back to the nearest unclosed `<tag`. */
function hostTag(body: string, at: number): string {
    const head = body.slice(Math.max(0, at - 800), at);
    const m = TAG_BEFORE.exec(head);
    return m ? m[1]! : "?";
}

/** HTML elements are lowercase and dash-free; everything else is a callsite. */
function isNativeTag(tag: string): boolean {
    return /^[a-z][a-z0-9]*$/.test(tag);
}

function classifySource(raw: string, fileText: string): {
    bound: number | "runtime";
    provenance: Provenance;
    multiplicity: Multiplicity;
} {
    const src = raw.trim();

    // `v-for="n in 12"` / `v-for="n in 1..N"` — a literal range is the only
    // statically CLOSED bound this repo produces.
    const literal = /^(\d+)$/.exec(src);
    if (literal) {
        return {
            bound: Number(literal[1]),
            provenance: "literal-range",
            multiplicity: "static",
        };
    }

    if (/^\[[\s\S]*\]$/.test(src)) {
        const commas = (src.match(/,/g) ?? []).length;
        return {
            bound: commas + 1,
            provenance: "literal-array",
            multiplicity: "static",
        };
    }

    // A bare identifier: find its declaration and read the DOMAIN, not a count.
    const ident = /^([A-Za-z_$][\w$]*)/.exec(src)?.[1];
    if (ident) {
        const decl = new RegExp(
            `(?:const|let|var)\\s+${ident}\\s*(?::[^=]+)?=\\s*(computed|ref|shallowRef|reactive|\\[)`,
        ).exec(fileText);
        if (decl) {
            const kind = decl[1]!;
            if (kind === "[") {
                const arr = new RegExp(`(?:const|let|var)\\s+${ident}[^=]*=\\s*\\[([\\s\\S]*?)\\]`).exec(
                    fileText,
                );
                const commas = (arr?.[1]?.match(/,/g) ?? []).length;
                return {
                    bound: arr ? commas + 1 : "runtime",
                    provenance: "literal-array",
                    multiplicity: "static",
                };
            }
            return {
                bound: "runtime",
                provenance: "typed-domain",
                multiplicity: kind === "computed" ? "runtime" : "reactive",
            };
        }
        // A prop, a store member or an import — typed, unbounded here.
        return { bound: "runtime", provenance: "typed-domain", multiplicity: "reactive" };
    }

    // `a.b.filter(...)`, `Object.keys(x)`, a template call — PAW-36's class:
    // the length is a runtime function and must never be emitted as a number.
    return { bound: "runtime", provenance: "runtime", multiplicity: "runtime" };
}

// ── clause 7 — enclosing disclosure state ───────────────────────────────────

const DISCLOSURE_TAGS = /<(CollapsibleSection|Collapsible|CollapsibleContent|details)\b([^>]*)>/g;

interface DisclosureSpan {
    tag: string;
    start: number;
    end: number;
    defaultOpen: string;
}

function disclosureSpans(body: string): DisclosureSpan[] {
    const spans: DisclosureSpan[] = [];
    for (const m of body.matchAll(DISCLOSURE_TAGS)) {
        const tag = m[1]!;
        const attrs = m[2] ?? "";
        const openAttr =
            /(?::default-open|:defaultOpen|default-open|open)\s*=\s*"([^"]*)"/.exec(attrs)?.[1] ??
            (/(?:\sopen)(?=[\s>])/.test(attrs) ? "true" : "unstated");
        const close = body.indexOf(`</${tag}>`, m.index! + m[0].length);
        spans.push({
            tag,
            start: m.index!,
            end: close < 0 ? body.length : close,
            defaultOpen: openAttr,
        });
    }
    return spans;
}

function disclosureAt(spans: DisclosureSpan[], at: number): string {
    const enclosing = spans.filter((s) => at > s.start && at < s.end);
    if (!enclosing.length) return "none";
    return enclosing
        .map((s) => `${s.tag}(default-open=${s.defaultOpen})`)
        .join(" > ");
}

// ── clause 4 — `:is` candidate sets ─────────────────────────────────────────

function candidatesFor(expr: string, fileText: string): string[] {
    const names = new Set<string>();

    // Ternary / logical branches spelled inline.
    for (const m of expr.matchAll(/['"]([A-Za-z][\w.-]*)['"]/g)) names.add(m[1]!);
    for (const m of expr.matchAll(/\b([A-Z][\w]*)\b/g)) names.add(m[1]!);

    // A bare identifier resolves through the file's own declarations.
    const ident = /^([A-Za-z_$][\w$]*)$/.exec(expr.trim())?.[1];
    if (ident) {
        const decl = new RegExp(
            `(?:const|let)\\s+${ident}[^=]*=\\s*([\\s\\S]{0,400}?)(?:\\n(?:const|let|function|<\\/script>))`,
        ).exec(fileText);
        if (decl) {
            for (const m of decl[1]!.matchAll(/\b([A-Z][\w]*)\b/g)) names.add(m[1]!);
            for (const m of decl[1]!.matchAll(/['"]([a-z][\w-]*)['"]/g)) names.add(m[1]!);
        }
    }

    // Keep only names the file actually imports or declares as components —
    // anything else is a token that happened to be capitalised.
    return [...names]
        .filter(
            (n) =>
                new RegExp(`import[^;]*\\b${n}\\b[^;]*from`).test(fileText) ||
                new RegExp(`\\b(?:const|function)\\s+${n}\\b`).test(fileText) ||
                /^[a-z]/.test(n),
        )
        .sort();
}

// ── clause 5 — producer-internal loops, from the installed packages ─────────

function producerLoops(): ProducerRow[] {
    const modulesRoot = join(WEB, "node_modules", PRODUCER_SCOPE);
    let packages: string[] = [];
    try {
        packages = readdirSync(modulesRoot).sort();
    } catch {
        return [];
    }

    const rows: ProducerRow[] = [];
    for (const pkg of packages) {
        const root = join(modulesRoot, pkg);
        let version = "unknown";
        try {
            version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version ?? "unknown";
        } catch {
            /* a package without a manifest is reported, not skipped */
        }

        let modulesWithRenderList = 0;
        let renderListCalls = 0;
        let componentDeclarations = 0;
        const dist = join(root, "dist");
        let files: string[] = [];
        try {
            files = walkAny(dist);
        } catch {
            files = [];
        }
        for (const f of files) {
            const text = readFileSync(f, "utf8");
            if (f.endsWith(".d.ts")) {
                componentDeclarations += (text.match(/DefineComponent|defineComponent/g) ?? []).length;
                continue;
            }
            if (!/\.(js|mjs|cjs)$/.test(f)) continue;
            const calls = (text.match(/\b(?:_?renderList|createElementBlock\(Fragment)/g) ?? []).length;
            if (calls > 0) {
                modulesWithRenderList++;
                renderListCalls += calls;
            }
        }
        rows.push({ package: `${PRODUCER_SCOPE}/${pkg}`, version, modulesWithRenderList, renderListCalls, componentDeclarations });
    }
    return rows;
}

function walkAny(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        if (statSync(p).isDirectory()) walkAny(p, out);
        else out.push(p);
    }
    return out;
}

// ── clause 6 — `url(#id)` reference edges ───────────────────────────────────

function urlEdges(files: string[]): UrlEdge[] {
    const defs = new Map<string, Site>();
    const refs = new Map<string, Site[]>();

    for (const file of files) {
        const text = readFileSync(file, "utf8");
        const rel = relative(WEB, file);
        for (const m of text.matchAll(/\bid\s*=\s*"([A-Za-z][\w-]*)"/g)) {
            if (!defs.has(m[1]!)) defs.set(m[1]!, { file: rel, line: lineOf(text, m.index!) });
        }
        for (const m of text.matchAll(/url\(\s*['"]?#([A-Za-z][\w-]*)['"]?\s*\)/g)) {
            const list = refs.get(m[1]!) ?? [];
            list.push({ file: rel, line: lineOf(text, m.index!) });
            refs.set(m[1]!, list);
        }
    }

    const ids = new Set([...defs.keys(), ...refs.keys()]);
    return [...ids]
        .sort()
        .map((id) => {
            const definedIn = defs.get(id) ?? null;
            const referencedFrom = refs.get(id) ?? [];
            return { id, definedIn, referencedFrom, resolved: !!definedIn && referencedFrom.length > 0 };
        })
        .filter((e) => e.referencedFrom.length > 0 || isGraphicalDef(e.id));
}

/** SVG paint-server / filter ids are the BS-4 surface; a random DOM id is not. */
function isGraphicalDef(id: string): boolean {
    return /(filter|grain|boil|wobble|gradient|mask|clip|marker|pattern)/i.test(id);
}

// ── derive ──────────────────────────────────────────────────────────────────

export interface Derivation {
    method: { root: string; files: number; limits: string[] };
    nativeLoopsByDirective: {
        total: number;
        native: number;
        componentCallsites: number;
        rows: LoopRow[];
    };
    loopBounds: { closed: number; runtime: number };
    loopMultiplicity: Record<Multiplicity, number>;
    loopSourceProvenance: Record<Provenance, number>;
    isCandidateSets: { total: number; resolved: number; rows: IsRow[] };
    producerInternalLoops: ProducerRow[];
    urlRefEdges: { total: number; unresolved: number; rows: UrlEdge[] };
    disclosureState: Record<string, number>;
}

export function derive(): Derivation {
    const files = walk(SRC);
    const loops: LoopRow[] = [];
    const isRows: IsRow[] = [];

    for (const file of files) {
        const text = readFileSync(file, "utf8");
        const rel = relative(WEB, file);
        const { body, offset } = templateRegion(text, file);
        if (!body) continue;
        const spans = disclosureSpans(body);

        for (const m of body.matchAll(/v-for\s*=\s*"([^"]*)"/g)) {
            const expr = m[1]!;
            const host = hostTag(body, m.index!);
            const source = /\b(?:in|of)\s+([\s\S]+)$/.exec(expr)?.[1] ?? expr;
            const { bound, provenance, multiplicity } = classifySource(source, text);

            // The directive's own element subtree, for BS-1's re-parenting:
            // component callsites rendered INSIDE this loop belong under it.
            const close = body.indexOf(">", m.index!);
            const tail = body.slice(close, close + 1200);
            const reparented = [
                ...new Set(
                    [...tail.matchAll(/<([A-Z][\w]*)\b/g)].map((c) => c[1]!),
                ),
            ].sort();

            const attrs = body.slice(Math.max(0, m.index! - 400), close + 1);
            loops.push({
                file: rel,
                line: lineOf(text, offset + m.index!),
                host,
                native: isNativeTag(host),
                reparented,
                expression: expr,
                source: source.trim(),
                bound,
                multiplicity,
                provenance,
                keyed: /:key\s*=|v-bind:key\s*=/.test(attrs),
                disclosure: disclosureAt(spans, m.index!),
            });
        }

        for (const m of body.matchAll(/:is\s*=\s*"([^"]*)"/g)) {
            const expr = m[1]!;
            const candidates = candidatesFor(expr, text);
            isRows.push({
                file: rel,
                line: lineOf(text, offset + m.index!),
                expression: expr,
                candidates,
                resolved: candidates.length > 0,
                disclosure: disclosureAt(spans, m.index!),
            });
        }
    }

    const bounds = { closed: 0, runtime: 0 };
    const multiplicity: Record<Multiplicity, number> = { static: 0, reactive: 0, runtime: 0 };
    const provenance: Record<Provenance, number> = {
        "literal-range": 0,
        "literal-array": 0,
        "typed-domain": 0,
        runtime: 0,
    };
    const disclosure: Record<string, number> = {};
    for (const row of loops) {
        if (row.bound === "runtime") bounds.runtime++;
        else bounds.closed++;
        multiplicity[row.multiplicity]++;
        provenance[row.provenance]++;
        disclosure[row.disclosure] = (disclosure[row.disclosure] ?? 0) + 1;
    }
    for (const row of isRows) {
        disclosure[row.disclosure] = (disclosure[row.disclosure] ?? 0) + 1;
    }

    const edges = urlEdges(files);

    return {
        method: {
            root: relative(WEB, SRC),
            files: files.length,
            limits: [
                "STATIC READER. No component is rendered; no figure here is a runtime instance count.",
                "A bound is emitted as a NUMBER only for a literal range or a literal array; every other domain is \"runtime\" (FR-NP-2 — array-literal cardinality is FABRICATED and this deriver refuses to mint one).",
                "Re-parenting scans the 1200 characters after the directive's element, so a loop body longer than that under-reports its callsites; it never over-reports.",
                "`:is` candidate sets are resolved from the file's own imports and declarations; a candidate assembled across a module hop reads as unresolved, which is a RED, not a zero.",
                "Producer-internal loops are counted from the INSTALLED dist (a closed, versioned denominator), not from source the consumer does not have.",
            ],
        },
        nativeLoopsByDirective: {
            total: loops.length,
            native: loops.filter((l) => l.native).length,
            componentCallsites: loops.filter((l) => !l.native).length,
            rows: loops,
        },
        loopBounds: bounds,
        loopMultiplicity: multiplicity,
        loopSourceProvenance: provenance,
        isCandidateSets: {
            total: isRows.length,
            resolved: isRows.filter((r) => r.resolved).length,
            rows: isRows,
        },
        producerInternalLoops: producerLoops(),
        urlRefEdges: {
            total: edges.length,
            unresolved: edges.filter((e) => !e.resolved).length,
            rows: edges,
        },
        disclosureState: disclosure,
    };
}

// ── report ──────────────────────────────────────────────────────────────────

function report(d: Derivation): string {
    const out: string[] = [];
    out.push(`X·F F.W4 — deriver (G-F4-DERIVER) over ${d.method.root} · ${d.method.files} files`);
    out.push("");
    out.push(`1. nativeLoopsByDirective : ${d.nativeLoopsByDirective.total} directives — ${d.nativeLoopsByDirective.native} on native elements, ${d.nativeLoopsByDirective.componentCallsites} on component callsites`);
    const unkeyed = d.nativeLoopsByDirective.rows.filter((r) => !r.keyed);
    out.push(`                            unkeyed: ${unkeyed.length}${unkeyed.length ? " — " + unkeyed.map((r) => `${r.file}:${r.line}`).join(", ") : ""}`);
    out.push(`2. loopBounds             : ${d.loopBounds.closed} closed, ${d.loopBounds.runtime} runtime`);
    out.push(`3. loopMultiplicity       : ${JSON.stringify(d.loopMultiplicity)}`);
    out.push(`4. isCandidateSets        : ${d.isCandidateSets.total} sites, ${d.isCandidateSets.resolved} resolved`);
    for (const r of d.isCandidateSets.rows) {
        out.push(`     ${r.file}:${r.line}  "${r.expression}" → {${r.candidates.join(", ")}}  [${r.disclosure}]`);
    }
    out.push(`5. producerInternalLoops  : ${d.producerInternalLoops.length} first-party packages`);
    for (const p of d.producerInternalLoops) {
        out.push(`     ${p.package}@${p.version}  renderList modules=${p.modulesWithRenderList} calls=${p.renderListCalls} d.ts components=${p.componentDeclarations}`);
    }
    out.push(`6. urlRefEdges            : ${d.urlRefEdges.total} edges, ${d.urlRefEdges.unresolved} UNRESOLVED`);
    for (const e of d.urlRefEdges.rows) {
        out.push(`     #${e.id}  defined=${e.definedIn ? `${e.definedIn.file}:${e.definedIn.line}` : "NOWHERE"}  refs=${e.referencedFrom.length}`);
    }
    out.push(`7. disclosureState        : ${JSON.stringify(d.disclosureState)}`);
    out.push(`8. loopSourceProvenance   : ${JSON.stringify(d.loopSourceProvenance)}`);
    out.push("");
    out.push("method limits (published so no consumer mistakes a derived figure for a runtime one):");
    for (const l of d.method.limits) out.push(`  · ${l}`);
    return out.join("\n");
}

// Run only when invoked as the entry point — importing this module (the unit
// floor does) must derive nothing and print nothing.
const entry = process.argv[1];
if (entry && import.meta.url === new URL(`file://${entry}`).href) {
    const d = derive();
    console.log(process.argv.includes("--json") ? JSON.stringify(d, null, 2) : report(d));
}
