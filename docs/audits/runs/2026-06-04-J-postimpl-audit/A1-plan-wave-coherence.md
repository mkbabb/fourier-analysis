# A1 — Plan & Wave Coherence (post-impl, 2026-06-04)

**Dimension**: A1 — does tranche J's 9-wave plan still cohere after this session's W2-W4 implementation? Where does plan diverge from reality? Overfitting (inv-15). Close-ability. Honest successor.
**Repo state**: origin/master HEAD = `9d7c387` (NOT deployed — host stuck at `f2fe447`, 29 commits behind). CI run `26913592291`: web ✓, api ✓ (266), e2e ✗.
**Verdict**: **GAPS-FOUND**. The 9-wave SHAPE is sound and the W2-W4 work is real, idiomatic, and consumer-honest in its leaf waves — but the CORE ships a **structurally degenerate provenance substrate** (the within-viz version chain can never exceed one node, so three model fields + two read endpoints are inv-15 phantoms at HEAD), and the plan's "J close-able" implication is false: J cannot close (W5-W8 open, CI red, deploy unlanded). The honest successor is **two tranches**: J stays open for W5-W8, and a new infra/evidence tranche (K-deploy) must carry the deploy + e2e chronics that J's plan never anticipated.

---

## §1 — Is the 9-wave structure still sound post-implementation?

**Mostly yes, with one structural correction and one missing wave.**

The deep-audit fold's re-presentation (CORE leads → consumer-backed leaf wins → WC dresses CORE → close) is the right shape for a data-model tranche, and dropping the vestigial 6-wave modern-web spine (J.md §4, PROGRESS §13) was correct — forcing a data-model tranche onto a CSS-platform spine produced the "category-shuffle" the audit named. The W0/W1 DEV waves closed with real artefacts (`design/J.W1-crud-remix.md`, `J.W1c`, `J-diff-shape.md`, CANONICAL-ORDERING §19/μ′, three ledgered ADOPTION-ASKS at `ADOPTION-ASKS.md §7:122-124`). That is genuine planning output, not vapor.

**Where the structure breaks down post-impl:**

1. **The CORE's provenance is degenerate — the wave delivered a substrate it cannot fill.** Every code path that writes `visualization_versions` is `_write_root_version` (`api/routers/visualizations.py:121-148`), which hard-codes `depth=0, parent_hash=None, root_hash=set_hash_value`. The ONLY caller in the live flow is remix (`:592`), and remix creates a **new viz** with its **own** depth-0 chain — it does not append a version to the parent's chain. The PATCH path (`update_visualization:350-392`) mutates the live row in place via `$set` and writes NO version, never touches `version_count`. `version_count` is hard-set to `1` at create (`:581`) and incremented nowhere. **Net: every viz's version collection holds exactly one document, forever.** `/versions` (`:860`) always returns a single-element list; `/provenance`'s within-viz `chain` (`:751`) is always a single node; `VisualizationVersion.parent_hash`, `.depth`, `.root_hash` are dead fields (always None/0/self). This is verified by the tests themselves: every assertion is `depth==0`, `parent_hash is None`, `versions[0]` (`test_remix.py:72,211`). The spec's §0 "the provenance chain is a list, walked parent→child→…→root" describes a chain that the implementation has no operation to grow. The cross-viz lineage (the thing that DOES grow) is carried entirely by `fork_of`/`fork_of_hash` on the viz row + the `fork_breadcrumb` walk (`:764-784`) — which is correct and sufficient. The within-viz version machinery is the over-build.

