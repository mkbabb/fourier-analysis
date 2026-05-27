# R-tls-spec — the binding MongoDB verified-TLS contract (tranche C)

**Status**: binding contract for C.W2 (thread α — MongoDB TLS). Produced by research lane R3; the audit reasoning is `research/R3-tls.md`. **Authored**: 2026-05-27.
**Binds**: `docker-compose.prod.yml` (sites `:8`, `:48`, `:53`), `docker-compose.yml` (dev MONGO_URI), `api/services/database.py`, `api/config.py`, `.env.example`, and a new `docs/precepts/infra/tls.md`.
**Discharges**: `C.md §2` invariant 19; the `C.md §6` close gate *"no `tlsAllowInvalidCertificates` (all three sites); the verified cert issuer is recorded in `docs/precepts/infra/`."*

W2 is implementation; this spec is the contract it must satisfy. Deviation requires re-opening R3.

---

## §1 — Posture decided (the contract preamble)

- **Mode**: **server-only TLS** with SCRAM-SHA-256 authentication. The client and healthcheck validate the mongod server certificate against a mounted CA; **no client certificate** is presented (R3 §3, Option A). Single-replica preserved (invariant 19; `project_infra_plan.md` does not introduce scaling).
- **Verification**: full — chain validation against the mounted CA + hostname/SAN match. pymongo 4.16's default; achieved by *removing* the three `tlsAllowInvalid*` flags, not by setting a knob. No `tlsAllowInvalidHostnames` middle ground.
- **Trust root**: a **self-signed internal CA** provisioned under §2. The app trusts that CA via `tlsCAFile`; it does not trust the system trust store.

---

## §2 — Cert provisioning + rotation procedure (the W2 pre-condition)

Because provenance is unknown (R3 §2), W2 **re-provisions** rather than reuses. The procedure below is the binding generation contract; it is recorded verbatim (or equivalent) in `docs/precepts/infra/tls.md`, and the recorded **issuer** satisfies the invariant-19 "verified cert issuer recorded" gate. **Only the procedure and the public issuer identity are committed — never the private keys** (`.gitignore:79` `ssl/` stays gitignored; the generated material lives only in `./ssl/` on the deploy host).

### §2.1 — Generate the internal CA (once; long-lived)

```
# CA private key + self-signed CA cert (10-year validity for an internal root)
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -subj "/O=fourier-analysis/OU=infra/CN=fourier-internal-ca" \
  -out mongo-ca.pem
```

The **recorded issuer** (for `docs/precepts/infra/tls.md`) is `CN=fourier-internal-ca, O=fourier-analysis, OU=infra`, self-signed, 4096-bit RSA, SHA-256, 10-year root. This string is what closes the invariant-19 issuer-recording gate.

### §2.2 — Generate the mongod server leaf cert (rotates)

The leaf **must** carry SANs for every name a client uses to reach mongod (R3 §4 — the one footgun):

- `DNS:mongo` — the Docker service name the app container uses (`docker-compose.prod.yml:8` `@mongo:27017`).
- `DNS:localhost` + `IP:127.0.0.1` — the in-container healthcheck and any loopback access (`:53`).
- `DNS:mbabb.fridayinstitute.net` — the public host for documented dev-direct-to-prod access (`deploy.sh:6`, `.env.example:21`; reconcile the two spellings — `friday.institute` in `.env.example:21` vs `fridayinstitute.net` in `deploy.sh:6` — to the live `deploy.sh` value).

```
openssl genrsa -out server.key 4096
openssl req -new -key server.key \
  -subj "/O=fourier-analysis/OU=infra/CN=mongo" \
  -out server.csr
cat > san.ext <<'EOF'
subjectAltName = DNS:mongo,DNS:localhost,IP:127.0.0.1,DNS:mbabb.fridayinstitute.net
extendedKeyUsage = serverAuth
EOF
openssl x509 -req -in server.csr -CA mongo-ca.pem -CAkey ca.key -CAcreateserial \
  -days 825 -sha256 -extfile san.ext -out server.crt
# mongod wants the leaf cert + its private key concatenated into one PEM:
cat server.crt server.key > mongo.pem
```

Place `mongo.pem` (mode 0600) and `mongo-ca.pem` (mode 0644) in `/var/www/fourier-analysis/ssl/` on the deploy host. These are exactly the two paths already bind-mounted (`docker-compose.prod.yml:57-58`). `ca.key` and `server.key` stay on the operator's secure store / the host outside the repo — never committed.

### §2.3 — Rotation cadence

