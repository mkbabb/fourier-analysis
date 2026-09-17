SERVED MODEL: claude-opus-5[1m]

# fourier-analysis — coordination mail ledger (the E13 seat)

**Created** 2026-09-17 at **X.F.W0**, unit *b*, under gate **G-3**. Spec:
`value.js/docs/tranches/X/fourier/waves/F-W0.md` §3 rows 30 · 31 · 32 · §4 G-3 · §6a lock 4.

This file is the **durable mail ledger** for this repository — the E13 analogue of
`value.js/docs/tranches/V/coordination/INBOX.md`. Before it existed, fourier had a mail *surface*
(letters on disk) and no *ledger*, which is how three letters sat unlogged for 111 days.

## The law this seat runs under

1. **Every session and every wave OPENS with a coordination-mail sweep.** Newest item per path,
   compared against every row below.
2. **No wave closes with UNREAD mail.** A letter with no row here is unread by construction.
3. **NO CRONS** (owner order). The sweep is a session-open act, never a scheduled one.
4. **Producer-owned rows ride a relay letter and are NEVER patched in the consumer.** `glass-ui`,
   `latex-paper`, `parse-that`, `keyframes.js` and `value.js` are READ-ONLY from this tree. A
   consumer-side patch of a producer defect is a gate FAILURE, not a gate pass.
5. **Letters already on disk are READ-ONLY to this ledger.** The ledger records a letter's state; it
   never rewrites the letter.

**Status vocabulary**: `OPEN` (live, owns a wave) · `ANSWERED` (a reply or a measurement discharges
it) · `SENT` (outbound, dispatched) · `LOGGED` (inbound record, no reply owed) · `DEFERRED` (routed
forward with a named home).

---

## §1 — TRIAGE AT CREATION: the mail that predates this ledger

Performed **before any new letter was logged** (F-W0 §4 G-3, D-8). The seat is stood up over an
**inventoried** surface, never an assumed-empty one: a ledger created blind over unlogged letters
makes them unread mail on day one, and F.W0 could not then close its own gate.

**Inventory sweep, this seat, 2026-09-17** — ⟨cmd⟩ `find docs -type d -name coordination` → six
directories (`A` · `B` · `C` · `D` · `E` · `F`); the five non-`F` directories hold **contract and
spec documents from closed tranches, not letters** (`CONSTELLATION.md`, `CRUD-CONTRACT.md`,
`SCHEMA.md`, …). ⟨cmd⟩ `find docs -type f \( -iname '*inbound*' -o -iname '*outbound*' -o -iname
'*relay*' -o -iname '*communique*' \)` → **exactly one** hit, the O-14 letter at row **M-4**.
**The letter class is therefore closed at four rows: three in `F/coordination/`, one in `N/`.**

**Dating disclosure.** F-W0 §4 G-3 dates all three extant letters **2026-05-29**; that is their
**mtime** class and it reproduces — ⟨cmd⟩ `ls -lT *.md` → `May 29 13:35` · `May 29 14:42` ·
`May 29 13:27`. Two of the three **mastheads** state `authored 2026-05-28` (hardened the same day);
⟨cmd⟩ `grep -o 'authored 2026-[0-9-]*' *.md` → `F-OPERATOR-WINDOW.md:authored 2026-05-28` ·
`F-T-N1-status-field-drop.md:authored 2026-05-29` · `F-VHOST-CORRECTNESS.md:authored 2026-05-28`.
**Both readings are true under different measures and both columns are carried below**, so no later
seat has to guess which the gate meant. This is a disclosure, not a correction to the gate.

