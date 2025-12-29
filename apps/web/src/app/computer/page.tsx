"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
const prefKey = "user_preferences";

type RequestState = "idle" | "loading" | "error";

type ExamOverviewItem = {
  label: string;
  value: string;
};

type ScoreItem = {
  label: string;
  value: string;
  note: string;
};

type LearningBlock = {
  id: string;
  title: string;
  score: string;
  focus: string;
  topics: string[];
};

type ResourceLink = {
  title: string;
  url: string;
  note?: string;
};

type ContentSection = {
  title: string;
  points: string[];
};

type Topic = {
  id: string;
  label: string;
  summary: string;
  keyPoints: string[];
  examFocus: string[];
  contentSections: ContentSection[];
  resources: ResourceLink[];
  questions: string[];
};

type OverviewResponse = {
  examOverview: ExamOverviewItem[];
  scoreDistribution: ScoreItem[];
  focusTips: string[];
  learningBlocks: LearningBlock[];
};

type PracticeQuestionType = "single" | "multi" | "judge" | "blank" | "short";

type PracticeQuestion = {
  id: string;
  topicId: string;
  type: PracticeQuestionType;
  stem: string;
  options?: string[];
};

type PracticeResult = {
  correct: boolean | null;
  answer: string;
  analysis: string;
  type: PracticeQuestionType;
};

type CTask = {
  id: string;
  title: string;
  description: string;
  template: string;
  blanks: Array<{
    id: string;
    label: string;
    placeholder: string;
  }>;
};

type SqlDataset = {
  table: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
};

type SqlTask = {
  id: string;
  title: string;
  description: string;
  dataset: SqlDataset;
  hint: string;
  sampleQuery: string;
};

type CBlankDetail = {
  id: string;
  label: string;
  correct: boolean;
  expected?: string;
};

type CTaskState = {
  answers: Record<string, string>;
  status: "idle" | "correct" | "incorrect" | "error";
  message: string | null;
  details?: CBlankDetail[];
};

type SqlJudgeState = {
  query: string;
  status: "idle" | "correct" | "incorrect" | "error";
  message: string | null;
  preview: SqlResult | null;
};

type SqlResult = {
  columns: string[];
  rows: Array<Array<string | number>>;
};

const EXAM_CONTEXT =
  "2025 安徽公务员计算机专业科目，120 分钟 100 分，题型含客观题与主观题，重点覆盖计算机基础、软件应用、网络、数据库、C 语言与数据结构、软件工程。";

const QUESTION_TYPES: Array<{ value: PracticeQuestionType; label: string }> = [
  { value: "single", label: "单选题" },
  { value: "multi", label: "多选题" },
  { value: "judge", label: "判断题" },
  { value: "blank", label: "填空题" },
  { value: "short", label: "简答题" }
];

function formatValue(value: string | number) {
  if (typeof value === "number") {
    return value.toString();
  }
  return value;
}

