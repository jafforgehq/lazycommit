export { analyzeAndSuggest } from "./analyzer/index.js";
export type { CommitSuggestion } from "./analyzer/index.js";

export { getStagedDiff, getStagedFiles, hasStagedChanges, isGitRepo, executeCommit, getGitRoot, isHookInstalled, installHook, uninstallHook } from "./git/index.js";

export { loadConfig, initConfig } from "./config/index.js";
export type { LazycommitConfig } from "./config/index.js";

export { createAIProvider } from "./ai/index.js";

export { displaySuggestion, displayError, displaySuccess, displayWelcome, promptUser, promptEdit } from "./ui/index.js";
