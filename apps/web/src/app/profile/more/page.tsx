import Link from "next/link";

type FeatureIcon =
  | "book"
  | "computer"
  | "calculator"
  | "interview"
  | "plan"
  | "tasks"
  | "todo"
  | "timer"
  | "stats"
  | "mistakes"
  | "report"
  | "leaderboard"
  | "chat"
  | "assist"
  | "kline"
  | "ledger"
  | "profile"
  | "password";

type FeatureItem = {
  href: string;
  title: string;
  desc: string;
  icon: FeatureIcon;
};

const featureGroups: Array<{ title: string; items: FeatureItem[] }> = [
  {
    title: "学习训练",
    items: [
      { href: "/knowledge", title: "常识学习", desc: "OCR 与文档导入", icon: "book" },
      { href: "/computer", title: "计算机专项", desc: "专业科目刷题", icon: "computer" },
      { href: "/practice/quick", title: "速算练习", desc: "行测速度训练", icon: "calculator" },
      { href: "/interview", title: "AI 面试教练", desc: "结构化面试演练", icon: "interview" }
    ]
  },
  {
    title: "规划执行",
    items: [
      { href: "/study-plan", title: "备考规划", desc: "长期与周计划", icon: "plan" },
      { href: "/daily-tasks", title: "今日任务", desc: "每日清单打卡", icon: "tasks" },
      { href: "/study-plan/custom-tasks", title: "待办清单", desc: "自定义任务池", icon: "todo" },
      { href: "/pomodoro", title: "番茄钟", desc: "专注计时统计", icon: "timer" }
    ]
  },
  {
    title: "复盘看板",
    items: [
      { href: "/mock-report", title: "模考解读", desc: "成绩截图解析", icon: "report" },
      { href: "/stats", title: "统计看板", desc: "正确率与趋势", icon: "stats" },
      { href: "/mistakes", title: "错题本", desc: "错因归纳复习", icon: "mistakes" },
      { href: "/leaderboard", title: "学习排行榜", desc: "学习时长排行", icon: "leaderboard" }
    ]
  },
  {
    title: "AI 与工具",
    items: [
      { href: "/chat", title: "AI 对话", desc: "移动端连续答疑", icon: "chat" },
      { href: "/ai/assist", title: "AI 答疑", desc: "专项问答辅助", icon: "assist" },
      { href: "/kline", title: "上岸 K 线", desc: "趋势与概率分析", icon: "kline" },
      { href: "/ledger", title: "记账本", desc: "备考支出记录", icon: "ledger" }
    ]
  },
  {
    title: "账号服务",
    items: [
      { href: "/profile", title: "个人主页", desc: "资料与 AI 配置", icon: "profile" },
      { href: "/password", title: "修改密码", desc: "账号安全设置", icon: "password" }
    ]
  }
];

function FeatureIconSvg({ name }: { name: FeatureIcon }) {
  switch (name) {
    case "book":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "computer":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "calculator":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <circle cx="9" cy="12" r="1" fill="currentColor" />
          <circle cx="15" cy="12" r="1" fill="currentColor" />
          <circle cx="9" cy="16" r="1" fill="currentColor" />
          <circle cx="15" cy="16" r="1" fill="currentColor" />
        </svg>
      );
    case "interview":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 0 1 18 0v4a3 3 0 0 1-3 3h-2" />
          <path d="M3 12v4a3 3 0 0 0 3 3h2" />
          <circle cx="9" cy="13" r="1" />
          <circle cx="15" cy="13" r="1" />
          <path d="M9 16h6" />
        </svg>
      );
    case "plan":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "tasks":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "todo":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <path d="M3 6h.01" />
          <path d="M3 12h.01" />
          <path d="M3 18h.01" />
        </svg>
      );
    case "timer":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l3 2" />
          <path d="M9 2h6" />
        </svg>
      );
    case "stats":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "mistakes":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "report":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case "leaderboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="M17 5H7a2 2 0 0 0-2 2v6a7 7 0 0 0 14 0V7a2 2 0 0 0-2-2z" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3C7.03 3 3 6.58 3 11c0 2.12.94 4.04 2.47 5.44L4 21l4.89-2.12c.97.32 2.02.5 3.11.5 4.97 0 9-3.58 9-8s-4.03-8-9-8z" />
          <circle cx="8.5" cy="11" r="1" fill="currentColor" />
          <circle cx="12" cy="11" r="1" fill="currentColor" />
          <circle cx="15.5" cy="11" r="1" fill="currentColor" />
        </svg>
      );
    case "assist":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "kline":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19V5" />
          <path d="M4 19h17" />
          <path d="m7 15 4-4 3 3 5-8" />
        </svg>
      );
    case "ledger":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      );
    case "password":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
  }
}

export default function ProfileMorePage() {
  return (
    <main className="main register-page">
      <section className="login-hero app-page-header">
        <div className="app-page-header-main">
          <p className="eyebrow">个人中心</p>
          <h1 className="app-page-title">更多功能</h1>
          <p className="lead app-page-subtitle">常用工具与服务入口</p>
        </div>
        <div className="profile-more-back">
          <Link href="/profile" className="ghost profile-more-back-link">
            <span className="profile-more-back-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 6 9 12 15 18" />
              </svg>
            </span>
            <span>返回资料</span>
          </Link>
        </div>
      </section>

      <section className="profile-more-features profile-more-features--page">
        {featureGroups.map((group) => (
          <div className="profile-more-section" key={group.title}>
            <h2 className="profile-more-section-title">{group.title}</h2>
            <div className="features-grid profile-more-grid">
              {group.items.map((item) => (
                <Link href={item.href} className="feature-card" key={item.href}>
                  <span className="feature-icon" aria-hidden="true">
                    <FeatureIconSvg name={item.icon} />
                  </span>
                  <span className="feature-title">{item.title}</span>
                  <span className="feature-desc">{item.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
