import type { AIProvider } from "./provider.js";
import type { LazycommitConfig } from "../config/defaults.js";
import { AnthropicProvider } from "./anthropic.js";
import { OpenAIProvider } from "./openai.js";

export type { AIProvider, AIContext } from "./provider.js";

export function createAIProvider(config: LazycommitConfig): AIProvider | null {
  const aiConfig = config.ai;
  if (!aiConfig?.enabled) return null;

  const apiKey = aiConfig.apiKey || getEnvApiKey(aiConfig.provider);
  if (!apiKey) return null;

  switch (aiConfig.provider) {
    case "anthropic":
      return new AnthropicProvider(apiKey);
    case "openai":
      return new OpenAIProvider(apiKey);
    default:
      return null;
  }
}

function getEnvApiKey(provider?: string | null): string | undefined {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || process.env.LAZYCOMMIT_ANTHROPIC_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY || process.env.LAZYCOMMIT_OPENAI_KEY;
    default:
      // Try to auto-detect
      return (
        process.env.ANTHROPIC_API_KEY ||
        process.env.LAZYCOMMIT_ANTHROPIC_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.LAZYCOMMIT_OPENAI_KEY
      );
  }
}

export function detectProviderFromKey(apiKey: string): "anthropic" | "openai" | null {
  if (apiKey.startsWith("sk-ant-")) return "anthropic";
  if (apiKey.startsWith("sk-")) return "openai";
  return null;
}
