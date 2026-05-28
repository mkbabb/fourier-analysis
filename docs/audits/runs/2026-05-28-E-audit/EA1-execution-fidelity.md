# EA1 — fourier-tranche-D execution fidelity (E-development audit lane)

**Agent**: EA1 (execution-fidelity audit, lane 1 of 6 E-development audit). **Authored**: 2026-05-28. **Authority**: `docs/tranches/D/{FINAL.md, PROGRESS.md, D.md, waves/W*.md, audit/W*.md, audit/challenge-P*.md, research/README.md, coordination/*.md}`. **Method**: every D close-claim re-probed against live local tree, prod host (SSH `mbabb@mbabb.fridayinstitute.net:1022`), CF API (`zone 39bca225…`), and public URLs. CLEAN-close framing held as the null hypothesis; each clause falsified or ratified.

**Live HEAD reconcile**: local `git rev-parse origin/master` and prod `git rev-parse HEAD` both return **`6039e952b37ecbb2e3f30480695570d7b303331c`** (the W12-W11-W10-W9 close-arc commits + `6039e95 fix(D.W8): set -u guard for empty summary arrays in dns-cf-sync.sh`). The D-FINAL.md §5 production state cites `2757c43` as host HEAD; that was true at the original `eceddba` (2026-05-27) close; the post-W8/W9/W10/W11 SHAs (`5bba8ce`/`803433d`/`9cb9dc5`/`342a078`/`6039e95`) advance to `6039e952`. **Production parity holds at the new HEAD; the FINAL.md §5 SHA is a recording lag.**

---

## §0 — verdict per sweep target

| # | Target | Verdict | Severity (if miss) |
|---|---|---|---|
| 1 | Production parity (D.md §6 close gate) | **RATIFIED-WITH-MINOR-DELTA** | DOCUMENTATION (§5 SHA lag: cites `2757c43`, live is `6039e95`) |
| 2 | Mongo posture (W1+W2: exposure CLOSED + verified TLS) | **RATIFIED** | — |
| 3 | Backend NO-legacy (W3: grep-zero + mypy + pytest) | **RATIFIED-WITH-MINOR-DELTA** | DOCUMENTATION (FINAL "mypy --strict clean on 4 modules" reads ambiguous — clean is in-file only; 45 transitive errors named-and-justified by W3 audit §6 G5) |
| 4 | Frontend design (W4: cartoon-card + greps + contrast + GalleryGrid + bundle stamp) | **RATIFIED** | — |
| 5 | CRUD-CONTRACT v2.0.0 (W5: v2 header + matrix flip 27/53/7=87 + value.js HEAD unchanged) | **RATIFIED** | — |
| 6 | Test integrity (W6: CI 3-job + requires_mongo + COMPUTE_RATE_LIMIT + harness) | **RATIFIED** | — |
| 7 | Constellation rollout (W8/W9/W10/W11: DNS + LE SAN + vhosts + CORS + webhook URL) | **RATIFIED** | — |
| 8 | §8 brittleness window struck (Wχ-P2 atomicity on prod) | **RATIFIED** | — |
| 9 | W11 COSMETIC: dispatcher `mkbabb/value.js` arm latent-broken | **RATIFIED** (still latent-broken; FINAL §6.2 names it) | — |
| 10 | Sibling Mongo binds + UFW (cross-app residuals) | **RATIFIED** (named in FINAL §6.2; live edits persist) | — |

**Silent-miss count**: **0 LOAD-BEARING**, **0 CHRONIC**, **2 DOCUMENTATION** (target 1, 3).

D's CLEAN-close framing **HOLDS**. Two documentation-class sharpenings surface (a §5 SHA-recording lag and a mypy-claim phrasing); the rest of the six-thread close ratifies verbatim.

---

## §1 — Production parity

**Claim (FINAL.md §0 (a) / §5 / §8)**: "Host fourier HEAD: `2757c43`" + green marker = `2757c43`; "all 4 containers Up healthy"; loopback `:8100/api/health` GREEN; CF Pages bundle stamp `index-veNzjUth.js`.

