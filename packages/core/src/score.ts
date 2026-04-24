import type { Category, Finding, Profile, ScanSummary, ScoreSection } from "../../types/src/index.js";

const profileWeights: Record<Profile, Array<{ key: string; label: string; weight: number; categories: Category[] }>> = {
  website: [
    { key: "discoverability", label: "Discoverability", weight: 35, categories: ["discoverability"] },
    { key: "access-policy", label: "Agent access policy", weight: 20, categories: ["access-policy"] },
    { key: "content", label: "Content structure", weight: 20, categories: ["api", "agent-service"] },
    { key: "support", label: "Support and policies", weight: 10, categories: ["support"] },
    { key: "security", label: "Security and safety", weight: 15, categories: ["security"] }
  ],
  merchant: [
    { key: "discoverability", label: "Discoverability", weight: 20, categories: ["discoverability"] },
    { key: "access-policy", label: "Agent access policy", weight: 15, categories: ["access-policy"] },
    { key: "commerce", label: "Commerce readiness", weight: 25, categories: ["commerce"] },
    { key: "payment", label: "Payment and receipts", weight: 15, categories: ["payment"] },
    { key: "support", label: "Refund, support, and disputes", weight: 15, categories: ["support"] },
    { key: "security", label: "Security and safety", weight: 10, categories: ["security"] }
  ],
  api: [
    { key: "discoverability", label: "Discoverability", weight: 20, categories: ["discoverability"] },
    { key: "access-policy", label: "Agent access policy", weight: 10, categories: ["access-policy"] },
    { key: "api", label: "API readiness", weight: 30, categories: ["api"] },
    { key: "payment", label: "Payment and receipts", weight: 20, categories: ["payment"] },
    { key: "support", label: "Support and limits", weight: 10, categories: ["support"] },
    { key: "security", label: "Security and safety", weight: 10, categories: ["security"] }
  ],
  marketplace: [
    { key: "discoverability", label: "Discoverability", weight: 20, categories: ["discoverability"] },
    { key: "access-policy", label: "Agent access policy", weight: 15, categories: ["access-policy"] },
    { key: "commerce", label: "Marketplace readiness", weight: 25, categories: ["commerce", "agent-service"] },
    { key: "payment", label: "Payment and receipts", weight: 15, categories: ["payment"] },
    { key: "support", label: "Refund, support, and disputes", weight: 15, categories: ["support"] },
    { key: "security", label: "Security and safety", weight: 10, categories: ["security"] }
  ],
  "mcp-server": [
    { key: "discoverability", label: "Discoverability", weight: 15, categories: ["discoverability"] },
    { key: "mcp", label: "MCP readiness", weight: 35, categories: ["mcp"] },
    { key: "api", label: "API readiness", weight: 15, categories: ["api"] },
    { key: "payment", label: "Payment and receipts", weight: 10, categories: ["payment"] },
    { key: "support", label: "Support and limits", weight: 10, categories: ["support"] },
    { key: "security", label: "Security and safety", weight: 15, categories: ["security"] }
  ],
  "agent-service": [
    { key: "discoverability", label: "Discoverability", weight: 15, categories: ["discoverability"] },
    { key: "a2a", label: "A2A readiness", weight: 25, categories: ["a2a"] },
    { key: "agent-service", label: "Agent service readiness", weight: 20, categories: ["agent-service"] },
    { key: "payment", label: "Payment and receipts", weight: 15, categories: ["payment"] },
    { key: "support", label: "Refund, support, and disputes", weight: 10, categories: ["support"] },
    { key: "security", label: "Security and safety", weight: 15, categories: ["security"] }
  ]
};

export function summarize(findings: Finding[]): ScanSummary {
  return {
    critical: findings.filter((finding) => finding.status !== "pass" && finding.severity === "critical").length,
    major: findings.filter((finding) => finding.status !== "pass" && finding.severity === "major").length,
    minor: findings.filter((finding) => finding.status !== "pass" && finding.severity === "minor").length,
    info: findings.filter((finding) => finding.severity === "info" || finding.status === "info").length,
    pass: findings.filter((finding) => finding.status === "pass").length,
    fail: findings.filter((finding) => finding.status === "fail").length,
    warn: findings.filter((finding) => finding.status === "warn").length,
    unknown: findings.filter((finding) => finding.status === "unknown").length
  };
}

export function scoreFindings(profile: Profile, findings: Finding[]): { score: number; scores: ScoreSection[] } {
  const sections = profileWeights[profile];
  const scores = sections.map((section) => {
    const sectionFindings = findings.filter(
      (finding) =>
        section.categories.includes(finding.category) &&
        finding.status !== "info" &&
        finding.status !== "not_applicable"
    );
    if (sectionFindings.length === 0) {
      return { key: section.key, label: section.label, weight: section.weight, score: section.weight, applicableFindings: 0 };
    }
    const raw =
      sectionFindings.reduce((sum, finding) => sum + statusValue(finding.status), 0) / sectionFindings.length;
    return {
      key: section.key,
      label: section.label,
      weight: section.weight,
      score: Math.round(raw * section.weight),
      applicableFindings: sectionFindings.length
    };
  });
  return {
    score: Math.max(0, Math.min(100, scores.reduce((sum, section) => sum + section.score, 0))),
    scores
  };
}

function statusValue(status: Finding["status"]): number {
  switch (status) {
    case "pass":
      return 1;
    case "warn":
      return 0.5;
    case "unknown":
      return 0.25;
    case "fail":
      return 0;
    case "info":
    case "not_applicable":
      return 1;
  }
}
