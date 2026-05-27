#!/usr/bin/env bash
# gen-mongo-certs.sh — provision the MongoDB verified-TLS material (tranche C.W2).
#
# This is the committed distillation of R-tls-spec.md §2.1–§2.2: it generates a
# self-signed internal CA (CN=fourier-internal-ca) and a mongod server leaf
# carrying the mandatory SAN set, then concatenates the leaf cert + key into the
# single PEM mongod's --tlsCertificateKeyFile wants. The SCRIPT is tracked; the
# KEYS it emits are NOT — everything lands under ./ssl/, which is gitignored
# (.gitignore:79). Only mongo-ca.pem (the public CA cert) is shareable; ca.key,
# server.key, and mongo.pem never enter the repo.
#
# POSTURE: server-only TLS + SCRAM-SHA-256. The client presents NO certificate;
# this script issues ONLY a server leaf (no client cert, no mutual TLS). No
# ACME, no certbot — a private single-host internal CA, rotated manually per the
# cadence recorded in docs/tranches/C/infra/tls.md (leaf 825d, CA 10y).
#
# THE SAN FOOTGUN (R-tls-spec.md §2.2 / R3-tls.md): full verification matches the
# server cert's Subject Alternative Names against the name the client connects to.
# The leaf MUST carry every connect-name or the next prod deploy's verified
# connection is rejected. The four mandatory SANs are baked in below; adding a
# new connect-name means re-issuing the leaf (re-run this script).
#
# USAGE: run ON the deploy host, from the repo root, so it writes into the same
# ./ssl/ that docker-compose.prod.yml bind-mounts into the mongo container:
#
#     bash scripts/gen-mongo-certs.sh
#
# then verify the SANs landed (the Gp sub-gate):
#
#     openssl x509 -in ./ssl/mongo.pem    -noout -text | grep -A1 'Subject Alternative Name'
#     openssl x509 -in ./ssl/mongo-ca.pem -noout -subject
#
# The CA cert and leaf are placed with their contract modes (mongo-ca.pem 0644,
# mongo.pem 0600). After provisioning, apply the host-gated compose cutover
# recorded in docs/tranches/C/infra/tls.md (Stratum B), deploy, and confirm the
# live db.runCommand('ping') from the app container with tlsCAFile and NO
# invalid-cert flag succeeds.

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration — the binding constants from R-tls-spec.md §2. Do not relax.
# ---------------------------------------------------------------------------
SSL_DIR="${SSL_DIR:-./ssl}"

CA_KEY="${SSL_DIR}/ca.key"           # CA private key — NEVER committed
CA_CERT="${SSL_DIR}/mongo-ca.pem"    # CA public cert — the only shareable artefact
SERVER_KEY="${SSL_DIR}/server.key"   # leaf private key — NEVER committed
SERVER_CSR="${SSL_DIR}/server.csr"   # leaf CSR — transient, NEVER committed
SERVER_CERT="${SSL_DIR}/server.crt"  # leaf cert — transient, folded into mongo.pem
SERVER_PEM="${SSL_DIR}/mongo.pem"    # leaf cert+key concat — NEVER committed
SAN_EXT="${SSL_DIR}/san.ext"         # leaf SAN extension file — transient

CA_SUBJECT="/O=fourier-analysis/OU=infra/CN=fourier-internal-ca"
LEAF_SUBJECT="/O=fourier-analysis/OU=infra/CN=mongo"

# The SAN footgun — every name a client uses to reach mongod (R-tls-spec.md §2.2):
#   DNS:mongo                     — the Docker service name the app uses (@mongo:27017)
#   DNS:localhost / IP:127.0.0.1  — the in-container healthcheck + loopback
#   DNS:mbabb.fridayinstitute.net — the public host for documented dev-direct-to-prod
LEAF_SANS="DNS:mongo,DNS:localhost,IP:127.0.0.1,DNS:mbabb.fridayinstitute.net"

CA_DAYS=3650   # 10-year internal root (R-tls-spec.md §2.1)
LEAF_DAYS=825  # leaf rotation cadence — the browser/industry max (R-tls-spec.md §2.3)
KEY_BITS=4096  # 4096-bit RSA throughout

