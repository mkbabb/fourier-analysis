# R3 — MongoDB TLS posture audit (tranche C, wave Wα)

**Lane**: R3 — MongoDB TLS posture audit (thread α). **Mode**: research-only — no source touched. **Authored**: 2026-05-27.
**Measures against**: `docs/tranches/C/W0-baseline.md §1.2` (the binding baseline — 3 unfaithful sites), `C.md §2` invariant 19, `C.md §3` (W2 row), `C.md §5`.
**Follows**: `memory/project_infra_plan.md` (the MongoDB-TLS posture plan).

This is the audit. The binding contract — exact connection params, provisioning + rotation procedure, the issuer-recording requirement, the prod↔dev parity disposition — is the sibling artefact `research/R-tls-spec.md`. Every claim below is grounded in `file:line` or `project_infra_plan.md`.

---

## §1 — The current posture, read fresh from the tree

The mongod **server** is already configured for TLS at rest and in transit (`docker-compose.prod.yml:45-49`):

```
command: ["mongod", "--tlsMode", "requireTLS",
          "--tlsCertificateKeyFile", "/etc/ssl/mongo.pem",
          "--tlsCAFile", "/etc/ssl/mongo-ca.pem",
          "--tlsAllowConnectionsWithoutCertificates",
          "--auth"]
```

`requireTLS` (`:45`) forbids plaintext — every connection is encrypted. `--auth` (`:49`) enforces SCRAM. The cert + CA are bind-mounted read-only from a host-local `./ssl/` directory (`:57-58`):

```
- ./ssl/mongo.pem:/etc/ssl/mongo.pem:ro
- ./ssl/mongo-ca.pem:/etc/ssl/mongo-ca.pem:ro
```

The encryption is therefore real. The **unfaithfulness is entirely in the trust posture** — every party around the encrypted channel is told to skip certificate validation. There are **three committed sites** (baseline §1.2, matching `CA5 §3.2`), plus **a fourth latent site** in `.env.example` this audit surfaces.

| # | Site | `file:line` | What it does | Why it is unfaithful |
|---|---|---|---|---|
| 1 | client MONGO_URI | `docker-compose.prod.yml:8` | `…&tls=true&tlsAllowInvalidCertificates=true` | the app trusts ANY server cert — MITM-equivalent; encryption without authentication |
| 2 | mongod server | `docker-compose.prod.yml:48` | `--tlsAllowConnectionsWithoutCertificates` | server accepts clients that present no client cert (relevant only under mutual-TLS) |
| 3 | healthcheck | `docker-compose.prod.yml:53` | mongosh `--tls --tlsAllowInvalidCertificates` | the container healthcheck trusts any cert |
| 4 (latent) | dev-direct-to-prod doc | `.env.example:21` | commented `MONGO_URI=…&tls=true&tlsAllowInvalidCertificates=true` | propagates the insecure pattern into the documented developer workflow; not a running site but a teaching site |

Invariant 19 (`C.md §2`) is violated at sites 1–3: *"MongoDB connections in prod use TLS with verified certificates (no `tlsAllowInvalidCertificates`)."*

---

## §2 — Cert provenance: the key unknown — verdict UNKNOWN FROM THE TREE

This was R3's headline question. **The provenance is genuinely unknowable from the committed tree.** The audit was exhaustive:

