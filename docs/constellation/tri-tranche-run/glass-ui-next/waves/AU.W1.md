# AU.W1 — design slices (DEV, boundary)

The design boundary (CHARTER §3 W1). AU re-issues AT.W1's three design slices —
blob-primitives, dock, color-gates — as-authored against HEAD `8e4cb9f`. NO
re-audit: the W0b SOTA reads (`W0b-A1..A6`) and the C-synthesis (`W0b-C1..C6`) are
the binding design substrate, inherited whole (`at-state.md §verdict 1`, CHARTER
§header). This wave writes NO src — it is the last DEV wave. **END OF DEV** is at
AU.W1's close; AU.W2 is the first IMPL.

## §Scope

1. **`design/AU.W1-blob-primitives.md`** — re-issue AT.W1-blob-primitives as-authored
   (the goo-blob + watercolor-dot primitives + the shader-quality SOTA edits + the
   DEC-AT-7 GAMMA→LINEAR space-seam). Cites its AT.W1 origin + its HEAD delta (HEAD is
   unchanged on the blob graph — zero src exists, so the delta is "carried whole").

2. **`design/AU.W1b-dock.md`** — re-issue AT.W1b-dock with the HEAD delta folded: the
   three dock commits LANDED (`e906448`/`f0b0ffb`/`8e4cb9f`), so the design records
   them DONE and carries forward only the UNEXECUTED slices — `proof:strict-templates`
   (the keystone, now AU.W3), the reka-ui Tabs rail + a11y contract + travelling
   indicator (the atomic pass, now AU.W8), the `<Role>Dock` docs vocabulary (ASK-7).
   The slot-ID collision re-letter (W0) is cited here.

3. **`design/AU.W1c-color-gates.md`** — re-issue AT.W1c-color-gates: the `/color`
   leaf (DEC-AT-7, inv-AT-color) + the full color/correctness gate set
   (`proof:color-acyclic`, `proof:single-color-core`, `proof:webgl-substrate-single`,
   `proof:webgl-golden`, `proof:blob-value-free`, `proof:peer-optional`,
   `proof:vueuse-free-root`, `proof:strict-templates`, `proof:font-axes`). Each gate's
   fail-closed spec + its `gates.mjs` tag (inv-θ).

## §HARD gate

Per CHARTER §3 W1: **the three design files exist; each cites its AT.W1 origin + its
HEAD delta.** Made re-runnable as `proof:au-w1-design`, fail-closed:

- **(a) the three slices exist** under `tranches/AU/design/`. Reddens if any absent.
- **(b) each cites its origin + delta.** Each design file names its AT.W1 source slice
  AND its HEAD-`8e4cb9f` delta (the dock slice records the three landed SHAs; the blob
  + color slices record "carried whole — zero src at HEAD"). A grep asserts each file
  carries both an `AT.W1*` origin citation and a HEAD-delta section.
- **(c) every gate named in W1c is registered born-RED in `gates.mjs`** with its
  `{local,ci,release,sibling}` tag + its greening wave — no gate greens by being
  absent (inv-θ). `gates:verify-ci` passes (the manifest == the ci.yml matrix ==
  release.yml filter, structurally).

inv ε: the gate is the design slices' existence + their origin/delta citations + the
born-RED gate registry. A design wave that asserts a gate green before its wave fails
(c).

## §Boundary

W1 is the dev/impl boundary (CHARTER §3, AT's own format carried — DEV waves write no
src; IMPL waves RUN only on explicit user authorization). After W1, every wave is an
IMPL wave authored now as a binding spec, run on authorization.
