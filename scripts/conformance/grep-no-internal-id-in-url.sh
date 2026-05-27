#!/usr/bin/env bash
set -euo pipefail

# Conformance skeleton — CS6.2 (SCHEMA §1 / CONFORMANCE-MATRIX.md).
# W3: assert no internal id appears in any URL path — greps router/route path
# declarations under api/routers/ (and web/src/) for ObjectId or content-hash
# patterns in path arguments (_id, session tokens, content hashes). Exit 0 iff
# zero matches. Placeholder until W3.

exit 0
