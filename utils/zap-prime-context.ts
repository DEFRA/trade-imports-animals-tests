import { createZapClient, runAutomationPlan } from '@utils/zap-utils';
import { zapContextPlan } from '@config/zap';

// Registers ZAP's contexts (dataDrivenNodes, excludePaths) before the
// Playwright run generates any traffic — see zap-automation-context.yaml's
// header for why this has to happen first, not as part of the real scan
// plan run by zap-run-and-gate.ts afterwards.
async function main(): Promise<void> {
  const client = createZapClient();
  await runAutomationPlan(client, zapContextPlan);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
