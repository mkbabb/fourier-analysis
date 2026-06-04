# A2 — value.js J/K/L COHORT STATE (re-ground)

**Auditor**: A2 (1 of 6). **Date**: 2026-06-04. **Dimension**: the fourier↔value.js
cohort — value.js's actual J/K/L state, the diff/publish parity, the precepts/π
authoring site, the L brands/excision pattern, and the constellation coordination
ledger. Every claim cites file:line / commit / tranche in the real sibling tree.

**Repos pinned at audit time:**
- value.js: branch `docs/constellation-grand-audit-2026-06-03`, HEAD `66dcd68`
  ("close tranche L"), version `0.10.0`, dirty (precepts submodule + 3 deleted
  ceremony files).
- glass-ui: branch `master`, HEAD `06b35d9`, version **`3.2.0`** (PUBLISHED;
  release run `26964913257`, npm `--provenance`).
- keyframes.js: HEAD `c66e6f3`, version **`3.0.0`** (PUBLISHED, tranche B).
- fourier: HEAD `9d7c387` + 5 unpushed doc commits.

---

## THE HEADLINE (reframes the whole cohort)

**value.js has run AHEAD of every fourier cohort assumption, and glass-ui +
keyframes have published past the gates fourier still books as "future."** Three
of fourier's load-bearing cohort gates have DISSOLVED:

1. **The inv-16′ peers `valuejs-J-atomdiff` + `valuejs-J-publish` are DONE** —
   shipped in value.js J (FINAL.md, `api/src/lib/crud/atomdiff.ts`,
   `services/palette/{diff,visibility}.ts`, `POST /:slug/{remix,publish,unpublish}`),
   folded into K.W2 (`59aab42`), and carried clean through K→L. Both fourier
   ledger rows (`ADOPTION-ASKS.md:122-123`) are **stale-OPEN against a DONE
   sibling**. → ADOPT-NOW / mark DONE-in-sibling.

2. **glass-ui 3.2.0 shipped** with `deriveAurora`, `useTextHighlight`,
   `asideSide`, dock-`useId()`, and the **P5 close-as-designed** verdict — the
   exact two corrections the directive carries. fourier's "gated on glass-ui
   3.2.0" K.W4 bundle is now an **ADOPT-NOW bump** (`^3.1.0`→`^3.2.0`). glass-ui's
   own AS FINAL writes fourier's adoption recipe verbatim
   (`glass-ui/docs/tranches/AS/FINAL.md:126`).

3. **keyframes.js 3.0.0 shipped** (`c66e6f3`). value.js's cohort doc
   (`coordination/cohort-glassui-3.2.0-keyframes-3.0.0.md:78`) and K.PROGRESS
   (`:14-15,55`) book K.W4/K.W5 as "gated on keyframes 3.0.0 (absent — at
   2.2.0)." That gate is GONE too.

The cohort is no longer "synchronized in-flight" — **value.js's CORE half is
SHIPPED and twice-superseded (K folded it, L hardened the api floor); the hub
(glass-ui) has published; the supplier (keyframes) has published.** What remains
is fourier's own un-shipped adoption, not a cross-repo wait.

---

## (a) The inv-16′ peers: `valuejs-J-atomdiff` + `valuejs-J-publish` — DONE

**Both are EXECUTED + GREEN in value.js J, then folded into K, then survived L.**

**`valuejs-J-atomdiff`** (`ADOPTION-ASKS.md:122`, P2): value.js J FINAL §1 cites
the build: `api/src/lib/crud/atomdiff.ts` (the **canonical name** A6-4 demanded —
value.js renamed off its as-built `services/palette/diff.ts` to fourier's
contract path), `PaletteVersion.atomDiff`, `forkPalette`→`remixPalette` (fork =
remix-with-empty-diff, ONE path), `POST /:slug/remix`, `GET /:slug/diff`,
`hash.ts computeAtomHash/computeAtomSetHash`. Green at **140/140 api vitest** (J
FINAL §0), folded into K.W2 api-lane (`59aab42`, api 153/27 + conformance 22/22),
and **alive at L close** (`atomdiff.ts` is in the L tree; api vitest 161/161, L
FINAL.md §1). Verdict: **DONE-in-sibling.**