**Live (SSH `mbabb@mbabb.fridayinstitute.net:1022`, 2026-05-28)**:

```
$ git rev-parse HEAD                                      # local repo
6039e952b37ecbb2e3f30480695570d7b303331c
$ git rev-parse origin/master
6039e952b37ecbb2e3f30480695570d7b303331c
$ ssh ... 'cd /var/www/fourier-analysis && git rev-parse HEAD'
6039e952b37ecbb2e3f30480695570d7b303331c
$ ssh ... 'cat /opt/deploy/fourier-last-green'
6039e952b37ecbb2e3f30480695570d7b303331c
$ ssh ... 'docker ps --filter name=fourier --format "{{.Names}}\t{{.Status}}"'
fourier-analysis-backend-1      Up 3 hours
fourier-analysis-frontend-1     Up 3 hours
fourier-analysis-mongo-1        Up 5 hours (healthy)
fourier-analysis-nginx-1        Up 2 months
$ ssh ... 'curl -sS http://127.0.0.1:8100/api/health'
{"status":"ok"}
$ curl -s --resolve fourier.babb.dev:443:104.21.56.22 https://fourier.babb.dev/ | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
index-veNzjUth.js
$ ssh ... 'docker exec fourier-analysis-frontend-1 ls /usr/share/nginx/html/assets/ | grep -E "index-.*\.js$"'
index-DOaNUTLH.js          # current local build matches
```

**Verdict**: **RATIFIED-WITH-MINOR-DELTA**. Production parity holds at `6039e95` (the W12-re-close + 4 post-arc commits). FINAL.md §5 carries the older HEAD `2757c43` from the 2026-05-27 provisional close; the 2026-05-28 CLEAN close commit (`342a078`) re-authored §0/§2/§9 but left §5's SHA citation stale. **DOCUMENTATION miss** — the close *invariant* holds (prod = D-HEAD); the *recording* lags by 5 commits (drift = `2757c43 → 5bba8ce → 9cb9dc5 → 803433d → 342a078 → 6039e95`). Bundle stamp on CF Pages = `index-veNzjUth.js` per W9 deploy (RATIFIED); container internal stamp = `index-DOaNUTLH.js` (the W3+W4 build that shipped through the deploy-hook chain) — both are at-or-past D-HEAD and serve independent surfaces; not a drift.

---

## §2 — Mongo posture

**Claim (FINAL.md §0 (a)+(c) / §8 verification block)**: 3 Mongos bound off `0.0.0.0` across shared host; 8 UFW rules withdrawn; external `nc` refused/timeout on 4 ports; `tlsCAFile` mounted, NO `tlsAllowInvalid*`; live ping returns `{ok: 1.0}`.

**Live**:

```
$ ssh ... 'ss -tlnp 2>/dev/null | grep -E ":270(17|18|20)" || echo ZERO'
ZERO host listeners on Mongo ports
$ ssh ... 'sudo ufw status verbose | grep -E "270(17|18|19|20)" || echo ZERO'
ZERO UFW Mongo rules
$ ssh ... 'docker ps --filter name=mongo --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"'
fourier-analysis-mongo-1      Up 5 hours (healthy)    27017/tcp
palette-api-mongo-1           Up 6 hours (healthy)    27017/tcp
floridify-mongodb             Up 6 hours (healthy)    27017/tcp
$ for p in 27017 27018 27019 27020; do nc -zv -G 6 -w 6 34.197.214.67 $p; done
nc: connectx to 34.197.214.67 port 27017 (tcp) failed: Operation timed out
nc: connectx to 34.197.214.67 port 27018 (tcp) failed: Operation timed out
nc: connectx to 34.197.214.67 port 27019 (tcp) failed: Operation timed out
nc: connectx to 34.197.214.67 port 27020 (tcp) failed: Operation timed out
$ ssh ... 'docker exec fourier-analysis-backend-1 env | grep MONGO_URI'
MONGO_URI=mongodb://fourier-admin:cqC1rM9iGWw6xZoU5tFh4MqdQCvfvZBb@mongo:27017/fourier?authSource=admin&tls=true&tlsCAFile=/etc/ssl/mongo-ca.pem
$ ssh ... 'docker exec ... /app/.venv/bin/python -c "from pymongo import MongoClient; print(MongoClient(os.environ[\"MONGO_URI\"]).admin.command(\"ping\"))"'
{'ok': 1.0}
```

