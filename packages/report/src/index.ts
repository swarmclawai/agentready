import type { Finding, OutputFormat, ScanResult } from "../../types/src/index.js";

export function renderReport(result: ScanResult, format: OutputFormat): string {
  switch (format) {
    case "json":
      return `${JSON.stringify(result, null, 2)}\n`;
    case "markdown":
      return renderMarkdown(result);
    case "html":
      return renderHtml(result);
    case "text":
      return renderText(result);
  }
}

export function renderText(result: ScanResult): string {
  const grouped = groupFindings(result.findings);
  const lines = [
    `AgentReady Report`,
    `Target: ${result.normalizedTarget}`,
    `Profile: ${result.profile}`,
    `Score: ${result.score}/100`,
    ``,
    `Category Scores:`,
    ...result.scores.map((section) => `- ${section.label}: ${section.score}/${section.weight}`),
    ``,
    `Summary: ${result.summary.critical} critical, ${result.summary.major} major, ${result.summary.minor} minor, ${result.summary.pass} passed`,
    ``
  ];

  for (const [label, findings] of grouped) {
    if (findings.length === 0) continue;
    lines.push(`${label}:`);
    for (const finding of findings) {
      lines.push(`- [${finding.status.toUpperCase()}] ${finding.title}`);
      const evidence = finding.evidence[0];
      if (evidence) lines.push(`  Evidence: ${evidence.message}${evidence.url ? ` (${evidence.url})` : ""}`);
      if (finding.recommendation) lines.push(`  Fix: ${finding.recommendation}`);
    }
    lines.push("");
  }

  lines.push(`Fetched URLs: ${result.metadata.fetchedUrls}`);
  lines.push(`Elapsed: ${result.metadata.elapsedMs}ms`);
  return `${lines.join("\n")}\n`;
}

export function renderMarkdown(result: ScanResult): string {
  const grouped = groupFindings(result.findings);
  const lines = [
    `# AgentReady Report for ${result.normalizedTarget}`,
    ``,
    `**Score:** ${result.score}/100`,
    `**Profile:** ${result.profile}`,
    `**Scanned:** ${result.completedAt}`,
    ``,
    `## Category Scores`,
    ``,
    `| Category | Score |`,
    `|---|---:|`,
    ...result.scores.map((section) => `| ${escapePipes(section.label)} | ${section.score}/${section.weight} |`),
    ``
  ];

  for (const [label, findings] of grouped) {
    if (findings.length === 0) continue;
    lines.push(`## ${label}`, "");
    for (const finding of findings) {
      lines.push(`### ${finding.title}`, "");
      lines.push(`- **Status:** ${finding.status}`);
      lines.push(`- **Severity:** ${finding.severity}`);
      lines.push(`- **Rule:** \`${finding.id}\``);
      for (const item of finding.evidence) {
        lines.push(`- **Evidence:** ${item.message}${item.url ? ` (${item.url})` : ""}`);
      }
      if (finding.recommendation) lines.push(`- **Recommended fix:** ${finding.recommendation}`);
      if (finding.source) lines.push(`- **Source:** ${finding.source}`);
      lines.push("");
    }
  }

  lines.push("## Metadata", "");
  lines.push(`- Fetched URLs: ${result.metadata.fetchedUrls}`);
  lines.push(`- Skipped by robots.txt: ${result.metadata.skippedByRobots.length}`);
  lines.push(`- Scanner user agent: \`${result.metadata.userAgent}\``);
  return `${lines.join("\n")}\n`;
}

export function renderHtml(result: ScanResult): string {
  const grouped = groupFindings(result.findings);
  const sections = grouped
    .filter(([, findings]) => findings.length > 0)
    .map(
      ([label, findings]) => `
        <section>
          <h2>${escapeHtml(label)}</h2>
          ${findings
            .map(
              (finding) => `
            <article class="finding ${escapeHtml(finding.status)}">
              <div class="finding-header">
                <h3>${escapeHtml(finding.title)}</h3>
                <span>${escapeHtml(finding.status)} / ${escapeHtml(finding.severity)}</span>
              </div>
              <p><code>${escapeHtml(finding.id)}</code></p>
              <ul>
                ${finding.evidence
                  .map((item) => `<li>${escapeHtml(item.message)}${item.url ? ` <a href="${escapeAttribute(item.url)}">${escapeHtml(item.url)}</a>` : ""}</li>`)
                  .join("")}
              </ul>
              ${finding.recommendation ? `<p><strong>Fix:</strong> ${escapeHtml(finding.recommendation)}</p>` : ""}
              ${finding.source ? `<p><a href="${escapeAttribute(finding.source)}">Source</a></p>` : ""}
            </article>`
            )
            .join("")}
        </section>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AgentReady Report</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f7f7f5; color: #171717; }
    header { background: #12312b; color: #fff; padding: 32px max(24px, calc((100vw - 1040px) / 2)); }
    main { max-width: 1040px; margin: 0 auto; padding: 24px; }
    h1, h2, h3 { margin: 0 0 10px; }
    .score { font-size: 56px; font-weight: 760; line-height: 1; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 0; }
    .metric, article { background: #fff; border: 1px solid #deded8; border-radius: 8px; padding: 16px; }
    .finding-header { display: flex; justify-content: space-between; gap: 16px; align-items: baseline; }
    .fail { border-left: 5px solid #bd2c2c; }
    .warn, .unknown { border-left: 5px solid #b7791f; }
    .pass { border-left: 5px solid #237a4b; }
    .info, .not_applicable { border-left: 5px solid #4a6fa5; }
    a { color: #0d5f55; overflow-wrap: anywhere; }
    code { background: #f0f0ea; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <header>
    <h1>AgentReady Report</h1>
    <p>${escapeHtml(result.normalizedTarget)} · ${escapeHtml(result.profile)} · ${escapeHtml(result.completedAt)}</p>
    <div class="score">${result.score}/100</div>
  </header>
  <main>
    <section class="grid">
      ${result.scores.map((section) => `<div class="metric"><strong>${escapeHtml(section.label)}</strong><br>${section.score}/${section.weight}</div>`).join("")}
    </section>
    ${sections}
  </main>
</body>
</html>
`;
}

function groupFindings(findings: Finding[]): Array<[string, Finding[]]> {
  const relevant = (severity: Finding["severity"], statuses: Finding["status"][] = ["fail", "warn", "unknown"]) =>
    findings.filter((finding) => finding.severity === severity && statuses.includes(finding.status));
  return [
    ["Critical Issues", relevant("critical")],
    ["Major Issues", relevant("major")],
    ["Minor Issues", relevant("minor")],
    ["Informational Findings", findings.filter((finding) => finding.status === "info" || finding.status === "not_applicable")],
    ["Passed Checks", findings.filter((finding) => finding.status === "pass")]
  ];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function escapePipes(value: string): string {
  return value.replaceAll("|", "\\|");
}
