export function looksLikeOpenApi(body: string, contentType = ""): boolean {
  const normalized = body.trim();
  if (!normalized) return false;
  if (/json|yaml|yml/i.test(contentType)) {
    if (/"openapi"\s*:\s*"3\.\d/.test(normalized)) return true;
    if (/"swagger"\s*:\s*"2\.0"/.test(normalized)) return true;
    if (/^openapi:\s*3\.\d/m.test(normalized)) return true;
    if (/^swagger:\s*["']?2\.0/m.test(normalized)) return true;
  }
  return normalized.includes('"paths"') && normalized.includes('"info"') && normalized.includes('"openapi"');
}
