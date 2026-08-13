# 发布与打包手册（Packaging & Release Playbook）

本文件是给 Agent 的工程决策手册：**什么时候该单独发 npm 包，什么时候应该合入主包**，
以及发布流程与 npm OIDC 的踩坑记录。仓库内一切新能力的打包决策先读这里。

## 核心原则：默认合入主包，不单独发包

PlainDeck 的 npm 面只有**一个主包 `plaindeck`**。新能力（MCP server、新的渲染器、
新的导出面、新的 CLI 子命令）**默认并入主包**，通过**子路径导出**对外提供，
而不是发布第二个 npm 包。历史上已经这样做过两次：

| 能力 | 独立包（已弃用） | 合入主包 |
|---|---|---|
| React 渲染器 | `@mappedinfo/plaindeck-react@0.4.0` | `plaindeck/react`（v0.5.0 起） |
| MCP server | `@mappedinfo/plaindeck-mcp@0.6.1` | `plaindeck/mcp`（v0.7.0 起） |

弃用独立包时用标准文案引导用户（照上面两个先例）：

```sh
npm deprecate "@mappedinfo/<pkg>@<version>" \
  "Merged into plaindeck@>=<x.y.z>; install 'plaindeck' and use the '<bin>' bin, or import from 'plaindeck/<subpath>' instead."
```

### 合入主包的收益

- **单包单 tag**：发布 = 改版本 + `git tag vX.Y.Z` + push，CI 自动 lint/test/build/test-pack/publish
- **没有 OIDC/org 权限问题**：主包已存在，OIDC 幂等跳过逻辑成熟（见下文踩坑）
- **用户心智统一**：`plaindeck/mcp` 和 `plaindeck/react` 一个用法，一个 `npm install plaindeck` 全都有

### 合并步骤（照 v0.7.0 先例）

1. 代码迁入 `packages/plaindeck/src/<feature>/`，测试迁入 `packages/plaindeck/test/`
2. `packages/plaindeck/package.json`：
   - `exports` 增加 `"./<feature>"` 子路径
   - `bin` 增加对应命令（主包可带多个 bin）
   - 新依赖加入 `dependencies`（保持小；playwright 级别的重依赖才走 optional peer）
3. 删除独立 workspace；根 `package.json` 的 build 脚本、`scripts/test-pack.mjs`、
   `.github/workflows/publish-npm.yml` 同步回归单包
4. `test-pack.mjs` 增加新子路径导出面与 bin 的打包验证
5. 弃用旧包（上面命令）；版本号做 **minor bump**（0.6.1 → 0.7.0，照 react 先例 0.4 → 0.5）
6. 文档同步：包 README、根 README、CHANGELOG、`plaindeck.cordis.yml` 等分发物

### 什么时候才真的值得单独发包

只有满足以下**至少一条**才考虑独立包：

- 依赖体积巨大且与主包用户无关（playwright 级别的浏览器下载）
- 需要完全独立的版本节奏/生命周期（如上游协议快速变动）
- 用户场景就是"只装这一个能力"，不希望被主包拖累
- 名称/作用域冲突，无法并入主包

否则：合入主包。**"省一个包"永远优先于"多一个包"。**

## 发布流程（单包单 tag）

```sh
# 1. 版本号：package.json（root 与 packages/plaindeck 同步）+ CHANGELOG.md
# 2. 验证：npm run lint && npm test && npm run build && npm run test:pack
# 3. 提交 + 打 tag + 推送（tag 触发发布工作流，main 触发 Pages 部署）
git add -A && git commit -m "chore(release): vX.Y.Z"
git tag vX.Y.Z && git push origin main && git push origin vX.Y.Z
```

- `publish-npm.yml` 对已发布版本**幂等跳过**（`npm view` 检查），重复触发安全
- Pages 部署与 npm 发布互不依赖，各自独立工作流

## npm OIDC 踩坑记录（2026-08 实战）

**规则**：仓库用 OIDC 可信发布（无 NPM_TOKEN）时，npm 只允许创建"身份匹配"的新包：

1. **未加 scope 的新包**：包名必须 == GitHub 仓库名（`plaindeck` == `PlainDeck` ✓；
   `plaindeck-mcp` ≠ `PlainDeck` ✗ → PUT 404 "could not be found or you do not have permission"）
2. **scoped 新包**：scope 必须对应 npm 组织（`@mappedinfo` → npm org `mappedinfo`），
   且该组织需要配置 **Trusted Publisher**——但 Trusted Publisher 只能给**已存在**的包配置 → 死循环
3. **破局**：本地 `npm login` 后**手动发布首版**。npm 11 会走 web-auth 流程
   （日志特征：`PUT 401 → 浏览器授权 → PUT 200`），包上线后 CI 的幂等检查自动跳过。
   之后到包页面配置 Trusted Publisher，未来版本即可回归纯 OIDC
4. **NPM_TOKEN 混用注意**：存在 `NODE_AUTH_TOKEN` 时 npm **优先用 token 认证**（而非 OIDC）；
   granular token 的权限范围要覆盖目标 scope，否则同样的 404
5. **npmjs.com 有 Cloudflare 防护**，curl 页面标题无法判断包/org 是否存在；
   用 registry API 判断：`/-/org/<name>/package?format=cli`（200=org 存在，404=不存在）
6. **本地 npm 认证失效**会表现为发布/查询的 404/401，先 `npm whoami` 排除登录态问题，
   别急着怀疑包名被拦截

**结论**：这些坑全部源于"创建新包"；合入主包后（本文核心原则）一次都不会再遇到。
