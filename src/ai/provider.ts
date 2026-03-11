export interface AIProvider {
  name: string;
  generateCommitMessage(diff: string, context: AIContext): Promise<string>;
}

export interface AIContext {
  files: string[];
  additions: number;
  deletions: number;
  heuristicSuggestion: string; // What the non-AI engine suggested
}

export const SYSTEM_PROMPT = `You are a commit message generator. Given a git diff and context, generate a single commit message following the Conventional Commits specification.

Rules:
- Format: type(scope): subject
- Types: feat, fix, refactor, test, docs, chore, perf, ci, style, build
- Subject should be lowercase, imperative mood, no period at end
- Keep subject under 72 characters
- If there are breaking changes, add a BREAKING CHANGE footer
- Add a brief body listing what changed (use bullet points with -)

Reply ONLY with the commit message, nothing else.`;

export function buildUserPrompt(diff: string, context: AIContext): string {
  return `Generate a commit message for this diff:

Files changed: ${context.files.join(", ")}
Lines: +${context.additions} -${context.deletions}

Heuristic suggestion (for reference): ${context.heuristicSuggestion}

Diff:
\`\`\`
${diff.slice(0, 8000)}
\`\`\``;
}
