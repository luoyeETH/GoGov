# 学了么（GoGov）公考助手

学了么（GoGov）是一个面向公考备考的 AI 学习与训练平台，覆盖常识学习、速算训练、模考解读、备考规划与每日任务等模块。实测使用 `gemini-3-flash-preview` 模型取得了不错的效果。

技术栈：前端使用 Next.js + React，后端基于 Fastify + Prisma（PostgreSQL）。

## 功能概览
- 常识学习：支持 OCR / 文档导入，AI 生成学习内容。
- 模考成绩解读：上传截图或手动录入，AI 给出解析与训练建议。
- 备考规划：结合背景信息与模考记录生成长期/周/日计划。
- 每日任务：自动生成当日任务，可调整、拆解与打卡。
- 速算练习：题型专项与训练记录统计。
- 娱乐功能：上岸 K 线，根据出生信息与补充资料生成上岸概率与逐年分析。

## 演示网站
访问：`https://学了么.com/`
备用：`https://gogov.0xluoye.xyz/`

## 部署与运行

### 依赖要求
- Node.js 18+（建议 20+）
- PostgreSQL 14+

### 安装依赖
```bash
npm install
```

### 环境变量
后端在 `apps/api/.env` 中配置：
```env
DATABASE_URL=postgresql://user:password@host:5432/gogov
API_PORT=3001
RESEND_API_KEY=your_resend_key
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password
EMAIL_FROM="学了么（GoGov） <your_gmail_address>"
```

前端在 `apps/web/.env` 中配置（可选）：
```env
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
```

### 数据库迁移
开发环境：
```bash
cd /home/GoGov/apps/api
npx prisma migrate dev
```

生产环境：
```bash
cd /home/GoGov/apps/api
npx prisma migrate deploy
```

### 启动服务
开发模式（前后端同时启动）：
```bash
npm run dev
```

生产构建与启动：
```bash
npm run build
npm --workspace @gogov/api run start
npm --workspace @gogov/web run start
```

默认端口：Web `3000`，API `3001`。

## AI 配置
AI 能力通过用户配置启用。登录后进入「个人资料」页，设置：
- AI Provider（openai / custom 等）
- Base URL（自建或代理 API 地址）
- Model（支持文本或多模态的模型）
- API Key

未配置时，AI 功能会提示无法调用。若需要图片/多模态识别，请选择支持视觉的模型。

可选：在 `apps/api/.env` 中配置系统免费通道（`FREE_AI_PROVIDER`、`FREE_AI_MODEL`、`FREE_AI_BASE_URL`、`FREE_AI_API_KEY`），未配置 AI 的用户将自动使用该通道。`FREE_AI_DAILY_LIMIT` 用于限制每个用户每天的免费调用次数（未填写时默认 20 次/日）。

## License
本项目使用 **PolyForm Noncommercial 1.0.0**，禁止商业用途。详见 `LICENSE`。

## 免责声明
本项目由 Codex、Claude Code、Gemini 等 AI 工具辅助生成。我们不对 AI 辅助备考的有效性或网站功能的完整性作任何保证，使用本项目所产生的结果或风险由使用者自行承担。
