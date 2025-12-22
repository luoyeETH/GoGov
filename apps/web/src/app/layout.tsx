import Link from "next/link";
import Script from "next/script";
import NavUser from "../components/nav-user";
import { ThemeProvider } from "../components/theme-provider";
import ThemeToggle from "../components/theme-toggle";
import "./globals.css";

export const metadata = {
  title: "GoGov 公考助手",
  description: "AI 驱动的公考学习与训练平台",
  icons: {
    icon: [
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-theme="eyecare">
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function () {
            try {
              var stored = localStorage.getItem("theme");
              var theme =
                stored === "light" || stored === "dark" || stored === "eyecare"
                  ? stored
                  : "eyecare";
              document.documentElement.setAttribute("data-theme", theme);
            } catch (e) {
              document.documentElement.setAttribute("data-theme", "eyecare");
            }
          })();
        `}</Script>
      </head>
      <body>
        <ThemeProvider>
          <div className="page">
            <header className="header">
              <div className="header-left">
                <Link href="/" className="brand-link">
                  <img
                    src="/icon-96.png"
                    alt="GoGov"
                    className="brand-logo"
                    width={24}
                    height={24}
                  />
                  <span className="brand-text">GoGov</span>
                </Link>
                <nav className="nav">
                  <Link href="/knowledge">常识学习</Link>
                  <Link href="/practice/quick">速算练习</Link>
                  <Link href="/mock-report">模考解读</Link>
                  <Link href="/study-plan">备考规划</Link>
                  <Link href="/kline">上岸K线</Link>
                  <Link href="/daily-tasks">今日任务</Link>
                  <Link href="/stats">统计看板</Link>
                  <Link href="/mistakes">错题本</Link>
                  <Link href="/ai/assist">AI 答疑</Link>
                </nav>
              </div>
              <div className="header-right">
                <ThemeToggle />
                <NavUser />
              </div>
            </header>
            {children}
            <footer className="footer">
              <div className="footer-row">
                <span>AI 驱动的公考学习与训练平台</span>
                <a
                  className="footer-github"
                  href="https://github.com/luoyeETH/GoGov"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GoGov GitHub"
                >
                  <svg
                    viewBox="0 0 24 24"
                    role="img"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.6 2 12.28c0 4.52 2.87 8.36 6.84 9.72.5.1.68-.22.68-.5 0-.24-.01-.88-.02-1.72-2.78.62-3.37-1.38-3.37-1.38-.45-1.18-1.1-1.49-1.1-1.49-.9-.63.07-.62.07-.62 1 .07 1.52 1.05 1.52 1.05.88 1.55 2.3 1.1 2.86.84.09-.66.35-1.1.63-1.36-2.22-.26-4.56-1.15-4.56-5.1 0-1.13.39-2.06 1.03-2.79-.1-.26-.45-1.31.1-2.74 0 0 .84-.27 2.75 1.05a9.1 9.1 0 0 1 2.5-.35c.85 0 1.7.12 2.5.35 1.9-1.32 2.74-1.05 2.74-1.05.56 1.43.21 2.48.1 2.74.64.73 1.03 1.66 1.03 2.79 0 3.96-2.34 4.83-4.58 5.09.36.32.68.94.68 1.9 0 1.38-.02 2.5-.02 2.84 0 .28.18.6.69.5A10.1 10.1 0 0 0 22 12.28C22 6.6 17.52 2 12 2z"
                    />
                  </svg>
                </a>
              </div>
              <span className="footer-note">
                Backend built with Codex and Claude Code. Frontend UI/UX crafted by
                Gemini. Design by humans.
              </span>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
