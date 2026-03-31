# Home Page UI Design

**Overview**
- Purpose: 规范化主页（时间轴 + 标签块 + 控件 + 右侧工具列）的视觉与交互细节，便于前端实现与 QA 验收。
- Scope: 仅面向笔记本及以上屏幕（不考虑响应式与移动），不考虑数据缺失（由数据预处理保证）。

**Design Goals**
- 清晰展示日期与文章关联，优先保证阅读与发现体验。
- 保持视觉整洁，避免控件互相遮挡（以渐隐规则为主）。
- 可复用、组件化实现便于测试与维护。

**High-level Layout (Left → Right)**

- **ProgressRail (竖向进度条)**
  - 位置与尺寸: 垂直居中，宽度窄列，垂直占整个页面高度的 1/4（居中显示于页面中线）。
  - 视觉: 颜色渐变：上端紫 → 下端红；顶部文本 "Y"。

- **Timeline (垂直时间轴)**
  - 占据中间左侧主视区高度（100% 高度），可滚动，鼠标滚或按上下键一次移动一天。
  - 刻度: 每天一个刻度，刻度朝左；5 的倍数刻度较长，10 的倍数更长；刻度左侧显示日期数字（1..31）。
  - Entry Point: 若某日有文章，在刻度点绘制晴空蓝实心点并作为连线起点。

- **MonthPicker（时间轴右侧,上方的矩形控件）**
  - 结构: 一条横线从时间轴引出到矩形控件；矩形三分：`MM | YYYY`（月份带前导零）。
  - 行为: 下拉选择月份/年份后，时间轴将本月第一天刻度与横线对齐。

- **TagRegion（时间轴右侧、MonthPicker 下方的标签区域）**
  - 命名说明: 本文档将时间轴旁带三角指向的标签块统一称为 `Pointer Tag`（指向标签 / Callout Tag）。
  - 位置: 位于时间轴右侧且位于 MonthPicker 的下方区域，为 Pointer Tag 与连线的显示区域。
  - Pointer Tag 外观: 左侧为指向时间轴的三角形，右侧为承载标题的矩形，两者拼接成一个整体的标签形状（浅黄背景，常见便利贴颜色）。(最好用成熟组件实现)
    - 视觉细节：三角指向时间轴，矩形部分为圆角矩形，矩形区域用于显示文章标题（标题文本只出现在矩形内）。
    - 文本显示：默认最多显示 16 字 + 省略号；若该行仅有单列标签则矩形可自适应延长以显示更多字符，但不得超出 TagRegion 右边界.
  - 布局: 每行最多两列标签（“一行三列”），如果一行只有一个标签则该标签宽度可自适应伸展。
  - 同日多篇: 同一日期最多两篇文章；第一篇标签从时间轴连线到第一个标签；第二篇从“第一个标签右侧”再引线到第二个标签,以此类推。标签之间必须保证不重叠。
    - 连线策略: 首要目标是**避免连线相互冲突或覆盖标签**（不可发生视觉交叉）。实现细则：
      - 优先使用最小幅度的扰动来调整连线长度和水平偏移，保持标签整体布局稳定；仅在必要时才增加扰动幅度。
      - 在有连续多日可能冲突的情况下，保留“先短后长”的节奏作为次要视觉规则，用以减少视觉疲劳和产生可预测的排列（示例：三天 → short / long / short）。
      - 无论应用何种调整，都必须保持相邻连线的**相对大小关系**（即相邻项之间存在可感知的长短差），但不得造成交叉或覆盖标签区域。
      - 算法层面建议：按照距离时间轴的优先级（或日期顺序），先尝试微扰（± small px），若仍冲突则按短—长—短策略增加间距，必要时往外侧推进标签列以腾出空间。
    - 显隐规则: 在 `TagRegion` 顶部以 `MonthPicker` 为锚点设置一段对称的渐隐带（上下对称），用于避免标签遮挡上方控件。标签与连线在进入/离开该渐隐带时按时间轴滚动方向执行渐显/渐隐：
      - 若标签从下方向上进入（用户向上滚动时间轴），标签与连线自下向上渐显；离开时自上向下渐隐。
      - 若标签从上方向下进入（用户向下滚动时间轴），标签与连线自上向下渐显；离开时自下向上渐隐。
      - 进入/离开动画使用一致时长（建议 180–240ms）和缓动（建议 `ease-out`），以保证平滑且方向感与滚动一致。

