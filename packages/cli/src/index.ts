#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command, InvalidArgumentError } from "commander";
import { parse as parseYaml } from "yaml";
import { runScan } from "../../core/src/index.js";
import { builtInRules, customRuleFromYaml } from "../../rules/src/index.js";
import { renderReport } from "../../report/src/index.js";
import { agentReadyVersion, outputFormats, profiles, type OutputFormat, type ProfileOption, type ScanOptions, type Severity } from "../../types/src/index.js";

const program = new Command()
  .name("agentready")
  .description("Open-source readiness scanner for the agentic web.")
  .version(agentReadyVersion);

program
  .command("scan")
  .argument("<target>", "Website, API, or service URL to scan")
  .option("-p, --profile <profile>", `Profile: auto, ${profiles.join(", ")}`, parseProfile, "auto")
  .option("-f, --format <format>", `Output format: ${outputFormats.join(", ")}`, parseFormat, "text")
  .option("-o, --output <file>", "Write report to a file")
  .option("-c, --config <file>", "Load JSON or YAML config")
  .option("--include <items>", "Comma-separated rule ID or category filters")
  .option("--exclude <items>", "Comma-separated rule ID or category filters")
  .option("--max-pages <number>", "Maximum HTML pages to parse", parseInteger)
  .option("--max-requests <number>", "Maximum HTTP requests", parseInteger)
  .option("--timeout <ms>", "Per-request timeout in milliseconds", parseInteger)
  .option("--rate-limit <rps>", "Requests per second", parseNumber)
  .option("--no-respect-robots", "Do not apply robots.txt allow/disallow checks to secondary probes")
  .option("--active", "Enable opt-in active checks. Current alpha keeps active checks conservative.")
  .option("--browser", "Enable optional browser-backed checks when adapters are installed")
  .option("--fail-on <severity>", "Exit non-zero on severity: critical, major, minor, info, none", parseFailOn, "none")
  .action(async (target: string, flags: Record<string, unknown>) => {
    await handleScan(target, flags);
  });

const rules = program.command("rules").description("Inspect and test AgentReady rules");

rules
  .command("list")
  .option("-p, --profile <profile>", `Filter by profile: ${profiles.join(", ")}`, parseConcreteProfile)
  .option("-f, --format <format>", "Output format: text or json", parseFormat, "text")
  .action((flags: { profile?: string; format: OutputFormat }) => {
    const selected = builtInRules.filter((rule) => (flags.profile ? rule.profiles.includes(flags.profile as never) : true));
    if (flags.format === "json") {
      console.log(JSON.stringify(selected.map(({ run: _run, ...rule }) => rule), null, 2));
      return;
    }
    for (const rule of selected) {
      console.log(`${rule.id}\t${rule.severity}\t${rule.category}\t${rule.profiles.join(",")}\t${rule.title}`);
    }
  });

rules
  .command("test")
  .argument("<ruleFile>", "YAML custom rule file")
  .argument("<target>", "Target URL")
  .option("-p, --profile <profile>", `Profile: auto, ${profiles.join(", ")}`, parseProfile, "auto")
  .option("-f, --format <format>", `Output format: ${outputFormats.join(", ")}`, parseFormat, "text")
  .action(async (ruleFile: string, target: string, flags: { profile: ProfileOption; format: OutputFormat }) => {
    const source = readFileSync(resolve(ruleFile), "utf8");
    const rule = customRuleFromYaml(source);
    const result = await runScan({ target, profile: flags.profile, format: flags.format }, [rule]);
    process.stdout.write(renderReport(result, flags.format));
    process.exitCode = shouldFail(result.findings, "major") ? 1 : 0;
  });

program
  .command("init")
  .description("Create an agentready.config.json file")
  .option("-f, --force", "Overwrite an existing config")
  .action((flags: { force?: boolean }) => {
    const target = resolve("agentready.config.json");
    if (existsSync(target) && !flags.force) {
      throw new Error("agentready.config.json already exists. Use --force to overwrite it.");
    }
    writeFileSync(
      target,
      `${JSON.stringify(
        {
          target: "https://example.com",
          profile: "auto",
          respectRobots: true,
          maxPages: 24,
          maxRequests: 80,
          rateLimit: { requestsPerSecond: 2 },
          report: { format: "markdown", output: "agentready-report.md" }
        },
        null,
        2
      )}\n`
    );
    console.log(`Created ${target}`);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`agentready: ${message}`);
  process.exitCode = 1;
});

