# plaindeck

Agent-friendly API, CLI, and renderer for the PlainDeck Git-native slide format.

```bash
npm install plaindeck
npx plaindeck validate ./my-deck
npx plaindeck inspect ./my-deck --json
```

## CLI

```bash
plaindeck apply ./my-deck --ops changes.json --dry-run --json
plaindeck add-slide ./my-deck --layout image-right --name "Results"
plaindeck render ./my-deck --format html --output dist/deck.html
plaindeck render ./my-deck --format png --output dist/slides
plaindeck render ./my-deck --format pdf --output dist/deck.pdf
```

PNG and PDF rendering require Playwright Chromium:

```bash
npm install playwright
npx playwright install chromium
```

External image requests are blocked by default. Pass `--allow-network` only for trusted projects that intentionally use remote images.

## TypeScript API

```ts
import { applyOperations, loadDeck, saveDeck, validateDeck } from 'plaindeck'
import { renderHtml } from 'plaindeck/render'

const deck = await loadDeck('./my-deck')
const result = applyOperations(deck, [
  {
    op: 'set-element',
    slide: './slides/001-intro.json',
    element: 'title',
    patch: { text: 'A new title' },
  },
])

const validation = validateDeck(result.document)
if (!validation.valid) throw new Error(JSON.stringify(validation.issues))
await saveDeck('./my-deck', result.document, result.changedPaths)
const html = renderHtml(result.document)
```

PlainDeck uses stable slide paths and element IDs so Agent changes remain easy to inspect in Git.

Node-only rendering functions are exported from the package root, while `plaindeck/render` contains the browser-safe pure HTML renderer:

```ts
import { loadDeck, renderPdf, renderPng } from 'plaindeck'

const deck = await loadDeck('./my-deck')
await renderPng(deck, { projectPath: './my-deck', output: './dist/slides' })
await renderPdf(deck, { projectPath: './my-deck', output: './dist/deck.pdf' })
```

See the [Agent API and operation contract](https://github.com/Mappedinfo/PlainDeck/blob/main/docs/agent-api.md) for the complete v0.1 interface.

## License

MIT
