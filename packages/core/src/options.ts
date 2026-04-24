import type { RequiredScannerOptions, ScanOptions } from "../../types/src/index.js";

export function normalizeOptions(options: ScanOptions): RequiredScannerOptions {
  return {
    target: options.target,
    profile: options.profile ?? "auto",
    format: options.format ?? "text",
    maxPages: clampInteger(options.maxPages ?? 24, 1, 200),
    maxRequests: clampInteger(options.maxRequests ?? 80, 1, 500),
    timeoutMs: clampInteger(options.timeoutMs ?? 10_000, 1000, 120_000),
    rateLimit: {
      requestsPerSecond: clampNumber(options.rateLimit?.requestsPerSecond ?? 2, 0.1, 20)
    },
    respectRobots: options.respectRobots ?? true,
    active: options.active ?? false,
    browser: options.browser ?? false,
    failOn: options.failOn ?? "none",
    include: options.include ?? [],
    exclude: options.exclude ?? []
  };
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
