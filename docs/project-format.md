# PlainDeck v0.1 项目格式

项目根目录以 `deck.json` 为入口。`deck.json` 只保存标题、逻辑画布、主题路径和页面顺序；每个页面单独存放在 `slides/`，资源使用相对路径。

```text
deck.json
theme.json
theme.css
slides/001-title.json
assets/
exports/
```

所有 frame 坐标都是固定逻辑画布上的整数。保存采用两个空格缩进、LF 结尾和固定属性顺序。元素 ID 与页面路径稳定；拖动只在 pointer up 产生一个历史命令并触发页面写入。

## Schema version 与迁移

`deck.json` 必须包含 `"schemaVersion": "0.1"`。迁移接口位于 `src/core/migration.ts`；未知版本会明确失败，不会静默改写源项目。未来迁移必须新增纯函数映射，并保留恢复快照后再落盘。

## Git 建议

- 跟踪 `deck.json`、`theme.json`、`theme.css`、`slides/`、`layouts/` 和必要资源；
- 默认忽略 `exports/` 中生成物；
- 大型媒体由项目所有者决定是否使用 Git LFS；
- 打开后不编辑不会写盘，页面元素修改只写对应页面文件。
