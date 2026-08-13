# PlainDeck 的 Nature 式设计审视

这次审视把“Nature 风格”理解为一种学术信息设计方法，不复制期刊商标或版式：论点先行、证据主导、来源可追踪、边界可见、排版克制，并在交付前检查可读性与溢出。

## 审视结论

| 原设计风险 | 对理解的影响 | 当前设计决策 |
| --- | --- | --- |
| 论文默认方案使用深色舞台感主题 | 图表、表格与长轴标签缺少稳定的浅色阅读场 | 新增 `nature-editorial`：浅色背景、深色正文、单一克制强调色 |
| 多页依赖卡片或固定左右栏 | 内容被模板形状主导，复杂证据被压缩 | 新增 `nature-methods` 七页节奏：claim-led、process-wide、figure-dominant、comparison、discussion |
| “论文表格”由散落的形状与文本框模拟 | 无法整体编辑数据、改变行列或被 Agent 可靠检查 | 新增语义化 `table` 元素，数据保存在二维 `cells` 中 |
| CLI 与 Web 分别拼装内容 | 同一输入可能生成不同文档结构 | CLI/Web 都调用 `add-table-slide` operation 和 `createTableSlideElements` |
| 表格只有截图或固定占位 | 数字不可编辑，缩放后可能不可读 | Markdown/CSV/TSV/JSON 解析为原生表格；渲染器输出语义化 `<table>` |

## 默认设计规则

1. 每页只承担一个判断；标题尽量直接陈述结论。
2. 主图或主表占据主要视觉面积，解释使用窄栏或底部 takeaway。
3. 方法流程使用全宽顺序结构；比较页优先使用整页表格，不把密集数据塞入小卡片。
4. 表格默认使用 `rules`：不画竖线，以表头规则、行间距和对齐建立层级；`grid` 仅用于参数矩阵，`stripes` 用于逐行扫描。
5. 表格第一列默认左对齐；纯数字列默认右对齐。建议不超过 8 列、12 个数据行，超出时应拆页。
6. 来源放在底部锚点；结论、来源和表格不能互相竞争视觉层级。
7. 深色背景只在图像本身需要时使用，不作为普通学术结果页默认值。

## 同一表格的跨端契约

```json
{
  "id": "table",
  "type": "table",
  "frame": { "x": 88, "y": 222, "w": 1424, "h": 442 },
  "cells": [
    ["Method", "Accuracy ↑", "Latency ↓"],
    ["Baseline", "82.4", "41 ms"],
    ["PlainDeck", "89.7", "28 ms"]
  ],
  "headerRows": 1,
  "columnWidths": [1.55, 1, 1],
  "alignments": ["left", "right", "right"],
  "style": "rules"
}
```

Web、独立 HTML、PNG/PDF 与 Remotion 都从这份数据生成版式。Web 可双击单元格编辑；Inspector 可用 Tab 分隔文本批量修改。CLI 的 `add-table` 接受 Markdown、CSV、TSV 或 JSON，再通过同一 operation 写入页面。

## 质量门

- schema 拒绝不等长的行、越界的表头行、列宽/对齐数量不一致；
- API、CLI、React 与 HTML 测试必须覆盖表格；
- 浏览器测试检查结构化数据导入、样式选择和单元格编辑；
- 渲染检查应确认表头、最后一行、来源和 takeaway 没有被裁切；
- 默认方案需要在 slide-sorter 视角保持构图节奏，不连续复用同一种卡片结构。
