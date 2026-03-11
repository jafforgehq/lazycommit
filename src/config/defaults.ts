export interface LazycommitConfig {
  conventionalCommits: boolean;
  maxSubjectLength: number;
  includeBody: boolean;
  includeScope: boolean;
  allowedTypes?: string[];
  scopeMappings?: Record<string, string>;
  ticketPattern?: string; // e.g. "PROJ-[0-9]+"
  ai: {
    enabled: boolean;
    provider: "anthropic" | "openai" | null;
    apiKey: string | null;
    model?: string;
  };
}

export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export const DEFAULT_CONFIG: LazycommitConfig = {
  conventionalCommits: true,
  maxSubjectLength: 72,
  includeBody: true,
  includeScope: false,
  ai: {
    enabled: false,
    provider: null,
    apiKey: null,
  },
};

export const EXAMPLE_CONFIG: LazycommitConfig = {
  conventionalCommits: true,
  maxSubjectLength: 72,
  includeBody: true,
  includeScope: true,
  allowedTypes: ["feat", "fix", "refactor", "test", "docs", "chore", "perf", "ci", "style", "build"],
  scopeMappings: {
    "^src/api/": "api",
    "^src/components/": "ui",
    "^src/auth/": "auth",
  },
  ticketPattern: "PROJ-[0-9]+",
  ai: {
    enabled: false,
    provider: null,
    apiKey: null,
    // model: "claude-sonnet-4-20250514",  // override the default model
  },
};
