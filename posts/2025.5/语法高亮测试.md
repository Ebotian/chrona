---
date: 2025-05-10
---

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