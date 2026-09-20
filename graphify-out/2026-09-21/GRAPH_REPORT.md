# Graph Report - PWA JUSTIFY  (2026-09-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 81 nodes · 147 edges · 12 communities (6 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App.jsx
- utils.js
- devDependencies
- dependencies
- package.json
- metadata.js
- LyricsPanel.jsx
- audio.js

## God Nodes (most connected - your core abstractions)
1. `App()` - 17 edges
2. `formatRate()` - 7 edges
3. `formatTime()` - 7 edges
4. `parseFile()` - 6 edges
5. `PlayerBar()` - 5 edges
6. `isDirectMode()` - 5 edges
7. `uid()` - 5 edges
8. `setDirectMode()` - 4 edges
9. `LyricsPanel()` - 4 edges
10. `Visualizer()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `isDirectMode()`  [EXTRACTED]
  src/App.jsx → src/lib/audio.js
- `App()` --calls--> `parseFile()`  [EXTRACTED]
  src/App.jsx → src/lib/metadata.js
- `App()` --calls--> `formatRate()`  [EXTRACTED]
  src/App.jsx → src/lib/utils.js
- `App()` --calls--> `formatTime()`  [EXTRACTED]
  src/App.jsx → src/lib/utils.js
- `App()` --calls--> `uid()`  [EXTRACTED]
  src/App.jsx → src/lib/utils.js

## Import Cycles
- None detected.

## Communities (12 total, 2 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.24
Nodes (13): App(), BottomNav(), ensureEngine(), setDirectMode(), setVolume(), db, getBlob(), getCoverUrl() (+5 more)

### Community 1 - "utils.js"
Cohesion: 0.26
Nodes (8): LibraryPanel(), PlayerBar(), RightPanel(), isDirectMode(), ACCEPT_AUDIO, FALLBACK_COVER, formatRate(), formatTime()

### Community 2 - "devDependencies"
Cohesion: 0.15
Nodes (13): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, vite, vite-plugin-pwa, @vitejs/plugin-react (+5 more)

### Community 3 - "dependencies"
Cohesion: 0.18
Nodes (11): dexie, jsmediatags, lucide-react, dependencies, dexie, jsmediatags, lucide-react, react (+3 more)

### Community 4 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 5 - "metadata.js"
Cohesion: 0.70
Nodes (4): parseFile(), probeFile(), readTag(), uid()

## Knowledge Gaps
- **18 isolated node(s):** `autoprefixer`, `tailwindcss`, `postcss`, `vite`, `vite-plugin-pwa` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 24 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `tailwindcss`, `postcss` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._