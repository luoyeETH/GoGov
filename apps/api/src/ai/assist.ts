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

export async function generateAssistAnswer(params: {
  provider: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  model?: string | null;
  messages: ChatMessage[];
}) {
  const provider = params.provider.toLowerCase();
  if (!params.apiKey) {
    throw new Error("请先配置 API Key");
  }
  if (!params.model) {
    throw new Error("请先选择模型");
  }

  if (provider === "openai" || provider === "custom") {
    const baseUrl = normalizeBaseUrl(params.baseUrl);
    const url = buildChatUrl(baseUrl);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: 0.2,
        max_tokens: 800
      })
    });
    let data: {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
      error?: { message?: string } | string;
    } = {};
    try {
      data = (await res.json()) as typeof data;
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
    if (!content) {
      throw new Error("AI 返回为空");
    }
    return {
      answer: content,
      model: data.model ?? params.model
    };
  }

  if (provider === "anthropic") {
    throw new Error("当前提供商暂不支持答疑服务");
  }

  throw new Error("AI 提供商不合法");
}