| # | letter | authored / mtime | kind | status | disposition |
|---|---|---|---|---|---|
| **M-1** | `F/coordination/F-VHOST-CORRECTNESS.md` | 2026-05-28 / 2026-05-29 | internal spec letter — binding | **OPEN** | **F.α first land · inv-22 binding.** Carried, not actioned by F.W0. |
| **M-2** | `F/coordination/F-OPERATOR-WINDOW.md` | 2026-05-28 / 2026-05-29 | internal runbook — binding | **OPEN** | **F.W3 binding** (F.γ → W3a + W3b). Carried, not actioned by F.W0. |
| **M-3** | `F/coordination/F-T-N1-status-field-drop.md` | 2026-05-29 / 2026-05-29 | cross-repo **ASK** (value.js-maintainer-owned) | **ANSWERED — DISCHARGED** | Answer-or-defer resolved **ANSWER**, by measurement at the value.js tree (§1.1). No reply owed; no fourier act owed. |
| **M-4** | `N/valuejs-inbound-2026-07-27-facility19-migration-table.md` | 2026-07-27 | **INBOUND** from value.js — a **log**, explicitly not an ask | **LOGGED** | Committed at F.W0 G-2 (`cddd1fa`). No reply owed (§1.2). Consumer obligations routed to **F.W1**. |

### §1.1 — M-3 `F-T-N1`: the ASK is ANSWERED, and the evidence is the answer

The ASK (2026-05-29): *drop the legacy `status` field from value.js's `FormattedPalette` type and
its formatter, with the three demo `palette.tier ?? palette.status` fallbacks collapsed to
`palette.tier`.* Its §4 states five acceptance criteria. This seat resolved the answer-or-defer state
**by measuring the value.js tree rather than by deferring**, read-only:

| criterion | measurement, this seat, 2026-09-17 | verdict |
|---|---|---|
| §4.3 — `grep "status"` returns zero on the `FormattedPalette` / `formatPalette` surface | The surface **moved** — ⟨cmd⟩ `ls value.js/api/src/format/palette.ts` → *No such file or directory*; ⟨cmd⟩ `grep -rln 'FormattedPalette' api/src/` → `api/src/modules/palette/format.ts`. ⟨cmd⟩ `grep -n 'status' api/src/modules/palette/format.ts` → **∅** | **MET** |
| §4.1 — `formatPalette()` returns no `status` key | Same file: `tier: Palette["tier"]` at `:30` is the sole curation field on the type; the formatter assigns `tier: rest.tier` at `:82` and no `status` | **MET** |
| §4.2 — the three demo fallbacks collapse to `palette.tier` | ⟨cmd⟩ `grep -rn 'palette.tier ?? palette.status' demo/` → **∅**; ⟨cmd⟩ `grep -rn '\.status' demo/@/composables/palette/` → **∅** — the dead right-hand branch is **gone, not merely unreached**, which is the criterion's own wording | **MET** |

**Discharged on the value.js side, as the letter's §5 requires** (*"The residual is satisfied by the
value.js-side PR, on value.js's own ledger — not by any fourier commit"*). The excision landed in
value.js **tranche L, wave L.W3** — the full-stack `sessionToken` + four-state-`status` excision to
`(visibility, tier)`, tranche L closed 2026-06-04 — which post-dates the ASK by six days.
**inv-16 held throughout**: no fourier commit touched `value.js/**`, and this row is a
measurement, not a claim of authorship.

**Residual, recorded not actioned**: criteria §4.4 (demo typecheck + e2e green) and §4.5 (shipped as
a single paired PR) are **value.js-side history**, verifiable only on value.js's ledger. They are not
re-derived here and no fourier act is owed for them.

### §1.2 — M-4 `O-14`: what it does and does not ask

The letter is explicit — *"A **log**, per the isomorphism law itself — not an ask … you are not
being asked to edit anything."* It records value.js's facility-19 `library-surface` correspondence
ledger and a ten-row migration table (I-1…I-10), and it declares three born-RED probes against
**this** tree: the bare `@mkbabb/value.js` specifier is retired at 4.0.0 (5 sites), `timingFunctions`
is deleted, 8 of 22 easing curves change shape, and `cssVarToHex` has no `oklch` arm so four `--viz-*`
series paint the same grey.

**Nothing is owed by return post.** The consumer-side consequences are **F.W1's** (the tri-package
uplift): the five specifier migrations, the `colors.ts` deletions, and the declared 3-line hex
residual with its stated expiry at value.js 4.1. Routed, not actioned here — F.W0 is a substrate
wave and does not edit `web/src/**`.

### §1.3 — M-2 `F-OPERATOR-WINDOW`: one flag carried forward

