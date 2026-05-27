# NA3 — babb.dev DNS plan + the programmatic Cloudflare update path

**Lane**: NA3 (tranche-D constellation normalization, DNS/Cloudflare layer). **Mode**: READ-ONLY recon — no Cloudflare API token used or requested; planned from public `dig` + the documented CF API. **Authored**: 2026-05-27. **Working dir**: `/Users/mkbabb/Programming/fourier-analysis`.

**Relationship to `coordination/DOMAIN-NAMING.md`**: that doc owns the **host-Apache ingress** layer (vhosts, upstreams, CORS, the palette-api provenance reconcile). This doc owns the layer *above* it — the **Cloudflare DNS zone + edge** (records, proxy status, SSL coverage, the programmatic update mechanism). They share the convention `<app>.babb.dev` (frontend) + `api.<app>.babb.dev` (backend) but address different seams. The single new load-bearing finding here is the **CF Universal-SSL single-level-wildcard constraint** (§3, §6) that the convention's `api.<app>.babb.dev` form does not yet satisfy.

---

## §1 — Current DNS state (from `dig`, authoritative)

**Method**: queried the authoritative Cloudflare nameserver directly (`dig @jillian.ns.cloudflare.com <name> <type>`) plus public resolvers (`8.8.8.8`, `1.1.1.1`) and HTTP edge-identity probes (`curl -w server/cf-ray`). Proxy status read from the `cf-ray` header (present ⇒ orange-cloud/proxied; absent + a non-CF `server` header ⇒ grey-cloud/DNS-only).

### §1.1 — Delegation + authority (confirmed)

- **Parent `.dev` delegation** (`charlestonroadregistry.com` TLD servers) → `jillian.ns.cloudflare.com` + `maciej.ns.cloudflare.com` **only**. Cloudflare is sole authority; SOA = `jillian.ns.cloudflare.com … 2405392031`.
- A first stray pass against the local system resolver returned `ns-cloud-d*.googledomains.com` for the apex NS — a **stale/poisoned cache artifact**, not authoritative. The parent-trace and CF-authoritative answers agree on CF-only. No Google/Squarespace nameservers remain in the delegation.

### §1.2 — Apex + infrastructure records

| Name | Type | Value | Proxy | Notes |
|---|---|---|---|---|
| `babb.dev` | NS | `jillian` / `maciej.ns.cloudflare.com` | — | sole delegation |
| `babb.dev` | A | `198.185.159.144` | **grey (DNS-only)** | **Squarespace IP** — `server=Squarespace`, 302 → `github.com/mkbabb` |
| `babb.dev` | AAAA | `2606:4700:3031::6815:3816`, `::ac43:affc` | (CF-flattened) | CF-range v6 (CNAME-flatten artifact at apex) |
| `babb.dev` | MX | `aspmx.l.google.com` (1) + `alt1/2` (5) + `alt3/4` (10) | — | **Google Workspace email — DO NOT TOUCH** |
| `babb.dev` | TXT | `v=spf1 include:_spf.google.com ~all` | — | SPF for the Google MX — DO NOT TOUCH |
| `babb.dev` | CAA | *(none)* | — | any CA may issue (OK for CF + GitHub Pages) |
| `www.babb.dev` | — | (resolves to CF/Squarespace) | **grey** | `server=Squarespace`, 302 → `github.com/mkbabb` |

### §1.3 — The decisive finding: a proxied wildcard `*.babb.dev`

Every probed label — known apps, `api.*` forms, **and random nonexistent labels** (`zzqq-nonexistent-9k.babb.dev`, `deep.nested.sub.babb.dev`) — returns the **identical** answer:

```
*.babb.dev  300  IN  A     104.21.56.22, 172.67.175.252      (Cloudflare anycast)
*.babb.dev  300  IN  AAAA  2606:4700:3031::6815:3816, ::ac43:affc
```

`dig '*.babb.dev' A` returns those same IPs directly. **There is a single proxied (orange-cloud) wildcard record `*.babb.dev` that catches every subdomain.** This is the dominant fact of the zone: most app hostnames have **no explicit record** — they survive only via this wildcard, so the *DNS layer cannot tell apps apart*; the CF edge / host-Apache `Host`-header routing does. An exception is `color`/`keyframes`, which serve GitHub Pages content directly (see below); those are CNAME-flattened so their `dig` A also shows CF IPs, but the HTTP edge proves a distinct grey-cloud origin.

