import type { CSSProperties } from 'react'
import { PlainDeckSlide, type PlainDeckSlideProps } from '@mappedinfo/plaindeck-react'
import type { DeckDocument, ElementAnimation, SlideElement } from 'plaindeck/core'
import { AbsoluteFill, Easing, Series, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

const animationOffset = (enter: ElementAnimation['enter'], distance: number) => {
  if (enter === 'fade-up') return { translate: `0px ${distance}px` }
  if (enter === 'fade-down') return { translate: `0px ${-distance}px` }
  if (enter === 'fade-left') return { translate: `${distance}px 0px` }
  if (enter === 'fade-right') return { translate: `${-distance}px 0px` }
  if (enter === 'scale') return { scale: .94 }
  return {}
}

export function elementAnimationStyle(element: SlideElement, frame: number): CSSProperties {
  const animation = element.animation
  if (!animation || animation.enter === 'none') return {}
  const from = animation.delayFrames ?? 0
  const to = from + (animation.durationFrames ?? 18)
  const progress = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.16, 1, .3, 1),
  })
  const start = animationOffset(animation.enter, 34)
  return {
    opacity: (element.opacity ?? 1) * progress,
    ...(start.translate ? { translate: interpolate(progress, [0, 1], [start.translate, '0px 0px'], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) } : {}),
    ...(start.scale ? { scale: interpolate(progress, [0, 1], [start.scale, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', output: 'perceptual-scale' }) } : {}),
  }
}

export interface PlainDeckRemotionSlideProps extends Omit<PlainDeckSlideProps, 'style' | 'elementStyle'> {
  durationInFrames?: number
  style?: CSSProperties
}

export function PlainDeckRemotionSlide({ document, slidePath, durationInFrames, style, ...props }: PlainDeckRemotionSlideProps) {
  const frame = useCurrentFrame()
  const video = useVideoConfig()
  const camera = document.slides[slidePath]?.motion?.camera
  const cameraFrom = camera?.delayFrames ?? 0
  const cameraTo = cameraFrom + (camera?.durationFrames ?? durationInFrames ?? video.durationInFrames)
  const scale = camera ? interpolate(frame, [cameraFrom, cameraTo], [camera.fromScale, camera.toScale], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.2, .8, .2, 1), output: 'perceptual-scale',
  }) : 1
  return <AbsoluteFill style={{ backgroundColor: document.theme.colors.background, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
    <PlainDeckSlide {...props} document={document} slidePath={slidePath} style={{ transformOrigin: 'center', scale, ...style }} elementStyle={element => elementAnimationStyle(element, frame)} />
  </AbsoluteFill>
}

export interface PlainDeckTimelineItem { slidePath: string; durationInFrames: number }

export interface PlainDeckTimelineProps {
  document: DeckDocument
  items?: PlainDeckTimelineItem[]
  framesPerSlide?: number
  resolveAsset?: PlainDeckSlideProps['resolveAsset']
}

export function PlainDeckTimeline({ document, items, framesPerSlide = 150, resolveAsset }: PlainDeckTimelineProps) {
  const timeline = items ?? document.deck.slides.map(slidePath => ({ slidePath, durationInFrames: framesPerSlide }))
  return <Series>{timeline.map((item, index) => <Series.Sequence key={`${item.slidePath}-${index}`} durationInFrames={item.durationInFrames} name={`${index + 1}. ${document.slides[item.slidePath]?.name ?? item.slidePath}`}>
    <PlainDeckRemotionSlide document={document} slidePath={item.slidePath} durationInFrames={item.durationInFrames} resolveAsset={resolveAsset} />
  </Series.Sequence>)}</Series>
}
