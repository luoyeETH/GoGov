type ModelInfo = {
  id: string;
};

const openAiDefaultBase = "https://api.openai.com";

function normalizeBaseUrl(baseUrl?: string | null) {
  if (!baseUrl) {
    return openAiDefaultBase;
  }
  return baseUrl.replace(/\/$/, "");
}

function buildModelsUrl(baseUrl: string) {
  if (baseUrl.endsWith("/v1")) {
    return `${baseUrl}/models`;
  }
  return `${baseUrl}/v1/models`;
}

export async function listModels(params: {
  provider: string;
  baseUrl?: string | null;
  apiKey?: string | null;
}) {
  const provider = params.provider.toLowerCase();
  if (!params.apiKey) {
    throw new Error("缺少 API Key");
  }

  if (provider === "openai" || provider === "custom") {
    const baseUrl = normalizeBaseUrl(params.baseUrl);
    const url = buildModelsUrl(baseUrl);
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${params.apiKey}`
      }
    });
    const data = (await res.json()) as { data?: ModelInfo[]; error?: unknown };
    if (!res.ok) {
      throw new Error("模型列表获取失败");
    }
    const models = data.data?.map((item) => item.id) ?? [];
    return models.sort();
  }

  if (provider === "anthropic") {
    throw new Error("当前提供商暂不支持模型列表获取");
  }

  throw new Error("AI 提供商不合法");
}
