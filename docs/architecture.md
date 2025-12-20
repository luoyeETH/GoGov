# GoGov 公考辅助工具整体架构设计

本架构以“AI 驱动的学习与训练闭环”为核心，支持知识学习、速算训练、学习统计、试卷排版、错题整理与 AI 答疑等模块的渐进式扩展。整体采用前后端分离与可插拔 AI 供应商适配层，保证功能扩展与模型替换成本低。

## 1. 目标与原则
- AI 优先：所有核心流程预留 AI 助力接口（问答、解析、排版、题目生成）。
- 模块化：业务域拆分清晰，模块间只通过 API 与事件交互。
- 可扩展：AI 供应商、题库来源、统计指标可逐步扩展。
- 可运营：具备数据采集与分析基础，便于后续个性化推荐。

## 2. 总体架构

```mermaid
flowchart LR
  U[用户] --> W[Web 前端 (Next.js)]
  W --> A[API 服务 (Fastify/TS)]
  A --> DB[(PostgreSQL)]
  A --> AI[AI 供应商适配层]
  AI --> P1[OpenAI]
  AI --> P2[Anthropic]
  AI --> P3[自定义/私有模型]
```

## 3. 技术栈
- 前端：Next.js + TypeScript
- 后端：Node.js + Fastify + TypeScript
- 数据库：PostgreSQL
- AI：可插拔 Provider 层，支持自定义 API/模型

## 4. 关键模块

### 4.1 Web 前端
- 首页、学习入口、练习入口、统计看板、错题本、试卷排版、AI 答疑
- 前端统一调用 API，避免直接依赖 AI 供应商

### 4.2 API 服务
- 领域模块路由：
  - 知识学习 / 题库 / 练习记录
  - 学习时长统计 / 用户行为埋点
  - 错题整理 / 题目解析
  - 试卷排版与下载
  - AI 答疑、题目解析、排版优化

### 4.3 AI 供应商适配层
- 统一 Provider 接口，屏蔽不同供应商差异
- 支持动态配置 `AI_PROVIDER` 和模型参数
- 关键能力：
  - Chat/问答
  - 解析生成
  - 题目生成 / 组卷策略建议
  - 排版摘要与纠错

### 4.4 数据层 (PostgreSQL)
- 统一存储：用户、题库、练习、错题、学习时长、AI 会话
- 数据为后续个性化推荐与统计分析提供基础

## 5. 领域模型草案
- User
- KnowledgeTopic / KnowledgeNote
- Question / QuestionTag / QuestionOption
- PracticeSession / PracticeRecord
- Mistake
- StudyTimeLog
- PaperTemplate / PaperLayoutJob
- AIConversation / AITask

## 6. 数据流示例

### 6.1 AI 答疑
1) 前端提交问题与上下文
2) API 调用 AI Provider
3) 结果持久化为 AIConversation + AITask
4) 返回结构化答案与建议

### 6.2 练习与错题
1) 前端提交练习记录
2) API 写入 PracticeRecord
3) 判定错误 -> 写入 Mistake
4) 统计模块更新学习与错误指标

## 7. AI 设计要点
- 统一输入输出协议（Prompt 模板 + 结构化结果）
- 增量扩展：先问答与解析，再扩展题目生成、排版优化
- 可观测：记录请求耗时、成本、模型、成功率
- 安全与合规：支持脱敏与内容过滤

## 8. 端口与运行规划
- 前端：3030
- 后端：3031
- PostgreSQL：建议 5435（当前 5432/5433/5434 已被占用）

## 9. 扩展与部署策略
- 将 AI Provider 与业务逻辑解耦，未来可按供应商拆分独立服务
- 高并发场景可引入队列 + 异步任务（排版/生成等）
- 统计与分析可后续接入专用分析库或数据仓库

## 10. 风险与待确认事项
- AI 供应商协议变更导致兼容性问题
- 题库来源与版权合规
- 排版与生成任务的性能成本

