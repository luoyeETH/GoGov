"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
      createdAt: session.startAt
    }))
    .reverse();
}

export default function ChatHistoryPage() {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const token = window.localStorage.getItem(sessionKey);
      if (!token) {
        setErrorMessage("请先登录后查看历史对话");
        setLoadState("error");
        return;
      }

      setLoadState("loading");
      try {
        const mode: ChatMode = "tutor";
        window.localStorage.setItem(modeKey, mode);
        const res = await fetch(`${apiBase}/ai/chat/history?mode=${mode}&scope=history`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          window.localStorage.removeItem(sessionKey);
          setErrorMessage("登录已过期，请重新登录");
          setLoadState("error");
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error ?? "加载历史失败");
        }

        const messages = Array.isArray(data.messages)
          ? (data.messages as ChatMessage[])
          : [];
        setHistory(buildHistoryItems(messages));
        setLoadState("idle");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "加载历史失败");
        setLoadState("error");
      }
    };

    loadHistory();
  }, []);

  const handleSelectHistory = (item: HistoryItem) => {
    const mode: ChatMode = "tutor";
    window.localStorage.setItem(modeKey, mode);
    upsertConversationMarker(mode, item.startAt);
    window.localStorage.setItem(conversationStartKey, item.startAt);
    window.localStorage.setItem(conversationKey, item.startAt);
    window.localStorage.setItem(conversationModeKey, mode);
    router.push("/chat");
  };

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
        <div style={{ width: 40 }} />
      </div>

      <div className="chat-history-content">
        {loadState === "loading" && (
          <div className="chat-history-loading">加载中...</div>
        )}

        {loadState === "error" && (
          <div className="chat-history-error">
            <p>{errorMessage}</p>
            {errorMessage?.includes("登录") && (
              <Link href="/login" className="primary button-link">
                去登录
              </Link>
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
          <div className="chat-history-list">
            {history.map((item) => (
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
                  <div className="history-item-title">{item.title || "未命名提问"}</div>
                  <span className="history-item-time">
                    {new Date(item.createdAt).toLocaleString("zh-CN", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <svg className="history-item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
