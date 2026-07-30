import { describe, expect, it } from "vitest";

import {
  PolicyFetcher,
  RobotsPolicyError,
  HttpError,
  assertRequestAllowed,
} from "../../scripts/regulatory-corpus/fetchPolicy.js";
import {
  amendmentDateForSource,
  buildFullTextUrl,
  xmlToReadableText,
  type SectionVersion,
} from "../../scripts/regulatory-corpus/ecfr.js";
import {
  buildRinSearchUrl,
  buildSearchUrl,
} from "../../scripts/regulatory-corpus/federalRegister.js";
import {
  CFR_SOURCES,
  FEDERAL_REGISTER_SEARCHES,
  assertRegistryIsWellFormed,
  type CfrSource,
} from "../../scripts/regulatory-corpus/sources.js";
import {
  actionableChanges,
  detectChanges,
  emptyManifest,
  renderIndex,
  sha256,
  type Manifest,
  type ManifestEntry,
} from "../../scripts/regulatory-corpus/store.js";

/** No test in this file performs network I/O; every fetcher is injected. */

function noopSleep(): Promise<void> {
  return Promise.resolve();
}

function response(status: number, body: string): Response {
  return new Response(body, { status });
}

function entry(overrides: Partial<ManifestEntry> = {}): ManifestEntry {
  return {
    id: "cfr-42-489.24",
    citation: "42 CFR 489.24",
    agency: "CMS",
    surface: "A",
    sourceUrl: "https://www.ecfr.gov/api/versioner/v1/full/2026-07-20/title-42.xml?part=489",
    amendmentDate: "2024-01-01",
    contentSha256: "a".repeat(64),
    bytes: 100,
    retrievedAt: "2026-07-29T00:00:00.000Z",
    relevance: "synthetic test fixture",
    ...overrides,
  };
}

describe("robots and transport policy", () => {
  it("refuses a cms.gov URL carrying a query string", () => {
    // cms.gov robots.txt publishes `Disallow: /*?`, so this must fail locally
    // rather than being sent and refused (or worse, honoured) at the server.
    expect(() => assertRequestAllowed("https://www.cms.gov/regulations?page=2")).toThrow(
      RobotsPolicyError,
    );
    expect(() => assertRequestAllowed("https://www.cms.gov/regulations/guidance")).not.toThrow();
  });

  it("allows query strings on hosts whose robots.txt permits them", () => {
    expect(() =>
      assertRequestAllowed("https://www.ecfr.gov/api/versioner/v1/versions/title-42.json?part=489"),
    ).not.toThrow();
  });

  it("refuses disallowed path prefixes and non-https schemes", () => {
    expect(() => assertRequestAllowed("https://www.ecfr.gov/search?q=emtala")).toThrow(
      RobotsPolicyError,
    );
    expect(() => assertRequestAllowed("https://www.cms.gov/node/1234")).toThrow(RobotsPolicyError);
    expect(() => assertRequestAllowed("http://www.ecfr.gov/api/x.json")).toThrow(RobotsPolicyError);
  });

  it("retries a 503 and then succeeds", async () => {
    let calls = 0;
    const fetcher = new PolicyFetcher({
      minIntervalMs: 0,
      sleepImpl: noopSleep,
      fetchImpl: async () => {
        calls += 1;
        return calls < 3 ? response(503, "busy") : response(200, "ok");
      },
    });

    await expect(fetcher.getText("https://www.ecfr.gov/api/x.json")).resolves.toBe("ok");
    expect(calls).toBe(3);
  });

  it("does not retry a 404", async () => {
    let calls = 0;
    const fetcher = new PolicyFetcher({
      minIntervalMs: 0,
      sleepImpl: noopSleep,
      fetchImpl: async () => {
        calls += 1;
        return response(404, "missing");
      },
    });

    await expect(fetcher.getText("https://www.ecfr.gov/api/x.json")).rejects.toThrow(HttpError);
    expect(calls).toBe(1);
  });

  it("gives up after the retry budget rather than looping forever", async () => {
    let calls = 0;
    const fetcher = new PolicyFetcher({
      minIntervalMs: 0,
      maxRetries: 2,
      sleepImpl: noopSleep,
      fetchImpl: async () => {
        calls += 1;
        return response(500, "boom");
      },
    });

    await expect(fetcher.getText("https://www.ecfr.gov/api/x.json")).rejects.toThrow(HttpError);
    expect(calls).toBe(3); // initial + 2 retries
  });

  it("never sends a request that policy forbids, even once", async () => {
    let calls = 0;
    const fetcher = new PolicyFetcher({
      minIntervalMs: 0,
      sleepImpl: noopSleep,
      fetchImpl: async () => {
        calls += 1;
        return response(200, "should not happen");
      },
    });

    await expect(fetcher.getText("https://www.cms.gov/x?y=1")).rejects.toThrow(RobotsPolicyError);
    expect(calls).toBe(0);
  });
});

