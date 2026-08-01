# Git-Native 可视化幻灯片编辑器项目计划书

> 项目名称：**PlainDeck**
> 文档版本：v0.1
> 项目形态：Pure Web / Local-first / Offline-capable
> 核心定位：以 JSON、设计变量和本地文件为基础的可视化幻灯片编辑器

---

## 1. 项目摘要

PlainDeck 是一个面向个人研究者、工程师和小型团队的轻量级幻灯片编辑器。它提供类似 PowerPoint 的逐页画布、拖拽、缩放、文字编辑和对齐操作，但不使用 PPTX 作为源文件，而是将演示文稿保存为结构清晰、可阅读、可进行 Git diff 的 JSON、CSS 和资源文件。

项目采用 Pure Web 架构。用户通过浏览器打开本地项目目录，编辑器直接读取和写入目录中的文本文件，不依赖 OneDrive、云同步服务或后端数据库。首次加载后，应用可作为 PWA 离线运行。Git 版本管理由外部工具负责，PlainDeck 只保证每次编辑产生稳定、最小、可理解的文件差异。

项目不以复刻 PowerPoint 为目标，而是提供一个受约束、声明式、Git-native 的二维幻灯片场景编辑器。

---

## 2. 背景与问题

现有演示文稿工具主要存在以下问题：

1. PPTX 是压缩后的 OOXML 容器，虽然内部包含 XML，但普通 Git 无法提供清晰、稳定的逐元素差异。
2. 云端演示工具依赖网络、账号体系和同步服务，弱网或离线环境下体验不稳定。
3. LaTeX、Beamer、Marp、Quarto 等文本方案适合版本控制，但精细布局通常需要反复修改代码，缺少直接拖拽。
4. 通用可视化编辑器通常将布局保存为复杂 JSON、XML 或二进制格式，文件差异噪声较大。
5. 用户实际需要的功能通常远少于 PowerPoint：固定页面比例、少量预设布局、文字、图片、基础形状和一致的全局主题已经能够覆盖大部分科研汇报。

因此，本项目的核心机会是：

> 用受约束的数据模型换取简单、稳定、可版本控制的可视化编辑体验。

---

## 3. 产品愿景

用户能够像使用简化版 PowerPoint 一样，通过拖拽修改页面；同时，项目目录仍然像代码项目一样透明：

```text
my-talk/
├── deck.json
├── theme.json
├── theme.css
├── layouts/
├── slides/
└── assets/
```

一次拖动只产生类似下面的 Git diff：

```diff
- "x": 80,
+ "x": 96,
```

最终形成以下工作流：

```text
创建或打开本地目录
        ↓
逐页可视化编辑
        ↓
自动保存 JSON / CSS
        ↓
Git 查看差异、提交和回滚
        ↓
导出 PDF / HTML / PPTX
```

---

## 4. 目标用户

### 4.1 核心用户

- 经常制作科研汇报的研究者和博士生；
- 希望演示文稿进入 Git 工作流的开发者；
- 网络不稳定、希望完全本地工作的用户；
- 使用 Markdown、Quarto、Obsidian，但需要更自由视觉布局的用户；
- 希望通过 AI 或脚本生成演示文稿，再进行人工拖拽修正的用户。

### 4.2 典型使用场景

1. 制作组会、开题、会议报告和课程展示。
2. 对比某一页在多个提交之间的布局与内容变化。
3. 使用脚本或 LLM 生成初稿 JSON，再通过画布调整。
4. 维护统一主题，并批量改变所有页面的字体、字号、颜色和间距。
5. 在断网环境中编辑并导出 PDF。
6. 将稳定版本导出为 PPTX，交给其他人播放或进行少量修改。

---

## 5. 项目目标

### 5.1 核心目标

1. 提供逐页、所见即所得的二维画布。
2. 支持文本、图片、矩形、线条等基础元素。
3. 支持拖动、缩放、选择、复制、层级和对齐。
4. 使用稳定、可读、可 Git diff 的文本格式保存项目。
5. 支持本地目录直接打开和保存。
6. 首次加载后能够离线使用。
7. 支持 HTML 和 PDF 导出。
8. 为后续 editable PPTX 导出保留清晰的数据接口。

