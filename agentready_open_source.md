# AgentReady

**Open-source readiness scanner for the agentic web.**

AgentReady checks whether a website, API, marketplace, or merchant is ready for AI agents to discover it, understand it, authenticate with it, buy from it, pay it, request refunds, and interact safely.

The goal is simple:

> Help businesses become usable by AI agents without forcing them into one vendor, one payment rail, or one agent platform.

AgentReady is designed to be open source from day one.

---

## Why AgentReady Exists

The web is changing from a human-only interface into a mixed human-and-agent interface.

Humans use pages, buttons, checkout forms, dashboards, and support flows.

Agents need something different:

- clear machine-readable content
- discoverable policies
- structured product and service data
- trusted identity and authentication hints
- safe checkout and payment flows
- refund and dispute paths
- signed receipts and audit trails
- predictable API behavior
- tool and MCP safety checks

Right now, this is fragmented across many emerging standards and patterns:

- `llms.txt`
- markdown mirrors
- structured data
- robots and crawler policies
- x402 payments
- AP2-style mandates
- agentic checkout flows
- Universal Commerce-style flows
- MCP servers
- A2A Agent Cards
- Web Bot Auth
- signed receipts
- escrow and refund flows

Most businesses do not know which of these they need, which ones they already support, or what is broken.

AgentReady gives them a practical answer.

---

## Project Status

**Status:** pre-alpha / public planning

AgentReady should start as a CLI and rules engine, then grow into a hosted scanner and continuous monitoring product.

The first public release should focus on passive checks only. It should inspect public pages and endpoints without bypassing auth, CAPTCHAs, rate limits, or access controls.

---

## Core Idea

Run:

```bash
npx agentready scan https://example.com
```

Get:

```txt
Agent Readiness Score: 58/100

Critical issues:
- No machine-readable refund or cancellation flow found
- Checkout flow appears browser-only and not agent-addressable
- No agent access policy found

Major issues:
- No llms.txt found
- Product data is missing structured JSON-LD
- Inventory freshness is unclear
- Support path is not machine-readable

Passed:
- robots.txt found
- sitemap.xml found
- return policy page found
- contact page found
```

Then AgentReady produces a report with practical fixes.

---

## Who AgentReady Is For

AgentReady is for:

- merchants that want AI agents to buy from them
- API sellers that want to charge agents per request
- marketplaces that list agent-accessible services
- MCP server publishers
- tool and skill marketplaces
- agent platforms
- agencies helping brands become agent-ready
- developers building x402, MCP, A2A, or agentic commerce products

---

## What AgentReady Checks

### 1. Agent Discoverability

Checks whether an agent can understand what the site or service offers.

Examples:

- `llms.txt`
- `llms-full.txt`
- sitemap
- robots policy
- markdown fallbacks
- structured data
- product schema
- service schema
- API documentation
- pricing pages
- public support pages
- crawlable policy pages

Example findings:

```txt
PASS: sitemap.xml found
PASS: robots.txt found
WARN: no llms.txt found
WARN: no markdown fallback detected
FAIL: product pages do not expose structured product data
```

---

### 2. Agent Access Policy

Checks whether the business explains how agents are allowed to access it.

Examples:

- agent access policy
- crawler policy
- bot policy
- rate-limit information
- signed-agent support
- Web Bot Auth hints
- public key directory hints
- allowed and blocked agent behavior

Example findings:

```txt
WARN: no agent access policy found
WARN: no signed-agent authentication hints found
INFO: robots.txt allows general crawling
```

---

### 3. Commerce Readiness

Checks whether an agent can understand and complete a commercial journey.

Examples:

- product data
- price data
- taxes and fees
- shipping options
- inventory freshness
- cart behavior
- checkout behavior
- order status
- cancellation path
- return path
- refund path
- support escalation

Example findings:

```txt
PASS: product price visible
WARN: inventory freshness unknown
FAIL: checkout requires browser-only interaction
FAIL: no machine-readable cancellation flow found
FAIL: refund policy exists but is not structured
```

---

### 4. Payment Readiness

Checks whether the site or API can accept machine-native payments.

Examples:

