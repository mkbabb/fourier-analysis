# H.W5 (thread δ) — contract honesty: inv-26 honest completion + name hygiene

**Mode**: direct, source-bounded (the `H.δ contract` thread, `web/src/lib/{types.ts, equation/types.ts}` + `docs/tranches/INVARIANTS.md`). ASSESSMENT + DOCUMENTATION wave — no contract was mechanically merged. No git commit/push.

## The 4th-island decision: KEEP-AS-IS, documented (NOT merged)

G's executed inv-26 collapsed the **visualization/CRUD/contour** api↔web boundary to a single source (`web/src/lib/types.ts`; `api.ts` re-exports from it) and deleted the orphaned OpenAPI→TS codegen. A 4th hand-typed module remained: `web/src/lib/equation/types.ts` (`FourierTermDTO`, `ComputeEquationRequest`/`Response`, `SimplifyRequest`/`Response`, `NotationMode`, `EquationTier`, `EquationDisplayMode`, `PresetFunction`), with 10 importers under `web/src/components/equation/`.

**Assessment.** I compared it field-for-field against the backend:

- Backend models: `api/models/equations.py` (`FourierTermDTO`, `ComputeEquationRequest`, `ComputeEquationResponse`, `SimplifyRequest`, `SimplifyResponse`).
- Routed by: `api/routers/equations.py` — `POST /api/equations/compute` (`response_model=ComputeEquationResponse`) + `POST /api/equations/simplify` (`response_model=SimplifyResponse`).

The TS types match the Pydantic models exactly — **no drift**. `FourierTermDTO` (`n`, `coefficient_re`, `coefficient_im`, `amplitude`, `phase`), the request fields, and the response fields all agree.

**Disposition.** This is the **equation-compute domain** contract — a *distinct* boundary, NOT a duplicate of the collapsed visualization boundary. The two boundaries are disjoint in every axis:

| | visualization boundary | equation-compute boundary |
|---|---|---|
| web source | `web/src/lib/types.ts` | `web/src/lib/equation/types.ts` |
| importers | `api.ts` + visualization/admin/gallery components | the 10 `web/src/components/equation/*` modules |
| backend models | CRUD/contour models | `api/models/equations.py` |
| backend routers | `visualizations.py`, `contours.py`, `admin.py`, `images.py` | `equations.py` |
| wire style | **raw `Response` + manual ETag/`_public_doc` projection** | **`response_model=` Pydantic, returned directly** |

inv-26's "exactly ONE source of truth" therefore **holds per-domain**: each module is the single source for its own domain. Forcing them into one module — or wiring a cross-domain barrel re-export — would *conflate* two distinct contracts, which is the opposite of inv-26's intent (inv-26 strengthens inv-11 *one-identity*, not *one-file-for-everything*). So: **keep-as-is, documented.** No `.ts` was changed.

## The NO-`response_model`-codegen decision: DECLINED-WITH-RATIONALE (not deferred)

inv-26 is satisfied by **hand-typed-canonical**, not by machine-verified codegen. G correctly *deleted* the codegen. The decision to NOT revive it (nor add `response_model=` to the visualization read/write endpoints to feed it) stands on this fact:

The visualization read/write/list/restore endpoints return a **raw `Response`**:
```python
response = Response(content=json.dumps(_public_doc(saved), default=str), ...)
etag.set_etag_header(response, saved)
```
(`api/routers/visualizations.py` — `_public_doc` projects out internal fields; `etag.set_etag_header` mints the RFC-9110 strong validator.) **FastAPI ignores `response_model=` when the handler returns a raw `Response`.** Adding it would make the generated OpenAPI schema advertise a model the wire bytes do not match — the schema would **LIE** about the hand-projected public-doc bytes and the ETag header. The boundary is hand-verified-canonical *by design*; machine-verification is declined because it cannot describe the ETag/projection surface honestly.

(The equation endpoints, by contrast, *do* carry `response_model=` and return Pydantic models directly — they are honest there. The decline is specific to the raw-`Response` ETag/projection surface.)

Booked in `H.md §"Declined (recorded, not deferred)"`; recorded as resolution rule **§2.9** in `docs/tranches/INVARIANTS.md`.

## Name hygiene: the "symmetric" name retired

`INVARIANTS.md §2.7` already RETRACTS what "F-Inv 22* vhost-correctness-**symmetric**" asserted (scoping it to fourier-vhost-correctness + a cross-repo aspiration). The §1 inventory table row and the §2.4 name reference still carried the misleading word "symmetric" as the binding name. Both now read **"fourier-vhost-correctness (+ cross-repo aspiration)"** with a pointer to §2.7. §2.7 itself was left unchanged (it is correct).

## Changes

- `docs/tranches/INVARIANTS.md`:
  - §1 table row F-Inv 22* — name retired to "fourier-vhost-correctness (+ cross-repo aspiration) *(the "symmetric" name is RETRACTED — see §2.7)*".
  - §2.4 — the F-Inv 22* name reference updated to match (was "vhost-correctness-symmetric").
  - §2 — new resolution rule **#9** recording (a) the 4th-island disposition and (b) the no-`response_model`-codegen decision.
- `docs/tranches/H/waves/W5-delta-contract-honesty.md` — this note.
- **No `.ts` touched** — the keep-as-is disposition is documentation, not consolidation.

## Verify

INVARIANTS.md is internally consistent: the §1 table name, the §2.4 reference, and §2.7 all agree on "fourier-vhost-correctness"; §2.9 agrees with the §1 inv-26 row + `H.md` Declined block. No `.ts` changed, so no `vue-tsc` run was required for correctness (the equation module compiles unchanged on `master`).
