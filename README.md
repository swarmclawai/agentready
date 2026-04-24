# AgentReady

Open-source readiness scanner for the agentic web.

AgentReady checks whether a website, API, marketplace, merchant, MCP server, or agent service is ready for AI agents to discover it, understand it, authenticate with it, buy from it, pay it, request refunds, and interact safely.

```bash
npx @swarmclawai/agentready scan https://example.com --profile merchant
```

The npm package is `@swarmclawai/agentready`; the installed executable is `agentready`.

## Status

`0.1.0-alpha.0` is an early CLI release. It performs passive checks by default and produces text, JSON, Markdown, or HTML reports.

AgentReady does not bypass authentication, CAPTCHAs, rate limits, or access controls. It does not submit forms, make purchases, trigger paid actions, or attempt exploitation.

## Commands

```bash
agentready scan https://example.com
agentready scan https://example.com --profile merchant --format markdown --output report.md
agentready scan https://example.com --format json
agentready rules list
agentready rules test ./rules/custom-rule.yaml https://example.com
agentready init
```

Profiles:

- `website`
- `merchant`
- `api`
- `marketplace`
- `mcp-server`
- `agent-service`
- `auto`

Output formats:

- `text`
- `json`
- `markdown`
- `html`

## What It Checks

AgentReady includes passive rules for:

- `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, and Markdown fallbacks
- structured data, product schema, service schema, price, inventory, cart, checkout, shipping, tax, refund, cancellation, and support signals
- OpenAPI, API auth docs, idempotency, webhooks, and rate-limit guidance
- HTTP 402 and x402 metadata hints
- A2A Agent Cards at `/.well-known/agent-card.json` and legacy `/.well-known/agent.json`
- MCP OAuth protected resource and authorization metadata hints
- Web Bot Auth, AP2/mandate text, signed receipts, support response expectations
- `security.txt`, HTTPS, unsafe CORS, public `/admin`, obvious leaked secrets, and prompt-injection-like public tool text

## Example JSON

```json
{
  "target": "https://example.com",
  "profile": "merchant",
  "score": 58,
  "findings": [
    {
      "id": "commerce.refund_policy_detected",
      "severity": "critical",
      "status": "fail",
      "title": "Refund or return policy is detectable",
      "evidence": [
        {
          "message": "No refund or return policy signal found."
        }
      ],
      "recommendation": "Publish a crawlable refund/return policy with time windows, eligibility, and escalation paths."
    }
  ]
}
```

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

The CLI package lives in `packages/cli`; scanner logic is split across `packages/core`, `packages/rules`, `packages/report`, and `packages/types`.

## License

Apache-2.0