- `402 Payment Required` behavior
- x402-compatible response shape
- payment metadata
- stablecoin payment hints
- fiat payment hints
- signed receipts
- escrow support
- refund support
- dispute support

Example findings:

```txt
INFO: no x402 endpoint detected
WARN: no signed receipt endpoint found
WARN: no refund API found
```

---

### 5. API and Agent-Service Readiness

Checks whether an API or agent service is usable by another agent.

Examples:

- OpenAPI schema
- MCP server metadata
- A2A Agent Card
- auth documentation
- idempotency behavior
- retry behavior
- timeout behavior
- pricing metadata
- usage limits
- webhook support
- signed task receipts

Example findings:

```txt
PASS: OpenAPI document found
WARN: no A2A Agent Card found
WARN: no MCP server metadata found
FAIL: no idempotency guidance found for paid actions
```

---

### 6. Security and Safety

Checks for common risks when agents interact with websites, APIs, tools, and MCP servers.

The default scanner should be passive. Active security tests should require explicit permission.

Examples:

- exposed secrets
- unsafe CORS
- public admin paths
- dangerous MCP tool descriptions
- suspicious tool permissions
- prompt-injection bait in public tool descriptions
- unclear auth boundaries
- unprotected paid endpoints
- missing audit trail

Example findings:

```txt
WARN: public tool description includes model-facing instructions
WARN: no security contact found
FAIL: API documentation exposes a test secret
```

---

## Profiles

Different targets need different checks.

AgentReady should support profiles.

```bash
npx agentready scan https://example.com --profile website
npx agentready scan https://example.com --profile merchant
npx agentready scan https://example.com --profile api
npx agentready scan https://example.com --profile marketplace
npx agentready scan https://example.com --profile mcp-server
npx agentready scan https://example.com --profile agent-service
```

### Website Profile

Best for blogs, docs, publishers, and content sites.

Focus areas:

- discoverability
- `llms.txt`
- markdown access
- structured content
- robots policy
- citation and attribution metadata

### Merchant Profile

Best for stores, marketplaces, and service businesses.

Focus areas:

- products
- prices
- cart
- checkout
- order status
- refund policy
- cancellation policy
- shipping and tax clarity
- agent purchase readiness

### API Profile

Best for paid APIs and data providers.

Focus areas:

- OpenAPI
- auth
- pricing
- rate limits
- x402 support
- idempotency
- webhooks
- receipts
- SLA

### MCP Server Profile

Best for tool publishers and MCP server operators.

Focus areas:

- server metadata
- tool descriptions
- permission boundaries
- secret handling
- safety warnings
- provenance
- install guidance

### Agent Service Profile

Best for agents that other agents or humans can hire.

Focus areas:

- Agent Card
- task interface
- pricing
- expected outputs
- refunds
- dispute handling
- reputation data
- signed receipts

---

## Scoring Model

AgentReady should produce a score from `0` to `100`.

The score should be useful, but it should not pretend to be perfect.

Suggested scoring categories:

| Category | Weight |
|---|---:|
| Discoverability | 20 |
| Agent access policy | 15 |
| Commerce or API readiness | 25 |
| Payment and receipt readiness | 15 |
| Refund, support, and dispute readiness | 15 |
| Security and safety | 10 |

Suggested severity levels:

| Severity | Meaning |
|---|---|
| Critical | Blocks safe agent usage |
| Major | Causes broken or unreliable agent usage |
| Minor | Worth fixing, but not blocking |
| Info | Useful context |
| Pass | Check passed |

Example:

```txt
Agent Readiness Score: 72/100

Discoverability: 18/20
Agent access policy: 8/15
Commerce readiness: 19/25
Payment readiness: 7/15
Refund and dispute readiness: 8/15
Security and safety: 14/15
```

---

## Output Formats

AgentReady should support multiple output formats.

```bash
npx agentready scan https://example.com --format text
npx agentready scan https://example.com --format json
npx agentready scan https://example.com --format markdown
npx agentready scan https://example.com --format html
```

### JSON Output

