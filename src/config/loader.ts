import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import { DEFAULT_CONFIG, EXAMPLE_CONFIG } from "./defaults.js";
import type { LazycommitConfig } from "./defaults.js";

const CONFIG_FILENAME = ".lazycommit.json";

export function loadConfig(): LazycommitConfig {
  // Priority: project config > home dir config > defaults
  const projectConfig = loadProjectConfig();
  const homeConfig = loadHomeConfig();

  return mergeConfigs(DEFAULT_CONFIG, homeConfig, projectConfig);
}

function loadProjectConfig(): Partial<LazycommitConfig> | null {
  // Try to find git root first
  let gitRoot: string;
  try {
    gitRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
  } catch {
    gitRoot = process.cwd();
  }

  const configPath = join(gitRoot, CONFIG_FILENAME);
  return loadConfigFile(configPath);
}

function loadHomeConfig(): Partial<LazycommitConfig> | null {
  const configPath = join(homedir(), CONFIG_FILENAME);
  return loadConfigFile(configPath);
}

function loadConfigFile(path: string): Partial<LazycommitConfig> | null {
  if (!existsSync(path)) return null;

  try {
    const content = readFileSync(path, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function mergeConfigs(
  ...configs: (Partial<LazycommitConfig> | null)[]
): LazycommitConfig {
  const result = { ...DEFAULT_CONFIG };

  for (const config of configs) {
    if (!config) continue;

    if (config.conventionalCommits !== undefined) result.conventionalCommits = config.conventionalCommits;
    if (config.maxSubjectLength !== undefined) result.maxSubjectLength = config.maxSubjectLength;
    if (config.includeBody !== undefined) result.includeBody = config.includeBody;
    if (config.includeScope !== undefined) result.includeScope = config.includeScope;
    if (config.allowedTypes !== undefined) result.allowedTypes = config.allowedTypes;
    if (config.scopeMappings !== undefined) result.scopeMappings = config.scopeMappings;
    if (config.ticketPattern !== undefined) result.ticketPattern = config.ticketPattern;

    if (config.ai) {
      result.ai = { ...result.ai, ...config.ai };
    }
  }

  return result;
}

export function initConfig(path?: string): string {
  const targetPath = path || join(process.cwd(), CONFIG_FILENAME);

  if (existsSync(targetPath)) {
    return `Config already exists at ${targetPath}`;
  }

  writeFileSync(targetPath, JSON.stringify(EXAMPLE_CONFIG, null, 2) + "\n", "utf-8");
  return `Created ${targetPath}`;
}

export { CONFIG_FILENAME };