### 5.2 非目标

MVP 不实现：

- 完整导入任意 PPTX；
- PowerPoint 全量动画和切换效果；
- SmartArt、复杂图表和完整 Office 兼容层；
- 多人实时协作；
- 云端账号、同步和权限系统；
- 视频剪辑、复杂矢量绘图和自由曲线；
- 任意 HTML、JavaScript 或无限制 CSS；
- 内置 Git commit、branch、merge 和 push；
- 移动端完整编辑。

---

## 6. 核心设计原则

### 6.1 Local-first

正式内容始终保存在用户可见的本地目录中。应用不得把项目上传到服务器。

### 6.2 Git-native

文件结构、序列化顺序和保存粒度必须为 Git diff 服务，而不是只为程序读取服务。

### 6.3 Constraint-first

通过固定页面比例、有限元素类型、预设布局和有限样式能力，控制实现复杂度和跨导出格式的不一致。

### 6.4 Visual editing, textual storage

用户主要通过画布操作，但任何结果都可以直接阅读和手工修改。

### 6.5 Stable identifiers

页面和元素具有稳定 ID。复制、移动和修改不得无故重新生成全部对象。

### 6.6 Explicit over implicit

元素位置、样式引用、资源路径和布局关系应显式保存，避免依赖难以追踪的自动推断。

---

## 7. 产品界面

推荐采用四区布局：

```text
┌──────────────┬─────────────────────────────┬──────────────┐
│ 页面缩略图    │                             │ 属性检查器    │
│              │         当前页面画布          │              │
│ 001          │                             │ Position     │
│ 002          │                             │ Typography   │
│ 003          │                             │ Appearance   │
├──────────────┴─────────────────────────────┴──────────────┤
│ 状态栏：缩放、页面尺寸、保存状态、离线状态、错误提示       │
└───────────────────────────────────────────────────────────┘
```

顶部工具栏包含：

- 选择工具；
- 文本；
- 图片；
- 矩形；
- 线条；
- 撤销与重做；
- 对齐和分布；
- 预览；
- 导出；
- 项目设置。

---

## 8. 用户工作流

### 8.1 新建项目

1. 点击“新建项目”。
2. 用户选择一个本地空目录。
3. 应用生成默认文件和示例页面。
4. 用户选择主题或页面比例。
5. 应用自动保存并进入编辑状态。

### 8.2 打开项目

1. 点击“打开目录”。
2. 浏览器请求目录读写权限。
3. 读取 `deck.json`。
4. 校验 schema version 和必要文件。
5. 加载主题、布局、页面和资源。
6. 如发现旧版本，先创建恢复快照，再执行迁移。

### 8.3 编辑页面

- 单击选择元素；
- Shift 单击多选；
- 拖动修改位置；
- 控制点修改尺寸；
- 双击编辑文字；
- 属性面板精确修改参数；
- 快捷键复制、删除、前移、后移；
- 对齐线、网格和其他元素提供吸附；
- 拖动过程只更新内存；
- 拖动结束后产生一个 undo command，并触发防抖保存。

### 8.4 保存与恢复

- 默认开启自动保存；
- 保存状态显示为“已保存 / 保存中 / 保存失败”；
- 正式文件写入项目目录；
- 最近操作快照写入 OPFS，用于刷新或崩溃后的恢复；
- 外部文件发生变化时提示用户重新加载或比较，不静默覆盖。

---

## 9. 文件与目录规范

```text
project/
├── deck.json
├── theme.json
├── theme.css
├── layouts/
│   ├── title.json
│   ├── section.json
│   └── two-column.json
├── slides/
│   ├── 001-title.json
│   ├── 002-problem.json
│   └── 003-method.json
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── exports/
└── .gitignore
```

### 9.1 `deck.json`

只保存演示文稿级信息和页面顺序：

```json
{
  "schemaVersion": "0.1",
  "id": "urban-sandbox-talk",
  "title": "Urban Sandbox",
  "canvas": {
    "width": 1600,
    "height": 900
  },
  "theme": "./theme.json",
  "slides": [
    "./slides/001-title.json",
    "./slides/002-problem.json",
    "./slides/003-method.json"
  ]
}
```

