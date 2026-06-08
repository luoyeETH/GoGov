"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { QuickPracticeCategory } from "@gogov/shared";

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

type LoadState = "loading" | "idle" | "error";

type MistakeItem = {
  id: string;
  categoryId: string | null;
  practiceType: string;
  prompt: string;
  answer: string;
  userAnswer: string;
  explanation?: string | null;
  createdAt: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function MistakesPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [categories, setCategories] = useState<QuickPracticeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchText, setSearchText] = useState("");

  const computerCategory: QuickPracticeCategory = useMemo(
    () => ({
      id: "computer",
      name: "计算机专项",
      group: "计算机专项",
      description: "计算机专业科目错题"
    }),
    []
  );

  const categoryMap = useMemo(() => {
    return new Map(categories.map((item) => [item.id, item.name]));
  }, [categories]);

  const getCategoryLabel = (item: MistakeItem) =>
    item.categoryId ? categoryMap.get(item.categoryId) ?? "未知题型" : "未知题型";

  const filteredMistakes = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return mistakes;
    }
    return mistakes.filter((item) =>
      [
        item.prompt,
        item.answer,
        item.userAnswer,
        item.explanation ?? "",
        getCategoryLabel(item)
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [mistakes, searchText, categoryMap]);

  const mistakeStats = useMemo(() => {
    const categoryCount = new Set(
      mistakes.map((item) => item.categoryId ?? "unknown")
    ).size;
    return {
      total: mistakes.length,
      visible: filteredMistakes.length,
      explained: mistakes.filter((item) => Boolean(item.explanation)).length,
      categoryCount
    };
  }, [filteredMistakes.length, mistakes]);

  const loadMistakes = async (categoryId?: string) => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setMessage("请先登录后查看错题本。");
      setState("error");
      return;
    }
    setState("loading");
    setMessage(null);
    try {
      const url = new URL(`${apiBase}/mistakes`);
      if (categoryId) {
        url.searchParams.set("categoryId", categoryId);
      }
      url.searchParams.set("limit", "50");
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "无法获取错题记录");
      }
      setMistakes(data.mistakes ?? []);
      setState("idle");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "无法获取错题记录");
      setState("error");
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${apiBase}/practice/quick/categories`);
        const data = await res.json();
        if (res.ok) {
          const quickCategories = Array.isArray(data.categories)
            ? data.categories
            : [];
          setCategories([computerCategory, ...quickCategories]);
        }
      } catch (_err) {
        setCategories([computerCategory]);
      }
    };
    void loadCategories();
  }, [computerCategory]);

  useEffect(() => {
    void loadMistakes(selectedCategory === "all" ? undefined : selectedCategory);
  }, [selectedCategory]);

  return (
    <main className="main mistakes-page">
      <section className="mistakes-header app-page-header">
        <div className="app-page-header-main">
          <p className="eyebrow">错题复盘</p>
          <h1 className="app-page-title">我的错题本</h1>
          <p className="lead app-page-subtitle">
            汇总速算与计算机专项练习中的错误题目，随时回看答案与解析。
          </p>
        </div>
        <div className="mistakes-controls">
          <div className="mistakes-filter">
            <label htmlFor="category" className="practice-label">
              题型筛选
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="all">全部</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mistakes-filter mistakes-search">
            <label htmlFor="mistake-search" className="practice-label">
              关键词
            </label>
            <input
              id="mistake-search"
              value={searchText}
              placeholder="搜索题干、答案或解析"
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="mistakes-summary" aria-label="错题统计">
        <div>
          <span>当前显示</span>
          <strong>{mistakeStats.visible}</strong>
        </div>
        <div>
          <span>错题总数</span>
          <strong>{mistakeStats.total}</strong>
        </div>
        <div>
          <span>覆盖题型</span>
          <strong>{mistakeStats.categoryCount}</strong>
        </div>
        <div>
          <span>含解析</span>
          <strong>{mistakeStats.explained}</strong>
        </div>
      </section>

      {state === "loading" ? (
        <div className="practice-loading">正在加载错题...</div>
      ) : message ? (
        <div className="practice-error mistakes-feedback">
          <span>{message}</span>
          <button
            type="button"
            className="ghost"
            onClick={() =>
              loadMistakes(selectedCategory === "all" ? undefined : selectedCategory)
            }
          >
            重试
          </button>
        </div>
      ) : null}

      <section className="mistake-list">
        {state !== "idle" ? null : filteredMistakes.length ? (
          filteredMistakes.map((item) => (
            <div key={item.id} className="mistake-card">
              <div className="mistake-meta">
                <span>{getCategoryLabel(item)}</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <div className="mistake-question">{item.prompt}</div>
              <div className="mistake-answer">
                <div>
                  <span>你的答案</span>
                  <strong>{item.userAnswer || "--"}</strong>
                </div>
                <div>
                  <span>正确答案</span>
                  <strong>{item.answer}</strong>
                </div>
              </div>
              {item.explanation ? (
                <div className="mistake-explanation">{item.explanation}</div>
              ) : null}
            </div>
          ))
        ) : mistakes.length ? (
          <div className="knowledge-empty mistakes-empty">
            <strong>没有匹配的错题</strong>
            <span>换个关键词，或切换题型筛选。</span>
            <button type="button" className="ghost" onClick={() => setSearchText("")}>
              清空搜索
            </button>
          </div>
        ) : (
          <div className="knowledge-empty mistakes-empty">
            <strong>暂无错题记录</strong>
            <span>完成练习后，答错的题目会自动进入这里。</span>
            <div className="mistakes-empty-actions">
              <Link href="/practice/quick" className="primary button-link">
                去速算练习
              </Link>
              <Link href="/computer" className="ghost button-link">
                去计算机专项
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
