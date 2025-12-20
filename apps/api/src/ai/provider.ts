export type AIProviderId = "none" | "openai" | "anthropic" | "custom";

export type AIProviderDescriptor = {
  id: AIProviderId;
  displayName: string;
  supports: {
    chat: boolean;
    reasoning: boolean;
    embeddings: boolean;
  };
};

export type AIProvider = {
  descriptor: AIProviderDescriptor;
};
