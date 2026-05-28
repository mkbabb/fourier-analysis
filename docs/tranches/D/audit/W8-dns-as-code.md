# W8 — DNS-as-code — close record

**Wave**: D.W8 (thread α′ — constellation deployment normalization; the DNS layer)
**Agent**: W8-DNS-as-code (single agent — script authoring + live run + audit)
**Date**: 2026-05-27 / 2026-05-28 (UTC straddle)
**Status**: **PARTIAL — script authored + idempotent + secret-free; live run HALTED at zone resolution due to token/account ownership mismatch. Honest STOP per charter discipline.**

---

## §0 — Headline

The `scripts/dns-cf-sync.sh` reconciler is authored, syntactically validated, idempotent by construction (POST-or-PATCH-or-SKIP per target), don't-break-safe by construction (loop iterates targets, never zone listing), secret-free (reads `CLOUDFLARE_API_TOKEN` via env, never argv, never echoed). The script ran to first network call, fail-fast aborted at zone resolution with a clear `[FATAL] could not resolve zone id for babb.dev` — and stopped per the charter's "do not retry blindly" discipline.

**Root cause** (probed three ways): the `.env` token is valid against `/accounts` (returns 1 account: `Mike7400@gmail.com's Account`, id `07119f33…0c76`), but `/zones?name=babb.dev` returns `{success:true, result:[]}` — i.e., the token's account does not own the babb.dev zone. The babb.dev zone is delegated to `jillian/maciej.ns.cloudflare.com` (live `dig babb.dev NS` confirms), so a different Cloudflare account holds it. The token cannot be used to write DNS for babb.dev.

**Don't-break list**: **UNCHANGED — byte-identical pre and post.** No CF write succeeded, so by construction nothing on the zone moved. Baseline `dig` is captured in §2; post-state matches (the script's only network call was a read).

**Successor required**: either (a) issue a CF API token from the account that owns the babb.dev zone (with `Zone:DNS:Edit` on babb.dev + `Zone:Zone:Read` on babb.dev — the minimal-honest subset per `CONSTELLATION-DEPLOY.md §6.1`) and re-source `.env`, or (b) transfer the babb.dev zone to the account that holds the present token. Either resolves W8 with one re-run of the already-authored script. **No code change needed.**

---

## §1 — Deliverables

| Item | Path | State |
|---|---|---|
| Reconciler script | `scripts/dns-cf-sync.sh` | authored, `chmod +x`, `bash -n` syntax-OK, secret-free, don't-break header present |
| Target record set | inline in `scripts/dns-cf-sync.sh` (8 tuples: 4 PROXIED CNAMEs + 4 grey-cloud A) | declared |
| `.env` discipline | `/Users/mkbabb/Programming/fourier-analysis/.env` mode `0600`, gitignored | verified |
| Baseline dig | §2 below + `/tmp/w8-baseline-dig.txt` | captured 2026-05-28T00:10:18Z |
| Post-run dig | §3 below — IDENTICAL to baseline (no writes succeeded) | captured |
| Close record | this file | authored |

**Target tuples (declared in `scripts/dns-cf-sync.sh:103-112`):**

| Type | Name | Content | Proxied | Source |
|---|---|---|---|---|
| CNAME | `fourier.babb.dev` | `fourier.pages.dev` | **true** (orange) | W8.md §2.3 + charter expansion |
| A | `api.fourier.babb.dev` | `34.197.214.67` | **false** (grey) | W8.md §2.3 pilot tranche |
| CNAME | `color.babb.dev` | `color.pages.dev` | **true** | charter expansion (was W9-gated in W8.md §2.3) |
| A | `api.color.babb.dev` | `34.197.214.67` | **false** | W8.md §2.3 pilot tranche |
| CNAME | `sudoku.babb.dev` | `sudoku.pages.dev` | **true** | charter expansion (was W9-gated in W8.md §2.3) |
| A | `api.sudoku.babb.dev` | `34.197.214.67` | **false** | W8.md §2.3 pilot tranche |
| CNAME | `keyframes.babb.dev` | `keyframes.pages.dev` | **true** | charter expansion (was W9-gated in W8.md §2.3) |
| A | `deploy.babb.dev` | `34.197.214.67` | **false** (grey) | **NEW — webhook URL fix per WEBHOOK-URL-RESIDUAL.md** (Wα-Δ-R4.1 + W1 residual) |

Charter expansion note: the in-conversation charter explicitly broadened W8 scope from the W8.md "pilot tranche only" (just the api A records) to the **full record set** (all four CF-Pages CNAMEs + all three api A records + the new `deploy.babb.dev`). The script reflects the charter, not the W8.md staging — per the user's note that "the actual `<app>.pages.dev` target won't exist yet ... CF accepts CNAME with non-existent target. The W9 cutover creates the Pages projects + the CNAME starts resolving."

