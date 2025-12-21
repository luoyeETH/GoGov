const MAX_CONTEXT_CHARS = 4000;

type KnowledgePromptInput = {
  topic?: string;
  question?: string;
  context?: string;
  title?: string;
};

export function buildKnowledgePrompt(params: KnowledgePromptInput) {
  const topic = params.topic?.trim() ?? "";
  const question = params.question?.trim() ?? "";
  const title = params.title?.trim() ?? "";
  const context = params.context?.trim() ?? "";
  const trimmedContext =
    context.length > MAX_CONTEXT_CHARS
      ? `${context.slice(0, MAX_CONTEXT_CHARS)}...`
      : context;
  const resolvedQuestion =
    question || (topic ? `请解释“${topic}”是什么意思。` : "请概括导入材料中的核心常识点。");
  const system = [
    "你是公考常识学习助手。",
    "请用简洁、准确的中文解释概念，避免空话。",
    "需要输出：定义、关键要点、常见考法/易错点、一个简短例子。",
    "如导入材料不足，请基于常识补充但标注“补充说明”。"
  ].join("\n");
  const user = [
    `导入材料标题：${title || "未命名"}`,
    `导入材料：\n${trimmedContext || "（无）"}`,
    `选中的概念：${topic || "未提供"}`,
    `用户提问：${resolvedQuestion}`
  ].join("\n\n");
  return { system, user, topic, question: resolvedQuestion };
}