**`valuejs-J-publish`** (`ADOPTION-ASKS.md:123`, P1): value.js J FINAL §1 (W1c
row) cites `services/palette/visibility.ts` (`setVisibility` + the inv-I-2
guard's **first live caller**), `POST /:slug/{publish,unpublish}`, and the **[P0]
`crud-list.ts` `visibility:"public"` filter** — the exact leak the fourier row
names — landed together (inv-15 name-the-consumer satisfied). Green in J,
hardened in L: L.W3 (`17b6148`) went FURTHER and excised `Palette.sessionToken` +
the 4-state `status`, transposing the filter to `(visibility, tier)` full-stack
(L FINAL §3). Verdict: **DONE-in-sibling, then deepened.**

**What fourier OWES**: NOTHING to value.js on these two. fourier's only act is
its OWN J.W2 CORE (the fourier-side atomdiff/publish twin) + then the cohort
paired-close. The ledger rows must be flipped from "OPEN — booked J.W0" to
"DONE-in-sibling (value.js J FINAL §1; carried K→L); fourier-side pending." Both
are currently MISLEADING-OPEN — an inv-27 honesty gap in fourier's own ledger,
the same class A4 closed for the dock row.

---

## (b) The /diff-shape + publish-envelope PARITY — value.js's side is BUILT and BINDS the doc

**value.js's `/diff` conformance probe EXISTS, BINDS `J-diff-shape.md`, and asserts
the exact four-field envelope.** `value.js/api/test/conformance/diff.test.ts`:

- Header docblock (lines 1-11) cites the binding doc by absolute reference:
  *"Asserts value.js's `/diff` envelope against the repo-neutral canonical shape
  doc `fourier-analysis/docs/tranches/J/design/J-diff-shape.md` §3/§4 — NOT
  against fourier's output (J-diff-shape §6)."* This is the inv-26 discipline made
  operational: it binds the **doc**, never the sibling.
- Line 141-146: `expect(Object.keys(body).sort()).toEqual(["fromHash",
  "identical", "ops", "toHash"])` — the §2.4 four-field decision made executable
  (NO redundant `fromSetHash`/`toSetHash`).
- Lines 149-150: `body.fromHash === computeAtomSetHash(C1)` — fromHash/toHash ARE
  the set-hashes (§2.4 resolved).
- Line 116: op vocabulary closed to `["added","removed","changed"]` (§2.1).
- Lines 154-174: the immutable-pair ETag `"<from>:<to>"` + `If-None-Match`→304
  (§3.2).
- Lines 201-244: the **inv-J-1 chain guard → 422** end-to-end through the
  `UnprocessableEntityError` route (divergent branches), exactly the J-diff-shape
  §6 422-not-400 decision.

**Verdict: PARITY IS READY on value.js's side.** The fourier↔value.js `/diff`
envelope cannot drift — both probes bind the one repo-neutral doc, neither binds
the other (J-diff-shape §6). The cross-repo parity verdict ("both pass §3/§4") is
**the fourier lead's to compute at the paired-close** — value.js has already
proven its half (J FINAL §5: "value.js-J's `/diff` envelope is byte-isomorphic to
J-diff-shape §3/§4"). The **publish envelope** parity is likewise built: value.js
J FINAL §5 records the one legitimate per-repo difference (private-state name
`private` vs fourier `draft`; `unpublish` lands `private` vs fourier `unlisted`),
both satisfying "not in public view" — exactly as `J.W1c-publish-visibility.md`
predicted.

**What fourier OWES**: build its OWN Python `/diff` conformance probe against the
SAME doc (J-diff-shape §6: *"fourier's conformance probe asserts fourier's
DiffResponse against §3.2 + the Python column of §4"*) and run the paired-close
parity check. The contract doc itself (`J-diff-shape.md`) is fourier-owned and
COMPLETE — value.js needs nothing more from it.

---

## (c) The precepts-sync / π protocol / screenshots edict — value.js IS the authoring site, and authored them FIRST

**The visual-evidence π protocol and the dev/deploy standard were AUTHORED IN
value.js's K tranche, ahead of fourier's J adoption.** Grounded:

- **Visual-evidence protocol**: value.js K.W1 authored
  `design/K.W1-visual-evidence-protocol.md` (K.PROGRESS:10,121) — the standing
  before/after screenshot protocol (≥3 viewports × ≥5 frames × WCAG-AA). value.js
  then EXECUTED it: an **84-capture instrumented session** (K.PROGRESS:86-110,
  `audit/visual-evidence-2026-06-04/` + `DELTA.md`), committed in K (`9413e47`
  "the 84-capture π baseline"). fourier's J.π baseline (21 caps, `57624fa`) is the
  **fourier-side mirror** of this same protocol.
- **dev/deploy standard**: value.js K.W2 micro-lane (f) (`K.md §3` W2 row /
  PROGRESS:46) — `scripts/dev.sh`+`deploy.sh` conforming to the hub schema
  `docs/dev-deploy-standard.md`, DEC-9 deploy (`57c0928`: `api.color.babb.dev
  :8130`, rsync outlier DELETED, lighthouserc).
- **precepts-sync edict (the 8ccf9f4 every-page before/after π edict)**: the
  edict ORIGINATES in the precepts submodule (shared). value.js's precepts
  submodule is **dirty at audit** (`git status`: `m docs/precepts`) — i.e.,
  value.js is mid-sync, NOT yet pinned to 8ccf9f4. fourier's
  `PRECEPTS-SYNC.md` (the 5-unpushed-commit `227c283`) correctly BOOKS value.js
  (+ glass-ui) as "dirty precepts submodule → BOOKED, not swept" (inv-16′: never
  write a dirty sibling). **This is correct and held.**

**What fourier OWES**: nothing to push into value.js (inv-16 — value.js's precepts
pin is value.js's to land on its own clean checkout). fourier's books on this are
ACCURATE. The one coordination fact: value.js is the **co-author** of the π
protocol, not a downstream consumer — fourier's J.π lane and value.js's K visual
lane are siblings of one shared protocol, both already executed. No drift; no debt.

---

## (d) value.js K + L — the patterns fourier SHOULD mirror

**value.js K** (`66dcd68`-era, CLOSED 2026-06-03) = the cross-repo cohesion
tranche: acyclic color topology (`tsconfig.lib/demo` split, inv-K-1), glass-ui
OKLab dedup (inv-K-2, equivalence canary 6/6 to 1e-6), the api-lane I-tail close
(idempotency LRU store, conformance 22/22, `id`-field hard-removal,
per-call-site ifMatch/idempotencyKey — `59aab42`), unified CI/CD (`57c0928`).
**Note K is on a CONTINUATION arc**: K.W2.5/W2.6/W3/W4/W5/W6 are SPECCED-not-shipped
(K.PROGRESS:12-16) — the color-topology consummation (blob lift, aurora-derive)
is value.js's still-open forward work, gated on the now-published glass-ui 3.2.0.

**value.js L** (`66dcd68`, CLOSED 2026-06-04) = the api/ legacy-excision +
architectural-transposition tranche. **Three patterns fourier should mirror:**

1. **Branded nominal id types** (L.W2, `d86d75d`) — `value.js/api/src/models.ts:45-52`:
   `declare const __SessionToken: unique symbol; export type SessionToken =
   string & { readonly [__SessionToken]: true }` (+ `UserSlug`), minted ONLY at
   the repository filter seam (`asSessionToken`/`asUserSlug`, `:63-67`). This is
   the type-honest way to stop slug/token confusion — fourier's J fork fields
   (`fork_of`, version `_id` compound, `canonical_digest`) are the natural
   mirror site. **Mirror candidate**, NOT an owed coordination — it's a per-repo
   discipline, not a contract.

2. **Boundary fail-explicit** (L.W1, `c690118`) — 6 ad-hoc `c.json({error})`
   envelopes → typed `ApiError` throws; 4 route repo-leaks → a `ownership.ts`
   service (L FINAL §3). The RFC-9457 problem+json discipline fourier already
   shares (inv-26) — value.js's L is the deepest expression. **Mirror at any
   fourier api hardening pass.**

3. **Full-stack legacy excision** (L.W3, `17b6148`) — `Palette.sessionToken` +
   the 4-state `status` excised root-to-envelope (writes→filter→projection→
   envelope→interface→index→migration), the migration file DELETED WHOLE (L
   FINAL §3). **This is the NO-LEGACY canon made operational** — exactly the
   directive's "NO legacy code." fourier's J W2-transpose (DELETE the
   structurally-phantom within-viz version chain) is the SAME move; value.js L
   is the proof-of-pattern.

**Cross-repo coordination owed by L: ZERO.** L FINAL.md:7 is explicit: *"No
cohort; the fourier boundary stayed closed; no glass-ui source touched."* L is
value.js-internal. **inv-16 held perfectly.** Nothing for fourier to mirror as a
*contract* — only as *discipline*.

---

## (e) The constellation cohort state — where each repo is, re-grounded

| Repo | CONSTELLATION.md §1 (stale, 2026-06-02) | ACTUAL (2026-06-04) | Drift |
|---|---|---|---|
| fourier | "J authored, 1 unpushed" | J SHIPPED (W2 CORE + dev.sh + W3/W4), HEAD `9d7c387` + 5 unpushed doc commits; **K-deploy authored** (ordering ν′) | MAJOR — J executed; a whole successor (K-deploy) exists |
| value.js | "J authored (`2f7fc87`), dirty ×3" | **J EXECUTED + GREEN → folded into K → K CLOSED → L CLOSED** (`66dcd68`); on branch `docs/constellation-grand-audit-2026-06-03` | MAJOR — value.js ran J→K→L; CONSTELLATION shows "J authored" |
| glass-ui | "lineage→V, g.w5 (`84a6cc1`), dirty ×5" | **3.2.0 PUBLISHED** (`06b35d9`, master, clean; AQ→AR→AS); release run `26964913257` | MAJOR — the hub PUBLISHED; the "g.w5 release gates the cohort WC waves" §7 row is satisfied |
| keyframes.js | "A authored (`12f8282`), clean; at 2.2.0" | **3.0.0 PUBLISHED** (`c66e6f3`, tranche B) | MAJOR — the supplier published; the K.W4/W5 keyframes gate is GONE |
| speedtest | "tranche-AT WAVE-C, dirty ×157" | not re-verified this dimension | unknown |
| words/muster | mid-flight | not re-verified this dimension | unknown |
| deploy | "clean (`3c3fbd2`)" | the babb.dev API deploy is **STUCK at `f2fe447`, 29 commits behind** (K-deploy §1) | the deploy chronic |

**The cohort §3 model is OBSOLETE.** CONSTELLATION.md §3 frames "fourier-J ↔
value.js-J, glass-ui hub … the design waves wait for glass-ui to ship g.w5 + the
P5/a11y fixes." Reality:
- glass-ui SHIPPED 3.2.0 (the "wait for glass-ui" is over).
- value.js's CORE half is two tranches behind it (K, L closed).
- The cohort is **asymmetric in TIME**: value.js sprinted J→K→L while fourier
  authored-and-paused. The "close paired" model (CONSTELLATION §6.3) is strained
  — value.js-J cannot wait at a close-gate while fourier finishes K-deploy. The
  honest re-frame: **value.js-J's cohort obligation is DISCHARGED** (the contract
  bound, the envelope proven, the I-tail closed); fourier-J's close is now
  GATED ON FOURIER'S OWN WORK (J.W6 inv-27 green, which K-deploy's glass-ui-3.2.0
  adoption unblocks — the K-deploy §0 interleaving). value.js owes the cohort
  NOTHING further; fourier owes itself the adoption + its own conformance probe +
  the paired parity check.

**The inv-16′ ledger re-ground:**
- `valuejs-J-atomdiff` → **DONE-in-sibling** (flip the OPEN row).
- `valuejs-J-publish` → **DONE-in-sibling** (flip the OPEN row).
- `glass-ui-P5-inner-rounding` → **PHANTOM-KILL** — glass-ui's own AS FINAL
  (`docs/tranches/AS/FINAL.md`, "P5 — close-as-designed") states rounding is owned
  at the container-root clip (`Configurator.vue:130` `rounded-panel …
  overflow-hidden`); `779fed7` deliberately REVERTED the per-section rounding
  after adversarial verification found it geometrically inert; glass-ui calls
  fourier's "not satisfied until inner sections round" a **misdiagnosis**. This
  independently corroborates the directive's correction #2 ("inner rounding is
  rejected — the rounding is controlled by the container"). **KILL across the
  fourier docs.**
- `glass-ui-dock-vt-name` → **DONE-in-sibling / ADOPT-NOW** — fixed in glass-ui
  3.1.1 (AR.W2) + present in 3.2.0 source AND dist: `GlassDock.vue:137`
  `glass-dock-${useId()}`, `dist/dock.js` has `useId` (grep count 1), guarded by
  `proof-vt-names.mjs`. The fourier e2e chronic unblock is a `^3.1.0`→`^3.2.0`
  bump, NOT a future wait.
- `asideSide` (the DEC-2 controls-LEFT lever, fourier control-pane A-3) →
  **DONE-in-sibling / ADOPT-NOW** — `Configurator.vue:85/101/162` ships
  `asideSide?: ConfiguratorAsideSide` (default "right"; "left" → `lg:col-start-2`
  + border-side swap, no DOM reorder). fourier's K.W4 row "does not exist at
  3.1.0 (confirmed)" (ADOPTION-ASKS:172) is now SATISFIED at 3.2.0.
- `useTextHighlight` → **DONE-in-sibling** — `src/composables/dom/useTextHighlight.ts`
  + test, on the root barrel (multi-instance multiplex, AS R4). fourier's J.W3/
  diff-render consumer is ADOPT-NOW unblocked.

**What value.js OWES (its to push):**
- Land its own precepts-submodule pin (currently dirty `m docs/precepts`) — its
  arm, inv-16, fourier holds no lever.
- K.W2.5 `development`-export-key strip (coordinated with glass-ui R2 which
  already shipped) — still pending per glass-ui AS FINAL:80-82; value.js's own
  K continuation. NOT a fourier dependency.
- The K continuation (blob lift / aurora-derive consuming 3.2.0 dist) — value.js
  forward work, now UNBLOCKED by the published 3.2.0 + keyframes 3.0.0.

**What fourier OWES (its to push):**
- The fourier-side `/diff` Python conformance probe (the cohort parity half).
- The glass-ui-3.2.0 ADOPT-NOW bump (K-deploy K.W4) — and KILL P5, flip the
  two DONE-in-sibling peer rows, retire the dock-vt console bridge.
- The paired-close parity computation + both FINAL.md files.
- NOTHING crosses into value.js (inv-16 held).

---

## FOLDS (disposition + rationale)

See the StructuredOutput `folds` array. Summary: 2 ADOPT-NOW (the published
glass-ui 3.2.0 + keyframes 3.0.0 bumps), 2 DONE-in-sibling flips (the atomdiff +
publish peers), 1 PHANTOM-KILL (P5), 1 SHIP-as-wave (fourier's own conformance
probe + paired-close), 1 BOOK-with-kill-date (the cohort §3 model re-frame).

## inv-16 attestation

This report authored `fourier-analysis/docs/audits/runs/2026-06-04-glassui-reground-deep-audit/`
ONLY. Read-only across value.js, glass-ui, keyframes.js. No sibling tree written;
no host state touched. Every cross-repo claim cites the sibling's own committed
artifact (file:line / commit / FINAL.md / CHANGELOG).
