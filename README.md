# PlainDeck

PlainDeck 是一个 Pure Web、Local-first、Git-native 的可视化幻灯片编辑器。它像轻量版 PowerPoint 一样提供逐页画布、拖放、缩放、文字编辑与主题调整，但使用稳定、可读的一页一 JSON 文件作为源格式。

## 本地运行

要求 Node.js 22 或更新版本。

```bash
npm install
npm run dev
```

在 Chrome 或 Edge 中打开 Vite 输出的 localhost 地址。应用内置两页演示项目，无需目录权限即可体验编辑器。

## 本地目录工作流

1. 点击“新建项目”，选择一个空目录，PlainDeck 会写入完整示例项目。
2. 或复制 [`examples/starter`](./examples/starter) 后点击“打开目录”。
3. 元素操作结束后，编辑器防抖保存；一页的修改只写该页 JSON。
4. 使用终端、VS Code 或 GitHub Desktop 查看 diff、提交和回滚。PlainDeck 不内置 Git 操作。

File System Access API 需要 secure context，支持路径为桌面 Chrome/Edge + localhost/HTTPS。Firefox/Safari 可使用项目 ZIP 导入和导出。

## 已实现的 MVP 能力

- Zod schema、`0.1` schema version、迁移入口和 canonical JSON serializer；
- 页面新建、复制、删除、排序，文本/图片/矩形/线条元素；
- 选择、Shift 多选、拖动、缩放、属性编辑、图层顺序、对齐和网格吸附；
- 100 步 Undo/Redo、复制/删除/微调快捷键；
- 本地目录打开/初始化、防抖最小写入、权限检查和 OPFS 恢复快照；
- ZIP 导入/导出、独立 HTML、演示模式和浏览器 PDF 打印；
- 主题变量编辑和 PWA 离线缓存；
- Vitest 单元测试和 Playwright 交互测试。

图片资源在本地项目中使用相对路径。当前编辑器不会擅自重命名或 Base64 内联资源。PPTX 按计划书属于 MVP+，不阻塞 v0.1。

## 命令

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## 项目格式

完整格式说明见 [`docs/project-format.md`](./docs/project-format.md)，项目目标与验收背景见 [`PlainDeck_项目计划书_v0.1.md`](./PlainDeck_项目计划书_v0.1.md)。
