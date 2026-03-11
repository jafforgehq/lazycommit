import { existsSync, readFileSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const HOOK_NAME = "prepare-commit-msg";
const HOOK_MARKER = "# Written by lazycommit";

const HOOK_SCRIPT = `#!/bin/sh
# Written by lazycommit
# Remove with: lazycommit uninstall
COMMIT_MSG_FILE="$1"
COMMIT_SOURCE="$2"

# Only run for plain git commit (skip merges, amends, -m commits)
if [ -n "$COMMIT_SOURCE" ]; then
  exit 0
fi

lazycommit --hook "$COMMIT_MSG_FILE" 2>/dev/null || true
`;

export function getGitRoot(): string {
  return execSync("git rev-parse --show-toplevel", {
    encoding: "utf-8",
    stdio: "pipe",
  }).trim();
}

export function isHookInstalled(gitRoot: string): boolean {
  const hookPath = join(gitRoot, ".git", "hooks", HOOK_NAME);
  if (!existsSync(hookPath)) return false;
  try {
    const content = readFileSync(hookPath, "utf-8");
    return content.includes(HOOK_MARKER);
  } catch {
    return false;
  }
}

export function installHook(gitRoot: string): { success: boolean; message: string } {
  const hooksDir = join(gitRoot, ".git", "hooks");
  const hookPath = join(hooksDir, HOOK_NAME);
  const backupPath = hookPath + ".bak";

  // Back up existing hook if it's not ours
  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, "utf-8");
    if (existing.includes(HOOK_MARKER)) {
      return { success: true, message: "Hook already installed." };
    }
    renameSync(hookPath, backupPath);
  }

  writeFileSync(hookPath, HOOK_SCRIPT, "utf-8");
  execSync(`chmod +x "${hookPath}"`);

  return {
    success: true,
    message: `Hook installed at ${hookPath}`,
  };
}

export function uninstallHook(gitRoot: string): { success: boolean; message: string } {
  const hookPath = join(gitRoot, ".git", "hooks", HOOK_NAME);
  const backupPath = hookPath + ".bak";

  if (!existsSync(hookPath)) {
    return { success: true, message: "No hook found to remove." };
  }

  const content = readFileSync(hookPath, "utf-8");
  if (!content.includes(HOOK_MARKER)) {
    return { success: false, message: "Hook was not installed by lazycommit — not removing." };
  }

  unlinkSync(hookPath);

  if (existsSync(backupPath)) {
    renameSync(backupPath, hookPath);
    return { success: true, message: "Hook removed. Previous hook restored." };
  }

  return { success: true, message: "Hook removed." };
}
