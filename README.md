# 学了么（GoGov）公考助手

学了么（GoGov）是一个面向国考、省考、事业编等备考场景的 AI 学习与训练平台。项目覆盖学习资料导入、专项训练、AI 答疑、模考复盘、备考规划、每日任务、错题复习、专注统计、记账与移动端入口等完整备考流程。

技术栈：前端使用 Next.js 14 + React 18，后端基于 Fastify + Prisma + PostgreSQL，支持 PWA 与移动端适配。

## 在线访问

主站：`https://学了么.com/`

## 功能概览

- 学习训练：常识学习、计算机专项、速算练习、结构化面试演练。
- AI 辅助：AI 对话、专项答疑、题目解析、规划建议与历史会话。
- 规划执行：备考规划、今日任务、自定义待办、番茄钟专注统计。
- 复盘看板：模考成绩解读、统计看板、错题本、学习排行榜。
- 工具模块：上岸 K 线、考试记账本、移动端更多功能目录。
- 账号服务：邮箱注册、钱包登录、个人资料、AI 配置、密码修改。
- 移动端体验：底部导航、PWA 视图、折叠面板、加载骨架、空状态、错误重试与小屏布局适配。

## 项目结构

```text
apps/
  api/      Fastify API、Prisma 数据模型、AI 调用与业务接口
  web/      Next.js Web/PWA 前端
  android/  Android 客户端
packages/
  shared/   前后端共享类型与题库分类
```

## 部署与运行

### 依赖要求

- Node.js 18+，建议 20+
- PostgreSQL 14+
- npm workspaces

### 安装依赖

```bash
npm install
```

### 环境变量

后端配置文件：`apps/api/.env`

```env
API_PORT=3031
DATABASE_URL=postgresql://gogov:gogov@localhost:5435/gogov
APP_BASE_URL=https://app.example.com
EMAIL_FROM=学了么 <no-reply@example.com>
RESEND_API_KEY=
SESSION_TTL_DAYS=7
PASSWORD_SALT_ROUNDS=12

# 可选：严格限制跨域来源，多个来源用英文逗号分隔
CORS_ORIGINS=https://app.example.com,http://localhost:3030

# 可选：部署在 nginx/caddy 等反向代理后时启用
TRUST_PROXY=1
```

前端配置文件：`apps/web/.env`

```env
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
WEB_PORT=3030
```

AI 能力可通过用户个人配置启用，也可在后端配置系统免费通道：

```env
AI_PROVIDER=custom
AI_MODEL=your-model
AI_BASE_URL=https://api.example.com
AI_API_KEY=your-api-key

FREE_AI_PROVIDER=custom
FREE_AI_MODEL=your-free-model
FREE_AI_BASE_URL=https://api.example.com
FREE_AI_API_KEY=your-free-api-key
FREE_AI_DAILY_LIMIT=20
```

`FREE_AI_DAILY_LIMIT` 控制每个用户每日免费调用次数，未配置时默认 20 次/日；服务端另有全站上游额度保护。

邮箱验证支持 Resend 或 Gmail。配置 Gmail 时优先使用 Gmail，否则使用 Resend：

```env
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### 数据库迁移

开发环境：

```bash
cd apps/api
npx prisma migrate dev
```

生产环境：

```bash
cd apps/api
npx prisma migrate deploy
```

### 常用命令

```bash
# 前后端开发模式
npm run dev

# 仅启动 Web
npm run dev:web

# 仅启动 API
npm run dev:api

# 生产构建
npm run build

# 启动生产 API
npm --workspace @gogov/api run start

# 启动生产 Web
npm --workspace @gogov/web run start
```

默认端口：Web `3030`，API `3031`。

## AI 配置说明

用户登录后可在「个人主页」配置：

- AI Provider
- Base URL
- Model
- API Key

未配置个人 AI 时，系统会尝试使用后端免费通道。图片识别、模考截图解析等能力需要所选模型支持视觉输入。

## 移动端与 PWA

Web 端已按移动端优先体验优化，包含底部导航、更多功能目录、PWA 模式清单视图、移动端折叠面板、横向图表滚动、加载骨架与离线友好的状态提示。

## License

本项目使用 **PolyForm Noncommercial 1.0.0**，禁止商业用途。详见 `LICENSE`。

## 免责声明

本项目由 Codex、Claude Code、Gemini 等 AI 工具辅助生成。AI 输出仅供学习参考，不构成考试承诺、职业建议或结果保证。使用本项目产生的结果与风险由使用者自行承担。
