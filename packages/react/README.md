# @plaindeck/react

Shared React renderer for PlainDeck JSON. It consumes the same presentation model as PlainDeck HTML, PNG and PDF output, so applications do not reimplement element geometry or typography.

```tsx
import { PlainDeckSlide } from '@plaindeck/react'

<PlainDeckSlide document={deck} slidePath="./slides/001-cover.json" />
```
