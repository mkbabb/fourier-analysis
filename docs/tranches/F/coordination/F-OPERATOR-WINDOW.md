# F — operator-window runbook (F.W3 binding)

**Status**: authored 2026-05-28. **Source**: FA4 §5 #2-#3 + FA3 §6 F-FA3-1/F-FA3-3 + FA5 F-T-S3 + E.W11 §2 named-residuals. **Authority**: this doc binds F.γ scope; γ executes in a single SSH session under inv-21.

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
