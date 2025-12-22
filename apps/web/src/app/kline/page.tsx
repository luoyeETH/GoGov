"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingButton from "../../components/loading-button";

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
const analysisKey = "gogov_kline_analysis";

const provinces = [
  "北京",
  "天津",
  "河北",
  "山西",
  "内蒙古",
  "辽宁",
  "吉林",
  "黑龙江",
  "上海",
  "江苏",
  "浙江",
  "安徽",
  "福建",
  "江西",
  "山东",
  "河南",
  "湖北",
  "湖南",
  "广东",
  "广西",
  "海南",
  "重庆",
  "四川",
  "贵州",
  "云南",
  "西藏",
  "陕西",
  "甘肃",
  "青海",
  "宁夏",
  "新疆",
  "香港",
  "澳门",
  "台湾"
];

type BaziResult = {
  year_pillar: string;
  month_pillar: string;
  day_pillar: string;
  hour_pillar: string;
  bazi: [string, string, string, string];
  dayun_start_age: number;
  dayun_direction: "顺行" | "逆行";
  dayun_sequence: string[];
  first_dayun: string;
  true_solar_time: string;
  hour_branch_name: string;
  lunar_date: string;
};

type RequestState = "idle" | "loading" | "error";
type KlineAnalysis = {
  summary?: string;
  landingYear?: string;
  landingProbability?: number;
};

type KlineHistoryRecord = {
  id: string;
  analysis: KlineAnalysis;
  raw?: string | null;
  model?: string | null;
  warning?: string | null;
  createdAt?: string | null;
  input?: {
    birthDate?: string;
    birthTime?: string;
    gender?: string;
    province?: string;
    ziHourMode?: string;
    education?: string;
    schoolTier?: string;
    prepTime?: string;
    interviewCount?: string;
  };
};

