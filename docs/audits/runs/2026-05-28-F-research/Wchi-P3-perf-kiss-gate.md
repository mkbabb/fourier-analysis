# F research-first audit — Wχ-P3 perf KISS-gate probe

**Lane**: F.Wχ-P3 of the F research-first workflow `w0ma5070c` (Wα 3 research lanes → Wχ 4 challenge probes → synthesis).
**Mode**: research-first; READ-ONLY (live probes + host SSH capture + source reads; no mutation). Tranche-development only.

---

Routes are already lazy. Everything confirmed: routes are `() => import()` lazy-loaded, the index chunk is the entry+vendor glue, Tooltip is already split to 517 bytes. I have what I need.

```
## F.Wχ-P3 — F-δ.b perf KISS-gate

### §1 — The last 85 kB unused: worth a route-lazy refactor? DIMINISHING-RETURNS
W7 T-P1 already did the load-bearing work: 854→488 kB via manualChunks, and EVERY route is already `() => import()` lazy (router/index.ts:21-59 — Paper/Viz/Gallery/Equation/Morph/Extractor all dynamic). The index-*.js that Lighthouse flags as 85 kB-unused IS the app shell + Vue-app bootstrap + router glue — it is by definition eager because it boots the SPA. "Unused-javascript" on the entry chunk is Lighthouse measuring code paths not hit on the FIRST route, not dead code. A "deeper route-lazy" pass cannot move shell/bootstrap off the entry without splitting the app mount itself — high-complexity, FOUT/flash-of-unmounted risk, for ~85 kB that gzips to ~25 kB on an HTTP/2 CF edge. MANUFACTURED. The marginal byte is not worth a refactor of the mount path.

### §2 — CM font self-host: REDUCE or ADD? ADD (net)
Today: 3 woff preloads + a fonts.css + a preconnect, all to `cm-web-fonts@latest` on jsdelivr (index.html:12,15-17,31). The `@latest` tag is the real defect — unpinned, cache-hostile, and a supply-chain wildcard. But self-hosting trades one liability for three: 3 binary blobs committed to git (repo bloat, LFS question), a cache-header config on CF Pages, AND it does NOT eliminate FOUT — CM is already `local()`-first for KaTeX (style.css:56-67) but the cm-web-fonts/fonts.css has no font-display guarantee, so swap behavior is unchanged either way. The genuine fix is one line, not a thread: pin `@latest`→`@<sha>` and keep the preconnect. That kills the cache-miss waste (immutable URL) without adding binaries. PROCEED only as the pin, not the self-host.

### §3 — Tooltip chunk: real win or noise? NOISE
The built Tooltip chunk is 517 bytes (`Tooltip.vue_vue_type_script_setup_true_lang-oBPmmMCW.js`), already route/component-split. The "265 kB" in the probe is the vendor-ui cluster (225 kB: reka-ui+glass-ui+lucide) that Tooltip transitively pulls — not Tooltip itself. The 25 kB "unused" is tree-shake residue inside reka-ui, already lazy via the components that use it. Chasing it is noise: no isolated Tooltip action exists to take.

### §4 — LCP 7-8s: code problem or measurement artifact? ARTIFACT
R3/FA1 measured server at 20 ms. A 7-8 s LCP with a 20 ms origin is not network and not bundle — it is Lighthouse headless desktop hitting a COLD CF Pages edge (first-request cold-start + KaTeX font fetch from jsdelivr `@latest` blocking text paint). The LCP element is rendered text gated on the CM font swap, not JS execution. Shipping 85 kB less JS moves LCP by ~0. The font pin (§2) is the only item here that touches LCP at all.

### §5 — Verdict: F-δ.b NARROW-to-{font-URL-pin-only}
DEFER the route-lazy pass (manufactured — diminishing returns against an already-split, already-lazy app; the 85 kB is irreducible shell). DEFER the self-host (ADD: 3 git binaries + config + no FOUT win). The ONE observational, non-manufactured finding is the unpinned `cm-web-fonts@latest` — pin it to an immutable SHA, keep preconnect, no new files. That is the entire defensible scope. The Lighthouse "unused-javascript < 50 kB on index-*.js" target as written FAILS the KISS gate: it manufactures a refactor to chase a metric artifact. Wχ KISS-gate: SIGN-OFF WITHHELD for the W5 thread as scoped; APPROVE only the font-pin one-liner.
```
