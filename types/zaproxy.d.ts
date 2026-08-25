// zaproxy ships no TypeScript types (plain JS client — github.com/zaproxy/zap-api-nodejs).
// Minimal ambient declaration covering only the surface this repo uses.
declare module 'zaproxy' {
  export interface ZapClientOptions {
    apiKey?: string;
    proxy: { host: string; port: number };
  }

  // Flat response, not nested — and `finished` is an ISO timestamp string
  // once the plan completes, empty string ('') while still running.
  export interface ZapPlanProgress {
    planId: number;
    started: string;
    finished: string;
    error: string[];
    warn: string[];
    info: string[];
  }

  export default class ZAPClient {
    constructor(options: ZapClientOptions);
    automation: {
      runPlan(args: { filepath: string }): Promise<{ planId: string }>;
      planProgress(args: { planid: string }): Promise<ZapPlanProgress>;
    };
  }
}
