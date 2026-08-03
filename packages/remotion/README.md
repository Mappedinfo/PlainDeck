# @mappedinfo/plaindeck-remotion

Frame-driven Remotion adapter for PlainDeck. Layout, typography, shapes and images are rendered by `@mappedinfo/plaindeck-react`; this package only applies optional element entrances, slide camera motion and timeline sequencing.

```tsx
import { PlainDeckTimeline } from '@mappedinfo/plaindeck-remotion'

<PlainDeckTimeline
  document={deck}
  framesPerSlide={180}
/>
```

PlainDeck JSON remains the editable source. Captions and audio can be layered by the consuming Remotion composition without recreating slide markup.