### §1.4 — Current app constellation (DNS + HTTP edge identity)

| Host | `dig` A (auth) | Proxy | HTTP probe | Interpretation |
|---|---|---|---|---|
| `fourier.babb.dev` | CF anycast | **orange** | `404 server=cloudflare cf-ray=…` | proxied; reaches an origin (host-Apache `:8100` per DOMAIN-NAMING §3), `/` 404 is a route/SPA-root artifact, not a DNS issue |
| `api.fourier.babb.dev` | CF anycast (wildcard) | orange | **TLS handshake failure** | **no explicit record (wildcard only); no edge cert covers it** — see §3 |
| `color.babb.dev` | CF anycast (flattened) | **grey** | `200 server=GitHub.com` (no cf-ray) | **live** — DNS-only CNAME → `mkbabb.github.io` (GitHub Pages, `185.199.108–111.153`); app = "Color Picker" |
| `api.color.babb.dev` | CF anycast (wildcard) | orange | **TLS handshake failure** | no explicit record; no edge cert — see §3 |
| `sudoku.babb.dev` | CF anycast | orange | `404 server=cloudflare` | wildcard-only; proxied, no working route |
| `api.sudoku.babb.dev` | CF anycast (wildcard) | orange | (n/a) | wildcard-only |
| `words.babb.dev` | CF anycast | orange | `404 server=cloudflare` | wildcard-only; co-resident vhost per DOMAIN-NAMING §3 |
| `api.words.babb.dev` | CF anycast (wildcard) | orange | (n/a) | wildcard-only |
| `grammar.babb.dev` | CF anycast | orange | `404 server=cloudflare` | wildcard-only |
| `api.grammar.babb.dev` | CF anycast (wildcard) | orange | (n/a) | wildcard-only |
| `keyframes.babb.dev` | CF anycast (flattened) | **grey** | `200 server=GitHub.com` | **live** — DNS-only CNAME → GitHub Pages (like color) |
| `api.keyframes.babb.dev` | CF anycast (wildcard) | orange | (n/a) | wildcard-only |
| `speedtest.babb.dev` | CF anycast | orange | `000` (connection failed) | wildcard-only; origin dead/absent |
| `api.speedtest.babb.dev` | CF anycast (wildcard) | orange | (n/a) | wildcard-only |
| `floridify.babb.dev` | CF anycast | orange | `404 server=cloudflare` | wildcard-only |
| `api.floridify.babb.dev` | CF anycast (wildcard) | orange | (n/a) | wildcard-only |
| `palette.babb.dev` | CF anycast | orange | `404 server=cloudflare` | wildcard-only (frontend now branded `color`) |
| `api.palette.babb.dev` | CF anycast (wildcard) | orange | (n/a) | wildcard-only; renamed to `api.color` per the directive |

**Reading**: only **`color` + `keyframes`** are *explicitly* wired (DNS-only CNAME → GitHub Pages, both live `200`). **`fourier`** is proxied and reaches an origin. **Everything else** (`sudoku`, `words`, `grammar`, `speedtest`, `floridify`, `palette`, and every `api.*`) is just the **proxied wildcard** with no dedicated record and no working route — which is why the task brief observed "`api.fourier.babb.dev` doesn't resolve yet": it *resolves* (to the wildcard), but has no cert and no origin, so it fails to *connect*.

---

## §2 — Target record set (full constellation)

**Convention** (from `coordination/DOMAIN-NAMING.md` §2): `<app>.babb.dev` = frontend, `api.<app>.babb.dev` = backend. Two origin classes:

- **GitHub Pages frontends** → **DNS-only (grey) CNAME → `mkbabb.github.io`** (or a CF-Pages CNAME if migrated to CF Pages; see §2.2). Pages serves TLS for these directly; do **not** orange-cloud them unless using CF Pages or an ACM cert.
- **mbabb-origin services** (backends + the fourier frontend) → **proxied (orange) A/AAAA → the mbabb public origin** (or a CF Tunnel CNAME — see the §2.3 origin-reachability caveat).

### §2.1 — Target table

