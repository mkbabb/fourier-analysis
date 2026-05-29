# F research-first audit — Wχ-P4 transposition boundary probe

**Lane**: F.Wχ-P4 of the F research-first workflow `w0ma5070c` (Wα 3 research lanes → Wχ 4 challenge probes → synthesis).
**Mode**: research-first; READ-ONLY (live probes + host SSH capture + source reads; no mutation). Tranche-development only.

---

## F.Wχ-P4 — transposition KISS + boundary probe

### §1 — F-T-N1 cross-repo boundary
- **Does dropping `status` from value.js/ violate inv-16? NO — paired-PR framing holds.** F.md §9:188 keeps fourier-F's commit boundary at `value.js/**` intact: fourier-F **documents the ASK**, the value.js maintainer (same human, separate repo HEAD) **commits the value.js side**. No fourier-F commit ever touches `value.js/api/src/format/palette.ts`. The charter is consistent — §3 W7 says "paired demo PR (cross-repo coord)" and §9 names the boundary explicitly.
- **The honest framing**: fourier-F authors a doc-only coordination note (the ASK); the value.js maintainer authors the source edit in the value.js repo. Not overreach **provided execution honors it** — see §4: this is the one with live blast-radius if a future agent "helpfully" edits the value.js tree from an F worktree.

### §2 — F-T-E1 auto-discover
- **(name, version) idempotency preserved? NO — version is LOST at discovery.** The current `MIGRATIONS` list (lines 56-60) pairs each module with an **explicit, human-authored `version: int`** (line 53-55 comment: "Bump version when re-running an already-applied migration is intended"). A `glob(migrate_*.py)` only yields *names*. The whole idempotency key is **(name, version)** — the unique index (line 72-74), `_is_completed` (line 78-80), and every record fn key on both.
- **MIGRATION_VERSION source: DOES NOT EXIST.** It is named only in the docstring schema (line 29) as the *intended* source, but grep finds **zero** `MIGRATION_VERSION` in any `migrate_*.py`. Auto-discovery's premise (read per-module `MIGRATION_VERSION`) requires **adding** a constant to all three modules — i.e. it does not remove the version, it relocates it into N files and adds glob + import-introspection plumbing.
- **KISS verdict: ADD.** A 5-line static list (deterministic order, explicit version-bump intent, greppable) is replaced by filesystem glob + per-module attribute introspection + a new convention to enforce. The version-bump *intent* (the reason the list exists) is silently destroyed unless re-implemented. This is complexity relocation with capability loss.

### §3 — F-T-S2 inline
- **Truly private? YES.** Neither `apiFetchWithETag` (line 285) nor `adminFetch` (line 298) is `export`ed; zero external call-sites (grep outside `lib/api.ts` = empty). Call-site count: `apiFetchWithETag` = 6, `adminFetch` = 14 — all in the same file.
- **KISS verdict: ADD (and the premise is already stale).** "Inline at call-sites" would expand 2 thin wrappers (≈12 LOC each) into **20 fully-spelled `coreFetch` invocations** with repeated `auth`/destructure boilerplate — strictly more code. Worse, the transposition's stated goal was already achieved by **E.W5** (line 126-137): the 4 legacy helpers were *already* collapsed into one `coreFetch` core, with `apiFetchWithETag`/`adminFetch` retained deliberately as named pass-throughs preserving per-call-site signatures. Inlining 14+6 sites would *reverse* a shipped REDUCE.

### §4 — Adversarial finding: the one transposition that should be DOWNGRADED or RE-FRAMED
**F-T-S2 must be DOWNGRADED to NO-OP/REJECT.** It is not a REDUCE — it inverts the E.W5 collapse it claims to extend, fanning 2 helpers into 20 inlined sites (net +LOC, lost signatures). FA5 §2's "inline" framing predates / ignores E.W5. **F-T-E1 must be DOWNGRADED to ADD** (version-bump intent lost; glob+introspect added). Of the three, only **F-T-N1 survives** as correctly framed — and only because it commits *nothing* in either repo from F (doc-only ASK).

### §5 — Verdict: **2 of 3 need revision.**
- **F-T-N1**: RATIFIED (boundary holds; doc-only ASK; inv-16 preserved).
- **F-T-E1**: NEEDS REVISION → reclassify ADD; keep the explicit `(name, version)` list. The version column is load-bearing idempotency, not boilerplate.
- **F-T-S2**: NEEDS REVISION → REJECT as redundant/regressive; E.W5 already delivered the consolidation. Retain the named pass-throughs.

Not all 3 RATIFIED. F-T-N1 alone is a KISS-honest, boundary-clean transposition.
