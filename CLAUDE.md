SERVED MODEL: claude-opus-5[1m]

# fourier-analysis — repository working law

Created at **X.F.W0** (tranche X, sub-tranche X·F), 2026-09-17, under gate **G-3**. Spec:
`value.js/docs/tranches/X/fourier/waves/F-W0.md` §3 row 31 · §4 G-3. Before this file the repo had
no root CLAUDE.md — the absence was a measured born-RED gate witness, not an oversight.

## What this repo is

Companion code for *An Introduction to Fourier Analysis* (`paper/fourier_paper.pdf`): Fourier series
computation, basis decomposition (Chebyshev, Legendre), epicycle reconstruction, contour tracing,
and an interactive web demo.

| surface | stack | root |
|---|---|---|
| library | Python ≥3.12 — numpy · scipy · scikit-image · Pillow · sympy · onnxruntime (`pyproject.toml`) | `src/` |
| API | FastAPI + Motor/MongoDB; routers `admin · contours · equations · gallery · images · sessions · visualizations` | `api/` |
| web demo | Vue 3.5 + vue-router 5 + Pinia; Vite 8; Tailwind 4 via `@tailwindcss/postcss` | `web/` |
| paper | LaTeX sources + the figure-generation apparatus | `paper/` |
| infra | Docker Compose, nginx gateway, deploy scripts | `infra/` · `nginx/` · `scripts/` |

**Producer packages consumed by `web/`** (`web/package.json` `dependencies`): `@mkbabb/glass-ui`
`^4.0.0` · `@mkbabb/keyframes.js` `^4.3.0` · `@mkbabb/latex-paper` `^0.2.1` · `@mkbabb/pencil-boil`
`^0.4.1` · `@mkbabb/value.js` `^0.13.0`.

## Commands

```sh
uv sync                      # library deps;  --extra dev  adds pytest/ruff/mypy/pre-commit
uv sync --extra web          # FastAPI + Motor + uvicorn

cd web
npm run dev                  # vite
npm run build                # vue-tsc -b && vite build
npm run test:e2e             # playwright  (8 specs live under web/e2e/)
```

There is **no unit runner and no lint script** in `web/package.json` as of 2026-09-17 — both are
known gaps with wave homes (X·F G-7 lint floor, G-9 unit-runner seat), not things to improvise
around. The enforcing type gate in CI is `npx vue-tsc -b --force` (`.github/workflows/ci.yml` and
`deploy-pages.yml`). **A gate that is not wired into those two files is an ornament.**

## Standing laws — binding on every session in this tree

1. **E13 — MAIL FIRST.** Every session and every wave OPENS with a coordination-mail sweep, and
   **no wave closes with UNREAD mail.** The durable ledger for this repo is
   **`docs/tranches/F/coordination/INBOX.md`**. Log every letter — inbound and outbound — with a
   status and a disposition. **NO CRONS** (owner order); the sweep is a session-open act.
2. **Producer trees are READ-ONLY, always.** `glass-ui`, `latex-paper`, `parse-that`, `keyframes.js`
   and `value.js` are siblings, not subdirectories. A producer-owned defect **rides a relay letter**
   and is **never patched in the consumer**. A consumer-side patch of a producer defect is a gate
   FAILURE, not a gate pass.
3. **Root-cause cures only.** No quick fix, no workaround, no masking fallback: no `try`/`catch`
   around a defect, no `test.skip`, no allowlist, no copied producer selector, no local patch of
   `node_modules`. Each is a HIGH defect.
4. **No backwards-compat shims.** Migrate the consumer at the root instead. A "temporary" shim that
   outlives its transition is the `F-T-N1` defect class, on the record in this repo's own mail.
5. **Pathspec commits only.** `git add <exact paths>` — **never `git add -A`**. No `git stash`, no
   `reset --hard`, no force-push. One commit per meaning.
6. **E-1 / E-3 — the record is immutable.** Dated specs, adjudicated registry records, conformance
   artifacts and prior evidence are never patched in place. Corrections land as **dated addenda
   beside** them.
7. **Write-then-measure.** Every published count, anchor or hash is read from the settled bytes —
   never predicted, never inherited from a prior seat's paste. Volatile figures are double-run. A
   frozen count of a moving file is a timestamp wearing a receipt's clothes.
8. **Probe parsimony.** Playwright and DevTools use is bounded and deliberate; static reads and
   `git` are preferred. Design and code analysis stay fastidious.
9. **LEAN · KISS · no contrivance.** No god modules, no speculative shared directories, no wrapper
   components that do not exist yet.

## Tranche discipline

Work is organised in lettered tranches under `docs/tranches/` (A…N live here; the active frontier is
**F**, executing as sub-tranche **X·F** whose specs live in the value.js repo at
`docs/tranches/X/fourier/`). Invariants are at `docs/INVARIANTS.md`; wave ordering at
`docs/CANONICAL-ORDERING.md`. A wave writes only inside its own spec's declared file bounds; a write
outside them is an escalation, not a judgement call.

## Known substrate facts, measured 2026-09-17

Recorded here so no session re-derives them or mistakes them for fresh breakage:

- The installed `@mkbabb/glass-ui` 4.0.0 ships a **syntactically corrupt**
  `dist/styles/index.css` (comment delimiters 17 `/*` vs 8 `*/`); strict Tailwind loaders hard-error
  on it. This is a **producer** dist-generation bug — producer source is intact. It rides the
  glass-ui BH relay (packet **P-1**, item 0) and is **never** patched here.
- `web/dist/` is on-disk 3.1.0-era residue (`Jun 12 18:13`), **untracked and gitignored** — not a
  build output of the current tree, and not admissible as emission evidence without saying so.
- The full substrate reading is banked at `docs/tranches/F/SUBSTRATE-LEDGER.md`.
