import Link from "next/link";
import Script from "next/script";
import { cookies } from "next/headers";
import NavUser from "../components/nav-user";
import MainNav from "../components/main-nav";
import { ThemeProvider } from "../components/theme-provider";
import ThemeToggle from "../components/theme-toggle";
import { FontSizeProvider } from "../components/font-size-provider";
import FontSizeSwitcher from "../components/font-size-switcher";
import FloatingChat from "../components/floating-chat";
import "./globals.css";

export const metadata = {
  title: "学了么 公考助手",
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

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const themeCookie = cookieStore.get("gogov_theme")?.value;
  const fontSizeCookie = cookieStore.get("gogov_font_size")?.value;
  const initialTheme =
    themeCookie === "eyecare" || themeCookie === "light" || themeCookie === "dark"
      ? themeCookie
      : "eyecare";
  const initialFontSize =
    fontSizeCookie === "default" ||
    fontSizeCookie === "large" ||
    fontSizeCookie === "extra-large"
      ? fontSizeCookie
      : "default";

  return (
    <html lang="zh-CN" data-theme={initialTheme} data-font-size={initialFontSize}>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function () {
            try {
              // User Preferences Init
              var prefs = {};
              try {
                var prefsString = localStorage.getItem("user_preferences");
                if (prefsString) {
                  prefs = JSON.parse(prefsString);
                }
              } catch (e) {}

              // Theme Init
              var storedTheme = prefs.theme || localStorage.getItem("theme");
              var theme =
                storedTheme === "light" || storedTheme === "dark" || storedTheme === "eyecare"
                  ? storedTheme
                  : document.documentElement.getAttribute("data-theme") || "eyecare";
              document.documentElement.setAttribute("data-theme", theme);

              // Font Size Init
              var storedFontSize = prefs.fontSize || localStorage.getItem("fontSize");
              var fontSize =
                storedFontSize === "default" || storedFontSize === "large" || storedFontSize === "extra-large"
                  ? storedFontSize
                  : document.documentElement.getAttribute("data-font-size") || "default";
              document.documentElement.setAttribute("data-font-size", fontSize);
            } catch (e) {
              document.documentElement.setAttribute("data-theme", "eyecare");
              document.documentElement.setAttribute("data-font-size", "default");
            }
          })();
        `}</Script>
      </head>
      <body>
        <FontSizeProvider>
          <ThemeProvider>
            <div className="page">
              <header className="header">
                <div className="header-left">
                  <Link href="/" className="brand-link">
                    <img
                      src="/icon-96.png"
                      alt="学了么"
                      className="brand-logo"
                      width={24}
                      height={24}
                    />
                    <span className="brand-text">学了么</span>
                  </Link>
                  <MainNav />
                </div>
                <div className="header-right">
                  <FontSizeSwitcher />
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
                    aria-label="学了么 GitHub"
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
              <FloatingChat />
            </div>
          </ThemeProvider>
        </FontSizeProvider>
      </body>
    </html>
  );
}
