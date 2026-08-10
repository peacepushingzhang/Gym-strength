import type { BodyMetric } from "./types";

export interface BodyMetricWithChange extends BodyMetric {
  weightChange?: number;
  bodyFatChange?: number;
}

export const getBodyMetricHistory = (metrics: BodyMetric[]): BodyMetricWithChange[] => {
  const ascending = [...metrics].sort((a, b) => a.date.localeCompare(b.date));

  return ascending
    .map((metric, index) => {
      const previous = ascending[index - 1];
      return {
        ...metric,
        weightChange: previous ? metric.weight - previous.weight : undefined,
        bodyFatChange: previous ? metric.bodyFat - previous.bodyFat : undefined,
      };
    })
    .reverse();
};
