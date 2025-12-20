export type AIProviderConfig = {
  provider: "none" | "openai" | "anthropic" | "custom";
  model?: string;
  baseUrl?: string;
};

export type StudyTimeLog = {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
};

export type Question = {
  id: string;
  stem: string;
  options?: string[];
  answer?: string;
  analysis?: string;
};

export type QuickPracticeCategory = {
  id: string;
  name: string;
  description: string;
};

export type QuickPracticeQuestion = {
  id: string;
  categoryId: string;
  prompt: string;
  answer: string;
  choices?: string[];
  explanation?: string;
};
