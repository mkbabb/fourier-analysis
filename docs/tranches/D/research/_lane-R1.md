# R1 — CRUD-CONTRACT v2.0.0 design + the `palette_slug` FK contract

## Verdict
RATIFIED-AS-IS

## Authority
- `docs/audits/runs/2026-05-27-D-audit/DA3-valuejs-crud-cohesion.md` — the audit lane (the ~11 divergent clauses, the live `palette-api` v2.0.0 inventory, the value.js-side I.W1–W4 sketch, the colour-lift orthogonality, the `palette_slug` FK).
- `docs/tranches/D/coordination/CRUD-COHESION.md` — the cross-repo ask doc (the two KISS relaxations, the disposition).
- `docs/tranches/B/coordination/CRUD-CONTRACT.md` + `CONFORMANCE-MATRIX.md` + `CRUD-CONSTELLATION.md` — the B-era contract + matrix + the orphan-row carried since the value.js-C retirement.
- `docs/audits/runs/2026-05-27-D-audit/DA2-deferred-chronic-inventory.md` §item-6 + §γ-thread — the C4.5/C4.6 chronic-load-bearing classification.

## Live re-probe results

```
$ curl -sI https://api.color.babb.dev/health 2>&1 | head -3

$ # (no output; exit 35 — TLS handshake failed; verbose probe:)
$ curl -v https://api.color.babb.dev/health 2>&1 | head -15
* Host api.color.babb.dev:443 was resolved.
* IPv4: 104.21.56.22, 172.67.175.252
*   Trying 104.21.56.22:443...
* Connected to api.color.babb.dev (104.21.56.22) port 443
* ALPN: curl offers h2,http/1.1
* (304) (OUT), TLS handshake, Client hello (1):
*  CAfile: /etc/ssl/cert.pem
* LibreSSL/3.3.6: error:1404B410:SSL routines:ST_CONNECT:sslv3 alert handshake failure
* Closing connection
```

