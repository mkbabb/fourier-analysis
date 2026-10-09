# .deploy/edge — the edge's upstream pins

`scripts/deploy-hook.sh` writes one `<svc>.conf` here per switched upstream
(`set $<svc>_upstream <container>:<port>;`); `nginx/fourier.conf` includes them
from `/etc/nginx/fourier-upstreams/` (bind-mounted `:ro` by
`docker-compose.prod.yml`). The pins are host state and gitignored.

This directory is tracked so that `git checkout` / `git reset` creates it as
the deploy user. Left to the Docker daemon, a missing bind source is created
root-owned, and the hook (which runs as the deploy user) could never write a
pin — every switch would be refused.
