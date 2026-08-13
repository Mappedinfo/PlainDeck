# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)，版本号遵循语义化版本（[SemVer](https://semver.org/)）。

## [Unreleased]

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

[Unreleased]: https://github.com/Mappedinfo/PlainDeck/compare/v0.6.1...HEAD
[v0.6.1]: https://github.com/Mappedinfo/PlainDeck/compare/v0.6.0...v0.6.1
[v0.6.0]: https://github.com/Mappedinfo/PlainDeck/compare/v0.3.0...v0.6.0
[v0.3.0]: https://github.com/Mappedinfo/PlainDeck/compare/v0.2.5...v0.3.0
[v0.2.5]: https://github.com/Mappedinfo/PlainDeck/compare/v0.2.4...v0.2.5
[v0.2.4]: https://github.com/Mappedinfo/PlainDeck/compare/v0.2.3...v0.2.4
[v0.2.3]: https://github.com/Mappedinfo/PlainDeck/compare/v0.2.2...v0.2.3
[v0.2.2]: https://github.com/Mappedinfo/PlainDeck/compare/v0.2.1...v0.2.2
[v0.2.1]: https://github.com/Mappedinfo/PlainDeck/compare/v0.2.0...v0.2.1
[v0.2.0]: https://github.com/Mappedinfo/PlainDeck/releases/tag/v0.2.0
