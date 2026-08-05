# 从 juya-news-card 吸收到 PlainDeck 的能力

本次调研对象是 MIT 许可的 [Mappedinfo/juya-news-card](https://github.com/Mappedinfo/juya-news-card)。它擅长把长文整理为一个标题和 1–8 个新闻要点，并通过大量 React 模板输出单张图片。

PlainDeck 没有复制它的 174 个独立模板。那种运行时模板目录适合快速生成图片，却会让 Web、CLI、HTML、PDF 与 Remotion 再次出现多套渲染逻辑，也不利于用户在画布中逐元素修改。

合并后的公共能力是：

- `parseSummaryCards(input)`：兼容 Juya 风格 Markdown，以及 `mainTitle/cards/title/desc/icon` JSON；
- `createSummaryCardElements(content, theme, canvas)`：把 1–8 个要点转换为普通、稳定 ID 的 PlainDeck 元素；
- `add-summary-slide` operation：原子地新增结构化卡片页；
- `plaindeck add-cards`：从文件或 stdin 完成同一操作；
- Web 本地卡片生成器：不上传内容、不要求 API Key，生成后仍可拖动、改字、改色和查看 Git diff。

保留的边界：PlainDeck v0.3.1 不内置 LLM 服务或密钥管理。AI/Agent 负责依据来源生成结构化初稿，PlainDeck 负责验证格式、排版、人工精调和所有输出。这延续了项目的 Local-first 与单内核原则。
