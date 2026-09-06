import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import {
  type TokenMix,
  costAdjustmentFactor,
  extractBundlePriceTable,
  indexBundlePaths,
  resolvePriceRevisions,
} from "./deepswe-price-revisions.ts";

// Worked examples from automated-refresh ticket 10's live evidence
// (2026-09-06), computed by the site's own bundle.
describe("costAdjustmentFactor", () => {
  it("weights the entry's token mix at the new rates over the old (deepseek-v4-pro max)", () => {
    const factor = costAdjustmentFactor(
      {
        from: { input: 0.435, cached: 0.003625, output: 0.87 },
        to: { input: 1.32, cached: 0.044, output: 3.96 },
      },
      { input: 24191606.099557523, cached: 24049100.743362833, output: 105998.91814159292 },
    );
    expect(factor).toBe(6.901879779721177);
    expect(0.24138687892256638 * factor).toBe(1.6660232187256647);
  });

  // gpt-5-6-sol: the non-uniform, multi-effort case a per-model scalar cannot
  // express. Factors from the ticket's 2026-09-06 comment, mean token counts
  // from the artifact with raw_sha256 005cbedb…3415.
  it("varies by effort level under a non-uniform revision (gpt-5-6-sol)", () => {
    const sol = {
      from: { input: 5, cached: 0.5, output: 30 },
      to: { input: 4, cached: 0.4, output: 20 },
    };
    const cases: [string, TokenMix, number][] = [
      [
        "max",
        { input: 7907652.344444444, cached: 7419435.235555556, output: 60013.64444444444 },
        0.7698,
      ],
      [
        "medium",
        { input: 1505793.9557522123, cached: 1382962.9734513275, output: 18425.216814159292 },
        0.7603,
      ],
    ];
    for (const [effort, tokens, expected] of cases) {
      expect(costAdjustmentFactor(sol, tokens), effort).toBeCloseTo(expected, 4);
    }
  });

  it("refuses a token mix that costs nothing at the old rates", () => {
    const glmRevision = {
      from: { input: 0.15, cached: 0.03, output: 0.5 },
      to: { input: 0.075, cached: 0.015, output: 0.25 },
    };
    expect(() => costAdjustmentFactor(glmRevision, { input: 0, cached: 0, output: 0 })).toThrow(
      /costs nothing/,
    );
  });

  it("reduces to the plain ratio when the revision is uniform (glm-5-3-flash)", () => {
    const factor = costAdjustmentFactor(
      {
        from: { input: 0.15, cached: 0.03, output: 0.5 },
        to: { input: 0.075, cached: 0.015, output: 0.25 },
      },
      { input: 1_000_000, cached: 900_000, output: 50_000 },
    );
    expect(factor).toBeCloseTo(0.5, 12);
  });
});

const glm = {
  from: { input: 0.15, cached: 0.03, output: 0.5 },
  to: { input: 0.075, cached: 0.015, output: 0.25 },
};
const deepseekV1 = {
  from: { input: 1.74, cached: 0.0145, output: 3.48 },
  to: { input: 0.435, cached: 0.003625, output: 0.87 },
};
const deepseekV11 = {
  from: { input: 0.435, cached: 0.003625, output: 0.87 },
  to: { input: 1.32, cached: 0.044, output: 3.96 },
};

describe("resolvePriceRevisions", () => {
  it("keeps flat entries and picks the pinned version from versioned ones", () => {
    const resolved = resolvePriceRevisions(
      { "glm-5-3-flash": glm, "deepseek-v4-pro": { v1: deepseekV1, "v1.1": deepseekV11 } },
      "v1.1",
    );
    expect(resolved).toEqual({ "glm-5-3-flash": glm, "deepseek-v4-pro": deepseekV11 });
  });

  it("omits a model whose rates exist only for another version", () => {
    const resolved = resolvePriceRevisions({ "deepseek-v4-pro": { v1: deepseekV1 } }, "v1.1");
    expect(resolved).toEqual({});
  });
});

const excerpt = readFileSync(
  new URL("./fixtures/deepswe-index-bundle-excerpt.txt", import.meta.url),
  "utf8",
);

describe("extractBundlePriceTable", () => {
  // The fixture is the deployed index-C8-z8dCr.js of 2026-09-06 around the
  // table, preceded by an unrelated object literal that must not match.
  it("finds the one price table in a minified bundle and parses its literal", () => {
    const table = extractBundlePriceTable([excerpt]);
    expect(Object.keys(table)).toEqual([
      "glm-5-3-flash",
      "gpt-5-6-luna",
      "gpt-5-6-terra",
      "gpt-5-6-sol",
      "deepseek-v4-pro",
      "deepseek-v4-flash",
      "gemini-3-6-flash",
    ]);
    expect(table["glm-5-3-flash"]).toEqual(glm);
    expect(table["deepseek-v4-pro"]).toEqual({ v1: deepseekV1, "v1.1": deepseekV11 });
  });

  it("fails when no bundle carries a recognisable table", () => {
    expect(() => extractBundlePriceTable(["var a={x:1};", excerpt.slice(0, 300)])).toThrow(
      /no price table/i,
    );
  });

  it("does not mistake an empty version map for a table", () => {
    expect(() => extractBundlePriceTable(['var a={"x":{}};'])).toThrow(/no price table/i);
  });

  it("fails when more than one table is found", () => {
    expect(() => extractBundlePriceTable([excerpt, excerpt])).toThrow(/2 price tables/i);
  });
});

describe("indexBundlePaths", () => {
  it("lists every index-*.js asset the site's index page references, once", () => {
    const html =
      '<link rel="modulepreload" href="/assets/index-Bs2x-Jp_.js"/>' +
      '<script type="module" src="/assets/index-C8-z8dCr.js"></script>' +
      '<script>import("/assets/index-C8-z8dCr.js")</script>';
    expect(indexBundlePaths(html)).toEqual([
      "/assets/index-Bs2x-Jp_.js",
      "/assets/index-C8-z8dCr.js",
    ]);
  });
});
