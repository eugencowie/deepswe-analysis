// Shared plumbing for the two refresh shells (architecture ticket 05): data
// file reads and writes, HTTP fetches, warnings, and the Refresh PR summary.
// Each shell then reads as its orchestration only.

import { randomUUID } from "node:crypto";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import type { z } from "zod";

// Resolved here so callers name files (`model-mapping.json`) and every message
// can say `data/<file>`. The trailing `dir` parameter on the tested helpers
// exists for their tests, which point it at a temp directory.
const dataDir = new URL("../data/", import.meta.url);

// A required data file: missing or malformed is a hard error either way.
export async function readDataFile<T>(name: string, schema: z.ZodType<T>): Promise<T> {
  return schema.parse(JSON.parse(await readFile(new URL(name, dataDir), "utf8")));
}

// A missing snapshot is a legitimate first run; a corrupt one is a repo problem
// that would silently disable the DeepSWE change check and the OpenRouter
// disappearance audit (ADR 0002), so it hard-errors naming the file.
export async function readExistingSnapshot<T>(
  name: string,
  schema: z.ZodType<T>,
  dir: URL = dataDir,
): Promise<T | null> {
  let text: string;
  try {
    text = await readFile(new URL(name, dir), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  try {
    return schema.parse(JSON.parse(text));
  } catch (error) {
    throw new Error(`data/${name} is not a valid data file — fix or delete it. (${String(error)})`);
  }
}

// Validated against the file schema before writing, so the refresh can never
// commit a file the app rejects at load. The value itself is what gets
// written: the parse returns a copy in schema key order.
export async function writeDataFile<T>(
  name: string,
  schema: z.ZodType<T>,
  value: T,
  dir: URL = dataDir,
): Promise<void> {
  schema.parse(value);
  await writeFile(new URL(name, dir), `${JSON.stringify(value, null, 2)}\n`);
}

// Bytes rather than text: the DeepSWE shell hashes the artifact as served.
export async function fetchBytes(url: string, accept = "application/json"): Promise<Buffer> {
  const response = await fetch(url, { headers: { accept } });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  return schema.parse(JSON.parse((await fetchBytes(url)).toString("utf8")));
}

export function warn(message: string): void {
  console.warn(`warning: ${message}`);
}

// The Refresh PR body reads each half's summary from the step output. Unique
// delimiter per GitHub's guidance: the summary splices in upstream-derived
// text, which must not be able to terminate the heredoc. A no-op outside
// GitHub Actions.
export async function publishSummary(summary: string): Promise<void> {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  const delimiter = `SUMMARY_${randomUUID()}`;
  await appendFile(output, `summary<<${delimiter}\n${summary}\n${delimiter}\n`);
}
