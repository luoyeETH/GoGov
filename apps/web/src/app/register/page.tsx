"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

const sessionKey = "gogov_session_token";

type VerifyState = "idle" | "loading" | "success" | "error";

type SubmitState = "idle" | "submitting" | "success" | "error";

type GenderOption = "male" | "female" | "hidden";

function isValidUsername(value: string) {
  const trimmed = value.trim();
  if (/\s/.test(trimmed)) {
    return false;
  }
  return trimmed.length >= 2 && trimmed.length <= 10;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [email, setEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<GenderOption>("hidden");
  const [age, setAge] = useState("");
  const [examStartDate, setExamStartDate] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const canSubmit = useMemo(() => {
    if (!token || !email) {
      return false;
    }
    if (!isValidUsername(username.trim())) {
      return false;
    }
    if (password.length < 8 || password !== confirmPassword) {
      return false;
    }
    return submitState !== "submitting";
  }, [token, email, username, password, confirmPassword, submitState]);

  useEffect(() => {
    if (!token) {
      setVerifyState("error");
      setMessage("缺少注册令牌，请检查邮箱链接。");
      return;
    }

    const verify = async () => {
      setVerifyState("loading");
      setMessage(null);
      try {
        const res = await fetch(`${apiBase}/auth/email/register/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error ?? "验证失败");
        }
        setEmail(data.email);
        setVerifyState("success");
      } catch (err) {
        setVerifyState("error");
        setMessage(err instanceof Error ? err.message : "验证失败");
      }
    };

    void verify();
  }, [token]);

  const submit = async () => {
    setSubmitState("submitting");
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/auth/register/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          username: username.trim(),
          password,
          gender,
          age: age ? Number(age) : undefined,
          examStartDate: examStartDate || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "注册失败");
      }
      if (data.sessionToken) {
        window.localStorage.setItem(sessionKey, data.sessionToken);
      }
      window.dispatchEvent(new Event("auth-change"));
      setSubmitState("success");
      setMessage("注册成功，已自动登录。正在跳转首页...");
      window.setTimeout(() => {
        router.replace("/");
      }, 800);
    } catch (err) {
      setSubmitState("error");
      setMessage(err instanceof Error ? err.message : "注册失败");
    }
  };

  return (
    <main className="main register-page">
      <section className="login-hero">
        <div>
          <p className="eyebrow">邮箱注册</p>
          <h1>完善资料，创建 GoGov 账号</h1>
          <p className="lead">验证成功后即可设置用户名与密码。</p>
        </div>
        <div className="login-status">
          {message ? (
            <div
              className={`status-card ${
                verifyState === "error" || submitState === "error"
                  ? "error"
                  : "success"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>
      </section>

      <section className="register-grid">
        <div className="login-card register-panel">
          {verifyState === "loading" ? (
            <div className="practice-loading">正在验证邮箱...</div>
          ) : verifyState === "error" ? (
            <div className="practice-error">{message}</div>
          ) : (
            <>
              <div className="form-row">
                <label>邮箱</label>
                <input value={email ?? ""} disabled />
              </div>
              <div className="form-row">
                <label htmlFor="username">用户名</label>
                <input
                  id="username"
                  value={username}
                  placeholder="2-10 位字符"
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="password">设置密码</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  placeholder="至少 8 位"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="confirmPassword">确认密码</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="gender">性别</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(event) =>
                    setGender(event.target.value as GenderOption)
                  }
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                  <option value="hidden">隐藏</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="age">年龄</label>
                <input
                  id="age"
                  type="number"
                  min={0}
                  max={120}
                  value={age}
                  placeholder="可选"
                  onChange={(event) => setAge(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="examStart">备考开始时间</label>
                <input
                  id="examStart"
                  type="date"
                  value={examStartDate}
                  onChange={(event) => setExamStartDate(event.target.value)}
                />
              </div>
              <button
                type="button"
                className="primary"
                onClick={submit}
                disabled={!canSubmit}
              >
                {submitState === "submitting" ? "提交中..." : "完成注册"}
              </button>
            </>
          )}
        </div>

        <aside className="login-aside">
          <div className="aside-card">
            <h3>注册后你将获得</h3>
            <div className="aside-list">
              <div>✔ 专属学习画像</div>
              <div>✔ 练习与错题同步</div>
              <div>✔ AI 解析与策略建议</div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="main register-page">
          <section className="login-hero">
            <div>
              <p className="eyebrow">邮箱注册</p>
              <h1>完善资料，创建 GoGov 账号</h1>
              <p className="lead">验证中，请稍候...</p>
            </div>
          </section>
        </main>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
