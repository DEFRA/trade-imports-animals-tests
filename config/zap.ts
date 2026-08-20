/**
 * ZAP config for the security profile. All values are optional overrides —
 * nobody needs to set these day-to-day.
 */

// Reuses entrypoint.sh's existing PROFILE convention (already set by CDP)
// rather than a ZAP-specific flag — Playwright's config has no visibility
// into --grep, so this can't be detected from the @security tag directly.
// Two profile values, not one: security (routine, no active scan) and
// security:active (deliberate only outside local).
export const zapEnabled = process.env.PROFILE === 'security' || process.env.PROFILE === 'security:active';

export const zapApiKey = process.env.ZAP_API_KEY || 'local-dev-key';
// ZAP's own documented example alternate port, clear of this workspace's
// service-port cluster (8085-8089).
export const zapPort = process.env.ZAP_PORT || '8090';

// Directory containing the two plan files — differs by environment: local
// ZAP runs in its own container with the plan files bind-mounted here;
// CDP's same-container sidecar reads them straight from the checked-out
// repo. entrypoint.sh overrides this for CDP; local uses the default.
const zapPlanDir = process.env.ZAP_PLAN_DIR || '/zap/plan';

// Filename picked by PROFILE, not set independently — one thing to keep in
// sync, not two. Fails safe: anything other than an explicit, exact
// 'security:active' gets the passive plan, not the reverse.
function zapAutomationPlanFile(): string {
  return process.env.PROFILE === 'security:active' ? 'zap-automation-active.yaml' : 'zap-automation-passive.yaml';
}

export const zapAutomationPlan = `${zapPlanDir}/${zapAutomationPlanFile()}`;
