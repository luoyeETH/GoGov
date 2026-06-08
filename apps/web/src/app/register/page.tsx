"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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

type FieldErrors = {
  username?: string;
  password?: string;
  confirmPassword?: string;
  age?: string;
};

type FieldName = keyof FieldErrors;

type RegisterFormValues = {
  username: string;
  password: string;
  confirmPassword: string;
  age: string;
};

const fieldOrder: FieldName[] = ["username", "password", "confirmPassword", "age"];

const fieldLabels: Record<FieldName, string> = {
  username: "用户名",
  password: "设置密码",
  confirmPassword: "确认密码",
  age: "年龄"
};

const fieldHints: Record<FieldName, string> = {
  username: "2-10 位字符，不能包含空格。",
  password: "至少 8 位，建议同时包含字母和数字。",
  confirmPassword: "请再次输入刚才设置的密码。",
  age: "选填，范围 0-120 岁。"
};

function validateUsername(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return "请输入用户名";
  }
  if (/\s/.test(trimmed)) {
    return "用户名不能包含空格";
  }
  if (trimmed.length < 2) {
    return "用户名至少 2 个字符";
  }
  if (trimmed.length > 10) {
    return "用户名最多 10 个字符";
  }
  return undefined;
}

function validatePassword(value: string): string | undefined {
  if (!value) {
    return "请输入密码";
  }
  if (value.length < 8) {
    return "密码长度至少 8 位";
  }
  return undefined;
}

function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) {
    return "请确认密码";
  }
  if (password !== confirmPassword) {
    return "两次输入的密码不一致";
  }
  return undefined;
}

function validateAge(value: string): string | undefined {
  if (!value) {
    return undefined; // 年龄是可选的
  }
  const num = Number(value);
  if (isNaN(num) || num < 0 || num > 120) {
    return "请输入有效的年龄（0-120）";
  }
  return undefined;
}

function validateFields(values: RegisterFormValues): FieldErrors {
  return {
    username: validateUsername(values.username),
    password: validatePassword(values.password),
    confirmPassword: validateConfirmPassword(
      values.password,
      values.confirmPassword
    ),
    age: validateAge(values.age)
  };
}

function getFirstErrorField(errors: FieldErrors): FieldName | null {
  return fieldOrder.find((field) => Boolean(errors[field])) ?? null;
}