Cloudflare resolves `api.color.babb.dev` (it's covered by the `*.babb.dev` wildcard reaching CF edge IPs `104.21.56.22` / `172.67.175.252`) but the TLS handshake fails — no origin is wired behind it. **Expected**: per `coordination/CONSTELLATION-DEPLOY.md §3.2` + `D.md §3` W10 row, the `api.<app>.babb.dev` ingress is the W10 work, not yet live. **R1-impact**: none — R1's contract substrate is *code-shape*, not public-ingress reachability; the live container `palette-api-api-1` is exercised in process by sibling services (per NA1) and that suffices for the v2.0.0 inventory to bind.

```
$ curl -sk -o /dev/null -w "HTTP %{http_code}\n" https://mbabb.fridayinstitute.net/colors/
HTTP 200

$ curl -sk https://mbabb.fridayinstitute.net/colors/ 2>&1 | grep -E "(title|app)" | head -3
    <title>Sudoku - CSP Solver</title>
    <div id="app"></div>
```

The legacy `/colors/` path that NA5 §1 noted as path-proxying to `localhost:8130` (palette-api) is now serving the **Sudoku/CSP Solver SPA** at the public ingress. This is a delta vs the NA5 finding but does **not** invalidate R1 (the binding R1 substrate is the value.js repo v2.0.0 + the FK sites in fourier; the public path-proxy was R3 substrate, not R1's). Cross-lane evidence noted for Wα.b's R3 lane.

```
$ cd /Users/mkbabb/Programming/value.js && git rev-parse HEAD && git log -1 --format='%h %cI %s'
16129e012ef6d4ac08420d55518de986850b190f
16129e0 2026-05-26T13:59:05-04:00 Merge tranche-h into master — Tranche H close (v0.10.0)
```

value.js HEAD `16129e0` (Tranche H close, v0.10.0, 2026-05-26) is one day older than the D-development audit's 2026-05-27 reference — i.e. **value.js has not advanced since the audit**. The ~11-clause divergence list in `DA3 §3` therefore binds verbatim.

```
$ cd /Users/mkbabb/Programming/value.js && cat api/package.json | grep '"version"' | head -1
    "version": "2.0.0",
```

palette-api remains v2.0.0 — confirms `DA3 §1` headline.

```
$ cd /Users/mkbabb/Programming/fourier-analysis && git grep -n "palette_slug" api/models/visualization.py api/lib/crud/etag.py web/src/lib/api.ts
api/lib/crud/etag.py:14:_DEFAULT_FIELDS = ("visibility", "title", "description", "tags", "palette_slug", "updated_at")
api/models/visualization.py:119:    palette_slug: str | None = None
api/models/visualization.py:163:    palette_slug: str | None = None
api/models/visualization.py:177:    palette_slug: str | None = None
web/src/lib/api.ts:41:    palette_slug?: string | null;
web/src/lib/api.ts:65:    palette_slug?: string | null;
web/src/lib/api.ts:73:    palette_slug?: string | null;
```

All FK sites match `DA3 §5` "Critical design notes" §3 verbatim (the audit cited `:119,163,177` for `visualization.py`; the audit cited `etag.py:14`; the audit cited `api.ts:41,65,73`). All three line numbers re-confirm exactly. The FK is unmoved.

```
$ cd /Users/mkbabb/Programming/value.js && grep -n '"id"' api/src/format/palette.ts | head -5
$ # (no matches — TS source uses unquoted `id`; re-probed with unquoted token:)
$ grep -nE '\bid\b' /Users/mkbabb/Programming/value.js/api/src/format/palette.ts | head -10
18:    id: string;
59:        id: String(_id),
```

The probe asked for `"id"` with quotes — the file is TypeScript, the field is unquoted. The substantive finding (top-level `id: string` field on the palette envelope, populated at format time from the Mongo `_id`) is confirmed at lines 18 (type decl) and 59 (population). This is exactly the `DA3 §5` "Critical design notes" §1 citation surface — the v2.0.0 envelope still exposes `id` at the top level.

## palette_slug FK contract clause

**Fourier (the FK holder) guarantees**:
- `Visualization.palette_slug: str | None` — nullable; the visualization may carry no palette association at all (None is the legitimate empty state).
- When non-`None`, the slug conforms to `^[a-z0-9][a-z0-9-]*$` with length ≤ 120 (matches the value.js side's `api/src/format/slug.ts` slug regex; per `DA3 §3` clause C2/C3).
- Uniqueness is **within the `visualization` document scope only** — fourier stores the slug as an *opaque foreign key*; uniqueness within the *palette space* is value.js's invariant, not fourier's.
- Fourier does **not** validate that the slug resolves at write time (no cross-repo round-trip on `POST /visualizations` or `PATCH /visualizations/{slug}`). The slug may become stale if the upstream palette is deleted; fourier carries this as graceful-degradation (the visualization renders with no palette, the frontend shows a "palette unavailable" affordance — not an error).
- The slug is **ETag-participating**: the `_DEFAULT_FIELDS` tuple in `api/lib/crud/etag.py:14` includes `palette_slug`; a slug change rotates the visualization's ETag (mutating the FK is treated as a content change, not metadata).
- The slug is **exposed verbatim** on `GET /visualizations/{slug}` responses (no enrichment, no resolve-and-inline of the palette payload) — the client (`web/src/lib/api.ts:41,65,73`) is responsible for fetching the palette separately via the value.js endpoint.

**Value.js (the palette source-of-truth) guarantees**:
- `GET /palettes/{slug}` returns HTTP 200 with the palette envelope if and only if (a) the palette exists and (b) it is visible to the caller (per the palette's own visibility field — the value.js-side v2.0.0 contract).
- Returns HTTP 404 in all other cases (does not exist, soft-deleted, or visibility denies). Never returns 403 (visibility-denied palettes are indistinguishable from missing ones — same as fourier's contract for visualization visibility, per `B.coordination/CRUD-CONTRACT.md`).
- The slug in the URL is the **stable identity** of the palette — no hash, no version suffix, no DB `_id` in the path. The opaque `id` field on the envelope (`api/src/format/palette.ts:18,59`) is for in-memory client-side ETag / cache keys, *not* for URL construction.
- Slug uniqueness within the palette space is the value.js side's invariant (enforced via a unique index on the value.js Mongo collection).
- Slug **immutability**: once a palette is created with a slug, the slug does not change for that palette's lifetime. A rename produces a new palette (new slug + new identity) — fourier's FK is therefore stable across the palette's lifetime, and a 404 always means the palette was deleted (never "renamed and now lives elsewhere").

**Cross-repo invariant**: the FK is *resolve-only*, not *enforce-at-write*. Fourier never reaches across to value.js on the write path; value.js never reaches across to fourier on any path. The only cross-repo traffic is the read-side (fourier's frontend `web/src/lib/api.ts` fetches `GET /palettes/{slug}` from the value.js public ingress when rendering a visualization). This orthogonality is the load-bearing KISS property of the FK design (`DA3 §5` "Critical design notes" §3).

## C4.5/C4.6 visibility-transition guard disposition

**Verdict: W3 (γ-thread).**

**Rationale**: the guard is an internal-state-machine concern — the `visibility_illegal_transition` helper already exists in fourier's `api/lib/crud/` (per `DA1 §140` + `DA2 §item-6`), the call site is `update_visualization` (the router currently `$set`s visibility unconditionally), and the fix is wholly within the fourier backend; the contract v2.0.0 cohesion work (δ at W5) names *which transitions are allowed* but the *enforcement* is router-local code that does not change the wire shape of any endpoint. The "intersects contract v2.0.0" framing in `D.md §7` is informational (the matrix needs to fill C4.5/C4.6 once landed) rather than load-bearing on the contract itself — the contract clause exists; W3 wires the existing helper into the existing endpoint, and W5/δ records the verdict on the conformance matrix as a post-hoc fill.