```json
{
  "target": "https://example.com",
  "profile": "merchant",
  "score": 58,
  "findings": [
    {
      "id": "commerce.refund.machine_readable_policy",
      "severity": "critical",
      "status": "fail",
      "title": "No machine-readable refund policy found",
      "evidence": [
        "Found refund page at /returns",
        "No structured refund metadata found"
      ],
      "recommendation": "Expose refund terms in structured metadata and document refund request behavior."
    }
  ]
}
```

### Markdown Report

```md
# AgentReady Report for example.com

Score: 58/100

## Critical Issues

### No machine-readable refund policy found

The site has a human-readable returns page, but agents cannot reliably extract refund rules, time windows, eligible items, or escalation paths.

Recommended fix: expose refund terms in structured metadata and document refund request behavior.
```

---

## Rule System

Rules should be public and easy to extend.

A rule should be small, readable, and testable.

Example rule:

```yaml
id: commerce.refund.machine_readable_policy
title: Machine-readable refund policy
profile: merchant
severity: critical
category: refund
description: Checks whether the target exposes a refund or return policy that an agent can understand.
check:
  type: structured_policy_detection
  paths:
    - /refunds
    - /returns
    - /return-policy
    - /terms
recommendation: Expose refund terms, refund windows, eligible item classes, required evidence, and escalation paths in structured metadata.
```

Another example:

```yaml
id: discoverability.llms_txt
title: llms.txt is available
profile: website
severity: minor
category: discoverability
description: Checks whether the target exposes an llms.txt file at the root.
check:
  type: http_exists
  path: /llms.txt
recommendation: Add an llms.txt file that points agents to the most useful public documentation and policies.
```

---

## Proposed Repository Structure

```txt
agentready/
  apps/
    web/
  packages/
    cli/
    core/
    rules/
    report/
    adapters/
    types/
  examples/
    merchant/
    api-seller/
    mcp-server/
  docs/
    rules.md
    scoring.md
    profiles.md
    contributing.md
    security.md
  README.md
  LICENSE
  package.json
  pnpm-workspace.yaml
```

### `packages/cli`

Command-line interface.

### `packages/core`

Scanner engine, fetcher, parser, rule runner, scoring logic.

### `packages/rules`

Public rule library.

### `packages/report`

Markdown, JSON, HTML, and text report generation.

### `packages/adapters`

Optional integrations for Playwright, OpenAPI, MCP metadata, x402 checks, and hosted scanning.

### `apps/web`

Optional hosted dashboard and report viewer.

---

## Technical Direction

Suggested stack:

- TypeScript
- Node.js
- pnpm
- Zod
- Undici
- Cheerio
- Playwright for optional browser checks
- Postgres for hosted scans
- SQLite for local cached scans
- Vite or Next.js for hosted report viewer
- Cloudflare Workers or a Node server for hosted API

The CLI should work without a database.

The hosted version can add:

- saved scans
- scheduled monitoring
- team accounts
- private scan targets
- webhooks
- badges
- trend reports

---

## CLI Commands

Proposed commands:

```bash
npx agentready scan https://example.com
npx agentready scan https://example.com --profile merchant
npx agentready scan https://example.com --format json
npx agentready scan https://example.com --output report.md
npx agentready rules list
npx agentready rules test ./rules/custom-rule.yaml https://example.com
npx agentready init
```

---

## Hosted Product

The open-source CLI should be useful by itself.

A hosted AgentReady product can provide convenience, monitoring, and team workflows.

Possible paid features:

- scheduled scans
- private reports
- team dashboards
- branded reports
- historical scoring
- alerting
- agency workspaces
- custom rules
- private endpoint checks
- implementation checklists
- AgentReady badge management

This keeps the core scanner open while allowing a sustainable business.

---

## Open Source Business Model

AgentReady should avoid hiding the useful parts behind a paywall too early.

Suggested model:

| Layer | Open Source | Paid Hosted |
|---|---|---|
| CLI scanner | Yes | Yes |
| Public rules | Yes | Yes |
| JSON and Markdown reports | Yes | Yes |
| HTML report viewer | Yes | Yes |
| Scheduled scans | No | Yes |
| Team dashboard | No | Yes |
| Historical trends | No | Yes |
| Private rules | No | Yes |
| Agency client management | No | Yes |
| Implementation support | No | Yes |