- **Leaf cert** (`mongo.pem`): 825-day validity (browser/industry max for server leaves; comfortable for a yearly-ish ops rotation). Rotation = re-run §2.2 against the same CA, drop the new `mongo.pem` into `./ssl/`, restart the mongo container (or `docker compose up -d mongo`). The CA does not change, so **clients need no change** on leaf rotation.
- **CA** (`mongo-ca.pem`): 10-year root; rotated only on compromise or expiry. CA rotation requires re-issuing the leaf and updating every consumer's mounted `mongo-ca.pem` (app container + healthcheck + any dev copy).
- **The procedure + a rotation-due date** are recorded in `docs/precepts/infra/tls.md`. There is no automated renewal (no certbot/ACME): the network is private and single-host, so a documented manual yearly rotation is the KISS-honest mechanism (invariant 12; `project_infra_plan.md` names no ACME for the internal mongod).

---

## §3 — The exact connection / Motor / compose changes (3-site removal)

### §3.1 — Site 1: client MONGO_URI (`docker-compose.prod.yml:8`)

**From**:
```
MONGO_URI=mongodb://${MONGO_USER:-fourier-admin}:${MONGO_PASSWORD:?…}@mongo:27017/fourier?authSource=admin&tls=true&tlsAllowInvalidCertificates=true
```
**To**:
```
MONGO_URI=mongodb://${MONGO_USER:-fourier-admin}:${MONGO_PASSWORD:?…}@mongo:27017/fourier?authSource=admin&tls=true&tlsCAFile=/etc/ssl/mongo-ca.pem
```

`tlsAllowInvalidCertificates=true` is **deleted**; `tlsCAFile=/etc/ssl/mongo-ca.pem` is **added**. pymongo 4.16 accepts `tlsCAFile` as a URI query option; full verification (chain + the §2.2 SANs, which include `mongo`) then applies.

**The CA must be mounted into the backend container.** It is currently mounted only into mongo (`:57-58`). Add to the prod `backend` service:
```yaml
  backend:
    volumes:
      - ./ssl/mongo-ca.pem:/etc/ssl/mongo-ca.pem:ro
```
(The backend in prod currently declares no `volumes`; this adds the single read-only CA mount. The leaf `mongo.pem` is **not** mounted into the backend — server-only TLS, the client presents no cert.)

### §3.2 — `api/services/database.py` — does it need a `tlsCAFile` param?

**No code change is required** if the CA path travels in the URI (§3.1). `AsyncIOMotorClient(settings.mongo_uri, …)` (`database.py:29`) parses `tlsCAFile` from the connection string; pymongo applies it. The existing line stays:
```python
_client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=5000, tz_aware=True)
```

**Permitted alternative (equivalent, do not do both)**: pass it as a kwarg —
```python
_client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=5000, tz_aware=True, tlsCAFile="/etc/ssl/mongo-ca.pem")
```
The URI-only form (§3.1) is preferred — it keeps the entire connection posture in one configurable string (`api/config.py:9` `mongo_uri`), is environment-driven, and leaves `database.py` untouched. **Contract: carry `tlsCAFile` in the URI; `database.py` is not modified for TLS.** `tz_aware=True` (the B.W3 landmine fix, `database.py:26-29`) is preserved verbatim.

### §3.3 — Site 2: mongod server (`docker-compose.prod.yml:48`)

**Delete** the line `"--tlsAllowConnectionsWithoutCertificates",`. The command becomes:
```yaml
    command: ["mongod", "--tlsMode", "requireTLS",
              "--tlsCertificateKeyFile", "/etc/ssl/mongo.pem",
              "--tlsCAFile", "/etc/ssl/mongo-ca.pem",
              "--auth"]
```
Under SCRAM-only auth (no x509 `CLIENT_CERTIFICATE`), the flag is vacuous (R3 §3) — deletion is the honest discharge; certless SCRAM clients still connect.

### §3.4 — Site 3: healthcheck (`docker-compose.prod.yml:53`)

**From**:
```
"--tls", "--tlsAllowInvalidCertificates",
```
**To**:
```
"--tls", "--tlsCAFile", "/etc/ssl/mongo-ca.pem",
```
mongosh runs inside the mongo container where `/etc/ssl/mongo-ca.pem` already exists (`:58`); it validates the server cert (SAN `localhost`/`127.0.0.1` from §2.2 covers the in-container connect target). No new mount needed.

### §3.5 — Site 4 (latent): `.env.example:21`

