# Paper windowing

The paper view no longer treats the document as one giant mounted tree.

## Build time

`web/vite.config.ts` uses `@mkbabb/latex-paper/vite` against `paper/fourier_paper.tex`.

That plugin emits `virtual:paper-content` with:

- `paperSections`
- `labelMap`
- `pageMap`
- `totalPages`

The page map comes from LaTeX’s `.aux` TOC order, not from title matching. Inline math headings therefore map cleanly.

## Package side

Inside `latex-paper`:

1. `Transformer` builds the semantic section tree.
2. `flattenPaperSections()` turns that tree into one ordered layout list.
3. `useVirtualSectionWindow()` keeps only a bounded slice mounted and preserves scroll height with spacers.

The tree is still the document model. The flat list is the scroll model.

## App side

Inside `web/src/components/paper/`:

- `PaperView.vue` orchestrates the route.
- `PaperArticleWindow.vue` renders the visible slice plus spacers.
- `paperTree.ts` supplies lightweight TOC metadata.
- `useScrollNavigation.ts` handles near smooth-scrolls and far teleports.

The paper view renders only the current neighborhood, not the full recursive subtree.

## Navigation

Near jumps use smooth `scrollTo`.

Far jumps do three things:

1. warm a small target neighborhood
2. jump to the computed absolute offset
3. fade a short full-screen overlay in and back out while the target stabilizes

That keeps the jump quick without flashing raw layout corrections.

## Active section and page number

The current section is resolved from virtual layout offsets, not from observing every heading in the DOM.

The current page comes from `pageMap[activeId]`. If a heading is starred and absent from the LaTeX TOC, it inherits the last valid page instead of collapsing back to page `1`.

## Why this is better

- Initial mount stays tiny.
- Long-scroll DOM size stays bounded.
- TOC jumps no longer need the entire document alive in the DOM.
- Page numbers stay deterministic across math-heavy headings.
- The route avoids the recursive rerender loop that the earlier root-registration path triggered.

## Verification

The regression coverage lives in `web/e2e/paper-performance.spec.ts`.

It checks:

- bounded initial mount
- no page-number regression back to `1`
- accurate jump to `dft-as-matrix-multiplication`
- bounded mounted section count through a long scroll
- visible teleport overlay during far jumps
