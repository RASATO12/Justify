# Graph Report - PWA JUSTIFY  (2026-09-21)

## Corpus Check
- 18 files · ~6,949 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 109 nodes · 174 edges · 14 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App.jsx
- utils.js
- devDependencies
- dependencies
- package.json
- metadata.js
- RightPanel.jsx
- Product Requirements Document: Justify PWA Offline Music Player
- AGENTS.md
- 7. Technical Specifications

## God Nodes (most connected - your core abstractions)
1. `App()` - 17 edges
2. `Product Requirements Document: Justify PWA Offline Music Player` - 9 edges
3. `7. Technical Specifications` - 8 edges
4. `formatTime()` - 7 edges
5. `formatRate()` - 7 edges
6. `parseFile()` - 6 edges
7. `PlayerBar()` - 5 edges
8. `isDirectMode()` - 5 edges
9. `uid()` - 5 edges
10. `4. Features & Functionality` - 5 edges

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

## Communities (14 total, 0 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.24
Nodes (13): App(), BottomNav(), ensureEngine(), setDirectMode(), setVolume(), db, getBlob(), getCoverUrl() (+5 more)

### Community 1 - "utils.js"
Cohesion: 0.29
Nodes (7): LibraryPanel(), PlayerBar(), isDirectMode(), ACCEPT_AUDIO, FALLBACK_COVER, formatRate(), formatTime()

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

### Community 6 - "RightPanel.jsx"
Cohesion: 0.36
Nodes (5): LyricsPanel(), RightPanel(), Visualizer(), getAnalyser(), activeLyricIndex()

### Community 7 - "Product Requirements Document: Justify PWA Offline Music Player"
Cohesion: 0.17
Nodes (12): 1. Introduction, 2. Goals & Objectives, 3. User Stories, 4.1. Audio Engine & Processing, 4.2. PWA & Offline Support, 4.3. Arsitektur Interface (Zero-Revision Standard), 4.4. Manajemen Perpustakaan & Playlist, 4. Features & Functionality (+4 more)

### Community 12 - "AGENTS.md"
Cohesion: 0.25
Nodes (7): AGENTS INSTRUCTION & PRD CONTEXT, AGENTS.md — OpenCode & AI Coding Agent Configuration, CRITICAL EXECUTION RULES, Generated: 20/9/2026, 23.38.11, OpenCode & AI Coding Agent Protocol, PRD SOURCE DOCUMENT, Project: LearnDev Generated Spec

### Community 13 - "7. Technical Specifications"
Cohesion: 0.25
Nodes (8): 7.1. Teknologi Inti, 7.2. Dukungan Format Audio, 7.3. Parsing Metadata, 7.4. Fungsionalitas Offline, 7.5. Standar Antarmuka Pengguna, 7.6. Panduan Eksekusi Codebase, 7.7. Performa, 7. Technical Specifications

## Knowledge Gaps
- **41 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+36 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 47 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `Product Requirements Document: Justify PWA Offline Music Player` connect `Product Requirements Document: Justify PWA Offline Music Player` to `AGENTS.md`, `7. Technical Specifications`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _41 weakly-connected nodes found - possible documentation gaps or missing edges._