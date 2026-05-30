import { APP_NAME } from "./appConfig";

export function getServerAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    `http://${process.env.HOSTNAME || "localhost"}:${process.env.PORT || "3000"}`
  ).replace(/\/$/, "");
}

export const ollamaConfig = {
  baseUrl: (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, ""),
  embedModel: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
  generateModel: process.env.OLLAMA_GENERATE_MODEL || "llama3",
};

export function ollamaEmbeddingsUrl() {
  return `${ollamaConfig.baseUrl}/api/embeddings`;
}

export function ollamaGenerateUrl() {
  return `${ollamaConfig.baseUrl}/api/generate`;
}

export const groqConfig = {
  chatModel: process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile",
};

export const openaiConfig = {
  baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  chatModel: process.env.OPENAI_CHAT_MODEL || "gpt-4",
  embedModel: process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small",
};

export const emailConfig = {
  service: process.env.EMAIL_SERVICE || "gmail",
  fromName: process.env.EMAIL_FROM_NAME || APP_NAME,
};

export const seedConfig = {
  adminEmail: process.env.SEED_ADMIN_EMAIL || "admin@example.com",
  adminPassword: process.env.SEED_ADMIN_PASSWORD,
};
