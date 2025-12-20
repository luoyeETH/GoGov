import { AIProvider } from "../provider";

export const provider: AIProvider = {
  descriptor: {
    id: "custom",
    displayName: "自定义供应商",
    supports: {
      chat: true,
      reasoning: true,
      embeddings: true
    }
  }
};
