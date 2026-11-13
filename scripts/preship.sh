#!/usr/bin/env bash
# preship.sh — the Playwright suite, run on the workstation before a ship.
#
# Owner order 2026-11-13: no Playwright in any GitHub Action. This is what the
# former `e2e-tests` CI job ran: the chromium + mobile-chromium projects
# against a backend under COMPUTE_RATE_LIMIT=1000 (scripts/e2e.sh boots it and
# a local Mongo must be up). The honest-red producer-held set is expected red
# and reports only: run it by hand with `npx playwright test --project=honest-red`
# from web/ against the same stack when needed.
#
#   bash scripts/preship.sh
set -euo pipefail

cd "$(dirname "$0")/.."
G="$HOME/.claude/guard/guarded"
export COMPUTE_CONCURRENCY=1

"$G" --timeout 90 -- bash scripts/e2e.sh --project=mobile-chromium --workers=1
