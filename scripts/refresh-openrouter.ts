// Refreshes data/openrouter-throughput.json from OpenRouter's documented
// model-endpoints API. Run via `vp run refresh:openrouter` with
// OPENROUTER_API_KEY in a gitignored .env at the repo root or in the
// environment; changes land only through human-reviewed commits. Fails
// without writing anything when a guard rail trips.

import { existsSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import {
  modelMappingSchema,
  throughputSnapshotSchema,
  vendorMappingSchema,
} from "../src/data/schema.ts";
import {
  type OpenrouterEndpoint,
  buildSnapshot,
  endpointsResponseSchema,
  endpointsUrl,
  retryAfterMs,
  summarizeRefresh,
} from "./openrouter-snapshot.ts";
import {
  publishSummary,
  readDataFile,
  readExistingSnapshot,
  warn,
  writeDataFile,
} from "./refresh-io.ts";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  throw new Error(
    "OPENROUTER_API_KEY is required: set it in a gitignored .env at the repo root " +
      "or in the environment.",
  );
}

// Its own loop rather than fetchJson: the 429 and 404 branches read the
// response before any parse.
const maxAttempts = 3;
async function fetchEndpoints(modelId: string): Promise<OpenrouterEndpoint[]> {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(endpointsUrl(modelId), {
      headers: { authorization: `Bearer ${apiKey}`, accept: "application/json" },
    });
    if (response.status === 429 && attempt < maxAttempts) {
      const waitMs = retryAfterMs(response.headers.get("retry-after"));
      warn(`429 for ${modelId}; waiting ${waitMs / 1000}s (attempt ${attempt}/${maxAttempts}).`);
      await sleep(waitMs);
      continue;
    }
    if (response.status === 404) {
      throw new Error(
        `OpenRouter has no model "${modelId}" (HTTP 404). The mapping is wrong — ids are ` +
          `revision-pinned; fix data/model-mapping.json.`,
      );
    }
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}: ${endpointsUrl(modelId)}`);
    }
    return endpointsResponseSchema.parse(await response.json()).data.endpoints;
  }
}

const mapping = await readDataFile("model-mapping.json", modelMappingSchema);
const vendorMapping = await readDataFile("vendor-mapping.json", vendorMappingSchema);

// One capture window: all models sequentially under a single timestamp, so
// cross-model comparisons are same-moment (spec: never compare values fetched
// days apart).
const capturedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const endpointsByModel = new Map<string, OpenrouterEndpoint[]>();
for (const entry of mapping) {
  if (entry.openrouterId === null || endpointsByModel.has(entry.openrouterId)) continue;
  endpointsByModel.set(entry.openrouterId, await fetchEndpoints(entry.openrouterId));
}

// A corrupt existing snapshot would silently disable the disappearance audit
// (ADR 0002); the reader hard-errors on it and treats only a missing file as
// a first run.
const existing = await readExistingSnapshot("openrouter-throughput.json", throughputSnapshotSchema);

const { snapshot, warnings } = buildSnapshot(
  mapping,
  vendorMapping,
  endpointsByModel,
  existing,
  capturedAt,
);
warnings.forEach(warn);

await writeDataFile("openrouter-throughput.json", throughputSnapshotSchema, snapshot);
console.log(
  `Wrote data/openrouter-throughput.json: ${Object.keys(snapshot.models).length} models, ` +
    `captured at ${capturedAt}.`,
);

await publishSummary(summarizeRefresh(existing, snapshot, warnings));
