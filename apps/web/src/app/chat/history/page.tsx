"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

type HistoryItem = {
  id: string;
  mode: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

type LoadState = "idle" | "loading" | "error";

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
        // 加载两种模式的历史
        const [plannerRes, tutorRes] = await Promise.all([
          fetch(`${apiBase}/ai/chat/history?mode=planner`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${apiBase}/ai/chat/history?mode=tutor`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const plannerData = await plannerRes.json();
        const tutorData = await tutorRes.json();

        const allHistory: HistoryItem[] = [];

        // 从 planner 消息中提取会话
        if (plannerData.messages?.length > 0) {
          const firstMsg = plannerData.messages[0];
          allHistory.push({
            id: "planner",
            mode: "planner",
            preview: firstMsg.content?.slice(0, 50) || "规划 AI 对话",
            messageCount: plannerData.messages.length,
            createdAt: plannerData.messages[plannerData.messages.length - 1]?.createdAt || new Date().toISOString(),
            updatedAt: firstMsg.createdAt || new Date().toISOString()
          });
        }

        if (tutorData.messages?.length > 0) {
          const firstMsg = tutorData.messages[0];
          allHistory.push({
            id: "tutor",
            mode: "tutor",
            preview: firstMsg.content?.slice(0, 50) || "导师 AI 对话",
            messageCount: tutorData.messages.length,
            createdAt: tutorData.messages[tutorData.messages.length - 1]?.createdAt || new Date().toISOString(),
            updatedAt: firstMsg.createdAt || new Date().toISOString()
          });
        }

        // 按更新时间排序
        allHistory.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        setHistory(allHistory);
        setLoadState("idle");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "加载历史失败");
        setLoadState("error");
      }
    };

    loadHistory();
  }, []);

  const handleSelectHistory = (item: HistoryItem) => {
    // 保存选择的模式，然后返回聊天页面
    window.localStorage.setItem("gogov_ai_chat_mode", item.mode);
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
            <p>暂无历史对话</p>
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
                  <div className="history-item-title">
                    {item.mode === "planner" ? "规划 AI" : "导师 AI"}
                    <span className="history-item-count">{item.messageCount} 条消息</span>
                  </div>
                  <p className="history-item-preview">{item.preview}</p>
                  <span className="history-item-time">
                    {new Date(item.updatedAt).toLocaleString("zh-CN", {
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