The runbook's §γ.4 records a **host-side** cron on the deploy host
(`0 */6 * * * bash /home/mbabb/conformance-probe.sh`) as a satisfied acceptance gate. This is
infrastructure on a remote host, **not a session cron**, so the standing **NO CRONS** order is not
breached by its existence. **Flagged, not ruled**: F.W3 owns this runbook and should reconcile the
host cron against the standing order when it executes. F.W0 neither touches the host nor rules on it.

---

## §2 — OUTBOUND: producer relay packets

**Lock**: F-W0 §6a lock 4 — **G-3 gates the SENDs.** Both packets name *"whoever holds the mail
seat"* as their sender; the seat is created by §1 above, so no letter left before it existed.

▲ **The ordering was PERFORMED, and this note exists because the first attempt only asserted it.**
This seat's first write of this file emitted §1 and §2 in **one act**, under a sentence claiming §1
had been *"written and the file measured on disk before this section was appended."* **That sentence
was false at the moment it was written** — precisely the unreproduced-attestation class that F-W0's
five repair rounds convict, and which its round-2 minute names exactly: *"a repair seat's own cures
are the least-audited bytes in the file."* The cure was **to do the thing, not to soften the
claim**: the file was cut back to §1 alone, measured on disk — ⟨cmd⟩ `wc -l < INBOX.md` → **105**,
⟨cmd⟩ `grep -c 'SENT 2026-09-17' INBOX.md` → **0**, i.e. *the seat exists and no letter has left* —
and **only then** was §2 appended. Both readings are banked in this unit's receipts. The defect is
disclosed rather than quietly repaired, because a ledger whose subject is unlogged mail does not get
to launder its own first draft.

**Delivery surface, stated plainly.** Producer trees are **READ-ONLY, always** — this seat cannot
write a file into `glass-ui` or `latex-paper`, and F.W0's writable set contains no path in either.
A packet is therefore **assembled and dispatched as a ledger row here**, which is the same idiom
value.js's own INBOX uses for its outbound `O-*` letters. The gate's green condition is that the two
packets are *logged SENT with dates* — met below.

### P-1 — the consolidated glass-ui BH relay letter · **SENT 2026-09-17**

| field | value |
|---|---|
| **id** | **P-1** (packet identity `FR-COB-28`) |
| **to** | glass-ui producer — the standing BH relay channel (owner edict: every glass-ui-level row rides the active BH inbox) |
| **from** | fourier-analysis X·F mail seat, F.W0 unit *b* |
| **status** | **SENT 2026-09-17** |
| **owner** | **NO-WAVE-OWNER (producer).** F.W0 owns ASSEMBLE + SEND; **F.W1 owns CONSUME** |
| **why it matters** | The answers (portal tiers, the unlayered P9 sheet, the color-mix fallback, the chip/press rungs, whether the v7/v8 pressed-paint removal was intentional) change F.W1's **break surface** and therefore its **sizing** |

