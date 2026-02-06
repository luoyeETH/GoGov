"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type {
  QuickPracticeCategory,
  QuickPracticeQuestion
} from "@gogov/shared";

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
const repeatableCategories = new Set(["percent-decimal", "percent-precision"]);
const analysisTolerance = 0.02;
const formulaCategoryId = "formula-memory";

type PracticeMode = "drill" | "quiz";
type PracticeStatus = "idle" | "loading" | "active" | "done";

const FORMULA_TEX_MAP: Array<{ plain: string; tex: string }> = [
  {
    plain: "(A/B) × ((a-b)/(1+a))",
    tex: "\\frac{A}{B}\\times\\frac{a-b}{1+a}"
  },
  {
    plain: "(A/B) × ((b-a)/(1+b))",
    tex: "\\frac{A}{B}\\times\\frac{b-a}{1+b}"
  },
  {
    plain: "(A/B) × ((a-b)/(1+b))",
    tex: "\\frac{A}{B}\\times\\frac{a-b}{1+b}"
  },
  {
    plain: "(A/B) × ((1+b)/(1+a))",
    tex: "\\frac{A}{B}\\times\\frac{1+b}{1+a}"
  },
  {
    plain: "(A/B) × ((1+a)/(1+b))",
    tex: "\\frac{A}{B}\\times\\frac{1+a}{1+b}"
  },
  {
    plain: "(B/A) × ((1+b)/(1+a))",
    tex: "\\frac{B}{A}\\times\\frac{1+b}{1+a}"
  },
  {
    plain: "(B/A) × ((a-b)/(1+a))",
    tex: "\\frac{B}{A}\\times\\frac{a-b}{1+a}"
  },
  {
    plain: "现期倍数 × ((1+b)/(1+a))",
    tex: "\\text{现期倍数}\\times\\frac{1+b}{1+a}"
  },
  {
    plain: "现期倍数 × ((1+a)/(1+b))",
    tex: "\\text{现期倍数}\\times\\frac{1+a}{1+b}"
  },
  {
    plain: "现期倍数 × ((a-b)/(1+a))",
    tex: "\\text{现期倍数}\\times\\frac{a-b}{1+a}"
  },
  {
    plain: "现期倍数 ÷ ((1+b)/(1+a))",
    tex: "\\text{现期倍数}\\div\\frac{1+b}{1+a}"
  },
  {
    plain: "现期-基期 = 现期 × r/(1+r)",
    tex: "\\text{现期}-\\text{基期}=\\text{现期}\\times\\frac{r}{1+r}"
  },
  {
    plain: "现期-基期 = 基期 × r/(1+r)",
    tex: "\\text{现期}-\\text{基期}=\\text{基期}\\times\\frac{r}{1+r}"
  },
  {
    plain: "现期-基期 = 现期 × r",
    tex: "\\text{现期}-\\text{基期}=\\text{现期}\\times r"
  },
  {
    plain: "增长量 = 基期-现期",
    tex: "\\text{增长量}=\\text{基期}-\\text{现期}"
  },
  {
    plain: "(现期/基期)^(1/n)-1",
    tex: "\\left(\\frac{\\text{现期}}{\\text{基期}}\\right)^{1/n}-1"
  },
  {
    plain: "(基期/现期)^(1/n)-1",
    tex: "\\left(\\frac{\\text{基期}}{\\text{现期}}\\right)^{1/n}-1"
  },
  {
    plain: "((现期-基期)/基期) ÷ n",
    tex: "\\frac{\\text{现期}-\\text{基期}}{\\text{基期}}\\div n"
  },
  {
    plain: "(现期/基期)-1/n",
    tex: "\\frac{\\text{现期}}{\\text{基期}}-\\frac{1}{n}"
  },
  {
    plain: "(现期-基期)/现期",
    tex: "\\frac{\\text{现期}-\\text{基期}}{\\text{现期}}"
  },
  {
    plain: "(现期-基期)/基期",
    tex: "\\frac{\\text{现期}-\\text{基期}}{\\text{基期}}"
  },
  {
    plain: "(基期-现期)/基期",
    tex: "\\frac{\\text{基期}-\\text{现期}}{\\text{基期}}"
  },
  {
    plain: "基期 × (1+r)",
    tex: "\\text{基期}\\times(1+r)"
  },
  {
    plain: "基期 × (1-r)",
    tex: "\\text{基期}\\times(1-r)"
  },
  {
    plain: "现期 × (1+r)",
    tex: "\\text{现期}\\times(1+r)"
  },
  {
    plain: "基期 ÷ (1+r)",
    tex: "\\frac{\\text{基期}}{1+r}"
  },
  {
    plain: "现期 ÷ (1+r)",
    tex: "\\frac{\\text{现期}}{1+r}"
  },
  {
    plain: "现期 ÷ (1-r)",
    tex: "\\frac{\\text{现期}}{1-r}"
  },
  {
    plain: "A/(A+B)",
    tex: "\\frac{A}{A+B}"
  },
  {
    plain: "(A-B)/B",
    tex: "\\frac{A-B}{B}"
  },
  {
    plain: "A/B",
    tex: "\\frac{A}{B}"
  },
  {
    plain: "B/A",
    tex: "\\frac{B}{A}"
  },
  {
    plain: "r1 + r2 + r1×r2",
    tex: "r_1+r_2+r_1\\times r_2"
  },
  {
    plain: "r1 + r2 - r1×r2",
    tex: "r_1+r_2-r_1\\times r_2"
  },
  {
    plain: "(r1 + r2)/2",
    tex: "\\frac{r_1+r_2}{2}"
  },
  {
    plain: "r1×r2",
    tex: "r_1\\times r_2"
  },
  {
    plain: "部分增长量/整体增长量",
    tex: "\\frac{\\text{部分增长量}}{\\text{整体增长量}}"
  },
  {
    plain: "部分现期量/整体现期量",
    tex: "\\frac{\\text{部分现期量}}{\\text{整体现期量}}"
  },
  {
    plain: "部分基期量/整体基期量",
    tex: "\\frac{\\text{部分基期量}}{\\text{整体基期量}}"
  },
  {
    plain: "整体增长量/部分增长量",
    tex: "\\frac{\\text{整体增长量}}{\\text{部分增长量}}"
  },
  {
    plain: "部分增长量/总体基期量",
    tex: "\\frac{\\text{部分增长量}}{\\text{总体基期量}}"
  },
  {
    plain: "总体增长量/部分基期量",
    tex: "\\frac{\\text{总体增长量}}{\\text{部分基期量}}"
  },
  {
    plain: "总量/总份数",
    tex: "\\frac{\\text{总量}}{\\text{总份数}}"
  },
  {
    plain: "总份数/总量",
    tex: "\\frac{\\text{总份数}}{\\text{总量}}"
  },
  {
    plain: "(总量-总份数)/总份数",
    tex: "\\frac{\\text{总量}-\\text{总份数}}{\\text{总份数}}"
  },
  {
    plain: "总量/(总量+总份数)",
    tex: "\\frac{\\text{总量}}{\\text{总量}+\\text{总份数}}"
  },
  {
    plain: "(1+a)/(1+b)-1",
    tex: "\\frac{1+a}{1+b}-1"
  },
  {
    plain: "(1+a)/(1+b)",
    tex: "\\frac{1+a}{1+b}"
  },
  {
    plain: "(1+b)/(1+a)-1",
    tex: "\\frac{1+b}{1+a}-1"
  },
  {
    plain: "(a-b)/(1+b)",
    tex: "\\frac{a-b}{1+b}"
  },
  {
    plain: "(b-a)/(1+b)",
    tex: "\\frac{b-a}{1+b}"
  },
  {
    plain: "(a+b)/(1+b)",
    tex: "\\frac{a+b}{1+b}"
  },
  {
    plain: "现期平均数 ÷ (1+r)",
    tex: "\\frac{\\text{现期平均数}}{1+r}"
  },
  {
    plain: "现期平均数 × (1+r)",
    tex: "\\text{现期平均数}\\times(1+r)"
  },
  {
    plain: "现期平均数 ÷ (1-r)",
    tex: "\\frac{\\text{现期平均数}}{1-r}"
  },
  {
    plain: "基期平均数 × (1+r)",
    tex: "\\text{基期平均数}\\times(1+r)"
  },
  {
    plain: "现期/基期 = 1+r",
    tex: "\\frac{\\text{现期}}{\\text{基期}}=1+r"
  },
  {
    plain: "基期/现期 = 1+r",
    tex: "\\frac{\\text{基期}}{\\text{现期}}=1+r"
  },
  {
    plain: "现期/基期 = r",
    tex: "\\frac{\\text{现期}}{\\text{基期}}=r"
  },
  {
    plain: "1+r = 基期/现期",
    tex: "1+r=\\frac{\\text{基期}}{\\text{现期}}"
  },
  {
    plain: "(基期-现期)/基期",
    tex: "\\frac{\\text{基期}-\\text{现期}}{\\text{基期}}"
  },
  {
    plain: "(基期-现期)/现期",
    tex: "\\frac{\\text{基期}-\\text{现期}}{\\text{现期}}"
  },
  {
    plain: "((现期/基期)-1)/n",
    tex: "\\frac{\\frac{\\text{现期}}{\\text{基期}}-1}{n}"
  },
  {
    plain: "((基期/现期)-1)/n",
    tex: "\\frac{\\frac{\\text{基期}}{\\text{现期}}-1}{n}"
  },
  {
    plain: "a-b",
    tex: "a-b"
  },
  {
    plain: "b-a",
    tex: "b-a"
  },
  {
    plain: "a+b",
    tex: "a+b"
  },
  {
    plain: "a/b",
    tex: "\\frac{a}{b}"
  },
  {
    plain: "r = w1×r1 + w2×r2 (w1+w2=1)",
    tex: "r=w_1\\times r_1+w_2\\times r_2\\quad (w_1+w_2=1)"
  },
  {
    plain: "r = w1×r1 - w2×r2",
    tex: "r=w_1\\times r_1-w_2\\times r_2"
  },
  {
    plain: "r = r1 + r2",
    tex: "r=r_1+r_2"
  },
  {
    plain: "r = (r1+r2)/2",
    tex: "r=\\frac{r_1+r_2}{2}"
  },
  {
    plain: "基期比重 = 现期比重 × ((1+b)/(1+a))",
    tex: "\\text{基期比重}=\\text{现期比重}\\times\\frac{1+b}{1+a}"
  },
  {
    plain: "基期比重 = 现期比重 × ((1+a)/(1+b))",
    tex: "\\text{基期比重}=\\text{现期比重}\\times\\frac{1+a}{1+b}"
  },
  {
    plain: "基期比重 = 现期比重 × ((a-b)/(1+a))",
    tex: "\\text{基期比重}=\\text{现期比重}\\times\\frac{a-b}{1+a}"
  },
  {
    plain: "基期比重 = 现期比重 ÷ ((1+b)/(1+a))",
    tex: "\\text{基期比重}=\\text{现期比重}\\div\\frac{1+b}{1+a}"
  },
  {
    plain: "现期/基期",
    tex: "\\frac{\\text{现期}}{\\text{基期}}"
  }
]
  .slice()
  .sort((left, right) => right.plain.length - left.plain.length);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toFormulaMarkdown(text: string) {
  let output = text;
  const tokens: string[] = [];
  FORMULA_TEX_MAP.forEach((entry) => {
    const pattern = new RegExp(escapeRegExp(entry.plain), "g");
    output = output.replace(pattern, () => {
      const token = `__FORMULA_TOKEN_${tokens.length}__`;
      tokens.push(entry.tex);
      return token;
    });
  });
  tokens.forEach((tex, index) => {
    const token = `__FORMULA_TOKEN_${index}__`;
    output = output.split(token).join(`$${tex}$`);
  });
  return output;
}