export default function ComputerModulePage() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadState, setLoadState] = useState<RequestState>("idle");
  const [loadMessage, setLoadMessage] = useState<string | null>(null);

  const [activeTopicId, setActiveTopicId] = useState("");
  const [aiTopicId, setAiTopicId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const [practiceTopicId, setPracticeTopicId] = useState("");
  const [practiceType, setPracticeType] = useState<PracticeQuestionType>("single");
  const [practiceQuestion, setPracticeQuestion] = useState<PracticeQuestion | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState<string | string[]>("");
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);
  const [practiceState, setPracticeState] = useState<RequestState>("idle");
  const [practiceMessage, setPracticeMessage] = useState<string | null>(null);
  const [showExamIntro, setShowExamIntro] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }
    try {
      const prefsString = window.localStorage.getItem(prefKey);
      if (prefsString) {
        const prefs = JSON.parse(prefsString);
        if (typeof prefs.computerExamIntroExpanded === "boolean") {
          return prefs.computerExamIntroExpanded;
        }
      }
    } catch {
      // Ignore preference parsing errors.
    }
    return true;
  });

  const [cTasks, setCTasks] = useState<CTask[]>([]);
  const [sqlTasks, setSqlTasks] = useState<SqlTask[]>([]);
  const [cStates, setCStates] = useState<Record<string, CTaskState>>({});
  const [sqlStates, setSqlStates] = useState<Record<string, SqlJudgeState>>({});
  const [currentCTaskId, setCurrentCTaskId] = useState("");
  const [currentSqlTaskId, setCurrentSqlTaskId] = useState("");

  const topicMap = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics]
  );

  const activeTopic = useMemo(
    () => topicMap.get(activeTopicId) ?? null,
    [topicMap, activeTopicId]
  );

  const aiTopic = useMemo(
    () => topicMap.get(aiTopicId) ?? null,
    [topicMap, aiTopicId]
  );

  const currentCTask = useMemo(
    () => cTasks.find((task) => task.id === currentCTaskId) ?? null,
    [cTasks, currentCTaskId]
  );

  const currentSqlTask = useMemo(
    () => sqlTasks.find((task) => task.id === currentSqlTaskId) ?? null,
    [sqlTasks, currentSqlTaskId]
  );

  useEffect(() => {
    const loadAll = async () => {
      setLoadState("loading");
      setLoadMessage(null);
      try {
        const [overviewRes, topicsRes, cRes, sqlRes] = await Promise.all([
          fetch(`${apiBase}/practice/computer/overview`),
          fetch(`${apiBase}/practice/computer/topics`),
          fetch(`${apiBase}/practice/computer/c/tasks`),
          fetch(`${apiBase}/practice/computer/sql/tasks`)
        ]);
        const overviewData = (await overviewRes.json()) as OverviewResponse;
        const topicsData = (await topicsRes.json()) as { topics?: Topic[] };
        const cData = (await cRes.json()) as { tasks?: CTask[] };
        const sqlData = (await sqlRes.json()) as { tasks?: SqlTask[] };
        if (!overviewRes.ok) {
          throw new Error((overviewData as { error?: string })?.error ?? "加载失败");
        }
        if (!topicsRes.ok) {
          throw new Error((topicsData as { error?: string })?.error ?? "加载失败");
        }
        setOverview(overviewData);
        setTopics(Array.isArray(topicsData.topics) ? topicsData.topics : []);
        setCTasks(Array.isArray(cData.tasks) ? cData.tasks : []);
        setSqlTasks(Array.isArray(sqlData.tasks) ? sqlData.tasks : []);
        setLoadState("idle");
      } catch (error) {
        setLoadState("error");
        setLoadMessage(error instanceof Error ? error.message : "加载失败");
      }
    };

    void loadAll();
  }, []);

  useEffect(() => {
    if (!activeTopicId && topics.length) {
      setActiveTopicId(topics[0].id);
    }
    if (!aiTopicId && topics.length) {
      setAiTopicId(topics[0].id);
    }
    if (!practiceTopicId && topics.length) {
      setPracticeTopicId(topics[0].id);
    }
  }, [activeTopicId, aiTopicId, practiceTopicId, topics]);

  useEffect(() => {
    if (!cTasks.length) {
      return;
    }
    setCStates((prev) => {
      const next = { ...prev };
      for (const task of cTasks) {
        if (!next[task.id]) {
          const answers = Object.fromEntries(
            task.blanks.map((blank) => [blank.id, ""])
          );
          next[task.id] = { answers, status: "idle", message: null };
          continue;
        }
        const existing = next[task.id];
        const mergedAnswers = { ...existing.answers };
        for (const blank of task.blanks) {
          if (!(blank.id in mergedAnswers)) {
            mergedAnswers[blank.id] = "";
          }
        }
        next[task.id] = { ...existing, answers: mergedAnswers };
      }
      return next;
    });
  }, [cTasks]);

  useEffect(() => {
    if (!cTasks.length) {
      return;
    }
    const exists = cTasks.some((task) => task.id === currentCTaskId);
    if (!currentCTaskId || !exists) {
      const index = Math.floor(Math.random() * cTasks.length);
      setCurrentCTaskId(cTasks[index]?.id ?? "");
    }
  }, [cTasks, currentCTaskId]);

  useEffect(() => {
    if (!sqlTasks.length) {
      return;
    }
    const exists = sqlTasks.some((task) => task.id === currentSqlTaskId);
    if (!currentSqlTaskId || !exists) {
      const index = Math.floor(Math.random() * sqlTasks.length);
      setCurrentSqlTaskId(sqlTasks[index]?.id ?? "");
    }
  }, [sqlTasks, currentSqlTaskId]);

  useEffect(() => {
    try {
      const current = window.localStorage.getItem(prefKey);
      const prefs = current ? JSON.parse(current) : {};
      prefs.computerExamIntroExpanded = showExamIntro;
      window.localStorage.setItem(prefKey, JSON.stringify(prefs));
    } catch {
      // Ignore preference persistence errors.
    }
  }, [showExamIntro]);

  const pickNextTaskId = <T extends { id: string }>(
    tasks: T[],
    currentId: string
  ) => {
    if (!tasks.length) {
      return "";
    }
    if (tasks.length === 1) {
      return tasks[0].id;
    }
    let nextId = currentId;
    while (nextId === currentId) {
      nextId = tasks[Math.floor(Math.random() * tasks.length)].id;
    }
    return nextId;
  };

  useEffect(() => {
    if (!sqlTasks.length) {
      return;
    }
    setSqlStates((prev) => {
      const next = { ...prev };
      for (const task of sqlTasks) {
        if (!next[task.id]) {
          next[task.id] = {
            query: "",
            status: "idle",
            message: null,
            preview: null
          };
        }
      }
      return next;
    });
  }, [sqlTasks]);

  const buildAiPrompt = () => {
    const system = [
      "你是安徽公务员计算机专业科目辅导老师。",
      "回答结构：定义/概念 → 核心要点 → 常见考法/易错点 → 简短例子或步骤 → 练习建议。",
      "如涉及 C/SQL 实操，请给出简洁伪代码或示例。",
      "请用条目化中文回答，避免空话。"
    ].join("\n");

    const user = [
      `考试背景：${EXAM_CONTEXT}`,
      aiTopic ? `选中知识点：${aiTopic.label}` : "选中知识点：未指定",
      aiTopic?.summary ? `知识点概述：${aiTopic.summary}` : "",
      aiTopic?.keyPoints?.length
        ? `关键要点：${aiTopic.keyPoints.join("；")}`
        : "",
      question.trim()
        ? `用户问题：${question.trim()}`
        : "用户问题：请基于所选知识点给出学习讲解。"
    ]
      .filter(Boolean)
      .join("\n\n");
    return { system, user };
  };

  const handleAsk = async () => {
    if (requestState === "loading") {
      return;
    }
    if (!aiTopic && !question.trim()) {
      setRequestState("error");
      setRequestMessage("请选择知识点或输入问题。");
      return;
    }
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setRequestState("error");
      setRequestMessage("请先登录并配置 AI 模型。");
      return;
    }
    setRequestState("loading");
    setRequestMessage(null);
    setAnswer(null);
    try {
      const prompt = buildAiPrompt();
      const res = await fetch(`${apiBase}/ai/assist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          scenarioId: "computer-module",
          system: prompt.system,
          user: prompt.user,
          question: question.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "生成失败");
      }
      setAnswer(data.answer ?? "");
      setRequestState("idle");
    } catch (error) {
      setRequestState("error");
      setRequestMessage(error instanceof Error ? error.message : "生成失败");
    }
  };

  const handleQuickQuestion = (text: string) => {
    if (activeTopic) {
      setAiTopicId(activeTopic.id);
    }
    setQuestion(text);
    setRequestMessage(null);
    setRequestState("idle");
    const anchor = document.getElementById("computer-ai");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const loadPracticeQuestion = async () => {
    if (practiceState === "loading") {
      return;
    }
    setPracticeState("loading");
    setPracticeMessage(null);
    setPracticeResult(null);
    try {
      const params = new URLSearchParams();
      if (practiceTopicId) {
        params.set("topicId", practiceTopicId);
      }
      if (practiceType) {
        params.set("type", practiceType);
      }
      const res = await fetch(`${apiBase}/practice/computer/next?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "获取题目失败");
      }
      const nextQuestion = data.question as PracticeQuestion;
      setPracticeQuestion(nextQuestion);
      setPracticeAnswer(nextQuestion.type === "multi" ? [] : "");
      setPracticeState("idle");
    } catch (error) {
      setPracticeState("error");
      setPracticeMessage(error instanceof Error ? error.message : "获取题目失败");
    }
  };

  const handlePracticeSubmit = async () => {
    if (!practiceQuestion) {
      setPracticeMessage("请先获取题目。");
      setPracticeState("error");
      return;
    }
    if (practiceQuestion.type === "multi") {
      if (!Array.isArray(practiceAnswer) || practiceAnswer.length === 0) {
        setPracticeMessage("请至少选择一个选项。");
        setPracticeState("error");
        return;
      }
    } else if (!String(practiceAnswer).trim()) {
      setPracticeMessage("请先填写答案。");
      setPracticeState("error");
      return;
    }
    setPracticeState("loading");
    setPracticeMessage(null);
    try {
      const token = window.localStorage.getItem(sessionKey);
      const res = await fetch(`${apiBase}/practice/computer/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          questionId: practiceQuestion.id,
          userAnswer: practiceAnswer
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "提交失败");
      }
      setPracticeResult(data as PracticeResult);
      setPracticeState("idle");
    } catch (error) {
      setPracticeState("error");
      setPracticeMessage(error instanceof Error ? error.message : "提交失败");
    }
  };

  const handleCSubmit = async (task: CTask) => {
    const state = cStates[task.id];
    if (!state) {
      return;
    }
    const hasEmpty = task.blanks.some(
      (blank) => !state.answers?.[blank.id]?.trim()
    );
    if (hasEmpty) {
      setCStates((prev) => ({
        ...prev,
        [task.id]: {
          ...prev[task.id],
          status: "error",
          message: "请先完成所有填空。"
        }
      }));
      return;
    }
    try {
      const token = window.localStorage.getItem(sessionKey);
      const res = await fetch(`${apiBase}/practice/computer/c/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          taskId: task.id,
          answers: state.answers
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "判题失败");
      }
      setCStates((prev) => ({
        ...prev,
        [task.id]: {
          ...prev[task.id],
          status: data.correct ? "correct" : "incorrect",
          message: data.message ?? null,
          details: Array.isArray(data.details) ? data.details : undefined
        }
      }));
    } catch (error) {
      setCStates((prev) => ({
        ...prev,
        [task.id]: {
          ...prev[task.id],
          status: "error",
          message: error instanceof Error ? error.message : "判题失败"
        }
      }));
    }
  };

  const handleSqlSubmit = async (task: SqlTask) => {
    const state = sqlStates[task.id];
    if (!state) {
      return;
    }
    try {
      const token = window.localStorage.getItem(sessionKey);
      const res = await fetch(`${apiBase}/practice/computer/sql/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          taskId: task.id,
          query: state.query
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "判题失败");
      }
      setSqlStates((prev) => ({
        ...prev,
        [task.id]: {
          ...prev[task.id],
          status: data.correct ? "correct" : "incorrect",
          message: data.message ?? null,
          preview: data.preview ?? null
        }
      }));
    } catch (error) {
      setSqlStates((prev) => ({
        ...prev,
        [task.id]: {
          ...prev[task.id],
          status: "error",
          message: error instanceof Error ? error.message : "判题失败",
          preview: null
        }
      }));
    }
  };

  const handleNextCTask = () => {
    setCurrentCTaskId((prev) => pickNextTaskId(cTasks, prev));
  };

  const handleNextSqlTask = () => {
    setCurrentSqlTaskId((prev) => pickNextTaskId(sqlTasks, prev));
  };

  const renderOptions = (questionData: PracticeQuestion) => {
    if (!questionData.options?.length) {
      return null;
    }
    if (questionData.type === "multi") {
      const selected = Array.isArray(practiceAnswer) ? practiceAnswer : [];
      return (
        <div className="practice-options">
          {questionData.options.map((option, index) => (
            <label key={option} className="practice-option">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => {
                  setPracticeAnswer((prev) => {
                    const current = Array.isArray(prev) ? prev : [];
                    if (current.includes(option)) {
                      return current.filter((item) => item !== option);
                    }
                    return [...current, option];
                  });
                  setPracticeMessage(null);
                  setPracticeState("idle");
                }}
              />
              <span>{`${String.fromCharCode(65 + index)}. ${option}`}</span>
            </label>
          ))}
        </div>
      );
    }
    return (
      <div className="practice-options">
        {questionData.options.map((option, index) => (
          <label key={option} className="practice-option">
            <input
              type="radio"
              name={`question-${questionData.id}`}
              checked={practiceAnswer === option}
              onChange={() => {
                setPracticeAnswer(option);
                setPracticeMessage(null);
                setPracticeState("idle");
              }}
            />
            <span>{`${String.fromCharCode(65 + index)}. ${option}`}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <main className="main computer-page">
      <section className="computer-hero">
        <div>
          <p className="eyebrow">计算机专项</p>
          <h1>系统化拆解计算机专业科目</h1>
          <p className="lead">
            覆盖 2025 安徽公务员计算机专业科目核心考点，将知识点拆分为
            可学习、可提问、可验证的板块，支持随时调用 AI 帮你梳理概念。
          </p>
          <div className="exam-toggle">
            <button
              type="button"
              className="ghost"
              onClick={() => setShowExamIntro((prev) => !prev)}
            >
              {showExamIntro ? "收起考试介绍" : "展开考试介绍"}
            </button>
          </div>
          {showExamIntro ? (
            <div className="exam-chips">
              {overview?.examOverview?.slice(0, 3).map((item) => (
                <div key={item.label} className="exam-chip">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {showExamIntro ? (
          <div className="computer-hero-card">
            <div className="hero-card-title">考试信息速览</div>
            <div className="hero-card-list">
              {overview?.examOverview?.map((item) => (
                <div key={item.label} className="hero-card-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              )) ?? null}
            </div>
            {loadMessage ? <p className="form-message">{loadMessage}</p> : null}
          </div>
        ) : null}
      </section>

      {showExamIntro ? (
        <section className="computer-grid">
          <div className="computer-card">
            <div className="computer-card-header">
              <h3>分值参考分布</h3>
              <span className="form-message">用于安排复习时间配比</span>
            </div>
            <div className="score-list">
              {overview?.scoreDistribution?.map((item) => (
                <div key={item.label} className="score-item">
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.note}</span>
                  </div>
                  <span className="score-pill">{item.value}</span>
                </div>
              )) ?? null}
            </div>
          </div>

          <div className="computer-card">
            <div className="computer-card-header">
              <h3>备考重点提示</h3>
              <span className="form-message">复习优先级建议</span>
            </div>
            <div className="focus-list">
              {overview?.focusTips?.map((tip) => (
                <div key={tip} className="focus-item">
                  {tip}
                </div>
              )) ?? null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="computer-grid">
        <div className="computer-card computer-board">
          <div className="computer-card-header">
            <h3>学习板块</h3>
            <span className="form-message">按考试权重拆分的知识模块</span>
          </div>
          <div className="board-grid">
            {overview?.learningBlocks?.map((block) => (
              <div key={block.id} className="board-column">
                <div className="board-column-title">
                  <strong>{block.title}</strong>
                  <span>{block.score}</span>
                </div>
                <p>{block.focus}</p>
                <div className="board-topic-list">
                  {block.topics.map((topicId) => {
                    const topicItem = topicMap.get(topicId);
                    if (!topicItem) {
                      return null;
                    }
                    return (
                      <button
                        key={topicItem.id}
                        type="button"
                        className={`board-topic${
                          activeTopicId === topicItem.id ? " active" : ""
                        }`}
                        onClick={() => setActiveTopicId(topicItem.id)}
                      >
                        {topicItem.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )) ?? null}
          </div>
          {loadState === "loading" ? (
            <p className="form-message">知识点加载中...</p>
          ) : null}
        </div>

        <div className="computer-card">
          <div className="computer-card-header">
            <h3>知识点详情</h3>
            <span className="form-message">点击左侧知识点查看</span>
          </div>
          {activeTopic ? (
            <div className="topic-detail">
              <div className="topic-detail-header">
                <div>
                  <strong>{activeTopic.label}</strong>
                  <p>{activeTopic.summary}</p>
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setAiTopicId(activeTopic.id);
                    if (requestMessage) {
                      setRequestMessage(null);
                      setRequestState("idle");
                    }
                  }}
                >
                  设为 AI 提问
                </button>
              </div>
              <div className="topic-section">
                <h4>核心要点</h4>
                <ul>
                  {activeTopic.keyPoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="topic-section">
                <h4>常考方向</h4>
                <ul>
                  {activeTopic.examFocus.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              {activeTopic.contentSections.map((section) => (
                <div key={section.title} className="topic-section">
                  <h4>{section.title}</h4>
                  <ul>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="topic-section">
                <h4>延伸资料</h4>
                <div className="resource-list">
                  {activeTopic.resources.map((resource) => (
                    <a
                      key={resource.url}
                      className="resource-item"
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>{resource.title}</span>
                      {resource.note ? <em>{resource.note}</em> : null}
                    </a>
                  ))}
                </div>
              </div>
              <div className="topic-section">
                <h4>常见提问</h4>
                <div className="topic-questions">
                  {activeTopic.questions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="ghost"
                      onClick={() => handleQuickQuestion(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="knowledge-empty">请选择一个知识点。</div>
          )}
        </div>
      </section>

      <section id="computer-ai" className="computer-grid">
        <div className="computer-card">
          <div className="computer-card-header">
            <h3>AI 提问</h3>
            <span className="form-message">
              选择知识点或自由提问，随时获取解释与备考建议。
            </span>
          </div>
          <div className="topic-list">
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className={`topic-chip${aiTopicId === topic.id ? " active" : ""}`}
                onClick={() => {
                  setAiTopicId(topic.id);
                  if (requestMessage) {
                    setRequestMessage(null);
                    setRequestState("idle");
                  }
                }}
              >
                {topic.label}
              </button>
            ))}
          </div>
          <div className="form-row">
            <label htmlFor="computer-question">补充问题</label>
            <textarea
              id="computer-question"
              rows={4}
              placeholder="例如：TCP/IP 模型和 OSI 模型如何一一对应？"
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                if (requestMessage) {
                  setRequestMessage(null);
                  setRequestState("idle");
                }
              }}
            />
          </div>
          <div className="assist-actions">
            <LoadingButton
              type="button"
              className="primary"
              loading={requestState === "loading"}
              loadingText="生成中..."
              onClick={handleAsk}
            >
              发送提问
            </LoadingButton>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setQuestion("");
                setAnswer(null);
                setRequestMessage(null);
                setRequestState("idle");
              }}
            >
              清空
            </button>
          </div>
          {requestMessage ? <p className="form-message">{requestMessage}</p> : null}
          {requestState === "loading" ? (
            <p className="form-message">AI 正在生成内容...</p>
          ) : null}
        </div>

        <div className="computer-card">
          <div className="computer-card-header">
            <h3>AI 学习卡片</h3>
            <span className="form-message">根据所选知识点生成</span>
          </div>
          {answer ? (
            <div className="assist-output">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
            </div>
          ) : (
            <div className="knowledge-empty">提问后显示 AI 解答。</div>
          )}
        </div>
      </section>

      <section className="computer-grid">
        <div className="computer-card">
          <div className="computer-card-header">
            <h3>题库练习</h3>
            <span className="form-message">后端题库随机抽题，可直接判定答案。</span>
          </div>
          <div className="practice-toolbar">
            <div className="form-row">
              <label htmlFor="practice-topic">选择知识点</label>
              <select
                id="practice-topic"
                value={practiceTopicId}
                onChange={(event) => {
                  setPracticeTopicId(event.target.value);
                  setPracticeMessage(null);
                  setPracticeState("idle");
                }}
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="practice-type">题型</label>
              <select
                id="practice-type"
                value={practiceType}
                onChange={(event) => {
                  setPracticeType(event.target.value as PracticeQuestionType);
                  setPracticeMessage(null);
                  setPracticeState("idle");
                }}
              >
                {QUESTION_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="primary" onClick={loadPracticeQuestion}>
              抽题
            </button>
          </div>

          {practiceQuestion ? (
            <div className="practice-question">
              <div className="practice-question-header">
                <strong>{practiceQuestion.stem}</strong>
                <span className="practice-question-tag">
                  {QUESTION_TYPES.find((item) => item.value === practiceQuestion.type)?.label}
                </span>
              </div>
              {renderOptions(practiceQuestion)}

              {practiceQuestion.type === "judge" ? (
                <div className="practice-options">
                  {["正确", "错误"].map((item) => (
                    <label key={item} className="practice-option">
                      <input
                        type="radio"
                        name={`judge-${practiceQuestion.id}`}
                        checked={practiceAnswer === item}
                        onChange={() => {
                          setPracticeAnswer(item);
                          setPracticeMessage(null);
                          setPracticeState("idle");
                        }}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              ) : null}

              {practiceQuestion.type === "blank" ? (
                <div className="practice-input">
                  <input
                    type="text"
                    placeholder="填写答案"
                    value={String(practiceAnswer)}
                    onChange={(event) => {
                      setPracticeAnswer(event.target.value);
                      setPracticeMessage(null);
                      setPracticeState("idle");
                    }}
                  />
                </div>
              ) : null}

              {practiceQuestion.type === "short" ? (
                <div className="practice-input">
                  <textarea
                    rows={4}
                    placeholder="输入简答要点"
                    value={String(practiceAnswer)}
                    onChange={(event) => {
                      setPracticeAnswer(event.target.value);
                      setPracticeMessage(null);
                      setPracticeState("idle");
                    }}
                  />
                </div>
              ) : null}

              <div className="practice-actions">
                <button type="button" className="primary" onClick={handlePracticeSubmit}>
                  提交答案
                </button>
                <button type="button" className="ghost" onClick={loadPracticeQuestion}>
                  换一题
                </button>
              </div>
              {practiceMessage ? (
                <p className="form-message">{practiceMessage}</p>
              ) : null}
              {practiceState === "loading" ? (
                <p className="form-message">判题中...</p>
              ) : null}
              {practiceResult ? (
                <div
                  className={`practice-result ${
                    practiceResult.correct === true
                      ? "correct"
                      : practiceResult.correct === false
                      ? "incorrect"
                      : "neutral"
                  }`}
                >
                  <strong>
                    {practiceResult.correct === null
                      ? "参考答案"
                      : practiceResult.correct
                      ? "回答正确"
                      : "回答有误"}
                  </strong>
                  <p>参考答案：{practiceResult.answer}</p>
                  <p>解析：{practiceResult.analysis}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="knowledge-empty">选择题型后点击“抽题”。</div>
          )}
        </div>
      </section>

      <section className="computer-grid">
        <div className="computer-card">
          <div className="computer-card-header">
            <div className="computer-card-title">
              <h3>实操验证 · C 语言</h3>
              <span className="form-message">
                补全代码框架中的 2-3 处关键逻辑。
              </span>
            </div>
            <button type="button" className="ghost" onClick={handleNextCTask}>
              换一题
            </button>
          </div>
          <div className="practice-grid">
            {currentCTask ? (
              <div key={currentCTask.id} className="practice-card">
                <div className="practice-title">
                  <strong>{currentCTask.title}</strong>
                  <span>填空题</span>
                </div>
                <p>{currentCTask.description}</p>
                <pre className="code-template">
                  <code>
                    {currentCTask.template.replace(/{{(\d+)}}/g, "【空$1】")}
                  </code>
                </pre>
                <div className="code-blank-list">
                  {currentCTask.blanks.map((blank) => {
                    const state = cStates[currentCTask.id];
                    return (
                      <div key={blank.id} className="code-blank-row">
                        <label htmlFor={`${currentCTask.id}-${blank.id}`}>
                          空{blank.id} · {blank.label}
                        </label>
                        <input
                          id={`${currentCTask.id}-${blank.id}`}
                          type="text"
                          placeholder={blank.placeholder}
                          value={state?.answers?.[blank.id] ?? ""}
                          onChange={(event) =>
                            setCStates((prev) => ({
                              ...prev,
                              [currentCTask.id]: {
                                ...prev[currentCTask.id],
                                status: "idle",
                                message: null,
                                details: undefined,
                                answers: {
                                  ...prev[currentCTask.id]?.answers,
                                  [blank.id]: event.target.value
                                }
                              }
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="practice-actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={() => handleCSubmit(currentCTask)}
                  >
                    判题
                  </button>
                  <span
                    className={`judge-status ${
                      cStates[currentCTask.id]?.status ?? "idle"
                    }`}
                  >
                    {cStates[currentCTask.id]?.status === "correct"
                      ? "正确"
                      : cStates[currentCTask.id]?.status === "incorrect"
                      ? "未通过"
                      : cStates[currentCTask.id]?.status === "error"
                      ? "错误"
                      : ""}
                  </span>
                </div>
                {cStates[currentCTask.id]?.message ? (
                  <p className="form-message">
                    {cStates[currentCTask.id]?.message}
                  </p>
                ) : null}
                {cStates[currentCTask.id]?.details?.length ? (
                  <div className="blank-feedback">
                    {cStates[currentCTask.id]?.details?.map((detail) => (
                      <div
                        key={`${currentCTask.id}-detail-${detail.id}`}
                        className={`blank-feedback-item${
                          detail.correct ? " correct" : " incorrect"
                        }`}
                      >
                        <span>
                          空{detail.id}：{detail.correct ? "正确" : "错误"}
                        </span>
                        {!detail.correct && detail.expected ? (
                          <em>参考：{detail.expected}</em>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="knowledge-empty">暂无 C 语言练习题。</div>
            )}
          </div>
        </div>

        <div className="computer-card">
          <div className="computer-card-header">
            <div className="computer-card-title">
              <h3>实操验证 · 数据库 SQL</h3>
              <span className="form-message">
                输入 SQL，实时验证查询结果。
              </span>
            </div>
            <button type="button" className="ghost" onClick={handleNextSqlTask}>
              换一题
            </button>
          </div>
          <div className="practice-grid">
            {currentSqlTask ? (
              <div key={currentSqlTask.id} className="practice-card">
                <div className="practice-title">
                  <strong>{currentSqlTask.title}</strong>
                  <span>单表查询</span>
                </div>
                <p>{currentSqlTask.description}</p>
                <div className="practice-meta">
                  <div>
                    <strong>数据表</strong>
                    <span>{currentSqlTask.dataset.table}</span>
                  </div>
                  <div>
                    <strong>提示</strong>
                    <span>{currentSqlTask.hint}</span>
                  </div>
                </div>
                <div className="mini-table">
                  <div className="mini-table-title">数据预览</div>
                  <table>
                    <thead>
                      <tr>
                        {currentSqlTask.dataset.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentSqlTask.dataset.rows.map((row, index) => (
                        <tr key={`${currentSqlTask.id}-row-${index}`}>
                          {currentSqlTask.dataset.columns.map((col) => (
                            <td key={`${currentSqlTask.id}-${col}-${index}`}>
                              {formatValue(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="practice-io">
                  <textarea
                    rows={3}
                    placeholder="输入 SQL 语句"
                    value={sqlStates[currentSqlTask.id]?.query ?? ""}
                    onChange={(event) =>
                      setSqlStates((prev) => ({
                        ...prev,
                        [currentSqlTask.id]: {
                          ...prev[currentSqlTask.id],
                          query: event.target.value
                        }
                      }))
                    }
                  />
                </div>
                <div className="practice-actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={() => handleSqlSubmit(currentSqlTask)}
                  >
                    运行判题
                  </button>
                  <span
                    className={`judge-status ${
                      sqlStates[currentSqlTask.id]?.status ?? "idle"
                    }`}
                  >
                    {sqlStates[currentSqlTask.id]?.status === "correct"
                      ? "正确"
                      : sqlStates[currentSqlTask.id]?.status === "incorrect"
                      ? "未通过"
                      : sqlStates[currentSqlTask.id]?.status === "error"
                      ? "解析失败"
                      : ""}
                  </span>
                </div>
                {sqlStates[currentSqlTask.id]?.message ? (
                  <p className="form-message">
                    {sqlStates[currentSqlTask.id]?.message}
                  </p>
                ) : null}
                {sqlStates[currentSqlTask.id]?.preview ? (
                  <div className="mini-table">
                    <div className="mini-table-title">查询结果</div>
                    <table>
                      <thead>
                        <tr>
                          {sqlStates[currentSqlTask.id]?.preview?.columns.map(
                            (col) => (
                              <th key={col}>{col}</th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {sqlStates[currentSqlTask.id]?.preview?.rows.map(
                          (row, index) => (
                            <tr key={`${currentSqlTask.id}-preview-${index}`}>
                              {row.map((value, valueIndex) => (
                                <td
                                  key={`${currentSqlTask.id}-cell-${index}-${valueIndex}`}
                                >
                                  {formatValue(value)}
                                </td>
                              ))}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="knowledge-empty">暂无 SQL 练习题。</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