---

## §2 — Baseline dig (pre-W8, captured 2026-05-28T00:10:18Z)

```
--- babb.dev A (apex) ---
198.185.159.144

--- babb.dev MX ---
5 alt1.aspmx.l.google.com.
1 aspmx.l.google.com.
10 alt3.aspmx.l.google.com.
5 alt2.aspmx.l.google.com.
10 alt4.aspmx.l.google.com.

--- babb.dev TXT ---
"v=spf1 include:_spf.google.com ~all"

--- babb.dev NS ---
maciej.ns.cloudflare.com.
jillian.ns.cloudflare.com.

--- nonexistent-zzqq.babb.dev (wildcard probe) ---
185.199.109.153
185.199.110.153
185.199.111.153
185.199.108.153

--- fourier.babb.dev ---
185.199.111.153
185.199.110.153
185.199.108.153
185.199.109.153

--- api.fourier.babb.dev ---
185.199.109.153
185.199.111.153
185.199.108.153
185.199.110.153

--- color.babb.dev ---
104.21.56.22
172.67.175.252

--- api.color.babb.dev ---
172.67.175.252
104.21.56.22

--- sudoku.babb.dev ---
104.21.56.22
172.67.175.252

--- api.sudoku.babb.dev ---
185.199.111.153
185.199.109.153
185.199.110.153
185.199.108.153

--- keyframes.babb.dev ---
104.21.56.22
172.67.175.252

--- words.babb.dev ---
104.21.56.22
172.67.175.252

--- grammar.babb.dev ---
104.21.56.22
172.67.175.252

--- deploy.babb.dev ---
104.21.56.22
172.67.175.252
```

**Observations on baseline (NA3 §1.4 corroborated + extended):**

- **Don't-break apex/mail/NS**: all five confirmed live — Squarespace A `198.185.159.144`, the four Google MX, the SPF TXT, the two CF NS. These are the invariants the script's loop will never touch.
- **Wildcard `*.babb.dev`**: resolves to GitHub Pages IPs `185.199.108-111.153` for unproxied names. This matches the documented `mkbabb.github.io` Pages catch — the wildcard's CNAME chain is mkbabb.github.io. CF anycast IPs `104.21.x` / `172.67.x` appear where the proxied wildcard is hit.
- **`fourier.babb.dev` / `api.fourier.babb.dev` / `api.sudoku.babb.dev`**: today hit the wildcard → GitHub Pages (the 185.199.x.153 set). Post-W8 (when the token is right), `fourier.babb.dev` will resolve to CF anycast (proxied CNAME to fourier.pages.dev) and `api.fourier.babb.dev` will resolve to `34.197.214.67` exactly.
- **`color.babb.dev` / `api.color.babb.dev` / `sudoku.babb.dev` / `keyframes.babb.dev` / `words.babb.dev` / `grammar.babb.dev` / `deploy.babb.dev`**: all show CF anycast `104.21.56.22` / `172.67.175.252`. These hit the proxied wildcard (or, for `color`/`keyframes`, explicit proxied CNAMEs to `mkbabb.github.io` per the NA3 §1.3 enumeration).
- The `34.197.214.67` value is the host's public IP per `WEBHOOK-URL-RESIDUAL.md §1` (`curl https://api.ipify.org` over SSH). Confirmed against `CONSTELLATION-DEPLOY.md §3.2` as the origin-LE target for the api hostnames.

---

## §3 — Script authoring + secret-discipline gates

`scripts/dns-cf-sync.sh` (executable, `bash -n` clean):

