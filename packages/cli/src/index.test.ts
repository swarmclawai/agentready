import { describe, expect, it } from "vitest";
import { builtInRules } from "../../rules/src/index.js";

describe("CLI rule inventory", () => {
  it("has the rules surfaced by the rules list command", () => {
    const ids = builtInRules.map((rule) => rule.id);
    expect(ids).toContain("discoverability.robots_txt");
    expect(ids).toContain("discoverability.llms_txt");
    expect(ids).toContain("security.exposed_secret_passive_scan");
  });
});
