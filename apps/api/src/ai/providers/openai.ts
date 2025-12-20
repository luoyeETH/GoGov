import { AIProvider } from "../provider";

export const provider: AIProvider = {
  descriptor: {
    id: "openai",
    displayName: "OpenAI",
    supports: {
      chat: true,
      reasoning: true,
      embeddings: true
    }
  }
};
