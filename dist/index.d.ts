interface FileDiff {
    filePath: string;
    status: "added" | "modified" | "deleted" | "renamed";
    additions: number;
    deletions: number;
    hunks: DiffHunk[];
}
interface DiffHunk {
    header: string;
    addedLines: string[];
    removedLines: string[];
    context: string[];
}
interface ParsedDiff {
    files: FileDiff[];
    totalAdditions: number;
    totalDeletions: number;
    rawDiff: string;
}
declare function getStagedDiff(): ParsedDiff;

interface StagedFile {
    path: string;
    status: "added" | "modified" | "deleted" | "renamed" | "copied";
    oldPath?: string;
}
declare function getStagedFiles(): StagedFile[];
declare function hasStagedChanges(): boolean;
declare function isGitRepo(): boolean;

interface LazycommitConfig {
    conventionalCommits: boolean;
    maxSubjectLength: number;
    includeBody: boolean;
    includeScope: boolean;
    allowedTypes?: string[];
    scopeMappings?: Record<string, string>;
    ticketPattern?: string;
    ai: {
        enabled: boolean;
        provider: "anthropic" | "openai" | null;
        apiKey: string | null;
        model?: string;
    };
}

interface CommitSuggestion {
    type: string;
    scope: string | null;
    subject: string;
    body: string;
    breakingChange: string | null;
    fullMessage: string;
    confidence: number;
    reason: string;
}
declare function analyzeAndSuggest(diff: ParsedDiff, stagedFiles: StagedFile[], config?: LazycommitConfig): CommitSuggestion;

declare function executeCommit(message: string): {
    success: boolean;
    hash?: string;
    error?: string;
};

declare function loadConfig(): LazycommitConfig;
declare function initConfig(path?: string): string;

interface AIProvider {
    name: string;
    generateCommitMessage(diff: string, context: AIContext): Promise<string>;
}
interface AIContext {
    files: string[];
    additions: number;
    deletions: number;
    heuristicSuggestion: string;
}

declare function createAIProvider(config: LazycommitConfig): AIProvider | null;

declare function displaySuggestion(suggestion: CommitSuggestion, source?: "heuristic" | "ai"): void;
declare function displayError(message: string): void;
declare function displaySuccess(hash: string, message: string): void;
declare function displayWelcome(): void;

type UserAction = "approve" | "edit" | "reject" | "regenerate" | "ai";
declare function promptUser(hasAI: boolean): Promise<UserAction>;
declare function promptEdit(currentMessage: string): Promise<string>;

export { type CommitSuggestion, type LazycommitConfig, analyzeAndSuggest, createAIProvider, displayError, displaySuccess, displaySuggestion, displayWelcome, executeCommit, getStagedDiff, getStagedFiles, hasStagedChanges, initConfig, isGitRepo, loadConfig, promptEdit, promptUser };
