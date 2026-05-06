const CDP_DOMAIN = 'cdp-int.defra.cloud';

function getEnvironment(): string | undefined {
  return process.env.ENVIRONMENT ?? process.env.PLAYWRIGHT_ENVIRONMENT;
}

export function getServiceBaseUrl(service: string, localPort: number): string {
  const environment = getEnvironment();
  if (!environment || environment.toLowerCase() === 'local') {
    return `http://localhost:${localPort}`;
  }
  return `https://${service}.${environment}.${CDP_DOMAIN}`;
}
