import type { ParsedDiff } from "../git/diff.js";
import type { StagedFile } from "../git/files.js";
import type { LazycommitConfig } from "../config/defaults.js";
import { detectCommitType } from "./type-detector.js";
import { detectScope } from "./scope-detector.js";
import { generateSubject } from "./subject-generator.js";
import { generateBody } from "./body-generator.js";

export interface CommitSuggestion {
  type: string;
  scope: string | null;
  subject: string;
  body: string;
  breakingChange: string | null;
  fullMessage: string;
  confidence: number;
  reason: string;
}

export function analyzeAndSuggest(
  diff: ParsedDiff,
  stagedFiles: StagedFile[],
  config?: LazycommitConfig
): CommitSuggestion {
  // Step 1: Detect commit type
  const typeResult = detectCommitType(diff, stagedFiles);

  // Step 2: Detect scope
  const scope = config?.includeScope !== false
    ? detectScope(stagedFiles, config)
    : null;

  // Step 3: Generate subject
  const maxSubjectLength = config?.maxSubjectLength || 72;
  const subject = generateSubject(typeResult.type, diff, stagedFiles, maxSubjectLength);

  // Step 4: Generate body
  const bodyResult = config?.includeBody !== false
    ? generateBody(diff, stagedFiles)
    : { description: "", breakingChange: null };

  // Step 5: Assemble full message
  const header = scope
    ? `${typeResult.type}(${scope}): ${subject}`
    : `${typeResult.type}: ${subject}`;

  let fullMessage = header;

  if (bodyResult.description) {
    fullMessage += `\n\n${bodyResult.description}`;
  }

  if (bodyResult.breakingChange) {
    fullMessage += `\n\nBREAKING CHANGE: ${bodyResult.breakingChange}`;
  }

  return {
    type: typeResult.type,
    scope,
    subject,
    body: bodyResult.description,
    breakingChange: bodyResult.breakingChange,
    fullMessage,
    confidence: typeResult.confidence,
    reason: typeResult.reason,
  };
}

export { detectCommitType } from "./type-detector.js";
export { detectScope } from "./scope-detector.js";
export { generateSubject } from "./subject-generator.js";
export { generateBody } from "./body-generator.js";
