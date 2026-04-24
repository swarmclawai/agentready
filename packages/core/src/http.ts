import { fetch, type RequestInit } from "undici";
import type { FetchRecord, RequiredScannerOptions } from "../../types/src/index.js";

export const DEFAULT_USER_AGENT =
  "AgentReady/0.1.0-alpha.0 (+https://github.com/swarmclawai/agentready; passive scanner)";

const MAX_BODY_BYTES = 750_000;

export class HttpClient {
  private requests = 0;
  private lastRequestAt = 0;
  readonly records: FetchRecord[] = [];

  constructor(private readonly options: RequiredScannerOptions) {}

  get remainingRequests(): number {
    return Math.max(0, this.options.maxRequests - this.requests);
  }

  async request(url: string, method: "GET" | "HEAD" = "GET"): Promise<FetchRecord> {
    if (this.requests >= this.options.maxRequests) {
      return this.recordError(url, method, "max request limit reached", 0);
    }

    this.requests += 1;
    await this.throttle();

    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const init: RequestInit = {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": DEFAULT_USER_AGENT,
          accept:
            method === "HEAD"
              ? "*/*"
              : "text/html,application/xhtml+xml,application/json,application/xml,text/plain,*/*;q=0.8"
        }
      };
      const response = await fetch(url, init);
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      const contentType = headers["content-type"] ?? "";
      let body = "";
      if (method === "GET" && shouldReadBody(contentType)) {
        const raw = await response.arrayBuffer();
        const bytes = raw.byteLength > MAX_BODY_BYTES ? raw.slice(0, MAX_BODY_BYTES) : raw;
        body = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      }

      const record: FetchRecord = {
        url: response.url,
        requestedUrl: url,
        method,
        status: response.status,
        ok: response.ok,
        redirected: response.redirected,
        contentType,
        headers,
        body,
        elapsedMs: Date.now() - started
      };
      this.records.push(record);
      return record;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.recordError(url, method, message, Date.now() - started);
    } finally {
      clearTimeout(timeout);
    }
  }

  private recordError(url: string, method: "GET" | "HEAD", error: string, elapsedMs: number): FetchRecord {
    const record: FetchRecord = {
      url,
      requestedUrl: url,
      method,
      status: 0,
      ok: false,
      redirected: false,
      contentType: "",
      headers: {},
      body: "",
      error,
      elapsedMs
    };
    this.records.push(record);
    return record;
  }

  private async throttle(): Promise<void> {
    const rps = this.options.rateLimit.requestsPerSecond;
    if (!Number.isFinite(rps) || rps <= 0) return;
    const minGap = 1000 / rps;
    const elapsed = Date.now() - this.lastRequestAt;
    if (this.lastRequestAt > 0 && elapsed < minGap) {
      await new Promise((resolve) => setTimeout(resolve, minGap - elapsed));
    }
    this.lastRequestAt = Date.now();
  }
}

function shouldReadBody(contentType: string): boolean {
  const normalized = contentType.toLowerCase();
  if (!normalized) return true;
  return [
    "text/",
    "application/json",
    "application/ld+json",
    "application/xml",
    "application/rss+xml",
    "application/atom+xml",
    "application/xhtml+xml",
    "application/yaml",
    "application/x-yaml"
  ].some((allowed) => normalized.includes(allowed));
}
