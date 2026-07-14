import type { Notification } from '@domain/models/api/notification';
import type { PageDataContext } from '@domain/builders/page-data-context';
import { journeyPages, pageContributions, type JourneyPage } from '@domain/builders/page-order';

export type DeepPartial<T> = T extends (infer U)[] ? DeepPartial<U>[] : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export type NotificationOverrides = DeepPartial<Notification>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Objects merge recursively; arrays and primitives replace wholesale. */
function deepMerge<T>(target: T, overrides: DeepPartial<T>): T {
  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
    const current = result[key];
    result[key] = isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value;
  }
  return result as T;
}

export function buildNotificationThroughPage(
  throughPage: JourneyPage,
  ctx: PageDataContext,
  overrides?: NotificationOverrides,
): Notification {
  const draft: Notification = {};
  for (const page of journeyPages) {
    pageContributions[page](draft, ctx);
    if (page === throughPage) {
      break;
    }
  }
  return overrides ? deepMerge(draft, overrides) : draft;
}