- **RightColumn（工具列）**
  - 顶部：圆角矩形横向搜索栏（SearchBar）。按全文或标题搜索文章，匹配后将对应文章日期写入并使该日期在 Timeline 中垂直居中。排序为最新的优先.搜索栏构成:高度和左侧矩形块上下侧都对齐可视范围一致,宽度以黄金比例确定,外轮廓颜色和配置都和MonthPicker一致,内部左侧简约放大镜图标,可点击触发搜索,|竖线隔开,中间为输入区域,用于输入检索字段,|竖线隔开,右侧为向下三角和计数比如"3/10"(当前查看/总匹配数),点击三角跳转下一个被找到的文章对应的时间
  - 中部：个人 profile（纯透明容器、无边框、无背景色、无阴影——头像:/home/ebit/chrona/public/avatar.jpg、用户名:Nicolette86132、友链按钮(朋友的简约标志)、社媒图标(编程:https://github.com/Ebotian,社交:https://x.com/AsilenA123,音乐:https://music.163.com/#/user/home?id=351729969)、技能:(TS,JS,VUE,TSX,CSS,HTML,MYSQL,VHDL,VERILOG,C,CPP,ESP/STM32,LATEX,LINUX)。
    - 样式提示：使用内间距与间隙来区分子区域；避免使用边线、背景色或阴影，以保持界面极简与透明感。
  - 底部：第一行:简洁音乐播放器控制（上一首(<) | 播放/暂停(=/\delta) | 下一首(>)）,用简单的符号表示不要文字，简单的1px竖线连接上下边缘分割可点击区域,播放暂停有淡入淡出的切换动效,下方显示专辑封面,根据控制的上下一首,向左或者右无缝侧滑切换,音乐在:/home/ebit/chrona/music,同名专辑在:/home/ebit/chrona/music/album,边框采用圆角矩形,颜色#aed9d4,控制区用半透明的#bbe7e2做背景色

**Component Contract (Props / Events / Responsibilities)**

- `ProgressRail`
  - Props: `yearProgress: number` (0..1)
  - Behavior: 渲染颜色渐变与黑色三角指示器（由 progress 决定水平线位置）

- `Timeline`
  - Props: `startDate`, `endDate`, `entries: Record<date, ArticleMeta[]>`
  - Events: `onDayFocus(date)`, `onDayStep(delta)`
  - Responsibility: 刻度绘制、Entry 点渲染、键盘/鼠标滚动行为触发

- `MonthPicker`
  - Props: `month`, `year`
  - Events: `onChange({month, year})`
  - Responsibility: 发送对齐命令给 Timeline

- `TagRegion`
  - Props: `entries`, `visibleBounds` (用于判定何时淡出)
  - Events: `onTagClick(articleId)`
  - Responsibility: 计算标签两列布局、应用短/长/短连线优先规则、连线微扰动、显隐动画、标题裁剪与单列自适配

- `EntryPoint`
  - Props: `hasArticles: boolean`
  - Events: `onClick`

- `SearchBar`, `ProfileCard`, `MiniPlayer`
  - 常规 props/events（按需实现）

**Article / UI Data Model**

- `ArticleMeta`:
  - `{ id: string, title: string, date: string (ISO), slug: string }`
- `TimelineEntries`: `Record<YYYY-MM-DD, ArticleMeta[]>` (保证每个数组最多两个元素，按时间排序)

**Global Time State**
- Purpose: 统一的时间可信源（`TimeState`），所有时间相关组件读写同一份状态以保持同步。
- 建议字段：
  - `currentDate: string`（ISO）—— 当前聚焦/对齐的日期（写入时表示已确认的对齐日）。
  - `viewportStart: string`, `viewportEnd: string`—— Timeline 的可视滑动窗口边界（由 Timeline 驱动渲染范围）。
  - `focusedDate?: string`—— 用于键盘/交互聚焦的临时或明确选择日期。
  - `yearProgress: number`（0..1，派生）—— 从 `currentDate` 派生的只读值，供 `ProgressRail` 消费。
- 写入者（生产者）：鼠标滚轮、键盘上/下（按天步进）、拖拽（连续更新临时位置；释放时吸附到最近一天并写入 `currentDate`）、`MonthPicker`（对齐并写入相应对齐日）、`SearchBar`（匹配到目标后写入并居中）。
- 订阅者（消费者）：`Timeline`（读取 `viewport` 并渲染滑动窗口）、`ProgressRail`（只读消费 `yearProgress`）、`TagRegion`（基于 `viewport`/`visibleBounds` 做显隐与布局）、`MonthPicker`（读取 `currentDate` 以保持静态对齐显示）。

**Interaction Details**

- 鼠标滚轮 / 上下键：时间轴上下平滑按天滚动（触发 `onDayStep` 并在步进完成时写入 `currentDate`）。
- 鼠标拖拽：拖拽为连续交互，拖拽过程中可以连续更新临时位置以便实时预览；拖拽结束时吸附（snap）到最近的一天并将该日写入 `currentDate`，同时更新 `viewportStart/viewportEnd`。
- 点击标签：触发 `onTagClick`，打开或导航到文章详情（路由或弹窗由应用负责）。点击不应强制使 Timeline 居中；如需特殊聚焦或过渡动画，由文章页的后续动画设计处理。
- MonthPicker 变化：触发 `alignTo(monthFirstDay)` 并写入 `currentDate`；**保证在无动画（静态）时 MonthPicker 的连线与 Timeline 的刻度精确对齐**（即任何静态渲染下连线位置应与刻度一一对应）。
- SearchBar：全文/标题匹配到文章后，将对应文章日期写入 `currentDate` 并使该日期在 Timeline 中垂直居中（更新 `viewport`），以便用户能直接看到对应标签与连线。

**Visual & Motion Guidelines**

- 颜色建议：
  - Progress gradient: 紫 → 红
  - EntryPoint: 晴空蓝 (#00AEEF 相近)
  - Tag background: 浅黄 (#FFF3B0 相近)
- 字体/字号：标签标题默认 14px（显示最多 8 字），刻度数字 12px
- 动画：显隐 180–240ms，连线微调 120–180ms，缓动：ease-out

**Constraints & Decisions (per request)**

- 不考虑数据缺失；由数据预处理保证不出现超出展示假设的情况。
- 不考虑响应式；仅在笔记本及以上屏幕显示。
- `ProgressRail` 垂直居中但高度为页面高度的 1/4（居中放置）。

**Edge Cases & Fallbacks**

- 若某日超过两篇：文档约定“最多两篇”；若实际数据超过，应由数据预处理按时间取最近两篇并在第二篇标签右侧以小徽标提示“+N”。
- 标签过长：单列自适应后仍超出时裁剪显示"<最大可显示字符>..."

**Implementation Plan (milestones)**

1. 建立基础布局与静态样式：`ProgressRail`、`Timeline`、`MonthPicker`、`TagRegion`、`RightColumn`（使用静态示例数据）。
2. 在 `TagRegion` 实现布局算法：“一行两列”规则、单列自适应、连线微扰与短-长-短 优先策略。
3. 实现显隐与对齐动画（渐隐、滚动对齐）。
4. 连接真实数据源，完成点击跳转与播放器初步整合。

**Next Steps**
- 如果你同意该文档，我可以（选其一）:
  - 把该文档保存到仓库（已完成），或
  - 基于文档生成 Vue 组件骨架（`src/components` 与 `src/pages`）。

---
Generated: design_doc/ui_home.md
