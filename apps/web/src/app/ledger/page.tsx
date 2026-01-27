"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
const PIE_COLORS = [
  "#b5522b",
  "#d37a2b",
  "#e7a04b",
  "#8c3e1f",
  "#c45f3a",
  "#f0bf7c",
  "#7a5a34"
];

type LoadState = "idle" | "loading" | "error";
type RangeType = "day" | "week" | "month" | "year";

type ExpenseParseEntry = {
  date: string;
  item: string;
  amount: number;
  formatted: string;
};

type ExpenseParseResult = {
  entries?: ExpenseParseEntry[];
  warning?: string | null;
  beijingNow?: string;
  date?: string;
  item?: string;
  amount?: number;
  formatted?: string;
};

type ExpenseBreakdown = {
  item: string;
  amount: number;
  count: number;
  percent: number;
};

type ExpenseSeries = {
  label: string;
  amount: number;
};

type ExpenseRecord = {
  id: string;
  date: string;
  item: string;
  amount: number;
  rawText?: string | null;
  createdAt: string;
};

type ExpenseOverview = {
  range: {
    type: RangeType;
    start: string;
    end: string;
    labels: string[];
  };
  totals: {
    amount: number;
    count: number;
  };
  breakdown: ExpenseBreakdown[];
  series: ExpenseSeries[];
  records: ExpenseRecord[];
};

function getBeijingDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const lookup = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${lookup("year")}-${lookup("month")}-${lookup("day")}`;
}

function getBeijingDateTimeString(date = new Date()) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
) {
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
  return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function formatSeriesLabel(label: string, range: RangeType) {
  if (range === "year") {
    return `${label.slice(5)}月`;
  }
  if (label.length >= 10) {
    return label.slice(5);
  }
  return label;
}

export default function LedgerPage() {
  const [token, setToken] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [parseState, setParseState] = useState<LoadState>("idle");
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [parseEntries, setParseEntries] = useState<ExpenseParseEntry[]>([]);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const [parseNow, setParseNow] = useState<string | null>(null);
  const [nowLabel, setNowLabel] = useState("--");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<string>(getBeijingDateString());
  const [formItem, setFormItem] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [saveState, setSaveState] = useState<LoadState>("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [overviewState, setOverviewState] = useState<LoadState>("loading");
  const [overviewMessage, setOverviewMessage] = useState<string | null>(null);
  const [overview, setOverview] = useState<ExpenseOverview | null>(null);
  const [rangeType, setRangeType] = useState<RangeType>("month");
  const [rangeDate, setRangeDate] = useState<string>(getBeijingDateString());
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editItem, setEditItem] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [recordMessage, setRecordMessage] = useState<string | null>(null);
  const [recordMessageType, setRecordMessageType] = useState<
    "success" | "error" | null
  >(null);
  const [recordState, setRecordState] = useState<LoadState>("idle");
  const recognitionRef = useRef<any>(null);
  const speechPrefixRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(sessionKey);
    setToken(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognitionCtor));
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop?.();
        recognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const update = () => setNowLabel(getBeijingDateTimeString());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadOverview = useCallback(
    async (currentToken: string | null, currentRange: RangeType, baseDate: string) => {
      if (!currentToken) {
        setOverviewMessage("请先登录后查看记账统计。");
        setOverviewState("error");
        return;
      }
      setOverviewState("loading");
      setOverviewMessage(null);
      try {
        const res = await fetch(
          `${apiBase}/expenses/overview?range=${currentRange}&date=${baseDate}`,
          { headers: { Authorization: `Bearer ${currentToken}` } }
        );
        const data = (await res.json()) as ExpenseOverview & { error?: string };
        if (!res.ok) {
          throw new Error(data?.error ?? "无法获取记账数据");
        }
        setOverview(data);
        setOverviewState("idle");
      } catch (error) {
        setOverviewMessage(error instanceof Error ? error.message : "无法获取记账数据");
        setOverviewState("error");
      }
    },
    []
  );

  useEffect(() => {
    void loadOverview(token, rangeType, rangeDate);
  }, [loadOverview, rangeDate, rangeType, token]);

  useEffect(() => {
    setEditingId(null);
    setRecordMessage(null);
    setRecordMessageType(null);
  }, [overview]);

  const handleParse = async () => {
    if (!token) {
      setParseMessage("请先登录后使用记账解析。");
      setParseState("error");
      return;
    }
    const text = inputText.trim();
    if (!text) {
      setParseMessage("请输入一段自然语言描述。");
      setParseState("error");
      return;
    }
    setParseState("loading");
    setParseMessage(null);
    try {
      const res = await fetch(`${apiBase}/expenses/parse`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });
      const data = (await res.json()) as ExpenseParseResult & { error?: string };
      if (!res.ok) {
        throw new Error(data?.error ?? "解析失败");
      }
      const entries =
        Array.isArray(data.entries) && data.entries.length
          ? data.entries
          : data.date && data.item && typeof data.amount === "number"
          ? [
              {
                date: data.date,
                item: data.item,
                amount: data.amount,
                formatted:
                  data.formatted ?? `${data.date}：${data.item}：${data.amount}`
              }
            ]
          : [];
      setParseEntries(entries);
      setParseWarning(data.warning ?? null);
      setParseNow(data.beijingNow ?? null);
      if (entries[0]) {
        setFormDate(entries[0].date);
        setFormItem(entries[0].item);
        setFormAmount(String(entries[0].amount));
      }
      setParseState("idle");
    } catch (error) {
      setParseMessage(error instanceof Error ? error.message : "解析失败");
      setParseState("error");
    }
  };

  const handleSpeechToggle = () => {
    if (!speechSupported) {
      setSpeechMessage("当前浏览器暂不支持语音输入");
      return;
    }
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSpeechMessage("当前浏览器暂不支持语音输入");
      return;
    }
    if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
      return;
    }
    setSpeechMessage(null);
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    const baseText = inputText.trim();
    speechPrefixRef.current = baseText ? `${baseText}，` : "";
    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      const nextText = `${speechPrefixRef.current}${finalText}${interim}`.trim();
      if (nextText) {
        setInputText(nextText);
      }
    };
    recognition.onstart = () => {
      setIsListening(true);
      setSpeechMessage("正在聆听，请开始说话…");
    };
    recognition.onend = () => {
      setIsListening(false);
      setSpeechMessage(null);
      recognitionRef.current = null;
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      recognitionRef.current = null;
      const error = typeof event?.error === "string" ? event.error : "识别失败";
      if (error === "not-allowed") {
        setSpeechMessage("请允许麦克风权限后再试");
      } else if (error === "no-speech") {
        setSpeechMessage("没有检测到语音，请重试");
      } else {
        setSpeechMessage(`语音识别失败：${error}`);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSaveAll = async () => {
    if (!token) {
      setSaveMessage("请先登录后保存记账。");
      setSaveState("error");
      return;
    }
    if (!parseEntries.length) {
      setSaveMessage("暂无可保存的解析记录。");
      setSaveState("error");
      return;
    }
    setSaveState("loading");
    setSaveMessage(null);
    try {
      const res = await fetch(`${apiBase}/expenses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          records: parseEntries.map((entry) => ({
            date: entry.date,
            item: entry.item,
            amount: entry.amount
          })),
          rawText: inputText.trim() || null
        })
      });
      const data = (await res.json()) as { error?: string; count?: number };
      if (!res.ok) {
        throw new Error(data?.error ?? "保存失败");
      }
      setSaveState("idle");
      setSaveMessage(`已保存 ${data?.count ?? parseEntries.length} 条记录。`);
      setInputText("");
      setParseEntries([]);
      setParseWarning(null);
      setParseNow(null);
      setFormItem("");
      setFormAmount("");
      void loadOverview(token, rangeType, rangeDate);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "保存失败");
      setSaveState("error");
    }
  };

  const handleSave = async () => {
    if (!token) {
      setSaveMessage("请先登录后保存记账。");
      setSaveState("error");
      return;
    }
    if (!formDate || !formItem || !formAmount) {
      setSaveMessage("请补充日期、项目和金额。");
      setSaveState("error");
      return;
    }
    const amountValue = Number(formAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setSaveMessage("金额需为大于 0 的数字。");
      setSaveState("error");
      return;
    }
    setSaveState("loading");
    setSaveMessage(null);
    try {
      const res = await fetch(`${apiBase}/expenses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date: formDate,
          item: formItem.trim(),
          amount: amountValue,
          rawText: inputText.trim() || null
        })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data?.error ?? "保存失败");
      }
      setSaveState("idle");
      setSaveMessage("已保存到记账本。");
      setInputText("");
      setParseEntries([]);
      setParseWarning(null);
      setParseNow(null);
      setFormItem("");
      setFormAmount("");
      void loadOverview(token, rangeType, rangeDate);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "保存失败");
      setSaveState("error");
    }
  };

  const breakdownWithColors = useMemo(() => {
    return (overview?.breakdown ?? []).map((item, index) => ({
      ...item,
      color: PIE_COLORS[index % PIE_COLORS.length]
    }));
  }, [overview]);

  const pieSegments = useMemo(() => {
    const total = breakdownWithColors.reduce((sum, item) => sum + item.amount, 0);
    if (total <= 0 || breakdownWithColors.length <= 1) {
      return [];
    }
    const center = 64;
    const radius = 58;
    let currentAngle = -Math.PI / 2;
    return breakdownWithColors.map((item) => {
      const ratio = item.amount / total;
      const angle = Math.max(0, ratio * Math.PI * 2);
      const start = currentAngle;
      const end = currentAngle + angle;
      currentAngle = end;
      return {
        ...item,
        path: describeArc(center, center, radius, start, end)
      };
    });
  }, [breakdownWithColors]);

  const rangeLabel = useMemo(() => {
    if (!overview?.range?.labels?.length) {
      return rangeDate;
    }
    const labels = overview.range.labels;
    if (rangeType === "day") {
      return labels[0];
    }
    if (rangeType === "month") {
      return rangeDate.slice(0, 7);
    }
    if (rangeType === "year") {
      return rangeDate.slice(0, 4);
    }
    return `${labels[0]} ~ ${labels[labels.length - 1]}`;
  }, [overview, rangeDate, rangeType]);

  const seriesMax = useMemo(() => {
    if (!overview?.series?.length) {
      return 0;
    }
    return overview.series.reduce((max, item) => Math.max(max, item.amount), 0);
  }, [overview]);

  const recordsPreview = useMemo(() => {
    const records = overview?.records ?? [];
    if (showAllRecords) {
      return records;
    }
    return records.slice(0, 5);
  }, [overview, showAllRecords]);

  const startEditRecord = (record: ExpenseRecord) => {
    setEditingId(record.id);
    setEditDate(record.date);
    setEditItem(record.item);
    setEditAmount(String(record.amount));
    setRecordMessage(null);
    setRecordMessageType(null);
  };

  const cancelEditRecord = () => {
    setEditingId(null);
    setRecordMessage(null);
    setRecordMessageType(null);
  };

  const saveEditRecord = async () => {
    if (!token || !editingId) {
      setRecordMessage("请先登录后再编辑记录。");
      setRecordMessageType("error");
      return;
    }
    if (!editDate || !editItem || !editAmount) {
      setRecordMessage("请补全日期、项目和金额。");
      setRecordMessageType("error");
      return;
    }
    const amountValue = Number(editAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setRecordMessage("金额需为大于 0 的数字。");
      setRecordMessageType("error");
      return;
    }
    setRecordState("loading");
    setRecordMessage(null);
    setRecordMessageType(null);
    try {
      const res = await fetch(`${apiBase}/expenses/${editingId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date: editDate,
          item: editItem.trim(),
          amount: amountValue
        })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data?.error ?? "更新失败");
      }
      setRecordState("idle");
      setRecordMessage("记录已更新。");
      setRecordMessageType("success");
      setEditingId(null);
      void loadOverview(token, rangeType, rangeDate);
    } catch (error) {
      setRecordState("error");
      setRecordMessage(error instanceof Error ? error.message : "更新失败");
      setRecordMessageType("error");
    }
  };

  const deleteRecord = async (recordId: string) => {
    if (!token) {
      setRecordMessage("请先登录后再删除记录。");
      setRecordMessageType("error");
      return;
    }
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("确定删除这条记录吗？");
      if (!confirmed) {
        return;
      }
    }
    setRecordState("loading");
    setRecordMessage(null);
    setRecordMessageType(null);
    try {
      const res = await fetch(`${apiBase}/expenses/${recordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data?.error ?? "删除失败");
      }
      setRecordState("idle");
      setRecordMessage("记录已删除。");
      setRecordMessageType("success");
      void loadOverview(token, rangeType, rangeDate);
    } catch (error) {
      setRecordState("error");
      setRecordMessage(error instanceof Error ? error.message : "删除失败");
      setRecordMessageType("error");
    }
  };

  return (
    <main className="main ledger-page">
      <section className="ledger-hero app-page-header">
        <div className="app-page-header-main">
          <p className="eyebrow">考试记账本</p>
          <h1 className="app-page-title">用自然语言快速记账</h1>
          <p className="lead app-page-subtitle">
            说清楚花费，系统自动解析日期与项目，生成统一格式并进入统计看板。
          </p>
        </div>
        <div className="ledger-summary app-page-metrics">
          <div className="app-page-metric">
            <span className="app-page-metric-label">本次统计</span>
            <strong className="app-page-metric-value">{rangeLabel}</strong>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">总支出</span>
            <strong className="app-page-metric-value">
              {overview ? `${formatAmount(overview.totals.amount)} 元` : "--"}
            </strong>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">记录数量</span>
            <strong className="app-page-metric-value">
              {overview?.totals.count ?? "--"}
            </strong>
          </div>
        </div>
      </section>

      <section className="ledger-grid">
        <div className="ledger-card ledger-input">
          <div className="ledger-card-header">
            <h3>自然语言记账</h3>
            <span>例：昨天报班花了 980</span>
          </div>
          <textarea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder="输入一句话描述花费，比如：今天报名费花了120"
          />
          <div className="ledger-input-actions">
            <button
              type="button"
              className="primary button-link"
              onClick={handleParse}
              disabled={parseState === "loading"}
            >
              {parseState === "loading" ? "解析中..." : "解析"}
            </button>
            <button
              type="button"
              className={`ghost button-link ledger-voice ${
                isListening ? "active" : ""
              }`}
              onClick={handleSpeechToggle}
            >
              {isListening ? "停止语音" : "语音输入"}
            </button>
            {parseEntries.length ? (
              <div className="ledger-parse-preview">
                <span>已解析</span>
                <strong>{parseEntries.length} 笔</strong>
              </div>
            ) : null}
          </div>
          {parseMessage ? (
            <div className="ledger-message error">{parseMessage}</div>
          ) : null}
          {parseWarning ? (
            <div className="ledger-message warning">{parseWarning}</div>
          ) : null}
          {speechMessage ? (
            <div className="ledger-message warning">{speechMessage}</div>
          ) : null}
          {parseEntries.length ? (
            <div className="ledger-parse-list">
              {parseEntries.map((entry, index) => (
                <div
                  key={`${entry.item}-${index}`}
                  className="ledger-parse-row"
                >
                  <span>{entry.date}</span>
                  <strong>{entry.item}</strong>
                  <span>{formatAmount(entry.amount)} 元</span>
                </div>
              ))}
              {parseEntries.length > 1 ? (
                <button
                  type="button"
                  className="ghost button-link ledger-save-all"
                  onClick={handleSaveAll}
                  disabled={saveState === "loading"}
                >
                  {saveState === "loading"
                    ? "保存中..."
                    : `保存全部 ${parseEntries.length} 笔`}
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="ledger-form">
            <div className="ledger-form-row">
              <label>
                <span>日期</span>
                <input
                  type="date"
                  value={formDate}
                  onChange={(event) => setFormDate(event.target.value)}
                />
              </label>
              <label>
                <span>项目</span>
                <input
                  type="text"
                  value={formItem}
                  onChange={(event) => setFormItem(event.target.value)}
                  placeholder="报名费/报班/教材"
                />
              </label>
              <label>
                <span>金额</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formAmount}
                  onChange={(event) => setFormAmount(event.target.value)}
                  placeholder="0.00"
                />
              </label>
            </div>
            <button
              type="button"
              className="ghost button-link"
              onClick={handleSave}
              disabled={saveState === "loading"}
            >
              {saveState === "loading" ? "保存中..." : "保存到记账本"}
            </button>
            {saveMessage ? (
              <div
                className={`ledger-message ${
                  saveState === "error" ? "error" : "success"
                }`}
              >
                {saveMessage}
              </div>
            ) : null}
          </div>
        </div>

        <div className="ledger-card ledger-controls">
          <div className="ledger-card-header">
            <h3>统计视角</h3>
            <span>按日/周/月/年切换</span>
          </div>
          <div className="ledger-range">
            {(["day", "week", "month", "year"] as RangeType[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`ledger-chip ${rangeType === item ? "active" : ""}`}
                onClick={() => setRangeType(item)}
              >
                {item === "day" ? "日" : item === "week" ? "周" : item === "month" ? "月" : "年"}
              </button>
            ))}
          </div>
          <label className="ledger-date">
            <span>基准日期</span>
            <input
              type="date"
              value={rangeDate}
              onChange={(event) => setRangeDate(event.target.value)}
            />
          </label>
          {overviewState === "loading" ? (
            <div className="practice-loading">正在加载记账统计...</div>
          ) : overviewMessage ? (
            <div className="practice-error">{overviewMessage}</div>
          ) : null}
          <div className="ledger-summary-panel">
            <div>
              <span>平均单笔</span>
              <strong>
                {overview?.totals.count
                  ? `${formatAmount(
                      overview.totals.amount / overview.totals.count
                    )} 元`
                  : "--"}
              </strong>
            </div>
            <div>
              <span>高频项目</span>
              <strong>{overview?.breakdown?.[0]?.item ?? "--"}</strong>
            </div>
            <div>
              <span>当前北京时间</span>
              <strong suppressHydrationWarning>
                {parseNow ?? nowLabel}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="ledger-dashboard">
        <div className="ledger-card ledger-pie-card">
          <div className="ledger-card-header">
            <h3>项目占比</h3>
            <span>支出结构饼图</span>
          </div>
          <div className="ledger-pie">
            <div className="ledger-pie-chart">
              <svg viewBox="0 0 128 128" role="img" aria-label="支出占比饼图">
                {breakdownWithColors.length === 1 ? (
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    fill={breakdownWithColors[0].color}
                  />
                ) : pieSegments.length ? (
                  pieSegments.map((item) => (
                    <path key={item.item} d={item.path} fill={item.color} />
                  ))
                ) : (
                  <circle cx="64" cy="64" r="58" fill="rgba(181, 82, 43, 0.12)" />
                )}
              </svg>
              <div className="ledger-pie-total">
                <span>合计支出</span>
                <strong>
                  {overview ? `${formatAmount(overview.totals.amount)} 元` : "--"}
                </strong>
              </div>
            </div>
            <div className="ledger-pie-legend">
              {breakdownWithColors.length ? (
                breakdownWithColors.map((item) => (
                  <div key={item.item} className="ledger-pie-item">
                    <span
                      className="ledger-pie-swatch"
                      style={{ background: item.color }}
                    />
                    <div>
                      <strong>{item.item}</strong>
                      <span>
                        {formatAmount(item.amount)} 元 · {item.percent}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="ledger-empty">暂无支出记录</div>
              )}
            </div>
          </div>
        </div>

        <div className="ledger-card ledger-series-card">
          <div className="ledger-card-header">
            <h3>趋势拆解</h3>
            <span>区间内支出变化</span>
          </div>
          <div className="ledger-series">
            {overview?.series?.length ? (
              overview.series.map((item) => (
                <div key={item.label} className="ledger-series-row">
                  <span>{formatSeriesLabel(item.label, rangeType)}</span>
                  <div className="ledger-series-bar">
                    <div
                      style={{
                        width: seriesMax
                          ? `${Math.max((item.amount / seriesMax) * 100, 4)}%`
                          : "0%"
                      }}
                    />
                  </div>
                  <span>{formatAmount(item.amount)} 元</span>
                </div>
              ))
            ) : (
              <div className="ledger-empty">暂无趋势数据</div>
            )}
          </div>
        </div>

        <div className="ledger-card ledger-records-card">
          <div className="ledger-card-header">
            <h3>记录明细</h3>
            <span>最近提交的支出列表</span>
          </div>
          <div className="ledger-records">
            {recordsPreview.length ? (
              recordsPreview.map((record) =>
                editingId === record.id ? (
                  <div key={record.id} className="ledger-record ledger-record-editing">
                    <div className="ledger-record-edit">
                      <div className="ledger-record-edit-fields">
                        <label>
                          <span>日期</span>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(event) => setEditDate(event.target.value)}
                          />
                        </label>
                        <label>
                          <span>项目</span>
                          <input
                            type="text"
                            value={editItem}
                            onChange={(event) => setEditItem(event.target.value)}
                          />
                        </label>
                        <label>
                          <span>金额</span>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={editAmount}
                            onChange={(event) => setEditAmount(event.target.value)}
                          />
                        </label>
                      </div>
                      <div className="ledger-record-actions">
                        <button
                          type="button"
                          className="primary button-link"
                          onClick={saveEditRecord}
                          disabled={recordState === "loading"}
                        >
                          {recordState === "loading" ? "保存中..." : "保存"}
                        </button>
                        <button
                          type="button"
                          className="ghost button-link"
                          onClick={cancelEditRecord}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={record.id} className="ledger-record">
                    <div className="ledger-record-main">
                      <strong>{record.item}</strong>
                      <span>{record.date}</span>
                    </div>
                    <div className="ledger-record-meta">
                      <span>{record.rawText ?? "手动记录"}</span>
                      <strong>{formatAmount(record.amount)} 元</strong>
                    </div>
                    <div className="ledger-record-actions">
                      <button
                        type="button"
                        className="ghost button-link"
                        onClick={() => startEditRecord(record)}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        className="ghost danger button-link"
                        onClick={() => deleteRecord(record.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="ledger-empty">暂无记账记录</div>
            )}
            {recordMessage ? (
              <div
                className={`ledger-message ${
                  recordMessageType === "error" ? "error" : "success"
                }`}
              >
                {recordMessage}
              </div>
            ) : null}
            {overview?.records?.length && overview.records.length > 5 ? (
              <button
                type="button"
                className="ghost button-link"
                onClick={() => setShowAllRecords((prev) => !prev)}
              >
                {showAllRecords ? "收起" : "展开更多"}
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
