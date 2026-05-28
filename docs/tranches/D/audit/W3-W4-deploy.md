# D.W3 + D.W4 — Joint Deploy Close

**Date:** 2026-05-27
**Agent:** D.W3+W4-deploy
**Verdict:** GREEN
**Host advance:** `aed6c32` → `ce61e7c`
**Migration:** `api/scripts/migrate_flags_field.py` ran in-cutover (idempotent; empty DB no-op for data, 2/2 index transposition completed)

---

## Charter context

The previous parallel waves committed:

| Wave | Commit    | Pre-deploy state                      |
|------|-----------|---------------------------------------|
| W2   | `aed6c32` | DEPLOYED live (host HEAD pre-cutover) |
| W3   | `ce61e7c` | committed, NOT deployed                |
| W4   | `2e4a452` | committed, NOT deployed (chronologically pre-W2 close marker; tree-state was present at host HEAD `aed6c32` since W2 close is a docs-only commit atop W4) |
| W8   | `0f5d7c1` | committed, BLOCKED on CF token-account mismatch (not in scope of this deploy) |

Chronological chain (`git log --oneline --reverse`):

```
2e4a452 feat(D.W4): design refinement — cartoon-card shim + upload IA + gallery orphans + contrast sweep + focus rings
64f79f9 docs(D.W2): bump precepts submodule
aed6c32 docs(D.W2): close record — Spines 1+3 GREEN; Spine 2 DEFERRED
ce61e7c feat(D.W3): backend NO-legacy + transpositions (γ)
```

W4 lives **chronologically before** the W2 close marker. The host at `aed6c32` already had W4's tree-state for `web/` materialized in the frontend image (built at the W2 deploy). This deploy advances host HEAD by 2 commits (`64f79f9` + `ce61e7c`), but only `ce61e7c` (W3) touches code — and W3 is **backend-only** (`api/*`). Therefore the post-deploy frontend bundle hash is expected **unchanged** (`index-DOaNUTLH.js`); only the backend container should recreate.

---

## Step 1 — Pre-flight verification

### 1.a — Local HEAD + tree

```
$ git log --oneline -5
ce61e7c feat(D.W3): backend NO-legacy + transpositions (γ) — rename + dead-stratum + typed ImageAsset
aed6c32 docs(D.W2): close record — Spines 1+3 GREEN; Spine 2 DEFERRED to post-W8/W10
64f79f9 docs(D.W2): bump precepts submodule — promote tls/dr/deploy + add domains
2e4a452 feat(D.W4): design refinement — cartoon-card shim + upload IA + gallery orphans + contrast sweep + focus rings
5b84e31 fix(D.W2): restore --tlsAllowConnectionsWithoutCertificates — mongod 8.0 reality

$ git status --short
(empty — tree clean)
```

HEAD = `ce61e7c` ✓. W3 atop W2 close atop W2 precepts atop W4. Tree clean ✓.

### 1.b — Local frontend build

```
$ cd web && npm run build 2>&1 | tail -3
dist/assets/index-DOaNUTLH.js     854.40 kB │ gzip: 347.81 kB
(chunk-size warning — pre-existing, non-fatal)
✓ built in 4.41s
```

Build clean ✓. Bundle hash `index-DOaNUTLH.js` matches what was already on host (W4 tree-state was already there).

### 1.c — Host pre-deploy state

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net "cd /var/www/fourier-analysis && git rev-parse HEAD && cat /opt/deploy/fourier-last-green && docker ps --filter name=fourier --format '{{.Names}}\t{{.Status}}'"
aed6c3249b2a297085c7837ad3aa99df6dddaa60
aed6c3249b2a297085c7837ad3aa99df6dddaa60
fourier-analysis-backend-1   Up 5 minutes
fourier-analysis-frontend-1  Up 9 minutes
fourier-analysis-mongo-1     Up 15 minutes (healthy)
fourier-analysis-nginx-1     Up 2 months
```

Host HEAD = last-green = `aed6c32` ✓. All 4 containers Up ✓.

Pre-deploy bundle hash (for delta comparison):

```
$ ssh ... "docker exec fourier-analysis-frontend-1 ls /usr/share/nginx/html/assets/ | grep '^index-'"
index-Cn75F31Q.css
index-DOaNUTLH.js
```

(Confirms host already had `index-DOaNUTLH.js` pre-deploy — W4 tree-state was materialized at W2's previous deploy.)

---

## Step 2 — Push + SSH-trigger deploy

### 2.a — Push

```
$ git push origin master 2>&1 | tail -3
To github.com:mkbabb/fourier-analysis.git
   aed6c32..ce61e7c  master -> master
```

### 2.b–2.c — Deploy-hook execution

Full log: `/tmp/d-w3-w4-deploy.log` (247 lines). Key chain:

```
[deploy-hook 2026-05-28T00:32:00Z] fourier deploy-hook invoked (repo arg: mkbabb/fourier-analysis)
[deploy-hook 2026-05-28T00:32:00Z] rollback target = last-known-green aed6c32... (from /opt/deploy/fourier-last-green)
From github.com:mkbabb/fourier_analysis
   aed6c32..ce61e7c  master     -> origin/master
