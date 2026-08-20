import type { PlaywrightTestConfig } from '@playwright/test';
import { zapEnabled, zapPort } from '@config/zap';

// No-ops unless zapEnabled, so other profiles are unaffected. ZAP acts as a
// MITM proxy with its own certs, hence ignoreHTTPSErrors here (scoped to
// this config only) — see workareas/analysis/zap-playwright-flow.md for
// the full rationale.
//
// ZAP is always reachable via localhost — only the port varies; see
// config/zap.ts.
export function withZapProxy(config: PlaywrightTestConfig): PlaywrightTestConfig {
  if (!zapEnabled || !Array.isArray(config.projects)) return config;

  return {
    ...config,
    projects: config.projects.map((project) => ({
      ...project,
      use: {
        ...project.use,
        proxy: { server: `http://localhost:${zapPort}` },
        ignoreHTTPSErrors: true,
      },
    })),
  };
}