describe("source registry", () => {
  it("has no duplicate ids", () => {
    expect(() => assertRegistryIsWellFormed()).not.toThrow();
  });

  it("labels every non-CMS source so the corpus never implies CMS authority", () => {
    const nonCms = CFR_SOURCES.filter((s) => s.agency !== "CMS");
    expect(nonCms.length).toBeGreaterThan(0);
    for (const source of nonCms) {
      expect(["SAMHSA", "OCR", "ASTP-ONC"]).toContain(source.agency);
    }
  });

  it("gives every source a citation, surface, and relevance", () => {
    for (const source of CFR_SOURCES) {
      expect(source.citation, source.id).not.toBe("");
      expect(source.surface, source.id).not.toBe("");
      expect(source.relevance.length, source.id).toBeGreaterThan(20);
    }
  });
});

describe("eCFR helpers", () => {
  const sectionSource: CfrSource = {
    kind: "cfr",
    id: "cfr-42-489.24",
    title: 42,
    part: "489",
    section: "489.24",
    citation: "42 CFR 489.24",
    surface: "A",
    agency: "CMS",
    relevance: "synthetic fixture for URL construction",
  };
  const partSource: CfrSource = { ...sectionSource, id: "p", section: undefined };

  it("builds a section-scoped full-text URL", () => {
    expect(buildFullTextUrl(sectionSource, "2026-07-20")).toBe(
      "https://www.ecfr.gov/api/versioner/v1/full/2026-07-20/title-42.xml?part=489&section=489.24",
    );
  });

  it("omits the section parameter for a part-scoped source", () => {
    expect(buildFullTextUrl(partSource, "2026-07-20")).toBe(
      "https://www.ecfr.gov/api/versioner/v1/full/2026-07-20/title-42.xml?part=489",
    );
  });

  const versions = new Map<string, SectionVersion>([
    ["489.20", { identifier: "489.20", name: "a", amendmentDate: "2019-11-15" }],
    ["489.24", { identifier: "489.24", name: "b", amendmentDate: "2024-05-01" }],
  ]);

  it("uses the section's own amendment date when scoped to a section", () => {
    expect(amendmentDateForSource(sectionSource, versions)).toBe("2024-05-01");
  });

  it("uses the newest section date for a part-scoped source", () => {
    expect(amendmentDateForSource(partSource, versions)).toBe("2024-05-01");
  });

  it("returns undefined rather than a wrong date when the section is unknown", () => {
    const unknown: CfrSource = { ...sectionSource, section: "489.99" };
    expect(amendmentDateForSource(unknown, versions)).toBeUndefined();
  });

  it("renders section XML to readable text and decodes entities", () => {
    const xml =
      '<DIV8 N="489.24"><HEAD>§ 489.24 Special responsibilities.</HEAD>' +
      "<P>(a) A hospital &amp; its staff must screen.</P><P>(b) Transfer &#167; applies.</P></DIV8>";
    const text = xmlToReadableText(xml);

    expect(text).toContain("§ 489.24 Special responsibilities.");
    expect(text).toContain("(a) A hospital & its staff must screen.");
    expect(text).toContain("(b) Transfer § applies.");
    expect(text).not.toContain("<");
    expect(text).not.toContain("&amp;");
  });
});

