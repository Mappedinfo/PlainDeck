# PlainDeck v0.1 项目格式

项目根目录以 `deck.json` 为入口。`deck.json` 保存标题、逻辑画布、主题路径、可选的文档级页脚配置和页面顺序；每个页面单独存放在 `slides/`，资源使用相对路径。

```text
deck.json
theme.json
theme.css              # generated，便于外部预览，不是主题源文件
slides/001-title.json
assets/
exports/
```

所有 frame 坐标都是固定逻辑画布上的整数，也允许使用负数或超过画布尺寸的坐标，将元素暂存在画布外。渲染和演示只显示画布范围内的内容。保存采用两个空格缩进、LF 结尾和固定属性顺序。元素 ID 与页面路径稳定；拖动只在 pointer up 产生一个历史命令并触发页面写入。

`theme.json` 是主题的唯一 source of truth。`theme.css` 是新建项目和 ZIP 导出时生成的辅助文件，当前编辑器与 renderer 不读取它，不应手动维护。

多文件保存先写主题和页面内容，最后写 `deck.json` 作为 commit point；删除页面时会在新的 `deck.json` 落盘后删除旧页面文件。浏览器自动保存按路径 revision 确认写入结果，保存期间产生的新修改不会被旧任务清除。

`layoutRef` 只记录新建页面时采用的布局名称，布局中的占位内容会立即展开为普通 `elements`，之后可以自由编辑，不依赖隐藏模板。图片占位使用可读的 `"src": "placeholder:image"`，设置真实路径或 URL 后即变为普通图片元素。

`footer` 是可选的文档级配置，包含 `left`、`center`、`right` 三个槽位以及可选的 `fontSize`、`color`。自动日期、页码、总页数、文档标题和页面名称保留为语义化类型，不会复制成每页文本元素；Web 与 HTML/PNG/PDF renderer 使用同一套解析逻辑。

形状可以直接包含 `text`，并通过可选的 `textColor`、`fontSize`、`fontWeight`、`align` 与 `verticalAlign` 控制文字。旧项目中的形状没有这些字段时仍按纯形状渲染。

## Schema version 与迁移

`deck.json` 必须包含 `"schemaVersion": "0.1"`。迁移接口位于 `src/core/migration.ts`；未知版本会明确失败，不会静默改写源项目。未来迁移必须新增纯函数映射，并保留恢复快照后再落盘。

## Git 建议

- 跟踪 `deck.json`、`theme.json`、生成的 `theme.css`、`slides/`、`layouts/` 和必要资源；
- 默认忽略 `exports/` 中生成物；
- 大型媒体由项目所有者决定是否使用 Git LFS；
- 打开后不编辑不会写盘，页面元素修改只写对应页面文件。
