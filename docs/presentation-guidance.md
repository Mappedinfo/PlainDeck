# PlainDeck 制作指导

PlainDeck 把演示制作拆成一条可执行的路径：明确听众与目的，组织主张和证据，逐页规划，构建可编辑页面，检查并渲染，再完成内容与视觉复核。Web、CLI 和 MCP 共用 `plaindeck/core` 中的指导规则。

## 从核心主张开始

先写希望观众记住的主张 A，再给支持 A 的机制、事实、图表和意义。标题、正文、图注和讲稿都围绕 A 推进。编辑过程中的排除条件留在制作与审查环节；只有比较本身是任务或证据所需时，才把 B 放进可见页面。真实负结果、必要比较和证据限制按原意保留。

例如，介绍共享主题时，标题可以写“共享主题让整套页面保持一致”，正文展示字体和配色如何随主题统一变化。页面由主张与证据组成，听众可以直接理解这一能力。

这条表达规则来自 PlainDeck 的产品要求。自动检查会提示部分可能偏离主张的对照句式，最终判断仍取决于语义和材料。

## 简报与逐页计划

制作简报由 `PresentationBriefSchema` 定义。所有字段都可省略；空白目的和主张由执行 Agent 结合已提供的上下文补齐，缺失的关键事实保持待确认。

| 字段 | 取值 | 默认值 |
| --- | --- | --- |
| `audience` | `general`、`faculty`、`classroom`、`business`、`public`、`archive` | `general` |
| `purpose` | 希望改变的理解或支持的决定，最多 2000 字符 | 空字符串 |
| `minutes` | 有限数字，大于 0 且不超过 240 | `10` |
| `keyMessage` | 整套演示的核心主张，最多 2000 字符 | 空字符串 |
| `evidenceDepth` | `overview`、`supported`、`detailed` | `supported` |

指导选项另含 `locale: 'zh' | 'en'`，默认 `zh`。简报独立于幻灯片 schema；项目文件继续使用 `schemaVersion: "0.1"`。

主要听众决定信息密度：`faculty` 强调问题、机制、证据和讨论判断；`classroom` 使用例子、推理与练习；`business` 围绕决定、依据和行动；`public` 从具体情境解释发现；`archive` 保留方法、参数、来源、负结果和回查层级。`general` 适合一般汇报。`overview` 提供核心发现及直观证据，`supported` 要求关键主张对应来源和条件，`detailed` 补齐方法及复现信息。

在选择布局前，为每页规划 `title`、`claim`、`evidence`、`source`、`visualRelationship`、`layout`、`audienceTask`、`claimBoundary` 和 `seconds`。这些是 Agent 的规划字段，由生成提示词提出；它们不会自动写入页面 JSON。

## Web 编辑器

点击工具栏“制作指导 / Presentation guide”，填写听众、目的、时长、核心主张和证据深度。提示词随简报即时更新，可复制给所用的 Agent；检查列表可以定位到需要查看的页面或元素。

简报保存在本机浏览器中：内置示例保留自己的简报；浏览器支持目录关联时，目录项目按实际文件夹区分，同名文件夹或复制出的项目各自独立。每次 ZIP 导入都从新的简报开始。关闭再打开制作指导面板，会继续当前打开文稿的简报。浏览器存储不可用时，简报仅在当前页面保持打开期间保留。简报独立于项目 JSON 和 ZIP，目录关联也不改写项目文件。

指导和启发式检查在本地运行。面板不发起 LLM 请求，也不执行云端生成。复制提示词后的执行环境由用户所用的 Agent 决定；CLI/MCP 可通过参数提供简报。

## CLI

```bash
plaindeck guide --audience faculty --purpose "解释方法的关键机制" --minutes 12 \
  --key-message "共享主题让整套页面保持一致" --evidence-depth supported --locale zh
plaindeck guide --audience public --minutes 8 --locale en --json
plaindeck review ./my-deck --locale zh --json
```

`guide` 输出可交给 Agent 的提示词；`--json` 输出包含 `brief`、`principles`、`workflow`、`slidePlanFields` 和 `prompt` 的结构化指导。`review` 只读检查项目，返回页面和元素定位、说明、建议及需要完成的人工检查。

推荐执行顺序：

```text
guide → 证据与逐页计划 → init / inspect → apply --dry-run → apply
      → validate → review → render → 内容与视觉复核 → 修订受影响页面
```

