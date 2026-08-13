# plaindeck-mcp

Model Context Protocol (MCP) server for [PlainDeck](https://github.com/Mappedinfo/PlainDeck) — lets any MCP-capable agent create, review, and iterate agent-native slide decks on disk.

The server wraps the PlainDeck Agent API (the same operations the Web canvas and CLI use) into MCP tools, so an agent can: scaffold a project, validate its format, inspect its structure, apply fine-grained operations, add summary-card and native-table pages from structured content, search visual recipes, and render standalone HTML/PNG/PDF — all as Git-reviewable JSON files.

## Tools

| Tool | Description |
|---|---|
| `init` | Create a new PlainDeck project (`deck.json` / `theme.json` / `slides/*.json` + `.gitignore`). Templates: `showcase` / `pitch` / `blank` / `paper-reading` / `nature-methods`. |
| `validate` | Schema-validate a project; always returns a structured result (load failures become `valid:false` + `load_error`). |
| `inspect` | Project overview: title, canvas, per-slide path/name/layout/element count. |
| `apply_operations` | Apply a batch of PlainDeck operations (`set-element`, `add-slide`, `rename-slide`, `set-theme`, …) with an optional `dryRun`. Format: [`docs/agent-api.md`](../docs/agent-api.md). |
| `add_cards` | Generate a summary-card slide (1–8 adaptive points) from structured Markdown or JSON, with an optional visual recipe. |
| `add_table` | Generate a native table slide from Markdown / CSV / TSV / JSON data (`rules` / `grid` / `stripes`). |
| `render` | Standalone HTML player (returned inline or written to a file), or PNG/PDF via Playwright Chromium. |
| `styles` | Search the 174 visual recipes for `add_cards`. |

## Install

```sh
npm install --global plaindeck-mcp
```

Requires Node.js ≥ 22. PNG/PDF rendering additionally needs:

```sh
npm install playwright
npx playwright install chromium
```

## Use with DeepSeek Harness (dsh)

The repo ships an opt-in Cordis overlay (`plaindeck.cordis.yml`) that connects the server through `@deepseek-ai/dsh-mcp-client`:

```sh
dsh web --patch "$PWD/packages/plaindeck-mcp/plaindeck.cordis.yml"
```

The model then sees the tools as `mcp__plaindeck__init`, `mcp__plaindeck__apply_operations`, etc. To keep the selection across runs, merge the file's single `insert` patch into `$DSH_HOME/cordis.patch.yml` (or a profile patch). All tools take **absolute** project paths.

## Use with any MCP client

Run the server on stdio and point your client at it:

```sh
plaindeck-mcp
```

Example session (Claude Code / Codex / dsh alike):

1. `init` — `projectPath: /path/to/deck`, `template: nature-methods`
2. `apply_operations` — rename slides, set titles, change theme
3. `add_cards` — turn research notes into a summary-card slide
4. `add_table` — add a benchmark comparison table
5. `render` — produce a standalone HTML file to share

Every step leaves a plain JSON diff that humans can review in Git.

## Development

```sh
npm run build -w plaindeck-mcp   # compile dist/
npm test                         # workspace vitest (includes packages/plaindeck-mcp/test)
npx @modelcontextprotocol/inspector plaindeck-mcp   # interactive inspection
```
