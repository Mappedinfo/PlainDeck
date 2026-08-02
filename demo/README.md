# PlainDeck demo gallery

These three five-slide decks were created with the public `plaindeck` CLI workflow:

```text
init → inspect → operations → validate → dry-run → apply → render
```

Every slide remains an editable JSON file. The committed `operations.json` files show the stable-path, stable-element-ID changes an Agent used to turn a starter template into a finished story.

| Demo | Theme | Editable source | PDF |
| --- | --- | --- | --- |
| Generative AI: A Practical Mental Model | `night-citrus` | [`generative-ai`](./generative-ai) | [Download PDF](./renders/generative-ai.pdf) |
| How the Internet Works | `editorial-blue` | [`how-the-internet-works`](./how-the-internet-works) | [Download PDF](./renders/how-the-internet-works.pdf) |
| How Learning Sticks | `paper-signal` | [`how-learning-sticks`](./how-learning-sticks) | [Download PDF](./renders/how-learning-sticks.pdf) |

## Reproduce one demo

Use Node.js 22 or newer and install Playwright Chromium once for PDF rendering:

```bash
npm install plaindeck playwright
npx playwright install chromium

npx plaindeck init ./generative-ai \
  --title "Generative AI: A Practical Mental Model" \
  --id generative-ai \
  --template showcase \
  --theme night-citrus

npx plaindeck inspect ./generative-ai --json
npx plaindeck apply ./generative-ai --ops ./demo/generative-ai/operations.json --dry-run --json
npx plaindeck apply ./generative-ai --ops ./demo/generative-ai/operations.json
npx plaindeck validate ./generative-ai
npx plaindeck render ./generative-ai --format pdf --output ./generative-ai.pdf
```

Run the commands from a clean working directory and point `--ops` to the copied operations file. The other two demos follow the same sequence with their corresponding title, ID, theme, and operations file.

## Source notes

The decks use no external images. Non-trivial knowledge claims were checked against primary or standards sources:

- Generative AI: [Vaswani et al., *Attention Is All You Need*](https://arxiv.org/abs/1706.03762) and [NIST AI RMF 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10).
- Internet: [IETF RFC 8200, Internet Protocol Version 6](https://datatracker.ietf.org/doc/html/rfc8200) and [IETF RFC 9110, HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc9110).
- Learning: [Roediger & Karpicke, 2006](https://pubmed.ncbi.nlm.nih.gov/16507066/) and [Dunlosky et al., 2013](https://doi.org/10.1177/1529100612453266).
