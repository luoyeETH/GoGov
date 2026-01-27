"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

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
  pending?: boolean;
  failed?: boolean;
};

type AuthState = "loading" | "authed" | "anon";
type RequestState = "idle" | "loading" | "error";

function getInitialChatMode(): ChatMode {
  if (typeof window === "undefined") {
    return "planner";
  }
  const storedMode = window.localStorage.getItem(modeKey);
  if (storedMode === "planner" || storedMode === "tutor") {
    return storedMode;
  }
  return "planner";
}

export default function MobileChatPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyState, setHistoryState] = useState<RequestState>("idle");
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [input, setInput] = useState("");
  const [chatMode, setChatMode] = useState<ChatMode>(() => getInitialChatMode());
  const [historyCount, setHistoryCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatModeRef = useRef<ChatMode>(chatMode);

  const scrollToBottom = () => {
    if (listRef.current) {
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      });
    }
  };

  const loadHistory = async (mode: ChatMode = chatMode) => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setHistoryState("error");
      setHistoryMessage("请先登录后使用 AI 对话。");
      setHistoryCount(0);
      return;
    }
    setHistoryState("loading");
    setHistoryMessage(null);
    try {
      const res = await fetch(`${apiBase}/ai/chat/history?mode=${mode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        window.localStorage.removeItem(sessionKey);
        setAuthState("anon");
        setMessages([]);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "加载对话失败");
      }
      if (chatModeRef.current !== mode) {
        return;
      }
      const history = Array.isArray(data.messages) ? data.messages : [];
      setMessages(history);
      setHistoryCount(data.historyCount ?? 0);
      setHistoryState("idle");
      // 加载完成后滚动到底部
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setHistoryState("error");
      setHistoryMessage(err instanceof Error ? err.message : "加载对话失败");
    }
  };

  useEffect(() => {
    const token = window.localStorage.getItem(sessionKey);
    if (token) {
      setAuthState("authed");
      loadHistory();
    } else {
      setAuthState("anon");
    }
  }, []);

  useEffect(() => {
    chatModeRef.current = chatMode;
    window.localStorage.setItem(modeKey, chatMode);
    loadHistory(chatMode);
  }, [chatMode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || requestState === "loading") {
      return;
    }
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setHistoryMessage("请先登录后使用 AI 对话。");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString()
    };
    const assistantMsg: ChatMessage = {
      id: `${tempId}-reply`,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      pending: true
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setRequestState("loading");

    try {
      const res = await fetch(`${apiBase}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: text, mode: chatMode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "发送失败");
      }
      // API returns: { answer, model, messages: [userRecord, assistantRecord] }
      const userRecord = data.messages?.[0];
      const assistantRecord = data.messages?.[1];
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === tempId && userRecord?.id) {
            return { ...msg, id: userRecord.id };
          }
          if (msg.id === `${tempId}-reply`) {
            return {
              ...msg,
              id: assistantRecord?.id ?? msg.id,
              content: data.answer ?? assistantRecord?.content ?? "",
              pending: false
            };
          }
          return msg;
        })
      );
      setRequestState("idle");
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === `${tempId}-reply`
            ? { ...msg, content: "发送失败，请重试", pending: false, failed: true }
            : msg
        )
      );
      setRequestState("error");
    }
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";

    const reader = new FileReader();
    reader.onload = () => {
      setInput((prev) => prev + `\n[图片已上传，请分析图片内容]`);
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleHistoryClick = () => {
    router.push("/chat/history");
  };

  if (authState === "anon") {
    return (
      <main className="main mobile-chat-page">
        <div className="mobile-chat-auth">
          <p>请先登录后使用 AI 对话</p>
          <Link href="/login" className="primary button-link">
            去登录
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="main mobile-chat-page">
      {/* Header */}
      <div className="mobile-chat-header">
        <button
          type="button"
          className="mobile-chat-action-btn"
          onClick={handlePhotoUpload}
          title="拍照/上传图片"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>拍照</span>
        </button>

        <div className="mobile-chat-mode-switch">
          <button
            type="button"
            className={chatMode === "planner" ? "active" : ""}
            onClick={() => setChatMode("planner")}
          >
            规划 AI
          </button>
          <button
            type="button"
            className={chatMode === "tutor" ? "active" : ""}
            onClick={() => setChatMode("tutor")}
          >
            导师 AI
          </button>
        </div>

        <button
          type="button"
          className="mobile-chat-action-btn"
          onClick={handleHistoryClick}
          title="历史对话"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>历史</span>
          {historyCount > 0 && <span className="action-badge">{historyCount}</span>}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Messages */}
      <div className="mobile-chat-messages" ref={listRef}>
        {historyState === "loading" ? (
          <div className="mobile-chat-loading">加载中...</div>
        ) : messages.length === 0 ? (
          <div className="mobile-chat-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="empty-title">
              {chatMode === "planner" ? "规划 AI" : "导师 AI"}
            </p>
            <p className="empty-desc">
              {chatMode === "planner"
                ? "帮你制定学习计划、分析岗位选择"
                : "帮你解答题目、分析错因"}
            </p>
            <p className="empty-hint">发送消息开始对话</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mobile-chat-bubble ${msg.role} ${msg.pending ? "pending" : ""} ${msg.failed ? "failed" : ""}`}
            >
              {msg.role === "assistant" ? (
                msg.pending ? (
                  <span className="typing-indicator">
                    <span></span><span></span><span></span>
                  </span>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="mobile-chat-input-area">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          rows={1}
        />
        <button
          type="button"
          className="mobile-chat-send-btn"
          onClick={sendMessage}
          disabled={!input.trim() || requestState === "loading"}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </main>
  );
}
