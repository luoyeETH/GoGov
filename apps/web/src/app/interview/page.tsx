"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const INTERVIEW_TYPES = [
  { value: "behavioral", label: "行为面试 (综合分析)" },
  { value: "technical", label: "专业能力 (岗位匹配)" },
  { value: "situational", label: "情景模拟 (应急应变)" },
  { value: "competency", label: "通用能力 (人际沟通)" },
  { value: "mixed", label: "全真模拟 (随机混合)" }
];

const DIFFICULTY_LEVELS = [
  { value: 1, label: "入门" },
  { value: 2, label: "初级" },
  { value: 3, label: "中级" },
  { value: 4, label: "高级" },
  { value: 5, label: "专家" }
];

const TIME_PRESETS = [
  { key: "15-3", label: "15 分钟 / 3 题", minutes: 15, questions: 3 },
  { key: "20-4", label: "20 分钟 / 4 题", minutes: 20, questions: 4 }
];

const INTRO_LOCAL_AUDIO_PATHS: Record<string, string> = {
  default: "/audio/interview-intro.wav",
  "15": "/audio/interview-intro-15.wav",
  "20": "/audio/interview-intro-20.wav"
};
const INTRO_API_AUDIO_PATHS: Record<string, string> = {
  default: "/interview/intro",
  "15": "/interview/intro?minutes=15",
  "20": "/interview/intro?minutes=20"
};
const INTRO_FALLBACK_TEXT =
  "考生你好，恭喜你通过笔试进入面试。本场结构化面试请认真听题，条理作答。面试现在开始，请听第一题。";

const PHASES = [
  { key: "setup", label: "准备" },
  { key: "interview", label: "问答" },
  { key: "feedback", label: "反馈" },
  { key: "end", label: "完成" }
] as const;

type PhaseKey = (typeof PHASES)[number]["key"];