export default function KlinePage() {
  const router = useRouter();
  const [birthDate, setBirthDate] = useState("2000-01-01");
  const [birthTime, setBirthTime] = useState("08:00");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [province, setProvince] = useState("北京");
  const [ziHourMode, setZiHourMode] = useState<"late" | "early">("late");
  const [result, setResult] = useState<BaziResult | null>(null);
  const [state, setState] = useState<RequestState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<RequestState>("idle");
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [countdownPhase, setCountdownPhase] = useState<"initial" | "extend" | null>(
    null
  );
  const countdownTimerRef = useRef<number | null>(null);
  const [education, setEducation] = useState("");
  const [schoolTier, setSchoolTier] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [interviewCount, setInterviewCount] = useState("");
  const [historyItems, setHistoryItems] = useState<KlineHistoryRecord[]>([]);

  const isLocked = Boolean(result);

  const stepLabel = useMemo(() => (result ? "结果就绪" : "填写资料"), [result]);
  const countdownText = useMemo(() => {
    const minutes = Math.floor(countdownSeconds / 60);
    const seconds = countdownSeconds % 60;
    return `${`${minutes}`.padStart(2, "0")}:${`${seconds}`.padStart(2, "0")}`;
  }, [countdownSeconds]);

  useEffect(() => {
    if (analysisState !== "loading") {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setCountdownSeconds(0);
      setCountdownPhase(null);
      return;
    }
    setCountdownSeconds(120);
    setCountdownPhase("initial");
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
    }
    countdownTimerRef.current = window.setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [analysisState]);

  useEffect(() => {
    if (analysisState === "loading" && countdownSeconds === 0) {
      setCountdownSeconds(30);
      setCountdownPhase("extend");
    }
  }, [analysisState, countdownSeconds]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      return;
    }
    const loadHistory = async () => {
      try {
        const response = await fetch(`${apiBase}/kline/history?limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = (await response.json()) as {
          reports?: KlineHistoryRecord[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || "历史记录获取失败");
        }
        const items = Array.isArray(data.reports) ? data.reports : [];
        setHistoryItems(
          items.filter(
            (item) =>
              item &&
              typeof item.id === "string" &&
              item.analysis &&
              typeof item.analysis === "object"
          )
        );
      } catch {
        setHistoryItems([]);
      }
    };
    loadHistory();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setAnalysisMessage(null);
    setAnalysisState("idle");
    if (!birthDate) {
      setMessage("请填写出生日期。");
      return;
    }
    if (!birthTime) {
      setMessage("请填写出生时间。");
      return;
    }
    setState("loading");
    try {
      const response = await fetch(`${apiBase}/kline/bazi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate,
          birthTime: birthTime.trim() ? birthTime : null,
          gender,
          province,
          ziHourMode
        })
      });
      const data = (await response.json()) as BaziResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "计算失败，请稍后再试。");
      }
      setResult(data);
      setState("idle");
      setAnalysisState("idle");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "计算失败，请稍后再试。");
    }
  };

  const handleAnalyze = async () => {
    if (!result) {
      return;
    }
    setAnalysisMessage(null);
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setAnalysisMessage("请先登录后再使用 AI 测算。");
      return;
    }
    setAnalysisState("loading");
    try {
      const response = await fetch(`${apiBase}/ai/kline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bazi: result.bazi,
          dayunSequence: result.dayun_sequence,
          dayunStartAge: result.dayun_start_age,
          dayunDirection: result.dayun_direction,
          trueSolarTime: result.true_solar_time,
          lunarDate: result.lunar_date,
          birthDate,
          birthTime,
          gender,
          province,
          ziHourMode,
          education: education.trim() || null,
          schoolTier: schoolTier.trim() || null,
          prepTime: prepTime.trim() || null,
          interviewCount: interviewCount.trim() || null
        })
      });
      const data = (await response.json()) as {
        id?: string;
        createdAt?: string;
        analysis?: unknown;
        raw?: string;
        model?: string;
        warning?: string | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "测算失败，请稍后再试。");
      }
      if (!data.analysis || typeof data.analysis !== "object") {
        setAnalysisState("error");
        setAnalysisMessage("AI 返回格式异常，请稍后重试。");
        return;
      }
      const analysis = data.analysis as KlineAnalysis;
      const payload: KlineHistoryRecord = {
        id: data.id || `kline-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        analysis,
        raw: data.raw ?? null,
        model: data.model ?? null,
        warning: data.warning ?? null,
        createdAt: data.createdAt ?? new Date().toISOString(),
        input: {
          birthDate,
          birthTime,
          gender,
          province,
          ziHourMode,
          education,
          schoolTier,
          prepTime,
          interviewCount
        }
      };
      window.sessionStorage.setItem(analysisKey, JSON.stringify(payload));
      const nextHistory = [
        payload,
        ...historyItems.filter((item) => item.id !== payload.id)
      ].slice(0, 20);
      setHistoryItems(nextHistory);
      setAnalysisState("idle");
      router.push("/kline/result");
    } catch (error) {
      setAnalysisState("error");
      setAnalysisMessage(error instanceof Error ? error.message : "测算失败，请稍后再试。");
    }
  };

  const handleReset = () => {
    setResult(null);
    setMessage(null);
    setAnalysisMessage(null);
    setAnalysisState("idle");
  };

  const openHistory = (item: KlineHistoryRecord) => {
    window.sessionStorage.setItem(analysisKey, JSON.stringify(item));
    router.push("/kline/result");
  };

  return (
    <main className="main kline-page">
      {analysisState === "loading" ? (
        <div className="kline-countdown">
          <div className="kline-countdown-label">
            {countdownPhase === "extend" ? "仍在生成，继续等待" : "AI 正在生成报告"}
          </div>
          <div className="kline-countdown-time">{countdownText}</div>
          <div className="kline-countdown-note">预计等待 {countdownText}</div>
        </div>
      ) : null}
      <section className="kline-hero">
        <div className="kline-intro">
          <p className="eyebrow">UPSHORE KLINE</p>
          <h1>上岸 K 线</h1>
          <p className="lead">
            输入出生信息，先生成四柱八字与大运节奏，再补充学历与备考经历，
            为 AI 测算做准备。
          </p>
          <div className="kline-steps">
            <div className={`kline-step ${!result ? "active" : ""}`}>
              <span>1</span>
              <div>
                <strong>基础信息</strong>
                <p>生日、时间、性别、省份</p>
              </div>
            </div>
            <div className={`kline-step ${result ? "active" : ""}`}>
              <span>2</span>
              <div>
                <strong>八字结果</strong>
                <p>四柱与大运</p>
              </div>
            </div>
            <div className="kline-step muted">
              <span>3</span>
              <div>
                <strong>AI 测算</strong>
                <p>生成上岸 K 线报告</p>
              </div>
            </div>
          </div>
        </div>
        <div className={`kline-card kline-form-card ${result ? "is-compact" : ""}`}>
          <div className="kline-card-header">
            <h3>{stepLabel}</h3>
            {result ? <span>已生成</span> : <span>填写后进入下一步</span>}
          </div>
          <form className="kline-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="birth-date">出生日期</label>
              <input
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                disabled={isLocked}
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="birth-time">出生时间</label>
              <input
                id="birth-time"
                type="time"
                value={birthTime}
                onChange={(event) => setBirthTime(event.target.value)}
                disabled={isLocked}
                required
              />
            </div>
            <div className="form-row">
              <label>性别</label>
              <div className="kline-toggle">
                <button
                  type="button"
                  className={gender === "male" ? "active" : ""}
                  onClick={() => setGender("male")}
                  disabled={isLocked}
                >
                  男
                </button>
                <button
                  type="button"
                  className={gender === "female" ? "active" : ""}
                  onClick={() => setGender("female")}
                  disabled={isLocked}
                >
                  女
                </button>
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="province">出生省份</label>
              <select
                id="province"
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                disabled={isLocked}
              >
                {provinces.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="zi-hour">子时换日</label>
              <select
                id="zi-hour"
                value={ziHourMode}
                onChange={(event) =>
                  setZiHourMode(event.target.value === "early" ? "early" : "late")
                }
                disabled={isLocked}
              >
                <option value="late">23:00 换日（晚子时）</option>
                <option value="early">00:00 换日（早子时）</option>
              </select>
            </div>
            {message ? <p className="form-message">{message}</p> : null}
            <div className="kline-actions">
              {result ? (
                <button type="button" className="ghost" onClick={handleReset}>
                  重新编辑
                </button>
              ) : (
                <LoadingButton
                  type="submit"
                  className="primary"
                  loading={state === "loading"}
                  loadingText="计算中..."
                >
                  下一步
                </LoadingButton>
              )}
            </div>
          </form>
        </div>
      </section>

      {result ? (
        <section className="kline-grid">
          <div className="kline-card">
            <div className="kline-card-header">
              <h3>四柱八字</h3>
              <span>
                农历 {result.lunar_date} · 真太阳时 {result.true_solar_time}（经度校正）
              </span>
            </div>
            <div className="kline-pillars">
              <div className="kline-pillar">
                <span>年柱</span>
                <strong>{result.year_pillar}</strong>
              </div>
              <div className="kline-pillar">
                <span>月柱</span>
                <strong>{result.month_pillar}</strong>
              </div>
              <div className="kline-pillar">
                <span>日柱</span>
                <strong>{result.day_pillar}</strong>
              </div>
              <div className="kline-pillar">
                <span>时柱</span>
                <strong>{result.hour_pillar}</strong>
              </div>
            </div>
            <div className="kline-meta">
              <div>
                <span>出生省份</span>
                <strong>{province}</strong>
              </div>
              <div>
                <span>时辰地支</span>
                <strong>{result.hour_branch_name}</strong>
              </div>
              <div>
                <span>大运方向</span>
                <strong>{result.dayun_direction}</strong>
              </div>
              <div>
                <span>起运年龄</span>
                <strong>{result.dayun_start_age}</strong>
              </div>
              <div>
                <span>子时换日</span>
                <strong>{ziHourMode === "late" ? "23:00" : "00:00"}</strong>
              </div>
            </div>
          </div>

          <div className="kline-card">
            <div className="kline-card-header">
              <h3>大运序列</h3>
              <span>首运 {result.first_dayun}</span>
            </div>
            <div className="kline-dayun-list">
              {result.dayun_sequence.map((item, index) => {
                const startAge = result.dayun_start_age + index * 10;
                return (
                  <div key={`${item}-${index}`} className="kline-dayun-item">
                    <span className="age">{startAge} 岁起</span>
                    <strong className="pillar">{item}</strong>
                  </div>
                );
              })}
            </div>
            <p className="form-message">注：年龄均为虚岁。</p>
          </div>

          <div className="kline-card">
            <div className="kline-card-header">
              <h3>补充信息（可选）</h3>
              <span>用于 AI 提示词</span>
            </div>
            <div className="kline-extra-grid">
              <div className="form-row">
                <label htmlFor="education">最高学历</label>
                <input
                  id="education"
                  placeholder="如 本科 / 硕士 / 博士"
                  value={education}
                  onChange={(event) => setEducation(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="school-tier">学校层级</label>
                <input
                  id="school-tier"
                  placeholder="如 清北 / 985 / 211 "
                  value={schoolTier}
                  onChange={(event) => setSchoolTier(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="prep-time">备考时间</label>
                <input
                  id="prep-time"
                  placeholder="如 6 个月 / 2 年"
                  value={prepTime}
                  onChange={(event) => setPrepTime(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="interview-count">进面次数</label>
                <input
                  id="interview-count"
                  placeholder="如 0 / 1 / 2"
                  value={interviewCount}
                  onChange={(event) => setInterviewCount(event.target.value)}
                />
              </div>
            </div>
            <div className="kline-actions">
              <LoadingButton
                type="button"
                className="primary"
                loading={analysisState === "loading"}
                loadingText="测算中..."
                onClick={handleAnalyze}
              >
                开始测算
              </LoadingButton>
            </div>
            {analysisMessage ? (
              <p className="form-message">{analysisMessage}</p>
            ) : (
              <p className="form-message">
                点击开始测算后会跳转到 K 线结果页。
              </p>
            )}
          </div>
        </section>
      ) : null}

      {historyItems.length ? (
        <section className="kline-card kline-history">
          <div className="kline-card-header">
            <h3>历史记录</h3>
            <span>最近 {historyItems.length} 次测算</span>
          </div>
          <div className="kline-history-list">
            {historyItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="kline-history-item"
                onClick={() => openHistory(item)}
              >
                <div>
                  <strong>{item.analysis?.landingYear || "未标记"}</strong>
                  <span>
                    {typeof item.analysis?.landingProbability === "number"
                      ? `${Math.round(item.analysis.landingProbability * 100)}%`
                      : "无概率"}
                  </span>
                </div>
                <p>{item.analysis?.summary || "暂无摘要"}</p>
                <em>{item.createdAt ? item.createdAt.slice(0, 16) : ""}</em>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