### 9.2 页面文件

```json
{
  "id": "method",
  "layoutRef": "../layouts/two-column.json",
  "background": {
    "token": "color.background"
  },
  "elements": [
    {
      "id": "method-title",
      "type": "text",
      "styleRef": "slide-title",
      "frame": {
        "x": 80,
        "y": 56,
        "w": 1440,
        "h": 90
      },
      "text": "Method"
    },
    {
      "id": "method-figure",
      "type": "image",
      "frame": {
        "x": 80,
        "y": 180,
        "w": 720,
        "h": 560
      },
      "src": "../assets/images/method.svg",
      "fit": "contain"
    }
  ]
}
```

### 9.3 坐标系统

MVP 使用固定逻辑画布，例如 `1600 × 900`：

- 所有坐标保存为整数；
- 浏览器按容器大小整体缩放；
- 不直接保存 CSS 像素；
- 不保存长浮点百分比；
- 拖动结束时根据吸附网格取整；
- 旋转角度也优先保存整数或固定一位小数。

固定逻辑画布已经能够表达相对页面位置，同时比百分比更容易阅读和比较。

### 9.4 主题文件

`theme.json` 保存可跨渲染器使用的 design tokens：

```json
{
  "fonts": {
    "title": "Source Han Sans SC",
    "body": "Source Han Sans SC",
    "mono": "JetBrains Mono"
  },
  "fontSizes": {
    "title": 64,
    "heading": 40,
    "body": 28,
    "caption": 20
  },
  "colors": {
    "background": "#FFFFFF",
    "text": "#202124",
    "muted": "#687078",
    "accent": "#315EFB"
  },
  "spacing": {
    "page": 80,
    "small": 16,
    "medium": 32,
    "large": 56
  }
}
```

`theme.css` 负责浏览器中的类样式和有限覆盖：

```css
:root {
  --font-title: "Source Han Sans SC";
  --font-body: "Source Han Sans SC";
  --size-title: 64px;
  --size-body: 28px;
  --color-background: #ffffff;
  --color-text: #202124;
  --color-accent: #315efb;
}

.slide-title {
  font-family: var(--font-title);
  font-size: var(--size-title);
  font-weight: 700;
  line-height: 1.15;
  color: var(--color-text);
}
```

约定：

- `theme.json` 是跨 PDF、HTML、PPTX 导出的基础语义源；
- `theme.css` 是 Web 渲染层；
- 自定义 CSS 超出支持子集时，HTML/PDF 可以保留，PPTX 不保证完全等价；
- 应用提供变量编辑器，修改变量时同步更新预览。

---

## 10. 元素模型

MVP 支持以下元素：

### 10.1 Text

```ts
type TextElement = {
  id: string;
  type: "text";
  frame: Frame;
  text: string;
  styleRef?: string;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  fit?: "none" | "shrink" | "clip";
  opacity?: number;
  rotation?: number;
};
```

MVP 仅支持整个文本框统一样式。局部富文本延后实现，以避免 JSON 和 PPTX 映射过早复杂化。

### 10.2 Image

支持 PNG、JPEG、WebP 和 SVG，具有 `contain`、`cover` 和 `stretch` 三种适配方式。

### 10.3 Shape

第一阶段支持矩形、圆角矩形和椭圆；样式包含填充、边框、圆角、透明度。

### 10.4 Line

支持直线、箭头、线宽和虚线。复杂连接器和自动路由不进入 MVP。

### 10.5 Group

MVP 可先实现临时多选，不立即保存永久 Group。永久分组在数据模型稳定后加入。

---

## 11. Git 友好策略

### 11.1 一页一个文件

修改某一页时，不应导致整份演示文稿发生变化。

### 11.2 稳定排序

- 页面顺序只在 `deck.json` 中保存；
- 页面内元素按 `zIndex` 或数组顺序稳定排列；
- 属性键使用固定顺序；
- 序列化统一为两个空格缩进和 LF 换行；
- 保存时不重新排序无关元素。

### 11.3 最小写入

只有真实发生变化的文件才写盘。打开和关闭项目不应产生无意义 diff。

### 11.4 拖动合并

