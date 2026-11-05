# Neatdraw
A local-first Mermaid styling workspace. Paste Mermaid source, choose a palette, preview and export SVG or PNG.

## Run
Requires Node.js 20+.
```sh
npm install
npm run dev
```

## Test/build
```sh
npm test
npm run build
npm run preview
```

## Scope and privacy
Rendering runs in the browser using Mermaid; Neatdraw has no app backend, accounts, analytics, usage counters, payment flow, or cloud sync. The draft and theme are saved best-effort in browser localStorage. Clipboard requires a secure context (HTTPS or localhost). Google Fonts are loaded by `index.html`; this sends a standard font request to Google. Remove those font links for a fully offline font setup.

This is a Mermaid renderer/theme switcher, not a semantic graph optimizer or drag-and-drop editor. Mermaid controls diagram layout. Export relies on browser SVG and Canvas support. Do not claim payment unlocks, testimonials, user metrics or production verification unless implemented and measured.
