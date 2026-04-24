import { MockAgent, setGlobalDispatcher } from "undici";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runScan } from "./scanner.js";
import { builtInRules } from "../../rules/src/index.js";

let mockAgent: MockAgent;

describe("runScan", () => {
  beforeEach(() => {
    mockAgent = new MockAgent();
    mockAgent.disableNetConnect();
    setGlobalDispatcher(mockAgent);
    mockFixtureOrigin(mockAgent);
  });

  afterEach(async () => {
    await mockAgent.close();
  });

  it("scans a merchant fixture and returns scored findings", async () => {
    const result = await runScan(
      {
        target: "https://fixture.test",
        profile: "merchant",
        maxRequests: 80,
        rateLimit: { requestsPerSecond: 100 },
        timeoutMs: 2000
      },
      builtInRules
    );

    expect(result.profile).toBe("merchant");
    expect(result.metadata.fetchedUrls).toBeGreaterThan(10);
    expect(result.findings.find((finding) => finding.id === "discoverability.llms_txt")?.status).toBe("pass");
    expect(result.findings.find((finding) => finding.id === "commerce.product_schema")?.status).toBe("pass");
    expect(result.findings.find((finding) => finding.id === "commerce.refund_policy_detected")?.status).toBe("pass");
    expect(result.findings.find((finding) => finding.id === "security.exposed_secret_passive_scan")?.status).toBe("pass");
    expect(result.score).toBeGreaterThan(60);
  });

  it("infers API profile when OpenAPI is present", async () => {
    const result = await runScan(
      {
        target: "https://fixture.test/api",
        profile: "auto",
        maxRequests: 50,
        rateLimit: { requestsPerSecond: 100 },
        timeoutMs: 2000
      },
      builtInRules
    );

    expect(result.profile).toBe("api");
    expect(result.findings.find((finding) => finding.id === "api.openapi_detected")?.status).toBe("pass");
  });
});

