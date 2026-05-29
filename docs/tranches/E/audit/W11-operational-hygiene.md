# E.W11 — ε.2 Operational hygiene + cross-repo upstream + W11 FULL rename

**Wave**: E.W11 — ε.2 operational hygiene; cross-repo upstream commits; W11 FULL rename; T-S3 host-flip; C9 invariant numbering; T7 cron.
**Closed**: 2026-05-28 (with explicit named-residuals for operator-coord items).
**Status**: GREEN-with-named-residuals.
**Authority**: `E.md §3` row W11; `E.md §7` carry-forward items.

## §1 — LANDED at W11

### T7 conformance probe — cron-installed on host

- Probe script `/home/mbabb/conformance-probe.sh` (scp'd from local `scripts/conformance-probe.sh`).
- Crontab entry: `0 */6 * * * bash /home/mbabb/conformance-probe.sh >> /home/mbabb/conformance-probe.log 2>&1` (every 6 hours).
- First live run at install: **12/12 PASS** (T7 surfaces in `audit/W10-test-integrity.md §2`).
- The cron alerts via non-zero exit if any of the 12 assertions fail (slug/visibility/tier/deletedAt presence; ETag; RateLimit-*; problem+json + URN; cross-repo CORS; both APIs alive).

### Dangling Docker images pruned

```sh
ssh mbabb@host "docker image prune -af"
# Reclaimed: 1.208 GB
```

The accumulated rebuild cache from the W2 / W3 / W4 / W7 / W8 deploys (each `docker compose up -d --build` left a dangling layer) is gone. Host disk-pressure relief.

## §2 — DEFERRED with explicit owners (named-residuals)

### T-S3 host-flip — dispatcher retire

- Script lands at W8 (`scripts/update-webhook-urls.sh`); host execution requires:
  1. SSH to host; backup `/opt/deploy/scripts/dispatch.sh` + `/opt/deploy/hooks.json`.
  2. Edit `/opt/deploy/hooks.json` to add 5 per-repo entries.
  3. Restart webhook receiver.
  4. From dev machine: `gh auth login -h github.com` to re-auth.
  5. `bash scripts/update-webhook-urls.sh --apply`.
  6. Smoke-test each repo's deploy.
  7. Remove `/opt/deploy/scripts/dispatch.sh`.
- **Owner**: operator (the user; gh auth + scheduled deploy window).
- **Disposition**: deferred to a coordinated operational window; script + runbook are LIVE in this fourier-E commit.

### W11 FULL palette-api → color rename

- Per `PALETTE-API-PROVENANCE.md §4`: rename host dir `/home/mbabb/Programming/palette-api/` → `color/`; rename compose project + containers + volume + Apache vhost name.
- **Risk**: data-bearing volume orphan if not done atomically; the current `palette-api-*` containers serve `api.color.babb.dev` correctly via Apache vhost.
- **Owner**: operator (scheduled-downtime window).
- **Disposition**: cosmetic-only carried; cluster is FULLY GREEN at the URL layer (`api.color.babb.dev/palettes` → 200). The host-dir name is internal-only.

### Cross-repo upstream commits — floridify + palette compose

- **floridify** (Mongo bind dirty edit per D.W11): floridify repo is NOT in `/Users/mkbabb/Programming/`; not on the production host. The dirty-edit reference may have been stale at D close.
- **palette-api** compose ports edit: already addressed in value.js-I.W0 (deploy.sh hostname fix + .env.example multi-origin shape; commit at value.js `f3a67a9`).
- **Owner**: floridify residual is an external repo ask (no local clone; tracked here for transparency).
- **Disposition**: palette-api LANDED at value.js commit `f3a67a9`; floridify recorded as cross-repo ask.

### Dead `:8140` speedtest vhost

- Apache vhost `/etc/apache2/sites-enabled/speedtest.conf` proxies to `127.0.0.1:8140`; no service listening (connection refused); live `https://speedtest.babb.dev/` returns 404.
- **Owner**: operator (host-side `a2dissite speedtest.conf` + reload Apache).
- **Disposition**: low-risk hygiene; defer to operator coord (low impact — already 404).

### C9 invariant numbering reconciliation

- The C-era 18/19/20 inconsistency persists in A/B/C/D charters. E.md §2 binds by name not number ("Cross-repo source boundary"; "Auto-migration discipline" — neither carries a number).
- **Owner**: documentation-only fourier-F polish or a value.js-or-fourier-J tail.
- **Disposition**: zero behavioral impact; deferred-documentation.

## §3 — Cohort coordination — value.js-I.W5 close substrate

For the cohort closure at E.W12:
- value.js-I work landed at value.js commits `f3a67a9` (I.W0+W1), `d22a9d1` (I.W2), `23a7b27` (I.W3+W4), `13281fc` (β.2 demo hardening). The conformance evidence is the T7 12/12 PASS.
- **I.W5 close**: the value.js maintainer (the same user) authors `value.js/docs/tranches/I/FINAL.md` at the E.W12 close ceremony OR records a named successor (`value.js-J` for any tail items).
- The per-call-site adoption of `ifMatch` / `idempotencyKey` on the demo (B8/B9 plumbed-not-wired-per-site) folds to I.W5 close as deferred or to a follow-up I-tail wave.

## §4 — Cross-repo source boundary upheld

This wave writes only `fourier-analysis/` paths (docs/tranches/E/audit/W11-operational-hygiene.md NEW; docs/tranches/E/PROGRESS.md edit). Host-side actions are documented but the writes-of-record stay in fourier. Zero `value.js/` paths.

## §5 — W11 close gate

W11 closes when (a) T7 cron is on the host; (b) dangling images pruned; (c) named-residuals carry explicit owners + dispositions; (d) cross-repo boundary upheld. All four met. **W11 is GREEN-with-named-residuals.** W12 (close + cohort close) opens.

## §6 — What this wave IS and IS NOT

**IS**: live T7 monitoring; host disk hygiene; explicit ownership for every named-residual; transparent record of operator-coord items.

**IS NOT**: a host-side rewrite of the dispatcher; a scheduled-downtime rename; a deep audit of every Apache vhost. These are operator-coord and bounded; deferred-with-owner is the honest disposition.

## §7 — Outcome verdict at close

| Surface | State |
|---|---|
| T7 cron monitoring | LIVE on host every 6h |
| Host disk | -1.2 GB dangling images |
| Dispatcher retire | script + runbook LIVE; host-flip operator-coord |
| FULL rename | deferred (operator window) |
| floridify upstream | named-residual; cross-repo ask |
| palette-api compose upstream | LANDED at value.js f3a67a9 |
| :8140 speedtest vhost | named-residual (low-impact; 404 already) |
| C9 numbering | doc-tail (zero behavioral impact) |
