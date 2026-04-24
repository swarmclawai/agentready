import type { Category, Evidence, Finding, Profile, Rule, RuleDefinition, RuleContext, Severity } from "../../types/src/index.js";
import { profiles } from "../../types/src/index.js";
import { bodyText, evidence, hasAny, header, statusLabel, successful } from "../../core/src/utils.js";
import { flattenJsonLd, jsonLdHasKey, jsonLdTypes } from "../../core/src/html.js";
import { looksLikeOpenApi } from "../../core/src/openapi.js";
import { parseLlmsTxt } from "../../core/src/llms.js";

export const allProfiles = [...profiles];
export const commerceProfiles: Profile[] = ["merchant", "marketplace"];
export const apiProfiles: Profile[] = ["api", "marketplace", "mcp-server", "agent-service"];
export const agentProfiles: Profile[] = ["agent-service", "marketplace"];
export const mcpProfiles: Profile[] = ["mcp-server", "api"];

export function defineRule(definition: RuleDefinition, run: Rule["run"]): Rule {
  return { ...definition, profiles: [...new Set(definition.profiles)], run };
}

export function finding(
  definition: RuleDefinition,
  status: Finding["status"],
  evidenceItems: Evidence[],
  override?: { severity?: Severity; recommendation?: string }
): Finding {
  return {
    id: definition.id,
    title: definition.title,
    category: definition.category,
    severity: override?.severity ?? definition.severity,
    status,
    evidence: evidenceItems,
    recommendation: override?.recommendation ?? definition.recommendation,
    source: definition.source
  };
}

export function record(ctx: RuleContext, path: string) {
  return ctx.snapshot.recordsByPath.get(path);
}

export function passIfRecord(
  definition: RuleDefinition,
  ctx: RuleContext,
  path: string,
  messages: { pass: string; fail: string; warn?: string }
): Finding {
  const item = record(ctx, path);
  if (item && successful(item)) return finding(definition, "pass", [evidence(messages.pass, item.url)]);
  if (item && item.status > 0 && item.status < 500) {
    return finding(definition, "warn", [evidence(messages.warn ?? `${path} returned ${statusLabel(item)}.`, item.url)]);
  }
  return finding(definition, "fail", [evidence(`${messages.fail} (${statusLabel(item)}).`, item?.url)]);
}

export function text(ctx: RuleContext): string {
  return bodyText(ctx.snapshot.records);
}

export function pagesText(ctx: RuleContext): string {
  return ctx.snapshot.pages.map((page) => page.text).join("\n").toLowerCase();
}

export function recordsWithText(ctx: RuleContext, needles: string[]) {
  return ctx.snapshot.records.filter((item) => hasAny(item.body, needles));
}

export function anyText(ctx: RuleContext, needles: string[]): boolean {
  return hasAny(text(ctx), needles);
}

export function allJsonLd(ctx: RuleContext): unknown[] {
  return ctx.snapshot.pages.flatMap((page) => page.jsonLd);
}

export function hasJsonLdType(ctx: RuleContext, types: string[]): boolean {
  const available = jsonLdTypes(allJsonLd(ctx));
  const wanted = new Set(types.map((type) => type.toLowerCase()));
  return available.some((type) => wanted.has(type));
}

export function hasJsonLdKey(ctx: RuleContext, key: string): boolean {
  return jsonLdHasKey(allJsonLd(ctx), key);
}

export function jsonLdObjects(ctx: RuleContext): Array<Record<string, unknown>> {
  return flattenJsonLd(allJsonLd(ctx)).filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
}

export function firstSuccessfulPath(ctx: RuleContext, paths: string[]) {
  return paths.map((path) => record(ctx, path)).find(successful);
}

export function firstKnownPath(ctx: RuleContext, paths: string[]) {
  return paths.map((path) => record(ctx, path)).find(Boolean);
}

export function hasLinkText(ctx: RuleContext, needles: string[]): boolean {
  return ctx.snapshot.pages.some((page) =>
    page.anchors.some((anchor) => hasAny(`${anchor.href} ${anchor.text}`, needles))
  );
}

export function openApiRecords(ctx: RuleContext) {
  return ctx.snapshot.records.filter((item) => looksLikeOpenApi(item.body, item.contentType));
}

export function hasCorsWildcardWithCredentials(ctx: RuleContext): boolean {
  return ctx.snapshot.records.some(
    (item) =>
      header(item, "access-control-allow-origin") === "*" &&
      header(item, "access-control-allow-credentials")?.toLowerCase() === "true"
  );
}

export function hasCorsWildcard(ctx: RuleContext): boolean {
  return ctx.snapshot.records.some((item) => header(item, "access-control-allow-origin") === "*");
}

export function llmsRecord(ctx: RuleContext) {
  return record(ctx, "/llms.txt");
}

export function parsedLlms(ctx: RuleContext) {
  const item = llmsRecord(ctx);
  if (!item || !successful(item)) return undefined;
  return parseLlmsTxt(item.body);
}

export function safeMissingEvidence(path: string, item: ReturnType<typeof record>): Evidence {
  return evidence(`${path} not available (${statusLabel(item)}).`, item?.url);
}

export function regexEvidence(ctx: RuleContext, pattern: RegExp, label: string): Evidence[] {
  const found: Evidence[] = [];
  for (const item of ctx.snapshot.records) {
    pattern.lastIndex = 0;
    if (pattern.test(item.body)) {
      found.push(evidence(label, item.url));
      if (found.length >= 5) break;
    }
  }
  return found;
}

export function sourceUrl(kind: "llms" | "x402" | "mcp" | "a2a" | "web-bot-auth" | "ap2"): string {
  switch (kind) {
    case "llms":
      return "https://llmstxt.org/index.html";
    case "x402":
      return "https://github.com/coinbase/x402";
    case "mcp":
      return "https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization";
    case "a2a":
      return "https://github.com/a2aproject/A2A/blob/main/docs/specification.md";
    case "web-bot-auth":
      return "https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/";
    case "ap2":
      return "https://ap2-protocol.org/specification/";
  }
}

export function baseDefinition(input: RuleDefinition): RuleDefinition {
  return { points: 1, ...input };
}

export function hasSuccessfulRecord(ctx: RuleContext, path: string): boolean {
  return successful(record(ctx, path));
}

export function recordStatusEvidence(ctx: RuleContext, path: string): Evidence {
  const item = record(ctx, path);
  return evidence(`${path}: ${statusLabel(item)}.`, item?.url);
}

export function checkoutForms(ctx: RuleContext): number {
  return ctx.snapshot.pages.flatMap((page) => page.forms).filter((form) => hasAny(`${form.action ?? ""} ${form.text}`, ["checkout", "cart", "payment", "order"])).length;
}

export function hasJsonOfferPrice(ctx: RuleContext): boolean {
  return jsonLdObjects(ctx).some((item) => {
    const type = item["@type"];
    const types = Array.isArray(type) ? type.map(String) : [String(type ?? "")];
    return types.some((entry) => entry.toLowerCase() === "offer") && (item.price !== undefined || item.priceSpecification !== undefined);
  });
}

export function securityRegexes(): RegExp[] {
  return [
    /sk-[A-Za-z0-9_-]{20,}/,
    /gh[pousr]_[A-Za-z0-9_]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/
  ];
}
