# F research-first audit — Wα-R2 host-state capture

**Lane**: F.Wα-R2 of the F research-first workflow `w0ma5070c` (Wα 3 research lanes → Wχ 4 challenge probes → synthesis).
**Mode**: research-first; READ-ONLY (live probes + host SSH capture + source reads; no mutation). Tranche-development only.

---

The log has 2 lines, last write at 12:00:01 UTC (matching the `0 */6` schedule: fires at 00/06/12/18). Current time 17:20, so it has fired multiple times. Note the probe script mtime is 05:53 today (2026-05-29) — installed more recently than expected, but the cron has definitively fired (12:00 entry exists, matching the 6h schedule). Cron is running and firing.

## F.Wα-R2 — host-state capture verdict

### §1 — Dispatcher (`/opt/deploy/scripts/dispatch.sh`)
- **arm structure**: single-arg dispatcher (`REPO="$1"`), `case "$REPO"` with 5 per-repo arms + default fail:
  - `mkbabb/fourier-analysis` → invokes repo-local `bash /var/www/fourier-analysis/scripts/deploy-hook.sh` (the D.W1 hardened hook; already migrated off the generic `deploy()` fn).
  - `mkbabb/words` → `deploy "$HOME/floridify" 8110 /health`
  - `mkbabb/speedtest` → inline (not `deploy()`): `cd ~/speedtest`, git fetch/reset, `npm ci && npm run build`, compose build/up, gate `localhost:8140/api/`.
  - `mkbabb/value.js` → `deploy "$HOME/Programming/palette-api" 8130 /`
  - `mkbabb/csp-solver` → `deploy /var/www/csp-solver 8120 /`
- **latent-broken value.js arm confirmed**: **YES**. Offending line:
  `mkbabb/value.js) → deploy "$HOME/Programming/palette-api" "8130" "/"`
  The shared `deploy()` fn runs `git fetch origin && git reset --hard origin/master` inside `$HOME/Programming/palette-api`. Per the dispatcher-retire design this dir is an rsync-managed (non-git) tree, so the `git fetch` fails — the arm is latent-broken. It dies with the `rm` in γ.1.8.

### §2 — Webhook receiver (`/opt/deploy/hooks.json`)
- **current shape**: **single multiplex** `deploy` entry. One hook id `"deploy"`, `execute-command: /opt/deploy/scripts/dispatch.sh`, passes `repository.full_name` as the sole arg, HMAC-sha256 gated + `ref == refs/heads/master` trigger rule. No per-repo entries exist yet — γ.1.2 must author the 5.

### §3 — The 5 GitHub webhook URLs
- **gh auth status**: **INVALID** — `The token in default is invalid` for account `mkbabb`. Needs operator re-auth (`gh auth login -h github.com`).
- **per-repo URLs**: **NOT obtainable** this session. All 5 repos (fourier-analysis, words, speedtest, value.js, csp-solver) gated on gh re-auth. The snapshot of current URLs (presumed all → `deploy.babb.dev/hooks/deploy` per the multiplex design) cannot be pinned until the operator re-auths; `update-webhook-urls.sh` itself hard-fails at its line 46 gh-auth pre-flight.

### §4 — `:8140` speedtest vhost
- **enabled in sites-enabled**: **YES** — `speedtest.conf` present in `/etc/apache2/sites-enabled/`.
- **:8140 reference**: lines 20–21 of `sites-available/speedtest.conf`: `ProxyPass / http://127.0.0.1:8140/` + `ProxyPassReverse / http://127.0.0.1:8140/`.
- **live speedtest.babb.dev**: **404**. (Already 404 pre-teardown, per γ.3.4 expectation; teardown removes the dead routing rule, not live traffic.)

### §5 — T7 cron (FA3 trust-delta closure)
- **crontab entry present**: **YES** — `0 */6 * * * bash /home/mbabb/conformance-probe.sh >> /home/mbabb/conformance-probe.log 2>&1`.
- **conformance-probe.log tail**: 2 lines, both `T7 conformance probe: 12/12 PASS`. Log mtime `2026-05-29 12:00:01 UTC` aligns exactly with the `0 */6` schedule (00/06/12/18). Host now is 2026-05-29 17:20 UTC. **Note**: probe *script* mtime is `2026-05-29 05:53` — the install is ~11h old (more recent than the doc's "~24h since 2026-05-28" assumption), and the log has only 2 fires, not 4. Likely (re)installed this morning; both lines fired by cron (12:00 mtime, plus the 06:00 fire).
- **VERDICT**: cron **running** — fired ≥2x on schedule, last 12:00:01 UTC. γ.4 acceptance gate (≥1 fire) is **met**.

### §6 — Dangling images
- **count**: **0**; total size: 0. W11's `docker image prune -af` held; no regrowth. γ.5 needs no prune (capture-only).

### §7 — F.W3 readiness verdict
- **Ready NOW (no operator)**: γ.3 (speedtest teardown — vhost enabled, :8140 ProxyPass confirmed, live already 404); γ.4 (cron evidence — running, fired, gate met; capture-only); γ.5 (dangling=0; capture-only). The dispatcher *file* + hooks.json *backup/edit* portions of γ.1 (steps 1–3: backup, add 5 per-repo `hooks.json` entries, reload receiver) are host-only and ready.
- **Gated on operator (gh re-auth)**: γ.1 steps 4–7 (gh re-auth, dry-run, `--apply` URL flip, per-repo hook tests) and therefore the safe sequencing of γ.1.8 (`rm dispatch.sh`) + γ.2 (value.js arm dies with it). The webhook URL flip CANNOT proceed and the dispatcher must NOT be deleted until the 5 GitHub URLs are repointed (else webhooks 404). **This blocks the γ.1/γ.2 close.** Operator action required: `gh auth login -h github.com`.
- **Rollback reference**: this snapshot is the binding pre-flight. Pre-mutation state — dispatcher = 5-arm case file with latent-broken value.js arm; hooks.json = single multiplex `deploy` entry (HMAC secret `89eadc1d…a5c070`); speedtest.conf enabled w/ :8140 ProxyPass; cron present & firing; 0 dangling images. The γ.1.1 backups (`dispatch.sh.f-w3.bak`, `hooks.json.f-w3.bak`) reconstruct §1/§2 from here.