2. **A whole wave is missing from the plan: the e2e/deploy infrastructure repair.** J.W6 was scoped as "write the e2e/axe evidence" (J.md §4 row W6) on the ASSUMPTION that fourier CI is green and the only gap is the missing test coverage. Reality (CI `26913592291`, and identically the pre-J master run `26831216131` on `7ad8fce`): the e2e gate is **red before J even started**, on a glass-ui dock VT-name collision (`glass-dock-1` duplicate, `node_modules/@mkbabb/glass-ui/dist/dock.js` module counter, two docks mounted). J.W6 cannot "land the green claim" by writing tests — it must first repair a glass-ui-owned blocker. The plan has no wave for "the e2e gate is structurally broken"; it folded I's *deferred* e2e evidence (J.md §8) but not I's *broken* e2e gate. Worse, the API deploy-of-record (inv-28) depends on this same green CI, and the deploy is 29 commits unlanded — a chronic the plan never names.

**Conclusion**: the 9-wave SHAPE survives; the CORE wave over-delivered a phantom (the version chain) and the plan under-anticipated the infra reality (e2e red + deploy unlanded). Both are correctable without a re-architecture, but neither is a "just finish W5-W8" item.

---

## §2 — Where plan diverges from reality (cited)

| Plan claim | Reality | Evidence |
|---|---|---|
| "single-parent LINEAR provenance … walked parent→child→…→root" (J.md §0, spec §0) | The within-viz chain is single-NODE; no operation grows it. Lineage is cross-viz `fork_of` only. | `visualizations.py:121-148` (only inserter, depth=0); `:350-392` (PATCH writes no version); `test_remix.py:72,211` |
| W6 = "write the e2e/axe evidence … the green claim I could not make in-session" (J.md §4) | The e2e gate is RED pre-J on a glass-ui dock blocker; W6 must repair infra first, not just write tests. | CI `26913592291` e2e ✗; prior master `26831216131` (`7ad8fce`) failed identically |
| "fourier CI green (run id, inv-27)" is a CORE close gate (J.md §7) | CI is red; no green run id exists for HEAD. The CORE's own §7 gate is unmet. | `gh run view 26913592291` (failure) |
| The dock VT blocker "USER DECISION: book the fix to W6 / glass-ui 3.2.0 (an inv-16′ ADOPTION-ASK)" | NO `glass-ui-dock-vt-name` row exists in `ADOPTION-ASKS.md §7`. The booking is asserted, not ledgered — the exact A6-3 honesty gap the deep-audit caught for `valuejs-J-atomdiff`. | `ADOPTION-ASKS.md §7:122-124` lists only atomdiff/publish/P5-inner-rounding; grep for dock/vt-name = 0 hits |
| inv-28 "verified-deploy-of-record" governs J (inv list) | The API deploy never landed; host at `f2fe447` (pre-H). G/H/I/J have NEVER deployed; the inv-28 gate (green CI) is exactly what's red. | task deploy-state; SSH diagnosis this session |
| PROGRESS W2 "GREEN (local); CI-green pending push" (PROGRESS:19) | Pushed; CI is NOT green (e2e ✗). The "pending push" framing implies a push would green it; it did not. | CI `26913592291` |

The single most material divergence is the **provenance degeneracy** (§1.1) — it is the difference between "J built the fork/version/provenance substrate" (the thesis, J.md §1) and "J built fork + a one-element version table." fourier did inherit value.js's *fork* substrate and did gain the *atom-diff* layer; it did NOT earn a *version* substrate, because nothing versions.

---

## §3 — Overfitting check (inv-15): does every shipped artefact carry ≥2 consumers / a demo?

