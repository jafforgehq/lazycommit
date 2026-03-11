import type { StagedFile } from "../git/files.js";
import { SCOPE_PATTERNS } from "./rules.js";
import type { LazycommitConfig } from "../config/defaults.js";

export function detectScope(
  stagedFiles: StagedFile[],
  config?: LazycommitConfig
): string | null {
  const filePaths = stagedFiles.map((f) => f.path);

  if (filePaths.length === 0) return null;

  // Try custom scope mappings from config first
  if (config?.scopeMappings) {
    const customScope = matchCustomScopes(filePaths, config.scopeMappings);
    if (customScope) return customScope;
  }

  // Try built-in scope patterns
  const detectedScopes = filePaths
    .map((fp) => matchBuiltInScope(fp))
    .filter((s): s is string => s !== null);

  if (detectedScopes.length === 0) {
    // Fallback: extract common directory
    return extractCommonDirectory(filePaths);
  }

  // Return most common scope
  return getMostCommon(detectedScopes);
}

function matchBuiltInScope(filePath: string): string | null {
  for (const { pattern, scope } of SCOPE_PATTERNS) {
    if (pattern.test(filePath)) {
      return scope;
    }
  }
  return null;
}

function matchCustomScopes(
  filePaths: string[],
  mappings: Record<string, string>
): string | null {
  const scopes: string[] = [];

  for (const filePath of filePaths) {
    for (const [pattern, scope] of Object.entries(mappings)) {
      if (new RegExp(pattern).test(filePath)) {
        scopes.push(scope);
        break;
      }
    }
  }

  return scopes.length > 0 ? getMostCommon(scopes) : null;
}

function extractCommonDirectory(filePaths: string[]): string | null {
  if (filePaths.length === 0) return null;

  // Get the first meaningful directory segment for each file
  const dirs = filePaths
    .map((fp) => {
      const parts = fp.split("/");
      // Skip "src" as it's too generic
      if (parts[0] === "src" && parts.length > 1) {
        return parts[1];
      }
      if (parts.length > 1) {
        return parts[0];
      }
      return null;
    })
    .filter((d): d is string => d !== null);

  if (dirs.length === 0) return null;

  const common = getMostCommon(dirs);

  // Only return if most files share this directory
  const count = dirs.filter((d) => d === common).length;
  if (count >= filePaths.length * 0.5) {
    return common;
  }

  return null;
}

function getMostCommon(items: string[]): string {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item] = (counts[item] || 0) + 1;
  }

  let maxCount = 0;
  let mostCommon = items[0];

  for (const [item, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = item;
    }
  }

  return mostCommon;
}
