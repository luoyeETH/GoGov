import { AIProvider, AIProviderId } from "./provider";
import { provider as noneProvider } from "./providers/none";
import { provider as openaiProvider } from "./providers/openai";
import { provider as anthropicProvider } from "./providers/anthropic";
import { provider as customProvider } from "./providers/custom";

const registry = new Map<AIProviderId, AIProvider>([
  ["none", noneProvider],
  ["openai", openaiProvider],
  ["anthropic", anthropicProvider],
  ["custom", customProvider]
]);

export function listAIProviders() {
  return Array.from(registry.values()).map((provider) => provider.descriptor);
}

export function getAIProviderId() {
  const raw = (process.env.AI_PROVIDER ?? "none").toLowerCase();
  if (registry.has(raw as AIProviderId)) {
    return raw as AIProviderId;
  }
  return "none";
}

export function getAIProvider() {
  return registry.get(getAIProviderId()) ?? noneProvider;
}
