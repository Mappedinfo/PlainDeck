# AGENTS.md

给在此仓库工作的 Agent 的指导。

## 必读

- **发布与打包决策**：新能力默认合入主包 `plaindeck`，不要轻易创建新的 npm 包。
  完整的决策规则、合并步骤、发布流程与 npm OIDC 踩坑记录见
  [`.agent/packaging-playbook.md`](./.agent/packaging-playbook.md)。
- 发布流程：改版本 → CHANGELOG → lint/test/build/test-pack → commit → `git tag vX.Y.Z` → push。
- **制作指导与 Agent 契约**：生成或修改演示前读 [`docs/presentation-guidance.md`](./docs/presentation-guidance.md)，按 `guide → 证据与逐页计划 → inspect / operations → validate → review → render → 内容与视觉复核` 执行。Web、CLI、MCP 共用 `plaindeck/core` 的指导实现；扩展规则时保持入口一致。

## 内容与默认文案

- 先陈述核心主张 A，再给支持 A 的证据与意义。标题、正文、图注和讲稿围绕 A 展开；编辑排除条件留在制作与审查过程。必要比较、真实负结果和证据边界按原意保留。
- 默认模板和示例遵循同一表达原则；示例数字明确标为示意，待补证据清楚标注。对照句式检查仅提供建议，按具体语义判断。
- `validate` 负责结构合法性，`review` 负责启发式内容与版式线索；渲染后的内容和视觉复核是独立步骤。

## 仓库结构速览

- `packages/plaindeck/`：唯一的 npm 包（core / node / render / react / remotion / mcp 子路径 + plaindeck、plaindeck-mcp 两个 bin）
- `src/`：Web 编辑器（Vite + React + zustand）
- `scripts/`：构建与发布辅助脚本（find-browser、test-pack 等）
- `docs/`：Agent API、项目格式等文档；`demo/`、`examples/` 为演示项目

## 注意

- `projects/` 目录是另一个工作流的产物，**不要提交、不要改动**。
- 项目文件路径约定（deck.json / theme.json / slides/ 等）统一引用 `PROJECT_PATHS` 常量，
  不要手写字符串。