一次完整拖动只形成一次状态变化，不记录每一个 pointer move。

### 11.5 资源策略

- 图片使用相对路径；
- 不把图片转为 Base64 写入 JSON；
- 重复资源按内容 hash 检测，但不自动重命名已有资源；
- 大型资源由用户决定是否进入 Git LFS。

### 11.6 可选语义差异

后续提供内部 diff viewer，将坐标变化解释为：

```text
method-title:
  moved right by 16 units
  width unchanged
```

该功能属于增强项，不影响普通 Git diff。

---

## 12. 技术架构

```text
┌─────────────────────────────────────────────┐
│                 Web Application             │
├─────────────────────────────────────────────┤
│ App Shell / Panels / Commands / Shortcuts   │
├─────────────────────────────────────────────┤
│ Editor State          DOM Slide Renderer    │
│ Selection             Text Editing          │
│ Undo / Redo           Move / Resize         │
├─────────────────────────────────────────────┤
│ Core Schema / Validation / Migration        │
├─────────────────────────────────────────────┤
│ Storage Adapter       Export Adapter        │
│ Local Folder          HTML / PDF / PPTX     │
│ OPFS Recovery                               │
└─────────────────────────────────────────────┘
```

### 12.1 推荐技术栈

- React；
- TypeScript；
- Vite；
- Zustand 或等价轻量状态管理；
- Zod 进行运行时 schema 校验和迁移入口；
- React Moveable 或 interact.js 处理拖动、缩放与吸附；
- File System Access API 访问本地目录；
- OPFS 保存恢复快照；
- Service Worker / Vite PWA 支持离线；
- PptxGenJS 作为后续 PPTX exporter；
- Vitest 进行单元测试；
- Playwright 进行交互和导出回归测试。

### 12.2 包结构

```text
packages/
├── core/
│   ├── schema/
│   ├── commands/
│   ├── migration/
│   └── geometry/
├── renderer-dom/
├── editor/
├── storage-browser/
├── export-html/
├── export-pptx/
└── app/
```

第一版可以保持单仓库和单应用，但代码边界应按以上模块组织，避免后续导出和文件系统逻辑侵入编辑器。

---

## 13. 状态管理与 Undo/Redo

编辑器状态分为三层：

1. **Document state**：需要写入 JSON 的正式内容；
2. **UI state**：当前选中元素、缩放、面板状态；
3. **Transient state**：拖动中的临时坐标、辅助线和 hover 状态。

Undo/Redo 采用 command 模型：

```ts
type EditorCommand = {
  id: string;
  label: string;
  apply(document: DeckDocument): DeckDocument;
  revert(document: DeckDocument): DeckDocument;
};
```

要求：

- 一次拖动对应一个 command；
- 连续文字输入可按时间窗口合并；
- Undo 历史默认保留 100 步；
- Undo 不直接写入文件，状态稳定后统一触发保存；
- 关闭项目后不承诺保留完整 undo 历史，但保留最近恢复快照。

---

## 14. Pure Web 文件访问方案

### 14.1 主路径

在支持 File System Access API 的桌面 Chromium 浏览器中：

```text
showDirectoryPicker()
        ↓
FileSystemDirectoryHandle
        ↓
读取 deck.json 和页面文件
        ↓
createWritable()
        ↓
原位保存
```

应用必须运行在 HTTPS 或 localhost 等 secure context 中。

### 14.2 浏览器兼容边界

目录选择入口并非所有主流浏览器都完整支持，因此 MVP 明确采用：

> Chrome / Edge desktop first

Safari 和 Firefox 的回退路径：

- 导入项目 ZIP；
- 在浏览器内编辑；
- 导出完整 ZIP；
- 或仅导出单个修改后的文件。

该回退路径不能提供与 Chromium 相同的原位目录保存体验。

### 14.3 权限处理

- 首次打开目录必须由用户主动操作触发；
- 启动时检查已有 handle 权限；
- 权限失效时提示重新授权；
- 不假设浏览器永久保存读写权限；
- 写入失败时保留内存状态和 OPFS 快照，不覆盖旧文件。

### 14.4 离线方案

