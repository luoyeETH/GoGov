import { InterviewType } from "@prisma/client";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const openAiDefaultBase = "https://api.openai.com";

function normalizeBaseUrl(baseUrl?: string | null) {
  if (!baseUrl) {
    return openAiDefaultBase;
  }
  return baseUrl.replace(/\/$/, "");
}

function buildChatUrl(baseUrl: string) {
  if (baseUrl.endsWith("/v1")) {
    return `${baseUrl}/chat/completions`;
  }
  return `${baseUrl}/v1/chat/completions`;
}

async function callAI(params: {
  provider: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  model?: string | null;
  messages: ChatMessage[];
  jsonMode?: boolean;
}) {
  const provider = params.provider.toLowerCase();
  if (!params.apiKey) throw new Error("请先配置 API Key");
  if (!params.model) throw new Error("请先选择模型");

  const baseUrl = normalizeBaseUrl(params.baseUrl);
  const url = buildChatUrl(baseUrl);

  const payload: any = {
    model: params.model,
    messages: params.messages,
    temperature: 0.7,
  };

  if (params.jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : data.error?.message ?? "AI 请求失败";
    throw new Error(message);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI 返回为空");

  return content;
}

export async function generateInterviewQuestion(
  context: {
    type: InterviewType;
    difficulty: number;
    previousQuestions: string[];
  },
  config: {
    provider: string;
    baseUrl?: string | null;
    apiKey?: string | null;
    model?: string | null;
  }
) {
  const systemPrompt = `You are a professional civil service interviewer (公务员面试官).
Your task is to generate ONE interview question based on the following criteria:
- Type: ${context.type}
- Difficulty (1-5): ${context.difficulty}
- Language: Chinese (Simplified)

Constraints:
- The question must be realistic and challenging.
- Do NOT repeat any of these previous questions: ${JSON.stringify(
    context.previousQuestions
  )}.
- Return ONLY the question text. Do not include quotes or prefixes like "Question:".`;

  return callAI({
    ...config,
    messages: [{ role: "system", content: systemPrompt }],
  });
}

export async function analyzeInterviewAnswer(
  params: {
    question: string;
    answer: string;
    type: InterviewType;
  },
  config: {
    provider: string;
    baseUrl?: string | null;
    apiKey?: string | null;
    model?: string | null;
  }
) {
  const systemPrompt = `You are a senior civil service interview evaluator.
Evaluate the candidate's answer based on the question.

Question: "${params.question}"
Candidate Answer: "${params.answer}"
Type: ${params.type}

Return a JSON object in this format:
{
  "score": number, // 0-100
  "feedback": string, // Detailed feedback in markdown (Chinese)
  "suggestedAnswer": string, // An ideal answer example
  "metrics": {
    "logic": number, // 0-10
    "depth": number, // 0-10
    "expression": number // 0-10
  }
}`;

  const content = await callAI({
    ...config,
    messages: [{ role: "system", content: systemPrompt }],
    jsonMode: true,
  });

  return JSON.parse(content);
}
