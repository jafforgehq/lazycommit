import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process");

import { execSync } from "node:child_process";
import { executeCommit } from "../src/git/commit.js";

const mockExecSync = vi.mocked(execSync);

beforeEach(() => {
  vi.clearAllMocks();
  // Default: commit succeeds, then returns a short hash
  mockExecSync
    .mockReturnValueOnce(undefined as ReturnType<typeof execSync>) // git commit
    .mockReturnValueOnce("abc1234\n" as ReturnType<typeof execSync>); // git rev-parse
});

// ─── executeCommit ───────────────────────────────────────────────

describe("executeCommit", () => {
  it("returns success with hash on a clean commit", () => {
    const result = executeCommit("feat: add feature");
    expect(result.success).toBe(true);
    expect(result.hash).toBe("abc1234");
    expect(result.error).toBeUndefined();
  });

  it("wraps message in $'...' shell escape syntax", () => {
    executeCommit("feat: add feature");
    const cmd = mockExecSync.mock.calls[0][0] as string;
    expect(cmd).toMatch(/\$'.*'$/);
  });

  it("escapes single quotes in the commit message", () => {
    executeCommit("fix: don't break");
    const cmd = mockExecSync.mock.calls[0][0] as string;
    expect(cmd).toContain("\\'");
    expect(cmd).not.toContain("don't"); // raw quote must be escaped
  });

  it("escapes newlines in multiline messages", () => {
    executeCommit("feat: title\n\nbody line");
    const cmd = mockExecSync.mock.calls[0][0] as string;
    expect(cmd).toContain("\\n");
    // The literal newline character must not appear in the shell arg
    expect(cmd).not.toMatch(/\n/);
  });

  it("escapes backslashes in messages", () => {
    executeCommit("docs: update path C:\\\\Users");
    const cmd = mockExecSync.mock.calls[0][0] as string;
    expect(cmd).toContain("\\\\");
  });

  it("returns failure when git commit throws", () => {
    mockExecSync.mockReset();
    mockExecSync.mockImplementation(() => {
      throw new Error("nothing to commit, working tree clean");
    });

    const result = executeCommit("feat: empty");
    expect(result.success).toBe(false);
    expect(result.error).toContain("nothing to commit");
  });

  it("trims trailing whitespace from the commit hash", () => {
    mockExecSync.mockReset();
    mockExecSync
      .mockReturnValueOnce(undefined as ReturnType<typeof execSync>)
      .mockReturnValueOnce("  deadbeef  \n" as ReturnType<typeof execSync>);

    const result = executeCommit("chore: update deps");
    expect(result.hash).toBe("deadbeef");
  });
});
