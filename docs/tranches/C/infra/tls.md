# MongoDB verified-TLS — trust posture, provisioning, rotation (C.W2)

**Status**: binding precept landed at C.W2 (thread α — MongoDB TLS). Discharges
`C.md §2` invariant 19 and the `C.md §6` close gate *"no
`tlsAllowInvalidCertificates` (all three sites); the verified cert issuer is
recorded in `docs/precepts/infra/`."* The binding contract is
`docs/tranches/C/research/R-tls-spec.md`.

> Placement note. `docs/precepts/infra/` (named in `R-tls-spec.md §4` and
> `W2.md §6`) is a git *submodule* (`docs/precepts → precepts.git`), a separate
> repository outside the fourier-analysis working tree. To keep the C.W2 change
> inside ONE working tree for the team-lead — exactly as C.W5 staged its DR note
> at `docs/tranches/C/infra/blob-backend-dr.md` — this precept lands here in the
> tranche docs. **Promote it to `docs/precepts/infra/tls.md` at the W6 close
> ceremony** (bump the submodule pointer there); the invariant-19 issuer-line
> evidence is identical wherever it lives.

> Stratum note (the W2 spine). This wave is split exactly as W1 was, on the
> *provision-then-flags* spine (`R-tls-spec.md §2`, "the W2 pre-condition"):
> **Stratum A** (this precept, `scripts/gen-mongo-certs.sh`, the `.env.example`
> reconcile) is repo-local and landed NOW. **Stratum B** (the
> `docker-compose.prod.yml` flag-removal + backend CA mount) is **host-gated** —
> it MUST NOT land in compose until the deploy host has run
> `gen-mongo-certs.sh` and a SAN-correct cert sits at `./ssl/mongo.pem`.
> Removing the permissive flags against an un-re-provisioned (unknown-SAN) cert
> breaks the next verified connection the instant the flag drops. **Inversion is
> forbidden.** The ready-to-apply Stratum B diff is recorded verbatim below as a
> procedure, NOT applied to compose. The invariant-19 close gate ("no
> `tlsAllowInvalidCertificates` in prod.yml") is therefore met ONLY after the
> coordinated host step — never claim `docker-compose.prod.yml` is clean until it
> is.

---

## §1 — Posture

- **Mode**: **server-only TLS** with **SCRAM-SHA-256** authentication. The client
  and the in-container healthcheck validate the mongod *server* certificate
  against a mounted CA; **no client certificate is presented** (no mutual TLS).
  The leaf `mongo.pem` is mounted into the mongo container only, never into the
  backend — the client trusts the CA, it does not own a cert.
- **Verification**: **full** — chain validation against the mounted CA **plus**
  hostname/SAN match. This is pymongo 4.16's default, achieved by *removing* the
  three `tlsAllowInvalid*`-family escapes, not by setting a permissive knob.
  There is no `tlsAllowInvalidHostnames` middle ground.
- **Topology**: single-replica (invariant 19; `prod.yml replicas: 1`), private
  Docker `app-network` bridge. No horizontal scaling, no multi-replica.
- **KISS honesty (invariant 12)**: under SCRAM-only auth the
  `--tlsAllowConnectionsWithoutCertificates` flag is **inert** — certless SCRAM
  clients connect with or without it. Its removal is therefore honest, not a
  pivot to x509 client auth.

---

## §2 — Issuer (the invariant-19 close-gate evidence)

The verified-cert trust root is a **self-signed internal CA**:

```
Subject: CN=fourier-internal-ca, O=fourier-analysis, OU=infra
```

- self-signed, **4096-bit RSA**, **SHA-256**, **10-year** root (3650 days).
- The app trusts THIS CA via `tlsCAFile=/etc/ssl/mongo-ca.pem`; it does **not**
  trust the system trust store.

*This issuer line is the invariant-19 "verified cert issuer recorded" evidence.*
A W2 close that sets the flags right but does not land this line **fails the
gate** — "TLS enabled" without a recorded verified-cert issuer is a named
invalid gate (`C.md §6`, `R-tls-spec.md §4`).

---

## §3 — The leaf SANs (the footgun)

The mongod server leaf is signed by the CA above with subject
`CN=mongo, O=fourier-analysis, OU=infra`, `extendedKeyUsage = serverAuth`, and
the **mandatory SAN set**:

| SAN | Why it is required |
|---|---|
| `DNS:mongo` | the Docker service name the app container connects to (`@mongo:27017`) |
| `DNS:localhost` | the in-container mongosh healthcheck / loopback |
| `IP:127.0.0.1` | the same loopback target as an IP literal |
| `DNS:mbabb.fridayinstitute.net` | the public host for documented dev-direct-to-prod access (`.env.example`) |

**The footgun**: under full verification the server cert's SANs must cover the
name the client connects to, or the handshake is rejected. The leaf must carry
**every** connect-name. **Adding a new connect-name requires re-issuing the
leaf** (re-run `scripts/gen-mongo-certs.sh` after extending `LEAF_SANS`). This
is the concrete reason the certs are re-provisioned under this documented
procedure rather than reused: the prior cert's SAN coverage was unknown from the
tree and could not satisfy the issuer-recorded gate.

---

## §4 — Provisioning procedure

The §2.1–§2.2 openssl commands of `R-tls-spec.md` are distilled into the
committed script **`scripts/gen-mongo-certs.sh`**. The **script is committed;
the keys it emits are not** (see §6). To provision (or rotate the leaf), run it
**on the deploy host** from the repo root so it writes into the `./ssl/` that
`docker-compose.prod.yml` bind-mounts:

```
bash scripts/gen-mongo-certs.sh
```

It generates: the CA (`mongo-ca.pem` 0644, `ca.key` 0600), the leaf signed by
that CA with the §3 SAN set, and concatenates the leaf cert + key into
`mongo.pem` (0600 — mongod's `--tlsCertificateKeyFile` wants one PEM). The CA is
reused if it already exists (re-issuing it would invalidate every distributed
`mongo-ca.pem`); `FORCE_CA=1` clobbers it with a loud warning.

**Verify the SAN set landed (the Gp sub-gate, deploy-host only):**

```
openssl x509 -in ./ssl/mongo.pem    -noout -text | grep -A1 'Subject Alternative Name'
openssl x509 -in ./ssl/mongo-ca.pem -noout -subject     # → CN=fourier-internal-ca
```

---

## §5 — Rotation cadence

- **Leaf** (`mongo.pem`): **825-day** validity, **manual** rotation. Re-run
  `gen-mongo-certs.sh` against the same CA, drop the new `mongo.pem` into
  `./ssl/`, restart mongo (`docker compose up -d mongo`). The CA is unchanged, so
  **clients need no change** on leaf rotation.
- **CA** (`mongo-ca.pem`): **10-year** root, rotated only on **compromise or
  expiry**. CA rotation requires re-issuing the leaf AND replacing every
  consumer's mounted `mongo-ca.pem` (app container + healthcheck + any dev copy).
- **No automated renewal** — no certbot, no ACME (invariant 12; the network is
  private and single-host, so a documented manual rotation is the KISS-honest
  mechanism).
- **Next leaf rotation due**: 825 days from the host provisioning run — record
  the concrete date in this file at the host cert-provisioning step (i.e. the
  date the operator ran `gen-mongo-certs.sh` + 825d).

---

## §6 — Secret discipline

- `ca.key`, `server.key`, and `mongo.pem` are **never committed**. The whole
  `ssl/` directory is gitignored (`.gitignore:79`); the generated material lives
  only in `./ssl/` on the deploy host (and `ca.key` on the operator's secure
  store).
- **Only `mongo-ca.pem`** (the public CA cert) is shareable — copied to a
  developer machine for the dev-direct-to-prod path (`.env.example`,
  `tlsCAFile=/path/to/mongo-ca.pem`).
- The committed surface from W2 is exactly: `scripts/gen-mongo-certs.sh`, this
  precept, the `.env.example` reconcile, and (after the host step) the
  Stratum-B compose edits. No `*.key`, no `*.csr`, no `mongo.pem` is ever
  tracked.

---

## §7 — Dev↔prod parity disposition (binding)

- **Dev-local mongo (`docker-compose.yml`): remains plaintext on the bridge — a
  NAMED, JUSTIFIED RESIDUAL.** It is reachable only on `app-network` (never
  host-published), both endpoints operator-owned; TLS on a loopback bridge buys
  nothing and would force a per-developer CA prerequisite (invariant 12). The dev
  `MONGO_URI` is **not** given `tls=true`. `docker-compose.yml` is **not**
  touched by W2. **W6 close cites this disposition** so the divergence is
  explained, not flagged.
- **Dev→prod documented path (`.env.example`): brought to verified-cert parity**
  via the §3.5 reconcile (host `friday.institute` → `fridayinstitute.net`,
  `tlsAllowInvalidCertificates=true` → `tlsCAFile=/path/to/mongo-ca.pem`). This
  is the only dev path that crosses the network, so it is where parity is
  load-bearing.
- **Net**: prod = verified server-only TLS; dev-local = plaintext-on-bridge
  (justified residual); dev→prod = verified TLS. The single residual is
  dev-local-no-TLS, accepted here and cited at W6.

---

## §8 — Port convention (ratification)

The canonical prod port is **8100** and is **already the live value**
(`docker-compose.prod.yml` nginx `127.0.0.1:${HTTP_PORT:-8100}:80`); the
`project_infra_plan.md` "fourier 8100" target is already met. W2's port work is
**ratification, not a renumber** — this clause records the convention. The stale
`:8091` health-check reference was `deploy.sh`'s, retired by W1; W2 does not
touch it.

---

## §9 — Stratum B — host-gated compose cutover (RECORDED, NOT YET APPLIED)

This section is the **ready-to-apply** procedure for the
`docker-compose.prod.yml` flag-removal + backend CA mount. It is recorded
verbatim and **must not be applied to compose until the host has run
`gen-mongo-certs.sh`** (the spine; inversion forbidden). Line numbers are the
live `docker-compose.prod.yml` at C.W2 authoring (post-C.W5, which added the
`image_blobs` backend volume — these have drifted from `R-tls-spec.md §3`'s
historical `:8/:48/:53` citations; the *anchors* below are exact regardless of
line number).

### The order (do NOT invert)

1. On the deploy host, from `/var/www/fourier-analysis`, run
   `bash scripts/gen-mongo-certs.sh`. Confirm the §4 Gp SAN dump shows all four
   SANs and the issuer is `CN=fourier-internal-ca`.
2. Apply the three compose edits below + the backend CA mount.
3. Deploy (through the W1 pipeline — `git push`; or `docker compose up -d`).
4. **Verify (Gf — the SAN-footgun proof)**: from the app container, a live
   `db.runCommand('ping')` with `tlsCAFile` and **no** invalid-cert flag must
   succeed:

   ```
   docker compose exec backend python -c \
     "from pymongo import MongoClient; \
      print(MongoClient('mongodb://<user>:<pw>@mongo:27017/fourier?authSource=admin&tls=true&tlsCAFile=/etc/ssl/mongo-ca.pem').admin.command('ping'))"
   ```

   (or `mongosh --tls --tlsCAFile /etc/ssl/mongo-ca.pem --eval "db.runCommand('ping').ok"`
   from the mongo container). Capture the transcript to the W2 close record.

### Edit 1 — backend client URI + CA mount (site 1, the `backend` service)

The `MONGO_URI` environment line (currently line 8):

```diff
-      - MONGO_URI=mongodb://${MONGO_USER:-fourier-admin}:${MONGO_PASSWORD:?MONGO_PASSWORD must be set in production}@mongo:27017/fourier?authSource=admin&tls=true&tlsAllowInvalidCertificates=true
+      - MONGO_URI=mongodb://${MONGO_USER:-fourier-admin}:${MONGO_PASSWORD:?MONGO_PASSWORD must be set in production}@mongo:27017/fourier?authSource=admin&tls=true&tlsCAFile=/etc/ssl/mongo-ca.pem
```

The backend `volumes:` block (currently lines 10–14) gains the read-only CA
mount alongside the existing `image_blobs` mount (server-only TLS — the leaf
`mongo.pem` is NOT mounted into the backend):

```diff
     volumes:
       # C.W5: the blob backend, read-write. ...
       - image_blobs:/data/blobs
+      # C.W2: the CA cert, read-only — the client validates the mongod server
+      # cert against this. server-only TLS: NO leaf cert is mounted here.
+      - ./ssl/mongo-ca.pem:/etc/ssl/mongo-ca.pem:ro
```

### Edit 2 — mongod server command (site 2)

Drop the inert `--tlsAllowConnectionsWithoutCertificates` line (currently line
53) from the mongo `command:` array:

```diff
     command: ["mongod", "--tlsMode", "requireTLS",
               "--tlsCertificateKeyFile", "/etc/ssl/mongo.pem",
               "--tlsCAFile", "/etc/ssl/mongo-ca.pem",
-              "--tlsAllowConnectionsWithoutCertificates",
               "--auth"]
```

### Edit 3 — mongosh healthcheck (site 3)

Swap `--tlsAllowInvalidCertificates` for `--tlsCAFile /etc/ssl/mongo-ca.pem` in
the healthcheck `test:` array (currently line 58). The CA already exists in the
mongo container (the existing `:63` mount), so no new mount is needed; the
`localhost`/`127.0.0.1` SANs cover the in-container connect target:

```diff
       test: ["CMD", "mongosh", "-u", "${MONGO_USER:-fourier-admin}", "-p", "${MONGO_PASSWORD:?MONGO_PASSWORD must be set in production}",
              "--authenticationDatabase", "admin",
-             "--tls", "--tlsAllowInvalidCertificates",
+             "--tls", "--tlsCAFile", "/etc/ssl/mongo-ca.pem",
              "--eval", "db.runCommand('ping').ok", "--quiet"]
```

### Post-apply close-gate (after step 4 passes)

```
git grep -nE 'tlsAllowInvalid|tlsAllowConnectionsWithoutCertificates' docker-compose.prod.yml   # → zero
git grep -n  'tlsCAFile=/etc/ssl/mongo-ca.pem' docker-compose.prod.yml                          # → ≥1 (URI)
git grep -n  './ssl/mongo-ca.pem:/etc/ssl/mongo-ca.pem:ro' docker-compose.prod.yml              # → ≥2 (mongo + backend)
```

`api/services/database.py` is **untouched** throughout — `tlsCAFile` rides in
the URI and pymongo applies it; `tz_aware=True` is preserved verbatim (the
B.W3 landmine fix). This is a binding do-not-touch, not merely an absence of
work.
