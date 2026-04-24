export interface ParsedLlmsTxt {
  hasH1: boolean;
  summary?: string;
  sectionCount: number;
  links: Array<{ label: string; url: string; notes?: string }>;
  hasOptionalSection: boolean;
}

export function parseLlmsTxt(markdown: string): ParsedLlmsTxt {
  const lines = markdown.split(/\r?\n/);
  const hasH1 = lines.some((line) => /^#\s+\S/.test(line.trim()));
  const summaryLine = lines.find((line) => /^>\s+/.test(line.trim()));
  const headings = lines.filter((line) => /^##\s+\S/.test(line.trim()));
  const hasOptionalSection = headings.some((line) => /^##\s+optional\s*$/i.test(line.trim()));
  const links: ParsedLlmsTxt["links"] = [];

  const linkPattern = /^\s*[-*]\s+\[([^\]]+)]\(([^)]+)\)(?::\s*(.+))?\s*$/;
  for (const line of lines) {
    const match = linkPattern.exec(line);
    if (!match) continue;
    links.push({
      label: match[1] ?? "",
      url: match[2] ?? "",
      ...(match[3] ? { notes: match[3] } : {})
    });
  }

  return {
    hasH1,
    ...(summaryLine ? { summary: summaryLine.replace(/^>\s*/, "").trim() } : {}),
    sectionCount: headings.length,
    links,
    hasOptionalSection
  };
}