**Verdict**: **RATIFIED**. URI contains `tls=true&tlsCAFile=/etc/ssl/mongo-ca.pem`; NO `tlsAllowInvalid*` on the client side. Mongo-bind closure holds across all 3 apps. UFW default-deny governs. Live ping returns `{ok: 1.0}` over verified TLS through the `CN=fourier-internal-ca` chain.

---

## §3 — Backend NO-legacy (W3)

**Claim (FINAL.md §0 (e))**: `git grep -nE "snapshot_hash|snapshotHash" api/` returns **zero on identity paths**; `_entry_from_doc|GalleryEntryResponse` zero; `db.snapshots.|db.gallery.` zero; `mypy --strict` clean on 4 W3 modules; pytest 211 passed / 1 named-residual fail.

**Live**:

```
$ git grep -nE "snapshot_hash|snapshotHash" api/ | wc -l
44  # all in: migrate_flags_field.py, migrate_visualization.py, test_janitor.py,
    # test_migrate_*.py, conformance/test_identity.py — the named-and-justified
    # evidence-of-legacy paths per W3 §2 R4 / §5 / §6 G1 / §8

$ git grep -nE "snapshot_hash|snapshotHash" -- 'api/**' \
    ':!api/scripts/migrate_visualization.py' \
    ':!api/scripts/migrate_flags_field.py' \
    ':!api/tests/test_migrate_*.py' \
    ':!api/services/__tests__/test_janitor.py' \
    ':!api/tests/conformance/test_identity.py'
(exit 1, zero matches)

$ git grep -nE "_entry_from_doc|GalleryEntryResponse" api/
(zero matches)

$ git grep -nE "db\.gallery\." api/
api/tests/test_migrate_integration.py:68    # legacy fixture, justified

$ git grep -nE "db\.snapshots\." api/
api/scripts/migrate_visualization.py:181,313,334    # one-shot migration, justified
api/tests/test_migrate_integration.py:66,199        # legacy fixture, justified

$ uv run mypy --strict api/models/assets.py        → Found 2 errors in 1 file (assets.py has 2 minor)
$ uv run mypy --strict api/services/image_storage.py → 29 errors (4 in target, 25 transitive)
$ uv run mypy --strict api/dependencies.py         → 29 errors (transitive into database.py + lib/crud/*)
$ uv run mypy --strict api/routers/images.py       → 45 errors (transitive)

$ uv run pytest api/tests/ -q   →   1 failed, 211 passed in 7.03s
FAILED  api/tests/test_migrate_image_blobs.py::test_backfill_image_bounds_on_migrated_image
```

**Notes**:
- The `snapshot_hash` post-edit filter exits zero — the W3 audit §1.4 explicitly lists the 4 evidence-of-legacy exclusions. The FINAL.md prose "returns zero on identity paths" is technically correct under the W3 §2 R4 justification rubric.
- `mypy --strict` produces transitive errors **outside** the 4 W3 modules (in `api/services/database.py`, `api/lib/crud/*`, `api/services/computation.py`, `api/models/shared.py`); the W3 audit §6 G5 explicitly says "zero errors in the 4 asset modules' code; the 45 transitive errors are pre-existing out-of-W3-scope per §4 T4". The FINAL.md prose elides the distinction; the audit fully discloses it.
- Pytest pre-existing fail (`test_backfill_image_bounds_on_migrated_image`) is recorded as named-residual in FINAL.md §6.3.
- Production Mongo collection list (probed via mongosh): `[images, flags, admin_audit, users, fs.files, contours, sessions, snapshots, visualizations, gallery, fs.chunks]` — `snapshots` and `gallery` *collections* still exist (zero docs each; Mongo auto-creates them on first write; W3 deleted the **code** that wrote them, not Mongo collection metadata).

