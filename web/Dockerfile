FROM node:22-slim AS base
WORKDIR /app

FROM base AS deps
COPY web/package.json web/package-lock.json ./
# The @mkbabb/* deps resolve from the npm registry (^semver pins). The former
# file:./vendor/*.tgz seams (the D.W1 Docker-build unblock) were retired by the
# 163ca47 deps migration once glass-ui/value.js/keyframes.js published to npm.
# That migration left a stale `COPY web/vendor ./vendor` here which broke every
# Docker build (web/vendor no longer exists) — removing it is the deploy unblock.
RUN npm ci

FROM deps AS development
COPY web/ .
CMD ["npm", "run", "dev", "--", "--host", "--port", "3000"]

FROM deps AS builder
ARG VITE_API_URL=/api
ARG VITE_BASE_URL=/fourier/
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_BASE_URL=${VITE_BASE_URL}
COPY web/ .
# Assets needed by the paper figures (symlink won't resolve in Docker)
COPY assets/ public/assets/
# Paper source + compiled artifacts needed by vite-plugin-latex-paper at build time
COPY paper/fourier_paper.tex paper/fourier_paper.bib \
     paper/fourier_paper.aux paper/fourier_paper.log \
     paper/fourier_paper.toc paper/fourier_paper.bbl /paper/
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
# X·F F.W9 (G-F9-19) — ONE Cache-Control, not two. Measured as-running against
# api.fourier.babb.dev/assets/index-YfdYiI2C.js on 2026-09-19, this location was
# emitting the header TWICE: `expires 1y` synthesises its own
# `Cache-Control: max-age=31536000` (plus an `Expires:` date) and the
# `add_header` beside it appended a second `Cache-Control: public, immutable`.
# Two headers for one directive is a policy stated by two authorities inside a
# single config — caches are entitled to combine them, and an intermediary that
# takes only the first silently loses `immutable`. One `add_header` now carries
# the whole policy. `always` keeps it on error responses too.
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location ~* \\.(?:js|css|woff2|png|jpg|svg)$ {\n\
        add_header Cache-Control "public, max-age=31536000, immutable" always;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# X·F F.W9 (M.W2) — the image's own LIVENESS contract: is this nginx up and
# serving the built SPA? It says nothing about the API edge, which is a
# different container asking a different question. busybox wget ships in
# nginx:alpine, so no package is added to run a healthcheck; the request writes
# nothing, which matters under the overlay's read_only root FS. `retries` is
# bounded so an unhealthy container ENDS `compose up --wait` non-zero rather
# than hanging it — the deploy hook's rollback depends on that termination.
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
