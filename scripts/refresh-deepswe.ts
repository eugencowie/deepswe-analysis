// Refreshes data/deepswe-v1.1.json from the live DeepSWE source. Run via
// `vp run refresh:deepswe`, locally or from the scheduled workflow; changes
// land only through human-reviewed commits. Fails without writing anything
// when a guard rail trips.

import { createHash, randomUUID } from "node:crypto";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import type { DeepsweSnapshot, ModelMappingEntry } from "../src/data/types.ts";
import {
  extractBundlePriceTable,
  indexBundlePaths,
  priceRevisionsFileSchema,
  resolvePriceRevisions,
} from "./deepswe-price-revisions.ts";
import {
  artifactUrl,
  benchmarkVersion,
  hasMeaningfulChange,
  leaderboardArtifactSchema,
  normalize,
  origin,
  summarizeRefresh,
  unmappedModels,
  versionManifestSchema,
} from "./deepswe-snapshot.ts";
import {
  generateMappingEntries,
  openrouterModelsSchema,
  openrouterModelsUrl,
} from "./mapping-generation.ts";

async function fetchBytes(url: string, accept = "application/json"): Promise<Buffer> {
  const response = await fetch(url, { headers: { accept } });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

const manifestBytes = await fetchBytes(`${origin}/artifacts/versions.json`);
const manifest = versionManifestSchema.parse(JSON.parse(manifestBytes.toString("utf8")));

const artifactBytes = await fetchBytes(artifactUrl(manifest));
const artifact = leaderboardArtifactSchema.parse(JSON.parse(artifactBytes.toString("utf8")));
const rawSha256 = createHash("sha256").update(artifactBytes).digest("hex");

const mappingPath = new URL("../data/model-mapping.json", import.meta.url);
const mapping = JSON.parse(await readFile(mappingPath, "utf8")) as ModelMappingEntry[];

// The site's price revisions live only in its deployed bundle (ADR 0006), so
// every run extracts them and the checked-in file follows the site; the
// change lands in the Refresh PR. Any extraction failure is a hard error:
// warning and continuing is how the old factor table went stale (ticket 10).
const priceRevisionsPath = new URL("../data/price-revisions.json", import.meta.url);
const priceRevisionsFile = priceRevisionsFileSchema.parse(
  JSON.parse(await readFile(priceRevisionsPath, "utf8")),
);
const indexHtml = (await fetchBytes(`${origin}/`, "text/html")).toString("utf8");
const bundlePaths = indexBundlePaths(indexHtml);
if (bundlePaths.length === 0) {
  throw new Error(`No index-*.js bundle referenced by ${origin}/; cannot extract price revisions.`);
}
const bundles = await Promise.all(
  bundlePaths.map(async (path) => (await fetchBytes(`${origin}${path}`, "*/*")).toString("utf8")),
);
const revisions = resolvePriceRevisions(extractBundlePriceTable(bundles), benchmarkVersion);
const priceRevisionsChanged =
  JSON.stringify(priceRevisionsFile.revisions) !== JSON.stringify(revisions);

// New models from known vendors get generated mapping entries (ADR 0003);
// anything still unmapped afterwards fails normalize's guard as before.
const unmapped = unmappedModels(artifact.rows, mapping);
const generated: ModelMappingEntry[] = [];
if (unmapped.length > 0) {
  // An unreachable models API fails the run like any other fetch error; the
  // failure email is the alert and a manual re-run the retry.
  const bytes = await fetchBytes(openrouterModelsUrl);
  const listings = openrouterModelsSchema.parse(JSON.parse(bytes.toString("utf8"))).data;
  const result = generateMappingEntries(unmapped, mapping, listings);
  for (const warning of result.warnings) {
    console.warn(`warning: ${warning}`);
  }
  generated.push(...result.generated);
}

const { snapshot, warnings } = normalize(
  manifest,
  artifact,
  [...mapping, ...generated],
  revisions,
  rawSha256,
);
for (const warning of warnings) {
  console.warn(`warning: ${warning}`);
}

// Written only after normalize succeeds, so a tripped guard rail still leaves
// everything untouched.
if (priceRevisionsChanged) {
  await writeFile(
    priceRevisionsPath,
    `${JSON.stringify({ ...priceRevisionsFile, revisions }, null, 2)}\n`,
  );
  console.log(
    `Wrote data/price-revisions.json from the site's bundle: ${Object.keys(revisions).join(", ")}.`,
  );
}
if (generated.length > 0) {
  await writeFile(mappingPath, `${JSON.stringify([...mapping, ...generated], null, 2)}\n`);
  console.log(
    `Generated mapping entries in data/model-mapping.json: ` +
      `${generated.map((entry) => entry.leaderboardModel).join(", ")}.`,
  );
}

const snapshotPath = new URL("../data/deepswe-v1.1.json", import.meta.url);
const existing = await readFile(snapshotPath, "utf8").then(
  (text) => JSON.parse(text) as DeepsweSnapshot,
  () => null,
);
const changed = !existing || hasMeaningfulChange(existing, snapshot);
if (!changed) {
  console.log(
    "No content change; leaving data/deepswe-v1.1.json untouched " +
      `(upstream raw_sha256 ${rawSha256}, generated at ${snapshot.source_generated_at}).`,
  );
} else {
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `Wrote data/deepswe-v1.1.json: ${snapshot.entries.length} entries, ` +
      `source generated at ${snapshot.source_generated_at}.`,
  );
}

const summary = summarizeRefresh({
  existing,
  snapshot,
  mappingCount: mapping.length,
  generated,
  changed,
  previousPriceRevisions: priceRevisionsFile.revisions,
});
if (process.env.GITHUB_OUTPUT) {
  // Unique delimiter per GitHub's guidance: the summary splices in
  // upstream-derived text, which must not be able to terminate the heredoc.
  const delimiter = `SUMMARY_${randomUUID()}`;
  await appendFile(process.env.GITHUB_OUTPUT, `summary<<${delimiter}\n${summary}\n${delimiter}\n`);
}
