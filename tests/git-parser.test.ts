import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDiff } from "../src/git/diff.js";

const FIXTURES_DIR = join(import.meta.dirname, "fixtures");

describe("parseDiff", () => {
  it("should parse a feature diff (new file)", () => {
    const raw = readFileSync(join(FIXTURES_DIR, "feat-diff.txt"), "utf-8");
    const result = parseDiff(raw);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].filePath).toBe("src/features/auth/login.ts");
    expect(result.files[0].status).toBe("added");
    expect(result.totalAdditions).toBeGreaterThan(0);
    expect(result.totalDeletions).toBe(0);
  });

  it("should parse a fix diff (modified file)", () => {
    const raw = readFileSync(join(FIXTURES_DIR, "fix-diff.txt"), "utf-8");
    const result = parseDiff(raw);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].filePath).toBe("src/api/fetch.ts");
    expect(result.files[0].status).toBe("modified");
    expect(result.totalAdditions).toBeGreaterThan(0);
    expect(result.totalDeletions).toBeGreaterThan(0);
  });

  it("should parse a refactor diff", () => {
    const raw = readFileSync(join(FIXTURES_DIR, "refactor-diff.txt"), "utf-8");
    const result = parseDiff(raw);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].filePath).toBe("src/utils/helpers.ts");
    expect(result.files[0].hunks.length).toBeGreaterThan(0);
  });

  it("should handle empty diff", () => {
    const result = parseDiff("");
    expect(result.files).toHaveLength(0);
    expect(result.totalAdditions).toBe(0);
    expect(result.totalDeletions).toBe(0);
  });

  it("should extract hunk details", () => {
    const raw = readFileSync(join(FIXTURES_DIR, "fix-diff.txt"), "utf-8");
    const result = parseDiff(raw);

    const hunks = result.files[0].hunks;
    expect(hunks.length).toBeGreaterThan(0);
    expect(hunks[0].addedLines.length).toBeGreaterThan(0);
  });
});
