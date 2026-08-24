export const DEFAULT_GROQ_CHAT_MODEL = 'openai/gpt-oss-120b';
export const DEFAULT_GROQ_FAST_MODEL = 'openai/gpt-oss-20b';

function configuredModel(name, fallback) {
  return process.env[name]?.trim() || fallback;
}

export function getGroqChatModel() {
  return configuredModel('GROQ_CHAT_MODEL', DEFAULT_GROQ_CHAT_MODEL);
}

export function getGroqFastModel() {
  return configuredModel('GROQ_FAST_MODEL', DEFAULT_GROQ_FAST_MODEL);
}

export function getGroqDemoModel() {
  return configuredModel('GROQ_DEMO_MODEL', getGroqChatModel());
}

export function getGroqKnowledgeGraphModel() {
  return configuredModel('GROQ_KNOWLEDGE_GRAPH_MODEL', getGroqFastModel());
}

export function getGroqGenerationOptions(model) {
  if (model === 'openai/gpt-oss-20b' || model === 'openai/gpt-oss-120b') {
    return { reasoning_effort: 'low', reasoning_format: 'hidden' };
  }

  if (model === 'qwen/qwen3.6-27b') {
    return { reasoning_effort: 'none', reasoning_format: 'hidden' };
  }

  return {};
}