**Trigger, quoted at the bank's bytes** — ⟨cmd⟩ `grep -o 'one relay letter, seven items[^|]*'
fr-CanvasOverlayButton.md` → *"one relay letter, seven items, sent at F.W0/F.W1 open by whoever holds
the mail seat; this record is the packet"*. The packet has since grown to **nine entries, items
0–8**, by two additions (item 0 and item 8) the bank never contained.

**The roster below is SPEC-VOICED — it is this packet's assembly, not a quotation of the bank.**
Where a line is quoted at the bytes it is marked and the command is given; this seat's own
classifications stand **outside** the quotation marks.

| # | item | record | ask |
|---|---|---|---|
| **0** | **`FR-NP-32` (≡ `fr-PaperSidebar M1`) — the corrupt dist stylesheet.** The adopted 4.0.0 ships a syntactically corrupt `dist/styles/index.css`: the dist emission spliced two `@import`s into the middle of a comment, CSS comments do not nest, the injected `*/` terminates it early, and the shipped `@source` backstop is swallowed into a garbage at-rule named `` source` `` and **never registers**. Delimiters **17 `/*` / 8 `*/` in dist vs 15 / 6 in src**. Reproduced with the app's own toolchain: `postcss([@tailwindcss/postcss])` → **`CssSyntaxError: Unterminated string: 's own'`**. **Producer source at HEAD is intact — this is a dist-generation bug, not an authoring one.** | fr-NotationPills `FR-NP-32` · fr-PaperSidebar `M1` | **AT THE TOP. Fix the EMITTER, and publish a stylesheet PARSE-GATE — explicitly NOT a version bump.** |
| **1** | `FR-COB-7` — dead border arms fleet-wide + the pressed-suppresses-feedback composition: the `glass` arm's hover/active border arms are dead on every `<Button>` (`.btn-pill`'s `border-none` beats `.glass-wash`'s `border: 1px solid` on same-layer source order), and the pressed background wins over hover and active by unlayered source order, so a toggled-ON control gives **zero** visible hover feedback | fr-CanvasOverlayButton `FR-COB-7` | Producer cascade repair |
| **2** | `FR-COB-8` — the unlayered-P9-defeats-layered-a11y-resets **CLASS** (`FR-COB-12` is one instance) | fr-CanvasOverlayButton `FR-COB-8` | Producer layering repair. **S-4 rides with it: the consumer must NOT patch locally** |
| **3** | `FR-COB-6` — the v7 pressed-paint removal: **was it intentional?** `v7.0.0:src/components/button/styles.css` has **0** `aria-pressed`; every surviving `<Button :aria-pressed>` toggle keeps semantics and loses its background delta at F.W1 | fr-CanvasOverlayButton `FR-COB-6` | **A question, not a defect claim.** Direction is not uniformly bad — prefers-contrast / forced-colors users gain a 2px border |
| **4** | `FR-COB-23` — the **1.94:1** focus ring | fr-CanvasOverlayButton `FR-COB-23` | Contrast repair |
| **5** | `FR-COB-26` — the generated `color-mix` fallback | fr-CanvasOverlayButton `FR-COB-26` | Generator repair |
| **6** | The `btn-glass` / `glass-btn` **near-collision naming hazard** — quoted at the bytes, ⟨cmd⟩ `grep -o 'near-collision naming hazard[^;]*' fr-CanvasOverlayButton.md` → *"near-collision naming hazard (FR-COB-3's mechanism — two utilities one letter-order apart in one file)"* | fr-CanvasOverlayButton (`FR-COB-3`'s surviving limb) | Naming repair |
| **7** | ⟨cmd⟩ `grep -o 'record DOCK-ACTIVE[^)]*)' fr-CanvasOverlayButton.md` → *"record DOCK-ACTIVE satisfied upstream, do not re-send (FR-COB-11)"* — the bank's casing and comma kept. **That it is a NEGATIVE ask is this seat's classification and stands outside the quotation.** | fr-CanvasOverlayButton `FR-COB-11` | **RECORDED, NOT SENT AS A DEFECT.** The DOCK-ACTIVE ask was already answered upstream by the v7 material-wide cohort; the row exists so no later seat re-sends a closed ask |
| **8** | **`FR-MSP-12` — the manufactured accent-on-accent fallback (1.00:1).** The build pipeline's synthesized `color-mix` fallback paints the phase chips accent-on-accent on any non-`color-mix` engine. **The class's first PROVABLE counterfactual**: strip the synthesized tint fallback and the legacy path lands on solid `--muted` at **4.43 / 3.76 light · 4.74 / 5.58 dark** — legible. **The generator MANUFACTURES the failure.** | fr-MorphShapePreview `FR-MSP-12` (a new site of the banked `FR-COB-26` class) | Generator repair. **Also riding**: fr-PaperSidebar `L-10` / `D-M4` — the **ramp-headroom / rebaseline ask** (13-stop ramp exactly saturated 13/13; 4 light-arm stops under AA, worst **3.58:1**) |

**Honest tension carried, split into its two real sentences — two homes, two quotes, never fused.**
The sentence **`FR-MSP-12` itself carries** (colon form, no parenthetical) — ⟨cmd⟩ `sed -n '104p'
fr-MorphShapePreview.md | grep -o 'the synthesis is a coin-flip[^*]*fires'` → *"the synthesis is a
coin-flip: absent where it would help, harmful where it fires"*. The **fold-admission** sentence,
whose home is that record's *"The incredulity seat's own work — rulings and corrections"* section,
ruling 3, at `:22` — ⟨cmd⟩ `sed -n '22p' … | grep -o 'the synthesis is a coin-flip[^*]*fires'` →
*"the synthesis is a coin-flip — absent where it would help (7 files, 19 unguarded declarations),
harmful where it fires"*. Both reproduce EXACT at this seat. The *"7 files, 19 unguarded
declarations"* figure is **`FR-NP-8`'s** (*"19 unguarded `color-mix` declarations across 7 SFCs"*) —
stated here as a cross-reference, **never smuggled into a quotation as an attribution the quoted
file does not make.**

**Standing constraint on every row above**: `FR-COB-8` **S-4** — *the consumer must NOT patch
locally*. Producer rows ride this relay and **never become frontend hacks.**

### P-6 — the latex-paper producer carries · **SENT 2026-09-17**

| field | value |
|---|---|
| **id** | **P-6** |
| **to** | latex-paper producer — the standing latex-paper coordination mail (`LATEX-RELAY`) |
| **from** | fourier-analysis X·F mail seat, F.W0 unit *b* |
| **status** | **SENT 2026-09-17** |
| **owner** | **MAJOR band, producer-owned; NO-WAVE-OWNER locally** |
| **reconciliation** | **F.W10** owns the reconciliation **both directions** and the **terminal disposition** of every deferred row |

**The six `fr-PaperArticleWindow` carries** — each banked *"→ LATEX-PAPER carry; NO-WAVE-OWNER
locally"*. All six ids were resolved at the bank by this seat before being booked here (an id absent
from the record cannot be sent):

