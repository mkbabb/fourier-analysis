# INBOX — feedback-coder (session S3, LIVE on `tranche-l`)

Hand-off into the live feedback-coder session. Authored by S1 (keyframes-D) for the
tri-tranche constellation drive. **We NEVER write feedback-coder** — this is the only
contact surface. State below is verified against live source (HEAD `3f5f00b`,
branch `tranche-l`), not assumed.

---

## 1 — PASTE THIS into the live S3 session

> A three-tranche constellation drive is live, three sessions in parallel:
> **keyframes-D** (S1) ∥ **glass-ui-AU / slides-F** (S2) ∥ **your feedback-coder
> Tranche L** (S3). Read the live blackboard
> `/Users/mkbabb/Programming/fourier-analysis/docs/constellation/tri-tranche-run/RUN-BOARD.md`
> + this inbox `…/tri-tranche-run/INBOX-feedback-coder.md`, then register: update
> your row (S3) in the RUN-BOARD §1 at each milestone. **Your Tranche L is the
> fine-tuned boundary-tagger — pure Python ML/NLP; it consumes NO slides framework /
> glass-ui / keyframes (verified, grep = 0).** So edge **E3 is N/A — you are
> STANDALONE and GATE-FREE.** Drive L to its own green CI autonomously; do NOT wait
> on glass-ui 3.3.0 or any UI publish. (`COORDINATION.md` is the constellation
> protocol for the UI publish-chain edges, S1/S2 — since you're gate-free, only the
> RUN-BOARD concerns you; it is the shared source of truth.)

---

## 2 — S3's ACTUAL coupling (the investigation)

**Finding: feedback-coder consumes none of slides / glass-ui / keyframes. E3 is
RESOLVED-FALSE / N-A.** Evidence, all against live source:

- **feedback-coder is a Python ML project, not a frontend.** Root has `pyproject.toml`
  + `uv.lock` + `src/feedback_coder/` — **no `package.json`, no `.vue`, no slide deck**
  anywhere outside `.venv`. It is "a local pipeline that codes 258
  classroom-observation feedback forms against the Schwartz rubric" (CLAUDE.md).
- **Active Tranche L = the fine-tuned local boundary-tagger build** (`docs/tranches/L/L.md`,
  authored 2026-06-02). Discourse-segmentation: PyTorch-MPS + HF
  `AutoModelForTokenClassification` + roberta-large/xlm-roberta on DISRPT/GUM/STAC
  corpora. Two phases — Phase A ($0 off-corpus, executable on a "begin") + Phase B
  (double-gated on the I-D3 commission AND an authorizing binding-read MISS). L.W0
  DONE; L.W1–W5 pending. **Nothing in L touches UI.**
- **Grep is decisive.** Over `feedback-coder/docs/tranches/L/`:
  `slides|glass-ui|keyframes|springLinearStops` = **0 matches**. Repo-wide the only
  `@mkbabb/glass-ui` + `@mkbabb/keyframes` hits are in *precept docs*
  (`docs/precepts/cross-repo-dev-resolution.md`, `…/LESSONS-LEARNED.md`) — generic
  `@mkbabb/*` constellation dev-resolution governance, NOT consumption. No
  `springLinearStops` anywhere. No `.github/workflows`, no Cloudflare/Pages/gh-pages
  deploy — **the repo deploys nothing.**

**Where the "new set of slides" actually lives (the brief's framing resolved):** the
feedback-coder DECK is in the **slides repo**, not here —
`/Users/mkbabb/Programming/slides/src/decks/feedback-coder` on branch
`deck/feedback-coder` (HEAD `6a79d38`). That deck is **S2's domain (slides-F)**; it
consumes `@mkbabb/glass-ui ^3.2.0` + `@mkbabb/keyframes.js ^3.0.0` and IS gated on the
UI publish chain. **But that is the slides repo, authored by S2 — it is NOT this
repo and NOT this session's work.** S3 (the feedback-coder repo / Tranche L) is a
separate, decoupled ML deliverable.

---

## 3 — S3's edges + what it waits for

**Nothing. S3 has no inbound or outbound gates.**

| Edge | Status for S3 | Why |
|---|---|---|
| **E3** (feedback-coder deploy → E2 slides deploy) | **N-A / RESOLVED-FALSE** | L consumes no slides framework / glass-ui / keyframes; the repo deploys nothing. The E3 edge is conditional on UI consumption — that condition is FALSE at HEAD. |
| E1 (glass-ui 3.3.0 publish) | **does not touch S3** | the ROOT hinge gates keyframes-D demo + slides-F only |
| E2 (slides deploy) | **does not touch S3** | terminal gate for S2's slides arm |

**S3 waits for no one and blocks no one in the UI publish chain.** Its only internal
gates are L's own design gates (the Phase-B double-gate: the I-D3 commission [K-D5,
user-domain spend/IRB] AND a measured binding-read MISS) — those are L-internal, not
constellation edges. Re-open E3 only IF a future L wave begins consuming the slides
framework / glass-ui / keyframes (none does at HEAD).

---

## 4 — The protocol (for S3)

1. **Register + update the RUN-BOARD.** Edit ONLY your row (S3) in
   `tri-tranche-run/RUN-BOARD.md` §1 at each milestone (wave done, CI green). You
   carry status `LIVE` — you self-pace your own ML tranche and never enter the UI
   publish-chain vocabulary (`READY-TO-PUBLISH → PUBLISHED → DEPLOYED` is for S1/S2).
   inv-16: write only your own repo + your own RUN-BOARD row.
2. **Work autonomously to your OWN green CI** (inv-27, green-means-green per repo).
   Drive L's waves on the user's "begin" directives, per L's own plan
   (`docs/tranches/L/L.md`). Phase A is $0/off-corpus/local — no external gate.
3. **Gate-if-coupled: you are NOT coupled** — so proceed standalone. No
   heartbeat-poll of `npm view @mkbabb/glass-ui version`, no circle-back: there is
   no UI gate to wait on. (If — and only if — a future wave adds a slides/glass-ui/
   keyframes dependency, re-read E3 and gate your deploy on E2 then.)
4. **Keep the board current + terse.** The RUN-BOARD is the shared source of truth;
   `COORDINATION.md` is the constellation publish-chain protocol (the S1/S2 edges) —
   since you're gate-free it does not bind you, though you may read it for context.

---

## Appendix — verification commands (re-runnable)

```sh
# S3 is Python, no frontend:
ls /Users/mkbabb/Programming/feedback-coder/{pyproject.toml,package.json} 2>&1
# Tranche L consumes no UI surface (expect: no output):
grep -rinE "slides|glass-ui|keyframes|springLinearStops" \
  /Users/mkbabb/Programming/feedback-coder/docs/tranches/L/
# the feedback-coder DECK is in the SLIDES repo (S2), not here:
git -C /Users/mkbabb/Programming/slides branch --show-current   # deck/feedback-coder
ls /Users/mkbabb/Programming/slides/src/decks/feedback-coder
# feedback-coder deploys nothing (expect: no such dir):
ls /Users/mkbabb/Programming/feedback-coder/.github/workflows 2>&1
```
