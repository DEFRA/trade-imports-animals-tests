import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createZapClient, runAutomationPlan } from '@utils/zap-utils';

const pathFromHere = (relativePath: string): string => fileURLToPath(new URL(relativePath, import.meta.url));

// The plan file's path as ZAP (running in its own container) sees it, per
// the volume mount in zap/docker-compose.yml — not the host path where this
// script itself resolves it, since ZAP can't see the host filesystem.
const ZAP_AUTOMATION_PLAN = '/zap/plan/zap-automation.yaml';
const RULES_FILE = pathFromHere('../zap/rules.tsv');
// zap-report/ is bind-mounted into the ZAP container (see
// zap/docker-compose.yml) so ZAP's report job and this host-side read see
// the same files.
const REPORT_DIR = pathFromHere('../zap-report');
const REPORT_NAMES = [
  'animals-frontend-security-report',
  'animals-admin-security-report',
  'ins-frontend-security-report',
  'animals-backend-security-report',
];

type RuleAction = 'IGNORE' | 'WARN' | 'FAIL';

interface ZapAlert {
  pluginid: string;
  alert?: string;
  name?: string;
  riskcode: string;
  riskdesc?: string;
}

interface ZapReport {
  site?: Array<{ alerts?: ZapAlert[] }>;
}

// zap/rules.tsv — OWASP's own convention (from zap-baseline.py/
// zap-full-scan.py): <ruleId>\t<IGNORE|WARN|FAIL>\t(comment).
async function loadRules(): Promise<Map<string, RuleAction>> {
  const rules = new Map<string, RuleAction>();
  let content: string;
  try {
    content = await fs.readFile(RULES_FILE, 'utf8');
  } catch {
    return rules;
  }

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [ruleId, action] = trimmed.split('\t');
    if (ruleId && (action === 'IGNORE' || action === 'WARN' || action === 'FAIL')) {
      rules.set(ruleId.trim(), action);
    }
  }
  return rules;
}

function resolveAction(alert: ZapAlert, rules: Map<string, RuleAction>): RuleAction {
  const configured = rules.get(alert.pluginid);
  if (configured) return configured;
  // Unclassified High-risk (riskcode 3) defaults to FAIL, else WARN — High
  // is the least noisy risk tier, the safest bar for a new, unproven gate.
  // Escalate individual Medium findings via rules.tsv as they're triaged.
  return Number(alert.riskcode) === 3 ? 'FAIL' : 'WARN';
}

async function loadReportAlerts(reportName: string): Promise<ZapAlert[]> {
  const reportPath = path.join(REPORT_DIR, `${reportName}.json`);
  const content = await fs.readFile(reportPath, 'utf8');
  const report = JSON.parse(content) as ZapReport;
  return (report.site ?? []).flatMap((site) => site.alerts ?? []);
}

// Must match maxScanDurationInMins in zap-automation.yaml (all three
// activeScan jobs). A scan that finished at (or within a few seconds of)
// this ceiling almost certainly got cut off mid-way rather than completing
// naturally — an incomplete scan reporting "no findings" is a false clean,
// not a real one, so this is treated as a hard failure rather than a
// warning. If it fires for real, the fix is to raise the cap, not to
// ignore it.
const ACTIVE_SCAN_CAP_MINS = 90;
const TRUNCATION_TOLERANCE_MINS = 0.5;

function findTruncatedActiveScans(info: string[]): string[] {
  const pattern = /^Job activeScan finished, time taken: (\d+):(\d+):(\d+)$/;
  return info.filter((line) => {
    const match = pattern.exec(line);
    if (!match) return false;
    const [, hours, minutes, seconds] = match;
    const totalMins = Number(hours) * 60 + Number(minutes) + Number(seconds) / 60;
    return totalMins >= ACTIVE_SCAN_CAP_MINS - TRUNCATION_TOLERANCE_MINS;
  });
}

async function main(): Promise<void> {
  const client = createZapClient();
  const progress = await runAutomationPlan(client, ZAP_AUTOMATION_PLAN);

  const failures: string[] = [];

  const truncatedScans = findTruncatedActiveScans(progress.info);
  if (truncatedScans.length > 0) {
    failures.push(
      `Active scan hit its ${ACTIVE_SCAN_CAP_MINS}-minute cap and was likely cut short before covering everything — increase maxScanDurationInMins in zap-automation.yaml, don't treat this as a clean scan: ${truncatedScans.join('; ')}`,
    );
  }

  const rules = await loadRules();
  for (const reportName of REPORT_NAMES) {
    const alerts = await loadReportAlerts(reportName);
    for (const alert of alerts) {
      if (resolveAction(alert, rules) === 'FAIL') {
        const description = alert.alert ?? alert.name ?? 'unknown alert';
        failures.push(`[${reportName}] ${alert.pluginid} ${description} (${alert.riskdesc ?? alert.riskcode})`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`ZAP security scan found ${failures.length} failure(s):\n${failures.join('\n')}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
