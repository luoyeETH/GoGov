import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "GoGov 公考助手",
  description: "AI 驱动的公考学习与训练平台",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="page">
          <header className="header">
            <div className="brand">GoGov</div>
            <nav className="nav">
              <Link href="/practice/quick">速算练习</Link>
              <span>常识学习</span>
              <span>错题整理</span>
              <span>AI 答疑</span>
            </nav>
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
      </body>
    </html>
  );
}
