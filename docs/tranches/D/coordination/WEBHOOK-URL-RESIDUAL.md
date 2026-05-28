# WEBHOOK-URL-RESIDUAL — D.W1 Phase 2 continuation handoff to W3 / W8 / W9 / W10

**Authored**: 2026-05-27 (D.W1.Phase2-continuation agent). **Scope**: three out-of-wave blockers discovered while attempting to land D-W1 on prod through the wired deploy chain. **Status**: documentation-only — none of the three is in W1's authored scope; each is referred to a named forward wave.

The W1 plan authored a host-side deploy-chain (deploy-hook script, dispatcher patch, hook perms tighten, `image_blobs` volume, host `.env` reconcile). That host-side wiring is GREEN and verified end-to-end (see `docs/tranches/D/audit/W1-phase2-deploy.md` §3.1-§3.4 + the continuation appendix). The three blockers below sit OUTSIDE that wiring — they prevent observable end-to-end Production Parity ("prod at D-HEAD via verifiable chain transcript") but do not invalidate the wiring itself.

## Blocker 1 — Public webhook URL not resolvable (constellation-wide)

### Finding

GitHub's webhook delivery infrastructure cannot resolve `mbabb.friday.institute`:

```
$ dig +short mbabb.friday.institute              # local resolver (host LAN)
10.0.2.253
$ dig @8.8.8.8 +short mbabb.friday.institute     # public resolver — NXDOMAIN
(empty)
$ dig @1.1.1.1 +short mbabb.friday.institute     # public resolver — NXDOMAIN
(empty)
```

The hostname resolves to RFC1918 `10.0.2.253` from inside the host LAN but does NOT resolve from any public resolver. GitHub's webhook delivery from `577f037 push` at 2026-05-27T23:31:24Z failed with HTTP 502 / "failed to connect to host." Apache vhost reverse-proxy + adnanh/webhook receiver + dispatcher patch are all verified-reachable when DNS is bridged (`curl --resolve mbabb.friday.institute:443:34.197.214.67 https://mbabb.friday.institute/deploy/hooks/deploy` returns 200, and POSTing the right HMAC fires the dispatcher).

The last successful webhook-delivered deploy on the host predates 2026-04-03 (~2 months ago) — the DNS gap predates Tranche D entirely.

### Constellation impact

All five sibling repos on this host carry the same webhook URL — `https://mbabb.friday.institute/deploy/hooks/deploy` — and all five suffer the same delivery failure:

| Repo | Webhook URL | `last_response` |
| --- | --- | --- |
| `mkbabb/fourier-analysis` | `https://mbabb.friday.institute/deploy/hooks/deploy` | 502 connection_error |
| `mkbabb/speedtest` | (same) | None (unused since the gap) |
| `mkbabb/words` | (same) | None (unused since the gap) |
| `mkbabb/value.js` | (same) | 502 connection_error |
| `mkbabb/csp-solver` | (same) | None (unused since the gap) |
| `mkbabb/floridify` | (no hook configured) | n/a |

The fix is constellation-wide.

### Interim path (works today, manual)

SSH-trigger the deploy-hook directly with `mbabb` authority — the same authority the webhook receiver invokes the script with:

```
$ ssh -p 1022 mbabb@mbabb.fridayinstitute.net \
    "cd /var/www/fourier-analysis && bash scripts/deploy-hook.sh mkbabb/fourier-analysis 2>&1 \
     | tee /opt/deploy/logs/mkbabb-fourier-analysis-manual-$(date +%Y%m%d-%H%M%S).log"
```

The interim path was attempted in the continuation run; it reached the build stage cleanly (deploy-hook flock → dirty-tree guard → rollback-target record → `git fetch` + `reset --hard`). It then exited on Blocker 2 (below) — a build-system regression unrelated to the trigger path.

### Forward wave deliverable — W8 (`DNS-as-code`) + W10 (`backend ingress + origin LE for api.<app>`)

The cleanest path per `D.md` is W8's `deploy.babb.dev` grey-cloud A record (or a per-app `deploy-fourier.babb.dev`):