| id | finding | ask |
|---|---|---|
| **PAW-32** | `PaperSectionBlocks.vue.d.ts` ships **no** `__VLS_Slots` (grep 0; sibling `PaperSection` has it), so `figure.*` / `callout.*` destructure implicit `any` — **the file's largest unchecked surface** | **Emit slot types** |
| **PAW-38** | Section ids — the `:key`, the DOM `id`, `elementMap` / `measuredHeights`, and a never-cleared session cache — are all the same **un-deduplicated title slug** with no uniqueness registry: two identically-titled headings collide across **four registries at once**. **LATENT: all 93 slugs unique today** | **Uniquify at the emitter** |
| **PAW-39** | Every `depth > 0` section renders `<h3>` + `.section-header--sub`, so **51 `\section` and 31 `\subsection`** nodes are indistinguishable to AT heading nav; the flattener emits `sourceLevel` (`:110`) the renderer never reads | **Read `sourceLevel`** |
| **PAW-45** | A **second** module-level, unbounded, never-evicted cache: the KaTeX memo (dist `:387`) retains every equation ever typeset for the page-session lifetime, surviving unmount and route change (**~1145 inline + ~263 display** spans vs **≤18** mounted sections) | **"Cap, don't delete."** Repairs must weigh superlative 13 — the memo is also what makes the PAW-3/4 churn survivable |
| **PAW-46** | The same memo keys on the **TeX string alone** and ignores `macros`; two `useKatex()` instances with different macro sets **cross-serve** | **Key on tex + macro identity**, or move the `Map` inside `useKatex` — same repair as PAW-45 |
| **PAW-56** | `--_section-color: var(--section-color-${sectionIndex})` with **no fallback and no modulo** (dist `:1404`); **13 stops vs 12** top-level entries ⇒ a thirteenth entry makes the var guaranteed-invalid → the fallback is **itself IACVT** (`--section-heading` is oklch) → **all six** heading-colour / gradient declarations drop at once and **nothing signals** | **Modulo at the producer bind**, or a fallback that is **not var-shaped**, riding the PAW-1 rewrite |

▲ **LATENCY DISCLOSURE, and the letter says it plainly: `PAW-38` · `PAW-46` · `PAW-56` are
LATENT-today with margin-1 exposure.** Each is one edit, one consumer or one chapter away from
firing, and none has a test. **They are not emergencies and must not be sized as such** — the spec's
own instruction is that the letters say so, *"or the producer sizes an emergency."*

**The `fr-PaperView` LATEX-RELAY riders** — carried whole:

