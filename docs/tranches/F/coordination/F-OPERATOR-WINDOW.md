# F — operator-window runbook (F.W3 binding)

**Status**: authored 2026-05-28; **HARDENED + SPLIT 2026-05-28 per F research workflow `w0ma5070c`** (Wα-R2 + Wχ-P1). **Source**: FA4 §5 #2-#3 + FA3 §6 + Wα-R2 host-state capture (`docs/audits/runs/2026-05-28-F-research/Walpha-R2-host-state-capture.md`). **Authority**: this doc binds F.γ scope.

## §0 — Wα-R2 + Wχ-P1 resolution: F.γ SPLITS into W3a + W3b

**[UPDATE 2026-05-28: gh auth NOW VALID — W3b UNBLOCKED.]** The Wα-R2 capture found the gh token INVALID, which forced the W3 split (Wχ-P1). The operator has since run `gh auth login`; **gh auth is now VALID** (account `mkbabb`, `repo` scope) and the `update-webhook-urls.sh` dry-run passes cleanly (pre-flight receipt at `receipts/F-W3-preflight.json`; 5 webhooks identified, IDs 603157401-405, all currently → the single multiplex `deploy.babb.dev/hooks/deploy`). The out-of-band operator block is RESOLVED.

The W3a/W3b split STILL holds — but now for the **hard-ordering** reason alone, not an operator-credential block:

- **W3a (host-ops, no GitHub API)**: backup + author 5 per-repo `hooks.json` entries + reload receiver (STAGED, NOT activated — dispatcher NOT deleted) + `:8140` speedtest teardown + cron/dangling evidence capture. Single-SSH receipt → inv-21 PASS.
- **W3b (GitHub API flip — now GREEN-pending-W3a)**: `update-webhook-urls.sh --apply` (5 URLs → per-repo) → per-repo hook tests → THEN `rm /opt/deploy/scripts/dispatch.sh` (+ value.js arm dies with it). Own single-window receipt → inv-21 PASS. **No longer operator-gated** — executable on F authorization once W3a stages the host-side per-repo entries.

**HARD ordering**: the dispatcher MUST NOT be deleted until the 5 URLs flip (else webhooks 404). W3a stages the host receiver entries (the `value.js` entry must match the `.js` slug — the script derives `repo_name="${repo##*/}"` → `value.js`); W3b flips the GitHub URLs + activates. Pre-flight rollback anchor: `receipts/F-W3-preflight.json` (current URLs + hook IDs + per-URL revert command).

**Confirmed host state (Wα-R2; the binding rollback anchor)**:
- Dispatcher `/opt/deploy/scripts/dispatch.sh` — single-arg `case "$REPO"` with 5 arms; the **latent-broken value.js arm** confirmed (`deploy "$HOME/Programming/palette-api" 8130 /` runs `git fetch` on a non-git rsync dir → fails).
- Webhook receiver `/opt/deploy/hooks.json` — **single multiplex `deploy` entry** (HMAC `89eadc1d…a5c070`, `ref==refs/heads/master`); the 5 per-repo entries do NOT exist yet (W3a authors them).
- `:8140` speedtest vhost — ENABLED in `sites-enabled/`; `ProxyPass / http://127.0.0.1:8140/` at lines 20-21; live `speedtest.babb.dev` already 404.
- T7 cron — RUNNING; `0 */6 * * * bash /home/mbabb/conformance-probe.sh`; fired 12:00:01 UTC, log shows 12/12 PASS. **γ.4 acceptance gate (≥1 fire) MET** — the FA3 trust-delta is CLOSED by this capture.
- Dangling images — **0** (W11 prune held; γ.5 is capture-only, no prune needed).

## §1 — The binding directive

Per F.md §3 row W3 + inv-21 (post-cohort-hygiene-bounded):

> "Single SSH session that discharges N1 (value.js dispatcher arm delete) + E1 (T-S3 host-flip via `update-webhook-urls.sh --apply`) + C8-host-subset (`:8140` speedtest vhost teardown + dangling-image discipline check) + the host-cron evidence capture (FA3 F-FA3-1 / F-FA3-3)."

inv-21 (post-cohort-hygiene-bounded) gate: if F-γ requires a second SSH window, split into F-γ.a / F-γ.b; do NOT silently widen the wave.

## §2 — The four sub-deliverables

### γ.1 — T-S3 host-flip dispatcher retire

**Pre-flight (Wα-R2 captured)**: state of `/opt/deploy/scripts/dispatch.sh` + `/opt/deploy/hooks.json` + 5 GitHub repo webhook URLs (snapshot pinned at Wα close).

**Apply sequence**:

