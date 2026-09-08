# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)，版本号遵循语义化版本（[SemVer](https://semver.org/)）。

## [Unreleased]

### 新增

- 内置演示制作指导：`plaindeck/core` 导出 `PresentationBriefSchema`、`createPresentationGuidance` 和 `auditPresentation`，按听众、目的、时长、核心主张与证据深度组织中英双语提示词。
- CLI 增加 `guide` 与只读 `review`；MCP 增加 `presentation_guide`、`review_presentation` 工具和 `build_presentation` 提示词入口。启发式检查提供页面及元素定位，独立于 schema 校验和渲染复核。
- Web 工具栏增加“制作指导”：简报按项目保存在本机浏览器，实时预览及复制提示词，并从检查建议定位页面或元素；生成指导和检查均在本地执行。

### 优化

- 制作规则和默认文案强调直接陈述核心主张及支持证据，保留必要比较、真实负结果和证据边界；示例数据明确标注用途。
- 补充 EasySlides 制作原则的来源及 PlainDeck 适配说明，更新 Agent API、开发指导和 README 中的 MCP 与本地 AI 指导能力说明。

### 修复

- 窄窗口下画布按实际可用空间自动缩放，缩略图随侧栏宽度与画布比例适配，支持低于 20% 的缩放。
- 状态栏在窄窗口保留保存状态与缩放控件，项目信息和链接收进展开菜单；错误提示独立成行，可展开查看全文。

## [v0.10.0] - 2026-08-27

### 新增

- **课程讲义模板 `course-lecture`（6 页，中英双语，field-notes 主题）**：封面、路线图三卡、概念类比大字页、例证原图页、常见误区页、复述式回顾。
- **数据故事模板 `data-story`（6 页，中英双语，night-citrus 主题）**：数字先行封面（口径→对照→结论节点装饰）、结论先行 hook 页、关键指标页、方法对照页、三条要点卡与收尾金句。
- **在线示例库（GitHub Pages `/PlainDeck/renders/`）**：9 套演示 deck 的可播放 HTML、PDF 与封面 PNG 一站式浏览——覆盖全部内置模板（flowchart / data-story / course-lecture 各有中英双版本）。编辑器状态栏新增 SAMPLES 入口；PWA 预缓存排除 renders 目录避免体积膨胀；`demo/renders/` 同步刷新全部 PDF 与封面图。

### 文档

- 包 README 补充示例库链接与两个新模板说明。

## [v0.9.0] - 2026-08-27

### 新增

- **流程图模板 `flowchart`（5 页，中英双语）**：封面（输入→分支→回环节点装饰）、「横向流程图」流水线页、「判断分支图」条件 + 是/否分支 + 回环路径页、画图纪律检查清单页、收尾金句页。`plaindeck init --template flowchart` 或 `createDeckTemplate('flowchart', { lang })` 即可使用。
- **两个新布局预设**：`process-flow`（四步节点流水线，起点/终点实心锚定）与 `decision-branch`（判断菱形位 + Yes 箭头 + 失败回环括号），全部用 schema 原生的形状色条与右向箭头线构成，静态导出与编辑器表现一致；节点与箭头自带阶梯式 `fade-up/scale` 入场动画（Remotion/Web 播放生效，静态导出不受影响）。
- 布局选择器为两个新布局增加缩略图示意。

### 优化

- 布局选择器面板在预设增多后改为限高滚动（20 个预设不再越过画布标题区）；z-index 提升避免遮挡。
- 文档同步：包 README 模板清单补充 flowchart 与双语文案说明；agent-api 的 init 模板参数与 locale 目录函数（`layoutPresetsFor` 等）用法。

## [v0.8.0] - 2026-08-27

### 新增

