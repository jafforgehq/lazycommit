import { Command } from "commander";
import chalk from "chalk";
import {
  isGitRepo,
  hasStagedChanges,
  getStagedDiff,
  getStagedFiles,
  executeCommit,
  analyzeAndSuggest,
  loadConfig,
  initConfig,
  createAIProvider,
  displaySuggestion,
  displayError,
  displaySuccess,
  displayWelcome,
  promptUser,
  promptEdit,
} from "../src/index.js";

const program = new Command();

program
  .name("lazycommit")
  .description("Auto-generate semantic commit messages from staged changes")
  .version("1.0.0");

// Main command (default)
program
  .command("commit", { isDefault: true })
  .description("Analyze staged changes and suggest a commit message")
  .option("--dry-run", "Show suggestion without committing")
  .option("--auto", "Auto-approve the suggestion (no prompt)")
  .option("--ai", "Force AI mode for this commit")
  .option("--no-body", "Omit commit body")
  .option("--no-scope", "Omit scope from commit message")
  .action(async (options) => {
    displayWelcome();

    // Pre-flight checks
    if (!isGitRepo()) {
      displayError("Not a git repository. Run this command inside a git repo.");
      process.exit(1);
    }

    if (!hasStagedChanges()) {
      displayError("No staged changes found. Run 'git add' first.");
      process.exit(1);
    }

    // Load config
    const config = loadConfig();

    // Apply CLI overrides
    if (options.body === false) config.includeBody = false;
    if (options.scope === false) config.includeScope = false;
    if (options.ai) config.ai.enabled = true;

    // Get staged data
    const diff = getStagedDiff();
    const stagedFiles = getStagedFiles();

    if (diff.files.length === 0) {
      displayError("Could not parse staged changes.");
      process.exit(1);
    }

    // Generate suggestion
    let suggestion = analyzeAndSuggest(diff, stagedFiles, config);
    let source: "heuristic" | "ai" = "heuristic";

    // Try AI if enabled
    const aiProvider = createAIProvider(config);
    if (aiProvider && config.ai.enabled) {
      try {
        console.log(chalk.dim("  Asking AI for suggestion..."));
        const aiMessage = await aiProvider.generateCommitMessage(diff.rawDiff, {
          files: stagedFiles.map((f) => f.path),
          additions: diff.totalAdditions,
          deletions: diff.totalDeletions,
          heuristicSuggestion: suggestion.fullMessage,
        });

        suggestion = {
          ...suggestion,
          fullMessage: aiMessage,
          subject: aiMessage.split("\n")[0].replace(/^\w+(\(.*?\))?:\s*/, ""),
        };
        source = "ai";
      } catch (err) {
        console.log(chalk.dim(`  AI failed, using heuristic: ${err instanceof Error ? err.message : String(err)}`));
      }
    }

    // Display suggestion
    displaySuggestion(suggestion, source);

    // Dry run mode
    if (options.dryRun) {
      console.log(chalk.dim("  Dry run mode — no commit created."));
      process.exit(0);
    }

    // Auto mode
    if (options.auto) {
      const result = executeCommit(suggestion.fullMessage);
      if (result.success) {
        displaySuccess(result.hash!, suggestion.fullMessage);
      } else {
        displayError(`Commit failed: ${result.error}`);
        process.exit(1);
      }
      process.exit(0);
    }

    // Interactive mode
    let commitMessage = suggestion.fullMessage;
    let done = false;

    while (!done) {
      const action = await promptUser(!!aiProvider && !config.ai.enabled);

      switch (action) {
        case "approve": {
          const result = executeCommit(commitMessage);
          if (result.success) {
            displaySuccess(result.hash!, commitMessage);
          } else {
            displayError(`Commit failed: ${result.error}`);
            process.exit(1);
          }
          done = true;
          break;
        }

        case "edit": {
          commitMessage = await promptEdit(commitMessage);
          console.log();
          console.log(chalk.dim("  Updated message:"));
          console.log(`  ${chalk.bold(commitMessage.split("\n")[0])}`);
          console.log();
          // Prompt again after edit
          break;
        }

        case "reject": {
          console.log(chalk.dim("  Commit cancelled."));
          process.exit(0);
          break;
        }

        case "regenerate": {
          suggestion = analyzeAndSuggest(diff, stagedFiles, config);
          commitMessage = suggestion.fullMessage;
          displaySuggestion(suggestion, "heuristic");
          break;
        }

        case "ai": {
          if (aiProvider) {
            try {
              console.log(chalk.dim("  Asking AI for suggestion..."));
              const aiMessage = await aiProvider.generateCommitMessage(diff.rawDiff, {
                files: stagedFiles.map((f) => f.path),
                additions: diff.totalAdditions,
                deletions: diff.totalDeletions,
                heuristicSuggestion: suggestion.fullMessage,
              });
              commitMessage = aiMessage;
              suggestion = { ...suggestion, fullMessage: aiMessage };
              displaySuggestion(suggestion, "ai");
            } catch (err) {
              displayError(`AI failed: ${err instanceof Error ? err.message : String(err)}`);
            }
          } else {
            displayError("No AI provider configured. Run 'lazycommit config' to set up.");
          }
          break;
        }
      }
    }
  });

// Init command
program
  .command("init")
  .description("Create a .lazycommit.json config file in the current project")
  .action(() => {
    const result = initConfig();
    console.log(`  ${chalk.green("✔")} ${result}`);
  });

// Config command
program
  .command("config")
  .description("Interactive configuration setup")
  .option("--set-key <key>", "Set AI API key")
  .option("--provider <provider>", "Set AI provider (anthropic or openai)")
  .action(async (options) => {
    if (options.setKey) {
      const _config = loadConfig();

      // Auto-detect provider from key format
      let provider = options.provider;
      if (!provider) {
        if (options.setKey.startsWith("sk-ant-")) {
          provider = "anthropic";
        } else if (options.setKey.startsWith("sk-")) {
          provider = "openai";
        }
      }

      if (!provider) {
        displayError("Could not detect provider. Use --provider anthropic|openai");
        process.exit(1);
      }

      const _result = initConfig();
      console.log(`  ${chalk.green("✔")} Provider: ${provider}`);
      console.log(`  ${chalk.green("✔")} API key configured`);
      console.log();
      console.log(chalk.dim("  Tip: You can also set ANTHROPIC_API_KEY or OPENAI_API_KEY env vars."));
    } else {
      console.log();
      console.log(`  ${chalk.bold("lazycommit config")}`);
      console.log();
      console.log("  Set AI provider:");
      console.log(chalk.dim("    lazycommit config --set-key sk-ant-... --provider anthropic"));
      console.log(chalk.dim("    lazycommit config --set-key sk-... --provider openai"));
      console.log();
      console.log("  Or use environment variables:");
      console.log(chalk.dim("    export ANTHROPIC_API_KEY=sk-ant-..."));
      console.log(chalk.dim("    export OPENAI_API_KEY=sk-..."));
      console.log();
      console.log("  Then enable AI:");
      console.log(chalk.dim("    lazycommit --ai"));
      console.log();
    }
  });

program.parse();