- 静态应用资源由 Service Worker 缓存；
- 首次成功加载后显示“可离线使用”；
- 项目内容不写入 Service Worker cache；
- OPFS 只保存恢复数据和临时内容；
- 正式项目仍以用户目录为准；
- 应用更新时先提示，再刷新，避免编辑中途被新版本接管。

---

## 15. 渲染与编辑实现

### 15.1 DOM 而非 Canvas

MVP 使用 DOM 绝对定位：

```css
.slide-element {
  position: absolute;
  left: calc(var(--x) * 1px);
  top: calc(var(--y) * 1px);
  width: calc(var(--w) * 1px);
  height: calc(var(--h) * 1px);
}
```

画布外层统一缩放：

```css
.slide-stage {
  transform: scale(var(--zoom));
  transform-origin: top left;
}
```

采用 DOM 的原因：

- 文字编辑自然；
- CSS 主题直接生效；
- SVG 和图片支持简单；
- 可使用浏览器排版引擎；
- PDF 打印路径直接；
- 可访问性和调试性优于 Canvas。

### 15.2 性能策略

- 只完整渲染当前页；
- 前后页按需预加载；
- 缩略图使用低分辨率快照或简化渲染；
- 拖动时使用 transform，结束后再写回 frame；
- 不在 pointer move 中序列化和写盘；
- 大图片生成预览缓存，但保留原始资源用于导出。

---

## 16. 导出策略

### 16.1 HTML

HTML 是最接近编辑器预览的输出格式。每一页可以输出为固定比例 section，并附带导航和全屏播放逻辑。

### 16.2 PDF

通过专用 print route 和 print CSS 输出：

- 每页一个固定尺寸页面；
- 隐藏编辑器 UI；
- 使用浏览器打印生成 PDF；
- 字体必须在导出前加载完成；
- 提供 bleed、页边距和背景打印检查。

Pure Web MVP 不尝试静默生成系统文件，允许用户使用浏览器打印对话框。

### 16.3 PNG / SVG

增强版本支持逐页导出 PNG。SVG 仅对完全由 SVG、文字和基础形状组成的页面提供高保真输出。

### 16.4 Editable PPTX

PPTX 作为第二阶段功能：

```text
Text  → addText
Image → addImage
Shape → addShape
Line  → addShape(line)
Theme → slide master / explicit style
```

约束：

- 只映射项目支持的元素和样式子集；
- 浏览器与 PowerPoint 的文字测量可能不同；
- 文本框默认使用 shrink 或 clip；
- 自定义 CSS 不保证等价映射；
- 导出后必须进行 PowerPoint、Keynote 和 LibreOffice 的抽样测试；
- PPTX 导出失败不得影响原始项目文件。

---

## 17. MVP 功能范围

### P0：基础骨架

- 项目初始化；
- 页面列表；
- DOM 画布；
- JSON schema；
- 示例主题；
- 只读加载示例项目。

### P1：基本编辑

- 新建、删除、复制页面；
- 新建文本、图片和矩形；
- 选择、移动、缩放；
- 属性检查器；
- 双击编辑文本；
- 图层前移和后移。

### P2：可靠保存

- 打开本地目录；
- 自动保存；
- 保存状态；
- schema 校验；
- 错误恢复；
- OPFS 快照；
- ZIP fallback。

### P3：高频编辑能力

- Undo/Redo；
- 复制、粘贴和删除；
- 多选；
- 对齐；
- 网格和吸附；
- 键盘微调；
- 页面缩放和适应窗口。

### P4：主题与布局

- `theme.json`；
- CSS variables；
- 样式类；
- 预设 layout；
- 主题变量编辑器；
- 页面背景和全局字体。

### P5：导出和离线

- 演示预览；
- HTML 导出；
- PDF 打印；
- PWA 离线；
- 基础项目文档；
- 回归测试。

PPTX 导出列为 MVP+，不阻塞第一版交付。

---

## 18. 开发里程碑

以下周期按一名熟悉 React/TypeScript 的开发者估算。

