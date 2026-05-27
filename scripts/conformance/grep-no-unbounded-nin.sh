#!/usr/bin/env bash
set -euo pipefail

# Conformance skeleton — C5.4 / C8.1 (CRUD-CONTRACT §8 / CONFORMANCE-MATRIX.md).
# W3: assert no unbounded $nin over a distinct() set in api/services/. Greps the
# given file(s) for a $nin built from a non-bounded distinct(); whitelists
# predicates annotated as bounded. Exit 0 iff every $nin is annotated bounded.
# Placeholder until W3.

exit 0