| App | Frontend record | Backend (API) record | Origin class |
|---|---|---|---|
| **fourier** | `fourier.babb.dev` → proxied A → mbabb origin | `api.fourier.babb.dev` → proxied A → mbabb origin | mbabb (host-Apache `:8100` split per DOMAIN-NAMING §5) |
| **color** | `color.babb.dev` → DNS-only CNAME → `mkbabb.github.io` *(exists, keep)* | `api.color.babb.dev` → proxied A → mbabb origin (`:8130`, renamed from palette-api) | frontend=Pages, backend=mbabb |
| **palette** | *(retire/alias → `color`)* | *(retire → `api.color`)* | — |
| **sudoku** | `sudoku.babb.dev` → per origin (Pages CNAME or proxied A) | `api.sudoku.babb.dev` → proxied A (if backend exists) | per app |
| **words** | `words.babb.dev` → per origin | `api.words.babb.dev` → proxied A (if backend) | per app |
| **grammar** | `grammar.babb.dev` → per origin | `api.grammar.babb.dev` → proxied A (if backend) | per app |
| **keyframes** | `keyframes.babb.dev` → DNS-only CNAME → `mkbabb.github.io` *(exists, keep)* | `api.keyframes.babb.dev` → proxied A (if backend) | frontend=Pages |
| **speedtest** | `speedtest.babb.dev` → proxied A → mbabb origin | *(typically no API)* | mbabb (origin currently dead — fix) |
| **floridify** | `floridify.babb.dev` → per origin | `api.floridify.babb.dev` → proxied A (if backend) | per app |

**Notes on the target**:
- The proxied wildcard `*.babb.dev` can **stay as a safety net** (it gives every unconfigured host a CF-managed default and a `*.babb.dev` cert), but **explicit records should be added for each live app** so that (a) intent is legible in the zone, (b) per-host proxy mode and Page Rules / cache settings are controllable, and (c) `api.<app>` gets real cert + origin handling instead of failing.
- **`api.<app>.babb.dev` is a 2nd-level subdomain** and is the crux of §3 (TLS).
- GitHub-Pages frontends must stay **grey** (DNS-only) unless moved to CF Pages, because proxying a Pages origin orange without an ACM cert is what breaks `color`-style names.

### §2.2 — If frontends move to Cloudflare Pages (optional)

If any frontend migrates from GitHub Pages to **Cloudflare Pages**, the record becomes a **proxied CNAME → `<project>.pages.dev`** (CF auto-manages the custom-hostname cert for the first-level `<app>.babb.dev`). `wrangler pages deploy` + `wrangler pages domain add <app>.babb.dev` provisions both the deploy and the custom-domain DNS in one tool. This is the cleanest path *if* leaving GitHub Pages is desired; otherwise keep the existing grey CNAMEs.

### §2.3 — Origin-reachability caveat (hand-off to thread α)

`mbabb.fridayinstitute.net` resolves to **`10.0.2.253` (RFC1918 private)** — not a public IP. A "proxied A → mbabb origin" record needs **either** a public origin IP for the host **or** a **Cloudflare Tunnel** (`cloudflared`, record = proxied CNAME → `<uuid>.cfargotunnel.com`). This intersects the infra plan's "VPN removal / port standardization" item and DOMAIN-NAMING §3's host-Apache reality. **DNS cannot fix this alone** — flagged for thread α; the DNS record shape (A vs Tunnel-CNAME) is decided by which origin exposure α lands on.

---

## §3 — TLS constraint on `api.<app>.babb.dev` (new finding, load-bearing)

The Cloudflare edge cert is **Universal SSL**, SAN = **`*.babb.dev`, `babb.dev`** — a **single-level wildcard only**. Verified:

```
fourier.babb.dev:443      → CN=babb.dev, SAN: *.babb.dev, babb.dev   (handshake OK)
api.fourier.babb.dev:443  → SSL handshake failure (no cert returned)
api.color.babb.dev:443    → SSL handshake failure (no cert returned)
```

`*.babb.dev` covers `fourier.babb.dev` but **NOT** `api.fourier.babb.dev` (a label deeper). So **the `api.<app>.babb.dev` convention does not yet have working TLS at the CF edge.** Three resolutions:

