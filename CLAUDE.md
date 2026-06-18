# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 诗云 (ShiYun) · 古诗词学习系统

Family Chinese-ancient-poetry learning system. Two artifacts ship from this repo:

- **诗云-生成器.html** — one-shot AI content generator for parents. Walks 112 部编版 poems through OpenAI (GPT-4o-mini for text, DALL-E 3 for images, TTS-1 for audio), then exports a single self-contained HTML.
- **诗云-学习版.html** — offline learning app for kids. Double-click to open, no network required. All media (images, audio) is base64-embedded.

Design and product context lives in `docs/superpowers/specs/2026-06-16-诗云-design.md` — read this first for any non-trivial change.

## Common commands

```bash
npm install                # install vitest, jsdom, pinyin-pro
npm test                   # run all vitest tests once
npm run test:watch         # vitest in watch mode (single test: hit 'p' to filter by filename)
npm run build              # build 诗云-学习版.html (calls python scripts/build_learning.py)
```

Run a single test file:

```bash
npx vitest run tests/data.test.js
```

Filter a single test by name inside a file:

```bash
npx vitest run tests/data.test.js -t "应加载 112 首诗"
```

### Task orchestration (25-task build pipeline)

The project is being built task-by-task via `orchestrate.bat` (Windows). Full guide: `ORCHESTRATION.md`. Task definitions live in `docs/superpowers/plans/tasks/task-NN-*.md`.

```bash
./orchestrate.bat            # run all unfinished tasks across 8 phases
./orchestrate.bat 5 6 7      # run only specific tasks
./orchestrate.bat --status   # show progress
./orchestrate.bat --reset    # wipe .tasks/done/ and re-run everything
```

Task completion markers live in `.tasks/done/`; logs in `.tasks/logs/`. Do not edit `.tasks/done/` by hand — it's auto-managed. Phases 2 and 6 fan out tasks in parallel; the rest are serial and respect the dependency graph in `ORCHESTRATION.md`.

## Architecture

### Data flow

```
poems-meta.js (static)  →  data.js (in-memory Map)  →  generator fills AI fields  →  build_learning.py embeds JSON  →  学习版.html
                                                                  ↓
                                                       OpenAI APIs (text/image/TTS)
                                                                  ↓
                                                       base64 inline in single HTML
```

`src/data/poems-meta.js` is the **single source of truth** for the 112 poems (id, title, author, dynasty, grade, type, content, sequence, source). Treat it as content data, not code — don't add logic here.

`src/js/data.js` is the runtime data layer. Exports a mutable `poems` Map and query helpers (`getPoem`, `getPoemsByGrade`, `getPoemsByDynasty`, `searchPoems`, `isPoemComplete`, `serializePoems`/`deserializePoems`). The generator mutates this Map; the build script then calls `serializePoems()` to embed into the final HTML. Tests rely on `loadPoemMeta()` + `poems.clear()` for isolation.

`src/js/openai-client.js` is a thin browser-side `OpenAIClient` class with three methods: `generateText` (chat completions, JSON mode by default), `generateImage` (DALL-E 3, returns data URL), `generateAudio` (TTS-1, returns data URL via FileReader). Tests use jsdom; API calls are stubbed at the `fetch` boundary, not inside the client.

### Planned modules (referenced by task definitions, not all implemented yet)

- `src/js/storage.js` — `localStorage` wrapper for `UserState` (per-user `poemProgress`, `quizHistory`, `achievements`). Schema in design doc §3.2.
- `src/js/srs.js` — SM-2 spaced repetition. Simplified rules: score ≥90 → interval × 2.5, 70-89 → × 1.5, <70 → reset to 1; 3 consecutive ≥90 → `mastered`. See design doc §3.3.
- `src/js/router.js` — simple view router for the 5 modules (Learn / Review / Quiz / Print / Progress).
- `src/js/ui/*.js` — one module per page.
- `src/lib/pinyin-pro.js` — vendored pinyin library (also a npm dep).

### Two products, one build

The build is asymmetric: the **generator** is a tool that produces the **learning app**. They share the data layer and OpenAI client but have different UIs and lifecycles. Generator output (`诗云-学习版.html`) is gitignored — only the source under `src/` is checked in.

### Test layout

`tests/setup.js` mocks `localStorage` (in-memory store) and forces `indexedDB = undefined` so storage code falls back to localStorage. Every test file must work under this setup; new tests should `import` from `src/js/*.js` and reset the `poems` Map in `beforeEach` to keep state isolated.

Tests cover the data layer (`data.test.js`, `data-poems-meta.test.js`) and OpenAI client (`openai-client.test.js`). `sanity.test.js` exists to validate the test harness itself.

### Convention notes

- 诗云 metadata uses ID format `g{grade}-{sequence}` (e.g. `g1-01`). New poems must follow this pattern.
- AI-generated media goes in as `data:image/jpeg;base64,...` and `data:audio/mp3;base64,...` strings — never as separate files.
- `isPoemComplete(poem)` returns true only when image + audio + pinyin are all present. Use this gate before allowing a poem to be added to the learning build.
- API Key is stored in `localStorage` under key `shiyun_api_key` (browser-only; never commit).
- The `commit` file in repo root is a helper used by `orchestrate.bat` to produce uniform git commits — don't delete it.

### Out of scope (do not add unless explicitly asked)

- Backend / database / user accounts
- Mobile apps
- Speech recognition / pronunciation scoring
- Payment / commercialization

These are YAGNI per design doc §1.3. The 公众号生态 and 微信小游戏 described in §11–12 are separate sub-projects (`wechat-publisher/`, `wechat-miniapp/`) that do not exist yet in this repo.