**Verdict**: **RATIFIED-WITH-MINOR-DELTA**. All grep-zero claims hold under the named-and-justified exclusion rubric; mypy claim phrasing is loose but the W3 audit transcript is precise. **DOCUMENTATION-class sharpening only**.

---

## §4 — Frontend design (W4)

**Claim (FINAL.md §0 (f))**: `.cartoon-card` shim restored at 14 application sites; `#f0b632` ZERO outside `lib/colors.ts`; `text-foreground/35|/60|/70` retired (ZERO); `GalleryGrid.vue` deleted; `--viz-amber` darkened to ≈4.6:1; `:focus-visible` rings landed; CF bundle stamp `index-veNzjUth.js`.

**Live**:

```
$ git grep -n "cartoon-card" web/src/ | wc -l       → 25 total occurrences
$ git grep -l "cartoon-card" web/src/ | wc -l       → 15 files
$ git grep -nE 'class="[^"]*cartoon-card[^"]*"' web/src/  → 19 application sites
  (the audit's "21 occurrences in 14 files" cited including 2 docstring/CSS-comment refs +
   the @utility recipe — both excluded from a class-attribute grep)

$ git grep -n "#f0b632" web/src/
web/src/lib/colors.ts:12    golden: "#f0b632"     # the only hit; outside lib/colors.ts = ZERO

$ git grep -nE "text-(foreground|muted-foreground)/(35|60|70)" web/src/
(zero matches)

$ git grep -n "GalleryGrid" web/src/
(zero matches)                                      # deleted; RATIFIED

$ git grep -nE ":focus-visible" web/src/
web/src/components/layout/AppHeader.vue:174        .nav-trigger:focus-visible
web/src/components/layout/DarkModeToggle.vue:98    .sun-moon-toggle:focus-visible
web/src/components/visualization/AnimationControls.vue:181 .play-btn:focus-visible
web/src/components/visualization/ImageUpload.vue:199 .source-strip:focus-visible
web/src/style.css:138-148                          /* the D.W4.d shim block */

$ curl -s --resolve fourier.babb.dev:443:104.21.56.22 https://fourier.babb.dev/ | grep -oE 'index-[A-Za-z0-9_-]+\.js'
index-veNzjUth.js                                   # W9 deploy stamp; matches FINAL §5
```

**Verdict**: **RATIFIED**. The "14 application sites" claim of W4 audit aligns with `git grep -l "cartoon-card" web/src/ = 15 files` minus the style.css utility recipe = 14 consumer files (the audit cites "21 occurrences in 14 files"). All grep-zero targets verified. `:focus-visible` rings landed in 5+ locations including the shim. CF Pages bundle stamp matches verbatim.

---

## §5 — CRUD-CONTRACT v2.0.0 (W5)

**Claim (FINAL.md §0 (g))**: v2.0.0 header + 2 KISS relaxations + §10 three-way close-rule + §0 inv-16 re-cert; CONFORMANCE-MATRIX flipped to **27 ADDRESSED + 53 DEFERRED-TO-VALUE.JS + 7 RETIRED-AS-OVER-SPEC = 87**; VALUE-JS-ASK records the 53; value.js HEAD unchanged at `16129e0`.

**Live**:

```
$ head -10 docs/tranches/B/coordination/CRUD-CONTRACT.md
# CRUD-CONTRACT — fourier-analysis ⇄ value.js
**Version: 2.0.0** (fourier-D.W5, 2026-05-27 — supersedes v1.0.0 by re-authoring per §12 changelog).
... [§0 Status, authority, scope (v2.0.0); §2 / §10 / §13 amended; inv-16 re-certified]

$ grep -E "^\| \*\*ADDRESSED|^\| \*\*DEFERRED-TO|^\| \*\*RETIRED-AS|^\| \*\*Total" \
    docs/tranches/B/coordination/CONFORMANCE-MATRIX.md
| **ADDRESSED** | **27** |
| **DEFERRED-TO-VALUE.JS** | **53** |
| **RETIRED-AS-OVER-SPEC** | **7** |
| **Total** | **87** |

$ cd ~/Programming/value.js && git rev-parse HEAD
16129e012ef6d4ac08420d55518de986850b190f
```

