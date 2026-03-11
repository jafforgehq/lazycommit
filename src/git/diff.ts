import { execSync } from "node:child_process";

export interface FileDiff {
  filePath: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  header: string;
  addedLines: string[];
  removedLines: string[];
  context: string[];
}

export interface ParsedDiff {
  files: FileDiff[];
  totalAdditions: number;
  totalDeletions: number;
  rawDiff: string;
}

export function getStagedDiff(): ParsedDiff {
  let rawDiff: string;
  try {
    rawDiff = execSync("git diff --staged", {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
  } catch {
    rawDiff = "";
  }

  if (!rawDiff.trim()) {
    return { files: [], totalAdditions: 0, totalDeletions: 0, rawDiff: "" };
  }

  return parseDiff(rawDiff);
}

export function parseDiff(rawDiff: string): ParsedDiff {
  const files: FileDiff[] = [];
  let totalAdditions = 0;
  let totalDeletions = 0;

  // Split by file boundaries
  const fileSections = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const section of fileSections) {
    const fileDiff = parseFileSection(section);
    if (fileDiff) {
      files.push(fileDiff);
      totalAdditions += fileDiff.additions;
      totalDeletions += fileDiff.deletions;
    }
  }

  return { files, totalAdditions, totalDeletions, rawDiff };
}

function parseFileSection(section: string): FileDiff | null {
  const lines = section.split("\n");

  // Extract file path
  const headerMatch = lines[0]?.match(/a\/(.+?) b\/(.+)/);
  if (!headerMatch) return null;

  const filePath = headerMatch[2];

  // Detect status
  let status: FileDiff["status"] = "modified";
  if (section.includes("new file mode")) {
    status = "added";
  } else if (section.includes("deleted file mode")) {
    status = "deleted";
  } else if (section.includes("rename from")) {
    status = "renamed";
  }

  // Parse hunks
  const hunks: DiffHunk[] = [];
  let additions = 0;
  let deletions = 0;

  const hunkRegex = /^@@\s+.+?\s+@@(.*)/;
  let currentHunk: DiffHunk | null = null;

  for (const line of lines) {
    const hunkMatch = line.match(hunkRegex);
    if (hunkMatch) {
      if (currentHunk) hunks.push(currentHunk);
      currentHunk = {
        header: hunkMatch[1]?.trim() || "",
        addedLines: [],
        removedLines: [],
        context: [],
      };
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith("+") && !line.startsWith("+++")) {
      currentHunk.addedLines.push(line.slice(1));
      additions++;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      currentHunk.removedLines.push(line.slice(1));
      deletions++;
    } else if (line.startsWith(" ")) {
      currentHunk.context.push(line.slice(1));
    }
  }

  if (currentHunk) hunks.push(currentHunk);

  return { filePath, status, additions, deletions, hunks };
}
