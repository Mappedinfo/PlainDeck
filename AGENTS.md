# AGENTS.md

给在此仓库工作的 Agent 的指导。

## 必读

- **发布与打包决策**：新能力默认合入主包 `plaindeck`，不要轻易创建新的 npm 包。
  完整的决策规则、合并步骤、发布流程与 npm OIDC 踩坑记录见
  [`.agent/packaging-playbook.md`](./.agent/packaging-playbook.md)。
- 发布流程：改版本 → CHANGELOG → lint/test/build/test-pack → commit → `git tag vX.Y.Z` → push。

## 仓库结构速览

- `packages/plaindeck/`：唯一的 npm 包（core / node / render / react / remotion / mcp 子路径 + plaindeck、plaindeck-mcp 两个 bin）
- `src/`：Web 编辑器（Vite + React + zustand）
- `scripts/`：构建与发布辅助脚本（find-browser、test-pack 等）
- `docs/`：Agent API、项目格式等文档；`demo/`、`examples/` 为演示项目

## 注意

- `projects/` 目录是另一个工作流的产物，**不要提交、不要改动**。
- 项目文件路径约定（deck.json / theme.json / slides/ 等）统一引用 `PROJECT_PATHS` 常量，
  不要手写字符串。
