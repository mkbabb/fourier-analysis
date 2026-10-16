SERVED MODEL: claude-opus-5-5

# `human-leaf.png`: the leaf beside the sitter in `human.png`

A boolean mask (PNG mode `1`, 1024 × 1024, 30,797 pixels set; rows 425–794,
columns 197–335). It is the plant leaf that stands against the sitter's cheek
in `assets/portraits/human.png`, as the 1024-px BiRefNet-lite saliency kept it.
`test_person_cut_removes_what_stands_beside_the_sitter` unites it with the
model's `subject_mask` before `part_labels`, so the person-cut test no longer
depends on which saliency model happens to keep the leaf (COHESION §0ff,
F-REL unit `.mem3`).

## Provenance

- **Source image:** `assets/portraits/human.png`, sha256
  `f10bbb4315126f7899649b310a122da97ff5d991b9c27f2e2b978416292c3888`.
- **Model:** `birefnet-general-lite` (`BIREFNET_LITE`, input 1024), file sha256
  `5600024376f572a557870a5eb0afb1e5961636bef4e1e22132025467d0f03333`
  (matches the pinned `SubjectModelSpec`).
- **Code:** `src/` exactly as committed at `512f5a9` (`git archive 512f5a9 src`),
  with `ContourConfig().normalized()`.
- **Derivation:** `mask, _ = subject_mask(image, config)`;
  `removed = mask & ~part_labels(image, mask).subject` (source `face-parsing`);
  the 4-px frame band cleared, as in the test; the largest 4-connected
  (`ndi.label` default) component kept. Readings: mask 364,211 px,
  removed 32,296 px (0.0887 of the mask) in 34 components, the leaf 30,797 px
  (0.9536 of what was removed).
- **Command** (the script is `derive_human_leaf.py`, beside this note):

  ```sh
  mkdir -p ~/.fourier-frel/mem3/src512 && git archive 512f5a9 src | tar -x -C ~/.fourier-frel/mem3/src512
  PYTHONPATH=~/.fourier-frel/mem3/src512/src COMPUTE_CONCURRENCY=1 \
    ~/.claude/guard/guarded --rss-gb 16 -- .venv/bin/python \
    tests/fixtures/derive_human_leaf.py . tests/fixtures/human-leaf.png
  ```

- **File:** `human-leaf.png` sha256
  `806d371dbf1a5980970e803f3f78e591195e2d7e9ab74bd57a706d86eadd6f16`.
