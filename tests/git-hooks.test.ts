import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs");
vi.mock("node:child_process");

import { existsSync, readFileSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { getGitRoot, isHookInstalled, installHook, uninstallHook } from "../src/git/hooks.js";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockRenameSync = vi.mocked(renameSync);
const mockUnlinkSync = vi.mocked(unlinkSync);
const mockExecSync = vi.mocked(execSync);

const GIT_ROOT = "/fake/project";
const HOOK_PATH = `${GIT_ROOT}/.git/hooks/prepare-commit-msg`;
const BACKUP_PATH = `${HOOK_PATH}.bak`;
const HOOK_MARKER = "# Written by lazycommit";

beforeEach(() => {
  vi.clearAllMocks();
  mockExistsSync.mockReturnValue(false);
  mockExecSync.mockReturnValue("" as ReturnType<typeof execSync>);
});

// ─── getGitRoot ───────────────────────────────────────────────────

describe("getGitRoot", () => {
  it("returns trimmed git root path", () => {
    mockExecSync.mockReturnValue("/my/project\n" as ReturnType<typeof execSync>);
    expect(getGitRoot()).toBe("/my/project");
  });
});

// ─── isHookInstalled ──────────────────────────────────────────────

describe("isHookInstalled", () => {
  it("returns false when hook file does not exist", () => {
    mockExistsSync.mockReturnValue(false);
    expect(isHookInstalled(GIT_ROOT)).toBe(false);
  });

  it("returns false when hook exists but has no lazycommit marker", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("#!/bin/sh\nsome other hook\n" as ReturnType<typeof readFileSync>);
    expect(isHookInstalled(GIT_ROOT)).toBe(false);
  });

  it("returns true when hook exists with lazycommit marker", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      `#!/bin/sh\n${HOOK_MARKER}\nlazycommit --hook "$1"\n` as ReturnType<typeof readFileSync>
    );
    expect(isHookInstalled(GIT_ROOT)).toBe(true);
  });
});

// ─── installHook ──────────────────────────────────────────────────

describe("installHook", () => {
  it("writes hook script when no hook exists", () => {
    mockExistsSync.mockReturnValue(false);

    const result = installHook(GIT_ROOT);

    expect(result.success).toBe(true);
    expect(result.message).toContain(HOOK_PATH);
    expect(mockWriteFileSync).toHaveBeenCalledOnce();
    const written = mockWriteFileSync.mock.calls[0][1] as string;
    expect(written).toContain(HOOK_MARKER);
    expect(written).toContain("lazycommit --hook");
    expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining("chmod +x"));
  });

  it("backs up existing foreign hook before installing", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("#!/bin/sh\nsome other hook\n" as ReturnType<typeof readFileSync>);

    const result = installHook(GIT_ROOT);

    expect(result.success).toBe(true);
    expect(mockRenameSync).toHaveBeenCalledWith(HOOK_PATH, BACKUP_PATH);
    expect(mockWriteFileSync).toHaveBeenCalledOnce();
  });

  it("returns early if our hook is already installed", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      `#!/bin/sh\n${HOOK_MARKER}\n` as ReturnType<typeof readFileSync>
    );

    const result = installHook(GIT_ROOT);

    expect(result.success).toBe(true);
    expect(result.message).toContain("already installed");
    expect(mockWriteFileSync).not.toHaveBeenCalled();
    expect(mockRenameSync).not.toHaveBeenCalled();
  });

  it("hook script skips non-empty COMMIT_SOURCE", () => {
    mockExistsSync.mockReturnValue(false);
    installHook(GIT_ROOT);
    const written = mockWriteFileSync.mock.calls[0][1] as string;
    expect(written).toContain('if [ -n "$COMMIT_SOURCE" ]');
    expect(written).toContain("exit 0");
  });

  it("hook script uses || true so git never aborts", () => {
    mockExistsSync.mockReturnValue(false);
    installHook(GIT_ROOT);
    const written = mockWriteFileSync.mock.calls[0][1] as string;
    expect(written).toContain("|| true");
  });
});

// ─── uninstallHook ────────────────────────────────────────────────

describe("uninstallHook", () => {
  it("returns success message when no hook exists", () => {
    mockExistsSync.mockReturnValue(false);

    const result = uninstallHook(GIT_ROOT);

    expect(result.success).toBe(true);
    expect(result.message).toContain("No hook found");
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });

  it("refuses to remove a hook not written by lazycommit", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("#!/bin/sh\nsome other hook\n" as ReturnType<typeof readFileSync>);

    const result = uninstallHook(GIT_ROOT);

    expect(result.success).toBe(false);
    expect(result.message).toContain("not installed by lazycommit");
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });

  it("removes our hook and reports success", () => {
    mockExistsSync.mockImplementation((p) => p === HOOK_PATH);
    mockReadFileSync.mockReturnValue(
      `#!/bin/sh\n${HOOK_MARKER}\n` as ReturnType<typeof readFileSync>
    );

    const result = uninstallHook(GIT_ROOT);

    expect(result.success).toBe(true);
    expect(mockUnlinkSync).toHaveBeenCalledWith(HOOK_PATH);
    expect(mockRenameSync).not.toHaveBeenCalled();
  });

  it("restores backup hook after removing ours", () => {
    mockExistsSync.mockImplementation((p) => p === HOOK_PATH || p === BACKUP_PATH);
    mockReadFileSync.mockReturnValue(
      `#!/bin/sh\n${HOOK_MARKER}\n` as ReturnType<typeof readFileSync>
    );

    const result = uninstallHook(GIT_ROOT);

    expect(result.success).toBe(true);
    expect(result.message).toContain("restored");
    expect(mockUnlinkSync).toHaveBeenCalledWith(HOOK_PATH);
    expect(mockRenameSync).toHaveBeenCalledWith(BACKUP_PATH, HOOK_PATH);
  });
});