1. **Cloudflare Advanced Certificate Manager (ACM)** — add a cert covering `*.babb.dev` **and** `api.*.babb.dev` (or per-app `*.<app>.babb.dev`). ACM is a **paid add-on** (~$10/mo) and supports up to two-level wildcards. Cleanest if the `api.<app>` form is kept.
2. **Per-hostname Total-TLS / edge certificate** for each `api.<app>.babb.dev` (CF can issue a single-host cert per proxied hostname; for a handful of apps this is free-tier-viable via "Edge Certificates → no wildcard, explicit hostnames").
3. **Restructure to single-level**: `<app>-api.babb.dev` (e.g. `fourier-api.babb.dev`) — covered by the existing `*.babb.dev` cert, **zero cost, no new cert**. This contradicts the user's explicit `api.fourier.babb.dev` directive, so it is the *rejected-unless-reconsidered* fallback — but it is the only **free + already-working** option and worth surfacing.

**Recommendation**: confirm the `api.<app>` form is firm; if so, **ACM** (option 1) is the smallest mechanism that satisfies the whole constellation with one cert. Record this as a prerequisite of the convention, not an afterthought.

---

## §4 — The programmatic update path (the user's question: "yes / how")

**Yes — programmatically, and the zone is already 100% Cloudflare-authoritative, so the CF API is the single control plane.** Ranked by KISS (smallest mechanism first):

### Rank 1 (recommended) — a thin CF-API script for DNS + `wrangler` for any Pages

For a zone this size (one zone, ~10 apps, a wildcard, a handful of explicit records), a **small idempotent script over the Cloudflare REST API** is the right grain. It can:
- list current records (`GET /zones/{zone_id}/dns_records`),
- create/update the explicit `<app>` + `api.<app>` records (`POST` / `PATCH /zones/{zone_id}/dns_records`),
- set `proxied: true|false` per record (the orange/grey toggle is one JSON field).

Use **`wrangler`** *only if* a frontend moves to CF Pages (`wrangler pages deploy` + `wrangler pages domain add` — it manages the Pages project, the build upload, and the custom-domain DNS together). `wrangler` does **not** manage arbitrary DNS records well; it is a Pages/Workers tool, not a DNS tool. So: **wrangler for Pages, CF-API script for DNS.**

Endpoints the script needs:
- `GET /zones?name=babb.dev` → `zone_id`
- `GET /zones/{zone_id}/dns_records` → current state
- `POST` / `PATCH` / `DELETE /zones/{zone_id}/dns_records[/{id}]` → mutate
- `GET /zones/{zone_id}/ssl/certificate_packs` (+ ACM order) → if doing §3 option 1

### Rank 2 — `cf-terraforming` + Terraform (IaC), only if the zone warrants it

`cf-terraforming import` can pull the existing zone into Terraform HCL state; thereafter the zone is managed as code (`cloudflare_record`, `cloudflare_pages_project`, `cloudflare_certificate_pack` resources). **Verdict: overkill for now.** Terraform earns its keep when (a) records number in the dozens, (b) multiple maintainers need PR-reviewed DNS, or (c) the constellation grows enough that drift is a real risk. The repo already has `terraform` installed but `cf-terraforming` is **not** installed. Hold IaC until the zone outgrows the script — record it as the natural Rank-2 escalation, not the day-one tool.

### Rank 3 — Cloudflare dashboard (manual)

Always available; not programmatic; fine for one-off proxy-toggle or the ACM order, but does not satisfy "programmatically."

**Verdict**: **Rank 1** — a single CF-API script (idempotent, checked into `scripts/`) for the explicit per-app records + proxy toggles, plus `wrangler` only where CF Pages is adopted. Terraform/`cf-terraforming` is the deliberate later escalation, not now.

---

## §5 — Exact Cloudflare API token scopes (for the user to confirm/adjust)

Create a **scoped API token** (Account → API Tokens → Create Token → Custom), **not** the legacy Global API Key. The minimal scopes per task:

| Capability needed | Token permission (exact CF scope) | Why |
|---|---|---|
| Read the zone + find `zone_id` | **Zone → Zone → Read** | resolve `babb.dev` to its `zone_id`; list zone settings |
| Create / edit / delete DNS records, toggle proxy | **Zone → DNS → Edit** | the core of the DNS update path (`POST`/`PATCH`/`DELETE` dns_records) |
| Deploy / bind CF Pages projects + custom domains (only if Pages adopted) | **Account → Cloudflare Pages → Edit** | `wrangler pages deploy` + `pages domain add` |
| Order/manage ACM cert for `api.*.babb.dev` (only if §3 option 1) | **Zone → SSL and Certificates → Edit** | provision the two-level-wildcard edge cert |