| 阶段 | 周期 | 核心产出 |
|---|---:|---|
| M0：技术验证 | 2–3 天 | 本地目录读写、单页拖动、JSON 回写 |
| M1：数据模型与渲染 | 第 1 周 | schema、页面渲染、主题基础 |
| M2：编辑器核心 | 第 2–3 周 | 选择、拖动、缩放、文本编辑、属性面板 |
| M3：存储与恢复 | 第 4 周 | 目录打开、自动保存、OPFS、ZIP fallback |
| M4：生产力功能 | 第 5 周 | Undo、对齐、吸附、快捷键、多选 |
| M5：导出与离线 | 第 6 周 | HTML、PDF、PWA、基础测试 |
| M6：Beta 打磨 | 第 7 周 | 性能、错误提示、兼容性、文档 |
| M7：PPTX 实验 | 第 8 周 | 受限 editable PPTX exporter |

第 6 周形成可自用 MVP；第 8 周形成可邀请测试者使用的 Beta。

---

## 19. 测试计划

### 19.1 单元测试

- frame 坐标转换；
- 吸附计算；
- command apply/revert；
- schema validation；
- schema migration；
- canonical JSON serializer；
- 资源路径解析；
- design token 解析。

### 19.2 集成测试

- 新建项目后文件完整；
- 打开项目后页面顺序正确；
- 修改元素后只写入对应页面；
- 自动保存失败后可恢复；
- 旧 schema 可迁移；
- 删除资源时检测引用；
- ZIP 导入导出内容一致。

### 19.3 E2E 测试

使用 Playwright 覆盖：

1. 打开示例项目；
2. 新建文本；
3. 拖动并缩放；
4. 修改主题变量；
5. 保存并重新打开；
6. Undo/Redo；
7. 进入演示模式；
8. 触发打印；
9. 切换离线后重新启动。

### 19.4 视觉回归

为标准测试页保存截图，检查：

- 字体；
- 换行；
- 对齐；
- 图片裁剪；
- SVG；
- 不同缩放比例；
- 明暗主题；
- 打印页面。

---

## 20. 验收标准

MVP 必须满足：

1. Chrome/Edge desktop 能够打开本地项目目录。
2. 可以在完全离线状态下继续编辑已加载的应用。
3. 可以创建、删除、复制和排序页面。
4. 可以创建文本、图片、矩形和线条。
5. 拖动和缩放过程流畅，释放后坐标正确写入 JSON。
6. 单页修改只改变对应页面文件及必要元数据。
7. 无操作时打开并关闭项目不产生 Git diff。
8. Undo/Redo 至少稳定支持 50 个操作。
9. 刷新或异常关闭后能够发现并恢复较新的本地快照。
10. 主题变量变化能够影响所有使用该 token 的元素。
11. 能够进入无编辑 UI 的播放模式。
12. 能够通过浏览器生成分页正确的 PDF。
13. 对格式错误、资源缺失和写入失败提供明确错误信息。
14. 一个包含 50 页、每页 20 个基础元素的项目可以正常打开和编辑。
15. 项目格式有 schema version、示例和迁移策略。

---

## 21. 主要风险与应对

### 风险 1：浏览器目录 API 兼容性有限

**应对：**

- Chrome/Edge first；
- 明确 HTTPS/localhost 要求；
- 使用 storage adapter 隔离文件系统；
- 提供 ZIP fallback；
- 后续可用 Tauri 包装，但不修改 core 和 editor。

### 风险 2：浏览器与 PPTX 字体排版不一致

**应对：**

- PDF 作为第一优先输出；
- 固定受支持字体；
- 提供 shrink/clip 策略；
- PPTX exporter 只支持明确样式子集；
- 添加导出警告和文本溢出检测。

### 风险 3：JSON 逐渐膨胀为复杂通用格式

**应对：**

- 元素类型维持白名单；
- 新特性必须先定义使用场景和导出映射；
- MVP 不做任意 HTML、复杂富文本和嵌套布局；
- 使用 schema review 控制格式演化。

### 风险 4：自动保存覆盖外部修改

**应对：**

- 保存前比较文件修改时间或内容 hash；
- 发现外部变化时停止自动覆盖；
- 提供“重新加载、另存、查看差异”；
- OPFS 保留当前编辑快照。

### 风险 5：CSS 过于自由导致不可导出

**应对：**