- **`./ssl/` is not committed.** `.gitignore:79` lists `ssl/` (under the `# TLS certificates` heading at `:78`). `git ls-files | grep -i ssl` returns nothing. `ls ssl/` returns *No such file or directory* in the working tree. The certs live only on the deploy host (`/var/www/fourier-analysis/ssl/` per `deploy.sh:5` `REMOTE_DIR`).
- **No generation script exists anywhere.** A full-tree grep for `openssl req|openssl genrsa|openssl x509|gen.?cert|generate.*cert|create.*cert|ca\.key|mkcert|certbot|letsencrypt` (excluding `node_modules`/`.git`) returns **only** the four `docker-compose.prod.yml` mount/flag lines and audit-doc prose. There is no `scripts/gen-cert.sh`, no `ssl/README`, no mongo-init entrypoint, no Makefile target.
- **No documentation records it.** `docs/precepts/` (a git submodule — has its own `.git`) has **no `infra/` subdirectory** (it must be created at W2 per `C.md §5`). `r6-fourier-C-scope.md:93` *raised* the question as an open Wα item ("Let's Encrypt? Self-signed via internal CA? rotation cadence?") but did not answer it. `CA5 §3.2:147` confirms only that the material is bind-mounted and names "a CA + cert provisioning story (Wα-R3)" as the *substrate* still owed — i.e. CA5 also could not find it.
- **`.env.example`** documents credentials, ports, and the (insecure) connection URI but says nothing about how `mongo.pem` / `mongo-ca.pem` are produced.

**Finding**: the certs were provisioned by an undocumented manual operator action on the deploy host at some point before this tranche, with no recorded issuer, generation procedure, or rotation cadence. The two-file shape (`mongo.pem` = leaf cert+key concatenated, the form mongod's `--tlsCertificateKeyFile` wants; `mongo-ca.pem` = the CA that signed it) is **strongly consistent with a self-signed internal CA** — a public CA (Let's Encrypt / commercial) would not normally also hand you a separate `mongo-ca.pem` to pin, and the server is on a private Docker network (`mongo:27017`, not a public DNS name), where ACME/Let's Encrypt issuance does not apply. But the tree cannot prove this; it is inference from shape, not evidence.

**Consequence for the invariant-19 close gate.** `C.md §3` (W2 row) and `C.md §6` require *"verified certs in place (issuer recorded)"* and *"the verified cert issuer is recorded in `docs/precepts/infra/`."* That gate **cannot be met by reading the existing certs alone**, because (a) they are not in the tree, and (b) their issuer is undocumented and — being almost certainly an ad-hoc self-signed pair — may not carry a stable, recordable issuer identity, CN, or rotation story. **The honest discharge is for W2 to establish provenance by re-provisioning under a documented procedure**: generate a self-signed internal CA with a recorded issuer (CN/O/validity), sign the mongod leaf cert from it, commit the *generation procedure* (never the private keys) to `docs/precepts/infra/`, and place the new material in `./ssl/` on the host. The verified-cert-issuer gate is then met by the *recorded procedure + issuer*, not by archaeology of the existing files. See R-tls-spec §2 for the procedure.

This is consistent with KISS (invariant 12) and `project_infra_plan.md:14` ("TLS+SCRAM-SHA-256 on unique host ports") — a self-signed internal CA is the smallest honest mechanism for a single-host, single-replica, private-network mongod; no ACME automation, no commercial CA, no cost.

---

## §3 — The mutual-TLS vs server-only-TLS decision (KISS-ranked)

Site 2 (`:48` `--tlsAllowConnectionsWithoutCertificates`) only exists to make the connection work *despite* the client not presenting a client cert. Removing it honestly forces a decision:

- **Option A — server-only TLS (client validates server; client presents NO cert).** The client opens a TLS connection, validates the mongod server cert against the mounted CA (`tlsCAFile`), and authenticates with SCRAM (`--auth`, already present). The server does not ask for a client cert. To remove `:48` honestly under this option, the server must simply *stop requesting* client certs — which, with `requireTLS`, mongod does by default once `--tlsAllowConnectionsWithoutCertificates` is absent **and** no `x509` authentication is configured. The flag becomes vacuous and is deleted. Authentication is SCRAM-SHA-256 (`project_infra_plan.md:14`). **No client cert provisioning. One cert pair total (the server leaf + CA).**