| row | finding | ask |
|---|---|---|
| **C-06** | latex-paper 0.2.1 ships `activeId` / `activeRootId: ComputedRef<any>` (d.ts `:19`); six typed contracts downstream vacuous | Generic fix at `ref<T \| null>`. Also an **F.W1** rider |
| **L/D5 + L/D30** | `disarmProgressFallback` and the producer `useClickDelegate` unbind are guaranteed **no-ops**: both re-read a template ref after Vue's synchronous unmount-path nulling. Harm bounded (elements detached anyway); pattern MAJOR | Producer twin cure = `onBeforeUnmount` or the cached-element idiom |
| **L/D8** | `:ref="(el) => bindSection(item.id, el)"` re-invoked unconditionally per patch (no equality guard) and `measureSection` evaluates `el.offsetHeight` as the **argument**, before the dedupe ⇒ **one forced layout read per visible section per patch** | **Hoist the read behind the guard** |
| **L/D29** | Producer `useTreeIndex` records the **ROOT** id as `parentId` for every depth≥2 node (`:27`/`:32`); masked by the `isDescendant` fallback; 34 depth-2 nodes live. Latent, correctly filed | Producer walk repair — the same package's other walk gets it right |
| **C-19** | latex-paper peers `katex ^0.16` vs installed **0.17.0** | Peer-range correction. Also an **F.W1** rider |
| **C-20** | `hsl(var(--section-heading))` invalid against glass's oklch token at **six** theme sites; latent behind the always-present `section-index`. *(The record marks this row's headroom cell excised by K-6.)* | Token-form correction |
| **L/D21** | Producer `useKatex` cache keys omit the macro table; the docblock promises an `inject` fallback the code lacks | Key + docblock correction (composes with **PAW-46**) |

⊘ **COUNT-WORD DIVERGENCE, disclosed rather than resolved by dropping a row.** F-W0 §3 row 32 and
§4 G-3 both say *"fr-PaperView's **6** LATEX-RELAY riders"*, and that record's own closing verdict
reads *"6 LATEX-RELAY"*. **The enumeration measures seven.** ⟨cmd⟩ `grep -n 'LATEX-RELAY'
fr-PaperView.md` → the legend line plus **seven** routing rows: `:70` C-06 · `:75` L/D5+L/D30 ·
`:77` L/D8 · `:92` L/D29 · `:125` C-19 · `:126` C-20 · `:130` L/D21. A plausible reconciliation is
visible at the bytes — `C-20`'s cell is marked *"(headroom cell excised by K-6)"*, and four of the
seven are *riders* alongside another route while three route to the relay alone — **but this seat
does not rule it.** **All seven are carried**, because dropping a measured row to satisfy a count
word is fabrication, and M-25 names silent drops as the defect class this programme exists to kill.
**Precedent applied**: this wave's own record, divergence **D-3** — *"the enumeration governs"*.
**The registry is E-1 immutable and was not touched.** Routed to **F.W10** with the reconciliation.

**The `fr-PaperSidebar` riders — one relay carries `L-11` + `M2`** (the record's own instruction):

| id | finding | ask |
|---|---|---|
| **L-11** | latex-paper's damped rAF sidebar-follow has **no PRM gate anywhere** in `dist/vue.js` (**0** hits) and no motion option — *"a third ungated clock missing from lane-frontend §8's two-clock inventory"* | Gate the clock on `prefers-reduced-motion`; offer a motion option. **Doc limb**: amend `lane-frontend` §8 — **as a dated ERRATA ADDENDUM, never an in-place patch** (E-3) |
| **M2** | latex-paper's shipped `useSidebarFollow` **hard-codes fourier's private scoped class** `.sidebar-top-btn` in its pointer exemption — **dependency inverted**; any rename or restyle silently converts scroll-to-top clicks into sticky manual-override suspensions | **Replace with a data-attribute hook.** ⚠ **WAVE-LOCK: F.W4 must not rename the class before this relay lands.** |

---

## §3 — Sweep log

| date | by | paths swept | result |
|---|---|---|---|
| 2026-09-17 | F.W0 unit *b* (seat creation) | `docs/**/coordination/` (6 dirs) + the tree-wide inbound/outbound/relay/communique letter class | **4 letters found, 4 rowed** (M-1…M-4). 0 unrowed. Two packets assembled and SENT (P-1, P-6). **No UNREAD mail at this seat's close.** |