1. SSH to host; backup: `cp /opt/deploy/scripts/dispatch.sh /opt/deploy/scripts/dispatch.sh.f-w3.bak`; `cp /opt/deploy/hooks.json /opt/deploy/hooks.json.f-w3.bak`.
2. Edit `/opt/deploy/hooks.json` to add 5 per-repo entries (each invoking that repo's own `scripts/deploy-hook.sh` with the right `working_dir`).
3. Reload webhook receiver (per the receiver's documented reload command).
4. From dev machine: `gh auth login -h github.com` to re-auth.
5. **Dry-run**: `bash scripts/update-webhook-urls.sh` (default DRY-RUN) — capture output to `docs/tranches/F/receipts/F-W3-webhook-dryrun.json`.
6. **Apply**: `bash scripts/update-webhook-urls.sh --apply` — capture output to `docs/tranches/F/receipts/F-W3-webhook-apply.json`.
7. **Verify**: for each of 5 sibling repos, `gh api -X POST repos/<owner>/<repo>/hooks/<id>/tests` — collect ping responses.
8. **Delete**: `rm /opt/deploy/scripts/dispatch.sh` (the latent-broken `mkbabb/value.js)` arm dies with the file).

**Acceptance gate (γ.1)**: `/opt/deploy/scripts/dispatch.sh` GONE; 5 GitHub repo webhook URLs at `deploy.babb.dev/hooks/<repo>`; `hooks.json` carries 5 per-repo entries; receipts captured.

### γ.2 — Value.js dispatcher arm delete (rides γ.1)

The latent-broken `mkbabb/value.js)` arm dies with the dispatcher delete in γ.1.7. No separate action; verified by γ.1's `rm` completing.

### γ.3 — `:8140` speedtest vhost teardown

1. `sudo cp /etc/apache2/sites-available/speedtest.conf /etc/apache2/sites-available/speedtest.conf.f-w3.bak`.
2. `sudo a2dissite speedtest.conf`.
3. `sudo systemctl reload apache2`.
4. Verify: `curl -sS -o /dev/null -w '%{http_code}' https://speedtest.babb.dev/` returns 404 from CF / no upstream (the vhost is no longer enabled; CF DNS still resolves but Apache returns the default 404).
5. Capture receipt to `docs/tranches/F/receipts/F-W3-speedtest-teardown.txt`.

**Acceptance gate (γ.3)**: `speedtest.conf` not in `sites-enabled`; live speedtest probe returns 404 (already returns 404 pre-teardown; the teardown removes the dead routing rule).

### γ.4 — Host-cron evidence capture (closes FA3 trust-delta)

1. `ssh ... 'crontab -l | grep conformance'` — capture to `docs/tranches/F/receipts/F-W3-crontab.txt`.
2. `ssh ... 'tail -n 50 /home/mbabb/conformance-probe.log'` — capture to `docs/tranches/F/receipts/F-W3-conformance-log.txt`.
3. Confirm log shows ≥1 cron-fired probe since W11 install (every 6h schedule means ~24h of receipts since 2026-05-28 install).

**Acceptance gate (γ.4)**: receipts present; cron has fired ≥1 time per the log.

### γ.5 — Dangling-image discipline check

1. `ssh ... 'docker image ls --filter dangling=true --format json | wc -l'`.
2. If > 0: `ssh ... 'docker image prune -af'` (W11 already ran this; F.γ confirms no regrowth).
3. Capture receipt to `docs/tranches/F/receipts/F-W3-docker-images.txt`.

**Acceptance gate (γ.5)**: image count captured; if non-zero, pruned with size reclaim recorded.

## §3 — Receipts directory shape

```
docs/tranches/F/receipts/
├── F-W3.json                       # umbrella manifest (per-sub-deliverable status + paths)
├── F-W3-webhook-dryrun.json
├── F-W3-webhook-apply.json
├── F-W3-webhook-tests.json         # gh api hook test responses
├── F-W3-speedtest-teardown.txt
├── F-W3-crontab.txt
├── F-W3-conformance-log.txt
└── F-W3-docker-images.txt
```

Per inv-21: receipt capture is mandatory for the operator-window close. The umbrella `F-W3.json` is the close-record reference; per-sub-deliverable artefacts persist for audit.

## §4 — Failure modes + rollback

| Failure | Detection | Rollback |
|---|---|---|
| Webhook URL PATCH fails for repo N | `gh api` non-zero exit at γ.1.6 | revert that repo via `gh api -X PATCH .../hooks/<id> -f config[url]=<original>` from the dryrun receipt |
| Dispatcher file delete fails after webhooks redirected | γ.1.8 step error | restore from `dispatch.sh.f-w3.bak`; webhook receiver still has multiplex `/hooks/deploy` arm (left intact until γ.1.7) |
| Apache reload fails after `a2dissite` | γ.3.3 step error | `a2ensite speedtest.conf && systemctl reload apache2` |
| Cron not firing per receipt | γ.4.3 receipt shows zero fires | re-install: `crontab -e` + add the line again; capture in receipt |

## §5 — What this doc IS and IS NOT

**IS**: the binding γ-thread runbook; per-sub-deliverable acceptance gates; receipts directory spec; rollback ledger.

**IS NOT**: a deploy chain re-architecture; the FULL palette-api → color rename (REJECTED-from-F per FA4 §4 + must-NOT); the floridify upstream commit (external repo; STAYS-OUT).

End.