function mockFixtureOrigin(agent: MockAgent): void {
  const pool = agent.get("https://fixture.test");
  const html = (body: string) => ({ statusCode: 200, headers: { "content-type": "text/html" }, data: body });
  const text = (body: string) => ({ statusCode: 200, headers: { "content-type": "text/plain" }, data: body });
  const json = (body: unknown) => ({ statusCode: 200, headers: { "content-type": "application/json" }, data: JSON.stringify(body) });

  pool.intercept({ path: "/", method: "GET" }).reply(
    200,
    `<html>
      <head>
        <title>Fixture Store</title>
        <script type="application/ld+json">
          {"@context":"https://schema.org","@type":"Product","name":"Agent widget","offers":{"@type":"Offer","price":"19.00","priceCurrency":"USD","availability":"https://schema.org/InStock"}}
        </script>
      </head>
      <body>
        <h1>Agent widget</h1>
        <p>$19.00 in stock. Add to cart.</p>
        <a href="/cart">Cart</a>
        <a href="/checkout">Checkout</a>
        <a href="/refunds">Refunds</a>
        <a href="/support">Support</a>
        <a href="/openapi.json">API</a>
      </body>
    </html>`,
    { headers: { "content-type": "text/html" } }
  );
  pool.intercept({ path: "/api", method: "GET" }).reply(
    200,
    `<html><body><h1>Fixture API</h1><a href="/openapi.json">OpenAPI</a><p>Use Bearer token authentication, Idempotency-Key, webhooks, and rate limits.</p></body></html>`,
    { headers: { "content-type": "text/html" } }
  );
  pool.intercept({ path: "/robots.txt", method: "GET" }).reply(200, "User-agent: *\nAllow: /\n", { headers: { "content-type": "text/plain" } });
  pool.intercept({ path: "/sitemap.xml", method: "GET" }).reply(
    200,
    `<?xml version="1.0" encoding="UTF-8"?><urlset><url><loc>https://fixture.test/product</loc></url></urlset>`,
    { headers: { "content-type": "application/xml" } }
  );
  pool.intercept({ path: "/llms.txt", method: "GET" }).reply(200, "# Fixture Store\n\n> Agent-ready merchant fixture.\n\n## Docs\n\n- [Refunds](/refunds): Refund policy\n", { headers: { "content-type": "text/plain" } });
  pool.intercept({ path: "/llms-full.txt", method: "GET" }).reply(200, "# Fixture Store\n\nFull fixture context.\n", { headers: { "content-type": "text/plain" } });
  pool.intercept({ path: "/.well-known/security.txt", method: "GET" }).reply(200, "Contact: mailto:security@example.com\n", { headers: { "content-type": "text/plain" } });
  pool.intercept({ path: "/openapi.json", method: "GET" }).reply(200, JSON.stringify({ openapi: "3.1.0", info: { title: "Fixture API", version: "1.0.0" }, paths: { "/orders": {} } }), { headers: { "content-type": "application/json" } });
  pool.intercept({ path: "/api/openapi.json", method: "GET" }).reply(200, JSON.stringify({ openapi: "3.1.0", info: { title: "Fixture API", version: "1.0.0" }, paths: { "/orders": {} } }), { headers: { "content-type": "application/json" } });
  pool.intercept({ path: "/refunds", method: "GET" }).reply(200, "<html><body><h1>Refund policy</h1><p>Refunds are available within 30 days.</p></body></html>", { headers: { "content-type": "text/html" } });
  pool.intercept({ path: "/returns", method: "GET" }).reply(200, "<html><body><h1>Returns</h1></body></html>", { headers: { "content-type": "text/html" } });
  pool.intercept({ path: "/return-policy", method: "GET" }).reply(200, "<html><body><h1>Return policy</h1></body></html>", { headers: { "content-type": "text/html" } });
  pool.intercept({ path: "/cancellation", method: "GET" }).reply(200, "<html><body><h1>Cancellation</h1><p>Cancel order before shipment.</p></body></html>", { headers: { "content-type": "text/html" } });
  pool.intercept({ path: "/support", method: "GET" }).reply(200, "<html><body><h1>Support</h1><p>Response time is within 24 hours.</p></body></html>", { headers: { "content-type": "text/html" } });
  pool.intercept({ path: "/contact", method: "GET" }).reply(200, "<html><body><h1>Contact us</h1></body></html>", { headers: { "content-type": "text/html" } });
  pool.intercept({ path: "/shipping", method: "GET" }).reply(200, "<html><body><h1>Shipping</h1><p>Shipping, delivery, tax, and fees are shown at checkout.</p></body></html>", { headers: { "content-type": "text/html" } });
  pool.intercept({ path: "/cart", method: "GET" }).reply(200, "<html><body><h1>Cart</h1></body></html>", { headers: { "content-type": "text/html" } });
  pool.intercept({ path: "/checkout", method: "GET" }).reply(200, "<html><body><h1>Checkout</h1><form><button>Pay</button></form></body></html>", { headers: { "content-type": "text/html" } });
  pool.intercept({ path: "/product", method: "GET" }).reply(
    200,
    `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Agent widget","offers":{"@type":"Offer","price":"19.00","availability":"https://schema.org/InStock"}}</script></head><body>$19.00 in stock.</body></html>`,
    { headers: { "content-type": "text/html" } }
  );

  for (const path of [
    "/index.html.md",
    "/agents.txt",
    "/ai.txt",
    "/agent-policy",
    "/bot-policy",
    "/crawler-policy",
    "/.well-known/agent-card.json",
    "/.well-known/agent.json",
    "/.well-known/oauth-protected-resource",
    "/.well-known/oauth-authorization-server",
    "/.well-known/openid-configuration",
    "/.well-known/web-bot-auth",
    "/.well-known/signature-agent-directory",
    "/openapi.yaml",
    "/swagger.json",
    "/docs",
    "/pricing",
    "/terms",
    "/privacy",
    "/admin",
    "/webhooks",
    "/status"
  ]) {
    pool.intercept({ path, method: "GET" }).reply(404, "not found", { headers: { "content-type": "text/plain" } });
  }
}
