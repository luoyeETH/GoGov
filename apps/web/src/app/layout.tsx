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
              <span>AI 驱动的公考学习与训练平台</span>
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
