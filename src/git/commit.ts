import { execSync } from "node:child_process";

export function executeCommit(message: string): { success: boolean; hash?: string; error?: string } {
  try {
    execSync(`git commit -m ${escapeShellArg(message)}`, {
      encoding: "utf-8",
      stdio: "pipe",
    });

    // Get the commit hash
    const hash = execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
    }).trim();

    return { success: true, hash };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, error };
  }
}

function escapeShellArg(arg: string): string {
  // Use $'...' syntax to handle special characters properly
  return `$'${arg.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n")}'`;
}