The open-source version should be strong enough that developers trust it.

The hosted version should save time.

---

## Roadmap

### Phase 0: Public Spec

- publish README
- define profiles
- define scoring
- define rule format
- collect community feedback

### Phase 1: Passive Scanner

- fetch target
- parse HTML
- inspect headers
- inspect robots.txt
- inspect sitemap.xml
- inspect `llms.txt`
- detect structured data
- detect common policy pages
- produce text, JSON, and Markdown reports

### Phase 2: Commerce Checks

- detect product pages
- detect price metadata
- detect cart and checkout patterns
- detect refund and return policy
- detect cancellation policy
- detect support escalation paths
- detect order-status paths

### Phase 3: API and Protocol Checks

- OpenAPI detection
- MCP metadata detection
- A2A Agent Card detection
- x402 response checks
- signed receipt hints
- idempotency checks
- webhook checks

### Phase 4: Security Checks

- exposed secret detection
- unsafe CORS detection
- suspicious MCP tool description detection
- public admin path detection
- risky auth pattern detection
- passive prompt-injection surface detection

### Phase 5: Hosted Reports

- saved reports
- public share links
- historical scan comparison
- scheduled monitoring
- agency dashboard
- branded reports

### Phase 6: AgentReady Badge

- badge criteria
- public verification page
- signed scan result
- expiry date
- transparent score history

The badge should not launch until the scoring system is stable and the project has community trust.

---

## AgentReady Badge

The badge should be useful, but honest.

Example:

```txt
AgentReady Basic
Valid until: 2026-07-31
Profile: Merchant
Score: 82/100
Last scan: 2026-04-24
```

Badge levels could be:

| Badge | Meaning |
|---|---|
| AgentReady Basic | Agents can understand the site and policies |
| AgentReady Commerce | Agents can understand products, checkout, refunds, and support |
| AgentReady API | Agents can use the API safely with clear auth, pricing, and receipts |
| AgentReady Secure | Security checks pass and risky surfaces are documented |

Badges should expire.

Badges should link to a public report.

Badges should never imply legal, financial, or security certification beyond the checks actually performed.

---

## Governance

AgentReady should be vendor-neutral.

The project should not become a marketing wrapper for one model provider, payment rail, cloud provider, marketplace, or agent framework.

Suggested governance rules:

- public roadmap
- public rule changes
- public scoring changes
- clear maintainer roles
- RFC process for major changes
- changelog for rule updates
- no hidden scoring weights in the open-source scanner
- no vendor-specific preference unless the rule is profile-specific

---

## Security Policy

AgentReady should be safe to run and safe to be scanned by.

Default behavior:

- do not bypass authentication
- do not bypass CAPTCHAs
- do not brute-force paths
- do not submit forms
- do not make purchases
- do not trigger paid actions
- do not attempt exploitation
- rate-limit requests
- identify the scanner user agent

Active checks should require explicit flags.

```bash
npx agentready scan https://example.com --active
```

Credentialed checks should require explicit owner consent.

```bash
npx agentready scan https://example.com --config agentready.config.json
```

---

## Example Config

```json
{
  "target": "https://example.com",
  "profile": "merchant",
  "include": [
    "discoverability",
    "commerce",
    "payment",
    "refund",
    "security"
  ],
  "exclude": [
    "active-security"
  ],
  "rateLimit": {
    "requestsPerSecond": 1
  },
  "report": {
    "format": "markdown",
    "output": "agentready-report.md"
  }
}
```

---

## Example Report Summary

```txt
Target: https://example.com
Profile: merchant
Score: 58/100

Critical:
- No machine-readable refund flow
- Checkout appears browser-only

Major:
- No llms.txt
- No agent access policy
- No signed receipt support

Minor:
- Product schema missing optional availability field
- Support page lacks expected response time

Next steps:
1. Add llms.txt
2. Add structured product data
3. Add machine-readable refund and cancellation metadata
4. Publish an agent access policy
5. Add signed receipts for completed transactions
```

---

## What AgentReady Is Not

AgentReady is not:

- a replacement for a security audit
- a legal compliance certification
- a payment facilitator
- an agent marketplace
- an agent framework
- a model evaluation suite
- a crawler that ignores site owner policies

