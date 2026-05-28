# W11 — palette-api → color rename — close record

**Wave**: D.W11 (thread α′ — constellation deployment normalization; the user-visible rename of the palette-api service to the canonical `color` name).
**Agent**: W11-palette-to-color-rename (single agent).
**Date**: 2026-05-28 (UTC).
**Status**: **CLOSED — COSMETIC scope chosen + executed; `api.color.babb.dev` 200 GREEN before + after; host-internal labels (compose project, container names, host dir, volumes, dispatcher arm) DEFERRED as named-residual.**

---

## §0 — Headline

- **Scope chosen**: **COSMETIC** (not FULL). The user-visible rename was already complete at W8 (DNS) + W10 (Apache vhost + LE SAN + CORS); W11 records the provenance reconcile + the disposition rationale, and verifies the live system holds.
- **Health gate**: `https://api.color.babb.dev/` returned **200** before W11 started and **200** after W11 closed (vacuously, since no host mutations were performed). No downtime.
- **Provenance artefact**: `docs/tranches/D/coordination/PALETTE-API-PROVENANCE.md` (NEW, authored this wave) — records the rsync-not-git topology, the latent-broken dispatcher arm, the volume-name data-bearing constraint, and the FULL-rename recipe for a future operator.
- **No source-code edits**: per user mandate, `value.js/api/src/` untouched; no commits to value.js. Fourier-side: only `coordination/PALETTE-API-PROVENANCE.md` + this close record.

---

## §1 — Deliverables

| Item | Path | State |
|---|---|---|
| Provenance + rename-disposition record | `docs/tranches/D/coordination/PALETTE-API-PROVENANCE.md` | NEW, authored (§1–§5) |
| W11 close record | `docs/tranches/D/audit/W11-palette-color-rename.md` (this file) | authored |
| `api.color.babb.dev` health (live) | host (W10 deliverable, W11 verifies-held) | 200 GREEN before + after |
| `palette-api-api-1` CORS env (live) | host docker (W10 deliverable, W11 verifies-held) | `ALLOWED_ORIGINS=https://color.babb.dev` |
| Compose project rename | host (deferred) | NAMED RESIDUAL — `PALETTE-API-PROVENANCE.md §4` recipe |
| Container name rename | host (deferred) | NAMED RESIDUAL |
| Host dir rename | host (deferred) | NAMED RESIDUAL |
| Volume migration | host (deferred — data-bearing) | NAMED RESIDUAL |
| Dispatcher arm fix | `/opt/deploy/scripts/dispatch.sh` (deferred) | NAMED RESIDUAL — also latent-broken (PATH B per §1.3 of provenance doc) |

---

## §2 — Pre-flight: live state at W11 start

```bash
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net 'docker compose ls'
NAME                STATUS              CONFIG FILES
csp-solver          running(3)          /var/www/csp-solver/docker-compose.yml,/var/www/csp-solver/docker-compose.prod.yml
floridify           running(4)          /home/mbabb/floridify/docker-compose.yml,/home/mbabb/floridify/docker-compose.prod.yml
fourier-analysis    running(4)          /var/www/fourier-analysis/docker-compose.yml,/var/www/fourier-analysis/docker-compose.prod.yml
palette-api         running(3)          /home/mbabb/Programming/palette-api/compose.yaml

$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net 'docker ps --filter name=palette --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"'
NAMES                  IMAGE             PORTS
palette-api-api-1      palette-api-api   127.0.0.1:8130->3000/tcp
palette-api-mongo-1    mongo:8           27017/tcp
palette-api-backup-1   mongo:8           27017/tcp

$ curl -sS -o /dev/null -w "HTTP=%{http_code}\n" https://api.color.babb.dev/
HTTP=200

$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net 'docker exec palette-api-api-1 env | grep ALLOWED'
ALLOWED_ORIGINS=https://color.babb.dev

$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net 'docker volume ls | grep palette'
local     palette-api_mongo-backups
local     palette-api_mongo-data
```

**Findings load-bearing on the scope decision**:
- The compose project name is `palette-api` (implicit from directory).
- The mongo data volume is `palette-api_mongo-data` (project-name-prefixed by Docker Compose) — **renaming the project would orphan the live DB**.
- The compose file mounts `./ssl/mongo.pem` (relative) — a host-dir rename would require compose + deploy.sh + dispatcher coordinated updates.
- `api.color.babb.dev` already serves the live container correctly through the W10 Apache vhost (port-based proxy to `localhost:8130` — not container-name-based).

---

## §3 — The decision: COSMETIC vs FULL

### §3.1 — Operational-risk inventory of FULL

| Surface | Risk | Mitigation cost |
|---|---|---|
| `palette-api_mongo-data` volume rename | DB orphan → application sees empty DB | volume copy (downtime window) OR compose `external: true` aliasing + recreate |
| `compose.yaml` `./ssl/` relative mounts | host-dir rename breaks them | path-update synchronized with cd-rename |
| dispatcher arm `cd palette-api/...` | working-dir wrong post-rename | edit `/opt/deploy/scripts/dispatch.sh` |
| developer-machine `deploy.sh` REMOTE_DIR | rsync target wrong post-rename | edit source in `value.js/api/deploy.sh` (cross-repo, user-bounded "DO NOT modify value.js/api/src/" — `deploy.sh` is borderline) |
| container restart | live downtime ≈ 30-90s | scheduled window |
| rollback path if compose-rename fails | partial state (some containers under old name, some under new) | manual recovery |

