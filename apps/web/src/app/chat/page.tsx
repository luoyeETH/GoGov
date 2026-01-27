"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  buildConversationSessions,
  conversationKey,
  conversationModeKey,
  conversationStartKey,
  getLatestSessionStart,
  loadConversationMarkers,
  resolveSessionStartFromKey,
  selectActiveSession,
  upsertConversationMarker
} from "./conversations";

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
  imageUrl?: string | null;
};

type AuthState = "loading" | "authed" | "anon";
type RequestState = "idle" | "loading" | "error";

function getInitialChatMode(): ChatMode {
  if (typeof window === "undefined") {
    return "tutor";
  }
  const storedMode = window.localStorage.getItem(modeKey);
  if (storedMode === "planner" || storedMode === "tutor") {
    return storedMode;
  }
  return "tutor";
}

type HistoryItem = {
  id: string;
  title: string;
  createdAt: string;
};

function countUserTurns(messages: ChatMessage[]): number {
  return messages.reduce((count, message) => (message.role === "user" ? count + 1 : count), 0);
}

async function fileToDataUrl(file: File): Promise<string> {
  const readAsDataUrl = () =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === "string" ? reader.result : "");
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const rawDataUrl = await readAsDataUrl();
  if (!rawDataUrl) {
    throw new Error("图片读取失败");
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片解析失败"));
    img.src = rawDataUrl;
  });

  const maxSize = 1024;
  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
  if (ratio >= 1) {
    return rawDataUrl;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * ratio));
  canvas.height = Math.max(1, Math.round(image.height * ratio));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return rawDataUrl;
  }
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
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
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationStartAt, setConversationStartAt] = useState<string | null>(null);
  const [needsFreshSend, setNeedsFreshSend] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatModeRef = useRef<ChatMode>(chatMode);
  const historyRequestIdRef = useRef(0);
  const sendRequestIdRef = useRef(0);
  const imageCacheRef = useRef<Map<string, string>>(new Map());

  const scrollToBottom = () => {
    if (listRef.current) {
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      });
    }
  };

  const attachCachedImages = (history: ChatMessage[]) =>
    history.map((message) => {
      if (message.role !== "user") {
        return message;
      }
      const cached = imageCacheRef.current.get(message.id);
      if (cached && !message.imageUrl) {
        return { ...message, imageUrl: cached };
      }
      if (message.imageUrl) {
        imageCacheRef.current.set(message.id, message.imageUrl);
      }
      return message;
    });

  const loadHistory = async (
    mode: ChatMode = chatMode,
    options?: { conversationId?: string | null; conversationStartAt?: string | null }
  ) => {
    const requestId = historyRequestIdRef.current + 1;
    historyRequestIdRef.current = requestId;
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setHistoryState("error");
      setHistoryMessage("请先登录后使用 AI 对话。");
      setHistoryCount(0);
      setActiveConversationId(null);
      return;
    }
    setHistoryState("loading");
    setHistoryMessage(null);
    const conversationId = options?.conversationId ?? null;
    const preferredStartAt = options?.conversationStartAt ?? conversationStartAt;
    try {
      if (mode === "tutor") {
        const fullRes = await fetch(`${apiBase}/ai/chat/history?mode=${mode}&scope=history`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (fullRes.status === 401) {
          window.localStorage.removeItem(sessionKey);
          setAuthState("anon");
          setMessages([]);
          return;
        }

        const fullData = await fullRes.json();
        if (!fullRes.ok) {
          throw new Error(fullData?.error ?? "加载对话失败");
        }
        if (historyRequestIdRef.current !== requestId || chatModeRef.current !== mode) {
          return;
        }

        const fullMessages = Array.isArray(fullData.messages)
          ? (fullData.messages as ChatMessage[])
          : [];
        let markers = loadConversationMarkers(mode);
        if (preferredStartAt) {
          markers = upsertConversationMarker(mode, preferredStartAt);
        }
        const sessions = buildConversationSessions(fullMessages, markers);
        const nonEmptySessions = sessions.filter((session) => session.messages.length > 0);
        setHistoryCount(nonEmptySessions.length);

        const resolvedStartFromId = resolveSessionStartFromKey(conversationId, sessions);
        const latestMarkerStart = getLatestSessionStart(mode);
        const effectivePreferredStart = resolvedStartFromId ?? preferredStartAt ?? latestMarkerStart;
        const activeSession = selectActiveSession(sessions, effectivePreferredStart);
        const activeStartAt = activeSession?.startAt ?? null;

        let updatedMarkers = markers;
        if (activeStartAt) {
          updatedMarkers = upsertConversationMarker(mode, activeStartAt);
          window.localStorage.setItem(conversationStartKey, activeStartAt);
        } else {
          window.localStorage.removeItem(conversationStartKey);
        }

        const latestMarkerAfterUpdate = updatedMarkers.length
          ? updatedMarkers[updatedMarkers.length - 1]
          : activeStartAt;
        const isHistorySelection =
          Boolean(resolvedStartFromId) && activeStartAt !== latestMarkerAfterUpdate;

        setActiveConversationId(isHistorySelection ? activeStartAt : null);
        setConversationStartAt(activeStartAt);
        setMessages(attachCachedImages(activeSession?.messages ?? []));
        setHistoryState("idle");
        setTimeout(scrollToBottom, 80);
        return;
      }

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
      if (historyRequestIdRef.current !== requestId || chatModeRef.current !== mode) {
        return;
      }
      const history = Array.isArray(data.messages) ? data.messages : [];
      setMessages(attachCachedImages(history));
      setHistoryCount(countUserTurns(history));
      setHistoryState("idle");
      setActiveConversationId(null);
      // 加载完成后滚动到底部
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      if (historyRequestIdRef.current !== requestId || chatModeRef.current !== mode) {
        return;
      }
      setHistoryState("error");
      setHistoryMessage(err instanceof Error ? err.message : "加载对话失败");
    }
  };

  useEffect(() => {
    const token = window.localStorage.getItem(sessionKey);
    if (token) {
      setAuthState("authed");
    } else {
      setAuthState("anon");
    }
  }, []);

  useEffect(() => {
    if (authState !== "authed") {
      return;
    }
    chatModeRef.current = chatMode;
    window.localStorage.setItem(modeKey, chatMode);
    const conversationMode = window.localStorage.getItem(conversationModeKey);
    const modeMatches = !conversationMode || conversationMode === chatMode;
    const conversationSelectionKey = modeMatches
      ? window.localStorage.getItem(conversationKey)
      : null;
    const storedStartAt = modeMatches ? window.localStorage.getItem(conversationStartKey) : null;
    if (conversationSelectionKey && modeMatches) {
      window.localStorage.removeItem(conversationKey);
      window.localStorage.removeItem(conversationModeKey);
      setNeedsFreshSend(false);
    }
    void loadHistory(chatMode, {
      conversationId: conversationSelectionKey,
      conversationStartAt: storedStartAt
    });
  }, [chatMode, authState]);

  useEffect(() => {
    if (chatMode === "tutor") {
      return;
    }
    if (conversationStartAt) {
      setConversationStartAt(null);
    }
    if (needsFreshSend) {
      setNeedsFreshSend(false);
    }
  }, [chatMode, conversationStartAt, needsFreshSend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    const imageDataUrl = selectedImageDataUrl;
    if ((!text && !imageDataUrl) || requestState === "loading") {
      return;
    }
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setHistoryMessage("请先登录后使用 AI 对话。");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const replyId = `${tempId}-reply`;
    const sendId = sendRequestIdRef.current + 1;
    sendRequestIdRef.current = sendId;
    const messageContent = imageDataUrl && !text ? "请看图" : text;
    let effectiveStartAt = conversationStartAt;
    let forceFreshSend = needsFreshSend;
    let shouldClearMessages = false;

    if (chatMode === "tutor") {
      const markers = loadConversationMarkers("tutor");
      const latestMarker = markers.length ? markers[markers.length - 1] : null;
      const inHistoryView = Boolean(activeConversationId) && activeConversationId !== latestMarker;

      if (inHistoryView) {
        const freshStartAt = new Date().toISOString();
        upsertConversationMarker("tutor", freshStartAt);
        window.localStorage.setItem(conversationStartKey, freshStartAt);
        effectiveStartAt = freshStartAt;
        forceFreshSend = true;
        shouldClearMessages = true;
        setConversationStartAt(freshStartAt);
        setActiveConversationId(null);
        setNeedsFreshSend(true);
      }

      if (!effectiveStartAt) {
        const fallbackFromMessages = messages[0]?.createdAt ?? latestMarker;
        effectiveStartAt = fallbackFromMessages ?? new Date().toISOString();
        upsertConversationMarker("tutor", effectiveStartAt);
        window.localStorage.setItem(conversationStartKey, effectiveStartAt);
        setConversationStartAt(effectiveStartAt);
      }
    }

    if (shouldClearMessages) {
      setMessages([]);
    }

    const isFreshSend = chatMode === "tutor" && forceFreshSend;
    const contextSince = chatMode === "tutor" ? effectiveStartAt : null;
    const userMsg: ChatMessage = {
      id: tempId,
      role: "user",
      content: messageContent,
      createdAt: new Date().toISOString(),
      imageUrl: imageDataUrl
    };
    const assistantMsg: ChatMessage = {
      id: replyId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      pending: true
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setSelectedImageDataUrl(null);
    setActiveConversationId(null);
    setRequestState("loading");

    try {
      const res = await fetch(`${apiBase}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageContent,
          mode: chatMode,
          imageDataUrl: imageDataUrl ?? undefined,
          fresh: isFreshSend || undefined,
          contextSince: contextSince ?? undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "发送失败");
      }
      if (sendRequestIdRef.current !== sendId || chatModeRef.current !== chatMode) {
        return;
      }
      // API returns: { answer, model, messages: [userRecord, assistantRecord] }
      const userRecord = data.messages?.[0];
      const assistantRecord = data.messages?.[1];
      if (imageDataUrl && userRecord?.id) {
        imageCacheRef.current.set(userRecord.id, imageDataUrl);
      }
      const returnedMessages: ChatMessage[] = Array.isArray(data.messages)
        ? (data.messages as ChatMessage[])
        : [];
      const withImages = attachCachedImages(
        returnedMessages.map((message) => {
          if (imageDataUrl && message.id === userRecord?.id) {
            return { ...message, imageUrl: imageDataUrl };
          }
          return message;
        })
      );
      setMessages((prev) => {
        const withoutPending = prev.filter(
          (msg) => msg.id !== tempId && msg.id !== replyId
        );
        return [...withoutPending, ...withImages];
      });
      if (chatMode === "tutor") {
        setHistoryCount((prev) => prev + 1);
      }
      if (isFreshSend) {
        setNeedsFreshSend(false);
      }
      setRequestState("idle");
    } catch (err) {
      if (sendRequestIdRef.current !== sendId || chatModeRef.current !== chatMode) {
        return;
      }
      setMessages((prev) => {
        const failedMessages = prev.map((msg) => {
          if (msg.id === replyId) {
            return {
              ...msg,
              content: "发送失败，请重试",
              pending: false,
              failed: true
            };
          }
          return msg;
        });
        return attachCachedImages(failedMessages);
      });
      setInput(text);
      setSelectedImageDataUrl(imageDataUrl);
      setRequestState("error");
    }
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    event.target.value = "";
    try {
      const dataUrl = await fileToDataUrl(file);
      setSelectedImageDataUrl(dataUrl);
      setRequestState("idle");
    } catch (err) {
      setHistoryMessage(err instanceof Error ? err.message : "图片处理失败");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleHistoryClick = () => {
    if (chatMode !== "tutor") {
      setChatMode("tutor");
      window.localStorage.setItem(modeKey, "tutor");
    }
    setConversationStartAt(null);
    setNeedsFreshSend(false);
    router.push("/chat/history");
  };

  const handleExitHistoryView = () => {
    const latestStartAt = chatMode === "tutor" ? getLatestSessionStart("tutor") : null;
    setActiveConversationId(null);
    setNeedsFreshSend(false);
    if (latestStartAt) {
      setConversationStartAt(latestStartAt);
      window.localStorage.setItem(conversationStartKey, latestStartAt);
    } else {
      setConversationStartAt(null);
      window.localStorage.removeItem(conversationStartKey);
    }
    window.localStorage.removeItem(conversationKey);
    window.localStorage.removeItem(conversationModeKey);
    void loadHistory(chatMode, { conversationStartAt: latestStartAt });
  };

  const handleNewConversation = () => {
    if (chatMode !== "tutor" || requestState === "loading") {
      return;
    }
    const startAt = new Date().toISOString();
    upsertConversationMarker("tutor", startAt);
    setActiveConversationId(null);
    setConversationStartAt(startAt);
    setNeedsFreshSend(true);
    setMessages([]);
    setInput("");
    setSelectedImageDataUrl(null);
    setRequestState("idle");
    setHistoryMessage(null);
    window.localStorage.setItem(conversationStartKey, startAt);
    window.localStorage.removeItem(conversationKey);
    window.localStorage.removeItem(conversationModeKey);
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

  const canSend =
    requestState !== "loading" && (input.trim().length > 0 || selectedImageDataUrl !== null);

  return (
    <main className="main mobile-chat-page">
      {/* Header */}
      <div className="mobile-chat-header">
        {chatMode === "tutor" ? (
          <button
            type="button"
            className="mobile-chat-action-btn"
            onClick={handleNewConversation}
            title="新建对话"
            aria-label="新建对话"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>新建</span>
          </button>
        ) : (
          <div className="mobile-chat-header-spacer" />
        )}
        <div className="mobile-chat-mode-switch">
          <button
            type="button"
            className={chatMode === "tutor" ? "active" : ""}
            onClick={() => setChatMode("tutor")}
          >
            导师 AI
          </button>
          <button
            type="button"
            className={chatMode === "planner" ? "active" : ""}
            onClick={() => setChatMode("planner")}
          >
            规划 AI
          </button>
        </div>

        {chatMode === "tutor" ? (
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
          </button>
        ) : (
          <div className="mobile-chat-header-spacer" />
        )}
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

      {activeConversationId ? (
        <div className="mobile-chat-history-banner">
          <span>正在查看历史会话</span>
          <button type="button" onClick={handleExitHistoryView}>
            返回当前
          </button>
        </div>
      ) : null}

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
            <div key={msg.id} className={`mobile-chat-row ${msg.role}`}>
              <div
                className={`mobile-chat-bubble ${msg.role} ${
                  msg.pending ? "pending" : ""
                } ${msg.failed ? "failed" : ""}`}
              >
                {msg.imageUrl?.startsWith("data:image") ? (
                  <img
                    src={msg.imageUrl}
                    alt="上传的图片"
                    className="mobile-chat-image"
                  />
                ) : null}
                {msg.role === "assistant" ? (
                  msg.pending ? (
                    <span className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )
                ) : msg.content.trim() && msg.content.trim() !== "请看图" ? (
                  <p className="mobile-chat-image-caption">{msg.content}</p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="mobile-chat-input-area">
        {selectedImageDataUrl ? (
          <div className="mobile-chat-image-preview">
            <img src={selectedImageDataUrl} alt="已选择的图片" />
            <div className="mobile-chat-image-preview-text">已选择图片，可补充问题</div>
            <button
              type="button"
              className="mobile-chat-image-remove"
              onClick={() => setSelectedImageDataUrl(null)}
              aria-label="移除图片"
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="mobile-chat-input-row">
          <button
            type="button"
            className="mobile-chat-photo-btn"
            onClick={handlePhotoUpload}
            title="拍照/上传图片"
            disabled={requestState === "loading"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedImageDataUrl ? "可补充问题，或直接发送" : "输入消息..."}
            rows={1}
            disabled={requestState === "loading"}
          />
          <button
            type="button"
            className="mobile-chat-send-btn"
            onClick={sendMessage}
            disabled={!canSend}
            aria-label="发送"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}