describe("federal register URL construction", () => {
  it("scopes the search to CMS final rules", () => {
    const url = buildSearchUrl("Interoperability and Prior Authorization");
    expect(url).toContain("conditions%5Bagencies%5D%5B%5D=centers-for-medicare-medicaid-services");
    expect(url).toContain("conditions%5Btype%5D%5B%5D=RULE");
    expect(url).toContain("conditions%5Bterm%5D=Interoperability+and+Prior+Authorization");
  });

  it("can include non-final documents when asked", () => {
    expect(buildSearchUrl("x", { finalRulesOnly: false })).not.toContain("conditions%5Btype%5D");
  });

  it("builds an exact RIN lookup without a type filter", () => {
    // A RIN identifies a rulemaking family exactly, so the type filter would
    // wrongly hide the proposed rule and any correction documents.
    const url = buildRinSearchUrl("0938-AU87");
    expect(url).toContain("conditions%5Bregulation_id_number%5D=0938-AU87");
    expect(url).toContain("order=oldest");
    expect(url).not.toContain("conditions%5Btype%5D");
  });

  it("only asserts a RIN that has been verified", () => {
    const withRin = FEDERAL_REGISTER_SEARCHES.filter((s) => s.rin !== undefined);
    // 0938-AU87 was confirmed live against the API; the others deliberately
    // fall back to fuzzy term search rather than assert an unverified citation.
    expect(withRin.map((s) => s.rin)).toEqual(["0938-AU87"]);
  });
});

describe("change detection", () => {
  const baseline: Manifest = {
    schemaVersion: 1,
    generatedAt: "2026-07-01T00:00:00.000Z",
    entries: { "cfr-42-489.24": entry() },
  };

  it("reports a first retrieval as added", () => {
    const changes = detectChanges(emptyManifest("2026-07-29T00:00:00.000Z"), {
      "cfr-42-489.24": entry(),
    });
    expect(changes).toEqual([
      { id: "cfr-42-489.24", kind: "added", detail: "first retrieval (amendment date 2024-01-01)" },
    ]);
  });

  it("treats an amendment-date move as amended, not merely content-changed", () => {
    const changes = detectChanges(baseline, {
      "cfr-42-489.24": entry({ amendmentDate: "2026-06-01", contentSha256: "b".repeat(64) }),
    });
    expect(changes[0]?.kind).toBe("amended");
    expect(changes[0]?.detail).toContain("2024-01-01 -> 2026-06-01");
  });

  it("distinguishes a hash change with no amendment-date change", () => {
    // This distinction is the point: conflating an editorial/API-formatting
    // change with a real amendment would make the change log untrustworthy.
    const changes = detectChanges(baseline, {
      "cfr-42-489.24": entry({ contentSha256: "c".repeat(64) }),
    });
    expect(changes[0]?.kind).toBe("content-changed");
    expect(changes[0]?.detail).toContain("verify before treating as substantive");
  });

  it("reports an unchanged source and excludes it from actionable changes", () => {
    const changes = detectChanges(baseline, { "cfr-42-489.24": entry() });
    expect(changes[0]?.kind).toBe("unchanged");
    expect(actionableChanges(changes)).toEqual([]);
  });

  it("reports a source that disappeared from the run as removed", () => {
    const changes = detectChanges(baseline, {});
    expect(changes).toEqual([
      {
        id: "cfr-42-489.24",
        kind: "removed",
        detail: "present in the previous manifest but not retrieved in this run",
      },
    ]);
  });

  it("treats a known date becoming unknown as an amendment change, not silence", () => {
    const changes = detectChanges(baseline, {
      "cfr-42-489.24": entry({ amendmentDate: undefined }),
    });
    expect(changes[0]?.kind).toBe("amended");
    expect(changes[0]?.detail).toContain("-> unknown");
  });
});

describe("index rendering", () => {
  it("renders citations, hashes, and the not-a-compliance-claim disclaimer", () => {
    const manifest: Manifest = {
      schemaVersion: 1,
      generatedAt: "2026-07-29T00:00:00.000Z",
      entries: {
        "cfr-42-489.24": entry(),
        "cfr-42-part-2": entry({
          id: "cfr-42-part-2",
          citation: "42 CFR Part 2",
          agency: "SAMHSA",
          surface: "H",
        }),
      },
    };
    const md = renderIndex(manifest);

    expect(md).toContain("42 CFR 489.24");
    expect(md).toContain("## Surface A");
    expect(md).toContain("## Surface H");
    expect(md).toContain("SAMHSA");
    expect(md).toContain("OD-2");
    expect(md).toContain("What this is not");
  });
});

describe("hashing", () => {
  it("is stable and content-sensitive", () => {
    expect(sha256("abc")).toBe(sha256("abc"));
    expect(sha256("abc")).not.toBe(sha256("abd"));
    expect(sha256("abc")).toHaveLength(64);
  });
});
