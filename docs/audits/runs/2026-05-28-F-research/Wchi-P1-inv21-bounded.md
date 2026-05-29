# F research-first audit — Wχ-P1 inv-21 bounded-scope probe

**Lane**: F.Wχ-P1 of the F research-first workflow `w0ma5070c` (Wα 3 research lanes → Wχ 4 challenge probes → synthesis).
**Mode**: research-first; READ-ONLY (live probes + host SSH capture + source reads; no mutation). Tranche-development only.

---

This is an analysis task — I have all the Wα research inputs. Let me reason through each thread's LOC/session estimate against inv-21 and produce the verdict. No tool calls needed; the evidence is fully provided.

```
## F.Wχ-P1 — inv-21 bounded-scope probe

### Per-thread LOC/session estimate
| thread | wave(s) | est LOC or sessions | inv-21 verdict |
|---|---|---|---|
| α | W1 nginx + rate-limit | ~7 LOC nginx (location= blocks) + ~15 LOC middleware (shape-a fuse) ≈ 22 LOC, but 2 deploy surfaces (container recreate + FastAPI redeploy) | PASS-by-LOC, FRAGILE: 1 PR, 1 SSH window if co-deployed |
| β | W2 cache refactor | sig change + lookup/store + bases wire + collection rename + 2 log lines ≈ 40–60 LOC, mechanical, 1 PR | PASS |
| γ | W3 operator window | host-ops; 0 LOC but SPANS ≥2 sessions | **BUSTS** |
| δ | W4+W5 a11y/SEO/perf/font | self-host font + meta + a11y attrs ≈ 150–300 LOC, frontend-only, 1 PR | PASS (watch sprawl) |
| ε | W6+W7+W8 chronic+3 transpositions+migration | 3 transpositions + F-T-N1 cross-repo demo + migration trigger; F-T-N1 touches 2 repos | RISK — see below |

### The thread that BUSTS inv-21 (the adversarial finding)
**γ (W3) BUSTS the single-SSH-session bound — definitively.** R2 §3 is explicit: `gh auth status` returns **INVALID** ("The token in default is invalid"), and `update-webhook-urls.sh` **hard-fails at line 46** on its gh-auth pre-flight. The 5 GitHub webhook URLs **cannot be repointed this session**. Critically, R2 §7 establishes a hard ordering dependency: the dispatcher MUST NOT be deleted (γ.1.8 `rm dispatch.sh`) and the value.js arm cannot die (γ.2) **until the 5 URLs are flipped** — else webhooks 404. So γ.1 splits into:
- **Window 1 (ready now, no operator):** γ.1.1–1.3 (backup dispatch.sh + hooks.json, author 5 per-repo entries, reload receiver), γ.3 (speedtest teardown — vhost+:8140 confirmed, live already 404), γ.4 (cron evidence, capture-only), γ.5 (dangling=0, capture-only).
- **Window 2 (gated on operator `gh auth login -h github.com`):** γ.1.4–1.7 (re-auth, dry-run, `--apply` URL flip, per-repo hook tests), THEN γ.1.8 `rm` + γ.2 close.

This is not a LOC bust — it is a **single-session bust**. The work is intrinsically two host-ops windows separated by an out-of-band operator credential action that cannot be scripted away. No "<800 LOC OR single-window receipt" reading rescues it: there is no single window.

**ε is a secondary watch, not a bust:** F-T-N1's cross-repo paired demo PR touches fourier + a sibling repo. inv-21's "single-PR" is per-thread, and a paired demo is one logical PR-pair authored in one window; LOC stays bounded. It is borderline but defensible as one window provided the sibling change is the minimal demo cite (rate-limit.ts reference per R3 §4), not a co-refactor. Flag it, don't split it.

### Recommended wave-split (if any thread busts)
Split γ at the operator boundary:
- **W3a — host-ops single-window (no operator):** dispatcher+hooks.json backup/author/reload (config staged, NOT activated), speedtest teardown, cron+dangling capture. Documented single-SSH receipt. inv-21 PASS.
- **W3b — operator-gated cutover (second window):** gh re-auth → URL flip → hook tests → dispatcher `rm` + value.js arm retirement. Opens only after operator re-auth; its own single-window receipt. inv-21 PASS.

The pre-mutation snapshot in R2 §7 (dispatcher = 5-arm latent-broken value.js arm; hooks.json single multiplex; HMAC `89eadc1d…a5c070`) is the binding rollback anchor across both windows.

### Verdict: SPLIT-NEEDED at γ (W3)
α/β/δ are bounded (PASS). ε is bounded-but-watch (F-T-N1 paired demo must stay minimal). γ **busts inv-21's single-session bound** — the INVALID gh token forces a second, operator-gated SSH window; split W3 → W3a (now) + W3b (post-re-auth).
```
