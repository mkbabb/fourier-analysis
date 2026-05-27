# D.Wχ — challenge wave (5 adversarial probes)

**Wave**: Wχ (challenge; 5 adversarial probes; per `D.md §3` Wχ row "2-3 parallel" + the α′ NA-folding's added P5 → 5 probes total, bounded by the 4-agents/wave ceiling via batched dispatch). **Authored**: 2026-05-27 (hardened at Wχ-close from `D.md §3` Wχ row + `PROGRESS.md` row 3 + the 10+6-lane D-development audit substrate). **Opens after**: Wα closed (`waves/Walpha.md` — the four ratification lanes verdicted + the binding `research/README.md` index landed). **Mode**: adversarial review of the Wα-ratified substrate before any implementation commit (Phase 0 discipline, `D.md §4`). **Status on completion**: the binding wave-spec harden (`waves/W*.md` for W1–W12) + the `D.md` reconciliation; the per-probe deliverables (`audit/challenge-P1.md`–`P5.md`) are the evidence. The strict W1 → … → W12 implementation gate opens once this synthesis lands.

This record is the *binding implementation spec* for Wχ. It mirrors `C/audit/challenge.md` in shape: five probe lanes, each interrogating one load-bearing claim from the Wα-ratified substrate, each authoring a `audit/challenge-P<n>.md` deliverable with verdict + binding conditions. The synthesis (this doc, updated at Wχ close) folds the per-probe conditions into the per-wave hard gates of W1–W12. **PASS criteria are honest**: a probe PASSes clean only if no flaw exists; PASS-WITH-CONDITIONS is the expected outcome (C.Wχ found a real flaw in each of its four probes — `C/audit/challenge.md §0`); FAIL re-opens the relevant Wα ratification lane.

---

## Goal criterion

Wχ succeeds if every probe (P1–P5) lands a verdict against the live tree + the Wα-ratified substrate, every condition extracted from the probes is bound into the appropriate implementation-wave hard gates (W1–W12), and the `D.md` reconciliations land via the §X congruence pass (team-lead reconciles centrally — Wχ surfaces, does not edit). The five probes interrogate the load-bearing claims of D as a whole: (P1) does the W1 plan truly avoid co-tenant blast radius on the shared host; (P2) is the migration-with-deploy atomic + rollback-safe on real prod data; (P3) is the CRUD-cohesion KISS — no shared framework, no codegen, inv-16 honoured; (P4) do the β refinements stay refinement (no rebrand) + the γ removals delete only genuinely-dead code; (P5) does the α′ rollout prove on fourier-the-pilot before touching co-tenants + is the DNS change set safe (mail/apex/wildcard preserved) + is the `api.<app>` TLS path real (not a handshake failure).

## Completion criterion (the paired gate)

Wχ closes when:

1. All five probes have a verdict: `PASS` clean, `PASS-WITH-CONDITIONS: <conditions>`, or `FAIL: <reason>` (the third re-opens the relevant Wα lane and blocks Wχ close until the re-research lands).
2. Each probe's deliverable exists at `docs/tranches/D/audit/challenge-P<n>.md` and carries a `file:line` or pasted-SSH-grounded analysis + the per-probe PASS criterion + the extracted conditions.
3. Every condition extracted is **bound** into the appropriate implementation-wave hard gate (W1–W12) via a per-condition row in the synthesis (§7 below) — `<condition> → <wave>.<gate-letter>`, e.g. "P1.C1 → W1.G_co-tenant-isolation".
4. The W1–W12 wave specs harden into `docs/tranches/D/waves/W*.md` folding every binding condition; the `D.md` reconciliations land via the §X congruence pass (team-lead applies centrally).
5. No implementation source change commits before this synthesis lands (Phase 0 discipline maintained through Wχ close).
6. The `D.md §8` brittleness window is **finalised** at Wχ close: either struck (P2 proves the migration-with-deploy is atomic + rollback-safe on real data, so the window has no body) or held provisional with W1 owning its restoration.

Wχ names an honest successor for anything it cannot probe (e.g. a host-coupled probe that requires a mutation Wχ cannot perform read-only — the residual carries to W1 with a recorded verification-design).

---

## §1 — File bounds + scope honesty

Wχ writes **only** the docs below; all under `docs/tranches/D/`:

| File | Action |
|---|---|
| `docs/tranches/D/audit/challenge-P1.md` | **create** (P1 co-tenant blast radius) |
| `docs/tranches/D/audit/challenge-P2.md` | **create** (P2 migration-atomic + rollback-safe) |
| `docs/tranches/D/audit/challenge-P3.md` | **create** (P3 cohesion-KISS) |
| `docs/tranches/D/audit/challenge-P4.md` | **create** (P4 β refines + γ removes only dead) |
| `docs/tranches/D/audit/challenge-P5.md` | **create** (P5 α′ pilot-first + DNS-safe + api-TLS-path-real) |
| `docs/tranches/D/waves/Wchi.md` | this record (the synthesis), updated at close with per-probe verdicts + the conditions-to-waves binding |
| `docs/tranches/D/waves/W1.md` through `W12.md` | **harden** (not Wχ's direct write — separate per-wave hardening waves consume the Wχ conditions; this synthesis lists the bindings) |
| `docs/tranches/D/D.md` | NOT touched (§X congruence findings for team-lead reconcile) |
| `docs/tranches/D/PROGRESS.md` | NOT touched |
| `docs/tranches/D/coordination/*.md` | NOT touched |
| any source under `api/**`, `web/**`, `scripts/**`, `docker-compose*.yml` | NOT touched (Phase 0 discipline; the first source change is W1, post-Wχ) |

**What Wχ does NOT do** (scope honesty, mirrors `C/audit/challenge.md`):
- No source change.
- No host mutation. Every host probe is read-only (`ls`/`cat`/`docker ps`/`ss`/`ufw`/`openssl s_client -connect`/`dig`/`getent`/`curl -sI`/`git -C ... status`); the read-only-write-design discipline carries any host residual to W1 with the verification design recorded.
- No re-research of the Wα-ratified substrate. The probes interrogate the substrate adversarially; they do not re-author it.
- No probe-by-probe extension. Five probes is the binding count per `D.md §3` Wχ row + the α′ NA-folding's added P5. The C.Wχ-shape "four probes" no longer applies (α′ added a fifth surface).

---

## §2 — The five probes (the binding scope per `D.md §3` Wχ row)

Per `D.md §3` Wχ row, exact verbatim quote:

> **P1** (does the deploy plan truly avoid breaking the floridify/palette-api co-tenants — shared dispatcher, Apache ingress); **P2** (is the migration-with-deploy genuinely atomic + rollback-safe on real prod data); **P3** (is the contract v2.0.0 cohesion KISS — no shared framework/codegen, inv-16); **P4** (do the β refinements stay refinement — no rebrand — and the γ removals delete only genuinely-dead code); **P5** (does the α′ rollout prove on fourier-the-pilot before touching co-tenants; is the DNS change set safe — mail/apex preserved; is the `api.<app>` TLS path real — not a handshake failure)

The full probe specs follow (§3.1–§3.5), each binding one probe agent. The five probes share no write paths.

---

## §3 — Per-probe specs

### §3.1 — P1: co-tenant blast radius (shared host + dispatcher + Apache ingress)

**Probe agent**: P1 (one agent).

**Subject** (the Wα-ratified claim under attack): the W1 plan — wire the fourier arm of `/opt/deploy/scripts/dispatch.sh` to invoke the repo-local `scripts/deploy-hook.sh` (C.W1 shape), reconcile the dirty host tree, run the migration-with-deploy, capture the chain transcript + the bad-commit rollback — **does not break floridify or palette-api** (the two co-tenants on the shared host). The Wα-R2 ratification confirmed the dev-era `DA4` findings hold: five compose projects, shared `dispatch.sh` serving four sibling repos, shared Apache, shared `webhook.service` on `*:9000`, shared `:80/:443`. The probe interrogates: does fourier-isolation hold under the planned mutations?

**Read-only adversarial checks** (each authored as a row in `audit/challenge-P1.md`):

1. **The dispatcher fourier-arm-only edit cannot affect sibling-repo arms.** Re-pointing the fourier `case` arm to `exec scripts/deploy-hook.sh` (DA4 §6 Phase 1 step 3) **must** leave the four sibling `case` arms (`mkbabb/words`, `mkbabb/speedtest`, `mkbabb/value.js`, `mkbabb/csp-solver`) byte-identical. Probe: produce the exact `case` arm edit diff (`/opt/deploy/scripts/dispatch.sh` before/after); confirm only the fourier arm changes; confirm no shared helper (the `deploy()` function) is touched. If the planned edit touches the shared `deploy()` body, the probe FAILs and the edit reverts to a thinner arm-only rewrite.
2. **The hook-perm hardening (`0664 → 0600` on `hooks.json` + `/opt/deploy/.env`) does not affect the four sibling-repo arms' invocation.** Probe: confirm the hooks.json's per-arm `match` rules are independent — tightening file perms changes who can *read*/forge the secret, not which arms fire. The four sibling arms remain valid. (Trivial pass; recorded for completeness.)
3. **The HMAC secret rotation (in lockstep with the perm change) does NOT lock out sibling-repo deploys.** The same HMAC secret authenticates every repo's webhook → dispatcher edge. Rotating it means every sibling repo's GitHub webhook config must update to the new secret in lockstep, **or** sibling deploys 401 from the moment of rotation. Probe: confirm the rotation plan includes updating every sibling-repo GitHub webhook config (constellation-flagged); if not, P1 PASSes-WITH-CONDITIONS naming the missing constellation coordination. **Alternative**: per-repo HMAC secrets (the dispatcher's hooks.json supports per-rule secrets). If the rotation can be done per-repo (only fourier rotates), the sibling lockout risk is zero. Probe records the chosen rotation shape + its blast radius.
4. **The fourier Apache vhost edit (the W2 domain split — `api.fourier.babb.dev` vhost added)** must leave the `sudoku.babb.dev` + `words.babb.dev` + `grammar.babb.dev` + the legacy `default-ssl.conf` path-proxies (`/colors/` → `:8130`, `/words*` → `:8001|:3001`) untouched. Probe: read `/etc/apache2/sites-enabled/babb-dev.conf` + `default-ssl.conf` (read-only, NA1 §1.1); produce the exact `<VirtualHost>` addition (the new `api.fourier.babb.dev` stanza per CONSTELLATION-DEPLOY §8.1); confirm no existing vhost is touched; confirm `apachectl configtest` would still pass (validate the diff syntax against the existing config shape).
5. **The fourier Mongo bind change (`0.0.0.0:27017` → `127.0.0.1:27017` or no-publish)** does not affect floridify/palette Mongo binds. Probe: confirm fourier's `docker-compose.prod.yml ports` edit (the `:7017 → 127.0.0.1:` or empty) lands in `/var/www/fourier-analysis/docker-compose.prod.yml` only; the sibling apps' Mongo binds (`/home/mbabb/floridify/docker-compose.prod.yml`, `/home/mbabb/Programming/palette-api/compose.yaml`) are untouched by fourier's commit. The sibling binds remain `0.0.0.0:27018` + `0.0.0.0:27020` until their own constellation-flagged remediation lands (W1 front-loaded across all three Mongos per `D.md §3` W1 row, but each is a separate file edit on a separate host repo).
6. **The UFW withdrawal of `27017/tcp ALLOW IN Anywhere`** does not affect the sibling `27018`/`27019`/`27020` rules unless explicitly tackled. Probe: confirm the planned `sudo ufw delete allow 27017/tcp` is fourier-scoped; the sibling rules require their own withdrawal steps (the `27019` stale rule has no listener so withdrawing it is pure cleanup, harmless); the three sibling withdrawals are constellation-flagged.
7. **The verified-TLS cutover** (the C.W2 `tls.md §9` 3-site diff applied to fourier) does not break floridify/palette Mongo connections. Probe: confirm each sibling Mongo runs its own `requireTLS` + its own `--tlsCertificateKeyFile` (per DA4 §3.4, the three CAs are *independent* self-signed CAs that happen to share the subject string but differ on fingerprint). fourier's CA swap (`mbabb.fridayinstitute.net` → `fourier-internal-ca`) is fourier-only; the sibling CAs are untouched.
8. **The `image_blobs` volume creation** does not collide with any sibling volume name. Probe: `docker volume ls` confirms no existing volume named `image_blobs`; sibling apps use namespaced volume names (`floridify_mongo_data`, `palette-api_mongo-data`, etc., per DA4 §1.3). The volume create is fourier-only.

**PASS criterion** (P1 PASSes when):
- Each of the eight checks above produces an evidence row (`file:line` or pasted SSH);
- No check produces a co-tenant blast-radius finding without a remediation;
- The W1 plan, as scoped against each check, demonstrably touches only fourier-scoped artefacts unless explicitly constellation-flagged (with the host-ops coordination noted).

**Expected outcome**: `PASS-WITH-CONDITIONS` — the conditions name the HMAC-rotation lockstep, the sibling-Mongo-bind constellation coordination, and the UFW sibling withdrawals as **named host-ops residuals proposed-not-imposed** (mirroring C.W1's stratum-A vs stratum-B discipline).

**Conditions to bind** (extracted from the probe; bound into W1 hard gates):
- **P1.C1** — the dispatcher fourier-arm edit is byte-scoped (the diff touches only the `case mkbabb/fourier-analysis)` block; nothing else under `/opt/deploy/`). Bound into **W1.G_dispatch-arm-scoped**.
- **P1.C2** — the HMAC rotation uses per-repo secrets (if the dispatcher supports it) OR the rotation includes a coordinated update of every sibling-repo GitHub webhook config (constellation-flagged residual). Bound into **W1.G_hmac-rotation-shape**.
- **P1.C3** — the sibling Mongo binds (`floridify:27018`, `palette:27020`) are addressed as named constellation-flagged residuals; fourier-D owns only the `27017` bind directly. The W1 row's "FIRST: bind all three Mongos off `0.0.0.0`" framing requires coordinated host-ops on the sibling-app stacks; record honestly. Bound into **W1.G_mongo-bind-fourier-scoped** + **W1.G_sibling-mongo-residual**.
- **P1.C4** — the UFW withdrawal is fourier-scoped (`27017/tcp` only); the sibling rules (`27018`, `27019` stale, `27020`) are coordinated host-ops, not unilateral. Bound into **W1.G_ufw-withdrawal-fourier-scoped** + the named sibling residuals.

**Files** (P1): `docs/tranches/D/audit/challenge-P1.md` (create).

---

### §3.2 — P2: migration-with-deploy atomic + rollback-safe on real prod data

**Probe agent**: P2 (one agent).

**Subject**: the W1 plan — run `api/scripts/migrate_image_blobs.py` as part of the cutover that ships master's code (the C.W5 deletion-proof: the code subscripts `doc["storage_uri"]`, no dual-read; the migration must precede the code that depends on it). The Wα-R2 ratification confirmed the C.W5 atomicity proof (the per-doc cutover: write file → set `storage_uri` → delete inline `blob`, all in one document update — `C/audit/challenge-P3.md`). The probe interrogates: does this hold on real prod data, with the deploy-chain rollback chain, on a shared host?

**Read-only adversarial checks**:

1. **The migration is a no-op against the empty prod DB at first deploy.** DA4 §4.1 measured prod `images.count() = 0` + `visualizations.count() = 0` — there are no inline blobs to relocate. The migration runs cleanly + reports 0 docs migrated. Probe: confirm via the migration script's `--dry-run` mode (or its idempotence: a fresh-DB run is a no-op + records audit). The no-data-at-first-deploy is a *simplification* — D ships the blob backend without a risky data backfill (DA4 §4.1 "the first prod execution… is inherited by D/deploy").
2. **The volume must exist before the first compose `up -d`.** `external: true` (`docker-compose.prod.yml:101-103`) requires `docker volume create image_blobs` first (DA4 §6 Phase 3 step 8). The volume create is host-ops, not in-tree. Probe: confirm the W1 plan executes the volume create *before* the first gated deploy; the deploy-hook itself does not create the volume (no `docker volume create` in `scripts/deploy-hook.sh`). If the plan attempts to deploy without the volume, the backend fails to start + the health gate fails + the rollback fires → restores the pre-deploy SHA (`8818ae5`), the volume still uncreated.
3. **The deploy-hook health gate runs BEFORE the migration.** The C.W1 hook's gate at `${HTTP_PORT:-8100}/api/health` polls for `{"status":"ok"}`; the backend boots with `migrate_image_blobs` NOT yet run. If the backend's startup index builder + the empty DB initialisation handle the no-`storage_uri`-yet case cleanly (an empty `images` collection has no docs to subscript), the gate passes. Probe: confirm `api/main.py`'s startup path does NOT subscript any `images` doc on boot (only the index builder runs); confirm the route subscripts (`images.py:140,159` `doc["storage_uri"]`) are request-time, not boot-time. If a boot-time subscript exists, the deploy fails on an empty DB regardless of migration order — and P2 FAILs.
4. **The migration MUST run in the cutover, not as a separate step.** D.md invariant 2 ("code and migration cut over together"): no environment runs the C.W5 serving code ahead of its migration. Probe: scope where in the deploy-chain the migration runs. Two shapes:
   - **(A)** Pre-deploy: `scripts/deploy-hook.sh` runs `python -m api.scripts.migrate_image_blobs` BEFORE the health gate. Risk: the script runs against the *old* image (pre-A SHA `8818ae5`'s `api/`) — wrong code under a fresh DB shape.
   - **(B)** Post-build, pre-up: `deploy-hook.sh` runs `docker compose run --rm backend python -m api.scripts.migrate_image_blobs` AFTER `build` but BEFORE `up -d`. The script runs in the new image against the live DB.
   - **(C)** Post-up, gate-then-migrate: `up -d` first → gate passes (the empty DB is gate-safe — no `storage_uri` to subscript) → then `docker compose exec backend python -m api.scripts.migrate_image_blobs`. The migration is idempotent + a no-op against empty DB → no risk.
   Probe records the chosen shape + its risk + the rollback semantics. **Recommended (C)** for the first deploy (empty DB makes pre-migration safe); shape (B) for subsequent deploys with data.
5. **Rollback restores the prior SHA + the prior DB state.** The deploy-hook's `git reset --hard $PREV` + rebuild + `up -d` + re-gate restores the *code* to `$PREV`; the migration's per-doc updates (none against an empty DB; potentially many against a populated DB) are NOT auto-reverted. Probe: name the rollback-database-state semantics. For the empty-DB first deploy, this is moot. For subsequent deploys, the migration is one-way: pre-W5 docs are converted to post-W5; rolling back the code reverts to the C.W5 code (which already speaks the migrated shape — no rollback issue) **OR** further back to pre-W5 code (which expects the inline `blob` — rollback past W5 is impossible without a separate down-migration). Record the constraint: **rollback past the W5 SHA is impossible after the migration runs**; the rollback target is the W5-or-later SHA. The first deploy's `$PREV` = `8818ae5` (pre-W5) — so the first deploy's rollback is `8818ae5` (rollback to pre-migration code), which is safe ONLY because the prod DB at `8818ae5` had no inline blobs (it had no images at all). On any subsequent deploy with data, the rollback target must be ≥ W5 SHA.
6. **The "atomic cutover" proof from C.Wχ-P3 holds on prod data.** The proof: a single standalone `mongod` (`prod.yml replicas: 1`, no `--replSet`); a fresh `find_one` per request (`dependencies.py:47-55`, no app-side doc cache); default read concern ⇒ `blob` XOR `storage_uri` holds per-document at every instant. Probe re-confirms: the prod mongo runs `replicas: 1` (DA4 §1.2); `dependencies.py` carries no cache (verify `git grep "_image_cache\|images_cache" api/`); the migration script writes file → `update_one({"blob": ..., "storage_uri": ...})` in one doc update.
7. **The brittleness window is finalised.** `D.md §8` declares the window provisional pending Wχ-P2. P2 either **strikes** the window (if the atomicity proof holds on real data) or **holds it provisional** with W1 owning its restoration. Probe records the finalisation.

**PASS criterion** (P2 PASSes when):
- Each of the seven checks produces evidence (`file:line` or pasted SSH);
- The chosen migration-in-cutover shape (A/B/C) is named + justified;
- The rollback semantics (the rollback-target-≥-W5-SHA constraint) is named;
- The §8 brittleness window verdict is finalised (struck or held provisional with restoration wave).

**Expected outcome**: `PASS-WITH-CONDITIONS` — the conditions name (a) the chosen migration shape; (b) the rollback-target constraint; (c) the §8 finalisation; (d) the post-deploy verification probe (post-deploy `mongosh --eval "db.images.countDocuments({storage_uri: {$exists: false}})"` returns 0 → "no environment runs code ahead of its migration", `D.md §2` invariant 2 testable gate).

**Conditions to bind**:
- **P2.C1** — migration shape (C) chosen for first deploy (empty DB), (B) for subsequent. Bound into **W1.G_migration-shape**.
- **P2.C2** — rollback-target constraint: ≥ W5 SHA. Bound into **W1.G_rollback-target** + recorded in `coordination/`.
- **P2.C3** — post-deploy migration probe: zero unmigrated docs. Bound into **W1.G_post-deploy-migration-probe**.
- **P2.C4** — §8 window verdict (struck — the atomicity proof holds; no dual-read; rollback restores prior build for the empty-DB first deploy). Bound into the `D.md §8` finalisation (team-lead reconciles).

**Files** (P2): `docs/tranches/D/audit/challenge-P2.md` (create).

---

### §3.3 — P3: contract v2.0.0 cohesion is KISS (no shared framework, inv-16)

**Probe agent**: P3 (one agent).

**Subject**: the W5 plan — re-author `CRUD-CONTRACT v2.0.0` with two KISS relaxations (§2 admits user-supplied slugs; §0 binds behaviour not module layout); fourier-side is light (re-author + flip ~88 DEFERRED matrix cells); value.js-side is heavy (the I.W1–W4 sketch, user-re-mandate-gated). The Wα-R1 ratification confirmed the DA3 + CRUD-COHESION findings hold. **Invariant 16 forbids a shared framework / codegen / coordinator** (the B trap — `B-history` + `DA6 §1(c)` + `NA6 §1(d)`). The probe interrogates: does the v2.0.0 design — and the two relaxations — preserve KISS-cohesion-as-contract, not cohesion-as-shared-code?

**Read-only adversarial checks**:

1. **The two KISS relaxations are recorded as contract-behaviour, not framework-coupling.** Probe: the v2.0.0 contract (re-authored in W5) admits user-supplied slugs (§2 relaxation 1) by binding *uniqueness + insert-then-catch retry + shape-floor* (not the word-count); and binds *observable CRUD behaviour* (§0 relaxation 2) — the problem+json envelope shape, the ETag/If-Match semantics, the RateLimit-* header set, the Idempotency-Key on POST, the soft-delete/grace/restore lifecycle — *without* requiring fourier's `api/lib/crud/*.py` module shape or value.js's `api/src/middleware/*.ts` module shape. The two implementations stay independent. **A failure**: the v2.0.0 draft introduces a shared `crud-contract-v2-types.json` or a `npm/PyPI` package both repos import. P3 FAILs that draft, names the inv-16 violation, and the draft re-opens.
2. **`CRUD-CONTRACT.md §10` close-rule remains "both columns PASS"** — but the fourier conformance + the value.js conformance are measured *independently against the contract*, not against each other's code. Probe: confirm the matrix flip mechanism — fourier re-runs its conformance suite (`api/tests/conformance/test_*.py`); value.js authors its own conformance suite (`value.js/api/test/conformance/**`, per DA3 §4 I.W4) — and each repo's PASS column flips on its own suite, not via cross-repo code sharing.
3. **The `palette_slug` FK contract clause is bound by SHAPE + EXISTENCE, not by code-sharing.** Probe: confirm fourier's clause says "fourier stores a string matching `[a-z0-9][a-z0-9-]*` ≤ 120; resolution is value.js's responsibility"; value.js's clause says "value.js's `palette` noun resolves the slug via its own `GET /palettes/{slug}` route returning 200/404 per its visibility rules". No shared HTTP client, no shared validation library, no cross-repo TypeScript type import. Each repo enforces its half of the FK independently.
4. **The colour-lift `sampleToSVGPath` is verified as a value-library item, NOT a cohesion item.** Probe: confirm DA3 §4 "the inverted δ edge is a **library** (`@mkbabb/value.js` at 0.10.0) concern, *orthogonal* to the **palette-api** (v2.0.0) CRUD cohesion this lane audits". The colour-lift rides as a bounded W5 sub-item, fires iff value.js publishes (else stays a named residual). The cohesion thread does NOT entangle with the colour-lift.
5. **No new shared-host artefact emerges from the cohesion thread.** Probe: the cohesion is `CRUD-CONTRACT v2.0.0` (a documentation contract) + the `CONFORMANCE-MATRIX.md` update (a documentation matrix flip) + the optional colour-lift consume (one fourier-side import change). No new shared container, no new shared DB, no new shared queue, no new shared API gateway.
6. **The value.js-side execution is value.js's tranche, not fourier's.** Probe: confirm `D.md §3 W5` row "value.js-side execution is a value.js tranche (user-re-mandate-gated) — D authors the fourier side + the cross-repo contract"; confirm the fourier-D commits do NOT include any change under `value.js/`. Cross-repo cohesion is achieved by *two independent tranches* meeting at a shared contract, not by fourier-D writing value.js code.

**PASS criterion** (P3 PASSes when):
- The two relaxations are recorded as behaviour-bindings, not framework-couplings;
- The matrix-flip mechanism is independent-per-repo;
- The `palette_slug` FK clause is shape-and-existence, not code-sharing;
- The colour-lift orthogonality holds;
- No new shared artefact emerges;
- The value.js-side is named as a separate tranche (user-re-mandate-gated).

**Expected outcome**: `PASS-WITH-CONDITIONS` — the conditions name (a) the binding "no shared framework/codegen" clause in the v2.0.0 contract preamble (replacing the C-era `CRUD-CONTRACT.md §9` "no shared code" certification with a v2.0.0-era re-certification); (b) the per-repo matrix-flip discipline; (c) the colour-lift's bounded-sub-item carve.

**Conditions to bind**:
- **P3.C1** — v2.0.0 contract preamble re-certifies inv-16 (no shared framework/codegen/coordinator). Bound into **W5.G_inv16-preamble**.
- **P3.C2** — per-repo matrix flip (fourier flips its column on its conformance suite; value.js flips its column on its own conformance suite). Bound into **W5.G_per-repo-matrix-flip**.
- **P3.C3** — colour-lift as bounded sub-item (one fourier-side import change, gated on value.js publishing `sampleToSVGPath` in `@mkbabb/value.js`). Bound into **W5.G_colour-lift-bounded**.
- **P3.C4** — value.js-side execution recorded as value.js tranche (user-re-mandate-gated). Bound into **W5.G_valuejs-tranche-gated** + `coordination/` ask.

**Files** (P3): `docs/tranches/D/audit/challenge-P3.md` (create).

---

### §3.4 — P4: β refinements stay refinement (no rebrand) + γ removes only genuinely-dead code

**Probe agent**: P4 (one agent).

**Subject**: the W3 + W4 plans — γ deletes the backend `snapshot_hash` band (the `flags` field+index + 9 admin sites + the dead `snapshots`/`gallery` boot indexes) + the dead `gallery` stratum (`_entry_from_doc` + `GalleryEntryResponse` + 9 indexes) + the untyped image-asset shim → typed Pydantic model; β resurrects `.cartoon-card` (one shim → 14 components un-flattened) + resolves the upload IA (one hero dropzone + slim source-strip) + resolves the gallery orphans (mount marquee or delete both) + light-mode contrast token sweep + `:focus-visible` rings. Probe interrogates: is every γ deletion genuinely dead (no live consumer) + does every β change stay refinement (not rebrand)?

**Read-only adversarial checks**:

1. **Every γ deletion has a verified-dead grep.** Probe — re-run each grep against HEAD at execution-time (the Wα ratification confirmed dev-era grep results, but probe re-confirms before deletion):
   - `git grep -nE "_entry_from_doc|GalleryEntryResponse" api/` — confirm only `gallery.py` defines them; no consumer in `admin.py` (DA1 §3.1 confirmed; re-probe).
   - `git grep -nE "gallery\.(insert|update|replace)" api/` — confirm zero outside `test_migrate_integration.py` (DA1 §3.1).
   - `git grep -nE "db\.snapshots\.(?!find)" api/` — confirm only `database.py:67-69` (the dead indexes) + `migrate_visualization.py` reads.
   - `git grep -nE "snapshot_hash" api/` — confirm the 9 `admin.py` sites + `database.py:125-126` + the model fields (DA1 §1.1).
   Each grep result is pasted into `audit/challenge-P4.md` as the deletion-justification evidence. **A failure**: a grep surfaces a live consumer P4 didn't catch — the deletion is paused; the consumer's intent is recorded; either the consumer is also dead (extended deletion) or the γ plan is re-scoped.
2. **The dead `snapshots` indexes (`database.py:67-69`) are safely droppable.** Probe: confirm no live code reads from `db.snapshots` outside `migrate_visualization.py` (a one-shot host-residual run, DA1 §1.1). Dropping the unique-`snapshot_hash` index does not affect any live insert/update. **A subtlety**: the existing prod DB at `8818ae5` already has these indexes built (DA4 §4.1 confirmed pre-A schema with `snapshots`, `gallery`, GridFS); after deletion of the `init_db` block, fresh DB inits won't recreate them. Existing prod DB's `snapshots` collection (empty per DA4 §4.1) + its indexes are harmless leftovers — γ can either (a) leave the empty collection + indexes on the live DB and let them be ignored, or (b) explicitly drop them as a one-shot migration step. Probe records the chosen disposition.
3. **The typed-asset transposition (`image_storage.py:189-199 image_bytes(asset: dict)` → `image_bytes(asset: ImageAsset)`)** does not break any caller. Probe: re-grep `git grep -nE "image_bytes\(" api/` for all call sites; confirm each call site's `asset` argument is converted to the typed model (or — better — the call sites are updated to pass the typed model directly). **The hardening clause** from `DA1 §3.3` + the validation-matrix `KeyError: 'storage_uri'` finding (`validation-matrix.md §2`): `api/routers/images.py:140,159` should resolve through the typed shim so a pre-migration doc degrades to a clean 404/410 (not a 500). The probe confirms this is part of W3's plan.
4. **`.cartoon-card` resurrection is one-shim-or-migrate, NOT a redesign.** Probe: read the W4 plan; confirm the chosen mechanism is either (a) a `@utility cartoon-card { @apply cartoon-surface; … }` shim in `web/src/style.css` lifting all 14 consumers at once OR (b) the 14 consumers are migrated to `<Card surface="cartoon">`. Either is refinement (the visual outcome is identical to pre-glass-ui-bump). **A failure**: the W4 plan introduces a *new* surface treatment (a different border, a different shadow, a different radius) — that's rebrand, not refinement. P4 FAILs that plan and the W4 re-scopes.
5. **The upload IA change is one-hero + slim-source-strip (the A2 #A2-01 finding), NOT a third upload paradigm.** Probe: confirm the W4 plan keeps the existing three affordance *plumbing* (canvas-clickable, panel `ImageUpload`, global drag-overlay) and only de-emphasises two of them (the panel demotes to a source-strip when no image; the canvas placeholder is the hero). No new file input, no new dropzone library, no new modal-based uploader. Refinement.
6. **The gallery orphans decision is "mount or delete", NOT a third refactor.** Probe: confirm the W4 plan either mounts `GalleryMarquee` as a living empty-state band (the A3 #1 recommendation, "let the marquee earn the empty state") OR deletes both `GalleryMarquee.vue` + `GalleryGrid.vue` (both confirmed dead via DA1's grep). No "extract to a shared library" middle ground.
7. **The light-mode contrast token sweep is a TOKEN edit + drop the `/60`/`/70` modifiers, NOT a colour-system overhaul.** Probe: confirm the W4 plan targets (a) the glass-ui `--viz-amber` / `--section-color-5` light values (one token-rung lift) — coordinate with glass-ui as a token carry; (b) the three `#f0b632` hardcodes → `var(--viz-amber)`; (c) drop the `text-foreground/35`, `text-muted-foreground/60`, `text-muted-foreground/70` opacity modifiers in favour of the base muted token. No new palette, no new colour system.
8. **The `:focus-visible` rings are added per the AppHeader pattern (`AppHeader.vue:174-177`)**, not as a new design language. Probe: confirm the planned `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }` lifts existing token usage; no new focus-ring colour or style.
9. **The `GalleryCard` keyboard-accessibility lift is a control conversion (`role="button"`, `tabindex="0"`, `@keydown.enter.space`, `aria-label`), NOT a new modal-pattern.** Probe: confirm the W4 plan migrates the existing card click handler to a keyboard handler too; the `GalleryCardModal` re-points onto the glass-ui `<Dialog>` primitive already used for the batch + flagged confirms. Refinement, not redesign.

**PASS criterion** (P4 PASSes when):
- Every γ deletion has a verified-dead grep at execution-time;
- Every β change is recorded as a refinement (no new surface treatment, no new colour system, no new IA paradigm);
- The typed-asset transposition's hardening clause (`images.py:140,159` resolve through the typed shim) is bound into W3.

**Expected outcome**: `ACCEPTED-WITH-STRENGTHENING` — mirroring `C/audit/challenge.md §0` P4 (the strengthened-grep-and-tests verdict that surfaced for C.W4 γ). The strengthenings: add a deletion-proof grep per γ removal (G3-style — anti-alias, anti-new-cast); a binding shape-test per β refinement (axe light-mode keystone clean; cartoon-card class lives or `git grep cartoon-card` zero on the 14 consumers).

**Conditions to bind**:
- **P4.C1** — every γ deletion carries its own grep-zero gate (`git grep snapshot_hash api/` → zero on identity paths; `git grep _entry_from_doc api/` → zero; `git grep GalleryEntryResponse api/` → zero; `git grep -E "db\.snapshots|db\.gallery" api/` → zero outside the migration/tests). Bound into **W3.G_grep-zero-per-deletion**.
- **P4.C2** — every β refinement carries its own shape-test (axe light-mode pass clean on `/equation`, `/morph`, `/visualize`, `/gallery`, `/paper`; `git grep "class=\"cartoon-card\"" web/src` → zero IF the migration shape was chosen, OR `getComputedStyle('.cartoon-card').borderWidth !== '0px'` IF the shim was chosen). Bound into **W4.G_shape-test-per-refinement**.
- **P4.C3** — the typed-asset transposition hardens `images.py:140,159` (route subscripts) to resolve through the typed shim → clean 404/410 on a pre-migration doc, NOT 500. Bound into **W3.G_typed-shim-hardening**.
- **P4.C4** — the W3 plan records the dead-`snapshots`-indexes-on-live-DB disposition (drop one-shot or leave-as-harmless). Bound into **W3.G_dead-collection-disposition**.

**Files** (P4): `docs/tranches/D/audit/challenge-P4.md` (create).

---

### §3.5 — P5: α′ rollout proves on fourier-the-pilot before touching co-tenants + DNS-safe + api-TLS-path-real

**Probe agent**: P5 (one agent).

**Subject**: the α′ thread — `<app>.babb.dev` / `api.<app>.babb.dev` normalization across the constellation, fourier as the pilot (W1/W2/W9 prove end-to-end), then bounded-parallel rollout (W10/W11) to co-tenants; programmatic DNS via the CF API (W8); the api-`<app>` TLS path resolved to grey-cloud + origin LE (CONSTELLATION-DEPLOY §3.2); CF token NOT rotated (per user). Wα-R3 + R4 ratified the plan + the substrate (NA1–NA6). Probe interrogates: (a) does the rollout truly prove on fourier first (no big-bang); (b) is the DNS change set safe (mail / apex / wildcard preserved); (c) is the api-TLS path real (not a handshake failure when `certbot --expand` adds the api SANs to the live LE cert)?

**Read-only adversarial checks**:

1. **The fourier pilot is end-to-end-proven BEFORE any sibling-app touch.** Probe: confirm `D.md §3` orders (a) W1 (security hotfix + first prod deploy — fourier backend); (b) W2 (verified-TLS + domain split — fourier frontend `fourier.babb.dev` + backend `api.fourier.babb.dev` end-to-end); (c) W9 (CF-Pages frontend migration — fourier `web/` first); THEN W10 (sibling api.<app> ingress + CORS + LE expansion) + W11 (palette-api → color rename, user-re-mandate-gated). No sibling-app cutover happens before the fourier triple (W1+W2+W9) is recorded green via the W6 ε prod matrix. **A failure**: the plan permits a sibling cutover before the fourier matrix green. P5 FAILs and the plan re-sequences.
2. **The DNS change set preserves Google MX + SPF TXT (mail) + the Squarespace apex + the `*.babb.dev` wildcard.** Probe (read-only `dig`):
   ```
   dig MX babb.dev          # confirm Google MX records preserved
   dig TXT babb.dev          # confirm SPF TXT preserved
   dig A   babb.dev          # confirm apex points to Squarespace (198.185.159.144 — NA3 §3.3)
   dig NS  babb.dev          # confirm CF NS records preserved
   dig A   foo.babb.dev      # confirm `*.babb.dev` wildcard still resolves (catch-all)
   ```
   Each output is pasted into `audit/challenge-P5.md`. The W8 DNS-as-code script (the thin idempotent CF-API script — NA3 §5) MUST honour the don't-break list (`CONSTELLATION-DEPLOY.md §5`); the probe confirms by reading the script's intended record set + comparing against the current zone. **A failure**: the script's planned record set would overwrite or break any of MX / SPF / apex A / NS / wildcard. P5 FAILs and the script re-scopes.
3. **The `certbot --expand` DNS-01 challenge is provable end-to-end before the api.fourier.babb.dev vhost goes live.** Probe (the api-TLS-path-real check, the §3.2 resolution's load-bearing claim):
   - Confirm the live cert exists: `ls /etc/letsencrypt/live/sudoku.babb.dev/` + `openssl x509 -in /etc/letsencrypt/live/sudoku.babb.dev/fullchain.pem -noout -text | grep -A1 "Subject Alternative Name"` shows the existing SANs (`sudoku.babb.dev`, `fourier.babb.dev`, `words.babb.dev`, per NA5 §0).
   - Confirm the CF token has DNS-01 perms (`Zone:DNS:Edit` on the babb.dev zone). The token is in `fourier-analysis/.env` (`0600`, gitignored); the probe does NOT use the token, just confirms its perm-shape was recorded at NA6 §2 (`Zone:DNS:Edit` is in the user-supplied list).
   - Confirm certbot is configured for DNS-01 (or can be): the planned `certbot --expand --dns-cloudflare -d sudoku.babb.dev -d fourier.babb.dev -d words.babb.dev -d api.fourier.babb.dev …` invocation depends on the `certbot-dns-cloudflare` plugin or a `dns-01` hook. Probe verifies whether the plugin is installed on the host (`dpkg -l | grep cloudflare` or `certbot plugins`).
   - **A subtlety**: the current cert is `CN=sudoku.babb.dev` + the three SANs — but the host's Apache vhost for `fourier.babb.dev` already serves this cert (NA5 §1.1 confirms). Adding `api.fourier.babb.dev` to the SAN list does not break the existing vhost (the cert is multi-SAN; Apache + SNI resolve correctly). The risk is: a botched `certbot --expand` could *replace* the cert with a fresh one that LE rate-limits if hit during testing (LE limits: 5 duplicate certs per week per domain). Probe records the rate-limit-aware sequence.
   - **A failure**: the live host does NOT have the certbot-cloudflare plugin and the `certbot --expand` command would fail with "no DNS plugin available" → the api-TLS path is not real until the plugin is installed (a host-ops install step). P5 PASSes-WITH-CONDITIONS naming the plugin-install host-ops prereq.
4. **The grey-cloud A record for `api.fourier.babb.dev` lands BEFORE the certbot run.** Probe: the `certbot --dns-cloudflare` DNS-01 challenge writes a `_acme-challenge.api.fourier.babb.dev` TXT record using the CF token's `Zone:DNS:Edit` perm; for the challenge to succeed, the parent zone must accept the TXT write. Confirm the W8 DNS-as-code script writes the `api.fourier.babb.dev` A record (grey-cloud, DNS-only) FIRST; the `certbot --expand` then issues the SAN. **A subtlety**: actually, LE's DNS-01 challenge does not require the A record to pre-exist — only the `_acme-challenge.<domain>` TXT — so the A record can land *after* the cert is issued. But the Apache vhost only goes live (publicly reachable) after the A record exists + the cert covers the domain + the vhost is config-reloaded. Probe records the ordering: (a) `certbot --expand` adds api.* SANs via DNS-01 → (b) W8 DNS-as-code script lands the api.* A records (grey-cloud) → (c) W10 adds the Apache vhost + reloads → (d) `api.<app>` is live.
5. **The pilot triple (W1+W2+W9) is recorded green via W6 ε prod matrix BEFORE W10 fires.** Probe: confirm `D.md §3` row "W6 — Test integrity" precedes W10 in the implementation sequence (W6 is "after the deploy", `D.md §3` table footer). The matrix records (fourier × local/dev/prod) green or each red cell named-with-cause; the prod cell green is the pilot-proven gate that unblocks W10's sibling-app cutovers.
6. **The CF token is NOT rotated** (per user direction); the probe re-confirms NA6 §2 + CONSTELLATION-DEPLOY §6 + `D.md §3 W12` row. **A subtlety**: the token-not-rotated rule means the rotation-on-suspicion is the only rotation trigger; W12 close re-confirms.
7. **The big-bang trap.** Probe: confirm the implementation plan never permits "roll the recipe to all five apps in one wave". The bounded-parallel rule (NA6 §3 + `D.md §3` Wχ row P5) caps the parallelism at 4 agents/wave (DA6 §5), with each sibling cutover being its own arm in the W10 wave. The "never a big-bang" rule (CONSTELLATION-DEPLOY §7) holds.

**PASS criterion** (P5 PASSes when):
- The fourier pilot is end-to-end-proven before any sibling-app touch;
- The DNS change set preserves the don't-break list;
- The `certbot --expand` DNS-01 path is real (the cloudflare plugin is installed on the host, or its install is a named host-ops prereq);
- The grey-cloud A record + cert + vhost ordering is recorded;
- The W6 prod matrix gates the W10 sibling cutovers;
- The CF token rotation rule holds;
- No big-bang.

**Expected outcome**: `PASS-WITH-CONDITIONS` — the conditions name (a) the certbot-cloudflare plugin install host-ops prereq (if not installed); (b) the A-record-then-cert-then-vhost ordering for each api.`<app>`; (c) the W6 matrix-green gate for W10; (d) the dig-based don't-break verification at every DNS change.

**Conditions to bind**:
- **P5.C1** — fourier pilot triple (W1+W2+W9) precedes any sibling cutover (W10); W6 matrix green gates W10. Bound into **W10.G_pilot-precedes-rollout** + **W6.G_matrix-gates-W10**.
- **P5.C2** — DNS-as-code script honours the don't-break list (MX/SPF/apex/NS/wildcard); the live dig output before + after every DNS commit is captured. Bound into **W8.G_dont-break-verified**.
- **P5.C3** — `certbot --expand` uses the cloudflare plugin (host-ops install prereq named if absent); the DNS-01 challenge succeeds without rate-limit; the api-TLS path is verified live with `openssl s_client -connect api.fourier.babb.dev:443 -servername api.fourier.babb.dev` returning a valid chain. Bound into **W10.G_certbot-expand-real** + **W10.G_api-tls-live-ping**.
- **P5.C4** — A-record (grey-cloud) → cert (`certbot --expand`) → vhost (Apache) → reload ordering, per api-app cutover. Bound into **W10.G_ordering**.
- **P5.C5** — CF token NOT rotated (per user); rotation only on suspicion. Bound into **W12.G_cf-token-not-rotated**.
- **P5.C6** — no big-bang; each sibling cutover is its own arm in W10 (bounded-parallel). Bound into **W10.G_no-big-bang**.

**Files** (P5): `docs/tranches/D/audit/challenge-P5.md` (create).

---

## §4 — Agent dispatch (5 probes; batched against the 4-agents/wave ceiling)

Per `D.md §3` Wχ row "2-3 parallel" + the α′ NA-folding's added P5 → 5 probes total. The 4-agents/wave ceiling (DA6 §5 + NA6 §3) bounds parallelism. Dispatch shape:

**Batch 1** (4 agents, parallel — P1 + P2 + P3 + P4):
- These four probes share no write paths (each owns `audit/challenge-P<n>.md`).
- They share no live-host probe path that requires serialisation (P1's dispatcher read, P2's mongo + volume read, P3's grep, P4's `git grep` are all read-only + independent).
- Each closes on its own PASS criterion.

**Batch 2** (1 agent, after Batch 1 — P5):
- P5's `certbot --expand` plugin check + the `openssl s_client` api-TLS-path check + the DNS dig sequence is a single agent's work; it benefits from running after P1's co-tenant-blast-radius findings land (P5 cites P1's sibling-isolation analysis for the W10 rollout).

**Why not 5-parallel?** The 4-agents/wave ceiling is a binding precept (DA6 §5 + NA6 §3; carried from C's discipline). The two-batch shape preserves the ceiling without serialising the four independent probes. P5 alone in the second batch is the KISS choice.

**Disjointness**:
- P1: `audit/challenge-P1.md`.
- P2: `audit/challenge-P2.md`.
- P3: `audit/challenge-P3.md`.
- P4: `audit/challenge-P4.md`.
- P5: `audit/challenge-P5.md`.

The synthesis (this doc) updates at Wχ close with the conditions-to-waves binding table (§7 below).

---

## §5 — Hard-gate ledger

| # | Gate | How proven |
|---|---|---|
| Wχ-G1 | All five probes have an `audit/challenge-P<n>.md` deliverable | `test -f docs/tranches/D/audit/challenge-P{1..5}.md` |
| Wχ-G2 | Each probe records a verdict (`PASS` / `PASS-WITH-CONDITIONS: <conditions>` / `FAIL: <reason>`) | `git grep -nE "^## Verdict" docs/tranches/D/audit/challenge-P*.md` returns 5 |
| Wχ-G3 | Every extracted condition is bound into a per-wave hard gate | the synthesis §7 below carries the conditions-to-waves binding table; every condition has a target gate |
| Wχ-G4 | The `D.md §8` brittleness window is finalised at Wχ close | P2's verdict carries the §8 finalisation (struck or held provisional); the team-lead reconciles `D.md §8` via the §X congruence pass |
| Wχ-G5 | The W1–W12 wave specs harden into `docs/tranches/D/waves/W*.md` folding every binding condition | a follow-up harden pass (one agent per wave, post-Wχ close) consumes this synthesis's binding table; W1/W2/W3/W4/W5/W6/W8/W9/W10/W11/W12 each carry their conditions; gate proven by `ls docs/tranches/D/waves/W*.md` (excluding W0/Wα/Wχ) + the per-wave hard-gate ledger citing the bound conditions |
| Wχ-G6 | No source change in this wave | `git diff --stat HEAD~1 HEAD -- 'api/**' 'web/**' 'scripts/**' 'docker-compose*.yml'` returns zero |
| Wχ-G7 | No host mutation | every host probe in any `challenge-P<n>.md` uses read-only commands; no `chmod`, no `apt install`, no `docker volume create`, no `git reset`, no Apache reload (those are W1+ host-ops) |

---

## §6 — Out of scope (Phase 0 discipline)

- **No source file touched.** The first source change is W1, post-Wχ. The Phase 0 discipline (`D.md §4`) holds through Wχ close.
- **No host mutation.** Every host probe is read-only.
- **No re-research of Wα.** The probes interrogate Wα's ratified substrate adversarially; they do not re-author it.
- **No new wave / no new probe.** Five probes (P1–P5) is the binding count per `D.md §3 Wχ` row.
- **No CF token usage.** Probes that examine the token's perm shape do so by reading the user-supplied list in `NA6 §2` + `CONSTELLATION-DEPLOY §6`; the token itself is not invoked.
- **No `D.md` edit / no `PROGRESS.md` edit / no `coordination/*.md` edit.** Wχ surfaces incongruences in §X; team-lead reconciles centrally.

---

## §7 — The conditions-to-waves binding table (the binding synthesis output)

This table is the binding output of Wχ — every condition extracted from the five probes is bound into a per-wave hard gate that W1–W12 must honour. Authored at Wχ close once per-probe verdicts land.

| Condition | Source probe | Bound into wave + gate |
|---|---|---|
| Dispatcher fourier-arm edit byte-scoped (the diff touches only `case mkbabb/fourier-analysis)` block) | P1.C1 | W1.G_dispatch-arm-scoped |
| HMAC rotation shape (per-repo secret OR coordinated sibling-config update) | P1.C2 | W1.G_hmac-rotation-shape |
| Mongo-bind fourier-scoped (`27017` only); sibling binds named as constellation residuals | P1.C3 | W1.G_mongo-bind-fourier-scoped + W1.G_sibling-mongo-residual |
| UFW withdrawal fourier-scoped (`27017/tcp` only); sibling rules as residuals | P1.C4 | W1.G_ufw-withdrawal-fourier-scoped |
| Migration shape (C) for first deploy (empty DB), (B) for subsequent | P2.C1 | W1.G_migration-shape |
| Rollback-target constraint: ≥ W5 SHA | P2.C2 | W1.G_rollback-target + `coordination/` |
| Post-deploy migration probe: zero unmigrated docs | P2.C3 | W1.G_post-deploy-migration-probe |
| §8 brittleness window finalisation (struck — atomicity holds) | P2.C4 | `D.md §8` reconcile (team-lead) |
| v2.0.0 contract preamble re-certifies inv-16 (no shared framework) | P3.C1 | W5.G_inv16-preamble |
| Per-repo matrix flip discipline | P3.C2 | W5.G_per-repo-matrix-flip |
| Colour-lift as bounded sub-item (gated on value.js publish) | P3.C3 | W5.G_colour-lift-bounded |
| value.js-side execution recorded as separate value.js tranche (user-gated) | P3.C4 | W5.G_valuejs-tranche-gated + `coordination/` |
| Every γ deletion has its own grep-zero gate | P4.C1 | W3.G_grep-zero-per-deletion |
| Every β refinement has its own shape-test (axe-clean + cartoon-card lives) | P4.C2 | W4.G_shape-test-per-refinement |
| Typed-asset transposition hardens `images.py:140,159` to clean 404/410 | P4.C3 | W3.G_typed-shim-hardening |
| Dead `snapshots`-indexes-on-live-DB disposition recorded | P4.C4 | W3.G_dead-collection-disposition |
| fourier pilot triple (W1+W2+W9) precedes any sibling cutover (W10) | P5.C1 | W10.G_pilot-precedes-rollout + W6.G_matrix-gates-W10 |
| DNS-as-code script honours don't-break list (MX/SPF/apex/NS/wildcard) | P5.C2 | W8.G_dont-break-verified |
| `certbot --expand` cloudflare-plugin host-ops prereq + DNS-01 + api-TLS live ping | P5.C3 | W10.G_certbot-expand-real + W10.G_api-tls-live-ping |
| A-record → cert → vhost → reload ordering per api-app | P5.C4 | W10.G_ordering |
| CF token NOT rotated (per user) | P5.C5 | W12.G_cf-token-not-rotated |
| No big-bang (each sibling cutover its own arm in W10) | P5.C6 | W10.G_no-big-bang |

The follow-up harden pass authors W1/W2/W3/W4/W5/W6/W8/W9/W10/W11/W12 wave specs folding every gate above. This wave's spec (`Wchi.md`) lists the bindings; the per-wave files materialise them.

---

## §8 — Dependencies + ordering

- **Depends on**: Wα closed (`waves/Walpha.md` — the four ratification lanes verdicted + the binding `research/README.md` index landed); W0 closed (`waves/W0.md` — the baseline); the 10+6-lane D-development audit landed (immutable substrate).
- **Blocks**: every implementation wave W1–W12 — the wave specs harden from this synthesis's conditions-to-waves binding table; no implementation commits before Wχ closes.
- **Independent of**: no other wave runs in parallel with Wχ (per `D.md §3`: the W0 → Wα → Wχ research-first gate is strictly sequenced).

---

## §9 — Verification artefacts (what Wχ commits)

- `docs/tranches/D/audit/challenge-P1.md` through `challenge-P5.md` — the five per-probe deliverables.
- `docs/tranches/D/waves/Wchi.md` — this synthesis, updated at close with per-probe verdicts + the conditions-to-waves binding table.
- The `D.md §8` brittleness window finalisation (struck or held provisional) — team-lead reconciles `D.md` centrally via the §X congruence pass.
- The follow-up `docs/tranches/D/waves/W{1..12}.md` (excluding 0/α/χ) per-wave hardened specs (a separate harden pass post-Wχ; gates listed in §7 above bind those specs).
- `git diff --stat` of the Wχ commit shows only `docs/tranches/D/audit/**` + `docs/tranches/D/waves/Wchi.md` modified; **no source change**.

---

## §10 — Archaeology

Wχ at D mirrors `C/audit/challenge.md` in shape (per-probe deliverables + a synthesis + a conditions-to-waves binding table) but interrogates a fundamentally different substrate. C.Wχ probed a research-wave-produced set of greenfield contracts (`R-storage-spec`, `R-deploy-spec`, `R-tls-spec`, the janitor + reload sketches); D.Wχ probes a ratified substrate that already absorbed a 10+6-lane audit. The probes are therefore *narrower* + *more grounded* — they don't ask "is the storage backend choice correct" (settled at C.Wα); they ask "does the W1 plan avoid co-tenant blast radius" (a specific, measurable adversarial claim about an already-chosen approach).

The five-probe count (vs C's four) is driven by the α′ thread's addition: P5 (the constellation rollout + DNS + api-TLS-path-real) is a new surface the C-era audit did not interrogate. The 4-agents/wave ceiling is preserved by the two-batch dispatch (Batch 1 = P1+P2+P3+P4; Batch 2 = P5 alone).

The expected verdict per probe is `PASS-WITH-CONDITIONS` — the C.Wχ rule that "all four landed PASS-WITH-CONDITIONS" (none clean, none FAIL) is the honest precedent. The conditions are the implementation-wave hard gates; the binding table is the synthesis's load-bearing output.

---

## §11 — Summary

Wχ runs five adversarial probes (P1–P5) against the Wα-ratified substrate, each interrogating one load-bearing claim of D as a whole: P1 (W1 truly avoids co-tenant blast radius on the shared host — the dispatcher arm, the Apache vhost, the Mongo bind, the UFW withdrawal, the TLS CA swap, the volume create, all fourier-scoped or constellation-flagged); P2 (the migration-with-deploy is atomic + rollback-safe on real prod data — empty DB at first deploy simplifies; rollback-target-≥-W5 constraint named; §8 window finalisation); P3 (the v2.0.0 contract cohesion is KISS — two relaxations admit user-supplied slugs + behaviour-not-layout; no shared framework/codegen; per-repo matrix flip; the colour-lift bounded; value.js-side a separate tranche); P4 (β stays refinement — one-shim or migrate for `.cartoon-card`, one-hero + slim-strip upload IA, mount-or-delete gallery orphans, token-sweep contrast, focus-rings — and γ deletes only genuinely-dead code — every grep-zero verified at execution-time; typed-asset transposition hardens the route subscripts to clean 404/410); P5 (the α′ rollout proves on fourier first — W1/W2/W9 → W6 matrix-green → W10/W11; DNS preserves MX/SPF/apex/NS/wildcard; api-TLS path real via `certbot --expand` DNS-01 with the cloudflare plugin; CF token NOT rotated; no big-bang). The synthesis (§7) binds every extracted condition into a per-wave hard gate; the follow-up harden pass materialises W1–W12 wave specs. The `D.md §8` brittleness window is finalised (P2's verdict). No source change; no host mutation; Phase 0 discipline holds. The strict W1 → … → W12 implementation gate opens on Wχ close + the harden pass.

---

## §X — Congruence findings (for team-lead reconcile)

The following incongruences between this wave spec and `D.md` / `PROGRESS.md` / `coordination/*.md` were surfaced during Wχ authoring. Do NOT edit centrally from here; team-lead reconciles.

1. **`D.md §3` Wχ row lists "2-3 parallel" + 5 probes (P1–P5)** — the probe count (5) exceeds the parallel cap (3 or, ceiling, 4) named in the row. Wχ's §4 above resolves by batching (4-parallel P1+P2+P3+P4, then 1-parallel P5). Reconcile: `D.md §3` Wχ row should be updated to say "**5 probes, dispatched in two batches respecting the 4-agents/wave ceiling**" or similar; the current "2-3 parallel" text is internally inconsistent with the 5-probe list. Same finding raised in `W0.md §X` against the same row.

2. **`PROGRESS.md` row Wχ lists only "P1 co-tenant blast radius (floridify/palette-api untouched); P2 migration-with-deploy atomic + rollback-safe on real data; P3 cohesion is KISS (no shared framework, inv-16); P4 β stays refinement / γ deletes only dead code"** — i.e. four probes, not five. `D.md §3` Wχ row lists five (the P5 for α′ added later). Reconcile: `PROGRESS.md` row Wχ should be updated to list P5 (α′ pilot-first + DNS-safe + api-TLS-path-real).

3. **The Phase numbering** — `D.md §4` lists Phases 0/I/II/III/IV/V/VI but only six phases (0=research+challenge; I=production; II=convergence completion + transposition; III=design refinement; IV=cross-repo cohesion; V=test integrity; VI=close). The α′ thread's waves (W8/W9/W10/W11) don't fit a phase label. Reconcile: either add a Phase VII for α′ constellation deployment normalization, or fold it into Phase I (extending "production" to cover the constellation rollout), or fold W8/W9/W10/W11 between Phase I (W1/W2 fourier pilot) and Phase VI (close), interleaved with III/IV/V. Current `D.md §4` Phase VI "close (W7)" still references the phantom W7 (see also `W0.md §X.1`).

4. **The W3 + W4 disjointness claim** (`D.md §3` table footer + W3 row + W4 row) — "W3 ∥ W4 — disjoint files. W5 (δ) is research-gated + cross-repo." Wχ-P4's grep-zero verification per γ deletion + the typed-asset transposition (W3) and the cartoon-card shim + the IA resolution + the contrast sweep + focus-rings (W4) are genuinely file-disjoint (`api/**` vs `web/src/**`). **NO incongruence** — recording for completeness; the parallelism holds.

5. **The `coordination/CRUD-COHESION.md` says fourier-side "already conforms" (its §4)** — and the v2.0.0 re-author is light on the fourier side (just the two relaxations + the matrix flip + the ask record). The probe P3 confirms this. Wχ-G7 + the W5 hardening will need to confirm "fourier already conforms" survives the v2.0.0 re-author (the new clauses ARE the existing clauses, just relaxed). Reconcile: the W5 hard-gate ledger should include a "fourier conformance suite still 14/14 green under the v2.0.0 contract" gate.

6. **The `certbot` plugin install** — P5.C3 names `certbot-dns-cloudflare` plugin as a possible host-ops prereq. The `D.md §3` W10 row mentions "certbot LE on the mbabb server we control" without naming the DNS-01 plugin install. Reconcile: `D.md §3` W10 row should mention the plugin install prereq (or confirm it's already installed via a probe-time check).

7. **The `D.md §3` W1 row "**FIRST**: bind all three Mongos off `0.0.0.0`"** frames the Mongo bind as fourier-D-owned for all three apps. The Wχ-P1.C3 + P1.C4 analysis shows fourier-D owns only the fourier bind directly; the floridify + palette binds are constellation-flagged (touch sibling-app stacks). Reconcile: `D.md §3` W1 row should differentiate "FIRST: bind fourier's Mongo off `0.0.0.0` + coordinate the sibling Mongo binds (floridify, palette) as constellation residuals". The current framing implies fourier-D unilaterally edits all three apps' compose files, which violates the C5/C6 stratum-A vs stratum-B discipline.

8. **The `D.md §3` W2 row "the staged `C/infra/*` + the deploy precept + **the `<app>.babb.dev`/`api.<app>.babb.dev` naming precept** promoted into `docs/precepts/infra/`"** — three precepts. The submodule edit shape from C (in-submodule commit + gitlink bump) carries; recording for clarity that W2's submodule pass adds three files (`tls.md` reaffirmed + `blob-backend-dr.md` re-promoted + the deploy precept reaffirmed + the new naming precept).

9. **The `D.md §3` table footer "**The α′ constellation waves W8–W11 follow the fourier pilot** — W1/W2 + W9 prove the full pattern on fourier first**"** — this is the load-bearing P5 claim. Wχ-P5.C1 confirms the ordering. **NO incongruence** — recording for completeness.

10. **The PROGRESS.md row "Wχ" notes "P4 β stays refinement / γ deletes only dead code"** without naming the typed-asset transposition explicitly. The typed asset is a γ-thread transposition (per `D.md §3` W3 row "(retires the `dict` shim that caused C9/C10)") and a Wχ-P4 verification target. Reconcile: PROGRESS.md row Wχ P4 should mention "typed asset shim hardens images.py to clean 404/410" as part of the verification.

End of Wχ.