- 将 `theme.json` 作为可移植语义层；
- CSS 仅负责 Web 表现；
- 明确 PPTX 支持的 CSS 子集；
- 属性面板优先产生可移植样式。

### 风险 6：拖动产生大量无意义 diff

**应对：**

- 固定逻辑坐标；
- 坐标取整；
- pointer up 后才提交；
- canonical serializer；
- 不保存派生属性和缓存。

---

## 22. 后续路线图

### v0.2

- PPTX 基础导出；
- 多选和永久分组；
- 页面模板库；
- 语义 diff；
- 导出前溢出检查；
- SVG 图标库。

### v0.3

- 图表元素；
- Mermaid 或受限 diagram；
- 公式元素；
- 表格；
- 演讲者备注；
- 页面级 transition；
- AI 生成 JSON 草稿。

### v0.4

- 插件系统；
- Quarto/Markdown 导入；
- Git 历史可视化；
- 评论和审阅标记；
- 可选 Tauri 桌面包装；
- 自定义 exporter。

---

## 23. 第一阶段实施任务清单

### 数据与核心

- [ ] 定义 `DeckSchema`、`SlideSchema` 和 `ElementSchema`
- [ ] 定义 schema version
- [ ] 编写 canonical JSON serializer
- [ ] 编写坐标、缩放和吸附函数
- [ ] 建立 schema migration 接口
- [ ] 创建两个示例项目

### 编辑器

- [ ] 页面缩略图栏
- [ ] 当前页画布
- [ ] 元素选择层
- [ ] 拖动和缩放
- [ ] 文本原位编辑
- [ ] 属性检查器
- [ ] 图层操作
- [ ] Undo/Redo
- [ ] 快捷键系统
- [ ] 对齐与吸附

### 存储

- [ ] 目录选择
- [ ] 读取项目
- [ ] 写入单页
- [ ] 防抖自动保存
- [ ] 权限状态检查
- [ ] 外部变化检测
- [ ] OPFS 恢复快照
- [ ] ZIP 导入导出

### 主题

- [ ] 读取 `theme.json`
- [ ] 生成 CSS variables
- [ ] 加载 `theme.css`
- [ ] 主题变量检查器
- [ ] layoutRef 和 slots
- [ ] 字体缺失提示

### 导出与发布

- [ ] 演示模式
- [ ] print route
- [ ] PDF 测试页
- [ ] 静态部署
- [ ] PWA 缓存
- [ ] 离线更新提示
- [ ] 项目格式文档
- [ ] 用户快速开始文档

---

## 24. 建议的首个技术验证

在正式开发前，用 2–3 天完成一个 vertical slice：

1. 使用 Vite + React 创建单页应用；
2. 点击按钮选择本地目录；
3. 读取一个 `slide.json`；
4. 将文本和图片按固定坐标渲染；
5. 拖动文本元素；
6. pointer up 后将整数坐标写回原文件；
7. 刷新后重新读取；
8. 使用 Git 验证 diff 是否仅包含预期坐标变化；
9. 断网后验证应用是否仍可启动；
10. 使用浏览器打印生成单页 PDF。

该验证完成后，项目最关键的技术路径即被打通。若该阶段无法稳定实现原位目录写入、最小 diff 和离线启动，应先解决基础问题，不进入复杂编辑功能。

---

## 25. 最终建议

本项目适合采用 Pure Web 实现，且第一版不需要后端。其技术难点不在页面渲染，而在以下三点：

1. 设计足够简单且可演化的 JSON schema；
2. 保证自动保存、Undo/Redo 与外部文件修改之间的一致性；
3. 限制 CSS 和元素能力，使 PDF、HTML 与后续 PPTX 导出保持可控。

推荐的产品顺序是：

```text
可靠文本格式
    ↓
可靠本地保存
    ↓
基础可视化编辑
    ↓
PDF / HTML
    ↓
生产力功能
    ↓
受限 PPTX
```

不要从 PPTX 兼容性、动画、复杂富文本或完整 PowerPoint 复刻开始。只要坚持“有限元素、全局主题、整数坐标、一页一文件、拖动结束才写入”，PlainDeck 就能够保持一个规模可控、定位清晰且具有实际个人使用价值的项目。
