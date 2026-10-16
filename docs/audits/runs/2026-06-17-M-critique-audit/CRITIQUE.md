# M-critique-audit — the user's live critique of the bumped instance (2026-06-17)

The user critiqued the **live, all-latest-bumped + M.W1-migrated** instance (http://localhost:3000, branch `m/w1-bump-migration`: glass-ui 4.0.0 + keyframes 4.3.0 + value.js 0.13.0 + vite 8 / vue-tsc 3 / vue-router 5 / pinia 3 / lucide 1, the UnderlineTabs→SegmentedTabs + MetricBadge + glass-scrubber + DialogContent + glass-wash migration). Evidence: `user-critique/*.png` (the user's own crops) + `live/*.jpeg` (full-pane desktop @1440).

## The 8 concrete critique findings (each → evidence → likely root cause → disposition)

1. **Surfaces are not glassy** — content/error/panel cards render as paper "cartoon-stamp" (offset shadow, opaque fill), not the glass depth ladder. `user-critique/01` (the "Computation failed / Bad Gateway" card), `live/live-workspace` (right panel), `live/live-paper` (article + sidebar cards). Root: the `.cartoon-card` shim (~25 sites) + hand-rolled surfaces; the glass 5-tier ladder (`.glass-wash/-quiet/-resting/-floating`, shipped in glass-ui 4.0 `styles/glass/ladder.css`) is unadopted. → M.W5 glass-depth adoption.
2. **Borders not properly rounded** — cards have near-square corners; the search focus ring is square (`11`). Root: rounding tokens not applied / raw outlines. → M.W5 + a rounding system (`--radius-*`).
3. **No tabs view on desktop for the visualizer** — the `Controls | Canvas` SegmentedTabs (a mobile affordance, `lg:hidden`) is appearing/又 should never show on desktop; on desktop both panels show (controls-left). `live/live-workspace`. → M.W8/W10 layout (the tabs are mobile-only; desktop shows all controls-left).
4. **All controls on the LEFT** (DEC-2, emphatic) — the Configurator controls + ALL control panes belong on the left authoring rail, not the right. `live/live-workspace` (controls pinned RIGHT over a vast dead dot-grid). → M.W8 `asideSide="left"` + the layout transpose.
5. **Dropdown / glass elements oddly darkened** — the nav dropdown (`08`) renders as flat opaque grey, not translucent glass; "glass elements darkened and not right." Root: a glass-ui 4.0 menu/overlay surface token or contrast regression (the `--glass-*`/menu.css surface composites dark), OR fourier not adopting the right surface. → ROOT-CAUSE in the audit: glass-ui-4.0 bug/ask vs fourier adoption.
6. **Button options not visible when not hovered** — the preset pills (`09`: Sawtooth/Triangle/|sin(x)|/Gaussian/Step/x²) are bare text with no idle background; only hover/active shows a chip. Root: ghost/no-idle-paint buttons; the tonal-accent idle fill is absent. → M.W7 tonal-accent + the `glass-ui-dockiconbutton-active` / idle-affordance ask.
7. **Tabs should be GLASS** — the tabs render as `underline` (`10`); the user wants the glass (pill / glass-track) variant. (The M.W1 migration chose `variant="underline"` to match the retired UnderlineTabs; the user reverses this → glass.) → M.W8 tabs-as-glass (SegmentedTabs `variant="pill"` or a glass treatment).
8. **Search screen offset + square** (`11`) — the paper search input's focus ring is mis-positioned (offset beyond the field) AND square (square corners on a rounded field). Root: a raw/default focus outline instead of a rounded glass focus ring (glass-ui 4.0 input focus, or fourier override). → glass-ui input focus-ring ask + M.W5 rounding.

## The meta-pattern

These 8 cluster into THREE root classes the audit must separate:
- **(α) glass-ui 4.0 rendering regressions/gaps** — the darkened dropdown (5), the square/offset focus ring (8), arguably the not-translucent glass — are likely glass-ui-4.0-owned (tokens/menu/input), to ROOT-CAUSE and book as glass-ui asks (inv-16; fourier consumes), NOT fourier `!important` workarounds.
- **(β) fourier adoption gaps** — not-glassy cartoon cards (1), not-rounded (2), controls-RIGHT (4), no-desktop-tabs (3), tabs-underline-not-glass (7), idle-button-paint (6) — fourier must adopt the glass ladder + Configurator `asideSide` + the glass tab variant + the tonal-accent idle fill. These are M.W5/W7/W8.
- **(γ) the bump's own residue** — the M.W1 migration chose `underline` (user wants glass); the cartoon-card shim survives; vue-tsc 3 not yet run.

The audit must NOT quick-fix these — root-cause each, separate glass-ui-owned from fourier-owned, and fold into the M wave plan (idiomatic, no-legacy, no `!important`).
