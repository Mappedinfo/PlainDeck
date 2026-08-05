# 从 juya-news-card 吸收到 PlainDeck 的能力

本次调研对象是 MIT 许可的 [Mappedinfo/juya-news-card](https://github.com/Mappedinfo/juya-news-card)。它擅长把长文整理为一个标题和 1–8 个新闻要点，并通过大量 React 模板输出单张图片。来源版权与许可随仓库和 npm 包保留在 [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md)。

PlainDeck 没有复制 174 个 React 运行时组件，而是通过 `scripts/migrate-juya-styles.mjs` 将它们批量编译为 174 个原生设计配方。脚本读取模板元数据、27 个分类及 TSX 源码，提取颜色和字体并映射为 10 类可由 PlainDeck 形状、文字、线条、透明度与旋转表达的构图语法。

合并后的公共能力是：

- `parseSummaryCards(input)`：兼容 Juya 风格 Markdown，以及 `mainTitle/cards/title/desc/icon` JSON；
- `createSummaryCardElements(content, theme, canvas)`：把 1–8 个要点转换为普通、稳定 ID 的 PlainDeck 元素；
- `add-summary-slide` operation：原子地新增结构化卡片页；
- `plaindeck add-cards`：从文件或 stdin 完成同一操作；
- Web 本地卡片生成器：不上传内容、不要求 API Key，生成后仍可拖动、改字、改色和查看 Git diff。
- `designRecipes` / `searchDesignRecipes()`：公开 174 个配方及其来源文件 SHA-256；
- `plaindeck styles` 与 `add-cards --style <id>`：让 Agent 无需读取 React 代码即可检索和应用视觉风格；
- `npm run styles:migrate` / `npm run styles:check`：可重复生成并检查目录是否与同级 `juya-news-card` 仓库一致。

保留的边界：迁移是基于设计 token 与构图特征的 PlainDeck 原生重建，不承诺对每个 React/CSS 像素级复刻。PlainDeck v0.4.0 仍不内置 LLM 服务或密钥管理。AI/Agent 负责依据来源生成结构化初稿，PlainDeck 负责验证格式、排版、人工精调和所有输出。这延续了项目的 Local-first 与单内核原则。