**CORE (W2):**
- `canonical_digest` (`canonical_digest.py`) — **PASS**. Three real consumers: ETag, `content_hash`, `atom_hash`/`set_hash` (transposed byte-identical, `etag.py` + `atomdiff.py`). The elegance headline is real and earns its place.
- `atomdiff.py` (`diff_atoms`/`enumerate_atoms`/`set_hash`) — **PASS**. Consumers: the remix recorder (`:535`), the `/diff` endpoint, and the value.js-J twin (booked, `ADOPTION-ASKS §7:122`). ≥2 by construction.
- `POST /remix`, `POST /{publish,unpublish}`, `GET /forks`, `GET /diff` — **PASS**. Each names a live consumer: `most-forked` sort write-side (de-phantomed), the visibility guard's first live caller (`:373-379`), the gallery, the diff-viewer (booked W5). Publish even reaches the twice-dead `visibility_illegal_transition` guard — a genuine consumer-of-dead-code win.
- **`VisualizationVersion.{parent_hash, depth, root_hash}` + `version_count` + `GET /versions` + `/provenance` within-viz `chain`** — **FAIL (inv-15 phantom)**. These exist to support a multi-node version chain that no operation creates. `depth` is always 0, `parent_hash` always None, `root_hash` always self, `version_count` always 1, `/versions` always single-element, the within-viz `chain` always single-node. Zero consumers exercise depth>0 (no test can; `test_remix.py` asserts the degeneracy). The substrate-without-consumer-is-binary test fails: this is binary-OFF substrate shipped as if ON. It is not actively harmful (the fields are inert), but it is exactly the "phantom substrate" J.md §1 swears it refuses ("no phantom substrate — every endpoint names a real consumer, inv-15").

**Leaf waves (W3/W4):**
- `scheduler.ts` (`yieldToMain`/`processInChunks`) — **PASS, honestly scoped**. One real consumer (`gallery.ts:74` chunked accumulation). The brief asks: honest or under-delivered? **Honest.** The code + the comment (`scheduler.ts:13-18`) correctly name why the rAF render loop is NOT a yield target (off-screen-gated by I.γ + server-side solve; chunking mid-frame tears). This is inv-15 applied correctly: ship the reusable floor against the one genuine consumer, NAME the non-target rather than manufacture theatre. The one soft spot: a single consumer is the inv-15 floor, not a margin — but the value.js-J twin + the W6 measured-delta booking make it ≥2-by-design. Accept.
- `.deferred-section` on `GalleryCard.vue:71` — **PASS**. Two consumers of the glass-ui utility now (`GalleryCard.vue:71` + `PaperArticleWindow.vue:74`). CSS-only, revertible (inv-29 floor). Clean.

**Overfitting verdict**: 6 of 8 CORE artefacts PASS; the version-chain cluster is a genuine inv-15 violation by the tranche's own standard. The leaf waves pass with honest scoping.

---

## §4 — Is J close-able now?

**No.** Three independent blockers, in severity order:

1. **CI is red (inv-27).** The CORE's own §7 gate ("fourier CI green") is unmet. No green run id exists for `9d7c387`. inv-27 is categorical: no covering green run = no green claim = no close. This alone is dispositive.
2. **W5-W8 are open** (PROGRESS:22-25, all "planned"). W5 (WC design + `cartoon-card` retirement), W6 (the e2e evidence + the measured INP/CWV deltas that W3/W4 explicitly deferred), W7 (CSP/fetchLater), W8 (FINAL.md) have not run. The measured deltas W3/W4 promised (PROGRESS:20-21 "measured INP delta is W6") are unredeemed — so even the *leaf* waves are evidence-incomplete.
3. **The deploy-of-record (inv-28) never landed.** The API CORE is not in prod; the host is 29 commits behind. J's own completion criterion does not require deploy, but inv-28 is an inherited invariant J is "governed by" — and the deploy chronic is unbooked anywhere in J's ledger.

J must stay open until W5-W8 land AND the e2e gate is repaired AND a green CI run id covers HEAD. The PROGRESS "GREEN (local); CI-green pending push" framing (rows W2-W4) is the dangerous self-deception: it reads as "one push from green," but the push happened and CI is red on a blocker the plan never scoped.

---

## §5 — The honest successor shape (the path-forward recommendation)

The brief asks: J-close vs new tranche vs fold; the booked WebMCP K, or a new tranche carrying the deploy+e2e chronics, or both? **Both — and a CORE-simplification fold.** Recommended shape:

