import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { z } from "zod";
import { fetchJson, publishSummary, readExistingSnapshot, writeDataFile } from "./refresh-io.ts";

const snapshotSchema = z.strictObject({ models: z.record(z.string(), z.number()) });

async function tempDir(): Promise<URL> {
  return pathToFileURL(`${await mkdtemp(join(tmpdir(), "refresh-io-"))}/`);
}

describe("readExistingSnapshot", () => {
  it("treats a missing snapshot as a first run", async () => {
    const dir = await tempDir();
    await expect(readExistingSnapshot("missing.json", snapshotSchema, dir)).resolves.toBeNull();
  });

  it("fails naming the file when the snapshot is not JSON", async () => {
    const dir = await tempDir();
    await writeFile(new URL("broken.json", dir), "{ not json");
    await expect(readExistingSnapshot("broken.json", snapshotSchema, dir)).rejects.toThrow(
      /^data\/broken\.json is not a valid data file — fix or delete it\./,
    );
  });

  it("fails naming the file when the snapshot does not match its schema", async () => {
    const dir = await tempDir();
    await writeFile(new URL("shape.json", dir), JSON.stringify({ models: { a: "fast" } }));
    await expect(readExistingSnapshot("shape.json", snapshotSchema, dir)).rejects.toThrow(
      /^data\/shape\.json is not a valid data file — fix or delete it\./,
    );
  });
});

describe("writeDataFile", () => {
  it("writes pretty-printed JSON with a trailing newline, keeping the value's key order", async () => {
    const dir = await tempDir();
    await writeDataFile("out.json", snapshotSchema, { models: { b: 2, a: 1 } }, dir);
    await expect(readFile(new URL("out.json", dir), "utf8")).resolves.toBe(
      '{\n  "models": {\n    "b": 2,\n    "a": 1\n  }\n}\n',
    );
  });

  it("refuses a value the schema rejects and leaves the file untouched", async () => {
    const dir = await tempDir();
    await writeFile(new URL("kept.json", dir), "original");
    await expect(
      writeDataFile("kept.json", snapshotSchema, { models: { a: "fast" } } as never, dir),
    ).rejects.toThrow();
    await expect(readFile(new URL("kept.json", dir), "utf8")).resolves.toBe("original");
  });
});

describe("fetchJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses an OK response through the schema", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ models: { a: 1 } })));
    await expect(fetchJson("https://example.test/ok", snapshotSchema)).resolves.toEqual({
      models: { a: 1 },
    });
  });

  it("fails with the status and URL on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      async () => new Response("nope", { status: 503, statusText: "Service Unavailable" }),
    );
    await expect(fetchJson("https://example.test/down", snapshotSchema)).rejects.toThrow(
      "503 Service Unavailable: https://example.test/down",
    );
  });
});

describe("publishSummary", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("appends a GitHub Actions heredoc whose delimiter the summary cannot contain", async () => {
    const dir = await tempDir();
    const output = new URL("output.txt", dir);
    await writeFile(output, "earlier=1\n");
    vi.stubEnv("GITHUB_OUTPUT", output.pathname);
    // Upstream text that tries to close a guessable delimiter.
    const summary = "### Summary\nSUMMARY\nEOF\n";
    await publishSummary(summary);
    const text = await readFile(output, "utf8");
    const match = /^earlier=1\nsummary<<(SUMMARY_[0-9a-f-]{36})\n([^]*)\n\1\n$/.exec(text);
    expect(match).not.toBeNull();
    expect(match![2]).toBe(summary);
    expect(summary).not.toContain(match![1]);
  });

  it("does nothing outside GitHub Actions", async () => {
    vi.stubEnv("GITHUB_OUTPUT", undefined);
    await expect(publishSummary("### Summary")).resolves.toBeUndefined();
  });
});
