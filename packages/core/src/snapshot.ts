import * as robotsParserModule from "robots-parser";
import type { FetchRecord, ParsedHtmlPage, RequiredScannerOptions, TargetSnapshot } from "../../types/src/index.js";
import { parseHtmlPage } from "./html.js";
import { HttpClient, DEFAULT_USER_AGENT } from "./http.js";
import { parseSitemapUrls } from "./sitemap.js";
import { normalizeTarget, pathKey, resolveSameOrigin, rootPath, unique } from "./utils.js";

const BASE_PATHS = [
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/llms-full.txt",
  "/index.html.md",
  "/agents.txt",
  "/ai.txt",
  "/agent-policy",
  "/bot-policy",
  "/crawler-policy",
  "/.well-known/security.txt",
  "/.well-known/agent-card.json",
  "/.well-known/agent.json",
  "/.well-known/oauth-protected-resource",
  "/.well-known/oauth-authorization-server",
  "/.well-known/openid-configuration",
  "/.well-known/web-bot-auth",
  "/.well-known/signature-agent-directory",
  "/openapi.json",
  "/openapi.yaml",
  "/swagger.json",
  "/api/openapi.json",
  "/docs",
  "/api",
  "/pricing",
  "/support",
  "/contact",
  "/returns",
  "/refunds",
  "/return-policy",
  "/cancellation",
  "/shipping",
  "/terms",
  "/privacy",
  "/cart",
  "/checkout",
  "/admin",
  "/webhooks",
  "/status"
];

const KEYWORD_LINKS = [
  "price",
  "pricing",
  "docs",
  "api",
  "support",
  "contact",
  "refund",
  "return",
  "cancel",
  "shipping",
  "checkout",
  "cart",
  "terms",
  "privacy",
  "openapi",
  "swagger",
  "mcp",
  "agent",
  "bot",
  "security",
  "webhook",
  "rate"
];

type Robots = {
  isAllowed(url: string, ua?: string): boolean | undefined;
};

const parseRobots = (robotsParserModule.default ?? robotsParserModule) as unknown as (url: string, body: string) => Robots;

export async function collectSnapshot(options: RequiredScannerOptions): Promise<TargetSnapshot> {
  const started = new Date();
  const targetUrl = normalizeTarget(options.target);
  const origin = targetUrl.origin;
  const client = new HttpClient(options);

  const root = await client.request(targetUrl.href);
  const robots = await client.request(rootPath(origin, "/robots.txt"));
  const robotsRules =
    robots.status >= 200 && robots.status < 300
      ? parseRobots(rootPath(origin, "/robots.txt"), robots.body)
      : undefined;

  const initialPages = root.contentType.includes("html") || root.body.includes("<html") ? [parseHtmlPage(root.url, root.body)] : [];
  const discoveredFromRoot = initialPages.flatMap((page) =>
    page.anchors
      .filter((anchor) => KEYWORD_LINKS.some((keyword) => anchor.href.toLowerCase().includes(keyword) || anchor.text.toLowerCase().includes(keyword)))
      .map((anchor) => anchor.href)
  );

  const candidateUrls = unique(BASE_PATHS.map((path) => rootPath(origin, path)).concat(discoveredFromRoot));
  const skippedByRobots: string[] = [];

  for (const url of candidateUrls) {
    if (client.remainingRequests <= 0) break;
    if (url === root.url || url === root.requestedUrl || pathKey(url) === "/robots.txt") continue;
    if (options.respectRobots && robotsRules && !robotsRules.isAllowed(url, DEFAULT_USER_AGENT)) {
      skippedByRobots.push(url);
      continue;
    }
    await client.request(url);
  }

  const sitemapRecord = client.records.find((record) => pathKey(record.url) === "/sitemap.xml" || pathKey(record.requestedUrl) === "/sitemap.xml");
  const sitemapUrls = sitemapRecord ? parseSitemapUrls(sitemapRecord.body).filter((url) => resolveSameOrigin(origin, url)) : [];
  for (const url of sitemapUrls.slice(0, Math.max(0, options.maxPages - client.records.length))) {
    if (client.remainingRequests <= 0) break;
    if (options.respectRobots && robotsRules && !robotsRules.isAllowed(url, DEFAULT_USER_AGENT)) {
      skippedByRobots.push(url);
      continue;
    }
    await client.request(url);
  }

  const pages: ParsedHtmlPage[] = initialPages.concat(
    client.records
      .filter((record) => record !== root)
      .filter((record) => record.body && (record.contentType.includes("html") || record.body.includes("<html")))
      .slice(0, options.maxPages)
      .map((record) => parseHtmlPage(record.url, record.body))
  );

  const recordsByPath = new Map<string, FetchRecord>();
  for (const record of client.records) {
    recordsByPath.set(pathKey(record.requestedUrl), record);
    recordsByPath.set(pathKey(record.url), record);
  }

  const completed = new Date();
  return {
    target: options.target,
    normalizedTarget: targetUrl.href,
    origin,
    root,
    records: client.records,
    recordsByPath,
    pages,
    ...(robots ? { robots } : {}),
    sitemapUrls,
    skippedByRobots,
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    elapsedMs: completed.getTime() - started.getTime(),
    userAgent: DEFAULT_USER_AGENT
  };
}
