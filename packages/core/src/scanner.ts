import type { Finding, Profile, Rule, ScanOptions, ScanResult } from "../../types/src/index.js";
import { agentReadyVersion } from "../../types/src/index.js";
import { normalizeOptions } from "./options.js";
import { inferProfile } from "./profile.js";
import { collectSnapshot } from "./snapshot.js";
import { scoreFindings, summarize } from "./score.js";

export async function runScan(options: ScanOptions, rules: Rule[]): Promise<ScanResult> {
  const normalizedOptions = normalizeOptions(options);
  const snapshot = await collectSnapshot(normalizedOptions);
  const profile: Profile =
    normalizedOptions.profile === "auto" ? inferProfile(snapshot) : normalizedOptions.profile;

  const selectedRules = rules.filter((rule) => {
    if (!rule.profiles.includes(profile)) return false;
    if (normalizedOptions.include.length > 0 && !normalizedOptions.include.some((item) => rule.id.includes(item) || rule.category === item)) {
      return false;
    }
    if (normalizedOptions.exclude.some((item) => rule.id.includes(item) || rule.category === item)) return false;
    return true;
  });

  const findings: Finding[] = [];
  for (const rule of selectedRules) {
    try {
      const finding = await rule.run({ profile, snapshot, options: normalizedOptions });
      findings.push({ ...finding, source: finding.source ?? rule.source });
    } catch (error) {
      findings.push({
        id: rule.id,
        title: rule.title,
        category: rule.category,
        severity: "major",
        status: "unknown",
        evidence: [{ message: `Rule failed: ${error instanceof Error ? error.message : String(error)}` }],
        recommendation: "Open an AgentReady issue with the target and command used so this rule can be fixed.",
        source: rule.source
      });
    }
  }

  const { score, scores } = scoreFindings(profile, findings);
  return {
    agentreadyVersion: agentReadyVersion,
    target: options.target,
    normalizedTarget: snapshot.normalizedTarget,
    profile,
    startedAt: snapshot.startedAt,
    completedAt: snapshot.completedAt,
    score,
    scores,
    summary: summarize(findings),
    findings,
    metadata: {
      fetchedUrls: snapshot.records.length,
      skippedByRobots: snapshot.skippedByRobots,
      userAgent: snapshot.userAgent,
      elapsedMs: snapshot.elapsedMs,
      active: normalizedOptions.active,
      browser: normalizedOptions.browser
    }
  };
}
