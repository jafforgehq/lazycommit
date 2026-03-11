import { execSync } from "node:child_process";

export interface StagedFile {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed" | "copied";
  oldPath?: string; // For renames
}

export function getStagedFiles(): StagedFile[] {
  let output: string;
  try {
    output = execSync("git status --porcelain", {
      encoding: "utf-8",
    });
  } catch {
    return [];
  }

  const files: StagedFile[] = [];

  for (const line of output.split("\n").filter(Boolean)) {
    // Git status porcelain format: XY filename
    // X = staging area status, Y = working tree status
    const stagingStatus = line[0];
    const filePath = line.slice(3).trim();

    // Only include staged files (X column has a value)
    if (stagingStatus === " " || stagingStatus === "?") continue;

    let status: StagedFile["status"];
    let oldPath: string | undefined;

    switch (stagingStatus) {
      case "A":
        status = "added";
        break;
      case "M":
        status = "modified";
        break;
      case "D":
        status = "deleted";
        break;
      case "R": {
        status = "renamed";
        const parts = filePath.split(" -> ");
        oldPath = parts[0];
        break;
      }
      case "C":
        status = "copied";
        break;
      default:
        status = "modified";
    }

    files.push({
      path: filePath.includes(" -> ") ? filePath.split(" -> ")[1] : filePath,
      status,
      ...(oldPath && { oldPath }),
    });
  }

  return files;
}

export function hasStagedChanges(): boolean {
  try {
    const output = execSync("git diff --staged --name-only", {
      encoding: "utf-8",
    });
    return output.trim().length > 0;
  } catch {
    return false;
  }
}

export function isGitRepo(): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      encoding: "utf-8",
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

export function getCurrentBranch(): string {
  try {
    return execSync("git branch --show-current", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return "unknown";
  }
}
