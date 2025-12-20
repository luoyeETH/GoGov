import { AIProvider } from "../provider";

export const provider: AIProvider = {
  descriptor: {
    id: "none",
    displayName: "未启用",
    supports: {
      chat: false,
      reasoning: false,
      embeddings: false
    }
  }
};
