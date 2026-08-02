# PlainDeck

> **像 PPT 一样编辑，像代码一样保存。**

PlainDeck 是一个以用户操作为先的幻灯片编辑器：你在浏览器里拖拽排版，底层文件则保持为 AI 能读写、Git 能管理的 JSON。

[在线试用](https://mappedinfo.github.io/PlainDeck/) · [查看源码](https://github.com/Mappedinfo/PlainDeck)

## 30 秒看懂

- **对人友好**：逐页画布、拖放、缩放、文字编辑和主题调整，不需要手写代码。
- **对 AI 友好**：内容、位置和样式都是结构清楚的文本；AI 可以生成或修改初稿，你再用画布精调。
- **对 Git 友好**：一页一个文件，移动一个元素通常只改变几个数字，可以查看差异、提交和回滚。
- **文件属于你**：项目保存在你选择的本地文件夹里，不要求账号，不把演示文稿上传到服务器。

一句更短的介绍：

> **用户用画布编辑，AI 读写内容，Git 记录每一次变化。**

## 为什么不直接使用 PPTX 或 PDF？

PPTX 是压缩的 OOXML 容器，PDF 主要面向最终交付。它们并非完全不可读取，但普通 Git 很难稳定显示“标题右移了 16 像素”或“这一页只改了一句话”，AI 修改后也容易产生难以审查的大块变化。

PlainDeck 使用开放、稳定的文本源文件：

```diff
  "frame": {
-   "x": 80,
+   "x": 96,
    "y": 56,
    "w": 720,
    "h": 90
  }
```

## 怎么使用

### 先体验，不创建文件

打开[在线版本](https://mappedinfo.github.io/PlainDeck/)，直接拖动默认模板中的元素。此时修改只保存在浏览器恢复快照中。

### 正式制作

1. 使用桌面版 Chrome 或 Edge 打开在线版本。
2. 点击左上角“新建项目”，选择一个本地空文件夹。
3. 拖拽编辑；PlainDeck 会把页面自动保存为 JSON。
4. 使用 VS Code、终端或 GitHub Desktop 查看 diff、提交和回滚。
5. 通过“导出”生成独立 HTML、项目 ZIP，或使用浏览器打印为 PDF。

也可以复制 [`examples/starter`](./examples/starter)，然后在 PlainDeck 中选择“打开目录”。Firefox 和 Safari 暂不支持原位目录写入，可使用 ZIP 导入和导出。

## 优缺点对比

| 能力 | PlainDeck | PowerPoint / PPTX | PDF | Marp / Quarto |
| --- | --- | --- | --- | --- |
| 直接拖拽排版 | **支持** | **最强** | 不适合编辑 | 通常需要改源码 |
| 源文件可读 | **JSON，一页一文件** | OOXML 压缩容器 | 面向呈现 | Markdown / Quarto |
| 普通 Git 差异 | **清楚到元素属性** | 通常只能看到文件变化 | 通常只能看到文件变化 | **清楚** |
| AI 生成后人工精调 | **适合** | 需要专用工具链 | 不适合 | 适合生成，精调偏代码 |
| 复杂动画与 Office 兼容 | 有限 | **最强** | 只保留结果 | 有限 |
| 本地与离线 | **支持** | 支持 | 支持 | 支持 |

## 适合与不适合

PlainDeck 适合：

- 科研汇报、课程展示、技术方案和工程周报；
- 先让 AI 生成结构化初稿，再由人拖拽完善；
- 希望文件长期保存在自己目录，并能审查每次修改；
- 觉得纯 Markdown 幻灯片不够自由，又不需要完整 PowerPoint 功能。

PlainDeck 当前不适合：

- 依赖复杂动画、SmartArt、宏或完整 Office 兼容的演示；
- 多人实时协作、评论审批和云端权限管理；
- 无损导入任意 PPTX；
- 把 Git 或 AI 功能直接内置进编辑器——当前版本提供友好的文件格式，Git 与 AI 工具由用户自行选择。

## 本地开发

要求 Node.js 22 或更新版本。

```bash
npm install
npm run dev
```

质量检查：

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## 已实现的 MVP 能力

- Zod schema、`0.1` schema version、迁移入口和 canonical JSON serializer；
- 页面新建、复制、删除、排序，文本、图片、矩形和线条元素；
- 选择、Shift 多选、拖动、缩放、属性编辑、图层、对齐和网格吸附；
- 100 步 Undo/Redo、复制、删除和键盘微调；
- 本地目录读写、防抖最小写入、外部修改保护和 OPFS 恢复快照；
- ZIP 导入导出、独立 HTML、演示模式、浏览器 PDF 和 PWA 离线缓存。

## 部署与项目格式

推送到 `main` 后，[Pages 工作流](./.github/workflows/deploy-pages.yml)会完成检查、构建并部署在线版本。

完整格式说明见 [`docs/project-format.md`](./docs/project-format.md)，项目目标与设计背景见 [`PlainDeck_项目计划书_v0.1.md`](./PlainDeck_项目计划书_v0.1.md)。