1. **W8** — provision `deploy.babb.dev` A → `34.197.214.67` (the host's public IP, confirmed via `ssh ... "curl https://api.ipify.org"`). Cloudflare grey-cloud (DNS-only, no proxy) so GitHub's webhook IPs reach origin directly.
2. **W10** — Apache vhost on the host: `ServerName deploy.babb.dev`, reverse-proxy `/hooks/<name>` → `127.0.0.1:9000`. Certbot `--expand --apache` (Path B HTTP-01 — the same path Tranche D's TLS plan blesses).
3. **One-time URL re-point across all 5 repos** — `gh api -X PATCH repos/<owner>/<repo>/hooks/<id> -f config[url]=https://deploy.babb.dev/hooks/deploy` for each.

The `mbabb.friday.institute` hostname can remain internal-only for VPN-bridged tooling; the deploy path moves to a publicly-resolvable hostname.

---

## Blocker 2 — Frontend Docker build broken by Tranche A `file:` sibling-repo paths

### Finding

The `web/package.json` at D-W1 head (`577f037`) — which is the same as Tranche A/B head — references three sibling repos via `file:` paths:

```
"@mkbabb/glass-ui":    "file:../../glass-ui",
"@mkbabb/keyframes.js": "file:../../keyframes.js",
"@mkbabb/value.js":     "file:../../value.js",
```

The Dockerfile build context is the fourier repo root (`.` per `docker-compose.yml: frontend.build.context`). The `../../` paths resolve OUTSIDE the build context to dev-machine-only locations (`/Users/mkbabb/Programming/{glass-ui,keyframes.js,value.js}` on the dev machine; ABSENT on the host). Inside the container, `npm ci` fails with:

```
npm error code EUSAGE
npm error The `npm ci` command can only install with an existing package-lock.json or
npm error npm-shrinkwrap.json with lockfileVersion >= 1. …
```

(The error message is misleading — the lockfile IS present and IS `lockfileVersion: 3`; the underlying failure is `file:` path resolution into the missing sibling-repo trees.)

### Regression provenance

```
$ git log --oneline -- web/package.json | head -3
ca58321 feat(B.W2): UX coherence — Configurator adoption + Dialog a11y + render-path budget
a7d1904 fix(A.W2): adopt cross-repo dev-resolution contract-v2 — runtime  imports of value.js parseCSSStylesheet now resolve
...
$ git show 8818ae5:web/package.json | grep -E "(keyframes|value|glass)"
        "@mkbabb/keyframes.js": "latest",
        "@mkbabb/value.js": "^0.4.6",
```

The pre-A baseline (`8818ae5`, the SHA running on prod) used npm-registry references and Docker-built cleanly (the existing running images were built from this baseline on 2026-03-21). The Tranche A commit `a7d1904 fix(A.W2): adopt cross-repo dev-resolution contract-v2 — runtime imports of value.js parseCSSStylesheet now resolve` switched to `file:` paths to unblock dev-machine resolution of sibling-repo runtime imports, but introduced an unobserved-at-the-time Docker-build regression. Tranche B inherited the broken state; D.W1.Phase1's mongo-bind closure also inherits it.

### Impact

ANY prod deploy that attempts a fresh frontend build will fail at `npm ci`. This is not specific to D-W1 — every commit since `a7d1904` carries the regression. The reason the site is still up is that the running containers are from March 21, BEFORE the regression landed, and have not been recreated since.

### Forward wave deliverable — author-scoped (candidates: W3 / W9)

Three resolution paths, in decreasing order of "least intervention required":

1. **Revert A.W2's `web/package.json` hunk** — restore npm-registry references for `@mkbabb/keyframes.js`, `@mkbabb/value.js`, `@mkbabb/glass-ui` (the latter likely needs a fresh npm-publish from the sibling repo). This re-breaks whatever dev-resolution problem A.W2 was solving — the trade-off must be authored, NOT chosen by the continuation agent. **Fits W3 (`backend NO-legacy + transpositions`) or W9 (`CF-Pages frontend migration`).**

2. **Vendor sibling-repo trees into fourier** — add a CI/Docker step that copies `../../glass-ui` etc. into the fourier build context (or into a separate workspace volume). This couples fourier's repo layout to the dev-machine layout, which violates clean-build expectations.

3. **Workspace tarball strategy** — sibling repos publish prebuilt tarballs (e.g. via CI to a private npm registry or GitHub Packages); fourier's package.json references the tarball URLs. This is the cleanest long-term fix; it's a build-system overhaul.

The decision is author-scoped. The continuation agent did NOT take any of these — Tranche A's design intent is the input to the decision and is not the continuation agent's to overrule.

---

## Blocker 3 — `fourier.babb.dev` is Cloudflare-fronted to GitHub Pages, NOT to the host

### Finding

The "live production URL" the W1 charter named (`https://fourier.babb.dev/api/health`) does not resolve to the host:

```
$ dig +short fourier.babb.dev
185.199.108.153  185.199.109.153  185.199.110.153  185.199.111.153   # GitHub Pages

$ nslookup fourier.babb.dev 8.8.8.8
Name: fourier.babb.dev
Address: 172.67.175.252      # Cloudflare
Address: 104.21.56.22        # Cloudflare

$ curl -I -k https://fourier.babb.dev/
HTTP/2 404
server: GitHub.com
x-served-by: cache-iad-…
```

`fourier.babb.dev` is Cloudflare-fronted (per the orange-cloud A records) with an upstream origin of GitHub Pages, which returns a 404 "There isn't a GitHub Pages site here." stub. The host's Apache vhost DOES claim `ServerName fourier.babb.dev` but the public DNS does not route there.

The host-served fourier (which IS serving correctly on `http://localhost:8100/` — verified with `<title>Fourier Analysis</title>` in the response body) has NO publicly-resolvable URL. It is reachable only via:

- VPN/LAN access to `https://mbabb.friday.institute/…` (the same hostname that's not publicly resolvable per Blocker 1)
- SSH port-forward of `:8100`
- The host's public IP `34.197.214.67` direct (no SNI hostname matches a real cert)

### Impact

The Production Parity invariant from `D.md §6` ("the recorded commit-to-deploy chain shows prod at D-HEAD") cannot be observably verified via a public probe. Even if Blockers 1 and 2 are fully resolved and the deploy chain advances the host to D-HEAD, `curl https://fourier.babb.dev/api/health` would continue to return the GitHub Pages 404. The "prod URL" the wave charters reference is not architecturally connected to the host-deployed app.

### Forward wave deliverable — W9 / W10

The W9 wave is explicitly titled "CF-Pages frontend migration (fourier pilot first)" — this suggests the architectural intent is to MOVE the frontend to CF Pages (which `fourier.babb.dev`'s Cloudflare → GitHub-Pages routing is a precursor to) and have the host serve only the backend API at a per-app subdomain like `api.fourier.babb.dev` (W10's named scope: "backend ingress + origin LE for api.<app> + CORS").

In that architecture, the "Production Parity" probe becomes:

- Frontend: `https://fourier.babb.dev/` → CF Pages serving the static build from CI
- Backend: `https://api.fourier.babb.dev/api/health` → host backend at `:8100`

The continuation agent did NOT author this migration — it's W9/W10's scope.

---

## Summary table — three blockers, three forward waves

| # | Blocker | Forward wave(s) | Constellation-wide? |
| --- | --- | --- | --- |
| 1 | Public webhook URL not resolvable | W8 + W10 | YES (5 repos) |
| 2 | Frontend Docker build broken by A.W2 `file:` paths | W3 or W9 (author-scoped) | NO (fourier-only; sibling apps have different package layouts) |
| 3 | `fourier.babb.dev` Cloudflare-routed to GH Pages, not host | W9 + W10 | NO (per-app; fourier-specific) |

The deploy-hook chain itself remains binding and provably invocable end-to-end via SSH (Step A in the continuation appendix). The wire is correct; the leg between the wire and the public world is severed in three independent places.

## What is NOT residual

- The Phase 1 Mongo bind closure remains EFFECTIVE — the running mongo container is bound to loopback regardless of the on-disk compose drift (the host tree advanced to `577f037` carries the bind-closure on disk; the running container also carries it from the Phase 1 recreate). External Mongo exposure remains CLOSED.
- The deploy-hook script's wiring (flock, real health gate, dirty-tree guard, rollback-on-health-failure) is fully tested in the cutover (the dirty-tree guard, the rollback-target record, the `git fetch` + `reset --hard`, the build invocation, the `set -e` abort path all ran as designed in the continuation Step A).
- The dispatcher patch (sibling arms byte-identical, fourier arm patched to invoke the repo-local script) is intact.
- The `image_blobs` Docker volume is provisioned.
- The `/var/www/fourier-analysis/.env` secret extraction is in place (0600 mbabb:mbabb, gitignored).
- The hook perms (`/opt/deploy/{hooks.json,.env}`) are tightened to 0600.

The W1 wave's authored-scope deliverables are GREEN. The three blockers above are inherited from upstream waves (A, infra, pre-existing DNS/routing) and exceed W1's scope; they are accurately referred forward.
