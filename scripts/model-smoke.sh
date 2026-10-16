#!/usr/bin/env bash
# F.REL .m — container smoke: the production image extracts contours under the
# production backend's own hardening (read_only: true, tmpfs /tmp, cap_drop ALL,
# no-new-privileges) and its own memory cap (deploy.resources.limits.memory,
# swap forbidden; F.REL .mem), read from docker-compose.prod.yml rather than
# restated here, and with NO network, so a model that was not baked into the
# image at build time cannot be fetched at runtime: the smoke fails instead.
# Every portrait in assets/portraits is extracted in ONE process, as the
# long-lived API serves them, and each on a FRESH worker thread (one event
# loop per image): the API runs an extraction on whichever executor thread is
# idle, and what one thread's allocator keeps must not add up across threads
# (MALLOC_ARENA_MAX in api/Dockerfile). The cgroup's peak memory is printed at
# the end.
#
#   scripts/model-smoke.sh              # build the production stage, then smoke
#   IMAGE=<tag> SKIP_BUILD=1 scripts/model-smoke.sh   # smoke an existing image
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="${IMAGE:-fourier-backend:model-smoke}"
PORTRAITS="$ROOT/assets/portraits"
cd "$ROOT"

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  docker build -f api/Dockerfile --target production -t "$IMAGE" .
fi

# The backend's hardening as the production compose declares it. MONGO_PASSWORD
# is required by the prod overlay's interpolation only; nothing connects here.
FLAGS=()
while IFS= read -r flag; do FLAGS+=("$flag"); done < <(
  MONGO_PASSWORD=model-smoke docker compose -f docker-compose.yml -f docker-compose.prod.yml \
    config --format json backend |
  python3 -c '
import json, sys
backend = json.load(sys.stdin)["services"]["backend"]
if backend.get("read_only") is not True:
    sys.exit("docker-compose.prod.yml backend is not read_only: true")
print("--read-only")
for mount in backend.get("tmpfs", []):
    print(f"--tmpfs={mount}")
for cap in backend.get("cap_drop", []):
    print(f"--cap-drop={cap}")
for opt in backend.get("security_opt", []):
    print(f"--security-opt={opt}")
memory = backend.get("deploy", {}).get("resources", {}).get("limits", {}).get("memory")
if not memory:
    sys.exit("docker-compose.prod.yml backend declares no memory limit")
print(f"--memory={memory}")
print(f"--memory-swap={memory}")
'
)
echo "hardening: ${FLAGS[*]} --network=none"

docker run --rm "${FLAGS[@]}" --network=none \
  -v "$PORTRAITS:/smoke/portraits:ro" \
  "$IMAGE" uv run --no-sync python -c '
import asyncio, os, sys
from pathlib import Path
from fourier_analysis.contours import ContourConfig
from fourier_analysis.contours.ml import model_dir
from api.services.computation import compute_contours

home = Path.home()
assert not os.access(home, os.W_OK), f"HOME {home} is writable"
limit = Path("/sys/fs/cgroup/memory.max").read_text().strip()
print(f"model dir: {model_dir()} · HOME {home} read-only · memory.max {limit}")
assert limit != "max", "the container runs without a memory cap"
ok = True
for path in sorted(Path("/smoke/portraits").iterdir()):
    result = asyncio.run(compute_contours(path, ContourConfig()))
    points = sum(c["n_points"] for c in result["contours"])
    print(f"{path.name}: contours {result['"'"'n_contours'"'"']} · points {points}", flush=True)
    ok &= result["n_contours"] > 0 and points > 0
peak = int(Path("/sys/fs/cgroup/memory.peak").read_text()) / 2**20
print(f"cgroup memory.peak: {peak:.0f} MB of {int(limit) / 2**20:.0f} MB")
sys.exit(0 if ok else 1)
'
echo "model-smoke: PASS"
