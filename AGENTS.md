# Agent notes: skittles-theme

- Layout = geometry (packages/skittles-layout). Paint = color (paint/). No literal colors in skittles-chrome.css (enforced by test/layout.test.js).
- Edit paint/schemes.json5 or scripts/build-schemes.mjs, then run `pnpm paint:schemes`. Never hand-edit paint/css/skittles-paint.css or paint/schemes.generated.json.
- Slot rule: light/dark schemes are slot candidates only. Only `slots: []` (Grape Soda) turns automation off.
- Gate: `pnpm paint:validate && pnpm test`, then `pnpm test:a11y` with 0 contrast violations.
- No logo files in shipped packages. The skittle mark is docs-only (docs/brand). The shipped bundle gets the shared placeholder from `@antora-supplemental/brand-placeholder` (scripts/build-bundle.mjs bakes it and runs validate-theme --strict); the demo overlay replaces only its `brand-placeholder-logo` partial.
- Files are UTF-8 without BOM.
