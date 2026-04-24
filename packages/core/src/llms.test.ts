import { describe, expect, it } from "vitest";
import { parseLlmsTxt } from "./llms.js";

describe("parseLlmsTxt", () => {
  it("extracts the required title, optional summary, sections, and links", () => {
    const parsed = parseLlmsTxt(`# AgentReady

> Scanner for agent readiness.

## Docs

- [Rules](/docs/rules.md): Rule reference
- [API](https://example.com/openapi.json)

## Optional

- [Blog](/blog): Context that can be skipped
`);

    expect(parsed.hasH1).toBe(true);
    expect(parsed.summary).toBe("Scanner for agent readiness.");
    expect(parsed.sectionCount).toBe(2);
    expect(parsed.hasOptionalSection).toBe(true);
    expect(parsed.links).toEqual([
      { label: "Rules", url: "/docs/rules.md", notes: "Rule reference" },
      { label: "API", url: "https://example.com/openapi.json" },
      { label: "Blog", url: "/blog", notes: "Context that can be skipped" }
    ]);
  });
});
