# lazycommit

Auto-generate semantic commit messages from your staged changes. Works offline with smart heuristics — no AI required. Optional AI upgrade with your own API key.

## The Problem

You make 15 commits a day. Each one takes 2-5 minutes to think about a good message. That's **30-75 minutes daily** spent on commit messages instead of code.

## The Solution

```bash
git add .
lazycommit
```

Bad commits:
```
fixed stuff
update auth
changes
wip
```

Smart commits:
```
feat(auth): add JWT token validation middleware
fix(api): handle timeout errors in fetch handler
refactor(utils): simplify date formatting logic
test: add coverage for authentication flow
```

## Install

```bash
npm install -g lazycommit
```

## Usage

### Basic (No Config Needed)

```bash
git add .
lazycommit
```

That's it. You'll see a suggestion and can approve, edit, or reject it.

### Example Output

```
  lazycommit — smart commit messages

────────────────────────────────────────────────────
  LOCAL   Commit Suggestion

  [FEATURE]  feat(auth): add login user handler

  - Add src/features/auth/login.ts (new)
  - Update src/middleware/auth.ts

  +142 -8 lines changed

  Confidence: ████████░░ 80%
────────────────────────────────────────────────────

  y: approve  |  n: reject  |  e: edit  |  r: regenerate
  >
```

### Commands

```bash
lazycommit              # Analyze and suggest (default)
lazycommit --dry-run    # Show suggestion without committing
lazycommit --auto       # Auto-approve (for scripts/CI)
lazycommit --ai         # Use AI for this commit
lazycommit --no-body    # Skip commit body
lazycommit --no-scope   # Skip scope detection

lazycommit init         # Create .lazycommit.json config
lazycommit config       # Configure AI provider
```

### Interactive Options

When a suggestion is shown, you can:

- **y** — Approve and commit
- **n** — Reject and exit
- **e** — Edit the message before committing
- **r** — Regenerate a new suggestion
- **a** — Switch to AI mode (if API key configured)

## How It Works

### Heuristic Engine (Default — Offline, Free)

Lazycommit analyzes your `git diff --staged` using pattern matching:

1. **Type Detection** — Determines `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `style`, or `build` based on:
   - File types (`.test.ts` → `test`, `.md` → `docs`)
   - File paths (`.github/workflows/` → `ci`)
   - Diff keywords (`throw Error` → `fix`, `optimize` → `perf`)
   - Change patterns (all new files → `feat`, all deletions → `chore`)

2. **Scope Detection** — Extracts scope from file paths:
   - `src/api/*.ts` → `api`
   - `src/components/*.tsx` → `ui`
   - Configurable via `.lazycommit.json`

3. **Subject Generation** — Builds a meaningful subject:
   - Extracts function/class names from changed code
   - Uses file names and change patterns
   - Keeps under 72 characters

4. **Body Generation** — Lists changed files and detects breaking changes

### AI Mode (Optional)

Add your API key to get AI-powered suggestions:

```bash
# Option 1: Environment variable
export ANTHROPIC_API_KEY=sk-ant-...
# or
export OPENAI_API_KEY=sk-...

# Option 2: Config file
lazycommit config --set-key sk-ant-... --provider anthropic

# Use AI for a single commit
lazycommit --ai
```

AI is always optional. The heuristic engine works offline with zero dependencies.

When AI is used, the heuristic suggestion is sent as context — so AI builds on the local analysis rather than starting from scratch. If the AI call fails, it falls back to the heuristic result automatically.

## Configuration

Create a `.lazycommit.json` in your project root:

```bash
lazycommit init
```

### Example Config

```json
{
  "conventionalCommits": true,
  "maxSubjectLength": 72,
  "includeBody": true,
  "includeScope": true,
  "allowedTypes": ["feat", "fix", "refactor", "test", "docs", "chore"],
  "scopeMappings": {
    "^src/api/": "api",
    "^src/components/": "ui",
    "^src/auth/": "auth"
  },
  "ticketPattern": "PROJ-[0-9]+",
  "ai": {
    "enabled": false,
    "provider": null,
    "apiKey": null
  }
}
```

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `conventionalCommits` | boolean | `true` | Use conventional commits format |
| `maxSubjectLength` | number | `72` | Max characters for subject line |
| `includeBody` | boolean | `true` | Include file list in commit body |
| `includeScope` | boolean | `true` | Auto-detect and include scope |
| `allowedTypes` | string[] | all types | Restrict allowed commit types |
| `scopeMappings` | object | built-in | Custom file path → scope mappings |
| `ticketPattern` | string | none | Regex for ticket numbers (e.g. JIRA) |
| `ai.enabled` | boolean | `false` | Enable AI by default |
| `ai.provider` | string | null | `"anthropic"` or `"openai"` |
| `ai.apiKey` | string | null | Your API key (or use env vars) |

### Config Priority

1. Project `.lazycommit.json` (highest)
2. Home directory `~/.lazycommit.json`
3. Built-in defaults (lowest)

## Supported Commit Types

| Type | When | Example |
|------|------|---------|
| `feat` | New feature files added | `feat(auth): add login handler` |
| `fix` | Bug fix, error handling | `fix(api): handle timeout errors` |
| `refactor` | Code restructuring | `refactor(utils): simplify date logic` |
| `test` | Test files only | `test: add auth flow coverage` |
| `docs` | Documentation changes | `docs: update API reference` |
| `chore` | Dependencies, config | `chore: upgrade react to v19` |
| `perf` | Performance improvements | `perf(db): add query caching` |
| `ci` | CI/CD configuration | `ci: add GitHub Actions workflow` |
| `style` | Formatting, whitespace | `style: fix indentation` |
| `build` | Build system changes | `build: update webpack config` |

## Team Usage

Teams can commit `.lazycommit.json` to their repo to enforce consistent commit messages:

```json
{
  "conventionalCommits": true,
  "allowedTypes": ["feat", "fix", "refactor", "test", "docs"],
  "scopeMappings": {
    "^src/api/": "api",
    "^src/components/": "ui",
    "^src/database/": "db"
  }
}
```

## Development

```bash
git clone https://github.com/yourusername/lazycommit
cd lazycommit
npm install
npm run build
npm test
```

## License

MIT