- **G1 (file exists)**: ✓ `test -f scripts/dns-cf-sync.sh` passes.
- **G2 (env-read, no literal token)**: ✓ `grep 'CLOUDFLARE_API_TOKEN:?' scripts/dns-cf-sync.sh` → line `: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN (source .env first)}"`. No 40+-char hex strings in the file.
- **G3 (don't-break catalogue in header)**: ✓ block at lines 13–28 names all 8 don't-break categories (MX, SPF, apex A, NS, wildcard, DKIM/DMARC, www, existing color/keyframes GH-Pages CNAMEs).
- **G4 (declarative target list)**: ✓ `TARGETS=( … )` bash array at lines 103–112 — 8 explicit `TYPE|NAME|CONTENT|PROXIED` tuples.
- **G5 (PATCH not DELETE+CREATE)**: ✓ `grep DELETE scripts/dns-cf-sync.sh` returns zero; the diff branch uses `cf PATCH "/zones/${ZONE_ID}/dns_records/${CUR_ID}" "$body"`.
- **G6 (.env gitignored)**: ✓ `git check-ignore .env` exits 0; `.env` mode `0600`; `.gitignore:50` carries `.env`.

**Auth-header discipline**: the `cf()` helper passes `Authorization: Bearer …` via `--header "@-"` heredoc, so the token never appears in argv (`ps`-visible) and a future `set -x` would echo only `--header @-` not the bearer value.

---

## §4 — The live run — what happened, what failed, why halt

**Invocation**:
```
set -a && source .env && set +a && bash scripts/dns-cf-sync.sh
```

**Output**:
```
[zone] resolving zone id for babb.dev...
[FATAL] could not resolve zone id for babb.dev
[]
```

The script halted at the zone-id resolution step (the first network call). Exit non-zero. **Zero DNS writes occurred.** Per the charter's failure-mode contract (`W8.md §7`): "Token absent | the fail-fast aborts before any network call." Token is present but insufficient — same shape: fail-fast, exit, do not retry, do not attempt the PATCH loop.

### §4.1 — Diagnosis (three probes, presented without exposing the secret)

| Probe | Endpoint | Result | Meaning |
|---|---|---|---|
| 1 | `GET /user/tokens/verify` | `{success:false, errors:[{code:1000, message:"Invalid API Token"}]}` | Token is not recognized as a user-scoped API token. Consistent with Account-scoped token shape (prefix `cfat_…`). |
| 2 | `GET /accounts` | `{success:true, result:[{name:"Mike7400@gmail.com's Account", id:"07119f33…0c76"}]}` | Token IS valid for an account-scoped read. The owning account is `Mike7400@gmail.com`'s account. |
| 3 | `GET /zones?name=babb.dev` (no filter) | `{success:true, result:[], total_count:0}` | The token cannot see the babb.dev zone — i.e., the babb.dev zone is not in the token's account. Combined with the live `dig babb.dev NS` returning `jillian/maciej.ns.cloudflare.com`, this means babb.dev is in a **different Cloudflare account** than the one the token belongs to. |
| 4 | `GET /zones?account.id={token's account}` | `{success:true, result:[]}` | Confirms the token's account has zero zones. |

**Verdict**: the `.env` token is valid but is scoped to an account that does not own babb.dev. No permission grant on the existing token can fix this — the babb.dev zone is not in this account's reach. Either a new token from the babb.dev-owning account is required, or the zone must be moved.

### §4.2 — Honesty discipline applied

Per the charter:

- "DO NOT publish the CF token — read it from `.env`" → respected. The script reads via env; no `echo $CLOUDFLARE_API_TOKEN` anywhere; the four probes above pass the token to `curl` via `-H` flags only (and the production script via the `--header @-` heredoc). No token bytes appear in this audit, in any commit, or in shell history beyond the curl invocations themselves.
- "If any operation fails (auth, 4xx, 5xx), STOP and record. Do not retry blindly." → respected. The script's `[FATAL]` exit was the first stop; the subsequent probes were diagnostic reads (Account-level `GET`s with the same token) to characterize the failure without attempting any write or token mutation.
- The don't-break list is byte-identical pre/post because **no write succeeded** — the diff is empty by construction, not by promise.

---

## §5 — Post-run dig (immediately after halt, 2026-05-28T00:1Xish UTC)

Since the script aborted before any write, every queried record returns the same answer as §2 baseline. Spot-check:

```
$ dig +short babb.dev A
198.185.159.144                                  # unchanged

$ dig +short babb.dev MX
5 alt1.aspmx.l.google.com.
1 aspmx.l.google.com.
10 alt3.aspmx.l.google.com.
5 alt2.aspmx.l.google.com.
10 alt4.aspmx.l.google.com.                       # unchanged (4 Google MX)

$ dig +short babb.dev TXT
"v=spf1 include:_spf.google.com ~all"             # unchanged

$ dig +short babb.dev NS
maciej.ns.cloudflare.com.
jillian.ns.cloudflare.com.                        # unchanged (2 CF NS)

$ dig +short deploy.babb.dev
104.21.56.22
172.67.175.252                                    # unchanged (wildcard CF anycast — TARGET NOT YET ATTAINED)
```

**Don't-break list preservation: YES — byte-identical pre/post.**

**Target attainment**: **NO — zero of 8 targets written.** All eight target records remain in their pre-W8 state (wildcard-resolved or GH-Pages-resolved). The `deploy.babb.dev` webhook URL fix (the charter's W1 residual close) is **NOT yet in effect**.

---

## §6 — Gate ledger (W8.md §5 + the charter additions)

| Gate | Source | State | Evidence |
|---|---|---|---|
| G1 | script exists, tracked | **MET** | `test -f scripts/dns-cf-sync.sh` + (pending) commit |
| G2 | env-read, no literal token | **MET** | `grep` patterns above; manual file review |
| G3 | don't-break catalogue in header | **MET** | header block lines 13–28 |
| G4 | declarative target tuples | **MET** | `TARGETS=( … )` array, 8 tuples |
| G5 | PATCH not DELETE+CREATE | **MET** | `grep DELETE` zero, `grep PATCH` ≥ 1 |
| G6 | `.env` gitignored, no secret in tree | **MET** | `git check-ignore .env` exits 0; mode 0600 |
| G7 | pilot api A records live | **NOT MET** | live run aborted at zone resolution; zero writes |
| G7′ (charter) | `deploy.babb.dev` resolves to `34.197.214.67` | **NOT MET** | resolves to CF anycast wildcard (104.21.56.22 / 172.67.175.252) |
| G8 | don't-break regression | **MET** (vacuously) | no write occurred → no possibility of drift; dig pre/post byte-identical |
| G9 | idempotency on second run | **NOT TESTED** | first run did not complete |
| G10 | perm-set recorded | **MET** | `CONSTELLATION-DEPLOY.md §6.1` cited; per-D.md §7 "not rotated"; this record adds: **the token's account ownership is the gate, not the perm-set** |
| G11 | rollout CNAMEs NOT pre-landed | **N/A (charter override)** | charter explicitly expanded scope to include the CNAMEs; W8.md staging deliberately bypassed |

**Honest tally**: 7 of 11 gates met (or vacuously met / charter-overridden); 2 not met (G7, G7′); 1 not tested (G9 — gated on G7).

---

## §7 — Successor — what unblocks W8 close

**Single blocking question for the user**: which path does the user prefer?

**Path 1 (low blast radius — token migration)**: issue a new CF API token from the Cloudflare account that owns babb.dev (the account whose zones are served by `jillian/maciej.ns.cloudflare.com`). Minimum perms per `CONSTELLATION-DEPLOY.md §6.1`:

- **Zone:DNS:Edit** on the babb.dev zone (the W8 writes).
- **Zone:Zone:Read** on the babb.dev zone (the script's `GET /zones?name=babb.dev` for zone-id resolution).
- (Optional, for W9): **Account:Cloudflare Pages:Edit** on the babb.dev account.

Replace the value in `/Users/mkbabb/Programming/fourier-analysis/.env` (keep mode 0600, keep gitignored). Re-run `set -a && source .env && set +a && bash scripts/dns-cf-sync.sh`. The script is idempotent — a successful first run writes the 8 records; a second confirms all-no-op. No script change required.

**Path 2 (higher blast radius — zone move)**: transfer the babb.dev zone from the current owner-account to `Mike7400@gmail.com`'s account (via CF dashboard "remove zone" + "add zone" elsewhere — this requires updating NS at the registrar, with downtime risk during propagation). Not recommended unless there is a strong reason to consolidate accounts. The existing token would then suffice.

**Recommendation**: Path 1. The token discipline + the script don't change; only the token value rotates to one with the right account scope.

---

## §8 — Out of scope (preserved from W8.md §6)

- No Terraform / `cf-terraforming` / Pulumi — the script is the smallest-honest-mechanism (NA6 §1(a)). KISS held.
- No touch of apex/MX/SPF/NS/wildcard/www — the script's loop never iterates these.
- No grammar / words DNS changes — both deferred per NA4 §2.7/§2.8.
- No CF SSL/Certificates/Workers API usage — not needed for grey-cloud + origin LE.
- No token rotation per D.md §7 user direction — but this record names that the CURRENT token is **insufficient by ownership**, not by perm-set. The successor token is not a rotation; it is a re-issue from the correct account.

---

## §9 — Files touched

| Path | Change |
|---|---|
| `scripts/dns-cf-sync.sh` | new (`chmod +x`, tracked) |
| `docs/tranches/D/audit/W8-dns-as-code.md` | new (this file) |

No other source touched. `.env` untouched (token value preserved as-is per "do not retry blindly" + "user direction: not rotated"). `PROGRESS.md` reconciliation deferred to user verdict on the successor path (Path 1 vs Path 2 above).

---

## §10 — One-line summary

`scripts/dns-cf-sync.sh` authored + verified secret-free + don't-break-safe + idempotent-by-construction; live run halted at zone resolution because the `.env` token belongs to an account that does not own the babb.dev zone (3-probe diagnosis: token valid for `/accounts` returning Mike7400's account, but `/zones?name=babb.dev` returns empty); no DNS writes occurred; don't-break list is byte-identical pre/post by construction; W8 closes after the user supplies a CF token issued from the babb.dev-owning account (no script change required).
