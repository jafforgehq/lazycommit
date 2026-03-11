import { describe, it, expect } from "vitest";
import { createAIProvider, detectProviderFromKey } from "../src/ai/index.js";
import type { LazycommitConfig } from "../src/config/defaults.js";

function makeConfig(overrides: Partial<LazycommitConfig["ai"]> = {}): LazycommitConfig {
  return {
    conventionalCommits: true,
    maxSubjectLength: 72,
    includeBody: true,
    includeScope: true,
    ai: {
      enabled: false,
      provider: null,
      apiKey: null,
      ...overrides,
    },
  };
}

// ─── detectProviderFromKey ───────────────────────────────────────

describe("detectProviderFromKey", () => {
  it("identifies Anthropic keys by sk-ant- prefix", () => {
    expect(detectProviderFromKey("sk-ant-api03-abc123")).toBe("anthropic");
  });

  it("identifies OpenAI keys by sk- prefix", () => {
    expect(detectProviderFromKey("sk-proj-abc123")).toBe("openai");
  });

  it("returns null for unknown key formats", () => {
    expect(detectProviderFromKey("ghp_github_token")).toBeNull();
    expect(detectProviderFromKey("")).toBeNull();
  });
});

// ─── createAIProvider ────────────────────────────────────────────

describe("createAIProvider", () => {
  it("returns null when AI is disabled", () => {
    const config = makeConfig({ enabled: false, provider: "anthropic", apiKey: "sk-ant-test" });
    expect(createAIProvider(config)).toBeNull();
  });

  it("returns null when no API key is available", () => {
    const config = makeConfig({ enabled: true, provider: "anthropic", apiKey: null });
    // Ensure env vars aren't set
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.LAZYCOMMIT_ANTHROPIC_KEY;

    const provider = createAIProvider(config);

    if (original !== undefined) process.env.ANTHROPIC_API_KEY = original;
    expect(provider).toBeNull();
  });

  it("returns null when provider is null", () => {
    const config = makeConfig({ enabled: true, provider: null, apiKey: null });
    expect(createAIProvider(config)).toBeNull();
  });

  it("creates AnthropicProvider when configured with apiKey", () => {
    const config = makeConfig({ enabled: true, provider: "anthropic", apiKey: "sk-ant-test" });
    const provider = createAIProvider(config);
    expect(provider).not.toBeNull();
    expect(provider?.name).toBe("anthropic");
  });

  it("creates OpenAIProvider when configured with apiKey", () => {
    const config = makeConfig({ enabled: true, provider: "openai", apiKey: "sk-test" });
    const provider = createAIProvider(config);
    expect(provider).not.toBeNull();
    expect(provider?.name).toBe("openai");
  });

  it("reads ANTHROPIC_API_KEY from env when no apiKey in config", () => {
    const original = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "sk-ant-from-env";

    const config = makeConfig({ enabled: true, provider: "anthropic", apiKey: null });
    const provider = createAIProvider(config);

    if (original !== undefined) process.env.ANTHROPIC_API_KEY = original;
    else delete process.env.ANTHROPIC_API_KEY;

    expect(provider?.name).toBe("anthropic");
  });

  it("reads OPENAI_API_KEY from env when no apiKey in config", () => {
    const original = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "sk-openai-from-env";

    const config = makeConfig({ enabled: true, provider: "openai", apiKey: null });
    const provider = createAIProvider(config);

    if (original !== undefined) process.env.OPENAI_API_KEY = original;
    else delete process.env.OPENAI_API_KEY;

    expect(provider?.name).toBe("openai");
  });
});
