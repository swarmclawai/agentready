import type { Rule } from "../../types/src/index.js";
import {
  agentProfiles,
  allProfiles,
  anyText,
  apiProfiles,
  baseDefinition,
  checkoutForms,
  commerceProfiles,
  defineRule,
  finding,
  firstKnownPath,
  firstSuccessfulPath,
  hasCorsWildcard,
  hasCorsWildcardWithCredentials,
  hasJsonLdKey,
  hasJsonLdType,
  hasJsonOfferPrice,
  hasLinkText,
  hasSuccessfulRecord,
  llmsRecord,
  mcpProfiles,
  openApiRecords,
  pagesText,
  parsedLlms,
  record,
  recordsWithText,
  recordStatusEvidence,
  regexEvidence,
  safeMissingEvidence,
  securityRegexes,
  sourceUrl,
  text
} from "./helpers.js";
import { evidence, hasAny, header, statusLabel, successful } from "../../core/src/utils.js";

export const builtInRules: Rule[] = [
  defineRule(
    baseDefinition({
      id: "discoverability.robots_txt",
      title: "robots.txt is available",
      profiles: allProfiles,
      category: "discoverability",
      severity: "minor",
      description: "Checks whether the target exposes robots.txt.",
      recommendation: "Publish robots.txt so automated clients can understand crawl preferences."
    }),
    (ctx) => {
      const item = record(ctx, "/robots.txt");
      if (item && successful(item)) return finding(builtInRules[0]!, "pass", [evidence("robots.txt found.", item.url)]);
      return finding(builtInRules[0]!, "warn", [safeMissingEvidence("/robots.txt", item)]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "discoverability.sitemap_xml",
      title: "sitemap.xml is available",
      profiles: allProfiles,
      category: "discoverability",
      severity: "minor",
      description: "Checks whether the target exposes a sitemap.",
      recommendation: "Publish sitemap.xml or reference sitemap locations from robots.txt."
    }),
    (ctx) => {
      const item = record(ctx, "/sitemap.xml");
      if (item && successful(item) && ctx.snapshot.sitemapUrls.length > 0) {
        return finding(builtInRules[1]!, "pass", [evidence(`sitemap.xml found with ${ctx.snapshot.sitemapUrls.length} URLs.`, item.url)]);
      }
      if (item && successful(item)) return finding(builtInRules[1]!, "warn", [evidence("sitemap.xml was found but no URLs were parsed.", item.url)]);
      return finding(builtInRules[1]!, "warn", [safeMissingEvidence("/sitemap.xml", item)]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "discoverability.llms_txt",
      title: "llms.txt is available",
      profiles: allProfiles,
      category: "discoverability",
      severity: "minor",
      description: "Checks whether the target exposes /llms.txt.",
      recommendation: "Add /llms.txt with a concise Markdown map of agent-relevant pages.",
      source: sourceUrl("llms")
    }),
    (ctx) => {
      const item = llmsRecord(ctx);
      if (item && successful(item)) return finding(builtInRules[2]!, "pass", [evidence("llms.txt found.", item.url)]);
      return finding(builtInRules[2]!, "warn", [safeMissingEvidence("/llms.txt", item)]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "discoverability.llms_txt_format",
      title: "llms.txt follows the proposed format",
      profiles: allProfiles,
      category: "discoverability",
      severity: "minor",
      description: "Checks for an H1 and useful Markdown link list in llms.txt.",
      recommendation: "Structure llms.txt with an H1, optional summary, and Markdown file lists.",
      source: sourceUrl("llms")
    }),
    (ctx) => {
      const item = llmsRecord(ctx);
      const parsed = parsedLlms(ctx);
      if (!parsed || !item) return finding(builtInRules[3]!, "not_applicable", [safeMissingEvidence("/llms.txt", item)]);
      if (parsed.hasH1 && parsed.links.length > 0) {
        return finding(builtInRules[3]!, "pass", [evidence(`llms.txt has an H1 and ${parsed.links.length} linked resources.`, item.url)]);
      }
      if (parsed.hasH1) return finding(builtInRules[3]!, "warn", [evidence("llms.txt has an H1 but no Markdown resource links.", item.url)]);
      return finding(builtInRules[3]!, "fail", [evidence("llms.txt is missing the required H1 title.", item.url)]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "discoverability.llms_full_txt",
      title: "llms-full.txt is available",
      profiles: allProfiles,
      category: "discoverability",
      severity: "info",
      description: "Checks whether the optional /llms-full.txt file is available.",
      recommendation: "Consider publishing /llms-full.txt for compact full-context agent reads.",
      source: sourceUrl("llms")
    }),
    (ctx) => {
      const item = record(ctx, "/llms-full.txt");
      if (item && successful(item)) return finding(builtInRules[4]!, "pass", [evidence("llms-full.txt found.", item.url)]);
      return finding(builtInRules[4]!, "info", [safeMissingEvidence("/llms-full.txt", item)]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "discoverability.markdown_fallback",
      title: "Markdown fallback is available",
      profiles: allProfiles,
      category: "discoverability",
      severity: "minor",
      description: "Checks for Markdown page mirrors or linked .md resources.",
      recommendation: "Expose clean Markdown alternatives for high-value pages where possible.",
      source: sourceUrl("llms")
    }),
    (ctx) => {
      const mdRecord = record(ctx, "/index.html.md");
      const hasMdLink = ctx.snapshot.pages.some((page) => page.links.some((link) => link.endsWith(".md")));
      if (successful(mdRecord) || hasMdLink) {
        return finding(builtInRules[5]!, "pass", [evidence("Markdown fallback signal found.", mdRecord?.url ?? ctx.snapshot.root.url)]);
      }
      return finding(builtInRules[5]!, "warn", [safeMissingEvidence("/index.html.md", mdRecord)]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "discoverability.structured_data",
      title: "Structured data is available",
      profiles: allProfiles,
      category: "discoverability",
      severity: "major",
      description: "Checks for JSON-LD or microdata.",
      recommendation: "Add JSON-LD or microdata that describes the organization, products, services, docs, or API."
    }),
    (ctx) => {
      const jsonLdCount = ctx.snapshot.pages.flatMap((page) => page.jsonLd).length;
      const hasMicrodata = ctx.snapshot.pages.some((page) => page.hasMicrodata);
      if (jsonLdCount > 0 || hasMicrodata) {
        return finding(builtInRules[6]!, "pass", [evidence(`Structured data found (${jsonLdCount} JSON-LD blocks, microdata: ${hasMicrodata}).`, ctx.snapshot.root.url)]);
      }
      return finding(builtInRules[6]!, "warn", [evidence("No JSON-LD or microdata found in fetched pages.", ctx.snapshot.root.url)]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "discoverability.service_schema",
      title: "Service or organization schema is available",
      profiles: allProfiles,
      category: "discoverability",
      severity: "minor",
      description: "Checks whether structured data explains the service or organization.",
      recommendation: "Add Organization, LocalBusiness, WebSite, SoftwareApplication, or Service JSON-LD."
    }),
    (ctx) => {
      if (hasJsonLdType(ctx, ["Organization", "LocalBusiness", "WebSite", "SoftwareApplication", "Service"])) {
        return finding(builtInRules[7]!, "pass", [evidence("Service or organization JSON-LD type found.", ctx.snapshot.root.url)]);
      }
      return finding(builtInRules[7]!, "warn", [evidence("No service or organization schema found.", ctx.snapshot.root.url)]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "access.agent_access_policy",
      title: "Agent access policy is published",
      profiles: allProfiles,
      category: "access-policy",
      severity: "major",
      description: "Checks for a public agent, bot, or crawler access policy.",
      recommendation: "Publish an agent access policy that explains allowed agent behavior, rate limits, and contact paths."
    }),
    (ctx) => {
      const item = firstSuccessfulPath(ctx, ["/agents.txt", "/agent-policy", "/bot-policy", "/crawler-policy", "/ai.txt"]);
      if (item) return finding(builtInRules[8]!, "pass", [evidence("Agent access policy signal found.", item.url)]);
      if (anyText(ctx, ["agent access policy", "bot policy", "crawler policy", "ai agent policy"])) {
        return finding(builtInRules[8]!, "pass", [evidence("Agent access policy text found in fetched pages.", ctx.snapshot.root.url)]);
      }
      return finding(builtInRules[8]!, "warn", [evidence("No explicit agent access policy found in fetched pages.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "access.web_bot_auth_hints",
      title: "Signed-agent or Web Bot Auth hints are available",
      profiles: allProfiles,
      category: "access-policy",
      severity: "minor",
      description: "Checks for Web Bot Auth, Signature-Agent, or public key directory hints.",
      recommendation: "Document signed-agent support or public-key directory behavior if verified agents are supported.",
      source: sourceUrl("web-bot-auth")
    }),
    (ctx) => {
      const item = firstSuccessfulPath(ctx, ["/.well-known/web-bot-auth", "/.well-known/signature-agent-directory"]);
      if (item) return finding(builtInRules[9]!, "pass", [evidence("Signed-agent discovery endpoint found.", item.url)]);
      if (anyText(ctx, ["web bot auth", "signature-agent", "signed agent", "public key directory"])) {
        return finding(builtInRules[9]!, "pass", [evidence("Signed-agent documentation text found.", ctx.snapshot.root.url)]);
      }
      return finding(builtInRules[9]!, "unknown", [evidence("No signed-agent authentication hints found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "commerce.product_schema",
      title: "Product schema is available",
      profiles: commerceProfiles,
      category: "commerce",
      severity: "critical",
      description: "Checks for Product JSON-LD.",
      recommendation: "Expose Product and Offer JSON-LD on product pages."
    }),
    (ctx) => {
      if (hasJsonLdType(ctx, ["Product"])) return finding(builtInRules[10]!, "pass", [evidence("Product JSON-LD found.", ctx.snapshot.root.url)]);
      return finding(builtInRules[10]!, "fail", [evidence("No Product JSON-LD found in fetched pages.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "commerce.price_visible",
      title: "Price data is visible",
      profiles: commerceProfiles,
      category: "commerce",
      severity: "critical",
      description: "Checks whether price data is available in structured data or visible content.",
      recommendation: "Expose prices in Offer JSON-LD and visible text near product/service descriptions."
    }),
    (ctx) => {
      if (hasJsonOfferPrice(ctx)) return finding(builtInRules[11]!, "pass", [evidence("Offer price found in JSON-LD.", ctx.snapshot.root.url)]);
      if (/\$\s?\d|£\s?\d|€\s?\d|\bUSD\b|\bGBP\b|\bEUR\b/i.test(text(ctx))) {
        return finding(builtInRules[11]!, "warn", [evidence("Price-like text found, but not structured as Offer JSON-LD.", ctx.snapshot.root.url)]);
      }
      return finding(builtInRules[11]!, "fail", [evidence("No price signal found in fetched pages.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "commerce.inventory_signal",
      title: "Inventory or availability signal is available",
      profiles: commerceProfiles,
      category: "commerce",
      severity: "major",
      description: "Checks for availability or stock signals.",
      recommendation: "Expose availability in Product/Offer JSON-LD and visible text."
    }),
    (ctx) => {
      if (hasJsonLdKey(ctx, "availability") || anyText(ctx, ["in stock", "out of stock", "availability", "inventory"])) {
        return finding(builtInRules[12]!, "pass", [evidence("Inventory or availability signal found.", ctx.snapshot.root.url)]);
      }
      return finding(builtInRules[12]!, "unknown", [evidence("No inventory freshness signal found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "commerce.checkout_detected",
      title: "Cart or checkout path is detectable",
      profiles: commerceProfiles,
      category: "commerce",
      severity: "critical",
      description: "Checks for cart and checkout links, pages, or forms.",
      recommendation: "Expose stable cart and checkout paths and document agent-safe purchase constraints."
    }),
    (ctx) => {
      const item = firstSuccessfulPath(ctx, ["/cart", "/checkout"]);
      if (item || hasLinkText(ctx, ["cart", "checkout"]) || checkoutForms(ctx) > 0) {
        return finding(builtInRules[13]!, "pass", [evidence("Cart or checkout signal found.", item?.url ?? ctx.snapshot.root.url)]);
      }
      return finding(builtInRules[13]!, "fail", [evidence("No cart or checkout path detected.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "commerce.shipping_tax_clarity",
      title: "Shipping and tax information is discoverable",
      profiles: commerceProfiles,
      category: "commerce",
      severity: "major",
      description: "Checks for shipping and tax policy signals.",
      recommendation: "Publish crawlable shipping, delivery, tax, and fee information."
    }),
    (ctx) => {
      const item = firstSuccessfulPath(ctx, ["/shipping"]);
      if (item && anyText(ctx, ["shipping", "delivery"])) return finding(builtInRules[14]!, "pass", [evidence("Shipping policy found.", item.url)]);
      if (anyText(ctx, ["shipping", "delivery", "tax", "fees"])) return finding(builtInRules[14]!, "warn", [evidence("Shipping/tax text found but no dedicated fetched policy page was confirmed.")]);
      return finding(builtInRules[14]!, "unknown", [evidence("No shipping or tax clarity signal found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "commerce.refund_policy_detected",
      title: "Refund or return policy is detectable",
      profiles: commerceProfiles,
      category: "support",
      severity: "critical",
      description: "Checks for refund and return policy pages.",
      recommendation: "Publish a crawlable refund/return policy with time windows, eligibility, and escalation paths."
    }),
    (ctx) => {
      const item = firstSuccessfulPath(ctx, ["/refunds", "/returns", "/return-policy"]);
      if (item) return finding(builtInRules[15]!, "pass", [evidence("Refund or return policy page found.", item.url)]);
      if (anyText(ctx, ["refund", "return policy", "returns"])) return finding(builtInRules[15]!, "warn", [evidence("Refund/return text found but no dedicated fetched policy page was confirmed.")]);
      return finding(builtInRules[15]!, "fail", [evidence("No refund or return policy signal found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "commerce.cancellation_policy_detected",
      title: "Cancellation policy is detectable",
      profiles: commerceProfiles,
      category: "support",
      severity: "critical",
      description: "Checks for cancellation policy signals.",
      recommendation: "Publish cancellation rules and cancellation request paths in crawlable text."
    }),
    (ctx) => {
      const item = firstSuccessfulPath(ctx, ["/cancellation"]);
      if (item) return finding(builtInRules[16]!, "pass", [evidence("Cancellation policy page found.", item.url)]);
      if (anyText(ctx, ["cancel order", "cancellation", "subscription cancellation"])) return finding(builtInRules[16]!, "warn", [evidence("Cancellation text found but no dedicated policy page was confirmed.")]);
      return finding(builtInRules[16]!, "fail", [evidence("No cancellation policy signal found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "commerce.support_path_detected",
      title: "Support path is detectable",
      profiles: allProfiles,
      category: "support",
      severity: "major",
      description: "Checks for support or contact paths.",
      recommendation: "Publish crawlable support/contact pages and expected response paths."
    }),
    (ctx) => {
      const item = firstSuccessfulPath(ctx, ["/support", "/contact"]);
      if (item) return finding(builtInRules[17]!, "pass", [evidence("Support or contact page found.", item.url)]);
      if (anyText(ctx, ["support", "contact us", "help center"])) return finding(builtInRules[17]!, "warn", [evidence("Support text found but no dedicated fetched support/contact page was confirmed.")]);
      return finding(builtInRules[17]!, "warn", [evidence("No support or contact path detected.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "support.response_time_detected",
      title: "Support response expectations are published",
      profiles: allProfiles,
      category: "support",
      severity: "minor",
      description: "Checks whether support pages mention expected response time or SLA.",
      recommendation: "Document expected response windows, escalation paths, or SLA terms."
    }),
    (ctx) => {
      if (anyText(ctx, ["response time", "within 24 hours", "within 48 hours", "sla", "service level"])) {
        return finding(builtInRules[18]!, "pass", [evidence("Support response expectation text found.")]);
      }
      return finding(builtInRules[18]!, "unknown", [evidence("No support response expectation found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "payment.http_402_detected",
      title: "HTTP 402 behavior is detectable",
      profiles: apiProfiles.concat(commerceProfiles),
      category: "payment",
      severity: "info",
      description: "Checks whether any fetched endpoint returned HTTP 402.",
      recommendation: "For paid APIs/resources, consider documenting 402 behavior and machine-readable payment requirements.",
      source: sourceUrl("x402")
    }),
    (ctx) => {
      const item = ctx.snapshot.records.find((entry) => entry.status === 402);
      if (item) return finding(builtInRules[19]!, "pass", [evidence("HTTP 402 response detected.", item.url)]);
      return finding(builtInRules[19]!, "info", [evidence("No HTTP 402 response detected in passive probes.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "payment.x402_metadata_detected",
      title: "x402 metadata is detectable",
      profiles: apiProfiles.concat(commerceProfiles),
      category: "payment",
      severity: "major",
      description: "Checks for x402 payment headers or response metadata.",
      recommendation: "Expose x402 PaymentRequired metadata for paid resources when using HTTP-native payments.",
      source: sourceUrl("x402")
    }),
    (ctx) => {
      const item = ctx.snapshot.records.find((entry) => header(entry, "payment-required") || header(entry, "payment-response") || hasAny(entry.body, ["paymentrequirements", "x402", "payment-required"]));
      if (item) return finding(builtInRules[20]!, "pass", [evidence("x402 metadata signal found.", item.url)]);
      return finding(builtInRules[20]!, "unknown", [evidence("No x402 metadata detected in passive probes.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "payment.signed_receipt_detected",
      title: "Signed receipt support is detectable",
      profiles: apiProfiles.concat(commerceProfiles).concat(agentProfiles),
      category: "payment",
      severity: "major",
      description: "Checks for signed receipt or verifiable receipt hints.",
      recommendation: "Document receipt format, signature, verification endpoint, and refund linkage for completed transactions."
    }),
    (ctx) => {
      if (anyText(ctx, ["signed receipt", "verifiable receipt", "receipt signature", "payment receipt"])) {
        return finding(builtInRules[21]!, "pass", [evidence("Signed receipt documentation signal found.")]);
      }
      return finding(builtInRules[21]!, "warn", [evidence("No signed receipt support signal found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "payment.ap2_mandate_hints",
      title: "AP2 mandate or agent payment hints are detectable",
      profiles: commerceProfiles.concat(apiProfiles).concat(agentProfiles),
      category: "payment",
      severity: "info",
      description: "Checks for AP2, payment mandate, or agent-payment contract hints.",
      recommendation: "If supporting agentic payment mandates, publish clear AP2 or mandate documentation.",
      source: sourceUrl("ap2")
    }),
    (ctx) => {
      if (anyText(ctx, ["agent payments protocol", "ap2", "paymentmandate", "payment mandate", "shopping mandate"])) {
        return finding(builtInRules[22]!, "pass", [evidence("AP2 or mandate terminology found.")]);
      }
      return finding(builtInRules[22]!, "info", [evidence("No AP2 or payment mandate signal found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "api.openapi_detected",
      title: "OpenAPI document is detectable",
      profiles: apiProfiles,
      category: "api",
      severity: "critical",
      description: "Checks for OpenAPI or Swagger documents.",
      recommendation: "Publish an OpenAPI document at a stable URL such as /openapi.json."
    }),
    (ctx) => {
      const records = openApiRecords(ctx);
      if (records.length > 0) return finding(builtInRules[23]!, "pass", [evidence("OpenAPI/Swagger document found.", records[0]?.url)]);
      if (hasLinkText(ctx, ["openapi", "swagger", "api reference"])) return finding(builtInRules[23]!, "warn", [evidence("API docs link found, but no OpenAPI document was fetched.")]);
      return finding(builtInRules[23]!, "fail", [evidence("No OpenAPI or Swagger document detected.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "api.auth_documentation_detected",
      title: "API auth documentation is detectable",
      profiles: apiProfiles,
      category: "api",
      severity: "major",
      description: "Checks for API authentication documentation.",
      recommendation: "Document authentication schemes, token handling, and authorization boundaries."
    }),
    (ctx) => {
      if (anyText(ctx, ["api key", "bearer token", "oauth", "authentication", "authorization header"])) {
        return finding(builtInRules[24]!, "pass", [evidence("API auth documentation signal found.")]);
      }
      return finding(builtInRules[24]!, "warn", [evidence("No API auth documentation signal found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "api.idempotency_guidance_detected",
      title: "Idempotency guidance is detectable",
      profiles: apiProfiles,
      category: "api",
      severity: "critical",
      description: "Checks for idempotency guidance for paid or mutating actions.",
      recommendation: "Document idempotency keys and retry behavior for paid or mutating actions."
    }),
    (ctx) => {
      if (anyText(ctx, ["idempotency-key", "idempotency key", "idempotent", "safe retry"])) {
        return finding(builtInRules[25]!, "pass", [evidence("Idempotency guidance found.")]);
      }
      return finding(builtInRules[25]!, "fail", [evidence("No idempotency guidance found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "api.webhook_documentation_detected",
      title: "Webhook documentation is detectable",
      profiles: apiProfiles,
      category: "api",
      severity: "minor",
      description: "Checks for webhook documentation.",
      recommendation: "Document webhook event types, signatures, retries, and delivery guarantees."
    }),
    (ctx) => {
      const item = firstSuccessfulPath(ctx, ["/webhooks"]);
      if (item || anyText(ctx, ["webhook", "webhooks"])) return finding(builtInRules[26]!, "pass", [evidence("Webhook documentation signal found.", item?.url)]);
      return finding(builtInRules[26]!, "unknown", [evidence("No webhook documentation signal found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "api.rate_limit_guidance_detected",
      title: "Rate-limit guidance is detectable",
      profiles: apiProfiles.concat(allProfiles),
      category: "api",
      severity: "major",
      description: "Checks for rate-limit documentation or headers.",
      recommendation: "Document rate limits and expose standard rate-limit headers where practical."
    }),
    (ctx) => {
      const headerRecord = ctx.snapshot.records.find((item) => header(item, "ratelimit-limit") || header(item, "x-ratelimit-limit"));
      if (headerRecord) return finding(builtInRules[27]!, "pass", [evidence("Rate-limit header found.", headerRecord.url)]);
      if (anyText(ctx, ["rate limit", "rate-limit", "requests per second", "quota"])) return finding(builtInRules[27]!, "pass", [evidence("Rate-limit documentation text found.")]);
      return finding(builtInRules[27]!, "unknown", [evidence("No rate-limit guidance found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "agent.a2a_agent_card_detected",
      title: "A2A Agent Card is detectable",
      profiles: agentProfiles,
      category: "a2a",
      severity: "critical",
      description: "Checks for A2A Agent Card discovery paths.",
      recommendation: "Publish an A2A Agent Card at /.well-known/agent-card.json or document the direct card URL.",
      source: sourceUrl("a2a")
    }),
    (ctx) => {
      const item = firstSuccessfulPath(ctx, ["/.well-known/agent-card.json", "/.well-known/agent.json"]);
      if (item) return finding(builtInRules[28]!, "pass", [evidence("A2A Agent Card found.", item.url)]);
      return finding(builtInRules[28]!, "fail", [evidence("No A2A Agent Card found at well-known paths.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "agent.a2a_agent_card_shape",
      title: "A2A Agent Card has usable fields",
      profiles: agentProfiles,
      category: "a2a",
      severity: "major",
      description: "Checks whether the Agent Card has basic identity and capability fields.",
      recommendation: "Include name, description, version, service URL or supported interfaces, and skills.",
      source: sourceUrl("a2a")
    }),
    (ctx) => {
      const item = firstSuccessfulPath(ctx, ["/.well-known/agent-card.json", "/.well-known/agent.json"]);
      if (!item) return finding(builtInRules[29]!, "not_applicable", [evidence("No Agent Card was fetched.")]);
      try {
        const parsed = JSON.parse(item.body) as Record<string, unknown>;
        const hasIdentity = typeof parsed.name === "string" && typeof parsed.description === "string";
        const hasEndpoint = typeof parsed.url === "string" || Array.isArray(parsed.supportedInterfaces);
        const hasSkills = Array.isArray(parsed.skills);
        if (hasIdentity && hasEndpoint && hasSkills) {
          return finding(builtInRules[29]!, "pass", [evidence("Agent Card includes identity, endpoint/interface, and skills.", item.url)]);
        }
        return finding(builtInRules[29]!, "warn", [evidence("Agent Card is JSON but lacks one or more expected fields.", item.url)]);
      } catch {
        return finding(builtInRules[29]!, "fail", [evidence("Agent Card endpoint did not return valid JSON.", item.url)]);
      }
    }
  ),
  defineRule(
    baseDefinition({
      id: "agent.task_interface_detected",
      title: "Task interface is detectable",
      profiles: agentProfiles,
      category: "agent-service",
      severity: "major",
      description: "Checks for task interface, skills, input/output modes, or task lifecycle signals.",
      recommendation: "Document task submission, input/output modes, status lifecycle, expected outputs, and error behavior."
    }),
    (ctx) => {
      if (anyText(ctx, ["task", "skills", "inputmodes", "outputmodes", "submitted", "working", "completed"])) {
        return finding(builtInRules[30]!, "pass", [evidence("Task interface signal found.")]);
      }
      return finding(builtInRules[30]!, "warn", [evidence("No task interface signal found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "agent.mcp_metadata_detected",
      title: "MCP metadata is detectable",
      profiles: mcpProfiles,
      category: "mcp",
      severity: "major",
      description: "Checks for MCP server metadata or documentation hints.",
      recommendation: "Document MCP endpoint, transport, authorization, tools, resources, and prompts.",
      source: sourceUrl("mcp")
    }),
    (ctx) => {
      const item = firstSuccessfulPath(ctx, ["/.well-known/oauth-protected-resource", "/.well-known/oauth-authorization-server"]);
      if (item) return finding(builtInRules[31]!, "pass", [evidence("MCP-related OAuth metadata found.", item.url)]);
      if (anyText(ctx, ["model context protocol", "mcp server", "mcp endpoint", "streamable http"])) {
        return finding(builtInRules[31]!, "pass", [evidence("MCP documentation text found.")]);
      }
      return finding(builtInRules[31]!, "warn", [evidence("No MCP metadata or documentation signal found.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "mcp.oauth_protected_resource_metadata",
      title: "MCP OAuth protected resource metadata is available",
      profiles: mcpProfiles,
      category: "mcp",
      severity: "major",
      description: "Checks for RFC9728 OAuth protected resource metadata at the root well-known path.",
      recommendation: "For protected HTTP MCP servers, publish OAuth protected resource metadata or return resource_metadata in WWW-Authenticate.",
      source: sourceUrl("mcp")
    }),
    (ctx) => {
      const item = record(ctx, "/.well-known/oauth-protected-resource");
      if (item && successful(item)) return finding(builtInRules[32]!, "pass", [evidence("OAuth protected resource metadata found.", item.url)]);
      const wwwAuth = ctx.snapshot.records.find((entry) => header(entry, "www-authenticate")?.includes("resource_metadata"));
      if (wwwAuth) return finding(builtInRules[32]!, "pass", [evidence("WWW-Authenticate resource_metadata hint found.", wwwAuth.url)]);
      return finding(builtInRules[32]!, "unknown", [recordStatusEvidence(ctx, "/.well-known/oauth-protected-resource")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "security.https_required",
      title: "Target uses HTTPS",
      profiles: allProfiles,
      category: "security",
      severity: "major",
      description: "Checks whether the normalized target uses HTTPS.",
      recommendation: "Use HTTPS for public agent, API, commerce, and policy surfaces."
    }),
    (ctx) => {
      if (ctx.snapshot.normalizedTarget.startsWith("https://")) {
        return finding(builtInRules[33]!, "pass", [evidence("Target uses HTTPS.", ctx.snapshot.normalizedTarget)]);
      }
      return finding(builtInRules[33]!, "warn", [evidence("Target uses HTTP, not HTTPS.", ctx.snapshot.normalizedTarget)]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "security.security_txt",
      title: "security.txt is available",
      profiles: allProfiles,
      category: "security",
      severity: "minor",
      description: "Checks for /.well-known/security.txt.",
      recommendation: "Publish security.txt with vulnerability reporting contact information."
    }),
    (ctx) => {
      const item = record(ctx, "/.well-known/security.txt");
      if (item && successful(item)) return finding(builtInRules[34]!, "pass", [evidence("security.txt found.", item.url)]);
      return finding(builtInRules[34]!, "warn", [safeMissingEvidence("/.well-known/security.txt", item)]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "security.exposed_secret_passive_scan",
      title: "No obvious secrets found in fetched public content",
      profiles: allProfiles,
      category: "security",
      severity: "critical",
      description: "Passively scans fetched public text for common secret patterns.",
      recommendation: "Remove public secrets immediately, rotate affected credentials, and add secret scanning to CI."
    }),
    (ctx) => {
      const matches = securityRegexes().flatMap((pattern) => regexEvidence(ctx, pattern, "Secret-like token pattern found in public content."));
      if (matches.length > 0) return finding(builtInRules[35]!, "fail", matches);
      return finding(builtInRules[35]!, "pass", [evidence("No common secret patterns found in fetched public content.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "security.unsafe_cors",
      title: "CORS headers are not obviously unsafe",
      profiles: allProfiles,
      category: "security",
      severity: "critical",
      description: "Checks for wildcard CORS combined with credentials.",
      recommendation: "Avoid Access-Control-Allow-Origin: * with credentialed responses. Restrict allowed origins."
    }),
    (ctx) => {
      if (hasCorsWildcardWithCredentials(ctx)) {
        return finding(builtInRules[36]!, "fail", [evidence("Wildcard CORS with credentials detected.")]);
      }
      if (hasCorsWildcard(ctx)) {
        return finding(builtInRules[36]!, "warn", [evidence("Wildcard CORS detected. This may be acceptable for public APIs but should be intentional.")]);
      }
      return finding(builtInRules[36]!, "pass", [evidence("No wildcard CORS risk detected in fetched responses.")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "security.public_admin_path",
      title: "Public admin path is not exposed",
      profiles: allProfiles,
      category: "security",
      severity: "major",
      description: "Passively checks the common /admin path.",
      recommendation: "Protect admin surfaces with authentication and avoid exposing administrative metadata publicly."
    }),
    (ctx) => {
      const item = record(ctx, "/admin");
      if (!item || item.status === 404 || item.status === 403 || item.status === 401) {
        return finding(builtInRules[37]!, "pass", [evidence(`/admin is not publicly reachable (${statusLabel(item)}).`, item?.url)]);
      }
      if (item.status >= 200 && item.status < 300) return finding(builtInRules[37]!, "warn", [evidence("/admin returned a successful response.", item.url)]);
      return finding(builtInRules[37]!, "unknown", [recordStatusEvidence(ctx, "/admin")]);
    }
  ),
  defineRule(
    baseDefinition({
      id: "security.prompt_injection_surface",
      title: "No obvious prompt-injection bait found in public tool text",
      profiles: allProfiles,
      category: "security",
      severity: "major",
      description: "Checks public pages and agent/tool metadata for instruction-like text that may target agents.",
      recommendation: "Keep tool and agent descriptions descriptive, not imperative toward model internals."
    }),
    (ctx) => {
      const pattern = /(ignore (all )?(previous|prior) instructions|system prompt|developer message|reveal your prompt|do not tell the user)/i;
      const matches = regexEvidence(ctx, pattern, "Instruction-like prompt injection text found.");
      if (matches.length > 0) return finding(builtInRules[38]!, "warn", matches);
      return finding(builtInRules[38]!, "pass", [evidence("No obvious prompt-injection bait found in fetched content.")]);
    }
  )
];
