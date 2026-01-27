import Link from "next/link";

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
          <Link href="/profile" className="ghost">
            返回资料
          </Link>
        </div>
      </section>

      <section className="profile-more-features profile-more-features--page">
        <div className="features-grid profile-more-grid">
          <Link href="/knowledge" className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </span>
            <span className="feature-title">常识学习</span>
          </Link>
          <Link href="/computer" className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </span>
            <span className="feature-title">计算机专项</span>
          </Link>
          <Link href="/mock-report" className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            <span className="feature-title">模考解读</span>
          </Link>
          <Link href="/study-plan" className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <span className="feature-title">备考规划</span>
          </Link>
          <Link href="/stats" className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            <span className="feature-title">统计看板</span>
          </Link>
          <Link href="/mistakes" className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span className="feature-title">错题本</span>
          </Link>
          <Link href="/leaderboard" className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 21h8M12 17v4M17 5H7a2 2 0 0 0-2 2v6a7 7 0 0 0 14 0V7a2 2 0 0 0-2-2z" />
              </svg>
            </span>
            <span className="feature-title">排行榜</span>
          </Link>
          <Link href="/kline" className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </span>
            <span className="feature-title">上岸K线</span>
          </Link>
          <Link href="/ledger" className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </span>
            <span className="feature-title">记账本</span>
          </Link>
          <Link href="/ai/assist" className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span className="feature-title">AI 答疑</span>
          </Link>
          <Link href="/password" className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <span className="feature-title">修改密码</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

