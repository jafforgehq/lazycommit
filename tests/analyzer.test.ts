import { describe, it, expect } from "vitest";
import { detectCommitType } from "../src/analyzer/type-detector.js";
import { detectScope } from "../src/analyzer/scope-detector.js";
import { generateSubject } from "../src/analyzer/subject-generator.js";
import { generateBody } from "../src/analyzer/body-generator.js";
import { analyzeAndSuggest } from "../src/analyzer/index.js";
import type { ParsedDiff, FileDiff } from "../src/git/diff.js";
import type { StagedFile } from "../src/git/files.js";

// Helper to create a minimal ParsedDiff
function createDiff(files: Partial<FileDiff>[]): ParsedDiff {
  const fullFiles: FileDiff[] = files.map((f) => ({
    filePath: f.filePath || "unknown",
    status: f.status || "modified",
    additions: f.additions || 0,
    deletions: f.deletions || 0,
    hunks: f.hunks || [],
  }));

  return {
    files: fullFiles,
    totalAdditions: fullFiles.reduce((a, f) => a + f.additions, 0),
    totalDeletions: fullFiles.reduce((a, f) => a + f.deletions, 0),
    rawDiff: "",
  };
}

function createStagedFiles(
  files: Array<{ path: string; status?: StagedFile["status"] }>
): StagedFile[] {
  return files.map((f) => ({ path: f.path, status: f.status || "modified" }));
}

// ─── Type Detector Tests ─────────────────────────────────────

