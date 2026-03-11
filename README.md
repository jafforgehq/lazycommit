# lazycommit

Auto-generate commit messages from your staged changes. Works offline with smart heuristics — no AI required. Optional AI upgrade with your own API key.

## The Problem

You make 15 commits a day. Each one takes 2-5 minutes to think about a good message. That's **30-75 minutes daily** spent on commit messages instead of code.

## The Solution

```bash
git add .
lazycommit
```

Instead of:
```
fixed stuff
update auth
changes
wip
```

You get:
```
- Add src/features/auth/ (login.ts, middleware.ts)
- Update src/api/handler.ts
- Remove src/legacy/auth.ts
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
────────────────────────────────────────────────────

  - Add src/features/auth/ (login.ts, middleware.ts)
  - Update src/api/handler.ts

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

Lazycommit analyzes your `git diff --staged` and generates a commit body listing what changed, grouped by directory:

- **1 file in a dir** — `- Update src/api/handler.ts`
- **2–3 files in a dir** — `- Update src/api/ (handler.ts, router.ts)`
- **4+ files in a dir** — `- Update 6 files in src/api/`

It also detects breaking changes (removed exports, changed function signatures) and flags them separately.

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
  "conventionalCommits": false,
  "maxSubjectLength": 72,
  "includeBody": true,
  "includeScope": false,
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
| `conventionalCommits` | boolean | `false` | Use `type: subject` conventional commits format |
| `maxSubjectLength` | number | `72` | Max characters for subject line (conventional commits only) |
| `includeBody` | boolean | `true` | Include file list in commit body |
| `includeScope` | boolean | `false` | Auto-detect and include scope (conventional commits only) |
| `allowedTypes` | string[] | all types | Restrict allowed commit types |
| `scopeMappings` | object | built-in | Custom file path → scope mappings |
| `ticketPattern` | string | none | Regex for ticket numbers (e.g. JIRA) |
| `ai.enabled` | boolean | `false` | Enable AI by default |
| `ai.provider` | string | null | `"anthropic"` or `"openai"` |
| `ai.apiKey` | string | null | Your API key (or use env vars) |
| `ai.model` | string | provider default | Override the AI model |

### Config Priority

1. Project `.lazycommit.json` (highest)
2. Home directory `~/.lazycommit.json`
3. Built-in defaults (lowest)

### Conventional Commits (opt-in)

If you prefer the `type(scope): subject` format, enable it in your config:

```json
{
  "conventionalCommits": true,
  "includeScope": true
}
```

Output becomes:
```
feat(auth): add login handler

- Add src/features/auth/ (login.ts, middleware.ts)
- Update src/api/handler.ts
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