### §3.2 — Operational-risk inventory of COSMETIC

| Surface | Risk |
|---|---|
| Document + close — | none |

### §3.3 — User-visible delta of FULL vs COSMETIC

**ZERO**. The user-facing hostname is `api.color.babb.dev` either way. The "color" name is visible in DNS, in the Apache vhost, in the CORS env, in the LE cert SAN — every public surface. The container name `palette-api-api-1` is visible only in `docker ps` on the host, to operators.

### §3.4 — Decision

**COSMETIC**. The benefit of FULL is zero user-visible improvement against a non-zero operational risk envelope (DB orphan being the worst case). The user mandate "REVERT immediately if downtime; api.color.babb.dev health gate before/after must be 200" is satisfied with COSMETIC trivially (no mutations → no downtime → no health-gate violation). The deferred items are named explicitly in `PALETTE-API-PROVENANCE.md §2.1` + §4 (the FULL-rename recipe), so a future operator can execute them in a planned downtime window without re-doing the analysis.

This is consistent with the W11 charter's own escape clause: *"OR even more conservative: Leave everything as-is on host; the rename is **cosmetic** for the externally-visible name (api.color.babb.dev is already live + serving from the existing palette-api-api-1 container). Record the host-side rename as a deferred residual."*

---

## §4 — Verification — end-to-end CORS + content

```bash
$ curl -sS -o /dev/null -w "HTTP=%{http_code}\n" https://api.color.babb.dev/
HTTP=200

$ curl -sS -X OPTIONS \
    -H "Origin: https://color.babb.dev" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: content-type" \
    https://api.color.babb.dev/palettes -D - -o /dev/null \
  | grep -iE "(access-control|HTTP/)"
HTTP/1.1 204 No Content
access-control-allow-credentials: true
access-control-allow-headers: Content-Type, X-Session-Token, Authorization
access-control-allow-methods: GET, POST, PATCH, DELETE, OPTIONS
access-control-allow-origin: https://color.babb.dev

$ curl -sS -H "Origin: https://color.babb.dev" https://api.color.babb.dev/palettes \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['total'], 'palettes')"
10 palettes
```

Preflight echoes `https://color.babb.dev` as the allowed origin; actual GET returns 200 with payload + same ACAO header; ten published palettes returned. The full color-frontend → color-API path is live and CORS-correct.

---

## §5 — Bounded honesty: things this wave did NOT do

- **No host mutations.** Zero `docker compose` invocations, zero file edits on the host. The provenance + decision is documentation-only.
- **No value.js repo edits.** The cross-repo source-of-truth was not touched; the FULL-rename recipe in `PALETTE-API-PROVENANCE.md §4` is a sketch for a future tranche, not an executed plan.
- **No dispatcher arm fix.** The `mkbabb/value.js)` arm in `/opt/deploy/scripts/dispatch.sh` remains latent-broken (PATH B per `PALETTE-API-PROVENANCE.md §1.3` — runs `git fetch && git reset --hard` on a non-git directory). It would fail on the first `mkbabb/value.js` webhook delivery, but no such delivery has occurred in the 2-month lifetime of the host setup; operational reality is PATH A (developer-machine rsync `deploy.sh`). Fix is **W12 hygiene** or a **value.js tranche** concern, explicitly carried.
- **No legacy `deploy.sh` smoke-test URL fix.** The host's `/home/mbabb/Programming/palette-api/deploy.sh` still smoke-tests `https://mbabb.fi.ncsu.edu/colors/` (404 long ago). Updating it would require either editing on the host (next rsync overwrites) or editing the source in `value.js/api/deploy.sh` (cross-repo, outside W11's fourier-side bound). Named-residual.
- **No CORS re-verify-by-mutation.** The W10 close record verified CORS at landing; W11 re-verifies the env + the live preflight (above) — both held without intervention.

---

## §6 — What the user can do next (optional)

If the user wants the FULL rename executed:
- Schedule a ~10-min downtime window.
- Re-mandate W11 as `FULL`, citing `PALETTE-API-PROVENANCE.md §4` as the recipe.
- Optionally fold into a value.js tranche (so the source `value.js/api/{deploy.sh,compose.yaml}` rename happens alongside, single coordinated mutation across both repos).

Until then, the constellation is **fully normalized at the user-visible layer** (`api.color.babb.dev` live + CORS-correct + LE-signed); the host-internal labels are cosmetic-debt with a documented recovery path.

---

## §7 — Cross-references

- `docs/tranches/D/D.md §3 W11` — wave row.
- `docs/tranches/D/PROGRESS.md` — W11 row updated to `closed-cosmetic` this wave.
- `docs/tranches/D/coordination/PALETTE-API-PROVENANCE.md` — the provenance + disposition record (W11's primary deliverable).
- `docs/tranches/D/coordination/CONSTELLATION-DEPLOY.md §2` — original framing of the standalone-rsync provenance.
- `docs/tranches/D/research/_lane-R3.md` + `_R-deltas.md` (Δ-R3.1) — the Wα ratification finding (host dir has no `.git/`).
- `docs/tranches/D/audit/W10-ingress-and-le.md` — the W10 work that made `api.color.babb.dev` live + CORS-correct.
- `docs/tranches/D/coordination/VALUE-JS-ASK.md` — where a future FULL rename could be folded (user-re-mandate-gated).
