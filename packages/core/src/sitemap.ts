import { XMLParser } from "fast-xml-parser";

export function parseSitemapUrls(xml: string): string[] {
  if (!xml.trim()) return [];
  try {
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml) as unknown;
    return extractLocs(parsed).filter((url) => /^https?:\/\//i.test(url));
  } catch {
    return [];
  }
}

function extractLocs(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(extractLocs);
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  const current = typeof object.loc === "string" ? [object.loc] : [];
  return current.concat(Object.values(object).flatMap(extractLocs));
}
