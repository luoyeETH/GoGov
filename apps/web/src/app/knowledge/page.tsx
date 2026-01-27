"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import LoadingButton from "../../components/loading-button";
import {
  extractTextFromFile,
  extractTopics,
  normalizeOcrText
} from "../../lib/ocr";

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

type KnowledgeImport = {
  id: string;
  title: string;
  content: string;
  source: "ocr" | "document" | "manual" | "ai";
  topics?: string[];
  createdAt: string;
  updatedAt: string;
};

type OcrState = "idle" | "loading" | "error";
type RequestState = "idle" | "loading" | "error";

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

function deriveTitleFromFile(name: string) {
  const trimmed = name.replace(/\.[^/.]+$/, "").trim();
  if (trimmed) {
    return trimmed;
  }
  return `导入 ${formatDate(new Date().toISOString())}`;
}

export default function KnowledgePage() {
  const [imports, setImports] = useState<KnowledgeImport[]>([]);
  const [activeImportId, setActiveImportId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [importMode, setImportMode] = useState<"local" | "ai">("local");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<OcrState>("idle");
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [aiTopics, setAiTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const activeImport = useMemo(() => {
    return imports.find((item) => item.id === activeImportId) ?? null;
  }, [imports, activeImportId]);

  const topics = useMemo(() => {
    if (aiTopics.length) {
      return aiTopics;
    }
    return extractTopics(content);
  }, [aiTopics, content]);

  const normalizeTopicList = (list: string[]) => {
    const results: string[] = [];
    const seen = new Set<string>();
    for (const raw of list) {
      const token = raw.trim();
      if (!token || token.length > 20) {
        continue;
      }
      const key = token.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      results.push(token);
      if (results.length >= 24) {
        break;
      }
    }
    return results;
  };

  const hasUnsavedChanges = useMemo(() => {
    if (!content.trim()) {
      return false;
    }
    if (!activeImport) {
      return true;
    }
    const normalizedTopics = normalizeTopicList(aiTopics);
    const storedTopics = normalizeTopicList(activeImport.topics ?? []);
    return (
      activeImport.title !== title.trim() ||
      activeImport.content !== normalizeOcrText(content) ||
      normalizedTopics.join("|") !== storedTopics.join("|")
    );
  }, [activeImport, aiTopics, content, title]);

  const loadImports = async () => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setImports([]);
      return;
    }
    try {
      const res = await fetch(`${apiBase}/knowledge/imports?limit=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.imports)) {
        setImports(
          data.imports.map((item: Record<string, unknown>) => ({
            id: String(item.id),
            title: String(item.title ?? "未命名"),
            content: String(item.content ?? ""),
            source:
              typeof item.source === "string"
                ? (item.source as KnowledgeImport["source"])
                : "manual",
            topics: Array.isArray(item.topics)
              ? item.topics.filter((entry: unknown) => typeof entry === "string")
              : [],
            createdAt: String(item.createdAt),
            updatedAt: String(item.updatedAt)
          }))
        );
      }
    } catch {
      setImports([]);
    }
  };

  useEffect(() => {
    void loadImports();
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      void loadImports();
    };
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  useEffect(() => {
    if (!activeImport) {
      return;
    }
    setTitle(activeImport.title);
    setContent(activeImport.content);
    setFileLabel(null);
    setAiTopics(Array.isArray(activeImport.topics) ? activeImport.topics : []);
    setSelectedTopic("");
    setQuestion("");
    setAnswer(null);
    setRequestMessage(null);
    setRequestState("idle");
  }, [activeImport]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (selectedTopic && !topics.includes(selectedTopic)) {
      setSelectedTopic("");
    }
  }, [selectedTopic, topics]);

  const handleNewImport = () => {
    setActiveImportId(null);
    setTitle("");
    setContent("");
    setPreviewUrl(null);
    setFileLabel(null);
    setAiTopics([]);
    setOcrState("idle");
    setOcrMessage(null);
    setOcrProgress(0);
    setOcrStatus(null);
    setSaveMessage(null);
    setSelectedTopic("");
    setQuestion("");
    setAnswer(null);
    setRequestMessage(null);
    setRequestState("idle");
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setActiveImportId(null);
    setFileLabel(file.name);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    setOcrState("loading");
    setOcrMessage(null);
    setOcrProgress(0);
    setOcrStatus("正在处理文件...");
    setAiTopics([]);
    try {
      let useAi = importMode === "ai" && file.type.startsWith("image/");
      if (importMode === "ai" && !file.type.startsWith("image/")) {
        setOcrMessage("AI 识别仅支持图片，已改用本地解析。");
        useAi = false;
      }
      const titleHint = title.trim() || deriveTitleFromFile(file.name);
      const result = useAi
        ? await extractImageWithAi(file, titleHint)
        : await extractTextFromFile(file, {
            onProgress: (update) => {
              setOcrStatus(update.status);
              setOcrProgress(update.progress);
            }
          });
      const normalized = normalizeOcrText(result.text);
      if (!normalized) {
        setOcrState("error");
        setOcrMessage("未读取到有效文字，请检查文件内容。");
        return;
      }
      const defaultTitle = deriveTitleFromFile(file.name);
      const topicsForSave = buildTopicsForSave(normalized);
      setTitle(defaultTitle);
      setContent(normalized);
      setAiTopics(topicsForSave);
      setActiveImportId(null);
      setOcrState("idle");
      setOcrMessage(null);
      const saved = await createImport({
        title: defaultTitle,
        content: normalized,
        source: result.source,
        topics: topicsForSave
      });
      setImports((prev) => [saved, ...prev]);
      setActiveImportId(saved.id);
      setSaveMessage(
        result.source === "ocr"
          ? "识别完成，已保存到知识库。"
          : result.source === "ai"
          ? "AI 识别完成，已保存到知识库。"
          : "文档解析完成，已保存到知识库。"
      );
    } catch (err) {
      setOcrState("error");
      setOcrMessage(err instanceof Error ? err.message : "导入失败");
    } finally {
      event.target.value = "";
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    if (aiTopics.length) {
      setAiTopics([]);
    }
  };

  const buildTopicsForSave = (normalized: string) => {
    if (aiTopics.length) {
      return normalizeTopicList(aiTopics);
    }
    return extractTopics(normalized);
  };

  const extractImageWithAi = async (file: File, titleHint: string) => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      throw new Error("请先登录并配置 AI 模型。");
    }
    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > 8) {
      throw new Error("图片过大，请控制在 8MB 以内。");
    }
    setOcrStatus("AI 正在识别图片内容...");
    setOcrProgress(0.2);
    const imageDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("读取图片失败"));
      reader.readAsDataURL(file);
    });
    const res = await fetch(`${apiBase}/ai/knowledge/vision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        imageDataUrl,
        title: titleHint || undefined
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? "AI 识别失败");
    }
    setOcrProgress(1);
    const topicsFromAi = Array.isArray(data.topics)
      ? normalizeTopicList(
          data.topics.filter((item: unknown) => typeof item === "string")
        )
      : [];
    return {
      text: typeof data.text === "string" ? data.text : "",
      topics: topicsFromAi,
      source: "ai" as const
    };
  };

  const createImport = async (payload: {
    title?: string;
    content: string;
    source: KnowledgeImport["source"];
    topics: string[];
  }) => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      throw new Error("请先登录后保存到知识库。");
    }
    const res = await fetch(`${apiBase}/knowledge/imports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? "保存失败");
    }
    return data as KnowledgeImport;
  };

  const updateImport = async (
    id: string,
    payload: { title?: string; content?: string; topics?: string[] }
  ) => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      throw new Error("请先登录后保存到知识库。");
    }
    const res = await fetch(`${apiBase}/knowledge/imports/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? "更新失败");
    }
    return data as KnowledgeImport;
  };

  const deleteImport = async (id: string) => {
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      throw new Error("请先登录后删除。");
    }
    const res = await fetch(`${apiBase}/knowledge/imports/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? "删除失败");
    }
  };

  const handleSaveImport = () => {
    const save = async () => {
      const normalized = normalizeOcrText(content);
      if (!normalized) {
        setSaveMessage("请先输入或识别文字内容。");
        return;
      }
      const topicsForSave = buildTopicsForSave(normalized);
      if (activeImport) {
        const nextTitle = title.trim() || activeImport.title;
        const updated = await updateImport(activeImport.id, {
          title: nextTitle,
          content: normalized,
          topics: topicsForSave
        });
        setImports((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setTitle(updated.title);
        setContent(updated.content);
        setAiTopics(updated.topics ?? []);
        setSaveMessage("已更新导入内容。");
        return;
      }
      const created = await createImport({
        title: title.trim() || `导入 ${formatDate(new Date().toISOString())}`,
        content: normalized,
        source: "manual",
        topics: topicsForSave
      });
      setImports((prev) => [created, ...prev]);
      setActiveImportId(created.id);
      setTitle(created.title);
      setContent(created.content);
      setAiTopics(created.topics ?? []);
      setSaveMessage("已保存到知识库。");
    };

    save().catch((err) => {
      setSaveMessage(err instanceof Error ? err.message : "保存失败");
    });
  };

  const handleRemoveImport = (id: string) => {
    const remove = async () => {
      await deleteImport(id);
      setImports((prev) => prev.filter((item) => item.id !== id));
      if (activeImportId === id) {
        handleNewImport();
      }
    };
    remove().catch((err) => {
      setSaveMessage(err instanceof Error ? err.message : "删除失败");
    });
  };

  const handleAsk = async () => {
    if (requestState === "loading") {
      return;
    }
    if (!selectedTopic && !question.trim()) {
      setRequestState("error");
      setRequestMessage("请选择关键词或输入问题。");
      return;
    }
    const token = window.localStorage.getItem(sessionKey);
    if (!token) {
      setRequestState("error");
      setRequestMessage("请先登录后再发起学习提问。");
      return;
    }
    setRequestState("loading");
    setRequestMessage(null);
    try {
      const res = await fetch(`${apiBase}/ai/knowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: selectedTopic || undefined,
          question: question.trim() || undefined,
          context: content.trim(),
          title: title.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "生成失败");
      }
      setAnswer(data.answer ?? "");
      setRequestState("idle");
    } catch (err) {
      setRequestState("error");
      setRequestMessage(err instanceof Error ? err.message : "生成失败");
    }
  };

  return (
    <main className="main knowledge-page">
      <section className="knowledge-hero">
        <div className="app-page-header-main">
          <p className="eyebrow">常识学习</p>
          <h1 className="app-page-title">导入资料，快速拆出知识点</h1>
          <p className="lead app-page-subtitle">
            支持思维导图、试卷截图等图像内容，在浏览器本地完成 OCR
            识别并自动保存，同时支持 AI 多模态识别和 PDF、Word、TXT 文档解析。选中关键词即可一键生成常识学习卡片。
          </p>
        </div>
        <div className="knowledge-note">
          <div className="status-card">
            <div className="status-title">本地识别优先</div>
            <div className="status-lines">
              <span>OCR 在浏览器中完成，降低数据外传风险。</span>
              <span>首次识别会下载语言包（约 20MB）。</span>
              <span>文档解析全程在本地执行。</span>
              <span>可切换 AI 多模态识别以提高准确度。</span>
            </div>
          </div>
        </div>
      </section>

      <section className="knowledge-grid">
        <div className="knowledge-card">
          <div className="knowledge-card-header">
            <div>
              <h3>资料导入</h3>
              <p className="form-message">
                支持图片、PDF、Word、TXT，识别结果可手动修正。
              </p>
            </div>
            <button type="button" className="ghost" onClick={handleNewImport}>
              新建导入
            </button>
          </div>

          <div className="ocr-mode">
            <button
              type="button"
              className={`ocr-mode-button${
                importMode === "local" ? " active" : ""
              }`}
              onClick={() => setImportMode("local")}
            >
              本地识别
            </button>
            <button
              type="button"
              className={`ocr-mode-button${
                importMode === "ai" ? " active" : ""
              }`}
              onClick={() => setImportMode("ai")}
            >
              AI 多模态
            </button>
            <span className="form-message">
              AI 识别仅支持图片，将发送给已配置的模型
            </span>
          </div>

          <div className="ocr-actions">
            <label className="upload-button">
              <input
                type="file"
                accept="image/*,application/pdf,text/plain,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />
              上传图片 / 文档
            </label>
            <button
              type="button"
              className="primary"
              onClick={handleSaveImport}
              disabled={!hasUnsavedChanges}
            >
              保存到学习库
            </button>
          </div>

          {previewUrl ? (
            <img src={previewUrl} alt="OCR 预览" className="ocr-preview" />
          ) : (
            <div className="ocr-placeholder">
              {fileLabel ? `已导入：${fileLabel}` : "支持图片、PDF、Word、TXT"}
            </div>
          )}

          {ocrState === "loading" ? (
            <div className="ocr-progress">
              <div>
                <strong>识别中：</strong>
                {ocrStatus ?? "处理中"}
              </div>
              <progress value={Math.round(ocrProgress * 100)} max={100} />
            </div>
          ) : null}
          {ocrMessage ? <p className="form-message">{ocrMessage}</p> : null}
          {saveMessage ? <p className="form-message">{saveMessage}</p> : null}

          <div className="form-row">
            <label htmlFor="knowledge-title">资料标题</label>
            <input
              id="knowledge-title"
              value={title}
              placeholder="例如：物理-光学思维导图"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="knowledge-content">识别/导入内容</label>
            <textarea
              id="knowledge-content"
              rows={8}
              placeholder="可粘贴文字或等待 OCR 识别结果"
              value={content}
              onChange={(event) => handleContentChange(event.target.value)}
            />
          </div>
        </div>

        <div className="knowledge-card knowledge-library">
          <div className="knowledge-card-header">
            <h3>个人知识库</h3>
            <span className="form-message">已同步到个人知识库</span>
          </div>
          <div className="knowledge-import-list">
            {imports.length ? (
              imports.map((item) => (
                <div
                  key={item.id}
                  className={`knowledge-import-item${
                    item.id === activeImportId ? " active" : ""
                  }`}
                >
                  <div className="knowledge-import-title">
                    <strong>{item.title}</strong>
                    <span>
                      {item.source === "ocr"
                        ? "OCR"
                        : item.source === "document"
                        ? "文档"
                        : item.source === "ai"
                        ? "AI"
                        : "手动"}{" "}
                      ·{" "}
                      {formatDate(item.updatedAt)}
                    </span>
                  </div>
                  <p>{item.content}</p>
                  <div className="knowledge-import-actions">
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => setActiveImportId(item.id)}
                    >
                      载入
                    </button>
                    <button
                      type="button"
                      className="ghost danger"
                      onClick={() => handleRemoveImport(item.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="knowledge-empty">
                暂无导入内容，识别后会保存到个人知识库。
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="knowledge-grid">
        <div className="knowledge-card">
          <div className="knowledge-card-header">
            <div>
              <h3>知识点提问</h3>
              <p className="form-message">
                从识别结果中选关键词，或手动输入问题。
              </p>
            </div>
          </div>

          <div className="topic-list">
            {topics.length ? (
              topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className={`topic-chip${
                    selectedTopic === topic ? " active" : ""
                  }`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  {topic}
                </button>
              ))
            ) : (
              <div className="knowledge-empty">暂无关键词，请先导入内容。</div>
            )}
          </div>

          <div className="form-row">
            <label htmlFor="knowledge-question">补充问题</label>
            <textarea
              id="knowledge-question"
              rows={4}
              placeholder="例如：折射和反射的区别是什么？"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
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
              一键生成常识学习
            </LoadingButton>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setAnswer(null);
                setRequestMessage(null);
                setRequestState("idle");
              }}
            >
              清空回答
            </button>
          </div>

          {requestMessage ? (
            <p className="form-message">{requestMessage}</p>
          ) : null}
          {requestState === "loading" ? (
            <p className="form-message">AI 正在生成内容...</p>
          ) : null}
        </div>

        <div className="knowledge-card">
          <div className="knowledge-card-header">
            <h3>AI 学习卡片</h3>
            <span className="form-message">基于导入内容生成</span>
          </div>
          {answer ? (
            <div className="assist-output knowledge-output">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          ) : (
            <div className="knowledge-empty">
              选择关键词并发起提问后显示内容。
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
