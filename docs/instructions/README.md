# Instructions

Read `docs/precepts/instructions/` first. Local fourier-analysis rules:

- Fourier-analysis is both a Python math/figure package and an interactive web
  demo/API. Preserve numerical correctness before UI polish.
- Python work uses `uv`: `uv sync --extra dev`, `uv run pytest`,
  `uv run ruff check`, and `uv run mypy` where applicable.
- Web/API work may use `uv sync --extra web`, Docker compose files, and the
  `web/` Vite app. Record which surface a gate exercises.
- Figure and reconstruction changes must compare generated artefacts or tests,
  not just source formulas.
- Web visual or interaction changes require browser evidence. API changes
  require focused endpoint or service tests.
- Production deploy files (`docker-compose.prod.yml`, nginx config, env
  examples) are local operational surfaces; edit them only in waves that own
  deployment behavior.