## TypeScript API

```ts
import { loadDeck } from 'plaindeck'
import {
  PresentationBriefSchema,
  createPresentationGuidance,
  auditPresentation,
} from 'plaindeck/core'

const brief = PresentationBriefSchema.parse({
  audience: 'faculty',
  purpose: 'Explain the mechanism and its supporting evidence',
  minutes: 12,
  keyMessage: 'A shared theme keeps slides consistent',
  evidenceDepth: 'supported',
})
const guidance = createPresentationGuidance({ ...brief, locale: 'en' })
const document = await loadDeck('./my-deck')
const review = auditPresentation(document, { ...brief, locale: 'en' })

console.log(guidance.prompt)
console.log(review.issues, review.manualChecks)
```

`createPresentationGuidance(options)` 与 `auditPresentation(document, options)` 是浏览器可用的本地函数，不修改文档。后者返回 `kind: 'advisory'`、`slideCount`、`issues` 和 `manualChecks`；每项提示包含 `code`、`slidePath`、`slideIndex`、可选 `elementId`、`message` 和 `suggestion`。

## MCP

`plaindeck-mcp` 提供 `presentation_guide` 和 `review_presentation` 两个工具，以及 `build_presentation` 提示词入口。`presentation_guide` 接收可选的简报字段和 `locale`，`review_presentation` 接收绝对项目路径与 `locale`。`build_presentation` 将可选简报参数组织为可执行的制作提示，生成文件仍由客户端 Agent 使用现有工具完成。

MCP 提示词参数使用字符串，例如 `minutes: "12"`；`presentation_guide` 工具与 TypeScript API 的 `minutes` 使用数字。提示词入口传入空参数对象即可使用默认简报。

## 检查的作用

| 检查 | 能提供什么 | 后续动作 |
| --- | --- | --- |
| `validate` | schema、项目结构和字段合法性 | 修复格式错误后继续 |
| `review` / `auditPresentation` | 标题、文字量、待补内容、部分对照句式、画布边界、字号、表格规模和布局重复的启发式线索 | 结合材料与设计意图逐项判断 |
| 内容与视觉复核 | 主张与证据对应、来源、条件、总时长，以及实际渲染的可读性、遮挡和裁切 | 修订并重新渲染受影响页面 |

启发式提示可能包含有意出血、自定义标题、必要比较等合理设计。检查结果为空，也仍需完成内容与视觉复核；自动检查不会核实来源真实性、科学结论或实际渲染效果。

## EasySlides 参考与适配

以下公开制作原则启发了 PlainDeck 的指导流程，核验于 2026-09-08。实现围绕 PlainDeck 原生 JSON、现有主题、operations 和渲染器重新组织；本次没有复制 EasySlides 代码或文档段落。

| 参考原则 | PlainDeck 中的适配 | 上游来源 |
| --- | --- | --- |
| 先明确听众的理解目标，每页推进一个判断 | 简报中的听众与目的、逐页的主张及听众任务 | [academic-orchestration.md](https://github.com/Rimagination/easyslides/blob/main/references/academic-orchestration.md) |
| 先组织内容和证据，再确定设计 | 先写逐页计划，再选择主题、布局和原生元素 | [presentation-production-contracts.md](https://github.com/Rimagination/easyslides/blob/main/references/presentation-production-contracts.md) |
| 页面、内容变体、组件具有各自职责和容量 | 按关系选择布局，长内容通过压缩、拆页或附录保持可读 | [body-variant-component-contract.md](https://github.com/Rimagination/easyslides/blob/main/references/body-variant-component-contract.md) |
| 一致的字体层级、间距与页面节奏 | 复用主题；结合缩略图检查疏密与构图 | [design-guidelines.md](https://github.com/Rimagination/easyslides/blob/main/references/design-guidelines.md) |
| 保留可编辑内容，并在交付前检查来源和渲染 | 使用原生表格、文本和图形；结构检查与内容、视觉复核分开 | [SKILL.md](https://github.com/Rimagination/easyslides/blob/main/SKILL.md) |

EasySlides 使用 [MIT License](https://github.com/Rimagination/easyslides/blob/main/LICENSE)，版权归属为 `Copyright (c) 2026 Rimagination`。后续若引入代码或实质文档片段，应保留相应版权及许可声明。PlainDeck 的核心主张表达规则和上述接口属于本项目的设计。
