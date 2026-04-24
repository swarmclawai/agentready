import * as cheerio from "cheerio";
import type { ParsedHtmlPage } from "../../types/src/index.js";
import { resolveSameOrigin, truncate, unique } from "./utils.js";

export function parseHtmlPage(url: string, html: string): ParsedHtmlPage {
  const $ = cheerio.load(html);

  const jsonLd: unknown[] = [];
  $("script[type='application/ld+json']").each((_, element) => {
    const raw = $(element).contents().text().trim();
    if (!raw) return;
    try {
      jsonLd.push(JSON.parse(raw));
    } catch {
      // Invalid JSON-LD is handled by rules through missing structured data.
    }
  });

  $("script,style,noscript,svg").remove();

  const anchors: Array<{ href: string; text: string }> = [];
  const links: string[] = [];
  $("a[href],link[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    const resolved = resolveSameOrigin(url, href);
    if (!resolved) return;
    links.push(resolved);
    if (element.tagName.toLowerCase() === "a") {
      anchors.push({ href: resolved, text: truncate($(element).text(), 160) });
    }
  });

  const forms: ParsedHtmlPage["forms"] = [];
  $("form").each((_, element) => {
    forms.push({
      action: $(element).attr("action"),
      method: $(element).attr("method")?.toUpperCase(),
      text: truncate($(element).text(), 220)
    });
  });

  const bodyText = truncate($("body").text(), 50_000);
  return {
    url,
    title: truncate($("title").first().text(), 160) || undefined,
    text: bodyText,
    links: unique(links),
    anchors,
    forms,
    jsonLd,
    hasMicrodata: $("[itemscope],[itemtype],[itemprop]").length > 0
  };
}

export function flattenJsonLd(values: unknown[]): unknown[] {
  const out: unknown[] = [];
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value && typeof value === "object") {
      out.push(value);
      const graph = (value as Record<string, unknown>)["@graph"];
      if (graph) visit(graph);
    }
  };
  values.forEach(visit);
  return out;
}

export function jsonLdTypes(values: unknown[]): string[] {
  const types = new Set<string>();
  for (const item of flattenJsonLd(values)) {
    const type = (item as Record<string, unknown>)["@type"];
    if (Array.isArray(type)) {
      type.forEach((entry) => {
        if (typeof entry === "string") types.add(entry.toLowerCase());
      });
    } else if (typeof type === "string") {
      types.add(type.toLowerCase());
    }
  }
  return [...types];
}

export function jsonLdHasKey(values: unknown[], key: string): boolean {
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (!value || typeof value !== "object") return false;
    const object = value as Record<string, unknown>;
    return Object.prototype.hasOwnProperty.call(object, key) || Object.values(object).some(visit);
  };
  return values.some(visit);
}
