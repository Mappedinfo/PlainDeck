import { PlainDeckRemotionSlide } from 'plaindeck/remotion'
import { Composition } from 'remotion'
import { document } from './deck'

const Demo = () => <PlainDeckRemotionSlide document={document} slidePath="./slides/001-intro.json" durationInFrames={150} />

export const RemotionRoot = () => <Composition
  id="PlainDeckDemo"
  component={Demo}
  durationInFrames={150}
  fps={30}
  width={document.deck.canvas.width}
  height={document.deck.canvas.height}
/>