async function handleScan(target: string, flags: Record<string, unknown>): Promise<void> {
  const config = typeof flags.config === "string" ? loadConfig(flags.config) : {};
  const reportConfig = readObject(config.report);
  const format = (flags.format as OutputFormat | undefined) ?? (reportConfig.format as OutputFormat | undefined) ?? (config.format as OutputFormat | undefined) ?? "text";
  const output = (flags.output as string | undefined) ?? (reportConfig.output as string | undefined) ?? (config.output as string | undefined);
  const options: ScanOptions = {
    target: (config.target as string | undefined) ?? target,
    profile: (flags.profile as ProfileOption | undefined) ?? (config.profile as ProfileOption | undefined) ?? "auto",
    format,
    output,
    include: parseList(flags.include) ?? parseList(config.include),
    exclude: parseList(flags.exclude) ?? parseList(config.exclude),
    maxPages: (flags.maxPages as number | undefined) ?? readNumber(config.maxPages),
    maxRequests: (flags.maxRequests as number | undefined) ?? readNumber(config.maxRequests),
    timeoutMs: (flags.timeout as number | undefined) ?? readNumber(config.timeoutMs),
    rateLimit: {
      requestsPerSecond: (flags.rateLimit as number | undefined) ?? readNumber(readObject(config.rateLimit).requestsPerSecond) ?? 2
    },
    respectRobots: (flags.respectRobots as boolean | undefined) ?? readBoolean(config.respectRobots),
    active: Boolean(flags.active ?? config.active),
    browser: Boolean(flags.browser ?? config.browser),
    failOn: (flags.failOn as Severity | "none" | undefined) ?? (config.failOn as Severity | "none" | undefined) ?? "none"
  };

  const result = await runScan(options, builtInRules);
  const rendered = renderReport(result, format);
  if (output) {
    writeFileSync(resolve(output), rendered);
  } else {
    process.stdout.write(rendered);
  }
  process.exitCode = shouldFail(result.findings, options.failOn ?? "none") ? 1 : 0;
}

function loadConfig(path: string): Record<string, unknown> {
  const fullPath = resolve(path);
  const raw = readFileSync(fullPath, "utf8");
  if (path.endsWith(".yaml") || path.endsWith(".yml")) {
    return readObject(parseYaml(raw));
  }
  return readObject(JSON.parse(raw));
}

function parseProfile(value: string): ProfileOption {
  if (value === "auto" || profiles.includes(value as never)) return value as ProfileOption;
  throw new InvalidArgumentError(`Invalid profile: ${value}`);
}

function parseConcreteProfile(value: string) {
  if (profiles.includes(value as never)) return value;
  throw new InvalidArgumentError(`Invalid profile: ${value}`);
}

function parseFormat(value: string): OutputFormat {
  if (outputFormats.includes(value as never)) return value as OutputFormat;
  throw new InvalidArgumentError(`Invalid format: ${value}`);
}

function parseFailOn(value: string): Severity | "none" {
  if (value === "none" || ["critical", "major", "minor", "info"].includes(value)) return value as Severity | "none";
  throw new InvalidArgumentError(`Invalid fail-on severity: ${value}`);
}

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) throw new InvalidArgumentError(`Expected integer, got ${value}`);
  return parsed;
}

function parseNumber(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new InvalidArgumentError(`Expected number, got ${value}`);
  return parsed;
}

function parseList(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return undefined;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function shouldFail(findings: Array<{ status: string; severity: string }>, failOn: Severity | "none"): boolean {
  if (failOn === "none") return false;
  const order: Record<Severity, number> = { critical: 4, major: 3, minor: 2, info: 1 };
  const threshold = order[failOn];
  return findings.some((finding) => {
    const value = order[finding.severity as Severity] ?? 0;
    return ["fail", "warn", "unknown"].includes(finding.status) && value >= threshold;
  });
}
