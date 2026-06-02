import type { PlaywrightTestConfig } from '@playwright/test';

const PROJECT_ENV_VARS: Record<string, string> = {
  'frontend-chromium': 'TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL',
  'admin-chromium': 'TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL',
};

/**
 * Sets TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL and TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL
 * so tests can navigate cross-service using absolute URLs.
 */
export function applyProjectBaseUrlEnvVars(projectBaseUrls: Record<string, string>): void {
  for (const [projectName, baseURL] of Object.entries(projectBaseUrls)) {
    const envVar = PROJECT_ENV_VARS[projectName];
    if (envVar) {
      process.env[envVar] = baseURL;
    }
  }
}

/**
 * Returns a config with per-project baseURLs overridden from a lookup map.
 * Also sets TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL and TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL
 * environment variables so tests can navigate cross-service using absolute URLs.
 */
export function withProjectBaseUrls(
  baseConfig: PlaywrightTestConfig,
  projectBaseUrls: Record<string, string>,
  context: string,
): PlaywrightTestConfig {
  if (!Array.isArray(baseConfig.projects)) {
    return baseConfig;
  }

  applyProjectBaseUrlEnvVars(projectBaseUrls);

  return {
    ...baseConfig,
    projects: baseConfig.projects.map((project) => {
      const baseURL = project.name !== undefined ? projectBaseUrls[project.name] : undefined;
      if (!baseURL) {
        throw new Error(`No ${context} baseURL configured for project: ${project.name}`);
      }

      return {
        ...project,
        use: {
          ...project.use,
          baseURL,
        },
      };
    }),
  };
}
