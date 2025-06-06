import { jest } from "@jest/globals";
import path from "path";

// Define function types
type FindAllFn = () => Promise<{ id: number; filename: string }[]>;
type DestroyFn = (args: { where: { id: number } }) => Promise<number>;
type StatFn = (path: string) => Promise<{ mtimeMs: number }>;
type UnlinkFn = (path: string) => Promise<void>;

const mockFindAll = jest.fn<FindAllFn>();
const mockDestroy = jest.fn<DestroyFn>();
const mockStat = jest.fn<StatFn>();
const mockUnlink = jest.fn<UnlinkFn>();

// Mock FileUpload model
jest.mock("../src/models/FileUpload", () => ({
  __esModule: true,
  default: {
    findAll: mockFindAll,
    destroy: mockDestroy,
  },
}));

// Mock fs/promises
jest.mock("fs/promises", () => ({
  stat: mockStat,
  unlink: mockUnlink,
}));

// Import AFTER mocks
import { removeOldFiles } from "../src/controllers/unlink.controller";

describe("unlink.controller (unit, fully mocked)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call FileUpload.findAll and log cleanup", async () => {
    mockFindAll.mockResolvedValueOnce([]);
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await removeOldFiles();
    expect(mockFindAll).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith("running cleanup task...");
    logSpy.mockRestore();
  });

  it("should delete old files and db records", async () => {
    mockFindAll.mockResolvedValueOnce([{ id: 1, filename: "old.txt" }]);
    mockStat.mockResolvedValueOnce({ mtimeMs: Date.now() - 2 * 3600 * 1000 });
    mockUnlink.mockResolvedValueOnce(undefined);
    mockDestroy.mockResolvedValueOnce(1);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await removeOldFiles();

    expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining("old.txt"));
    expect(mockDestroy).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(logSpy).toHaveBeenCalledWith("deleted old.txt");
    logSpy.mockRestore();
  });

  it("should remove db record if file is missing (ENOENT)", async () => {
    mockFindAll.mockResolvedValueOnce([{ id: 2, filename: "missing.txt" }]);
    mockStat.mockRejectedValueOnce({ code: "ENOENT" });
    mockDestroy.mockResolvedValueOnce(1);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await removeOldFiles();

    expect(mockDestroy).toHaveBeenCalledWith({ where: { id: 2 } });
    expect(logSpy).toHaveBeenCalledWith("file missing, removed db record: missing.txt");
    logSpy.mockRestore();
  });

  it("should log error if stat throws unexpected error", async () => {
    mockFindAll.mockResolvedValueOnce([{ id: 3, filename: "error.txt" }]);
    mockStat.mockRejectedValueOnce({ code: "EACCES" });

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await removeOldFiles();

    expect(errorSpy).toHaveBeenCalledWith(
      "error for file error.txt:",
      expect.objectContaining({ code: "EACCES" })
    );
    errorSpy.mockRestore();
  });

  it("should log error if findAll throws", async () => {
    mockFindAll.mockRejectedValueOnce(new Error("DB error"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await removeOldFiles();
    expect(errorSpy).toHaveBeenCalledWith("cleanup failed:", expect.any(Error));
    errorSpy.mockRestore();
  });
});
