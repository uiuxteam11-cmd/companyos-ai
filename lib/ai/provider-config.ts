export function getServerEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return undefined;
}

export function getOpenAIConfig() {
  const apiKey = getServerEnv("OPENAI_API_KEY");
  if (!apiKey) return null;

  return {
    apiKey,
    model: getServerEnv("OPENAI_MODEL") ?? "gpt-4o-mini",
    baseUrl: getServerEnv("OPENAI_BASE_URL") ?? "https://api.openai.com/v1",
  };
}

export function getGeminiConfig() {
  const apiKey = getServerEnv("GEMINI_API_KEY");
  if (!apiKey) return null;

  return {
    apiKey,
    model: getServerEnv("GEMINI_MODEL") ?? "gemini-2.0-flash",
    baseUrl: getServerEnv("GEMINI_BASE_URL") ?? "https://generativelanguage.googleapis.com/v1beta",
  };
}