- **演示文稿内容按浏览器语言自动切换**：新增 `resolveLocale()`（`plaindeck/core`），把 BCP-47 语言标签归一化为 `zh` / `en`（其余一律回退英语）。编辑器打开时的示例项目、`createDeckTemplate({ lang })` 五个模板的全部文案、18 种布局的占位文字、新页面的布局命名，现在都会跟随浏览器语言；CLI / MCP 不传 `lang` 时保持中文不变。
- **语言手动切换闭环**：编辑器工具栏新增语言按钮（虚线框 = 自动检测态），点击循环 自动检测 → EN → 中；未动过的纯示例文档会即时替换为新语言的 demo，手动选择持久化到 localStorage（`rememberDeckLocale`）。
- **预设元数据双语目录**：新增 `layoutPresetsFor(locale)` / `getLayoutPreset(id, locale)` / `themePresetsFor(locale)` / `deckTemplatePresetsFor(locale)`，「图文并排 ↔ Image + text」「钴蓝工作室 ↔ Cobalt studio」等名称与描述随 locale 输出；原数组保持不变，CLI/MCP 零影响。
- **结构化双语错误 `PlainDeckError(code, { zh, en })`**：内核 45 处 throw 点全部迁移（operations/schema/templates/render/node/mcp 等）。`.message` 保持中文原句（向后兼容），新增 `.code`（机器可读错误码）、`.localized` 与 `.for(locale)`，Agent/MCP 消费者可按码分支或取目标语言句子。附 `errorMessage(error, locale?)` 工具函数。
- 编辑器错误提示本地化：图片校验、目录权限、ZIP 缺失、外部修改保护等全部经 `LocalizedError` 按当前界面语言出句；切换语言后待显示的错误提示也跟随。
- **采用色卡实验室 Palette Lab 配色**：品牌主色改为珊瑚 `#E97A46`（源自 [Palette Lab](https://mappedinfo.github.io/palette-lab/)，机器可读档案 [llms-full.txt](https://mappedinfo.github.io/palette-lab/llms-full.txt)），编辑器界面换用其色板（珊瑚强调、琥珀悬停、宣纸纸面、朱砂表格强调、象牙预览）。
- 内置主题新增四套 Palette Lab 学术配色：`palette-vermillion`（宣纸与朱砂）、`palette-ice-magenta`（冰蓝与品红）、`palette-jade-ivory`（翡翠与象牙）、`palette-jade-night`（翡翠夜），CLI `--theme` 与画布 COLOR STYLES 面板可直接选用。
- 编辑器状态栏与主题面板新增「色卡实验室 Palette Lab」推广入口。

### 性能

- jszip 改为动态 `import()` 按需加载：ZIP 导入/导出时才下载解析，启动主包 −99 KB（gzip −31 KB，约 −15%）。

### 重构

- Web 编辑器 UI 全量 i18n：新增 `src/i18n/` 字典（英文 canonical + 类型强平价的中文对照，约 220 键）与 `useT()` 响应式 hook，覆盖组件文案、aria 标签、操作历史标签、对话框与提示；两份字典结构不一致会在类型检查/测试中直接报错。
- `store.ts` 单文件拆分为 `store/types.ts`（接口与常量）、`store/history.ts`(undo/redo/commit/clearDirty 切片)、`store/index.ts`（组装），对外导入路径 `'../store'` 与行为不变。
- e2e 测试按浏览器语言分组钉扎（中文标签流程固定 zh-CN，另设 en-US 组验证语言检测与切换循环）；playwright 端口支持 `E2E_PORT` 覆盖，避免与本机其他 preview 服务冲突。

## [v0.7.0] - 2026-08-13

### 新增

- **MCP server 合并进 `plaindeck` 包**：`plaindeck/mcp` 子路径 + `plaindeck-mcp` 命令行随主包分发（照 `plaindeck/react` 合并先例），工具集：`init` / `validate` / `inspect` / `apply_operations` / `add_cards` / `add_table` / `render` / `styles`。依赖 `@modelcontextprotocol/sdk`（npm 自动安装），附 `plaindeck.cordis.yml` 一行接入 DeepSeek Harness（`dsh web --patch`）。
- 独立的 `@mappedinfo/plaindeck-mcp@0.6.1` 包已弃用（npm deprecate），指引用户改用 `plaindeck`。

### 重构

- 删除 `packages/plaindeck-mcp` workspace；发布工作流、`test-pack`、build 脚本回归单包单 tag；`test-pack` 增加 `plaindeck/mcp` 导出面与 `plaindeck-mcp` bin 的打包验证。

### 工程化

- `plaindeck` 包关键字补充 MCP 相关；THIRD_PARTY_NOTICES 补充 `@modelcontextprotocol/sdk` 与 `zod`。

## [v0.6.1] - 2026-08-13

### 新增

- **`plaindeck-mcp`**：新的 MCP server 包，把 PlainDeck Agent API 封装为 MCP 工具（`init` / `validate` / `inspect` / `apply_operations` / `add_cards` / `add_table` / `render` / `styles`）。任何 MCP 客户端（DeepSeek Harness、Claude Code、Codex 等）都可以让 Agent 直接生成、修改并渲染幻灯片项目；附带 `plaindeck.cordis.yml` 一行接入 dsh（`dsh web --patch`）。发布工作流同步发布该包。
- `plaindeck` 新增公开子路径导出 `plaindeck/node`（node IO、资源准备与 PNG/PDF 渲染，此前仅 CLI 内部使用）。

### 重构

- 集中项目路径约定为 `PROJECT_PATHS` / `SLIDE_PATH_PATTERN` / `GITIGNORE_TEMPLATE` 常量（`packages/plaindeck/src/core/project-paths.ts`），schema、save-plan、operations、templates、CLI、node IO、浏览器存储、ZIP 存储与 HTML 导出共 9 处引用统一收口。
- 品牌色集中为 `BRAND_ACCENT` / `BRAND_THEME_COLOR`（`packages/plaindeck/src/core/brand.ts`），schema 默认值、paper-signal 主题与 PWA manifest 统一引用。
- `vite.config.ts` 部署路径改为环境变量驱动（`VITE_BASE_PATH`，默认 `/PlainDeck/`），PWA manifest 的 `start_url`/`scope` 跟随 base。
- 浏览器探测逻辑合并为 `scripts/find-browser.mjs`（优先 Playwright 自带解析，回退缓存扫描），playwright.config 与 Remotion 渲染脚本共用；同时修复浏览器未安装时回退分支不可达的潜在 bug。
- 编辑器默认图片占位图改为内嵌 SVG data URI（`src/core/placeholder.ts`），移除 unsplash 外部依赖，离线可用。
- 画布缩放范围/步进收敛为 store 常量（`ZOOM_MIN/MAX/STEP/INITIAL`）。
- web 对 `plaindeck` 的依赖改为 `workspace:*` 协议，消除版本手工同步漂移。
- 顺手去重：`BASE_CANVAS` 单一定义；图片大小报错文案由 `MAX_IMAGE_BYTES` 计算。

### 工程化

- 新增 ESLint（flat config：js + typescript-eslint + react-hooks + react-refresh）与 Prettier 配置，CI 增加 lint 步骤；修复既有 lint 告警（未使用变量、effect 内同步 setState 改为渲染期调整、无意义赋值等）。
- 新增 `.env.example`（`VITE_GOOGLE_ANALYTICS_ID`、`VITE_BAIDU_ANALYTICS_ID`、`VITE_BASE_PATH`）与 `CHANGELOG.md`。
- `scripts/test-pack.mjs` 打包验证扩展到 `plaindeck-mcp`。
- 文档版本同步（README、packages/plaindeck/README、juya 迁移研究文档）。

## [v0.6.0] - 2026-08-13

### 新增

- Nature 学术默认值：`nature-editorial` 主题、`nature-methods` 模板、`paper-figure` / `paper-table` 证据页布局。
- 原生表格（rules / grid / stripes）与 `add-table` CLI 命令。
- 内容-排版平衡：文本适配诊断（`diagnoseTextFit`）与校准的字宽估算。
- 散文布局族：`hook-statement` / `prose-panel` / `takeaway` 预设与内容填充组合器（`fill.ts`）。
- 共享排版工具：`typeScale` 字号阶梯、长句拆分、同型组件字号统一。
- Juya 模板迁移为原生设计配方（174 个），Agent 就绪的摘要卡片工作流。

### 修复

- 文本不再裁切：保守的 fill 余量 + 受限的文本框自动扩展。
- 长正文可读性：多句正文逐句分行、support 框自适应扩展。

### 工程化

- React 与 Remotion 渲染器合并进 `plaindeck` 包；新增 field-notes 语言思维论文演示。

## [v0.3.0] - 2026-08-03

- 适配器迁移到 mappedinfo npm scope。
- 共享 React 与 Remotion 渲染器。
- npm 发布工作流幂等化（已发布版本跳过）。

> 注：v0.4 / v0.5 期间未打 tag；对应能力（如设计配方迁移、摘要卡片工作流）已在 v0.6.0 条目中体现。

## [v0.2.5] - 2026-08-03

- 自动文档页脚（日期 / 页码 / 标题槽位）。
- 画布外元素暂存（off-canvas staging）。

## [v0.2.4] - 2026-08-03

- 加固项目持久化（外部修改检测、原子写入语义）。

## [v0.2.3] - 2026-08-03

- 品牌化 README，新增网站图标。

## [v0.2.2] - 2026-08-02

- npm OIDC trusted publishing 启用。

## [v0.2.1] - 2026-08-02

- 修复 npm 发布版本门禁。

## [v0.2.0] - 2026-08-02

- CLI 生成的演示画廊（demo/）。

[Unreleased]: https://github.com/Mappedinfo/PlainDeck/compare/v0.7.0...HEAD
[v0.7.0]: https://github.com/Mappedinfo/PlainDeck/compare/v0.6.1...v0.7.0
[v0.6.1]: https://github.com/Mappedinfo/PlainDeck/compare/v0.6.0...v0.6.1
[v0.6.0]: https://github.com/Mappedinfo/PlainDeck/compare/v0.3.0...v0.6.0
[v0.3.0]: https://github.com/Mappedinfo/PlainDeck/compare/v0.2.5...v0.3.0
[v0.2.5]: https://github.com/Mappedinfo/PlainDeck/compare/v0.2.4...v0.2.5
[v0.2.4]: https://github.com/Mappedinfo/PlainDeck/compare/v0.2.3...v0.2.4
[v0.2.3]: https://github.com/Mappedinfo/PlainDeck/compare/v0.2.2...v0.2.3
[v0.2.2]: https://github.com/Mappedinfo/PlainDeck/compare/v0.2.1...v0.2.2
[v0.2.1]: https://github.com/Mappedinfo/PlainDeck/compare/v0.2.0...v0.2.1
[v0.2.0]: https://github.com/Mappedinfo/PlainDeck/releases/tag/v0.2.0