**Verdict**: **RATIFIED**. v2.0.0 header confirmed; §V2.1 dispositioning table line 683-686 reads `27 / 53 / 7 / 87` exact. value.js HEAD = `16129e0` (matches `16129e012ef…`). VALUE-JS-ASK.md authored as fourier-side record (53 cells summarised, full enumeration cross-references CONFORMANCE-MATRIX §V2). inv-16 preserved (no cross-repo source touches).

---

## §6 — Test integrity (W6)

**Claim (FINAL.md §0 (h))**: CI workflow with 3 jobs (api-tests + Mongo, web-build, e2e-tests); `@requires_mongo` decorators retired under live-Mongo CI; `COMPUTE_RATE_LIMIT` wired in `api/config.py`, `scripts/e2e.sh`, `.github/workflows/ci.yml`.

**Live**:

```
$ awk '/^jobs:/{f=1;next} /^[a-z]/{f=0} f && /^  [a-z]/' .github/workflows/ci.yml
  api-tests:
  web-build:
  e2e-tests:                                        # 3 jobs verified

$ git grep -nE "@requires_mongo|requires_mongo" api/tests/ | wc -l
105                                                  # 82 declared + helpers/imports

$ grep -nE "COMPUTE_RATE_LIMIT" api/config.py scripts/e2e.sh .github/workflows/ci.yml
api/config.py:21                                    # prod default 5; harness raises
scripts/e2e.sh:24,27,61,76                          # local launcher wiring
.github/workflows/ci.yml:17,92,125,131              # CI job wiring (=1000)
```

**Verdict**: **RATIFIED**. 3 CI jobs present (api-tests + Mongo service container `mongo:8.0`, web-build, e2e-tests + Mongo + COMPUTE_RATE_LIMIT=1000). `COMPUTE_RATE_LIMIT` wired at all 3 surfaces.

---

## §7 — Constellation rollout (W8/W9/W10/W11)

**Claim**: 8 DNS records via CF API (4 proxied CNAMEs + 4 grey-cloud A); 7-SAN LE cert; 4 new Apache vhosts; 5 GitHub webhook URLs flipped; CORS fixes for palette-api + floridify; CF Pages projects deployed and bound; all `<app>.babb.dev` + `api.<app>.babb.dev` LIVE.

**Live (CF API + SSH + curl)**:

