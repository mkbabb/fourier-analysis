# Constellation precepts sync — `docs/precepts` pointer state

The shared `docs/precepts` submodule (`mkbabb/precepts`) is bumped per-repo when a
new canonical precept lands. This ledger records the last sync sweep so a future
session sees which repos are aligned and which are booked.

## 2026-06-04 — sync to `8ccf9f4` (the π-lane every-page before/after edict)

Precepts `origin/main` advanced to **`8ccf9f4`** — *"spec(π-lane): edict —
every-page paired before/after capture + scripted occlusion gate"* (one commit
past `63240e6`; adds the canonical capture path
`docs/tranches/<L>/audit/screenshots/{before,after}/<page>-<viewport>.png`). The
user directed: "ensure our constellation repos are all synced."

| Repo | Precepts pointer | Action |
|---|---|---|
| **fourier-analysis** | `63240e6` → **`8ccf9f4`** | SYNCED (clean, own repo); committed, not pushed |
| **keyframes.js** | `8ccf9f4` | already synced (no-op) |
| **speedtest** | `63240e6` → **`8ccf9f4`** | SYNCED — surgical pathspec bump (submodule clean; parent code-dirty untouched); not pushed |
| **words** (Floridify) | `63240e6` → **`8ccf9f4`** | SYNCED — surgical pathspec bump (submodule clean; 23 parent code-dirty untouched); not pushed |
| **muster** | `63240e6` → **`8ccf9f4`** | SYNCED — surgical pathspec bump (submodule clean; 89 parent code-dirty untouched); not pushed |
| **value.js** | `63240e6` | **BOOKED** (inv-16′) — its `docs/precepts` SUBMODULE has uncommitted edits (2 files; likely the authoring site of this very edict). A checkout would CLOBBER that work. value.js's own session commits/reconciles its precept edits, then bumps. fourier holds no lever. |
| **glass-ui** | `63240e6` | **BOOKED** (inv-16′) — same: its `docs/precepts` submodule is dirty (3 files). Maintainer commits + bumps on its own clean checkout. |
| **deploy** | — | N/A (no `docs/precepts` submodule) |

**Method (inv-16′):** the bumps stage ONLY the `docs/precepts` gitlink (pathspec
commit) — never the siblings' dirty CODE files (verified: each repo's
non-precepts dirty-file count was unchanged across the bump). Nothing was pushed,
so each repo's own session reconciles + publishes on its own terms
(per-repo-green-CI-gated). The two BOOKED repos are NOT touched (a bump would
clobber their in-flight precept-submodule edits — the inv-16′ never-write-a-dirty-
sibling-tree guard, applied at the submodule granularity).

**5/7 synced** (fourier, keyframes, speedtest, words, muster); 2 booked (value.js,
glass-ui); deploy N/A.
