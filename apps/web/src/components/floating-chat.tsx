"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
const positionKey = "gogov_ai_chat_position";
const openKey = "gogov_ai_chat_open";
const modeKey = "gogov_ai_chat_mode";
const buttonSize = 56;
const boundaryPadding = 16;

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

type Position = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDefaultPosition() {
  return {
    x: window.innerWidth - buttonSize - boundaryPadding,
    y: window.innerHeight - buttonSize - boundaryPadding
  };
}

function clampPosition(position: Position) {
  return {
    x: clamp(
      position.x,
      boundaryPadding,
      window.innerWidth - buttonSize - boundaryPadding
    ),
    y: clamp(
      position.y,
      boundaryPadding,
      window.innerHeight - buttonSize - boundaryPadding
    )
  };
}

export default function FloatingChat() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyState, setHistoryState] = useState<RequestState>("idle");
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [position, setPosition] = useState<Position | null>(null);
  const [alignRight, setAlignRight] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("planner");
  const [historyCount, setHistoryCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatModeRef = useRef<ChatMode>("planner");
  const historyRequestIdRef = useRef(0);
  const modeChangeTokenRef = useRef(0);
  const dragState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false
  });
  const skipClickRef = useRef(false);
  const scrollLockRef = useRef<{ body: string; html: string } | null>(null);

  const loadHistory = async (mode: ChatMode = chatMode) => {
    const requestId = historyRequestIdRef.current + 1;
    historyRequestIdRef.current = requestId;
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
        setIsOpen(false);
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
      setMessages(history);
      setHistoryCount(history.length);
      setHistoryState("idle");
    } catch (err) {
      if (historyRequestIdRef.current !== requestId || chatModeRef.current !== mode) {
        return;
      }
      setHistoryState("error");
      setHistoryMessage(err instanceof Error ? err.message : "加载对话失败");
      setHistoryCount(0);
    }
  };

  const checkAuth = async () => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setAuthState("anon");
      setMessages([]);
      setHistoryCount(0);
      setIsOpen(false);
      return;
    }
    setAuthState("loading");
    try {
      const res = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("未登录");
      }
      setAuthState("authed");
    } catch (_err) {
      window.localStorage.removeItem(sessionKey);
      setAuthState("anon");
      setMessages([]);
      setHistoryCount(0);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedPosition = window.localStorage.getItem(positionKey);
    if (storedPosition) {
      try {
        const parsed = JSON.parse(storedPosition) as Position;
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(clampPosition(parsed));
        } else {
          setPosition(getDefaultPosition());
        }
      } catch {
        setPosition(getDefaultPosition());
      }
    } else {
      setPosition(getDefaultPosition());
    }
    const storedOpen = window.localStorage.getItem(openKey);
    if (storedOpen === "1") {
      setIsOpen(true);
    }
    const storedMode = window.localStorage.getItem(modeKey);
    if (storedMode === "planner" || storedMode === "tutor") {
      setChatMode(storedMode);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }
    const updateViewport = () => {
      const viewport = window.visualViewport;
      if (!viewport) {
        return;
      }
      const visualBottom = viewport.height + viewport.offsetTop;
      const offset = Math.max(0, window.innerHeight - visualBottom);
      setKeyboardOffset(offset);
      document.documentElement.style.setProperty(
        "--floating-chat-viewport-height",
        `${viewport.height}px`
      );
    };
    updateViewport();
    window.visualViewport.addEventListener("resize", updateViewport);
    window.visualViewport.addEventListener("scroll", updateViewport);
    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
      document.documentElement.style.removeProperty("--floating-chat-viewport-height");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(hover: none) and (pointer: coarse)");
    const updateMobile = () => setIsMobile(media.matches);
    updateMobile();
    if (media.addEventListener) {
      media.addEventListener("change", updateMobile);
    } else {
      media.addListener(updateMobile);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", updateMobile);
      } else {
        media.removeListener(updateMobile);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && isMobile && !isFullscreen) {
      setIsFullscreen(true);
    }
  }, [isOpen, isMobile, isFullscreen]);

  useEffect(() => {
    void checkAuth();
    const handleAuthChange = () => {
      void checkAuth();
    };
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  useEffect(() => {
    if (!position || typeof window === "undefined") {
      return;
    }
    setAlignRight(position.x > window.innerWidth / 2);
  }, [position]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (!isFullscreen) {
      if (scrollLockRef.current) {
        document.body.style.overflow = scrollLockRef.current.body;
        document.documentElement.style.overflow = scrollLockRef.current.html;
        scrollLockRef.current = null;
      }
      return;
    }
    if (!scrollLockRef.current) {
      scrollLockRef.current = {
        body: document.body.style.overflow,
        html: document.documentElement.style.overflow
      };
    }
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      if (!scrollLockRef.current) {
        return;
      }
      document.body.style.overflow = scrollLockRef.current.body;
      document.documentElement.style.overflow = scrollLockRef.current.html;
      scrollLockRef.current = null;
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(openKey, isOpen ? "1" : "0");
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(modeKey, chatMode);
    chatModeRef.current = chatMode;
    modeChangeTokenRef.current += 1;
  }, [chatMode]);

  useEffect(() => {
    if (authState !== "authed") {
      return;
    }
    setMessages([]);
    setHistoryCount(0);
    setHistoryState("loading");
    setHistoryMessage(null);
    setRequestState("idle");
    setRequestMessage(null);
    setInput("");
    void loadHistory(chatMode);
  }, [chatMode, authState]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen, requestState]);

  const toggleOpen = () => {
    setIsOpen((prev) => {
      if (prev) {
        setIsFullscreen(false);
      }
      return !prev;
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    if (isMobile) {
      return;
    }
    setIsFullscreen((prev) => !prev);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!position) {
      return;
    }
    dragState.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.userSelect = "none";
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragState.current.active) {
      return;
    }
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragState.current.moved = true;
    }
    const nextPosition = clampPosition({
      x: dragState.current.originX + dx,
      y: dragState.current.originY + dy
    });
    setPosition(nextPosition);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragState.current.active) {
      return;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    document.body.style.userSelect = "";
    const moved = dragState.current.moved;
    dragState.current.active = false;
    if (position) {
      window.localStorage.setItem(positionKey, JSON.stringify(position));
    }
    if (!moved) {
      skipClickRef.current = true;
      toggleOpen();
    } else {
      skipClickRef.current = true;
    }
  };

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragState.current.active) {
      return;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    document.body.style.userSelect = "";
    dragState.current.active = false;
  };

  const handleButtonClick = () => {
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    toggleOpen();
  };

  const handleSend = async () => {
    if (requestState === "loading") {
      return;
    }
    const content = input.trim();
    if (!content) {
      setRequestMessage("请输入问题。");
      setRequestState("error");
      return;
    }
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setRequestMessage("请先登录后再使用 AI 对话。");
      setRequestState("error");
      setAuthState("anon");
      return;
    }
    const pendingId = `pending-${Date.now()}`;
    const activeMode = chatMode;
    const modeToken = modeChangeTokenRef.current;
    const pendingMessage: ChatMessage = {
      id: pendingId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      pending: true
    };
    setMessages((prev) => [...prev, pendingMessage]);
    setInput("");
    setRequestState("loading");
    setRequestMessage(null);

    try {
      const res = await fetch(`${apiBase}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: content, mode: activeMode })
      });
      if (modeChangeTokenRef.current !== modeToken || chatModeRef.current !== activeMode) {
        return;
      }
      if (res.status === 401) {
        window.localStorage.removeItem(sessionKey);
        setAuthState("anon");
        setMessages([]);
        setIsOpen(false);
        return;
      }
      if (!res.ok) {
        let errorMessage = "答疑失败";
        try {
          const data = await res.json();
          errorMessage = data?.error ?? errorMessage;
        } catch {
          errorMessage = "答疑失败";
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      const newMessages = Array.isArray(data.messages) ? data.messages : [];
      if (modeChangeTokenRef.current !== modeToken || chatModeRef.current !== activeMode) {
        return;
      }
      setMessages((prev) => {
        const withoutPending = prev.filter((item) => item.id !== pendingId);
        return [...withoutPending, ...newMessages];
      });
      setRequestState("idle");
    } catch (err) {
      if (modeChangeTokenRef.current !== modeToken || chatModeRef.current !== activeMode) {
        return;
      }
      setRequestState("error");
      setRequestMessage(err instanceof Error ? err.message : "答疑失败");
      setInput(content);
      setMessages((prev) =>
        prev.map((item) =>
          item.id === pendingId ? { ...item, pending: false, failed: true } : item
        )
      );
    }
  };

  if (authState !== "authed" || !position) {
    return null;
  }

  const modeOptions: Array<{ value: ChatMode; label: string }> = [
    { value: "planner", label: "规划指导" },
    { value: "tutor", label: "行测申论答疑" }
  ];
  const headerTitle = chatMode === "planner" ? "AI 伴学" : "AI 行测申论";
  const headerSubtitle =
    chatMode === "planner"
      ? "记忆保留 30 天 / 100 条"
      : "不加载记忆 · 上下文 3 小时 / 100 条";
  const emptyTip =
    chatMode === "planner"
      ? "随时提问，我会结合你的备考数据。"
      : "直接发题目或解法，我给简短答疑。";
  const inputPlaceholder =
    chatMode === "planner" ? "输入问题，回车发送" : "输入题目/解法，回车发送";
  const showNewQuestionDivider =
    chatMode === "tutor" && historyCount > 0 && historyState === "idle";

  const panelClass = `floating-chat-panel${
    isFullscreen ? " is-fullscreen" : alignRight ? "" : " left"
  }`;
  const displayPosition =
    !isFullscreen && isOpen && keyboardOffset > 0
      ? {
          x: position.x,
          y: Math.max(boundaryPadding, position.y - keyboardOffset)
        }
      : position;

  return (
    <div
      className={`floating-chat${isFullscreen ? " is-fullscreen" : ""}`}
      style={{ left: displayPosition.x, top: displayPosition.y }}
    >
      {isOpen ? (
        <div
          className={panelClass}
          role="dialog"
          aria-label={chatMode === "planner" ? "AI 伴学对话" : "AI 答疑对话"}
        >
          <div className="floating-chat-header">
            <div>
              <strong>{headerTitle}</strong>
              <span>{headerSubtitle}</span>
            </div>
            <div className="floating-chat-header-actions">
              {!isMobile ? (
                <button
                  type="button"
                  className={`floating-chat-control${
                    isFullscreen ? " is-active" : ""
                  }`}
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "退出全屏" : "全屏"}
                >
                  {isFullscreen ? "退出全屏" : "全屏"}
                </button>
              ) : null}
              <button
                type="button"
                className="floating-chat-control"
                onClick={handleClose}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
          </div>
          <div className="floating-chat-messages" ref={listRef}>
            {historyState === "loading" ? (
              <div className="floating-chat-tip">正在载入对话...</div>
            ) : null}
            {historyState === "error" ? (
              <div className="floating-chat-tip">
                {historyMessage ?? "对话加载失败"}
              </div>
            ) : null}
            {!messages.length && historyState === "idle" ? (
              <div className="floating-chat-tip">{emptyTip}</div>
            ) : null}
            {messages.map((item, index) => (
              <Fragment key={item.id}>
                {showNewQuestionDivider && index === historyCount ? (
                  <div className="floating-chat-divider">新的提问</div>
                ) : null}
                <div
                  className={`floating-chat-message ${item.role}${
                    item.failed ? " failed" : ""
                  }`}
                >
                  {item.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {item.content}
                    </ReactMarkdown>
                  ) : (
                    <p>{item.content}</p>
                  )}
                  {item.pending ? (
                    <span className="floating-chat-meta">发送中...</span>
                  ) : null}
                </div>
              </Fragment>
            ))}
            {showNewQuestionDivider && historyCount === messages.length ? (
              <div className="floating-chat-divider">新的提问</div>
            ) : null}
            {requestState === "loading" ? (
              <div className="floating-chat-message assistant pending">
                AI 正在思考...
              </div>
            ) : null}
          </div>
          <div className="floating-chat-footer">
            <div className="floating-chat-mode">
              <span className="floating-chat-mode-label">模式</span>
              <div
                className="floating-chat-mode-toggle"
                role="tablist"
                aria-label="切换 AI 模式"
              >
                {modeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={chatMode === option.value}
                    className={`floating-chat-mode-button${
                      chatMode === option.value ? " is-active" : ""
                    }`}
                    onClick={() => setChatMode(option.value)}
                    disabled={requestState === "loading"}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="floating-chat-input">
              <textarea
                ref={inputRef}
                rows={2}
                placeholder={inputPlaceholder}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  if (requestMessage) {
                    setRequestMessage(null);
                    setRequestState("idle");
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <button
                type="button"
                className="primary floating-chat-send"
                onClick={() => void handleSend()}
                disabled={requestState === "loading"}
              >
                发送
              </button>
            </div>
          </div>
          {requestMessage ? (
            <div className="floating-chat-error">{requestMessage}</div>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        className={`floating-chat-button${isOpen ? " is-open" : ""}`}
        aria-label={chatMode === "planner" ? "打开 AI 伴学" : "打开 AI 答疑"}
        onClick={handleButtonClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 5.5C4 4.1 5.1 3 6.5 3h11C19.9 3 21 4.1 21 5.5v8c0 1.4-1.1 2.5-2.5 2.5H9.4l-3.9 3.3c-.4.4-1 .1-1-.4V16C4.2 15.8 4 15 4 14.5v-9ZM7 8h9v2H7V8Zm0 4h6v2H7v-2Z"
          />
        </svg>
      </button>
    </div>
  );
}
