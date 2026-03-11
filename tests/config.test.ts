import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";

vi.mock("node:fs");
vi.mock("node:child_process");

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { loadConfig, initConfig } from "../src/config/loader.js";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockExecSync = vi.mocked(execSync);
const mockWriteFileSync = vi.mocked(writeFileSync);

beforeEach(() => {
  vi.clearAllMocks();
  mockExecSync.mockReturnValue("/fake/project\n" as ReturnType<typeof execSync>);
  mockExistsSync.mockReturnValue(false);
});

// ─── loadConfig ──────────────────────────────────────────────────

describe("loadConfig", () => {
  it("returns defaults when no config files exist", () => {
    const config = loadConfig();
    expect(config.maxSubjectLength).toBe(DEFAULT_CONFIG.maxSubjectLength);
    expect(config.includeBody).toBe(DEFAULT_CONFIG.includeBody);
    expect(config.includeScope).toBe(DEFAULT_CONFIG.includeScope);
    expect(config.ai.enabled).toBe(false);
    expect(config.ai.provider).toBeNull();
  });

  it("merges project config over defaults", () => {
    mockExistsSync.mockImplementation((p) => String(p).endsWith(".lazycommit.json"));
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ maxSubjectLength: 50 }) as ReturnType<typeof readFileSync>
    );

    const config = loadConfig();
    expect(config.maxSubjectLength).toBe(50);
    // Unchanged defaults preserved
    expect(config.includeBody).toBe(true);
  });

  it("respects includeScope override from config file", () => {
    mockExistsSync.mockImplementation((p) => String(p).endsWith(".lazycommit.json"));
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ includeScope: false }) as ReturnType<typeof readFileSync>
    );

    const config = loadConfig();
    expect(config.includeScope).toBe(false);
  });

  it("merges AI config from file", () => {
    mockExistsSync.mockImplementation((p) => String(p).endsWith(".lazycommit.json"));
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ ai: { enabled: true, provider: "anthropic", apiKey: "sk-ant-test" } }) as ReturnType<
        typeof readFileSync
      >
    );

    const config = loadConfig();
    expect(config.ai.enabled).toBe(true);
    expect(config.ai.provider).toBe("anthropic");
    expect(config.ai.apiKey).toBe("sk-ant-test");
  });

  it("handles invalid JSON gracefully (returns defaults)", () => {
    mockExistsSync.mockImplementation((p) => String(p).endsWith(".lazycommit.json"));
    mockReadFileSync.mockReturnValue("{ invalid json }" as ReturnType<typeof readFileSync>);

    const config = loadConfig();
    expect(config.maxSubjectLength).toBe(DEFAULT_CONFIG.maxSubjectLength);
  });

  it("falls back to cwd when not in a git repo", () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("not a git repository");
    });
    mockExistsSync.mockReturnValue(false);

    // Should not throw
    expect(() => loadConfig()).not.toThrow();
  });
});

// ─── initConfig ──────────────────────────────────────────────────

describe("initConfig", () => {
  it("creates config file and returns success message", () => {
    mockExistsSync.mockReturnValue(false);

    const result = initConfig("/tmp/test/.lazycommit.json");
    expect(result).toContain("Created");
    expect(mockWriteFileSync).toHaveBeenCalledOnce();
  });

  it("returns existing message if file already exists", () => {
    mockExistsSync.mockReturnValue(true);

    const result = initConfig("/tmp/test/.lazycommit.json");
    expect(result).toContain("already exists");
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it("writes valid JSON to the config file", () => {
    mockExistsSync.mockReturnValue(false);

    initConfig("/tmp/test/.lazycommit.json");

    const written = mockWriteFileSync.mock.calls[0][1] as string;
    expect(() => JSON.parse(written)).not.toThrow();
  });
});
