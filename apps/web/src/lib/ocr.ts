type ProgressUpdate = {
  status: string;
  progress: number;
};

type ExtractedContent = {
  text: string;
  source: "ocr" | "document";
  kind: "image" | "pdf" | "docx" | "txt";
  topics?: string[];
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{
    getTextContent: (params?: {
      includeMarkedContent?: boolean;
      disableNormalization?: boolean;
    }) => Promise<{ items: Array<{ str?: string; hasEOL?: boolean }> }>;
    getViewport: (params: { scale: number }) => { width: number; height: number };
    render: (params: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<void> };
  }>;
};

const stopWords = new Set([
  "的",
  "与",
  "和",
  "或",
  "是",
  "在",
  "及",
  "等",
  "其",
  "此",
  "the",
  "and",
  "or",
  "of",
  "to",
  "a",
  "an"
]);

export async function recognizeImage(
  file: File,
  options?: {
    language?: string;
    onProgress?: (update: ProgressUpdate) => void;
  }
): Promise<string> {
  const { recognize } = await import("tesseract.js");
  const language = options?.language ?? "chi_sim+eng";
  const result = await recognize(file, language, {
    logger: (message) => {
      if (typeof message?.progress === "number") {
        options?.onProgress?.({
          status: message.status ?? "recognizing",
          progress: message.progress
        });
      }
    }
  });
  return result?.data?.text ?? "";
}

async function extractPdfText(
  pdfDocument: PdfDocument,
  options?: { onProgress?: (update: ProgressUpdate) => void }
) {
  let text = "";
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    options?.onProgress?.({
      status: `解析第 ${pageNumber} / ${pdfDocument.numPages} 页`,
      progress: pageNumber / pdfDocument.numPages
    });
    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent({
      includeMarkedContent: true,
      disableNormalization: false
    });
    const items = content.items as Array<{ str?: string; hasEOL?: boolean }>;
    const parts: string[] = [];
    for (const item of items) {
      if (typeof item.str !== "string") {
        continue;
      }
      parts.push(item.str);
      if (item.hasEOL) {
        parts.push("\n");
      } else {
        parts.push(" ");
      }
    }
    text += parts.join("");
    if (!text.endsWith("\n")) {
      text += "\n";
    }
  }
  return text;
}

async function extractPdfWithOcr(
  pdfDocument: PdfDocument,
  options?: { onProgress?: (update: ProgressUpdate) => void; language?: string }
) {
  const { recognize } = await import("tesseract.js");
  const language = options?.language ?? "chi_sim+eng";
  let text = "";
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("无法创建画布用于 OCR。");
    }
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;
    const result = await recognize(canvas, language, {
      logger: (message) => {
        if (typeof message?.progress === "number") {
          const overall =
            (pageNumber - 1 + message.progress) / pdfDocument.numPages;
          options?.onProgress?.({
            status: `OCR 第 ${pageNumber} / ${pdfDocument.numPages} 页`,
            progress: overall
          });
        }
      }
    });
    text += `${result?.data?.text ?? ""}\n`;
  }
  return text;
}

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) {
    return true;
  }
  return /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);
}

function isPdfFile(file: File) {
  if (file.type === "application/pdf") {
    return true;
  }
  return /\.pdf$/i.test(file.name);
}

function isDocxFile(file: File) {
  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return true;
  }
  return /\.docx$/i.test(file.name);
}

function isDocFile(file: File) {
  if (file.type === "application/msword") {
    return true;
  }
  return /\.doc$/i.test(file.name);
}

function isTextFile(file: File) {
  if (file.type === "text/plain") {
    return true;
  }
  return /\.txt$/i.test(file.name);
}

export async function extractTextFromFile(
  file: File,
  options?: { onProgress?: (update: ProgressUpdate) => void; language?: string }
): Promise<ExtractedContent> {
  if (isImageFile(file)) {
    const text = await recognizeImage(file, {
      onProgress: options?.onProgress,
      language: options?.language
    });
    return { text, source: "ocr", kind: "image" };
  }

  if (isPdfFile(file)) {
    options?.onProgress?.({ status: "读取 PDF 文档", progress: 0 });
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
    const workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

    const data = new Uint8Array(await file.arrayBuffer());
    const cMapUrl = "/pdfjs/cmaps/";
    const standardFontDataUrl = "/pdfjs/standard_fonts/";
    const pdfDocument = await pdfjs.getDocument({
      data,
      cMapUrl,
      cMapPacked: true,
      standardFontDataUrl
    }).promise;
    const text = await extractPdfText(pdfDocument, options);
    if (normalizeOcrText(text)) {
      return { text, source: "document", kind: "pdf" };
    }
    options?.onProgress?.({
      status: "未检测到文字层，转为 OCR 识别",
      progress: 0
    });
    const ocrText = await extractPdfWithOcr(pdfDocument, options);
    return { text: ocrText, source: "ocr", kind: "pdf" };
  }

  if (isDocxFile(file)) {
    options?.onProgress?.({ status: "解析 Word 文档", progress: 0.2 });
    const { extractRawText } = await import("mammoth/mammoth.browser");
    const result = await extractRawText({ arrayBuffer: await file.arrayBuffer() });
    options?.onProgress?.({ status: "解析完成", progress: 1 });
    return { text: result.value ?? "", source: "document", kind: "docx" };
  }

  if (isDocFile(file)) {
    throw new Error("暂不支持 .doc，请先转换为 .docx 格式。");
  }

  if (isTextFile(file)) {
    options?.onProgress?.({ status: "读取文本文件", progress: 0.2 });
    const text = await file.text();
    options?.onProgress?.({ status: "读取完成", progress: 1 });
    return { text, source: "document", kind: "txt" };
  }

  throw new Error("暂不支持该文件格式，请上传图片、PDF、DOCX 或 TXT。");
}

export function normalizeOcrText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function extractTopics(text: string, limit = 24) {
  const normalized = normalizeOcrText(text);
  if (!normalized) {
    return [];
  }
  const tokens = normalized.split(/[\s，,；;、/\\|:：·•()\[\]{}<>]+/g);
  const results: string[] = [];
  const seen = new Set<string>();
  for (const raw of tokens) {
    const token = raw.trim();
    if (!token) {
      continue;
    }
    if (token.length > 18) {
      continue;
    }
    if (!/[A-Za-z\u4e00-\u9fa5]/.test(token)) {
      continue;
    }
    const normalizedToken = token.toLowerCase();
    if (stopWords.has(normalizedToken)) {
      continue;
    }
    if (token.length === 1 && !/[A-Za-z]/.test(token)) {
      continue;
    }
    if (seen.has(normalizedToken)) {
      continue;
    }
    seen.add(normalizedToken);
    results.push(token);
    if (results.length >= limit) {
      break;
    }
  }
  return results;
}
