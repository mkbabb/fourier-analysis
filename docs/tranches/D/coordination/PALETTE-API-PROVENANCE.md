# palette-api — provenance + rename disposition

**Status**: AUTHORED · 2026-05-28 (W11). **Authority**: D.W11 close (`audit/W11-palette-color-rename.md`); Wα-R3 ratification (`research/_lane-R3.md`) + Δ-R3.1 (`research/_R-deltas.md`); `CONSTELLATION-DEPLOY.md §2` row 2.

This document records the **provenance** of the live `palette-api` container on the constellation host and **the rename disposition** (cosmetic vs full), so a future operator can re-construct the deploy topology without archaeology.

---

## §1 — Provenance (what is the source-of-truth for the live `palette-api`?)

The live `palette-api` service on the constellation host (`mbabb@mbabb.fridayinstitute.net:1022`, public `34.197.214.67`) is a **standalone rsync target**, **not a git checkout**, and **not the `value.js/api/` subtree directly**.

### §1.1 — The host directory

```
/home/mbabb/Programming/palette-api/
├── compose.yaml             # the live compose file (project name implicit = "palette-api")
├── .env                     # MONGODB_URI, ADMIN_TOKEN, ALLOWED_ORIGINS (W10 set)
├── deploy.sh                # rsync-from-developer-machine bootstrap (legacy)
├── ssl/                     # mongo.pem, mongo-ca.pem (TLS material)
├── src/                     # the Hono application code (TypeScript)
├── package.json, Dockerfile
└── (NO .git/)
```

**Verified at Wα-R3 (`research/_lane-R3.md` + Δ-R3.1, 2026-05-27)**:

```bash
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net 'ls /home/mbabb/Programming/palette-api/.git/config'
ls: cannot access '/home/mbabb/Programming/palette-api/.git/config': No such file or directory
```

### §1.2 — The upstream source

The corresponding source-of-truth lives at **`value.js/api/`** in the value.js monorepo (`/Users/mkbabb/Programming/value.js/api/` on developer machine). The two trees are **logically equivalent** (same `compose.yaml` shape, same `Dockerfile`, same `src/`, same `package.json`), with the host carrying ephemeral artefacts (`.env`, `ssl/`, `mongo-init/`) that source omits.

### §1.3 — The deploy mechanism (actual)

Two paths exist; only one operates in practice:

- **PATH A (operational, what actually runs deploys)** — the developer-machine `value.js/api/deploy.sh` rsyncs `value.js/api/` → `mbabb@host:/home/mbabb/Programming/palette-api/` (excludes `node_modules`, `dist`, `.env`, `.env.local`, `test-results`), then SSHes in and runs `docker compose up -d --build`. The legacy host-side `/home/mbabb/Programming/palette-api/deploy.sh` is the same script (rsynced from source); it is **never run from the host** (its self-rsync would be a no-op).

- **PATH B (latent, would fail)** — `/opt/deploy/scripts/dispatch.sh`'s `mkbabb/value.js)` arm calls `deploy "$HOME/Programming/palette-api" "8130" "/"`, which begins with `git fetch origin && git reset --hard origin/master`. **This would fail immediately** on the host directory (no `.git/`). Dispatched only on `mkbabb/value.js` webhook deliveries; the GitHub webhook URL was flipped to `https://deploy.babb.dev/hooks/deploy` at W10, but no value.js push has yet exercised the latent failure. **The dispatcher arm is a known-broken stub** — recorded as **W12-residual** (or a value.js-tranche concern); operational reality is PATH A.

### §1.4 — Why this matters

The Wα-R3 + Δ-R3.1 reconcile sharpened the dev-era audit's framing: the host is **NOT** a checkout of value.js (it can't `git pull`), the host is **NOT** the `value.js/api/` directory on the host (the value.js monorepo is not checked out at `/home/mbabb/Programming/value.js`), and the host is **NOT** a peer clone of a `palette-api`-named GitHub repo (no such repo). The host is a **rsync mirror** of `value.js/api/`, deployed exclusively via developer-machine push. This shape is unusual on the constellation (every other app is a true git checkout managed by the deploy webhook); it is the load-bearing reason the W11 rename is bounded the way it is (see §2).

