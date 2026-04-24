export const agentReadyVersion = "0.1.0-alpha.0";

export const profiles = [
  "website",
  "merchant",
  "api",
  "marketplace",
  "mcp-server",
  "agent-service"
] as const;

export type Profile = (typeof profiles)[number];
export type ProfileOption = Profile | "auto";

export const outputFormats = ["text", "json", "markdown", "html"] as const;
export type OutputFormat = (typeof outputFormats)[number];

export const findingStatuses = [
  "pass",
  "fail",
  "warn",
  "info",
  "unknown",
  "not_applicable"
] as const;
export type FindingStatus = (typeof findingStatuses)[number];

export const severities = ["critical", "major", "minor", "info"] as const;
export type Severity = (typeof severities)[number];

export const categories = [
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
] as const;
export type Category = (typeof categories)[number];

export interface Evidence {
  message: string;
  url?: string | undefined;
  data?: unknown | undefined;
}

export interface Finding {
  id: string;
  title: string;
  category: Category;
  severity: Severity;
  status: FindingStatus;
  evidence: Evidence[];
  recommendation?: string | undefined;
  source?: string | undefined;
}

export interface ScoreSection {
  key: string;
  label: string;
  weight: number;
  score: number;
  applicableFindings: number;
}

export interface ScanSummary {
  critical: number;
  major: number;
  minor: number;
  info: number;
  pass: number;
  fail: number;
  warn: number;
  unknown: number;
}

export interface ScanMetadata {
  fetchedUrls: number;
  skippedByRobots: string[];
  userAgent: string;
  elapsedMs: number;
  active: boolean;
  browser: boolean;
}

export interface ScanResult {
  agentreadyVersion: string;
  target: string;
  normalizedTarget: string;
  profile: Profile;
  startedAt: string;
  completedAt: string;
  score: number;
  scores: ScoreSection[];
  summary: ScanSummary;
  findings: Finding[];
  metadata: ScanMetadata;
}

export interface ScanOptions {
  target: string;
  profile?: ProfileOption;
  format?: OutputFormat;
  output?: string | undefined;
  include?: string[] | undefined;
  exclude?: string[] | undefined;
  maxPages?: number | undefined;
  maxRequests?: number | undefined;
  timeoutMs?: number | undefined;
  rateLimit?: {
    requestsPerSecond?: number | undefined;
  } | undefined;
  respectRobots?: boolean | undefined;
  active?: boolean | undefined;
  browser?: boolean | undefined;
  failOn?: Severity | "none" | undefined;
}

export interface RuleDefinition {
  id: string;
  title: string;
  profiles: Profile[];
  category: Category;
  severity: Severity;
  description: string;
  recommendation?: string | undefined;
  points?: number | undefined;
  source?: string | undefined;
}

export interface Rule extends RuleDefinition {
  run(context: RuleContext): Promise<Finding> | Finding;
}

export interface RuleContext {
  profile: Profile;
  snapshot: TargetSnapshot;
  options: RequiredScannerOptions;
}

export interface RequiredScannerOptions {
  target: string;
  profile: ProfileOption;
  format: OutputFormat;
  maxPages: number;
  maxRequests: number;
  timeoutMs: number;
  rateLimit: {
    requestsPerSecond: number;
  };
  respectRobots: boolean;
  active: boolean;
  browser: boolean;
  failOn: Severity | "none";
  include: string[];
  exclude: string[];
}

export interface FetchRecord {
  url: string;
  requestedUrl: string;
  method: "GET" | "HEAD";
  status: number;
  ok: boolean;
  redirected: boolean;
  contentType: string;
  headers: Record<string, string>;
  body: string;
  error?: string | undefined;
  elapsedMs: number;
}

export interface ParsedHtmlPage {
  url: string;
  title?: string | undefined;
  text: string;
  links: string[];
  anchors: Array<{ href: string; text: string }>;
  forms: Array<{ action?: string | undefined; method?: string | undefined; text: string }>;
  jsonLd: unknown[];
  hasMicrodata: boolean;
}

export interface TargetSnapshot {
  target: string;
  normalizedTarget: string;
  origin: string;
  root: FetchRecord;
  records: FetchRecord[];
  recordsByPath: Map<string, FetchRecord>;
  pages: ParsedHtmlPage[];
  robots?: FetchRecord | undefined;
  sitemapUrls: string[];
  skippedByRobots: string[];
  startedAt: string;
  completedAt: string;
  elapsedMs: number;
  userAgent: string;
}