function FormulaText({
  text,
  enabled
}: {
  text: string;
  enabled: boolean;
}) {
  if (!enabled) {
    return <>{text}</>;
  }
  return (
    <span className="practice-rich-text">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <span>{children}</span>
        }}
      >
        {toFormulaMarkdown(text)}
      </ReactMarkdown>
    </span>
  );
}

function parseNumeric(value: string) {
  const cleaned = value.replace(/[%\s,]/g, "");
  if (!cleaned) {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const remain = safe % 60;
  return `${minutes}:${remain.toString().padStart(2, "0")}`;
}

function formatDiff(value: number) {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(2);
}

function roundTo(value: number, digits: number) {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

export default function QuickPracticePage() {
  const [categories, setCategories] = useState<QuickPracticeCategory[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selected, setSelected] = useState<string>("");
  const [mode, setMode] = useState<PracticeMode>("drill");
  const [setSize, setSetSize] = useState<number>(10);
  const [showTips, setShowTips] = useState(true);
  const [repeatWrong, setRepeatWrong] = useState(false);
  const [questions, setQuestions] = useState<QuickPracticeQuestion[]>([]);
  const [status, setStatus] = useState<PracticeStatus>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const autoNextRef = useRef<number | null>(null);
  const submitRef = useRef(false);
  const repeatTrackerRef = useRef<Record<string, number>>({});
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [sessionEndedAt, setSessionEndedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isDesktop, setIsDesktop] = useState(true);
  const [keypadPos, setKeypadPos] = useState({ x: 0, y: 0 });
  const [hasKeypadPos, setHasKeypadPos] = useState(false);
  const keypadRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === selected) ?? null,
    [categories, selected]
  );

  const groupedCategories = useMemo(() => {
    const groups = new Map<string, QuickPracticeCategory[]>();
    categories.forEach((item) => {
      const group = item.group ?? "其他";
      const bucket = groups.get(group);
      if (bucket) {
        bucket.push(item);
      } else {
        groups.set(group, [item]);
      }
    });
    const order = ["基础速算", "资料分析专项", "其他"];
    const ordered = order
      .filter((group) => groups.has(group))
      .map((group) => ({ group, items: groups.get(group) ?? [] }));
    const remaining = Array.from(groups.entries())
      .filter(([group]) => !order.includes(group))
      .map(([group, items]) => ({ group, items }));
    return [...ordered, ...remaining];
  }, [categories]);

  const categoryLookup = useMemo(() => {
    return new Map(categories.map((item) => [item.id, item]));
  }, [categories]);

  const selectedGroupCategories = useMemo(() => {
    return categories.filter(
      (item) => (item.group ?? "其他") === (selectedGroup || "其他")
    );
  }, [categories, selectedGroup]);

  const currentQuestion = questions[currentIndex];
  const isFormulaQuestion = currentQuestion?.categoryId === formulaCategoryId;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const answered = currentAnswer !== undefined;
  const isNumericQuestion = currentQuestion
    ? parseNumeric(currentQuestion.answer) !== null
    : false;

  const evaluateAnswer = (question: QuickPracticeQuestion, value: string) => {
    const userAnswer = value.trim();
    const answerText = question.answer.trim();
    const userValue = parseNumeric(userAnswer);
    const answerValue = parseNumeric(answerText);
    const category = categoryLookup.get(question.categoryId);
    const isAnalysis = (category?.group ?? "其他") === "资料分析专项";
    const isPercentConversion = repeatableCategories.has(question.categoryId);
    if (userValue !== null && answerValue !== null) {
      const errorValue = userValue - answerValue;
      const errorPercent =
        answerValue !== 0 ? Math.abs(errorValue) / Math.abs(answerValue) : null;
      let correct = Math.abs(userValue - answerValue) <= 1e-6;
      if (isPercentConversion && answerText.includes("%")) {
        correct = roundTo(userValue, 1) === roundTo(answerValue, 1);
      } else if (isAnalysis && !isPercentConversion) {
        if (answerValue === 0) {
          correct = Math.abs(userValue - answerValue) <= 1e-6;
        } else {
        correct =
          errorPercent !== null && errorPercent <= analysisTolerance;
        }
      }
      return {
        correct,
        isNumeric: true,
        errorValue,
        errorPercent,
        userValue,
        answerValue,
        isAnalysis,
        isPercentConversion
      };
    }
    return {
      correct: userAnswer === answerText,
      isNumeric: false,
      errorValue: null,
      errorPercent: null,
      userValue: null,
      answerValue: null,
      isAnalysis,
      isPercentConversion
    };
  };

  const currentEvaluation =
    currentQuestion && answered
      ? evaluateAnswer(currentQuestion, currentAnswer ?? "")
      : null;
  const isCorrect = currentEvaluation?.correct ?? false;

  const progressText = questions.length
    ? `${Math.min(currentIndex + 1, questions.length)}/${questions.length}`
    : "--";
  const elapsedText =
    status === "active" || status === "done"
      ? formatDuration(elapsedSeconds)
      : "--";
  const currentErrorText =
    currentEvaluation?.isNumeric &&
    currentEvaluation.errorValue !== null &&
    currentEvaluation.isAnalysis &&
    !currentEvaluation.isPercentConversion
      ? `${currentEvaluation.errorValue >= 0 ? "+" : ""}${formatDiff(
          currentEvaluation.errorValue
        )}${
          currentEvaluation.errorPercent !== null
            ? `（${(currentEvaluation.errorPercent * 100).toFixed(1)}%）`
            : ""
        }`
      : null;

  const results = questions.map((question) => {
    const userAnswer = answers[question.id] ?? "";
    const evaluation = userAnswer
      ? evaluateAnswer(question, userAnswer)
      : {
          correct: false,
          isNumeric: false,
          errorValue: null,
          errorPercent: null,
          userValue: null,
          answerValue: null,
          isAnalysis: false,
          isPercentConversion: false
        };
    return {
      question,
      userAnswer,
      correct: evaluation.correct,
      errorValue: evaluation.errorValue,
      errorPercent: evaluation.errorPercent,
      isNumeric: evaluation.isNumeric,
      isAnalysis: evaluation.isAnalysis,
      isPercentConversion: evaluation.isPercentConversion
    };
  });
  const correctCount = results.filter((item) => item.correct).length;
  const accuracy = questions.length
    ? Math.round((correctCount / questions.length) * 1000) / 10
    : 0;
  const sessionTotalSeconds =
    sessionStartedAt && sessionEndedAt
      ? Math.round((sessionEndedAt - sessionStartedAt) / 1000)
      : elapsedSeconds;
  const averageSeconds =
    questions.length && sessionTotalSeconds
      ? Math.round((sessionTotalSeconds / questions.length) * 10) / 10
      : 0;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/practice/quick/categories`);
        if (!res.ok) {
          throw new Error("无法获取题型列表");
        }
        const data = await res.json();
        const list = (data.categories ?? []) as QuickPracticeCategory[];
        setCategories(list);
        if (list.length) {
          const group = list[0].group ?? "其他";
          setSelectedGroup(group);
          const firstInGroup =
            list.find((item) => (item.group ?? "其他") === group) ?? list[0];
          setSelected(firstInGroup.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const update = () => {
      setIsDesktop(window.innerWidth > 720);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (
      !isDesktop ||
      !currentQuestion ||
      !isNumericQuestion ||
      hasKeypadPos ||
      status !== "active"
    ) {
      return;
    }
    const width = 240;
    const height = 240;
    const x = Math.max(24, window.innerWidth - width - 32);
    const y = Math.max(120, window.innerHeight - height - 120);
    setKeypadPos({ x, y });
    setHasKeypadPos(true);
  }, [isDesktop, currentQuestion?.id, isNumericQuestion, status, hasKeypadPos]);

  useEffect(() => {
    if (!selectedGroup || !categories.length) {
      return;
    }
    const groupItems = categories.filter(
      (item) => (item.group ?? "其他") === selectedGroup
    );
    if (!groupItems.length) {
      return;
    }
    if (!groupItems.some((item) => item.id === selected)) {
      setSelected(groupItems[0].id);
    }
  }, [selectedGroup, categories, selected]);

  useEffect(() => {
    return () => {
      if (autoNextRef.current) {
        window.clearTimeout(autoNextRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!currentQuestion) {
      setInputValue("");
      return;
    }
    const existing = answers[currentQuestion.id];
    setInputValue(existing ?? "");
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (status !== "active" || !sessionStartedAt) {
      return;
    }
    const timer = window.setInterval(() => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000))
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status, sessionStartedAt]);

  useEffect(() => {
    if (status !== "done") {
      return;
    }
    void submitSession();
  }, [status]);

  const finishSession = () => {
    if (status === "done") {
      return;
    }
    const endedAt = Date.now();
    setSessionEndedAt(endedAt);
    setElapsedSeconds(
      sessionStartedAt ? Math.floor((endedAt - sessionStartedAt) / 1000) : 0
    );
    setStatus("done");
  };

  const startSession = async () => {
    if (!selected) {
      return;
    }
    setStatus("loading");
    setError(null);
    setAnswers({});
    setCurrentIndex(0);
    setSessionStartedAt(null);
    setSessionEndedAt(null);
    setElapsedSeconds(0);
    submitRef.current = false;
    repeatTrackerRef.current = {};
    setHasKeypadPos(false);
    try {
      const count = Math.max(1, Math.min(setSize, 50));
      const url = `${apiBase}/practice/quick/batch?category=${selected}&count=${count}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("获取题目失败");
      }
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setStatus("active");
      const startedAt = Date.now();
      setSessionStartedAt(startedAt);
      setElapsedSeconds(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取题目失败");
      setStatus("idle");
    }
  };

  const resetSession = () => {
    setStatus("idle");
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setSessionStartedAt(null);
    setSessionEndedAt(null);
    setElapsedSeconds(0);
    setInputValue("");
    setError(null);
    setHasKeypadPos(false);
  };

  const goNext = () => {
    setCurrentIndex((index) => {
      const next = index + 1;
      if (next >= questions.length) {
        finishSession();
        return index;
      }
      return next;
    });
  };

  const handleAnswer = (value: string) => {
    if (!currentQuestion || answered || status !== "active") {
      return;
    }
    const evaluation = evaluateAnswer(currentQuestion, value);
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    let appended = false;
    if (
      repeatWrong &&
      !evaluation.correct &&
      repeatableCategories.has(currentQuestion.categoryId)
    ) {
      const key = currentQuestion.id;
      const count = repeatTrackerRef.current[key] ?? 0;
      if (count < 1) {
        repeatTrackerRef.current[key] = count + 1;
        const retry = {
          ...currentQuestion,
          id: `${currentQuestion.id}-retry-${Date.now()}`
        };
        setQuestions((prev) => [...prev, retry]);
        appended = true;
      }
    }
    if (mode === "quiz") {
      const nextIndex = currentIndex + 1;
      const totalQuestions = questions.length + (appended ? 1 : 0);
      if (nextIndex >= totalQuestions) {
        finishSession();
      } else {
        setCurrentIndex(nextIndex);
      }
      return;
    }
    if (evaluation.correct) {
      autoNextRef.current = window.setTimeout(() => {
        goNext();
      }, 700);
    }
  };

  const handleChoice = (choice: string) => {
    handleAnswer(choice);
  };

  const handleSubmitInput = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }
    if (parseNumeric(trimmed) === null) {
      return;
    }
    setInputValue(trimmed);
    handleAnswer(trimmed);
  };

  const updateInputValue = (next: string) => {
    if (answered) {
      return;
    }
    setInputValue(next);
  };

  const handleKeypad = (key: string) => {
    if (answered) {
      return;
    }
    setInputValue((prev) => {
      if (key === "clear") {
        return "";
      }
      if (key === "back") {
        return prev.slice(0, -1);
      }
      if (key === "toggle") {
        if (!prev) {
          return "-";
        }
        return prev.startsWith("-") ? prev.slice(1) : `-${prev}`;
      }
      return `${prev}${key}`;
    });
  };

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDesktop) {
      return;
    }
    const rect = keypadRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    draggingRef.current = true;
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !isDesktop) {
      return;
    }
    const rect = keypadRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 240;
    const height = rect?.height ?? 240;
    const nextX = event.clientX - dragOffsetRef.current.x;
    const nextY = event.clientY - dragOffsetRef.current.y;
    const maxX = window.innerWidth - width - 16;
    const maxY = window.innerHeight - height - 16;
    setKeypadPos({
      x: Math.min(Math.max(nextX, 16), maxX),
      y: Math.min(Math.max(nextY, 80), maxY)
    });
  };

  const handleDragEnd = () => {
    draggingRef.current = false;
  };

  const submitSession = async () => {
    if (submitRef.current) {
      return;
    }
    submitRef.current = true;
    const token = window.localStorage.getItem(sessionKey);
    if (!token || !sessionStartedAt || !questions.length) {
      return;
    }
    const endedAt = sessionEndedAt ? new Date(sessionEndedAt) : new Date();
    try {
      await fetch(`${apiBase}/practice/quick/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryId: selected,
          mode,
          startedAt: new Date(sessionStartedAt).toISOString(),
          endedAt: endedAt.toISOString(),
          questions: results.map((item) => ({
            id: item.question.id,
            prompt: item.question.prompt,
            answer: item.question.answer,
            choices: item.question.choices,
            explanation: item.question.explanation,
            userAnswer: item.userAnswer ?? "",
            correct: item.correct
          }))
        })
      });
    } catch (_err) {
      submitRef.current = false;
    }
  };

  const restartLabel = status === "loading" ? "生成中..." : "重新生成";
  const isSetup = status === "idle" || status === "loading";

  return (
    <main className="main practice-page">
      <section className="practice-header app-page-header">
        <div className="app-page-header-main">
          <p className="eyebrow">速算练习模块</p>
          <h1 className="app-page-title">资料分析速算 · 即刻开练</h1>
          <p className="lead app-page-subtitle">
            专注行测资料分析常见技巧：尾数判定、百化分、增长率估算与比重截位直除。
          </p>
        </div>
        <div className="practice-legend app-page-metrics">
          <div className="app-page-metric">
            <strong className="app-page-metric-label">题型</strong>
            <span className="app-page-metric-value">{categories.length || 4}</span>
          </div>
          <div className="app-page-metric">
            <strong className="app-page-metric-label">进度</strong>
            <span className="app-page-metric-value">
              {status === "done" ? "已完成" : progressText}
            </span>
          </div>
          <div className="app-page-metric">
            <strong className="app-page-metric-label">用时</strong>
            <span className="app-page-metric-value">{elapsedText}</span>
          </div>
          <div className="app-page-metric">
            <strong className="app-page-metric-label">正确率</strong>
            <span className="app-page-metric-value">
              {questions.length ? `${accuracy}%` : "--"}
            </span>
          </div>
        </div>
      </section>

      {isSetup ? (
        <section className="practice-setup">
          <div className="setup-card">
            <div className="setup-row">
              <div className="setup-field">
                <label className="practice-label" htmlFor="group">
                  题型大类
                </label>
                <select
                  id="group"
                  value={selectedGroup}
                  onChange={(event) => setSelectedGroup(event.target.value)}
                >
                  {groupedCategories.map((group) => (
                    <option key={group.group} value={group.group}>
                      {group.group}
                    </option>
                  ))}
                </select>
              </div>
              <div className="setup-field">
                <label className="practice-label" htmlFor="category">
                  题型
                </label>
                <select
                  id="category"
                  value={selected}
                  onChange={(event) => setSelected(event.target.value)}
                >
                  {selectedGroupCategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="setup-row">
              <div className="setup-field">
                <label className="practice-label">练习模式</label>
                <div className="mode-toggle">
                  <button
                    type="button"
                    className={`mode-button ${mode === "drill" ? "active" : ""}`}
                    onClick={() => setMode("drill")}
                  >
                    背题模式
                  </button>
                  <button
                    type="button"
                    className={`mode-button ${mode === "quiz" ? "active" : ""}`}
                    onClick={() => setMode("quiz")}
                  >
                    做题模式
                  </button>
                </div>
              </div>
              <div className="setup-field">
                <label className="practice-label" htmlFor="count">
                  题量
                </label>
                <select
                  id="count"
                  value={setSize}
                  onChange={(event) => setSetSize(Number(event.target.value))}
                >
                  {[5, 10, 20].map((count) => (
                    <option key={count} value={count}>
                      {count} 题
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="setup-row toggles">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={showTips}
                  onChange={(event) => setShowTips(event.target.checked)}
                />
                <span>显示秒杀建议</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={repeatWrong}
                  onChange={(event) => setRepeatWrong(event.target.checked)}
                />
                <span>错题自动重练</span>
              </label>
            </div>
            <div className="setup-actions">
              <button
                className="primary"
                type="button"
                onClick={startSession}
                disabled={status === "loading"}
              >
                开始练习
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="practice-controls active-controls">
          <div className="active-meta">
            <span>
              {selectedCategory?.group ?? "练习"} / {selectedCategory?.name ?? "--"}
            </span>
            <span>模式：{mode === "drill" ? "背题" : "做题"}</span>
            <span>题量：{setSize} 题</span>
          </div>
          <div className="active-actions">
            <button type="button" className="ghost" onClick={resetSession}>
              重新设置
            </button>
            <button
              className="primary"
              type="button"
              onClick={startSession}
            >
              {restartLabel}
            </button>
          </div>
        </section>
      )}

      {selectedCategory ? (
        <section className="practice-category">
          <div className="category-header">
            <span className="category-group">
              {selectedCategory.group ?? "练习模块"}
            </span>
            <h3>{selectedCategory.name}</h3>
          </div>
          <p>{selectedCategory.description}</p>
        </section>
      ) : null}

      <section className="practice-card">
        {status === "active" ? (
          <div className="practice-timer">用时 {elapsedText}</div>
        ) : null}
        {error ? (
          <div className="practice-error">{error}</div>
        ) : status === "loading" ? (
          <div className="practice-loading">正在生成题目...</div>
        ) : status === "done" ? (
          <div className="practice-summary">
            <div className="summary-header">
              <h3>本组结果</h3>
              <span>{accuracy}% 正确率</span>
            </div>
            <div className="summary-grid">
              <div>
                <strong>正确</strong>
                <span>{correctCount}</span>
              </div>
              <div>
                <strong>总题数</strong>
                <span>{questions.length}</span>
              </div>
              <div>
                <strong>总用时</strong>
                <span>{formatDuration(sessionTotalSeconds)}</span>
              </div>
              <div>
                <strong>平均用时</strong>
                <span>{averageSeconds ? `${averageSeconds}s/题` : "--"}</span>
              </div>
            </div>
            <div className="summary-list">
              {results.map((item, index) => (
                <div key={item.question.id} className="summary-row">
                  <div className="summary-index">#{index + 1}</div>
                  <div className="summary-body">
                    <div>
                      <FormulaText
                        text={item.question.prompt}
                        enabled={item.question.categoryId === formulaCategoryId}
                      />
                    </div>
                    <div className="summary-meta">
                      <span>
                        你的答案：
                        <FormulaText
                          text={item.userAnswer || "--"}
                          enabled={item.question.categoryId === formulaCategoryId}
                        />
                      </span>
                      <span>
                        正确答案：
                        <FormulaText
                          text={item.question.answer}
                          enabled={item.question.categoryId === formulaCategoryId}
                        />
                      </span>
                      {item.isNumeric &&
                      item.isAnalysis &&
                      !item.isPercentConversion &&
                      item.errorValue !== null ? (
                        <span>
                          误差：
                          {item.errorValue >= 0 ? "+" : ""}
                          {formatDiff(item.errorValue)}
                          {item.errorPercent !== null
                            ? `（${(item.errorPercent * 100).toFixed(1)}%）`
                            : ""}
                        </span>
                      ) : null}
                      <span
                        className={`summary-pill ${
                          item.correct ? "ok" : "bad"
                        }`}
                      >
                        {item.correct ? "正确" : "错误"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : currentQuestion ? (
          <>
            <div className="practice-question">
              <FormulaText text={currentQuestion.prompt} enabled={isFormulaQuestion} />
            </div>
            {isNumericQuestion ? (
              <>
                <div className="practice-input">
                  <input
                    value={inputValue}
                    placeholder="输入你的答案"
                    inputMode="decimal"
                    pattern="[0-9.%\\-]*"
                    autoFocus
                    onChange={(event) => updateInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSubmitInput();
                      }
                    }}
                    disabled={answered}
                  />
                  <button
                    type="button"
                    className="primary"
                    onClick={handleSubmitInput}
                    disabled={
                      answered ||
                      !inputValue.trim() ||
                      parseNumeric(inputValue.trim()) === null
                    }
                  >
                    提交
                  </button>
                </div>
                <div
                  className={`practice-keypad-wrap ${
                    isDesktop ? "floating" : ""
                  }`}
                  style={
                    isDesktop
                      ? { transform: `translate(${keypadPos.x}px, ${keypadPos.y}px)` }
                      : undefined
                  }
                >
                  <div className="practice-keypad" ref={keypadRef}>
                    {isDesktop ? (
                      <div
                        className="keypad-header"
                        onPointerDown={handleDragStart}
                        onPointerMove={handleDragMove}
                        onPointerUp={handleDragEnd}
                        onPointerCancel={handleDragEnd}
                      >
                        拖动键盘
                      </div>
                    ) : null}
                  {[
                      "1",
                      "2",
                      "3",
                      "4",
                      "5",
                      "6",
                      "7",
                      "8",
                      "9",
                      ".",
                      "0",
                      "%"
                    ].map((key) => (
                      <button
                        key={key}
                        type="button"
                        className="keypad-key"
                        onClick={() => handleKeypad(key)}
                        disabled={answered}
                      >
                        {key}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="keypad-action"
                      onClick={() => handleKeypad("back")}
                      disabled={answered}
                    >
                      退格
                    </button>
                    <button
                      type="button"
                      className="keypad-action"
                      onClick={() => handleKeypad("clear")}
                      disabled={answered}
                    >
                      清空
                    </button>
                    <button
                      type="button"
                      className="keypad-action"
                      onClick={() => handleKeypad("toggle")}
                      disabled={answered}
                    >
                      正负
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="practice-choices">
                {(currentQuestion.choices?.length
                  ? currentQuestion.choices
                  : [currentQuestion.answer]
                ).map((choice) => {
                  const selected = currentAnswer === choice;
                  const correct = currentQuestion.answer === choice;
                  const showResult = mode === "drill" && answered;
                  return (
                    <button
                      key={choice}
                      type="button"
                      className={`choice ${selected ? "selected" : ""} ${
                        showResult && correct ? "correct" : ""
                      } ${showResult && selected && !correct ? "wrong" : ""}`}
                      onClick={() => handleChoice(choice)}
                      disabled={answered}
                    >
                      <FormulaText text={choice} enabled={isFormulaQuestion} />
                    </button>
                  );
                })}
              </div>
            )}
            {mode === "drill" && answered ? (
              <div className="practice-answer">
                <div>
                  <strong>答案：</strong>
                  <FormulaText text={currentQuestion.answer} enabled={isFormulaQuestion} />
                </div>
                {currentQuestion.explanation ? (
                  <p>
                    <FormulaText
                      text={currentQuestion.explanation}
                      enabled={isFormulaQuestion}
                    />
                  </p>
                ) : null}
                {currentErrorText ? (
                  <div className="practice-error-note">
                    <strong>误差：</strong>
                    {currentErrorText}
                  </div>
                ) : null}
                {currentEvaluation?.isAnalysis &&
                currentEvaluation.isNumeric &&
                !currentEvaluation.isPercentConversion ? (
                  <div className="practice-hint">
                    误差 ≤ {(analysisTolerance * 100).toFixed(0)}% 视为正确
                  </div>
                ) : null}
                {showTips && currentQuestion.shortcut ? (
                  <div className="practice-tip">
                    <strong>秒杀建议：</strong>
                    {currentQuestion.shortcut}
                  </div>
                ) : null}
                {!isCorrect ? (
                  <button
                    type="button"
                    className="ghost next-button"
                    onClick={goNext}
                  >
                    下一题
                  </button>
                ) : (
                  <span className="auto-next">答对自动跳转中...</span>
                )}
              </div>
            ) : null}
          </>
        ) : (
          <div className="practice-loading">
            {isSetup ? "请先选择题型并开始练习。" : "暂无题目，请重新生成。"}
          </div>
        )}
      </section>
    </main>
  );
}
