import type { ParsedDiff } from "../git/diff.js";
import type { StagedFile } from "../git/files.js";
import { CommitType, TYPE_KEYWORDS, FILE_TYPE_PATTERNS } from "./rules.js";

export interface TypeDetectionResult {
  type: CommitType;
  confidence: number; // 0-1
  reason: string;
}

export function detectCommitType(
  diff: ParsedDiff,
  stagedFiles: StagedFile[]
): TypeDetectionResult {
  const filePaths = stagedFiles.map((f) => f.path);

  // Rule 1: All files are tests
  if (filePaths.length > 0 && filePaths.every(isTestFile)) {
    return { type: "test", confidence: 0.95, reason: "All changed files are test files" };
  }

  // Rule 2: All files are documentation
  if (filePaths.length > 0 && filePaths.every(isDocFile)) {
    return { type: "docs", confidence: 0.95, reason: "All changed files are documentation" };
  }

  // Rule 3: Only CI/CD config files
  if (filePaths.length > 0 && filePaths.every(isCIFile)) {
    return { type: "ci", confidence: 0.95, reason: "All changed files are CI/CD configuration" };
  }

  // Rule 4: Only package/lock files (dependency update)
  if (filePaths.length > 0 && filePaths.every(isDependencyFile)) {
    return { type: "chore", confidence: 0.9, reason: "Dependency update" };
  }

  // Rule 5: Only style/format files or whitespace-only changes
  if (isStyleOnlyChange(diff)) {
    return { type: "style", confidence: 0.85, reason: "Style/formatting changes only" };
  }

  // Rule 6: Build config files only
  if (filePaths.length > 0 && filePaths.every(isBuildFile)) {
    return { type: "build", confidence: 0.9, reason: "Build configuration changes" };
  }

  // Rule 7: All new files (likely a new feature)
  if (stagedFiles.length > 0 && stagedFiles.every((f) => f.status === "added")) {
    return { type: "feat", confidence: 0.8, reason: "All files are newly added" };
  }

  // Rule 8: All deleted files
  if (stagedFiles.length > 0 && stagedFiles.every((f) => f.status === "deleted")) {
    return { type: "chore", confidence: 0.7, reason: "Files removed" };
  }

  // Rule 9: Keyword analysis from diff content
  const keywordResult = analyzeKeywords(diff);
  if (keywordResult.confidence > 0.05) {
    return keywordResult;
  }

  // Rule 10: File pattern matching
  const filePatternResult = analyzeFilePatterns(filePaths);
  if (filePatternResult.confidence > 0.3) {
    return filePatternResult;
  }

  // Rule 11: Heuristics based on additions vs deletions
  if (diff.totalAdditions > 0 && diff.totalDeletions === 0) {
    return { type: "feat", confidence: 0.5, reason: "Only additions detected" };
  }

  if (diff.totalDeletions > diff.totalAdditions * 2) {
    return { type: "refactor", confidence: 0.5, reason: "Significant code removal (likely refactoring)" };
  }

  // Default
  return { type: "chore", confidence: 0.3, reason: "General changes" };
}

function analyzeKeywords(diff: ParsedDiff): TypeDetectionResult {
  const allContent = diff.files
    .flatMap((f) => f.hunks.flatMap((h) => [...h.addedLines, ...h.removedLines]))
    .join(" ")
    .toLowerCase();

  const scores: Partial<Record<CommitType, number>> = {};

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as Array<[CommitType, string[]]>) {
    let score = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = allContent.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      scores[type] = score;
    }
  }

  const entries = Object.entries(scores) as Array<[CommitType, number]>;
  if (entries.length === 0) {
    return { type: "chore", confidence: 0, reason: "" };
  }

  entries.sort((a, b) => b[1] - a[1]);
  const [topType, topScore] = entries[0];
  const confidence = Math.min(0.8, topScore / 10);

  return {
    type: topType,
    confidence,
    reason: `Keyword analysis: "${topType}" keywords found (score: ${topScore})`,
  };
}

function analyzeFilePatterns(filePaths: string[]): TypeDetectionResult {
  const typeCounts: Partial<Record<CommitType, number>> = {};

  for (const filePath of filePaths) {
    for (const { pattern, type } of FILE_TYPE_PATTERNS) {
      if (pattern.test(filePath)) {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
        break;
      }
    }
  }

  const entries = Object.entries(typeCounts) as Array<[CommitType, number]>;
  if (entries.length === 0) {
    return { type: "chore", confidence: 0, reason: "" };
  }

  entries.sort((a, b) => b[1] - a[1]);
  const [topType, count] = entries[0];
  const confidence = count / filePaths.length;

  return {
    type: topType,
    confidence,
    reason: `File pattern analysis: ${count}/${filePaths.length} files match "${topType}"`,
  };
}

function isTestFile(path: string): boolean {
  return /\.(test|spec)\.(ts|tsx|js|jsx|py|go|rs)$/.test(path) || path.includes("__tests__/");
}

function isDocFile(path: string): boolean {
  return /\.(md|txt|rst|adoc)$/.test(path) || path.startsWith("docs/") || /^(README|LICENSE|CHANGELOG|CONTRIBUTING)/.test(path);
}

function isCIFile(path: string): boolean {
  return /^\.github\/(workflows|actions)\//.test(path) || /^\.gitlab-ci/.test(path) || /^Jenkinsfile/.test(path) || /^\.circleci\//.test(path);
}

function isDependencyFile(path: string): boolean {
  return /^(package(-lock)?\.json|yarn\.lock|pnpm-lock\.yaml|Gemfile(\.lock)?|Cargo\.(toml|lock)|go\.(mod|sum)|requirements.*\.txt|composer\.(json|lock))$/.test(path);
}

function isBuildFile(path: string): boolean {
  return /^(webpack|vite|rollup|esbuild|tsup)\.config/.test(path) || /^Dockerfile/.test(path) || /^docker-compose/.test(path) || /^Makefile$/.test(path);
}

function isStyleOnlyChange(diff: ParsedDiff): boolean {
  // Need actual hunks with content to determine style-only
  let hasChanges = false;

  for (const file of diff.files) {
    for (const hunk of file.hunks) {
      if (hunk.addedLines.length === 0 && hunk.removedLines.length === 0) continue;
      hasChanges = true;

      // Must have equal number of added/removed lines for whitespace-only
      if (hunk.addedLines.length !== hunk.removedLines.length) return false;

      for (let i = 0; i < hunk.addedLines.length; i++) {
        const added = hunk.addedLines[i]?.trim();
        const removed = hunk.removedLines[i]?.trim();
        // If content changed (not just whitespace), it's not style-only
        if (added !== removed) {
          return false;
        }
      }
    }
  }

  // Only return true if we actually found whitespace-only changes
  return hasChanges;
}
