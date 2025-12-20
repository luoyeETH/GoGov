import { AIProvider } from "../provider";

export const provider: AIProvider = {
  descriptor: {
    id: "anthropic",
    displayName: "Anthropic",
    supports: {
      chat: true,
      reasoning: true,
      embeddings: false
    }
  }
};
