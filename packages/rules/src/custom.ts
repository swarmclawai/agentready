import { parse } from "yaml";
import { z } from "zod";
import type { Finding, Profile, RuleContext } from "../../types/src/index.js";
import { evidence, hasAny, rootPath, successful } from "../../core/src/utils.js";
import { defineRule, finding } from "./helpers.js";

const CustomRuleSchema = z.object({
  id: z.string().min(3),
  title: z.string().min(3),
  profile: z.union([z.string(), z.array(z.string())]).optional(),
  profiles: z.array(z.string()).optional(),
  severity: z.enum(["critical", "major", "minor", "info"]).default("minor"),
  category: z.enum([
    "discoverability",
    "access-policy",
    "commerce",
    "payment",
    "api",
    "agent-service",
    "mcp",
    "a2a",
    "support",
    "security"
  ]),
  description: z.string().default("Custom AgentReady rule."),
  recommendation: z.string().optional(),
  check: z.discriminatedUnion("type", [
    z.object({ type: z.literal("http_exists"), path: z.string().startsWith("/") }),
    z.object({ type: z.literal("text_contains"), text: z.union([z.string(), z.array(z.string())]) }),
    z.object({ type: z.literal("structured_policy_detection"), paths: z.array(z.string().startsWith("/")).min(1) })
  ])
});

export function customRuleFromYaml(source: string) {
  const parsed = CustomRuleSchema.parse(parse(source));
  const configuredProfiles = parsed.profiles ?? (Array.isArray(parsed.profile) ? parsed.profile : parsed.profile ? [parsed.profile] : []);
  const profiles = (configuredProfiles.length > 0 ? configuredProfiles : ["website", "merchant", "api", "marketplace", "mcp-server", "agent-service"]) as Profile[];
  const definition = {
    id: parsed.id,
    title: parsed.title,
    profiles,
    category: parsed.category,
    severity: parsed.severity,
    description: parsed.description,
    ...(parsed.recommendation ? { recommendation: parsed.recommendation } : {}),
    points: 1
  };

  return defineRule(definition, async (ctx: RuleContext): Promise<Finding> => {
    const check = parsed.check;
    if (check.type === "http_exists") {
      const url = rootPath(ctx.snapshot.origin, check.path);
      const item = ctx.snapshot.records.find((record) => record.requestedUrl === url || record.url === url);
      if (item && successful(item)) return finding(definition, "pass", [evidence(`${check.path} exists.`, item.url)]);
      return finding(definition, "fail", [evidence(`${check.path} was not found.`, item?.url)]);
    }

    if (check.type === "text_contains") {
      const needles = Array.isArray(check.text) ? check.text : [check.text];
      const body = ctx.snapshot.records.map((record) => record.body).join("\n");
      if (hasAny(body, needles)) return finding(definition, "pass", [evidence(`Found text: ${needles.join(", ")}.`)]);
      return finding(definition, "fail", [evidence(`Missing text: ${needles.join(", ")}.`)]);
    }

    const item = ctx.snapshot.records.find((record) => check.paths.some((path) => record.url.endsWith(path) || record.requestedUrl.endsWith(path)) && successful(record));
    if (item) return finding(definition, "pass", [evidence("Structured policy candidate path exists.", item.url)]);
    return finding(definition, "fail", [evidence(`None of the policy paths were found: ${check.paths.join(", ")}.`)]);
  });
}
