/**
 * ZAP config for the security profile. Both values are optional overrides —
 * nobody needs to set these day-to-day.
 */

// Reuses entrypoint.sh's existing PROFILE convention (already set by CDP)
// rather than a ZAP-specific flag — Playwright's config has no visibility
// into --grep, so this can't be detected from the @security tag directly.
export const zapEnabled = process.env.PROFILE === 'security';

export const zapApiKey = process.env.ZAP_API_KEY || 'local-dev-key';
// ZAP's own documented example alternate port, clear of this workspace's
// service-port cluster (8085-8089).
export const zapPort = process.env.ZAP_PORT || '8090';