export default function InterviewPage() {
  const [phase, setPhase] = useState<PhaseKey>("setup");
  const [type, setType] = useState("behavioral");
  const [difficulty, setDifficulty] = useState(3);
  const [timedMode, setTimedMode] = useState(false);
  const [timePresetKey, setTimePresetKey] = useState(TIME_PRESETS[0].key);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [currentTurn, setCurrentTurn] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const ttsRequestIdRef = useRef(0);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeAudioResolveRef = useRef<((completed: boolean) => void) | null>(null);
  const questionAudioCacheRef = useRef<Map<string, string>>(new Map());
  const questionAudioPendingRef = useRef<Map<string, Promise<string | null>>>(new Map());

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "zh-CN";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setAnswerText((prev) => prev + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopSpeaking();
      clearQuestionAudioCache();
    };
  }, []);

  useEffect(() => {
    if (!timerActive) {
      return;
    }
    const timerId = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          setTimerActive(false);
          setPhase("end");
          setError("时间已到，本次训练结束。");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [timerActive]);

  useEffect(() => {
    if (phase === "end" || phase === "setup") {
      setTimerActive(false);
    }
  }, [phase]);

  const getApiUrl = (path: string) => {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${path}`;
    }
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return `http://localhost:3031${path}`;
      }
      const cleanHostname = hostname.replace(/^www\./, "");
      return `https://api.${cleanHostname}${path}`;
    }
    return `http://localhost:3031${path}`;
  };

  const getToken = () => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("gogov_session_token");
    }
    return null;
  };

  const getIntroAudioCandidates = (minutes: number | null) => {
    const key = minutes ? String(minutes) : "default";
    const localPath = INTRO_LOCAL_AUDIO_PATHS[key] ?? INTRO_LOCAL_AUDIO_PATHS.default;
    const apiPath = INTRO_API_AUDIO_PATHS[key] ?? INTRO_API_AUDIO_PATHS.default;
    return [localPath, getApiUrl(apiPath)];
  };

  const clearQuestionAudioCache = () => {
    questionAudioPendingRef.current.clear();
    for (const url of questionAudioCacheRef.current.values()) {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    }
    questionAudioCacheRef.current.clear();
  };

  const prefetchQuestionAudio = (text: string) => {
    void getQuestionAudioUrl(text).catch(() => null);
  };

  const startSession = async () => {
    setLoading(true);
    setError(null);
    stopSpeaking();
    clearQuestionAudioCache();
    try {
      const token = getToken();
      if (!token) throw new Error("请先登录");

      const selectedPreset = TIME_PRESETS.find((preset) => preset.key === timePresetKey) ?? TIME_PRESETS[0];
      const timeLimitSeconds = selectedPreset.minutes * 60;
      const payload: Record<string, unknown> = { type, difficulty };
      if (timedMode) {
        payload.totalQuestions = selectedPreset.questions;
      }

      const introCandidates = getIntroAudioCandidates(
        timedMode ? selectedPreset.minutes : null
      );

      const res = await fetch(getApiUrl("/interview/start"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "启动面试失败，请检查网络");

      setSession(data.session);
      setCurrentTurn(data.turn);
      setPhase("interview");
      if (timedMode) {
        setTimeRemaining(timeLimitSeconds);
        setTimerActive(true);
      } else {
        setTimeRemaining(null);
        setTimerActive(false);
      }
      const questionText = data.turn.questionText;
      prefetchQuestionAudio(questionText);
      const questionUrl = await getQuestionAudioUrl(questionText);
      let introOk = false;
      for (const introUrl of introCandidates) {
        // Try local audio first, then backend audio.
        introOk = await playAudioUrl(introUrl);
        if (introOk) {
          break;
        }
      }
      if (!introOk) {
        introOk = await speakWithBrowser(INTRO_FALLBACK_TEXT);
      }
      if (introOk && questionUrl) {
        const questionOk = await playAudioUrl(questionUrl);
        if (!questionOk) {
          speakWithBrowser(questionText);
        }
      } else if (introOk) {
        speakWithBrowser(questionText);
      }
    } catch (err: any) {
      stopSpeaking();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("请先登录");
      const trimmedAnswer = answerText.trim();
      if (!trimmedAnswer) throw new Error("请先输入回答。");
      if (!session?.id || !currentTurn?.id) {
        throw new Error("当前面试会话无效，请重新开始。");
      }
      const res = await fetch(getApiUrl("/interview/answer"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: session.id,
          turnId: currentTurn.id,
          answerText: trimmedAnswer
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "提交回答失败，请稍后重试");

      setAnalysis(data.analysis);
      if (data.sessionComplete) {
        setPhase("end");
      } else {
        setCurrentTurn(data.nextQuestion);
        setPhase("feedback");
        if (data.nextQuestion?.questionText) {
          prefetchQuestionAudio(data.nextQuestion.questionText);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    setAnswerText("");
    setAnalysis(null);
    setPhase("interview");
    speak(currentTurn.questionText);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("您的浏览器不支持语音识别，请使用 Chrome 或 Edge。");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
        setIsRecording(false);
      }
    }
  };

  const stopAudioPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      if (audioUrlRef.current.startsWith("blob:")) {
        const cached = Array.from(questionAudioCacheRef.current.values()).includes(audioUrlRef.current);
        if (!cached) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
      }
      audioUrlRef.current = null;
    }
  };

  const stopSpeaking = () => {
    ttsAbortRef.current?.abort();
    if (activeAudioResolveRef.current) {
      activeAudioResolveRef.current(false);
      activeAudioResolveRef.current = null;
    }
    stopAudioPlayback();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    speechUtteranceRef.current = null;
    setIsSpeaking(false);
  };

  const speakWithBrowser = (text: string) =>
    new Promise<boolean>((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 1.0;
      utterance.onend = () => {
        setIsSpeaking(false);
        if (speechUtteranceRef.current === utterance) {
          speechUtteranceRef.current = null;
        }
        resolve(true);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (speechUtteranceRef.current === utterance) {
          speechUtteranceRef.current = null;
        }
        resolve(false);
      };
      speechUtteranceRef.current = utterance;
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    });

  const playAudioUrl = (url: string) =>
    new Promise<boolean>((resolve) => {
      if (activeAudioResolveRef.current) {
        activeAudioResolveRef.current(false);
      }
      activeAudioResolveRef.current = resolve;
      stopAudioPlayback();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      const audio = new Audio();
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.src = url;
      audioRef.current = audio;
      audioUrlRef.current = url;
      setIsSpeaking(true);
      audio.onended = () => {
        if (audioRef.current === audio) {
          stopAudioPlayback();
          setIsSpeaking(false);
        }
        if (activeAudioResolveRef.current === resolve) {
          activeAudioResolveRef.current = null;
        }
        resolve(true);
      };
      audio.onerror = () => {
        if (audioRef.current === audio) {
          stopAudioPlayback();
          setIsSpeaking(false);
        }
        if (activeAudioResolveRef.current === resolve) {
          activeAudioResolveRef.current = null;
        }
        resolve(false);
      };
      audio.play().catch(() => {
        if (audioRef.current === audio) {
          stopAudioPlayback();
          setIsSpeaking(false);
        }
        if (activeAudioResolveRef.current === resolve) {
          activeAudioResolveRef.current = null;
        }
        resolve(false);
      });
    });

  const getQuestionAudioUrl = async (
    text: string,
    signal?: AbortSignal
  ): Promise<string | null> => {
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }
    const cached = questionAudioCacheRef.current.get(trimmed);
    if (cached) {
      return cached;
    }
    const pending = questionAudioPendingRef.current.get(trimmed);
    if (pending) {
      return pending;
    }
    const token = getToken();
    const fetchPromise = (async () => {
      try {
        const res = await fetch(getApiUrl("/interview/tts"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            text: trimmed,
            speaker: "中文女",
            speed: 1.0
          }),
          signal
        });
        if (!res.ok) {
          return null;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        questionAudioCacheRef.current.set(trimmed, url);
        return url;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return null;
        }
        return null;
      } finally {
        questionAudioPendingRef.current.delete(trimmed);
      }
    })();
    questionAudioPendingRef.current.set(trimmed, fetchPromise);
    return fetchPromise;
  };

  const speak = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    stopSpeaking();

    const controller = new AbortController();
    ttsAbortRef.current = controller;
    const requestId = ++ttsRequestIdRef.current;

    try {
      const url = await getQuestionAudioUrl(trimmed, controller.signal);
      if (ttsRequestIdRef.current !== requestId) {
        return;
      }
      if (url) {
        const ok = await playAudioUrl(url);
        if (!ok) {
          speakWithBrowser(trimmed);
        }
        return;
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return;
      }
      stopAudioPlayback();
      setIsSpeaking(false);
    }

    speakWithBrowser(trimmed);
  };

  const resetSession = () => {
    recognitionRef.current?.stop?.();
    stopSpeaking();
    clearQuestionAudioCache();
    setPhase("setup");
    setSession(null);
    setCurrentTurn(null);
    setAnswerText("");
    setAnalysis(null);
    setError(null);
    setTimeRemaining(null);
    setTimerActive(false);
    setLoading(false);
    setIsRecording(false);
  };

  const selectedType = INTERVIEW_TYPES.find((item) => item.value === type);
  const selectedDifficulty = DIFFICULTY_LEVELS.find((item) => item.value === difficulty);
  const [typeTitle, typeDesc] = (selectedType?.label ?? "").split(" ");
  const timePreset = TIME_PRESETS.find((preset) => preset.key === timePresetKey) ?? TIME_PRESETS[0];
  const timeLimitSeconds = timePreset.minutes * 60;
  const totalQuestions = session?.totalQuestions ?? "--";
  const turnNumber = currentTurn?.turnNumber ?? "--";
  const answerLength = answerText.trim().length;
  const scoreValue = typeof analysis?.score === "number" ? analysis.score : null;
  const scoreLabel =
    scoreValue === null
      ? "等待评分"
      : scoreValue >= 80
        ? "表现优秀"
        : scoreValue >= 60
          ? "继续加强"
          : "需要提升";
  const timeDisplay = timedMode ? formatTime(timeRemaining ?? timeLimitSeconds) : "未计时";
  const timeIsLow = timedMode && (timeRemaining ?? timeLimitSeconds) <= 120;
  const canSubmitAnswer =
    !loading && answerLength > 0 && (!timedMode || timeRemaining !== 0);
  const answerStatusText =
    timedMode && timeRemaining === 0
      ? "时间已到，请重新开始训练"
      : isRecording
        ? "正在录音，语音会自动追加到文本框"
        : answerLength
          ? "可以提交本题回答"
          : "输入或语音转写后再提交";

  return (
    <main className="main interview-page">
      <section className="app-page-header interview-header">
        <div className="app-page-header-main">
          <span className="eyebrow">AI Interview Coach</span>
          <h1 className="app-page-title">让面试像对话一样自然</h1>
          <p className="app-page-subtitle">
            模拟真实面试节奏，自动语音提问与结构化反馈，帮助你在关键表达处建立优势。
          </p>
          <div className="interview-tags">
            <span>语音问答</span>
            <span>结构化评分</span>
            <span>多类型情境</span>
            <span>可重复训练</span>
          </div>
        </div>
        <div className="app-page-metrics interview-metrics">
          <div className="app-page-metric">
            <span className="app-page-metric-label">类型</span>
            <span className="app-page-metric-value">{typeTitle || "-"}</span>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">难度</span>
            <span className="app-page-metric-value">{selectedDifficulty?.label ?? "-"}</span>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">进度</span>
            <span className="app-page-metric-value">
              {turnNumber} / {totalQuestions}
            </span>
          </div>
          <div className="app-page-metric">
            <span className="app-page-metric-label">剩余时间</span>
            <span className="app-page-metric-value">{timeDisplay}</span>
          </div>
        </div>
      </section>

      <section className="interview-layout">
        <div className="interview-panel">
          <div className="interview-steps">
            {PHASES.map((item) => (
              <span
                key={item.key}
                className={`interview-step${item.key === phase ? " active" : ""}`}
              >
                {item.label}
              </span>
            ))}
          </div>

          {error && phase !== "end" && (
            <div className="status-card error">
              <span className="status-title">出现问题</span>
              <span className="status-meta">{error}</span>
              {error.includes("登录") || phase === "setup" ? (
                <div className="interview-error-actions">
                  {error.includes("登录") ? (
                    <Link href="/login" className="primary button-link">
                      去登录
                    </Link>
                  ) : (
                    <button type="button" className="ghost" onClick={startSession} disabled={loading}>
                      重新开始
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {phase === "setup" && (
            <div className="interview-section">
              <div className="interview-section">
                <div className="interview-section-header">
                  <div>
                    <h2 className="interview-section-title">选择面试类型</h2>
                    <p className="interview-section-subtitle">先明确训练方向，再进入问答。</p>
                  </div>
                  <span className="interview-badge">{typeDesc || "综合分析"}</span>
                </div>
                <div className="interview-type-grid">
                  {INTERVIEW_TYPES.map((item) => {
                    const [labelTitle, labelDesc] = item.label.split(" ");
                    const isActive = item.value === type;
                    return (
                      <button
                        key={item.value}
                        onClick={() => setType(item.value)}
                        className={`interview-type-card${isActive ? " active" : ""}`}
                      >
                        <div className="interview-type-title">{labelTitle}</div>
                        <div className="interview-type-desc">{labelDesc || "综合能力训练"}</div>
                        {isActive && <div className="interview-type-selected">已选择</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="interview-section">
                <div className="interview-section-header">
                  <div>
                    <h2 className="interview-section-title">设置难度</h2>
                    <p className="interview-section-subtitle">根据目标岗位匹配挑战强度。</p>
                  </div>
                  <span className="interview-muted">当前：{selectedDifficulty?.label ?? "-"}</span>
                </div>
                <div className="interview-difficulty">
                  {DIFFICULTY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setDifficulty(level.value)}
                      className={level.value === difficulty ? "active" : ""}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="interview-section">
                <div className="interview-section-header">
                  <div>
                    <h2 className="interview-section-title">计时模式</h2>
                    <p className="interview-section-subtitle">可选择限定时长，模拟真实面试压力。</p>
                  </div>
                  <label className="interview-toggle">
                    <input
                      type="checkbox"
                      checked={timedMode}
                      onChange={(event) => setTimedMode(event.target.checked)}
                      disabled={phase !== "setup"}
                    />
                    <span className="interview-toggle-track" />
                  </label>
                </div>
                {timedMode ? (
                  <div className="interview-timer-options">
                    {TIME_PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => setTimePresetKey(preset.key)}
                        className={preset.key === timePresetKey ? "active" : ""}
                      >
                        <span>{preset.label}</span>
                        <span className="interview-timer-meta">
                          共 {preset.questions} 题 · {preset.minutes} 分钟
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="interview-timer-note">不开启计时，将使用默认题量。</div>
                )}
              </div>

              <button onClick={startSession} disabled={loading} className="primary interview-start">
                {loading ? "正在生成题目..." : "开始模拟面试"}
              </button>
            </div>
          )}

          {phase === "interview" && currentTurn && (
            <div className="interview-section">
              <div className="interview-progress">
                <span>面试进行中</span>
                <span>
                  第 {turnNumber} / {totalQuestions} 题
                </span>
                <span className={timeIsLow ? "interview-time-alert" : ""}>
                  {timedMode ? `剩余 ${timeDisplay}` : "不限时"}
                </span>
              </div>

              <div className="interview-question">
                <div>
                  <span className="interview-question-label">面试官提问</span>
                  <p className="interview-question-text">{currentTurn.questionText}</p>
                </div>
                <button
                  type="button"
                  className="ghost interview-speak"
                  onClick={() =>
                    isSpeaking ? stopSpeaking() : speak(currentTurn.questionText)
                  }
                  aria-label={isSpeaking ? "停止播放" : "播放语音"}
                >
                  {isSpeaking ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 10v4h4l5 4V6l-5 4H4z" fill="currentColor" />
                      <path d="M16 9a4 4 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="interview-section">
                <div className="interview-section-header">
                  <h3 className="interview-section-title">你的回答</h3>
                  <span className="interview-muted">语音转写会自动追加</span>
                </div>
                <div className="interview-answer">
                  <textarea
                    value={answerText}
                    onChange={(event) => setAnswerText(event.target.value)}
                    className="interview-textarea"
                    placeholder="请在此输入回答，或点击下方麦克风进行语音输入..."
                  />
                  {isRecording && (
                    <div className="interview-recording-badge">
                      <span className="interview-recording-dot" />
                      正在录音...
                    </div>
                  )}
                </div>
                <div className="interview-answer-meta">
                  <span>{answerStatusText}</span>
                  <span>{answerLength} 字</span>
                </div>
                <div className="interview-actions">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`ghost${isRecording ? " interview-recording" : ""}`}
                  >
                    <svg className="interview-action-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M12 18v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>{isRecording ? "停止录音" : "语音输入"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={submitAnswer}
                    disabled={!canSubmitAnswer}
                    className="interview-submit"
                  >
                    {loading ? "AI 分析中..." : "提交回答"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(phase === "feedback" || phase === "end") && analysis && (
            <div className="interview-section">
              <div className="interview-score-card">
                <div>
                  <span className="interview-score-label">本题得分</span>
                  <span className="interview-score-value">{scoreValue ?? "-"}</span>
                </div>
                <span
                  className={`interview-score-badge${
                    scoreValue === null
                      ? ""
                      : scoreValue >= 80
                        ? " good"
                        : scoreValue >= 60
                          ? " mid"
                          : " low"
                  }`}
                >
                  {scoreLabel}
                </span>
              </div>

              <div className="interview-feedback-grid">
                <div className="interview-feedback-card">
                  <div className="interview-feedback-title">面试官点评</div>
                  <div className="interview-feedback-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analysis.feedback}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="interview-feedback-card highlight">
                  <div className="interview-feedback-title">参考回答</div>
                  <div className="interview-feedback-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analysis.suggestedAnswer}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {phase === "feedback" ? (
                <button type="button" onClick={nextQuestion} className="primary interview-next">
                  进入下一题
                </button>
              ) : (
                <div className="interview-complete">
                  <div className="interview-complete-title">面试已完成</div>
                  <p className="interview-complete-text">你可以再次训练，保持状态持续在线。</p>
                  <button type="button" onClick={resetSession} className="ghost interview-restart">
                    再次挑战
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === "end" && !analysis ? (
            <div className="interview-complete interview-complete-empty">
              <div className="interview-complete-title">本次训练已结束</div>
              <p className="interview-complete-text">
                {error ?? "当前没有可展示的评分结果，可以回到准备页重新开始。"}
              </p>
              <button type="button" onClick={resetSession} className="ghost interview-restart">
                返回准备
              </button>
            </div>
          ) : null}
        </div>

        <aside className="interview-aside">
          <div className="aside-card">
            <div className="aside-card-title">面试概览</div>
            <div className="interview-aside-row">
              <span>类型</span>
              <strong>{typeTitle || "-"}</strong>
            </div>
            <div className="interview-aside-row">
              <span>难度</span>
              <strong>{selectedDifficulty?.label ?? "-"}</strong>
            </div>
            <div className="interview-aside-row">
              <span>进度</span>
              <strong>
                {turnNumber} / {totalQuestions}
              </strong>
            </div>
          </div>

          <div className="aside-card soft">
            <div className="aside-card-title">表达小提示</div>
            <ul className="aside-list">
              <li>使用 STAR 结构描述经历。</li>
              <li>先给结论，再补充细节。</li>
              <li>语速放慢，表达更有层次。</li>
            </ul>
          </div>

          {scoreValue !== null && (
            <div className="aside-card interview-score-aside">
              <div className="aside-card-title">最新得分</div>
              <div className="interview-score-aside-value">{scoreValue}</div>
              <div className="interview-score-aside-label">{scoreLabel}</div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function formatTime(seconds: number | null) {
  if (seconds === null) return "--";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
