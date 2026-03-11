import type { ParsedDiff } from "../git/diff.js";
import type { StagedFile } from "../git/files.js";
import type { CommitType } from "./rules.js";
import { ACTION_VERBS } from "./rules.js";

export function generateSubject(
  type: CommitType,
  diff: ParsedDiff,
  stagedFiles: StagedFile[],
  maxLength: number = 72
): string {
  const filePaths = stagedFiles.map((f) => f.path);

  // Strategy 1: Extract meaningful function/class names from diff
  const functionName = extractChangedFunctionName(diff);
  if (functionName) {
    const verb = getVerbForType(type);
    return truncate(`${verb} ${functionName}`, maxLength);
  }

  // Strategy 2: Single file — describe based on filename
  if (filePaths.length === 1) {
    return truncate(describeFileChange(filePaths[0], stagedFiles[0], type, diff), maxLength);
  }

  // Strategy 3: All files are the same type of change
  if (stagedFiles.every((f) => f.status === "added")) {
    return truncate(describeNewFiles(filePaths, type), maxLength);
  }

  if (stagedFiles.every((f) => f.status === "deleted")) {
    return truncate(`remove ${describeFileGroup(filePaths)}`, maxLength);
  }

  // Strategy 4: Extract action from diff keywords
  const action = extractActionFromDiff(diff);
  if (action) {
    return truncate(action, maxLength);
  }

  // Strategy 5: Describe the group of files
  return truncate(describeFileGroup(filePaths), maxLength);
}

function extractChangedFunctionName(diff: ParsedDiff): string | null {
  for (const file of diff.files) {
    for (const hunk of file.hunks) {
      // Check hunk header for function context (git often includes function name)
      if (hunk.header) {
        const funcMatch = hunk.header.match(/(?:function|class|def|fn|func|pub fn|async)\s+(\w+)/);
        if (funcMatch) return funcMatch[1];
      }

      // Check added lines for new function definitions
      for (const line of hunk.addedLines) {
        const patterns = [
          /(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
          /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/,
          /(?:export\s+)?class\s+(\w+)/,
          /def\s+(\w+)\s*\(/,
          /fn\s+(\w+)\s*\(/,
          /func\s+(\w+)\s*\(/,
          /pub\s+fn\s+(\w+)/,
        ];

        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match) return match[1];
        }
      }
    }
  }

  return null;
}

function describeFileChange(
  filePath: string,
  file: StagedFile,
  type: CommitType,
  _diff: ParsedDiff
): string {
  const fileName = getReadableName(filePath);
  const verb = getVerbForType(type);

  switch (file.status) {
    case "added":
      return `add ${fileName}`;
    case "deleted":
      return `remove ${fileName}`;
    case "renamed":
      return `rename ${file.oldPath ? getReadableName(file.oldPath) : ""} to ${fileName}`;
    default:
      return `${verb} ${fileName}`;
  }
}

function describeNewFiles(filePaths: string[], _type: CommitType): string {
  if (filePaths.length === 1) {
    return `add ${getReadableName(filePaths[0])}`;
  }

  // Check if files share a common purpose
  const commonDir = getCommonDirectory(filePaths);
  if (commonDir) {
    return `add ${commonDir} files`;
  }

  return `add ${filePaths.length} new files`;
}

function describeFileGroup(filePaths: string[]): string {
  if (filePaths.length === 1) {
    return `update ${getReadableName(filePaths[0])}`;
  }

  if (filePaths.length <= 3) {
    const names = filePaths.map(getReadableName);
    return `update ${names.join(", ")}`;
  }

  const commonDir = getCommonDirectory(filePaths);
  if (commonDir) {
    return `update ${commonDir} files`;
  }

  return `update ${filePaths.length} files`;
}

function extractActionFromDiff(diff: ParsedDiff): string | null {
  const addedContent = diff.files
    .flatMap((f) => f.hunks.flatMap((h) => h.addedLines))
    .join(" ")
    .toLowerCase();

  // Look for action verbs in added code
  for (const [keyword, verb] of Object.entries(ACTION_VERBS)) {
    if (addedContent.includes(keyword)) {
      // Try to extract what was acted upon
      const regex = new RegExp(`${keyword}\\s+(\\w+)`, "i");
      const match = addedContent.match(regex);
      if (match) {
        return `${verb} ${match[1]}`;
      }
    }
  }

  return null;
}

function getVerbForType(type: CommitType): string {
  switch (type) {
    case "feat": return "add";
    case "fix": return "fix";
    case "refactor": return "refactor";
    case "test": return "add tests for";
    case "docs": return "update";
    case "perf": return "optimize";
    case "style": return "format";
    case "build": return "update";
    case "ci": return "update";
    case "revert": return "revert";
    default: return "update";
  }
}

function getReadableName(filePath: string): string {
  const parts = filePath.split("/");
  const fileName = parts[parts.length - 1];

  // Remove extension for readability
  const name = fileName.replace(/\.[^/.]+$/, "");

  // Convert camelCase/PascalCase to readable
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .toLowerCase();
}

function getCommonDirectory(filePaths: string[]): string | null {
  if (filePaths.length === 0) return null;

  const dirs = filePaths.map((fp) => {
    const parts = fp.split("/");
    parts.pop(); // Remove filename
    return parts.join("/");
  });

  // Find common prefix
  const first = dirs[0];
  if (!first) return null;

  let commonPrefix = first;
  for (const dir of dirs.slice(1)) {
    while (!dir.startsWith(commonPrefix) && commonPrefix.length > 0) {
      const parts = commonPrefix.split("/");
      parts.pop();
      commonPrefix = parts.join("/");
    }
  }

  if (commonPrefix.length === 0) return null;

  const parts = commonPrefix.split("/");
  // Skip "src" as too generic
  const meaningful = parts.filter((p) => p !== "src");
  return meaningful[meaningful.length - 1] || null;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
