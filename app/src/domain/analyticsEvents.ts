import type { AnalyticsEvent } from "./types";

export type AnalyticsEventExport = {
  schema: "clarity.reporting-metrics-rebuilder.v0";
  exportedAt: string;
  events: AnalyticsEvent[];
};

export function createAnalyticsEvent(
  event: Omit<AnalyticsEvent, "id" | "source" | "occurredAt" | "organizationToken">,
): AnalyticsEvent {
  return {
    id: `analytics-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: "clarity-v0.1",
    occurredAt: new Date().toISOString(),
    organizationToken: "demo-org",
    ...event,
  };
}

export function exportAnalyticsEvents(events: AnalyticsEvent[]): AnalyticsEventExport {
  return {
    schema: "clarity.reporting-metrics-rebuilder.v0",
    exportedAt: new Date().toISOString(),
    events,
  };
}