**Token resource scoping**: restrict to **Zone Resources = Include → Specific zone → `babb.dev`** (and **Account Resources = the owning account** for the Pages permission). Do **not** grant account-wide or all-zones. Recommended split:
- **DNS-only token** (the common case): `Zone:Zone:Read` + `Zone:DNS:Edit`, scoped to `babb.dev`. This alone satisfies the entire §2 DNS plan minus Pages/ACM.
- **Add `Account:Cloudflare Pages:Edit`** only if/when a frontend moves to CF Pages.
- **Add `Zone:SSL and Certificates:Edit`** only if doing the ACM cert in §3.

So the **smallest token that does the DNS work**: `Zone:DNS:Edit` + `Zone:Zone:Read`, zone-scoped to `babb.dev`. The task brief's named trio (`Zone:DNS:Edit`, `Account:Cloudflare Pages:Edit`, `Zone:Zone:Read`) is the **full normalization set** (DNS + Pages); SSL:Edit is the fourth, conditional on the ACM path.

---

## §6 — Squarespace → Cloudflare migration residue + don't-break list

The NS already moved to Cloudflare (§1.1) — that migration is **done**. What remains:

### §6.1 — Residue to consider pruning (carefully, NOT unilaterally)

- **Apex `babb.dev` A = `198.185.159.144` (Squarespace IP)**, grey-cloud, currently 302-redirecting to `github.com/mkbabb`. This is **Squarespace-era hosting residue** but it is **functional** (a profile redirect via Squarespace forwarding). **Do not blind-delete.** If the apex should instead go to a constellation landing page or a CF redirect rule, replace it deliberately (CF Redirect Rule or a Pages/Worker), then drop the Squarespace A. Until then it works — leave it.
- **`www.babb.dev`** behaves identically (302 → github.com/mkbabb). Same treatment as the apex.
- The **proxied wildcard `*.babb.dev`** is *not* Squarespace residue (it is CF anycast) and should be **kept** as a default catch + cert holder while explicit records are added; revisit only after every live app has an explicit record.

### §6.2 — DON'T-BREAK list (preserve verbatim through any update)

1. **MX records** — `aspmx.l.google.com` (pri 1), `alt1/alt2` (5), `alt3/alt4` (10): **Google Workspace email. Touching these breaks mail. Never delete or re-point.**
2. **SPF TXT** — `v=spf1 include:_spf.google.com ~all`: paired with the MX; required for mail deliverability. Preserve. (Also preserve any DKIM `*._domainkey` / DMARC `_dmarc` TXT if present — none surfaced in probing but enumerate before any TXT edit.)
3. **The apex `babb.dev` A/AAAA** — do not orphan the apex; if replacing the Squarespace A, stage the replacement first (apex must always resolve to *something* sane). Apex AAAA is CF-flattened — leave consistent with whatever the apex A becomes.
4. **`color.babb.dev` + `keyframes.babb.dev`** — the only currently-live app frontends (GitHub Pages, DNS-only CNAME → `mkbabb.github.io`). Adding explicit `api.color`/`api.keyframes` records must **not** flip these frontends to orange-cloud (that breaks Pages TLS without an ACM cert). Keep them grey.
5. **The NS records** — `jillian`/`maciej.ns.cloudflare.com`: the delegation itself. Never edit.

---

## §7 — Hand-offs

- **Thread α (fourier-D)**: the origin-reachability decision (public IP vs CF Tunnel for the proxied-A targets — §2.3); this gates the `fourier.babb.dev` + `api.fourier.babb.dev` record *shape*. Coupled to the host-Apache vhost split in DOMAIN-NAMING §5.
- **TLS prerequisite (§3)**: confirm the `api.<app>` form is firm → if yes, ACM (or per-hostname edge certs) must be provisioned *before* `api.*` records are expected to serve HTTPS. This is the silent blocker behind "`api.fourier.babb.dev` doesn't work."
- **Cross-repo / value.js**: the `color` frontend lives off-host (GitHub Pages); only `api.color.babb.dev` is a fourier-touchable DNS+ingress seam, and per DOMAIN-NAMING §6 it is user-re-mandate-gated.
- **Precept**: the `<app>.babb.dev` + `api.<app>.babb.dev` convention plus the **single-level-wildcard SSL constraint** belongs in `docs/precepts/infra/` (D.W2) so the cert requirement travels with the naming rule.