function mapServerErrorToFieldErrors(errorMessage: string): FieldErrors {
  if (errorMessage.includes("用户名")) {
    return { username: errorMessage };
  }
  if (errorMessage.includes("密码")) {
    return { password: errorMessage };
  }
  if (errorMessage.includes("年龄")) {
    return { age: errorMessage.includes("0-120") ? errorMessage : "请输入有效的年龄（0-120）" };
  }
  return {};
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const fieldRefs = useRef<Record<FieldName, HTMLInputElement | null>>({
    username: null,
    password: null,
    confirmPassword: null,
    age: null
  });

  const formValues = useMemo(
    () => ({
      username,
      password,
      confirmPassword,
      age
    }),
    [username, password, confirmPassword, age]
  );

  const canSubmit = useMemo(() => {
    if (!token || !email || verifyState !== "success") {
      return false;
    }
    return submitState !== "submitting";
  }, [token, email, verifyState, submitState]);

  const visibleFieldErrors = useMemo(
    () =>
      fieldOrder.flatMap((field) =>
        fieldErrors[field] ? [{ field, label: fieldLabels[field], error: fieldErrors[field]! }] : []
      ),
    [fieldErrors]
  );

  const syncFieldErrors = (nextValues: RegisterFormValues) => {
    const shouldValidate = submitAttempted || Object.values(touched).some(Boolean);
    if (!shouldValidate) {
      return;
    }
    setFieldErrors(validateFields(nextValues));
  };

  const clearSubmitErrorIfNeeded = () => {
    if (submitState === "error") {
      setSubmitState("idle");
      setMessage(null);
    }
  };

  const handleBlur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors(validateFields(formValues));
  };

  const focusField = (field: FieldName | null) => {
    if (!field) {
      return;
    }
    const element = fieldRefs.current[field];
    if (!element) {
      return;
    }
    element.focus();
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const shouldShowFieldError = (field: FieldName) =>
    Boolean(fieldErrors[field]) && (Boolean(touched[field]) || submitAttempted);

  const getDescribedBy = (field: FieldName) =>
    [fieldHints[field] ? `${field}-hint` : "", shouldShowFieldError(field) ? `${field}-error` : ""]
      .filter(Boolean)
      .join(" ");

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
    const errors = validateFields(formValues);
    setFieldErrors(errors);
    setTouched({
      username: true,
      password: true,
      confirmPassword: true,
      age: true
    });
    setSubmitAttempted(true);

    const firstErrorField = getFirstErrorField(errors);
    if (firstErrorField) {
      setSubmitState("error");
      setMessage("请根据下方提示修改后再提交，已保留你刚才填写的内容。");
      window.requestAnimationFrame(() => focusField(firstErrorField));
      return;
    }

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
      const errorMessage = err instanceof Error ? err.message : "注册失败";
      const serverFieldErrors = mapServerErrorToFieldErrors(errorMessage);
      setSubmitState("error");
      setMessage(errorMessage);
      if (Object.keys(serverFieldErrors).length > 0) {
        const mergedErrors = {
          ...validateFields(formValues),
          ...serverFieldErrors
        };
        setFieldErrors(mergedErrors);
        setTouched((prev) => ({
          ...prev,
          ...Object.keys(serverFieldErrors).reduce<Record<string, boolean>>(
            (acc, field) => {
              acc[field] = true;
              return acc;
            },
            {}
          )
        }));
        setSubmitAttempted(true);
        window.requestAnimationFrame(() => {
          focusField(getFirstErrorField(mergedErrors));
        });
      }
    }
  };

  return (
    <main className="main register-page">
      <section className="login-hero">
        <div>
          <p className="eyebrow">邮箱注册</p>
          <h1>完善资料，创建 学了么 账号</h1>
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
              {submitAttempted && visibleFieldErrors.length > 0 ? (
                <div className="status-card error register-feedback-card" role="alert" aria-live="assertive">
                  <div className="status-title">以下信息还需要修改</div>
                  <div className="status-lines">
                    {visibleFieldErrors.map((item) => (
                      <div key={item.field}>
                        {item.label}：{item.error}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className={`form-row ${shouldShowFieldError("username") ? "has-error" : ""}`}>
                <label htmlFor="username">用户名</label>
                <input
                  id="username"
                  value={username}
                  placeholder="2-10 位字符"
                  ref={(element) => {
                    fieldRefs.current.username = element;
                  }}
                  onChange={(event) => {
                    const nextUsername = event.target.value;
                    clearSubmitErrorIfNeeded();
                    setUsername(nextUsername);
                    syncFieldErrors({
                      ...formValues,
                      username: nextUsername
                    });
                  }}
                  onBlur={() => handleBlur("username")}
                  aria-invalid={shouldShowFieldError("username")}
                  aria-describedby={getDescribedBy("username")}
                />
                <span className="field-hint" id="username-hint">
                  {fieldHints.username}
                </span>
                {shouldShowFieldError("username") && (
                  <span className="field-error" id="username-error">
                    {fieldErrors.username}
                  </span>
                )}
              </div>
              <div className={`form-row ${shouldShowFieldError("password") ? "has-error" : ""}`}>
                <label htmlFor="password">设置密码</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  placeholder="至少 8 位"
                  ref={(element) => {
                    fieldRefs.current.password = element;
                  }}
                  onChange={(event) => {
                    const nextPassword = event.target.value;
                    clearSubmitErrorIfNeeded();
                    setPassword(nextPassword);
                    syncFieldErrors({
                      ...formValues,
                      password: nextPassword
                    });
                  }}
                  onBlur={() => handleBlur("password")}
                  aria-invalid={shouldShowFieldError("password")}
                  aria-describedby={getDescribedBy("password")}
                />
                <span className="field-hint" id="password-hint">
                  {fieldHints.password}
                </span>
                {shouldShowFieldError("password") && (
                  <span className="field-error" id="password-error">
                    {fieldErrors.password}
                  </span>
                )}
              </div>
              <div className={`form-row ${shouldShowFieldError("confirmPassword") ? "has-error" : ""}`}>
                <label htmlFor="confirmPassword">确认密码</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  placeholder="再次输入密码"
                  ref={(element) => {
                    fieldRefs.current.confirmPassword = element;
                  }}
                  onChange={(event) => {
                    const nextConfirmPassword = event.target.value;
                    clearSubmitErrorIfNeeded();
                    setConfirmPassword(nextConfirmPassword);
                    syncFieldErrors({
                      ...formValues,
                      confirmPassword: nextConfirmPassword
                    });
                  }}
                  onBlur={() => handleBlur("confirmPassword")}
                  aria-invalid={shouldShowFieldError("confirmPassword")}
                  aria-describedby={getDescribedBy("confirmPassword")}
                />
                <span className="field-hint" id="confirmPassword-hint">
                  {fieldHints.confirmPassword}
                </span>
                {shouldShowFieldError("confirmPassword") && (
                  <span className="field-error" id="confirmPassword-error">
                    {fieldErrors.confirmPassword}
                  </span>
                )}
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
              <div className={`form-row ${shouldShowFieldError("age") ? "has-error" : ""}`}>
                <label htmlFor="age">年龄</label>
                <input
                  id="age"
                  type="number"
                  min={0}
                  max={120}
                  value={age}
                  placeholder="可选"
                  ref={(element) => {
                    fieldRefs.current.age = element;
                  }}
                  onChange={(event) => {
                    const nextAge = event.target.value;
                    clearSubmitErrorIfNeeded();
                    setAge(nextAge);
                    syncFieldErrors({
                      ...formValues,
                      age: nextAge
                    });
                  }}
                  onBlur={() => handleBlur("age")}
                  aria-invalid={shouldShowFieldError("age")}
                  aria-describedby={getDescribedBy("age")}
                />
                <span className="field-hint" id="age-hint">
                  {fieldHints.age}
                </span>
                {shouldShowFieldError("age") && (
                  <span className="field-error" id="age-error">
                    {fieldErrors.age}
                  </span>
                )}
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
              <h1>完善资料，创建 学了么 账号</h1>
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