HEAD is now at ce61e7c feat(D.W3): backend NO-legacy + transpositions (γ) — rename + dead-stratum + typed ImageAsset
[deploy-hook 2026-05-28T00:32:00Z] advancing aed6c32... -> ce61e7c...
[deploy-hook 2026-05-28T00:32:00Z] building (build --parallel)…
```

Build phase (selected):
- Frontend: **all 13 layers CACHED** (#11–#22) — expected, no frontend changes between `aed6c32` and `ce61e7c`.
- Backend: deps re-resolved (`uv sync --frozen --no-dev --extra web`, 52 packages installed in 168ms); image rebuilt; new image sha `650e5e58…`.

Bring-up:

```
[deploy-hook 2026-05-28T00:32:42Z] bringing up (up -d)…
 Container fourier-analysis-frontend-1 Running
 Container fourier-analysis-mongo-1 Running
 Container fourier-analysis-backend-1 Recreate
 Container fourier-analysis-backend-1 Recreated
 Container fourier-analysis-nginx-1 Running
 Container fourier-analysis-mongo-1 Waiting
 Container fourier-analysis-mongo-1 Healthy
 Container fourier-analysis-backend-1 Starting
 Container fourier-analysis-backend-1 Started
```

Only backend recreated ✓ (frontend/mongo/nginx kept running; consistent with W3 = backend-only).

Health gate:

```
curl: (22) The requested URL returned error: 502   (×4 during backend boot)
[deploy-hook 2026-05-28T00:33:01Z] health gate GREEN on :8100 (attempt 5/30)
[deploy-hook 2026-05-28T00:33:01Z] DEPLOY OK aed6c32... -> ce61e7c... (recorded green)
```

Total wall time: ~60s (00:32:00 → 00:33:01). Health gate passed attempt 5/30; 502s during backend startup expected. Green marker advanced. Chain ran clean ✓.

---

## Step 3 — Run `migrate_flags_field.py` in cutover

### 3.a–3.b — Live migration

```
$ ssh ... "docker compose ... exec -T backend uv run --no-sync python -m api.scripts.migrate_flags_field"
migrate_flags_field [LIVE]
  flags_before              = 0
  renamed                   = 0
  skipped_already_migrated  = 0
  indexes_dropped           = 2
  indexes_created           = 2
```

Empty prod DB: zero docs renamed (expected). The **2/2 index transposition completed**: legacy `snapshot_hash_1_reporter_slug_1` + `snapshot_hash_1` dropped; new `content_hash_1_reporter_slug_1` (unique) + `content_hash_1` (plain) created. Exit 0; idempotent.

### 3.c — Post-migration probe

```
$ ssh ... "MONGO_PW=... mongosh ... --eval 'db.flags.countDocuments(...)' "
flags.snapshot_hash_legacy=0 flags.content_hash=0
```

Both zero ✓ (empty DB as predicted). Mutual-exclusion invariant trivially holds.

---

## Step 4 — Verify W3 + W4 live on host

| Check                  | Result                                          |
|------------------------|-------------------------------------------------|
| 4.a — `/api/health`    | `{"status":"ok"}` ✓                            |
| 4.b — host HEAD        | `ce61e7c81d0c53ce293e2d345f749c58b4a2450c` ✓   |
| 4.c — last-green       | `ce61e7c81d0c53ce293e2d345f749c58b4a2450c` ✓   |
| 4.d — bundle stamp     | `index-DOaNUTLH.js` (unchanged from pre-deploy — **expected**: W3 backend-only; W4 frontend was already in host tree-state at `aed6c32`) |
| 4.e — SPA index ref    | `src="/assets/index-DOaNUTLH.js"` ✓ (serves the live bundle) |
| containers             | 4/4 Up; backend `Up 29 seconds` (recreated); frontend `Up 11 minutes`; mongo `(healthy)`; nginx `Up 2 months` |

**Bundle stamp delta note:** there is no delta in the bundle hash, and this is the **correct** outcome. The charter's expectation (4.d) "bundle hash should be different from `index-BLE-VfHy.js`" reflected the assumption that this deploy would be the first to land W4. In practice W4 (`2e4a452`) is chronologically before the W2 close commit (`aed6c32`), so the W2 deploy already built the W4 frontend image — the host bundle was `index-DOaNUTLH.js` pre-deploy and remains `index-DOaNUTLH.js` post-deploy. W3 touches only `api/*` (verified: `api/dependencies.py`, `api/models/*`, `api/routers/*`, `api/scripts/migrate_flags_field.py`, `api/services/*`, `api/tests/*`); zero frontend files in the W3 diff.

W4 design refinement IS live on host (since `aed6c32`); W3 backend NO-legacy + flag-field rename IS live on host (as of this cutover at `ce61e7c`).

---

## Verdict

**DEPLOY GREEN.** Host advanced cleanly from `aed6c32` to `ce61e7c`. Backend recreated, migration ran (empty-DB no-op data + 2/2 index transposition), health gate passed, green marker recorded. W4 (live since W2) + W3 (live now) both confirmed on host.

**Follow-on:** None. The W8 CF token blocker is unrelated to this deploy and remains scoped to its own residual track.

---

## Artifacts

- Local logs:
  - `/tmp/d-w3-w4-deploy.log` (full deploy-hook transcript, 247 lines)
  - `/tmp/d-w3-migration.log` (migration output, 6 lines)
- Host:
  - HEAD: `ce61e7c81d0c53ce293e2d345f749c58b4a2450c`
  - last-green: `/opt/deploy/fourier-last-green` = `ce61e7c81d0c53ce293e2d345f749c58b4a2450c`
  - Backend image sha: `650e5e58d227cb325ac9ceeae89234d23ce0cb69219e0a9e4a15f179a5df6238`
  - Frontend image sha: `093ee4a879bf51b7db3e5909955a51b60a886d663cd76218bc76fb75e172b9f1` (rebuilt no-op via cache)