# ---------------------------------------------------------------------------
# Pre-flight.
# ---------------------------------------------------------------------------
if ! command -v openssl >/dev/null 2>&1; then
  echo "FATAL: openssl not found on PATH." >&2
  exit 1
fi

mkdir -p "${SSL_DIR}"

# ---------------------------------------------------------------------------
# Step 1 — the internal CA (CN=fourier-internal-ca). Idempotent-ish: if a CA
# already exists we keep it (re-issuing it would invalidate every consumer's
# mounted mongo-ca.pem). Warn loudly before clobbering on explicit FORCE_CA.
# ---------------------------------------------------------------------------
if [[ -f "${CA_KEY}" || -f "${CA_CERT}" ]]; then
  if [[ "${FORCE_CA:-0}" == "1" ]]; then
    echo "WARN: FORCE_CA=1 — OVERWRITING the existing CA at ${CA_CERT}." >&2
    echo "WARN: every consumer's mounted mongo-ca.pem must be replaced after this." >&2
  else
    echo "An existing CA was found at ${SSL_DIR}/ — reusing it (the leaf will be"
    echo "re-issued against it). To regenerate the CA itself, re-run with FORCE_CA=1"
    echo "(this invalidates every already-distributed mongo-ca.pem)."
  fi
fi

if [[ ! -f "${CA_KEY}" || ! -f "${CA_CERT}" || "${FORCE_CA:-0}" == "1" ]]; then
  echo "==> Generating internal CA (${KEY_BITS}-bit RSA, ${CA_DAYS}-day root)..."
  openssl genrsa -out "${CA_KEY}" "${KEY_BITS}"
  openssl req -x509 -new -nodes -key "${CA_KEY}" -sha256 -days "${CA_DAYS}" \
    -subj "${CA_SUBJECT}" \
    -out "${CA_CERT}"
fi

# ---------------------------------------------------------------------------
# Step 2 — the mongod server leaf, signed by the CA, carrying the SAN set.
# Always re-issued: this is the rotating artefact (R-tls-spec.md §2.3).
# ---------------------------------------------------------------------------
echo "==> Generating mongod server leaf (${KEY_BITS}-bit RSA, ${LEAF_DAYS}-day)..."
openssl genrsa -out "${SERVER_KEY}" "${KEY_BITS}"
openssl req -new -key "${SERVER_KEY}" \
  -subj "${LEAF_SUBJECT}" \
  -out "${SERVER_CSR}"

cat > "${SAN_EXT}" <<EOF
subjectAltName = ${LEAF_SANS}
extendedKeyUsage = serverAuth
EOF

openssl x509 -req -in "${SERVER_CSR}" \
  -CA "${CA_CERT}" -CAkey "${CA_KEY}" -CAcreateserial \
  -days "${LEAF_DAYS}" -sha256 -extfile "${SAN_EXT}" \
  -out "${SERVER_CERT}"

# mongod's --tlsCertificateKeyFile wants the leaf cert + its key in one PEM.
cat "${SERVER_CERT}" "${SERVER_KEY}" > "${SERVER_PEM}"

# ---------------------------------------------------------------------------
# Step 3 — contract modes + transient cleanup. mongo-ca.pem 0644 (public),
# mongo.pem 0600 (carries the private key). Drop the transient CSR / SAN file /
# split leaf — mongo.pem is the single artefact mongod consumes.
# ---------------------------------------------------------------------------
chmod 0644 "${CA_CERT}"
chmod 0600 "${CA_KEY}" "${SERVER_KEY}" "${SERVER_PEM}"
rm -f "${SERVER_CSR}" "${SERVER_CERT}" "${SAN_EXT}"

echo
echo "==> Done. Material written to ${SSL_DIR}/ (gitignored — keys are NOT committed):"
echo "      mongo-ca.pem  (0644, public CA cert — the only shareable artefact)"
echo "      mongo.pem     (0600, leaf cert + key — bind-mounted into mongo)"
echo "      ca.key        (0600, CA private key — keep on the operator's secure store)"
echo "      server.key    (0600, leaf private key)"
echo
echo "==> Verify the SAN set landed (the Gp sub-gate):"
echo "      openssl x509 -in ${SERVER_PEM} -noout -text | grep -A1 'Subject Alternative Name'"
echo "      openssl x509 -in ${CA_CERT} -noout -subject"
