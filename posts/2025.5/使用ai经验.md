---
date: 2025-05-02
---

本文是对于 jobtry1 仓库内内容的总结

# ai 项目的经验教训

从一开始就出现了问题

需求制定-->技术选型-->具体实现-->测试反馈-->新的需求(循环)

总体上来说应该是遵循这样的流程来进行项目开发,而这在我刚开始时是不知道的
需求制定工作由项目要求给定了,我应该立即准备开始结合需求进行技术选型,一开始却去分析需求的需求,过分解读成对开源情报的搜取工作,这就太宽泛了.并不能仗着 ACD 过程尽情发挥,而是有约束和极限的发挥,这约束就是回到落实需求文档上.

技术选型上可以先选择简单和兼容性高的,便于后期迭代替换.第一次的 grawlee.js 是错误选型,第二次的 cheerio 是正确的.
在这里粘贴一下 ai 的总结:
技术选型时应重点考虑以下要素：

- 需求适配度：能否满足当前和未来的核心业务需求。
- 团队熟悉度：团队成员对该技术的掌握程度，影响开发效率和维护难度。
- 社区与生态：文档、社区活跃度、第三方库和工具的丰富性。
- 性能与扩展性：在目标场景下的表现及未来扩展的便利性。
- 兼容性与可替换性：与现有系统的集成难度，以及后续替换的灵活性。
- 成本：包括开发、运维、授权等直接和间接成本。
- 安全性与稳定性：安全漏洞历史、长期维护和更新情况。

通用参考指标有：

- 官方文档和社区活跃度
- Github star/issue/更新频率
- 典型案例和大厂采用情况
- 性能基准测试数据
  我认为对于单人初期开发,需求适配,扩展兼容性,开发学习成本,最近更新频率这四项是要重点考虑的.

技术选型层面应该采用最优质的 ai 模型进行设计

具体实现:就前后端项目而言:大胆质疑,小心求证,不论大模型评测智商几何,我的上下文理解能力目前还是超越 ai 的,紧贴需求,把握信息流动方向,保持清醒的头脑.

1. 我们要有时序图说明信号流动的方向,or 信号流图,这里的初期指导图就是一个很好的示例
2. 根据时序图自上而下顺序,实现前后端功能
3. 根据时序图首先建立文件夹和文件结构,然后再进行具体实现
4. 分主子模块实现,每次 ai 对话轮只实现一个模块,子模块的实现以主模块作为上下文参考
5. 每次实现一层数据流动就进行测试确保正确(backend 目录里的测试程序是一个很好的示例)
6. 测试反馈时,要有测试用例,并且要有测试结果的记录
7. 注意测试反馈后出现的新需求的循环,尽量防止冗余和耦合

关于提问:

1. 应该如何,实际如何,怎样如何
2. 前端的问题:先在 F12 中定位错误位置,再向 ai 反馈(以上面的形式)
3. 后端的问题:先在终端和数据库中掌握错误信息,再向 ai 反馈(以上面的形式)

绝对要避免的事情:

1. 一次生成大量(上千行)未经阅读的代码
2. 任由 ai 引导自己修改而不是反过来
3. 表达含糊不清的或者笼统庞大的问题

```mermaid
flowchart TB
    FE[前端（React/Vue等）]
    RT[路由层（Router）]
    CT[控制器层（Controller）]
    SV[服务层（Service）]
    MD[模型层（Model/数据库）]

    FE -- HTTP请求/API调用 --> RT
    RT -- 分发请求 --> CT
    CT -- 调用业务逻辑 --> SV
    SV -- 读写数据 --> MD
    MD -- 返回数据 --> SV
    SV -- 返回结果 --> CT
    CT -- 返回响应 --> RT
    RT -- HTTP响应 --> FE
```

```js
// 停止所有任务的定时调度（除指定任务外）
export const stopAllOtherTaskSchedules = async (exceptTaskId) => {
	const tasks = await Task.find();
	for (const task of tasks) {
		if (task._id.toString() !== exceptTaskId.toString()) {
			await schedulerService.stopTaskSchedule(task);
			task.status = "stopped";
			task.enableScheduler = false;
			await task.save();
		}
	}
};
```

```mermaid
sequenceDiagram
    participant User as 用户（浏览器）
    participant FE_App as App.jsx（前端主入口）
    participant FE_Control as ControlPanel.jsx（任务参数配置）
    participant FE_Chat as ChatContainer.jsx（AI对话）
    participant FE_API as taskService.js（前端API服务）
    participant BE_Route as taskRoutes.js（后端路由）
    participant BE_Controller as taskController.js（后端控制器）
    participant BE_Service as taskService.js（后端服务）
    participant BE_Scheduler as schedulerService.js（定时任务）
    participant BE_Crawler as crawlerService.js（爬虫服务）
    participant BE_AI as aiService.js（AI分析服务）
    participant DB as 数据库（MongoDB/SQL）

    User->>FE_App: 访问网页
    User->>FE_Control: 配置/调整任务参数
    FE_Control->>FE_API: 提交参数（POST /api/tasks/config）
    FE_API->>BE_Route: 发送API请求
    BE_Route->>BE_Controller: 路由分发
    BE_Controller->>BE_Service: 存储/更新任务配置
    BE_Service->>DB: 写入任务配置

    Note over BE_Scheduler: 定时任务触发（如每小时）
    BE_Scheduler->>BE_Service: 读取任务配置
    BE_Service->>DB: 查询任务配置
    DB->>BE_Service: 返回任务配置
    BE_Service->>BE_Crawler: 按配置抓取数据
    BE_Crawler->>BE_Service: 返回原始数据
    BE_Service->>BE_AI: 调用AI API分析
    BE_AI->>BE_Service: 返回结构化AI结果
    BE_Service->>DB: 存储分析结果

    FE_Chat->>FE_API: 查询任务结果（GET /api/tasks/result）
    FE_API->>BE_Route: 发送API请求
    BE_Route->>BE_Controller: 路由分发
    BE_Controller->>BE_Service: 查询结构化结果
    BE_Service->>DB: 查询分析结果
    DB->>BE_Service: 返回分析结果
    BE_Service->>BE_Controller: 返回结果
    BE_Controller->>BE_Route: 返回结果
    BE_Route->>FE_API: 返回结果
    FE_API->>FE_Chat: 返回结果
    FE_Chat->>User: 展示AI分析/摘要（结构化结果可视化）
```
