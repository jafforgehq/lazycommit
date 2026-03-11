export { getStagedDiff, parseDiff } from "./diff.js";
export type { ParsedDiff, FileDiff, DiffHunk } from "./diff.js";

export { getStagedFiles, hasStagedChanges, isGitRepo, getCurrentBranch } from "./files.js";
export type { StagedFile } from "./files.js";

export { executeCommit } from "./commit.js";

export { getGitRoot, isHookInstalled, installHook, uninstallHook } from "./hooks.js";
