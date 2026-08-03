# PlainDeck Remotion example

This composition imports the existing PlainDeck starter JSON and renders it through `@mappedinfo/plaindeck-remotion`. No slide layout is recreated in React.

```bash
npm run test:remotion
npx remotion studio examples/remotion/src/index.ts --no-open
```

The adapter reads element `animation` and slide `motion.camera` metadata while `@mappedinfo/plaindeck-react` remains responsible for the page itself.