**(A) J stays OPEN — finish W5-W8 in J (do NOT spin a new tranche for them).** They are J's own planned waves with real artefacts ahead. Folding them out would orphan the WC/evidence/tail work the plan correctly scoped. But two corrections MUST fold into J before W8:
- **FOLD-into-J: collapse the degenerate version substrate.** Either (preferred, KISS) DELETE `VisualizationVersion.{parent_hash, depth, root_hash}`, `version_count`, and the within-viz `/versions` + `chain` machinery — keeping only the single per-viz atom snapshot the `/diff` recorded-delta actually reads (`get_diff:822-823` only needs the HEAD version's `atom_diff`); OR commit to a real edit-creates-a-version operation that fills the chain (a bigger CORE expansion). The first is the honest NO-LEGACY move: ship what has consumers, delete what doesn't. This is the single most important architectural transposition for J.
- **FOLD-into-J: ledger the dock VT blocker as an inv-16′ ADOPTION-ASK NOW.** The `glass-ui-dock-vt-name` row (unique per-mount VT-name prop on `GlassDock`, gated on glass-ui 3.2.0) is asserted as a "USER DECISION" but absent from `ADOPTION-ASKS.md §7`. Until it is ledgered with an owner + acceptance shape, W6 has no green path and inv-28 has no unblock. This is a 10-minute doc fix that the plan's own A6-3 discipline demands.

**(B) NEW tranche K-deploy (or fold into the existing booked K) — carry the deploy + e2e-gate chronics.** These are NOT J-local data-model work; they are constellation infra + a glass-ui cross-repo dependency:
- the 29-commit unlanded API deploy (G/H/I/J never deployed; the health-gate rollback root-caused this session);
- the inv-28 API-arm green-CI gate (booked-not-built; needs the host read-only PAT);
- the glass-ui-3.2.0 dock-VT dependency that unblocks fourier's e2e green.
This is a chronic of exactly the F/H lineage ("webhook silently broken ~2 months") and deserves its own named tranche, not a quiet J residual — a deploy chronic dropped into a data-model close is the anti-pattern the user's directive forbids.

**(C) The booked WebMCP K stays booked, distinct.** The agent-legible remix/diff/publish endpoints are genuinely thin-wrappable (the design discipline held). K-webmcp remains the Chromium-146-gated successor (J.md §10). Do NOT conflate it with K-deploy — name them distinctly (K-deploy is the infra chronic; K-webmcp is the feature graduation). Suggest **K = deploy/e2e-repair (the urgent infra tranche)** and **L = WebMCP (the feature graduation)** to preserve the Greek/letter chain honesty.

**One-line path-forward**: *Finish W5-W8 inside J after folding in the version-substrate collapse + the dock-VT ledger; spin K-deploy for the unlanded-deploy + e2e-gate + glass-ui-3.2.0 chronics; keep WebMCP as the further-out feature successor.*

---

## §6 — Recap-coverage of the binding directive

The user directive demands: deeply audit plan + changes; idiomatic gestalt path forward, no workarounds; architectural transpositions for elegance/simplicity/perf; NO legacy; delineate chronically-deferred + deferred items and FOLD them; recap all prompts; tranche development only.

- **Idiomatic/elegance transposition found**: `canonical_digest` (3→1 serializer) is the genuine elegance win and it landed. The *next* one this audit surfaces is the inverse — the version-substrate is anti-elegant over-build; the gestalt move is DELETE, not extend. Recorded as a J fold.
- **NO-LEGACY**: the version-chain phantom is the live NO-LEGACY violation (dead fields shipped). The `cartoon-card` shim retirement is correctly booked to W5 (J.md §8) — verify it actually retires.
- **Chronics folded with terminal verdicts**: deploy chronic → BOOK-with-kill-date into K-deploy; dock-VT → FOLD-into-J (ledger now); version-substrate → FOLD-into-J (collapse). None left as perpetual punts.
- **"Tranche development only"**: this audit recommends NO implementation — all dispositions are plan/ledger/fold moves. Compliant.
