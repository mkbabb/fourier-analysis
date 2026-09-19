/**
 * X.F.W3 `.e` — THE RE-PARAMETERISED SHIM CONTRACT, PUBLISHED
 * (`fr-Tooltip FR-TT-15` ⊕ `FR-TT-24`, ⊕ `intake R3-7a` as X-11 amended it).
 *
 * This file is `.e`'s second PUBLICATION under §5a-v2 item 1. It is the
 * contract the tooltip sweep is authored against; `Tooltip.vue` beside it is
 * that contract implemented, and `.a`/`.c`/`.d` apply it inside the files they
 * already own. g11 is TREE-WIDE and closes at `.f`, never here.
 *
 * ── WHY A SHIM SURVIVES AT ALL (FR-TT-24 — this is RE-PARAMETERISATION, NOT
 *    RETIREMENT) ────────────────────────────────────────────────────────────
 * `./icon-tooltip` does not exist at the adopted pin, and the package ships no
 * single-component tooltip of any kind: `@mkbabb/glass-ui/tooltip` exports the
 * four DECOMPOSED primitives and nothing else — ⟨cmd⟩ this seat, 2026-09-19,
 * `cat node_modules/@mkbabb/glass-ui/dist/components/tooltip/index.d.ts` →
 * `Tooltip` · `TooltipContent` · `TooltipTrigger` · `TooltipProvider`. The
 * `side` + `#content` + provider-non-nesting contract this app's 39 call sites
 * speak therefore has no home in the package, and R3-7a's banked
 * "barrel → `@mkbabb/glass-ui/tooltip`" restates as re-parameterising THIS
 * file. `fr-BasisSelector K-12` kills the one-word-swap cheap arm at the
 * export map, measured above rather than recalled.
 *
 * ── THE ONE IMPORT IDENTITY (FR-TT-20 — normalize BEFORE the sweep) ────────
 * THIS BARREL IS THE IDENTITY. `import { Tooltip } from "@/components/ui/tooltip"`.
 * Measured at this seat: ⟨cmd⟩ `grep -rn 'ui/tooltip' src` → **9 importers, TWO
 * identities** — 8 through this barrel and ONE deep SFC import
 * (`components/paper/PaperSidebar.vue:2`, `.c`'s file, CLOSED and unswept at
 * this wave). The choke-point count is 2, not 1, which is precisely FR-TT-20's
 * finding; the deep import is NAMED AS RESIDUE for its owner rather than swept
 * from here, because §5a-v2 law 2 forbids one unit opening another's file.
 *
 * ── THE FIVE SURVIVING KNOBS (FR-TT-15, verbatim list), EACH DECIDED ──────
 *
 * 1. **measure (FR-TT-3) — BOUNDED, with a knob.** `max-width` appears NOWHERE
 *    in the tooltip chain at either pin: ⟨cmd⟩ `grep -rn 'max-width'
 *    src/components/ui/tooltip/` → **0**, and `grep -c 'max-width'
 *    node_modules/@mkbabb/glass-ui/dist/tooltip.js` → **0**. Both pins discard
 *    `--reka-tooltip-content-available-width`, so an unbounded input paints a
 *    single-line ribbon across the viewport. The bound is `16rem` by default —
 *    the figure the sibling `hover-popover` sheet bounds ITSELF with, in a
 *    sheet whose own docblock cites the tooltip register — and it is
 *    overridable per site through the `measure` prop (any CSS length).
 *    It is declared inside `@layer glass-overrides`, the layer this app's
 *    `index.html` orders LAST, so it is a deliberate consumer override by
 *    ORDER and not by being unlayered (g16).
 *
 * 2. **`align` / `class` — THE ELEMENT-ROOT DECISION, MADE.** The shim's root
 *    is and STAYS a Fragment. `renderSlot` mints that Fragment
 *    UNCONDITIONALLY, so "make the shim single-root" is the KILLED arm
 *    (`FR-TT-7` / DU K6, re-proved) — and the reason it is killed is that the
 *    whole `coeff-list` TransitionGroup FLIP register depends on the row
 *    element being the `v-for` key holder, which a shim-imposed root would
 *    take away. The cure for the dropped `class` is therefore the WRAPPER LAW
 *    (g10, `fr-SliderControl R-6`), not a root: **`inheritAttrs: false` WITH a
 *    pre-placed `v-bind="$attrs"` on the intended host**, which here is the
 *    CONTENT (the only element this shim owns; the trigger is the consumer's
 *    own child through `as-child`, and attrs placed there would collide with
 *    it). `align` becomes a real knob, forwarded under S-1's
 *    conditional-forwarding law — bind only what the consumer passed.
 *
 * 3. **hoverable policy (FR-TT-10) — A DELIBERATE NO-OP, RECORDED.** The
 *    banked cure is `disable-hoverable-content`, and it CONFLICTS with D §6's
 *    banked WCAG 1.4.13 CLEARED pass: hoverable content is the REQUIREMENT
 *    there, so the "cure" would delete the pass. No 1.4.13-preserving design
 *    exists at this pin, so this knob is deliberately NOT exposed. Recorded
 *    here rather than silently dropped, which is the clause's own instruction.
 *
 * 4. **offset rationale (FR-TT-13) — ONE DECLARED DEFAULT, ONE KNOB.** Three
 *    uncoordinated anchor gaps live in one dock (4 / 6 / 8). The shim's
 *    `sideOffset` default is **6** — the value it already shipped, now a NAMED
 *    parameter with a stated rationale rather than a literal — and a site that
 *    genuinely needs another gap DECLARES it instead of hand-rolling an
 *    anchor. ⊘ RELAY, not a local fix: the producer ships no floating-offset
 *    token, so every consumer necessarily authors a number. That ask rides
 *    `.f`'s SS-6 batch; no F.W3 cell re-tunes a producer constant (S-5).
 *
 * 5. **contract guard (FR-TT-12) — A DEV GUARD, AND THE CONTRACT IN WORDS.**
 *    `as-child` silently accepts a non-focusable child, a `display:none`
 *    child, or a bare SVG, and the failure is invisible: no warning, no
 *    tooltip, no keyboard path. THE CONTRACT: the default slot must resolve to
 *    EXACTLY ONE element, and that element must be focusable. The shim warns
 *    in dev when the FOCUSABLE half is violated — that is the half which
 *    actually breaks keyboard access, and it is decidable from the mounted
 *    DOM. The one-element half is NOT guarded: deciding it means re-invoking
 *    the slot outside the render function, which emits a dev warn of its own,
 *    and a guard that trades one warning for another is not a guard. It is
 *    stated in words instead, here and in the component's usage block.
 *
 * ── THE INPUT-MODALITY CONTRACT, STATED (FR-TT-2) ─────────────────────────
 * This shim wires a DESCRIPTION — `aria-describedby`, and only while the
 * tooltip is open. IT NEVER WIRES A NAME. Consequences, stated so no sweep
 * assumes otherwise:
 *   · POINTER (fine): hover opens after the provider's dwell. Works.
 *   · KEYBOARD: focus opens it — but ONLY if the `as-child` target is
 *     focusable. Where it is not, the tooltip is structurally unreachable.
 *   · TOUCH: there is NO touch path at any call site, at any of the three
 *     independent producer arms. A coarse-pointer user gets nothing.
 * Therefore **every icon-only trigger owes its own `aria-label`**, and the
 * shim does not supply one.
 *
 * ⊘ ANTI-CURE 3, BINDING (FR-TT-4 / P-11): the corpus's unanimous `ariaLabel`
 * forward is REPUDIATED BY THE PRODUCER — declared at 4.0.0/v7.0.0, DELETED at
 * 8.0.0 with the standing comment that the content-side override replaced the
 * very node the `describedby` reads. Prescribing it would route the sweep at a
 * prop the adoption chain is retiring. The `ariaLabel` leg is DROPPED from the
 * surviving knob list for exactly that reason, and per-site naming is F.W4's.
 *
 * ⊘ RELAY, not a local hack (FR-TT-18): `--z-tooltip: 120` sits BELOW
 * `--z-popover: 130` at the adopted pin — ⟨cmd⟩ this seat, `grep -rho
 * -- '--z-tooltip: *[^;}]*|--z-popover: *[^;}]*' node_modules/@mkbabb/glass-ui/dist
 * --include='*.css' | sort -u` → `--z-popover: 130` · `--z-tooltip: 120` — so a
 * tooltip inside a HoverPopover paints BENEATH its own panel. That is a
 * producer token ordering, and it rides the SS-6 letter.
 */
export { default as Tooltip } from "./Tooltip.vue";