describe("detectCommitType", () => {
  it("should detect test type when all files are test files", () => {
    const diff = createDiff([{ filePath: "src/auth.test.ts" }]);
    const files = createStagedFiles([{ path: "src/auth.test.ts" }]);
    const result = detectCommitType(diff, files);
    expect(result.type).toBe("test");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("should detect docs type when all files are markdown", () => {
    const diff = createDiff([{ filePath: "README.md" }]);
    const files = createStagedFiles([{ path: "README.md" }]);
    const result = detectCommitType(diff, files);
    expect(result.type).toBe("docs");
  });

  it("should detect ci type for workflow files", () => {
    const diff = createDiff([{ filePath: ".github/workflows/ci.yml" }]);
    const files = createStagedFiles([{ path: ".github/workflows/ci.yml" }]);
    const result = detectCommitType(diff, files);
    expect(result.type).toBe("ci");
  });

  it("should detect chore for dependency updates", () => {
    const diff = createDiff([
      { filePath: "package.json" },
      { filePath: "package-lock.json" },
    ]);
    const files = createStagedFiles([
      { path: "package.json" },
      { path: "package-lock.json" },
    ]);
    const result = detectCommitType(diff, files);
    expect(result.type).toBe("chore");
  });

  it("should detect feat when all files are newly added", () => {
    const diff = createDiff([
      { filePath: "src/features/auth.ts", status: "added" },
    ]);
    const files = createStagedFiles([
      { path: "src/features/auth.ts", status: "added" },
    ]);
    const result = detectCommitType(diff, files);
    expect(result.type).toBe("feat");
  });

  it("should detect fix from keyword analysis", () => {
    const diff = createDiff([
      {
        filePath: "src/api.ts",
        hunks: [
          {
            header: "",
            addedLines: [
              "// fix: handle missing id error",
              "if (!id) throw Error('missing id')",
              "// resolve crash when id is null",
            ],
            removedLines: ["const result = fetch(id)"],
            context: [],
          },
        ],
      },
    ]);
    const files = createStagedFiles([{ path: "src/api.ts" }]);
    const result = detectCommitType(diff, files);
    expect(result.type).toBe("fix");
  });
});

// ─── Scope Detector Tests ────────────────────────────────────

describe("detectScope", () => {
  it("should detect api scope from file path", () => {
    const files = createStagedFiles([{ path: "src/api/users.ts" }]);
    const scope = detectScope(files);
    expect(scope).toBe("api");
  });

  it("should detect ui scope from components path", () => {
    const files = createStagedFiles([{ path: "src/components/Button.tsx" }]);
    const scope = detectScope(files);
    expect(scope).toBe("ui");
  });

  it("should return most common scope for multiple files", () => {
    const files = createStagedFiles([
      { path: "src/api/users.ts" },
      { path: "src/api/auth.ts" },
      { path: "src/components/Header.tsx" },
    ]);
    const scope = detectScope(files);
    expect(scope).toBe("api");
  });

  it("should return null for unrecognizable paths", () => {
    const files = createStagedFiles([{ path: "random.txt" }]);
    const scope = detectScope(files);
    expect(scope).toBeNull();
  });

  it("should use custom scope mappings from config", () => {
    const files = createStagedFiles([{ path: "lib/payments/stripe.ts" }]);
    const scope = detectScope(files, {
      scopeMappings: { "^lib/payments/": "payments" },
    } as any);
    expect(scope).toBe("payments");
  });
});

// ─── Subject Generator Tests ─────────────────────────────────

describe("generateSubject", () => {
  it("should generate subject for a single new file", () => {
    const diff = createDiff([{ filePath: "src/auth.ts", status: "added" }]);
    const files = createStagedFiles([{ path: "src/auth.ts", status: "added" }]);
    const subject = generateSubject("feat", diff, files);
    expect(subject).toContain("auth");
  });

  it("should generate subject for deleted file", () => {
    const diff = createDiff([{ filePath: "src/legacy.ts", status: "deleted" }]);
    const files = createStagedFiles([{ path: "src/legacy.ts", status: "deleted" }]);
    const subject = generateSubject("chore", diff, files);
    expect(subject).toContain("remove");
  });

  it("should extract function name from diff", () => {
    const diff = createDiff([
      {
        filePath: "src/api.ts",
        hunks: [
          {
            header: "",
            addedLines: ["export async function fetchUser(id: string) {"],
            removedLines: [],
            context: [],
          },
        ],
      },
    ]);
    const files = createStagedFiles([{ path: "src/api.ts" }]);
    const subject = generateSubject("feat", diff, files);
    expect(subject).toContain("fetchUser");
  });

  it("should truncate long subjects", () => {
    const diff = createDiff([{ filePath: "src/very-long-file-name-that-exceeds-limit.ts" }]);
    const files = createStagedFiles([{ path: "src/very-long-file-name-that-exceeds-limit.ts" }]);
    const subject = generateSubject("feat", diff, files, 40);
    expect(subject.length).toBeLessThanOrEqual(40);
  });
});

// ─── Body Generator Tests ────────────────────────────────────

describe("generateBody", () => {
  it("should list modified files", () => {
    const diff = createDiff([
      { filePath: "src/api.ts" },
      { filePath: "src/utils.ts" },
    ]);
    const files = createStagedFiles([
      { path: "src/api.ts" },
      { path: "src/utils.ts" },
    ]);
    const body = generateBody(diff, files);
    expect(body.description).toContain("src/");
    expect(body.description).toContain("api.ts");
    expect(body.description).toContain("utils.ts");
  });

  it("should detect breaking changes from removed exports", () => {
    const diff = createDiff([
      {
        filePath: "src/index.ts",
        hunks: [
          {
            header: "",
            addedLines: [],
            removedLines: ["export function oldApi() {"],
            context: [],
          },
        ],
      },
    ]);
    const files = createStagedFiles([{ path: "src/index.ts" }]);
    const body = generateBody(diff, files);
    expect(body.breakingChange).toContain("oldApi");
  });

  it("should return null breakingChange when none detected", () => {
    const diff = createDiff([{ filePath: "src/utils.ts" }]);
    const files = createStagedFiles([{ path: "src/utils.ts" }]);
    const body = generateBody(diff, files);
    expect(body.breakingChange).toBeNull();
  });
});

// ─── Full Integration Tests ──────────────────────────────────

describe("analyzeAndSuggest", () => {
  it("should generate a complete commit suggestion for a new feature", () => {
    const diff = createDiff([
      {
        filePath: "src/features/auth/login.ts",
        status: "added",
        additions: 25,
        hunks: [
          {
            header: "",
            addedLines: ["export async function loginUser(email: string, password: string) {"],
            removedLines: [],
            context: [],
          },
        ],
      },
    ]);
    const files = createStagedFiles([
      { path: "src/features/auth/login.ts", status: "added" },
    ]);

    const result = analyzeAndSuggest(diff, files);

    expect(result.type).toBe("feat");
    expect(result.fullMessage).toContain("feat");
    expect(result.fullMessage.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should generate suggestion for a bug fix", () => {
    const diff = createDiff([
      {
        filePath: "src/api/fetch.ts",
        additions: 8,
        deletions: 2,
        hunks: [
          {
            header: "fetchUser",
            addedLines: [
              "if (!id) throw new Error('User ID is required')",
              "if (!res.ok) throw new Error('API error')",
            ],
            removedLines: ["const res = await fetch(`/users/${id}`)"],
            context: [],
          },
        ],
      },
    ]);
    const files = createStagedFiles([{ path: "src/api/fetch.ts" }]);

    const result = analyzeAndSuggest(diff, files);

    expect(result.type).toBe("fix");
    expect(result.fullMessage).toContain("fix");
  });

  it("should respect config options", () => {
    const diff = createDiff([{ filePath: "src/api/users.ts" }]);
    const files = createStagedFiles([{ path: "src/api/users.ts" }]);

    const result = analyzeAndSuggest(diff, files, {
      includeScope: false,
      includeBody: false,
      conventionalCommits: true,
      maxSubjectLength: 72,
      ai: { enabled: false, provider: null, apiKey: null },
    });

    expect(result.scope).toBeNull();
    expect(result.body).toBe("");
  });
});
