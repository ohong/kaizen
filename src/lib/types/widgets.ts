export type WidgetSize = "small" | "medium" | "large" | "full";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  order: number;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export type WidgetType =
  | "errors-over-time"
  | "services-impacted"
  | "environment-spread"
  | "recent-errors"
  | "top-error-messages"
  | "pr-size-vs-time"
  | "review-responsiveness"
  | "pr-size-distribution"
  | "cycle-time-benchmark"
  | "quality-benchmark"
  | "benchmark-insights";

export interface WidgetDefinition {
  type: WidgetType;
  title: string;
  description: string;
  defaultSize: WidgetSize;
  category: "errors" | "workflow" | "benchmarks";
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
}

export const WIDGET_DEFINITIONS: Record<WidgetType, WidgetDefinition> = {
  "errors-over-time": {
    type: "errors-over-time",
    title: "Errors over time",
    description: "Trend of error events in the selected window",
    defaultSize: "medium",
    category: "errors",
  },
  "services-impacted": {
    type: "services-impacted",
    title: "Services impacted",
    description: "Service-level distribution of incidents",
    defaultSize: "medium",
    category: "errors",
  },
  "environment-spread": {
    type: "environment-spread",
    title: "Environment spread",
    description: "See which environment is generating noise",
    defaultSize: "medium",
    category: "errors",
  },
  "recent-errors": {
    type: "recent-errors",
    title: "Recent errors",
    description: "The latest events in this window",
    defaultSize: "medium",
    category: "errors",
  },
  "top-error-messages": {
    type: "top-error-messages",
    title: "Top error messages",
    description: "Most-frequent signatures for the selected range",
    defaultSize: "medium",
    category: "errors",
  },
  "pr-size-vs-time": {
    type: "pr-size-vs-time",
    title: "PR size vs merge time",
    description: "Look for outliers in merge time based on PR size",
    defaultSize: "medium",
    category: "workflow",
  },
  "review-responsiveness": {
    type: "review-responsiveness",
    title: "Review responsiveness",
    description: "Review latency vs merge time correlation",
    defaultSize: "medium",
    category: "workflow",
  },
  "pr-size-distribution": {
    type: "pr-size-distribution",
    title: "PR size distribution",
    description: "How work is split across small, medium, and large PRs",
    defaultSize: "medium",
    category: "workflow",
  },
  "cycle-time-benchmark": {
    type: "cycle-time-benchmark",
    title: "Cycle time vs industry",
    description: "Compare merge and review speed to industry medians",
    defaultSize: "large",
    category: "benchmarks",
  },
  "quality-benchmark": {
    type: "quality-benchmark",
    title: "Quality signals vs industry",
    description: "Stack quality indicators against benchmarks",
    defaultSize: "large",
    category: "benchmarks",
  },
  "benchmark-insights": {
    type: "benchmark-insights",
    title: "Benchmark insights",
    description: "Key callouts on where you lead or lag",
    defaultSize: "full",
    category: "benchmarks",
  },
};

export const DEFAULT_WIDGET_CONFIGS: WidgetConfig[] = [
  { id: "w1", type: "errors-over-time", title: "Errors over time", size: "medium", order: 1, enabled: true },
  { id: "w2", type: "services-impacted", title: "Services impacted", size: "medium", order: 2, enabled: true },
  { id: "w3", type: "environment-spread", title: "Environment spread", size: "medium", order: 3, enabled: true },
  { id: "w4", type: "recent-errors", title: "Recent errors", size: "medium", order: 4, enabled: true },
  { id: "w5", type: "top-error-messages", title: "Top error messages", size: "medium", order: 5, enabled: true },
  { id: "w6", type: "pr-size-vs-time", title: "PR size vs merge time", size: "medium", order: 6, enabled: true },
  { id: "w7", type: "review-responsiveness", title: "Review responsiveness", size: "medium", order: 7, enabled: true },
  { id: "w8", type: "pr-size-distribution", title: "PR size distribution", size: "medium", order: 8, enabled: true },
  { id: "w9", type: "cycle-time-benchmark", title: "Cycle time vs industry", size: "large", order: 9, enabled: true },
  { id: "w10", type: "quality-benchmark", title: "Quality signals vs industry", size: "large", order: 10, enabled: true },
  { id: "w11", type: "benchmark-insights", title: "Benchmark insights", size: "full", order: 11, enabled: true },
];