**From**:
```
# MONGO_URI=mongodb://fourier-admin:<password>@mbabb.friday.institute:27017/fourier?tls=true&tlsAllowInvalidCertificates=true&authSource=admin
```
**To** (reconcile host to `deploy.sh:6` and add a note about the dev-local CA copy):
```
# MONGO_URI=mongodb://fourier-admin:<password>@mbabb.fridayinstitute.net:27017/fourier?tls=true&tlsCAFile=/path/to/mongo-ca.pem&authSource=admin
# (copy ./ssl/mongo-ca.pem from the deploy host to a local path; the prod cert's
#  SANs cover mbabb.fridayinstitute.net per docs/precepts/infra/tls.md)
```
Not a baseline §1.2 site, but W2 fixes it so the documented developer path is verified-cert (R3 §6 parity).

---

## §4 — The issuer-recording requirement (`docs/precepts/infra/tls.md`)

`docs/precepts/` is a git **submodule** (own `.git`); the `infra/` subdir does not yet exist and is **created** at W2 (`C.md §5`). The new `docs/precepts/infra/tls.md` MUST record, at minimum:

1. **Posture**: server-only TLS + SCRAM-SHA-256, single-replica, private Docker network; verification = full (chain + SAN).
2. **Issuer**: `CN=fourier-internal-ca, O=fourier-analysis, OU=infra` — self-signed internal CA, 4096-bit RSA / SHA-256, 10-year root (§2.1). *This line is the invariant-19 close-gate evidence.*
3. **Leaf SANs**: `mongo`, `localhost`, `127.0.0.1`, `mbabb.fridayinstitute.net` (§2.2) — and the rule that adding a new client connect-name requires re-issuing the leaf.
4. **Provisioning procedure**: the §2 commands (or a `scripts/gen-mongo-certs.sh` they distill to — W2's call; if scripted, the script is committed, the keys it emits are not).
5. **Rotation cadence**: leaf 825 days / manual; CA 10 years / on-compromise; the next-rotation-due date.
6. **Secret discipline**: `ca.key`, `server.key`, `mongo.pem` never committed; `ssl/` stays in `.gitignore` (`:79`). Only `mongo-ca.pem` (public) may be copied to developer machines for the dev→prod path.

A W2 close that sets the flags right but does **not** land this file with the issuer line **fails the gate** (`C.md §6`: *"'TLS enabled' without a verified-cert issuer"* is a named invalid gate).

---

## §5 — prod↔dev parity disposition (binding)

- **Dev-local mongo (`docker-compose.yml:14,32-44`): remains plaintext on the bridge — NAMED, JUSTIFIED RESIDUAL.** Reachable only on `app-network` (never host-published), both endpoints operator-owned; TLS on a loopback bridge buys nothing and would force a per-developer CA prerequisite (R3 §6; invariant 12). The dev `MONGO_URI` (`docker-compose.yml:14`) is **not** given `tls=true`. W6 close cites this disposition so the divergence is explained, not flagged.
- **Dev→prod documented path (`.env.example:21`): brought to verified-cert parity** via §3.5. This is the only dev path that crosses the network, so it is where parity is load-bearing.
- **Net**: prod = verified server-only TLS; dev-local = plaintext-on-bridge (justified); dev→prod = verified TLS. The single residual is dev-local-no-TLS, recorded here as accepted.

---

## §6 — W2 close checklist (this contract's acceptance test)

1. `docker-compose.prod.yml` source contains **zero** `tlsAllowInvalid*` and **zero** `--tlsAllowConnectionsWithoutCertificates` (grep returns nothing). [sites 1,2,3]
2. The client URI carries `tlsCAFile=/etc/ssl/mongo-ca.pem`; the backend service mounts `./ssl/mongo-ca.pem:ro`. [site 1]
3. The healthcheck passes `--tlsCAFile /etc/ssl/mongo-ca.pem`. [site 3]
4. `.env.example:21` uses `tlsCAFile`, host reconciled to `deploy.sh:6`. [site 4]
5. `docs/precepts/infra/tls.md` exists and records the issuer (`CN=fourier-internal-ca`), SANs, procedure, rotation. [invariant-19 gate]
6. Re-provisioned `mongo.pem`/`mongo-ca.pem` on the host carry the §2.2 SANs (including `mongo`) — verified by a live `db.runCommand('ping')` from the app container with `tlsCAFile` and **no** invalid-cert flag. [the SAN footgun, R3 §4]
7. `api/services/database.py` is unchanged for TLS (URI-only); `tz_aware=True` preserved. [§3.2]
8. dev parity disposition (§5) recorded; W6 cites it.

**Achievability**: the invariant-19 close gate is achievable in W2 **conditioned on the §2 provisioning step running first** — the existing undocumented certs cannot satisfy it (R3 §2), but a re-issue under the recorded self-signed-internal-CA procedure can, and needs no new container, dependency, or cost (invariant 12 clean).