- **Option B — mutual TLS (client also presents a cert the server validates).** Adds a *second* cert (a client leaf signed by the same CA), a second mount, a second rotation, and `MONGO-X509` auth wiring or a co-presented client cert alongside SCRAM. This is the posture where `--tlsAllowConnectionsWithoutCertificates` would otherwise *gate* certless clients — but only if the server is also told to *require* client certs (it currently is not; `requireTLS` without `CLIENT_CERTIFICATE` x509 auth does not mandate a client cert). So today the flag is **already vacuous** — there is no x509-auth requirement for it to relax.

**KISS verdict: Option A — server-only TLS.** Justification per invariant 12:

1. **The flag is already inert.** `--tlsAllowConnectionsWithoutCertificates` relaxes a *requirement that is not configured*. The server requires TLS (`:45`) and SCRAM (`:49`), not client x509. Removing the flag changes nothing functionally for an SCRAM client — which means it can be deleted as dead configuration, the cleanest possible discharge of site 2.
2. **Mutual TLS doubles the cert surface for zero gain here.** Authentication is *already* solved by SCRAM-SHA-256 (`project_infra_plan.md:14`); a client cert would be a redundant second authentication factor on a single-operator, single-replica, private-network deployment. Adding a client cert + its rotation + x509-auth wiring is exactly the over-engineering invariant 12 forbids ("the smallest honest mechanism").
3. **The threat model server-only TLS closes is the real one.** The vulnerability today is `tlsAllowInvalidCertificates=true` (site 1) — the *client* trusts any *server* cert, so a network attacker on the Docker bridge could impersonate mongod and harvest the SCRAM handshake / data. Server-only TLS with `tlsCAFile` validation closes exactly this. Mutual TLS would additionally protect against a rogue *client* — but the only client is the app container on the same host the operator controls; there is no untrusted-client threat.

**Therefore**: site 2 is removed by **deleting `--tlsAllowConnectionsWithoutCertificates`** (it is vacuous under SCRAM-only auth), and the posture is **server-only TLS**: the client and the healthcheck validate the server cert against the mounted CA; neither presents a client cert. One cert pair total.

---

## §4 — The 3-site removal plan (overview; exact strings in R-tls-spec §3)

| Site | Removal | Mechanism |
|---|---|---|
| 1 — client (`:8`) | replace `tlsAllowInvalidCertificates=true` with `tlsCAFile=/etc/ssl/mongo-ca.pem` | mount the CA into the **backend** container too (it is currently only mounted into mongo); URI carries `tls=true&tlsCAFile=…`. Motor/pymongo 4.16 honours `tlsCAFile` both as a URI option and as a client kwarg. Default verification (hostname + chain) applies once `tlsAllowInvalidCertificates` is gone. |
| 2 — server (`:48`) | delete `--tlsAllowConnectionsWithoutCertificates` | vacuous under SCRAM-only auth (§3, Option A); deletion is the discharge |
| 3 — healthcheck (`:53`) | replace `--tlsAllowInvalidCertificates` with `--tlsCAFile /etc/ssl/mongo-ca.pem` | mongosh validates the server cert against the already-mounted CA; runs inside the mongo container where `/etc/ssl/mongo-ca.pem` already exists (`:58`) |
| 4 (latent) — `.env.example:21` | rewrite the documented dev-direct-to-prod URI to use `tlsCAFile` (pointing at a developer-local copy of the CA), not `tlsAllowInvalidCertificates` | not a baseline §1.2 site, but leaving it propagates the insecure pattern; W2 should fix it for parity honesty |

**Server cert SAN requirement (the one footgun)**: once the client validates with default verification, the server cert's Subject Alternative Name must include the hostname the client connects to. The app connects to `mongo` (Docker service DNS, `docker-compose.prod.yml:8` `@mongo:27017`); a developer connecting direct-to-prod uses `mbabb.friday.institute` (`.env.example:21`) / `mbabb.fridayinstitute.net` (`deploy.sh:6`). The re-provisioned cert (R-tls-spec §2) must carry SANs for **both** `mongo` and the public host, or the client validation fails. This is the concrete reason the certs must be re-provisioned under a documented procedure rather than reused — the existing cert's SANs are unknown and likely do not cover `mongo` if it was issued for the public name (or vice-versa). This is recorded as a hard pre-condition for the W2 close.

