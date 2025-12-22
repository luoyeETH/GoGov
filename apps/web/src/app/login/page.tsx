"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const apiBase = (() => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window === "undefined") {
    return "http://localhost:3031";
  }
  const hostname = window.location.hostname.replace(/^www\./, "");
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3031";
  }
  return `https://api.${hostname}`;
})();

type Challenge = {
  id: string;
  question: string;
};

type RequestState = "idle" | "sending" | "sent" | "error";

type LoginState = "idle" | "loading" | "success" | "error";

type UserProfile = {
  id: string;
  email?: string | null;
  username?: string | null;
  walletAddress?: string | null;
  gender?: string | null;
  age?: number | null;
  examStartDate?: string | null;
};

const sessionKey = "gogov_session_token";

type LoginMethod = "wallet" | "email";

const HEADINGS = [
  "继续你的速算与资料分析训练",
  "保持专注，每天进步一点点",
  "提升数字敏感度，掌握资料分析技巧",
  "让每一次练习都成为成长的阶梯",
  "坚持训练，遇见更好的自己",
  "数据不会说谎，努力终有回报",
  "开启今天的思维体操",
];

const QUOTES = [
  "“学习不是填满水桶，而是点燃火种。”",
  "“业精于勤，荒于嬉；行成于思，毁于随。”",
  "“锲而舍之，朽木不折；锲而不舍，金石可镂。”",
  "“不积跬步，无以至千里；不积小流，无以成江海。”",
  "“天才就是百分之九十九的汗水加百分之一的灵感。”",
  "“只有极其努力，才能看起来毫不费力。”",
  "“每一个不曾起舞的日子，都是对生命的辜负。”",
  "“种一棵树最好的时间是十年前，其次是现在。”",
  "“既然选择了远方，便只顾风雨兼程。”",
  "“星光不问赶路人，时光不负有心人。”",
  "“流水不争先，争的是滔滔不绝。”",
  "“学而不思则罔，思而不学则殆。”",
  "“知之者不如好之者，好之者不如乐之者。”",
  "“博学之，审问之，慎思之，明辨之，笃行之。”",
  "“在这个浮躁的时代，只有自律者才能出众。”",
];

