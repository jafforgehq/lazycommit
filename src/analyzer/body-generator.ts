import type { ParsedDiff } from "../git/diff.js";
import type { StagedFile } from "../git/files.js";

export interface CommitBody {
  description: string;
  breakingChange: string | null;
}

export function generateBody(
  diff: ParsedDiff,
  stagedFiles: StagedFile[]
): CommitBody {
  const lines: string[] = [];

  // List changed files (max 10)
  const filesByStatus = groupByStatus(stagedFiles);

  if (filesByStatus.added.length > 0) {
    lines.push(...filesByStatus.added.slice(0, 5).map((f) => `- Add ${f}`));
    if (filesByStatus.added.length > 5) {
      lines.push(`- ...and ${filesByStatus.added.length - 5} more added files`);
    }
  }

  if (filesByStatus.modified.length > 0) {
    lines.push(...filesByStatus.modified.slice(0, 5).map((f) => `- Update ${f}`));
    if (filesByStatus.modified.length > 5) {
      lines.push(`- ...and ${filesByStatus.modified.length - 5} more modified files`);
    }
  }

  if (filesByStatus.deleted.length > 0) {
    lines.push(...filesByStatus.deleted.slice(0, 5).map((f) => `- Remove ${f}`));
    if (filesByStatus.deleted.length > 5) {
      lines.push(`- ...and ${filesByStatus.deleted.length - 5} more deleted files`);
    }
  }

  // Detect breaking changes
  const breakingChange = detectBreakingChanges(diff);

  const description = lines.join("\n");

  return { description, breakingChange };
}

function groupByStatus(files: StagedFile[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {
    added: [],
    modified: [],
    deleted: [],
    renamed: [],
  };

  for (const file of files) {
    const status = file.status === "copied" ? "added" : file.status;
    if (!groups[status]) groups[status] = [];
    groups[status].push(file.path);
  }

  return groups;
}

function detectBreakingChanges(diff: ParsedDiff): string | null {
  const breakingIndicators: string[] = [];

  for (const file of diff.files) {
    for (const hunk of file.hunks) {
      // Check for removed exports
      for (const line of hunk.removedLines) {
        if (/^export\s+(function|class|const|let|var|interface|type|enum)\s+/.test(line.trim())) {
          const match = line.match(/export\s+(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/);
          if (match) {
            breakingIndicators.push(`Removed export: ${match[1]}`);
          }
        }
      }

      // Check for changed function signatures
      for (const removedLine of hunk.removedLines) {
        const funcMatch = removedLine.match(/(?:function|def|fn|func)\s+(\w+)\s*\(([^)]*)\)/);
        if (funcMatch) {
          const funcName = funcMatch[1];
          // Check if the same function exists in added lines with different params
          for (const addedLine of hunk.addedLines) {
            const addedMatch = addedLine.match(new RegExp(`(?:function|def|fn|func)\\s+${funcName}\\s*\\(([^)]*)\\)`));
            if (addedMatch && addedMatch[1] !== funcMatch[2]) {
              breakingIndicators.push(`Changed signature: ${funcName}`);
            }
          }
        }
      }

      // Check for interface/type changes
      for (const line of hunk.removedLines) {
        if (/^\s*(interface|type)\s+\w+/.test(line)) {
          const match = line.match(/(interface|type)\s+(\w+)/);
          if (match) {
            breakingIndicators.push(`Modified ${match[1]}: ${match[2]}`);
          }
        }
      }
    }
  }

  if (breakingIndicators.length === 0) return null;

  return breakingIndicators.slice(0, 3).join("; ");
}
