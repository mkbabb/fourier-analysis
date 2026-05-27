# Blob backend — backup / disaster-recovery note (C.W5 / C4)

**Status**: binding precept landed at C.W5 (thread β). Discharges challenge-P1
condition **C4** (`docs/tranches/C/audit/challenge-P1.md §4,§6`).

> Placement note. `docs/precepts/infra/` (named in `W5.md §6`) is a git
> *submodule* (`docs/precepts → git@github.com:mkbabb/precepts.git`), a separate
> repository outside the fourier-analysis working tree. To keep the C.W5
> deletion-proof integration inside ONE working tree for the team-lead, the note
> lands here in the tranche docs; promote it into the `precepts` submodule at the
> W6 close ceremony if the cross-repo precept home is wanted.

---

## The cost the "0 cost" ledger did not name

The filesystem+nginx storage choice is the smallest *honest* mechanism for
invariant 18's relocation intent, and its infrastructure surface is genuinely
five zeroes (no new container, dependency, credential, or ongoing cost). But the
relocation moves the image + thumbnail bytes off the Mongo document — a substrate
that was covered (for whatever backup discipline an operator applies) by the one
`mongo_data` surface — onto a **second independent durable surface**
(`image_blobs`). That second surface is a real, non-infra cost, and this note
writes it down.

## The sole-copy fact

Post-cutover, the inline `blob` field is `$unset` from every `images` document
(`api/scripts/migrate_image_blobs.py`; `R-storage-spec §3.3`). The files on the
`image_blobs` volume are therefore the **sole copy** of every user upload — the
files are the new source of truth. A lost `image_blobs` volume is unrecoverable
upload loss; there is no inline-Mongo fallback any more.

## The split-brain-on-restore hazard

`mongo_data` and `image_blobs` are two independent durable surfaces that MUST be
backed up **consistently**. A `mongo_data` snapshot taken at T1 paired with an
`image_blobs` snapshot taken at T2 ≠ T1 can restore into either of two broken
states:

1. a document whose `storage_uri` points at a file **absent** from the blob
   snapshot (the Mongo snapshot is newer than the blob snapshot), serving a 404
   / `FileNotFoundError` on `…/blob`; or
2. orphan files on the volume whose owning document the Mongo snapshot **lost**
   (the blob snapshot is newer), defeating the bounded-enumeration query exactly
   as an un-coupled delete would (§ the C1 janitor unlink couples the *live*
   delete; an inconsistent *restore* re-opens the same divergence).

**Requirement.** Any backup mechanism (none exists in the tree today — there is
no `mongodump`/snapshot cron) MUST snapshot `mongo_data` and `image_blobs`
**together**, ideally with writes quiesced (the single-standalone topology,
invariant 19, makes a brief read-only pause cheap), so the two surfaces describe
the same instant. A naive "back up each volume on its own cron" is the
split-brain trap.

## The cheap mechanical guard (landed)

`image_blobs` is declared **`external: true`** in `docker-compose.prod.yml` so
`docker compose down -v` (or `docker volume prune`) cannot wipe the sole copy.
An external volume is referenced by its literal name and is NOT created or
destroyed by compose, so it must be created once out-of-band before the first
prod bring-up:

```
docker volume create image_blobs
```

`down -v` was already symmetric for `mongo_data` (it wipes the inline blobs there
too today), so `external: true` is the new guard for the surface that, post-
cutover, holds the only copy.

## Topology precondition (recorded, not a guard)

The atomic-cutover stale-read-free proof (`R-storage-spec §4`;
`challenge-P3.md §1`) is contingent on the single-standalone `mongod`
(`docker-compose.prod.yml` `replicas: 1`, no `--replSet`) read at the default
`primary`/`local`. Invariant 19 guarantees this for tranche C. A future
replica-set would require pinning `readPreference: primary` (or
`readConcern: majority`) to preserve read-your-writes — a documentation gate to
revisit only if invariant 19 is ever relaxed, not an architecture change now.