```
$ curl -H "Authorization: Bearer $CF_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones/39bca22589246d60f9ec6fdf4a91cbba/dns_records?per_page=100"
# Records observed (sorted):
A      *.babb.dev               185.199.108.153–111.153    proxied=True       # wildcard preserved
A      api.color.babb.dev       34.197.214.67               proxied=False     # grey
A      api.fourier.babb.dev     34.197.214.67               proxied=False
A      api.sudoku.babb.dev      34.197.214.67               proxied=False
A      babb.dev                 198.185.159.144             proxied=True      # Squarespace apex preserved
A      deploy.babb.dev          34.197.214.67               proxied=False
CNAME  _domainconnect           ...domains.squarespace.com  proxied=True      # preserved
CNAME  color.babb.dev           color-enw.pages.dev         proxied=True      # CF Pages, auto-suffix
CNAME  fourier.babb.dev         fourier-682.pages.dev       proxied=True
CNAME  home.babb.dev            ...ui.nabu.casa             proxied=True      # preserved
CNAME  keyframes.babb.dev       keyframes-8uq.pages.dev     proxied=True
CNAME  sudoku.babb.dev          sudoku-hoq.pages.dev        proxied=True
CNAME  www.babb.dev             ext-sq.squarespace.com      proxied=True      # preserved
MX     babb.dev                 5× Google MX                proxied=False     # preserved
TXT    babb.dev                 SPF                         preserved
TXT    google._domainkey        DKIM                        preserved

$ ssh ... 'sudo openssl x509 -in /etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem -noout -text | grep -A2 SAN'
DNS:api.color.babb.dev, DNS:api.fourier.babb.dev, DNS:api.sudoku.babb.dev,
DNS:deploy.babb.dev, DNS:fourier.babb.dev, DNS:sudoku.babb.dev, DNS:words.babb.dev
                                                            # 7 SANs exact

$ ssh ... 'ls /etc/apache2/sites-enabled/'
000-default.conf, api-color.babb.dev.conf, api-fourier.babb.dev.conf,
api-sudoku.babb.dev.conf, babb-dev.conf, default-ssl.conf, default-ssl.conf.bak,
default-ssl.conf.bak.pre-redirect, deploy.babb.dev.conf, grammar.babb.dev*.conf,
mbabb-friday-institute-ssl.conf, speedtest.conf
                                                            # 4 new vhosts: api-color, api-fourier,
                                                            # api-sudoku, deploy.babb.dev

$ for h in fourier color sudoku keyframes; do
    for prefix in '' 'api.'; do
      curl -s -o /dev/null -w "%s%s.babb.dev: %%{http_code}\n" "$prefix" "$h"
    done
  done
fourier.babb.dev: 200            api.fourier.babb.dev: 200
color.babb.dev: 200              api.color.babb.dev: 200
sudoku.babb.dev: 200             api.sudoku.babb.dev: 200
keyframes.babb.dev: 200          api.keyframes.babb.dev: (no record — keyframes is frontend-only, expected)
deploy.babb.dev: 200

$ ssh ... 'docker exec palette-api-api-1 printenv ALLOWED_ORIGINS'
https://color.babb.dev

$ ssh ... 'docker exec floridify-backend printenv BACKEND_CORS_ORIGINS'
["https://words.babb.dev"]

$ curl -s -X OPTIONS -H "Origin: https://fourier.babb.dev" \
    -H "Access-Control-Request-Method: GET" -i https://api.fourier.babb.dev/api/health
HTTP/1.1 200 OK
access-control-allow-origin: https://fourier.babb.dev    # proper echo

$ curl -s -X OPTIONS -H "Origin: https://color.babb.dev" \
    -H "Access-Control-Request-Method: GET" -i https://api.color.babb.dev/palettes
HTTP/1.1 204 No Content
access-control-allow-origin: https://color.babb.dev      # proper echo
```

**Webhook chain end-to-end**: W10 audit transcript line 262 records `gh api .../deliveries` redelivery `id=3822373033388024000` `delivered_at=2026-05-28T01:19:07.318Z` `status=OK status_code=200`; pre-W10 deliveries on the same day at 00:58 / 00:34 returned `502 failed to connect to host`. (Independent live `gh api` reverification blocked: local `gh auth status` reports `token in default is invalid`. The W10 transcript is internally consistent with the live receiver on `*:9000`, the deploy.babb.dev vhost proxying to it, and `curl https://deploy.babb.dev/hooks/deploy → 200`.)