---

## §2 — Rename disposition (W11 — chosen: COSMETIC scope)

W11's charter (`D.md §3` row W11 + the W11 agent prompt) allowed two paths: **FULL** (rename host dir + compose project + containers + dispatcher arm + deploy.sh) or **COSMETIC** (rename only the externally-visible name, defer host-internal labels).

### §2.1 — Chosen: COSMETIC

The user-visible rename is **already complete** as of W10:

| Surface | Before D | After W10 | After W11 |
|---|---|---|---|
| Frontend hostname | `color.babb.dev` (GH Pages → value.js/web) | `color.babb.dev` (CF Pages CNAME — W8/W9) | unchanged — already `color` |
| Backend hostname | (none publicly — `:8130` was loopback-only) | `api.color.babb.dev` (Apache vhost + LE SAN) | unchanged — already `color` |
| CORS allow-list | empty | `https://color.babb.dev` | unchanged |
| Compose project name | `palette-api` | `palette-api` | **DEFERRED (cosmetic)** |
| Container names | `palette-api-api-1`, `-mongo-1`, `-backup-1` | unchanged | **DEFERRED (cosmetic)** |
| Host directory | `/home/mbabb/Programming/palette-api/` | unchanged | **DEFERRED (cosmetic)** |
| Volumes | `palette-api_mongo-data`, `palette-api_mongo-backups` | unchanged | **DEFERRED — DATA-BEARING** |
| Dispatcher arm | `mkbabb/value.js) → cd palette-api/...` | unchanged (W10 didn't touch) | **DEFERRED (latent-broken, see §1.3 PATH B)** |
| Host-side `deploy.sh` smoke-test URL | `https://mbabb.fi.ncsu.edu/colors/` | unchanged (legacy URL — already broken) | **DEFERRED (rsync-driven, source lives in value.js)** |

### §2.2 — Why not FULL

1. **Volumes are project-name-prefixed.** `docker compose` names volumes `<project>_<volume>`. Renaming the compose project (via `COMPOSE_PROJECT_NAME=color` or `name: color` in `compose.yaml`) and running `docker compose up -d` would cause Compose to **create new empty volumes** `color_mongo-data` and `color_mongo-backups`, leaving the existing `palette-api_mongo-*` volumes **unmounted but un-deleted on disk**. The live palette database would appear empty to the application. Recovering would require either `external: true` aliasing in compose + `docker volume create color_mongo-data --opt ... `, or a stop-rename-on-disk-restart cycle — both carry meaningful downtime + recovery risk against zero user-visible benefit (the public name is already `color`).

2. **Compose mounts are directory-relative.** `compose.yaml` references `./ssl/mongo.pem` and `./scripts/backup.sh`. Renaming the host directory would require also updating the developer-machine `deploy.sh` REMOTE_DIR (which lives in value.js source) and the latent dispatcher arm. Cross-repo churn for cosmetic gain.

3. **The dispatcher arm is already broken for this app.** PATH B (`git reset --hard`) would fail; PATH A (developer rsync) is the operational reality. The arm has been latent for the entire 2-month lifetime of the host setup. Fixing it is a value.js-tranche concern (or W12 hygiene); not load-bearing on W11.

4. **The user explicitly bounded this**: "DO NOT modify the value.js source repo's `api/src/`" + "If the rename causes downtime, REVERT immediately and document" + "api.color.babb.dev health gate before/after must be 200." The full rename's risk envelope exceeds the gain.

### §2.3 — What "COSMETIC" actually closes

- **Closed at W8** (DNS): `color.babb.dev` resolves to CF Pages frontend; `api.color.babb.dev` grey-cloud A → origin.
- **Closed at W10** (ingress + TLS + CORS): Apache vhost `api.color.babb.dev → localhost:8130`; LE SAN expanded to cover `api.color.babb.dev`; CORS allow-list set to `https://color.babb.dev`.
- **Closed at W11** (this doc + provenance reconcile): the deploy topology is recorded; the rename's bounded-scope is justified; the residuals are explicitly named so a future operator can finish the FULL rename in a planned downtime window or fold it into a value.js tranche.

---

## §3 — Verification (W11 close gate)

End-to-end live `api.color.babb.dev` exercise, 2026-05-28 (UTC):

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

`api.color.babb.dev` is **200 GREEN** with correct CORS allow-list echo for `https://color.babb.dev` origin. The user-visible W11 deliverable is complete; the host-internal cosmetic-rename is named-residual.

---

## §4 — Forward path (deferred residuals, named)

If a future operator chooses to execute the FULL rename (e.g., a value.js tranche, or scheduled-downtime hygiene), the recipe is:

1. **Schedule downtime window** (~5-10 min for the volume migration).
2. **Stop the stack**: `cd /home/mbabb/Programming/palette-api && docker compose down` (no `-v` — preserve volumes).
3. **Rename volumes** (one of two paths):
   - **(a) Compose `external: true` alias**: declare `volumes: { mongo-data: { external: true, name: palette-api_mongo-data }, ... }` in the new compose.yaml — keeps the on-disk volume names, only changes the compose project name + container names.
   - **(b) On-disk volume copy**: `docker volume create color_mongo-data; docker run --rm -v palette-api_mongo-data:/from -v color_mongo-data:/to alpine sh -c 'cp -av /from/. /to/'` (repeat for `-backups`); then drop the old volumes after verification.
4. **Rename host directory**: `mv /home/mbabb/Programming/palette-api /home/mbabb/Programming/color`.
5. **Update `compose.yaml`** to add `name: color` (or set `COMPOSE_PROJECT_NAME=color` in `.env`).
6. **Update dispatcher arm** in `/opt/deploy/scripts/dispatch.sh`: `mkbabb/value.js) deploy "$HOME/Programming/color" "8130" "/"` (and consider the `git fetch` → rsync-shim issue per §1.3 PATH B).
7. **Update developer-machine source `value.js/api/deploy.sh`** `REMOTE_DIR=/home/mbabb/Programming/color` (cross-repo coordination — value.js tranche).
8. **Start**: `cd /home/mbabb/Programming/color && docker compose up -d --build`. Containers will be `color-api-1`, `color-mongo-1`, `color-backup-1`.
9. **Verify**: `curl https://api.color.babb.dev/` returns 200 + 10 palettes; the new container names are picked up by Apache (port-based, not name-based — no vhost edit needed).
10. **CORS env** survives (driven by `.env` `ALLOWED_ORIGINS=https://color.babb.dev`, project-name-independent).

**Estimated risk**: medium (volume migration is the long tail); blast radius bounded to the palette-api stack alone (sibling apps unaffected).

---

## §5 — Cross-references

- `docs/tranches/D/D.md §3 W11` — wave row authoring the rename + provenance reconcile gate.
- `docs/tranches/D/research/_lane-R3.md` + `research/_R-deltas.md` (Δ-R3.1) — the Wα provenance ratification.
- `docs/tranches/D/audit/W10-ingress-and-le.md` — the W10 ingress + LE + CORS work that landed `api.color.babb.dev` live.
- `docs/tranches/D/audit/W11-palette-color-rename.md` — the W11 close record (this disposition's authority).
- `docs/tranches/D/coordination/CONSTELLATION-DEPLOY.md §2` — the original "standalone rsync, not value.js/api/" framing.
- `docs/tranches/D/coordination/VALUE-JS-ASK.md` — the cross-repo cohesion ask (FULL rename can fold there if user re-mandates a value.js tranche).