---

## §5 — Verification mode

pymongo 4.16 (confirmed installed: `pymongo.version == 4.16.0`) performs **full certificate verification by default** — chain validation against the trust store (overridden to the mounted CA via `tlsCAFile`) plus hostname matching against the cert SANs. There is no separate "verification mode" knob to set *on*; verification is the default and the three `tlsAllowInvalid*` flags are precisely what *disable* it. Removing them restores full verification. There is deliberately **no** `tlsAllowInvalidHostnames` middle-ground retained — that would be a workaround (invariant: no workarounds), and the §4 SAN requirement makes it unnecessary if the cert is provisioned correctly.

---

## §6 — prod↔dev parity

**Dev has no TLS today.** `docker-compose.yml:14` connects `mongodb://…@mongo:27017/fourier?authSource=admin` — no `tls=true`, and the dev mongo (`docker-compose.yml:32-44`) runs the stock `mongo:8.0` image with no `--tlsMode`. This is a divergence from prod's `requireTLS`.

**Disposition: named parity residual — dev stays plaintext-on-loopback, with a reason.** Per `C.md §5` (W2 row: *"dev `MONGO_URI` updated"*) and KISS:

- Dev mongo is reachable only on the Docker bridge `app-network` (`docker-compose.yml:18,35`), never published to a host port (contrast prod `:41` which publishes 27017 for the documented dev-direct-to-prod access at `.env.example:21`). There is no untrusted network segment in the dev path; encrypting bridge-local traffic between two containers the developer owns buys nothing and would force every developer to provision a local CA to run `docker compose up`.
- Mirroring prod's `requireTLS` into dev would require the cert-generation procedure to run as a dev prerequisite — friction with no security gain on a loopback bridge. That is the over-engineering invariant 12 rejects.
- **The genuine parity surface is the documented dev-direct-to-prod URI** (`.env.example:21`), which *does* cross the network and *must* therefore validate the prod cert. Fixing site 4 (§4) gives a developer connecting to prod the same verified-cert posture the app gets. That is where parity matters and it is closed.

So the parity disposition is: **dev-local mongo stays untls'd on the bridge (named residual, justified by KISS + threat model); the dev→prod path is brought to verified-cert parity** by rewriting `.env.example:21`. Recorded in R-tls-spec §5 as the binding disposition so W6 close can cite it rather than flag dev as an unexplained divergence.

---

## §7 — Summary of verdicts (for the Wα index + Wχ.P-TLS)

1. **Cert provenance**: UNKNOWN from the tree — not committed (`.gitignore:79`), no generation script, no precept doc. Almost certainly an ad-hoc self-signed pair (two-file `mongo.pem`+`mongo-ca.pem` shape on a private network), but unprovable. → W2 must **establish** provenance by re-provisioning under a documented self-signed-internal-CA procedure (R-tls-spec §2).
2. **3-site removal**: site 1 → `tlsCAFile` on the client URI (+ mount CA into backend); site 2 → delete the now-vacuous `--tlsAllowConnectionsWithoutCertificates`; site 3 → mongosh `--tlsCAFile`. Plus latent site 4 in `.env.example:21`.
3. **mutual-TLS vs server-only**: **server-only TLS** — KISS; the certless-allow flag is already inert under SCRAM-only auth, and the real threat (client trusting a forged server cert) is closed by `tlsCAFile` validation. Mutual TLS would double the cert surface for no gain on this single-operator deployment.
4. **Verification mode**: pymongo-4.16 default full verification (chain + hostname); no middle-ground hostname-skip retained.
5. **Parity**: dev-local mongo stays plaintext-on-bridge (named, justified residual); dev→prod documented URI brought to verified-cert parity.
6. **Invariant-19 close gate**: achievable in W2 **only after** a provisioning step (re-issue under a recorded CA with SANs for `mongo` + the public host). It is NOT achievable by reusing the existing undocumented certs.