export default function LoginPage() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("wallet");
  const [emailMode, setEmailMode] = useState<"login" | "register">("login");
  const [heading, setHeading] = useState(HEADINGS[0]);
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    setHeading(HEADINGS[Math.floor(Math.random() * HEADINGS.length)]);
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const canSend = useMemo(
    () =>
      email.trim().length > 3 &&
      captchaAnswer.trim().length > 0 &&
      requestState !== "sending" &&
      cooldownSeconds === 0,
    [email, captchaAnswer, requestState, cooldownSeconds]
  );

  const canLogin = useMemo(
    () =>
      email.trim().length > 3 &&
      password.trim().length > 0 &&
      loginState !== "loading",
    [email, password, loginState]
  );

  const loadChallenge = async () => {
    try {
      const res = await fetch(`${apiBase}/auth/email/challenge`);
      if (!res.ok) {
        throw new Error("无法获取验证码");
      }
      const data = (await res.json()) as Challenge;
      setChallenge(data);
    } catch (err) {
      setRequestMessage(
        err instanceof Error ? err.message : "验证码加载失败"
      );
    }
  };

  useEffect(() => {
    if (emailMode === "register") {
      loadChallenge();
    }
  }, [emailMode]);

  useEffect(() => {
    const loadSession = async () => {
      const stored = window.localStorage.getItem(sessionKey);
      if (!stored) {
        return;
      }
      try {
        const res = await fetch(`${apiBase}/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` }
        });
        if (!res.ok) {
          throw new Error("未登录");
        }
        const data = await res.json();
        setCurrentUser(data.user);
        setSessionExpiresAt(data.sessionExpiresAt ?? null);
      } catch (_err) {
        window.localStorage.removeItem(sessionKey);
      }
    };

    void loadSession();
  }, []);

  const loginWithEmail = async () => {
    setLoginState("loading");
    setLoginMessage(null);
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "登录失败");
      }
      if (data.sessionToken) {
        window.localStorage.setItem(sessionKey, data.sessionToken);
        setCurrentUser({
          id: data.userId,
          email: data.email,
          username: data.username,
          gender: data.gender,
          age: data.age,
          examStartDate: data.examStartDate
        });
        setSessionExpiresAt(data.sessionExpiresAt ?? null);
      }
      setLoginState("success");
      setLoginMessage("登录成功。");
      window.dispatchEvent(new Event("auth-change"));
      routeAfterLogin(data);
    } catch (err) {
      setLoginState("error");
      setLoginMessage(err instanceof Error ? err.message : "登录失败");
    }
  };

  const sendEmail = async () => {
    if (!challenge) {
      return;
    }
    setRequestState("sending");
    setRequestMessage(null);
    try {
      const res = await fetch(`${apiBase}/auth/email/register/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          challengeId: challenge.id,
          answer: captchaAnswer.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "发送失败");
      }
      setRequestState("sent");
      setRequestMessage("注册验证邮件已发送，请查收邮箱。");
      setCaptchaAnswer("");
      setCooldownSeconds(30);
      void loadChallenge();
    } catch (err) {
      setRequestState("error");
      setRequestMessage(err instanceof Error ? err.message : "发送失败");
      void loadChallenge();
    }
  };

  const connectWallet = async () => {
    setWalletMessage(null);
    if (typeof window === "undefined" || !window.ethereum) {
      setWalletMessage("未检测到钱包插件，请先安装钱包。");
      return;
    }
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts"
      })) as string[];
      const address = accounts?.[0];
      if (!address) {
        throw new Error("未获取到钱包地址");
      }
      const challengeRes = await fetch(
        `${apiBase}/auth/wallet/challenge?address=${address}`
      );
      const challengeData = await challengeRes.json();
      if (!challengeRes.ok) {
        throw new Error(challengeData?.error ?? "获取签名挑战失败");
      }

      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [challengeData.message, address]
      })) as string;

      const res = await fetch(`${apiBase}/auth/wallet/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          challengeId: challengeData.id,
          signature
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "钱包登录失败");
      }
      if (data.sessionToken) {
        window.localStorage.setItem(sessionKey, data.sessionToken);
        setCurrentUser({
          id: data.userId,
          walletAddress: data.walletAddress,
          username: data.username,
          gender: data.gender,
          age: data.age,
          examStartDate: data.examStartDate
        });
        setSessionExpiresAt(data.sessionExpiresAt ?? null);
      }
      setWalletMessage(`钱包已验证：${address}`);
      window.dispatchEvent(new Event("auth-change"));
      routeAfterLogin(data);
    } catch (err) {
      setWalletMessage(err instanceof Error ? err.message : "钱包登录失败");
    }
  };

  const logout = async () => {
    const stored = window.localStorage.getItem(sessionKey);
    if (!stored) {
      setCurrentUser(null);
      setSessionExpiresAt(null);
      return;
    }
    try {
      await fetch(`${apiBase}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${stored}` }
      });
    } finally {
      window.localStorage.removeItem(sessionKey);
      setCurrentUser(null);
      setSessionExpiresAt(null);
      window.dispatchEvent(new Event("auth-change"));
    }
  };

  const routeAfterLogin = (data: {
    username?: string | null;
  }) => {
    if (!data?.username) {
      router.replace("/profile");
      return;
    }
    router.replace("/");
  };

  return (
    <main className="main login-page">
      <section className="login-hero">
        <div>
          <p className="eyebrow">账号入口</p>
          <h1>{heading}</h1>
          <p className="lead">
            默认使用 Web3 登录，邮箱注册后可使用邮箱+密码登录。
          </p>
        </div>
        <div className="login-status">
          {currentUser ? (
            <div className="status-card success">
              <div className="status-title">已登录</div>
              <div className="status-lines">
                {currentUser.email ? (
                  <span>邮箱：{currentUser.email}</span>
                ) : null}
                {currentUser.walletAddress ? (
                  <span>钱包：{currentUser.walletAddress}</span>
                ) : null}
              </div>
              {sessionExpiresAt ? (
                <div className="status-meta">有效期至：{sessionExpiresAt}</div>
              ) : null}
              <button type="button" className="ghost" onClick={logout}>
                退出登录
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="login-grid">
        <div className="login-card login-panel">
          <div className="login-toggle">
            <button
              type="button"
              className={`login-toggle-button ${
                loginMethod === "wallet" ? "active" : ""
              }`}
              onClick={() => setLoginMethod("wallet")}
            >
              Web3 登录
            </button>
            <button
              type="button"
              className={`login-toggle-button ${
                loginMethod === "email" ? "active" : ""
              }`}
              onClick={() => setLoginMethod("email")}
            >
              邮箱登录
            </button>
          </div>

          {loginMethod === "wallet" ? (
            <>
              <h3>Web3 钱包登录</h3>
              <p>连接钱包并签名，完成身份验证。</p>
              <button type="button" className="primary" onClick={connectWallet}>
                连接并签名
              </button>
              {walletMessage ? (
                <p className="form-message">{walletMessage}</p>
              ) : null}
            </>
          ) : (
            <>
              {emailMode === "login" ? (
                <>
                  <h3>邮箱登录</h3>
                  <p>输入邮箱与密码登录。</p>
                  <div className="form-row">
                    <label htmlFor="email">邮箱</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="password">密码</label>
                    <input
                      id="password"
                      type="password"
                      placeholder="输入密码"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="primary"
                    onClick={loginWithEmail}
                    disabled={!canLogin}
                  >
                    {loginState === "loading" ? "登录中..." : "登录"}
                  </button>
                  {loginMessage ? (
                    <p className="form-message">{loginMessage}</p>
                  ) : null}
                  <button
                    type="button"
                    className="ghost"
                    style={{ fontSize: "13px" }}
                    onClick={() => setEmailMode("register")}
                  >
                    没有账号？去注册 →
                  </button>
                </>
              ) : (
                <>
                  <h3>注册账号</h3>
                  <p>输入邮箱验证并设置密码（注册流程）。</p>
                  <div className="form-row">
                    <label htmlFor="email">邮箱</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="form-row captcha-row">
                    <label htmlFor="captcha">验证码</label>
                    <input
                      id="captcha"
                      type="text"
                      placeholder="输入答案"
                      value={captchaAnswer}
                      onChange={(event) => setCaptchaAnswer(event.target.value)}
                    />
                    <button
                      type="button"
                      className="ghost"
                      onClick={loadChallenge}
                    >
                      {challenge ? challenge.question : "刷新"}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="primary"
                    onClick={sendEmail}
                    disabled={!canSend}
                  >
                    {requestState === "sending"
                      ? "发送中..."
                      : cooldownSeconds > 0
                      ? `重新发送 (${cooldownSeconds}s)`
                      : "发送注册邮件"}
                  </button>
                  {requestMessage ? (
                    <p className="form-message">{requestMessage}</p>
                  ) : null}
                  <button
                    type="button"
                    className="ghost"
                    style={{ fontSize: "13px" }}
                    onClick={() => setEmailMode("login")}
                  >
                    已有账号？去登录 →
                  </button>
                </>
              )}
            </>
          )}
        </div>

        <aside className="login-aside">
          <div className="aside-card intro-card">
            <h3>为什么登录？</h3>
            <p>
              解锁完整功能，让每一次练习都算数。
            </p>
            <ul className="benefit-list">
              <li>
                <span className="icon">📊</span>
                <div className="text">
                  <strong>练习记录</strong>
                  <span>永久保存你的答题历史与错题本</span>
                </div>
              </li>
              <li>
                <span className="icon">🧠</span>
                <div className="text">
                  <strong>AI 助教</strong>
                  <span>获得个性化的答题建议与解析</span>
                </div>
              </li>
              <li>
                <span className="icon">☁️</span>
                <div className="text">
                  <strong>多端同步</strong>
                  <span>电脑、手机无缝切换学习进度</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="aside-card tips-card">
            <h3>每日一言</h3>
            <p>{quote}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}
