# plaindeck

Agent-friendly API, CLI, and renderer for the PlainDeck Git-native slide format.

```bash
npm install plaindeck
npx plaindeck init ./my-deck --title "Make the idea visible"
npx plaindeck validate ./my-deck
npx plaindeck inspect ./my-deck --json
```

## Made with `plaindeck`

Each example below is a real five-slide PlainDeck project generated through `init → operations → validate → render`. Click a cover to download the PDF, or open the source to inspect one editable JSON file per slide.

| Generative AI | How the Internet Works | How Learning Sticks |
| --- | --- | --- |
| [![Generative AI demo](https://raw.githubusercontent.com/Mappedinfo/PlainDeck/main/demo/renders/generative-ai-cover.png)](https://github.com/Mappedinfo/PlainDeck/raw/main/demo/renders/generative-ai.pdf) | [![Internet demo](https://raw.githubusercontent.com/Mappedinfo/PlainDeck/main/demo/renders/how-the-internet-works-cover.png)](https://github.com/Mappedinfo/PlainDeck/raw/main/demo/renders/how-the-internet-works.pdf) | [![Learning demo](https://raw.githubusercontent.com/Mappedinfo/PlainDeck/main/demo/renders/how-learning-sticks-cover.png)](https://github.com/Mappedinfo/PlainDeck/raw/main/demo/renders/how-learning-sticks.pdf) |
| [Source](https://github.com/Mappedinfo/PlainDeck/tree/main/demo/generative-ai) · [PDF](https://github.com/Mappedinfo/PlainDeck/raw/main/demo/renders/generative-ai.pdf) | [Source](https://github.com/Mappedinfo/PlainDeck/tree/main/demo/how-the-internet-works) · [PDF](https://github.com/Mappedinfo/PlainDeck/raw/main/demo/renders/how-the-internet-works.pdf) | [Source](https://github.com/Mappedinfo/PlainDeck/tree/main/demo/how-learning-sticks) · [PDF](https://github.com/Mappedinfo/PlainDeck/raw/main/demo/renders/how-learning-sticks.pdf) |

[Browse the demo gallery and reproduction commands](https://github.com/Mappedinfo/PlainDeck/tree/main/demo).

## CLI

```bash
plaindeck init ./pitch --template pitch --theme night-citrus
plaindeck apply ./my-deck --ops changes.json --dry-run --json
plaindeck add-slide ./my-deck --layout image-right --name "Results"
plaindeck render ./my-deck --format html --output dist/deck.html
plaindeck render ./my-deck --format png --output dist/slides
plaindeck render ./my-deck --format pdf --output dist/deck.pdf
```

`init` defaults to the five-slide `showcase` template and the `studio-cobalt` theme. Templates are `showcase`, `pitch`, and `blank`; color systems include `studio-cobalt`, `night-citrus`, `ink-rose`, `paper-signal`, `night-blue`, `field-notes`, `editorial-blue`, and `poster-red`.

HTML output is a standalone Web presentation with keyboard navigation, progress, slide names, and fullscreen. PNG/PDF use the same layout renderer in document mode.

PNG and PDF rendering require Playwright Chromium:

```bash
npm install playwright
npx playwright install chromium
```

External image requests are blocked by default. Pass `--allow-network` only for trusted projects that intentionally use remote images.

## TypeScript API

```ts
import { applyOperations, createDeckTemplate, loadDeck, saveDeck, validateDeck } from 'plaindeck'
import { renderHtml } from 'plaindeck/render'

const deck = await loadDeck('./my-deck')
const result = applyOperations(deck, [
  {
    op: 'set-element',
    slide: './slides/001-intro.json',
    element: 'title',
    patch: {
      text: 'A new title',
      animation: { enter: 'fade-up', delayFrames: 12, durationFrames: 20 },
    },
  },
  {
    op: 'set-slide-motion',
    slide: './slides/001-intro.json',
    motion: { camera: { fromScale: 1, toScale: 1.04, durationFrames: 150 } },
  },
  {
    op: 'set-footer',
    footer: {
      left: { type: 'slide-name' },
      center: { type: 'date' },
      right: { type: 'page-of-count' },
    },
  },
])

const validation = validateDeck(result.document)
if (!validation.valid) throw new Error(JSON.stringify(validation.issues))
await saveDeck('./my-deck', result.document, result.changedPaths)
const html = renderHtml(result.document)
```

To create a project in memory, call `createDeckTemplate('showcase', { title, theme: 'studio-cobalt' })`; the CLI `init` command uses this same factory.

PlainDeck uses stable slide paths and element IDs so Agent changes remain easy to inspect in Git.

Node-only rendering functions are exported from the package root, while `plaindeck/render` contains the browser-safe pure HTML renderer:

```ts
import { loadDeck, renderPdf, renderPng } from 'plaindeck'

const deck = await loadDeck('./my-deck')
await renderPng(deck, { projectPath: './my-deck', output: './dist/slides' })
await renderPdf(deck, { projectPath: './my-deck', output: './dist/deck.pdf' })
```

For React and video output, install `@plaindeck/react` and `@plaindeck/remotion`. They use the same layout implementation as HTML/PNG/PDF; Remotion only interprets optional animation and camera metadata.

See the [Agent API and operation contract](https://github.com/Mappedinfo/PlainDeck/blob/main/docs/agent-api.md) for the complete v0.3 interface, including document-level automatic footers and readable motion. The project schema remains `0.1`.

## License

MIT
