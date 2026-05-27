#!/usr/bin/env bash
set -euo pipefail

# Conformance skeleton — C2.3 (CRUD-CONTRACT §2 / CONFORMANCE-MATRIX.md).
# W3: assert no check-then-insert slug pattern exists in api/routers/ — i.e. no
# find_one(...slug...) adjacent to generate_slug(); collisions are handled by
# DuplicateKeyError only. Exit 0 iff zero matches; emit "OK: 0 matches in api/"
# on success. Placeholder until W3.

exit 0
