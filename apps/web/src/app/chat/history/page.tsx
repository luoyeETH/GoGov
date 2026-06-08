"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildConversationSessions,
  conversationKey,
  conversationModeKey,
  conversationStartKey,
  loadConversationMarkers,
  upsertConversationMarker
} from "../conversations";

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
const modeKey = "gogov_ai_chat_mode";

type ChatMode = "planner" | "tutor";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type HistoryItem = {
  id: string;
  title: string;
  startAt: string;
  createdAt: string;
  messageCount: number;
  preview: string;
  answerPreview: string;
};

type LoadState = "idle" | "loading" | "error";

function buildHistoryItems(messages: ChatMessage[]): HistoryItem[] {
  if (!messages.length) {
    return [];
  }
  const markers = loadConversationMarkers("tutor");
  const sessions = buildConversationSessions(messages, markers);
  return sessions
    .filter((session) => session.messages.length > 0)
    .map((session) => ({
      id: session.startAt,
      startAt: session.startAt,
      title: session.title,
      createdAt: session.messages[session.messages.length - 1]?.createdAt ?? session.startAt,
      messageCount: session.messages.length,
      preview:
        session.messages.find((message) => message.role === "user")?.content?.trim() ||
        "图片提问",
      answerPreview:
        [...session.messages]
          .reverse()
          .find((message) => message.role === "assistant")
          ?.content?.trim() ?? ""
    }))
    .reverse();
}

function formatHistoryTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "时间未知";
  }
  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function ChatHistoryPage() {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const loadHistory = useCallback(async (signal?: AbortSignal) => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setErrorMessage("请先登录后查看历史对话");
      setLoadState("error");
      setHistory([]);
      return;
    }

    setLoadState("loading");
    setErrorMessage(null);
    try {
      const mode: ChatMode = "tutor";
      window.localStorage.setItem(modeKey, mode);
      const res = await fetch(`${apiBase}/ai/chat/history?mode=${mode}&scope=history`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });

      if (res.status === 401) {
        window.localStorage.removeItem(sessionKey);
        setErrorMessage("登录已过期，请重新登录");
        setLoadState("error");
        setHistory([]);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "加载历史失败");
      }

      const messages = Array.isArray(data.messages) ? (data.messages as ChatMessage[]) : [];
      setHistory(buildHistoryItems(messages));
      setLoadState("idle");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setErrorMessage(err instanceof Error ? err.message : "加载历史失败");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadHistory(controller.signal);
    return () => controller.abort();
  }, [loadHistory]);

  const handleSelectHistory = (item: HistoryItem) => {
    const mode: ChatMode = "tutor";
    window.localStorage.setItem(modeKey, mode);
    upsertConversationMarker(mode, item.startAt);
    window.localStorage.setItem(conversationStartKey, item.startAt);
    window.localStorage.setItem(conversationKey, item.startAt);
    window.localStorage.setItem(conversationModeKey, mode);
    router.push("/chat");
  };

  const filteredHistory = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) {
      return history;
    }
    return history.filter((item) => {
      const text = `${item.title} ${item.preview} ${item.answerPreview} ${formatHistoryTime(
        item.createdAt
      )}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [history, searchKeyword]);

  const totalMessages = useMemo(
    () => history.reduce((sum, item) => sum + item.messageCount, 0),
    [history]
  );
  const isLoginError = Boolean(errorMessage?.includes("登录"));

  return (
    <main className="main mobile-chat-history-page">
      <div className="chat-history-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => router.back()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1>历史对话</h1>
        <button
          type="button"
          className="chat-history-refresh-btn"
          onClick={() => void loadHistory()}
          disabled={loadState === "loading"}
          aria-label="刷新历史对话"
          title="刷新历史对话"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
          </svg>
        </button>
      </div>

      <div className="chat-history-content">
        {loadState === "loading" && (
          <div className="chat-history-loading" aria-label="正在加载历史对话">
            <div className="chat-history-loading-line wide" />
            <div className="chat-history-loading-line" />
            <div className="chat-history-loading-line short" />
          </div>
        )}

        {loadState === "error" && (
          <div className="chat-history-error">
            <p>{errorMessage}</p>
            {isLoginError ? (
              <Link href="/login" className="primary button-link">
                去登录
              </Link>
            ) : (
              <button type="button" className="primary" onClick={() => void loadHistory()}>
                重新加载
              </button>
            )}
          </div>
        )}

        {loadState === "idle" && history.length === 0 && (
          <div className="chat-history-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p>暂无历史消息</p>
            <Link href="/chat" className="primary button-link">
              开始对话
            </Link>
          </div>
        )}

        {loadState === "idle" && history.length > 0 && (
          <>
            <section className="chat-history-summary" aria-label="历史对话概览">
              <div>
                <span>会话</span>
                <strong>{history.length}</strong>
              </div>
              <div>
                <span>消息</span>
                <strong>{totalMessages}</strong>
              </div>
              <div>
                <span>最近</span>
                <strong>{formatHistoryTime(history[0].createdAt)}</strong>
              </div>
            </section>

            <label className="chat-history-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="搜索提问、回答或时间"
                aria-label="搜索历史对话"
              />
              {searchKeyword ? (
                <button
                  type="button"
                  onClick={() => setSearchKeyword("")}
                  aria-label="清空搜索"
                >
                  清空
                </button>
              ) : null}
            </label>

            {filteredHistory.length === 0 ? (
              <div className="chat-history-empty chat-history-search-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <p>没有找到相关会话</p>
                <button type="button" className="ghost" onClick={() => setSearchKeyword("")}>
                  清空搜索
                </button>
              </div>
            ) : (
              <div className="chat-history-list">
                {filteredHistory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="chat-history-item"
                    onClick={() => handleSelectHistory(item)}
                  >
                    <div className="history-item-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div className="history-item-content">
                      <div className="history-item-title-row">
                        <div className="history-item-title">{item.title || "未命名提问"}</div>
                        <span className="history-item-count">{item.messageCount} 条</span>
                      </div>
                      <p className="history-item-preview">{item.preview}</p>
                      {item.answerPreview ? (
                        <p className="history-item-answer">{item.answerPreview}</p>
                      ) : null}
                      <span className="history-item-time">
                        {formatHistoryTime(item.createdAt)}
                      </span>
                    </div>
                    <svg
                      className="history-item-arrow"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