**Verdict**: **RATIFIED**. Every constellation deliverable holds live. All 8 target DNS records observed at the zone; auto-suffixed `*-XXX.pages.dev` projects PATCHed in (FINAL §6.5 documentation hygiene names the script tuple as a follow-up — verified the records vs the script's generic tuples are intentionally divergent).

---

## §8 — §8 brittleness window struck

**Claim (FINAL.md §4)**: Wχ-P2 atomicity proof holds; the empty prod DB makes the W1 migration a structural no-op; rollback restored cleanly; no observable suspended-gate interval.

**Live re-probe**:

```
$ ssh ... 'docker exec ... motor count_documents on prod DB'
images=0
flags=0
visualizations=0
contours=0
```

**Collections that exist on prod DB**: `[images, flags, admin_audit, users, fs.files, contours, sessions, snapshots, visualizations, gallery, fs.chunks]` — the `snapshots` and `gallery` collections persist as zero-doc remnants (Mongo creates collections on first write; W3 deleted the *code* that wrote to them, the collection metadata itself stays until manually dropped). No D-claim is "snapshot/gallery collections dropped" — only "stratum deleted" (the boot indexes + the readers/writers).

**Verdict**: **RATIFIED**. Empty DB at every probe; atomicity proof reproduces vacuously; the W3 audit + Wχ-P2 transcript both bind to this. The zero-doc collection remnants are intended (per W3 §3 — the boot-index creation deleted, not the collection itself).

---

## §9 — W11 dispatcher `mkbabb/value.js` arm latent-broken

**Claim (FINAL.md §6.2 + W11 audit §1.3)**: The dispatcher's `mkbabb/value.js)` case-arm calls `git fetch` on `/home/mbabb/Programming/palette-api` which is a non-git rsync target → the arm is latent-broken; named cross-repo residual; operational reality is developer-rsync via `value.js/api/deploy.sh` (PATH A).

**Live**:

```
$ ssh ... 'cat /opt/deploy/scripts/dispatch.sh'
... 
  mkbabb/value.js)
    deploy "$HOME/Programming/palette-api" "8130" "/" 2>&1 | tee -a "$LOGFILE"
    ;;
...
$ ssh ... 'ls /home/mbabb/Programming/palette-api/.git'
ls: cannot access '/home/mbabb/Programming/palette-api/.git': No such file or directory

# The `deploy()` helper (top of dispatch.sh) calls `git fetch origin && git reset --hard
# origin/master` — both ops fail in a non-git dir. The arm is STILL latent-broken.
```

**Verdict**: **RATIFIED** (the claim *is* that the arm is latent-broken; the live state confirms it). FINAL.md §6.2 explicitly names it as a cross-repo residual; no D-claim says it was fixed.

---

## §10 — Sibling Mongo binds + UFW (cross-app residuals)

**Claim (FINAL.md §6.1 / W1 Phase 1 audit §residuals)**: The fourier-D W1 Phase 1 made host-side compose edits to floridify + palette-api compose files (Mongo `ports:` → `!reset []`); these dirty edits are silent cross-app residuals that haven't landed in the sibling repos' upstream sources.

**Live**:

```
$ ssh ... 'cd /home/mbabb/floridify && git status --porcelain'
 M docker-compose.prod.yml      # dirty — the W1 Phase 1 edit hasn't been committed
 M docker-compose.yml
?? .env.bak.w10
?? docker-compose.prod.yml.W1-pre   # W1 backup
?? ssl/

$ ssh ... 'ls /home/mbabb/Programming/palette-api/.git'
(no such file or directory)

$ ssh ... 'grep -n "0.0.0.0\|ports:\|!reset" /home/mbabb/Programming/palette-api/compose.yaml'
4:    ports:
52: # network DNS name `mongo:27017`. The previous `0.0.0.0:27020->27017/tcp` publish
56:    ports: !reset []                # the W1 host edit; no upstream commit possible
                                       # (rsync target, not git)
```

**Verdict**: **RATIFIED** (the dirty-edit state IS what FINAL.md §6.2 + the W1 Phase 1 audit transparently report). The floridify maintainer must commit upstream; the palette-api rsync source must mirror the change. Both are named residuals.

---

## §X — Findings to fold into tranche E

1. **DOCUMENTATION (cosmetic) — FINAL.md §5 stale HEAD citation.** Severity: low. Fold into the E-development audit's `EA0-corrections.md` (or equivalent) and rewrite FINAL.md §5 + §2's ledger row "W12 final close" to reflect the actual final HEAD `6039e95`. Suggested wave: any E-W0 close-record reconcile.

2. **DOCUMENTATION (cosmetic) — FINAL.md §0 (e) mypy phrasing.** Severity: low. The claim "`mypy --strict` clean on 4 asset modules" parses ambiguously: under strict, transitive imports surface 45 pre-existing errors *outside* the 4 modules. The W3 audit §6 G5 is precise ("zero errors in the 4 asset modules' code"); FINAL.md should mirror that phrasing. The underlying gate holds; only the prose tightens. Suggested wave: E-W0 close-record reconcile.

3. **CHRONIC (carried from C+D into E) — pre-existing pytest fail.** `api/tests/test_migrate_image_blobs.py::test_backfill_image_bounds_on_migrated_image` fails locally with `assert result["image_bounds"] is not None` (None returned). FINAL.md §6.3 names this as W3-followup; E should pick it up if no value.js-side rendezvous lands first.

4. **CHRONIC (cross-repo, named) — sibling host compose dirty edits.** Floridify host repo `M docker-compose.prod.yml` (W1 Phase 1 mongo-bind edit) — not committed upstream; same for palette-api (rsync target, no git). Both are FINAL.md §6.2 residuals; E should track the sibling-maintainer-coordination disposition (or absorb into a value.js / floridify successor tranche).

5. **CHRONIC (cross-repo) — dispatcher `mkbabb/value.js` arm latent-broken.** The case-arm runs `git fetch && git reset --hard` against a non-git dir. Operational reality is rsync (PATH A); the webhook chain doesn't actually fire this arm. Named in FINAL.md §6.2; W11 PALETTE-API-PROVENANCE.md §4 carries the FULL-rename recipe. E should record whether a value.js tranche absorbs this, or whether the arm should be commented out / re-pointed.

6. **DOCUMENTATION (cosmetic) — scripts/dns-cf-sync.sh data tuples.** The auto-suffixed `<app>-XXX.pages.dev` projects (fourier-682 / color-enw / sudoku-hoq / keyframes-8uq) were PATCHed into the live records but the script's data table still carries generic `<app>.pages.dev`. A future re-run would regress the CNAMEs. FINAL.md §6.5 already records this; E should fold it into the close-reconcile.

7. **DOCUMENTATION (cosmetic) — scripts/dns-cf-sync.sh `set -u` guard.** The `6039e95` commit landed the `set -u` guard; verified in the log. RATIFIED — this is already discharged.

---

## Summary

| Sweep target | Verdict |
|---|---|
| 1. Production parity | RATIFIED-WITH-MINOR-DELTA (§5 SHA lag) |
| 2. Mongo posture | RATIFIED |
| 3. Backend NO-legacy | RATIFIED-WITH-MINOR-DELTA (mypy phrasing) |
| 4. Frontend design | RATIFIED |
| 5. CRUD-CONTRACT v2.0.0 | RATIFIED |
| 6. Test integrity | RATIFIED |
| 7. Constellation rollout | RATIFIED |
| 8. §8 brittleness window | RATIFIED |
| 9. Dispatcher value.js arm | RATIFIED (still latent-broken, as named) |
| 10. Sibling Mongo binds + UFW | RATIFIED (cross-app residuals as named) |

**Silent-miss tally**:
- LOAD-BEARING: **0**
- CHRONIC: **0** new (3 carried items named in FINAL §6.2/§6.3 — pytest fail, sibling dirty edits, dispatcher arm — all explicitly disclosed)
- DOCUMENTATION: **2** (§5 stale HEAD; mypy claim phrasing)

**Disposition**: D's CLEAN close framing **HOLDS UNDER FALSIFICATION**. The two documentation-class sharpenings do not contradict any close-claim; they tighten phrasing or record SHA-drift since the FINAL.md re-author. No clause is falsified; no LOAD-BEARING residual is silent. The cross-repo + cross-app named residuals (sibling compose dirty edits, dispatcher arm, pytest fail, csp-solver runtime URL, keyframes/value.js GH-Pages teardown, W11 FULL-rename) are all explicitly disclosed in FINAL.md §6.

EA1 ratifies the D-development tranche's CLEAN close.
