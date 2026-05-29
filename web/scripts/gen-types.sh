#!/bin/bash
# E.W8 T-E2 — Generate `web/src/lib/api-schema.d.ts` from FastAPI's OpenAPI schema.
#
# Per ARCH-TRANSPOSITIONS-E.md T-E2: replaces the hand-mirrored types in
# `web/src/lib/types.ts` with codegen from FastAPI's `/openapi.json`.
#
# Strategy (per Δ-R2.3 + Δ-R3.2): the schema is captured to `api/openapi.json`
# (committed at HEAD) so codegen does NOT require a live backend at build
# time. Re-run this script when the API schema changes (FastAPI auto-derives
# the schema from Pydantic models + router type hints — the snapshot needs
# refreshing only when those change).
#
# Usage:
#     bash web/scripts/gen-types.sh
#
# Output:
#     web/src/lib/api-schema.d.ts  (GENERATED — do not edit)
#
# Then in TypeScript:
#     import type { components } from "@/lib/api-schema";
#     type Visualization = components["schemas"]["Visualization"];
#
# Refresh the snapshot first if the API has changed:
#     uv run --extra web python -c "
#         from api.main import app; import json
#         print(json.dumps(app.openapi(), indent=2, sort_keys=True))
#     " > api/openapi.json

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SCHEMA_PATH="${REPO_ROOT}/api/openapi.json"
OUT_PATH="${REPO_ROOT}/web/src/lib/api-schema.d.ts"

if [ ! -f "$SCHEMA_PATH" ]; then
    echo "ERROR: ${SCHEMA_PATH} not found. Refresh first:"
    echo "  uv run --extra web python -c 'from api.main import app; import json; print(json.dumps(app.openapi(), indent=2, sort_keys=True))' > api/openapi.json"
    exit 1
fi

cd "${REPO_ROOT}/web"
npx --yes openapi-typescript "$SCHEMA_PATH" -o "$OUT_PATH"

# Prepend a GENERATED header (idempotent — replaces any existing prefix
# preceding the openapi-typescript output).
HEADER='/**
 * GENERATED — do not edit.
 *
 * Sourced from `api/openapi.json` (the FastAPI schema snapshot). Re-run
 * `bash web/scripts/gen-types.sh` after refreshing the snapshot:
 *
 *   uv run --extra web python -c "from api.main import app; import json;
 *       print(json.dumps(app.openapi(), indent=2, sort_keys=True))" > api/openapi.json
 *   bash web/scripts/gen-types.sh
 *
 * Consumers: import the `components` namespace and pick a schema by name —
 *   import type { components } from "@/lib/api-schema";
 *   type Visualization = components["schemas"]["Visualization"];
 *
 * E.W8 T-E2 — retires the hand-mirrored types at `web/src/lib/types.ts`
 * (the hand-mirror class of bug is closed structurally; the FastAPI
 * Pydantic models are the canonical source of truth).
 */
'
echo "$HEADER$(cat "$OUT_PATH")" > "$OUT_PATH"

echo "==> Wrote $OUT_PATH"
echo "==> Lines: $(wc -l < "$OUT_PATH")"