AgentReady is a practical readiness scanner.

It tells you what agents can and cannot reliably do with your site or service.

---

## Relationship to Other Projects

AgentReady should work alongside other tools.

Examples:

- x402 facilitators
- MCP registries
- A2A implementations
- OpenAPI tools
- security scanners
- agent observability platforms
- commerce checkout providers
- Web Bot Auth implementations
- content provenance tools

The goal is not to replace these tools.

The goal is to detect whether a target is ready for them.

---

## First 20 Rules to Build

1. `discoverability.robots_txt`
2. `discoverability.sitemap_xml`
3. `discoverability.llms_txt`
4. `discoverability.markdown_fallback`
5. `discoverability.structured_data`
6. `commerce.product_schema`
7. `commerce.price_visible`
8. `commerce.inventory_signal`
9. `commerce.checkout_detected`
10. `commerce.refund_policy_detected`
11. `commerce.cancellation_policy_detected`
12. `commerce.support_path_detected`
13. `payment.http_402_detected`
14. `payment.x402_metadata_detected`
15. `payment.signed_receipt_detected`
16. `api.openapi_detected`
17. `api.idempotency_guidance_detected`
18. `agent.a2a_agent_card_detected`
19. `agent.mcp_metadata_detected`
20. `security.exposed_secret_passive_scan`

---

## Contribution Guide

Good first contributions:

- add a new passive rule
- improve rule documentation
- add examples for a profile
- improve report formatting
- add tests for existing rules
- add sample reports
- add fixtures for common merchant pages
- improve scoring explanations

Suggested issue labels:

```txt
good first issue
rules
scanner
profiles
reports
security
docs
standards
hosted
```

---

## Rule Contribution Requirements

A rule should include:

- rule ID
- title
- category
- profile
- severity
- description
- check definition
- examples of passing targets
- examples of failing targets
- recommendation text
- tests

Rule IDs should be stable.

Bad rule ID:

```txt
check_123
```

Good rule ID:

```txt
discoverability.llms_txt
```

---

## Design Principles

### 1. Open by default

The core scanner, public rules, and scoring model should be open.

### 2. Passive by default

AgentReady should not behave like an aggressive crawler or penetration-testing tool unless explicitly configured.

### 3. Useful before perfect

A rough report with clear fixes is better than a perfect framework that never ships.

### 4. Standards-aligned, not standards-owned

AgentReady should track emerging standards without being captured by any single standard.

### 5. Explain every finding

Every failed check should include evidence and a practical next step.

### 6. Do not fake certainty

If AgentReady is unsure, it should say so.

### 7. Make the web better for agents and humans

Many fixes that help agents also help accessibility, SEO, support, and developer experience.

---

## Launch Plan

### Week 1

- publish repo
- publish README
- publish rule format
- ship 5 passive checks
- generate Markdown report

### Week 2

- add merchant profile
- add first commerce checks
- add JSON output
- add fixtures and tests

### Week 3

- add API profile
- add OpenAPI detection
- add x402 detection
- add A2A and MCP metadata checks

### Week 4

- launch public CLI
- publish example reports
- invite agencies and agent-commerce builders to test
- open issue tracker for rule requests

---

## Example Landing Page Copy

```txt
Is your business ready for AI agents?

AgentReady scans your site, API, or marketplace for agent-readability, checkout readiness, payment support, refund paths, and safety issues.

Open source. Standards-aligned. Built for the agentic web.
```

---

## Suggested License

Use **Apache-2.0** for the open-source project.

Apache-2.0 is friendly to commercial adoption and includes patent protection.

---

## Maintainer Notes

The first version should be small.

Do not start with every protocol.

Start with checks that create immediate value:

- Can agents find the important pages?
- Can agents understand the product or service?
- Can agents understand policies?
- Can agents complete or reason about checkout?
- Can agents understand refunds and support?
- Can developers see what to fix next?

The first goal is not to certify the whole agentic internet.

The first goal is to make one useful report that a merchant, developer, or agency can act on.

---

## North Star

AgentReady should become the open-source standard for answering one question:

> Can agents safely and reliably use this business?

