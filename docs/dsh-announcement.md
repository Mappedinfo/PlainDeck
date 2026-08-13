# PlainDeck MCP — let agents build slide decks, with Git as the undo button

> **TL;DR** I packaged [PlainDeck](https://github.com/Mappedinfo/PlainDeck) — a local-first, Git-native slide format with an Agent API — as an MCP server, shipped inside the [`plaindeck`](https://www.npmjs.com/package/plaindeck) package as the `plaindeck/mcp` subpath (`plaindeck-mcp` bin). Any dsh agent can now scaffold, edit, validate, and render a slide deck from research notes, with every step landing as a reviewable JSON diff.

## Why slides as agent-native files?

PlainDeck treats a presentation as a folder of plain JSON: `deck.json` (order, canvas, footer), `theme.json` (design tokens), and one file per slide. A slide is just elements — text, image, shape, line, table — with frames and styles. That makes decks:

- **Git-reviewable** — moving a title 16px is a two-line diff; an agent's whole edit session is `git diff`.
- **Composable by agents** — the same `apply` operation batch powers the Web canvas, the CLI, and now MCP tools.
- **Renderable everywhere** — the same JSON renders to the Web editor, standalone HTML, PNG/PDF (Playwright), React, and Remotion video.

## The tools

| Tool | What it does |
|---|---|
| `init` | Scaffold a project — templates: `showcase`, `pitch`, `blank`, `paper-reading`, `nature-methods`; 9 built-in themes |
| `inspect` | Overview: title, canvas, per-slide path/name/layout/element counts |
| `validate` | Schema-validate the whole project; structured `valid`/`issues` result (never throws) |
| `apply_operations` | Apply a batch of operations (`set-element`, `rename-slide`, `add-slide`, `set-theme`, …) with optional `dryRun` preview |
| `add_cards` | Structured Markdown/JSON → an adaptive summary-card slide (174 visual recipes via `styles`) |
| `add_table` | Markdown / CSV / TSV / JSON → a native table slide (`rules` / `grid` / `stripes`) |
| `render` | Standalone HTML player (inline or to file), or PNG/PDF via Playwright |
| `styles` | Search the 174 card recipes |

## Connect it to dsh

```sh
npm install --global plaindeck
```

Then add this Cordis overlay (`dsh web --patch plaindeck.cordis.yml` or merge into `$DSH_HOME/cordis.patch.yml`):

```yaml
- insert:
    - id: mcp-plaindeck
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: plaindeck
        transport: stdio
        command: plaindeck-mcp
        args: []
```

Tools appear as `mcp__plaindeck__init`, `mcp__plaindeck__apply_operations`, … (the overlay ships inside the npm package). Works with any MCP client — Claude Code, Codex, etc. Node ≥ 22; PNG/PDF additionally need `npx playwright install chromium`.

## A worked demo

Ask the agent to "build a paper-reading deck from my notes":

**1. Scaffold**
```
mcp__plaindeck__init {
  "projectPath": "/tmp/language-of-thought",
  "template": "paper-reading",
  "title": "Is the language of thought natural language?"
}
→ 8 slides scaffolded (problem → contributions → figure → table → comparison → limits → closing)
```

**2. Inspect before editing**
```
mcp__plaindeck__inspect { "projectPath": "/tmp/language-of-thought" }
→ title, canvas 1600×900, each slide's path/name/layout/element count
```

**3. Edit via operations (dry-run first)**
```
mcp__plaindeck__apply_operations {
  "projectPath": "/tmp/language-of-thought",
  "dryRun": true,
  "operations": [
    { "op": "rename-slide", "slide": "./slides/002-problem.json", "name": "The bottleneck" },
    { "op": "set-element", "slide": "./slides/001-cover.json", "element": "title",
      "patch": { "text": "Reasoning without language: fMRI and aphasia evidence" } }
  ]
}
→ changedPaths previewed, nothing written
```

**4. Turn notes into a card slide**
```
mcp__plaindeck__add_cards {
  "projectPath": "/tmp/language-of-thought",
  "style": "claudeStyle",
  "content": "# Three contributions
## Dual evidence
fMRI shows language areas stay silent during logical reasoning.
## Behavior preserved
Two patients with severe aphasia reason at normal levels.
## Boundary stated
Adult brain only; conceptual acquisition in childhood is out of scope."
}
→ new ./slides/009-contributions.json with 3 adaptive cards
```

**5. Add the benchmark table**
```
mcp__plaindeck__add_table {
  "projectPath": "/tmp/language-of-thought",
  "data": "# Reasoning benchmark
| Method | Accuracy |
| --- | ---: |
| Baseline | 71.2 |
| Ours | 84.6 |
Takeaway: +13.4 pts on held-out reasoning",
  "style": "rules"
}
→ new table slide, 2×2, header row + takeaway
```

**6. Validate, then render**
```
mcp__plaindeck__validate { "projectPath": "/tmp/language-of-thought" }
→ { "valid": true, "slideCount": 10, "issues": [] }

mcp__plaindeck__render {
  "projectPath": "/tmp/language-of-thought",
  "format": "html",
  "output": "/tmp/language-of-thought/exports/deck.html"
}
→ standalone player page you can open in any browser or email to someone
```

The whole session is `git diff` in the project folder — one file per slide, tiny textual changes, fully reviewable before you ever open a renderer.

## Links

- Repo: [github.com/Mappedinfo/PlainDeck](https://github.com/Mappedinfo/PlainDeck) (tagged [`dsh-plugin`](https://github.com/topics/dsh-plugin))
- npm: [plaindeck (subpath `plaindeck/mcp`)](https://www.npmjs.com/package/plaindeck (subpath `plaindeck/mcp`))
- Operation contract: [`docs/agent-api.md`](https://github.com/Mappedinfo/PlainDeck/blob/main/docs/agent-api.md)
- Project format: [`docs/project-format.md`](https://github.com/Mappedinfo/PlainDeck/blob/main/docs/project-format.md)

Feedback welcome — issues and ideas in the repo, or right here. I'd love to hear what decks your agents end up making.
