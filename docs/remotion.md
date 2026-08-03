# PlainDeck React 与 Remotion

PlainDeck 的页面内容只有一套实现：

```text
PlainDeck JSON → shared presentation model → @plaindeck/react
                                      ├── Web editor
                                      └── @plaindeck/remotion → video timeline
PlainDeck JSON → shared presentation model → HTML → PNG / PDF
```

`@plaindeck/react` 负责文本、图片、占位、形状文字、线条、背景、字体、主题和页脚。`@plaindeck/remotion` 不重新实现这些元素，只根据 `useCurrentFrame()` 为页面组件添加确定性的逐元素进入和页面缩放。

## React

```tsx
import { PlainDeckSlide } from '@plaindeck/react'

export const Preview = ({ deck }) => (
  <PlainDeckSlide
    document={deck}
    slidePath="./slides/001-intro.json"
    resolveAsset={src => `/project/${src}`}
  />
)
```

## Remotion

```tsx
import { AbsoluteFill } from 'remotion'
import { PlainDeckTimeline } from '@plaindeck/remotion'

export const Video = ({ deck }) => (
  <AbsoluteFill>
    <PlainDeckTimeline document={deck} framesPerSlide={150} />
    <CaptionLayer />
    <AudioLayer />
  </AbsoluteFill>
)
```

每个 PlainDeck 页面占用固定帧数。字幕、配音、背景音乐和额外镜头可以作为兄弟图层放在时间轴上；它们不应复制页面文字或布局。仓库内的 [`examples/remotion`](../examples/remotion) 是可执行 composition，运行 `npm run test:remotion` 会在第 60 帧生成真实 PNG。

## paper-to-Bilibili 迁移

现有流程可以保留 storyboard、TTS、字幕与音频，只替换画面层：让 storyboard 先生成 PlainDeck JSON，再把 `PlainDeckTimeline` 放入原来的 Remotion composition。发布 `@plaindeck/*` 后再使用 npm 依赖接入，避免在另一个仓库提交易失效的 `file:` 路径。

推荐边界：

- PlainDeck：页面语义、布局、主题、静态渲染、元素进入与页面镜头元数据；
- paper-to-Bilibili：视频节奏、配音、字幕、背景音乐、转场编排和最终编码。
