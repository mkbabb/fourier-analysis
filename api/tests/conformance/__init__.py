"""Conformance test package — fourier CRUD-CONTRACT.

Each module fills one CONFORMANCE-MATRIX.md row group against the landed
``api/lib/crud/`` utilities and the ``visualization`` entity. Pure-utility and
model rows run unconditionally; endpoint rows that need a live collection are
gated by ``conftest.requires_mongo`` (an honest skip when no Mongo is reachable,
never a blanket file skip). ``_harness.py`` (leading underscore — not collected)
holds the shared Starlette-Request + throwaway-Mongo driving harness.
"""
