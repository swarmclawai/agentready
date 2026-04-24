import type { Evidence, FetchRecord } from "../../types/src/index.js";

const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9_-]{16,}/g,
  /xox[baprs]-[A-Za-z0-9-]{16,}/g,
  /gh[pousr]_[A-Za-z0-9_]{20,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g
];

export function normalizeTarget(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Target URL is required.");
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https targets are supported.");
  }
  url.hash = "";
  return url;
}

export function originOf(url: URL | string): string {
  return new URL(url).origin;
}

export function pathKey(url: URL | string): string {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

export function sameOrigin(base: string, candidate: string): boolean {
  try {
    return new URL(base).origin === new URL(candidate, base).origin;
  } catch {
    return false;
  }
}

export function resolveSameOrigin(base: string, candidate: string): string | undefined {
  try {
    const resolved = new URL(candidate, base);
    if (!["http:", "https:"].includes(resolved.protocol)) return undefined;
    if (!sameOrigin(base, resolved.href)) return undefined;
    resolved.hash = "";
    return resolved.href;
  } catch {
    return undefined;
  }
}

export function rootPath(origin: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, origin).href;
}

export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function compact<T>(items: Array<T | undefined | null | false>): T[] {
  return items.filter(Boolean) as T[];
}

export function truncate(value: string, max = 240): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, max - 1)}…`;
}

export function redactSecrets(value: string): string {
  return SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, "[REDACTED]"), value);
}

export function evidence(message: string, url?: string, data?: unknown): Evidence {
  return {
    message: redactSecrets(truncate(message, 500)),
    ...(url ? { url } : {}),
    ...(data === undefined ? {} : { data })
  };
}

export function bodyText(records: FetchRecord[]): string {
  return records
    .map((record) => record.body)
    .join("\n")
    .toLowerCase();
}

export function hasAny(text: string, needles: string[]): boolean {
  const haystack = text.toLowerCase();
  return needles.some((needle) => haystack.includes(needle.toLowerCase()));
}

export function firstMatchingRecord(records: FetchRecord[], paths: string[]): FetchRecord | undefined {
  const pathSet = new Set(paths);
  return records.find((record) => pathSet.has(pathKey(record.url)) || pathSet.has(pathKey(record.requestedUrl)));
}

export function statusLabel(record: FetchRecord | undefined): string {
  if (!record) return "not fetched";
  if (record.error) return `error: ${record.error}`;
  return `HTTP ${record.status}`;
}

export function header(record: FetchRecord | undefined, name: string): string | undefined {
  if (!record) return undefined;
  return record.headers[name.toLowerCase()];
}

export function successful(record: FetchRecord | undefined): boolean {
  return Boolean(record && record.status >= 200 && record.status < 300 && !record.error);
}
