"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type PracticeMode = "drill" | "quiz";
type PracticeStatus = "idle" | "loading" | "active" | "done";

export default function QuickPracticePage() {
  const [categories, setCategories] = useState<QuickPracticeCategory[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [mode, setMode] = useState<PracticeMode>("drill");
  const [setSize, setSetSize] = useState<number>(10);
  const [questions, setQuestions] = useState<QuickPracticeQuestion[]>([]);
  const [status, setStatus] = useState<PracticeStatus>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const autoNextRef = useRef<number | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === selected) ?? null,
    [categories, selected]
  );

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const answered = Boolean(currentAnswer);
  const isCorrect =
    answered && currentQuestion
      ? currentAnswer === currentQuestion.answer
      : false;

  const progressText = questions.length
    ? `${Math.min(currentIndex + 1, questions.length)}/${questions.length}`
    : "--";

  const results = questions.map((question) => {
    const userAnswer = answers[question.id];
    return {
      question,
      userAnswer,
      correct: userAnswer === question.answer
    };
  });
  const correctCount = results.filter((item) => item.correct).length;
  const accuracy = questions.length
    ? Math.round((correctCount / questions.length) * 1000) / 10
    : 0;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/practice/quick/categories`);
        if (!res.ok) {
          throw new Error("无法获取题型列表");
        }
        const data = await res.json();
        setCategories(data.categories ?? []);
        if (data.categories?.length) {
          setSelected(data.categories[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!selected) {
      return;
    }
    void startSession();
  }, [selected, mode, setSize]);

  useEffect(() => {
    return () => {
      if (autoNextRef.current) {
        window.clearTimeout(autoNextRef.current);
      }
    };
  }, []);

  const startSession = async () => {
    if (!selected) {
      return;
    }
    setStatus("loading");
    setError(null);
    setAnswers({});
    setCurrentIndex(0);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取题目失败");
      setStatus("idle");
    }
  };

  const goNext = () => {
    setCurrentIndex((index) => {
      const next = index + 1;
      if (next >= questions.length) {
        setStatus("done");
        return index;
      }
      return next;
    });
  };

  const handleChoice = (choice: string) => {
    if (!currentQuestion || answered || status !== "active") {
      return;
    }
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: choice }));
    if (mode === "quiz") {
      if (currentIndex + 1 >= questions.length) {
        setStatus("done");
      } else {
        setCurrentIndex((index) => index + 1);
      }
      return;
    }
    if (choice === currentQuestion.answer) {
      autoNextRef.current = window.setTimeout(() => {
        goNext();
      }, 700);
    }
  };

  const restartLabel = status === "loading" ? "生成中..." : "重新生成";

  return (
    <main className="main practice-page">
      <section className="practice-header">
        <div>
          <p className="eyebrow">速算练习模块</p>
          <h1>资料分析速算 · 即刻开练</h1>
          <p className="lead">
            专注行测资料分析常见技巧：尾数判定、百化分、增长率估算与比重截位直除。
          </p>
        </div>
        <div className="practice-legend">
          <div>
            <strong>题型</strong>
            <span>{categories.length || 4}</span>
          </div>
          <div>
            <strong>进度</strong>
            <span>{status === "done" ? "已完成" : progressText}</span>
          </div>
          <div>
            <strong>正确率</strong>
            <span>{questions.length ? `${accuracy}%` : "--"}</span>
          </div>
        </div>
      </section>

      <section className="practice-controls">
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
        <label className="practice-label" htmlFor="category">
          题型
        </label>
        <select
          id="category"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
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
        <button
          className="primary"
          type="button"
          onClick={startSession}
          disabled={status === "loading"}
        >
          {restartLabel}
        </button>
      </section>

      {selectedCategory ? (
        <section className="practice-category">
          <h3>{selectedCategory.name}</h3>
          <p>{selectedCategory.description}</p>
        </section>
      ) : null}

      <section className="practice-card">
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
            </div>
            <div className="summary-list">
              {results.map((item, index) => (
                <div key={item.question.id} className="summary-row">
                  <div className="summary-index">#{index + 1}</div>
                  <div className="summary-body">
                    <div>{item.question.prompt}</div>
                    <div className="summary-meta">
                      <span>你的答案：{item.userAnswer ?? "--"}</span>
                      <span>正确答案：{item.question.answer}</span>
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
            <div className="practice-question">{currentQuestion.prompt}</div>
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
                    {choice}
                  </button>
                );
              })}
            </div>
            {mode === "drill" && answered ? (
              <div className="practice-answer">
                <div>
                  <strong>答案：</strong>
                  {currentQuestion.answer}
                </div>
                {currentQuestion.explanation ? (
                  <p>{currentQuestion.explanation}</p>
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
          <div className="practice-loading">暂无题目，请重新生成。</div>
        )}
      </section>
    </main>
  );
}
