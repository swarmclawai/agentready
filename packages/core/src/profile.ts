import type { Profile, TargetSnapshot } from "../../types/src/index.js";
import { jsonLdTypes } from "./html.js";
import { bodyText, hasAny, successful } from "./utils.js";
import { looksLikeOpenApi } from "./openapi.js";

export function inferProfile(snapshot: TargetSnapshot): Profile {
  const allJsonLd = snapshot.pages.flatMap((page) => page.jsonLd);
  const types = jsonLdTypes(allJsonLd);
  const text = bodyText(snapshot.records);

  if (successful(snapshot.recordsByPath.get("/.well-known/agent-card.json"))) return "agent-service";
  if (successful(snapshot.recordsByPath.get("/.well-known/agent.json"))) return "agent-service";
  if (snapshot.records.some((record) => looksLikeOpenApi(record.body, record.contentType))) return "api";
  if (hasAny(text, ["model context protocol", "mcp server", "mcp endpoint"])) return "mcp-server";
  if (types.some((type) => ["product", "offer"].includes(type))) return "merchant";
  if (hasAny(text, ["add to cart", "checkout", "shipping", "refund", "inventory"])) return "merchant";
  if (hasAny(text, ["marketplace", "seller", "vendors", "list your service"])) return "marketplace";
  return "website";
}
