import type { PlaywrightTestConfig } from '@playwright/test';

/**
 * Returns a config with per-project baseURLs overridden from a lookup map.
 */
export function withProjectBaseUrls(
  baseConfig: PlaywrightTestConfig,
  projectBaseUrls: Record<string, string>,
  context: string,
): PlaywrightTestConfig {
  if (!Array.isArray(baseConfig.projects)) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    projects: baseConfig.projects.map((project) => {
      const baseURL = projectBaseUrls[project.name];
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
