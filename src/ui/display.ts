import chalk from "chalk";
import type { CommitSuggestion } from "../analyzer/index.js";

const TYPE_COLORS: Record<string, (text: string) => string> = {
  feat: chalk.green,
  fix: chalk.red,
  refactor: chalk.yellow,
  test: chalk.cyan,
  docs: chalk.blue,
  chore: chalk.gray,
  perf: chalk.magenta,
  ci: chalk.blueBright,
  style: chalk.white,
  build: chalk.yellowBright,
  revert: chalk.redBright,
};

const TYPE_LABELS: Record<string, string> = {
  feat: "FEATURE",
  fix: "BUG FIX",
  refactor: "REFACTOR",
  test: "TEST",
  docs: "DOCS",
  chore: "CHORE",
  perf: "PERF",
  ci: "CI/CD",
  style: "STYLE",
  build: "BUILD",
  revert: "REVERT",
};

export function displaySuggestion(suggestion: CommitSuggestion, source: "heuristic" | "ai" = "heuristic"): void {
  const colorFn = TYPE_COLORS[suggestion.type] || chalk.white;
  const label = TYPE_LABELS[suggestion.type] || suggestion.type.toUpperCase();

  console.log();
  console.log(chalk.dim("─".repeat(60)));

  // Source badge
  const sourceBadge = source === "ai"
    ? chalk.bgMagenta.white(" AI ")
    : chalk.bgGray.white(" LOCAL ");
  console.log(`  ${sourceBadge}  ${chalk.dim("Commit Suggestion")}`);

  console.log();

  // Type badge + header
  const typeBadge = colorFn(`[${label}]`);
  const header = suggestion.scope
    ? `${suggestion.type}(${chalk.cyan(suggestion.scope)}): ${suggestion.subject}`
    : `${suggestion.type}: ${suggestion.subject}`;

  console.log(`  ${typeBadge}  ${chalk.bold(header)}`);

  // Body
  if (suggestion.body) {
    console.log();
    for (const line of suggestion.body.split("\n")) {
      console.log(`  ${chalk.dim(line)}`);
    }
  }

  // Breaking change warning
  if (suggestion.breakingChange) {
    console.log();
    console.log(`  ${chalk.bgRed.white(" BREAKING CHANGE ")} ${chalk.red(suggestion.breakingChange)}`);
  }

  // Confidence indicator
  console.log();
  const confidenceBar = getConfidenceBar(suggestion.confidence);
  console.log(`  ${chalk.dim("Confidence:")} ${confidenceBar} ${chalk.dim(`${Math.round(suggestion.confidence * 100)}%`)}`);

  console.log(chalk.dim("─".repeat(60)));
  console.log();
}

function getConfidenceBar(confidence: number): string {
  const filled = Math.round(confidence * 10);
  const empty = 10 - filled;

  let color: (text: string) => string;
  if (confidence >= 0.8) color = chalk.green;
  else if (confidence >= 0.5) color = chalk.yellow;
  else color = chalk.red;

  return color("█".repeat(filled)) + chalk.dim("░".repeat(empty));
}

export function displayError(message: string): void {
  console.log();
  console.log(`  ${chalk.red("✖")} ${chalk.red(message)}`);
  console.log();
}

export function displaySuccess(hash: string, message: string): void {
  console.log();
  console.log(`  ${chalk.green("✔")} Committed ${chalk.cyan(hash)}`);
  console.log(`  ${chalk.dim(message.split("\n")[0])}`);
  console.log();
}

export function displayWelcome(): void {
  console.log();
  console.log(`  ${chalk.bold("lazycommit")} ${chalk.dim("— smart commit messages")}`);
  console.log();
}
