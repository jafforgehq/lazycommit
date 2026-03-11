import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process");

import { execSync } from "node:child_process";
import { getStagedFiles, hasStagedChanges, isGitRepo } from "../src/git/files.js";

const mockExecSync = vi.mocked(execSync);

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getStagedFiles ───────────────────────────────────────────────

describe("getStagedFiles", () => {
  it("returns empty array when no staged files", () => {
    mockExecSync.mockReturnValue("" as ReturnType<typeof execSync>);
    expect(getStagedFiles()).toEqual([]);
  });

  it("returns empty array when git command fails", () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("not a git repository");
    });
    expect(getStagedFiles()).toEqual([]);
  });

  it("parses added files (A status)", () => {
    mockExecSync.mockReturnValue("A  src/new-file.ts\n" as ReturnType<typeof execSync>);
    const files = getStagedFiles();
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ path: "src/new-file.ts", status: "added" });
  });

  it("parses modified files (M status)", () => {
    mockExecSync.mockReturnValue("M  src/existing.ts\n" as ReturnType<typeof execSync>);
    const files = getStagedFiles();
    expect(files[0]).toMatchObject({ path: "src/existing.ts", status: "modified" });
  });

  it("parses deleted files (D status)", () => {
    mockExecSync.mockReturnValue("D  src/old-file.ts\n" as ReturnType<typeof execSync>);
    const files = getStagedFiles();
    expect(files[0]).toMatchObject({ path: "src/old-file.ts", status: "deleted" });
  });

  it("parses renamed files (R status) and sets oldPath", () => {
    mockExecSync.mockReturnValue(
      "R  src/old.ts -> src/new.ts\n" as ReturnType<typeof execSync>
    );
    const files = getStagedFiles();
    expect(files[0]).toMatchObject({
      path: "src/new.ts",
      status: "renamed",
      oldPath: "src/old.ts",
    });
  });

  it("parses copied files (C status)", () => {
    mockExecSync.mockReturnValue("C  src/copy.ts\n" as ReturnType<typeof execSync>);
    const files = getStagedFiles();
    expect(files[0]).toMatchObject({ path: "src/copy.ts", status: "copied" });
  });

  it("skips unstaged files (space in X column)", () => {
    mockExecSync.mockReturnValue(" M src/unstaged.ts\n" as ReturnType<typeof execSync>);
    expect(getStagedFiles()).toEqual([]);
  });

  it("skips untracked files (? status)", () => {
    mockExecSync.mockReturnValue("?? src/untracked.ts\n" as ReturnType<typeof execSync>);
    expect(getStagedFiles()).toEqual([]);
  });

  it("handles multiple files across statuses", () => {
    mockExecSync.mockReturnValue(
      "A  src/a.ts\nM  src/b.ts\nD  src/c.ts\n" as ReturnType<typeof execSync>
    );
    const files = getStagedFiles();
    expect(files).toHaveLength(3);
    expect(files.map((f) => f.status)).toEqual(["added", "modified", "deleted"]);
  });
});

// ─── hasStagedChanges ─────────────────────────────────────────────

describe("hasStagedChanges", () => {
  it("returns true when staged changes exist", () => {
    mockExecSync.mockReturnValue("src/file.ts\n" as ReturnType<typeof execSync>);
    expect(hasStagedChanges()).toBe(true);
  });

  it("returns false when no staged changes", () => {
    mockExecSync.mockReturnValue("" as ReturnType<typeof execSync>);
    expect(hasStagedChanges()).toBe(false);
  });

  it("returns false when git command fails", () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("not a git repo");
    });
    expect(hasStagedChanges()).toBe(false);
  });
});

// ─── isGitRepo ────────────────────────────────────────────────────

describe("isGitRepo", () => {
  it("returns true when inside a git repo", () => {
    mockExecSync.mockReturnValue("true\n" as ReturnType<typeof execSync>);
    expect(isGitRepo()).toBe(true);
  });

  it("returns false when not in a git repo", () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("not a git repository");
    });
    expect(isGitRepo()).toBe(false);
  });
});
